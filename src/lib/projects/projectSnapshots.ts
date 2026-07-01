"use client";

import type { FileItem } from "@/store/useStore";
import { flattenFiles } from "@/utils/fileTree";

export interface ProjectSnapshot {
  id: string;
  label: string;
  source: "manual" | "template" | "import" | "reset";
  files: FileItem[];
  fileCount: number;
  createdAt: string;
}

const STORAGE_KEY = "ai_code_editor_project_snapshots_v1";

function createId(): string {
  return `snapshot_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function cloneFiles(files: FileItem[]): FileItem[] {
  return JSON.parse(JSON.stringify(files)) as FileItem[];
}

export function loadProjectSnapshots(): ProjectSnapshot[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProjectSnapshot[]) : [];
  } catch {
    return [];
  }
}

export function saveProjectSnapshot(
  files: FileItem[],
  label: string,
  source: ProjectSnapshot["source"] = "manual"
): ProjectSnapshot {
  const snapshot: ProjectSnapshot = {
    id: createId(),
    label: label.trim() || "Untitled snapshot",
    source,
    files: cloneFiles(files),
    fileCount: flattenFiles(files).length,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const next = [snapshot, ...loadProjectSnapshots()].slice(0, 30);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return snapshot;
}

export function removeProjectSnapshot(id: string): ProjectSnapshot[] {
  const next = loadProjectSnapshots().filter((snapshot) => snapshot.id !== id);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return next;
}

export function clearProjectSnapshots(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
