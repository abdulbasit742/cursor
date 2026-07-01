"use client";

import { Bot, Loader2 } from "lucide-react";

export default function AgentComposer({
  task,
  isLoading,
  provider,
  onTaskChange,
  onProviderChange,
  onRun
}: {
  task: string;
  isLoading: boolean;
  provider: "auto" | "local" | "openai";
  onTaskChange: (task: string) => void;
  onProviderChange: (provider: "auto" | "local" | "openai") => void;
  onRun: () => void;
}) {
  return (
    <div className="p-3 border-b app-border shrink-0">
      <textarea
        value={task}
        onChange={(event) => onTaskChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            onRun();
          }
        }}
        placeholder="Tell the coding agent what to build, fix, or refactor..."
        className="w-full h-28 resize-none app-input border rounded-md p-2 text-sm outline-none"
      />

      <button
        onClick={onRun}
        disabled={isLoading}
        className="mt-2 w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-md py-2 text-sm font-medium"
      >
        {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Bot size={15} />}
        {isLoading ? "Planning changes..." : "Run Coding Agent"}
      </button>

      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] app-muted">
        <span>Shortcut: Ctrl + Enter</span>

        <label className="flex items-center gap-2">
          <span>Mode</span>
          <select
            value={provider}
            onChange={(event) =>
              onProviderChange(event.target.value as "auto" | "local" | "openai")
            }
            className="app-input border rounded px-2 py-1 text-xs"
          >
            <option value="auto">Auto</option>
            <option value="local">Free local</option>
            <option value="openai">OpenAI</option>
          </select>
        </label>
      </div>
    </div>
  );
}
