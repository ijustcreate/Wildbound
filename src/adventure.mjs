import {victoryRewards} from './victory-chest.mjs';
import {damageStructureProjectile} from './structure-destruction.mjs';
import {openNpcDialogue,npcDialogueAction} from './npc-quests.mjs';
import {houseKeepsWorld,recalledEnemy} from './house-victory.mjs';
import {dropRavenLoot,spawnRavenFlock} from './raven.mjs';
import {spawnSurfaceEcology,releaseGraveyardCritter} from './graveyard-ecology.mjs';
import {dropHiveHoney,useHoneycomb} from './honeycomb.mjs';
import {enterOldWell,leaveOldWell,interactOldWell,oldWellRoomStep,tickOldWells,wellForPlayer} from './old-well.mjs';
import {robotShopAction} from './robot-shop.mjs';
import {bansheeArrowBonus,bansheeArrowImpact} from './banshee-queen.mjs';
import {isCharmed,clearCharm,charmShot,playerCombatTargets,tickSuccubusKisses} from './succubus-charm.mjs';
import {starterChestFor} from './starter-chest.mjs';
import {waterAt} from './environment.mjs';
import {tickBoomerangs} from './boomerang.mjs';
import {anacondaProjectileHit,anacondaBody,anacondaContact} from './anaconda-body.mjs';
import {interactMystery} from './mysteries.mjs';
import {toggleHouseLight} from './house-lights.mjs';
import {inventoryCarryAction} from './inventory-carry.mjs';
import {playerInput} from './inventory-input.mjs';
import {magicBoltGlow} from './magic-bolt-render.mjs';
import {merchantAction,openMerchant} from './traveling-merchant.mjs';
import {faceOpeningBoard,seatOpeningParty,openingCamera} from './opening-board.mjs';
import {canHitEventTestBoard} from './event-test-board.mjs';
import {LOBBY_PLAYER_SIZE,PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {equipmentAction} from './equipment-actions.mjs';
import {seedSupplyChests,openSupplyChest} from './supply-chests.mjs';
import {xpBurst,tickXPOrbs} from './xp-orbs.mjs';
import {equipmentNeighbor} from './equipment-navigation.mjs';
import {tickStorageRoom,resetStorageJump} from './storage-room.mjs';
import {cancelRobotRepair,robotOnline,openRobotIntroduction} from './storage-repair.mjs';
import {canDropInventoryItem,dropInventoryItem} from './inventory-world.mjs';
import {arrowVisualAngle} from './embedded-arrow.mjs';
import {ARROW_TYPES,arrowDrop,arrowScenery,compactArrowDrops,consumeQuiver,enemyQuiver,frostImpact,tickArrowIce} from './arrow-supplies.mjs';
import {tickMeltingIce} from './ice-crafting.mjs';
import { takeFromBag } from './inventory-containers.mjs';
import {wandTipWorld,bowHandleWorld} from './player-motion.mjs';
import {chargedProjectileRange,arrowFlightGravity} from './projectile-range.mjs';
import {finishMagicBolt} from './magic-bolt-effects.mjs';
import {hunterPets} from './hunter-pets.mjs';
import {SKILLS,SCROLL_BOSSES,skillAvailable,skillScrollId} from './field-skills.mjs';
import {hasAimWeapon, updateAimFacing,updateBowAimBlend} from './ranged-aim.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {befriendCreature} from './friendly-creatures.mjs';
import {sightRadius, emitNoise} from './night-cycle.mjs';
import {cutLivingVines,releaseCritter} from './living-ecosystem.mjs';
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
import { clearSlot } from "./items.mjs";
import {refreshVitals} from './items.mjs';
import {socketAction} from './socket-workshop.mjs';
import {tickSalvage} from './salvage.mjs';
import {
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
  for (const e of playerCombatTargets(g,p)) {
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
    robotRepaired: c.robotRepaired,
    robotIntroduced: c.robotIntroduced,
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
    if(!houseKeepsWorld(this))this.scenery = [];
    this.enemies = houseKeepsWorld(this)?this.enemies.filter(e=>!recalledEnemy(e)):[];
    if(houseKeepsWorld(this))this.ghosts=(this.ghosts||[]).filter(e=>!recalledEnemy(e));
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
    this.questNpcs=[];this.questSceneToken=null;this.questSpawnTimer=0;
    this.victoryRewards=victoryRewards(this.players,this.random);
    this.loot = [];
    for (const p of this.players) {
      clearCharm(p,false);
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
    this.eventTestBoard=null;
    this.footprints = [];
    this.environmentParticles = [];
    initHazards(this);
    this.seed += 1 + Math.floor(this.random() * 100000);
    const env =
      resolveEnvironment(this.environment,this.seed);
    Object.assign(this, generateWorld(this.seed, env));
    this.boundlessLoadedChunks=[];
    this.templeTigersSummoned = false;
    this.generatedEnvironment = env;
    spawnSurfaceEcology(this);
    if(env==='graveyard'){
      const perch=this.scenery.find(p=>p.kind==='leafless_tree'&&Math.hypot(p.x-800,p.y-800)>350);
      spawnRavenFlock(this,{count:3,x:perch?.x??470,y:perch?.rootY??430});this.graveyard.ravensSeeded=true;
    }
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
    this.mystery = null;
    this.rollCooldown = 0;
    this.locked = false;
    this.explored = new Set();
    this.victoryChest = (this.victoryRewards || []).some(Boolean);
    this.victoryShown = false;
    for (const [i, p] of this.players.entries()) {
      clearCharm(p,false);
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
    const qty = Math.max(1, Number(arrow.qty) || 1);
    if (!give(p.inventory, arrow.ammoType||"arrow", qty)) {
      this.inventoryFullNotice(p, "arrow");
      return false;
    }
    this.arrows = this.arrows.filter((a) => a !== arrow);
    this.onSound("loot", p);
    this.message(`Recovered ${qty} arrow${qty === 1 ? "" : "s"}.`);
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
    let door = this.portals.find((d) => !d.temple && !d.oldWell && d.owner === p.id);
    if (door) {
      if (this.players.some((q) => q.room === door.id)) {
        // Repeated presses must not extend a guest's existing escape countdown.
        if (door.closing === null) door.closing = rules.portalGrace;
        this.message(p.name + " closed the storage portal. Leave within " + Math.ceil(door.closing) + " seconds.");
      } else {
        this.portals = this.portals.filter((q) => q !== door);
        this.message(p.name + " closed the storage portal.");
      }
      this.persist();
      return;
    }
    // A nearby private portal is already the shared entry for this storage room.
    // Reuse it instead of spawning a second portal on top of the first one.
    const nearby = this.portals.find(
      (d) => !d.temple && !d.oldWell && d.owner !== p.id && dist(p, d) <= 70,
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
    if(door?.oldWell)return enterOldWell(this,p,door);
    if (p.hp <= 0 || p.room || dist(p, door) > 26) return false;
    p.room = door.id;
    p.roomX = 160;
    p.roomY = 158;
    p.roomMoving = false;
    p.roomStep = 0;
    resetStorageJump(p);
    cancelRobotRepair(p);
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
    if(d.oldWell){
      if(!forced&&p.hp>0&&p.wellExitArmed===false){this.message(d.mausoleum?'Release Interact after descending, then use the entrance stairs.':'Release Interact after descending, then use the rope to climb out.');return false;}
      if(!forced&&p.hp>0&&Math.hypot(p.roomX-d.well.exit.x,p.roomY-d.well.exit.y)>=36){this.message(d.mausoleum?'Find the entrance stairs and use Interact to return.':'Find the shaft of light and climb the rope to return.');return false;}
      return leaveOldWell(this,p);
    }
    p.room = null;
    p.ui = null;
    resetStorageJump(p);
    cancelRobotRepair(p);
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
    cancelRobotRepair(p);
    if(storage==='temple'&&!this.templeTigersSummoned){this.templeTigersSummoned=true;summonTempleTigers(this,p);}
    this.onSound("inventory",p);
    p.ui = { ownerDevice:p.device,panel: storage === "victory" && (this.victoryRewards || []).length ? "chest" : "pack", index: 0, slot: 0, storage, hold: 0 };
    if(storage==='starter')Object.assign(p.ui,{panel:'chest',loot:true,index:Math.max(0,starterChestFor(this,p).findIndex(Boolean))});
    if(storage==='old-well')Object.assign(p.ui,{panel:'chest',loot:true,index:Math.max(0,wellForPlayer(this,p)?.well.chest.items.findIndex(Boolean)??0)});
    if(storage==='victory')this.victoryChestOpened=true;
    if(storage==='tv-victory'&&this.tvWorld?.won&&this.tvWorld.players.has(p.id)){
      this.tvWorld.victoryChestOpened=true;
      Object.assign(p.ui,{panel:'chest',loot:true,index:Math.max(0,this.tvWorld.victoryRewards.findIndex(Boolean))});
    }
    p.charge = 0;
  },
  storageFor(p) {
    if(p.ui?.storage==='old-well')return wellForPlayer(this,p)?.well.chest.items||null;
    if(p.ui?.storage==='starter')return starterChestFor(this,p);
    if(p.ui?.storage==="temple")return this.templeChest;
    if (p.ui?.storage === "victory") return this.victoryRewards;
    if(p.ui?.storage==='tv-victory'&&this.tvWorld?.won&&this.tvWorld.players.has(p.id))return this.tvWorld.victoryRewards;
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
    if(npcDialogueAction(this,p,action))return;
    if (typeof action !== "string") return;
    const u = p.ui;
    if (!u) return;
    if(u.shop==='robot-intro'){
      if(['use','close','robotContinue'].includes(action)){p.ui=null;this.onSound('ui',p);}
      return;
    }
    if(u.loot){
      if(u.storage==='tv-victory'&&['tvReturn','use'].includes(action)&&!this.storageFor(p)?.some(Boolean)){
        if(this.tvWorld?.won&&this.tvWorld.players.has(p.id))this.tvWorld.requestLobbyReturn=true;
        return;
      }
      if(action==='closeStorage'){p.ui=null;return;}
      const reusable=Number.isInteger(u.storage)||u.storage==='shared'||u.storage==='starter';
      if(reusable&&(action==='panel'||['panel:pack','panel:chest'].includes(action))){u.panel=action==='panel'?(u.panel==='chest'?'pack':'chest'):action.slice(6);const source=u.panel==='pack'?p.inventory:this.storageFor(p);u.index=Math.max(0,source?.findIndex(Boolean)??0);u.notice='';return;}
      if(!reusable)u.panel='chest';
      const list=(u.panel==='pack'?p.inventory:this.storageFor(p))||[],occupied=list.map((item,index)=>item?index:-1).filter(index=>index>=0);
      if(['up','prev','down','next'].includes(action)){
        if(reusable){const limit=Math.max(24,Math.ceil(list.length/24)*24),columns=u.storage==='starter'&&u.storageColumns===6?6:4,step=action==='down'?columns:action==='up'?-columns:action==='next'?1:-1;u.index=list.some(Boolean)?(u.index+step+limit)%limit:0;}
        else if(['victory','tv-victory'].includes(u.storage)){const limit=Math.max(24,Math.ceil(list.length/24)*24),step=action==='down'?6:action==='up'?-6:action==='next'?1:-1;u.index=list.some(Boolean)?(u.index+step+limit)%limit:0;}
        else {const at=occupied.indexOf(u.index),step=['up','prev'].includes(action)?-1:1;u.index=occupied[(at<0?(step>0?0:occupied.length-1):(at+step+occupied.length)%occupied.length)]??0;}
        return;
      }
      if(action==='panel'||action.startsWith('panel:'))return;
      if(action==='lootAll'){for(const index of occupied){u.index=index;this.inventoryAction(p,'use');}return;}
      if(action==='use')action='store';
    }
    if (u.shop === 'vending' && !['use','collect','offhand','panel','next','prev','down','up','close'].includes(action)) return;
    delete u.tab; // Old category selections must not hide or disable saved items.
    if(robotShopAction(this,p,action))return;
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
    if(this.phase==='lobby'&&((!canDropInventoryItem(this,p)&&(['drop','dropOne'].includes(action)||(action==='store'&&!this.storageFor(p))))||(['use','equip'].includes(action)&&p.inventory[u.index]?.type==='trap'&&u.panel==='pack'))){u.notice='Use this item in an expedition.';return;}
    if(p.salvageHold)p.salvageHold={latched:true};
    u.salvagePointer=false;
    if(socketAction(this,p,action))return;
    if(u.panel==='quiver'){u.panel='gear';u.index=SLOTS.indexOf('head');}
    if(action.startsWith('quiver:')||action==='panel:quiver')return;
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
      const orders = (p.vendingOrders || []).filter(o => o.owner === (this.shopOwner(p)?.profileId || this.shopOwner(p)?.id));
      if (action === "offhand" || action === "collect") {
        const selected = u.vendingView === 'tray' ? u.vendingOrderId : undefined;
        const collected = this.collectVending(p, selected);
        if (collected) {
          const remaining=(p.vendingOrders||[]).find(o=>o.owner===(this.shopOwner(p)?.profileId||this.shopOwner(p)?.id)&&o.ready);
          if (u.vendingView==='tray'&&remaining) u.vendingOrderId=remaining.id;
          else { u.vendingView='catalog'; delete u.vendingOrderId; }
        }
      } else if (u.vendingView === 'tray') {
        if (this.collectVending(p, u.vendingOrderId)) {
          const remaining=(p.vendingOrders||[]).find(o=>o.owner===(this.shopOwner(p)?.profileId||this.shopOwner(p)?.id)&&o.ready);
          if (remaining) u.vendingOrderId=remaining.id;
          else { u.vendingView='catalog'; delete u.vendingOrderId; }
        }
      } else this.purchaseVending(p, u.index % 12);
      return;
    }
    if (u.shop === 'vending' && ['panel','next','prev','down','up'].includes(action)) {
      const owner = this.shopOwner(p), orders = (p.vendingOrders || []).filter(o => o.owner === (owner?.profileId || owner?.id));
      const ready = orders.filter(o => o.ready);
      u.vendingView ||= 'catalog';
      if (action === 'panel' || (u.vendingView === 'catalog' && (action === 'down' || action === 'up') && ready.length)) {
        u.vendingView = u.vendingView === 'tray' ? 'catalog' : 'tray';
        if (u.vendingView === 'tray') u.vendingOrderId = ready[0]?.id;
        else delete u.vendingOrderId;
        return;
      }
      if (u.vendingView === 'tray') {
        if (!ready.length) { u.vendingView='catalog'; delete u.vendingOrderId; return; }
        if (action === 'up') { u.vendingView='catalog'; delete u.vendingOrderId; return; }
        const i = Math.max(0, ready.findIndex(o => o.id === u.vendingOrderId));
        const step = action === 'next' || action === 'down' ? 1 : action === 'prev' || action === 'up' ? -1 : 0;
        u.vendingOrderId = ready[(i + step + ready.length) % ready.length].id;
        return;
      }
      const limit = 12, step = action === 'next' ? 1 : action === 'prev' ? -1 : action === 'down' ? 3 : -3;
      u.index = (u.index + step + limit) % limit;
      return;
    }
    if (u.shop === 'vending' && action !== 'close') return;
    if (u.shop && action === "use") {
      u.notice =
        u.shop === "robot"
          ? sellStack(p, u.index, (this.shopOwner(p).robotStock ||= []))
            ? "Sold for gold."
            : "Select an item to sell."
          : "Choose a vending slot to purchase.";
      if(u.shop==='robot'&&!p.inventory[u.index])u.index=Math.max(0,p.inventory.findIndex(Boolean));
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
    if(u.panel==='pack'&&!u.shop&&['next','prev','down','up'].includes(action)){
      const step=action==='next'?1:action==='prev'?-1:action==='down'?6:-6;
      if(action==='up'&&u.index<6){switchPanel('gear');u.index=SLOTS.indexOf('feet');}
      else u.index=(u.index+step+24)%24;
    }else if(u.panel==='gear'&&['next','prev','down','up'].includes(action)){
      if(action==='down'&&SLOTS[u.index]==='feet'){switchPanel('pack');u.index=0;}
      else u.index=SLOTS.indexOf(equipmentNeighbor(SLOTS[u.index],action));
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
        if(item?.type?.startsWith('caught_')){
          if(['caught_grave_moth','caught_crypt_beetle'].includes(item.type)){
            if(!releaseGraveyardCritter(this,p,u.index))u.notice='Release this cemetery critter on open graveyard ground.';
          }else releaseCritter(this,p,u.index);
        }
        else if(item?.type==='arrow')u.notice='Arrows are used automatically when you fire a bow.';
        else if (item?.type === "stamina_potion") useStamina(p);
        else if (item?.type === "potion") this.usePotion(p);
        else if (item?.type === "coconut") this.useCoconut(p);
        else if (item?.type === "honeycomb") useHoneycomb(this,p);
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
    if ((action==='drop'||(action==='store'&&!storage&&!u.shop))&&u.panel==='gear'&&canDropInventoryItem(this,p)) {
      let slot=SLOTS[u.index];
      if(p.equipment[slot]==='occupied')slot='hand1';
      const type=p.equipment[slot];
      if(type&&protectedItem(p,type)){u.notice='Unlock this item in Field Kit first.';return;}
      if(type&&ITEMS[type]){
        dropInventoryItem(this,p,type,1,{sockets:p.equipmentSockets?.[slot]});
        p.equipment[slot]=null;
        if(p.equipmentSockets)delete p.equipmentSockets[slot];
        if(ITEMS[type].twoHanded)p.equipment.hand2=null;
        refreshVitals(p);u.notice=ITEMS[type].name+' dropped on the ground.';
      }
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
        dropInventoryItem(
          this,p,
          item.type,
          action === "dropOne" ? 1 : item.qty,
          item,
        );
        if (action === "dropOne" && item.qty > 1) item.qty--;
        else clearSlot(p.inventory, u.index);
      }
    }
    this.persist();
  },
  tickAdventure(dt, inputs) {
    tickOldWells(this,dt);
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
      const i = playerInput(this.players,p,inputs),
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
      if (!p.room && !p.ui && p.hp > 0 && !isCharmed(p)) {
        for (const door of this.portals) {
          if(door.autoEnter===false||door.oldWell)continue;
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
      if(isCharmed(p)){tickSalvage(this,p,false,dt);p.charge=0;p.previousInput={};continue;}
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
          "sockets",
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
        if(oldWellRoomStep(this,p,i,dt)||templeRoomStep(this,p,i,dt)){p.previousInput={...i};continue;}
        tickStorageRoom(this,p,i,dt,edge('interact'));
      } else if (!p.consumeInput) {
        if(this.openingBoard)faceOpeningBoard(p);else if (!p.sleeping) updateAimFacing(p, i);
        p.bowAiming = !!i.block && hasAimWeapon(p) && !p.swimming && !p.sleeping && !this.openingBoard;
        updateBowAimBlend(p,this.openingBoard?{}:i,dt);
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
        const sealPriority = this.phase === 'play' && p.progress >= 48 && dist(p, {x:800,y:800}) < 120;
        if (sealPriority && i.interact) {
          p.sealHold = (p.sealHold || 0) + dt;
          if (p.sealHold >= rules.sealHold) this.beginSeal(p);
        } else p.sealHold = 0;
        if(p.swimming){p.charge=0;delete p.queuedAttack;}
        if(this.openingBoard&&edge('attack')){this.attack(p);p.charge=0;}
        if(!sealPriority&&!this.openingBoard&&edge('interact')&&openNpcDialogue(this,p)){p.interactUsed=true;p.doodadAttackConsumed=true;}
        if (!sealPriority && !this.openingBoard && (edge('interact') || (p.device?.startsWith('pad:') && edge('attack')&&!canHitEventTestBoard(this,p))) && !this.nearbyLoot(p) && !this.nearbyArrow(p)) {
          const opened = !!p.ui||openNpcDialogue(this,p)||interactOldWell(this,p)||openMerchant(this,p)||openSupplyChest(this,p)||toggleDoor(this,p)||interactIce(this,p);
          if(opened){p.interactUsed=true;p.charge=0;p.doodadAttackConsumed=!!i.attack;}
        }
        if(!i.attack&&p.doodadAttackConsumed){p.charge=0;�^���$z{-���jםe_sword: {
    name: "Crypt flame sword", base: "sword", slot: "hand1", stack: 1,
    rarity: "unique", bossOnly: true, damage: 32, reach: 76,
    color: "#d4bea0", artColor: "#d4bea0", flamingSword: true,
    meleeBurn: { duration: 2, damage: 3 },
    description: "Unique crypt boss gear. Warm steel and restless embers. Landed melee hits burn enemies for 2 seconds (3 damage every half-second); struck trees burn down into normal timber. Misses leave no fire.",
  },
  starter_shield: {
    base: "shield",
    name: "Starter shield",
    slot: "hand2",
    armor: 1,
    color: "#849e7e",
    description: "A simple starter shield.",
  },
  bow: {
    name: "Reed bow",
    slot: "hand1",
    twoHanded: true,
    damage: 18,
    color: "#d9b77c",
    description: "Uses both hands. Hold attack to draw, release to shoot.",
  },
  starter_bow: {
    base: "bow",
    name: "Starter bow",
    slot: "hand1",
    twoHanded: true,
    damage: 14,
    color: "#c6a46c",
    description: "A simple bow with starter arrows in the lobby chest.",
  },
  hat: { name: "Scout hat", slot: "head", armor: 2, color: "#ceb379" },
  santa_hat: { name: "Santa hat", slot: "head", armor: 2, color: "#e45b5b", style: "santa", description: "A bright winter cap with a snowy pom-pom." },
  krampus_whip: { name: "Krampus's whip", base: "sword", slot: "hand1", damage: 29, reach: 112, color: "#d35b54", style: "whip", description: "A braided lash that coils, unfurls and cracks through a wide arc." },
  shoulder_armor: {
    name: "Leather shoulder guards",
    slot: "shoulders",
    armor: 2,
    color: "#997044",
    description: "A pair of fitted leather pauldrons.",
  },
  armor: { name: "Bark vest", slot: "chest", armor: 4, color: "#997d50" },
  gloves: {
    name: "Thorned gloves",
    slot: "gloves",
    armor: 1,
    punch: 8,
    color: "#9fc27b",
    description: "+8 unarmed damage.",
  },
  pants: { name: "Trail trousers", slot: "pants", armor: 2, color: "#809e94" },
  boots: {
    name: "Vine boots",
    slot: "feet",
    armor: 2,
    rootResist: true,
    color: "#7fac69",
    description: "Resist the biting plant’s root slow.",
  },
  cape: { name: "Traveller cape", slot: "cape", armor: 2, color: "#985bad" },
  // Keeper reference rewards. keeper_band retains its save ID but is an amulet.
  keeper_crown: {name:'Crown of Second Growth',base:'hat',slot:'head',style:'horned',armor:4,magnet:8,stack:1,rarity:'rare',questReward:true,color:'#68aaff',artColor:'#493e49',description:'A crown of dead branching wood, hung with cyan beads and amber keepsakes.'},
  keeper_robes: {name:'Cloak of Many Paths',base:'armor',slot:'chest',style:'robe',armor:6,stack:1,rarity:'rare',questReward:true,color:'#68aaff',artColor:'#087b79',description:'Layered teal robes with red binding, a high wrapped collar and hanging parchment story charms.'},
  keeper_sash: {name:'Sash of Remnants',base:'pants',slot:'pants',style:'plain',armor:4,stack:1,rarity:'rare',questReward:true,color:'#68aaff',artColor:'#163f43',description:'A dark leather belt of pockets, with a warm gold buckle and teal, red-bound parchment panels.'},
  keeper_staff: {name:'Staff of Returning',base:'staff',slot:'hand1',eitherHand:true,magic:true,damage:20,manaCost:10,stack:1,rarity:'rare',questReward:true,color:'#68aaff',artColor:'#493e49',description:'A one-handed dark branch staff with an amber tip and dangling bells. Uses the normal staff healing and melee abilities.'},
  keeper_blade: {name:'Blade of Quiet Futures',base:'sword',slot:'hand1',damage:28,reach:76,stack:1,rarity:'rare',questReward:true,color:'#68aaff',artColor:'#a5e4ed',description:'A cyan-silver longsword with a dark branching guard and amber pommel. Can be equipped in either hand.'},
  keeper_band: {name:'Amulet of Open Doors',base:'charm',slot:'neck',armor:2,magnet:12,stack:1,rarity:'rare',questReward:true,color:'#68aaff',artColor:'#40cbe6',description:'A bright cyan gemstone pendant in a dark engraved setting, suspended from a gold chain.'},
  wand: {
    name: "Glimmer wand",
    slot: "hand1",
    magic: true,
    damage: 22,
    manaCost: 12,
    color: "#90baff",
    description:
      "Release attack to cast 7 squares. Hold for a larger, harder-hitting bolt; range and speed stay fixed.",
  },
  staff: {
    name: "Ashen staff", slot: "hand1", magic: true, damage: 18, manaCost: 10,
    color: "#9d7cc8", description: "Heals allies at range; strikes enemies up close or when mana is empty.",
  },
  starter_wand: {
    base: "wand",
    name: "Starter wand",
    slot: "hand1",
    magic: true,
    damage: 16,
    manaCost: 10,
    color: "#86b5df",
    description: "A simple wand for learning to cast.",
  },
  necromancer_wand: {
    base: "wand",
    name: "Necromancer wand",
    slot: "hand1",
    magic: true,
    damage: 24,
    manaCost: 12,
    color: "#9b7bd4",
    artColor: "#cf8cff",
    rarity: "unique",
    description: "Set piece · channels the bond with a summoned skeleton.",
  },
  necromancer_dagger: {
    base: "dagger",
    name: "Necromancer dagger",
    slot: "hand1",
    damage: 22,
    light: true,
    color: "#8fd3bd",
    artColor: "#b36de0",
    rarity: "unique",
    description: "Set piece · its edge carries a whisper from beyond the veil.",
  },
  friendship_wand: { name: "Friendship wand", slot: "hand1", magic: true, friendship: true, damage: 1, manaCost: 0, rarity: "gm", gmOnly: true, color: "#ff8fc8", artColor: "#ffb4df", description: "GM item · hearts turn a struck enemy into your ally until it dies." },
  sword_of_a_thousand_truths: { name: "Sword of a Thousand Truths", slot: "hand1", damage: 1000, rarity: "gm", gmOnly: true, color: "#ff8fc8", artColor: "#fff0ff", truthSword: true, description: "GM item · enormous, glowing, and leaves a truth trail on every swing." },
  fire_wand: {
    base: "wand",
    name: "Cinder wand",
    slot: "hand1",
    magic: true,
    spellType: "fire",
    damage: 28,
    manaCost: 14,
    color: "#f18b45",
    artColor: "#ff7938",
    rarity: "unique",
    style: "flame",
    variant: 1,
    description:
      "Fireballs ignite enemies for 2 seconds, dealing damage over time.",
  },
  ice_wand: {
    base: "wand", name: "Frost wand", slot: "hand1", magic: true,
    spellType: "ice", damage: 24, manaCost: 14, color: "#9beaff",
    artColor: "#7edcff", rarity: "unique", variant: 2,
    description: "Ice bolts have a chance to freeze enemies on hit.",
  },
  charm: {
    name: "Amber charm",
    slot: "neck",
    magnet: 30,
    color: "#ffcc6c",
    description:
      "An amber pendant; attracts supplies from farther away. Worn around the neck.",
  },
};
export const RARITIES = {
  common: "#d2d8d2",
  uncommon: "#79d88b",
  rare: "#68aaff",
  unique: "#c58bfa",
  legendary: "#ffad4f",
  gm: "#ff8fc8",
};
ITEMS.mystery_score={name:'Stolen organ score',stack:1,color:'#e9d8aa',description:'A mystery clue. Return to the phantom organ beside the board.'};
for(const [id,name,bonus]of [['gallery_medallion','Gallery detective medallion',{armor:3}],['phantom_charm','Phantom melody charm',{maxMana:25}],['miners_keepsake','Miner’s lucky keepsake',{damageBonus:4}]])ITEMS[id]={name,base:'charm',slot:'neck',stack:1,rarity:'unique',color:'#c58bfa',artColor:({gallery_medallion:'#d1b16c',phantom_charm:'#72c9c0',miners_keepsake:'#db9662'})[id],...bonus,description:'Special reward for solving a two-part mystery.'};
const gearVariants = [
  ['tattered_cape','Wayfarer’s tattered cape','cape','rare','#aa6855',{armor:4},'tattered'],
  ['short_cape','Scout’s half cape','cape','common','#579f91',{armor:2},'short'],
  ['pointed_cape','Swiftwing pointed cape','cape','rare','#597fac',{armor:4},'pointed'],
  [
    "cinder_wand",
    "Cinder wand",
    "wand",
    "unique",
    "#ff7938",
    { damage: 28, manaCost: 14, spellType: "fire" },
    "flame",
  ],
  [
    "storm_wand",
    "Stormglass wand",
    "wand",
    "rare",
    "#80dfea",
    { damage: 32, manaCost: 15 },
    "crystal",
  ],
  [
    "violet_wand",
    "Violet star wand",
    "wand",
    "unique",
    "#d08af4",
    { damage: 40, manaCost: 18 },
    "star",
  ],
  [
    "sun_wand",
    "Sunheart wand",
    "wand",
    "legendary",
    "#ffc164",
    { damage: 52, manaCost: 20 },
    "sun",
  ],
  [
    "moss_cape",
    "Mossweave cape",
    "cape",
    "rare",
    "#579f7e",
    { armor: 4 },
    "leaf",
  ],
  [
    "night_cape",
    "Nightfall cape",
    "cape",
    "unique",
    "#7869bd",
    { armor: 6 },
    "night",
  ],
  [
    "dawn_cape",
    "Dawnkeeper cape",
    "cape",
    "legendary",
    "#d3a46a",
    { armor: 8 },
    "gold",
  ],
  ["linen_cap", "Linen cap", "hat", "common", "#baa988", { armor: 1 }, "cap"],
  [
    "leather_hood",
    "Tracker hood",
    "hat",
    "rare",
    "#4d8e7c",
    { armor: 4, magnet: 8 },
    "hood",
  ],
  [
    "moon_circlet",
    "Moon circlet",
    "hat",
    "unique",
    "#ad86d0",
    { armor: 5, magnet: 18 },
    "circlet",
  ],
  [
    "horned_helm",
    "Horned crown",
    "hat",
    "legendary",
    "#a5a6bc",
    { armor: 8, punch: 5 },
    "horned",
  ],
  [
    "iron_coif",
    "Iron coif",
    "hat",
    "common",
    "#9ca9a5",
    { armor: 3 },
    "helmet",
  ],
  [
    "jungle_mask",
    "Jungle mask",
    "hat",
    "rare",
    "#628554",
    { armor: 4, poisonResist: 1 },
    "mask",
  ],
  [
    "moon_helm",
    "Moonsteel helm",
    "hat",
    "unique",
    "#9baacb",
    { armor: 6 },
    "fullhelm",
  ],
  [
    "sun_crown",
    "Sun crown",
    "hat",
    "legendary",
    "#e8b84e",
    { armor: 8, punch: 3 },
    "crown",
  ],
  [
    "fern_pauldron",
    "Fern pauldrons",
    "shoulder_armor",
    "rare",
    "#5d9365",
    { armor: 4, rootResist: true },
    "leaf",
  ],
  [
    "moon_shoulders",
    "Moonsteel pauldrons",
    "shoulder_armor",
    "unique",
    "#9294c9",
    { armor: 6 },
    "moon",
  ],
  [
    "sun_shoulders",
    "Sunforged pauldrons",
    "shoulder_armor",
    "legendary",
    "#d6a346",
    { armor: 8, poisonResist: 1 },
    "sun",
  ],
  [
    "linen_shirt",
    "Linen shirt",
    "armor",
    "common",
    "#bfb292",
    { armor: 2 },
    "shirt",
  ],
  [
    "hunter_coat",
    "Hunter coat",
    "armor",
    "rare",
    "#54846e",
    { armor: 6 },
    "coat",
  ],
  [
    "sun_plate",
    "Sunforged plate",
    "armor",
    "unique",
    "#c9a159",
    { armor: 8, punch: 3 },
    "plate",
  ],
  [
    "ember_robe",
    "Ember robe",
    "armor",
    "legendary",
    "#b9584f",
    { armor: 10, poisonResist: 1 },
    "robe",
  ],
  [
    "cloth_wraps",
    "Hand wraps",
    "gloves",
    "common",
    "#c6b89b",
    { armor: 1, punch: 2 },
    "wraps",
  ],
  [
    "iron_gauntlets",
    "Iron gauntlets",
    "gloves",
    "rare",
    "#7da6b3",
    { armor: 3, punch: 7 },
    "gauntlets",
  ],
  [
    "thorn_fists",
    "Briar fists",
    "gloves",
    "unique",
    "#658d47",
    { armor: 3, punch: 12 },
    "spiked",
  ],
  [
    "sun_grips",
    "Sun grips",
    "gloves",
    "legendary",
    "#dc9d45",
    { armor: 5, punch: 18 },
    "sun",
  ],
  [
    "linen_pants",
    "Linen trousers",
    "pants",
    "common",
    "#ab9c8a",
    { armor: 1 },
    "plain",
  ],
  [
    "ranger_pants",
    "Ranger leggings",
    "pants",
    "rare",
    "#648173",
    { armor: 4 },
    "striped",
  ],
  [
    "scale_pants",
    "Scale leggings",
    "pants",
    "unique",
    "#6d91ad",
    { armor: 6, rootResist: true },
    "scales",
  ],
  [
    "ash_greaves",
    "Ash greaves",
    "pants",
    "legendary",
    "#a36976",
    { armor: 8, poisonResist: 1 },
    "plated",
  ],
  [
    "sandals",
    "Trail sandals",
    "boots",
    "common",
    "#b09165",
    { armor: 1 },
    "sandals",
  ],
  [
    "ranger_boots",
    "Ranger boots",
    "boots",
    "rare",
    "#487764",
    { armor: 3, rootResist: true },
    "tall",
  ],
  [
    "moon_steps",
    "Moon steps",
    "boots",
    "unique",
    "#9577b5",
    { armor: 4, magnet: 12 },
    "moon",
  ],
  [
    "volcano_boots",
    "Volcano boots",
    "boots",
    "legendary",
    "#c17745",
    { armor: 6, rootResist: true, poisonResist: 1 },
    "flame",
  ],
  [
    "iron_sword",
    "Iron longsword",
    "sword",
    "rare",
    "#a5bccb",
    { damage: 30 },
    "long",
  ],
  [
    "moon_blade",
    "Moon blade",
    "sword",
    "unique",
    "#b399e0",
    { damage: 37 },
    "crescent",
  ],
  [
    "sun_blade",
    "Sunbreaker",
    "sword",
    "legendary",
    "#f2bd61",
    { damage: 46 },
    "broad",
  ],
  [
    "bone_dagger",
    "Bone knife",
    "dagger",
    "rare",
    "#d1c6a5",
    { damage: 21 },
    "bone",
  ],
  [
    "thorn_dagger",
    "Thorn fang",
    "dagger",
    "unique",
    "#7fab64",
    { damage: 28 },
    "hook",
  ],
  [
    "star_dagger",
    "Star fang",
    "dagger",
    "legendary",
    "#83c9d4",
    { damage: 35 },
    "star",
  ],
  [
    "iron_shield",
    "Iron kite shield",
    "shield",
    "rare",
    "#91a8b4",
    { armor: 5 },
    "kite",
  ],
  [
    "moon_shield",
    "Moonward",
    "shield",
    "unique",
    "#9872b3",
    { armor: 7 },
    "round",
  ],
  [
    "sun_shield",
    "Sunwall",
    "shield",
    "legendary",
    "#e4b665",
    { armor: 10 },
    "tower",
  ],
  [
    "hunter_bow",
    "Hunter longbow",
    "bow",
    "rare",
    "#72957a",
    { damage: 25 },
    "longbow",
  ],
  [
    "moon_bow",
    "Moonstring",
    "bow",
    "unique",
    "#ac8bd3",
    { damage: 32 },
    "recurve",
  ],
  [
    "sun_bow",
    "Dawnbreak bow",
    "bow",
    "legendary",
    "#e8b75b",
    { damage: 40 },
    "winged",
  ],
];
for (const [id, name, base, rarity, artColor, stats, style] of gearVariants)
  ITEMS[id] = {
    ...ITEMS[base],
    ...stats,
    name,
    base,
    rarity,
    artColor,
    color: RARITIES[rarity],
    style,
    description: "",
    variant: gearVariants.findIndex((v) => v[0] === id) + 1,
  };
export const SAFARI_HUNTER_SET = Object.freeze({
  head: "safari_hat", shoulders: "safari_shoulders", chest: "safari_vest",
  gloves: "safari_gloves", pants: "safari_pants", feet: "safari_boots",
});
for (const [slot, id] of Object.entries(SAFARI_HUNTER_SET)) {
  const base = { head: "hat", shoulders: "shoulder_armor", chest: "armor",
    gloves: "gloves", pants: "pants", feet: "boots" }[slot];
  ITEMS[id] = {
    name: { head: "Safari pith helmet", shoulders: "Safari epaulettes",
      chest: "Safari pocket vest", gloves: "Safari leather gloves",
      pants: "Safari cargo trousers", feet: "Safari field boots" }[slot],
    base, slot, stack: 1, armor: slot === "chest" ? 3 : 1,
    set: "safari_hunter", style: "safari", rarity: "common",
    color: "#c7b17a", artColor: ["gloves", "feet"].includes(slot) ? "#836044" : "#c7b17a",
    description: "Safari hunter set · individually equippable field gear.",
  };
}
export const RANGER_SET=['ranger_hood','ranger_jacket','ranger_bracers','ranger_trailboots','ranger_quiver'];
for(const [id,name,base,slot,stats] of [
 ['ranger_hood','Ranger hood','hat','head',{bowDamage:.10}],
 ['ranger_jacket','Ranger jacket','armor','chest',{armor:3,bowDamage:.10}],
 ['ranger_bracers','Ranger bracers','gloves','gloves',{bowDrawSpeed:.25}],
 ['ranger_trailboots','Ranger trail boots','boots','feet',{speedBonus:.08,arrowSpeed:.15}],
 ['ranger_quiver','Ranger quiver','quiver','back',{bowDrawSpeed:.2,arrowSpeed:.1}],
])ITEMS[id]={name,base,slot,stack:1,rarity:'rare',color:'#79a56b',artColor:'#789253',set:'ranger',...stats,description:`${base==='quiver'?'Back-slot quiver · arrows travel 10% faster · bow charges 20% faster. Ranger set · 3 pieces: three-arrow spread for one arrow. 5 pieces: Tame companion (R / RB).':'Ranger set · 3 pieces: three-arrow spread for one arrow. 5 pieces: Tame companion (R / RB).'}`};
ITEMS.leather_quiver={name:'Leather quiver',base:'quiver',slot:'back',stack:1,rarity:'common',color:'#b68a5d',artColor:'#9d724d',bowDrawSpeed:.2,arrowSpeed:.1,description:'Back-slot archery gear · arrows travel 10% faster · bow charges 20% faster.'};
ITEMS.starter_quiver={name:'Starter quiver',base:'quiver',slot:'back',stack:1,rarity:'common',color:'#b68a5d',artColor:'#9d724d',bowDrawSpeed:.2,arrowSpeed:.1,description:'Back-slot archery gear · arrows travel 10% faster · bow charges 20% faster. Uses ordinary arrows automatically.'};
// Enemy costume pieces use the same fitted humanoid equipment system. They are
// deliberately outside random loot pools; the warlock's existing rewards stay intact.
export const WARLOCK_EQUIPMENT=Object.freeze({head:'warlock_hood',neck:'warlock_sigil',shoulders:'warlock_mantle',chest:'warlock_robe',gloves:'warlock_gloves',pants:'warlock_trousers',feet:'warlock_boots',cape:'warlock_cape',hand1:'warlock_staff'});
for(const [slot,id]of Object.entries(WARLOCK_EQUIPMENT)){
 const base={head:'hat',neck:'charm',shoulders:'shoulder_armor',chest:'armor',gloves:'gloves',pants:'pants',feet:'boots',cape:'cape',hand1:'staff'}[slot];
 ITEMS[id]={name:{head:'Warlock cowl',neck:'Gravebound sigil',shoulders:'Bone mantle',chest:'Warlock ritual robe',gloves:'Ritual gloves',pants:'Warlock trousers',feet:'Gravewalker boots',cape:'Warlock vestment',hand1:'Warlock skull staff'}[slot],base,slot,stack:1,npcOnly:true,warlockGear:true,rarity:'unique',color:'#a176c1',artColor:{head:'#593568',neck:'#81ceb1',shoulders:'#bdb394',chest:'#5d396f',gloves:'#393047',pants:'#35293f',feet:'#382d39',cape:'#432952',hand1:'#ac9270'}[slot],style:{head:'hood',chest:'robe',gloves:'wraps',feet:'tall',cape:'tattered'}[slot],description:'Custom equipment worn by the purple warlock. Not part of random loot.',...(slot==='hand1'?{magic:true,damage:18,manaCost:10}:{})};
}
// Rare discoveries unique to supply chests in each environment.
for(const [id,name,color,bonus,description] of [
 ['fern_pendant','Fern pendant','#8fb779',{armor:2},'Woodland charm · +2 armor.'],
 ['sunstone_pendant','Sunstone pendant','#d7b568',{bowDamage:.08},'Desert charm · +8% bow damage.'],
 ['snowflake_pendant','Snowflake pendant','#b5e5ef',{armor:3},'Winter charm · +3 armor.'],
 ['hearth_pendant','Hearth pendant','#c99777',{bowDrawSpeed:.12},'Homestead charm · 12% faster bow draw.'],
 ['jade_pendant','Jade pendant','#83d4b9',{arrowSpeed:.12},'Temple charm · 12% faster arrows.'],
])ITEMS[id]={name,base:'charm',slot:'neck',stack:1,rarity:'uncommon',color,artColor:color,...bonus,description,supplyOnly:true};
// Five distinct Queen drops. The remaining outfit pieces are enemy costume only.
export const BANSHEE_SET=Object.freeze(['banshee_bow','banshee_quiver','banshee_hood','banshee_cape','banshee_shoulders']);
export const SUCCUBUS_DROPS=Object.freeze(['succubus_horns','succubus_whip','succubus_wings']);
ITEMS.imp_horns={name:'Imp bone horns',base:'hat',slot:'head',color:'#d6bd87',artColor:'#d6bd87',style:'succubus_horns',hornsPalette:{ink:'#382325',base:'#b39164',light:'#e9d3a1',trim:'#8c493b'},stack:1,rarity:'unique',npcOnly:true};
ITEMS.imp_wings={name:'Imp ember wings',base:'shoulder_armor',slot:'shoulders',color:'#c54e3a',artColor:'#c54e3a',style:'bat_wings',humanoidWings:true,wingPalette:{ink:'#401c29',base:'#b63d38',dark:'#702939',light:'#ef8251',bone:'#dba475'},stack:1,rarity:'unique',npcOnly:true};
export const SUCCUBUS_EQUIPMENT=Object.freeze({head:'succubus_horns',hand1:'succubus_whip',shoulders:'succubus_wings',chest:'succubus_cuirass',gloves:'succubus_bracers',pants:'succubus_legguards',feet:'succubus_boots'});
for(const [id,name,base,slot,color,style,stats]of [
 ['succubus_horns','Succubus horn crown','hat','head','#873f54','succubus_horns',{armor:3,description:'Curved crimson horns on a gilded headband. Dropped by succubi.'}],
 ['succubus_whip','Succubus thorn whip','sword','hand1','#974863','whip',{damage:25,reach:112,description:'A rose-braided lash with a long, snapping reach. Does not charm players.'}],
 ['succubus_wings','Succubus wings','shoulder_armor','shoulders','#564065','bat_wings',{armor:2,humanoidWings:true,wingShape:'upright',wingFlight:true,description:'Hold Jump to rise and hover on articulated bat wings. Release to descend. Worn in the shoulder slot; no tail.'}],
 ['succubus_cuirass','Velvet cuirass','armor','chest','#443343','plate',{armor:2,npcOnly:true}],
 ['succubus_bracers','Gilded bracers','gloves','gloves','#b79562','gauntlets',{npcOnly:true}],
 ['succubus_legguards','Velvet legguards','pants','pants','#3a2939','plated',{npcOnly:true}],
 ['succubus_boots','Velvet boots','boots','feet','#312535','tall',{npcOnly:true}],
])ITEMS[id]={name,base,slot,color,artColor:color,style,stack:1,rarity:'unique',...stats,...(SUCCUBUS_DROPS.includes(id)?{bossOnly:true}:{})};
export const BANSHEE_EQUIPMENT=Object.freeze({hand1:'banshee_bow',hand2:'occupied',back:'banshee_quiver',head:'banshee_hood',cape:'banshee_cape',shoulders:'banshee_shoulders',chest:'banshee_cuirass',gloves:'banshee_bracers',pants:'banshee_legguards',feet:'banshee_boots'});
for(const [id,name,base,slot,color,style,stats] of [
 ['banshee_bow','Banshee frost bow','bow','hand1','#8dafbf','recurve',{damage:30,ranged:true,twoHanded:true}],
 ['banshee_quiver','Banshee quiver','quiver','back','#453349','bone',{bowDrawSpeed:.2,arrowSpeed:.1}],
 ['banshee_hood','Banshee hood','hat','head','#5c3046','banshee',{armor:3}],
 ['banshee_cape','Banshee torn cape','cape','cape','#382534','tattered',{armor:2}],
 ['banshee_shoulders','Banshee skull shoulders','shoulder_armor','shoulders','#7a8d99','skulls',{armor:3}],
 ['banshee_cuirass','Queen\u2019s cuirass','armor','chest','#453445','banshee',{armor:4}],
 ['banshee_bracers','Queen\u2019s bracers','gloves','gloves','#403344','gauntlets',{}],
 ['banshee_legguards','Queen\u2019s legguards','pants','pants','#352c39','plated',{}],
 ['banshee_boots','Queen\u2019s armored boots','boots','feet','#352c39','tall',{}],
])ITEMS[id]={name,base,slot,artColor:color,color,style,stack:1,rarity:'unique',bansheeGear:true,...stats,...(BANSHEE_SET.includes(id)?{bossOnly:true,description:'Banshee set \u00b7 dropped by the Banshee Queen. 2 pieces: arrows have a 20% freeze chance (1.5s). 5 pieces: cosmetic icy footsteps.'}:{npcOnly:true,description:'Custom fitted armor worn by the Banshee Queen.'})};
export const GEAR_SETS={
 banshee:{name:'Banshee',groups:BANSHEE_SET.map(id=>[id]),two:{arrowFreezeChance:.2},three:{},full:{icySteps:1},twoText:'Your arrows have a 20% chance to freeze enemies for 1.5 seconds',fullText:'Icy footprints follow your steps (cosmetic only)'},
 ranger:{name:'Ranger',groups:RANGER_SET.map(id=>[id]),three:{arrowVolley:2},full:{},skills:['tame_pet'],threeText:'Fire three arrows in a spread for one arrow',fullText:'Tame a lion, wolf, bat, panther, or tiger with R / RB. Your companion stays when gear is removed.'},
 moon:{name:'Moonbound',groups:[['moon_circlet','moon_helm'],['moon_shoulders'],['moon_steps'],['moon_blade','moon_bow','moon_shield']],three:{maxMana:30},full:{manaRegen:4,manaDiscount:.25,castHeal:3},threeText:'+30 maximum mana',fullText:'Lunar grace: 25% cheaper spells, +4 mana/sec, heal 3 on each cast'},
 safari_hunter:{name:'Safari hunter',groups:Object.values(SAFARI_HUNTER_SET).map(id=>[id]),three:{maxHp:25},full:{hpRegen:1,speedBonus:.12},threeText:'+25 maximum health',fullText:'Trail vitality: regenerate 1 health/sec and move 12% faster'},
 sun:{name:'Sunforged',groups:[['sun_crown'],['sun_shoulders'],['sun_plate'],['sun_grips'],['sun_blade','sun_bow','sun_wand','sun_shield']],three:{maxHp:30},full:{damageBonus:8,hpRegen:2},threeText:'+30 maximum health',fullText:'Solar might: +8 attack damage and regenerate 2 health/sec'},
 necromancer:{name:'Necromancer',groups:[['necromancer_dagger'],['necromancer_wand']],skills:['necromancer_pet'],full:{},fullText:'Complete set: your kills raise one skeleton companion. While it lives, no additional skeletons summon. If it dies, your next kill raises another.'},
};
for(const [set,def] of Object.entries(GEAR_SETS))for(const group of def.groups)for(const id of group)ITEMS[id].set=set;
for(const [id,item] of Object.entries(ITEMS))if(item.slot){
 item.maxHp??=Math.max(0,Number(item.armor)||0)*2;
 if(id.startsWith('moon_'))item.maxMana=id.includes('blade')||id.includes('bow')?20:15;
 // Stackable slotted materials such as sticks are supplies, not gear
 // instances. Only singleton equipment may receive trinket sockets.
 if(item.stack===1&&['sword','dagger','bow','wand','shield','armor','hat','charm'].includes(item.base||id)&&!item.utility)item.sockets??=item.twoHanded?2:1;
}
for(const [id,name,mana,regen,rarity,color] of [['azure_bead','Azure bead',15,0,'common','#70c9ec'],['moon_prism','Moon prism',25,0,'rare','#b49cfa'],['starheart','Starheart',40,0,'unique','#80f4d5'],['mana_rune','Mana rune',0,1,'common','#78d6e8'],['void_sigil','Void sigil',0,2,'rare','#9f82e8'],['astral_heart','Astral heart',0,3,'unique','#e48cff']])ITEMS[id]={name,base:'trinket',trinket:true,maxMana:mana,manaRegen:regen,stack:1,rarity,color,artColor:color,description:`Socket into compatible gear: +${regen?regen+' mana/sec':mana+' maximum mana'}. No bonus while loose in your bag.`};
export const socketCount=type=>ITEMS[type]?.slot&&!ITEMS[type]?.trinket?Math.max(0,Math.min(3,Math.floor(Number(ITEMS[type].sockets)||0))):0;
export function setProgress(p,id){const def=GEAR_SETS[id];if(!def)return null;const worn=new Set(Object.values(p.equipment||{}));const checks=def.groups.map(group=>({ids:group,equipped:group.some(type=>worn.has(type))}));const count=checks.filter(g=>g.equipped).length;return {...def,id,checks,count,complete:count===checks.length};}
export function setStat(p,key){let n=0;for(const id of Object.keys(GEAR_SETS)){const s=setProgress(p,id);if(s.count>=2)n+=s.two?.[key]||0;if(s.count>=3)n+=s.three?.[key]||0;if(s.complete)n+=s.full[key]||0;}return n;}
export function hasSetSkill(p,skill){return Object.entries(GEAR_SETS).some(([id,def])=>def.skills?.includes(skill)&&setProgress(p,id).complete);}
export function gearStat(type,sockets,key){return (Number(ITEMS[type]?.[key])||0)+(sockets||[]).reduce((n,id)=>n+(ITEMS[id]?.trinket?Number(ITEMS[id][key])||0:0),0);}
export function refreshVitals(p){
 const level=Math.max(1,Number(p.level)||1);p.maxHp=100+(level-1)*8+stat(p,'maxHp');p.maxMana=100+(level-1)*6+stat(p,'maxMana');
 p.hp=Math.min(p.hp??p.maxHp,p.maxHp);p.mana=Math.min(p.mana??p.maxMana,p.maxMana);
}
export function socketTrinket(p,target,index){
 const gear=target.mode==='gear'?{type:p.equipment[target.slot],sockets:p.equipmentSockets?.[target.slot]||[]}:p.inventory[target.index];
 const gem=p.inventory[index];if(!gear||(gear.qty||1)!==1||!ITEMS[gem?.type]?.trinket||(gear.sockets||[]).length>=socketCount(gear.type))return false;
 const gems=[...(gear.sockets||[]),gem.type];
 if(target.mode==='gear'){p.equipmentSockets||={};p.equipmentSockets[target.slot]=gems;}else gear.sockets=gems;
 if(--gem.qty===0)clearSlot(p.inventory,index);refreshVitals(p);return true;
}
export function removeTrinket(p,target,index){
 const type=target.mode==='gear'?p.equipment[target.slot]:p.inventory[target.index]?.type;
 const gems=target.mode==='gear'?p.equipmentSockets?.[target.slot]:p.inventory[target.index]?.sockets;
 if(!type||!gems?.[index]||!give(p.inventory,gems[index]))return false;gems.splice(index,1);refreshVitals(p);return true;
}
for (const skill of SKILLS) ITEMS[skillScrollId(skill.id)] = {
  name:skill.name+' skill scroll',skillScroll:skill.id,stack:1,color:'#edce82',
  description:'Unlocks '+skill.name+' training in the Field Guild when collected. '+skill.detail,
};
for (const [id, item] of Object.entries(ITEMS)) {
  item.base ??= id;
  item.rarity ??= "common";
  item.artColor ??= item.color;
  if (item.slot) item.color = RARITIES[item.rarity];
  if (item.relic) item.color = RARITIES[item.rarity];
}
export const itemKind = (id) => ITEMS[id]?.base || id;
// Preserve non-stackable gear, socketed items and container instances.
for(const [id,item]of Object.entries(ITEMS)){
 if(item.stack>1||id.startsWith('caught_'))item.stack=999;
 if(id.startsWith('caught_'))item.description=(item.description||'A captured critter.')+' Use: release as a follower for this level. Recapture before quitting or it is lost. Salvage: consumes the creature, returns its jar/cage and produces Dark Essence.';
}
export function itemStats(id) {
  const i = ITEMS[id];
  if (!i) return "";
  return [
    i.damage !== undefined ? `Damage ${i.damage}` : "",
    i.reach ? `Melee reach ${i.reach}` : "",
    i.lightSource ? `Light radius ${i.lightSource.radius}` : "",
    i.fire ? "Ignites enemies and trees · melts ice" : "",
    i.meleeBurn ? `Burn ${i.meleeBurn.damage} / 0.5 sec for ${i.meleeBurn.duration} sec · ignites struck trees` : "",
    i.shot ? `Aimed shot · range ${i.shot.range}` : "",
    i.magic ? `Mana ${i.manaCost} per cast` : "",
    i.healingAmount ? `Spell healing ${i.healingAmount}–${i.healingAmount*1.5}` : '',
    i.outgoingSpellHealing ? `Outgoing spell healing +${Math.round(i.outgoingSpellHealing*100)}%` : '',
    i.incomingSpellHealing ? `Incoming spell healing +${Math.round(i.incomingSpellHealing*100)}%` : '',
    i.bowDamage ? `Bow damage +${Math.round(i.bowDamage*100)}%` : '',
    i.bowDrawSpeed ? `Bow draw speed +${Math.round(i.bowDrawSpeed*100)}%` : '',
    i.arrowSpeed ? `Arrow speed +${Math.round(i.arrowSpeed*100)}%` : '',
    i.armor ? `Armor +${i.armor}` : "",
    i.maxHp ? `Health +${i.maxHp}` : '',
    i.maxMana ? `Mana +${i.maxMana}` : '',
    i.manaRegen ? `Mana regen +${i.manaRegen}/sec` : '',
    socketCount(id) ? `${socketCount(id)} trinket socket${socketCount(id)>1?'s':''}` : '',
    i.punch ? `Fists +${i.punch}` : "",
    i.magnet ? `Loot reach +${i.magnet}` : "",
    i.rootResist ? "Root resist" : "",
    i.poisonResist ? "Poison resist" : "",
    i.relic ? "Passive while carried in backpack" : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
export function rollGear(random = Math.random, minTier = null) {
  const r = random(),
    tier = minTier || (r < 0.62 ? "common" : r < 0.9 ? "rare" : "unique");
  const pool = Object.keys(ITEMS).filter(
    (id) => ITEMS[id].slot && !ITEMS[id].supplyOnly && !ITEMS[id].npcOnly && !ITEMS[id].bossOnly && !ITEMS[id].questReward && ITEMS[id].rarity === tier,
  );
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}
export function rollRelic(random = Math.random) {
  const tier = random() < 0.68 ? "rare" : "unique";
  const pool = Object.keys(ITEMS).filter(
    (id) => ITEMS[id].relic && ITEMS[id].rarity === tier,
  );
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}
export const count = (p, id) =>
  p.inventory.filter((i) => i?.type === id).reduce((n, i) => n + i.qty, 0);
const LEGACY_SUPPLIES=Object.freeze({starter_arrow:'arrow',ice_arrow:'arrow',ice_arrow_recipe:'arrow',empty_bottle:'empty_jar',bottle_empty:'empty_jar',empty_cage:'critter_cage'});
export const canonicalItemType=type=>Object.hasOwn(LEGACY_SUPPLIES,type)?LEGACY_SUPPLIES[type]:type;
const canonicalQuantity=(type,qty)=>type==='ice_arrow_recipe'?qty*20:qty;
export function migrateLegacySupplies(list){
  if(!Array.isArray(list))return;
  for(const item of list){
    if(!item)continue;
    item.qty=canonicalQuantity(item.type,item.qty);
    item.type=canonicalItemType(item.type);
    if(item.contents)migrateLegacySupplies(item.contents);
  }
  // Preserve every unrelated saved slot and never discard oversized legacy stacks.
  let target;
  for(let i=0;i<list.length;i++){
    const item=list[i];if(item?.type!=='arrow')continue;
    if(target&&target.qty<ITEMS.arrow.stack){const n=Math.min(item.qty,ITEMS.arrow.stack-target.qty);target.qty+=n;item.qty-=n;if(!item.qty){clearSlot(list,i);continue;}}
    target=item;
  }
}
const itemCaptureContainer=(type,item={})=>critterContainer(type,{captureContainer:item.captureContainer??ITEMS[type]?.captureContainer});
const matchingStack=(item,type,metadata)=>item?.type===type&&(!type.startsWith('caught_')||itemCaptureContainer(type,item)===itemCaptureContainer(type,metadata));
export function canGive(list, type, qty = 1, slots = 24, metadata = {}) {
  qty=canonicalQuantity(type,qty);type=canonicalItemType(type);
  if (!ITEMS[type] || qty <= 0) return false;
  const max = socketCount(type)?1:ITEMS[type].stack || 1;
  const capacity =
    list.reduce((n, i) => n + (matchingStack(i,type,metadata) ? Math.max(0,max - i.qty) : 0), 0) +
    Math.max(0, slots - list.filter(Boolean).length) * max;
  return capacity >= qty;
}
export function give(list, type, qty = 1, slots = 24, metadata = {}) {
  if (!canGive(list, type, qty, slots,metadata)) return false;
  qty=canonicalQuantity(type,qty);type=canonicalItemType(type);
  const max = socketCount(type)?1:ITEMS[type].stack || 1;
  for (const i of list)
    if (matchingStack(i,type,metadata) && i.qty < max) {
      const n = Math.min(qty, max - i.qty);
      i.qty += n;
      if(type==='raw_ice'&&n>0)i.meltRemaining=Math.min(i.meltRemaining??300,metadata.meltRemaining??300);
      qty -= n;
    }
  while (qty > 0) {
    const n = Math.min(qty, max);
    const hole = list.findIndex((i) => !i);
    const item={type,qty:n,...(type.startsWith('caught_')?{captureContainer:itemCaptureContainer(type,metadata)}:{}),...(type==='raw_ice'?{meltRemaining:metadata.meltRemaining??300}:{}),...(metadata.sockets?.length?{sockets:[...metadata.sockets]}:{}),...(ITEMS[type].bag?{contents:structuredClone(metadata.contents||[])}:{})};
    if (hole >= 0) list[hole] = item;
    else list.push(item);
    qty -= n;
  }
  return true;
}
export function take(list, type, qty = 1) {
  if (list.filter((i) => i?.type === type).reduce((n, i) => n + i.qty, 0) < qty)
    return false;
  for (let j = list.length - 1; j >= 0 && qty; j--) {
    const i = list[j];
    if (!i || i.type !== type) continue;
    const n = Math.min(qty, i.qty);
    i.qty -= n;
    qty -= n;
    if (!i.qty) clearSlot(list, j);
  }
  return true;
}
export function fitsSlot(type, slot) {
  const def = ITEMS[type];
  if (!def?.slot || !SLOTS.includes(slot)) return false;
  return (
    slot === def.slot ||
    (def.eitherHand && !def.twoHanded && ["hand1", "hand2"].includes(slot)) ||
    (slot === "hand2" &&
      ((["sword", "dagger"].includes(itemKind(type)) && !def.twoHanded) ||
        itemKind(type) === "wand"))
  );
}
export function equip(p, index, preferred) {
  const item = p.inventory[index],
    def = ITEMS[item?.type];
  if (!def?.slot) return false;
  let slot = preferred || def.slot;
  if (!fitsSlot(item.type, slot)) return false;
  const pack = structuredClone(p.inventory),
    gear = { ...p.equipment },socketGear=structuredClone(p.equipmentSockets||{});
  if (--pack[index].qty === 0) clearSlot(pack, index);
  const clear = new Set([slot]);
  if (
    def.twoHanded ||
    (slot.startsWith("hand") && ITEMS[gear.hand1]?.twoHanded)
  ) {
    clear.add("hand1");
    clear.add("hand2");
  }
  for (const s of clear) {
    if (gear[s] && gear[s] !== "occupied" && !give(pack, gear[s],1,24,{sockets:socketGear[s]})) return false;
    gear[s] = null;
    delete socketGear[s];
  }
  gear[slot] = item.type;
  socketGear[slot]=[...(item.sockets||[])];
  if (def.twoHanded) gear.hand2 = "occupied";
  p.inventory = pack;
  p.equipment = gear;
  p.equipmentSockets=socketGear;refreshVitals(p);
  return true;
}
export function unequip(p, slot) {
  const type = p.equipment[slot];
  if (!type) return false;
  if (type === "occupied") slot = "hand1";
  const id = p.equipment[slot];
  if (!give(p.inventory, id,1,24,{sockets:p.equipmentSockets?.[slot]})) return false;
  if(p.equipmentSockets)delete p.equipmentSockets[slot];
  p.equipment[slot] = null;
  if (ITEMS[id].twoHanded) p.equipment.hand2 = null;
  refreshVitals(p);
  return true;
}
export function transfer(from, to, index, slots = 24) {
  const i = from[index];
  if (!i || !give(to, i.type, i.qty, slots,i)) return false;
  clearSlot(from, index);
  return true;
}
export function stat(p, key) {
  const equipped = Object.entries(p.equipment || {}).reduce(
    (n, [slot,t]) => n + gearStat(t,p.equipmentSockets?.[slot],key),
    0,
  );
  const carriedRelics = (p.inventory || []).reduce((n, item) => {
    const def = ITEMS[item?.type];
    return n + (def?.relic ? (def[key] || 0) * (item.qty || 1) : 0);
  }, 0);
  return equipped + carriedRelics + setStat(p,key);
}
export function freshCharacter(id, name) {
  return {
    id,
    name,
    inventory: [{ type: "trap", qty: 3 }],
    equipment: Object.fromEntries(SLOTS.map((s) => [s, null])),
    chests: [[], [], []],
    robotRepaired: false,
    robotIntroduced: false,
    field: {
      favorites: [],
      loadouts: [],
      access: "shared",
      trap: "snare",
      overflow: [],
      cosmetics: {},
      totals: {},
    },
    chestNames: ["Chest 1", "Chest 2", "Chest 3"],
    level: 1,
    xp: 0,
    coins: 0,
  };
}

export function migrateEquipment(p) {
  for(const list of [p.inventory,...(p.chests||[]),p.starterChest,p.robotStock,p.field?.overflow])migrateLegacySupplies(list);
  if(p.field){delete p.field.quiver;if(p.field.recipes)delete p.field.recipes.ice_arrow;}
  p.equipment ||= {};
  for (const slot of SLOTS) p.equipment[slot] ??= null;
  if (itemKind(p.equipment.cape) === "quiver") {
    if (!p.equipment.back) { p.equipment.back = p.equipment.cape; p.equipment.cape = null; }
    else if (give(p.inventory ||= [], p.equipment.cape, 1, 24)) p.equipment.cape = null;
  }
  if (itemKind(p.equipment.head) === "charm" && !p.equipment.neck) {
    p.equipment.neck = p.equipment.head;
    p.equipment.head = null;
  }
  p.coins = Math.max(0, Math.floor(Number(p.coins) || 0));
}
export const sellValue = (type) =>
  ITEMS[type]?.sellPrice ?? (ITEMS[type]?.slot || ITEMS[type]?.relic
    ? { common: 8, rare: 24, unique: 60, legendary: 150 }[ITEMS[type].rarity] ||
      8
    : { stamina_potion: 5, potion: 3, trap: 2, arrow: 1, fruit: 1, meat: 1 }[
        type
      ] || 1);
export function splitStack(list, index, amount, slots = 24) {
  const item = list[index];
  if (!item || list.filter(Boolean).length >= slots || item.qty < 2)
    return false;
  amount = amount === undefined ? Math.floor(item.qty / 2) : Number(amount);
  if (!Number.isInteger(amount) || amount < 1 || amount >= item.qty)
    return false;
  item.qty -= amount;
  const hole = list.findIndex((i) => !i);
  const split={...structuredClone(item),qty:amount};
  if (hole >= 0) list[hole] = split;
  else list.push(split);
  return true;
}
export function sellStack(p, index, stock = (p.robotStock ||= [])) {
  const item = p.inventory[index];
  if (!item || p.field?.favorites?.includes(item.type)) return false;
  if (!give(stock, item.type, item.qty, 120,item)) return false;
  p.coins = (p.coins || 0) + sellValue(item.type) * item.qty;
  clearSlot(p.inventory, index);
  return true;
}

export function clearSlot(list, index) {
  list[index] = null;
  while (list.length && !list.at(-1)) list.pop();
}
function placeAt(list, index, item) {
  while (list.length <= index) list.push(null);
  list[index] = item;
}
// Work on copies: rejected drops never lose, duplicate or partly move equipment.
export function moveInventoryItem(p, storage, from, to, capacity = 24) {
  const actor = {
      inventory: structuredClone(p.inventory),
      equipment: { ...p.equipment },
      equipmentSockets:structuredClone(p.equipmentSockets||{}),
    },
    chest = storage ? structuredClone(storage) : null;
  const list = (mode) =>
    mode === "pack" ? actor.inventory : mode === "chest" ? chest : null;
  const source = list(from.mode),
    dest = list(to.mode);
  if (
    !["pack", "gear", "chest"].includes(from.mode) ||
    !["pack", "gear", "chest"].includes(to.mode)
  )
    return false;
  if (from.mode === "gear") {
    let slot = from.slot;
    if (actor.equipment[slot] === "occupied") slot = "hand1";
    const type = actor.equipment[slot];
    const sockets=actor.equipmentSockets[slot]||[];
    if (!ITEMS[type]) return false;
    if (to.mode === "gear") {
      if (!fitsSlot(type, to.slot)) return false;
      if (slot === to.slot) return true;
      const other = actor.equipment[to.slot];
      if (
        other &&
        other !== "occupied" &&
        fitsSlot(other, slot) &&
        !ITEMS[type].twoHanded &&
        !ITEMS[other].twoHanded
      ) {
        actor.equipment[slot] = other;
        actor.equipment[to.slot] = type;
        actor.equipmentSockets[slot]=actor.equipmentSockets[to.slot]||[];actor.equipmentSockets[to.slot]=sockets;
      } else {
        actor.equipment[slot] = null;
        delete actor.equipmentSockets[slot];
        if (ITEMS[type].twoHanded) actor.equipment.hand2 = null;
        actor.inventory.push({ type, qty: 1,sockets });
        if (!equip(actor, actor.inventory.length - 1, to.slot)) return false;
      }
    } else {
      if (
        !dest ||
        !Number.isInteger(to.index) ||
        to.index < 0 ||
        to.index >= (to.mode === "chest" ? capacity : 24)
      )
        return false;
      const target = dest[to.index];
      if (target) return false;
      placeAt(dest, to.index, { type, qty: 1,...(sockets.length?{sockets}: {}) });
      actor.equipment[slot] = null;
      delete actor.equipmentSockets[slot];
      if (ITEMS[type].twoHanded) actor.equipment.hand2 = null;
    }
  } else {
    const item = source?.[from.index];
    if (!item) return false;
    if (to.mode === "gear") {
      if (!fitsSlot(item.type, to.slot)) return false;
      if (from.mode === "pack") {
        if (!equip(actor, from.index, to.slot)) return false;
      } else {
        item.qty--;
        const type = item.type;
        if (!item.qty) clearSlot(source, from.index);
        actor.inventory.push({ type, qty: 1,...(item.sockets?.length?{sockets:[...item.sockets]}:{}) });
        if (!equip(actor, actor.inventory.length - 1, to.slot)) return false;
      }
    } else if (!dest) return false;
    else {
      if (
        !Number.isInteger(to.index) ||
        to.index < 0 ||
        to.index >= (to.mode === "chest" ? capacity : 24)
      )
        return false;
      if (source === dest && from.index === to.index) return true;
      const target = dest[to.index];
      if (matchingStack(target,item.type,item) && ITEMS[item.type].stack>1&&!socketCount(item.type)&&!item.sockets?.length&&!target.sockets?.length) {
        const qty = Math.min(item.qty, ITEMS[item.type].stack - target.qty);
        if (!qty) return false;
        target.qty += qty;
        item.qty -= qty;
        if (!item.qty) clearSlot(source, from.index);
      } else {
        placeAt(dest, to.index, item);
        if (target) placeAt(source, from.index, target);
        else clearSlot(source, from.index);
      }
    }
  }
  if (actor.inventory.length > 24) return false;
  p.inventory = actor.inventory;
  p.equipment = actor.equipment;
  p.equipmentSockets=actor.equipmentSockets;refreshVitals(p);
  if (storage) storage.splice(0, storage.length, ...chest);
  return true;
}

export const chestName = (owner, index) =>
  owner?.chestNames?.[index] || `Chest ${index + 1}`;

// Append support gear: existing catalog/event indices and authored IDs stay put.
ITEMS.healing_wand={name:'Healing wand',base:'wand',slot:'hand1',magic:true,healing:true,
  healingAmount:24,damage:0,manaCost:12,stack:1,sockets:1,maxHp:0,rarity:'common',
  color:RARITIES.common,artColor:'#9cddff',style:'crystal',
  description:'Light-blue bolts heal living allied heroes and companions for 24 health (36 fully charged); never harm enemies. With a halo, each hit adds 4 healing/sec for 3 seconds, up to 3 independent stacks. Full stacks do not refresh.'};
ITEMS.halo={name:'Halo',base:'hat',slot:'head',healingHalo:true,
  outgoingSpellHealing:.25,incomingSpellHealing:.25,stack:1,sockets:1,maxHp:0,rarity:'rare',
  color:RARITIES.rare,artColor:'#ffe8a0',style:'halo',
  description:'A floating ring of warm light: +25% outgoing and +25% incoming spell healing (multiplicative). Combine with a healing wand for three one-second healing ticks per hit, up to 3 stacks.'};
