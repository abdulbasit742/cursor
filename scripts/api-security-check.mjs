#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";

const root = process.cwd();
const findings = [];
const required = [
  "src/lib/api/requestPolicy.mjs",
  "src/lib/api/requestPolicy.d.mts",
  "src/app/api/ai/route.ts",
  "src/app/api/agent/route.ts",
  "src/components/Preview/LivePreview.tsx",
  "tests/request-policy.test.mjs",
];

function report(file, rule, detail) {
  findings.push({ file, rule, detail });
}

for (const file of required) {
  if (!existsSync(join(root, file))) report(file, "missing-file", "required AI boundary file is missing");
}

if (!findings.length) {
  const policy = readFileSync(join(root, "src/lib/api/requestPolicy.mjs"), "utf8");
  const ai = readFileSync(join(root, "src/app/api/ai/route.ts"), "utf8");
  const agent = readFileSync(join(root, "src/app/api/agent/route.ts"), "utf8");
  const preview = readFileSync(join(root, "src/components/Preview/LivePreview.tsx"), "utf8");
  for (const [label, pattern] of [
    ["explicit local development mode", /EDITOR_LOCAL_AI_ENABLED\s*!==\s*["']true["']/],
    ["production local denial", /NODE_ENV\s*===\s*["']production["']/],
    ["exact host-origin match", /originUrl\.host\.toLowerCase\(\)\s*!==\s*requestHost/],
    ["remote disabled by default", /EDITOR_REMOTE_AI_ENABLED\s*!==\s*["']true["']/],
    ["HTTPS origin allowlist", /credential-free HTTPS origins/],
    ["bearer token", /EDITOR_API_TOKEN/],
    ["token-derived principal", /createHash\(["']sha256["']\)/],
    ["request size cap", /MAX_BODY_BYTES\s*=\s*600_000/],
    ["project size cap", /MAX_PROJECT_CHARS\s*=\s*500_000/],
    ["rate limit", /RATE_LIMIT\s*=\s*20/],
    ["rate bucket cap", /MAX_RATE_BUCKETS\s*=\s*256/],
    ["expired bucket pruning", /pruneRateBuckets/],
    ["sensitive material gate", /findSensitiveMaterial/],
  ]) {
    if (!pattern.test(policy)) report("src/lib/api/requestPolicy.mjs", "policy-contract", `${label} is missing`);
  }
  for (const [file, text] of [["src/app/api/ai/route.ts", ai], ["src/app/api/agent/route.ts", agent]]) {
    for (const symbol of ["authorizeApiRequest", "enforceRateLimit", "readBoundedJson", "RequestPolicyError", "access.principal"]) {
      if (!text.includes(symbol)) report(file, "route-contract", `${symbol} is not wired`);
    }
    if (/x-forwarded-for/i.test(text)) {
      report(file, "untrusted-proxy-header", "rate limiting must not trust X-Forwarded-For");
    }
    if (/error instanceof Error\s*\?\s*error\.message/.test(text)) {
      report(file, "error-leak", "internal exception messages must not be returned");
    }
    if (!/Cache-Control/.test(text) || !/no-store/.test(text)) {
      report(file, "cache-control", "AI responses must be non-cacheable");
    }
  }
  if (!/sandbox="allow-scripts"/.test(preview) || /allow-same-origin/.test(preview)) {
    report("src/components/Preview/LivePreview.tsx", "preview-isolation", "preview must allow scripts without same-origin access");
  }
}

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", ".next", "dist", "out"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.startsWith(".env") && entry.name !== ".env.example") {
      report(relative(root, path), "populated-env", "only .env.example may be tracked");
    } else if (statSync(path).size < 1_500_000) {
      const text = readFileSync(path, "utf8");
      if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) {
        report(relative(root, path), "private-key", "private key material found");
      }
    }
  }
}

walk(root);

if (findings.length) {
  console.error(`AI API security check failed with ${findings.length} finding(s):`);
  for (const finding of findings) console.error(`- ${finding.file} [${finding.rule}]: ${finding.detail}`);
  process.exit(1);
}
console.log("AI API security check passed.");
