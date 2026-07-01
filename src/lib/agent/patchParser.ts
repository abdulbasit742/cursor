import { getLanguageFromName } from "@/utils/language";
import { createChangeId, isValidAction, sanitizeAgentPath } from "./tools";
import type { AgentFileChange, AgentPlan } from "./types";

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Agent response did not contain JSON.");
  }

  return text.slice(firstBrace, lastBrace + 1);
}

function normalizeChange(rawChange: Record<string, unknown>): AgentFileChange {
  const action = isValidAction(rawChange.action) ? rawChange.action : "update";
  const path = sanitizeAgentPath(String(rawChange.path || ""));

  if (!path) {
    throw new Error("Agent change is missing a path.");
  }

  const content =
    typeof rawChange.content === "string"
      ? rawChange.content
      : typeof rawChange.after === "string"
        ? rawChange.after
        : undefined;

  if (action !== "delete" && typeof content !== "string") {
    throw new Error(`Agent change for ${path} is missing content.`);
  }

  const change = {
    action,
    path,
    language:
      typeof rawChange.language === "string"
        ? rawChange.language
        : getLanguageFromName(path),
    title:
      typeof rawChange.title === "string"
        ? rawChange.title
        : `${action} ${path}`,
    summary:
      typeof rawChange.summary === "string"
        ? rawChange.summary
        : `Apply ${action} change to ${path}`,
    content
  };

  return {
    id:
      typeof rawChange.id === "string"
        ? rawChange.id
        : createChangeId(change),
    ...change
  };
}

export function parseAgentPlan(rawText: string): AgentPlan {
  const parsed = JSON.parse(extractJson(rawText)) as Record<string, unknown>;
  const rawChanges = Array.isArray(parsed.changes) ? parsed.changes : [];

  const changes = rawChanges.map((change) =>
    normalizeChange(change as Record<string, unknown>)
  );

  return {
    title:
      typeof parsed.title === "string" ? parsed.title : "Agent edit plan",
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : "The agent prepared a multi-file change plan.",
    steps: Array.isArray(parsed.steps)
      ? parsed.steps.map(String)
      : ["Review the generated changes.", "Apply the selected files."],
    changes,
    risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
    commands: Array.isArray(parsed.commands) ? parsed.commands.map(String) : []
  };
}
