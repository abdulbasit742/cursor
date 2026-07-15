import assert from 'node:assert/strict';
import test from 'node:test';
import {
  exportLimits,
  formatExportReview,
  prepareProjectExport,
} from '../src/lib/workspace/exportPolicy.mjs';

const file = (name, content = 'safe text') => ({ name, type: 'file', content });
const folder = (name, children) => ({ name, type: 'folder', children });

test('includes safe text files with normalized paths', () => {
  const plan = prepareProjectExport([folder('src', [file('index.ts', 'export const ok = true;')])]);
  assert.equal(plan.fileCount, 1);
  assert.equal(plan.accepted[0].path, 'src/index.ts');
  assert.equal(plan.skippedCount, 0);
});

test('excludes environment and private-key paths', () => {
  const plan = prepareProjectExport([
    file('.env', 'TOKEN=value'),
    file('.env.example', 'TOKEN='),
    file('deploy.pem', 'not-even-inspected'),
  ]);
  assert.deepEqual(plan.accepted.map((entry) => entry.path), ['.env.example']);
  assert.deepEqual(plan.skipped.map((entry) => entry.path), ['.env', 'deploy.pem']);
});

test('excludes robust credential-shaped content', () => {
  const plan = prepareProjectExport([
    file('safe.txt', 'hello'),
    file('token.txt', 'sk-abcdefghijklmnopqrstuvwxyz123456'),
  ]);
  assert.deepEqual(plan.accepted.map((entry) => entry.path), ['safe.txt']);
  assert.match(plan.skipped[0].reason, /^credential:/);
});

test('excludes generated folders without traversing their contents', () => {
  const plan = prepareProjectExport([
    folder('node_modules', [file('package.js', 'large dependency')]),
    folder('src', [file('app.ts', 'export {};')]),
  ]);
  assert.deepEqual(plan.accepted.map((entry) => entry.path), ['src/app.ts']);
  assert.deepEqual(plan.skipped, [{ path: 'node_modules', reason: 'generated-or-vendored' }]);
});

test('rejects duplicate and case-colliding paths', () => {
  assert.throws(
    () => prepareProjectExport([file('Readme.md'), file('README.md')]),
    /case-colliding/,
  );
});

test('rejects unsafe paths and NUL content', () => {
  assert.throws(() => prepareProjectExport([file('../secret.txt')]), /traversal/);
  assert.throws(() => prepareProjectExport([file('bad.txt', 'a\0b')]), /NUL/);
});

test('enforces per-file and total file-count bounds', () => {
  assert.throws(
    () => prepareProjectExport([file('large.txt', 'x'.repeat(exportLimits.maxFileBytes + 1))]),
    /file exceeds/,
  );
  const tooMany = Array.from({ length: exportLimits.maxFiles + 1 }, (_, index) => file(`file-${index}.txt`));
  assert.throws(() => prepareProjectExport(tooMany), /more than/);
});

test('review summary is explicit about exclusions and detection limits', () => {
  const plan = prepareProjectExport([file('app.ts'), file('.env', 'TOKEN=value')]);
  const summary = formatExportReview(plan);
  assert.match(summary, /Review project export/);
  assert.match(summary, /1 sensitive\/generated/);
  assert.match(summary, /best-effort/);
  assert.match(summary, /Continue/);
});
