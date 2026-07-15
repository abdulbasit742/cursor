function assertStorage(storage, label) {
  for (const method of ['getItem', 'setItem', 'removeItem']) {
    if (!storage || typeof storage[method] !== 'function') {
      throw new TypeError(`${label} must implement ${method}`);
    }
  }
}

export function createSessionOnlyStateStorage(sessionStorage, localStorage) {
  assertStorage(sessionStorage, 'sessionStorage');
  assertStorage(localStorage, 'localStorage');
  return Object.freeze({
    getItem(name) {
      localStorage.removeItem(name);
      return sessionStorage.getItem(name);
    },
    setItem(name, value) {
      localStorage.removeItem(name);
      sessionStorage.setItem(name, value);
    },
    removeItem(name) {
      sessionStorage.removeItem(name);
      localStorage.removeItem(name);
    },
  });
}
