import { NextRequest, NextResponse } from "next/server";
import { createAgentFileContext } from "@/lib/agent/fileContext";
import { runCodingAgent } from "@/lib/agent/multiAgentOrchestrator";
import { buildRepoMap, summarizeRepoMap } from "@/lib/context/repoMap";
import { canonicalizeProjectTree, ProjectTreePolicyError } from "@/lib/api/projectTreePolicy.mjs";
import {
  authorizeApiRequest,
  enforceRateLimit,
  findSensitiveMaterial,
  flattenProjectContent,
  readBoundedJson,
  RequestPolicyError,
  validateAgentPayload,
} from "@/lib/api/requestPolicy.mjs";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
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
    const project = canonicalizeProjectTree(body.files, body.activeFileId);

    if (body.provider === "openai" && !process.env.OPENAI_API_KEY) {
      throw new RequestPolicyError("OpenAI provider is not configured", {
        status: 503,
        code: "provider_unavailable",
      });
    }
    const willUseRemoteProvider =
      body.provider === "openai" || (body.provider === "auto" && Boolean(process.env.OPENAI_API_KEY));
    if (willUseRemoteProvider) {
      const findings = findSensitiveMaterial([body.task, ...flattenProjectContent(project.files)]);
      if (findings.length) {
        throw new RequestPolicyError(
          `Remote provider request blocked because sensitive material was detected: ${findings.join(", ")}`,
          { status: 422, code: "sensitive_material" },
        );
      }
    }

    const context = createAgentFileContext({
      files: project.files,
      activeFileId: project.activeFileId,
      task: body.task,
    });
    const repoSummary = summarizeRepoMap(buildRepoMap(project.files));
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
    if (error instanceof ProjectTreePolicyError) {
      return json({ error: error.message, code: error.code }, 400);
    }
    console.error("Agent API request failed");
    return json(
      { error: "Agent request could not be completed. Review the server configuration and try again.", code: "agent_request_failed" },
      502,
    );
  }
}
