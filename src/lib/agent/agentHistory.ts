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

const STORAGE_KEY = "cursor_ai_agent_history_v2_session";
const LEGACY_KEY = "cursor_ai_agent_history_v1";
const MAX_ENTRIES = 50;

function createId(): string {
  return `hist_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function purgeLegacy(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(LEGACY_KEY);
  }
}

export function loadAgentHistory(): AgentHistoryEntry[] {
  if (typeof window === "undefined") return [];
  purgeLegacy();

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as AgentHistoryEntry[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

export function saveAgentHistory(items: AgentHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  purgeLegacy();

  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_ENTRIES)),
    );
  } catch {
    // Ignore storage quota and privacy-mode failures.
  }
}

export function addAgentHistory(
  entry: Omit<AgentHistoryEntry, "id" | "createdAt">,
): AgentHistoryEntry {
  const item: AgentHistoryEntry = {
    ...entry,
    id: createId(),
    createdAt: new Date().toISOString(),
  };

  saveAgentHistory([item, ...loadAgentHistory()]);
  return item;
}

export function removeAgentHistoryEntry(id: string): AgentHistoryEntry[] {
  const next = loadAgentHistory().filter((item) => item.id !== id);
  saveAgentHistory(next);
  return next;
}

export function clearAgentHistory(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  purgeLegacy();
}

export function getLatestAgentHistoryEntry(): AgentHistoryEntry | null {
  return loadAgentHistory()[0] ?? null;
}

export function getSuccessfulAgentRuns(): AgentHistoryEntry[] {
  return loadAgentHistory().filter(
    (entry) => entry.status === "planned" || entry.status === "applied",
  );
}

export function getFailedAgentRuns(): AgentHistoryEntry[] {
  return loadAgentHistory().filter((entry) => entry.status === "failed");
}
