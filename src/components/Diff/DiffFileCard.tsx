"use client";

import { FileCode, Minus, Plus } from "lucide-react";
import type { AgentChangeAction, AgentFileDiff } from "@/lib/agent/types";

function getActionColor(action: AgentChangeAction) {
  if (action === "create") return "text-green-400";
  if (action === "delete") return "text-red-400";
  return "text-blue-400";
}

export default function DiffFileCard({
  diff
}: {
  diff: AgentFileDiff;
}) {
  const beforeLines = diff.before.length > 0 ? diff.before.split("\n").length : 0;
  const afterLines = diff.after.length > 0 ? diff.after.split("\n").length : 0;

  return (
    <div className="rounded-lg border app-border app-bg overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b app-border">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileCode size={15} className={getActionColor(diff.action)} />
            <span className="truncate">{diff.path}</span>
          </div>
          <p className="mt-1 text-xs app-muted">{diff.summary}</p>
        </div>

        <div className="text-right text-xs">
          <div className={`uppercase ${getActionColor(diff.action)}`}>{diff.action}</div>
          <div className="mt-1 app-muted">
            +{diff.stats.added} / -{diff.stats.removed}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 text-xs">
        <div className="border-r app-border min-w-0">
          <div className="flex items-center gap-1 px-3 py-2 panel-bg border-b app-border app-muted">
            <Minus size={13} />
            Before ({beforeLines} lines)
          </div>
          <pre className="max-h-72 overflow-auto p-3 whitespace-pre-wrap">
            <code>{diff.before || "No existing file content."}</code>
          </pre>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1 px-3 py-2 panel-bg border-b app-border app-muted">
            <Plus size={13} />
            After ({afterLines} lines)
          </div>
          <pre className="max-h-72 overflow-auto p-3 whitespace-pre-wrap">
            <code>{diff.after || "File will be deleted."}</code>
          </pre>
        </div>
      </div>

      <div className="border-t app-border max-h-72 overflow-auto text-xs font-mono">
        {diff.lines.slice(0, 300).map((line, index) => (
          <div
            key={`${index}-${line.type}-${line.text}`}
            className={`grid grid-cols-[44px_44px_1fr] gap-2 px-3 py-0.5 ${
              line.type === "added"
                ? "bg-green-500/10 text-green-200"
                : line.type === "removed"
                  ? "bg-red-500/10 text-red-200"
                  : "text-gray-300"
            }`}
          >
            <span className="app-muted text-right">{line.oldLineNumber || ""}</span>
            <span className="app-muted text-right">{line.newLineNumber || ""}</span>
            <span className="whitespace-pre-wrap">
              {line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  "}
              {line.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
