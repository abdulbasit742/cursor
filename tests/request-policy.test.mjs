import assert from "node:assert/strict";
import test from "node:test";
import {
  authorizeApiRequest,
  enforceRateLimit,
  findSensitiveMaterial,
  flattenProjectContent,
  readBoundedJson,
  RequestPolicyError,
  resetRateLimitState,
  validateAgentPayload,
  validateChatPayload,
} from "../src/lib/api/requestPolicy.mjs";

test("local API mode requires explicit development enablement and exact same origin", () => {
  assert.throws(
    () => authorizeApiRequest({ host: "localhost:3000", origin: "http://localhost:3000", authorization: null, env: {} }),
    (error) => error instanceof RequestPolicyError && error.code === "local_access_disabled",
  );
  assert.deepEqual(
    authorizeApiRequest({
      host: "localhost:3000",
      origin: "http://localhost:3000",
      authorization: null,
      env: { EDITOR_LOCAL_AI_ENABLED: "true", NODE_ENV: "development" },
    }),
    { mode: "local", origin: "http://localhost:3000", principal: "local:http://localhost:3000" },
  );
});

test("local mode rejects missing, cross-loopback, remote, and production origins", () => {
  const env = { EDITOR_LOCAL_AI_ENABLED: "true", NODE_ENV: "development" };
  for (const input of [
    { host: "localhost:3000", origin: null, env },
    { host: "localhost:3000", origin: "http://127.0.0.1:3000", env },
    { host: "localhost:3000", origin: "https://attacker.example", env },
    { host: "localhost:3000", origin: "http://localhost:3000", env: { ...env, NODE_ENV: "production" } },
  ]) {
    assert.throws(
      () => authorizeApiRequest({ ...input, authorization: null }),
      (error) => error instanceof RequestPolicyError && ["origin_denied", "local_access_disabled"].includes(error.code),
    );
  }
});

test("disables public AI APIs unless explicitly enabled", () => {
  assert.throws(
    () => authorizeApiRequest({ host: "editor.example", origin: "https://editor.example", authorization: null, env: {} }),
    (error) => error instanceof RequestPolicyError && error.code === "remote_access_disabled",
  );
});

test("requires matching allowlisted host, HTTPS origin, and bearer token for remote use", () => {
  const env = {
    EDITOR_REMOTE_AI_ENABLED: "true",
    EDITOR_ALLOWED_ORIGINS: "https://editor.example",
    EDITOR_API_TOKEN: "a-secure-editor-token-with-32-chars",
  };
  const access = authorizeApiRequest({
    host: "editor.example",
    origin: "https://editor.example",
    authorization: "Bearer a-secure-editor-token-with-32-chars",
    env,
  });
  assert.equal(access.mode, "remote");
  assert.equal(access.origin, "https://editor.example");
  assert.match(access.principal, /^remote:[0-9a-f]{24}$/);
  assert.equal(access.principal.includes(env.EDITOR_API_TOKEN), false);

  assert.throws(
    () => authorizeApiRequest({ host: "api.example", origin: "https://editor.example", authorization: `Bearer ${env.EDITOR_API_TOKEN}`, env }),
    (error) => error instanceof RequestPolicyError && error.code === "host_denied",
  );
  assert.throws(
    () => authorizeApiRequest({ host: "editor.example", origin: "https://evil.example", authorization: `Bearer ${env.EDITOR_API_TOKEN}`, env }),
    /allowlisted/,
  );
  assert.throws(
    () => authorizeApiRequest({ host: "editor.example", origin: "https://editor.example", authorization: "Bearer wrong", env }),
    (error) => error instanceof RequestPolicyError && error.status === 401,
  );
});

test("rejects insecure or credential-bearing remote origin configuration", () => {
  for (const configured of ["http://editor.example", "https://user:pass@editor.example"]) {
    assert.throws(
      () => authorizeApiRequest({
        host: "editor.example",
        origin: "https://editor.example",
        authorization: "Bearer a-secure-editor-token-with-32-chars",
        env: {
          EDITOR_REMOTE_AI_ENABLED: "true",
          EDITOR_ALLOWED_ORIGINS: configured,
          EDITOR_API_TOKEN: "a-secure-editor-token-with-32-chars",
        },
      }),
      (error) => error instanceof RequestPolicyError && error.code === "invalid_configuration",
    );
  }
});

test("accepts bounded chat input and rejects oversized code", () => {
  assert.equal(validateChatPayload({ message: "Explain this", code: "const ok = true" }).message, "Explain this");
  assert.throws(
    () => validateChatPayload({ message: "Explain", code: "x".repeat(200_001) }),
    (error) => error instanceof RequestPolicyError && error.status === 413,
  );
});

test("validates bounded project trees and provider values", () => {
  const payload = validateAgentPayload({
    task: "Improve the page",
    provider: "local",
    files: [{ id: "root", name: "src", type: "folder", content: "", children: [
      { id: "index", name: "index.html", type: "file", language: "html", content: "<main />" },
    ] }],
  });
  assert.equal(payload.provider, "local");
  assert.equal(payload.files.length, 1);
  assert.throws(
    () => validateAgentPayload({ task: "x", provider: "shell", files: [] }),
    /Provider is invalid/,
  );
});

test("rejects unsafe file names and excessive quantities", () => {
  assert.throws(
    () => validateAgentPayload({ task: "x", files: [{ id: "1", name: "../secret", type: "file", content: "" }] }),
    /unsafe file name/,
  );
  const files = Array.from({ length: 201 }, (_, index) => ({ id: String(index), name: `${index}.txt`, type: "file", content: "" }));
  assert.throws(
    () => validateAgentPayload({ task: "x", files }),
    (error) => error instanceof RequestPolicyError && error.status === 413,
  );
});

test("detects common credential material before remote-provider submission", () => {
  assert.deepEqual(findSensitiveMaterial(["normal source"]), []);
  assert.deepEqual(findSensitiveMaterial(["-----BEGIN PRIVATE KEY-----\nsecret"]), ["private-key"]);
  assert.deepEqual(findSensitiveMaterial(["const token = 'ghp_123456789012345678901234567890';"]), ["github-token"]);
});

test("flattens file content without treating folder metadata as code", () => {
  assert.deepEqual(
    flattenProjectContent([{ type: "folder", content: "folder", children: [{ type: "file", content: "source" }] }]),
    ["source"],
  );
});

test("rate limiter fails after bounded count and recycles expired buckets", () => {
  resetRateLimitState();
  const key = "principal:ai";
  for (let index = 0; index < 20; index += 1) enforceRateLimit(key, 1000);
  assert.throws(
    () => enforceRateLimit(key, 1000),
    (error) => error instanceof RequestPolicyError && error.status === 429,
  );
  assert.equal(enforceRateLimit(key, 61_001).remaining, 19);
});

test("rate limiter bounds key cardinality", () => {
  resetRateLimitState();
  for (let index = 0; index < 256; index += 1) enforceRateLimit(`key-${index}`, 1000);
  assert.throws(
    () => enforceRateLimit("overflow", 1000),
    (error) => error instanceof RequestPolicyError && error.code === "rate_limiter_busy",
  );
  assert.equal(enforceRateLimit("new-after-expiry", 61_001).remaining, 19);
});

test("bounded JSON reader requires JSON and parses valid requests", async () => {
  await assert.rejects(
    readBoundedJson(new Request("http://localhost/api", { method: "POST", body: "hello", headers: { "content-type": "text/plain" } })),
    (error) => error instanceof RequestPolicyError && error.status === 415,
  );
  const value = await readBoundedJson(new Request("http://localhost/api", {
    method: "POST",
    body: JSON.stringify({ ok: true }),
    headers: { "content-type": "application/json" },
  }));
  assert.deepEqual(value, { ok: true });
});

test("bounded JSON reader rejects malformed and declared oversized bodies", async () => {
  await assert.rejects(
    readBoundedJson(new Request("http://localhost/api", {
      method: "POST",
      body: "{",
      headers: { "content-type": "application/json" },
    })),
    (error) => error instanceof RequestPolicyError && error.code === "invalid_json",
  );
  const request = new Request("http://localhost/api", {
    method: "POST",
    body: "{}",
    headers: { "content-type": "application/json", "content-length": "700000" },
  });
  await assert.rejects(readBoundedJson(request), (error) => error instanceof RequestPolicyError && error.status === 413);
});
