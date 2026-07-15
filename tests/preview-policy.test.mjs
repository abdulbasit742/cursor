import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPreviewCsp,
  buildPreviewDocument,
  createPreviewConsent,
  inspectPreviewJavaScript,
  isPreviewConsentCurrent,
  MAX_PREVIEW_SCRIPT_BYTES,
  sanitizePreviewHtml,
  stripScriptElements,
} from '../src/lib/workspace/previewPolicy.mjs';

test('removes scripts embedded in imported HTML', () => {
  assert.equal(stripScriptElements('<h1>Hi</h1><script>fetch("https://evil")</script>'), '<h1>Hi</h1>');
});

test('removes inline handlers, refresh metadata, and outbound preview URLs', () => {
  const html = sanitizePreviewHtml(
    '<meta http-equiv="refresh" content="0;url=https://evil.example">'
    + '<a href="https://evil.example" onclick="steal()">leave</a>'
    + '<a href="#section">inside</a><img src="data:image/png;base64,AA==">',
  );
  assert.doesNotMatch(html, /http-equiv|https:\/\/evil|onclick/);
  assert.match(html, /href="#section"/);
  assert.match(html, /src="data:image\/png;base64,AA=="/);
});

test('static preview disables scripts and emits no runtime script', () => {
  const document = buildPreviewDocument({ html: '<main>Hello</main>', css: 'body{color:red}', js: 'console.log("no")' });
  assert.match(document, /script-src 'none'/);
  assert.doesNotMatch(document, /console\.log\("no"\)/);
  assert.doesNotMatch(document, /<script>/);
});

test('explicit script mode keeps network and form restrictions', () => {
  const document = buildPreviewDocument({ html: '<main>Hello</main>', js: 'console.log("ok")', allowScripts: true });
  assert.match(document, /script-src 'unsafe-inline'/);
  assert.match(document, /connect-src 'none'/);
  assert.match(document, /form-action 'none'/);
  assert.match(document, /console\.log\("ok"\)/);
  assert.match(buildPreviewCsp(false), /script-src 'none'/);
});

test('blocks oversized preview JavaScript', () => {
  const js = 'x'.repeat(MAX_PREVIEW_SCRIPT_BYTES + 1);
  const status = inspectPreviewJavaScript({ js });
  assert.equal(status.allowed, false);
  assert.match(status.blockedReason, /exceeds/);
  assert.throws(() => buildPreviewDocument({ js, allowScripts: true }), /exceeds/);
});

test('HTML script tags are reported but never executed', () => {
  const status = inspectPreviewJavaScript({ html: '<script>alert(1)</script>' });
  assert.equal(status.htmlScriptCount, 1);
  assert.equal(status.allowed, false);
  assert.match(status.blockedReason, /standalone \.js file/);
});

test('consent is exact-content and invalidates after HTML or JavaScript changes', () => {
  const consent = createPreviewConsent({ html: '<main>A</main>', js: 'run()' });
  assert.equal(isPreviewConsentCurrent(consent, { html: '<main>A</main>', js: 'run()' }), true);
  assert.equal(isPreviewConsentCurrent(consent, { html: '<main>B</main>', js: 'run()' }), false);
  assert.equal(isPreviewConsentCurrent(consent, { html: '<main>A</main>', js: 'run(2)' }), false);
});

test('escapes closing style and script tags from user content', () => {
  const document = buildPreviewDocument({ css: '</style><img src=x>', js: '</script><img src=x>', allowScripts: true });
  assert.doesNotMatch(document, /<style><\/style><img/);
  assert.doesNotMatch(document, /<script>[\s\S]*<\/script><img/);
});

test('renders enabled runtime errors with textContent instead of HTML injection', () => {
  const document = buildPreviewDocument({ js: 'throw new Error("boom")', allowScripts: true });
  assert.match(document, /pre\.textContent/);
  assert.doesNotMatch(document, /innerHTML \+=/);
});
