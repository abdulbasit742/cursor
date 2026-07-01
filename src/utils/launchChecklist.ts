import type { FileItem } from "@/store/useStore";
import { flattenFiles } from "@/utils/fileTree";
import { analyzeProjectDiagnostics } from "@/utils/projectDiagnostics";
import { getProjectStats } from "@/utils/projectStats";

export type LaunchChecklistCategory =
  | "structure"
  | "quality"
  | "security"
  | "performance"
  | "docs"
  | "agent";

export type LaunchChecklistStatus = "pass" | "warning" | "fail";

export interface LaunchChecklistItem {
  id: string;
  category: LaunchChecklistCategory;
  title: string;
  description: string;
  status: LaunchChecklistStatus;
  action: string;
  weight: number;
}

export interface LaunchChecklistReport {
  score: number;
  status: "ready" | "almost" | "needs-work";
  generatedAt: string;
  items: LaunchChecklistItem[];
  passed: number;
  warnings: number;
  failed: number;
}

function statusFromBoolean(condition: boolean): LaunchChecklistStatus {
  return condition ? "pass" : "fail";
}

function hasFile(files: ReturnType<typeof flattenFiles>, matcher: RegExp): boolean {
  return files.some((file) => matcher.test(file.path));
}

function createItem(input: LaunchChecklistItem): LaunchChecklistItem {
  return input;
}

export function buildLaunchChecklist(files: FileItem[]): LaunchChecklistReport {
  const flatFiles = flattenFiles(files);
  const stats = getProjectStats(files);
  const diagnostics = analyzeProjectDiagnostics(files);
  const riskyFindings = diagnostics.diagnostics.filter((item) =>
    /eval|dynamic Function|innerHTML/i.test(`${item.title} ${item.message}`)
  );
  const emptyFiles = diagnostics.diagnostics.filter((item) => item.title === "Empty file");
  const largeFiles = stats.largestFiles.filter((file) => file.characters > 100_000);
  const hasEntryPoint =
    hasFile(flatFiles, /(^|\/)index\.html$/i) ||
    hasFile(flatFiles, /(^|\/)(src\/app|app)\/page\.tsx$/i) ||
    hasFile(flatFiles, /(^|\/)main\.(ts|tsx|js|jsx)$/i);
  const hasReadme = hasFile(flatFiles, /(^|\/)README\.md$/i);
  const hasStyles = flatFiles.some((file) => /css|scss|tailwind/i.test(file.language) || /\.css$/i.test(file.name));
  const hasScript = flatFiles.some((file) => /javascript|typescript/i.test(file.language));
  const contextFriendly = stats.totalCharacters <= 80_000;

  const items: LaunchChecklistItem[] = [
    createItem({
      id: "project-has-files",
      category: "structure",
      title: "Project has files",
      description: `${stats.totalFiles} file(s) and ${stats.totalFolders} folder(s) found.`,
      status: statusFromBoolean(stats.totalFiles > 0),
      action: "Create at least one file before exporting or asking the agent to work.",
      weight: 10,
    }),
    createItem({
      id: "entry-point",
      category: "structure",
      title: "Entry point exists",
      description: hasEntryPoint
        ? "A common app entry file was found."
        : "No index.html, app/page.tsx, src/app/page.tsx, or main file was found.",
      status: statusFromBoolean(hasEntryPoint),
      action: "Add an entry point so preview, export, and agents have a clear starting file.",
      weight: 12,
    }),
    createItem({
      id: "docs-readme",
      category: "docs",
      title: "README exists",
      description: hasReadme ? "README.md is present." : "README.md is missing from this project.",
      status: hasReadme ? "pass" : "warning",
      action: "Add README.md with setup, features, and known limitations.",
      weight: 8,
    }),
    createItem({
      id: "no-diagnostic-errors",
      category: "quality",
      title: "No blocking diagnostics",
      description: `${diagnostics.errors} error(s), ${diagnostics.warnings} warning(s), ${diagnostics.info} info item(s).`,
      status: diagnostics.errors === 0 ? "pass" : "fail",
      action: "Open Problems and fix missing assets or duplicate paths first.",
      weight: 18,
    }),
    createItem({
      id: "warnings-under-control",
      category: "quality",
      title: "Warnings under control",
      description: `${diagnostics.warnings} warning(s) found.`,
      status: diagnostics.warnings === 0 ? "pass" : diagnostics.warnings <= 5 ? "warning" : "fail",
      action: "Review warnings before sharing or shipping the project.",
      weight: 10,
    }),
    createItem({
      id: "no-risky-javascript",
      category: "security",
      title: "No risky JavaScript patterns",
      description: `${riskyFindings.length} risky pattern(s) found.`,
      status: riskyFindings.length === 0 ? "pass" : "fail",
      action: "Avoid eval, new Function, and unsafe innerHTML assignments.",
      weight: 16,
    }),
    createItem({
      id: "empty-files",
      category: "quality",
      title: "No empty files",
      description: `${emptyFiles.length} empty file(s) found.`,
      status: emptyFiles.length === 0 ? "pass" : "warning",
      action: "Remove empty files or add starter content before export.",
      weight: 6,
    }),
    createItem({
      id: "styles-and-script",
      category: "structure",
      title: "Styles and script coverage",
      description: `Styles: ${hasStyles ? "yes" : "no"}, scripts: ${hasScript ? "yes" : "no"}.`,
      status: hasStyles || hasScript ? "pass" : "warning",
      action: "For richer apps, add CSS and JavaScript or TypeScript files.",
      weight: 6,
    }),
    createItem({
      id: "size-control",
      category: "performance",
      title: "Project size is controlled",
      description: `${stats.totalCharacters} total character(s), ${largeFiles.length} very large file(s).`,
      status: largeFiles.length === 0 ? "pass" : "warning",
      action: "Split or trim huge files so preview and AI context stay fast.",
      weight: 8,
    }),
    createItem({
      id: "agent-context-friendly",
      category: "agent",
      title: "Agent context friendly",
      description: contextFriendly
        ? "Project fits comfortably into the Context Pack budget."
        : "Project may need trimming before sending to smaller coding models.",
      status: contextFriendly ? "pass" : "warning",
      action: "Use Context Pack with a higher budget or reduce large files.",
      weight: 6,
    }),
  ];

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const earnedWeight = items.reduce((sum, item) => {
    if (item.status === "pass") return sum + item.weight;
    if (item.status === "warning") return sum + item.weight * 0.55;
    return sum;
  }, 0);
  const score = Math.round((earnedWeight / totalWeight) * 100);

  return {
    score,
    status: score >= 90 ? "ready" : score >= 70 ? "almost" : "needs-work",
    generatedAt: new Date().toISOString(),
    items,
    passed: items.filter((item) => item.status === "pass").length,
    warnings: items.filter((item) => item.status === "warning").length,
    failed: items.filter((item) => item.status === "fail").length,
  };
}

export function formatLaunchChecklist(report: LaunchChecklistReport): string {
  const lines = [
    `Launch Score: ${report.score}/100`,
    `Status: ${report.status}`,
    `Generated: ${report.generatedAt}`,
    "",
    "Checklist:",
    ...report.items.map(
      (item) => `- [${item.status.toUpperCase()}] ${item.title}: ${item.description} Action: ${item.action}`
    ),
  ];

  return lines.join("\n");
}
