import { normalizeArchivePath } from './importPolicy.mjs';

export const exportLimits = Object.freeze({
  maxFiles: 200,
  maxFileBytes: 512 * 1024,
  maxTotalBytes: 8 * 1024 * 1024,
  maxDepth: 20,
});

const generatedSegments = new Set(['.git', 'node_modules', '.next', 'dist', 'out', 'build', 'coverage']);
const sensitiveNames = new Set([
  '.env', '.env.local', '.env.development', '.env.production', '.npmrc', '.pypirc',
  'id_rsa', 'id_ed25519', 'credentials.json', 'secrets.json', 'service-account.json',
]);
const credentialPatterns = Object.freeze([
  { name: 'private-key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'openai-token', pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'github-token', pattern: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/ },
  { name: 'google-api-key', pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/ },
  { name: 'aws-access-key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'jwt', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
]);

function normalizeContent(value) {
  if (typeof value !== 'string') throw new TypeError('workspace file content must be text');
  if (value.includes('\0')) throw new Error('workspace file contains a NUL byte');
  return value;
}

function classifyPath(path) {
  const lower = path.toLocaleLowerCase('en-US');
  const parts = lower.split('/');
  if (parts.some((part) => generatedSegments.has(part))) return 'generated-or-vendored';
  const base = parts.at(-1) || '';
  if (sensitiveNames.has(base) || (base.startsWith('.env.') && base !== '.env.example')) return 'sensitive-path';
  if (parts.some((part) => part === '.ssh' || part === '.aws')) return 'sensitive-path';
  if (/\.(?:pem|key|p12|pfx|jks)$/i.test(base)) return 'sensitive-path';
  return null;
}

function credentialReason(content) {
  for (const rule of credentialPatterns) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(content)) return `credential:${rule.name}`;
  }
  return null;
}

export function prepareProjectExport(files) {
  if (!Array.isArray(files)) throw new TypeError('workspace files must be an array');
  const accepted = [];
  const skipped = [];
  const seen = new Set();
  let totalBytes = 0;

  function visit(nodes, basePath = '', depth = 0) {
    if (depth > exportLimits.maxDepth) throw new Error(`workspace exceeds maximum depth of ${exportLimits.maxDepth}`);
    for (const node of nodes) {
      if (!node || typeof node !== 'object') throw new TypeError('workspace entries must be objects');
      const name = String(node.name ?? '');
      const path = normalizeArchivePath(basePath ? `${basePath}/${name}` : name);
      const collisionKey = path.toLocaleLowerCase('en-US');
      if (seen.has(collisionKey)) throw new Error(`duplicate or case-colliding path: ${path}`);
      seen.add(collisionKey);

      const pathReason = classifyPath(path);
      if (node.type === 'folder') {
        if (pathReason) {
          skipped.push({ path, reason: pathReason });
          continue;
        }
        if (!Array.isArray(node.children)) throw new TypeError(`folder children must be an array: ${path}`);
        visit(node.children, path, depth + 1);
        continue;
      }
      if (node.type !== 'file') throw new TypeError(`unsupported workspace entry type: ${path}`);
      if (pathReason) {
        skipped.push({ path, reason: pathReason });
        continue;
      }

      const content = normalizeContent(node.content ?? '');
      const bytes = new TextEncoder().encode(content).byteLength;
      if (bytes > exportLimits.maxFileBytes) throw new Error(`file exceeds ${exportLimits.maxFileBytes} bytes: ${path}`);
      const contentReason = credentialReason(content);
      if (contentReason) {
        skipped.push({ path, reason: contentReason });
        continue;
      }

      totalBytes += bytes;
      if (totalBytes > exportLimits.maxTotalBytes) throw new Error(`export exceeds ${exportLimits.maxTotalBytes} bytes`);
      accepted.push({ path, content, bytes });
      if (accepted.length > exportLimits.maxFiles) throw new Error(`export contains more than ${exportLimits.maxFiles} files`);
    }
  }

  visit(files);
  if (!accepted.length) throw new Error('workspace contains no safe files to export');

  return Object.freeze({
    accepted: Object.freeze(accepted),
    skipped: Object.freeze(skipped),
    fileCount: accepted.length,
    skippedCount: skipped.length,
    totalBytes,
  });
}

export function formatExportReview(plan) {
  const skippedPreview = plan.skipped.slice(0, 8).map((entry) => `- ${entry.path} (${entry.reason})`);
  if (plan.skipped.length > skippedPreview.length) {
    skippedPreview.push(`- …and ${plan.skipped.length - skippedPreview.length} more excluded entries`);
  }
  return [
    'Review project export',
    '',
    `${plan.fileCount} file(s), ${plan.totalBytes.toLocaleString()} UTF-8 bytes will be included.`,
    `${plan.skippedCount} sensitive/generated entry or folder(s) will be excluded.`,
    ...(skippedPreview.length ? ['', ...skippedPreview] : []),
    '',
    'Credential detection is best-effort. Review the workspace before sharing the ZIP.',
    'Continue with this safe export?',
  ].join('\n');
}
