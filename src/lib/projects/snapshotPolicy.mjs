import { prepareProjectExport } from '../workspace/exportPolicy.mjs';

export const snapshotLimits = Object.freeze({
  maxSnapshots: 5,
  maxSnapshotBytes: 1024 * 1024,
  ttlMs: 12 * 60 * 60 * 1000,
});

const sources = new Set(['manual', 'template', 'import', 'reset']);

function nowDate(value) {
  const date = value === undefined ? new Date() : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError('now must be a valid date');
  return date;
}

function randomHex(randomBytes) {
  const bytes = randomBytes ? randomBytes(8) : crypto.getRandomValues(new Uint8Array(8));
  if (!(bytes instanceof Uint8Array) || bytes.length !== 8) {
    throw new TypeError('randomBytes must return 8 bytes');
  }
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function prepareProjectSnapshot({ files, label, source = 'manual', now, randomBytes }) {
  if (!sources.has(source)) throw new TypeError('snapshot source is invalid');
  const plan = prepareProjectExport(files);
  if (plan.skippedCount) {
    const preview = plan.skipped.slice(0, 3).map((entry) => entry.path).join(', ');
    throw new Error(
      `snapshot blocked by ${plan.skippedCount} sensitive/generated entr${plan.skippedCount === 1 ? 'y' : 'ies'}: ${preview}`,
    );
  }

  const cloned = JSON.parse(JSON.stringify(files));
  const storedBytes = new TextEncoder().encode(JSON.stringify(cloned)).byteLength;
  if (storedBytes > snapshotLimits.maxSnapshotBytes) {
    throw new Error(`snapshot exceeds ${snapshotLimits.maxSnapshotBytes} bytes`);
  }

  const created = nowDate(now);
  return Object.freeze({
    id: `snapshot_${created.getTime().toString(36)}_${randomHex(randomBytes)}`,
    label: String(label ?? '').trim().slice(0, 120) || 'Untitled snapshot',
    source,
    files: cloned,
    fileCount: plan.fileCount,
    totalBytes: storedBytes,
    createdAt: created.toISOString(),
    expiresAt: new Date(created.getTime() + snapshotLimits.ttlMs).toISOString(),
    storage: 'session',
  });
}

function validSnapshot(item, nowMs) {
  return item
    && typeof item === 'object'
    && typeof item.id === 'string'
    && typeof item.label === 'string'
    && sources.has(item.source)
    && Array.isArray(item.files)
    && Number.isInteger(item.fileCount)
    && Number.isInteger(item.totalBytes)
    && item.totalBytes >= 0
    && item.totalBytes <= snapshotLimits.maxSnapshotBytes
    && item.storage === 'session'
    && Number.isFinite(Date.parse(item.createdAt))
    && Number.isFinite(Date.parse(item.expiresAt))
    && Date.parse(item.expiresAt) > nowMs;
}

export function parseProjectSnapshots(raw, now) {
  const nowMs = nowDate(now).getTime();
  let value;
  try {
    value = raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => validSnapshot(item, nowMs))
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, snapshotLimits.maxSnapshots);
}

export function addProjectSnapshot(existing, snapshot, now) {
  const current = parseProjectSnapshots(JSON.stringify(existing), now);
  return [snapshot, ...current.filter((item) => item.id !== snapshot.id)]
    .slice(0, snapshotLimits.maxSnapshots);
}
