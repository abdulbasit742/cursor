import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPreviewDocument, PREVIEW_CSP, stripScriptElements } from '../src/lib/workspace/previewPolicy.mjs';

test('removes scripts embedded in imported HTML', () => {
  assert.equal(stripScriptElements('<h1>Hi</h1><script>fetch("https://evil")</script>'), '<h1>Hi</h1>');
});

test('preview policy denies network, forms, frames, and objects', () => {
  assert.match(PREVIEW_CSP, /connect-src 'none'/);
  assert.match(PREVIEW_CSP, /form-action 'none'/);
  assert.match(PREVIEW_CSP, /frame-src 'none'/);
  assert.match(PREVIEW_CSP, /object-src 'none'/);
  assert.match(PREVIEW_CSP, /base-uri 'none'/);
});

test('builds a complete document with no referrer', () => {
  const document = buildPreviewDocument({ html: '<main>Hello</main>', css: 'body{color:red}', js: 'console.log("ok")' });
  assert.match(document, /Content-Security-Policy/);
  assert.match(document, /name="referrer" content="no-referrer"/);
  assert.match(document, /<main>Hello<\/main>/);
});

test('escapes closing style and script tags from user content', () => {
  const document = buildPreviewDocument({ css: '</style><img src=x>', js: '</script><img src=x>' });
  assert.doesNotMatch(document, /<style><\/style><img/);
  assert.doesNotMatch(document, /<script>[\s\S]*<\/script><img/);
});

test('renders runtime errors with textContent instead of HTML injection', () => {
  const document = buildPreviewDocument({ js: 'throw new Error("boom")' });
  assert.match(document, /pre\.textContent/);
  assert.doesNotMatch(document, /innerHTML \+=/);
});
