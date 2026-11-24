import {broomProfileInventory} from './broom-mount.mjs';
import {petRecord,restoreHunterPet} from './hunter-pets.mjs';
import { BACKPACK_SLOTS, canonicalItemType, freshCharacter, ITEMS, migrateEquipment, migrateLegacySupplies, refreshVitals } from "./items.mjs";
import { DEFAULT_APPEARANCE } from "./appearance.mjs";
import {migrateSavedStarterChest} from './starter-chest.mjs';
import {restoreFollowerControl} from './follower-control.mjs';
import {knownWeaponCombos} from './weapon-combo-discovery.mjs';

const newerRevision = (...versions) => Math.max(Date.now(), ...versions.map(value => (value || 0) + 1));
export const cleanCharacterName = (name) =>
  String(name || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
const NAME_SUGGESTIONS = [
  "Alder", "Bramble", "Cedar", "Clover", "Cove", "Dawn", "Ember",
  "Fern", "Flint", "Grove", "Juniper", "Lumen", "Marsh", "Meadow",
  "Moss", "Nettle", "Oak", "Pip", "Raven", "Reed", "River", "Sable",
  "Sage", "Scout", "Sol", "Sparrow", "Thistle", "Vale", "Willow",
  "Wren", "Amber Fox", "Bramble Hare", "Cedar Finch", "Clover Jay",
  "Fern Otter", "Moss Badger", "River Heron", "Sage Lynx", "Willow Moth",
];
export function suggestCharacterName(heroes = [], random = Math.random) {
  const used = new Set(
    heroes.map((hero) => cleanCharacterName(hero.name).toLocaleLowerCase()),
  );
  const available = NAME_SUGGESTIONS.filter(
    (name) => !used.has(name.toLocaleLowerCase()),
  );
  if (available.length) return available[Math.floor(random() * available.length)];
  const first = ["Amber", "Cedar", "Fern", "Moss", "River", "Sage", "Willow"];
  const second = ["Bear", "Fox", "Hare", "Heron", "Lynx", "Otter", "Wren"];
  const candidates = first.flatMap((a) => second.map((b) => `${a} ${b}`));
  return candidates.find((name) => !used.has(name.toLocaleLowerCase())) || "New Explorer";
}
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
function validateBackupItems(list, slots, depth = 0) {
  if (!Array.isArray(list) || slots == null || list.length > slots || depth > 8) throw Error("Invalid inventory in character backup.");
  for (const item of list) {
    if (!item) continue;
    const def = ITEMS[canonicalItemType(item.type)];
    if (!def || !Number.isInteger(item.qty) || item.qty < 1) throw Error("Invalid item in character backup.");
    if (item.contents != null) validateBackupItems(item.contents, def.bag?.slots, depth + 1);
  }
}

export function prepareCharacterBackup(raw, current, { restoreStash = false } = {}) {
  if (raw?.version !== 1 || !Array.isArray(raw.heroes) || raw.heroes.length > 200) throw Error("Invalid character backup.");
  const data = structuredClone(current);
  let added = 0;
  for (const hero of structuredClone(raw.heroes)) {
    if (typeof hero?.id !== "string" || !hero.id || typeof hero.name !== "string" || characterNameError(hero.name, []) ||
        !Array.isArray(hero.chests) || hero.chests.length !== 3 || !hero.equipment) throw Error("Invalid character in backup.");
    validateBackupItems(hero.inventory, BACKPACK_SLOTS);
    for (const chest of hero.chests) validateBackupItems(chest, 24);
    if (data.heroes.some(existing => existing.id === hero.id)) continue;
    const name = cleanCharacterName(hero.name);
    hero.name = name;
    for (let suffix = 2; characterNameError(hero.name, data.heroes); suffix++) {
      const tail = " " + suffix;
      hero.name = name.slice(0, 20 - tail.length) + tail;
    }
    migrateEquipment(hero);
    hero.revision = newerRevision();
    data.heroes.push(hero);
    added++;
  }
  const stashRestored = restoreStash && raw.sharedStash != null;
  if (stashRestored) {
    validateBackupItems(raw.sharedStash, Infinity);
    data.sharedStash = structuredClone(raw.sharedStash);
    migrateLegacySupplies(data.sharedStash);
    data.stashRevision = newerRevision(data.stashRevision);
  }
  return { data, added, stashRestored };
}

export class Profiles {
  constructor() {
    this.data = { version: 1, heroes: [], sharedStash: [] };
    this.error = null;
    this.loadError = null;
  }
  async load() {
    try {
      const raw = window.desktop
        ? await window.desktop.loadProfiles()
        : JSON.parse(localStorage.getItem("wildbound-profiles") || "null");
      if (raw != null) {
        if (raw.version !== 1 || !Array.isArray(raw.heroes) ||
            raw.heroes.some(hero => !hero?.id || !Array.isArray(hero.inventory) || !Array.isArray(hero.chests)) ||
            raw.sharedStash != null && !Array.isArray(raw.sharedStash)) throw Error("Invalid character save");
        for (const hero of raw.heroes) migrateEquipment(hero);
        raw.sharedStash ??= [];
        migrateLegacySupplies(raw.sharedStash);
        this.data = raw;
        this.lastSavedSignature = JSON.stringify(raw);
      }
      this.loadError = this.error = null;
    } catch (e) {
      this.loadError = this.error = e.message;
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
  assign(p, h, { preserveStarterChest = false } = {}) {
    if (!preserveStarterChest) migrateSavedStarterChest(h);
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
    p.npcQuests = structuredClone(h.npcQuests || {});
    p.hunterPet=restoreHunterPet(h.hunterPet);
    p.appearance = structuredClone(h.appearance || null);
    p.inventory = structuredClone(h.inventory);
    p.equipment = { ...h.equipment };
    p.equipmentSockets=structuredClone(h.equipmentSockets||{});
    p.chests = structuredClone(h.chests);
    // Starter supplies belong to this selection/session, never a previous user.
    p.starterChest = null;
    p.chestNames = structuredClone(
      h.chestNames || ["Chest 1", "Chest 2", "Chest 3"],
    );
    p.level = h.level || 1;
    p.xp = h.xp || 0;
    p.coins = h.coins || 0;
    p.robotStock = structuredClone(h.robotStock || []);
    p.robotRepaired = h.robotRepaired === true;
    // Already repaired legacy characters have met SCRAP-9; never reset repairs.
    p.robotIntroduced = h.robotIntroduced === true || p.robotRepaired;
    p.vendingStock = structuredClone(h.vendingStock || null);
    p.vendingOrders = structuredClone(h.vendingOrders || []);
    p.nextVendingId = h.nextVendingId || 0;
    migrateEquipment(p);
    refreshVitals(p);
    p.hp = p.maxHp;
  }
  async remove(id) {
    if(!this.data.heroes.some(h=>h.id===id))throw Error('Character no longer exists.');
    const before=structuredClone(this.data);
    this.data.heroes=this.data.heroes.filter(h=>h.id!==id);
    this.data.deletedIds=[...new Set([...(this.data.deletedIds||[]),id])];
    await this.save();
    if(this.error){const error=this.error;this.data=before;throw Error('Could not save deletion: '+error);}
  }
  get revisions() {
    return {
      heroes: Object.fromEntries(this.data.heroes.map(hero => [hero.id, hero.revision || 0])),
      stash: this.data.stashRevision || 0,
    };
  }
  reconcileCheckpoint(g) {
    if (this.loadError) return false;
    const saved = g.profileRevisions || { heroes: {}, stash: -1 };
    let changed = false;
    for (const player of g.players) {
      const hero = this.data.heroes.find(record => record.id === player.profileId);
      if (!hero) continue;
      const checkpointDiscoveries = knownWeaponCombos(player);
      const discoveries = knownWeaponCombos(player, hero);
      if ((hero.revision || 0) <= (saved.heroes?.[hero.id] ?? -1)) {
        if (discoveries.length > checkpointDiscoveries.length) {
          player.field ??= {};
          player.field.weaponCombos = discoveries;
          changed = true;
        }
        continue;
      }
      const { ready, hp, hunterPet, starterChest, inventory, equipment, equipmentSockets } = player;
      this.assign(player, structuredClone(hero), { preserveStarterChest: true });
      if (discoveries.length) player.field.weaponCombos = discoveries;
      player.ready = ready;
      player.hp = Math.min(hp, player.maxHp);
      player.starterChest = [
        ...(starterChest || []).filter(item => item?.starterStock === true),
        ...(structuredClone(hero.starterChest) || []).filter(item => item && item.starterStock !== true),
      ];
      if (!player.starterChest.length && !starterChest && !hero.starterChest) player.starterChest = null;
      if (hunterPet && player.hunterPet?.kind === hunterPet.kind) {
        Object.assign(player.hunterPet, {
          id: hunterPet.id, x: hunterPet.x, y: hunterPet.y,
          room: hunterPet.room, roomX: hunterPet.roomX, roomY: hunterPet.roomY,
        });
      }
      if (player.controlMainLoadout) {
        player.controlMainLoadout = {
          ...player.controlMainLoadout, inventory: player.inventory,
          equipment: player.equipment, equipmentSockets: player.equipmentSockets,
        };
        Object.assign(player, { inventory, equipment, equipmentSockets });
        restoreFollowerControl(g, player);
      }
      if (player.broomMount) {
        const reservation = inventory.find(item => item?.type === 'mounted_broom');
        const broom = JSON.stringify(player.broomMount.item);
        const index = player.inventory.findIndex(item => item && JSON.stringify(item) === broom);
        if (reservation && index >= 0) player.inventory[index] = reservation;
        else {
          delete player.broomMount;
          delete player.broomPet;
          player.jumpVelocity = Math.min(player.jumpVelocity || 0, 0);
        }
      }
      changed = true;
    }
    const stashIsKnown = this.data.stashRevision || this.lastSavedSignature || this.data.sharedStash.length;
    if (stashIsKnown && (this.data.stashRevision || 0) > (saved.stash ?? -1)) {
      g.sharedStash = structuredClone(this.data.sharedStash);
      changed = true;
    }
    const current = this.revisions;
    g.profileRevisions = {
      heroes: Object.fromEntries(g.players.map(player => [
        player.profileId,
        Math.max(current.heroes[player.profileId] || 0, saved.heroes?.[player.profileId] || 0),
      ])),
      stash: Math.max(current.stash, saved.stash || 0),
    };
    return changed;
  }
  capture(g) {
    if (this.loadError || this.importPromise || g.trainTest && !g.trainTest.persistent) return;
    const previous = g.profileRevisions;
    for (const p of g.players) {
      let h = this.data.heroes.find((h) => h.id === p.profileId);
      if (!h) continue; // New local heroes must pass the name dialog first.
      // Older expedition checkpoints can predate discoveries in the profile.
      const discoveries = knownWeaponCombos(p, h);
      if (discoveries.length) {
        p.field ??= {};
        p.field.weaponCombos = discoveries;
      }
      // While a creature is controlled, the shared UI temporarily points the
      // player at that creature's bag and equipment. Persist the saved hero
      // loadout instead, so opening the creature inventory cannot replace the
      // selected character's permanent gear.
      const loadout=p.controlMainLoadout||p;
      const updated = {
        ...h,
        field: structuredClone(p.field || {}),
        name: p.name,
        npcQuests: structuredClone(p.npcQuests || {}),
        hunterPet:petRecord(p.hunterPet),
        appearance: structuredClone(p.appearance || null),
        inventory: broomProfileInventory({...p,inventory:loadout.inventory||[]}),
        equipment: { ...(loadout.equipment||{}) },
        equipmentSockets:structuredClone(loadout.equipmentSockets||{}),
        chests: structuredClone(p.chests),
        // Deposits are returned to this owner's overflow at next selection.
        starterChest: structuredClone(p.starterChest || null),
        starterChestSupplyVersion: 3,
        chestNames: structuredClone(p.chestNames || []),
        level: p.level,
        xp: p.xp,
        coins: p.coins || 0,
        robotStock: structuredClone(p.robotStock || []),
        robotRepaired: p.robotRepaired === true,
        robotIntroduced: p.robotIntroduced === true,
        vendingStock: structuredClone(p.vendingStock || null),
        vendingOrders: structuredClone(p.vendingOrders || []),
        nextVendingId: p.nextVendingId || 0,
      };
      if (JSON.stringify(updated) !== JSON.stringify(h)) {
        updated.revision = newerRevision(h.revision, previous?.heroes?.[h.id]);
        Object.assign(h, updated);
      }
    }
    if (JSON.stringify(this.data.sharedStash) !== JSON.stringify(g.sharedStash)) {
      this.data.sharedStash = structuredClone(g.sharedStash || []);
      this.data.stashRevision = newerRevision(this.data.stashRevision, previous?.stash);
    }
    g.profileRevisions = this.revisions;
    return this.save();
  }
  importBackup(raw, options) {
    if (this.importPromise) throw Error("A character import is already in progress.");
    const task = Promise.resolve().then(async () => {
      await this.savePromise;
      const result = prepareCharacterBackup(raw, this.data, options);
      if (!result.added && !result.stashRestored) return result;
      await this.write(result.data);
      this.data = result.data;
      this.lastSavedSignature = JSON.stringify(result.data);
      this.loadError = this.error = null;
      return result;
    }).finally(() => { this.importPromise = null; });
    this.importPromise = task;
    return task;
  }
  async write(data) {
    if (window.desktop) await window.desktop.saveProfiles(data);
    else localStorage.setItem("wildbound-profiles", JSON.stringify(data));
  }
  async save() {
    if (this.loadError) return;
    if (this.importPromise) return this.importPromise.catch(() => {});
    const signature = JSON.stringify(this.data);
    if (!this.saving && signature === this.lastSavedSignature && !this.error) return;
    this.pendingSave = structuredClone(this.data);
    if (this.saving) return this.savePromise;
    this.saving = true;
    this.savePromise = (async () => {
      while (this.pendingSave) {
        const data = this.pendingSave;
        this.pendingSave = null;
        try {
          await this.write(data);
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
