import { NextRequest, NextResponse } from "next/server";
import { getLocalAssistantReply } from "@/lib/agent/localAssistant";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, fileName, language, code } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        {
          reply: "Message is required."
        },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        reply: getLocalAssistantReply(message)
      });
    }

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert coding assistant inside a Cursor-like code editor. Help users write, fix, explain, and improve code. Keep answers practical. When returning code, use complete fenced code blocks. If creating multiple files, start each code block with a file comment like <!-- file: index.html --> or // file: script.js."
        },
        {
          role: "user",
          content: `User message:
${message}

Current file:
${fileName || "No file selected"}

Language:
${language || "unknown"}

Current code:
\`\`\`${language || ""}
${code || ""}
\`\`\``
        }
      ],
      temperature: 0.3
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "AI response was empty. Please try again.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI API error:", error);

    return NextResponse.json(
      {
        reply:
          "AI API error. Check terminal logs and verify OPENAI_API_KEY / OPENAI_MODEL."
      },
      { status: 500 }
    );
  }
}
