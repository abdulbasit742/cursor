export interface BrowserStateStorage {
  getItem(name: string): string | null;
  setItem(name: string, value: string): void;
  removeItem(name: string): void;
}

export function createSessionOnlyStateStorage(
  sessionStorage: BrowserStateStorage,
  localStorage: BrowserStateStorage,
): Readonly<BrowserStateStorage>;
