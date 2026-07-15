import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decodeImportedText,
  importLimits,
  inspectArchive,
  isSymlinkMode,
  normalizeArchivePath,
  stableImportId,
} from '../src/lib/workspace/importPolicy.mjs';

const entry = (name, uncompressedSize = 10, extra = {}) => ({ name, uncompressedSize, ...extra });

test('normalizes safe nested paths', () => {
  assert.equal(normalizeArchivePath('src\\components/App.tsx'), 'src/components/App.tsx');
});

test('rejects traversal and absolute paths', () => {
  assert.throws(() => normalizeArchivePath('../secret.txt'), /traversal/);
  assert.throws(() => normalizeArchivePath('/etc/passwd'), /absolute/);
  assert.throws(() => normalizeArchivePath('C:/secret.txt'), /absolute/);
});

test('rejects symbolic link entries', () => {
  assert.equal(isSymlinkMode(0o120777), true);
  assert.throws(() => inspectArchive({ archiveBytes: 100, entries: [entry('link', 4, { unixPermissions: 0o120777 })] }), /symbolic links/);
});

test('skips generated, hidden, and binary content', () => {
  const report = inspectArchive({
    archiveBytes: 1000,
    entries: [entry('src/index.ts', 20), entry('node_modules/x.js', 20), entry('.env', 20), entry('logo.png', 20)],
  });
  assert.deepEqual(report.accepted.map((item) => item.path), ['src/index.ts']);
  assert.equal(report.skippedCount, 3);
});

test('allows sanitized environment examples but not populated environment files', () => {
  const report = inspectArchive({ archiveBytes: 100, entries: [entry('.env.example', 30)] });
  assert.equal(report.fileCount, 1);
});

test('rejects case-colliding paths', () => {
  assert.throws(
    () => inspectArchive({ archiveBytes: 100, entries: [entry('src/App.tsx'), entry('src/app.tsx')] }),
    /case-colliding/,
  );
});

test('enforces file, total, entry, and archive limits', () => {
  assert.throws(() => inspectArchive({ archiveBytes: importLimits.maxArchiveBytes + 1, entries: [entry('a.txt')] }), /archive/);
  assert.throws(() => inspectArchive({ archiveBytes: 10, entries: [entry('a.txt', importLimits.maxFileBytes + 1)] }), /file exceeds/);
  assert.throws(
    () => inspectArchive({ archiveBytes: 10, entries: Array.from({ length: importLimits.maxEntries + 1 }, (_, index) => entry(`${index}.txt`)) }),
    /entries/,
  );
});

test('counts executable and markup files for the trust prompt', () => {
  const report = inspectArchive({ archiveBytes: 100, entries: [entry('index.html'), entry('app.js'), entry('README.md')] });
  assert.equal(report.scriptFiles, 2);
});

test('rejects binary-like or invalid UTF-8 text', () => {
  assert.throws(() => decodeImportedText(Uint8Array.from([65, 0, 66]), 'x.txt'), /NUL/);
  assert.throws(() => decodeImportedText(Uint8Array.from([0xff, 0xfe]), 'x.txt'), /UTF-8/);
});

test('generates stable collision-resistant IDs from full paths', () => {
  assert.equal(stableImportId('src/App.tsx'), stableImportId('src/App.tsx'));
  assert.notEqual(stableImportId('src/a-b.ts'), stableImportId('src/a/b.ts'));
});
