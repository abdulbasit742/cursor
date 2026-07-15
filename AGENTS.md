# AGENTS.md

## Scope

These instructions apply to the entire `abdulbasit742/cursor` repository.

Project: **AI Code Editor**, a local-first Next.js / React / TypeScript workspace with Monaco, optional OpenAI-compatible APIs, ZIP import, and sandboxed HTML/CSS/JavaScript preview.

## Required commands

Use the committed npm lockfile and Node.js 20 or newer.

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run test
npm run security-check
npm run typecheck
npm run build
```

## AI API boundary

- Keep provider credentials in server environment variables only.
- Keep remote AI access disabled by default.
- Preserve loopback origin handling, explicit HTTPS origin allowlisting, bearer authorization, body/file/project/rate limits, no-store responses, and sanitized public errors.
- Scan provider-bound source for credential-shaped content, but never present the scanner as complete secret detection.
- Model output remains a proposal. Do not apply, execute, commit, push, publish, or run generated code without explicit review and approval.

## Workspace import boundary

- Treat every imported ZIP as untrusted.
- Preserve hard archive, entry, file-count, per-file, and expanded-size caps.
- Reject absolute paths, traversal, control characters, unsafe platform names, symlinks, case collisions, NUL bytes, and invalid UTF-8.
- Skip populated environment files, hidden/sensitive files, generated dependencies, build output, and binary content.
- Require a visible import summary and explicit user confirmation before replacing the current workspace.
- Do not weaken limits through environment variables or query parameters.

## Preview boundary

- Keep the iframe sandbox exactly least-privilege: scripts may run, but same-origin, forms, popups, downloads, navigation, and parent access are not granted.
- Keep the preview document CSP default-deny with `connect-src 'none'` and no remote resources.
- Render preview errors with `textContent`, never untrusted HTML.
- Do not restore executable behavior to `FREE_LOCAL_EDITOR.html`; it is a retirement notice.

## General working rules

1. Read `README.md`, `docs/security-audit.md`, relevant policies, and nearby tests before editing.
2. Preserve unrelated work and make the smallest coherent change.
3. Do not hand-edit generated dependencies, build output, or lockfiles except through the package manager.
4. Never commit secrets, tokens, private keys, production data, or populated environment files.
5. Update tests and documentation whenever trust boundaries, configuration, public APIs, or user-visible claims change.
6. Never report a check as passed unless it actually ran; state unavailable checks and the concrete reason.

## Completion checklist

- Relevant focused tests pass.
- Both security scanners pass.
- Typecheck and production build pass when dependencies are available.
- No new provider endpoint, execution capability, browser permission, or persistence surface is introduced without explicit review and documentation.
- Residual risks and deployment assumptions remain accurate.
