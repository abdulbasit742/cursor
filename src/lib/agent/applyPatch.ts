import type { FileItem } from "@/store/useStore";
import { flattenFiles } from "@/utils/fileTree";
import { getLanguageFromName } from "@/utils/language";
import { sanitizeAgentPath } from "./tools";
import type { AgentFileChange } from "./types";

export interface ApplyPatchResult {
  files: FileItem[];
  applied: AgentFileChange[];
  skipped: {
    change: AgentFileChange;
    reason: string;
  }[];
}

function createFile(pathPart: string, content: string): FileItem {
  return {
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: pathPart,
    language: getLanguageFromName(pathPart),
    content,
    type: "file"
  };
}

function createFolder(name: string, children: FileItem[] = []): FileItem {
  return {
    id: `folder-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    language: "plaintext",
    content: "",
    type: "folder",
    isOpen: true,
    children
  };
}

function upsertPath(files: FileItem[], path: string, content: string): FileItem[] {
  const parts = sanitizeAgentPath(path).split("/").filter(Boolean);
  if (parts.length === 0) return files;

  const insert = (items: FileItem[], depth: number): FileItem[] => {
    const name = parts[depth];
    const isFile = depth === parts.length - 1;
    const existingIndex = items.findIndex((item) => item.name === name);

    if (isFile) {
      if (existingIndex >= 0) {
        return items.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                type: "file",
                language: getLanguageFromName(name),
                content
              }
            : item
        );
      }

      return [...items, createFile(name, content)];
    }

    if (existingIndex >= 0) {
      return items.map((item, index) => {
        if (index !== existingIndex) return item;

        const children = item.type === "folder" ? item.children || [] : [];

        return {
          ...createFolder(name, insert(children, depth + 1)),
          id: item.id
        };
      });
    }

    return [...items, createFolder(name, insert([], depth + 1))];
  };

  return insert(files, 0);
}

function deletePath(files: FileItem[], path: string): FileItem[] {
  const target = sanitizeAgentPath(path);

  const remove = (items: FileItem[], basePath = ""): FileItem[] => {
    return items
      .filter((item) => {
        const itemPath = basePath ? `${basePath}/${item.name}` : item.name;
        return itemPath !== target;
      })
      .map((item) => {
        if (item.type !== "folder") return item;

        const itemPath = basePath ? `${basePath}/${item.name}` : item.name;

        return {
          ...item,
          children: remove(item.children || [], itemPath)
        };
      });
  };

  return remove(files);
}

export function getFileContentByPath(files: FileItem[], path: string) {
  const normalizedPath = sanitizeAgentPath(path);
  return flattenFiles(files).find((file) => file.path === normalizedPath)?.content || "";
}

export function applyAgentPatch(
  files: FileItem[],
  changes: AgentFileChange[]
): ApplyPatchResult {
  let nextFiles = files;
  const applied: AgentFileChange[] = [];
  const skipped: ApplyPatchResult["skipped"] = [];

  changes.forEach((change) => {
    try {
      if (change.action === "delete") {
        nextFiles = deletePath(nextFiles, change.path);
      } else {
        nextFiles = upsertPath(nextFiles, change.path, change.content || "");
      }

      applied.push(change);
    } catch (error) {
      skipped.push({
        change,
        reason: error instanceof Error ? error.message : "Unknown patch error"
      });
    }
  });

  return {
    files: nextFiles,
    applied,
    skipped
  };
}
