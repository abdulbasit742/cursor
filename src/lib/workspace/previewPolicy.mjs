export const PREVIEW_CSP = [
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
  "script-src 'unsafe-inline'",
].join('; ');

function escapeClosingTag(value, tag) {
  return String(value ?? '').replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`);
}

export function stripScriptElements(html) {
  return String(html ?? '').replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');
}

export function buildPreviewDocument({ html = '', css = '', js = '' } = {}) {
  const safeHtml = stripScriptElements(html);
  const safeCss = escapeClosingTag(css, 'style');
  const safeJs = escapeClosingTag(js, 'script');
  const csp = PREVIEW_CSP.replaceAll('"', '&quot;');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="referrer" content="no-referrer">
  <style>${safeCss}</style>
</head>
<body>
  ${safeHtml}
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
  <\/script>
</body>
</html>`;
}
