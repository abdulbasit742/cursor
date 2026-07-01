"use client";

import { BarChart3, FileText } from "lucide-react";
import { useMemo } from "react";
import type { FileItem } from "@/store/useStore";
import { analyzeProjectDiagnostics } from "@/utils/projectDiagnostics";
import { getProjectStats } from "@/utils/projectStats";

interface ProjectStatsPanelProps {
  files: FileItem[];
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en").format(value);
}

export function ProjectStatsPanel({ files }: ProjectStatsPanelProps) {
  const stats = useMemo(() => getProjectStats(files), [files]);
  const diagnostics = useMemo(() => analyzeProjectDiagnostics(files), [files]);

  return (
    <section className="flex h-full flex-col border border-[#3e3e3e] bg-[#252526] text-gray-100">
      <div className="border-b border-[#3e3e3e] p-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-[#4fc1ff]" />
          <h2 className="text-sm font-semibold">Project Stats</h2>
        </div>
        <p className="mt-1 text-xs text-gray-400">Size, languages, diagnostics, and largest files</p>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-[#3e3e3e] p-3 text-center text-xs">
        <div className="rounded bg-[#1e1e1e] p-3">
          <p className="text-gray-500">Files</p>
          <p className="mt-1 text-xl font-semibold">{stats.totalFiles}</p>
        </div>
        <div className="rounded bg-[#1e1e1e] p-3">
          <p className="text-gray-500">Folders</p>
          <p className="mt-1 text-xl font-semibold">{stats.totalFolders}</p>
        </div>
        <div className="rounded bg-[#1e1e1e] p-3">
          <p className="text-gray-500">Lines</p>
          <p className="mt-1 text-xl font-semibold">{formatNumber(stats.totalLines)}</p>
        </div>
        <div className="rounded bg-[#1e1e1e] p-3">
          <p className="text-gray-500">Characters</p>
          <p className="mt-1 text-xl font-semibold">{formatNumber(stats.totalCharacters)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-[#3e3e3e] p-3 text-center text-xs">
        <div className="rounded bg-[#1e1e1e] p-2">
          <p className="text-gray-500">Errors</p>
          <p className="mt-1 text-lg font-semibold text-red-300">{diagnostics.errors}</p>
        </div>
        <div className="rounded bg-[#1e1e1e] p-2">
          <p className="text-gray-500">Warnings</p>
          <p className="mt-1 text-lg font-semibold text-yellow-300">{diagnostics.warnings}</p>
        </div>
        <div className="rounded bg-[#1e1e1e] p-2">
          <p className="text-gray-500">Info</p>
          <p className="mt-1 text-lg font-semibold text-blue-300">{diagnostics.info}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-4">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Languages</h3>
            <div className="mt-2 space-y-2">
              {stats.languages.map((language) => (
                <div key={language.language} className="rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>{language.language}</span>
                    <span className="text-gray-400">{language.files} files</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatNumber(language.lines)} lines - {formatNumber(language.characters)} chars
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Largest Files</h3>
            <div className="mt-2 space-y-2">
              {stats.largestFiles.map((file) => (
                <article key={file.path} className="rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3">
                  <div className="flex items-start gap-2">
                    <FileText size={15} className="mt-0.5 text-gray-400" />
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-medium">{file.name}</h4>
                      <p className="mt-1 truncate text-xs text-gray-500">{file.path}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatNumber(file.lines)} lines - {formatNumber(file.characters)} chars
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default ProjectStatsPanel;
