import { registerTemplate, type ProjectTemplate } from "./templateRegistry";

export const freeTemplates: ProjectTemplate[] = [
  {
    id: "next-tailwind-starter",
    name: "Next.js Tailwind Starter",
    description: "Minimal Next.js App Router starter with Tailwind CSS and TypeScript.",
    category: "web",
    tags: ["nextjs", "tailwind", "typescript", "starter"],
    createdAt: "2026-05-16T00:00:00.000Z",
    files: {
      "src/app/page.tsx": `export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Next.js Tailwind Starter</h1>
        <p className="mt-4 text-gray-400">Production-ready starter template.</p>
      </div>
    </main>
  );
}
`,
      "src/app/layout.tsx": `import "./globals.css";
import type { ReactNode } from "react";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
      "src/app/globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  padding: 0;
  margin: 0;
  background: #111827;
  color: white;
  font-family: sans-serif;
}
`,
    },
  },
  {
    id: "zustand-editor-shell",
    name: "Zustand Editor Shell",
    description: "Editor-style Zustand store with files and tabs support.",
    category: "editor",
    tags: ["zustand", "editor", "store", "typescript"],
    createdAt: "2026-05-16T00:00:00.000Z",
    files: {
      "src/store/editorStore.ts": `import { create } from "zustand";

export interface EditorFile {
  path: string;
  content: string;
}

interface EditorState {
  files: EditorFile[];
  activeFile: string | null;
  setFiles: (files: EditorFile[]) => void;
  addFile: (file: EditorFile) => void;
  updateFileContent: (path: string, content: string) => void;
  setActiveFile: (path: string | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  files: [],
  activeFile: null,
  setFiles: (files) => set({ files }),
  addFile: (file) => set((state) => ({ files: [...state.files, file] })),
  updateFileContent: (path, content) =>
    set((state) => ({
      files: state.files.map((file) => (file.path === path ? { ...file, content } : file)),
    })),
  setActiveFile: (path) => set({ activeFile: path }),
}));
`,
    },
  },
  {
    id: "ai-chat-panel",
    name: "AI Chat Panel",
    description: "Dark-mode AI assistant chat interface component.",
    category: "ai",
    tags: ["chat", "ai", "tailwind", "react"],
    createdAt: "2026-05-16T00:00:00.000Z",
    files: {
      "src/components/AI/ChatPanel.tsx": `"use client";

import { useState } from "react";

export function ChatPanel() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  function sendMessage() {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, input]);
    setInput("");
  }

  return (
    <div className="h-full bg-gray-900 text-white p-4 flex flex-col">
      <div className="flex-1 overflow-auto space-y-2">
        {messages.map((message, index) => (
          <div key={index} className="bg-gray-800 rounded p-2">
            {message}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="flex-1 bg-gray-800 rounded px-3 py-2 outline-none"
          placeholder="Ask AI..."
        />
        <button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">
          Send
        </button>
      </div>
    </div>
  );
}
`,
    },
  },
];

let initialized = false;

export function registerFreeTemplates(): ProjectTemplate[] {
  if (!initialized) {
    freeTemplates.forEach((template) => registerTemplate(template));
    initialized = true;
  }

  return freeTemplates;
}

export function getFreeTemplateById(id: string): ProjectTemplate | null {
  return freeTemplates.find((template) => template.id === id) ?? null;
}

export function getFreeTemplatesByCategory(category: string): ProjectTemplate[] {
  return freeTemplates.filter(
    (template) => template.category?.toLowerCase() === category.toLowerCase()
  );
}
