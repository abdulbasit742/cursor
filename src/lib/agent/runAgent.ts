import { buildAgentUserPrompt, AGENT_SYSTEM_PROMPT } from "./prompts";
import { parseAgentPlan } from "./patchParser";
import { repairAgentPlan } from "./repairLoop";
import { planTask } from "./taskPlanner";
import { reviewAgentPlan } from "./codeReview";
import { scoreAgentConfidence } from "./confidenceScorer";
import { suggestTestCommands } from "./testCommandSuggester";
import type { AgentRunInput, AgentRunResult } from "./types";

export async function runAgent(input: AgentRunInput): Promise<AgentRunResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  const taskPlan = planTask({
    task: input.task,
    files: input.files,
    activeFilePath: input.activeFilePath
  });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: AGENT_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: buildAgentUserPrompt({
          ...input,
          taskPlan
        })
      }
    ],
    temperature: 0.2
  });

  const rawText = completion.choices[0]?.message?.content || "{}";
  const parsedPlan = parseAgentPlan(rawText);
  const repaired = repairAgentPlan({
    plan: {
      ...parsedPlan,
      commands: Array.from(
        new Set([...parsedPlan.commands, ...suggestTestCommands(parsedPlan.changes)])
      )
    },
    projectFiles: input.files
  });
  const review = reviewAgentPlan(repaired.plan.changes);
  const confidence = scoreAgentConfidence({
    changes: repaired.plan.changes,
    validationIssues: repaired.validation.issues,
    reviewFindings: review
  });

  return {
    provider: "openai",
    plan: repaired.plan,
    taskPlan,
    validation: repaired.validation,
    review,
    confidence,
    notes: ["OpenAI-backed agent mode active."],
    usage: {
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
      totalTokens: completion.usage?.total_tokens
    }
  };
}
