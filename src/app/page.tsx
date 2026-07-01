"use client";

import {
  Bot,
  Download,
  Eye,
  GitBranch,
  History,
  Import,
  LayoutTemplate,
  ListChecks,
  PackageCheck,
  PanelLeft,
  AlertTriangle,
  BarChart3,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Terminal
} from "lucide-react";
import { useMemo, useRef } from "react";
import AgentPanel from "@/components/Agent/AgentPanel";
import AiChat from "@/components/Chat/AiChat";
import ContextPackPanel from "@/components/Context/ContextPackPanel";
import CodeEditor from "@/components/Editor/CodeEditor";
import LaunchChecklistPanel from "@/components/Launch/LaunchChecklistPanel";
import LivePreview from "@/components/Preview/LivePreview";
import ProblemsPanel from "@/components/Problems/ProblemsPanel";
import ProjectHistoryPanel from "@/components/Projects/ProjectHistoryPanel";
import ProjectSearchPanel from "@/components/Search/ProjectSearchPanel";
import EditorSettingsPanel from "@/components/Settings/EditorSettingsPanel";
import FileExplorer from "@/components/Sidebar/FileExplorer";
import SourceControlPanel from "@/components/SourceControl/SourceControlPanel";
import ProjectStatsPanel from "@/components/Stats/ProjectStatsPanel";
import ReadinessPanel from "@/components/Status/ReadinessPanel";
import TemplateGallery from "@/components/Templates/TemplateGallery";
import TerminalPanel from "@/components/Terminal/TerminalPanel";
import CommandPalette from "@/components/CommandPalette";
import ProjectShortcuts from "@/components/ProjectShortcuts";
import SaveShortcut from "@/components/SaveShortcut";
import useStore from "@/store/useStore";
import { downloadProject } from "@/utils/downloadProject";
import { importProjectZip } from "@/utils/importProject";
import { toProjectFileMap } from "@/utils/projectFileMap";
import { templateToFileItems } from "@/utils/templateFiles";
import { saveProjectSnapshot } from "@/lib/projects/projectSnapshots";

export default function HomePage() {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const files = useStore((state) => state.files);
  const isSidebarOpen = useStore((state) => state.isSidebarOpen);
  const isChatOpen = useStore((state) => state.isChatOpen);
  const isAgentOpen = useStore((state) => state.isAgentOpen);
  const isTemplatesOpen = useStore((state) => state.isTemplatesOpen);
  const isHistoryOpen = useStore((state) => state.isHistoryOpen);
  const isSearchOpen = useStore((state) => state.isSearchOpen);
  const isSourceControlOpen = useStore((state) => state.isSourceControlOpen);
  const isProblemsOpen = useStore((state) => state.isProblemsOpen);
  const isSettingsOpen = useStore((state) => state.isSettingsOpen);
  const isStatsOpen = useStore((state) => state.isStatsOpen);
  const isContextOpen = useStore((state) => state.isContextOpen);
  const isReadinessOpen = useStore((state) => state.isReadinessOpen);
  const isLaunchChecklistOpen = useStore((state) => state.isLaunchChecklistOpen);
  const isTerminalOpen = useStore((state) => state.isTerminalOpen);
  const isPreviewOpen = useStore((state) => state.isPreviewOpen);
  const activeFile = useStore((state) => state.activeFile);
  const editorSettings = useStore((state) => state.editorSettings);
  const setFiles = useStore((state) => state.setFiles);
  const setActiveFile = useStore((state) => state.setActiveFile);
  const updateEditorSettings = useStore((state) => state.updateEditorSettings);
  const resetEditorSettings = useStore((state) => state.resetEditorSettings);
  const toggleSidebar = useStore((state) => state.toggleSidebar);
  const toggleChat = useStore((state) => state.toggleChat);
  const toggleAgent = useStore((state) => state.toggleAgent);
  const toggleTemplates = useStore((state) => state.toggleTemplates);
  const toggleHistory = useStore((state) => state.toggleHistory);
  const toggleSearch = useStore((state) => state.toggleSearch);
  const toggleSourceControl = useStore((state) => state.toggleSourceControl);
  const toggleProblems = useStore((state) => state.toggleProblems);
  const toggleSettings = useStore((state) => state.toggleSettings);
  const toggleStats = useStore((state) => state.toggleStats);
  const toggleContext = useStore((state) => state.toggleContext);
  const toggleReadiness = useStore((state) => state.toggleReadiness);
  const toggleLaunchChecklist = useStore((state) => state.toggleLaunchChecklist);
  const toggleTerminal = useStore((state) => state.toggleTerminal);
  const togglePreview = useStore((state) => state.togglePreview);
  const resetProject = useStore((state) => state.resetProject);
  const projectFileMap = useMemo(() => toProjectFileMap(files), [files]);

  async function handleImportProject(file: File) {
    saveProjectSnapshot(files, "Before ZIP import", "import");
    const importedFiles = await importProjectZip(file);

    if (importedFiles.length > 0) {
      setFiles(importedFiles);
    }
  }

  return (
    <main className="h-screen w-screen app-bg flex flex-col overflow-hidden">
      <header className="h-11 panel-bg-2 border-b app-border flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            data-testid="toggle-sidebar-button"
            onClick={toggleSidebar}
            className="p-1.5 app-hover rounded"
            title="Toggle Sidebar"
          >
            <PanelLeft size={18} />
          </button>

          <h1 className="text-sm font-semibold truncate">AI Code Editor</h1>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => downloadProject(files)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm app-hover"
            title="Download project"
          >
            <Download size={16} />
            Download
          </button>

          <button
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm app-hover"
            title="Import ZIP project"
          >
            <Import size={16} />
            Import
          </button>

          <input
            ref={importInputRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = "";
              if (file) void handleImportProject(file);
            }}
          />

          <button
            onClick={() => {
              saveProjectSnapshot(files, "Before reset", "reset");
              resetProject();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm app-hover"
            title="Reset project"
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            onClick={toggleAgent}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
              isAgentOpen ? "bg-cyan-600 text-white" : "app-hover"
            }`}
            title="Toggle Coding Agent"
          >
            <Sparkles size={16} />
            Agent
          </button>

          <button
            onClick={toggleSearch}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
              isSearchOpen ? "bg-[#007acc] text-white" : "app-hover"
            }`}
            title="Search project"
          >
            <Search size={16} />
            Search
          </button>

          <button
            onClick={toggleSourceControl}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
              isSourceControlOpen ? "bg-[#007acc] text-white" : "app-hover"
            }`}
            title="Toggle Source Control"
          >
            <GitBranch size={16} />
            Source
          </button>

          <button
            onClick={toggleProblems}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
              isProblemsOpen ? "bg-[#007acc] text-white" : "app-hover"
            }`}
            title="Toggle Problems"
          >
            <AlertTriangle size={16} />
            Problems
          </button>

          <button
            onClick={toggleStats}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
              isStatsOpen ? "bg-[#007acc] text-white" : "app-hover"
            }`}
            title="Toggle Project Stats"
          >
            <BarChart3 size={16} />
            Stats
          </button>

          <button
            onClick={toggleLaunchChecklist}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
              isLaunchChecklistOpen ? "bg-[#007acc] text-white" : "app-hover"
            }`}
            title="Toggle Launch Checklist"
          >
            <ListChecks size={16} />
            Launch
          </button>

          <button
            onClick={toggleReadiness}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
              isReadinessOpen ? "bg-[#007acc] text-white" : "app-hover"
            }`}
            title="Toggle Readiness"
          >
            <ShieldCheck size={16} />
            Ready
          </button>

          <button
            onClick={toggleContext}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
              isContextOpen ? "bg-[#007acc] text-white" : "app-hover"
            }`}
            title="Toggle AI Context Pack"
          >
            <PackageCheck size={16} />
            Context
          </button>

          <button
            onClick={toggleSettings}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
              isSettingsOpen ? "bg-[#007acc] text-white" : "app-hover"
            }`}
            title="Toggle Editor Settings"
          >
            <Settings size={16} />
            Settings
          </button>

          <button
            onClick={toggleTemplates}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
              isTemplatesOpen ? "bg-[#007acc] text-white" : "app-hover"
            }`}
            title="Toggle Templates"
          >
            <LayoutTemplate size={16} />
            Templates
          </button>

          <button
            onClick={toggleHistory}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
              isHistoryOpen ? "bg-[#007acc] text-white" : "app-hover"
            }`}
            title="Toggle Project History"
          >
            <History size={16} />
            History
          </button>

          <button
            data-testid="toggle-preview-button"
            onClick={togglePreview}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
              isPreviewOpen ? "bg-[#007acc] text-white" : "app-hover"
            }`}
            title="Toggle Preview"
          >
            <Eye size={16} />
            Preview
          </button>

          <button
            data-testid="toggle-terminal-button"
            onClick={toggleTerminal}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
              isTerminalOpen ? "bg-[#007acc] text-white" : "app-hover"
            }`}
            title="Toggle Terminal"
          >
            <Terminal size={16} />
            Terminal
          </button>

          <button
            data-testid="toggle-chat-button"
            onClick={toggleChat}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
              isChatOpen ? "bg-[#007acc] text-white" : "app-hover"
            }`}
            title="Toggle AI Chat"
          >
            <Bot size={16} />
            AI Chat
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {isSidebarOpen && <FileExplorer />}

        <section className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-1 min-h-0">
            <div className={isPreviewOpen ? "w-1/2 h-full" : "w-full h-full"}>
              <CodeEditor />
            </div>

            {isPreviewOpen && (
              <div className="w-1/2 h-full">
                <LivePreview />
              </div>
            )}
          </div>

          {isTerminalOpen && <TerminalPanel />}
        </section>

        {isChatOpen && <AiChat />}
        {isSearchOpen && (
          <aside className="w-[28rem] max-w-[45vw] h-full shrink-0">
            <ProjectSearchPanel
              files={files}
              activeFileId={activeFile?.id}
              onClose={toggleSearch}
              onSelect={(file) => {
                setActiveFile(file);
                toggleSearch();
              }}
            />
          </aside>
        )}
        {isSourceControlOpen && (
          <aside className="w-[28rem] max-w-[45vw] h-full shrink-0">
            <SourceControlPanel
              files={files}
              onOpenFile={(file) => {
                setActiveFile(file);
                toggleSourceControl();
              }}
            />
          </aside>
        )}
        {isProblemsOpen && (
          <aside className="w-[28rem] max-w-[45vw] h-full shrink-0">
            <ProblemsPanel
              files={files}
              onOpenFile={(file) => {
                setActiveFile(file);
                toggleProblems();
              }}
            />
          </aside>
        )}
        {isStatsOpen && (
          <aside className="w-[28rem] max-w-[45vw] h-full shrink-0">
            <ProjectStatsPanel files={files} />
          </aside>
        )}
        {isLaunchChecklistOpen && (
          <aside className="w-[30rem] max-w-[48vw] h-full shrink-0">
            <LaunchChecklistPanel files={files} />
          </aside>
        )}
        {isSettingsOpen && (
          <aside className="w-96 max-w-[42vw] h-full shrink-0">
            <EditorSettingsPanel
              settings={editorSettings}
              onChange={updateEditorSettings}
              onReset={resetEditorSettings}
            />
          </aside>
        )}
        {isContextOpen && (
          <aside className="w-[30rem] max-w-[48vw] h-full shrink-0">
            <ContextPackPanel files={files} />
          </aside>
        )}
        {isReadinessOpen && (
          <aside className="w-[30rem] max-w-[48vw] h-full shrink-0">
            <ReadinessPanel files={projectFileMap} />
          </aside>
        )}
        {isTemplatesOpen && (
          <aside className="w-[28rem] max-w-[45vw] h-full shrink-0">
            <TemplateGallery
              onSelect={(template) => {
                saveProjectSnapshot(files, `Before template: ${template.name}`, "template");
                setFiles(templateToFileItems(template));
                toggleTemplates();
              }}
            />
          </aside>
        )}
        {isHistoryOpen && (
          <aside className="w-96 max-w-[42vw] h-full shrink-0">
            <ProjectHistoryPanel
              onRestore={(snapshot) => {
                saveProjectSnapshot(files, "Before history restore", "manual");
                setFiles(snapshot.files);
                toggleHistory();
              }}
            />
          </aside>
        )}
        {isAgentOpen && <AgentPanel />}
      </div>

      <footer className="h-6 bg-[#007acc] text-white text-xs flex items-center justify-between px-3 shrink-0">
        <span>Ready</span>
        <span>Built by Abdul Basit</span>
      </footer>

      <SaveShortcut />
      <ProjectShortcuts />
      <CommandPalette />
    </main>
  );
}
