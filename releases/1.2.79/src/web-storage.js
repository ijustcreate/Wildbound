// New web editions share one namespace; the historical game keeps its original keys.
(() => {
  const storage = window.localStorage;
  const prefix = 'wildbound-current:';
  const keys = () => Array.from({length: storage.length}, (_, i) => storage.key(i)).filter(k => k.startsWith(prefix));
  Object.defineProperty(window, 'localStorage', {configurable: true, value: {
    getItem(key) { return storage.getItem(prefix + key); },
    setItem(key, value) { storage.setItem(prefix + key, value); },
    removeItem(key) { storage.removeItem(prefix + key); },
    clear() { for (const key of keys()) storage.removeItem(key); },
    key(index) { return keys()[index]?.slice(prefix.length) ?? null; },
    get length() { return keys().length; },
  }});
})();
