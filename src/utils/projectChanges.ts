"use client";

import type { FileItem } from "@/store/useStore";
import { flattenFiles, type FlatFile } from "@/utils/fileTree";

export type ProjectChangeStatus = "added" | "modified" | "deleted";

export interface ProjectBaseline {
  id: string;
  label: string;
  createdAt: string;
  files: Record<string, string>;
}

export interface ProjectChange {
  path: string;
  status: ProjectChangeStatus;
  before: string;
  after: string;
  file: FlatFile | null;
  addedLines: number;
  deletedLines: number;
}

export interface ProjectChangeSummary {
  baseline: ProjectBaseline | null;
  changes: ProjectChange[];
  added: number;
  modified: number;
  deleted: number;
  addedLines: number;
  deletedLines: number;
}

const STORAGE_KEY = "ai_code_editor_source_baseline_v1";

function createId(): string {
  return `baseline_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function toFileMap(files: FileItem[]): Record<string, string> {
  return Object.fromEntries(flattenFiles(files).map((file) => [file.path, file.content]));
}

function splitLines(content: string): string[] {
  if (!content) return [];
  return content.split(/\r?\n/);
}

function getLineStats(before: string, after: string): { addedLines: number; deletedLines: number } {
  const beforeLines = splitLines(before);
  const afterLines = splitLines(after);
  let prefix = 0;

  while (
    prefix < beforeLines.length &&
    prefix < afterLines.length &&
    beforeLines[prefix] === afterLines[prefix]
  ) {
    prefix += 1;
  }

  let beforeEnd = beforeLines.length - 1;
  let afterEnd = afterLines.length - 1;

  while (
    beforeEnd >= prefix &&
    afterEnd >= prefix &&
    beforeLines[beforeEnd] === afterLines[afterEnd]
  ) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }

  return {
    addedLines: Math.max(0, afterEnd - prefix + 1),
    deletedLines: Math.max(0, beforeEnd - prefix + 1),
  };
}

export function loadProjectBaseline(): ProjectBaseline | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProjectBaseline) : null;
  } catch {
    return null;
  }
}

export function saveProjectBaseline(files: FileItem[], label = "Local checkpoint"): ProjectBaseline {
  const baseline: ProjectBaseline = {
    id: createId(),
    label: label.trim() || "Local checkpoint",
    createdAt: new Date().toISOString(),
    files: toFileMap(files),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(baseline));
  }

  return baseline;
}

export function clearProjectBaseline(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function compareProjectChanges(
  files: FileItem[],
  baseline = loadProjectBaseline()
): ProjectChangeSummary {
  const currentFiles = flattenFiles(files);
  const currentMap = Object.fromEntries(currentFiles.map((file) => [file.path, file]));
  const currentContentMap = toFileMap(files);
  const previousContentMap = baseline?.files ?? {};
  const paths = Array.from(
    new Set([...Object.keys(previousContentMap), ...Object.keys(currentContentMap)])
  ).sort((a, b) => a.localeCompare(b));

  const changes = paths.flatMap<ProjectChange>((path) => {
    const beforeExists = Object.prototype.hasOwnProperty.call(previousContentMap, path);
    const afterExists = Object.prototype.hasOwnProperty.call(currentContentMap, path);
    const before = previousContentMap[path] ?? "";
    const after = currentContentMap[path] ?? "";

    if (!beforeExists && afterExists) {
      return [
        {
          path,
          status: "added",
          before: "",
          after,
          file: currentMap[path] ?? null,
          addedLines: splitLines(after).length,
          deletedLines: 0,
        },
      ];
    }

    if (beforeExists && !afterExists) {
      return [
        {
          path,
          status: "deleted",
          before,
          after: "",
          file: null,
          addedLines: 0,
          deletedLines: splitLines(before).length,
        },
      ];
    }

    if (before !== after) {
      const stats = getLineStats(before, after);

      return [
        {
          path,
          status: "modified",
          before,
          after,
          file: currentMap[path] ?? null,
          ...stats,
        },
      ];
    }

    return [];
  });

  return {
    baseline,
    changes,
    added: changes.filter((change) => change.status === "added").length,
    modified: changes.filter((change) => change.status === "modified").length,
    deleted: changes.filter((change) => change.status === "deleted").length,
    addedLines: changes.reduce((sum, change) => sum + change.addedLines, 0),
    deletedLines: changes.reduce((sum, change) => sum + change.deletedLines, 0),
  };
}

export function formatProjectChangeSummary(summary: ProjectChangeSummary): string {
  if (!summary.baseline) {
    return "No source checkpoint exists yet.";
  }

  if (summary.changes.length === 0) {
    return `No changes since ${summary.baseline.label}.`;
  }

  const lines = [
    `Changes since ${summary.baseline.label}`,
    `Added: ${summary.added}, Modified: ${summary.modified}, Deleted: ${summary.deleted}`,
    `Lines: +${summary.addedLines} -${summary.deletedLines}`,
    "",
    ...summary.changes.map(
      (change) => `${change.status.toUpperCase()} ${change.path} (+${change.addedLines} -${change.deletedLines})`
    ),
  ];

  return lines.join("\n");
}
