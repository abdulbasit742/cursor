"use client";

import { useMemo, useState } from "react";
import { buildDirectoryTree, type DirectoryNode } from "@/lib/fs/directoryTree";
import type { VirtualFile } from "@/lib/fs/virtualFS";

interface FileTreeProps {
  files: VirtualFile[];
  activePath?: string;
  onSelect?: (path: string) => void;
}

interface TreeNodeProps {
  node: DirectoryNode;
  activePath?: string;
  level?: number;
  onSelect?: (path: string) => void;
}

function FileIcon({ type }: { type: "file" | "directory" }) {
  return <span className="w-10 text-[10px] uppercase text-gray-500">{type === "directory" ? "dir" : "file"}</span>;
}

function TreeNode({ node, activePath, level = 0, onSelect }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const isDirectory = node.type === "directory";
  const active = activePath === node.path;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (isDirectory) setExpanded(!expanded);
          onSelect?.(node.path);
        }}
        className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm ${
          active ? "bg-[#007acc] text-white" : "text-gray-300 hover:bg-[#37373d]"
        }`}
        style={{ paddingLeft: `${level * 14 + 8}px` }}
      >
        {isDirectory ? (
          <span className="w-3 text-xs text-gray-500">{expanded ? "-" : "+"}</span>
        ) : (
          <span className="w-3" />
        )}
        <FileIcon type={node.type} />
        <span className="truncate">{node.name}</span>
      </button>

      {isDirectory && expanded && node.children.length > 0 && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              activePath={activePath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ files, activePath, onSelect }: FileTreeProps) {
  const tree = useMemo(() => buildDirectoryTree(files), [files]);

  return (
    <section className="flex h-full flex-col overflow-hidden border border-[#3e3e3e] bg-[#252526] text-gray-100">
      <div className="border-b border-[#3e3e3e] px-3 py-2">
        <h2 className="text-sm font-semibold">Explorer</h2>
        <p className="text-xs text-gray-400">{files.length} items</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {tree.length === 0 ? (
          <div className="rounded border border-dashed border-[#3e3e3e] p-6 text-center text-sm text-gray-500">
            No files found.
          </div>
        ) : (
          <div className="space-y-1">
            {tree.map((node) => (
              <TreeNode key={node.id} node={node} activePath={activePath} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default FileTree;
