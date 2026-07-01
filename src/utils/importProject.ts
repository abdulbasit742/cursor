"use client";

import JSZip from "jszip";
import type { FileItem } from "@/store/useStore";
import { getLanguageFromName } from "@/utils/language";

const ignoredPathSegments = new Set([
  "",
  "__macosx",
  "node_modules",
  ".next",
  ".git",
  ".tools",
  "dist",
  "out",
]);

const binaryExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".exe",
  ".dll",
  ".wasm",
  ".ttf",
  ".otf",
  ".woff",
  ".woff2",
]);

function slugId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getExtension(path: string): string {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index).toLowerCase();
}

function shouldImportPath(path: string): boolean {
  const normalized = path.replace(/\\/g, "/").toLowerCase();
  const parts = normalized.split("/");

  if (parts.some((part) => ignoredPathSegments.has(part))) return false;
  if (parts.some((part) => part.startsWith(".")) && !normalized.endsWith(".env.example")) {
    return false;
  }

  return !binaryExtensions.has(getExtension(normalized));
}

function ensureFolder(level: FileItem[], pathParts: string[]): FileItem[] {
  let currentLevel = level;

  pathParts.forEach((part, index) => {
    const folderPath = pathParts.slice(0, index + 1).join("/");
    let folder = currentLevel.find((item) => item.type === "folder" && item.name === part);

    if (!folder) {
      folder = {
        id: `import-folder-${slugId(folderPath)}`,
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

export async function importProjectZip(file: File): Promise<FileItem[]> {
  const zip = await JSZip.loadAsync(file);
  const root: FileItem[] = [];
  const entries = Object.values(zip.files)
    .filter((entry) => !entry.dir && shouldImportPath(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const content = await entry.async("string");
    const parts = entry.name.replace(/\\/g, "/").split("/").filter(Boolean);
    const fileName = parts.pop();

    if (!fileName) continue;

    const targetLevel = ensureFolder(root, parts);
    const fullPath = [...parts, fileName].join("/");

    targetLevel.push({
      id: `import-file-${slugId(fullPath)}`,
      name: fileName,
      language: getLanguageFromName(fileName),
      content,
      type: "file",
    });
  }

  return root;
}
