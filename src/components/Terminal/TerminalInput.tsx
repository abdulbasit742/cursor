"use client";

import { useEffect, useRef, useState } from "react";

interface TerminalInputProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  history?: string[];
  onSubmit: (command: string) => void;
}

export function TerminalInput({
  value = "",
  placeholder = "Enter command...",
  disabled = false,
  autoFocus = true,
  history = [],
  onSubmit,
}: TerminalInputProps) {
  const [input, setInput] = useState(value);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function submit() {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    onSubmit(trimmed);
    setInput("");
    setHistoryIndex(-1);
  }

  function navigateHistory(direction: "up" | "down") {
    if (history.length === 0) return;

    if (direction === "up") {
      const nextIndex = historyIndex + 1 >= history.length ? history.length - 1 : historyIndex + 1;
      setHistoryIndex(nextIndex);
      setInput(history[history.length - 1 - nextIndex] ?? "");
      return;
    }

    const nextIndex = historyIndex - 1;

    if (nextIndex < 0) {
      setHistoryIndex(-1);
      setInput("");
      return;
    }

    setHistoryIndex(nextIndex);
    setInput(history[history.length - 1 - nextIndex] ?? "");
  }

  return (
    <div className="flex items-center gap-2 rounded border border-[#3e3e3e] bg-black px-3 py-2">
      <span className="font-mono text-sm text-green-400">$</span>

      <input
        ref={inputRef}
        value={input}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();

          if (event.key === "ArrowUp") {
            event.preventDefault();
            navigateHistory("up");
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            navigateHistory("down");
          }
        }}
        className="flex-1 bg-transparent font-mono text-sm text-white outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <button
        onClick={submit}
        disabled={disabled}
        className="rounded bg-[#007acc] px-3 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Run
      </button>
    </div>
  );
}

export default TerminalInput;
