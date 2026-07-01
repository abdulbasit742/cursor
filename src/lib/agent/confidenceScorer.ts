import type {
  AgentConfidenceScore,
  AgentFileChange,
  AgentReviewFinding,
  AgentValidationIssue
} from "./types";

export function scoreAgentConfidence({
  changes,
  validationIssues,
  reviewFindings
}: {
  changes: AgentFileChange[];
  validationIssues: AgentValidationIssue[];
  reviewFindings: AgentReviewFinding[];
}): AgentConfidenceScore {
  const reasons: string[] = [];
  let score = 86;

  const errorCount =
    validationIssues.filter((issue) => issue.severity === "error").length +
    reviewFindings.filter((finding) => finding.severity === "error").length;
  const warningCount =
    validationIssues.filter((issue) => issue.severity === "warning").length +
    reviewFindings.filter((finding) => finding.severity === "warning").length;

  if (changes.length === 0) {
    score -= 45;
    reasons.push("No file changes generated.");
  }

  if (changes.length > 8) {
    score -= 10;
    reasons.push("Large multi-file patch.");
  }

  if (errorCount > 0) {
    score -= errorCount * 22;
    reasons.push(`${errorCount} blocking issue(s).`);
  }

  if (warningCount > 0) {
    score -= warningCount * 8;
    reasons.push(`${warningCount} warning(s).`);
  }

  if (changes.some((change) => change.action === "delete")) {
    score -= 8;
    reasons.push("Patch includes file deletion.");
  }

  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
    label: finalScore >= 78 ? "high" : finalScore >= 52 ? "medium" : "low",
    reasons: reasons.length > 0 ? reasons : ["Patch is scoped and validation passed."]
  };
}
