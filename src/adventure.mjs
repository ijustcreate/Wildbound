import {wandTipWorld} from './player-motion.mjs';
import {templeRoomStep} from './temple.mjs';
import {interactIce} from './ice-world.mjs';
import {clearShot} from './navigation.mjs';
import {resolveEnvironment,toggleDoor} from './expansion.mjs';
import {
  initializeField,
  protectedItem,
  storageCapacity,
  canAccess,
  record,
} from "./field-systems.mjs";
import { ROOM_STATIONS } from "./shops.mjs";
import { clearSlot } from "./items.mjs";
import {
  roomBlocked,
  purchaseVending,
  collectVending,
  useStamina,
  vendingStock,
} from "./shops.mjs";
import { initHazards, ignite } from "./hazards.mjs";
import { lootSpot } from "./item-art.mjs";
import { rules, creatures } from "./definitions.mjs";
import { generateWorld } from "./world.mjs";
import {
  ITEMS,
  moveInventoryItem,
  splitStack,
  sellStack,
  SLOTS,
  count,
  canGive,
  give,
  take,
  equip,
  unequip,
  transfer,
  stat,
  freshCharacter,
  itemKind,
  rollGear,
  rollRelic,
} from "./items.mjs";
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const VISION = 280;
export function initAdventure(g) {
  initHazards(g);
  g.portals = [];
  g.arrows = [];
  g.spells = [];
  g.baits = [];
  g.loot = [];
  g.xpOrbs = [];
  g.sharedStash = [];
  g.explored = new Set();
  g.persist = () => {};
}
export function initHero(p) {
  const c = freshCharacter("hero-" + Date.now() + "-" + p.id, p.name);
  Object.assign(p, {
    profileId: c.id,
    inventory: [
      { type: "trap", qty: Math.max(0, Math.floor(rules.startingTraps)) },
    ],
    equipment: c.equipment,
    chests: c.chests,
    chestNames: c.chestNames,
    level: 1,
    xp: 0,
    charge: 0,
    coins: 0,
    mana: 100,
    maxMana: 100,
    ui: null,
    room: null,
  });
  delete p.traps;
  Object.defineProperty(p, "traps", {
    enumerable: true,
    get() {
      return count(this, "trap");
    },
    set(v) {
      const n = count(this, "trap");
      if (v < n) take(this.inventory, "trap", n - v);
      else give(this.inventory, "trap", v - n);
    },
  });
}
export function canSee(g, a) {
  return g.players.some(
    (p) =>
      !p.room &&
      p.hp > 0 &&
      dist(p, a) <
        rules.visionRadius * (g.weather?.type === "monsoon" ? 0.8 : 1),
  );
}
export const adventureMethods = {
  configureCreature(e, refresh = true) {
    const c = creatures[e.kind];
    if (!c) return;
    if (c.edited) {
      e.speed = c.stats.speed;
      e.damage = c.stats.damage;
      e.maxHp = c.stats.hp;
      if (refresh) e.hp = Math.min(e.hp, e.maxHp);
      else e.hp = e.maxHp;
    }
    e.faction = c.faction;
  },
  beginSeal(p) {
    if (
      this.phase !== "play" ||
      p.progress < 48 ||
      p.room ||
      dist(p, { x: 800, y: 800 }) > 215
    )
      return false;
    this.phase = "sealing";
    this.sealTime = 0;
    this.roll = null;
    this.message(p.name + " calls WILDBOUND!");
    this.onSound("win");
    return true;
  },
  completeVictory() {
    if (this.phase === "won") return;
    initHazards(this);
    this.debrief = this.players.map((p) => ({
      name: p.name,
      ...initializeField(p).totals,
      explored: this.explored.size,
    }));
    this.phase = "won";
    this.scenery = [];
    this.enemies = [];
    this.arrows = [];
    this.traps = [];
    this.baits = [];
    // Dropped items belong to the party; sealing removes the jungle, not loot.
    this.pickups = [];
    this.spells = [];
    this.eventTime = 0;
    this.event = null;
    this.reveal = null;
    this.victoryChest = true;
    // The end-game chest is a concise reward for finishing the expedition:
    // a few rare finds and one guaranteed legendary, rather than every drop.
    const rareRewards = Array.from({ length: 3 }, () => ({
      type: rollGear(this.random, "rare"),
      qty: 1,
    }));
    this.victoryRewards = [
      ...rareRewards,
      { type: rollGear(this.random, "legendary"), qty: 1 },
    ];
    this.loot = [];
    for (const p of this.players) {
      p.hp = p.maxHp;
      p.sealHold = 0;
    }
    this.message(
      "WILDBOUND! The jungle sleeps. Interact at the table for the shared reward chest. Strike the board to begin again.",
    );
    this.persist();
  },
  newExpedition() {
    this.footprints = [];
    this.environmentParticles = [];
    initHazards(this);
    this.seed += 1 + Math.floor(this.random() * 100000);
    const env =
      resolveEnvironment(this.environment,this.seed);
    Object.assign(this, generateWorld(this.seed, env));
    this.generatedEnvironment = env;
    this.phase = "play";
    this.bloom = 0;
    this.round = 1;
    this.turnOrder = [];
    this.openingBoard = true;
    this.reveal = null;
    this.turn = 0;
    this.roll = null;
    this.deck = [];
    this.objective = null;
    this.locked = false;
    this.explored = new Set();
    this.victoryChest = (this.victoryRewards || []).some(Boolean);
    this.victoryShown = false;
    for (const [i, p] of this.players.entries()) {
      const a = -Math.PI / 2 + (i * Math.PI) / 3;
      p.x = 800 + Math.cos(a) * 116;
      p.y = 789 + Math.sin(a) * 68;
      p.faceX = -Math.cos(a);
      p.faceY = -Math.sin(a);
      const f = initializeField(p);
      f.boon = null;
      f.boonReady = false;
      f.choice = false;
      f.curse = false;
      f.totals = {};
      p.progress = 0;
      p.boardProgress = 0;
      p.rolls = 0;
      p.ui = null;
      if (this.blocked(p.x, p.y)) {
        p.x = 800 + Math.cos(p.id) * 185;
        p.y = 800 + Math.sin(p.id) * 130;
      }
    }
    this.message(
      env === "desert"
        ? "The board exhales heat into a new desert. Watch for quicksand."
        : env==='ice'?'Snow settles around the board. Pale hunters stalk the ice.':env==='house'?'The board wakes inside the house. Use Interact at doors; creatures arrive in the yard.':"The board breathes color into a new jungle.",
    );
    this.persist();
  },
  usePotion(p) {
    if (p.hp <= 0 || p.hp >= p.maxHp || !take(p.inventory, "potion"))
      return false;
    p.hp = Math.min(p.maxHp, p.hp + rules.potionHeal);
    this.onSound("heal");
    this.persist();
    return true;
  },
  dropLoot(x, y, type, qty = 1, source = "Ground loot", manualPickup = false) {
    this.onSound("drop",{x,y});
    const position = lootSpot(this, x, y);
    this.loot.push({
      id: this.nextId++,
      ...position,
      type,
      qty,
      source,
      manualPickup,
    });
  },
  dropXP(x, y, amount = 10) {
    const position = lootSpot(this, x, y);
    const nearby = this.xpOrbs.find((o) => dist(o, position) < 18);
    if (nearby) {
      nearby.amount += amount;
      return;
    }
    this.xpOrbs.push({
      id: this.nextId++,
      ...position,
      amount,
      readyAt: this.time + 0.35,
    });
  },
  collectXP(p, orb) {
    if (
      p.hp <= 0 ||
      p.room ||
      !this.xpOrbs.includes(orb) ||
      dist(p, orb) > 24 ||
      this.time < orb.readyAt
    )
      return false;
    this.xpOrbs = this.xpOrbs.filter((o) => o !== orb);
    // Preserve co-op progression: gathering an orb shares its XP with the party.
    for (const hero of this.players) {
      hero.xp += orb.amount;
      while (hero.xp >= hero.level * 50) {
        hero.xp -= hero.level * 50;
        hero.level++;
        this.message(hero.name + " reached level " + hero.level);
      }
    }
    this.effects.push({
      x: p.x,
      y: p.y - 25,
      text: "+" + orb.amount + " XP",
      color: "#a3eafa",
      life: 0.8,
    });
    if (this.time >= (this.xpSoundAt || 0)) {
      this.onSound("heal");
      this.xpSoundAt = this.time + 0.15;
    }
    this.persist();
    return true;
  },
  nearbyLoot(p) {
    return this.loot
      .filter((l) => dist(p, l) < 65)
      .sort((a, b) => dist(a, p) - dist(b, p))[0];
  },
  inventoryFullNotice(p, key = "pickup") {
    if (this.time < (p.inventoryFullNoticeUntil || 0)) return;
    p.inventoryFullNoticeUntil = this.time + 1.5;
    p.inventoryFullNoticeKey = key;
    this.message("Inventory full.");
  },
  collect(p, l, quick = false) {
    if (!l || !this.loot.includes(l) || dist(p, l) > 65 + stat(p, "magnet"))
      return false;
    if (!give(p.inventory, l.type, l.qty)) {
      this.inventoryFullNotice(p, l.id ?? l.type);
      return false;
    }
    record(p, "lootRecovered", l.qty);
    p.inventoryFullNoticeUntil = 0;
    if (quick && ITEMS[l.type].slot)
      equip(
        p,
        p.inventory.findIndex((i) => i?.type === l.type),
      );
    this.onSound("loot",p);
    this.loot = this.loot.filter((i) => i !== l);
    this.persist();
    return true;
  },
  portal(p) {
    this.onSound("portal",p);
    if (p.hp <= 0) return;
    if (p.room) {
      this.leaveRoom(p);
      return;
    }
    let door = this.portals.find((d) => !d.temple && d.owner === p.id);
    // A nearby private portal is already the shared entry for this storage room.
    // Reuse it instead of spawning a second portal on top of the first one.
    const nearby = this.portals.find(
      (d) => !d.temple && d.owner !== p.id && dist(p, d) <= 70,
    );
    if (!door && nearby) {
      if (dist(p, nearby) <= 26) this.enterRoom(p, nearby);
      else this.message("A storage portal is already open nearby.");
      this.persist();
      return;
    }
    if (!door) {
      const angle = Math.atan2(p.faceY || 0, p.faceX || 1);
      let spot;
      for (let n = 0; n < 16; n++) {
        const a = angle + (n * Math.PI) / 8;
        const candidate = {
          x: p.x + Math.cos(a) * 56,
          y: p.y + Math.sin(a) * 56,
        };
        if (
          [0.5, 0.75, 1].every(
            (t) =>
              !this.blocked(
                p.x + (candidate.x - p.x) * t,
                p.y + (candidate.y - p.y) * t,
                18,
              ),
          )
        ) {
          spot = candidate;
          break;
        }
      }
      if (!spot) {
        this.message("Move into an open space to summon your portal.");
        return;
      }
      const { x, y } = spot;
      door = {
        id: this.nextId++,
        owner: p.id,
        color: p.color,
        x,
        y,
        closing: null,
        entered: false,
        entryReady: this.players
          .filter((q) => dist(q, { x, y }) > 34)
          .map((q) => q.id),
      };
      this.portals.push(door);
      this.message(
        p.name +
          " opened a private storeroom. Walk into the portal beside you to enter.",
      );
    }
    this.persist();
  },
  enterRoom(p, door) {
    if (p.hp <= 0 || p.room || dist(p, door) > 26) return false;
    p.room = door.id;
    p.roomX = 160;
    p.roomY = 158;
    p.roomMoving = false;
    p.roomStep = 0;
    p.charge = 0;
    p.ui = null;
    if (p.id === door.owner) {
      door.closing = null;
      door.entered = true;
    }
    this.persist();
    return true;
  },
  leaveRoom(p, forced = false) {
    const d = this.portals.find((d) => d.id === p.room);
    if (!d) return;
    p.room = null;
    p.ui = null;
    p.x = d.x;
    p.y = d.y;
    d.entryReady = (d.entryReady || []).filter((id) => id !== p.id);
    if (forced) {
      p.hp = Math.max(0, p.hp - p.maxHp * rules.portalDamage);
      this.message(p.name + " was expelled: −" + p.maxHp / 2 + " HP.");
    } else p.invuln = Math.max(p.invuln, 0.5);
    if (!d.temple && p.id === d.owner) d.closing = rules.portalGrace;
    if (!d.temple && !this.players.some((q) => q.room === d.id))
      this.portals = this.portals.filter((q) => q !== d);
    this.persist();
  },
  openInventory(p, storage = null) {
    this.onSound("inventory",p);
    p.ui = { panel: "pack", index: 0, slot: 0, storage, hold: 0 };
    p.charge = 0;
  },
  storageFor(p) {
    if(p.ui?.storage==="temple")return this.templeChest;
    if (p.ui?.storage === "victory") return this.victoryRewards;
    if (p.ui?.storage === "shared") return this.sharedStash;
    if (Number.isInteger(p.ui?.storage)) {
      const d = this.portals.find((d) => d.id === p.room),
        owner = this.players.find((q) => q.id === d?.owner);
      return owner?.chests[p.ui.storage];
    }
    return null;
  },
  moveInventoryItem(p, from, to) {
    if (!p.ui || p.ui.shop) return false;
    if (
      (from.mode === "chest" && !canAccess(this, p, true)) ||
      (to.mode === "chest" && !canAccess(this, p, false))
    )
      return false;
    const movingType =
      from.mode === "pack" ? p.inventory[from.index]?.type : null;
    if (movingType && protectedItem(p, movingType) && to.mode === "chest")
      return false;
    const ok = moveInventoryItem(
      p,
      this.storageFor(p),
      from,
      to,
      storageCapacity(this, p, this.storageFor(p)),
    );
    p.ui.notice = ok
      ? "Item moved."
      : "That item cannot go there, or there is not enough room.";
    if (ok) {this.onSound("loot",p);this.persist();}
    return ok;
  },
  inventoryAction(p, action) {
    if (typeof action !== "string") return;
    const u = p.ui;
    if (!u) return;
    const storage = this.storageFor(p);
    const selected = p.inventory[u.index];
    if (
      protectedItem(p, selected?.type) &&
      u.panel === "pack" &&
      ["store", "drop", "dropOne", ...(storage ? ["use"] : [])].includes(action)
    ) {
      u.notice = "Unlock this item in Field Kit first.";
      return;
    }
    if (
      storage &&
      ((u.panel === "chest" && !canAccess(this, p, true)) ||
        (u.panel === "pack" && !canAccess(this, p, false))) &&
      ["use", "store", "split", "offhand"].some((a) => action.startsWith(a))
    ) {
      u.notice = "This chest does not allow that action.";
      return;
    }
    if (action.startsWith("rename:")) {
      const owner = this.shopOwner(p),
        index = u.storage;
      if (
        owner?.id !== p.id ||
        !Number.isInteger(index) ||
        index < 0 ||
        index > 2
      )
        return;
      const name = action
        .slice(7)
        .replace(/[\x00-\x1f\x7f]/g, "")
        .trim()
        .slice(0, 24);
      if (!name) {
        u.notice = "Enter a chest name.";
        return;
      }
      owner.chestNames ||= [];
      owner.chestNames[index] = name;
      this.persist();
      return;
    }
    if (action === "split" || action.startsWith("split:")) {
      const list =
        u.panel === "chest" ? storage : u.panel === "pack" ? p.inventory : null;
      const splitTarget = list ? list.findIndex((i) => !i) : -1;
      const splitIndex = splitTarget >= 0 ? splitTarget : list?.length;
      if (list) {
        u.notice = splitStack(
          list,
          u.index,
          action.includes(":") ? Number(action.split(":")[1]) : undefined,
          storageCapacity(this, p, list),
        )
          ? "Stack split. Select the new stack to drop or transfer it."
          : "Needs a free slot and at least two items.";
      }
      if (list && u.notice.startsWith("Stack split")) u.index = splitIndex;
      this.persist();
      return;
    }
    if (
      u.shop === "vending" &&
      ["use", "collect", "offhand"].includes(action)
    ) {
      if (action === "collect" || action === "offhand") this.collectVending(p);
      else this.purchaseVending(p, u.index % 12);
      return;
    }
    if (u.shop && action === "use") {
      u.notice =
        u.shop === "robot"
          ? sellStack(p, u.index, (this.shopOwner(p).robotStock ||= []))
            ? "Sold for gold."
            : "Select an item to sell."
          : "Choose a vending slot to purchase.";
      this.persist();
      return;
    }
    const switchPanel = (next) => {
      if (u.shop && next !== "pack") return;
      if (next === "chest" && !storage) return;
      u.selections ||= {};
      u.selections[u.panel] = u.index;
      u.panel = next;
      u.index = u.selections[next] || 0;
      u.notice = "";
    };
    const moveItem = () => {
      const from = u.panel === "chest" ? storage : p.inventory,
        to = u.panel === "chest" ? p.inventory : storage;
      if (!from || !to || !from[u.index]) return;
      const name = ITEMS[from[u.index].type]?.name || "Item";
      if (transfer(from, to, u.index, storageCapacity(this, p, to))) {
        u.notice = name + (u.panel === "chest" ? " taken." : " stored.");
        u.index = Math.max(0, Math.min(u.index, from.length - 1));
      } else
        u.notice =
          (u.panel === "chest" ? "Backpack" : "Chest") +
          " is full. Make space first.";
    };
    if (action === "closeStorage") {
      u.storage = null;
      switchPanel("pack");
      this.persist();
      return;
    }
    if (action.startsWith("select:"))
      u.index = Math.max(
        0,
        Math.min(
          u.panel === "chest" ? Math.max(23, storage.length - 1) : 23,
          Number(action.slice(7)) || 0,
        ),
      );
    if (
      action.startsWith("panel:") &&
      ["pack", "gear", "chest"].includes(action.slice(6))
    ) {
      switchPanel(action.slice(6));
    }
    if (action === "close") {
      p.ui = null;
      return;
    }
    if (action === "panel") {
      const panels = storage ? ["pack", "gear", "chest"] : ["pack", "gear"];
      switchPanel(panels[(panels.indexOf(u.panel) + 1) % panels.length]);
    }
    const limit =
        u.shop === "vending"
          ? 12
          : u.panel === "gear"
            ? SLOTS.length
            : u.panel === "chest"
              ? Math.max(24, Math.ceil(storage.length / 24) * 24)
              : 24,
      stride = u.shop === "vending" || u.panel === "gear" ? 3 : 6;
    if(u.panel==='gear'&&['next','prev','down','up'].includes(action)){
      const order=['head','cape','neck','chest','shoulders','gloves','hand1','hand2','pants','feet'];
      const i=order.indexOf(SLOTS[u.index]),step=action==='next'?1:action==='prev'?-1:action==='down'?2:-2;
      u.index=SLOTS.indexOf(order[(i+step+10)%10]);
    }else{
      if (action === "next") u.index = (u.index + 1) % limit;
      if (action === "prev") u.index = (u.index + limit - 1) % limit;
      if (action === "down") u.index = (u.index + stride) % limit;
      if (action === "up") u.index = (u.index + limit - stride) % limit;
    }
    if (action === "use" || action === "equip") {
      if (u.panel === "gear") unequip(p, SLOTS[u.index % SLOTS.length]);
      else if (storage && action === "use") moveItem();
      else {
        const item = p.inventory[u.index];
        if (item?.type === "stamina_potion") useStamina(p);
        else if (item?.type === "potion") this.usePotion(p);
        else if (item?.type === "trap" && !p.room) this.trap(p);
        else equip(p, u.index);
      }
    }
    if (action === "offhand" && u.panel === "chest")
      this.inventoryAction(p, "split");
    if (action === "offhand" && u.panel === "pack") {
      if (p.inventory[u.index]?.qty > 1) this.inventoryAction(p, "split");
      else equip(p, u.index, "hand2");
    }
    if (action === "store" && storage && ["pack", "chest"].includes(u.panel))
      moveItem();
    if (
      (action === "drop" ||
        action === "dropOne" ||
        (action === "store" && !storage && !u.shop)) &&
      u.panel === "pack" &&
      !p.room
    ) {
      const item = p.inventory[u.index];
      if (item) {
        this.dropLoot(
          p.x,
          p.y,
          item.type,
          action === "dropOne" ? 1 : item.qty,
          p.name + " dropped",
          true,
        );
        if (action === "dropOne" && item.qty > 1) item.qty--;
        else clearSlot(p.inventory, u.index);
      }
    }
    this.persist();
  },
  tickAdventure(dt, inputs) {
    for (const d of [...this.portals])
      if (d.closing !== null) {
        d.closing -= dt;
        if (d.closing <= 0) {
          for (const p of this.players.filter((p) => p.room === d.id))
            this.leaveRoom(p, true);
          this.portals = this.portals.filter((q) => q !== d);
        }
      }
    for (const p of this.players) {
      const i = inputs[p.device] || {},
        old = p.previousInput || {},
        edge = (k) => !!i[k] && !old[k];
      p.staminaBoost = Math.max(0, (p.staminaBoost || 0) - dt);
      for (const order of p.vendingOrders || []) {
        if (!order.ready) {
          order.elapsed += dt;
          if (order.elapsed >= 1.6) {
            order.ready = true;
            this.persist();
          }
        }
      }
      p.maxMana ||= 100;
      p.mana = Math.min(
        p.maxMana,
        (p.mana ?? p.maxMana) + (p.hp > 0 ? dt * 8 : 0),
      );
      if (!p.room && !p.ui && p.hp > 0) {
        for (const door of this.portals) {
          door.entryReady ||= [];
          if (dist(p, door) > 34 && !door.entryReady.includes(p.id))
            door.entryReady.push(p.id);
          if (dist(p, door) <= 26 && door.entryReady.includes(p.id)) {
            this.enterRoom(p, door);
            break;
          }
        }
      }
      p.consumeInput = !!p.ui || !!p.room;
      if (p.hp <= 0 || p.stun > 0) {
        p.charge = 0;
        p.previousInput = { ...i };
        continue;
      }
      if (edge("portal") && !p.ui) this.portal(p);
      if (edge("inventory")) {
        if (p.ui) p.ui = null;
        else this.openInventory(p);
      }
      if (p.ui) {
        p.consumeInput = true;
        p.charge = 0;
        p.interactTime = 0;
        p.interactUsed = false;
        for (const a of [
          "next",
          "prev",
          "down",
          "up",
          "panel",
          "use",
          "offhand",
          "store",
          "drop",
          "split",
          "close",
        ])
          if (edge(a)) this.inventoryAction(p, a);
        const direction = ["next", "prev", "down", "up"].find((k) => i[k]);
        p.menuRepeat = direction ? (p.menuRepeat || 0) + dt : 0;
        if (direction && p.menuRepeat > 0.35) {
          this.inventoryAction(p, direction);
          p.menuRepeat = 0.24;
        }
      } else if (p.room) {
        if(templeRoomStep(this,p,i,dt)){p.previousInput={...i};continue;}
        const beforeX = p.roomX,
          beforeY = p.roomY;
        const nx = Math.max(25, Math.min(295, p.roomX + (i.x || 0) * 90 * dt)),
          ny = Math.max(45, Math.min(218, p.roomY + (i.y || 0) * 90 * dt));
        if (!roomBlocked(nx, p.roomY)) p.roomX = nx;
        if (!roomBlocked(p.roomX, ny)) p.roomY = ny;
        const dx = p.roomX - beforeX,
          dy = p.roomY - beforeY;
        const distance = Math.hypot(dx, dy);
        p.roomMoving = distance > 0.001;
        p.roomStep = (p.roomStep || 0) + distance * 0.13;
        if (p.roomMoving) {
          p.faceX = dx / distance;
          p.faceY = dy / distance;
        }
        if (Math.hypot(p.roomX - 160, p.roomY - 214) < 18) {
          this.leaveRoom(p);
          continue;
        }
        if (edge("interact")) {
          if (p.roomY > 192 && Math.abs(p.roomX - 160) < 40) this.leaveRoom(p);
          else if (
            Math.hypot(
              p.roomX - ROOM_STATIONS.robot.x,
              p.roomY - ROOM_STATIONS.robot.y,
            ) < 35
          )
            this.openShop(p, "robot");
          else if (Math.hypot(p.roomX - 255, p.roomY - 158) < 35)
            this.openShop(p, "vending");
          else {
            const n = [60, 160, 260].findIndex(
              (x) => Math.hypot(x - p.roomX, 80 - p.roomY) < 50,
            );
            if (n >= 0) this.openInventory(p, n);
          }
        }
      } else if (!p.consumeInput) {
        if (edge("interact"))p.interactAnimation=.35;
        if (edge("potion")) this.usePotion(p);
        p.blocking = !!i.block && itemKind(p.equipment.hand2) === "shield";
        if (
          edge("bait") &&
          (take(p.inventory, "meat") || take(p.inventory, "fruit"))
        ) {
          this.baits.push({
            x: p.x + p.faceX * 90,
            y: p.y + p.faceY * 90,
            life: 8,
          });
          this.persist();
        }
        if (
          this.phase === "play" &&
          p.progress >= 48 &&
          dist(p, { x: 800, y: 800 }) < 215 &&
          i.interact &&
          !this.nearbyLoot(p)
        ) {
          p.sealHold = (p.sealHold || 0) + dt;
          if (p.sealHold >= rules.sealHold) this.beginSeal(p);
        } else p.sealHold = 0;
        if (i.attack)
          p.charge = Math.min(1.2, (p.charge || 0) + dt);
        if (!i.attack && old.attack && p.charge) {
          this.attack(p, p.charge);
          p.charge = 0;
        }
        const l = this.nearbyLoot(p);
        if (edge("loot") && l) this.collect(p, l);
        if (i.interact) {
          p.interactTime = (p.interactTime || 0) + dt;
          if (p.interactTime >= 0.55 && !p.interactUsed && l) {
            this.collect(p, l, true);
            p.interactUsed = true;
          }
        } else {
          if (old.interact && p.interactTime > 0 && p.interactTime < 0.35 && !p.interactUsed && !p.sealHold) {
            const d = this.portals.find((d) => dist(p, d) < 65);
            if (toggleDoor(this,p)||interactIce(this,p)) {}
            else if (l) this.collect(p, l);
            else if (this.victoryChest && dist(p, { x: 800, y: 914 }) < 60)
              this.openInventory(p, "victory");
            else if (dist(p, { x: 800, y: 800 }) < 130)
              this.message("The board has no storage chest. Visit a portal or use the Field Kit for storage.");
          }
          p.interactTime = 0;
          p.interactUsed = false;
        }
        for (const orb of [...this.xpOrbs]) this.collectXP(p, orb);
        for (const l of [...this.loot])
          if (
            !l.manualPickup &&
            l.type !== "potion" &&
            l.type !== "stamina_potion" &&
            ITEMS[l.type].stack &&
            dist(p, l) < 25 + stat(p, "magnet")
          ) {
            if (canGive(p.inventory, l.type, l.qty)) this.collect(p, l);
            else this.inventoryFullNotice(p, l.id ?? l.type);
          }
        const sight =
          rules.visionRadius * (this.weather?.type === "monsoon" ? 0.8 : 1);
        for (
          let y = Math.max(0, Math.floor((p.y - sight) / 32));
          y < Math.min(50, (p.y + sight) / 32);
          y++
        )
          for (
            let x = Math.max(0, Math.floor((p.x - sight) / 32));
            x < Math.min(50, (p.x + sight) / 32);
            x++
          )
            if (Math.hypot(x * 32 + 16 - p.x, y * 32 + 16 - p.y) < sight)
              this.explored.add(y * 50 + x);
      }
      p.previousInput = { ...i };
      if (p.consumeInput) {
        p.charge = 0;
        p.previousInput.attack = false;
        p.previousInput.interact = false;
      }
    }
    this.spells ||= [];
    for (const bolt of this.spells) {
      bolt.age=(bolt.age||0)+dt;
      bolt.life -= dt;
      const steps = Math.max(1, Math.ceil((260 * dt) / 4));
      for (let n = 0; n < steps && bolt.life > 0; n++) {
        bolt.remaining ??= 224;
        const speed = Math.hypot(bolt.vx, bolt.vy) || 260,
          distance = Math.min((speed * dt) / steps, bolt.remaining);
        bolt.x += (bolt.vx / speed) * distance;
        bolt.y += (bolt.vy / speed) * distance;
        bolt.remaining -= distance;
        if(this.projectileBlocked(bolt.x,bolt.y,(bolt.size||6)/2)){bolt.life=0;break;}
        const target = [...this.enemies,...(this.pvp?this.players.filter(p=>p.id!==bolt.owner&&!p.room):[])].find(
          (e) => e.hp > 0 && dist(e, bolt) < 16 + (bolt.size || 6) / 2 && clearShot(this,bolt,e),
        );
        if (target) {
          if(this.players.includes(target))this.hurt(target,bolt.damage,bolt);else {target.hp-=bolt.damage;target.killedBy=bolt.owner;target.ritualKill=false;}
          target.flash = 0.2;
          target.aggro = true;
          if (bolt.fire) ignite(target, 2, bolt.burnDamage || 3);
          bolt.life = 0;
        } else if (this.projectileBlocked(bolt.x, bolt.y, (bolt.size || 6) / 2))
          bolt.life = 0;
        if (bolt.remaining <= 0) bolt.life = 0;
      }
    }
    this.spells = this.spells.filter((b) => b.life > 0);
    for (const b of this.baits) b.life -= dt;
    this.baits = this.baits.filter((b) => b.life > 0);
    for (const a of this.arrows) {
      if (a.stuck) {
        if (a.enemy) {
          const e = this.enemies.find((e) => e.id === a.enemy);
          if (e) {
            a.x = e.x;
            a.y = e.y;
          }
        }
        continue;
      }
      // Substeps prevent a fast arrow skipping a narrow trunk or target.
      const steps = Math.ceil((Math.hypot(a.vx, a.vy) * dt) / 5) || 1;
      for (let n = 0; n < steps && !a.stuck; n++) {
        const s = dt / steps;
        const previousX=a.x,previousY=a.y;
        a.x += a.vx * s;
        a.y += a.vy * s;
        a.z += a.vz * s;
        a.vz -= rules.arrowGravity * s;
        if(this.projectileBlocked(a.x,a.y,1)){a.x=previousX;a.y=previousY;a.stuck=true;a.remove=true;this.dropLoot(a.x,a.y,'arrow');break;}
        const target = a.hostile
          ? this.players.find((p) => !p.room && p.hp > 0 && dist(p, a) < 16 && clearShot(this,a,p))
          : [...this.enemies,...(this.pvp?this.players.filter(p=>p.id!==a.owner&&!p.room):[])].find((e) => e.hp > 0 && dist(e, a) < 19 && clearShot(this,a,e));
        if (target && a.z < 38) {
          this.onSound("hit",a);
          if (a.hostile || this.players.includes(target)) {
            if (this.shieldBlocks(target, a)) {
              this.onSound("shield",target);
              give(target.inventory, "arrow");
              a.remove = true;
            } else {
              this.hurt(target, a.damage, a);
              this.dropLoot(a.x, a.y, "arrow");
              a.remove = true;
            }
          } else {
            target.aggro = true;
            target.hp -= a.damage;target.killedBy=a.owner;target.ritualKill=false;
            target.flash = 0.2;
            a.enemy = target.id;
          }
          a.stuck = true;
        } else if (
          a.z <= 0 ||
          a.x < 10 ||
          a.y < 10 ||
          a.x > 1590 ||
          a.y > 1590 ||
          this.projectileBlocked(a.x, a.y, 1)
        ) {
          a.stuck = true;
          a.z = 0;
          this.dropLoot(a.x, a.y, "arrow");
          a.remove = true;
        }
      }
    }
    this.arrows = this.arrows.filter((a) => !a.remove);
  },
  shieldBlocks(p, source) {
    if (!source || !p.blocking) return false;
    const d = dist(p, source) || 1;
    return ((source.x - p.x) * p.faceX + (source.y - p.y) * p.faceY) / d > 0.25;
  },
  shopOwner(p) {
    const door = this.portals.find((d) => d.id === p.room);
    return this.players.find((q) => q.id === door?.owner);
  },
  purchaseVending(p, index) {
    const owner = this.shopOwner(p);
    if (!owner || p.ui?.shop !== "vending") return false;
    p.ui.notice = purchaseVending(p, owner, index);
    this.persist();
    return true;
  },
  collectVending(p, id) {
    const owner = this.shopOwner(p);
    if (!owner) return false;
    const order = (p.vendingOrders || []).find(
      (o) =>
        o.owner === (owner.profileId || owner.id) &&
        o.ready &&
        (id === undefined || o.id === id),
    );
    const ok = order && collectVending(p, order.id);
    if (p.ui)
      p.ui.notice = ok
        ? "Collected."
        : order
          ? "Backpack full — your purchase stays in the tray."
          : "Your item is still dispensing.";
    if (ok) this.persist();
    return !!ok;
  },
  openShop(p, shop) {
    if (!p.room || !["robot", "vending"].includes(shop)) return false;
    this.openInventory(p);
    p.ui.shop = shop;
    const owner = this.shopOwner(p);
    owner.robotStock ||= [];
    owner.vendingStock ||= vendingStock();
    p.vendingOrders ||= [];
    return true;
  },
  fireSpell(p, charge = 0, slot = "hand1") {
    const def = ITEMS[p.equipment[slot]];
    if (!def?.magic || (p.mana ?? 100) < def.manaCost) return false;
    this.onSound("magic",p);
    p.mana = (p.mana ?? 100) - def.manaCost;
    this.spells ||= [];
    const strength = Math.max(0, Math.min(1, charge / 1.2));
    const tip=wandTipWorld(p,slot,this.time);
    this.spells.push({
      owner:p.id,slot,age:0,
      x: tip.x,
      y: tip.y+16,
      vx: p.faceX * 260,
      vy: p.faceY * 260,
      life: 3,
      remaining: 224,
      size: 6 + Math.round(strength * 8),
      damage: Math.round(def.damage * (1 + strength)),
      color: def.artColor || def.color,
      fire: def.spellType === "fire",
      burnDamage: def.spellType === "fire" ? 3 : 0,
    });
    return true;
  },
  fireArrow(p, charge) {
    if (!take(p.inventory, "arrow")) {
      this.message("No arrows. Recover shafts or find a quiver.");
      return false;
    }
    this.onSound("bow",p);
    const strength = Math.min(1, charge / 1.2),
      speed = rules.bowSpeed + strength * rules.bowBonusSpeed;
    this.arrows.push({
      owner:p.id,
      id: this.nextId++,
      x: p.x + p.faceX * 20,
      y: p.y + p.faceY * 20,
      z: 18,
      vx: p.faceX * speed,
      vy: p.faceY * speed,
      vz: 20 + strength * 70,
      damage:
        (ITEMS[p.equipment.hand1]?.damage || 18) * (2 / 3 + (strength * 4) / 3),
      owner: p.id,
    });
    this.persist();
    return true;
  },
  treasure(p) {
    const pool = [
      "relic",
      "bow",
      "arrow",
      "shield",
      "dagger",
      "potion",
      "gloves",
      "boots",
      "charm",
      "hat",
      "armor",
      "pants",
      "trap",
      "fruit",
    ];
    for (let n = 0; n < 3; n++) {
      const chosen = pool[Math.floor(this.random() * pool.length)];
      const type =
        chosen === "relic"
          ? rollRelic(this.random)
          : ITEMS[chosen]?.slot
            ? rollGear(this.random)
            : chosen;
      this.dropLoot(
        p.x + (n - 1) * 28,
        p.y + 30,
        type,
        type === "arrow" ? 12 : 1,
        "Board treasure",
      );
    }
    this.message(
      "Board treasure: three rewards appeared nearby. E / Y to collect.",
    );
  },
  enemyLoot(e) {
    const drop = (...args) => {
      if (this.random() < 0.1) this.dropLoot(...args);
    };
    this.dropXP(e.x, e.y, 10);
    if (this.random() < 0.4 || e.kind === "skeleton_boss")
      drop(
        e.x + 24,
        e.y,
        rollGear(this.random, e.kind === "skeleton_boss" ? "unique" : null),
        1,
        e.kind === "skeleton_boss" ? "Bone king reward" : "Enemy gear",
      );
    if (this.random() < (e.kind === "skeleton_boss" ? 0.35 : 0.08))
      drop(e.x - 18, e.y + 12, rollRelic(this.random), 1, "Relic");
    const config = creatures[e.kind];
    if (
      config?.dropType &&
      ITEMS[config.dropType]?.rarity !== "legendary" &&
      this.random() < (config.stats.dropChance ?? 1)
    )
      drop(e.x, e.y, config.dropType, 1, "Enemy drop");
    if (e.kind === "skeleton") drop(e.x, e.y, "sword", 1, "Skeleton drop");
    if (e.kind === "archer") {
      drop(e.x, e.y, "bow", 1, "Archer drop");
      drop(e.x + 12, e.y, "arrow", 8, "Archer drop");
    }
    if (e.kind === "skeleton_boss")
      for (const type of ["moon_blade", "moon_shield", "moon_circlet"])
        drop(e.x, e.y, type, 1, "Bone king equipment");
    if (this.random() < 0.35 || e.kind === "golem")
      drop(e.x - 15, e.y, "potion", 1, "Enemy drop");
    if (this.random() < 0.3)
      drop(
        e.x + 15,
        e.y,
        ["meat", "fruit", "trap"][Math.floor(this.random() * 3)],
        1,
        "Enemy drop",
      );
    for (const a of this.arrows.filter((a) => a.enemy === e.id))
      this.dropLoot(e.x, e.y, "arrow", 1, "Recovered arrow");
    this.arrows = this.arrows.filter((a) => a.enemy !== e.id);
    this.persist();
  },
};

