import type { VirtualFile, VirtualFSState } from "./virtualFS";

export interface FSSyncSnapshot {
  id: string;
  state: VirtualFSState;
  createdAt: string;
}

const STORAGE_KEY = "cursor_ai_fs_sync_v1";

function createId(): string {
  return `fs_sync_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function cloneState(state: VirtualFSState): VirtualFSState {
  return {
    files: Object.fromEntries(Object.entries(state.files).map(([path, file]) => [path, { ...file }])),
  };
}

export function createFSSnapshot(state: VirtualFSState): FSSyncSnapshot {
  return {
    id: createId(),
    state: cloneState(state),
    createdAt: new Date().toISOString(),
  };
}

export function loadFSSnapshots(): FSSyncSnapshot[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FSSyncSnapshot[]) : [];
  } catch {
    return [];
  }
}

export function saveFSSnapshot(snapshot: FSSyncSnapshot): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([snapshot, ...loadFSSnapshots()].slice(0, 50)));
  } catch {
    // Ignore storage quota and privacy-mode failures.
  }
}

export function getLatestSnapshot(): FSSyncSnapshot | null {
  return loadFSSnapshots()[0] ?? null;
}

export function restoreSnapshot(id: string): VirtualFSState | null {
  const snapshot = loadFSSnapshots().find((item) => item.id === id);
  return snapshot ? cloneState(snapshot.state) : null;
}

export function deleteSnapshot(id: string): FSSyncSnapshot[] {
  const next = loadFSSnapshots().filter((snapshot) => snapshot.id !== id);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return next;
}

export function clearSnapshots(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function diffFSStates(
  previous: VirtualFSState,
  current: VirtualFSState
): {
  added: VirtualFile[];
  removed: VirtualFile[];
  updated: VirtualFile[];
} {
  const added: VirtualFile[] = [];
  const removed: VirtualFile[] = [];
  const updated: VirtualFile[] = [];

  for (const path in current.files) {
    if (!previous.files[path]) {
      added.push(current.files[path]);
      continue;
    }

    const previousFile = previous.files[path];
    const currentFile = current.files[path];

    if (
      previousFile.updatedAt !== currentFile.updatedAt ||
      previousFile.content !== currentFile.content
    ) {
      updated.push(currentFile);
    }
  }

  for (const path in previous.files) {
    if (!current.files[path]) removed.push(previous.files[path]);
  }

  return { added, removed, updated };
}
