"use client";

import { useEffect, useMemo, useRef } from "react";
import type { TerminalOutputLine } from "@/lib/terminal/outputFormatter";

interface TerminalOutputProps {
  lines: TerminalOutputLine[];
  height?: number;
  autoScroll?: boolean;
}

function getLineColor(type: TerminalOutputLine["type"]): string {
  if (type === "stderr") return "text-red-400";
  if (type === "success") return "text-green-400";
  if (type === "warning") return "text-yellow-400";
  if (type === "system") return "text-blue-400";
  return "text-gray-200";
}

export function TerminalOutput({ lines, height = 360, autoScroll = true }: TerminalOutputProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!autoScroll) return;
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [lines, autoScroll]);

  const renderedLines = useMemo(
    () =>
      lines.map((line) => (
        <div
          key={line.id}
          className={`whitespace-pre-wrap break-words font-mono text-sm leading-6 ${getLineColor(
            line.type
          )}`}
          title={new Date(line.createdAt).toLocaleString()}
        >
          {line.text}
        </div>
      )),
    [lines]
  );

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto rounded border border-[#3e3e3e] bg-black p-3"
      style={{ height }}
    >
      {renderedLines.length > 0 ? (
        <div className="space-y-1">{renderedLines}</div>
      ) : (
        <div className="font-mono text-sm text-gray-500">Terminal output is empty.</div>
      )}
    </div>
  );
}

export default TerminalOutput;
