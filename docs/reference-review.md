# Reference review

Reviewed on 2026-07-15 before hardening the AI request, imported-workspace, preview, and deployment-mode boundaries.

## Continue

Adopted: explicit provider configuration and a local-development-first workflow. Provider credentials remain server environment values rather than editor content or browser persistence.

Not adopted: extension framework, hosted control plane, telemetry, or provider abstraction migration.

## code-server

Adopted: local binding and public exposure are distinct deployment decisions; internet exposure requires authentication and encryption rather than trusting request headers. Local mode is now explicit and production local access fails closed.

Not adopted: terminal access, password-login UI, SSH forwarding automation, or code-server proxy/runtime architecture.

## Open WebUI

Adopted: a shared hosted AI surface needs real authentication and server-owned policy. The existing bearer token remains an operator-only safeguard, and documentation explicitly blocks presenting it as multi-user authentication.

Not adopted: user database, OAuth, admin console, provider proxy framework, or multi-tenant migration.

## OpenHands

Adopted: generated code and execution surfaces are untrusted. Provider output remains review-before-apply and no shell/browser automation capability was added.

Not adopted: container runtime, shell execution, browser automation, or autonomous task execution.

## Aider

Adopted: reviewable changes and source-control-aware safety thinking. The editor keeps diff preview, selected-change approval, and pre-apply snapshots.

Not adopted: automatic Git commits, command execution, or terminal integration with the host system.

## Microsoft VS Code

Adopted: an opened workspace can be untrusted; execution-capable surfaces need an explicit trust boundary; preview/webview capabilities should be restricted with sandboxing and Content Security Policy.

Not adopted: extension host, Electron process model, or VS Code workspace-trust implementation.

## Result

The existing Next.js/Monaco architecture remains. The coherent improvement combines:

- explicit development-only local AI mode with exact same-origin loopback checks;
- HTTPS allowlisted Host/Origin plus bearer authorization for remote use;
- token-derived bounded rate principals rather than forwarded-IP trust;
- request, project, file, and rate-state limits;
- credential-shaped source blocking before provider submission;
- bounded ZIP preflight with path, symlink, encoding, duplicate, and expansion controls;
- explicit user approval before workspace replacement;
- opaque-origin preview with outbound network, forms, frames, objects, and parent access denied;
- review-before-apply generated changes, tests, CI, and source-contract scanners.
