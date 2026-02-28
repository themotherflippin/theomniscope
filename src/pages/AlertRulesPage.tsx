import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings, Shield, Trash2, Plus, Loader2, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useAlertRules, useCreateAlertRule, useDeleteAlertRule, useUpdateAlertRule,
  type AlertRule, type CreateAlertRuleInput,
} from "@/hooks/useAlertRules";
import { toast } from "@/hooks/use-toast";

const ruleTypeLabels: Record<string, string> = {
  large_transfer: "Large Transfer",
  lp_remove: "LP Removal",
  fresh_wallet: "Fresh Wallet",
  concentration_spike: "Concentration Spike",
  loop_suspicion: "Loop Suspicion",
};

const severityColors: Record<string, string> = {
  critical: "bg-danger/10 text-danger border-danger/20",
  high: "bg-warning/10 text-warning border-warning/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-secondary/50 text-muted-foreground border-border/30",
};

export default function AlertRulesPage() {
  const { data: rules, isLoading } = useAlertRules();
  const createMutation = useCreateAlertRule();
  const deleteMutation = useDeleteAlertRule();
  const updateMutation = useUpdateAlertRule();
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"wallet" | "token" | "global">("wallet");
  const [ruleType, setRuleType] = useState<AlertRule["rule_type"]>("large_transfer");
  const [severity, setSeverity] = useState<AlertRule["severity"]>("medium");
  const [subject, setSubject] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    try {
      const input: CreateAlertRuleInput = {
        name: name.trim(),
        scope,
        rule_type: ruleType,
        severity,
        ...(subject.trim() ? { subject: subject.trim() } : {}),
      };
      await createMutation.mutateAsync(input);
      setShowAdd(false);
      setName("");
      setSubject("");
      toast({ title: "Rule created" });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="sticky top-0 z-40 glass-strong border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <h1 className="text-base font-display font-bold tracking-tight">Alert Rules</h1>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 h-8 text-xs">
            <Plus className="w-3.5 h-3.5" /> New Rule
          </Button>
        </div>
      </header>

      <main className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : !rules?.length ? (
          <div className="text-center py-20">
            <Shield className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No alert rules configured</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule, i) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 p-3 rounded-xl gradient-card border border-border/50"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${severityColors[rule.severity]}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">{rule.name}</span>
                    <Badge variant="outline" className="text-[8px]">{rule.scope}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {ruleTypeLabels[rule.rule_type] ?? rule.rule_type} · {rule.chain}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateMutation.mutate({ id: rule.id, is_enabled: !rule.is_enabled })}
                  >
                    {rule.is_enabled ? (
                      <ToggleRight className="w-4 h-4 text-success" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-danger hover:text-danger"
                    onClick={() => {
                      if (confirm("Delete this rule?")) deleteMutation.mutate(rule.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Alert Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Whale Alerts" className="text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Scope</label>
                <Select value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
                  <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="token">Token</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Severity</label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
                  <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Rule Type</label>
              <Select value={ruleType} onValueChange={(v) => setRuleType(v as typeof ruleType)}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="large_transfer">Large Transfer</SelectItem>
                  <SelectItem value="fresh_wallet">Fresh Wallet</SelectItem>
                  <SelectItem value="concentration_spike">Concentration Spike</SelectItem>
                  <SelectItem value="loop_suspicion">Loop Suspicion</SelectItem>
                  <SelectItem value="lp_remove">LP Removal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Subject Address (optional)</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="0x... (leave empty for all)" className="text-xs font-mono" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="gap-1.5">
              {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
