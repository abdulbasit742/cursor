import type { VirtualFile } from "./virtualFS";

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const INVALID_PATH_CHARS = /[<>:"|?*\u0000-\u001F]/;
const MAX_FILE_SIZE = 1024 * 1024 * 5;
const allowedExtensions = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".css",
  ".scss",
  ".html",
  ".md",
  ".txt",
  ".yml",
  ".yaml",
];

function getExtension(path: string): string {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index).toLowerCase();
}

export function validateFileName(name: string): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!name.trim()) errors.push("File name is required.");
  if (INVALID_PATH_CHARS.test(name)) errors.push("File name contains invalid characters.");
  if (name.length > 255) errors.push("File name exceeds 255 characters.");
  if (name.startsWith(".")) warnings.push("Hidden file detected.");

  return { valid: errors.length === 0, errors, warnings };
}

export function validateFilePath(path: string): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!path.trim()) errors.push("Path is required.");
  if (INVALID_PATH_CHARS.test(path)) errors.push("Path contains invalid characters.");
  if (path.includes("//") || path.includes("\\\\")) warnings.push("Duplicate path separators detected.");
  if (path.endsWith("/")) warnings.push("Path ends with a slash.");
  if (path.includes("..")) errors.push("Path cannot contain parent directory traversal.");

  return { valid: errors.length === 0, errors, warnings };
}

export function validateFileContent(content: string): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (content.length > MAX_FILE_SIZE) errors.push("File exceeds maximum size limit.");
  if (content.trim().length === 0) warnings.push("File content is empty.");

  return { valid: errors.length === 0, errors, warnings };
}

export function validateFileExtension(path: string): FileValidationResult {
  const extension = getExtension(path);
  const warnings: string[] = [];

  if (!extension) warnings.push("File has no extension.");
  if (extension && !allowedExtensions.includes(extension)) {
    warnings.push(`Unsupported extension: ${extension}`);
  }

  return { valid: true, errors: [], warnings };
}

export function validateVirtualFile(file: VirtualFile): FileValidationResult {
  const results = [
    validateFileName(file.name),
    validateFilePath(file.path),
    validateFileExtension(file.path),
    file.type === "file" ? validateFileContent(file.content ?? "") : { valid: true, errors: [], warnings: [] },
  ];

  return {
    valid: results.every((result) => result.valid),
    errors: results.flatMap((result) => result.errors),
    warnings: results.flatMap((result) => result.warnings),
  };
}

export function isValidFile(file: VirtualFile): boolean {
  return validateVirtualFile(file).valid;
}
