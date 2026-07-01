import type { VirtualFile } from "./virtualFS";

export interface DirectoryNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  children: DirectoryNode[];
  file?: VirtualFile;
}

function createNodeId(path: string): string {
  return `node_${path.replace(/[^\w]/g, "_")}`;
}

function getPathParts(path: string): string[] {
  return path.replace(/^\/+/, "").split("/").filter(Boolean);
}

export function createDirectoryNode(
  name: string,
  path: string,
  type: "file" | "directory"
): DirectoryNode {
  return {
    id: createNodeId(path),
    name,
    path,
    type,
    children: [],
  };
}

export function buildDirectoryTree(files: VirtualFile[]): DirectoryNode[] {
  const root: DirectoryNode[] = [];

  for (const file of files) {
    const parts = getPathParts(file.path);
    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = index === parts.length - 1;
      let existing = currentLevel.find((node) => node.name === part);

      if (!existing) {
        existing = createDirectoryNode(part, currentPath, isLast ? file.type : "directory");
        currentLevel.push(existing);
      }

      if (isLast) existing.file = file;
      currentLevel = existing.children;
    });
  }

  return sortDirectoryTree(root);
}

export function sortDirectoryTree(nodes: DirectoryNode[]): DirectoryNode[] {
  return [...nodes]
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((node) => ({
      ...node,
      children: sortDirectoryTree(node.children),
    }));
}

export function flattenDirectoryTree(nodes: DirectoryNode[]): DirectoryNode[] {
  const result: DirectoryNode[] = [];

  function walk(items: DirectoryNode[]) {
    for (const item of items) {
      result.push(item);
      if (item.children.length > 0) walk(item.children);
    }
  }

  walk(nodes);
  return result;
}

export function findNodeByPath(nodes: DirectoryNode[], path: string): DirectoryNode | null {
  const normalized = path.replace(/^\/+/, "");

  for (const node of nodes) {
    if (node.path === normalized) return node;

    const child = findNodeByPath(node.children, normalized);
    if (child) return child;
  }

  return null;
}

export function filterDirectoryTree(nodes: DirectoryNode[], query: string): DirectoryNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  return nodes
    .map((node) => {
      const matches = node.name.toLowerCase().includes(q);
      const children = filterDirectoryTree(node.children, q);

      if (matches || children.length > 0) {
        return {
          ...node,
          children,
        };
      }

      return null;
    })
    .filter(Boolean) as DirectoryNode[];
}
