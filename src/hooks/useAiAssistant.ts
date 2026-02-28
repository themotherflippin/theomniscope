import { useState, useCallback } from "react";

interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

interface AiContext {
  contextType: "wallet" | "token" | "case" | "alert" | "general";
  chain?: string;
  ref?: string;
  dataSnapshots?: Record<string, unknown>;
}

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-analyze`;

export function useAiAssistant() {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (prompt: string, context: AiContext) => {
      setError(null);
      const userMsg: AiMessage = { role: "user", content: prompt };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      let assistantSoFar = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      try {
        const resp = await fetch(AI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            contextType: context.contextType,
            chain: context.chain ?? "cronos",
            ref: context.ref ?? "",
            prompt,
            dataSnapshots: context.dataSnapshots ?? {},
          }),
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => null);
          const msg =
            resp.status === 429
              ? "Rate limit exceeded. Please wait a moment."
              : resp.status === 402
                ? "AI credits exhausted. Add credits in Settings."
                : data?.error ?? "AI service error";
          setError(msg);
          setIsLoading(false);
          return;
        }

        if (!resp.body) {
          setError("No response stream");
          setIsLoading(false);
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const parsed = JSON.parse(json);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsert(content);
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, send, clear };
}
