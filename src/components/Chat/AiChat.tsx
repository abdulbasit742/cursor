"use client";

import { Bot, FilePlus, Files, Send, Trash2, User, Wand2 } from "lucide-react";
import { useState } from "react";
import useStore from "@/store/useStore";
import { getLanguageFromName } from "@/utils/language";

function extractCodeBlock(text: string) {
  const match = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : "";
}

function extractMultipleCodeBlocks(text: string) {
  const regex =
    /```(?:(\w+))?\s*(?:\/\/\s*file:\s*(.+)|#\s*file:\s*(.+)|<!--\s*file:\s*(.+?)\s*-->)?\n([\s\S]*?)```/g;

  const blocks: { language: string; fileName: string; code: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const language = match[1] || "plaintext";
    const fileName =
      match[2]?.trim() ||
      match[3]?.trim() ||
      match[4]?.trim() ||
      `file-${blocks.length + 1}.${language === "javascript" ? "js" : language}`;

    blocks.push({
      language,
      fileName,
      code: match[5].trim()
    });
  }

  return blocks;
}

export default function AiChat() {
  const activeFile = useStore((state) => state.activeFile);
  const chatMessages = useStore((state) => state.chatMessages);
  const addChatMessage = useStore((state) => state.addChatMessage);
  const clearChat = useStore((state) => state.clearChat);
  const replaceActiveFileContent = useStore((state) => state.replaceActiveFileContent);
  const addFile = useStore((state) => state.addFile);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    const prompt = input.trim();
    if (!prompt || isLoading) return;

    addChatMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString()
    });

    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: prompt,
          fileName: activeFile?.name,
          language: activeFile?.language,
          code: activeFile?.content
        })
      });

      const data = await response.json();

      addChatMessage({
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply || "Sorry, I could not generate a response.",
        timestamp: new Date().toISOString()
      });
    } catch {
      addChatMessage({
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        content: "Error: AI service is not responding. Check the API route and env keys.",
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyCode = (content: string) => {
    const code = extractCodeBlock(content);

    if (!code) {
      window.alert("No code block found in this AI message.");
      return;
    }

    replaceActiveFileContent(code);
  };

  const createFileFromAI = (content: string) => {
    const code = extractCodeBlock(content);

    if (!code) {
      window.alert("No code block found in this AI message.");
      return;
    }

    const name = window.prompt("New file name?", "ai-output.html");
    if (!name) return;

    addFile({
      name,
      language: getLanguageFromName(name),
      content: code,
      type: "file"
    });
  };

  const createMultipleFilesFromAI = (content: string) => {
    const blocks = extractMultipleCodeBlocks(content);

    if (blocks.length === 0) {
      window.alert("No code blocks found in this AI message.");
      return;
    }

    blocks.forEach((block) => {
      addFile({
        id: `ai-${Date.now()}-${block.fileName}`,
        name: block.fileName,
        language: getLanguageFromName(block.fileName),
        content: block.code,
        type: "file"
      });
    });

    window.alert(`${blocks.length} files created.`);
  };

  return (
    <aside data-testid="ai-chat" className="w-80 h-full panel-bg border-l app-border flex flex-col">
      <div className="h-10 border-b app-border flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={17} className="text-blue-400" />
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>

        <button
          onClick={clearChat}
          className="p-1 app-hover rounded"
          title="Clear chat"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.map((message) => {
          const hasCode = message.role === "assistant" && extractCodeBlock(message.content);

          return (
            <div
              key={message.id}
              data-testid={`chat-message-${message.role}`}
              className={`chat-message flex gap-2 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center shrink-0">
                  <Bot size={15} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap border ${
                  message.role === "user"
                    ? "bg-[#007acc] text-white border-[#007acc]"
                    : "app-bg app-border"
                }`}
              >
                {message.content}

                {hasCode && (
                  <div className="mt-2 space-y-2">
                    <button
                      onClick={() => applyCode(message.content)}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded px-2 py-1 text-xs"
                    >
                      <Wand2 size={13} />
                      Apply code to active file
                    </button>

                    <button
                      onClick={() => createFileFromAI(message.content)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-1 text-xs"
                    >
                      <FilePlus size={13} />
                      Create new file
                    </button>

                    <button
                      onClick={() => createMultipleFilesFromAI(message.content)}
                      className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded px-2 py-1 text-xs"
                    >
                      <Files size={13} />
                      Create multiple files
                    </button>
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="w-7 h-7 rounded bg-gray-700 flex items-center justify-center shrink-0">
                  <User size={15} />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2 items-center text-sm app-muted">
            <Bot size={16} />
            <span className="loading-dots">
              Thinking<span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        )}
      </div>

      <div className="p-3 border-t app-border shrink-0">
        <textarea
          data-testid="ai-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask AI to write, fix, or explain code..."
          className="chat-input w-full h-24 resize-none app-input border rounded-md p-2 text-sm outline-none"
        />

        <button
          data-testid="ai-send-button"
          onClick={sendMessage}
          disabled={isLoading}
          className="mt-2 w-full flex items-center justify-center gap-2 bg-[#007acc] hover:bg-[#006bb3] disabled:opacity-50 text-white rounded-md py-2 text-sm"
        >
          <Send size={15} />
          Send
        </button>
      </div>
    </aside>
  );
}
