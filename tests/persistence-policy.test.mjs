import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createExpiringSessionStorage,
  persistenceKeys,
  persistenceLimits,
  prepareEditorStateForPersistence,
  prepareVirtualFSPersistence,
  prepareWorkspacePersistence,
} from '../src/lib/workspace/persistencePolicy.mjs';

const file = (name, content = 'safe text') => ({
  id: `id-${name}`,
  name,
  language: 'text',
  content,
  type: 'file',
});

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    has: (key) => map.has(key),
  };
}

function editorState(files) {
  return {
    files,
    activeFile: files[0] ?? null,
    openTabs: files.map((entry) => entry.id),
    chatMessages: [{ role: 'user', content: 'private prompt' }],
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
}

test('allows a bounded secret-free workspace', () => {
  const decision = prepareWorkspacePersistence([file('index.ts', 'export const ok = true;')]);
  assert.equal(decision.allowed, true);
  assert.equal(decision.files[0].name, 'index.ts');
});

test('blocks the whole persisted project when a sensitive path is present', () => {
  const decision = prepareWorkspacePersistence([file('index.ts'), file('.env', 'TOKEN=value')]);
  assert.equal(decision.allowed, false);
  assert.equal(decision.files, null);
  assert.match(decision.reason, /sensitive|credential/i);
});

test('blocks credential-shaped source without embedding a token fixture in the repository', () => {
  const synthetic = ['s', 'k', '-', 'x'.repeat(30)].join('');
  const decision = prepareWorkspacePersistence([file('token.txt', synthetic)]);
  assert.equal(decision.allowed, false);
  assert.equal(decision.files, null);
});

test('never includes chat and drops source when workspace persistence is blocked', () => {
  const state = editorState([file('.env', 'TOKEN=value')]);
  const persisted = prepareEditorStateForPersistence(state);
  assert.equal('chatMessages' in persisted, false);
  assert.equal('files' in persisted, false);
  assert.deepEqual(persisted.editorSettings, { fontSize: 14 });
});

test('keeps safe source but still excludes chat from persisted editor state', () => {
  const state = editorState([file('app.ts', 'export {};')]);
  const persisted = prepareEditorStateForPersistence(state);
  assert.equal(persisted.files[0].name, 'app.ts');
  assert.equal('chatMessages' in persisted, false);
  assert.deepEqual(persisted.openTabs, ['id-app.ts']);
});

test('validates flat virtual filesystem snapshots through the same content boundary', () => {
  const safe = prepareVirtualFSPersistence({
    files: {
      'src/app.ts': { path: 'src/app.ts', type: 'file', content: 'export {};' },
      src: { path: 'src', type: 'directory' },
    },
  });
  assert.equal(safe.allowed, true);

  const blocked = prepareVirtualFSPersistence({
    files: { '.env': { path: '.env', type: 'file', content: 'TOKEN=value' } },
  });
  assert.equal(blocked.allowed, false);
});

test('session wrapper purges legacy local state and expires values', () => {
  let now = 1_000;
  const session = memoryStorage();
  const local = memoryStorage({
    [persistenceKeys.legacyEditorLocal]: 'legacy source',
    [persistenceKeys.legacyFsSnapshots]: 'legacy snapshots',
  });
  const storage = createExpiringSessionStorage(session, local, () => now);
  storage.setItem('editor', 'safe-state');
  assert.equal(local.has(persistenceKeys.legacyEditorLocal), false);
  assert.equal(local.has(persistenceKeys.legacyFsSnapshots), false);
  assert.equal(storage.getItem('editor'), 'safe-state');

  now += persistenceLimits.ttlMs + 1;
  assert.equal(storage.getItem('editor'), null);
  assert.equal(session.has('editor'), false);
});

test('session wrapper drops malformed or oversized values', () => {
  const malformed = memoryStorage({ editor: '{bad-json' });
  const storage = createExpiringSessionStorage(malformed, memoryStorage(), () => 1_000);
  assert.equal(storage.getItem('editor'), null);
  assert.equal(malformed.has('editor'), false);

  assert.throws(
    () => storage.setItem('editor', 'x'.repeat(persistenceLimits.maxSerializedBytes + 1)),
    /size limit/,
  );
  assert.equal(malformed.has('editor'), false);
});
