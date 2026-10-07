import { rigSubject } from "./rig-subjects.mjs";
import { spriteToRgba, validateSprite } from "./pixels.mjs";
import { ensureFootprint } from "./world.mjs";
import { Animator } from "./animation.mjs";
import {loadHumanoidArt} from './humanoid-hd.mjs';
export class Assets {
  constructor() {
    this.library = {};
    this.cache = new Map();
    this.overrides = {};
  }
  async load() {
    await loadHumanoidArt();
    this.animationBank = await (await fetch("assets/animations.json")).json();
    this.library = await (await fetch("assets/library.json")).json();
    Object.assign(
      this.library,
      await (await fetch("assets/parts.json")).json(),
    );
    Object.assign(
      this.library,
      await (await fetch("assets/animal-parts.json")).json(),
    );
    try {
      const saved = JSON.parse(
        localStorage.getItem("wildbound-sprites") || "{}",
      );
      for (const [name, s] of Object.entries(saved))
        if (validateSprite(s)) this.overrides[name] = s;
    } catch {}
    Object.assign(this.library, this.overrides);
    for (const [name, s] of Object.entries(this.library))
      ensureFootprint(s, name);
  }
  canvas(name) {
    if (this.cache.has(name)) return this.cache.get(name);
    const s = this.library[name];
    if (!s) return null;
    const c = document.createElement("canvas");
    c.width = s.width;
    c.height = s.height;
    c.getContext("2d").putImageData(
      new ImageData(spriteToRgba(s), s.width, s.height),
      0,
      0,
    );
    this.cache.set(name, c);
    return c;
  }
  save(name, s) {
    if (!/^[a-zA-Z0-9 _-]{1,60}$/.test(name) || !validateSprite(s))
      throw new Error(
        "Use a name with letters, numbers, spaces, or hyphens (60 characters max).",
      );
    s = ensureFootprint(structuredClone(s), name);
    const next = { ...this.overrides, [name]: structuredClone(s) };
    localStorage.setItem("wildbound-sprites", JSON.stringify(next));
    this.overrides = next;
    this.library[name] = structuredClone(s);
    this.cache.delete(name);
  }
  saveBatch(entries) {
    const next = { ...this.overrides };
    for (const [name, s] of Object.entries(entries)) {
      if (!/^[a-zA-Z0-9 _-]{1,60}$/.test(name) || !validateSprite(s))
        throw new Error("Invalid sprite: " + name);
      entries[name] = ensureFootprint(structuredClone(s), name);
      next[name] = entries[name];
    }
    localStorage.setItem("wildbound-sprites", JSON.stringify(next));
    this.overrides = next;
    Object.assign(this.library, entries);
    this.cache.clear();
  }
  draw(ctx, name, x, y, size = 48, flip = false) {
    if (rigSubject(name)) {
      this.playerAnimator ||= new Animator(this);
      this.playerAnimator.draw(
        ctx,
        {
          sprite: name,
          x,
          y: y + size * 0.35,
          faceX: flip ? -1 : 0,
          faceY: flip ? 0 : 1,
          moving: false,
        },
        0,
        size,
      );
      return;
    }
    const c = this.canvas(name);
    if (!c) return;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(c, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
}
