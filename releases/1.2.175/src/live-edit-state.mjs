const storageKey = 'wildbound-live-edits-v1';
const kinds = ['placement', 'terrain', 'spawn', 'headwear'];
const historyLimit = 80;
const empty = () => ({version: 1, scenes: Object.create(null)});

export function normalizeLiveEdits(data) {
  const edits = empty();
  if (data?.version !== 1 || !data.scenes || typeof data.scenes !== 'object') return edits;
  for (const [scene, content] of Object.entries(data.scenes)) {
    if (!content || typeof content !== 'object') continue;
    const records = {};
    for (const kind of kinds) {
      const entries = content[kind];
      if (!entries || typeof entries !== 'object') continue;
      const valid = Object.entries(entries).filter(([id, value]) => {
        if (!id || value == null) return false;
        if (kind === 'terrain') return typeof value === 'string';
        return typeof value === 'object' && Number.isFinite(value.x) && Number.isFinite(value.y);
      });
      if (valid.length) records[kind] = Object.assign(Object.create(null),Object.fromEntries(valid));
    }
    if (Object.keys(records).length) edits.scenes[scene] = records;
  }
  return edits;
}

export const liveEditScene = game => {
  if (!game) return null;
  const design = game.trainTest?.design;
  if (design?.wildLands) return `wilds:${design.activeRoom || 'outdoors'}`;
  if (design) return `railway:${design.id ?? design.name ?? 'default'}`;
  return `classic:${game.worldId ?? game.seed ?? 0}:${game.generatedEnvironment ?? 'forest'}`;
};

function browserRead(storage) {
  try { return JSON.parse(storage?.getItem(storageKey) || 'null'); }
  catch { return null; }
}

export class LiveEditState {
  constructor({desktop = globalThis.desktop, storage = globalThis.localStorage} = {}) {
    this.desktop = desktop;
    this.storage = storage;
    this.data = empty();
    this.saved = JSON.stringify(this.data);
    this.undo = [];
    this.redo = [];
  }

  async load() {
    const data = this.desktop?.loadLiveEdits ? await this.desktop.loadLiveEdits() : browserRead(this.storage);
    this.data = normalizeLiveEdits(data);
    this.saved = JSON.stringify(this.data);
  }

  get dirty() { return this.saved !== JSON.stringify(this.data); }

  records(scene, kind) { return this.data.scenes[scene]?.[kind]; }

  remember(scene, changes) {
    const entries = changes.filter(change => JSON.stringify(change.before) !== JSON.stringify(change.after));
    if (!entries.length) return false;
    for (const item of entries) item.previous = this.records(scene, item.kind)?.[item.id];
    this.write(scene, entries, false);
    this.undo.push({scene, entries});
    if (this.undo.length > historyLimit) this.undo.shift();
    this.redo.length = 0;
    return true;
  }

  write(scene, entries, reverse) {
    const content = this.data.scenes[scene] ??= {};
    for (const {kind, id, previous, after, record} of entries) {
      const value = reverse ? previous : record ?? after;
      if (value == null) {
        if (content[kind]) delete content[kind][id];
      } else {
        const values = content[kind] ??= Object.create(null);
        values[id] = value;
      }
      if (content[kind] && !Object.keys(content[kind]).length) delete content[kind];
    }
    if (!Object.keys(content).length) delete this.data.scenes[scene];
  }

  step(reverse, apply) {
    const from = reverse ? this.undo : this.redo, to = reverse ? this.redo : this.undo;
    const command = from.at(-1);
    if (!command || !apply(command, reverse)) return false;
    this.write(command.scene, command.entries, reverse);
    from.pop();
    to.push(command);
    return true;
  }

  async save() {
    const snapshot = JSON.stringify(this.data);
    if (this.desktop?.saveLiveEdits) await this.desktop.saveLiveEdits(JSON.parse(snapshot));
    else if (this.storage) this.storage.setItem(storageKey, snapshot);
    else throw Error('Live edit storage is unavailable.');
    this.saved = snapshot;
  }
}
