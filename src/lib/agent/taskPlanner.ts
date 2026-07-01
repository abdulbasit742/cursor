import type { AgentProjectFile, AgentRiskLevel, AgentTaskPlan } from "./types";

function includesAny(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function inferRisk(task: string) {
  if (
    includesAny(task, [
      "auth",
      "payment",
      "stripe",
      "delete",
      "database",
      "migration",
      "security",
      "supabase"
    ])
  ) {
    return "high";
  }

  if (
    includesAny(task, [
      "refactor",
      "agent",
      "multi-file",
      "architecture",
      "state",
      "store"
    ])
  ) {
    return "medium";
  }

  return "low";
}

function inferIntent(task: string) {
  if (includesAny(task, ["fix", "bug", "error", "issue"])) return "fix";
  if (includesAny(task, ["refactor", "clean", "optimize"])) return "refactor";
  if (includesAny(task, ["test", "coverage", "spec"])) return "test";
  if (includesAny(task, ["explain", "document", "docs"])) return "documentation";

  return "feature";
}

export function planTask({
  task,
  files,
  activeFilePath
}: {
  task: string;
  files: AgentProjectFile[];
  activeFilePath?: string | null;
}): AgentTaskPlan {
  const intent = inferIntent(task);
  const riskLevel = inferRisk(task) as AgentRiskLevel;
  const targetFiles = files.slice(0, 8).map((file) => file.path);

  return {
    title: `${intent[0].toUpperCase()}${intent.slice(1)} plan`,
    intent,
    riskLevel,
    targetFiles: activeFilePath
      ? [activeFilePath, ...targetFiles.filter((path) => path !== activeFilePath)]
      : targetFiles,
    steps: [
      "Read the relevant project context.",
      "Prepare a minimal multi-file plan.",
      "Generate complete file contents for every changed file.",
      "Validate paths, actions, and potentially unsafe edits.",
      "Show a diff before applying anything."
    ],
    acceptanceCriteria: [
      "Generated changes are scoped to the task.",
      "No secrets or credentials are introduced.",
      "The project remains runnable after applying selected changes."
    ],
    suggestedCommands: ["npm run typecheck", "npm run build"]
  };
}
