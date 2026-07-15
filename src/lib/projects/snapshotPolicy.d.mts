export interface SnapshotFileItem {
  id: string;
  name: string;
  language: string;
  content: string;
  type: 'file' | 'folder';
  children?: SnapshotFileItem[];
  isOpen?: boolean;
}

export type SnapshotSource = 'manual' | 'template' | 'import' | 'reset';

export interface ProjectSnapshotRecord {
  id: string;
  label: string;
  source: SnapshotSource;
  files: SnapshotFileItem[];
  fileCount: number;
  totalBytes: number;
  createdAt: string;
  expiresAt: string;
  storage: 'session';
}

export const snapshotLimits: Readonly<{
  maxSnapshots: number;
  maxSnapshotBytes: number;
  ttlMs: number;
}>;

export function prepareProjectSnapshot(input: {
  files: SnapshotFileItem[];
  label: string;
  source?: SnapshotSource;
  now?: Date | string | number;
  randomBytes?: (length: number) => Uint8Array;
}): Readonly<ProjectSnapshotRecord>;

export function parseProjectSnapshots(
  raw: string | null,
  now?: Date | string | number,
): ProjectSnapshotRecord[];

export function addProjectSnapshot(
  existing: ProjectSnapshotRecord[],
  snapshot: ProjectSnapshotRecord,
  now?: Date | string | number,
): ProjectSnapshotRecord[];
