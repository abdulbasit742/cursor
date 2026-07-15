export interface ArchiveEntryDescriptor {
  name: string;
  dir?: boolean;
  uncompressedSize?: number;
  unixPermissions?: number | string | null;
}

export interface ImportInspection {
  accepted: ReadonlyArray<{ path: string; size: number }>;
  skipped: ReadonlyArray<{ path: string; reason: string | null }>;
  fileCount: number;
  skippedCount: number;
  totalBytes: number;
  scriptFiles: number;
}

export const importLimits: Readonly<{
  maxArchiveBytes: number;
  maxEntries: number;
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
  maxPathLength: number;
}>;
export function normalizeArchivePath(input: string): string;
export function classifyArchivePath(input: string): { path: string; importable: boolean; reason: string | null };
export function isSymlinkMode(mode: number | string | null | undefined): boolean;
export function inspectArchive(input: { archiveBytes: number; entries: ArchiveEntryDescriptor[] }): ImportInspection;
export function decodeImportedText(bytes: Uint8Array, path: string): string;
export function stableImportId(path: string, type?: string): string;
