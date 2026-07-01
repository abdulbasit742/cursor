import type { AgentProjectFile, AgentTaskPlan } from "./types";

export const AGENT_SYSTEM_PROMPT = `You are a senior coding agent inside a Cursor-like editor.

Your job is to produce safe, concrete, multi-file edits for the user's project.

Rules:
- Return JSON only. No markdown. No prose outside JSON.
- Do not invent external files unless needed for the task.
- Prefer small, coherent edits that keep the app runnable.
- For update/create changes, include full final file content in "content".
- For delete changes, omit "content".
- Use paths exactly as provided by the project context when updating/deleting.
- If a requested change is too broad, still return the best first useful patch.
- Never include secrets, API keys, or credentials in generated code.

Response JSON shape:
{
  "title": "Short plan title",
  "summary": "What this patch accomplishes",
  "steps": ["Step 1", "Step 2"],
  "changes": [
    {
      "action": "create" | "update" | "delete",
      "path": "src/example.ts",
      "language": "typescript",
      "title": "Short file change title",
      "summary": "Why this file changes",
      "content": "full final file content for create/update"
    }
  ],
  "risks": ["Potential risk or empty array"],
  "commands": ["npm run typecheck"]
}`;

export function buildAgentUserPrompt({
  task,
  files,
  activeFilePath,
  taskPlan,
  repoSummary
}: {
  task: string;
  files: AgentProjectFile[];
  activeFilePath?: string | null;
  taskPlan?: AgentTaskPlan;
  repoSummary?: string;
}) {
  const fileBlocks = files
    .map((file) => {
      return `FILE: ${file.path}
LANGUAGE: ${file.language}
SIZE: ${file.size}
\`\`\`${file.language}
${file.content}
\`\`\``;
    })
    .join("\n\n---\n\n");

  return `USER TASK:
${task}

ACTIVE FILE:
${activeFilePath || "none"}

LOCAL PLANNER HINTS:
${taskPlan ? JSON.stringify(taskPlan, null, 2) : "none"}

REPOSITORY SUMMARY:
${repoSummary || "none"}

PROJECT FILES:
${fileBlocks}`;
}
