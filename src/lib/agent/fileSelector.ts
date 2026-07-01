import { rankProjectFiles } from "@/lib/context/fileRanking";
import type { AgentProjectFile } from "./types";

export function selectAgentFiles({
  task,
  files,
  activeFilePath,
  maxFiles = 12
}: {
  task: string;
  files: AgentProjectFile[];
  activeFilePath?: string | null;
  maxFiles?: number;
}) {
  return rankProjectFiles({
    task,
    files,
    activeFilePath,
    maxFiles
  });
}
