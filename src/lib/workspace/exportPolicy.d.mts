export interface WorkspaceExportNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: WorkspaceExportNode[];
}

export interface ExportEntry {
  path: string;
  content: string;
  bytes: number;
}

export interface SkippedExportEntry {
  path: string;
  reason: string;
}

export interface ExportPlan {
  accepted: readonly ExportEntry[];
  skipped: readonly SkippedExportEntry[];
  fileCount: number;
  skippedCount: number;
  totalBytes: number;
}

export const exportLimits: Readonly<{
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
  maxDepth: number;
}>;

export function prepareProjectExport(files: WorkspaceExportNode[]): ExportPlan;
export function formatExportReview(plan: ExportPlan): string;
