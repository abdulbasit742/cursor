"use client";

import { CheckSquare, Square } from "lucide-react";

export default function AgentApprovalQueue({
  total,
  selected,
  onSelectAll,
  onClear
}: {
  total: number;
  selected: number;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  if (total === 0) return null;

  return (
    <div className="rounded-lg border app-border app-bg p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold">Approval queue</div>
          <div className="mt-1 text-xs app-muted">
            {selected} of {total} file changes selected
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-1 rounded app-hover px-2 py-1 text-xs"
          >
            <CheckSquare size={13} />
            All
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded app-hover px-2 py-1 text-xs"
          >
            <Square size={13} />
            None
          </button>
        </div>
      </div>
    </div>
  );
}
