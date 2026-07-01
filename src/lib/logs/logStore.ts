export type LogLevel = "info" | "success" | "warning" | "error" | "debug";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  source?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const STORAGE_KEY = "cursor_ai_logs_v1";

function createId(): string {
  return `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createLogEntry(
  level: LogLevel,
  message: string,
  source?: string,
  metadata?: Record<string, unknown>
): LogEntry {
  return {
    id: createId(),
    level,
    message,
    source,
    metadata,
    createdAt: new Date().toISOString(),
  };
}

export function loadLogs(): LogEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LogEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveLogs(logs: LogEntry[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // Ignore storage quota and privacy-mode failures.
  }
}

export function addLog(
  level: LogLevel,
  message: string,
  source?: string,
  metadata?: Record<string, unknown>
): LogEntry {
  const entry = createLogEntry(level, message, source, metadata);
  saveLogs([entry, ...loadLogs()].slice(0, 1000));
  return entry;
}

export function removeLog(id: string): LogEntry[] {
  const next = loadLogs().filter((log) => log.id !== id);
  saveLogs(next);
  return next;
}

export function clearLogs(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getLogsByLevel(level: LogLevel): LogEntry[] {
  return loadLogs().filter((log) => log.level === level);
}

export function searchLogs(query: string): LogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return loadLogs();

  return loadLogs().filter((log) =>
    [log.message, log.level, log.source ?? ""].join(" ").toLowerCase().includes(q)
  );
}

export function getLatestLog(): LogEntry | null {
  return loadLogs()[0] ?? null;
}
