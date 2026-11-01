const KEY = "wildbound-rig-sprite-overrides";

function read() {
  try {
    const value = JSON.parse(globalThis.localStorage?.getItem(KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function write(value) {
  globalThis.localStorage?.setItem(KEY, JSON.stringify(value));
}

export function saveRigSpriteOverride(subject, id, direction, sprite) {
  const data = read();
  data[subject] ??= {};
  data[subject][id] ??= {};
  data[subject][id][direction] = structuredClone(sprite);
  write(data);
}

export function removeRigSpriteOverride(subject, id, direction) {
  const data = read();
  if (!data[subject]?.[id]) return;
  delete data[subject][id][direction];
  if (!Object.keys(data[subject][id]).length) delete data[subject][id];
  if (!Object.keys(data[subject]).length) delete data[subject];
  write(data);
}

export function applyRigSpriteOverrides(subject, model) {
  const overrides = read()[subject] || {};
  for (const [id, views] of Object.entries(overrides)) {
    for (const [direction, sprite] of Object.entries(views || {})) {
      model.boneSprites ??= {};
      model.boneSprites[id] ??= {};
      model.boneSprites[id][direction] = structuredClone(sprite);
    }
  }
  return model;
}
