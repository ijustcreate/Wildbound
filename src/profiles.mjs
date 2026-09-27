import { freshCharacter, ITEMS, SLOTS, migrateEquipment } from "./items.mjs";
import { DEFAULT_APPEARANCE } from "./appearance.mjs";
export const cleanCharacterName = (name) =>
  String(name || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
export function characterNameError(name, heroes, exceptId = null) {
  const n = cleanCharacterName(name);
  if (n.length < 2 || n.length > 20)
    return "Use a name between 2 and 20 characters.";
  if (/[\u0000-\u001f\u007f]/.test(n))
    return "Use letters, numbers, spaces or punctuation.";
  if (
    heroes.some(
      (h) =>
        h.id !== exceptId &&
        cleanCharacterName(h.name).toLocaleLowerCase() ===
          n.toLocaleLowerCase(),
    )
  )
    return "That name is already taken. Choose a unique name.";
  return "";
}
export class Profiles {
  constructor() {
    this.data = { version: 1, heroes: [], sharedStash: [] };
    this.error = null;
  }
  async load() {
    try {
      const raw = window.desktop
        ? await window.desktop.loadProfiles()
        : JSON.parse(localStorage.getItem("wildbound-profiles") || "null");
      if (raw?.version === 1 && Array.isArray(raw.heroes)) this.data = raw;
    } catch (e) {
      this.error = e.message;
    }
    return this;
  }
  create(name, appearance = DEFAULT_APPEARANCE) {
    const error = characterNameError(name, this.data.heroes);
    if (error) throw Error(error);
    const h = freshCharacter(crypto.randomUUID(), cleanCharacterName(name));
    if (appearance) h.appearance = structuredClone(appearance);
    this.data.heroes.push(h);
    this.save();
    return h;
  }
  assign(p, h) {
    p.ready = false;
    p.field = structuredClone(
      h.field || {
        favorites: [],
        loadouts: [],
        access: "shared",
        trap: "snare",
        overflow: [],
        cosmetics: {},
        totals: {},
      },
    );
    p.profileId = h.id;
    p.name = h.name;
    p.appearance = structuredClone(h.appearance || null);
    p.inventory = structuredClone(h.inventory);
    p.equipment = { ...h.equipment };
    p.chests = structuredClone(h.chests);
    p.chestNames = structuredClone(
      h.chestNames || ["Chest 1", "Chest 2", "Chest 3"],
    );
    p.level = h.level || 1;
    p.xp = h.xp || 0;
    p.coins = h.coins || 0;
    p.robotStock = structuredClone(h.robotStock || []);
    p.vendingStock = structuredClone(h.vendingStock || null);
    p.vendingOrders = structuredClone(h.vendingOrders || []);
    p.nextVendingId = h.nextVendingId || 0;
    migrateEquipment(p);
  }
  async remove(id) {
    if(!this.data.heroes.some(h=>h.id===id))throw Error('Character no longer exists.');
    const before=structuredClone(this.data);
    this.data.heroes=this.data.heroes.filter(h=>h.id!==id);
    this.data.deletedIds=[...new Set([...(this.data.deletedIds||[]),id])];
    await this.save();
    if(this.error){const error=this.error;this.data=before;throw Error('Could not save deletion: '+error);}
  }
  capture(g) {
    for (const p of g.players) {
      let h = this.data.heroes.find((h) => h.id === p.profileId);
      if (!h) continue; // New local heroes must pass the name dialog first.
      Object.assign(h, {
        field: structuredClone(p.field || {}),
        name: p.name,
        appearance: structuredClone(p.appearance || null),
        inventory: structuredClone(p.inventory),
        equipment: { ...p.equipment },
        chests: structuredClone(p.chests),
        chestNames: structuredClone(p.chestNames || []),
        level: p.level,
        xp: p.xp,
        coins: p.coins || 0,
        robotStock: structuredClone(p.robotStock || []),
        vendingStock: structuredClone(p.vendingStock || null),
        vendingOrders: structuredClone(p.vendingOrders || []),
        nextVendingId: p.nextVendingId || 0,
      });
    }
    this.data.sharedStash = structuredClone(g.sharedStash);
    this.save();
  }
  async save() {
    const signature = JSON.stringify(this.data);
    if (signature === this.lastSavedSignature && !this.error) return;
    this.pendingSave = structuredClone(this.data);
    if (this.saving) return this.savePromise;
    this.saving = true;
    this.savePromise = (async () => {
      while (this.pendingSave) {
        const data = this.pendingSave;
        this.pendingSave = null;
        try {
          if (window.desktop) await window.desktop.saveProfiles(data);
          else localStorage.setItem("wildbound-profiles", JSON.stringify(data));
          this.error = null;
          this.lastSavedSignature = JSON.stringify(data);
        } catch (e) {
          this.error = e.message;
          console.error("Profile save failed", e);
        }
      }
      this.saving = false;
    })();
    return this.savePromise;
  }
}
