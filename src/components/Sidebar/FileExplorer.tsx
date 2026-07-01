"use client";

import {
  ChevronDown,
  ChevronRight,
  File,
  FileCode,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Trash2
} from "lucide-react";
import { useState, type MouseEvent } from "react";
import useStore, { type FileItem } from "@/store/useStore";
import { getLanguageFromName } from "@/utils/language";

function getFileIcon(file: FileItem) {
  if (file.type === "folder") {
    return file.isOpen ? (
      <FolderOpen size={16} className="text-yellow-400" />
    ) : (
      <Folder size={16} className="text-yellow-400" />
    );
  }

  if (["html", "css", "javascript", "typescript", "python"].includes(file.language)) {
    return <FileCode size={16} className="text-blue-400" />;
  }

  if (file.language === "markdown") {
    return <FileText size={16} className="text-gray-300" />;
  }

  return <File size={16} className="text-gray-300" />;
}

function FileRow({ file, level }: { file: FileItem; level: number }) {
  const activeFile = useStore((state) => state.activeFile);
  const setActiveFile = useStore((state) => state.setActiveFile);
  const deleteFile = useStore((state) => state.deleteFile);
  const toggleFolder = useStore((state) => state.toggleFolder);
  const addFile = useStore((state) => state.addFile);
  const addFolder = useStore((state) => state.addFolder);

  const handleClick = () => {
    if (file.type === "folder") {
      toggleFolder(file.id);
      return;
    }

    setActiveFile(file);
  };

  const addChildFile = (event: MouseEvent) => {
    event.stopPropagation();

    const name = window.prompt("File name?", "new-file.js");
    if (!name) return;

    addFile(
      {
        name,
        language: getLanguageFromName(name),
        content: "",
        type: "file"
      },
      file.type === "folder" ? file.id : null
    );
  };

  const addChildFolder = (event: MouseEvent) => {
    event.stopPropagation();

    const name = window.prompt("Folder name?", "components");
    if (!name) return;

    addFolder(name, file.type === "folder" ? file.id : null);
  };

  const remove = (event: MouseEvent) => {
    event.stopPropagation();

    if (window.confirm(`Delete ${file.name}?`)) {
      deleteFile(file.id);
    }
  };

  return (
    <>
      <div
        data-testid={`file-row-${file.name}`}
        onClick={handleClick}
        className={`file-item group flex items-center justify-between py-1.5 pr-2 cursor-pointer text-sm ${
          activeFile?.id === file.id ? "active" : ""
        }`}
        style={{ paddingLeft: `${level * 14 + 8}px` }}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          {file.type === "folder" ? (
            file.isOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <span className="w-[14px]" />
          )}

          {getFileIcon(file)}
          <span className="truncate">{file.name}</span>
        </div>

        <div className="hidden group-hover:flex items-center gap-1">
          {file.type === "folder" && (
            <>
              <button
                onClick={addChildFile}
                className="p-1 app-hover rounded"
                title="New file"
              >
                <Plus size={13} />
              </button>

              <button
                onClick={addChildFolder}
                className="p-1 app-hover rounded"
                title="New folder"
              >
                <Folder size={13} />
              </button>
            </>
          )}

          <button
            onClick={remove}
            className="p-1 hover:bg-red-600 rounded"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {file.type === "folder" &&
        file.isOpen &&
        file.children?.map((child) => (
          <FileRow key={child.id} file={child} level={level + 1} />
        ))}
    </>
  );
}

export default function FileExplorer() {
  const files = useStore((state) => state.files);
  const addFile = useStore((state) => state.addFile);
  const addFolder = useStore((state) => state.addFolder);
  const [newFileName, setNewFileName] = useState("");

  const createRootFile = () => {
    const name = newFileName.trim();
    if (!name) return;

    addFile({
      name,
      language: getLanguageFromName(name),
      content: "",
      type: "file"
    });
    setNewFileName("");
  };

  const createRootFolder = () => {
    const name = window.prompt("Folder name?", "components");
    if (!name) return;

    addFolder(name);
  };

  return (
    <aside data-testid="file-explorer" className="w-64 h-full panel-bg border-r app-border flex flex-col">
      <div className="h-10 flex items-center justify-between px-3 border-b app-border shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-wide app-muted">
          Explorer
        </h2>

        <div className="flex items-center gap-1">
          <button
            data-testid="add-file-button"
            onClick={createRootFile}
            className="p-1 app-hover rounded"
            title="Add root file"
          >
            <Plus size={16} />
          </button>

          <button
            onClick={createRootFolder}
            className="p-1 app-hover rounded"
            title="Add root folder"
          >
            <Folder size={16} />
          </button>
        </div>
      </div>

      <div className="p-2 border-b app-border shrink-0">
        <input
          data-testid="new-file-input"
          value={newFileName}
          onChange={(event) => setNewFileName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") createRootFile();
          }}
          placeholder="new-file.js"
          className="w-full app-input border rounded px-2 py-1 text-sm outline-none focus:border-[#007acc]"
        />
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {files.map((file) => (
          <FileRow key={file.id} file={file} level={0} />
        ))}
      </div>
    </aside>
  );
}
