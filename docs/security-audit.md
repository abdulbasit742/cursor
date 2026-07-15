# Security audit — 2026-07-15

## Fixed in this change

- AI endpoints were callable without authentication or origin policy.
- Local access was inferred from the client-controlled `Host` header and accepted missing-Origin requests.
- API rate limits trusted spoofable `X-Forwarded-For` values and had unbounded bucket cardinality.
- Arbitrarily large messages, current files, and project trees could reach the server/provider.
- Public deployment could expose the configured provider account to unbounded visitor use.
- Provider-bound code had no common credential-material gate.
- Agent route returned raw internal exception messages.
- AI responses lacked explicit no-store handling.
- ZIP import had no archive, entry, file, expanded-size, symlink, path-collision, encoding, or binary-content bounds.
- Imported projects replaced the workspace without an explicit trust review.
- Previewed JavaScript could make outbound requests because the iframe had no restrictive document CSP.
- The single-file fallback executed unreviewed project code outside the maintained trust controls.

## Current controls

- Local AI is explicit (`EDITOR_LOCAL_AI_ENABLED=true`), development-only, and requires an exact loopback Host/Origin match.
- Missing-Origin, cross-loopback, remote-origin, and production local requests fail closed.
- Public AI requires explicit remote enablement, credential-free HTTPS origin allowlist, matching Host, and bearer token.
- Remote rate-limit principals are derived from a one-way token hash; raw tokens and forwarded-IP headers are not retained or trusted.
- In-memory rate state is capped at 256 principals and expired buckets are pruned.
- JSON content-type, 600 KB body cap, 4,000-character prompt cap, per-file/project limits, file count/depth/name validation, and 20 requests per minute per authorized principal.
- Common private-key and provider-token patterns block remote-provider submission.
- Sanitized file trees are passed into agent context.
- ZIP import caps: 10 MB archive, 250 entries, 200 text files, 512 KB per file, and 8 MB expanded text.
- Absolute paths, traversal, Windows-reserved components, symlinks, case collisions, hidden secrets, generated dependencies, binary extensions, NUL bytes, and invalid UTF-8 are rejected or skipped.
- A summary shows imported/skipped/script file counts before the user approves workspace replacement.
- Preview iframe uses only `sandbox="allow-scripts"`, without same-origin/forms/popups/navigation privileges.
- Preview CSP denies all by default, including connections, forms, frames, objects, and base URLs; only inline preview code and data/blob media are allowed.
- Provider output remains selected/reviewed before apply and a project snapshot is created before changes.
- Sanitized public errors, no-store responses, Node tests, source scanners, typecheck, and production build in CI.

## Residual risks

- Development local mode is safe only when the server is actually bound to loopback. HTTP headers cannot prove the network peer address through every proxy/runtime.
- The in-memory rate limiter is per process and is not sufficient for a horizontally scaled public service.
- A shared bearer token is an operator safeguard, not multi-user authentication. Add server sessions, users, authorization, revocation, distributed rate limiting, and audit logs before shared hosting.
- Pattern detection cannot identify every secret or sensitive data item. Users must review provider-bound context.
- Provider data retention and training policies remain external trust decisions.
- Browser local persistence may contain user source code on the workstation; do not use this editor for secrets or regulated data.
- JSZip preflight reduces decompression-bomb risk but does not create a separate process or memory sandbox.
- Preview code can consume CPU in the browser tab. Add a worker/process timeout or disposable runtime before supporting hostile multi-user projects.
