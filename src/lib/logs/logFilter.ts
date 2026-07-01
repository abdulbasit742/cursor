import type { LogEntry, LogLevel } from "./logStore";

export interface LogFilterOptions {
  levels?: LogLevel[];
  query?: string;
  source?: string;
  fromDate?: string;
  toDate?: string;
}

export function filterLogs(logs: LogEntry[], options: LogFilterOptions): LogEntry[] {
  return logs.filter((log) => {
    const levelMatch = !options.levels?.length || options.levels.includes(log.level);
    const query = options.query?.trim().toLowerCase();
    const queryMatch =
      !query ||
      [log.message, log.level, log.source ?? ""].join(" ").toLowerCase().includes(query);
    const sourceMatch = !options.source || log.source === options.source;
    const created = new Date(log.createdAt).getTime();
    const fromMatch = !options.fromDate || created >= new Date(options.fromDate).getTime();
    const toMatch = !options.toDate || created <= new Date(options.toDate).getTime();

    return levelMatch && queryMatch && sourceMatch && fromMatch && toMatch;
  });
}

export function sortLogsByDate(logs: LogEntry[], order: "asc" | "desc" = "desc"): LogEntry[] {
  return [...logs].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return order === "asc" ? aTime - bTime : bTime - aTime;
  });
}

export function groupLogsByLevel(logs: LogEntry[]): Record<LogLevel, LogEntry[]> {
  return {
    info: logs.filter((log) => log.level === "info"),
    success: logs.filter((log) => log.level === "success"),
    warning: logs.filter((log) => log.level === "warning"),
    error: logs.filter((log) => log.level === "error"),
    debug: logs.filter((log) => log.level === "debug"),
  };
}

export function countLogsByLevel(logs: LogEntry[]): Record<LogLevel, number> {
  return {
    info: logs.filter((log) => log.level === "info").length,
    success: logs.filter((log) => log.level === "success").length,
    warning: logs.filter((log) => log.level === "warning").length,
    error: logs.filter((log) => log.level === "error").length,
    debug: logs.filter((log) => log.level === "debug").length,
  };
}

export function getRecentLogs(logs: LogEntry[], limit = 20): LogEntry[] {
  return sortLogsByDate(logs, "desc").slice(0, limit);
}
