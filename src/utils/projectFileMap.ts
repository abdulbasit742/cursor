import type { FileItem } from "@/store/useStore";
import { flattenFiles } from "@/utils/fileTree";

export function toProjectFileMap(files: FileItem[]): Record<string, string> {
  return Object.fromEntries(flattenFiles(files).map((file) => [file.path, file.content]));
}
