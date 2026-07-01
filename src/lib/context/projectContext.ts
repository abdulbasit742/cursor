import type { FileItem } from "@/store/useStore";
import { rankProjectFiles } from "@/lib/context/fileRanking";
import { flattenFiles } from "@/utils/fileTree";
import { allocateFileBudget, trimToCharBudget } from "./tokenBudget";
import type { AgentProjectFile } from "@/lib/agent/types";

export function buildProjectContext({
  files,
  activeFileId,
  task = "",
  maxChars = 52000
}: {
  files: FileItem[];
  activeFileId?: string | null;
  task?: string;
  maxChars?: number;
}): {
  files: AgentProjectFile[];
  activeFilePath: string | null;
} {
  const flatFiles = flattenFiles(files).filter((file) => file.type === "file");
  const activeFile = flatFiles.find((file) => file.id === activeFileId) || null;
  const allAgentFiles = flatFiles.map((file) => ({
    path: file.path,
    name: file.name,
    language: file.language,
    content: file.content || "",
    size: file.content?.length || 0
  }));

  const rankedFiles = rankProjectFiles({
    task,
    files: allAgentFiles,
    activeFilePath: activeFile?.path,
    maxFiles: 14
  });
  const perFileBudget = allocateFileBudget(maxChars, rankedFiles.length);
  const agentFiles = rankedFiles.map((file) => ({
    path: file.path,
    name: file.name,
    language: file.language,
    content: trimToCharBudget(file.content || "", perFileBudget),
    size: file.size
  }));

  return {
    files: agentFiles,
    activeFilePath: activeFile?.path || null
  };
}
