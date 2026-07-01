"use client";

import { AlertTriangle, CheckCircle2, FileSearch, ShieldCheck } from "lucide-react";
import type {
  AgentChangeValidation,
  AgentConfidenceScore,
  AgentReviewFinding,
  AgentRunPhase,
  AgentTaskPlan
} from "@/lib/agent/types";

function phaseLabel(phase: AgentRunPhase) {
  if (phase === "planning") return "Planning";
  if (phase === "validating") return "Validating";
  if (phase === "ready") return "Ready";
  if (phase === "applying") return "Applying";
  if (phase === "repaired") return "Safe subset";
  if (phase === "error") return "Needs attention";
  return "Idle";
}

export default function AgentRunStatus({
  phase,
  taskPlan,
  validation,
  review,
  confidence,
  provider,
  notes
}: {
  phase: AgentRunPhase;
  taskPlan: AgentTaskPlan | null;
  validation: AgentChangeValidation | null;
  review: AgentReviewFinding[];
  confidence: AgentConfidenceScore | null;
  provider: "local" | "openai" | null;
  notes: string[];
}) {
  const hasIssues = Boolean(validation?.issues.length || review.length);

  return (
    <div className="rounded-lg border app-border app-bg p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck size={14} className="text-cyan-400" />
          {phaseLabel(phase)}
        </div>

        {validation?.ok ? (
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle2 size={13} />
            Safe
          </span>
        ) : hasIssues ? (
          <span className="flex items-center gap-1 text-yellow-400">
            <AlertTriangle size={13} />
            Review
          </span>
        ) : null}
      </div>

      {taskPlan && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded border app-border p-2">
            <div className="app-muted">Intent</div>
            <div className="mt-1 font-medium">{taskPlan.intent}</div>
          </div>
          <div className="rounded border app-border p-2">
            <div className="app-muted">Risk</div>
            <div className="mt-1 font-medium">{taskPlan.riskLevel}</div>
          </div>
          <div className="rounded border app-border p-2">
            <div className="app-muted">Targets</div>
            <div className="mt-1 font-medium">{taskPlan.targetFiles.length}</div>
          </div>
        </div>
      )}

      {confidence && (
        <div className="mt-3 rounded border app-border p-2">
          <div className="flex items-center justify-between">
            <span className="app-muted">Confidence</span>
            <span
              className={
                confidence.label === "high"
                  ? "text-green-400"
                  : confidence.label === "medium"
                    ? "text-yellow-400"
                    : "text-red-300"
              }
            >
              {confidence.score}% {confidence.label}
            </span>
          </div>
          <div className="mt-1 app-muted">{confidence.reasons.join(" ")}</div>
        </div>
      )}

      {(provider || notes.length > 0) && (
        <div className="mt-3 rounded border app-border p-2">
          {provider && (
            <div className="flex items-center justify-between">
              <span className="app-muted">Provider</span>
              <span className={provider === "local" ? "text-green-400" : "text-blue-400"}>
                {provider === "local" ? "Free local" : "OpenAI"}
              </span>
            </div>
          )}

          {notes.length > 0 && (
            <div className="mt-1 app-muted">
              {notes.slice(0, 3).join(" ")}
            </div>
          )}
        </div>
      )}

      {taskPlan && taskPlan.targetFiles.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-2 font-semibold">
            <FileSearch size={13} className="text-blue-400" />
            Relevant files
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {taskPlan.targetFiles.slice(0, 8).map((path) => (
              <span key={path} className="rounded bg-white/5 px-2 py-1 app-muted">
                {path}
              </span>
            ))}
          </div>
        </div>
      )}

      {validation && validation.issues.length > 0 && (
        <div className="mt-3 space-y-1">
          {validation.issues.slice(0, 5).map((issue) => (
            <div
              key={`${issue.path}-${issue.message}`}
              className={
                issue.severity === "error" ? "text-red-300" : "text-yellow-300"
              }
            >
              {issue.path}: {issue.message}
            </div>
          ))}
        </div>
      )}

      {review.length > 0 && (
        <div className="mt-3 space-y-1">
          {review.slice(0, 4).map((finding) => (
            <div
              key={`${finding.path}-${finding.message}`}
              className={
                finding.severity === "error"
                  ? "text-red-300"
                  : finding.severity === "warning"
                    ? "text-yellow-300"
                    : "app-muted"
              }
            >
              {finding.path}: {finding.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
