import type { VirtualFile } from "./virtualFS";

export type FileSortKey = "name" | "path" | "type" | "size" | "createdAt" | "updatedAt";
export type FileSortOrder = "asc" | "desc";

export interface FileSortOptions {
  key?: FileSortKey;
  order?: FileSortOrder;
  directoriesFirst?: boolean;
}

function compareValues(a: string | number, b: string | number, order: FileSortOrder): number {
  const result = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
  return order === "asc" ? result : -result;
}

export function sortFiles(files: VirtualFile[], options: FileSortOptions = {}): VirtualFile[] {
  const { key = "path", order = "asc", directoriesFirst = true } = options;

  return [...files].sort((a, b) => {
    if (directoriesFirst && a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }

    if (key === "size") return compareValues(a.size, b.size, order);
    if (key === "createdAt") {
      return compareValues(new Date(a.createdAt).getTime(), new Date(b.createdAt).getTime(), order);
    }
    if (key === "updatedAt") {
      return compareValues(new Date(a.updatedAt).getTime(), new Date(b.updatedAt).getTime(), order);
    }

    return compareValues(a[key], b[key], order);
  });
}

export function sortFilesByName(files: VirtualFile[]): VirtualFile[] {
  return sortFiles(files, { key: "name", order: "asc", directoriesFirst: true });
}

export function sortFilesByRecent(files: VirtualFile[]): VirtualFile[] {
  return sortFiles(files, { key: "updatedAt", order: "desc", directoriesFirst: false });
}

export function sortFilesBySize(files: VirtualFile[]): VirtualFile[] {
  return sortFiles(files, { key: "size", order: "desc", directoriesFirst: false });
}
