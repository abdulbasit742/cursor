"use client";

import { useMemo } from "react";
import {
  prioritizeSuggestions,
  type PrioritizableSuggestion,
  type PrioritizedSuggestion,
} from "@/lib/agent/predictivePrioritizer";

interface AgentSuggestionOverlayProps {
  suggestions: PrioritizableSuggestion[];
  visible?: boolean;
  maxItems?: number;
  onAccept?: (suggestion: PrioritizedSuggestion) => void;
  onDismiss?: (suggestion: PrioritizedSuggestion) => void;
}

function badgeClass(kind: "risk" | "impact", value: string): string {
  if (kind === "risk") {
    if (value === "low") return "bg-green-900 text-green-300";
    if (value === "medium") return "bg-yellow-900 text-yellow-300";
    return "bg-red-900 text-red-300";
  }

  if (value === "high") return "bg-blue-900 text-blue-300";
  if (value === "medium") return "bg-cyan-900 text-cyan-300";
  return "bg-[#37373d] text-gray-300";
}

export function AgentSuggestionOverlay({
  suggestions,
  visible = true,
  maxItems = 5,
  onAccept,
  onDismiss,
}: AgentSuggestionOverlayProps) {
  const prioritized = useMemo(
    () => prioritizeSuggestions(suggestions).slice(0, maxItems),
    [suggestions, maxItems]
  );

  if (!visible || prioritized.length === 0) return null;

  return (
    <aside className="fixed bottom-4 right-4 z-50 w-[420px] max-w-[95vw] border border-[#3e3e3e] bg-[#252526] text-gray-100 shadow-2xl">
      <div className="border-b border-[#3e3e3e] p-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">AI Suggestions</h2>
            <p className="text-xs text-gray-400">Ranked by predicted impact</p>
          </div>
          <span className="rounded bg-[#37373d] px-2 py-1 text-xs">{prioritized.length}</span>
        </div>
      </div>

      <div className="max-h-[520px] overflow-y-auto p-3">
        <div className="space-y-3">
          {prioritized.map((item) => (
            <article key={item.id} className="rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-semibold">{item.title}</h3>
                <span className="rounded bg-[#007acc] px-2 py-1 text-xs text-white">
                  Score {item.priorityScore}
                </span>
              </div>

              <p className="mt-2 text-sm text-gray-400">{item.description}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`rounded px-2 py-1 text-xs ${badgeClass("risk", item.risk)}`}>
                  Risk: {item.risk}
                </span>
                <span className={`rounded px-2 py-1 text-xs ${badgeClass("impact", item.impact)}`}>
                  Impact: {item.impact}
                </span>
                <span className="rounded bg-[#37373d] px-2 py-1 text-xs">
                  Confidence {Math.round(item.confidence * 100)}%
                </span>
              </div>

              <p className="mt-3 rounded border border-[#3e3e3e] bg-[#252526] p-2 text-xs text-gray-400">
                {item.reason}
              </p>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => onDismiss?.(item)}
                  className="rounded bg-[#37373d] px-3 py-1 text-xs"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => onAccept?.(item)}
                  className="rounded bg-[#007acc] px-3 py-1 text-xs text-white"
                >
                  Apply
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default AgentSuggestionOverlay;
