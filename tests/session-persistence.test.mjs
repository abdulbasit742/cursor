import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionOnlyStateStorage } from '../src/lib/workspace/sessionStateStorage.mjs';
import {
  addProjectSnapshot,
  parseProjectSnapshots,
  prepareProjectSnapshot,
  snapshotLimits,
} from '../src/lib/projects/snapshotPolicy.mjs';

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    has: (key) => map.has(key),
  };
}

const safeFiles = [{
  id: '1',
  name: 'index.js',
  language: 'javascript',
  content: 'console.log("ok")',
  type: 'file',
}];

test('state storage purges legacy local value and reads session', () => {
  const session = memoryStorage({ editor: 'session' });
  const local = memoryStorage({ editor: 'legacy' });
  const storage = createSessionOnlyStateStorage(session, local);
  assert.equal(storage.getItem('editor'), 'session');
  assert.equal(local.has('editor'), false);
});

test('state writes remain session-only', () => {
  const session = memoryStorage();
  const local = memoryStorage({ editor: 'legacy' });
  createSessionOnlyStateStorage(session, local).setItem('editor', 'new');
  assert.equal(session.getItem('editor'), 'new');
  assert.equal(local.getItem('editor'), null);
});

test('snapshot accepts a bounded safe workspace', () => {
  const snapshot = prepareProjectSnapshot({
    files: safeFiles,
    label: ' before ',
    now: '2026-07-15T00:00:00Z',
    randomBytes: () => new Uint8Array(8),
  });
  assert.equal(snapshot.label, 'before');
  assert.equal(snapshot.storage, 'session');
  assert.equal(snapshot.fileCount, 1);
});

test('snapshot rejects sensitive paths', () => {
  assert.throws(
    () => prepareProjectSnapshot({ files: [{ ...safeFiles[0], name: '.env' }] }),
    /snapshot blocked/,
  );
});

test('snapshot rejects credential content', () => {
  assert.throws(
    () => prepareProjectSnapshot({
      files: [{ ...safeFiles[0], content: `sk-${'x'.repeat(24)}` }],
    }),
    /snapshot blocked/,
  );
});

test('snapshot rejects oversized stored project state', () => {
  assert.throws(
    () => prepareProjectSnapshot({
      files: [{ ...safeFiles[0], content: 'x'.repeat(snapshotLimits.maxSnapshotBytes + 1) }],
    }),
    /snapshot exceeds|file exceeds/,
  );
});

test('parser drops expired and malformed records', () => {
  const snapshot = prepareProjectSnapshot({
    files: safeFiles,
    label: 'x',
    now: '2026-07-15T00:00:00Z',
    randomBytes: () => new Uint8Array(8),
  });
  assert.equal(
    parseProjectSnapshots(JSON.stringify([{}, snapshot]), '2026-07-15T01:00:00Z').length,
    1,
  );
  assert.equal(
    parseProjectSnapshots(JSON.stringify([snapshot]), '2026-07-16T00:00:00Z').length,
    0,
  );
});

test('snapshot list is capped at five newest records', () => {
  let snapshots = [];
  for (let index = 0; index < 7; index += 1) {
    const snapshot = prepareProjectSnapshot({
      files: safeFiles,
      label: String(index),
      now: new Date(Date.UTC(2026, 6, 15, index)),
      randomBytes: () => new Uint8Array(8).fill(index),
    });
    snapshots = addProjectSnapshot(
      snapshots,
      snapshot,
      new Date(Date.UTC(2026, 6, 15, index)),
    );
  }
  assert.equal(snapshots.length, 5);
  assert.equal(snapshots[0].label, '6');
});
