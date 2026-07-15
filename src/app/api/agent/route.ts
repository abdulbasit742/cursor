import { NextRequest, NextResponse } from "next/server";
import { createAgentFileContext } from "@/lib/agent/fileContext";
import { runCodingAgent } from "@/lib/agent/multiAgentOrchestrator";
import { buildRepoMap, summarizeRepoMap } from "@/lib/context/repoMap";
import {
  authorizeApiRequest,
  enforceRateLimit,
  findSensitiveMaterial,
  flattenProjectContent,
  readBoundedJson,
  RequestPolicyError,
  validateAgentPayload,
} from "@/lib/api/requestPolicy.mjs";
import type { FileItem } from "@/store/useStore";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function sanitizeFileTree(nodes: unknown[]): FileItem[] {
  return nodes.map((value) => {
    const node = value as Record<string, unknown>;
    return {
      id: String(node.id),
      name: String(node.name),
      language: String(node.language || "plaintext"),
      content: String(node.content || ""),
      type: node.type === "folder" ? "folder" : "file",
      children: Array.isArray(node.children) ? sanitizeFileTree(node.children) : undefined,
      isOpen: Boolean(node.isOpen),
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const access = authorizeApiRequest({
      host: req.headers.get("host"),
      origin: req.headers.get("origin"),
      authorization: req.headers.get("authorization"),
      env: process.env,
    });
    enforceRateLimit(`${access.principal}:agent`);

    const body = validateAgentPayload(await readBoundedJson(req));
    if (body.provider === "openai" && !process.env.OPENAI_API_KEY) {
      throw new RequestPolicyError("OpenAI provider is not configured", {
        status: 503,
        code: "provider_unavailable",
      });
    }
    const willUseRemoteProvider =
      body.provider === "openai" || (body.provider === "auto" && Boolean(process.env.OPENAI_API_KEY));
    if (willUseRemoteProvider) {
      const findings = findSensitiveMaterial([body.task, ...flattenProjectContent(body.files)]);
      if (findings.length) {
        throw new RequestPolicyError(
          `Remote provider request blocked because sensitive material was detected: ${findings.join(", ")}`,
          { status: 422, code: "sensitive_material" },
        );
      }
    }

    const projectFiles = sanitizeFileTree(body.files);
    const context = createAgentFileContext({
      files: projectFiles,
      activeFileId: body.activeFileId,
      task: body.task,
    });
    const repoSummary = summarizeRepoMap(buildRepoMap(projectFiles));
    const result = await runCodingAgent({
      task: body.task,
      files: context.files,
      activeFilePath: context.activeFilePath,
      repoSummary,
      provider: body.provider,
    });
    return json(result);
  } catch (error) {
    if (error instanceof RequestPolicyError) {
      return json({ error: error.message, code: error.code }, error.status);
    }
    console.error("Agent API request failed");
    return json(
      { error: "Agent request could not be completed. Review the server configuration and try again.", code: "agent_request_failed" },
      502,
    );
  }
}
