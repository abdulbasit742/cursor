"use client";

import { useEffect } from "react";
import useStore from "@/store/useStore";

export default function ProjectShortcuts() {
  const toggleSidebar = useStore((state) => state.toggleSidebar);
  const toggleSearch = useStore((state) => state.toggleSearch);
  const toggleTerminal = useStore((state) => state.toggleTerminal);
  const toggleProblems = useStore((state) => state.toggleProblems);
  const toggleSourceControl = useStore((state) => state.toggleSourceControl);
  const toggleSettings = useStore((state) => state.toggleSettings);
  const toggleContext = useStore((state) => state.toggleContext);
  const toggleReadiness = useStore((state) => state.toggleReadiness);
  const toggleLaunchChecklist = useStore((state) => state.toggleLaunchChecklist);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const meta = event.ctrlKey || event.metaKey;
      const quickOpen = meta && !event.shiftKey && key === "p";
      const projectSearch = meta && event.shiftKey && key === "f";
      const sidebar = meta && key === "b";
      const terminal = meta && key === "`";
      const problems = meta && event.shiftKey && key === "m";
      const source = meta && event.shiftKey && key === "g";
      const settings = meta && key === ",";
      const context = meta && event.altKey && key === "c";
      const readiness = meta && event.altKey && key === "r";
      const launch = meta && event.altKey && key === "l";

      if (!quickOpen && !projectSearch && !sidebar && !terminal && !problems && !source && !settings && !context && !readiness && !launch) {
        return;
      }

      event.preventDefault();

      if (quickOpen || projectSearch) toggleSearch();
      if (sidebar) toggleSidebar();
      if (terminal) toggleTerminal();
      if (problems) toggleProblems();
      if (source) toggleSourceControl();
      if (settings) toggleSettings();
      if (context) toggleContext();
      if (readiness) toggleReadiness();
      if (launch) toggleLaunchChecklist();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    toggleProblems,
    toggleContext,
    toggleSearch,
    toggleSettings,
    toggleReadiness,
    toggleLaunchChecklist,
    toggleSidebar,
    toggleSourceControl,
    toggleTerminal,
  ]);

  return null;
}
