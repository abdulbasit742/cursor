#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const findings = [];
const required = [
  'src/lib/workspace/importPolicy.mjs',
  'src/lib/workspace/exportPolicy.mjs',
  'src/lib/workspace/previewPolicy.mjs',
  'src/lib/workspace/persistencePolicy.mjs',
  'src/lib/workspace/persistencePolicy.d.mts',
  'src/lib/projects/snapshotPolicy.mjs',
  'src/lib/projects/projectSnapshots.ts',
  'src/components/WorkspacePersistenceBoundary.tsx',
  'src/store/useStore.ts',
  'src/utils/importProject.ts',
  'src/utils/downloadProject.ts',
  'src/components/Preview/LivePreview.tsx',
  'tests/import-policy.test.mjs',
  'tests/export-policy.test.mjs',
  'tests/preview-policy.test.mjs',
  'tests/session-persistence.test.mjs',
  'tests/persistence-policy.test.mjs',
];

function report(file, rule, detail) {
  findings.push({ file, rule, detail });
}

for (const file of required) {
  if (!existsSync(join(root, file))) report(file, 'missing-file', 'required workspace trust file is missing');
}

if (!findings.length) {
  const preview = readFileSync(join(root, 'src/components/Preview/LivePreview.tsx'), 'utf8');
  const previewPolicy = readFileSync(join(root, 'src/lib/workspace/previewPolicy.mjs'), 'utf8');
  const importer = readFileSync(join(root, 'src/utils/importProject.ts'), 'utf8');
  const importPolicy = readFileSync(join(root, 'src/lib/workspace/importPolicy.mjs'), 'utf8');
  const exporter = readFileSync(join(root, 'src/utils/downloadProject.ts'), 'utf8');
  const exportPolicy = readFileSync(join(root, 'src/lib/workspace/exportPolicy.mjs'), 'utf8');
  const persistencePolicy = readFileSync(join(root, 'src/lib/workspace/persistencePolicy.mjs'), 'utf8');
  const persistenceBoundary = readFileSync(join(root, 'src/components/WorkspacePersistenceBoundary.tsx'), 'utf8');
  const store = readFileSync(join(root, 'src/store/useStore.ts'), 'utf8');
  const snapshotPolicy = readFileSync(join(root, 'src/lib/projects/snapshotPolicy.mjs'), 'utf8');
  const snapshots = readFileSync(join(root, 'src/lib/projects/projectSnapshots.ts'), 'utf8');
  const agentHistory = readFileSync(join(root, 'src/lib/agent/agentHistory.ts'), 'utf8');
  const standalone = readFileSync(join(root, 'FREE_LOCAL_EDITOR.html'), 'utf8');

  if (!/sandbox="allow-scripts"/.test(preview) || /allow-same-origin|allow-forms|allow-popups|allow-top-navigation/.test(preview)) {
    report('src/components/Preview/LivePreview.tsx', 'iframe-sandbox', 'preview must use scripts-only opaque-origin sandbox');
  }
  for (const directive of ["default-src 'none'", "connect-src 'none'", "form-action 'none'", "object-src 'none'", "base-uri 'none'"]) {
    if (!previewPolicy.includes(directive)) report('src/lib/workspace/previewPolicy.mjs', 'preview-csp', `missing ${directive}`);
  }
  if (!/window\.confirm\(summary\)/.test(importer)) report('src/utils/importProject.ts', 'missing-review', 'ZIP replacement needs explicit user review');
  for (const token of ['maxArchiveBytes', 'maxEntries', 'maxFiles', 'maxFileBytes', 'maxTotalBytes', 'case-colliding', 'symbolic links']) {
    if (!importPolicy.includes(token)) report('src/lib/workspace/importPolicy.mjs', 'import-boundary', `missing ${token} control`);
  }

  if (!/window\.confirm\(formatExportReview\(plan\)\)/.test(exporter)) {
    report('src/utils/downloadProject.ts', 'missing-export-review', 'ZIP export needs explicit summary confirmation');
  }
  for (const token of ['maxFiles', 'maxFileBytes', 'maxTotalBytes', 'generated-or-vendored', 'sensitive-path', 'credential:', 'case-colliding']) {
    if (!exportPolicy.includes(token)) report('src/lib/workspace/exportPolicy.mjs', 'export-boundary', `missing ${token} control`);
  }
  if (/addFilesToZip\s*\(/.test(exporter)) {
    report('src/utils/downloadProject.ts', 'raw-export', 'raw recursive ZIP export must not bypass the reviewed plan');
  }

  for (const token of [
    'prepareProjectExport',
    'maxSerializedBytes: 4 * 1024 * 1024',
    'ttlMs: 12 * 60 * 60 * 1000',
    'workspace contains sensitive',
    'createExpiringSessionStorage',
    'legacyEditorLocal',
  ]) {
    if (!persistencePolicy.includes(token)) report('src/lib/workspace/persistencePolicy.mjs', 'persistence-boundary', `missing ${token}`);
  }
  for (const token of ['skipHydration: true', 'prepareEditorStateForPersistence', 'ai-code-editor-private-session-v2']) {
    if (!store.includes(token)) report('src/store/useStore.ts', 'store-persistence', `missing ${token}`);
  }
  const partializeSection = store.slice(store.indexOf('partialize:'));
  if (/chatMessages\s*:/.test(partializeSection)) {
    report('src/store/useStore.ts', 'chat-persistence', 'chat messages must not be included in persisted state');
  }
  for (const token of ['createExpiringSessionStorage', 'useStore.persist.rehydrate()', 'setStatus("blocked")', 'Private session storage is unavailable']) {
    if (!persistenceBoundary.includes(token)) {
      report('src/components/WorkspacePersistenceBoundary.tsx', 'state-routing', `missing ${token}`);
    }
  }
  if (/useStore\.setState\(\{ \.\.\.useStore\.getState\(\) \}\)/.test(persistenceBoundary)) {
    report('src/components/WorkspacePersistenceBoundary.tsx', 'pre-hydration-write', 'boundary must not write initial state before hydration');
  }
  if (/catch\([\s\S]{0,500}setStatus\("ready"\)/.test(persistenceBoundary)) {
    report('src/components/WorkspacePersistenceBoundary.tsx', 'fail-open-storage', 'storage setup failure must block the editor');
  }
  for (const key of ['legacyEditorLocal', 'cursor_ai_agent_history_v1', 'cursor_ai_file_history_v1']) {
    if (!persistenceBoundary.includes(key)) report('src/components/WorkspacePersistenceBoundary.tsx', 'legacy-purge', `missing legacy purge for ${key}`);
  }

  for (const token of ['maxSnapshots: 5', 'maxSnapshotBytes: 1024 * 1024', 'ttlMs: 12 * 60 * 60 * 1000', 'prepareProjectExport', 'snapshot blocked']) {
    if (!snapshotPolicy.includes(token)) report('src/lib/projects/snapshotPolicy.mjs', 'snapshot-boundary', `missing ${token}`);
  }
  if (!snapshots.includes('window.sessionStorage') || /localStorage\.setItem/.test(snapshots)) {
    report('src/lib/projects/projectSnapshots.ts', 'snapshot-storage', 'project snapshots must be session-only');
  }
  if (!agentHistory.includes('window.sessionStorage') || /localStorage\.setItem/.test(agentHistory) || !agentHistory.includes('MAX_ENTRIES = 50')) {
    report('src/lib/agent/agentHistory.ts', 'prompt-storage', 'agent prompt history must be bounded and session-only');
  }

  if (!/Standalone editor retired/.test(standalone) || /srcdoc|eval\s*\(|new\s+Function/.test(standalone)) {
    report('FREE_LOCAL_EDITOR.html', 'legacy-runtime', 'standalone file must remain a non-executing retirement notice');
  }
}

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.next', 'dist', 'out'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (statSync(path).size <= 1_500_000) {
      const text = readFileSync(path, 'utf8');
      if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) report(relative(root, path), 'private-key', 'private key found');
      if (/\bsk-[A-Za-z0-9_-]{20,}\b/.test(text)) report(relative(root, path), 'api-key', 'credential-shaped API key found');
    }
  }
}

walk(root);

if (findings.length) {
  console.error(`Workspace security check failed with ${findings.length} finding(s):`);
  for (const finding of findings) console.error(`- ${finding.file} [${finding.rule}]: ${finding.detail}`);
  process.exit(1);
}
console.log('Workspace security check passed.');
