"use client";

import { Check, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AgentApprovalQueue from "./AgentApprovalQueue";
import AgentComposer from "./AgentComposer";
import AgentPlan from "./AgentPlan";
import AgentQuickPrompts from "./AgentQuickPrompts";
import AgentRunHistoryMini from "./AgentRunHistoryMini";
import AgentRunStatus from "./AgentRunStatus";
import AgentTimeline from "./AgentTimeline";
import FileChangePreview from "./FileChangePreview";
import DiffViewer from "@/components/Diff/DiffViewer";
import { addAgentHistory, loadAgentHistory, type AgentHistoryEntry } from "@/lib/agent/agentHistory";
import { applyAgentPatch } from "@/lib/agent/applyPatch";
import type {
  AgentChangeValidation,
  AgentConfidenceScore,
  AgentProvider,
  AgentPlan as AgentPlanType,
  AgentReviewFinding,
  AgentRunPhase,
  AgentRunResult,
  AgentTaskPlan
} from "@/lib/agent/types";
import { saveProjectSnapshot } from "@/lib/projects/projectSnapshots";
import useStore from "@/store/useStore";

export default function AgentPanel() {
  const files = useStore((state) => state.files);
  const activeFile = useStore((state) => state.activeFile);
  const setFiles = useStore((state) => state.setFiles);
  const toggleAgent = useStore((state) => state.toggleAgent);

  const [task, setTask] = useState("");
  const [plan, setPlan] = useState<AgentPlanType | null>(null);
  const [taskPlan, setTaskPlan] = useState<AgentTaskPlan | null>(null);
  const [validation, setValidation] = useState<AgentChangeValidation | null>(null);
  const [review, setReview] = useState<AgentReviewFinding[]>([]);
  const [confidence, setConfidence] = useState<AgentConfidenceScore | null>(null);
  const [providerMode, setProviderMode] = useState<"auto" | AgentProvider>("auto");
  const [providerUsed, setProviderUsed] = useState<AgentProvider | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [phase, setPhase] = useState<AgentRunPhase>("idle");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [recentHistory, setRecentHistory] = useState<AgentHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedChanges = useMemo(() => {
    if (!plan) return [];
    return plan.changes.filter((change) => selectedIds.includes(change.id));
  }, [plan, selectedIds]);

  useEffect(() => {
    setRecentHistory(loadAgentHistory().slice(0, 4));
  }, []);

  const recordHistory = (entry: Omit<AgentHistoryEntry, "id" | "createdAt">) => {
    addAgentHistory(entry);
    setRecentHistory(loadAgentHistory().slice(0, 4));
  };

  const runCodingAgent = async () => {
    const cleanTask = task.trim();
    const startedAt = Date.now();

    if (!cleanTask) {
      setError("Task likho pehle.");
      return;
    }

    setIsLoading(true);
    setPhase("planning");
    setError("");
    setConfidence(null);
    setProviderUsed(null);
    setNotes([]);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          task: cleanTask,
          files,
          activeFileId: activeFile?.id || null,
          provider: providerMode
        })
      });

      const data = (await response.json()) as AgentRunResult & { error?: string };

      if (!response.ok) {
        setError(data.error || "Agent failed.");
        setPhase("error");
        recordHistory({
          prompt: cleanTask,
          summary: data.error || "Agent failed before producing a plan.",
          status: "failed",
          filesChanged: [],
          durationMs: Date.now() - startedAt
        });
        return;
      }

      setPlan(data.plan);
      setTaskPlan(data.taskPlan || null);
      setValidation(data.validation || null);
      setReview(data.review || []);
      setConfidence(data.confidence || null);
      setProviderUsed(data.provider || null);
      setNotes(data.notes || []);
      setSelectedIds(data.plan.changes.map((change: { id: string }) => change.id));
      setPhase(data.validation?.rejectedChanges?.length ? "repaired" : "ready");
      recordHistory({
        prompt: cleanTask,
        summary: `${data.plan.changes.length} proposed change(s) from ${
          data.provider === "local" ? "free local" : "OpenAI"
        } agent.`,
        status: "planned",
        filesChanged: data.plan.changes.map((change) => change.path),
        durationMs: Date.now() - startedAt
      });
    } catch {
      setError("Agent API not responding. Check /api/agent and OPENAI_API_KEY.");
      setPhase("error");
      recordHistory({
        prompt: cleanTask,
        summary: "Agent API did not respond.",
        status: "failed",
        filesChanged: [],
        durationMs: Date.now() - startedAt
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChange = (changeId: string) => {
    setSelectedIds((current) =>
      current.includes(changeId)
        ? current.filter((id) => id !== changeId)
        : [...current, changeId]
    );
  };

  const selectAllChanges = () => {
    if (!plan) return;
    setSelectedIds(plan.changes.map((change) => change.id));
  };

  const clearSelectedChanges = () => {
    setSelectedIds([]);
  };

  const applySelectedChanges = () => {
    if (!plan || selectedChanges.length === 0) {
      setError("Apply ke liye koi file selected nahi hai.");
      return;
    }

    const startedAt = Date.now();
    saveProjectSnapshot(files, `Before agent apply: ${plan.title}`, "manual");
    const result = applyAgentPatch(files, selectedChanges);

    setPhase("applying");
    setFiles(result.files);
    recordHistory({
      prompt: task.trim() || plan.title,
      summary: `${result.applied.length} selected change(s) applied. Snapshot saved before apply.`,
      status: "applied",
      filesChanged: result.applied.map((change) => change.path),
      durationMs: Date.now() - startedAt
    });
    setPlan(null);
    setTaskPlan(null);
    setValidation(null);
    setReview([]);
    setConfidence(null);
    setProviderUsed(null);
    setNotes([]);
    setSelectedIds([]);
    setTask("");
    setPhase("idle");

    if (result.skipped.length > 0) {
      setError(
        `${result.applied.length} applied, ${result.skipped.length} skipped.`
      );
    }
  };

  return (
    <aside className="w-[430px] h-full panel-bg border-l app-border flex flex-col">
      <div className="h-10 border-b app-border flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={17} className="text-cyan-400" />
          <span className="text-sm font-semibold">Coding Agent</span>
        </div>

        <button onClick={toggleAgent} className="p-1 app-hover rounded">
          <X size={16} />
        </button>
      </div>

      <AgentComposer
        task={task}
        isLoading={isLoading}
        provider={providerMode}
        onTaskChange={setTask}
        onProviderChange={setProviderMode}
        onRun={runCodingAgent}
      />

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {error && (
          <div className="rounded border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-200">
            {error}
          </div>
        )}

        <AgentRunStatus
          phase={phase}
          taskPlan={taskPlan}
          validation={validation}
          review={review}
          confidence={confidence}
          provider={providerUsed}
          notes={notes}
        />

        <AgentTimeline taskPlan={taskPlan} plan={plan} />

        {!plan ? (
          <>
            <AgentQuickPrompts onSelect={setTask} />

            <AgentRunHistoryMini items={recentHistory} />

            <div className="rounded-lg border app-border app-bg p-4 text-sm app-muted">
              Cursor ko beat karne wala flow yahan hai: task do, agent plan banayega,
              file changes preview honge, phir aap selected changes apply karoge.
            </div>
          </>
        ) : (
          <>
            <AgentPlan plan={plan} />

            <AgentApprovalQueue
              total={plan.changes.length}
              selected={selectedIds.length}
              onSelectAll={selectAllChanges}
              onClear={clearSelectedChanges}
            />

            <FileChangePreview
              changes={plan.changes}
              selectedIds={selectedIds}
              onToggle={toggleChange}
            />

            <DiffViewer files={files} changes={selectedChanges} />
          </>
        )}
      </div>

      {plan && (
        <div className="p-3 border-t app-border shrink-0">
          <button
            onClick={applySelectedChanges}
            disabled={selectedChanges.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md py-2 text-sm font-medium"
          >
            <Check size={15} />
            Apply Selected Changes
          </button>
        </div>
      )}
    </aside>
  );
}
