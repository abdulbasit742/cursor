import type { AgentFileChange, AgentReviewFinding } from "./types";

export function reviewAgentPlan(changes: AgentFileChange[]): AgentReviewFinding[] {
  const findings: AgentReviewFinding[] = [];

  for (const change of changes) {
    const content = change.content || "";

    if (change.action === "delete") {
      findings.push({
        path: change.path,
        severity: "warning",
        message: "File deletion should be reviewed before applying."
      });
      continue;
    }

    if (content.includes("any")) {
      findings.push({
        path: change.path,
        severity: "info",
        message: "Generated code contains `any`; consider tightening types later."
      });
    }

    if (content.includes("dangerouslySetInnerHTML")) {
      findings.push({
        path: change.path,
        severity: "warning",
        message: "dangerouslySetInnerHTML can create XSS risk if input is not trusted."
      });
    }

    if (content.includes("eval(") || content.includes("new Function(")) {
      findings.push({
        path: change.path,
        severity: "warning",
        message: "Dynamic code execution found. Review security implications."
      });
    }

    if (change.path.endsWith(".tsx") && !content.includes("\"use client\"")) {
      const usesHooks =
        content.includes("useState(") ||
        content.includes("useEffect(") ||
        content.includes("useMemo(");

      if (usesHooks) {
        findings.push({
          path: change.path,
          severity: "error",
          message: "React hooks in App Router client component need `use client`."
        });
      }
    }
  }

  return findings;
}
