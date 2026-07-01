"use client";

import type { AgentFileChange } from "@/lib/agent/types";

export default function FileChangePreview({
  changes,
  selectedIds,
  onToggle
}: {
  changes: AgentFileChange[];
  selectedIds: string[];
  onToggle: (changeId: string) => void;
}) {
  if (changes.length === 0) {
    return (
      <div className="rounded-lg border app-border app-bg p-3 text-sm app-muted">
        No file changes generated.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {changes.map((change) => (
        <label
          key={change.id}
          className="flex items-start gap-3 rounded-lg border app-border app-bg p-3 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(change.id)}
            onChange={() => onToggle(change.id)}
            className="mt-1"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate">{change.path}</span>
              <span className="text-[11px] uppercase app-muted">
                {change.action}
              </span>
            </div>
            <p className="mt-1 text-xs app-muted">{change.summary}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
