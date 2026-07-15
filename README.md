# AI Code Editor

A local-first, review-before-apply coding workspace built with Next.js, Monaco Editor, Zustand, Tailwind CSS, and an optional OpenAI-compatible provider.

## Safety model

- The editor and local coding agent work on loopback without a provider key.
- `/api/ai` and `/api/agent` are loopback-only by default.
- Public AI API access requires explicit enablement, an allowlisted HTTPS origin, and a bearer token of at least 24 characters.
- Requests have body, message, file, project, and per-minute limits.
- Credential-shaped source material is blocked before an OpenAI request is made.
- Provider output is proposed as code/diffs and requires user review before apply.
- Live preview runs with `sandbox="allow-scripts"` and no same-origin permission.
- AI responses are not cached and unexpected server errors are not returned to clients.

## Features

- Monaco editor, file explorer, tabs, search, diagnostics, stats, and local source-control checkpoints
- isolated HTML/CSS/JavaScript live preview
- local AI assistant fallback
- optional OpenAI chat and coding-agent plans
- multi-file diff preview, approval queue, validation, review, confidence, snapshots, and run history
- ZIP import/export and local templates
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

## No-install fallback

`FREE_LOCAL_EDITOR.html` is a standalone demonstration. It is not the maintained Next.js security boundary and should not be presented as a hosted multi-user editor.
