"use client";

interface FileBreadcrumbProps {
  path: string;
  onNavigate?: (path: string) => void;
}

function buildSegments(path: string) {
  const normalized = path.replace(/^\/+/, "");
  if (!normalized) return [];

  const parts = normalized.split("/");

  return parts.map((part, index) => ({
    name: part,
    path: parts.slice(0, index + 1).join("/"),
  }));
}

export function FileBreadcrumb({ path, onNavigate }: FileBreadcrumbProps) {
  const segments = buildSegments(path);

  return (
    <nav className="flex items-center overflow-x-auto border border-[#3e3e3e] bg-[#252526] px-3 py-2 text-sm text-gray-100">
      <button
        type="button"
        onClick={() => onNavigate?.("")}
        className="rounded px-2 py-1 text-gray-300 hover:bg-[#37373d] hover:text-white"
      >
        Root
      </button>

      {segments.map((segment, index) => {
        const last = index === segments.length - 1;

        return (
          <div key={segment.path} className="flex items-center">
            <span className="px-1 text-gray-600">/</span>
            <button
              type="button"
              onClick={() => onNavigate?.(segment.path)}
              disabled={last}
              className={`rounded px-2 py-1 ${
                last ? "cursor-default text-blue-300" : "text-gray-300 hover:bg-[#37373d] hover:text-white"
              }`}
            >
              {segment.name}
            </button>
          </div>
        );
      })}
    </nav>
  );
}

export default FileBreadcrumb;
