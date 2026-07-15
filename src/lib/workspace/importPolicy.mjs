export const importLimits = Object.freeze({
  maxArchiveBytes: 10 * 1024 * 1024,
  maxEntries: 250,
  maxFiles: 200,
  maxFileBytes: 512 * 1024,
  maxTotalBytes: 8 * 1024 * 1024,
  maxPathLength: 240,
});

const ignoredSegments = new Set([
  '', '__macosx', 'node_modules', '.next', '.git', '.tools', 'dist', 'out', 'coverage',
]);
const binaryExtensions = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.exe', '.dll', '.so',
  '.dylib', '.wasm', '.ttf', '.otf', '.woff', '.woff2', '.mp3', '.mp4', '.mov', '.avi', '.bin',
]);
const windowsReserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
const controlCharacters = /[\u0000-\u001f\u007f]/;

function extension(path) {
  const name = path.split('/').at(-1) || '';
  const index = name.lastIndexOf('.');
  return index > 0 ? name.slice(index).toLowerCase() : '';
}

export function normalizeArchivePath(input) {
  if (typeof input !== 'string') throw new TypeError('archive path must be a string');
  const candidate = input.normalize('NFKC').replace(/\\/g, '/');
  if (!candidate || candidate.length > importLimits.maxPathLength) throw new Error('archive path is empty or too long');
  if (controlCharacters.test(candidate)) throw new Error('archive path contains control characters');
  if (candidate.startsWith('/') || /^[a-z]:\//i.test(candidate)) throw new Error('absolute archive paths are not allowed');

  const parts = candidate.split('/').filter(Boolean);
  if (!parts.length || parts.some((part) => part === '.' || part === '..')) {
    throw new Error('relative traversal segments are not allowed');
  }
  for (const part of parts) {
    if (part.length > 120 || windowsReserved.test(part) || part.endsWith('.') || part.endsWith(' ')) {
      throw new Error('archive path contains an unsafe component');
    }
  }
  return parts.join('/');
}

export function classifyArchivePath(input) {
  const path = normalizeArchivePath(input);
  const lower = path.toLowerCase();
  const parts = lower.split('/');
  if (parts.some((part) => ignoredSegments.has(part))) return { path, importable: false, reason: 'generated-or-vendored' };
  if (parts.some((part) => part.startsWith('.')) && !lower.endsWith('/.env.example') && lower !== '.env.example') {
    return { path, importable: false, reason: 'hidden-or-sensitive' };
  }
  if (binaryExtensions.has(extension(lower))) return { path, importable: false, reason: 'binary' };
  return { path, importable: true, reason: null };
}

export function isSymlinkMode(mode) {
  const numeric = typeof mode === 'string' ? Number.parseInt(mode, 8) : Number(mode || 0);
  return Number.isFinite(numeric) && (numeric & 0o170000) === 0o120000;
}

export function inspectArchive({ archiveBytes, entries }) {
  if (!Number.isInteger(archiveBytes) || archiveBytes < 1 || archiveBytes > importLimits.maxArchiveBytes) {
    throw new Error(`archive must be between 1 byte and ${importLimits.maxArchiveBytes} bytes`);
  }
  if (!Array.isArray(entries) || entries.length > importLimits.maxEntries) {
    throw new Error(`archive must contain no more than ${importLimits.maxEntries} entries`);
  }

  const accepted = [];
  const skipped = [];
  const seen = new Set();
  let totalBytes = 0;
  let scriptFiles = 0;

  for (const entry of entries) {
    if (entry?.dir) continue;
    if (isSymlinkMode(entry?.unixPermissions)) throw new Error(`symbolic links are not allowed: ${entry?.name || 'unknown'}`);
    const classification = classifyArchivePath(entry?.name);
    if (!classification.importable) {
      skipped.push({ path: classification.path, reason: classification.reason });
      continue;
    }

    const collisionKey = classification.path.toLocaleLowerCase('en-US');
    if (seen.has(collisionKey)) throw new Error(`duplicate or case-colliding path: ${classification.path}`);
    seen.add(collisionKey);

    const size = Number(entry?.uncompressedSize);
    if (!Number.isInteger(size) || size < 0) throw new Error(`missing uncompressed size: ${classification.path}`);
    if (size > importLimits.maxFileBytes) throw new Error(`file exceeds ${importLimits.maxFileBytes} bytes: ${classification.path}`);
    totalBytes += size;
    if (totalBytes > importLimits.maxTotalBytes) throw new Error(`archive expands beyond ${importLimits.maxTotalBytes} bytes`);
    if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.html'].includes(extension(classification.path))) scriptFiles += 1;
    accepted.push({ path: classification.path, size });
  }

  if (!accepted.length) throw new Error('archive contains no importable text files');
  if (accepted.length > importLimits.maxFiles) throw new Error(`archive contains more than ${importLimits.maxFiles} importable files`);

  return Object.freeze({
    accepted: Object.freeze(accepted),
    skipped: Object.freeze(skipped),
    fileCount: accepted.length,
    skippedCount: skipped.length,
    totalBytes,
    scriptFiles,
  });
}

export function decodeImportedText(bytes, path) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('imported file must be bytes');
  if (bytes.byteLength > importLimits.maxFileBytes) throw new Error(`file exceeds size limit: ${path}`);
  if (bytes.includes(0)) throw new Error(`binary-like NUL byte found: ${path}`);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`file is not valid UTF-8 text: ${path}`);
  }
}

export function stableImportId(path, type = 'file') {
  const normalized = normalizeArchivePath(path);
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(normalized)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const slug = normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(-48) || 'root';
  return `import-${type}-${slug}-${hash.toString(16).padStart(8, '0')}`;
}
