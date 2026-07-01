import type { ProjectTemplate } from "@/lib/templates/templateRegistry";
import type { FileItem } from "@/store/useStore";
import { getLanguageFromName } from "@/utils/language";

function slugId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureFolder(level: FileItem[], pathParts: string[]): FileItem[] {
  let currentLevel = level;
  const createdFolders: FileItem[] = [];

  pathParts.forEach((part, index) => {
    const folderPath = pathParts.slice(0, index + 1).join("/");
    let folder = currentLevel.find((item) => item.type === "folder" && item.name === part);

    if (!folder) {
      folder = {
        id: `template-folder-${slugId(folderPath)}`,
        name: part,
        language: "plaintext",
        content: "",
        type: "folder",
        isOpen: true,
        children: [],
      };

      currentLevel.push(folder);
      createdFolders.push(folder);
    }

    folder.children = folder.children ?? [];
    currentLevel = folder.children;
  });

  return currentLevel;
}

export function templateToFileItems(template: ProjectTemplate): FileItem[] {
  const root: FileItem[] = [];

  Object.entries(template.files)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([path, content]) => {
      const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
      const fileName = parts.pop();

      if (!fileName) return;

      const targetLevel = ensureFolder(root, parts);
      const fullPath = [...parts, fileName].join("/");

      targetLevel.push({
        id: `template-file-${slugId(template.id)}-${slugId(fullPath)}`,
        name: fileName,
        language: getLanguageFromName(fileName),
        content,
        type: "file",
      });
    });

  return root;
}
