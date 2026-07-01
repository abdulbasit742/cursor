"use client";

import {
  AlertTriangle,
  BarChart3,
  Bot,
  Command,
  Download,
  Eye,
  FilePlus,
  GitBranch,
  History,
  LayoutTemplate,
  ListChecks,
  PackageCheck,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Terminal,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useStore from "@/store/useStore";
import { downloadProject } from "@/utils/downloadProject";
import { getLanguageFromName } from "@/utils/language";

export default function CommandPalette() {
  const files = useStore((state) => state.files);
  const addFile = useStore((state) => state.addFile);
  const resetProject = useStore((state) => state.resetProject);
  const toggleChat = useStore((state) => state.toggleChat);
  const toggleAgent = useStore((state) => state.toggleAgent);
  const toggleSearch = useStore((state) => state.toggleSearch);
  const toggleSourceControl = useStore((state) => state.toggleSourceControl);
  const toggleProblems = useStore((state) => state.toggleProblems);
  const toggleTemplates = useStore((state) => state.toggleTemplates);
  const toggleHistory = useStore((state) => state.toggleHistory);
  const toggleStats = useStore((state) => state.toggleStats);
  const toggleContext = useStore((state) => state.toggleContext);
  const toggleReadiness = useStore((state) => state.toggleReadiness);
  const toggleLaunchChecklist = useStore((state) => state.toggleLaunchChecklist);
  const toggleSettings = useStore((state) => state.toggleSettings);
  const togglePreview = useStore((state) => state.togglePreview);
  const toggleTerminal = useStore((state) => state.toggleTerminal);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const commands = useMemo(
    () => [
      {
        title: "Toggle Coding Agent",
        icon: <Sparkles size={16} />,
        action: toggleAgent
      },
      {
        title: "Toggle AI Chat",
        icon: <Bot size={16} />,
        action: toggleChat
      },
      {
        title: "Search Project",
        icon: <Search size={16} />,
        action: toggleSearch
      },
      {
        title: "Toggle Source Control",
        icon: <GitBranch size={16} />,
        action: toggleSourceControl
      },
      {
        title: "Toggle Problems",
        icon: <AlertTriangle size={16} />,
        action: toggleProblems
      },
      {
        title: "Toggle Templates",
        icon: <LayoutTemplate size={16} />,
        action: toggleTemplates
      },
      {
        title: "Toggle Project History",
        icon: <History size={16} />,
        action: toggleHistory
      },
      {
        title: "Toggle Project Stats",
        icon: <BarChart3 size={16} />,
        action: toggleStats
      },
      {
        title: "Toggle AI Context Pack",
        icon: <PackageCheck size={16} />,
        action: toggleContext
      },
      {
        title: "Toggle Project Readiness",
        icon: <ShieldCheck size={16} />,
        action: toggleReadiness
      },
      {
        title: "Toggle Launch Checklist",
        icon: <ListChecks size={16} />,
        action: toggleLaunchChecklist
      },
      {
        title: "Toggle Editor Settings",
        icon: <Settings size={16} />,
        action: toggleSettings
      },
      {
        title: "Toggle Preview",
        icon: <Eye size={16} />,
        action: togglePreview
      },
      {
        title: "Toggle Terminal",
        icon: <Terminal size={16} />,
        action: toggleTerminal
      },
      {
        title: "Download Project ZIP",
        icon: <Download size={16} />,
        action: () => downloadProject(files)
      },
      {
        title: "Reset Project",
        icon: <RotateCcw size={16} />,
        action: resetProject
      },
      {
        title: "New File",
        icon: <FilePlus size={16} />,
        action: () => {
          const name = window.prompt("File name?", "new-file.js");
          if (!name) return;

          addFile({
            name,
            language: getLanguageFromName(name),
            content: "",
            type: "file"
          });
        }
      }
    ],
    [
      addFile,
      files,
      resetProject,
      toggleAgent,
      toggleChat,
      toggleContext,
      toggleHistory,
      toggleLaunchChecklist,
      togglePreview,
      toggleProblems,
      toggleReadiness,
      toggleSearch,
      toggleSettings,
      toggleSourceControl,
      toggleStats,
      toggleTemplates,
      toggleTerminal,
    ]
  );

  const filteredCommands = commands.filter((commandItem) =>
    commandItem.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isPalette =
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "p";

      if (!isPalette) return;

      event.preventDefault();
      setIsOpen((value) => !value);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const runCommand = (action: () => void) => {
    action();
    setIsOpen(false);
    setQuery("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center pt-24">
      <div className="w-[min(92vw,520px)] panel-bg border app-border rounded-xl shadow-2xl overflow-hidden">
        <div className="h-12 flex items-center gap-3 px-4 border-b app-border">
          <Command size={18} className="text-blue-400" />

          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent outline-none text-sm"
          />

          <button onClick={() => setIsOpen(false)} className="p-1 app-hover rounded">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm app-muted">
              No commands found
            </div>
          ) : (
            filteredCommands.map((commandItem) => (
              <button
                key={commandItem.title}
                onClick={() => runCommand(commandItem.action)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm app-hover"
              >
                <span className="app-muted">{commandItem.icon}</span>
                <span>{commandItem.title}</span>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t app-border text-xs app-muted">
          Shortcut: Ctrl + Shift + P
        </div>
      </div>
    </div>
  );
}
