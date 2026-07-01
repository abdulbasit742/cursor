import type { AgentProjectFile } from "@/lib/agent/types";
import { getLanguageWeight } from "./languageDetection";

export interface RankedProjectFile extends AgentProjectFile {
  score: number;
  reasons: string[];
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_./-]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function countMatches(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.reduce((score, term) => {
    return score + (lower.includes(term) ? 1 : 0);
  }, 0);
}

export function rankProjectFiles({
  task,
  files,
  activeFilePath,
  maxFiles = 12
}: {
  task: string;
  files: AgentProjectFile[];
  activeFilePath?: string | null;
  maxFiles?: number;
}): RankedProjectFile[] {
  const terms = Array.from(new Set(tokenize(task)));

  const ranked = files.map((file) => {
    const reasons: string[] = [];
    let score = 0;

    if (file.path === activeFilePath) {
      score += 40;
      reasons.push("active file");
    }

    const pathMatches = countMatches(file.path, terms);
    if (pathMatches > 0) {
      score += pathMatches * 12;
      reasons.push("path matches task");
    }

    const contentMatches = countMatches(file.content.slice(0, 12000), terms);
    if (contentMatches > 0) {
      score += Math.min(contentMatches * 4, 28);
      reasons.push("content matches task");
    }

    const languageWeight = getLanguageWeight(file.language);
    score += languageWeight * 10;

    if (file.path.includes("store") || file.path.includes("lib/")) {
      score += 5;
      reasons.push("core logic");
    }

    if (file.path.includes("components/")) {
      score += 4;
      reasons.push("UI component");
    }

    if (file.size > 120000) {
      score -= 18;
      reasons.push("large file trimmed");
    }

    return {
      ...file,
      score,
      reasons: reasons.length > 0 ? reasons : ["baseline relevance"]
    };
  });

  return ranked
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, maxFiles);
}
