"use client";

import { CheckCircle2, Circle, FileCode2 } from "lucide-react";
import type { AgentPlan, AgentTaskPlan } from "@/lib/agent/types";

export default function AgentTimeline({
  taskPlan,
  plan
}: {
  taskPlan: AgentTaskPlan | null;
  plan: AgentPlan | null;
}) {
  const steps = plan?.steps || taskPlan?.steps || [];

  if (steps.length === 0 && !plan) {
    return null;
  }

  return (
    <div className="rounded-lg border app-border app-bg p-3">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <CheckCircle2 size={14} className="text-cyan-400" />
        Agent timeline
      </div>

      {steps.length > 0 && (
        <ol className="mt-3 space-y-2">
          {steps.map((step, index) => (
            <li key={`${index}-${step}`} className="flex gap-2 text-xs app-muted">
              <Circle size={12} className="mt-0.5 text-cyan-400" />
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}

      {plan && plan.changes.length > 0 && (
        <div className="mt-3 border-t app-border pt-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <FileCode2 size={14} className="text-blue-400" />
            Patch queue
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {plan.changes.map((change) => (
              <span
                key={change.id}
                className="rounded bg-white/5 px-2 py-1 text-[11px] app-muted"
              >
                {change.action}: {change.path}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
