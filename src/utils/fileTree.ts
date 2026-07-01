import type { FileItem } from "@/store/useStore";

export type FlatFile = FileItem & { path: string };

export function flattenFiles(files: FileItem[], basePath = ""): FlatFile[] {
  return files.flatMap((file) => {
    const path = basePath ? `${basePath}/${file.name}` : file.name;

    if (file.type === "folder") {
      return flattenFiles(file.children || [], path);
    }

    return [{ ...file, path }];
  });
}

export function findFile(files: FileItem[], id: string): FileItem | null {
  for (const file of files) {
    if (file.id === id) return file;

    if (file.type === "folder") {
      const found = findFile(file.children || [], id);
      if (found) return found;
    }
  }

  return null;
}

export function mapTree(
  files: FileItem[],
  mapper: (file: FileItem) => FileItem
): FileItem[] {
  return files.map((file) => {
    const mapped = mapper(file);

    if (mapped.type === "folder") {
      return {
        ...mapped,
        children: mapTree(mapped.children || [], mapper)
      };
    }

    return mapped;
  });
}

export function addToTree(
  files: FileItem[],
  parentId: string | null | undefined,
  item: FileItem
): FileItem[] {
  if (!parentId) return [...files, item];

  return files.map((file) => {
    if (file.id === parentId && file.type === "folder") {
      return {
        ...file,
        isOpen: true,
        children: [...(file.children || []), item]
      };
    }

    if (file.type === "folder") {
      return {
        ...file,
        children: addToTree(file.children || [], parentId, item)
      };
    }

    return file;
  });
}

export function removeFromTree(files: FileItem[], id: string): FileItem[] {
  return files
    .filter((file) => file.id !== id)
    .map((file) => {
      if (file.type !== "folder") return file;

      return {
        ...file,
        children: removeFromTree(file.children || [], id)
      };
    });
}
