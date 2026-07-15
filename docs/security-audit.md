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
- Project export recursively included every workspace file without size limits, secret filtering, or user review.
- Previewed JavaScript could make outbound requests because the iframe had no restrictive document CSP.
- The single-file fallback executed unreviewed project code outside the maintained trust controls.
- Zustand persisted the complete workspace, open files, and chat indefinitely in `localStorage`.
- Legacy Zustand state could hydrate before a client-side storage adapter was installed.
- Project history retained up to 30 full workspace copies without expiry, secret checks, or a storage-size cap.
- Agent prompt history retained up to 200 entries across browser restarts.
- Destructive operations claimed to have a rollback snapshot even when browser storage failed or unsafe content should not have been retained.

## Current controls

- Local AI is explicit (`EDITOR_LOCAL_AI_ENABLED=true`), development-only, and requires an exact loopback Host/Origin match.
- Missing-Origin, cross-loopback, remote-origin, and production local requests fail closed.
- Public AI requires explicit remote enablement, credential-free HTTPS origin allowlist, matching Host, and bearer token.
- Remote rate-limit principals are derived from a one-way token hash; raw tokens and forwarded-IP headers are not retained or trusted.
- In-memory rate state is capped at 256 principals and expired buckets are pruned.
- JSON content-type, 600 KB body cap, 4,000-character prompt cap, per-file/project limits, file count/depth/name validation, and 20 requests per minute per authorized principal.
- Common private-key and provider-token patterns block remote-provider submission.
- Sanitized file trees are passed into agent context.
- Zustand automatic hydration is disabled. The reviewed expiring session adapter is installed first, legacy durable keys are deleted, and only then is state explicitly rehydrated.
- Workspace persistence is limited to 4 MiB and 12 hours in `sessionStorage`. Any sensitive/generated path, credential-shaped content, malformed tree, case collision, or size violation blocks the entire source tree from persistence.
- Chat messages are excluded from the main persisted state. If source persistence is blocked, only low-sensitivity editor/UI preferences remain.
- Agent prompt history is session-only and capped at 50 entries; its previous durable key is removed.
- Project snapshots are session-only, capped at 5, limited to 1 MiB, and expire after 12 hours.
- Snapshot creation reuses the reviewed export path/credential policy and is blocked if any sensitive/generated entry would be excluded.
- A blocked snapshot throws before import, reset, or agent apply can continue, preventing a false rollback claim.
- Legacy local project snapshot, filesystem snapshot, file-history, agent-history, and Zustand keys are purged by the root persistence boundary.
- ZIP import caps: 10 MB archive, 250 entries, 200 text files, 512 KB per file, and 8 MB expanded text.
- Import rejects or skips absolute paths, traversal, Windows-reserved components, symlinks, case collisions, hidden secrets, generated dependencies, binary extensions, NUL bytes, and invalid UTF-8.
- A summary shows imported/skipped/script file counts before the user approves workspace replacement.
- ZIP export caps: 200 files, 512 KB per file, 8 MB total text, and depth 20.
- Export rejects unsafe or case-colliding paths, excludes generated/vendor directories and sensitive filenames, scans robust credential patterns, and always requires summary confirmation.
- Preview iframe uses only `sandbox="allow-scripts"`, without same-origin/forms/popups/navigation privileges.
- Preview CSP denies all by default, including connections, forms, frames, objects, and base URLs; only inline preview code and data/blob media are allowed.
- Provider output remains selected/reviewed before apply and a safe project snapshot is required before changes.
- Sanitized public errors, no-store responses, Node tests, source scanners, typecheck, and production build in CI.

## Residual risks

- Development local mode is safe only when the server is actually bound to loopback. HTTP headers cannot prove the network peer address through every proxy/runtime.
- The in-memory rate limiter is per process and is not sufficient for a horizontally scaled public service.
- A shared bearer token is an operator safeguard, not multi-user authentication. Add server sessions, users, authorization, revocation, distributed rate limiting, and audit logs before shared hosting.
- Pattern detection cannot identify every secret or sensitive data item. Users must review provider-bound context and export summaries.
- Provider data retention and training policies remain external trust decisions.
- `sessionStorage` is retention minimization, not encryption or process isolation. Same-origin scripts and browser extensions may access current-session source and prompts.
- A secret not recognized by pattern detection can still be retained for the current session; explicit safe export and manual review remain required for durable sharing.
- Other low-sensitivity convenience modules may retain UI metadata in browser storage; they must not be expanded to raw source, prompts, credentials, or regulated data without a separate review.
- JSZip import/export processing still allocates accepted entries in the browser. Size caps reduce risk but do not create a separate process or memory sandbox.
- Preview code can consume CPU in the browser tab. Add a worker/process timeout or disposable runtime before supporting hostile multi-user projects.
