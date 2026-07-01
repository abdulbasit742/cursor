import type { FileItem } from "@/store/useStore";
import { flattenFiles, type FlatFile } from "@/utils/fileTree";
import { analyzeProjectDiagnostics } from "@/utils/projectDiagnostics";
import { getProjectStats } from "@/utils/projectStats";

export interface ContextPackOptions {
  maxCharacters: number;
  includeDiagnostics: boolean;
  includeStats: boolean;
}

export interface ContextPackFile {
  path: string;
  language: string;
  characters: number;
  includedCharacters: number;
  truncated: boolean;
}

export interface ContextPack {
  text: string;
  files: ContextPackFile[];
  totalCharacters: number;
  usedCharacters: number;
  truncatedFiles: number;
  generatedAt: string;
}

const DEFAULT_MAX_CHARACTERS = 24_000;
const MIN_FILE_BUDGET = 600;
const MAX_SINGLE_FILE_BUDGET = 8_000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeOptions(options?: Partial<ContextPackOptions>): ContextPackOptions {
  return {
    maxCharacters: clamp(options?.maxCharacters ?? DEFAULT_MAX_CHARACTERS, 4_000, 80_000),
    includeDiagnostics: options?.includeDiagnostics ?? true,
    includeStats: options?.includeStats ?? true,
  };
}

function isLikelyImportant(file: FlatFile): boolean {
  return /(^|\/)(package\.json|README\.md|tsconfig\.json|next\.config\.(js|mjs|ts)|tailwind\.config\.(js|ts)|src\/app\/page\.tsx|src\/store\/useStore\.ts)$/i.test(
    file.path
  );
}

function scoreFile(file: FlatFile): number {
  let score = 0;

  if (isLikelyImportant(file)) score += 120;
  if (file.path.includes("/app/") || file.path.startsWith("src/app/")) score += 40;
  if (file.path.includes("/components/") || file.path.startsWith("src/components/")) score += 35;
  if (file.path.includes("/lib/") || file.path.startsWith("src/lib/")) score += 25;
  if (file.path.includes("/utils/") || file.path.startsWith("src/utils/")) score += 20;
  if (file.path.includes("/store/") || file.path.startsWith("src/store/")) score += 30;
  if (/\.(ts|tsx|js|jsx|json|md|css|html)$/i.test(file.name)) score += 10;
  if (file.content.length > 60_000) score -= 35;

  return score;
}

function sortFilesForContext(files: FlatFile[]): FlatFile[] {
  return [...files].sort((a, b) => {
    const scoreDelta = scoreFile(b) - scoreFile(a);
    if (scoreDelta !== 0) return scoreDelta;
    return a.path.localeCompare(b.path);
  });
}

function createProjectTree(files: FlatFile[]): string {
  return files.map((file) => `- ${file.path} (${file.language || "plaintext"})`).join("\n");
}

function createStatsBlock(files: FileItem[]): string {
  const stats = getProjectStats(files);
  const languages = stats.languages
    .slice(0, 12)
    .map((language) => `- ${language.language}: ${language.files} files, ${language.lines} lines`)
    .join("\n");

  return [
    "## Project Stats",
    `Files: ${stats.totalFiles}`,
    `Folders: ${stats.totalFolders}`,
    `Lines: ${stats.totalLines}`,
    `Characters: ${stats.totalCharacters}`,
    "",
    "### Languages",
    languages || "- No language data",
  ].join("\n");
}

function createDiagnosticsBlock(files: FileItem[]): string {
  const report = analyzeProjectDiagnostics(files);
  const diagnostics = report.diagnostics
    .slice(0, 30)
    .map((item) => {
      const location = item.lineNumber ? `${item.path}:${item.lineNumber}` : item.path;
      return `- [${item.severity}] ${location} - ${item.title}: ${item.message}`;
    })
    .join("\n");

  return [
    "## Diagnostics",
    `Errors: ${report.errors}`,
    `Warnings: ${report.warnings}`,
    `Info: ${report.info}`,
    "",
    diagnostics || "- No diagnostics found",
  ].join("\n");
}

function trimContent(content: string, budget: number): { content: string; truncated: boolean } {
  if (content.length <= budget) {
    return { content, truncated: false };
  }

  const headBudget = Math.max(300, Math.floor(budget * 0.72));
  const tailBudget = Math.max(200, budget - headBudget);
  const head = content.slice(0, headBudget).trimEnd();
  const tail = content.slice(Math.max(0, content.length - tailBudget)).trimStart();

  return {
    content: `${head}\n\n/* ...file truncated for context budget... */\n\n${tail}`,
    truncated: true,
  };
}

function createFileBlock(file: FlatFile, budget: number) {
  const trimmed = trimContent(file.content, budget);
  const fenceLanguage = file.language === "plaintext" ? "" : file.language;

  return {
    text: [`### ${file.path}`, `\`\`\`${fenceLanguage}`, trimmed.content, "```"].join("\n"),
    includedCharacters: trimmed.content.length,
    truncated: trimmed.truncated,
  };
}

export function buildContextPack(
  files: FileItem[],
  partialOptions?: Partial<ContextPackOptions>
): ContextPack {
  const options = normalizeOptions(partialOptions);
  const flatFiles = sortFilesForContext(flattenFiles(files));
  const headerBlocks = [
    "# AI Code Editor Context Pack",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Instruction",
    "Use this project context to plan, review, or modify the code. Prefer small safe patches and preserve existing app behavior.",
    "",
    "## Project Tree",
    createProjectTree(flatFiles),
  ];

  if (options.includeStats) headerBlocks.push("", createStatsBlock(files));
  if (options.includeDiagnostics) headerBlocks.push("", createDiagnosticsBlock(files));

  headerBlocks.push("", "## Files");

  const fileBudget = Math.max(
    MIN_FILE_BUDGET,
    Math.min(MAX_SINGLE_FILE_BUDGET, Math.floor(options.maxCharacters / Math.max(1, flatFiles.length)))
  );

  const includedFiles: ContextPackFile[] = [];
  const textParts: string[] = [headerBlocks.join("\n")];
  let usedCharacters = textParts[0].length;

  for (const file of flatFiles) {
    const remaining = options.maxCharacters - usedCharacters;
    if (remaining < MIN_FILE_BUDGET) break;

    const budget = Math.min(fileBudget, remaining - 80);
    const block = createFileBlock(file, budget);
    const blockText = `\n\n${block.text}`;

    if (usedCharacters + blockText.length > options.maxCharacters && includedFiles.length > 0) {
      break;
    }

    textParts.push(blockText);
    usedCharacters += blockText.length;
    includedFiles.push({
      path: file.path,
      language: file.language || "plaintext",
      characters: file.content.length,
      includedCharacters: block.includedCharacters,
      truncated: block.truncated,
    });
  }

  return {
    text: textParts.join(""),
    files: includedFiles,
    totalCharacters: flatFiles.reduce((sum, file) => sum + file.content.length, 0),
    usedCharacters,
    truncatedFiles: includedFiles.filter((file) => file.truncated).length,
    generatedAt: new Date().toISOString(),
  };
}
