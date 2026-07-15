# Reference review

Reviewed on 2026-07-15 before hardening the AI request, imported-workspace, preview, export, deployment-mode, and browser-retention boundaries.

## Continue

Adopted: explicit provider configuration and a local-development-first workflow. Provider credentials remain server environment values rather than editor content or browser persistence.

Not adopted: extension framework, hosted control plane, telemetry, or provider abstraction migration.

## code-server / OpenVSCode Server

Adopted: local binding and public exposure are distinct deployment decisions; internet exposure requires authentication and encryption rather than trusting request headers. Local browser state is also a deployment boundary, so source and prompts no longer default to durable origin storage.

Not adopted: terminal access, password-login UI, SSH forwarding automation, server filesystem persistence, or proxy/runtime architecture.

## Open WebUI

Adopted: a shared hosted AI surface needs real authentication and server-owned policy. The existing bearer token remains an operator-only safeguard, and documentation explicitly blocks presenting it as multi-user authentication.

Not adopted: user database, OAuth, admin console, provider proxy framework, or multi-tenant migration.

## OpenHands

Adopted: generated code and execution surfaces are untrusted. Provider output remains review-before-apply and no shell/browser automation capability was added.

Not adopted: container runtime, shell execution, browser automation, or autonomous task execution.

## Aider

Adopted: reviewable changes and source-control-aware safety thinking. The editor keeps diff preview, selected-change approval, and a safe pre-apply snapshot requirement.

Not adopted: automatic Git commits, command execution, or terminal integration with the host system.

## Microsoft VS Code

Adopted: an opened workspace can be untrusted; execution-capable surfaces need an explicit trust boundary; preview/webview capabilities should be restricted with sandboxing and Content Security Policy. Workspace state has different retention scopes, so durable persistence must not be the implicit default for source or prompts. Exporting a workspace is a separate trust transition requiring review.

Not adopted: extension host, Electron process model, Settings Sync, or VS Code workspace-trust implementation.

## JupyterLab

Adopted: restoration state should be bounded and reproducible rather than an unlimited hidden archive. The editor now keeps a small expiring session snapshot set and blocks snapshots that would silently omit sensitive/generated files.

Not adopted: server-side workspace database, notebook checkpoints, kernels, contents API, or extension system.

## Result

The existing Next.js/Monaco architecture remains. The coherent improvement combines:

- explicit development-only local AI mode with exact same-origin loopback checks;
- HTTPS allowlisted Host/Origin plus bearer authorization for remote use;
- token-derived bounded rate principals rather than forwarded-IP trust;
- request, project, file, and rate-state limits;
- credential-shaped source blocking before provider submission;
- bounded ZIP import preflight with path, symlink, encoding, duplicate, and expansion controls;
- explicit user approval before workspace replacement;
- bounded ZIP export preflight with path-collision checks, sensitive/generated exclusions, credential-pattern detection, and explicit summary confirmation;
- session-only workspace/chat/prompt retention with legacy durable-state purge;
- five secret-aware 1 MiB snapshots with 12-hour expiry and fail-closed destructive actions;
- opaque-origin preview with outbound network, forms, frames, objects, and parent access denied;
- review-before-apply generated changes, tests, CI, and source-contract scanners.
