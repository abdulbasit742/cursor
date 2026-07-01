import type { AgentChangeAction, AgentFileChange } from "./types";

export const AGENT_CHANGE_ACTIONS: AgentChangeAction[] = [
  "create",
  "update",
  "delete"
];

export function isValidAction(action: unknown): action is AgentChangeAction {
  return (
    typeof action === "string" &&
    AGENT_CHANGE_ACTIONS.includes(action as AgentChangeAction)
  );
}

export function createChangeId(change: Pick<AgentFileChange, "action" | "path">) {
  return `${change.action}:${change.path}`;
}

export function sanitizeAgentPath(path: string) {
  return path
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}
