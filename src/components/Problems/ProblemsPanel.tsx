"use client";

import { AlertCircle, AlertTriangle, Info, RefreshCw, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import type { FileItem } from "@/store/useStore";
import {
  analyzeProjectDiagnostics,
  type DiagnosticSeverity,
  type ProjectDiagnostic,
} from "@/utils/projectDiagnostics";

interface ProblemsPanelProps {
  files: FileItem[];
  onOpenFile: (file: FileItem) => void;
}

const severityOptions: Array<DiagnosticSeverity | "all"> = ["all", "error", "warning", "info"];

function severityIcon(severity: DiagnosticSeverity) {
  if (severity === "error") return <XCircle size={15} className="text-red-400" />;
  if (severity === "warning") return <AlertTriangle size={15} className="text-yellow-400" />;
  return <Info size={15} className="text-blue-400" />;
}

function severityClass(severity: DiagnosticSeverity): string {
  if (severity === "error") return "bg-red-900 text-red-300";
  if (severity === "warning") return "bg-yellow-900 text-yellow-300";
  return "bg-blue-900 text-blue-300";
}

function matchesQuery(diagnostic: ProjectDiagnostic, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    diagnostic.title,
    diagnostic.message,
    diagnostic.path,
    diagnostic.severity,
    diagnostic.source,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function ProblemsPanel({ files, onOpenFile }: ProblemsPanelProps) {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<DiagnosticSeverity | "all">("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const report = useMemo(() => analyzeProjectDiagnostics(files), [files, refreshKey]);
  const diagnostics = report.diagnostics.filter(
    (diagnostic) =>
      (severity === "all" || diagnostic.severity === severity) && matchesQuery(diagnostic, query)
  );

  return (
    <section className="flex h-full flex-col border border-[#3e3e3e] bg-[#252526] text-gray-100">
      <div className="border-b border-[#3e3e3e] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-[#4fc1ff]" />
            <h2 className="text-sm font-semibold">Problems</h2>
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            className="rounded p-1 text-gray-400 hover:bg-[#37373d] hover:text-white"
            title="Refresh diagnostics"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded bg-[#1e1e1e] p-2">
            <p className="text-gray-500">Errors</p>
            <p className="mt-1 text-lg font-semibold text-red-300">{report.errors}</p>
          </div>
          <div className="rounded bg-[#1e1e1e] p-2">
            <p className="text-gray-500">Warnings</p>
            <p className="mt-1 text-lg font-semibold text-yellow-300">{report.warnings}</p>
          </div>
          <div className="rounded bg-[#1e1e1e] p-2">
            <p className="text-gray-500">Info</p>
            <p className="mt-1 text-lg font-semibold text-blue-300">{report.info}</p>
          </div>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter problems..."
          className="mt-3 w-full rounded border border-[#3e3e3e] bg-[#1e1e1e] px-3 py-2 text-sm outline-none focus:border-[#007acc]"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {severityOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSeverity(option)}
              className={`rounded px-3 py-1 text-xs capitalize ${
                severity === option ? "bg-[#007acc] text-white" : "bg-[#37373d] text-gray-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {diagnostics.length === 0 ? (
          <div className="rounded border border-dashed border-[#3e3e3e] p-8 text-center text-sm text-gray-400">
            No problems found.
          </div>
        ) : (
          <div className="space-y-2">
            {diagnostics.map((diagnostic) => (
              <button
                key={diagnostic.id}
                type="button"
                onClick={() => onOpenFile(diagnostic.file)}
                className="w-full rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3 text-left hover:border-[#007acc]"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{severityIcon(diagnostic.severity)}</div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="truncate text-sm font-medium text-white">{diagnostic.title}</h3>
                      <span className={`rounded px-2 py-0.5 text-xs ${severityClass(diagnostic.severity)}`}>
                        {diagnostic.severity}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-400">{diagnostic.message}</p>
                    <p className="mt-2 truncate text-xs text-gray-500">
                      {diagnostic.path}
                      {diagnostic.lineNumber ? `:${diagnostic.lineNumber}` : ""}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProblemsPanel;
