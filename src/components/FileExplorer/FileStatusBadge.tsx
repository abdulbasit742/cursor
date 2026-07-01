"use client";

export type FileStatus = "saved" | "modified" | "new" | "deleted" | "readonly";

interface FileStatusBadgeProps {
  status: FileStatus;
  compact?: boolean;
}

function getStatusStyles(status: FileStatus): string {
  if (status === "saved") return "bg-green-900 text-green-300 border-green-800";
  if (status === "modified") return "bg-yellow-900 text-yellow-300 border-yellow-800";
  if (status === "new") return "bg-blue-900 text-blue-300 border-blue-800";
  if (status === "deleted") return "bg-red-900 text-red-300 border-red-800";
  return "bg-[#37373d] text-gray-300 border-[#3e3e3e]";
}

function getStatusLabel(status: FileStatus, compact: boolean): string {
  if (!compact) return status;
  if (status === "saved") return "S";
  if (status === "modified") return "M";
  if (status === "new") return "N";
  if (status === "deleted") return "D";
  return "R";
}

export function FileStatusBadge({ status, compact = false }: FileStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium capitalize ${getStatusStyles(
        status
      )}`}
      title={`File status: ${status}`}
    >
      {getStatusLabel(status, compact)}
    </span>
  );
}

export default FileStatusBadge;
