"use client";

import { useEffect, useMemo, useState } from "react";
import { getBuiltinCommands, type BuiltinCommand } from "@/lib/terminal/builtinCommands";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (command: string) => void;
}

export function CommandPalette({ open, onClose, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const commands = useMemo(() => getBuiltinCommands(), []);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;

    return commands.filter((command) =>
      [command.name, command.description, command.usage].join(" ").toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function selectCommand(command: BuiltinCommand) {
    onSelect(command.name);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden border border-[#3e3e3e] bg-[#252526] text-gray-100 shadow-2xl">
        <div className="border-b border-[#3e3e3e] p-3">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands..."
            className="w-full rounded border border-[#3e3e3e] bg-[#1e1e1e] px-4 py-3 text-sm outline-none focus:border-[#007acc]"
          />
        </div>

        <div className="max-h-[480px] overflow-y-auto p-3">
          {filteredCommands.length === 0 ? (
            <div className="rounded border border-dashed border-[#3e3e3e] p-8 text-center text-sm text-gray-400">
              No commands found.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCommands.map((command) => (
                <button
                  key={command.name}
                  onClick={() => selectCommand(command)}
                  className="w-full rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3 text-left hover:border-[#007acc]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-mono text-sm font-semibold text-white">{command.name}</h3>
                      <p className="mt-1 text-sm text-gray-400">{command.description}</p>
                    </div>
                    <span className="rounded bg-[#37373d] px-2 py-1 text-xs">
                      {command.usage}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#3e3e3e] px-4 py-3 text-xs text-gray-500">
          ESC to close - click command to run
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
