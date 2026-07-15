# Canonical agent project-tree boundary

Reviewed on 2026-07-15 before hardening the coding-agent file context.

## Reference patterns

### Microsoft VS Code

Adopted: editor operations target canonical resources rather than loosely matching display names. Workspace content is treated as untrusted input and execution-capable features receive a stricter boundary.

Not adopted: URI service, extension host, workspace trust implementation, Electron filesystem, or remote workspace architecture.

### Eclipse Theia

Adopted: one workspace service should own resource identity and normalize the tree before downstream editor/services consume it.

Not adopted: backend filesystem service, extension framework, server-side workspace roots, or preference system.

### Git

Adopted: path identity and case collisions must be explicit; ambiguous entries should fail instead of relying on platform-specific filesystem behavior.

Not adopted: index format, object database, checkout implementation, or repository mutation.

## Active contract

`canonicalizeProjectTree` is the only project-identity step used by the agent route after the request-size policy. It:

- requires globally unique node IDs;
- rejects case-insensitive sibling name collisions;
- rejects `.`, `..`, slash, backslash, and NUL path components;
- rejects files with children and folders with file content;
- recursively returns sanitized child nodes rather than preserving raw input objects;
- permits an active ID only when it references a canonical file node;
- bounds depth and identity-field lengths;
- returns node/file counts for diagnostics without exposing a second filesystem model.

The coding-agent route passes this canonical tree to context building, repository mapping, secret scanning, and orchestration. It no longer performs a separate lossy sanitizer.

## Residual limitations

The project tree is still an in-memory browser model, not a real filesystem transaction. Canonical identity prevents ambiguous targeting but does not prove that a proposed patch is correct or safe. Generated changes still require diff review, validation, and an available safe snapshot before apply.
