import type { LogEntry } from "./logStore";

export type LogExportFormat = "json" | "text" | "csv";

function escapeCsv(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportLogsAsJson(logs: LogEntry[]): string {
  return JSON.stringify(logs, null, 2);
}

export function exportLogsAsText(logs: LogEntry[]): string {
  return logs
    .map((log) => {
      const source = log.source ? ` [${log.source}]` : "";
      return `${log.createdAt} ${log.level.toUpperCase()}${source}: ${log.message}`;
    })
    .join("\n");
}

export function exportLogsAsCsv(logs: LogEntry[]): string {
  const header = ["id", "createdAt", "level", "source", "message"];
  const rows = logs.map((log) =>
    [log.id, log.createdAt, log.level, log.source ?? "", log.message].map(escapeCsv).join(",")
  );

  return [header.join(","), ...rows].join("\n");
}

export function exportLogs(logs: LogEntry[], format: LogExportFormat): string {
  if (format === "json") return exportLogsAsJson(logs);
  if (format === "csv") return exportLogsAsCsv(logs);
  return exportLogsAsText(logs);
}

export function downloadLogs(
  logs: LogEntry[],
  format: LogExportFormat,
  filename = "logs"
): void {
  if (typeof window === "undefined") return;

  const content = exportLogs(logs, format);
  const mime =
    format === "json" ? "application/json" : format === "csv" ? "text/csv" : "text/plain";
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${filename}.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
