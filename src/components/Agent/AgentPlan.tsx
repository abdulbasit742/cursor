"use client";

import { AlertTriangle, CheckCircle2, ListChecks, Terminal } from "lucide-react";
import type { AgentPlan as AgentPlanType } from "@/lib/agent/types";

export default function AgentPlan({ plan }: { plan: AgentPlanType }) {
  return (
    <div className="rounded-lg border app-border app-bg p-3">
      <h3 className="font-semibold text-sm">{plan.title}</h3>
      <p className="mt-1 text-xs app-muted">{plan.summary}</p>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <ListChecks size={14} className="text-blue-400" />
          Steps
        </div>
        <ol className="list-decimal list-inside space-y-1 text-xs app-muted">
          {plan.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      {plan.risks.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle size={14} className="text-yellow-400" />
            Risks
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs app-muted">
            {plan.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.commands.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Terminal size={14} className="text-green-400" />
            Suggested Commands
          </div>
          <div className="space-y-1">
            {plan.commands.map((command) => (
              <code
                key={command}
                className="block rounded panel-bg px-2 py-1 text-xs"
              >
                {command}
              </code>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
        <CheckCircle2 size={14} />
        {plan.changes.length} file change(s) ready for review.
      </div>
    </div>
  );
}
