import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addToTree, findFile, mapTree, removeFromTree } from "@/utils/fileTree";
import { getLanguageFromName } from "@/utils/language";

export interface FileItem {
  id: string;
  name: string;
  language: string;
  content: string;
  type: "file" | "folder";
  children?: FileItem[];
  isOpen?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: "on" | "off";
  minimap: boolean;
  lineNumbers: "on" | "off";
  renderWhitespace: "none" | "boundary" | "all";
  smoothScrolling: boolean;
}

interface StoreState {
  files: FileItem[];
  activeFile: FileItem | null;
  openTabs: string[];
  chatMessages: ChatMessage[];
  editorSettings: EditorSettings;
  isSidebarOpen: boolean;
  isChatOpen: boolean;
  isTerminalOpen: boolean;
  isPreviewOpen: boolean;
  isAgentOpen: boolean;
  isTemplatesOpen: boolean;
  isHistoryOpen: boolean;
  isSearchOpen: boolean;
  isSourceControlOpen: boolean;
  isProblemsOpen: boolean;
  isSettingsOpen: boolean;
  isStatsOpen: boolean;
  isContextOpen: boolean;
  isReadinessOpen: boolean;
  isLaunchChecklistOpen: boolean;

  setFiles: (files: FileItem[]) => void;
  setActiveFile: (file: FileItem) => void;
  updateEditorSettings: (settings: Partial<EditorSettings>) => void;
  resetEditorSettings: () => void;
  updateFileContent: (id: string, content: string) => void;
  replaceActiveFileContent: (content: string) => void;
  addFile: (file: Partial<FileItem> & { name: string }, parentId?: string | null) => void;
  addFolder: (name: string, parentId?: string | null) => void;
  deleteFile: (id: string) => void;
  toggleFolder: (id: string) => void;
  closeTab: (id: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  toggleAgent: () => void;
  toggleTerminal: () => void;
  togglePreview: () => void;
  toggleTemplates: () => void;
  toggleHistory: () => void;
  toggleSearch: () => void;
  toggleSourceControl: () => void;
  toggleProblems: () => void;
  toggleSettings: () => void;
  toggleStats: () => void;
  toggleContext: () => void;
  toggleReadiness: () => void;
  toggleLaunchChecklist: () => void;
  resetProject: () => void;
}

const defaultEditorSettings: EditorSettings = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: "on",
  minimap: true,
  lineNumbers: "on",
  renderWhitespace: "none",
  smoothScrolling: true,
};

const defaultFiles: FileItem[] = [
  {
    id: "folder-src",
    name: "src",
    language: "plaintext",
    content: "",
    type: "folder",
    isOpen: true,
    children: [
      {
        id: "file-index",
        name: "index.html",
        language: "html",
        type: "file",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Code Editor App</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="app">
    <p class="eyebrow">AI Code Editor</p>
    <h1>Build something brilliant.</h1>
    <p>Edit these files and open Preview to see changes.</p>
    <button onclick="sayHello()">Run action</button>
  </main>
  <script src="script.js"></script>
</body>
</html>`
      },
      {
        id: "file-style",
        name: "style.css",
        language: "css",
        type: "file",
        content: `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: Inter, Arial, sans-serif;
  background: #0f172a;
  color: #f8fafc;
}

.app {
  width: min(92vw, 720px);
  padding: 48px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.86);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

.eyebrow {
  color: #38bdf8;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

h1 {
  font-size: clamp(2.5rem, 8vw, 5rem);
  line-height: 0.95;
  margin: 12px 0;
}

p {
  color: #cbd5e1;
  font-size: 1.1rem;
}

button {
  margin-top: 20px;
  border: 0;
  border-radius: 12px;
  padding: 12px 18px;
  background: #38bdf8;
  color: #082f49;
  font-weight: 800;
  cursor: pointer;
}`
      },
      {
        id: "file-script",
        name: "script.js",
        language: "javascript",
        type: "file",
        content: `function sayHello() {
  alert("Hello from your AI Code Editor starter.");
}

console.log("Preview loaded.");`
      }
    ]
  },
  {
    id: "file-readme",
    name: "README.md",
    language: "markdown",
    type: "file",
    content: `# AI Code Editor

This is a Cursor-like coding workspace starter.

Use the Explorer, Editor, AI Chat, Preview, and Terminal panels to build small web projects.`
  }
];

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi Abdul Basit. Ask me to write, fix, explain, or improve code. If I return a code block, you can apply it to the active file.",
  timestamp: new Date().toISOString()
};

function firstFile(files: FileItem[]): FileItem | null {
  for (const file of files) {
    if (file.type === "file") return file;
    const child: FileItem | null = firstFile(file.children || []);
    if (child) return child;
  }

  return null;
}

const useStore = create<StoreState>()(
  persist(
    (set) => ({
      files: defaultFiles,
      activeFile: firstFile(defaultFiles),
      openTabs: ["file-index"],
      chatMessages: [welcomeMessage],
      editorSettings: defaultEditorSettings,
      isSidebarOpen: true,
      isChatOpen: true,
      isAgentOpen: false,
      isTemplatesOpen: false,
      isHistoryOpen: false,
      isSearchOpen: false,
      isSourceControlOpen: false,
      isProblemsOpen: false,
      isSettingsOpen: false,
      isStatsOpen: false,
      isContextOpen: false,
      isReadinessOpen: false,
      isLaunchChecklistOpen: false,
      isTerminalOpen: true,
      isPreviewOpen: true,

      setFiles: (files) =>
        set((state) => {
          const activeFile =
            state.activeFile && findFile(files, state.activeFile.id);

          const retainedTabs = state.openTabs.filter((tabId) =>
            Boolean(findFile(files, tabId))
          );
          const nextActive = activeFile || firstFile(files);
          const openTabs =
            nextActive && !retainedTabs.includes(nextActive.id)
              ? [nextActive.id, ...retainedTabs]
              : retainedTabs;

          return {
            files,
            activeFile: nextActive,
            openTabs
          };
        }),

      setActiveFile: (file) => {
        if (file.type !== "file") return;

        set((state) => ({
          activeFile: file,
          openTabs: state.openTabs.includes(file.id)
            ? state.openTabs
            : [...state.openTabs, file.id]
        }));
      },

      updateEditorSettings: (settings) =>
        set((state) => ({
          editorSettings: {
            ...state.editorSettings,
            ...settings
          }
        })),

      resetEditorSettings: () =>
        set({
          editorSettings: defaultEditorSettings
        }),

      updateFileContent: (id, content) =>
        set((state) => {
          const files = mapTree(state.files, (file) =>
            file.id === id ? { ...file, content } : file
          );

          return {
            files,
            activeFile:
              state.activeFile?.id === id
                ? { ...state.activeFile, content }
                : state.activeFile
          };
        }),

      replaceActiveFileContent: (content) =>
        set((state) => {
          if (!state.activeFile) return state;

          const files = mapTree(state.files, (file) =>
            file.id === state.activeFile?.id ? { ...file, content } : file
          );

          return {
            files,
            activeFile: { ...state.activeFile, content }
          };
        }),

      addFile: (file, parentId) =>
        set((state) => {
          const newFile: FileItem = {
            id: file.id || `file-${Date.now()}`,
            name: file.name,
            language: file.language || getLanguageFromName(file.name),
            content: file.content || "",
            type: "file"
          };

          return {
            files: addToTree(state.files, parentId, newFile),
            activeFile: newFile,
            openTabs: state.openTabs.includes(newFile.id)
              ? state.openTabs
              : [...state.openTabs, newFile.id]
          };
        }),

      addFolder: (name, parentId) =>
        set((state) => {
          const folder: FileItem = {
            id: `folder-${Date.now()}`,
            name,
            language: "plaintext",
            content: "",
            type: "folder",
            isOpen: true,
            children: []
          };

          return {
            files: addToTree(state.files, parentId, folder)
          };
        }),

      deleteFile: (id) =>
        set((state) => {
          const files = removeFromTree(state.files, id);
          const openTabs = state.openTabs.filter((tabId) => tabId !== id);
          const nextActive =
            state.activeFile?.id === id
              ? findFile(files, openTabs[openTabs.length - 1] || "") || firstFile(files)
              : state.activeFile;

          return {
            files,
            openTabs,
            activeFile: nextActive
          };
        }),

      toggleFolder: (id) =>
        set((state) => ({
          files: mapTree(state.files, (file) =>
            file.id === id && file.type === "folder"
              ? { ...file, isOpen: !file.isOpen }
              : file
          )
        })),

      closeTab: (id) =>
        set((state) => {
          const openTabs = state.openTabs.filter((tabId) => tabId !== id);
          const nextActive =
            state.activeFile?.id === id
              ? findFile(state.files, openTabs[openTabs.length - 1] || "") || null
              : state.activeFile;

          return {
            openTabs,
            activeFile: nextActive
          };
        }),

      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, message]
        })),

      clearChat: () =>
        set({
          chatMessages: [welcomeMessage]
        }),

      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

      toggleAgent: () => set((state) => ({ isAgentOpen: !state.isAgentOpen })),

      toggleTerminal: () =>
        set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),

      togglePreview: () =>
        set((state) => ({ isPreviewOpen: !state.isPreviewOpen })),

      toggleTemplates: () =>
        set((state) => ({ isTemplatesOpen: !state.isTemplatesOpen })),

      toggleHistory: () =>
        set((state) => ({ isHistoryOpen: !state.isHistoryOpen })),

      toggleSearch: () =>
        set((state) => ({ isSearchOpen: !state.isSearchOpen })),

      toggleSourceControl: () =>
        set((state) => ({ isSourceControlOpen: !state.isSourceControlOpen })),

      toggleProblems: () =>
        set((state) => ({ isProblemsOpen: !state.isProblemsOpen })),

      toggleSettings: () =>
        set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

      toggleStats: () =>
        set((state) => ({ isStatsOpen: !state.isStatsOpen })),

      toggleContext: () =>
        set((state) => ({ isContextOpen: !state.isContextOpen })),

      toggleReadiness: () =>
        set((state) => ({ isReadinessOpen: !state.isReadinessOpen })),

      toggleLaunchChecklist: () =>
        set((state) => ({ isLaunchChecklistOpen: !state.isLaunchChecklistOpen })),

      resetProject: () =>
        set({
          files: defaultFiles,
          activeFile: firstFile(defaultFiles),
          openTabs: ["file-index"],
          chatMessages: [welcomeMessage],
          isTemplatesOpen: false,
          isHistoryOpen: false,
          isSearchOpen: false,
          isSourceControlOpen: false,
          isProblemsOpen: false,
          isSettingsOpen: false,
          isStatsOpen: false,
          isContextOpen: false,
          isReadinessOpen: false,
          isLaunchChecklistOpen: false
        })
    }),
    {
      name: "ai-code-editor-storage",
      partialize: (state) => ({
        files: state.files,
        activeFile: state.activeFile,
        openTabs: state.openTabs,
        chatMessages: state.chatMessages,
        editorSettings: state.editorSettings,
        isSidebarOpen: state.isSidebarOpen,
        isChatOpen: state.isChatOpen,
        isAgentOpen: state.isAgentOpen,
        isTemplatesOpen: state.isTemplatesOpen,
        isHistoryOpen: state.isHistoryOpen,
        isSearchOpen: state.isSearchOpen,
        isSourceControlOpen: state.isSourceControlOpen,
        isProblemsOpen: state.isProblemsOpen,
        isSettingsOpen: state.isSettingsOpen,
        isStatsOpen: state.isStatsOpen,
        isContextOpen: state.isContextOpen,
        isReadinessOpen: state.isReadinessOpen,
        isLaunchChecklistOpen: state.isLaunchChecklistOpen,
        isTerminalOpen: state.isTerminalOpen,
        isPreviewOpen: state.isPreviewOpen
      })
    }
  )
);

export default useStore;
