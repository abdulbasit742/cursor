import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createExpiringSessionStorage,
  persistenceKeys,
  prepareEditorStateForPersistence,
} from '../src/lib/workspace/persistencePolicy.mjs';
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

const uiState = {
  editorSettings: { fontSize: 14 },
  isSidebarOpen: true,
  isChatOpen: true,
  isAgentOpen: false,
  isTemplatesOpen: false,
  isHistoryOpen: false,
  isSearchOpen: false,
  isSourceControlOpen: false,
  isProblemsOpen: false,
  isSettingsOpen: false,
  isStatsOpen: false,
  isContextOpen: false,
  isReadinessOpen: false,
  isLaunchChecklistOpen: false,
  isTerminalOpen: true,
  isPreviewOpen: true,
};

test('expiring storage purges legacy durable keys and reads current session', () => {
  const now = 1_000;
  const session = memoryStorage({
    editor: JSON.stringify({ schemaVersion: 1, expiresAt: now + 500, value: 'session' }),
  });
  const local = memoryStorage({
    [persistenceKeys.legacyEditorLocal]: 'legacy-editor',
    [persistenceKeys.legacyFsSnapshots]: 'legacy-fs',
  });
  const storage = createExpiringSessionStorage(session, local, () => now);
  assert.equal(storage.getItem('editor'), 'session');
  assert.equal(local.has(persistenceKeys.legacyEditorLocal), false);
  assert.equal(local.has(persistenceKeys.legacyFsSnapshots), false);
});

test('expiring storage writes an expiry envelope to session storage only', () => {
  const session = memoryStorage();
  const local = memoryStorage({ [persistenceKeys.legacyEditorLocal]: 'legacy' });
  createExpiringSessionStorage(session, local, () => 10_000).setItem('editor', 'new');
  const envelope = JSON.parse(session.getItem('editor'));
  assert.equal(envelope.schemaVersion, 1);
  assert.equal(envelope.value, 'new');
  assert.ok(envelope.expiresAt > 10_000);
  assert.equal(local.getItem(persistenceKeys.legacyEditorLocal), null);
});

test('expired or malformed session state is removed fail closed', () => {
  const session = memoryStorage({
    expired: JSON.stringify({ schemaVersion: 1, expiresAt: 99, value: 'old' }),
    malformed: '{',
  });
  const storage = createExpiringSessionStorage(session, memoryStorage(), () => 100);
  assert.equal(storage.getItem('expired'), null);
  assert.equal(storage.getItem('malformed'), null);
  assert.equal(session.has('expired'), false);
  assert.equal(session.has('malformed'), false);
});

test('safe editor state persists workspace but excludes chat prompts', () => {
  const persisted = prepareEditorStateForPersistence({
    ...uiState,
    files: safeFiles,
    activeFile: safeFiles[0],
    openTabs: ['1'],
    chatMessages: [{ role: 'user', content: 'private prompt' }],
  });
  assert.equal(persisted.files.length, 1);
  assert.deepEqual(persisted.openTabs, ['1']);
  assert.equal('chatMessages' in persisted, false);
});

test('unsafe editor workspace is omitted while UI state remains usable', () => {
  const persisted = prepareEditorStateForPersistence({
    ...uiState,
    files: [{ ...safeFiles[0], name: '.env', content: 'SECRET=value' }],
    activeFile: null,
    openTabs: [],
    chatMessages: [],
  });
  assert.equal('files' in persisted, false);
  assert.equal(persisted.isSidebarOpen, true);
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
