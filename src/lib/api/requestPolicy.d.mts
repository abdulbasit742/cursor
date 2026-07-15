export class RequestPolicyError extends Error {
  status: number;
  code: string;
  constructor(message: string, options?: { status?: number; code?: string });
}

export interface EditorPolicyEnvironment {
  EDITOR_ALLOWED_ORIGINS?: string;
  EDITOR_REMOTE_AI_ENABLED?: string;
  EDITOR_API_TOKEN?: string;
}

export function isLoopbackHost(value: unknown): boolean;
export function authorizeApiRequest(input: {
  host: string | null;
  origin: string | null;
  authorization: string | null;
  env?: EditorPolicyEnvironment;
}): { mode: "local" | "remote"; origin: string | null };
export function enforceRateLimit(key: string, now?: number): { remaining: number; resetAt: number };
export function readBoundedJson(request: Request): Promise<unknown>;
export function validateChatPayload(value: unknown): {
  message: string;
  fileName: string;
  language: string;
  code: string;
};
export function validateAgentPayload(value: unknown): {
  task: string;
  files: unknown[];
  activeFileId: string | null;
  provider: "auto" | "local" | "openai";
};
export function findSensitiveMaterial(values: unknown[]): string[];
export function flattenProjectContent(nodes: unknown[], output?: string[]): string[];
export const requestPolicy: Readonly<{
  MAX_BODY_BYTES: number;
  MAX_MESSAGE_CHARS: number;
  MAX_CODE_CHARS: number;
  MAX_FILES: number;
  MAX_FILE_CHARS: number;
  MAX_PROJECT_CHARS: number;
  RATE_LIMIT: number;
  RATE_WINDOW_MS: number;
}>;
