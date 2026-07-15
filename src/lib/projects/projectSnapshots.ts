"use client";

import type { FileItem } from "@/store/useStore";
import {
  addProjectSnapshot,
  parseProjectSnapshots,
  prepareProjectSnapshot,
  type ProjectSnapshotRecord,
  type SnapshotSource,
} from "./snapshotPolicy.mjs";

export interface ProjectSnapshot extends Omit<ProjectSnapshotRecord, "files"> {
  files: FileItem[];
}

const STORAGE_KEY = "ai_code_editor_project_snapshots_v2_session";
const LEGACY_LOCAL_KEYS = [
  "ai_code_editor_project_snapshots_v1",
  "cursor_ai_fs_sync_v1",
];

function purgeLegacyLocalCopies(): void {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_LOCAL_KEYS) window.localStorage.removeItem(key);
}

function writeSnapshots(snapshots: ProjectSnapshot[]): void {
  if (typeof window === "undefined") return;
  if (snapshots.length) {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  } else {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function loadProjectSnapshots(): ProjectSnapshot[] {
  if (typeof window === "undefined") return [];
  purgeLegacyLocalCopies();
  const snapshots = parseProjectSnapshots(
    window.sessionStorage.getItem(STORAGE_KEY),
  ) as ProjectSnapshot[];
  writeSnapshots(snapshots);
  return snapshots;
}

export function saveProjectSnapshot(
  files: FileItem[],
  label: string,
  source: SnapshotSource = "manual",
): ProjectSnapshot {
  if (typeof window === "undefined") {
    throw new Error("browser session storage is unavailable");
  }
  purgeLegacyLocalCopies();

  try {
    const snapshot = prepareProjectSnapshot({ files, label, source }) as ProjectSnapshot;
    writeSnapshots(
      addProjectSnapshot(loadProjectSnapshots(), snapshot) as ProjectSnapshot[],
    );
    return snapshot;
  } catch (error) {
    const reason = error instanceof Error
      ? error.message
      : "snapshot could not be created safely";
    window.alert(
      `Safety snapshot blocked: ${reason}\n\nThe pending import, reset, or agent apply was not performed. Remove sensitive/generated files or download a reviewed safe ZIP first.`,
    );
    throw error;
  }
}

export function removeProjectSnapshot(id: string): ProjectSnapshot[] {
  const next = loadProjectSnapshots().filter((snapshot) => snapshot.id !== id);
  writeSnapshots(next);
  return next;
}

export function clearProjectSnapshots(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  purgeLegacyLocalCopies();
}
