"use client";

import { X } from "lucide-react";
import useStore, { type FileItem } from "@/store/useStore";
import { findFile } from "@/utils/fileTree";

export default function EditorTabs() {
  const files = useStore((state) => state.files);
  const activeFile = useStore((state) => state.activeFile);
  const openTabs = useStore((state) => state.openTabs);
  const setActiveFile = useStore((state) => state.setActiveFile);
  const closeTab = useStore((state) => state.closeTab);

  const tabs = openTabs
    .map((id) => findFile(files, id))
    .filter((file): file is FileItem => Boolean(file && file.type === "file"));

  return (
    <div className="h-10 panel-bg border-b app-border flex items-center overflow-x-auto shrink-0">
      {tabs.length === 0 ? (
        <div className="px-3 text-xs app-muted">No open files</div>
      ) : (
        tabs.map((file) => (
          <div
            key={file.id}
            onClick={() => setActiveFile(file)}
            className={`h-full flex items-center gap-2 px-3 border-r app-border cursor-pointer text-sm min-w-[120px] max-w-[190px] ${
              activeFile?.id === file.id
                ? "app-bg text-white"
                : "panel-bg-2 app-muted app-hover"
            }`}
            title={file.name}
          >
            <span className="truncate flex-1 text-left">{file.name}</span>

            <button
              onClick={(event) => {
                event.stopPropagation();
                closeTab(file.id);
              }}
              className="p-0.5 rounded app-hover"
              aria-label={`Close ${file.name}`}
            >
              <X size={14} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
