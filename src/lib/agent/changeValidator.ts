import { sanitizeAgentPath } from "./tools";
import type {
  AgentChangeValidation,
  AgentFileChange,
  AgentProjectFile,
  AgentValidationIssue
} from "./types";

const MAX_CHANGED_FILES = 24;
const MAX_FILE_CONTENT_CHARS = 260000;
const SECRET_PATTERNS = [
  /OPENAI_API_KEY\s*=\s*['"][^'"]+/i,
  /sk-[a-zA-Z0-9_-]{20,}/,
  /BEGIN\s+(RSA|OPENSSH|PRIVATE)\s+KEY/i,
  /password\s*[:=]\s*['"][^'"]{6,}/i
];

function issue(
  path: string,
  severity: AgentValidationIssue["severity"],
  message: string
): AgentValidationIssue {
  return {
    path,
    severity,
    message
  };
}

export function validateAgentChanges({
  changes,
  projectFiles
}: {
  changes: AgentFileChange[];
  projectFiles: AgentProjectFile[];
}): AgentChangeValidation {
  const issues: AgentValidationIssue[] = [];
  const safeChanges: AgentFileChange[] = [];
  const rejectedChanges: AgentFileChange[] = [];
  const existingPaths = new Set(projectFiles.map((file) => file.path));
  const seenPaths = new Set<string>();

  if (changes.length > MAX_CHANGED_FILES) {
    issues.push(
      issue(
        "project",
        "warning",
        `Large patch: ${changes.length} files changed. Review carefully.`
      )
    );
  }

  for (const change of changes) {
    const sanitizedPath = sanitizeAgentPath(change.path);
    const normalizedChange = {
      ...change,
      path: sanitizedPath
    };
    const pathIssues: AgentValidationIssue[] = [];

    if (!sanitizedPath) {
      pathIssues.push(issue(change.path || "unknown", "error", "Missing file path."));
    }

    if (seenPaths.has(sanitizedPath)) {
      pathIssues.push(issue(sanitizedPath, "error", "Duplicate change for same path."));
    }

    if (change.action !== "create" && !existingPaths.has(sanitizedPath)) {
      pathIssues.push(
        issue(sanitizedPath, "warning", "Path does not exist yet; it will be treated carefully.")
      );
    }

    if (change.action !== "delete") {
      const content = change.content || "";

      if (!content.trim()) {
        pathIssues.push(issue(sanitizedPath, "error", "Generated file content is empty."));
      }

      if (content.length > MAX_FILE_CONTENT_CHARS) {
        pathIssues.push(issue(sanitizedPath, "error", "Generated file is too large."));
      }

      if (SECRET_PATTERNS.some((pattern) => pattern.test(content))) {
        pathIssues.push(issue(sanitizedPath, "error", "Possible secret detected in generated code."));
      }
    }

    issues.push(...pathIssues);
    seenPaths.add(sanitizedPath);

    if (pathIssues.some((item) => item.severity === "error")) {
      rejectedChanges.push(normalizedChange);
    } else {
      safeChanges.push(normalizedChange);
    }
  }

  return {
    ok: rejectedChanges.length === 0,
    issues,
    safeChanges,
    rejectedChanges
  };
}
