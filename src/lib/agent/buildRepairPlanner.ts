import { interpretError } from "./errorInterpreter";

export interface RepairStep {
  id: string;
  title: string;
  description: string;
  targetFiles: string[];
  safe: boolean;
}

export interface RepairPlan {
  summary: string;
  steps: RepairStep[];
}

export function createBuildRepairPlan(error: unknown, files: string[]): RepairPlan {
  const interpreted = interpretError(error);
  const explanation = interpreted.explanation.toLowerCase();
  const rawMessage = interpreted.rawMessage.toLowerCase();

  const relatedFiles = files.filter((file) => {
    const lower = file.toLowerCase();

    return (
      explanation.includes(lower) ||
      rawMessage.includes(lower) ||
      lower.endsWith(".ts") ||
      lower.endsWith(".tsx")
    );
  });

  return {
    summary: `${interpreted.title}: ${interpreted.suggestedFix}`,
    steps: [
      {
        id: "inspect",
        title: "Inspect related files",
        description: interpreted.explanation,
        targetFiles: relatedFiles.slice(0, 8),
        safe: true,
      },
      {
        id: "patch",
        title: "Prepare safe patch",
        description: interpreted.suggestedFix,
        targetFiles: relatedFiles.slice(0, 8),
        safe: interpreted.severity !== "critical",
      },
      {
        id: "verify",
        title: "Run verification",
        description: "Run typecheck, lint, and build after applying patch.",
        targetFiles: [],
        safe: true,
      },
    ],
  };
}

export function getSafeRepairSteps(plan: RepairPlan): RepairStep[] {
  return plan.steps.filter((step) => step.safe);
}

export function getUnsafeRepairSteps(plan: RepairPlan): RepairStep[] {
  return plan.steps.filter((step) => !step.safe);
}

export function hasUnsafeRepairStep(plan: RepairPlan): boolean {
  return plan.steps.some((step) => !step.safe);
}

export function summarizeRepairPlan(plan: RepairPlan): string {
  const safeCount = getSafeRepairSteps(plan).length;
  const unsafeCount = getUnsafeRepairSteps(plan).length;
  return `${plan.summary} Safe steps: ${safeCount}. Unsafe steps: ${unsafeCount}.`;
}
