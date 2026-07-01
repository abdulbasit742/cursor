export type AgentHistoryStatus = "planned" | "applied" | "failed" | "cancelled";

export interface AgentHistoryEntry {
  id: string;
  prompt: string;
  summary: string;
  status: AgentHistoryStatus;
  filesChanged: string[];
  createdAt: string;
  durationMs: number;
}

const STORAGE_KEY = "cursor_ai_agent_history_v1";

function createId(): string {
  return `hist_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function loadAgentHistory(): AgentHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AgentHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveAgentHistory(items: AgentHistoryEntry[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota and privacy-mode failures.
  }
}

export function addAgentHistory(
  entry: Omit<AgentHistoryEntry, "id" | "createdAt">
): AgentHistoryEntry {
  const item: AgentHistoryEntry = {
    ...entry,
    id: createId(),
    createdAt: new Date().toISOString(),
  };

  saveAgentHistory([item, ...loadAgentHistory()].slice(0, 200));
  return item;
}

export function removeAgentHistoryEntry(id: string): AgentHistoryEntry[] {
  const next = loadAgentHistory().filter((item) => item.id !== id);
  saveAgentHistory(next);
  return next;
}

export function clearAgentHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getLatestAgentHistoryEntry(): AgentHistoryEntry | null {
  return loadAgentHistory()[0] ?? null;
}

export function getSuccessfulAgentRuns(): AgentHistoryEntry[] {
  return loadAgentHistory().filter(
    (entry) => entry.status === "planned" || entry.status === "applied"
  );
}

export function getFailedAgentRuns(): AgentHistoryEntry[] {
  return loadAgentHistory().filter((entry) => entry.status === "failed");
}
