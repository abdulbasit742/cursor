import { NextRequest, NextResponse } from "next/server";
import { getLocalAssistantReply } from "@/lib/agent/localAssistant";
import {
  authorizeApiRequest,
  enforceRateLimit,
  findSensitiveMaterial,
  readBoundedJson,
  RequestPolicyError,
  validateChatPayload,
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
    enforceRateLimit(`${access.principal}:chat`);

    const body = validateChatPayload(await readBoundedJson(req));
    const useRemoteProvider = Boolean(process.env.OPENAI_API_KEY);
    if (useRemoteProvider) {
      const findings = findSensitiveMaterial([body.message, body.fileName, body.code]);
      if (findings.length) {
        throw new RequestPolicyError(
          `Remote provider request blocked because sensitive material was detected: ${findings.join(", ")}`,
          { status: 422, code: "sensitive_material" },
        );
      }
    }

    if (!useRemoteProvider) {
      return json({ reply: getLocalAssistantReply(body.message), provider: "local" });
    }

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a coding assistant inside a review-first editor. Help users write, fix, explain, and improve code. Do not claim to execute commands or external actions. Use complete fenced code blocks and label multi-file outputs with file comments.",
        },
        {
          role: "user",
          content: `User message:\n${body.message}\n\nCurrent file:\n${body.fileName || "No file selected"}\n\nLanguage:\n${body.language || "unknown"}\n\nCurrent code:\n\`\`\`${body.language}\n${body.code}\n\`\`\``,
        },
      ],
      temperature: 0.3,
      max_tokens: 1800,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) throw new RequestPolicyError("AI provider returned an empty response", { status: 502, code: "empty_provider_response" });
    return json({ reply, provider: "openai" });
  } catch (error) {
    if (error instanceof RequestPolicyError) {
      return json({ reply: error.message, error: { code: error.code } }, error.status);
    }
    console.error("AI API request failed");
    return json(
      { reply: "AI request could not be completed. Review the server configuration and try again.", error: { code: "ai_request_failed" } },
      502,
    );
  }
}
