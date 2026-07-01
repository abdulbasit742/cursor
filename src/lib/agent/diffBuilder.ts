import { getFileContentByPath } from "./applyPatch";
import type { AgentDiffLine, AgentFileChange, AgentFileDiff } from "./types";
import type { FileItem } from "@/store/useStore";

function buildLineDiff(before: string, after: string): AgentDiffLine[] {
  const oldLines = before.length > 0 ? before.split("\n") : [];
  const newLines = after.length > 0 ? after.split("\n") : [];
  const rows = oldLines.length + 1;
  const columns = newLines.length + 1;
  const table = Array.from({ length: rows }, () => Array(columns).fill(0));

  for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex--) {
    for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex--) {
      if (oldLines[oldIndex] === newLines[newIndex]) {
        table[oldIndex][newIndex] = table[oldIndex + 1][newIndex + 1] + 1;
      } else {
        table[oldIndex][newIndex] = Math.max(
          table[oldIndex + 1][newIndex],
          table[oldIndex][newIndex + 1]
        );
      }
    }
  }

  const lines: AgentDiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldLines.length && newIndex < newLines.length) {
    if (oldLines[oldIndex] === newLines[newIndex]) {
      lines.push({
        type: "context",
        oldLineNumber: oldIndex + 1,
        newLineNumber: newIndex + 1,
        text: oldLines[oldIndex]
      });
      oldIndex++;
      newIndex++;
    } else if (table[oldIndex + 1][newIndex] >= table[oldIndex][newIndex + 1]) {
      lines.push({
        type: "removed",
        oldLineNumber: oldIndex + 1,
        text: oldLines[oldIndex]
      });
      oldIndex++;
    } else {
      lines.push({
        type: "added",
        newLineNumber: newIndex + 1,
        text: newLines[newIndex]
      });
      newIndex++;
    }
  }

  while (oldIndex < oldLines.length) {
    lines.push({
      type: "removed",
      oldLineNumber: oldIndex + 1,
      text: oldLines[oldIndex]
    });
    oldIndex++;
  }

  while (newIndex < newLines.length) {
    lines.push({
      type: "added",
      newLineNumber: newIndex + 1,
      text: newLines[newIndex]
    });
    newIndex++;
  }

  return lines;
}

export function buildFileDiff(files: FileItem[], change: AgentFileChange): AgentFileDiff {
  const before = getFileContentByPath(files, change.path);
  const after = change.action === "delete" ? "" : change.content || "";
  const lines = buildLineDiff(before, after);

  return {
    id: change.id,
    path: change.path,
    action: change.action,
    title: change.title,
    summary: change.summary,
    before,
    after,
    lines,
    stats: {
      added: lines.filter((line) => line.type === "added").length,
      removed: lines.filter((line) => line.type === "removed").length
    }
  };
}

export function buildAgentDiff(files: FileItem[], changes: AgentFileChange[]) {
  return changes.map((change) => buildFileDiff(files, change));
}
