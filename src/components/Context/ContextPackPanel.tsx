"use client";

import { Clipboard, Copy, FileText, PackageCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { FileItem } from "@/store/useStore";
import { buildContextPack } from "@/utils/contextPack";

interface ContextPackPanelProps {
  files: FileItem[];
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en").format(value);
}

export function ContextPackPanel({ files }: ContextPackPanelProps) {
  const [maxCharacters, setMaxCharacters] = useState(24_000);
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [copied, setCopied] = useState(false);

  const pack = useMemo(
    () =>
      buildContextPack(files, {
        maxCharacters,
        includeDiagnostics,
        includeStats,
      }),
    [files, includeDiagnostics, includeStats, maxCharacters]
  );

  async function copyPack() {
    try {
      await navigator.clipboard.writeText(pack.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="flex h-full flex-col border border-[#3e3e3e] bg-[#252526] text-gray-100">
      <div className="border-b border-[#3e3e3e] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PackageCheck size={16} className="text-[#4fc1ff]" />
            <h2 className="text-sm font-semibold">AI Context Pack</h2>
          </div>

          <button
            type="button"
            onClick={copyPack}
            className="flex items-center gap-1 rounded bg-[#007acc] px-3 py-1.5 text-xs text-white hover:bg-[#006bb3]"
          >
            {copied ? <Clipboard size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">Prompt-ready project summary for coding agents</p>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-[#3e3e3e] p-3 text-center text-xs">
        <div className="rounded bg-[#1e1e1e] p-2">
          <p className="text-gray-500">Used</p>
          <p className="mt-1 text-lg font-semibold">{formatNumber(pack.usedCharacters)}</p>
        </div>
        <div className="rounded bg-[#1e1e1e] p-2">
          <p className="text-gray-500">Files</p>
          <p className="mt-1 text-lg font-semibold">{pack.files.length}</p>
        </div>
        <div className="rounded bg-[#1e1e1e] p-2">
          <p className="text-gray-500">Trimmed</p>
          <p className="mt-1 text-lg font-semibold">{pack.truncatedFiles}</p>
        </div>
      </div>

      <div className="space-y-4 border-b border-[#3e3e3e] p-3">
        <label className="block text-sm">
          <div className="flex items-center justify-between">
            <span>Context budget</span>
            <span className="rounded bg-[#1e1e1e] px-2 py-1 text-xs">
              {formatNumber(maxCharacters)} chars
            </span>
          </div>
          <input
            type="range"
            min={8000}
            max={80000}
            step={4000}
            value={maxCharacters}
            onChange={(event) => setMaxCharacters(Number(event.target.value))}
            className="mt-3 w-full accent-[#007acc]"
          />
        </label>

        <div className="grid gap-2">
          <label className="flex items-center justify-between rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3 text-sm">
            <span>Include diagnostics</span>
            <input
              type="checkbox"
              checked={includeDiagnostics}
              onChange={(event) => setIncludeDiagnostics(event.target.checked)}
              className="h-4 w-4 accent-[#007acc]"
            />
          </label>

          <label className="flex items-center justify-between rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3 text-sm">
            <span>Include stats</span>
            <input
              type="checkbox"
              checked={includeStats}
              onChange={(event) => setIncludeStats(event.target.checked)}
              className="h-4 w-4 accent-[#007acc]"
            />
          </label>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <section className="mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Included Files</h3>
          <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
            {pack.files.map((file) => (
              <article key={file.path} className="rounded border border-[#3e3e3e] bg-[#1e1e1e] p-2">
                <div className="flex items-start gap-2">
                  <FileText size={14} className="mt-0.5 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{file.path}</p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      {file.language} - {formatNumber(file.includedCharacters)} of{" "}
                      {formatNumber(file.characters)} chars
                      {file.truncated ? " - trimmed" : ""}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <textarea
          readOnly
          value={pack.text}
          className="h-[28rem] w-full resize-none rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3 font-mono text-xs leading-5 text-gray-200 outline-none"
        />
      </div>
    </section>
  );
}

export default ContextPackPanel;
