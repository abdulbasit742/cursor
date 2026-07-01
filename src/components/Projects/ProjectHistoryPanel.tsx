"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clearProjectSnapshots,
  loadProjectSnapshots,
  removeProjectSnapshot,
  type ProjectSnapshot,
} from "@/lib/projects/projectSnapshots";

interface ProjectHistoryPanelProps {
  onRestore: (snapshot: ProjectSnapshot) => void;
}

export function ProjectHistoryPanel({ onRestore }: ProjectHistoryPanelProps) {
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setSnapshots(loadProjectSnapshots());
  }, []);

  const filteredSnapshots = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return snapshots;

    return snapshots.filter((snapshot) =>
      [snapshot.label, snapshot.source, snapshot.createdAt].join(" ").toLowerCase().includes(q)
    );
  }, [snapshots, query]);

  function handleClear() {
    clearProjectSnapshots();
    setSnapshots([]);
  }

  return (
    <section className="flex h-full flex-col border border-[#3e3e3e] bg-[#252526] text-gray-100">
      <div className="border-b border-[#3e3e3e] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Project History</h2>
            <p className="text-xs text-gray-400">Restore local snapshots before imports/templates</p>
          </div>

          <button onClick={handleClear} className="rounded bg-red-600 px-3 py-1 text-xs text-white">
            Clear
          </button>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search snapshots..."
          className="mt-3 w-full rounded border border-[#3e3e3e] bg-[#1e1e1e] px-3 py-2 text-sm outline-none focus:border-[#007acc]"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {filteredSnapshots.length === 0 ? (
          <div className="rounded border border-dashed border-[#3e3e3e] p-8 text-center text-sm text-gray-400">
            No snapshots yet.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSnapshots.map((snapshot) => (
              <article key={snapshot.id} className="rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{snapshot.label}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {snapshot.fileCount} files - {snapshot.source} -{" "}
                      {new Date(snapshot.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <span className="rounded bg-[#37373d] px-2 py-1 text-xs">{snapshot.source}</span>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => onRestore(snapshot)}
                    className="flex-1 rounded bg-[#007acc] px-3 py-2 text-xs font-medium text-white"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => setSnapshots(removeProjectSnapshot(snapshot.id))}
                    className="rounded bg-[#37373d] px-3 py-2 text-xs"
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

export default ProjectHistoryPanel;
