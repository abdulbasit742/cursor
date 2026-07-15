const encoder = new TextEncoder();

export const MAX_PREVIEW_SCRIPT_BYTES = 256 * 1024;

const PREVIEW_CSP_BASE = [
  "default-src 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "child-src 'none'",
  "connect-src 'none'",
  "form-action 'none'",
  "img-src data: blob:",
  "media-src data: blob:",
  "font-src data:",
  "style-src 'unsafe-inline'",
];

export function buildPreviewCsp(allowScripts = false) {
  return [...PREVIEW_CSP_BASE, allowScripts ? "script-src 'unsafe-inline'" : "script-src 'none'"].join('; ');
}

export const PREVIEW_CSP = buildPreviewCsp(true);
export const PREVIEW_CSP_SCRIPTS_DISABLED = buildPreviewCsp(false);

function escapeClosingTag(value, tag) {
  return String(value ?? '').replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`);
}

export function stripScriptElements(html) {
  return String(html ?? '').replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');
}

function stripInlineEventHandlers(html) {
  return String(html ?? '').replace(
    /\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    '',
  );
}

function stripRefreshMetadata(html) {
  return String(html ?? '').replace(
    /<meta\b(?=[^>]*http-equiv\s*=\s*(?:"refresh"|'refresh'|refresh))[^>]*>/gi,
    '',
  );
}

function stripOutboundUrlAttributes(html) {
  return String(html ?? '').replace(
    /\s+(href|src|srcset|action|formaction)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (attribute, name, doubleQuoted, singleQuoted, unquoted) => {
      const value = String(doubleQuoted ?? singleQuoted ?? unquoted ?? '').trim();
      const lowerName = String(name).toLowerCase();
      const lowerValue = value.toLowerCase();
      const allowed = lowerName === 'href'
        ? lowerValue.startsWith('#')
        : ['src', 'srcset'].includes(lowerName)
          && (lowerValue.startsWith('data:') || lowerValue.startsWith('blob:'));
      return allowed ? attribute : '';
    },
  );
}

export function sanitizePreviewHtml(html) {
  return stripOutboundUrlAttributes(
    stripInlineEventHandlers(
      stripRefreshMetadata(
        stripScriptElements(html),
      ),
    ),
  );
}

export function inspectPreviewJavaScript({ html = '', js = '' } = {}) {
  const htmlText = String(html ?? '');
  const jsText = String(js ?? '');
  const htmlScriptCount = (htmlText.match(/<script\b/gi) || []).length;
  const scriptBytes = encoder.encode(jsText).byteLength;
  const hasRunnableScript = jsText.trim().length > 0;
  const hasJavaScript = hasRunnableScript || htmlScriptCount > 0;
  let blockedReason = null;
  if (scriptBytes > MAX_PREVIEW_SCRIPT_BYTES) {
    blockedReason = `preview JavaScript exceeds ${MAX_PREVIEW_SCRIPT_BYTES} bytes`;
  } else if (htmlScriptCount > 0 && !hasRunnableScript) {
    blockedReason = 'HTML script elements are removed; add reviewed code to a standalone .js file';
  }
  return Object.freeze({
    hasJavaScript,
    hasRunnableScript,
    htmlScriptCount,
    scriptBytes,
    allowed: hasRunnableScript && scriptBytes <= MAX_PREVIEW_SCRIPT_BYTES,
    blockedReason,
  });
}

export function createPreviewConsent({ html = '', js = '' } = {}) {
  return Object.freeze({ html: String(html ?? ''), js: String(js ?? '') });
}

export function isPreviewConsentCurrent(consent, { html = '', js = '' } = {}) {
  return Boolean(
    consent
      && consent.html === String(html ?? '')
      && consent.js === String(js ?? ''),
  );
}

export function buildPreviewDocument({ html = '', css = '', js = '', allowScripts = false } = {}) {
  const safeHtml = sanitizePreviewHtml(html);
  const safeCss = escapeClosingTag(css, 'style');
  const safeJs = escapeClosingTag(js, 'script');
  const scriptStatus = inspectPreviewJavaScript({ html, js });
  if (allowScripts && !scriptStatus.allowed) {
    throw new RangeError(scriptStatus.blockedReason || 'preview JavaScript is not runnable');
  }
  const csp = buildPreviewCsp(Boolean(allowScripts)).replaceAll('"', '&quot;');
  const runtime = allowScripts ? `
  <script>
    addEventListener('error', (event) => {
      const pre = document.createElement('pre');
      pre.style.cssText = 'color:#b91c1c;background:#fef2f2;padding:12px;white-space:pre-wrap';
      pre.textContent = String(event.error?.stack || event.message || 'Preview error');
      document.body.append(pre);
    });
    try {
      ${safeJs}
    } catch (error) {
      const pre = document.createElement('pre');
      pre.style.cssText = 'color:#b91c1c;background:#fef2f2;padding:12px;white-space:pre-wrap';
      pre.textContent = String(error?.stack || error);
      document.body.append(pre);
    }
  <\/script>` : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="referrer" content="no-referrer">
  <style>${safeCss}</style>
</head>
<body>
  ${safeHtml}${runtime}
</body>
</html>`;
}
