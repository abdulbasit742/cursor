# Security audit — 2026-07-15

## Fixed in this change

- AI endpoints were callable without authentication or origin policy.
- Arbitrarily large messages, current files, and project trees could reach the server/provider.
- Public deployment could expose the configured provider account to unbounded visitor use.
- Provider-bound code had no common credential-material gate.
- Agent route returned raw internal exception messages.
- AI responses lacked explicit no-store handling.
- ZIP import had no archive, entry, file, expanded-size, symlink, path-collision, encoding, or binary-content bounds.
- Imported projects replaced the workspace without an explicit trust review.
- Previewed JavaScript could make outbound requests because the iframe had no restrictive document CSP.
- The single-file fallback executed unreviewed project code outside the maintained trust controls.
- No automated contract protected the preview sandbox, import boundary, or AI request boundary.

## Current controls

- Loopback-only AI endpoints by default.
- Explicit remote enablement, HTTPS origin allowlist, and bearer token for public access.
- JSON content-type, 600 KB body cap, 4,000-character prompt cap, per-file/project limits, file count/depth/name validation, and 20 requests per minute per process key.
- Common private-key and provider-token patterns block remote-provider submission.
- Sanitized file trees are passed into agent context.
- ZIP import caps: 10 MB archive, 250 entries, 200 text files, 512 KB per file, and 8 MB expanded text.
- Absolute paths, traversal, Windows-reserved components, symlinks, case collisions, hidden secrets, generated dependencies, binary extensions, NUL bytes, and invalid UTF-8 are rejected or skipped.
- A summary shows imported/skipped/script file counts before the user approves workspace replacement.
- Preview iframe uses only `sandbox="allow-scripts"`, without same-origin/forms/popups/navigation privileges.
- Preview CSP denies all by default, including connections, forms, frames, objects, and base URLs; only inline preview code and data/blob media are allowed.
- Provider output remains selected/reviewed before apply and a project snapshot is created before changes.
- Sanitized public errors and no-store responses.
- The standalone file is now a non-executing retirement notice.
- Node tests, two source scanners, typecheck, and production build in CI.

## Residual risks

- The in-memory rate limiter is per process and is not sufficient for a horizontally scaled public service.
- A shared bearer token is an operator safeguard, not multi-user authentication. Add server sessions, users, authorization, revocation, and audit logs before shared hosting.
- Pattern detection cannot identify every secret or sensitive data item. Users must review provider-bound context.
- Provider data retention and training policies remain external trust decisions.
- Browser local persistence may contain user source code on the workstation; do not use this editor for secrets or regulated data.
- JSZip must allocate each accepted entry during extraction. Preflight sizes substantially reduce decompression-bomb risk but do not create a separate process or memory sandbox.
- Preview code can consume CPU in the browser tab. Add a worker/process timeout or disposable runtime before supporting hostile multi-user projects.
- Client-side limits can be modified by a user who controls their browser; they protect the application UX, not a server-side file service.
