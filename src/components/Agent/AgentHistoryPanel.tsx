"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clearAgentHistory,
  loadAgentHistory,
  removeAgentHistoryEntry,
  type AgentHistoryEntry,
} from "@/lib/agent/agentHistory";

interface AgentHistoryPanelProps {
  onSelect?: (entry: AgentHistoryEntry) => void;
}

function statusClassName(status: AgentHistoryEntry["status"]): string {
  if (status === "applied") return "bg-green-900 text-green-300";
  if (status === "planned") return "bg-blue-900 text-blue-300";
  if (status === "failed") return "bg-red-900 text-red-300";
  return "bg-yellow-900 text-yellow-300";
}

export function AgentHistoryPanel({ onSelect }: AgentHistoryPanelProps) {
  const [items, setItems] = useState<AgentHistoryEntry[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setItems(loadAgentHistory());
  }, []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) =>
      [item.prompt, item.summary, item.status, ...item.filesChanged]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [items, query]);

  function handleRemove(id: string) {
    setItems(removeAgentHistoryEntry(id));
  }

  function handleClear() {
    clearAgentHistory();
    setItems([]);
  }

  return (
    <section className="flex h-full flex-col border border-[#3e3e3e] bg-[#252526] text-gray-100">
      <div className="flex items-center justify-between border-b border-[#3e3e3e] p-3">
        <div>
          <h2 className="text-sm font-semibold">Agent History</h2>
          <p className="text-xs text-gray-400">Previous AI agent runs</p>
        </div>

        <button onClick={handleClear} className="rounded bg-red-600 px-3 py-1 text-xs text-white">
          Clear
        </button>
      </div>

      <div className="border-b border-[#3e3e3e] p-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search history..."
          className="w-full rounded border border-[#3e3e3e] bg-[#1e1e1e] px-3 py-2 text-sm outline-none focus:border-[#007acc]"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {filteredItems.length === 0 ? (
          <div className="rounded border border-dashed border-[#3e3e3e] p-6 text-center text-sm text-gray-400">
            No history entries found.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <article key={item.id} className="rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{item.prompt}</h3>
                    <p className="mt-1 text-sm text-gray-400">{item.summary}</p>
                  </div>

                  <span className={`rounded px-2 py-1 text-xs ${statusClassName(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.filesChanged.map((file) => (
                    <span key={file} className="rounded bg-[#37373d] px-2 py-1 text-xs">
                      {file}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">
                    {item.durationMs}ms - {new Date(item.createdAt).toLocaleString()}
                  </p>

                  <div className="flex gap-2">
                    {onSelect && (
                      <button
                        onClick={() => onSelect(item)}
                        className="rounded bg-[#007acc] px-3 py-1 text-xs text-white"
                      >
                        Open
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="rounded bg-[#37373d] px-3 py-1 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default AgentHistoryPanel;
