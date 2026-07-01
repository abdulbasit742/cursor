import type { FileItem } from "@/store/useStore";
import { flattenFiles, type FlatFile } from "@/utils/fileTree";

export interface ProjectSearchResult {
  file: FlatFile;
  score: number;
  path: string;
  lineNumber: number | null;
  snippet: string;
  matches: string[];
}

export interface ProjectSearchOptions {
  includeContent?: boolean;
  limit?: number;
}

function isProjectSearchResult(value: ProjectSearchResult | null): value is ProjectSearchResult {
  return value !== null;
}

function normalize(value: string): string {
  return value.toLowerCase();
}

function findContentMatch(content: string, query: string): { lineNumber: number; snippet: string } | null {
  const normalizedQuery = normalize(query);
  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    if (normalize(lines[index]).includes(normalizedQuery)) {
      return {
        lineNumber: index + 1,
        snippet: lines[index].trim() || lines[index],
      };
    }
  }

  return null;
}

function scoreFile(file: FlatFile, query: string, includeContent: boolean): ProjectSearchResult | null {
  const q = normalize(query.trim());
  const fileName = normalize(file.name);
  const path = normalize(file.path);
  const matches: string[] = [];
  let score = 0;
  let lineNumber: number | null = null;
  let snippet = file.path;

  if (!q) {
    return {
      file,
      score: 1,
      path: file.path,
      lineNumber: null,
      snippet: file.content.split(/\r?\n/)[0]?.trim() || file.path,
      matches: ["file"],
    };
  }

  if (fileName === q) {
    score += 160;
    matches.push("exact name");
  } else if (fileName.startsWith(q)) {
    score += 120;
    matches.push("name prefix");
  } else if (fileName.includes(q)) {
    score += 90;
    matches.push("name");
  }

  if (path.includes(q)) {
    score += 45;
    matches.push("path");
  }

  if (includeContent) {
    const contentMatch = findContentMatch(file.content, query);

    if (contentMatch) {
      score += 35;
      matches.push("content");
      lineNumber = contentMatch.lineNumber;
      snippet = contentMatch.snippet;
    }
  }

  if (score === 0) return null;

  return {
    file,
    score,
    path: file.path,
    lineNumber,
    snippet,
    matches,
  };
}

export function searchProjectFiles(
  files: FileItem[],
  query: string,
  options: ProjectSearchOptions = {}
): ProjectSearchResult[] {
  const includeContent = options.includeContent ?? true;
  const limit = options.limit ?? 80;
  const flatFiles = flattenFiles(files);

  return flatFiles
    .map((file) => scoreFile(file, query, includeContent))
    .filter(isProjectSearchResult)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.path.localeCompare(b.path);
    })
    .slice(0, limit);
}
