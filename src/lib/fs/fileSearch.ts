import type { VirtualFile } from "./virtualFS";

export interface FileSearchOptions {
  query: string;
  includeContent?: boolean;
  caseSensitive?: boolean;
  extensions?: string[];
  limit?: number;
}

export interface FileSearchResult {
  file: VirtualFile;
  score: number;
  matches: string[];
}

function normalize(value: string, caseSensitive: boolean): string {
  return caseSensitive ? value : value.toLowerCase();
}

function getExtension(path: string): string {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index).toLowerCase();
}

function calculateScore(
  file: VirtualFile,
  query: string,
  includeContent: boolean,
  caseSensitive: boolean
): FileSearchResult {
  const normalizedQuery = normalize(query, caseSensitive);
  const normalizedPath = normalize(file.path, caseSensitive);
  const normalizedName = normalize(file.name, caseSensitive);
  const matches: string[] = [];
  let score = 0;

  if (normalizedName.includes(normalizedQuery)) {
    score += 100;
    matches.push("name");
  }

  if (normalizedPath.includes(normalizedQuery)) {
    score += 50;
    matches.push("path");
  }

  if (includeContent && file.type === "file") {
    const content = normalize(file.content ?? "", caseSensitive);

    if (content.includes(normalizedQuery)) {
      score += 25;
      matches.push("content");
    }
  }

  return { file, score, matches };
}

export function searchFiles(files: VirtualFile[], options: FileSearchOptions): FileSearchResult[] {
  const {
    query,
    includeContent = true,
    caseSensitive = false,
    extensions,
    limit = 50,
  } = options;
  const trimmed = query.trim();

  if (!trimmed) return [];

  return files
    .filter((file) => !extensions?.length || extensions.includes(getExtension(file.path)))
    .map((file) => calculateScore(file, trimmed, includeContent, caseSensitive))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function searchByFileName(files: VirtualFile[], query: string): FileSearchResult[] {
  return searchFiles(files, { query, includeContent: false });
}

export function searchByContent(files: VirtualFile[], query: string): FileSearchResult[] {
  return searchFiles(files, { query, includeContent: true });
}

export function getRecentFiles(files: VirtualFile[], limit = 10): VirtualFile[] {
  return [...files]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}
