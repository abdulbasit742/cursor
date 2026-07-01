import type { PrioritizableSuggestion } from "./predictivePrioritizer";

export interface SuggestionFilterOptions {
  maxRisk?: PrioritizableSuggestion["risk"];
  minConfidence?: number;
  requiredTags?: string[];
  query?: string;
}

const riskRank = {
  low: 1,
  medium: 2,
  high: 3,
} as const;

export function filterSuggestions(
  suggestions: PrioritizableSuggestion[],
  options: SuggestionFilterOptions
): PrioritizableSuggestion[] {
  const maxRisk = options.maxRisk ?? "high";
  const minConfidence = options.minConfidence ?? 0;
  const query = options.query?.trim().toLowerCase();

  return suggestions.filter((item) => {
    const riskOk = riskRank[item.risk] <= riskRank[maxRisk];
    const confidenceOk = item.confidence >= minConfidence;
    const tagsOk =
      !options.requiredTags?.length ||
      options.requiredTags.every((tag) => item.tags?.includes(tag));
    const queryOk =
      !query ||
      [item.title, item.description, item.risk, item.impact, ...(item.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(query);

    return riskOk && confidenceOk && tagsOk && queryOk;
  });
}

export function removeDuplicateSuggestions(
  suggestions: PrioritizableSuggestion[]
): PrioritizableSuggestion[] {
  const seen = new Set<string>();

  return suggestions.filter((item) => {
    const key = `${item.title.trim().toLowerCase()}::${item.description.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function sortSuggestionsByConfidence(
  suggestions: PrioritizableSuggestion[]
): PrioritizableSuggestion[] {
  return [...suggestions].sort((a, b) => b.confidence - a.confidence);
}

export function groupSuggestionsByRisk(
  suggestions: PrioritizableSuggestion[]
): Record<PrioritizableSuggestion["risk"], PrioritizableSuggestion[]> {
  return {
    low: suggestions.filter((item) => item.risk === "low"),
    medium: suggestions.filter((item) => item.risk === "medium"),
    high: suggestions.filter((item) => item.risk === "high"),
  };
}
