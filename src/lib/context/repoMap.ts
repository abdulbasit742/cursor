import type { FileItem } from "@/store/useStore";
import { flattenFiles } from "@/utils/fileTree";
import {
  detectLanguageFromPath,
  isLikelyBinaryPath,
  isLikelySourcePath
} from "./languageDetection";

export interface RepoMapFile {
  id: string;
  path: string;
  name: string;
  language: string;
  size: number;
  isSource: boolean;
  isBinary: boolean;
}

export interface RepoMapDirectory {
  path: string;
  name: string;
  fileCount: number;
  totalSize: number;
}

export interface RepoMap {
  files: RepoMapFile[];
  directories: RepoMapDirectory[];
  languages: Record<string, number>;
  totalFiles: number;
  totalSize: number;
}

export function buildRepoMap(files: FileItem[]): RepoMap {
  const flatFiles = flattenFiles(files);
  const directories = new Map<string, RepoMapDirectory>();
  const languages: Record<string, number> = {};

  const mappedFiles = flatFiles.map((file) => {
    const language = file.language || detectLanguageFromPath(file.path);
    const size = file.content?.length || 0;
    const directoryPath = file.path.includes("/")
      ? file.path.split("/").slice(0, -1).join("/")
      : "";

    if (directoryPath) {
      const current = directories.get(directoryPath) || {
        path: directoryPath,
        name: directoryPath.split("/").pop() || directoryPath,
        fileCount: 0,
        totalSize: 0
      };

      current.fileCount += 1;
      current.totalSize += size;
      directories.set(directoryPath, current);
    }

    languages[language] = (languages[language] || 0) + 1;

    return {
      id: file.id,
      path: file.path,
      name: file.name,
      language,
      size,
      isSource: isLikelySourcePath(file.path),
      isBinary: isLikelyBinaryPath(file.path)
    };
  });

  return {
    files: mappedFiles,
    directories: Array.from(directories.values()).sort((a, b) =>
      a.path.localeCompare(b.path)
    ),
    languages,
    totalFiles: mappedFiles.length,
    totalSize: mappedFiles.reduce((sum, file) => sum + file.size, 0)
  };
}

export function summarizeRepoMap(repoMap: RepoMap) {
  const languageSummary = Object.entries(repoMap.languages)
    .sort((a, b) => b[1] - a[1])
    .map(([language, count]) => `${language}:${count}`)
    .join(", ");

  return [
    `files=${repoMap.totalFiles}`,
    `size=${repoMap.totalSize}`,
    `languages=${languageSummary || "none"}`,
    `directories=${repoMap.directories.map((directory) => directory.path).join(", ") || "root"}`
  ].join("\n");
}
