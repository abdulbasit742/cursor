# AI Code Editor

A local-first, review-before-apply coding workspace built with Next.js, Monaco Editor, Zustand, Tailwind CSS, and an optional OpenAI-compatible provider.

## Safety model

- The editor and local coding agent work on loopback without a provider key.
- `/api/ai` and `/api/agent` are loopback-only by default.
- Public AI API access requires explicit enablement, an allowlisted HTTPS origin, and a bearer token of at least 24 characters.
- Requests have body, message, file, project, and per-minute limits.
- Credential-shaped source material is blocked before an OpenAI request is made.
- Provider output is proposed as code/diffs and requires user review before apply.
- ZIP imports are preflighted before extraction and replacement: 10 MB archive, 250 entries, 200 text files, 512 KB per file, and 8 MB expanded text are hard limits.
- Absolute paths, traversal, case collisions, symlinks, hidden secrets, generated dependencies, binary files, invalid UTF-8, and NUL-containing files are rejected or skipped.
- The user sees an import summary and must explicitly approve replacing the current workspace.
- Live preview uses an opaque-origin `sandbox="allow-scripts"` iframe. Its CSP disables outbound connections, forms, frames, objects, base URLs, popups, and parent access.
- AI responses and preview documents are not cached, and unexpected server errors are not returned to clients.

## Features

- Monaco editor, file explorer, tabs, search, diagnostics, stats, and local source-control checkpoints
- isolated HTML/CSS/JavaScript live preview with network disabled
- local AI assistant fallback
- optional OpenAI chat and coding-agent plans
- multi-file diff preview, approval queue, validation, review, confidence, snapshots, and run history
- bounded ZIP import/export and local templates
- persistent editor settings and local project state

## Local setup

Requirements: Node.js 20 or newer.

```bash
npm ci --ignore-scripts --no-audit --no-fund
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Leave `OPENAI_API_KEY` blank and keep `AGENT_PROVIDER=local` for the no-provider mode.

## Optional OpenAI provider

```dotenv
OPENAI_API_KEY=your-key-in-env-only
OPENAI_MODEL=gpt-4o-mini
AGENT_PROVIDER=auto
```

Do not paste secrets into editor files. The detection gate covers common credential formats but is not a substitute for reviewing exactly what code is sent to a provider.

## Public deployment boundary

The AI routes remain disabled on non-loopback hosts unless all of these are configured:

```dotenv
EDITOR_REMOTE_AI_ENABLED=true
EDITOR_ALLOWED_ORIGINS=https://editor.example.com
EDITOR_API_TOKEN=use-a-random-secret-with-at-least-24-characters
```

Public clients must send `Authorization: Bearer <EDITOR_API_TOKEN>` over HTTPS. The current browser UI is intentionally optimized for local use and does not persist an operator token. Add a proper authenticated server session before offering shared hosted access.

## Verification

```bash
npm run test
npm run security-check
npm run typecheck
npm run build
```

CI runs the same checks on Node.js 20 and 22 with local provider mode.

## Standalone prototype

`FREE_LOCAL_EDITOR.html` is now a non-executing retirement notice. The older single-file editor was removed because it could not enforce the maintained application's ZIP preflight, API authorization, or network-denied preview boundary.

## Documentation

- [Reference review](docs/reference-review.md)
- [Security audit](docs/security-audit.md)
