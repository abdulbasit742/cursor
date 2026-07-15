# AI Code Editor

A local-first, review-before-apply coding workspace built with Next.js, Monaco Editor, Zustand, Tailwind CSS, and an optional OpenAI-compatible provider.

## Safety model

- Local browser AI access is an explicit development-only mode, not something inferred from a spoofable `Host` header.
- Local requests require `EDITOR_LOCAL_AI_ENABLED=true`, non-production runtime, and an exact loopback Host/Origin match.
- Shared/public AI access requires explicit enablement, a matching allowlisted HTTPS origin/host, and a bearer token of at least 24 characters.
- Rate limits use an authorized local-origin or hashed-token principal; untrusted forwarded-IP headers are ignored.
- The in-memory rate state is capped at 256 principals and expired buckets are removed.
- Requests have body, message, file, project, and per-minute limits.
- Credential-shaped source material is blocked before an OpenAI request is made.
- Provider output is proposed as code/diffs and requires user review before apply.
- Workspace persistence is installed before explicit hydration; legacy durable local copies are removed without loading them.
- A workspace is retained in `sessionStorage` for at most 12 hours only when every file passes the reviewed path, size, and credential checks. If any item is sensitive, generated, malformed, colliding, or oversized, source persistence fails closed and only low-sensitivity UI settings remain.
- Chat messages are never included in the Zustand persisted state. Agent prompt history is session-only and separately capped.
- Project snapshots are session-only, capped at 5, limited to 1 MiB each, and expire after 12 hours.
- A snapshot is blocked when the workspace contains sensitive/generated paths or credential-shaped content, so destructive import/reset/agent actions do not proceed with a false rollback claim.
- ZIP imports are preflighted before extraction and replacement: 10 MB archive, 250 entries, 200 text files, 512 KB per file, and 8 MB expanded text are hard limits.
- Absolute paths, traversal, case collisions, symlinks, hidden secrets, generated dependencies, binary files, invalid UTF-8, and NUL-containing files are rejected or skipped during import.
- The user sees an import summary and must explicitly approve replacing the current workspace.
- ZIP exports are preflighted before generation: 200 files, 512 KB per file, 8 MB total text, and depth 20 are hard limits.
- Export rejects unsafe/case-colliding paths, excludes generated/vendor folders and sensitive filenames, scans robust credential patterns, and requires an explicit summary confirmation.
- Live preview uses an opaque-origin `sandbox="allow-scripts"` iframe. Its CSP disables outbound connections, forms, frames, objects, base URLs, popups, and parent access.
- AI responses and preview documents are not cached, and unexpected server errors are not returned to clients.

## Features

- Monaco editor, file explorer, tabs, search, diagnostics, stats, and local source-control checkpoints
- isolated HTML/CSS/JavaScript live preview with network disabled
- local AI assistant fallback
- optional OpenAI chat and coding-agent plans
- multi-file diff preview, approval queue, validation, review, confidence, session snapshots, and run history
- bounded, reviewed ZIP import/export and local templates
- bounded session-scoped project, prompt, and editor state

## Local setup

Requirements: Node.js 20 or newer.

```bash
npm ci --ignore-scripts --no-audit --no-fund
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The template explicitly enables local AI for `next dev`:

```dotenv
EDITOR_LOCAL_AI_ENABLED=true
OPENAI_API_KEY=
AGENT_PROVIDER=local
```

The browser Origin must exactly match the loopback Host. Missing-Origin requests, cross-loopback combinations such as `localhost` → `127.0.0.1`, and production local mode are denied. Bind the development server to loopback; do not expose it as an unauthenticated network service.

Closing the browser tab/session or reaching the 12-hour TTL clears maintained persisted source and snapshots. Chat remains memory-only in the main editor store. Use the reviewed safe ZIP export for deliberate durable retention. This is privacy minimization, not encrypted storage: any script running in the same origin can still access current-session data.

## Optional OpenAI provider

```dotenv
OPENAI_API_KEY=your-key-in-env-only
OPENAI_MODEL=gpt-4o-mini
AGENT_PROVIDER=auto
```

Do not paste secrets into editor files. Detection gates cover common credential formats but cannot identify every secret. Review exactly what code is sent to a provider and every export summary before sharing a ZIP.

## Public deployment boundary

The AI routes remain disabled on non-loopback hosts unless all of these are configured:

```dotenv
EDITOR_REMOTE_AI_ENABLED=true
EDITOR_ALLOWED_ORIGINS=https://editor.example.com
EDITOR_API_TOKEN=use-a-random-secret-with-at-least-24-characters
```

The request Host must match the allowlisted Origin host, and non-loopback origins must use HTTPS. Public clients must send `Authorization: Bearer <EDITOR_API_TOKEN>`. The current browser UI is intentionally optimized for local development and does not persist or send an operator token. Add a proper authenticated server session before offering shared hosted access.

Do not set `EDITOR_LOCAL_AI_ENABLED=true` as a substitute for hosted authentication. Local mode is denied when `NODE_ENV=production`.

## Verification

```bash
npm run test
npm run security-check
npm run typecheck
npm run build
```

CI runs the same checks on Node.js 20 and 22. Regression suites cover deployment mode, Host/Origin spoofing, token principals, rate-bucket caps, ZIP import/export, fail-closed hydration, expiring session persistence, secret-aware snapshots, and preview isolation.

## Standalone prototype

`FREE_LOCAL_EDITOR.html` is now a non-executing retirement notice. The older single-file editor was removed because it could not enforce the maintained application's ZIP preflight, API authorization, reviewed export, session retention, or network-denied preview boundary.

## Documentation

- [Reference review](docs/reference-review.md)
- [Security audit](docs/security-audit.md)
