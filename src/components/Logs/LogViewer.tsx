"use client";

import { useEffect, useMemo, useState } from "react";
import { clearLogs, loadLogs, removeLog, type LogEntry, type LogLevel } from "@/lib/logs/logStore";
import { filterLogs, sortLogsByDate } from "@/lib/logs/logFilter";

interface LogViewerProps {
  title?: string;
}

const levels: LogLevel[] = ["info", "success", "warning", "error", "debug"];

function levelColor(level: LogLevel): string {
  if (level === "success") return "bg-green-900 text-green-300";
  if (level === "warning") return "bg-yellow-900 text-yellow-300";
  if (level === "error") return "bg-red-900 text-red-300";
  if (level === "debug") return "bg-cyan-900 text-cyan-300";
  return "bg-blue-900 text-blue-300";
}

export function LogViewer({ title = "Logs" }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [query, setQuery] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<LogLevel[]>([]);

  useEffect(() => {
    setLogs(loadLogs());
  }, []);

  const filteredLogs = useMemo(
    () =>
      sortLogsByDate(
        filterLogs(logs, {
          query,
          levels: selectedLevels.length > 0 ? selectedLevels : undefined,
        }),
        "desc"
      ),
    [logs, query, selectedLevels]
  );

  function toggleLevel(level: LogLevel) {
    setSelectedLevels((current) =>
      current.includes(level) ? current.filter((item) => item !== level) : [...current, level]
    );
  }

  function handleClear() {
    clearLogs();
    setLogs([]);
  }

  return (
    <section className="flex h-full flex-col border border-[#3e3e3e] bg-[#252526] text-gray-100">
      <div className="border-b border-[#3e3e3e] p-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="text-xs text-gray-400">Runtime and agent logs</p>
          </div>

          <button onClick={handleClear} className="rounded bg-red-600 px-3 py-1 text-xs text-white">
            Clear
          </button>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search logs..."
          className="mt-3 w-full rounded border border-[#3e3e3e] bg-[#1e1e1e] px-3 py-2 text-sm outline-none focus:border-[#007acc]"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {levels.map((level) => {
            const active = selectedLevels.includes(level);

            return (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={`rounded px-3 py-1 text-xs font-medium ${
                  active ? levelColor(level) : "bg-[#37373d] text-gray-400"
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {filteredLogs.length === 0 ? (
          <div className="rounded border border-dashed border-[#3e3e3e] p-8 text-center text-sm text-gray-400">
            No logs found.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <article key={log.id} className="rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2 py-1 text-xs font-medium ${levelColor(log.level)}`}>
                        {log.level}
                      </span>
                      {log.source && (
                        <span className="rounded bg-[#37373d] px-2 py-1 text-xs">
                          {log.source}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 whitespace-pre-wrap break-words text-sm">{log.message}</p>
                    <p className="mt-3 text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => setLogs(removeLog(log.id))}
                    className="rounded bg-[#37373d] px-3 py-1 text-xs"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default LogViewer;
