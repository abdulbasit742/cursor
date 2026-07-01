"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addAgentMemory,
  clearAgentMemory,
  loadAgentMemory,
  removeAgentMemory,
  type AgentMemoryItem,
  type AgentMemoryKind,
} from "@/lib/agent/agentMemory";

const memoryKinds: AgentMemoryKind[] = ["preference", "decision", "fact", "warning"];

export function AgentMemoryPanel() {
  const [items, setItems] = useState<AgentMemoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<AgentMemoryKind>("fact");
  const [content, setContent] = useState("");

  useEffect(() => {
    setItems(loadAgentMemory());
  }, []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) =>
      [item.title, item.content, item.kind, ...item.tags].join(" ").toLowerCase().includes(q)
    );
  }, [items, query]);

  function handleAdd() {
    const trimmed = content.trim();
    if (!trimmed) return;

    const item = addAgentMemory({
      kind,
      title: trimmed.slice(0, 60),
      content: trimmed,
      tags: ["manual"],
      weight: 1,
    });

    setItems([item, ...items]);
    setContent("");
  }

  function handleClear() {
    clearAgentMemory();
    setItems([]);
  }

  return (
    <section className="flex h-full flex-col border border-[#3e3e3e] bg-[#252526] text-gray-100">
      <div className="flex items-center justify-between border-b border-[#3e3e3e] p-3">
        <div>
          <h2 className="text-sm font-semibold">Agent Memory</h2>
          <p className="text-xs text-gray-400">Persistent local context for the coding agent</p>
        </div>

        <button onClick={handleClear} className="rounded bg-red-600 px-3 py-1 text-xs text-white">
          Clear
        </button>
      </div>

      <div className="space-y-3 border-b border-[#3e3e3e] p-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search memory..."
          className="w-full rounded border border-[#3e3e3e] bg-[#1e1e1e] px-3 py-2 text-sm outline-none focus:border-[#007acc]"
        />

        <div className="flex gap-2">
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as AgentMemoryKind)}
            className="rounded border border-[#3e3e3e] bg-[#1e1e1e] px-2 py-2 text-sm outline-none focus:border-[#007acc]"
          >
            {memoryKinds.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Add new memory..."
            className="min-w-0 flex-1 rounded border border-[#3e3e3e] bg-[#1e1e1e] px-3 py-2 text-sm outline-none focus:border-[#007acc]"
          />

          <button onClick={handleAdd} className="rounded bg-[#007acc] px-3 py-2 text-sm text-white">
            Add
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {filteredItems.length === 0 ? (
          <div className="rounded border border-dashed border-[#3e3e3e] p-6 text-center text-sm text-gray-400">
            No memory items found.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <article key={item.id} className="rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{item.title}</h3>
                      <span className="rounded bg-[#37373d] px-2 py-1 text-xs">{item.kind}</span>
                    </div>

                    <p className="mt-2 text-sm text-gray-400">{item.content}</p>
                    <p className="mt-3 text-xs text-gray-500">
                      Weight {item.weight} - {new Date(item.updatedAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => setItems(removeAgentMemory(item.id))}
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

export default AgentMemoryPanel;
