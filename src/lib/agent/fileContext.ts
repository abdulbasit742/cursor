import type { FileItem } from "@/store/useStore";
import { buildProjectContext } from "@/lib/context/projectContext";
import type { AgentProjectFile } from "./types";

export function createAgentFileContext({
  files,
  activeFileId,
  task,
  maxChars
}: {
  files: FileItem[];
  activeFileId?: string | null;
  task?: string;
  maxChars?: number;
}): {
  files: AgentProjectFile[];
  activeFilePath: string | null;
} {
  return buildProjectContext({
    files,
    activeFileId,
    task,
    maxChars
  });
}
