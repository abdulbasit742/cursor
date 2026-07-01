"use client";

import type { FileItem } from "@/store/useStore";
import { buildAgentDiff } from "@/lib/agent/diffBuilder";
import type { AgentFileChange } from "@/lib/agent/types";
import DiffFileCard from "./DiffFileCard";

export default function DiffViewer({
  files,
  changes
}: {
  files: FileItem[];
  changes: AgentFileChange[];
}) {
  if (changes.length === 0) {
    return (
      <div className="rounded-lg border app-border app-bg p-4 text-sm app-muted">
        No selected changes to preview.
      </div>
    );
  }

  const diffs = buildAgentDiff(files, changes);

  return (
    <div className="space-y-3">
      {diffs.map((diff) => (
        <DiffFileCard key={diff.id} diff={diff} />
      ))}
    </div>
  );
}
