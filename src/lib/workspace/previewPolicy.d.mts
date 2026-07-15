export const MAX_PREVIEW_SCRIPT_BYTES: number;
export const PREVIEW_CSP: string;
export const PREVIEW_CSP_SCRIPTS_DISABLED: string;

export interface PreviewScriptStatus {
  readonly hasJavaScript: boolean;
  readonly hasRunnableScript: boolean;
  readonly htmlScriptCount: number;
  readonly scriptBytes: number;
  readonly allowed: boolean;
  readonly blockedReason: string | null;
}

export interface PreviewConsent {
  readonly html: string;
  readonly js: string;
}

export function buildPreviewCsp(allowScripts?: boolean): string;
export function stripScriptElements(html: unknown): string;
export function sanitizePreviewHtml(html: unknown): string;
export function inspectPreviewJavaScript(input?: { html?: unknown; js?: unknown }): PreviewScriptStatus;
export function createPreviewConsent(input?: { html?: unknown; js?: unknown }): PreviewConsent;
export function isPreviewConsentCurrent(
  consent: PreviewConsent | null | undefined,
  input?: { html?: unknown; js?: unknown },
): boolean;
export function buildPreviewDocument(input?: {
  html?: unknown;
  css?: unknown;
  js?: unknown;
  allowScripts?: boolean;
}): string;
