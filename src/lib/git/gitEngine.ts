export type GitFileStatus = "untracked" | "modified" | "added" | "deleted" | "renamed" | "clean";

export interface GitFileChange {
  path: string;
  status: GitFileStatus;
  previousPath?: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  createdAt: string;
  filesChanged: string[];
}

export interface GitRepositoryState {
  currentBranch: string;
  branches: string[];
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  commits: GitCommit[];
  initialized: boolean;
}

function createHash(): string {
  return Math.random().toString(36).slice(2, 10);
}

function cloneState(state: GitRepositoryState): GitRepositoryState {
  return {
    ...state,
    branches: [...state.branches],
    staged: state.staged.map((item) => ({ ...item })),
    unstaged: state.unstaged.map((item) => ({ ...item })),
    commits: state.commits.map((item) => ({ ...item, filesChanged: [...item.filesChanged] })),
  };
}

export function createEmptyGitRepository(): GitRepositoryState {
  return {
    currentBranch: "main",
    branches: ["main"],
    staged: [],
    unstaged: [],
    commits: [],
    initialized: true,
  };
}

export class GitEngine {
  private state: GitRepositoryState;

  constructor(initialState?: GitRepositoryState) {
    this.state = initialState ? cloneState(initialState) : createEmptyGitRepository();
  }

  getState(): GitRepositoryState {
    return cloneState(this.state);
  }

  status(): {
    branch: string;
    staged: GitFileChange[];
    unstaged: GitFileChange[];
    clean: boolean;
  } {
    return {
      branch: this.state.currentBranch,
      staged: [...this.state.staged],
      unstaged: [...this.state.unstaged],
      clean: this.state.staged.length === 0 && this.state.unstaged.length === 0,
    };
  }

  addChange(change: GitFileChange): void {
    const existingIndex = this.state.unstaged.findIndex((item) => item.path === change.path);

    if (existingIndex >= 0) {
      this.state.unstaged[existingIndex] = change;
      return;
    }

    if (!this.state.staged.some((item) => item.path === change.path)) {
      this.state.unstaged.push(change);
    }
  }

  stage(path: string): boolean {
    const change = this.state.unstaged.find((item) => item.path === path);
    if (!change) return false;

    this.state.unstaged = this.state.unstaged.filter((item) => item.path !== path);
    this.state.staged.push(change);
    return true;
  }

  stageAll(): number {
    const count = this.state.unstaged.length;
    this.state.staged = [...this.state.staged, ...this.state.unstaged];
    this.state.unstaged = [];
    return count;
  }

  unstage(path: string): boolean {
    const change = this.state.staged.find((item) => item.path === path);
    if (!change) return false;

    this.state.staged = this.state.staged.filter((item) => item.path !== path);
    this.state.unstaged.push(change);
    return true;
  }

  commit(message: string, author = "Local User"): GitCommit | null {
    if (!message.trim() || this.state.staged.length === 0) return null;

    const commit: GitCommit = {
      hash: createHash(),
      message: message.trim(),
      author,
      createdAt: new Date().toISOString(),
      filesChanged: this.state.staged.map((item) => item.path),
    };

    this.state.commits.unshift(commit);
    this.state.staged = [];
    return commit;
  }

  createBranch(name: string): boolean {
    const branch = name.trim();
    if (!branch || this.state.branches.includes(branch)) return false;

    this.state.branches.push(branch);
    return true;
  }

  checkoutBranch(name: string): boolean {
    if (!this.state.branches.includes(name)) return false;
    this.state.currentBranch = name;
    return true;
  }

  reset(): void {
    this.state.staged = [];
    this.state.unstaged = [];
  }
}

export default GitEngine;
