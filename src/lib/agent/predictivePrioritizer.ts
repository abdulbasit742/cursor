export interface PrioritizableSuggestion {
  id: string;
  title: string;
  description: string;
  risk: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  confidence: number;
  tags?: string[];
}

export interface PrioritizedSuggestion extends PrioritizableSuggestion {
  priorityScore: number;
  reason: string;
}

const scoreMap = {
  low: 1,
  medium: 2,
  high: 3,
} as const;

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function prioritizeSuggestions(
  suggestions: PrioritizableSuggestion[]
): PrioritizedSuggestion[] {
  return suggestions
    .map((item) => {
      const confidence = clampConfidence(item.confidence);
      const impactScore = scoreMap[item.impact] * 30;
      const riskPenalty = scoreMap[item.risk] * 12;
      const confidenceScore = Math.round(confidence * 40);
      const priorityScore = Math.max(0, impactScore + confidenceScore - riskPenalty);

      return {
        ...item,
        confidence,
        priorityScore,
        reason: `Impact ${item.impact}, risk ${item.risk}, confidence ${Math.round(
          confidence * 100
        )}%`,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function getTopSuggestion(
  suggestions: PrioritizableSuggestion[]
): PrioritizedSuggestion | null {
  return prioritizeSuggestions(suggestions)[0] ?? null;
}
