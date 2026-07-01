export type ErrorSeverity = "info" | "warning" | "error" | "critical";

export interface InterpretedError {
  severity: ErrorSeverity;
  title: string;
  explanation: string;
  suggestedFix: string;
  category: string;
  rawMessage: string;
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function interpretError(error: unknown): InterpretedError {
  const message = normalizeError(error);
  const lower = message.toLowerCase();

  if (lower.includes("cannot find module") || lower.includes("module not found")) {
    return {
      severity: "error",
      title: "Missing Module",
      explanation: "A required dependency or local file could not be resolved.",
      suggestedFix: "Check import paths, verify file existence, and install missing packages.",
      category: "module-resolution",
      rawMessage: message,
    };
  }

  if (lower.includes("typescript") || lower.includes("ts2322") || lower.includes("is not assignable")) {
    return {
      severity: "error",
      title: "TypeScript Type Error",
      explanation: "Type safety rules failed during compilation.",
      suggestedFix: "Review interfaces, generics, props, and inferred types.",
      category: "typescript",
      rawMessage: message,
    };
  }

  if (lower.includes("network") || lower.includes("fetch failed") || lower.includes("timeout")) {
    return {
      severity: "warning",
      title: "Network Failure",
      explanation: "The application could not complete a network request.",
      suggestedFix: "Check connection, retry requests, and add fallback handling.",
      category: "network",
      rawMessage: message,
    };
  }

  if (lower.includes("unexpected token") || lower.includes("syntaxerror")) {
    return {
      severity: "critical",
      title: "Syntax Error",
      explanation: "The parser encountered invalid syntax.",
      suggestedFix: "Inspect recent edits and validate syntax structure.",
      category: "syntax",
      rawMessage: message,
    };
  }

  if (lower.includes("permission denied") || lower.includes("eacces")) {
    return {
      severity: "critical",
      title: "Permission Denied",
      explanation: "The process does not have access rights for this action.",
      suggestedFix: "Check filesystem permissions and process privileges.",
      category: "permissions",
      rawMessage: message,
    };
  }

  return {
    severity: "error",
    title: "Unknown Error",
    explanation: "An unclassified runtime or build error occurred.",
    suggestedFix: "Inspect logs, stack traces, and isolate the failing component.",
    category: "unknown",
    rawMessage: message,
  };
}

export function isCriticalError(interpreted: InterpretedError): boolean {
  return interpreted.severity === "critical";
}

export function isRecoverableError(interpreted: InterpretedError): boolean {
  return interpreted.severity === "warning" || interpreted.severity === "error";
}

export function summarizeError(interpreted: InterpretedError): string {
  return `[${interpreted.severity.toUpperCase()}] ${interpreted.title}: ${
    interpreted.suggestedFix
  }`;
}

export function createErrorLog(interpreted: InterpretedError): string {
  return [
    `Error Category: ${interpreted.category}`,
    `Severity: ${interpreted.severity}`,
    `Title: ${interpreted.title}`,
    "",
    "Explanation:",
    interpreted.explanation,
    "",
    "Suggested Fix:",
    interpreted.suggestedFix,
    "",
    "Raw Message:",
    interpreted.rawMessage,
  ].join("\n");
}
