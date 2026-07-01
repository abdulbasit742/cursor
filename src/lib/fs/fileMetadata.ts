import type { VirtualFile } from "./virtualFS";

export interface FileMetadata {
  extension: string;
  language: string;
  isBinary: boolean;
  isImage: boolean;
  isText: boolean;
  lineCount: number;
  wordCount: number;
  characterCount: number;
  sizeKB: number;
}

const languageMap: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript React",
  ".js": "JavaScript",
  ".jsx": "JavaScript React",
  ".json": "JSON",
  ".css": "CSS",
  ".scss": "SCSS",
  ".html": "HTML",
  ".md": "Markdown",
  ".py": "Python",
  ".java": "Java",
  ".go": "Go",
  ".rs": "Rust",
  ".php": "PHP",
  ".rb": "Ruby",
  ".cpp": "C++",
  ".c": "C",
  ".sh": "Shell",
  ".yaml": "YAML",
  ".yml": "YAML",
};

const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];
const binaryExtensions = [".exe", ".dll", ".bin", ".zip", ".tar", ".gz", ".pdf"];

export function getFileExtension(path: string): string {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index).toLowerCase();
}

export function getFileLanguage(extension: string): string {
  return languageMap[extension] ?? "Plain Text";
}

export function isImageFile(extension: string): boolean {
  return imageExtensions.includes(extension);
}

export function isBinaryFile(extension: string): boolean {
  return binaryExtensions.includes(extension);
}

export function calculateLineCount(content: string): number {
  if (!content) return 0;
  return content.split(/\r?\n/).length;
}

export function calculateWordCount(content: string): number {
  if (!content.trim()) return 0;
  return content.trim().split(/\s+/).length;
}

export function getFileMetadata(file: VirtualFile): FileMetadata {
  const extension = getFileExtension(file.path);
  const content = file.content ?? "";
  const isBinary = isBinaryFile(extension);
  const isImage = isImageFile(extension);

  return {
    extension,
    language: getFileLanguage(extension),
    isBinary,
    isImage,
    isText: !isBinary && file.type === "file",
    lineCount: calculateLineCount(content),
    wordCount: calculateWordCount(content),
    characterCount: content.length,
    sizeKB: Math.round((file.size / 1024) * 100) / 100,
  };
}

export function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function getReadableFileType(file: VirtualFile): string {
  if (file.type === "directory") return "Directory";
  return getFileLanguage(getFileExtension(file.path));
}
