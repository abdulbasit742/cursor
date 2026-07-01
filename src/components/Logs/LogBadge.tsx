"use client";

import type { LogLevel } from "@/lib/logs/logStore";

interface LogBadgeProps {
  level: LogLevel;
  count?: number;
  compact?: boolean;
}

function levelClassName(level: LogLevel): string {
  if (level === "success") return "bg-green-900 text-green-300 border-green-800";
  if (level === "warning") return "bg-yellow-900 text-yellow-300 border-yellow-800";
  if (level === "error") return "bg-red-900 text-red-300 border-red-800";
  if (level === "debug") return "bg-cyan-900 text-cyan-300 border-cyan-800";
  return "bg-blue-900 text-blue-300 border-blue-800";
}

export function LogBadge({ level, count, compact = false }: LogBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${levelClassName(
        level
      )}`}
      title={`Log level: ${level}`}
    >
      <span className="capitalize">{compact ? level[0] : level}</span>
      {typeof count === "number" && (
        <span className="rounded-full bg-black/30 px-1.5 py-0.5 text-[10px]">{count}</span>
      )}
    </span>
  );
}

export default LogBadge;
