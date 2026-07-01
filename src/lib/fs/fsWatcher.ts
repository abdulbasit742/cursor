import type { VirtualFile } from "./virtualFS";

export type FSWatcherEventType = "created" | "updated" | "deleted" | "renamed";

export interface FSWatcherEvent {
  id: string;
  type: FSWatcherEventType;
  path: string;
  previousPath?: string;
  file?: VirtualFile;
  createdAt: string;
}

export type FSWatcherListener = (event: FSWatcherEvent) => void;

function createId(): string {
  return `fs_event_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export class FSWatcher {
  private listeners = new Set<FSWatcherListener>();
  private events: FSWatcherEvent[] = [];

  subscribe(listener: FSWatcherListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(
    type: FSWatcherEventType,
    path: string,
    file?: VirtualFile,
    previousPath?: string
  ): FSWatcherEvent {
    const event: FSWatcherEvent = {
      id: createId(),
      type,
      path,
      previousPath,
      file,
      createdAt: new Date().toISOString(),
    };

    this.events = [event, ...this.events].slice(0, 500);
    this.listeners.forEach((listener) => listener(event));
    return event;
  }

  getEvents(): FSWatcherEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }

  getRecentEvents(limit = 20): FSWatcherEvent[] {
    return this.events.slice(0, limit);
  }

  countListeners(): number {
    return this.listeners.size;
  }

  destroy(): void {
    this.listeners.clear();
    this.events = [];
  }
}

export const globalFSWatcher = new FSWatcher();

export function watchFS(listener: FSWatcherListener): () => void {
  return globalFSWatcher.subscribe(listener);
}

export function emitFSCreate(path: string, file?: VirtualFile): FSWatcherEvent {
  return globalFSWatcher.emit("created", path, file);
}

export function emitFSUpdate(path: string, file?: VirtualFile): FSWatcherEvent {
  return globalFSWatcher.emit("updated", path, file);
}

export function emitFSDelete(path: string): FSWatcherEvent {
  return globalFSWatcher.emit("deleted", path);
}

export function emitFSRename(
  oldPath: string,
  newPath: string,
  file?: VirtualFile
): FSWatcherEvent {
  return globalFSWatcher.emit("renamed", newPath, file, oldPath);
}
