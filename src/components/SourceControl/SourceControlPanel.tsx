"use client";

import { CheckCircle, Clipboard, GitBranch, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { FileItem } from "@/store/useStore";
import {
  clearProjectBaseline,
  compareProjectChanges,
  formatProjectChangeSummary,
  loadProjectBaseline,
  saveProjectBaseline,
  type ProjectChange,
  type ProjectChangeStatus,
} from "@/utils/projectChanges";

interface SourceControlPanelProps {
  files: FileItem[];
  onOpenFile: (file: FileItem) => void;
}

function statusClass(status: ProjectChangeStatus): string {
  if (status === "added") return "bg-green-900 text-green-300";
  if (status === "deleted") return "bg-red-900 text-red-300";
  return "bg-yellow-900 text-yellow-300";
}

function statusLabel(status: ProjectChangeStatus): string {
  if (status === "added") return "A";
  if (status === "deleted") return "D";
  return "M";
}

function getPreview(change: ProjectChange): string {
  const content = change.status === "deleted" ? change.before : change.after;
  return content.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() || "Empty file";
}

export function SourceControlPanel({ files, onOpenFile }: SourceControlPanelProps) {
  const [baseline, setBaseline] = useState(() => loadProjectBaseline());
  const [label, setLabel] = useState("Local checkpoint");
  const [copied, setCopied] = useState(false);

  const summary = useMemo(() => compareProjectChanges(files, baseline), [baseline, files]);

  function createCheckpoint() {
    setBaseline(saveProjectBaseline(files, label));
  }

  function clearCheckpoint() {
    clearProjectBaseline();
    setBaseline(null);
  }

  async function copySummary() {
    const text = formatProjectChangeSummary(summary);

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="flex h-full flex-col border border-[#3e3e3e] bg-[#252526] text-gray-100">
      <div className="border-b border-[#3e3e3e] p-3">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-[#4fc1ff]" />
          <h2 className="text-sm font-semibold">Source Control</h2>
        </div>

        <p className="mt-1 text-xs text-gray-400">
          {baseline
            ? `Checkpoint: ${baseline.label} (${new Date(baseline.createdAt).toLocaleString()})`
            : "Create a checkpoint to track local changes."}
        </p>
      </div>

      <div className="space-y-2 border-b border-[#3e3e3e] p-3">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Checkpoint label"
          className="w-full rounded border border-[#3e3e3e] bg-[#1e1e1e] px-3 py-2 text-sm outline-none focus:border-[#007acc]"
        />

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={createCheckpoint}
            className="flex items-center justify-center gap-1 rounded bg-[#007acc] px-2 py-2 text-xs font-medium text-white"
          >
            <CheckCircle size={14} />
            Checkpoint
          </button>
          <button
            type="button"
            onClick={() => setBaseline(loadProjectBaseline())}
            className="flex items-center justify-center gap-1 rounded bg-[#37373d] px-2 py-2 text-xs"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            type="button"
            onClick={clearCheckpoint}
            className="flex items-center justify-center gap-1 rounded bg-red-700 px-2 py-2 text-xs text-white"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 border-b border-[#3e3e3e] p-3 text-center text-xs">
        <div className="rounded bg-[#1e1e1e] p-2">
          <p className="text-gray-500">Files</p>
          <p className="mt-1 text-lg font-semibold">{summary.changes.length}</p>
        </div>
        <div className="rounded bg-[#1e1e1e] p-2">
          <p className="text-gray-500">Added</p>
          <p className="mt-1 text-lg font-semibold text-green-300">{summary.added}</p>
        </div>
        <div className="rounded bg-[#1e1e1e] p-2">
          <p className="text-gray-500">Mod</p>
          <p className="mt-1 text-lg font-semibold text-yellow-300">{summary.modified}</p>
        </div>
        <div className="rounded bg-[#1e1e1e] p-2">
          <p className="text-gray-500">Del</p>
          <p className="mt-1 text-lg font-semibold text-red-300">{summary.deleted}</p>
        </div>
        <div className="rounded bg-[#1e1e1e] p-2">
          <p className="text-gray-500">Lines</p>
          <p className="mt-1 text-sm font-semibold">
            +{summary.addedLines} -{summary.deletedLines}
          </p>
        </div>
      </div>

      <div className="border-b border-[#3e3e3e] p-3">
        <button
          type="button"
          onClick={() => void copySummary()}
          className="flex w-full items-center justify-center gap-2 rounded bg-[#37373d] px-3 py-2 text-xs"
        >
          <Clipboard size={14} />
          {copied ? "Copied" : "Copy Change Summary"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {!baseline ? (
          <div className="rounded border border-dashed border-[#3e3e3e] p-8 text-center text-sm text-gray-400">
            No checkpoint yet. Create one, then edit files to see changes here.
          </div>
        ) : summary.changes.length === 0 ? (
          <div className="rounded border border-dashed border-[#3e3e3e] p-8 text-center text-sm text-gray-400">
            No changes since checkpoint.
          </div>
        ) : (
          <div className="space-y-2">
            {summary.changes.map((change) => (
              <article key={`${change.status}-${change.path}`} className="rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${statusClass(change.status)}`}>
                        {statusLabel(change.status)}
                      </span>
                      <h3 className="truncate text-sm font-medium">{change.path}</h3>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs text-gray-400">{getPreview(change)}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      +{change.addedLines} -{change.deletedLines}
                    </p>
                  </div>

                  {change.file && (
                    <button
                      type="button"
                      onClick={() => onOpenFile(change.file as FileItem)}
                      className="rounded bg-[#007acc] px-3 py-1 text-xs text-white"
                    >
                      Open
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default SourceControlPanel;
