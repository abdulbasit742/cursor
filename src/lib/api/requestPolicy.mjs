import { createHash } from "node:crypto";

const MAX_BODY_BYTES = 600_000;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_CODE_CHARS = 200_000;
const MAX_FILES = 200;
const MAX_FILE_CHARS = 120_000;
const MAX_PROJECT_CHARS = 500_000;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const MAX_RATE_BUCKETS = 256;

const rateBuckets = new Map();

export class RequestPolicyError extends Error {
  constructor(message, { status = 400, code = "invalid_request" } = {}) {
    super(message);
    this.name = "RequestPolicyError";
    this.status = status;
    this.code = code;
  }
}

function clean(value, maxLength) {
  return String(value ?? "").normalize("NFKC").trim().slice(0, maxLength);
}

function parseHost(value) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text || /[\s/@\\]/.test(text)) return null;
  try {
    return new URL(`http://${text}`).host.toLowerCase();
  } catch {
    return null;
  }
}

function hostnameFromHost(value) {
  const host = parseHost(value);
  if (!host) return "";
  try {
    return new URL(`http://${host}`).hostname.replace(/^\[|\]$/g, "").toLowerCase();
  } catch {
    return "";
  }
}

export function isLoopbackHost(value) {
  const host = hostnameFromHost(value);
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function parseOrigin(value) {
  if (!value) return null;
  let url;
  try {
    url = new URL(String(value));
  } catch {
    throw new RequestPolicyError("Request origin is invalid", { status: 403, code: "origin_denied" });
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.origin === "null") {
    throw new RequestPolicyError("Request origin is invalid", { status: 403, code: "origin_denied" });
  }
  return url;
}

function allowedOrigins(env) {
  const origins = new Set();
  for (const value of String(env.EDITOR_ALLOWED_ORIGINS || "").split(",")) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    let url;
    try {
      url = new URL(trimmed);
    } catch {
      throw new RequestPolicyError("EDITOR_ALLOWED_ORIGINS contains an invalid URL", {
        status: 500,
        code: "invalid_configuration",
      });
    }
    if (url.username || url.password || (url.protocol !== "https:" && !isLoopbackHost(url.host))) {
      throw new RequestPolicyError("EDITOR_ALLOWED_ORIGINS must contain credential-free HTTPS origins", {
        status: 500,
        code: "invalid_configuration",
      });
    }
    origins.add(url.origin);
  }
  return origins;
}

function parseBearer(value) {
  const match = /^Bearer\s+(.+)$/i.exec(String(value ?? ""));
  return match?.[1]?.trim() || "";
}

function safeEqual(left, right) {
  const a = String(left ?? "");
  const b = String(right ?? "");
  let mismatch = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    mismatch |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

function principalForToken(token) {
  return `remote:${createHash("sha256").update(token).digest("hex").slice(0, 24)}`;
}

export function authorizeApiRequest({ host, origin, authorization, env = process.env }) {
  const requestHost = parseHost(host);
  if (!requestHost) {
    throw new RequestPolicyError("Request host is invalid", { status: 403, code: "host_denied" });
  }
  const originUrl = parseOrigin(origin);

  if (isLoopbackHost(requestHost)) {
    if (env.EDITOR_LOCAL_AI_ENABLED !== "true" || env.NODE_ENV === "production") {
      throw new RequestPolicyError("Local AI API access is disabled", {
        status: 403,
        code: "local_access_disabled",
      });
    }
    if (!originUrl || !isLoopbackHost(originUrl.host) || originUrl.host.toLowerCase() !== requestHost) {
      throw new RequestPolicyError("Local AI API requests must use the exact loopback origin", {
        status: 403,
        code: "origin_denied",
      });
    }
    return { mode: "local", origin: originUrl.origin, principal: `local:${originUrl.origin}` };
  }

  if (env.EDITOR_REMOTE_AI_ENABLED !== "true") {
    throw new RequestPolicyError("Remote AI API access is disabled", {
      status: 403,
      code: "remote_access_disabled",
    });
  }
  if (!originUrl || !allowedOrigins(env).has(originUrl.origin)) {
    throw new RequestPolicyError("Request origin is not allowlisted", {
      status: 403,
      code: "origin_denied",
    });
  }
  if (originUrl.host.toLowerCase() !== requestHost) {
    throw new RequestPolicyError("Request host does not match the allowlisted origin", {
      status: 403,
      code: "host_denied",
    });
  }
  const configuredToken = String(env.EDITOR_API_TOKEN || "");
  if (configuredToken.length < 24) {
    throw new RequestPolicyError("EDITOR_API_TOKEN must contain at least 24 characters", {
      status: 500,
      code: "invalid_configuration",
    });
  }
  if (!safeEqual(parseBearer(authorization), configuredToken)) {
    throw new RequestPolicyError("Valid bearer authorization is required", {
      status: 401,
      code: "unauthorized",
    });
  }
  return {
    mode: "remote",
    origin: originUrl.origin,
    principal: principalForToken(configuredToken),
  };
}

function pruneRateBuckets(now) {
  for (const [key, bucket] of rateBuckets) {
    if (now - bucket.startedAt >= RATE_WINDOW_MS) rateBuckets.delete(key);
  }
}

export function resetRateLimitState() {
  rateBuckets.clear();
}

export function enforceRateLimit(key, now = Date.now()) {
  const normalizedKey = clean(key, 200);
  if (!normalizedKey) throw new TypeError("rate-limit key is required");
  if (!Number.isFinite(now) || now < 0) throw new TypeError("rate-limit time is invalid");

  pruneRateBuckets(now);
  const current = rateBuckets.get(normalizedKey);
  if (!current) {
    if (rateBuckets.size >= MAX_RATE_BUCKETS) {
      throw new RequestPolicyError("Rate limiter capacity is temporarily exhausted", {
        status: 503,
        code: "rate_limiter_busy",
      });
    }
    rateBuckets.set(normalizedKey, { startedAt: now, count: 1 });
    return { remaining: RATE_LIMIT - 1, resetAt: now + RATE_WINDOW_MS };
  }
  if (current.count >= RATE_LIMIT) {
    throw new RequestPolicyError("Too many AI requests; try again shortly", {
      status: 429,
      code: "rate_limited",
    });
  }
  current.count += 1;
  return { remaining: RATE_LIMIT - current.count, resetAt: current.startedAt + RATE_WINDOW_MS };
}

export async function readBoundedJson(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new RequestPolicyError("Content-Type must be application/json", {
      status: 415,
      code: "unsupported_media_type",
    });
  }
  const declared = Number.parseInt(request.headers.get("content-length") || "0", 10);
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw new RequestPolicyError("Request body is too large", { status: 413, code: "payload_too_large" });
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new RequestPolicyError("Request body is too large", { status: 413, code: "payload_too_large" });
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new RequestPolicyError("Request body must contain valid JSON", {
      status: 400,
      code: "invalid_json",
    });
  }
}

export function validateChatPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestPolicyError("JSON object is required");
  }
  const message = clean(value.message, MAX_MESSAGE_CHARS + 1);
  if (!message) throw new RequestPolicyError("Message is required");
  if (message.length > MAX_MESSAGE_CHARS) throw new RequestPolicyError("Message is too long", { status: 413, code: "payload_too_large" });
  const code = String(value.code ?? "");
  if (code.length > MAX_CODE_CHARS) throw new RequestPolicyError("Current file is too large", { status: 413, code: "payload_too_large" });
  return {
    message,
    fileName: clean(value.fileName, 200),
    language: clean(value.language, 60),
    code,
  };
}

function validateFileNode(node, state, depth = 0) {
  if (!node || typeof node !== "object" || Array.isArray(node) || depth > 20) {
    throw new RequestPolicyError("Project file tree is invalid");
  }
  state.count += 1;
  if (state.count > MAX_FILES) throw new RequestPolicyError("Project contains too many files", { status: 413, code: "payload_too_large" });
  const name = clean(node.name, 180);
  const id = clean(node.id, 180);
  if (!name || !id || /[\/\0]/.test(name)) throw new RequestPolicyError("Project contains an unsafe file name");
  if (node.type !== "file" && node.type !== "folder") throw new RequestPolicyError("Project node type is invalid");
  const content = String(node.content ?? "");
  if (content.length > MAX_FILE_CHARS) throw new RequestPolicyError(`File ${name} is too large`, { status: 413, code: "payload_too_large" });
  state.total += content.length;
  if (state.total > MAX_PROJECT_CHARS) throw new RequestPolicyError("Project context is too large", { status: 413, code: "payload_too_large" });
  if (node.children !== undefined) {
    if (!Array.isArray(node.children)) throw new RequestPolicyError("Folder children must be an array");
    for (const child of node.children) validateFileNode(child, state, depth + 1);
  }
  return {
    id,
    name,
    language: clean(node.language, 80) || "plaintext",
    content,
    type: node.type,
    children: Array.isArray(node.children) ? node.children : undefined,
    isOpen: Boolean(node.isOpen),
  };
}

export function validateAgentPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestPolicyError("JSON object is required");
  }
  const task = clean(value.task, MAX_MESSAGE_CHARS + 1);
  if (!task) throw new RequestPolicyError("Task is required");
  if (task.length > MAX_MESSAGE_CHARS) throw new RequestPolicyError("Task is too long", { status: 413, code: "payload_too_large" });
  if (!Array.isArray(value.files)) throw new RequestPolicyError("Project files are required");
  const state = { count: 0, total: 0 };
  const files = value.files.map((node) => validateFileNode(node, state));
  const provider = value.provider || "auto";
  if (!["auto", "local", "openai"].includes(provider)) throw new RequestPolicyError("Provider is invalid");
  return {
    task,
    files,
    activeFileId: value.activeFileId == null ? null : clean(value.activeFileId, 180),
    provider,
  };
}

export function findSensitiveMaterial(values) {
  const text = values.filter((value) => typeof value === "string").join("\n");
  const rules = [
    ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ["openai-token", /\bsk-[A-Za-z0-9_-]{20,}\b/],
    ["github-token", /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
    ["google-api-key", /\bAIza[0-9A-Za-z_-]{30,}\b/],
    ["aws-access-key", /\bAKIA[0-9A-Z]{16}\b/],
  ];
  return rules.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
}

export function flattenProjectContent(nodes, output = []) {
  for (const node of nodes || []) {
    if (node?.type === "file") output.push(String(node.content ?? ""));
    if (Array.isArray(node?.children)) flattenProjectContent(node.children, output);
  }
  return output;
}

export const requestPolicy = Object.freeze({
  MAX_BODY_BYTES,
  MAX_MESSAGE_CHARS,
  MAX_CODE_CHARS,
  MAX_FILES,
  MAX_FILE_CHARS,
  MAX_PROJECT_CHARS,
  RATE_LIMIT,
  RATE_WINDOW_MS,
  MAX_RATE_BUCKETS,
});
