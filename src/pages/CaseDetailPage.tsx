import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FolderOpen,
  FileText,
  MessageSquare,
  Clock,
  Download,
  Share2,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { MetricTooltip } from "@/components/DataProvenance";
import { CaseVisualTimeline } from "@/components/case/CaseVisualTimeline";
import {
  useCase,
  useUpdateCase,
  useCaseItems,
  useAddCaseItem,
  useRemoveCaseItem,
  useCaseNotes,
  useAddCaseNote,
  useDeleteCaseNote,
  useCaseTimeline,
  useReportJobs,
  useGenerateReport,
  useEnableShare,
  useDisableShare,
} from "@/hooks/useCases";
import type { CaseItemType, CasePriority, CaseStatus } from "@/lib/case.types";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-primary/15 text-primary border-primary/30",
  triaged: "bg-warning/15 text-warning border-warning/30",
  closed: "bg-muted text-muted-foreground border-border",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-danger/15 text-danger border-danger/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-primary/15 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
};

const ITEM_TYPE_ICONS: Record<string, string> = {
  wallet: "👛",
  token: "🪙",
  tx: "📝",
  cluster: "🔗",
  alert: "🚨",
  note: "📌",
  snapshot: "📸",
};

// ---------- Sub-components ----------

function EvidenceTab({ caseId }: { caseId: string }) {
  const { t } = useI18n();
  const { data: items, isLoading } = useCaseItems(caseId);
  const addItem = useAddCaseItem();
  const removeItem = useRemoveCaseItem();
  const [addOpen, setAddOpen] = useState(false);
  const [newType, setNewType] = useState<CaseItemType>("wallet");
  const [newRef, setNewRef] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = async () => {
    if (!newRef.trim()) return;
    try {
      await addItem.mutateAsync({
        case_id: caseId,
        item_type: newType,
        ref: newRef.trim(),
        title: newTitle.trim() || undefined,
      });
      setAddOpen(false);
      setNewRef("");
      setNewTitle("");
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {(items ?? []).length} {t('case.evidenceItems')}
        </span>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1 text-xs">
              <Plus className="w-3.5 h-3.5" /> {t('case.addEvidence')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('case.addEvidence')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Select value={newType} onValueChange={(v) => setNewType(v as CaseItemType)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">{t('case.walletAddress')}</SelectItem>
                  <SelectItem value="token">{t('case.tokenContract')}</SelectItem>
                  <SelectItem value="tx">{t('case.transactionHash')}</SelectItem>
                  <SelectItem value="cluster">{t('case.clusterId')}</SelectItem>
                  <SelectItem value="alert">{t('case.alertId')}</SelectItem>
                  <SelectItem value="snapshot">{t('case.snapshotNote')}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder={newType === "wallet" || newType === "token" ? "0x..." : newType === "tx" ? "0x... (64 chars)" : "Reference"}
                value={newRef}
                onChange={(e) => setNewRef(e.target.value)}
                className="text-xs font-mono"
              />
              <Input
                placeholder={t('case.labelOptional')}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-xs"
              />
              <Button onClick={handleAdd} disabled={!newRef.trim() || addItem.isPending} className="w-full text-xs">
                {addItem.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                {t('case.addToCase')}
              </Button>
              {addItem.isError && (
                <p className="text-xs text-danger">{(addItem.error as Error)?.message}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(items ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">{t('case.noEvidence')}</p>
      ) : (
        <div className="space-y-1.5">
          {(items ?? []).map((item) => (
            <div key={item.id} className="gradient-card rounded-lg p-3 flex items-center gap-2.5">
              <span className="text-lg">{ITEM_TYPE_ICONS[item.item_type] ?? "📎"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[8px] px-1">{item.item_type}</Badge>
                  {item.title && <span className="text-xs font-medium truncate">{item.title}</span>}
                </div>
                <p className="text-[10px] font-mono text-muted-foreground truncate">{item.ref}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-7 w-7 p-0 text-muted-foreground hover:text-danger"
                onClick={() => removeItem.mutate({ item_id: item.id, case_id: caseId })}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineTab({ caseId }: { caseId: string }) {
  const { data: timeline, isLoading } = useCaseTimeline(caseId);
  return <CaseVisualTimeline timeline={timeline ?? []} isLoading={isLoading} />;
}

function NotesTab({ caseId }: { caseId: string }) {
  const { t } = useI18n();
  const { data: notes, isLoading } = useCaseNotes(caseId);
  const addNote = useAddCaseNote();
  const deleteNote = useDeleteCaseNote();
  const [newNote, setNewNote] = useState("");

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    await addNote.mutateAsync({ case_id: caseId, body: newNote.trim() });
    setNewNote("");
  };

  if (isLoading) return <Skeleton className="h-40" />;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Textarea
          placeholder={t('case.addNote')}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={2}
          maxLength={5000}
          className="text-xs"
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!newNote.trim() || addNote.isPending}
          className="shrink-0"
        >
          {addNote.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {(notes ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">{t('case.noNotes')}</p>
      ) : (
        <div className="space-y-2">
          {(notes ?? []).map((note) => (
            <div key={note.id} className="gradient-card rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs whitespace-pre-wrap flex-1">{note.body}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-6 w-6 p-0 text-muted-foreground hover:text-danger"
                  onClick={() => deleteNote.mutate({ note_id: note.id, case_id: caseId })}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsTab({ caseId }: { caseId: string }) {
  const { t } = useI18n();
  const { data: jobs, isLoading } = useReportJobs(caseId);
  const generate = useGenerateReport();
  const enableShare = useEnableShare();
  const disableShare = useDisableShare();
  const { toast } = useToast();
  const [shareLink, setShareLink] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      await generate.mutateAsync(caseId);
      toast({ title: t('case.reportGenerated'), description: t('case.reportReady') });
    } catch (err) {
      toast({ title: t('case.reportFailed'), description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleShare = async () => {
    try {
      const link = await enableShare.mutateAsync(caseId);
      const url = `${window.location.origin}/shared-case/${link.public_token}`;
      setShareLink(url);
      navigator.clipboard.writeText(url);
      toast({ title: t('case.linkCopied'), description: t('case.linkActive') });
    } catch {
      toast({ title: "Failed to create share link", variant: "destructive" });
    }
  };

  if (isLoading) return <Skeleton className="h-32" />;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={generate.isPending}
          className="gap-1.5 text-xs"
        >
          {generate.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          {t('case.generateReport')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleShare}
          disabled={enableShare.isPending}
          className="gap-1.5 text-xs"
        >
          <Share2 className="w-3.5 h-3.5" /> {t('case.shareLink')}
        </Button>
      </div>

      {shareLink && (
        <div className="gradient-card rounded-lg p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-success shrink-0" />
          <p className="text-xs font-mono truncate flex-1">{shareLink}</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => {
              navigator.clipboard.writeText(shareLink);
              toast({ title: "Copied!" });
            }}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Jobs list */}
      {(jobs ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">{t('case.noReports')}</p>
      ) : (
        <div className="space-y-2">
          {(jobs ?? []).map((job) => (
            <div key={job.id} className="gradient-card rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <Badge
                  variant="outline"
                  className={`text-[9px] ${
                    job.status === "done" ? "bg-success/15 text-success border-success/30" :
                    job.status === "failed" ? "bg-danger/15 text-danger border-danger/30" :
                    "bg-warning/15 text-warning border-warning/30"
                  }`}
                >
                  {job.status.toUpperCase()}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(job.created_at).toLocaleString()}
                </span>
              </div>
              {job.status === "done" && (
                <div className="flex gap-2 mt-2">
                  {job.output_url && (
                    <a href={job.output_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-7">
                        <Download className="w-3 h-3" /> Report
                      </Button>
                    </a>
                  )}
                  {job.output_json_url && (
                    <a href={job.output_json_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-7">
                        <Download className="w-3 h-3" /> JSON
                      </Button>
                    </a>
                  )}
                </div>
              )}
              {job.status === "failed" && job.error_message && (
                <p className="text-xs text-danger mt-1">{job.error_message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Main ----------

export default function CaseDetailPage() {
  const { id: caseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { data: caseData, isLoading } = useCase(caseId ?? "");
  const updateCase = useUpdateCase();

  if (!caseId) return null;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-6 text-center">
        <AlertTriangle className="w-8 h-8 text-danger mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{t('case.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => navigate("/cases")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <FolderOpen className="w-4 h-4 text-primary" />
          <h1 className="text-base font-display font-bold tracking-tight truncate flex-1">
            {caseData.title}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MetricTooltip labelKey="caseStatus">
            <Select
              value={caseData.status}
              onValueChange={(v) => updateCase.mutate({ case_id: caseId, status: v as CaseStatus })}
            >
              <SelectTrigger className="w-24 h-7 text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">{t('case.open')}</SelectItem>
                <SelectItem value="triaged">{t('case.triaged')}</SelectItem>
                <SelectItem value="closed">{t('case.closed')}</SelectItem>
              </SelectContent>
            </Select>
          </MetricTooltip>
          <MetricTooltip labelKey="casePriority">
            <Select
              value={caseData.priority}
              onValueChange={(v) => updateCase.mutate({ case_id: caseId, priority: v as CasePriority })}
            >
              <SelectTrigger className="w-24 h-7 text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('case.low')}</SelectItem>
                <SelectItem value="medium">{t('case.medium')}</SelectItem>
                <SelectItem value="high">{t('case.high')}</SelectItem>
                <SelectItem value="critical">{t('case.critical')}</SelectItem>
              </SelectContent>
            </Select>
          </MetricTooltip>
          <Badge variant="outline" className="text-[9px]">{caseData.chain}</Badge>
        </div>
        {caseData.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{caseData.description}</p>
        )}
      </header>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <Tabs defaultValue="evidence" className="space-y-4">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="evidence" className="text-xs gap-1">
              <FileText className="w-3.5 h-3.5" /> {t('case.evidence')}
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs gap-1">
              <Clock className="w-3.5 h-3.5" /> {t('case.timeline')}
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> {t('case.notes')}
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs gap-1">
              <Download className="w-3.5 h-3.5" /> {t('case.reports')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="evidence">
            <EvidenceTab caseId={caseId} />
          </TabsContent>
          <TabsContent value="timeline">
            <TimelineTab caseId={caseId} />
          </TabsContent>
          <TabsContent value="notes">
            <NotesTab caseId={caseId} />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsTab caseId={caseId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
