import type { FileItem } from "@/store/useStore";
import { flattenFiles } from "@/utils/fileTree";

export interface LanguageStat {
  language: string;
  files: number;
  lines: number;
  characters: number;
}

export interface FileSizeStat {
  path: string;
  name: string;
  language: string;
  characters: number;
  lines: number;
}

export interface ProjectStats {
  totalFiles: number;
  totalFolders: number;
  totalLines: number;
  totalCharacters: number;
  averageFileLength: number;
  languages: LanguageStat[];
  largestFiles: FileSizeStat[];
}

function countFolders(files: FileItem[]): number {
  return files.reduce((count, file) => {
    if (file.type !== "folder") return count;
    return count + 1 + countFolders(file.children ?? []);
  }, 0);
}

function countLines(content: string): number {
  if (!content) return 0;
  return content.split(/\r?\n/).length;
}

export function getProjectStats(files: FileItem[]): ProjectStats {
  const flatFiles = flattenFiles(files);
  const languageMap = new Map<string, LanguageStat>();

  const fileStats: FileSizeStat[] = flatFiles.map((file) => {
    const lines = countLines(file.content);
    const characters = file.content.length;
    const language = file.language || "plaintext";
    const current = languageMap.get(language) ?? {
      language,
      files: 0,
      lines: 0,
      characters: 0,
    };

    languageMap.set(language, {
      ...current,
      files: current.files + 1,
      lines: current.lines + lines,
      characters: current.characters + characters,
    });

    return {
      path: file.path,
      name: file.name,
      language,
      lines,
      characters,
    };
  });

  const totalLines = fileStats.reduce((sum, file) => sum + file.lines, 0);
  const totalCharacters = fileStats.reduce((sum, file) => sum + file.characters, 0);

  return {
    totalFiles: flatFiles.length,
    totalFolders: countFolders(files),
    totalLines,
    totalCharacters,
    averageFileLength: flatFiles.length === 0 ? 0 : Math.round(totalCharacters / flatFiles.length),
    languages: Array.from(languageMap.values()).sort((a, b) => b.files - a.files),
    largestFiles: fileStats.sort((a, b) => b.characters - a.characters).slice(0, 8),
  };
}
