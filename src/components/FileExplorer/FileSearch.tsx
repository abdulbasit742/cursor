"use client";

import { useMemo, useState } from "react";
import { searchFiles, type FileSearchResult } from "@/lib/fs/fileSearch";
import type { VirtualFile } from "@/lib/fs/virtualFS";

interface FileSearchProps {
  files: VirtualFile[];
  onSelect?: (path: string) => void;
  placeholder?: string;
}

export function FileSearch({ files, onSelect, placeholder = "Search files..." }: FileSearchProps) {
  const [query, setQuery] = useState("");

  const results = useMemo<FileSearchResult[]>(() => {
    if (!query.trim()) return [];
    return searchFiles(files, { query, includeContent: true, limit: 30 });
  }, [files, query]);

  return (
    <section className="flex h-full flex-col overflow-hidden border border-[#3e3e3e] bg-[#252526] text-gray-100">
      <div className="border-b border-[#3e3e3e] p-3">
        <h2 className="text-sm font-semibold">File Search</h2>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="mt-3 w-full rounded border border-[#3e3e3e] bg-[#1e1e1e] px-3 py-2 text-sm outline-none focus:border-[#007acc]"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {!query.trim() ? (
          <div className="rounded border border-dashed border-[#3e3e3e] p-6 text-center text-sm text-gray-500">
            Start typing to search files.
          </div>
        ) : results.length === 0 ? (
          <div className="rounded border border-dashed border-[#3e3e3e] p-6 text-center text-sm text-gray-500">
            No matching files found.
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((result) => (
              <button
                key={result.file.path}
                type="button"
                onClick={() => onSelect?.(result.file.path)}
                className="w-full rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3 text-left hover:border-[#007acc]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium text-white">{result.file.name}</h3>
                    <p className="mt-1 truncate text-xs text-gray-500">{result.file.path}</p>
                  </div>
                  <span className="rounded bg-[#007acc] px-2 py-1 text-xs text-white">
                    {result.score}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {result.matches.map((match) => (
                    <span key={match} className="rounded bg-[#37373d] px-2 py-1 text-xs">
                      {match}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default FileSearch;
