import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalyzeRequest {
  action?: "transcribe";
  audio?: string;
  contextType?: "wallet" | "token" | "case" | "alert";
  chain?: string;
  ref?: string;
  prompt?: string;
  dataSnapshots?: Record<string, unknown>;
}

const SYSTEM_PROMPT = `You are Oracle Intel AI, an expert blockchain intelligence analyst specializing in on-chain investigation for the Cronos ecosystem.

RULES:
- Be evidence-based: always reference concrete data fields, tx hashes, addresses, and metrics from the provided snapshots.
- Use probabilistic language for risk signals: "likely", "suggests", "indicates", "consistent with" — never absolute claims.
- Never fabricate data. If data is missing, say so.
- Structure your response with:
  1. **Summary** — 2-3 sentence overview
  2. **Key Evidence** — bullet points with specific data references
  3. **Risk Signals** — any concerning patterns with confidence level (low/medium/high)
  4. **Recommended Actions** — concrete next steps (add to watchlist, create alert rule, investigate cluster, open case)
- Keep responses concise (under 400 words).
- Format using markdown.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AnalyzeRequest = await req.json();

    // === Transcription mode ===
    if (body.action === "transcribe" && body.audio) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: "AI not configured." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Use Gemini multimodal to transcribe audio
      const transcribeResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Transcribe the following audio exactly. Return ONLY the transcribed text, nothing else. If the audio is in French, return it in the original language." },
                {
                  type: "input_audio",
                  input_audio: { data: body.audio, format: "webm" },
                },
              ],
            },
          ],
        }),
      });

      if (!transcribeResp.ok) {
        const errText = await transcribeResp.text();
        console.error("Transcription error:", transcribeResp.status, errText);
        return new Response(
          JSON.stringify({ error: "Transcription failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const transcribeData = await transcribeResp.json();
      const text = transcribeData.choices?.[0]?.message?.content || "";
      return new Response(
        JSON.stringify({ text }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === Analysis mode ===
    const { contextType, chain, ref, prompt, dataSnapshots } = body;

    if (!contextType || !ref || !prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: contextType, ref, prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured. LOVABLE_API_KEY is missing." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userMessage = `Context: Analyzing ${contextType} on ${chain || "cronos"}
Reference: ${ref}
User question: ${prompt}

Data snapshot:
${JSON.stringify(dataSnapshots, null, 2)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-analyze error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
