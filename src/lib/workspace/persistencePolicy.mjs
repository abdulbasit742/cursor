import { prepareProjectExport } from './exportPolicy.mjs';
import { normalizeArchivePath } from './importPolicy.mjs';

const encoder = new TextEncoder();

export const persistenceLimits = Object.freeze({
  maxSerializedBytes: 4 * 1024 * 1024,
  ttlMs: 12 * 60 * 60 * 1000,
  maxSnapshots: 10,
});

export const persistenceKeys = Object.freeze({
  editorSession: 'ai-code-editor-private-session-v2',
  legacyEditorLocal: 'ai-code-editor-storage',
  fsSnapshots: 'cursor_ai_fs_sync_v2',
  legacyFsSnapshots: 'cursor_ai_fs_sync_v1',
});

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function serializedBytes(value) {
  return encoder.encode(JSON.stringify(value)).byteLength;
}

function blocked(reason, skipped = []) {
  return Object.freeze({ allowed: false, reason, files: null, skipped: Object.freeze(skipped) });
}

export function prepareWorkspacePersistence(files) {
  try {
    const plan = prepareProjectExport(files);
    if (plan.skippedCount > 0) {
      return blocked('workspace contains sensitive, generated, or credential-shaped content', plan.skipped);
    }
    const cloned = cloneJson(files);
    if (serializedBytes(cloned) > persistenceLimits.maxSerializedBytes) {
      return blocked(`workspace exceeds ${persistenceLimits.maxSerializedBytes} serialized bytes`);
    }
    return Object.freeze({
      allowed: true,
      reason: null,
      files: cloned,
      skipped: Object.freeze([]),
    });
  } catch (error) {
    return blocked(error instanceof Error ? error.message : 'workspace could not be validated');
  }
}

function insertFlatFile(root, path, content) {
  const parts = normalizeArchivePath(path).split('/');
  let children = root;
  for (let index = 0; index < parts.length; index += 1) {
    const name = parts[index];
    const isFile = index === parts.length - 1;
    const existing = children.find((entry) => entry.name.toLocaleLowerCase('en-US') === name.toLocaleLowerCase('en-US'));
    if (isFile) {
      if (existing) throw new Error(`duplicate or case-colliding path: ${path}`);
      children.push({ name, type: 'file', content });
      return;
    }
    if (existing && existing.type !== 'folder') throw new Error(`path conflict: ${path}`);
    const folder = existing || { name, type: 'folder', children: [] };
    if (!existing) children.push(folder);
    children = folder.children;
  }
}

export function prepareVirtualFSPersistence(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state) || !state.files || typeof state.files !== 'object') {
    return Object.freeze({ allowed: false, reason: 'virtual filesystem state is invalid', state: null });
  }
  try {
    const tree = [];
    for (const [path, file] of Object.entries(state.files)) {
      if (!file || typeof file !== 'object') throw new TypeError(`invalid virtual file: ${path}`);
      if (file.type === 'directory') continue;
      if (file.type !== 'file') throw new TypeError(`unsupported virtual file type: ${path}`);
      insertFlatFile(tree, path, String(file.content ?? ''));
    }
    const plan = prepareWorkspacePersistence(tree);
    if (!plan.allowed) return Object.freeze({ allowed: false, reason: plan.reason, state: null });
    const cloned = cloneJson(state);
    if (serializedBytes(cloned) > persistenceLimits.maxSerializedBytes) {
      return Object.freeze({ allowed: false, reason: 'virtual filesystem exceeds persistence size limit', state: null });
    }
    return Object.freeze({ allowed: true, reason: null, state: cloned });
  } catch (error) {
    return Object.freeze({
      allowed: false,
      reason: error instanceof Error ? error.message : 'virtual filesystem could not be validated',
      state: null,
    });
  }
}

function uiState(state) {
  return {
    editorSettings: state.editorSettings,
    isSidebarOpen: state.isSidebarOpen,
    isChatOpen: state.isChatOpen,
    isAgentOpen: state.isAgentOpen,
    isTemplatesOpen: state.isTemplatesOpen,
    isHistoryOpen: state.isHistoryOpen,
    isSearchOpen: state.isSearchOpen,
    isSourceControlOpen: state.isSourceControlOpen,
    isProblemsOpen: state.isProblemsOpen,
    isSettingsOpen: state.isSettingsOpen,
    isStatsOpen: state.isStatsOpen,
    isContextOpen: state.isContextOpen,
    isReadinessOpen: state.isReadinessOpen,
    isLaunchChecklistOpen: state.isLaunchChecklistOpen,
    isTerminalOpen: state.isTerminalOpen,
    isPreviewOpen: state.isPreviewOpen,
  };
}

export function prepareEditorStateForPersistence(state) {
  const base = uiState(state);
  const workspace = prepareWorkspacePersistence(state.files);
  if (!workspace.allowed) return base;
  return {
    ...base,
    files: workspace.files,
    activeFile: state.activeFile ? cloneJson(state.activeFile) : null,
    openTabs: Array.isArray(state.openTabs) ? [...state.openTabs].slice(0, 100) : [],
  };
}

export function createExpiringSessionStorage(sessionStorage, legacyLocalStorage, now = () => Date.now()) {
  function purgeLegacy() {
    try {
      legacyLocalStorage?.removeItem?.(persistenceKeys.legacyEditorLocal);
      legacyLocalStorage?.removeItem?.(persistenceKeys.legacyFsSnapshots);
    } catch {
      // A blocked legacy store must not prevent current session operation.
    }
  }

  return {
    getItem(name) {
      purgeLegacy();
      try {
        const raw = sessionStorage?.getItem?.(name);
        if (!raw) return null;
        const envelope = JSON.parse(raw);
        if (
          !envelope ||
          envelope.schemaVersion !== 1 ||
          typeof envelope.value !== 'string' ||
          !Number.isFinite(envelope.expiresAt) ||
          envelope.expiresAt <= now() ||
          encoder.encode(envelope.value).byteLength > persistenceLimits.maxSerializedBytes
        ) {
          sessionStorage?.removeItem?.(name);
          return null;
        }
        return envelope.value;
      } catch {
        sessionStorage?.removeItem?.(name);
        return null;
      }
    },
    setItem(name, value) {
      purgeLegacy();
      if (typeof value !== 'string') throw new TypeError('persisted value must be a string');
      const bytes = encoder.encode(value).byteLength;
      if (bytes > persistenceLimits.maxSerializedBytes) {
        sessionStorage?.removeItem?.(name);
        throw new Error('persisted editor state exceeds the size limit');
      }
      sessionStorage?.setItem?.(name, JSON.stringify({
        schemaVersion: 1,
        expiresAt: now() + persistenceLimits.ttlMs,
        value,
      }));
    },
    removeItem(name) {
      purgeLegacy();
      sessionStorage?.removeItem?.(name);
    },
  };
}
