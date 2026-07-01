import { validateAgentChanges } from "./changeValidator";
import type { AgentPlan, AgentProjectFile } from "./types";

export function repairAgentPlan({
  plan,
  projectFiles
}: {
  plan: AgentPlan;
  projectFiles: AgentProjectFile[];
}) {
  const validation = validateAgentChanges({
    changes: plan.changes,
    projectFiles
  });

  if (validation.ok) {
    return {
      plan,
      validation,
      repaired: false
    };
  }

  const repairedPlan: AgentPlan = {
    ...plan,
    title: `${plan.title} (safe subset)`,
    summary:
      validation.safeChanges.length === plan.changes.length
        ? plan.summary
        : `${plan.summary} Some unsafe changes were removed before preview.`,
    changes: validation.safeChanges,
    risks: [
      ...plan.risks,
      ...validation.issues.map((issue) => `${issue.path}: ${issue.message}`)
    ]
  };

  const repairedValidation = validateAgentChanges({
    changes: repairedPlan.changes,
    projectFiles
  });

  return {
    plan: repairedPlan,
    validation: repairedValidation,
    repaired: true
  };
}

export function buildRepairPrompt(plan: AgentPlan, errors: string[]) {
  return `Repair this agent plan. Keep valid changes, fix invalid paths/content, and return JSON only.

Errors:
${errors.join("\n")}

Plan:
${JSON.stringify(plan, null, 2)}`;
}
