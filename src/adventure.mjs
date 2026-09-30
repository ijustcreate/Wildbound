import {victoryRewards} from './victory-chest.mjs';
import {inventoryCarryAction} from './inventory-carry.mjs';
import {merchantAction,openMerchant} from './traveling-merchant.mjs';
import {faceOpeningBoard,seatOpeningParty,openingCamera} from './opening-board.mjs';
import {LOBBY_PLAYER_SIZE,PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {equipmentAction} from './equipment-actions.mjs';
import {seedSupplyChests,openSupplyChest} from './supply-chests.mjs';
import {xpBurst,tickXPOrbs} from './xp-orbs.mjs';
import {equipmentNeighbor} from './equipment-navigation.mjs';
import {arrowVisualAngle} from './embedded-arrow.mjs';
import {ARROW_TYPES,arrowDrop,arrowScenery,compactArrowDrops,consumeQuiver,loadQuiver,quiverType,enemyQuiver,frostImpact,tickArrowIce} from './arrow-supplies.mjs';
import {learnIceRecipe,tickMeltingIce} from './ice-crafting.mjs';
import { INVENTORY_TABS, inventoryCategory, tabIndices, takeFromBag } from './inventory-containers.mjs';
import {wandTipWorld,bowHandleWorld} from './player-motion.mjs';
import {chargedProjectileRange,arrowFlightGravity} from './projectile-range.mjs';
import {finishMagicBolt} from './magic-bolt-effects.mjs';
import {hunterPets} from './hunter-pets.mjs';
import {SKILLS,SCROLL_BOSSES,skillAvailable,skillScrollId} from './field-skills.mjs';
import {hasAimWeapon, updateAimFacing} from './ranged-aim.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {sightRadius, emitNoise} from './night-cycle.mjs';
import {cutLivingVines} from './living-ecosystem.mjs';
import {lightTorchFire} from './night-equipment.mjs';
import {templeRoomStep,summonTempleTigers} from './temple.mjs';
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
import {refreshVitals} from './items.mjs';
import {socketAction} from './socket-workshop.mjs';
import {tickSalvage} from './salvage.mjs';
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
function onChestItemTaken(g,p,storage,type,fromMode){
  if(storage==='temple'&&fromMode==='chest'&&type==='ritual_dagger'&&!g.templeTigersSummoned){
    g.templeTigersSummoned=true;
    summonTempleTigers(g,p);
  }
}
function aimedDirection(g, p, origin, strength = 0.2) {
  const length = Math.hypot(p.faceX ?? 0, p.faceY ?? 0);
  const fx = length ? p.faceX / length : 0, fy = length ? p.faceY / length : 1, fl = 1;
  if (p.bowAiming) return {x:fx,y:fy};
  let best = null;
  for (const e of g.enemies || []) {
    if (e.hp <= 0 || e.room) continue;
    const dx = e.x - origin.x, dy = e.y - origin.y, d = Math.hypot(dx, dy) || 1;
    const dot = (dx * fx + dy * fy) / (d * fl);
    if (d > 320 || dot < 0.55 || !clearShot(g, origin, e, 4)) continue;
    const score = d * (1.35 - dot);
    if (!best || score < best.score) best = { x: dx / d, y: dy / d, score };
  }
  if (!best) return { x: fx / fl, y: fy / fl };
  // Keep aim help subtle: target assistance may nudge a shot, but never
  // redirect it more than a few degrees away from the player's aim.
  const current = Math.atan2(fy, fx);
  const target = Math.atan2(best.y, best.x);
  let delta = target - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const assisted = Math.max(-Math.PI / 45, Math.min(Math.PI / 45, delta * strength));
  const angle = current + assisted;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}
export const VISION = 280;
export function initAdventure(g) {
  initHazards(g);
  g.portals = [];
  g.arrows = [];
  g.arrowIcePatches=[];
  g.spells = [];
  g.baits = [];
  g.loot = [];
  g.xpOrbs = [];
  g.sharedStash = [];
  g.explored = new Set();
  g.encounteredEvents = Object.create(null);
  g.killedCreatures = Object.create(null);
  g.persist = () => {};
}
export function initHero(p) {
  const c = freshCharacter("hero-" + Date.now() + "-" + p.id, p.name);
  Object.assign(p, {
    profileId: c.id,
    inventory: [
      { type: "trap", qty: Math.max(0, Math.floor(rules.startingTraps)) },
      { type: "potion", qty: 2 },
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
        sightRadius(g, p, rules.visionRadius),
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
      e.jumpImpulse = c.stats.jumpImpulse;
      if (refresh) e.hp = Math.min(e.hp, e.maxHp);
      else e.hp = e.maxHp;
    }
    e.faction = c.faction;
  },
  lootConditionMet(condition = {}) {
    if (!condition.type || condition.type === "always") return true;
    const players = this.players || [];
    if (condition.type === "has_item")
      return players.some((p) => (p.inventory || []).some((item) => item.type === condition.item && item.qty > 0));
    if (condition.type === "encountered_event") return !!this.encounteredEvents?.[condition.event];
    if (condition.type === "killed_creature") return (this.killedCreatures?.[condition.creature] || 0) > 0;
    if (condition.type === "player_level") {
      const level = Number(condition.level) || 1;
      const highest = Math.max(1, ...players.map((p) => Number(p.level) || 1));
      if (condition.mode === "at_most") return highest <= level;
      if (condition.mode === "exactly") return highest === level;
      if (condition.mode === "between") return highest >= level && highest <= (Number(condition.maxLevel) || level);
      return highest >= level;
    }
    return true;
  },
  beginSeal(p) {
    if (
      this.phase !== "play" ||
      p.progress < 48 ||
      p.room ||
      dist(p, { x: 800, y: 800 }) > 120
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
    this.arrowIcePatches=[];
    this.traps = [];
    this.baits = [];
    // Dropped items belong to the party; sealing removes the jungle, not loot.
    this.pickups = [];
    this.spells = [];
    this.eventTime = 0;
    this.event = null;
    this.reveal = null;
    this.victoryChest = true;
    this.victoryChestOpened=false;this.victoryChestArt=null;
    this.merchant=null;
    this.victoryRewards=victoryRewards(this.players,this.random);
    this.loot = [];
    for (const p of this.players) {
      p.hp = p.maxHp;
      p.sealHold = 0;
      p.secondWindUsed = false;
    }
    this.message(
      "WILDBOUND! The jungle sleeps. Interact at the table for the shared reward chest. Strike the board to begin again.",
    );
    this.onSound("win");
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
    this.templeTigersSummoned = false;
    this.generatedEnvironment = env;
    seedSupplyChests(this,true);
    this.phase = "play";
    this.bloom = 0;
    this.round = 1;
    this.turnOrder = [];
    this.repeatTurnPlayerId = null;
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
    seatOpeningParty(this.players);
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
  useCoconut(p) {
    if (p.hp <= 0 || p.hp >= p.maxHp || !take(p.inventory, "coconut")) return false;
    p.hp = Math.min(p.maxHp, p.hp + 18);
    this.onSound("heal");
    this.persist();
    return true;
  },
  dropLoot(x, y, type, qty = 1, source = "Ground loot", manualPickup = false,metadata={}) {
    this.onSound("drop",{x,y});
    if(ARROW_TYPES.includes(type)){
      const near=this.loot.find(l=>l.type===type&&!l.surfaceEmbedded&&Math.hypot(l.x-x,l.y-y)<24);
      return arrowDrop(this,{...(near?{x:near.x,y:near.y}:lootSpot(this,x,y)),type,...metadata},qty,source);
    }
    const position = lootSpot(this, x, y);
    this.loot.push({
      id: this.nextId++,
      ...position,
      type,
      qty,
      source,
      manualPickup,
      ...(type==='raw_ice'?{meltRemaining:metadata.meltRemaining??300}:{}),
      ...(metadata.sockets?.length?{sockets:[...metadata.sockets]}:{}),
      ...(ITEMS[type]?.bag?{contents:structuredClone(metadata.contents||[])}:{}),
    });
  },
  dropXP(x, y, amount = 10) {
    const position = lootSpot(this, x, y);
    xpBurst(this,position,amount);
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
        hero.hp+=8;hero.mana=(hero.mana||0)+6;refreshVitals(hero);
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
  nearbyArrow(p) {
    return this.arrows
      .filter((a) => a.stuck && dist(p, a) < 65 && !a.hostile)
      .sort((a, b) => dist(a, p) - dist(b, p))[0];
  },
  collectArrow(p, arrow) {
    if (!arrow || !this.arrows.includes(arrow) || dist(p, arrow) > 65) return false;
    if (!give(p.inventory, arrow.ammoType||"arrow", 1)) {
      this.inventoryFullNotice(p, "arrow");
      return false;
    }
    this.arrows = this.arrows.filter((a) => a !== arrow);
    this.onSound("loot", p);
    this.message("Recovered arrow.");
    this.persist();
    return true;
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
    const skill=ITEMS[l.type]?.skillScroll;
    if (skill) {
      initializeField(p).skillScrolls[skill]=true;
      this.message(ITEMS[l.type].name+' found. Training unlocked in the Field Guild.');
    } else if (!give(p.inventory, l.type, l.qty,24,l)) {
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
    p.pickupTime = 0.42;
    p.pickupItem = l.type;
    if (["unique", "legendary"].includes(ITEMS[l.type]?.rarity)) p.foundUnique = 1.1;
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
    if(p.hunterPet?.spiritGhost){p.hunterPet.room=door.id;p.hunterPet.roomX=p.roomX+24;p.hunterPet.roomY=p.roomY+12;}
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
    if(p.hunterPet?.spiritGhost){p.hunterPet.room=null;p.hunterPet.x=d.x-24;p.hunterPet.y=d.y+12;}
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
    p.ui = { panel: storage === "victory" && (this.victoryRewards || []).length ? "chest" : "pack", index: 0, slot: 0, storage, hold: 0 };
    if(storage==='victory')this.victoryChestOpened=true;
    p.ui.tab = inventoryCategory(p.inventory[0]?.type);
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
    const chestType=from.mode==='chest'?this.storageFor(p)?.[from.index]?.type:null;
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
    if (ok) {onChestItemTaken(this,p,p.ui.storage,chestType,from.mode);this.onSound("loot",p);this.persist();}
    return ok;
  },
  inventoryAction(p, action) {
    if (typeof action !== "string") return;
    const u = p.ui;
    if (!u) return;
    if(merchantAction(this,p,action))return;
    if(inventoryCarryAction(this,p,action))return;
    if(equipmentAction(this,p,action))return;
    if (u.bag && !action.startsWith('select:')) {
      const state=u.bag, list=state.mode==='chest'?this.storageFor(p):p.inventory, bag=list?.[state.index], rule=ITEMS[bag?.type]?.bag;
      if (!rule || action==='close') { delete u.bag; return; }
      if (['next','prev','up','down'].includes(action)) {
        const step=action==='next'?1:action==='prev'?-1:action==='down'?5:-5;
        state.selected=((state.selected||0)+step+rule.slots*6)%rule.slots;
      } else if (action==='use' && (state.mode!=='chest'||canAccess(this,p,true))) {
        u.notice=takeFromBag(bag,state.selected||0,p.inventory)?'Item taken.':'Backpack is full or this slot is empty.';
        this.persist();
      }
      return;
    }
    if (u.split && ['up', 'down', 'next', 'prev', 'use', 'close', 'offhand'].includes(action)) {
      const list = u.split.panel === 'chest' ? this.storageFor(p) : p.inventory;
      const qty = list?.[u.split.index]?.qty || 1;
      if (action === 'close') { delete u.split; return; }
      if (action === 'use') { action = 'split:' + u.split.amount; }
      else { u.split.amount = Math.max(1, Math.min(qty - 1, u.split.amount + (['up', 'next'].includes(action) ? 1 : -1))); return; }
    }
    if (action.startsWith('tab:') && INVENTORY_TABS.includes(action.slice(4))) {
      u.tab = action.slice(4); u.panel = 'pack'; u.index = tabIndices(p.inventory, u.tab)[0] ?? 0;
      delete u.split; delete u.bag; u.notice = ''; return;
    }
    if(this.phase==='lobby'&&(['drop','dropOne','store'].includes(action)||(['use','equip'].includes(action)&&p.inventory[u.index]?.type==='trap'&&u.panel==='pack'))){u.notice='Use this item in an expedition.';return;}
    if(p.salvageHold)p.salvageHold={latched:true};
    u.salvagePointer=false;
    if(socketAction(this,p,action))return;
    if(action.startsWith('quiver:')){if(loadQuiver(p,action.slice(7)))this.persist();return;}
    if(u.panel==='quiver'&&['next','prev','down','up','use','equip'].includes(action)){
      const step=['prev','up'].includes(action)?-1:1;
      loadQuiver(p,ARROW_TYPES[(ARROW_TYPES.indexOf(quiverType(p))+step+ARROW_TYPES.length)%ARROW_TYPES.length]);this.persist();return;
    }
    const storage = this.storageFor(p);
    const selected = p.inventory[u.index];
    if (!u.shop && u.panel === 'pack' && u.tab && selected && inventoryCategory(selected.type) !== u.tab && ['use','equip','equipOffhand','offhand','drop','dropOne','store','split'].includes(action.split(':')[0])) {
      u.notice = 'Select an item in this tab.';
      return;
    }
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
      if (action === 'split') {
        const item = list?.[u.index];
        if (item?.qty > 1) u.split = { panel: u.panel, index: u.index, amount: Math.floor(item.qty / 2) };
        return;
      }
      delete u.split;
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
      const takenType=from[u.index].type,
        name = ITEMS[takenType]?.name || "Item";
      if (transfer(from, to, u.index, storageCapacity(this, p, to))) {
        u.notice = name + (u.panel === "chest" ? " taken." : " stored.");
        u.index = Math.max(0, Math.min(u.index, from.length - 1));
        onChestItemTaken(this,p,u.storage,takenType,u.panel);
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
      ["pack", "gear", "chest", "quiver"].includes(action.slice(6))
    ) {
      switchPanel(action.slice(6));
    }
    if (action === "close") {
      p.ui = null;
      return;
    }
    if (action === "panel") {
      if (!storage && u.panel === 'pack' && u.tab && u.tab !== 'other') {
        u.tab = INVENTORY_TABS[INVENTORY_TABS.indexOf(u.tab) + 1];
        u.index = tabIndices(p.inventory, u.tab)[0] ?? 0;
      } else {
        const panels = storage ? ["pack", "gear", "quiver", "chest"] : ["pack", "gear", "quiver"];
        switchPanel(panels[(panels.indexOf(u.panel) + 1) % panels.length]);
        if (u.panel === 'pack') {
          if (storage) u.tab = inventoryCategory(p.inventory[u.index]?.type);
          else { u.tab = 'gear'; u.index = tabIndices(p.inventory, u.tab)[0] ?? 0; }
        }
      }
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
    if(u.panel==='pack'&&!u.shop&&['next','prev','down','up'].includes(action)){
      const indices=tabIndices(p.inventory,u.tab||inventoryCategory(p.inventory[u.index]?.type));
      const pos=Math.max(0,indices.indexOf(u.index)),step=action==='next'?1:action==='prev'?-1:action==='down'?6:-6;
      if(indices.length)u.index=indices[(pos+step+indices.length*6)%indices.length];
    }else if(u.panel==='gear'&&['next','prev','down','up'].includes(action)){
      u.index=SLOTS.indexOf(equipmentNeighbor(SLOTS[u.index],action));
    }else{
      if (action === "next") u.index = (u.index + 1) % limit;
      if (action === "prev") u.index = (u.index + limit - 1) % limit;
      if (action === "down") u.index = (u.index + stride) % limit;
      if (action === "up") u.index = (u.index + limit - stride) % limit;
    }
    if (action === "use" || action === "equip") {
      const selectedList = u.panel === 'chest' ? storage : p.inventory;
      if (u.panel !== 'gear' && ITEMS[selectedList?.[u.index]?.type]?.bag) {
        u.bag = { mode: u.panel, index: u.index }; return;
      }
      if (u.panel === "gear") unequip(p, SLOTS[u.index % SLOTS.length]);
      else if (storage && action === "use") moveItem();
      else {
        const item = p.inventory[u.index];
        if(item?.type==='ice_arrow_recipe'){u.notice=learnIceRecipe(p)?'Ice arrows added to the Field Guild.':'Recipe already learned.';}
        else if(ARROW_TYPES.includes(item?.type)){loadQuiver(p,item.type);u.notice=ITEMS[item.type].name+' loaded in quiver.';}
        else if (item?.type === "stamina_potion") useStamina(p);
        else if (item?.type === "potion") this.usePotion(p);
        else if (item?.type === "coconut") this.useCoconut(p);
        else if (item?.type === "trap" && !p.room) this.trap(p);
        else equip(p, u.index);
      }
    }
    if (action === "offhand" && u.panel === "chest")
      this.inventoryAction(p, "split");
    if ((action === "offhand"||action==='equipOffhand') && u.panel === "pack") {
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
          item,
        );
        if (action === "dropOne" && item.qty > 1) item.qty--;
        else clearSlot(p.inventory, u.index);
      }
    }
    this.persist();
  },
  tickAdventure(dt, inputs) {
    tickXPOrbs(this,dt);
    tickMeltingIce(this,dt);tickArrowIce(this,dt);
    if(this.time>=(this.arrowCompactAt||0)){compactArrowDrops(this);this.arrowCompactAt=this.time+1;}
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
      p.salvageFinish=Math.max(0,(p.salvageFinish||0)-dt);
      p.necromancerCooldown = Math.max(0, (p.necromancerCooldown || 0) - dt);
      for (const order of p.vendingOrders || []) {
        if (!order.ready) {
          order.elapsed += dt;
          if (order.elapsed >= 1.6) {
            order.ready = true;
            this.persist();
          }
        }
      }
      refreshVitals(p);
      if(p.hp>0)p.hp=Math.min(p.maxHp,p.hp+dt*stat(p,'hpRegen'));
      p.mana = Math.min(
        p.maxMana,
        (p.mana ?? p.maxMana) + (p.hp > 0 ? dt * (8+stat(p,'manaRegen')) : 0),
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
        tickSalvage(this,p,false,dt);
        p.charge = 0;
        p.previousInput = { ...i };
        continue;
      }
      if (edge("portal") && !p.ui) this.portal(p);
      if (edge("inventory")) {
        if (p.ui) p.ui = null;
        else this.openInventory(p);
      }
      if(!p.ui)tickSalvage(this,p,false,dt);
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
          "dropOne",
          "pick",
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
        tickSalvage(this,p,!!i.salvage||!!p.ui?.salvagePointer,dt);
      } else if (p.room) {
        tickSalvage(this,p,false,dt);
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
        if(this.openingBoard)faceOpeningBoard(p);else if (!p.sleeping) updateAimFacing(p, i);
        p.bowAiming = !!i.block && hasAimWeapon(p) && !p.swimming && !p.sleeping && !this.openingBoard;
        if (edge("interact"))p.interactAnimation=.35;
        if (edge("summon")) this.raiseSkeleton(p);
        if (edge("potion")) this.usePotion(p);
        p.blocking = !!i.block && !hasAimWeapon(p) && itemKind(p.equipment.hand2) === "shield";
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
          dist(p, { x: 800, y: 800 }) < 120 &&
          i.interact &&
          !this.nearbyLoot(p)
        ) {
          p.sealHold = (p.sealHold || 0) + dt;
          if (p.sealHold >= rules.sealHold) this.beginSeal(p);
        } else p.sealHold = 0;
        if(p.swimming){p.charge=0;delete p.queuedAttack;}
        if(this.openingBoard&&edge('attack')){this.attack(p);p.charge=0;}
        if (!this.openingBoard&&i.attack&&!p.swimming)
          p.charge = Math.min(1.2, (p.charge || 0) + dt*(1+(itemKind(p.equipment?.hand1)==='bow'?stat(p,'bowDrawSpeed'):0)));
        if (!i.attack && old.attack && p.charge&&!p.swimming) {
          this.attack(p, p.charge);
          p.charge = 0;
        }
        const l = this.nearbyLoot(p), embeddedArrow = this.nearbyArrow(p);
        if (edge("loot") && embeddedArrow) this.collectArrow(p, embeddedArrow);
        if (edge("loot") && l) this.collect(p, l);
        if (i.interact) {
          p.interactTime = (p.interactTime || 0) + dt;
          if (p.interactTime >= 0.55 && !p.interactUsed && l) {
            this.collect(p, l, true);
            p.interactUsed = true;
          }
        } else {
          if (old.interact && p.interactTime > 0 && p.interactTime < 0.55 && !p.interactUsed && !p.sealHold) {
            const d = this.portals.find((d) => dist(p, d) < 65);
            if (l) this.collect(p, l);
            else if (embeddedArrow) this.collectArrow(p, embeddedArrow);
            else if (openMerchant(this,p)||openSupplyChest(this,p)||toggleDoor(this,p)||interactIce(this,p)) {}
            else if (cutLivingVines(this,p)) { this.onSound('harvest',p); this.message('Vines cut. The path is clear.'); this.persist(); }
            else if (this.victoryChest && dist(p, { x: 800, y: 914 }) < 60)
              this.openInventory(p, "victory");
            else if (dist(p, { x: 800, y: 800 }) < 86)
              this.message("The board has no storage chest. Visit a portal or use the Field Kit for storage.");
            else lightTorchFire(this,p);
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
          sightRadius(this, p, rules.visionRadius);
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
        bolt.remaining ??= chargedProjectileRange(0);
        const speed = Math.hypot(bolt.vx, bolt.vy) || 260,
          distance = Math.min((speed * dt) / steps, bolt.remaining);
        bolt.x += (bolt.vx / speed) * distance;
        bolt.y += (bolt.vy / speed) * distance;
        bolt.remaining -= distance;
        if(this.projectileBlocked(bolt.x,bolt.y,(bolt.size||6)/2,true)){bolt.life=0;finishMagicBolt(this,bolt,true);break;}
        const target = [...this.enemies,...(this.pvp?this.players.filter(p=>p.id!==bolt.owner&&!p.room):[])].find(
          (e) => e.hp > 0 && dist(e, bolt) < 16 + (bolt.size || 6) / 2 && clearShot(this,bolt,e),
        );
        if (target) {
          finishMagicBolt(this,bolt,true);
          if(this.players.includes(target))this.hurt(target,bolt.damage,bolt);else {damageEnemy(target,bolt.damage,bolt.fire?'fire':bolt.ice?'ice':'magic');target.killedBy=bolt.owner;target.ritualKill=false;}
          if (!target.practiceTarget && !this.players.includes(target) && bolt.friendship) { target.faction = 'ally'; target.allyOwner = bolt.owner; target.aggro = false; this.message(`${target.kind} has joined your side.`); }
          target.flash = 0.2;
          target.aggro = true;
          if (bolt.fire) ignite(target, 2, bolt.burnDamage || 3);
          if (bolt.ice && !this.players.includes(target) && this.random() < 0.35) target.frozen = 1.6;
          bolt.life = 0;
        } else if (this.projectileBlocked(bolt.x, bolt.y, (bolt.size || 6) / 2,true)) {
          bolt.life = 0;finishMagicBolt(this,bolt,true);
        }
        if (bolt.remaining <= 0) bolt.life = 0;
      }
    }
    for(const bolt of this.spells)if(bolt.life<=0)finishMagicBolt(this,bolt,false);
    this.spells = this.spells.filter((b) => b.life > 0);
    for (const b of this.baits) b.life -= dt;
    this.baits = this.baits.filter((b) => b.life > 0);
    for (const a of this.arrows) {
      if (a.stuck) {
        if (a.enemy!==undefined&&a.enemy!==null) {
          const e = this.enemies.find((e) => e.id === a.enemy);
          if (e) {
            a.x = e.x + (a.hitOffsetX || 0);
            a.y = e.y + (a.hitOffsetY || 0);
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
        const gravity=a.gravity??rules.arrowGravity;
        a.z += a.vz * s-.5*gravity*s*s;
        a.vz -= gravity * s;
        if(this.projectileBlocked(a.x,a.y,1,true)){
          const impactHeight=a.z,impactX=a.x,impactY=a.y;
          a.angle=arrowVisualAngle(a);
          const prop=arrowScenery(this,impactX,impactY);
          a.stuck=true;a.impactTime=this.time;frostImpact(this,a);
          if(prop?.kind==='rock'&&!a.rock&&!a.ice){
            this.effects.push({x:impactX,y:impactY-impactHeight,text:'Splinter',color:'#d0b181',life:.35});
            (this.environmentParticles||=[]).push({x:impactX,y:impactY-impactHeight,kind:'tree',life:.4});
          }else if(!a.rock&&!a.ice){arrowDrop(this,{...a,x:impactX,y:impactY,z:Math.max(0,impactHeight),surfaceEmbedded:true});}
          a.remove=true;break;
        }
        const target = a.hostile
          ? [...this.players,...hunterPets(this)].find((p) => !p.room && p.hp > 0 && dist(p, a) < 16 && clearShot(this,a,p))
          : [...this.enemies,...(this.pvp?this.players.filter(p=>p.id!==a.owner&&!p.room):[])].find((e) => e.hp > 0 &&
            (e.practiceTarget
              ? a.z>0 && Math.hypot(a.x-e.x,(a.y-a.z)-(e.y-18))<23
              : dist(e,a)<19 && a.z<38) && clearShot(this,a,e));
        if (target && (target.practiceTarget || a.z < 38)) {
          this.onSound("hit",a);
          if (a.hostile || this.players.includes(target)) {
            if (this.shieldBlocks(target, a)) {
              this.onSound("shield",target);
              give(target.inventory, a.ammoType||"arrow");
              a.remove = true;
            } else {
              this.hurt(target, a.damage, a);
              frostImpact(this,a,target);
              a.remove = true;
            }
          } else {
            target.aggro = true;
            damageEnemy(target,a.damage,a.ice?'ice':'physical');target.killedBy=a.owner;target.ritualKill=false;
            target.flash = 0.2;
            frostImpact(this,a,target);
            if (a.ice && this.random() < 0.35) target.frozen = 1.6;
            a.enemy = target.id;
            a.hitOffsetX = a.x - target.x;
            a.hitOffsetY = a.y - target.y;
            a.embedDepth = a.embedDepth || 7;
            a.angleJitter = a.angleJitter || 0;
          }
          a.angle=arrowVisualAngle(a);a.vx=0;a.vy=0;a.vz=0;
          a.stuck = true;a.impactTime=this.time;
        } else if (
          a.z <= 0 ||
          a.x < 10 ||
          a.y < 10 ||
          a.x > 1590 ||
          a.y > 1590 ||
          this.projectileBlocked(a.x, a.y, 1,true)
        ) {
          a.angle=arrowVisualAngle(a);
          a.stuck = true;a.impactTime=this.time;
          a.z = 0;
          a.embedDepth = a.embedDepth || 7;
          frostImpact(this,a);
          if(!a.rock&&!a.ice)arrowDrop(this,a);
          a.remove = true;
        }
      }
    }
    this.arrows = this.arrows.filter((a) => !a.remove);
  },
  shieldBlocks(p, source) {
    if (!source || !p.blocking) return false;
    const d = dist(p, source) || 1;
    const blocked = ((source.x - p.x) * p.faceX + (source.y - p.y) * p.faceY) / d > 0.25;
    if (blocked && source.state === "windup") {
      p.parry = 0.32;
      source.state = "recover";
      source.timer = 0.45;
    }
    return blocked;
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
  fireSpell(p, charge = 0, slot = "hand1", comboDamage = 1) {
    emitNoise(this, p, 'magic', 260);
    const def = ITEMS[p.equipment[slot]];
    const cost=(def?.manaCost||0)*(1-Math.min(.75,stat(p,'manaDiscount')));
    if (!def?.magic || (p.mana ?? 100) < cost) return false;
    this.onSound("magic",p);
    p.mana = (p.mana ?? 100) - cost;
    if(p.hp>0)p.hp=Math.min(p.maxHp,p.hp+stat(p,'castHeal'));
    this.spells ||= [];
    const strength = Math.max(0, Math.min(1, charge / 1.2));
    const tip=wandTipWorld(p,slot,this.time);
    const aim = aimedDirection(this, p, {x:tip.x,y:tip.y+16}, 0.18);
    this.spells.push({
      owner:p.id,slot,age:0,
      x: tip.x,
      y: tip.y+16,
      vx: aim.x * 260,
      vy: aim.y * 260,
      life: 3,
      remaining: chargedProjectileRange(charge),
      size: 6 + Math.round(strength * 8),
      damage: Math.round((def.damage+stat(p,'damageBonus')) * (1 + strength) * Math.max(.1, comboDamage || 1)),
      color: def.artColor || def.color,
      fire: def.spellType === "fire",
      ice: def.spellType === "ice",
      friendship: !!def.friendship,
      burnDamage: def.spellType === "fire" ? 3 : 0,
    });
    return true;
  },
  fireArrow(p, charge) {
    emitNoise(this, p, 'bow', 150);
    const ammoType=consumeQuiver(p);
    if (!ammoType) {
      this.message("Quiver empty. Load another arrow type in your backpack.");
      return false;
    }
    this.onSound("bow",p);
    const strength = Math.min(1, charge / 1.2),
      shotId = this.nextId,
      angleJitter = (((shotId * 17) % 9) - 4) * 0.012,
      embedDepth = Math.max(5, Math.min(30, 6 + strength * 20 + (((shotId * 13) % 7) - 3) * 0.8)),
      speed = (rules.bowSpeed + strength * rules.bowBonusSpeed)*(1+stat(p,'arrowSpeed'));
    const tip=bowHandleWorld({...p,attack:0,charge,bowAiming:true},this.time,undefined,this.generatedEnvironment==='lobby'?LOBBY_PLAYER_SIZE:PLAYER_RENDER_SIZE);
    const z=18,origin={x:tip.x,y:tip.y+z};
    const aim = aimedDirection(this, p, origin, 0.2);
    for(const spread of stat(p,'arrowVolley')>=2?[-.16,0,.16]:[0]){
    const angle=Math.atan2(aim.y,aim.x)+spread;
    this.arrows.push({
      owner:p.id,
      ammoType,shaftLength:24,
      id: this.nextId++,
      x: origin.x,
      y: origin.y,
      z,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      vz: 20 + strength * 70,
      gravity:arrowFlightGravity(speed,charge,z),
      strength,
      embedDepth,
      angleJitter,
      damage:
        ((ITEMS[p.equipment.hand1]?.damage || 18)+stat(p,'damageBonus')) * (2 / 3 + (strength * 4) / 3)*(1+stat(p,'bowDamage')),
      owner: p.id,
    });
    }
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
    if(SCROLL_BOSSES.has(e.kind)||e.frostMage||e.boss){
      const missing=SKILLS.filter(s=>this.players.some(p=>!skillAvailable(p,s.id)));
      const pool=missing.length?missing:SKILLS,skill=pool[Math.floor(this.random()*pool.length)];
      this.dropLoot(e.x,e.y+24,skillScrollId(skill.id),1,'Boss skill scroll',true);
    }
    if (this.random() < 0.025) {
      const bags = ['armor_bag', 'relic_bag', 'crafting_bag'];
      this.dropLoot(e.x, e.y, bags[Math.min(2, Math.floor(this.random() * 3))], 1, 'Recovered bag', true);
    }
    const drop = (...args) => {
      if (this.random() < 0.1) this.dropLoot(...args);
    };
    const cfg = creatures[e.kind], difficulty = cfg?.stats?.hp || e.maxHp || 20;
    if (e.kind === 'necromancer') {
      const settings = {...(cfg.necromancerLoot || {}), ...(e.necromancerLoot || {})};
      const pieces = Array.isArray(settings.pieces) ? settings.pieces.filter(type => ITEMS[type]) : [];
      const ownedBy = type => this.players.some(p => Object.values(p.equipment || {}).includes(type) || (p.inventory || []).some(i => i?.type === type && i.qty > 0));
      for (const player of this.players) {
        const missing = pieces.filter(type => !Object.values(player.equipment || {}).includes(type) && !(player.inventory || []).some(i => i?.type === type && i.qty > 0));
        if (!missing.length) continue;
        const type = missing[Math.floor(this.random() * missing.length)];
        const chance = ownedBy(type) ? Number(settings.sharedPieceChance ?? .25) : Number(settings.chance ?? 1);
        if (this.random() < Math.max(0, Math.min(1, chance))) this.dropLoot(e.x + (this.random()-.5)*32, e.y + (this.random()-.5)*32, type, 1, 'Necromancer set piece', true);
      }
    }
    if(e.kind==='hunter') {
      const worn=[...new Set(Object.values(e.equipment||{}))].filter(type=>ITEMS[type]?.slot);
      for(const [i,type] of worn.entries())this.dropLoot(e.x+(i%3-1)*22,e.y+Math.floor(i/3)*22,type,1,'Hunter equipment',true);
      this.dropLoot(e.x,e.y+60,'cartridge',12,'Hunter ammunition',true);
    }
    const xpValue = e.kind === "skeleton" ? 10 : Math.max(4, Math.min(80, Math.round(difficulty / 5)));
    this.dropXP(e.x, e.y, xpValue);
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
    if(this.random()<.1){const n=this.random();drop(e.x+12,e.y+12,n<.65?'azure_bead':n<.92?'moon_prism':'starheart',1,'Mana trinket');}
    const lootDrops = config?.lootDrops || [];
    for (const entry of lootDrops) {
      if (!entry?.item || !this.lootConditionMet(entry.condition)) continue;
      if (this.random() >= Math.max(0, Math.min(100, Number(entry.chance ?? 100))) / 100) continue;
      this.dropLoot(e.x, e.y, entry.item, Math.max(1, Number(entry.qty) || 1), "Enemy drop");
    }
    if (
      !lootDrops.length && (config?.dropType || e.frostMage) &&
      ITEMS[config.dropType]?.rarity !== "legendary" &&
      this.random() < (config.stats.dropChance ?? 1)
    )
      drop(e.x, e.y, e.frostMage ? "ice_wand" : config.dropType, 1, "Enemy drop");
    if (e.kind === "skeleton") drop(e.x, e.y, "sword", 1, "Skeleton drop");
    if (e.kind === "krampus") this.dropLoot(e.x, e.y, "krampus_whip", 1, "Krampus drop", true);
    if (["skeleton", "skeleton_unarmed", "skeleton_boss", "skeleton_wizard", "frost_skeleton_mage"].includes(e.kind))
      drop(e.x - 12, e.y + 8, "bone_shard", e.kind === "skeleton_boss" ? 3 : 1, "Skeleton remains");
    if (e.kind === "golem")
      this.dropLoot(e.x, e.y, "golem_core", 1, "Golem core", true);
    if (["spider", "baby_spider"].includes(e.kind))
      drop(e.x, e.y + 8, "web_silk", 1, "Spider silk");
    if (["lion", "tiger", "panther", "white_lion", "snow_leopard", "wolf", "boar"].includes(e.kind))
      drop(e.x, e.y + 8, "beast_fang", 1, "Beast remains");
    if (e.lanternBearer)
      this.dropLoot(e.x, e.y - 18, "lantern", 1, "Skeleton lantern", true);
    if (e.kind === "archer") {
      drop(e.x, e.y, "bow", 1, "Archer drop");
    }
    if(cfg?.behaviors?.ranged&&(cfg.aiKind||e.kind)!=='skeleton_wizard'){
      const remaining=enemyQuiver(e),ice=Math.min(remaining,e.iceArrowsLeft||0);
      if(remaining>ice)arrowDrop(this,{x:e.x,y:e.y,type:'arrow'},remaining-ice,'Enemy quiver');
      if(ice>0)arrowDrop(this,{x:e.x,y:e.y,type:'ice_arrow'},ice,'Enemy quiver');e.arrowsLeft=0;e.iceArrowsLeft=0;
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
    for (const a of this.arrows.filter((a) => a.enemy === e.id)) {
      if(!a.rock&&!a.ice)arrowDrop(this,{...a,x:e.x+(a.hitOffsetX||0),y:e.y+(a.hitOffsetY||0),z:0},1,'Recovered arrow');
    }
    this.arrows = this.arrows.filter((a) => a.enemy !== e.id);
    this.persist();
  },
};

