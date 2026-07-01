"use client";

import { useEffect, useState } from "react";

interface NewFileModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (path: string, type: "file" | "directory") => void;
  initialPath?: string;
}

export function NewFileModal({ open, onClose, onCreate, initialPath = "" }: NewFileModalProps) {
  const [path, setPath] = useState(initialPath);
  const [type, setType] = useState<"file" | "directory">("file");

  useEffect(() => {
    setPath(initialPath);
  }, [initialPath]);

  if (!open) return null;

  function handleCreate() {
    const trimmed = path.trim();
    if (!trimmed) return;

    onCreate(trimmed, type);
    setPath("");
    setType("file");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md border border-[#3e3e3e] bg-[#252526] text-gray-100 shadow-2xl">
        <div className="border-b border-[#3e3e3e] px-5 py-4">
          <h2 className="text-lg font-semibold">Create New</h2>
          <p className="mt-1 text-sm text-gray-400">Add a file or directory to the workspace.</p>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("file")}
                className={`flex-1 rounded px-4 py-2 text-sm ${
                  type === "file" ? "bg-[#007acc] text-white" : "bg-[#37373d] text-gray-300"
                }`}
              >
                File
              </button>
              <button
                type="button"
                onClick={() => setType("directory")}
                className={`flex-1 rounded px-4 py-2 text-sm ${
                  type === "directory" ? "bg-[#007acc] text-white" : "bg-[#37373d] text-gray-300"
                }`}
              >
                Directory
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Path</label>
            <input
              autoFocus
              value={path}
              onChange={(event) => setPath(event.target.value)}
              placeholder={type === "file" ? "src/app/page.tsx" : "src/components"}
              className="w-full rounded border border-[#3e3e3e] bg-[#1e1e1e] px-4 py-3 text-sm outline-none focus:border-[#007acc]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#3e3e3e] px-5 py-4">
          <button type="button" onClick={onClose} className="rounded bg-[#37373d] px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="button" onClick={handleCreate} className="rounded bg-[#007acc] px-4 py-2 text-sm text-white">
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewFileModal;
