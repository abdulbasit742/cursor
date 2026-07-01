export type AgentChangeAction = "create" | "update" | "delete";
export type AgentProvider = "openai" | "local";
export type AgentRiskLevel = "low" | "medium" | "high";
export type AgentRunPhase =
  | "idle"
  | "planning"
  | "validating"
  | "ready"
  | "applying"
  | "repaired"
  | "error";

export interface AgentProjectFile {
  path: string;
  name: string;
  language: string;
  content: string;
  size: number;
}

export interface AgentFileChange {
  id: string;
  action: AgentChangeAction;
  path: string;
  language?: string;
  title: string;
  summary: string;
  content?: string;
}

export interface AgentPlan {
  title: string;
  summary: string;
  steps: string[];
  changes: AgentFileChange[];
  risks: string[];
  commands: string[];
}

export interface AgentTaskPlan {
  title: string;
  intent: string;
  riskLevel: AgentRiskLevel;
  targetFiles: string[];
  steps: string[];
  acceptanceCriteria: string[];
  suggestedCommands: string[];
}

export interface AgentValidationIssue {
  path: string;
  severity: "error" | "warning";
  message: string;
}

export interface AgentChangeValidation {
  ok: boolean;
  issues: AgentValidationIssue[];
  safeChanges: AgentFileChange[];
  rejectedChanges: AgentFileChange[];
}

export interface AgentReviewFinding {
  path: string;
  severity: "info" | "warning" | "error";
  message: string;
}

export interface AgentConfidenceScore {
  score: number;
  label: "low" | "medium" | "high";
  reasons: string[];
}

export interface AgentDiffLine {
  type: "context" | "added" | "removed";
  oldLineNumber?: number;
  newLineNumber?: number;
  text: string;
}

export interface AgentFileDiff {
  id: string;
  path: string;
  action: AgentChangeAction;
  title: string;
  summary: string;
  before: string;
  after: string;
  lines: AgentDiffLine[];
  stats: {
    added: number;
    removed: number;
  };
}

export interface AgentRunInput {
  task: string;
  files: AgentProjectFile[];
  activeFilePath?: string | null;
  repoSummary?: string;
  provider?: AgentProvider | "auto";
}

export interface AgentRunResult {
  provider: AgentProvider;
  plan: AgentPlan;
  taskPlan: AgentTaskPlan;
  validation: AgentChangeValidation;
  review: AgentReviewFinding[];
  confidence: AgentConfidenceScore;
  notes: string[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AgentApiRequest {
  task: string;
  files: unknown[];
  activeFileId?: string | null;
  provider?: AgentProvider | "auto";
}
