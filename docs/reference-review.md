# Reference review

Reviewed on 2026-07-15 before hardening the AI request boundary.

## Continue

Adopted: explicit provider configuration and a local-development-first workflow. Provider credentials remain server environment values rather than editor content or browser persistence.

Not adopted: extension framework, hosted control plane, telemetry, or provider abstraction migration.

## OpenHands

Adopted: treat generated code and execution surfaces as untrusted. The existing preview remains sandboxed without same-origin access, and provider output remains review-before-apply.

Not adopted: container runtime, shell execution, browser automation, or autonomous task execution.

## Aider

Adopted: reviewable changes and source-control-aware safety thinking. The editor keeps diff preview, selected-change approval, and pre-apply snapshots.

Not adopted: automatic Git commits, command execution, or terminal integration with the host system.

## Result

The coherent improvement is a bounded local-first API trust boundary: public AI access is disabled by default, remote access requires origin and bearer authorization, request/project sizes and rates are capped, common credential material is blocked before provider submission, and errors are sanitized.
