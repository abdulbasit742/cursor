export type VirtualFileType = "file" | "directory";

export interface VirtualFile {
  path: string;
  name: string;
  type: VirtualFileType;
  content?: string;
  createdAt: string;
  updatedAt: string;
  size: number;
}

export interface VirtualFSState {
  files: Record<string, VirtualFile>;
}

function now(): string {
  return new Date().toISOString();
}

export function normalizeVirtualPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/+/, "");
}

function getNameFromPath(path: string): string {
  const parts = normalizeVirtualPath(path).split("/");
  return parts[parts.length - 1] || "";
}

function cloneState(state: VirtualFSState): VirtualFSState {
  return {
    files: Object.fromEntries(Object.entries(state.files).map(([path, file]) => [path, { ...file }])),
  };
}

export class VirtualFS {
  private state: VirtualFSState;

  constructor(initial?: VirtualFSState) {
    this.state = initial ? cloneState(initial) : { files: {} };
  }

  getAll(): VirtualFile[] {
    return Object.values(this.state.files).sort((a, b) => a.path.localeCompare(b.path));
  }

  exists(path: string): boolean {
    return Boolean(this.state.files[normalizeVirtualPath(path)]);
  }

  get(path: string): VirtualFile | null {
    return this.state.files[normalizeVirtualPath(path)] ?? null;
  }

  createFile(path: string, content = ""): VirtualFile {
    const normalized = normalizeVirtualPath(path);
    const file: VirtualFile = {
      path: normalized,
      name: getNameFromPath(normalized),
      type: "file",
      content,
      createdAt: now(),
      updatedAt: now(),
      size: content.length,
    };

    this.state.files[normalized] = file;
    return file;
  }

  createDirectory(path: string): VirtualFile {
    const normalized = normalizeVirtualPath(path);
    const directory: VirtualFile = {
      path: normalized,
      name: getNameFromPath(normalized),
      type: "directory",
      createdAt: now(),
      updatedAt: now(),
      size: 0,
    };

    this.state.files[normalized] = directory;
    return directory;
  }

  updateFile(path: string, content: string): VirtualFile | null {
    const normalized = normalizeVirtualPath(path);
    const existing = this.state.files[normalized];

    if (!existing || existing.type !== "file") return null;

    const updated: VirtualFile = {
      ...existing,
      content,
      updatedAt: now(),
      size: content.length,
    };

    this.state.files[normalized] = updated;
    return updated;
  }

  delete(path: string): boolean {
    const normalized = normalizeVirtualPath(path);

    if (!this.state.files[normalized]) return false;

    delete this.state.files[normalized];

    Object.keys(this.state.files)
      .filter((filePath) => filePath.startsWith(`${normalized}/`))
      .forEach((filePath) => {
        delete this.state.files[filePath];
      });

    return true;
  }

  rename(oldPath: string, newPath: string): boolean {
    const normalizedOld = normalizeVirtualPath(oldPath);
    const normalizedNew = normalizeVirtualPath(newPath);
    const existing = this.state.files[normalizedOld];

    if (!existing) return false;

    delete this.state.files[normalizedOld];

    this.state.files[normalizedNew] = {
      ...existing,
      path: normalizedNew,
      name: getNameFromPath(normalizedNew),
      updatedAt: now(),
    };

    const descendants = Object.entries(this.state.files).filter(([path]) =>
      path.startsWith(`${normalizedOld}/`)
    );

    for (const [path, file] of descendants) {
      const nextPath = `${normalizedNew}/${path.slice(normalizedOld.length + 1)}`;
      delete this.state.files[path];
      this.state.files[nextPath] = {
        ...file,
        path: nextPath,
        name: getNameFromPath(nextPath),
        updatedAt: now(),
      };
    }

    return true;
  }

  readFile(path: string): string | null {
    const file = this.get(path);
    if (!file || file.type !== "file") return null;
    return file.content ?? "";
  }

  export(): VirtualFSState {
    return cloneState(this.state);
  }

  import(state: VirtualFSState): void {
    this.state = cloneState(state);
  }

  clear(): void {
    this.state = { files: {} };
  }
}

export default VirtualFS;
