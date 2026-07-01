export type AgentMemoryKind = "preference" | "decision" | "fact" | "warning";

export interface AgentMemoryItem {
  id: string;
  kind: AgentMemoryKind;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  weight: number;
}

const STORAGE_KEY = "cursor_ai_agent_memory_v1";

function now(): string {
  return new Date().toISOString();
}

function createId(): string {
  return `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeParseMemory(raw: string | null): AgentMemoryItem[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AgentMemoryItem[]) : [];
  } catch {
    return [];
  }
}

export function loadAgentMemory(): AgentMemoryItem[] {
  if (typeof window === "undefined") return [];
  return safeParseMemory(window.localStorage.getItem(STORAGE_KEY));
}

export function saveAgentMemory(items: AgentMemoryItem[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota and privacy-mode failures.
  }
}

export function addAgentMemory(
  input: Omit<AgentMemoryItem, "id" | "createdAt" | "updatedAt">
): AgentMemoryItem {
  const item: AgentMemoryItem = {
    ...input,
    id: createId(),
    createdAt: now(),
    updatedAt: now(),
  };

  saveAgentMemory([item, ...loadAgentMemory()].slice(0, 500));
  return item;
}

export function updateAgentMemory(
  id: string,
  patch: Partial<Omit<AgentMemoryItem, "id" | "createdAt">>
): AgentMemoryItem | null {
  let updated: AgentMemoryItem | null = null;

  const next = loadAgentMemory().map((item) => {
    if (item.id !== id) return item;

    updated = {
      ...item,
      ...patch,
      updatedAt: now(),
    };

    return updated;
  });

  saveAgentMemory(next);
  return updated;
}

export function removeAgentMemory(id: string): AgentMemoryItem[] {
  const next = loadAgentMemory().filter((item) => item.id !== id);
  saveAgentMemory(next);
  return next;
}

export function searchAgentMemory(query: string): AgentMemoryItem[] {
  const q = query.trim().toLowerCase();
  const items = loadAgentMemory();

  if (!q) return items;

  return items.filter((item) =>
    [item.title, item.content, item.kind, ...item.tags].join(" ").toLowerCase().includes(q)
  );
}

export function clearAgentMemory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
