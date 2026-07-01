"use client";

import { Terminal } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { executeBuiltinCommand } from "@/lib/terminal/builtinCommands";
import {
  createOutputLine,
  formatCommandEcho,
  formatErrorOutput,
  type TerminalOutputLine,
} from "@/lib/terminal/outputFormatter";

interface TerminalPanelProps {
  files?: Record<string, string>;
  cwd?: string;
}

function lineColor(type: TerminalOutputLine["type"]): string {
  if (type === "stderr") return "text-red-400";
  if (type === "success") return "text-green-400";
  if (type === "warning") return "text-yellow-400";
  if (type === "system") return "text-blue-400";
  return "text-gray-200";
}

export default function TerminalPanel({ files = {}, cwd = "/ai-code-editor" }: TerminalPanelProps) {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [output, setOutput] = useState<TerminalOutputLine[]>([
    createOutputLine("AI Code Editor Terminal", "success"),
    createOutputLine("Type help to see available commands.", "system"),
  ]);
  const outputRef = useRef<HTMLDivElement | null>(null);

  const appendOutput = useCallback((line: TerminalOutputLine) => {
    setOutput((current) => [...current, line]);

    requestAnimationFrame(() => {
      outputRef.current?.scrollTo({
        top: outputRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  const renderedOutput = useMemo(
    () =>
      output.map((line) => (
        <div key={line.id} className={`whitespace-pre-wrap break-words ${lineColor(line.type)}`}>
          {line.text}
        </div>
      )),
    [output]
  );

  const runCommand = async (cmd: string) => {
    const cleanCmd = cmd.trim();
    if (!cleanCmd) return;

    appendOutput(formatCommandEcho(cleanCmd));
    setHistory((current) => [...current, cleanCmd].slice(-100));

    try {
      const result = await executeBuiltinCommand(cleanCmd, { cwd, files });

      if (result.output === "__CLEAR__") {
        setOutput([]);
        return;
      }

      appendOutput(createOutputLine(result.output, result.success ? "stdout" : "stderr"));
    } catch (error) {
      appendOutput(formatErrorOutput(error));
    }
  };

  return (
    <div className="h-48 app-bg border-t app-border flex flex-col shrink-0">
      <div className="h-9 panel-bg border-b app-border flex items-center gap-2 px-3 shrink-0">
        <Terminal size={16} className="app-muted" />
        <span className="text-sm app-muted">Terminal</span>
      </div>

      <div ref={outputRef} className="flex-1 overflow-y-auto p-3 font-mono text-sm">
        {renderedOutput}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void runCommand(command);
          setCommand("");
        }}
        className="h-9 border-t app-border flex items-center px-3 shrink-0"
      >
        <span className="text-green-400 mr-2">$</span>

        <input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp" && history.length > 0) {
              event.preventDefault();
              setCommand(history[history.length - 1] ?? "");
            }
          }}
          className="flex-1 bg-transparent outline-none text-sm font-mono"
          placeholder="type command..."
        />
      </form>
    </div>
  );
}
