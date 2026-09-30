export function snapshot(g) {
  const omit = new Set([
    "random",
    "saving",
    "saveError",
    "controlLabels",
    "uiRevision",
    "fieldRevision",
    "onSound",
    "persist",
    "spriteLibrary",
    "explored",
    "forestLandscape",
  ]);
  return {
    ...Object.fromEntries(
      Object.entries(g).filter(
        ([key, value]) => !omit.has(key) && typeof value !== "function",
      ),
    ),
    explored: [...g.explored],
  };
}
export function cleanInput(input) {
  const out = {};
  const aimX = Number.isFinite(input?.aimX) ? input.aimX : 0;
  const aimY = Number.isFinite(input?.aimY) ? input.aimY : 0;
  const aimLength = Math.max(1, Math.hypot(aimX, aimY));
  for (const [key, v] of Object.entries(input || {})) {
    if (key === 'aimX' || key === 'aimY') out[key] = (key === 'aimX' ? aimX : aimY) / aimLength;
    else if (["x", "y"].includes(key))
      out[key] = Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0;
    else if (
      [
        "attack",
        "summon",
        "dodge",
        "jump",
        "loot",
        "trap",
        "interact",
        "potion",
        "block",
        "inventory",
        "portal",
        "bait",
        "next",
        "prev",
        "up",
        "down",
        "panel",
        "use",
        "store",
        "offhand",
        "salvage",
        "drop",
        "dropOne",
        "split",
        "close",
      ].includes(key)
    )
      out[key] = !!v;
  }
  return out;
}
export class Rooms {
  constructor(onEvent) {
    this.role = null;
    this.inputs = {};
    this.peer = null;
    this.age = 0;
    window.desktop?.onRoom((data) => onEvent(data));
  }
  send(data) {
    window.desktop?.sendRoom(data);
  }
  async host() {
    const result = await window.desktop.hostRoom();
    this.role = "host";
    return result.address;
  }
  async join(address, name) {
    this.role = "client";
    try {
      await window.desktop.joinRoom(address, name);
    } catch (e) {
      this.role = null;
      throw e;
    }
  }
  tick(g, dt, inputs) {
    if (this.role === "host") {
      this.age += dt;
      if (this.age > 0.1) {
        this.send({ type: "state", state: snapshot(g) });
        this.age = 0;
      }
      return { ...inputs, ...this.inputs };
    }
    if (this.role === "client") {
      const local =
        Object.entries(inputs).find(
          ([k, v]) =>
            k.startsWith("pad:") &&
            (v.x || v.y || v.attack || v.interact || v.inventory || v.portal),
        )?.[1] || inputs.keyboard;
      this.send({ type: "input", input: local });
      return {};
    }
    return inputs;
  }
}
