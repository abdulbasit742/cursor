"use client";

import { FileText, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FileItem } from "@/store/useStore";
import { searchProjectFiles } from "@/utils/projectSearch";

interface ProjectSearchPanelProps {
  files: FileItem[];
  activeFileId?: string | null;
  onSelect: (file: FileItem) => void;
  onClose: () => void;
}

export function ProjectSearchPanel({
  files,
  activeFileId,
  onSelect,
  onClose,
}: ProjectSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [includeContent, setIncludeContent] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const results = useMemo(
    () =>
      searchProjectFiles(files, query, {
        includeContent,
        limit: query.trim() ? 80 : 40,
      }),
    [files, includeContent, query]
  );

  return (
    <section className="flex h-full flex-col border border-[#3e3e3e] bg-[#252526] text-gray-100">
      <div className="border-b border-[#3e3e3e] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-[#4fc1ff]" />
            <h2 className="text-sm font-semibold">Project Search</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-[#37373d] hover:text-white"
            title="Close search"
          >
            <X size={16} />
          </button>
        </div>

        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search files or code..."
          className="mt-3 w-full rounded border border-[#3e3e3e] bg-[#1e1e1e] px-3 py-2 text-sm outline-none focus:border-[#007acc]"
        />

        <label className="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={includeContent}
            onChange={(event) => setIncludeContent(event.target.checked)}
            className="h-3.5 w-3.5 accent-[#007acc]"
          />
          Search file contents
        </label>
      </div>

      <div className="flex items-center justify-between border-b border-[#3e3e3e] px-3 py-2 text-xs text-gray-400">
        <span>{results.length} results</span>
        <span>{query.trim() ? "ranked" : "quick open"}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {results.length === 0 ? (
          <div className="rounded border border-dashed border-[#3e3e3e] p-8 text-center text-sm text-gray-400">
            No matching files found.
          </div>
        ) : (
          <div className="space-y-1">
            {results.map((result) => {
              const active = result.file.id === activeFileId;

              return (
                <button
                  key={result.file.id}
                  type="button"
                  onClick={() => onSelect(result.file)}
                  className={`w-full rounded border p-3 text-left transition ${
                    active
                      ? "border-[#007acc] bg-[#073655]"
                      : "border-transparent bg-[#1e1e1e] hover:border-[#3e3e3e]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <FileText size={16} className="mt-0.5 shrink-0 text-gray-400" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="truncate text-sm font-medium text-white">{result.file.name}</h3>
                        <span className="rounded bg-[#37373d] px-2 py-0.5 text-xs text-gray-300">
                          {result.score}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-xs text-gray-500">{result.path}</p>
                      <p className="mt-2 line-clamp-2 text-xs text-gray-300">
                        {result.lineNumber ? `L${result.lineNumber}: ` : ""}
                        {result.snippet}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {result.matches.map((match) => (
                          <span key={match} className="rounded bg-[#37373d] px-2 py-0.5 text-[11px] text-gray-400">
                            {match}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProjectSearchPanel;
