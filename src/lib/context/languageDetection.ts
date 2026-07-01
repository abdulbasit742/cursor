const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  html: "html",
  css: "css",
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  json: "json",
  md: "markdown",
  py: "python",
  sql: "sql",
  yml: "yaml",
  yaml: "yaml",
  rs: "rust",
  go: "go",
  java: "java",
  c: "c",
  h: "c",
  cpp: "cpp",
  cs: "csharp",
  php: "php",
  rb: "ruby",
  sh: "shell",
  ps1: "powershell",
  env: "plaintext"
};

const SOURCE_EXTENSIONS = new Set([
  "html",
  "css",
  "js",
  "jsx",
  "ts",
  "tsx",
  "json",
  "md",
  "py",
  "sql",
  "yml",
  "yaml",
  "rs",
  "go",
  "java",
  "c",
  "h",
  "cpp",
  "cs",
  "php",
  "rb",
  "sh",
  "ps1"
]);

const BINARY_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "ico",
  "pdf",
  "zip",
  "exe",
  "dll",
  "mp3",
  "mp4",
  "mov",
  "woff",
  "woff2",
  "ttf"
]);

export function getExtension(path: string) {
  const cleanPath = path.split("?")[0].split("#")[0];
  const lastPart = cleanPath.split(/[\\/]/).pop() || "";
  const dotIndex = lastPart.lastIndexOf(".");

  if (dotIndex === -1) return "";

  return lastPart.slice(dotIndex + 1).toLowerCase();
}

export function detectLanguageFromPath(path: string) {
  return EXTENSION_LANGUAGE_MAP[getExtension(path)] || "plaintext";
}

export function isLikelySourcePath(path: string) {
  const extension = getExtension(path);
  if (!extension) return false;

  return SOURCE_EXTENSIONS.has(extension);
}

export function isLikelyBinaryPath(path: string) {
  return BINARY_EXTENSIONS.has(getExtension(path));
}

export function getLanguageWeight(language: string) {
  if (["typescript", "javascript", "html", "css"].includes(language)) return 1;
  if (["json", "markdown", "sql", "yaml"].includes(language)) return 0.82;
  if (language === "plaintext") return 0.35;

  return 0.7;
}
