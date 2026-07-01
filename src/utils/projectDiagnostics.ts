import type { FileItem } from "@/store/useStore";
import { flattenFiles, type FlatFile } from "@/utils/fileTree";

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface ProjectDiagnostic {
  id: string;
  severity: DiagnosticSeverity;
  title: string;
  message: string;
  path: string;
  lineNumber: number | null;
  file: FlatFile;
  source: "html" | "javascript" | "css" | "project" | "quality";
}

export interface ProjectDiagnosticsReport {
  diagnostics: ProjectDiagnostic[];
  errors: number;
  warnings: number;
  info: number;
  generatedAt: string;
}

function getDirectory(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}

function normalizePath(path: string): string {
  const parts: string[] = [];

  path
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .forEach((part) => {
      if (part === ".") return;
      if (part === "..") {
        parts.pop();
        return;
      }
      parts.push(part);
    });

  return parts.join("/");
}

function resolveRelativePath(fromPath: string, target: string): string {
  if (/^(https?:)?\/\//i.test(target) || target.startsWith("data:") || target.startsWith("#")) {
    return target;
  }

  if (target.startsWith("/")) {
    return normalizePath(target);
  }

  const directory = getDirectory(fromPath);
  return normalizePath(directory ? `${directory}/${target}` : target);
}

function getLineNumber(content: string, index: number): number {
  return content.slice(0, Math.max(0, index)).split(/\r?\n/).length;
}

function createDiagnostic(
  file: FlatFile,
  severity: DiagnosticSeverity,
  title: string,
  message: string,
  source: ProjectDiagnostic["source"],
  lineNumber: number | null
): ProjectDiagnostic {
  return {
    id: `${severity}-${source}-${file.path}-${lineNumber ?? 0}-${title}`,
    severity,
    title,
    message,
    path: file.path,
    lineNumber,
    file,
    source,
  };
}

function extractAttributeTargets(content: string, tagPattern: RegExp, attribute: string): Array<{
  target: string;
  index: number;
}> {
  const results: Array<{ target: string; index: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(content)) !== null) {
    const tag = match[0];
    const attributeMatch = tag.match(new RegExp(`${attribute}=["']([^"']+)["']`, "i"));

    if (attributeMatch?.[1]) {
      results.push({
        target: attributeMatch[1],
        index: match.index,
      });
    }
  }

  return results;
}

function scanHtml(file: FlatFile, pathSet: Set<string>): ProjectDiagnostic[] {
  const diagnostics: ProjectDiagnostic[] = [];
  const content = file.content;

  if (!/<meta\s+name=["']viewport["']/i.test(content)) {
    diagnostics.push(
      createDiagnostic(
        file,
        "warning",
        "Missing viewport meta tag",
        "HTML previews can render poorly on mobile without a viewport meta tag.",
        "html",
        1
      )
    );
  }

  const linkedAssets = [
    ...extractAttributeTargets(content, /<link\b[^>]*>/gi, "href"),
    ...extractAttributeTargets(content, /<script\b[^>]*>/gi, "src"),
  ];

  linkedAssets.forEach(({ target, index }) => {
    const resolved = resolveRelativePath(file.path, target);
    const external = /^(https?:)?\/\//i.test(target) || target.startsWith("data:") || target.startsWith("#");

    if (!external && !pathSet.has(resolved)) {
      diagnostics.push(
        createDiagnostic(
          file,
          "error",
          "Missing linked asset",
          `Linked asset was not found: ${target}`,
          "html",
          getLineNumber(content, index)
        )
      );
    }
  });

  return diagnostics;
}

function scanTodoMarkers(file: FlatFile): ProjectDiagnostic[] {
  const diagnostics: ProjectDiagnostic[] = [];
  const markerPattern = /\b(TODO|FIXME|HACK)\b:?/gi;
  let match: RegExpExecArray | null;

  while ((match = markerPattern.exec(file.content)) !== null) {
    diagnostics.push(
      createDiagnostic(
        file,
        "info",
        `${match[1].toUpperCase()} marker`,
        "This file contains a work marker that should be reviewed before release.",
        "quality",
        getLineNumber(file.content, match.index)
      )
    );
  }

  return diagnostics;
}

function scanRiskyJavaScript(file: FlatFile): ProjectDiagnostic[] {
  const diagnostics: ProjectDiagnostic[] = [];
  const riskyPatterns: Array<{ pattern: RegExp; title: string; message: string }> = [
    {
      pattern: /\beval\s*\(/gi,
      title: "Avoid eval",
      message: "eval can execute unsafe code and should be replaced with safer parsing or explicit logic.",
    },
    {
      pattern: /new\s+Function\s*\(/gi,
      title: "Avoid dynamic Function",
      message: "Dynamic Function creation can execute unsafe code and is hard to audit.",
    },
    {
      pattern: /\.innerHTML\s*=/gi,
      title: "Review innerHTML assignment",
      message: "innerHTML can introduce XSS risk if any content comes from users or AI output.",
    },
  ];

  riskyPatterns.forEach(({ pattern, title, message }) => {
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(file.content)) !== null) {
      diagnostics.push(
        createDiagnostic(
          file,
          "warning",
          title,
          message,
          "javascript",
          getLineNumber(file.content, match.index)
        )
      );
    }
  });

  return diagnostics;
}

function scanBracketBalance(file: FlatFile): ProjectDiagnostic[] {
  if (!/\.(js|jsx|ts|tsx|css)$/i.test(file.name)) return [];

  const pairs: Array<{ open: string; close: string; label: string }> = [
    { open: "{", close: "}", label: "curly braces" },
    { open: "(", close: ")", label: "parentheses" },
    { open: "[", close: "]", label: "square brackets" },
  ];

  return pairs.flatMap(({ open, close, label }) => {
    const opened = file.content.split(open).length - 1;
    const closed = file.content.split(close).length - 1;

    if (opened === closed) return [];

    return [
      createDiagnostic(
        file,
        "warning",
        `Possible unmatched ${label}`,
        `Found ${opened} opening and ${closed} closing ${label}.`,
        "quality",
        null
      ),
    ];
  });
}

function scanFileQuality(file: FlatFile): ProjectDiagnostic[] {
  const diagnostics: ProjectDiagnostic[] = [];

  if (file.content.trim().length === 0) {
    diagnostics.push(
      createDiagnostic(file, "info", "Empty file", "This file has no content yet.", "quality", 1)
    );
  }

  if (file.content.length > 100_000) {
    diagnostics.push(
      createDiagnostic(
        file,
        "warning",
        "Large file",
        "Large files can slow project context building and AI requests.",
        "project",
        null
      )
    );
  }

  if (file.name.endsWith(".env") || file.path.includes(".env.local")) {
    diagnostics.push(
      createDiagnostic(
        file,
        "warning",
        "Sensitive environment file",
        "Avoid sharing environment files with secrets in exports or AI context.",
        "project",
        null
      )
    );
  }

  return diagnostics;
}

function scanDuplicatePaths(files: FlatFile[]): ProjectDiagnostic[] {
  const seen = new Map<string, FlatFile>();
  const diagnostics: ProjectDiagnostic[] = [];

  files.forEach((file) => {
    const existing = seen.get(file.path);

    if (existing) {
      diagnostics.push(
        createDiagnostic(
          file,
          "error",
          "Duplicate file path",
          `Another file already uses this path: ${existing.path}`,
          "project",
          null
        )
      );
      return;
    }

    seen.set(file.path, file);
  });

  return diagnostics;
}

export function analyzeProjectDiagnostics(files: FileItem[]): ProjectDiagnosticsReport {
  const flatFiles = flattenFiles(files);
  const pathSet = new Set(flatFiles.map((file) => file.path));
  const diagnostics = [
    ...scanDuplicatePaths(flatFiles),
    ...flatFiles.flatMap((file) => [
      ...scanFileQuality(file),
      ...scanTodoMarkers(file),
      ...scanBracketBalance(file),
      ...(/\.(html|htm)$/i.test(file.name) ? scanHtml(file, pathSet) : []),
      ...(/\.(js|jsx|ts|tsx|html)$/i.test(file.name) ? scanRiskyJavaScript(file) : []),
    ]),
  ].sort((a, b) => {
    const rank = { error: 0, warning: 1, info: 2 } as const;
    if (rank[a.severity] !== rank[b.severity]) return rank[a.severity] - rank[b.severity];
    if (a.path !== b.path) return a.path.localeCompare(b.path);
    return (a.lineNumber ?? 0) - (b.lineNumber ?? 0);
  });

  return {
    diagnostics,
    errors: diagnostics.filter((item) => item.severity === "error").length,
    warnings: diagnostics.filter((item) => item.severity === "warning").length,
    info: diagnostics.filter((item) => item.severity === "info").length,
    generatedAt: new Date().toISOString(),
  };
}
