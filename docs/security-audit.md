# Security audit — 2026-07-15

## Fixed in this change

- AI endpoints were callable without authentication or origin policy.
- Arbitrarily large messages, current files, and project trees could reach the server/provider.
- Public deployment could expose the configured provider account to unbounded visitor use.
- Provider-bound code had no common credential-material gate.
- Agent route returned raw internal exception messages.
- AI responses lacked explicit no-store handling.
- No automated contract protected the preview sandbox or AI request boundary.

## Current controls

- Loopback-only AI endpoints by default.
- Explicit remote enablement, HTTPS origin allowlist, and bearer token for public access.
- JSON content-type, 600 KB body cap, 4,000-character prompt cap, per-file/project limits, file count/depth/name validation, and 20 requests per minute per process key.
- Common private-key and provider-token patterns block remote-provider submission.
- Sanitized file trees are passed into agent context.
- Preview iframe allows scripts but not same-origin access.
- Provider output remains selected/reviewed before apply and a project snapshot is created before changes.
- Sanitized public errors and no-store responses.
- Node tests, source scanner, typecheck, and production build in CI.

## Residual risks

- The in-memory rate limiter is per process and is not sufficient for a horizontally scaled public service.
- A shared bearer token is an operator safeguard, not multi-user authentication. Add server sessions, users, authorization, revocation, and audit logs before shared hosting.
- Pattern detection cannot identify every secret or sensitive data item. Users must review provider-bound context.
- Provider data retention and training policies remain external trust decisions.
- Browser local persistence may contain user source code on the workstation.
- The standalone `FREE_LOCAL_EDITOR.html` is a separate demonstration and does not inherit the Next.js API controls.
