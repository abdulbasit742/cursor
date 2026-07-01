"use client";

import { Clock3 } from "lucide-react";
import type { AgentHistoryEntry } from "@/lib/agent/agentHistory";

interface AgentRunHistoryMiniProps {
  items: AgentHistoryEntry[];
}

function statusClassName(status: AgentHistoryEntry["status"]): string {
  if (status === "applied") return "text-green-300";
  if (status === "planned") return "text-blue-300";
  if (status === "failed") return "text-red-300";
  return "text-yellow-300";
}

export default function AgentRunHistoryMini({ items }: AgentRunHistoryMiniProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border app-border app-bg p-3">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <Clock3 size={14} className="text-cyan-400" />
        Recent agent runs
      </div>

      <div className="mt-2 space-y-2">
        {items.slice(0, 4).map((item) => (
          <article key={item.id} className="rounded border app-border bg-black/10 p-2">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-xs">{item.prompt}</p>
              <span className={`shrink-0 text-[10px] uppercase ${statusClassName(item.status)}`}>
                {item.status}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] app-muted">{item.summary}</p>
            <p className="mt-1 text-[10px] app-muted">
              {item.filesChanged.length} files - {item.durationMs}ms
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
