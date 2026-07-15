import type { FileItem } from '@/store/useStore';

export class ProjectTreePolicyError extends Error {
  code: string;
  constructor(message: string, code?: string);
}

export interface CanonicalProjectTree {
  files: FileItem[];
  activeFileId: string | null;
  nodeCount: number;
  fileCount: number;
}

export function canonicalizeProjectTree(nodes: unknown[], activeFileId?: unknown): CanonicalProjectTree;

export const projectTreePolicy: Readonly<{
  MAX_DEPTH: number;
  MAX_NAME_CHARS: number;
  MAX_ID_CHARS: number;
}>;
