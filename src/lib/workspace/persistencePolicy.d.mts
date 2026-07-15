export interface WorkspaceNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: WorkspaceNode[];
}

export interface PersistenceDecision<T> {
  allowed: boolean;
  reason: string | null;
  files?: T | null;
  state?: T | null;
  skipped?: readonly { path: string; reason: string }[];
}

export const persistenceLimits: Readonly<{
  maxSerializedBytes: number;
  ttlMs: number;
  maxSnapshots: number;
}>;

export const persistenceKeys: Readonly<{
  editorSession: string;
  legacyEditorLocal: string;
  fsSnapshots: string;
  legacyFsSnapshots: string;
}>;

export function prepareWorkspacePersistence<T extends WorkspaceNode[]>(files: T): PersistenceDecision<T>;
export function prepareVirtualFSPersistence<T>(state: T): PersistenceDecision<T>;
export function prepareEditorStateForPersistence<T extends object>(state: T): Partial<T>;

export interface StringStorage {
  getItem(name: string): string | null;
  setItem(name: string, value: string): void;
  removeItem(name: string): void;
}

export function createExpiringSessionStorage(
  sessionStorage: StringStorage,
  legacyLocalStorage?: Pick<StringStorage, 'removeItem'>,
  now?: () => number,
): StringStorage;
