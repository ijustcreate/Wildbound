import {REALM_SPRITES} from './realm-art.mjs';
import {FAUNA_SPRITES} from './realm-life.mjs';
import { rigSubject } from "./rig-subjects.mjs";
import { spriteToRgba, validateSprite } from "./pixels.mjs";
import { ensureFootprint } from "./world.mjs";
import { Animator } from "./animation.mjs";
import {loadHumanoidArt} from './humanoid-hd.mjs';
import {celShadingEnabled} from './cel-shading.mjs';
import {cutoutSurface} from './cutout-art.mjs';
const SPRITE_CACHE_PIXELS=8*1024*1024;
const SPRITE_CACHE_ENTRIES=256;

export class Assets {
  constructor() {
    this.library = {};
    this.cache = new Map();
    this.overrides = {};
  }
  async load() {
    const read = name => fetch(`assets/${name}.json`).then(response=>response.json());
    const [animations,library,parts,animalParts] = await Promise.all([
      read('animations'),read('library'),read('parts'),read('animal-parts'),loadHumanoidArt(),
    ]);
    this.animationBank = animations;
    this.library = Object.assign(library,parts,animalParts);
    this.cache.clear();
    Object.assign(this.library,structuredClone(REALM_SPRITES),structuredClone(FAUNA_SPRITES));
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
    if (this.cache.has(name)) {
      const cached = this.cache.get(name);
      this.cache.delete(name);
      this.cache.set(name,cached);
      return cached;
    }
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
    if(c.width*c.height<=SPRITE_CACHE_PIXELS){
      this.cache.set(name,c);
      let pixels=0;
      for(const image of this.cache.values())pixels+=image.width*image.height;
      while(this.cache.size>SPRITE_CACHE_ENTRIES||pixels>SPRITE_CACHE_PIXELS){
        const [key,image]=this.cache.entries().next().value;
        this.cache.delete(key);
        pixels-=image.width*image.height;
      }
    }
    return c;
  }
  save(name, s) {
    if (!/^[a-zA-Z0-9 _-]{1,60}$/.test(name) || !validateSprite(s))
      throw new Error(
        "Use a name with letters, numbers, spaces, or hyphens (60 characters max).",
      );
    s = ensureFootprint(structuredClone(s), name);
    delete s.nativeShadowPlant;
    delete s.nativeShadowTree;
    delete s.nativeSwampTree; // A painted override must never be replaced by procedural layers.
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
      delete entries[name].nativeShadowPlant;
      delete entries[name].nativeShadowTree;
      delete entries[name].nativeSwampTree;
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
    ctx.imageSmoothingEnabled=celShadingEnabled();
    ctx.drawImage(celShadingEnabled()?cutoutSurface(c):c, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
}
