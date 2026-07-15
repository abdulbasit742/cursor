# Reference review

Reviewed on 2026-07-15 before hardening the AI request and workspace-execution boundaries.

## Continue

Adopted: explicit provider configuration and a local-development-first workflow. Provider credentials remain server environment values rather than editor content or browser persistence.

Not adopted: extension framework, hosted control plane, telemetry, or provider abstraction migration.

## OpenHands

Adopted: generated code and execution surfaces are untrusted. Provider output remains review-before-apply and no shell/browser automation capability was added.

Not adopted: container runtime, shell execution, browser automation, or autonomous task execution.

## Aider

Adopted: reviewable changes and source-control-aware safety thinking. The editor keeps diff preview, selected-change approval, and pre-apply snapshots.

Not adopted: automatic Git commits, command execution, or terminal integration with the host system.

## Microsoft VS Code

Adopted: an opened workspace can be untrusted; execution-capable surfaces need an explicit trust boundary; preview/webview capabilities should be restricted with sandboxing and Content Security Policy.

Not adopted: extension host, Electron process model, or VS Code workspace-trust implementation.

## StackBlitz WebContainer

Adopted: browser code execution belongs in an isolated runtime with explicit capabilities, and imported projects require resource bounds before execution.

Not adopted: WebContainer runtime, Node.js emulation, cross-origin isolation requirements, or commercial APIs.

## Eclipse Theia

Adopted: separate workspace/file handling from execution and backend services, and keep server endpoints behind explicit authorization/configuration boundaries.

Not adopted: Theia extensions, plugin host, backend framework, or dependency stack.

## Result

The existing Next.js/Monaco architecture remains. The coherent improvement combines:

- local-first, origin-protected, bearer-authorized optional AI APIs;
- request, project, file, and rate limits;
- credential-shaped source blocking before provider submission;
- bounded ZIP preflight with path, symlink, encoding, duplicate, and expansion controls;
- explicit user approval before workspace replacement;
- opaque-origin preview with outbound network, forms, frames, objects, and parent access denied;
- review-before-apply generated changes, tests, CI, and source-contract scanners.
