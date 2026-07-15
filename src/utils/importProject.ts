"use client";

import JSZip, { type JSZipObject } from "jszip";
import type { FileItem } from "@/store/useStore";
import { getLanguageFromName } from "@/utils/language";
import {
  decodeImportedText,
  importLimits,
  inspectArchive,
  normalizeArchivePath,
  stableImportId,
  type ImportInspection,
} from "@/lib/workspace/importPolicy.mjs";

interface SizedZipObject extends JSZipObject {
  unsafeOriginalName?: string;
  unixPermissions?: number | string | null;
  _data?: { uncompressedSize?: number };
}

export interface ImportedProject {
  files: FileItem[];
  report: ImportInspection;
}

function ensureFolder(level: FileItem[], pathParts: string[]): FileItem[] {
  let currentLevel = level;

  pathParts.forEach((part, index) => {
    const folderPath = pathParts.slice(0, index + 1).join("/");
    let folder = currentLevel.find((item) => item.type === "folder" && item.name === part);

    if (!folder) {
      folder = {
        id: stableImportId(folderPath, "folder"),
        name: part,
        language: "plaintext",
        content: "",
        type: "folder",
        isOpen: index < 2,
        children: [],
      };
      currentLevel.push(folder);
    }

    folder.children = folder.children ?? [];
    currentLevel = folder.children;
  });

  return currentLevel;
}

export async function importProjectZip(file: File): Promise<ImportedProject> {
  if (!(file instanceof File)) throw new TypeError("A ZIP file is required");
  if (file.size < 1 || file.size > importLimits.maxArchiveBytes) {
    throw new Error(`ZIP must be smaller than ${Math.round(importLimits.maxArchiveBytes / 1024 / 1024)} MB`);
  }

  const zip = await JSZip.loadAsync(file, {
    checkCRC32: true,
    createFolders: false,
  });
  const entries = Object.values(zip.files) as SizedZipObject[];
  const report = inspectArchive({
    archiveBytes: file.size,
    entries: entries.map((entry) => ({
      name: entry.unsafeOriginalName || entry.name,
      dir: entry.dir,
      uncompressedSize: entry._data?.uncompressedSize,
      unixPermissions: entry.unixPermissions,
    })),
  });

  const accepted = new Set(report.accepted.map((entry) => entry.path));
  const entryByPath = new Map<string, SizedZipObject>();
  for (const entry of entries) {
    if (entry.dir) continue;
    const path = normalizeArchivePath(entry.unsafeOriginalName || entry.name);
    if (accepted.has(path)) entryByPath.set(path, entry);
  }

  const root: FileItem[] = [];
  for (const descriptor of report.accepted) {
    const entry = entryByPath.get(descriptor.path);
    if (!entry) throw new Error(`ZIP entry disappeared during import: ${descriptor.path}`);
    const bytes = await entry.async("uint8array");
    if (bytes.byteLength !== descriptor.size) {
      throw new Error(`ZIP size mismatch for ${descriptor.path}`);
    }
    const content = decodeImportedText(bytes, descriptor.path);
    const parts = descriptor.path.split("/");
    const fileName = parts.pop();
    if (!fileName) continue;

    const targetLevel = ensureFolder(root, parts);
    targetLevel.push({
      id: stableImportId(descriptor.path, "file"),
      name: fileName,
      language: getLanguageFromName(fileName),
      content,
      type: "file",
    });
  }

  return { files: root, report };
}
