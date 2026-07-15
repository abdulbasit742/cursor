# AGENTS.md

## Scope

These instructions apply to the entire `abdulbasit742/cursor` repository.

Project: **AI Code Editor**, a local-first Next.js / React / TypeScript workspace with Monaco, optional OpenAI-compatible APIs, reviewed ZIP import/export, bounded session-scoped source state, and static-by-default sandboxed preview.

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
- Local AI access must remain explicit, development-only, exact same-origin, and loopback-bound. Never infer trust from `Host` alone or accept missing-Origin local API requests.
- Preserve credential-free HTTPS origin allowlisting, matching request Host, bearer authorization, body/file/project limits, no-store responses, and sanitized public errors.
- Rate-limit by the authorized principal. Do not trust `X-Forwarded-For` or another caller-controlled proxy header without a separately designed trusted-proxy boundary.
- Keep rate state cardinality bounded and expired state removable.
- Scan provider-bound source for credential-shaped content, but never present the scanner as complete secret detection.
- Model output remains a proposal. Do not apply, execute, commit, push, publish, or run generated code without explicit review and approval.

## Browser persistence boundary

- Disable automatic Zustand hydration. Install the reviewed session adapter, purge legacy durable keys, and only then explicitly rehydrate.
- Persist workspace source only when the complete tree passes path, collision, size, generated-content, and credential checks. Never persist a silently filtered partial project.
- Keep the serialized workspace cap at 4 MiB and expiry at 12 hours unless a separately reviewed migration tightens them.
- Chat messages must remain memory-only in the main editor store. Agent history may be session-only only under its separate entry cap.
- Preserve `WorkspacePersistenceBoundary`, `persistencePolicy.mjs`, and purge of legacy durable source/prompt keys.
- Do not write raw source, prompts, credentials, or complete workspace trees to `localStorage`, IndexedDB, Cache Storage, cookies, URLs, or analytics.
- Snapshots must reuse the reviewed export path/credential policy, remain capped at 5 and 1 MiB each, and expire after 12 hours.
- Never silently create an incomplete snapshot by excluding sensitive/generated entries. Block the snapshot and the pending destructive action.
- Durable retention is the reviewed safe ZIP export; adding another durable persistence mode requires a separate threat model and explicit user opt-in.
- Treat session storage as retention minimization, not encryption.

## Workspace import boundary

- Treat every imported ZIP as untrusted.
- Preserve hard archive, entry, file-count, per-file, and expanded-size caps.
- Reject absolute paths, traversal, control characters, unsafe platform names, symlinks, case collisions, NUL bytes, and invalid UTF-8.
- Skip populated environment files, hidden/sensitive files, generated dependencies, build output, and binary content.
- Require a visible import summary and explicit user confirmation before replacing the current workspace.
- Do not weaken limits through environment variables or query parameters.

## Workspace export boundary

- Preserve hard file-count, depth, per-file, and total-text caps before creating a ZIP.
- Reject unsafe and case-colliding paths.
- Exclude generated/vendor folders, populated environment files, private-key-like paths, and robust credential-pattern matches.
- Always show a summary and require explicit confirmation before download, even when no sensitive item is detected.
- Keep secret detection best-effort; never describe an export as guaranteed secret-free.
- Do not reintroduce a raw recursive `zip.file(...)` path that bypasses `exportPolicy.mjs`.

## Preview boundary

- Static HTML/CSS preview is the default; do not grant script execution merely because the preview panel is open.
- Keep standalone preview JavaScript capped at 256 KiB and require explicit approval for the exact current HTML/JavaScript pair.
- Editing either approved file must revoke approval automatically, and the operator must retain an immediate Stop action.
- Strip HTML script tags, inline event handlers, refresh metadata, and outbound URL attributes before rendering.
- Keep the iframe sandbox least-privilege: empty while scripts are paused and exactly `allow-scripts` after approval. Never add same-origin, forms, popups, downloads, navigation, or parent access.
- Keep the preview document CSP default-deny with `connect-src 'none'`; paused mode must use `script-src 'none'`.
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
- Static preview contains no executable runtime before approval.
- Approval is exact-content, bounded, revocable, and automatically invalidated after HTML/JavaScript edits.
- Legacy local source state cannot hydrate before the reviewed session adapter.
- No chat message appears in persisted Zustand state.
- No new provider endpoint, execution capability, browser permission, or durable persistence surface is introduced without explicit review and documentation.
- Residual risks and deployment assumptions remain accurate.
