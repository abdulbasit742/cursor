import { NextRequest, NextResponse } from "next/server";
import { createAgentFileContext } from "@/lib/agent/fileContext";
import { runCodingAgent } from "@/lib/agent/multiAgentOrchestrator";
import { buildRepoMap, summarizeRepoMap } from "@/lib/context/repoMap";
import type { AgentApiRequest } from "@/lib/agent/types";
import type { FileItem } from "@/store/useStore";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AgentApiRequest;

    if (!body.task || typeof body.task !== "string") {
      return NextResponse.json(
        { error: "Task is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.files)) {
      return NextResponse.json(
        { error: "Project files are required." },
        { status: 400 }
      );
    }

    const projectFiles = body.files as FileItem[];
    const context = createAgentFileContext({
      files: projectFiles,
      activeFileId: body.activeFileId || null,
      task: body.task
    });
    const repoSummary = summarizeRepoMap(buildRepoMap(projectFiles));

    const result = await runCodingAgent({
      task: body.task,
      files: context.files,
      activeFilePath: context.activeFilePath,
      repoSummary,
      provider: body.provider || "auto"
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Agent API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Agent failed to generate a plan."
      },
      { status: 500 }
    );
  }
}
