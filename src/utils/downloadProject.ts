"use client";

import JSZip from "jszip";
import type { FileItem } from "@/store/useStore";
import {
  formatExportReview,
  prepareProjectExport,
} from "@/lib/workspace/exportPolicy.mjs";

export interface ProjectDownloadResult {
  downloaded: boolean;
  includedFiles: number;
  skippedFiles: number;
}

export async function downloadProject(files: FileItem[]): Promise<ProjectDownloadResult> {
  try {
    const plan = prepareProjectExport(files);
    if (!window.confirm(formatExportReview(plan))) {
      return { downloaded: false, includedFiles: plan.fileCount, skippedFiles: plan.skippedCount };
    }

    const zip = new JSZip();
    for (const file of plan.accepted) zip.file(file.path, file.content);

    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ai-code-editor-project.safe.zip";
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);

    return { downloaded: true, includedFiles: plan.fileCount, skippedFiles: plan.skippedCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Project export failed";
    window.alert(`Project export was blocked: ${message}`);
    return { downloaded: false, includedFiles: 0, skippedFiles: 0 };
  }
}
