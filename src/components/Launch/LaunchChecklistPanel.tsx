"use client";

import { CheckCircle2, Clipboard, Copy, ListChecks, TriangleAlert, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import type { FileItem } from "@/store/useStore";
import {
  buildLaunchChecklist,
  formatLaunchChecklist,
  type LaunchChecklistCategory,
  type LaunchChecklistStatus,
} from "@/utils/launchChecklist";

interface LaunchChecklistPanelProps {
  files: FileItem[];
}

const categoryLabels: Record<LaunchChecklistCategory, string> = {
  structure: "Structure",
  quality: "Quality",
  security: "Security",
  performance: "Performance",
  docs: "Docs",
  agent: "Agent",
};

function statusClassName(status: LaunchChecklistStatus): string {
  if (status === "pass") return "border-green-900 bg-green-950/40 text-green-200";
  if (status === "warning") return "border-yellow-900 bg-yellow-950/40 text-yellow-200";
  return "border-red-900 bg-red-950/40 text-red-200";
}

function statusIcon(status: LaunchChecklistStatus) {
  if (status === "pass") return <CheckCircle2 size={15} />;
  if (status === "warning") return <TriangleAlert size={15} />;
  return <XCircle size={15} />;
}

function scoreClassName(score: number): string {
  if (score >= 90) return "text-green-300";
  if (score >= 70) return "text-yellow-300";
  return "text-red-300";
}

export function LaunchChecklistPanel({ files }: LaunchChecklistPanelProps) {
  const [copied, setCopied] = useState(false);
  const report = useMemo(() => buildLaunchChecklist(files), [files]);
  const groupedItems = useMemo(() => {
    return report.items.reduce(
      (groups, item) => {
        groups[item.category].push(item);
        return groups;
      },
      {
        structure: [],
        quality: [],
        security: [],
        performance: [],
        docs: [],
        agent: [],
      } as Record<LaunchChecklistCategory, typeof report.items>
    );
  }, [report.items]);

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(formatLaunchChecklist(report));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="flex h-full flex-col border border-[#3e3e3e] bg-[#252526] text-gray-100">
      <div className="border-b border-[#3e3e3e] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListChecks size={16} className="text-[#4fc1ff]" />
            <h2 className="text-sm font-semibold">Launch Checklist</h2>
          </div>

          <button
            type="button"
            onClick={copyReport}
            className="flex items-center gap-1 rounded bg-[#007acc] px-3 py-1.5 text-xs text-white hover:bg-[#006bb3]"
          >
            {copied ? <Clipboard size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">Release score and practical fixes</p>
      </div>

      <div className="border-b border-[#3e3e3e] p-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Launch Score</p>
            <p className={`mt-1 text-5xl font-bold ${scoreClassName(report.score)}`}>
              {report.score}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold capitalize">{report.status.replace("-", " ")}</p>
            <p className="mt-1 text-xs text-gray-400">
              {report.passed} pass - {report.warnings} warning - {report.failed} fail
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#1e1e1e]">
          <div
            className={`h-full ${report.score >= 90 ? "bg-green-500" : report.score >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${report.score}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-4">
          {(Object.keys(groupedItems) as LaunchChecklistCategory[]).map((category) => {
            const items = groupedItems[category];
            if (items.length === 0) return null;

            return (
              <section key={category}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {categoryLabels[category]}
                </h3>
                <div className="mt-2 space-y-2">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className={`rounded border p-3 ${statusClassName(item.status)}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0">{statusIcon(item.status)}</span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold">{item.title}</h4>
                          <p className="mt-1 text-xs opacity-90">{item.description}</p>
                          {item.status !== "pass" && (
                            <p className="mt-2 rounded bg-black/20 p-2 text-xs">{item.action}</p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default LaunchChecklistPanel;
