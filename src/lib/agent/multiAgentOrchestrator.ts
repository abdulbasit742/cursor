import { runMockAgent } from "./mockAgent";
import { runAgent } from "./runAgent";
import type { AgentRunInput, AgentRunResult } from "./types";

function shouldUseLocal(input: AgentRunInput) {
  if (input.provider === "local") return true;
  if (input.provider === "openai") return false;
  if (process.env.AGENT_PROVIDER === "local") return true;

  return !process.env.OPENAI_API_KEY;
}

export async function runCodingAgent(input: AgentRunInput): Promise<AgentRunResult> {
  if (shouldUseLocal(input)) {
    return runMockAgent(input);
  }

  try {
    return await runAgent(input);
  } catch (error) {
    const fallback = await runMockAgent(input);

    return {
      ...fallback,
      notes: [
        ...fallback.notes,
        `OpenAI mode failed, so local free mode handled it: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      ]
    };
  }
}
