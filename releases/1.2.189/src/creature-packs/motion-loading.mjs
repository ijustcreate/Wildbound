// Keep a shared request for each donor. Failed imports can be requested again.
export function creatureMotionLoader(loaders) {
  const pending = new Map();
  const ready = new Set();
  function load(kind) {
    if (!Object.hasOwn(loaders, kind) || ready.has(kind)) return null;
    if (!pending.has(kind)) {
      const request = loaders[kind]().then(() => { ready.add(kind); })
        .finally(() => pending.delete(kind));
      pending.set(kind, request);
    }
    return pending.get(kind);
  }
  return { load, all: () => Object.keys(loaders).map(load).filter(Boolean) };
}
