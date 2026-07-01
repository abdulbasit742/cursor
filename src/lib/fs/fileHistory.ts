export type FileHistoryAction = "created" | "updated" | "deleted" | "renamed" | "restored";

export interface FileHistoryEntry {
  id: string;
  path: string;
  previousPath?: string;
  action: FileHistoryAction;
  contentSnapshot?: string;
  createdAt: string;
  message?: string;
}

const STORAGE_KEY = "cursor_ai_file_history_v1";

function createId(): string {
  return `file_hist_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createFileHistoryEntry(
  input: Omit<FileHistoryEntry, "id" | "createdAt">
): FileHistoryEntry {
  return {
    ...input,
    id: createId(),
    createdAt: new Date().toISOString(),
  };
}

export function loadFileHistory(): FileHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FileHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveFileHistory(entries: FileHistoryEntry[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage quota and privacy-mode failures.
  }
}

export function addFileHistoryEntry(
  input: Omit<FileHistoryEntry, "id" | "createdAt">
): FileHistoryEntry {
  const entry = createFileHistoryEntry(input);
  saveFileHistory([entry, ...loadFileHistory()].slice(0, 1000));
  return entry;
}

export function getFileHistory(path: string): FileHistoryEntry[] {
  return loadFileHistory().filter((entry) => entry.path === path || entry.previousPath === path);
}

export function getLatestFileSnapshot(path: string): string | null {
  const entry = getFileHistory(path).find((item) => typeof item.contentSnapshot === "string");
  return entry?.contentSnapshot ?? null;
}

export function clearFileHistory(path?: string): void {
  if (!path) {
    saveFileHistory([]);
    return;
  }

  saveFileHistory(
    loadFileHistory().filter((entry) => entry.path !== path && entry.previousPath !== path)
  );
}

export function countFileHistory(path?: string): number {
  return path ? getFileHistory(path).length : loadFileHistory().length;
}
