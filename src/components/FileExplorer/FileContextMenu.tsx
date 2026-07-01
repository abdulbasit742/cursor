"use client";

import type { VirtualFile } from "@/lib/fs/virtualFS";

interface FileContextMenuProps {
  file: VirtualFile | null;
  x: number;
  y: number;
  open: boolean;
  onClose: () => void;
  onOpen?: (file: VirtualFile) => void;
  onRename?: (file: VirtualFile) => void;
  onDelete?: (file: VirtualFile) => void;
  onDuplicate?: (file: VirtualFile) => void;
  onCopyPath?: (file: VirtualFile) => void;
}

export function FileContextMenu({
  file,
  x,
  y,
  open,
  onClose,
  onOpen,
  onRename,
  onDelete,
  onDuplicate,
  onCopyPath,
}: FileContextMenuProps) {
  if (!open || !file) return null;

  const selectedFile = file;
  const itemClass = "w-full rounded px-3 py-2 text-left text-sm text-gray-200 hover:bg-[#37373d]";

  function action(handler?: (file: VirtualFile) => void) {
    handler?.(selectedFile);
    onClose();
  }

  return (
    <>
      <button
        aria-label="Close file menu"
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-transparent"
      />

      <div
        className="fixed z-50 w-56 border border-[#3e3e3e] bg-[#252526] p-2 text-gray-100 shadow-2xl"
        style={{ left: x, top: y }}
      >
        <div className="border-b border-[#3e3e3e] px-3 py-2">
          <p className="truncate text-sm font-medium">{selectedFile.name}</p>
          <p className="truncate text-xs text-gray-500">{selectedFile.path}</p>
        </div>

        <div className="mt-2 space-y-1">
          <button type="button" onClick={() => action(onOpen)} className={itemClass}>
            Open
          </button>
          <button type="button" onClick={() => action(onRename)} className={itemClass}>
            Rename
          </button>
          <button type="button" onClick={() => action(onDuplicate)} className={itemClass}>
            Duplicate
          </button>
          <button type="button" onClick={() => action(onCopyPath)} className={itemClass}>
            Copy Path
          </button>
          <button
            type="button"
            onClick={() => action(onDelete)}
            className="w-full rounded px-3 py-2 text-left text-sm text-red-300 hover:bg-red-950"
          >
            Delete
          </button>
        </div>
      </div>
    </>
  );
}

export default FileContextMenu;
