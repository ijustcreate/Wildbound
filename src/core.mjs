import {nextCombo} from './combat-combos.mjs';
import {startJump,tickJump} from './jumping.mjs';
import {tickWolf, wolfPack} from './wolf-pack.mjs';
import {ensureTemple,tickGorilla,tickGhosts,summonGhost} from './temple.mjs';
import { creatureCue } from './sound-bank.mjs';
import {iceMotion,snowAt} from './ice-world.mjs';
import {collisionOffset, actorRadius, clearShot, navigateEnemy} from './navigation.mjs';
import { initializeField, record, tickField } from "./field-systems.mjs";
import {resolveEnvironment,structureBlocked,breakWindow,webSlow,spawnSpot,spiderNest,tickSpider,maintainSpiderWebs,insideHouse} from './expansion.mjs';
import { nearbyScenery } from "./performance.mjs";
import {
  waterAt,
  isShallow,
  isQuicksand,
  harvest,
  tickEnvironment,
} from "./environment.mjs";
import {
  HAZARD_EVENTS,
  startHazard,
  tickHazards,
  firePatch,
} from "./hazards.mjs";
import { TABLE, footprintHit, crossesTable, generateWorld } from "./world.mjs";
import { initAdventure, initHero, adventureMethods } from "./adventure.mjs";
import { ITEMS, stat, give, itemKind } from "./items.mjs";
import { rules, creatures } from "./definitions.mjs";
export const TILE = 32,
  MAP_SIZE = 50,
  WORLD = TILE * MAP_SIZE,
  CENTER = WORLD / 2,
  FINISH = 48;
export const COLORS = [
  "#7de1bd",
  "#f18d76",
  "#87b8f2",
  "#eed07d",
  "#c5a0ed",
  "#b6d77c",
];
export const EVENTS = [
  {
    name: "The golden hunter",
    kind: "lion",
    count: 1,
    hp: 100,
    speed: 59,
    damage: 16,
    verse: "A golden shadow leaves its den.\nWill you dare to roll again?",
    tip: "Dodge the pounce. A snare stops the hunter.",
  },
  {
    name: "Wings in the rafters",
    kind: "bat",
    count: 5,
    hp: 24,
    speed: 100,
    damage: 6,
    verse:
      "Where there was silence, wings take flight.\nFive little shadows drink the light.",
    tip: "Fast, fragile bats. Sweep through the flock.",
  },
  {
    name: "Coils beneath the table",
    kind: "snake",
    count: 4,
    hp: 36,
    speed: 45,
    damage: 10,
    verse:
      "Between the stones, a ribbon wakes.\nMind your feet: the ribbon bites.",
    tip: "Watch for the red warning before a strike.",
  },
  {
    name: "Eyes in the water",
    kind: "crocodile",
    count: 1,
    hp: 140,
    speed: 38,
    damage: 22,
    verse: "Two green eyes and a patient grin.\nThe river wants to let you in.",
    tip: "Sidestep the lunge, then attack its flank.",
  },
  {
    name: "A debt of bananas",
    kind: "monkey",
    environment: "temple",
    count: 3,
    hp: 42,
    speed: 83,
    damage: 8,
    verse:
      "Little hands and wicked schemes.\nNothing stays quite where it seems.",
    tip: "Monkeys steal trap supplies on contact. Catch them!",
  },
  {
    name: "The room takes root",
    kind: "vine",
    count: 3,
    hp: 65,
    speed: 0,
    damage: 11,
    verse: "Wood remembers what it knew.\nThe sleeping forest reaches through.",
    tip: "Vines lash from a distance. Cut down every root.",
  },
  {
    name: "Thunder without rain",
    kind: "boar",
    count: 3,
    hp: 60,
    speed: 72,
    damage: 18,
    verse:
      "No cloud above. No train in sight.\nYet thunder tears across the night.",
    tip: "Step out of the marked charge lanes.",
  },
  {
    name: "A thousand little wings",
    kind: "wasp",
    count: 5,
    hp: 27,
    speed: 90,
    damage: 7,
    verse: "An amber hum, a needle choir.\nDo not stand within their ire.",
    tip: "Keep moving. Traps catch flying enemies too.",
  },
  {
    name: "The stone remembers",
    kind: "golem",
    count: 1,
    hp: 200,
    speed: 30,
    damage: 25,
    verse:
      "The oldest stone has heard your name.\nIt rises now to join the game.",
    tip: "Leave its warning circle before the ground slam.",
  },
  {
    name: "The silver clearing",
    kind: "panther",
    count: 1,
    hp: 120,
    speed: 85,
    damage: 15,
    verse: "A silver fruit, a shadow near.\nWin the clearing. Lose your fear.",
    tip: "Defeat the panther for healing fruit for the whole party.",
  },
  {name:"Stripes in the sanctum",kind:"tiger",environment:"temple",count:2,hp:105,speed:76,damage:18,weight:18,verse:"Orange shadows cross the stone.\nThe temple is not yours alone.",tip:"Watch for jumping tigers. Dodge their pounce, then strike."}

];
EVENTS.push({
  name: "Emerald shells",
  kind: "beetle",
  count: 5,
  hp: 55,
  speed: 67,
  damage: 10,
  weight: 6,
  verse:
    "Six small feet beneath a shield.\nThe emerald swarm has claimed the field.",
  tip: "Face the swarm and keep moving.",
});
EVENTS.push(
  {
    name: "Keeper of the blade",
    kind: "skeleton",
    count: 2,
    hp: 85,
    speed: 48,
    damage: 20,
    verse: "Old bones rise with blades held high.\nStep aside or learn to fly.",
    tip: "Dodge the raised blade; strike during recovery. They drop their swords.",
  },
  {
    name: "Arrows of the forgotten",
    kind: "archer",
    count: 2,
    hp: 60,
    speed: 40,
    damage: 14,
    verse:
      "From empty hands to string and bow.\nCatch the shafts the shadows throw.",
    tip: "Face the archer and hold block with a shield. Recover its bow and arrows.",
  },
);
EVENTS.push(...HAZARD_EVENTS);
EVENTS.push(
  {
    name: "The sleeping sickness",
    kind: "tsetse",
    count: 5,
    hp: 30,
    speed: 92,
    damage: 5,
    weight: 4,
    verse: "A black-winged hush slips through the trees.\nFive needles carry dream disease.",
    tip: "Break their charge-up attack before it puts someone to sleep.",
  },
  {
    name: "The frost throne",
    kind: "skeleton_wizard",
    environment: "ice",
    count: 6,
    hp: 120,
    speed: 32,
    damage: 16,
    weight: 3,
    verse: "A crown of rime, a wand of blue.\nThe dead bring winter down on you.",
    tip: "Defeat the crowned mage and its five frost-bound minions.",
    frostMinions: 5,
    wizardEscort: true,
  },
  {
    name: "The armory wakes",
    kind: "skeleton",
    count: 4,
    hp: 72,
    speed: 48,
    damage: 17,
    weight: 7,
    verse: "Steel and bone march side by side.\nThe forgotten ranks arise.",
    tip: "A mixed squad of swords and bows. Close on the archers first.",
    mixedSkeletons: true,
  },
  {
    name: "Winter's last scholar",
    kind: "skeleton_wizard",
    count: 3,
    hp: 95,
    speed: 34,
    damage: 13,
    weight: 3,
    verse: "Blue frost and golden light.\nA bone mage joins the fight.",
    tip: "Interrupt its ice bolts and stop it healing its allies.",
    wizardEscort: true,
  },
  {
    name: "Cinder in the canopy",
    kind: "fire_elemental",
    count: 2,
    hp: 82,
    speed: 58,
    damage: 12,
    weight: 5,
    verse:
      "A living coal comes drifting through.\nIt leaves a burning path for you.",
    tip: "Dodge its fireballs and keep clear of the flames it leaves behind.",
  },
  {
    name: "The pool that walks",
    kind: "water_elemental",
    count: 2,
    hp: 86,
    speed: 52,
    damage: 11,
    weight: 5,
    verse:
      "A teal shape rises from the pool.\nIts cold blue shots cross the sand.",
    tip: "Keep moving and avoid its water bolts.",
  },
  {
    name: "The wolf pack",
    kind: "wolf",
    count: 3,
    hp: 70,
    speed: 72,
    damage: 13,
    weight: 7,
    verse: "Three shadows answer one another.\nThe pack is already circling.",
    tip: "Keep the pack from surrounding you.",
  },
  {
    name: "The old sky's hunger",
    kind: "dragon",
    count: 1,
    hp: 310,
    speed: 48,
    damage: 24,
    weight: 1.5,
    verse: "A red wing blots the moon.\nThe ancient fire comes too soon.",
    tip: "Stay behind the dragon to avoid its breath and tail.",
  },
);
EVENTS.push(
  {
    name: "Empty-handed dead",
    kind: "skeleton_unarmed",
    count: 4,
    hp: 45,
    speed: 66,
    damage: 10,
    weight: 7,
    verse:
      "Without a blade, without a breath.\nFour fists disturb the quiet death.",
    tip: "Unarmed skeletons swarm with quick punches.",
  },
  {
    name: "The horned king",
    kind: "skeleton_boss",
    count: 1,
    hp: 480,
    speed: 43,
    damage: 32,
    weight: 1,
    verse:
      "A crown of horns, a rusted throne.\nThe king returns to claim his own.",
    tip: "Flank the shield. Dodge his sword and punish recovery. A unique reward awaits.",
  },
);
EVENTS.push(
  {
    name: "The stoneguard patrol",
    kind: "golem",
    count: 3,
    hp: 150,
    speed: 30,
    damage: 20,
    weight: 2,
    environment: "forest",
    squad: ["golem", "archer", "archer"],
    squadStats: { archer: { hp: 45, speed: 40, damage: 10 } },
    verse: "Stone takes the road.\nArrows guard its shoulders.",
    tip: "Draw the golem aside, then close on its archers.",
  },
  {
    name: "Embers on the dunes",
    kind: "fire_elemental",
    count: 3,
    hp: 80,
    speed: 48,
    damage: 12,
    weight: 2,
    environment: "desert",
    squad: ["fire_elemental", "wolf", "wolf"],
    squadStats: { wolf: { hp: 60, speed: 72, damage: 11 } },
    verse: "Heat wakes the sand.\nTwo shadows circle the flame.",
    tip: "Lead the wolves into quicksand while avoiding fire.",
  },
);
EVENTS.push(
 {name:'Keeper of the jade stair',kind:'gorilla',environment:'temple',count:4,hp:550,speed:60,damage:26,weight:14,squad:['gorilla','monkey','monkey','monkey'],squadStats:{monkey:{hp:55,speed:90,damage:9}},verse:'Stone remembers. The canopy replies.\nThe ancient keeper opens his eyes.',tip:'Dodge the gorilla’s ground slam. Clear its monkey companions first.'},
 {name:'The ivory king',kind:'white_lion',environment:'ice',count:1,hp:145,speed:65,damage:18,weight:12,verse:'A pale mane stirs against the snow.\nThe frozen king will not let go.',tip:'Dodge the white lion’s pounce and strike from the side.'},
 {name:'Ghosts of the glacier',kind:'snow_leopard',environment:'ice',count:2,hp:85,speed:88,damage:13,weight:12,verse:'Spotted ghosts on silent feet.\nTwo cold shadows leave the sleet.',tip:'Keep both snow leopards in sight. Snare one to split the pair.'},
 {name:'Eight legs, three promises',kind:'spider',count:2,hp:70,speed:68,damage:11,weight:10,spiderNest:true,verse:'Two silk hunters start to creep.\nThree small promises wake from sleep.',tip:'Destroy three eggs before they hatch in 20 seconds. Webs slow everyone except spiders.'}
);
for (const event of EVENTS) {
  const c = creatures[event.kind];
  if (c && !c.edited)
    Object.assign(c.stats, {
      hp: event.hp,
      speed: event.speed,
      damage: event.damage,
    });
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function cameraTarget(players, w, h, reveal = null) {
  const points = players.length ? players : [{ x: CENTER, y: CENTER }];
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  if (reveal) {
    xs.push(reveal.x);
    ys.push(reveal.y);
  }
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const zoom = clamp(
    Math.min(w / (maxX - minX + 340), h / (maxY - minY + 290)),
    0.1,
    2.35,
  );
  const halfW = w / zoom / 2,
    halfH = h / zoom / 2;
  return {
    x:
      halfW > WORLD / 2
        ? CENTER
        : clamp((minX + maxX) / 2, halfW, WORLD - halfW),
    y:
      halfH > WORLD / 2
        ? CENTER
        : clamp((minY + maxY) / 2, halfH, WORLD - halfH),
    zoom,
  };
}
export function expeditionCameraTarget(game, w, h) {
  if (game.phase === "play" && game.openingBoard)
    return {
      x: CENTER,
      y: CENTER,
      zoom: Math.min(
        w / (TABLE.halfWidth * 2 + 12),
        Math.max(130, h - 24) / (TABLE.halfHeight * 2 + 4),
      ),
    };
  const worldPlayers = game.players.filter((p) => !p.room);
  // Keep the world centered on players who are still playing while another
  // player has an inventory or storage panel open. This keeps multiplayer
  // action visible instead of letting a UI panel pull the camera away.
  const activePlayers = worldPlayers.filter((p) => !p.ui);
  const focusPlayers = activePlayers.length ? activePlayers : worldPlayers;
  const uiOpen = game.players.some((p) => p.ui || p.room);
  return cameraTarget(
    focusPlayers,
    w,
    Math.max(130, h - 85),
    uiOpen ? null : game.reveal,
  );
}
export class Game {
  constructor(random = Math.random) {
    initAdventure(this);
    this.random = random;
    this.players = [];
    this.enemies = [];
    this.traps = [];
    this.pickups = [];
    this.effects = [];
    this.time = 0;
    this.turn = 0;
    this.round = 1;
    this.houseLionSpawned = false;
    this.phase = "lobby";
    this.roll = null;
    this.reveal = null;
    this.openingBoard = true;
    this.event = null;
    this.eventTime = 0;
    this.locked = false;
    this.nextId = 1;
    this.cleared = 0;
    this.deck = [];
    this.log = [];
    this.tableShake = 0;
    this.onSound = () => {};
    this.difficulty = "adventure";
    this.environment = "forest";
    this.generatedEnvironment = "forest";
    this.diceCount = 2;
    this.seed = Math.floor(this.random() * 1000000);
    Object.assign(this, generateWorld(this.seed));
    this.bloom = 3;
    this.spriteLibrary = {};
  }
  blocked(x, y, radius = 8, flying = false, ignoreWater = false, canOpenDoors = false, footOffset = 14, elevation = 0, projectile = false) {
    if(structureBlocked(this,x,y,radius,canOpenDoors,footOffset,elevation,projectile))return true;
    if (
      (this.barricades || []).some(
        (b) =>
          b.life > 0 &&
          Math.abs(b.x - x) < 22 + radius &&
          Math.abs(b.y - y) < 10 + radius,
      )
    )
      return true;
    if (
      Math.abs(x - CENTER) < TABLE.halfWidth + radius &&
      Math.abs(y + TABLE.footOffset - CENTER) < TABLE.halfHeight + radius
    )
      return true;
    if (
      !flying &&
      this.volcanoes?.some((v) => Math.hypot(x - v.x, y - v.y) < 45)
    )
      return true;
    if(!flying&&!ignoreWater&&this.phase!=='won'&&this.house?.pools?.some(b=>Math.hypot(x-Math.max(b.x,Math.min(x,b.x+b.w)),y+footOffset-Math.max(b.y,Math.min(y+footOffset,b.y+b.h)))<radius))return true;
    if (!flying && !ignoreWater && this.phase !== "won")
      for (const [dx, dy] of [
        [0, 0],
        [radius, 0],
        [-radius, 0],
        [0, radius],
        [0, -radius],
      ])
        if (waterAt(this, x + dx, y + footOffset + dy) === "water") return true;
    return (
      !flying &&
      nearbyScenery(this.scenery, x, y + footOffset, radius).some((prop) =>
        footprintHit(prop, this.spriteLibrary[prop.kind], x, y + footOffset, radius),
      )
    );
  }
  projectileBlocked(x, y, radius = 1, impact = false) {
    if(impact&&breakWindow(this,x,y,radius))return true;
    // Airborne shots cross water but still hit scenery, the board and map edges.
    return (
      x - radius < 0 ||
      x + radius >= WORLD ||
      y + 14 - radius < 0 ||
      y + 14 + radius >= WORLD ||
      this.blocked(x, y, radius, false, true,false,this.house?0:14,0,true)
    );
  }
  moveActor(actor, dx, dy, flying = false) {
    if(!flying&&this.generatedEnvironment==='ice'){const snow=1-snowAt(this,actor.x,actor.y)*.45;dx*=snow;dy*=snow;}
    if(webSlow(this,actor)){dx*=.45;dy*=.45;}
    if (actor.field === undefined && actor.slowUntil > this.time) {
      dx *= 0.45;
      dy *= 0.45;
    }
    const ground = waterAt(this, actor.x, actor.y + collisionOffset(this,actor));
    if (!flying && isQuicksand(ground)) {
      dx *= 0.32;
      dy *= 0.32;
    } else if (!flying && isShallow(ground)) {
      dx *= 0.55;
      dy *= 0.55;
    }
    const oldX = actor.x,
      oldY = actor.y,
      steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 3));
    for (let i = 0; i < steps; i++) {
      const x = clamp(actor.x + dx / steps, 24, WORLD - 24);
      if (!this.blocked(x, actor.y, actorRadius(actor), flying,false,false,collisionOffset(this,actor),(actor.groundHeight||0)+(actor.jumpHeight||0))) actor.x = x;
      const y = clamp(actor.y + dy / steps, 24, WORLD - 24);
      if (!this.blocked(actor.x, y, actorRadius(actor), flying,false,false,collisionOffset(this,actor),(actor.groundHeight||0)+(actor.jumpHeight||0))) actor.y = y;
    }
    const moved = Math.hypot(actor.x - oldX, actor.y - oldY);
    if (!flying && isQuicksand(waterAt(this, actor.x, actor.y + collisionOffset(this,actor))))
      actor.sink =
        moved < 0.01
          ? Math.min(16, (actor.sink || 0) + 7 * 0.016)
          : Math.max(0, (actor.sink || 0) - 0.08);
    else actor.sink = Math.max(0, (actor.sink || 0) - 0.2);
    actor.moving = moved > 0.01;
    actor.step = (actor.step || 0) + moved * 0.13;
    return moved;
  }
  addPlayer(device, name) {
    if (
      this.locked ||
      this.players.length >= 6 ||
      this.players.some((p) => p.device === device)
    )
      return null;
    const i = COLORS.findIndex(
        (color) => !this.players.some((p) => p.color === color),
      ),
      a = -Math.PI / 2 + (i * Math.PI) / 3;
    const p = {
      id: this.nextId++,
      device,
      name: name || ["Scout", "Ember", "Astral", "River", "Fern", "Echo"][i],
      color: COLORS[i],
      sprite: [
        "explorer-teal",
        "explorer-coral",
        "explorer-blue",
        "explorer-gold",
        "explorer-purple",
        "explorer-green",
      ][i],
      x: CENTER + Math.cos(a) * 116,
      y: CENTER - 11 + Math.sin(a) * 68,
      hp: 100,
      maxHp: 100,
      progress: 0,
      boardProgress: 0,
      rolls: 0,
      faceX: -Math.cos(a),
      faceY: -Math.sin(a),
      attack: 0,
      dodge: 0,
      dashTime: 0,
      invuln: 0,
      trapCooldown: 0,
      traps: 3,
      revive: 0,
      step: 0,
      hit: 0,
    };
    initHero(p);
    initializeField(p);
    this.players.push(p);
    return p;
  }
  start() {
    if (!this.players.length) return false;
    if (this.generatedEnvironment !== this.environment) {
      const env =
        resolveEnvironment(this.environment,this.seed);
      Object.assign(this, generateWorld(this.seed, env));
      this.generatedEnvironment = env;
    }
    this.phase = "play";
    this.turnOrder = [];
    this.message("The board is awake. Hit the table to roll.");
    return true;
  }
  get current() {
    return this.roll
      ? this.players.find((p) => p.id === this.roll.playerId)
      : this.locked
        ? this.players.find((p) => p.id === this.turnOrder?.[this.turn]) ||
          this.players[this.turn]
        : null;
  }
  message(text) {
    this.log.unshift(text);
    this.log = this.log.slice(0, 5);
  }
  hurt(p, amount, source) {
    if (p.hp <= 0 || p.invuln > 0 || p.room) return;
    if (this.shieldBlocks(p, source)) {
      record(p, "damagePrevented", amount);
      if (source?.kind && source.state === "windup") {
        source.state = "recover";
        source.timer = 0.8;
      }
      this.onSound("trap");
      return;
    }
    record(p, "damageTaken", amount);
    if (
      this.players.some(
        (q) =>
          q !== p && q.hp > 0 && !q.room && q.blocking && distance(q, p) < 65,
      )
    ) {
      amount *= 0.75;
      record(p, "guardedHits");
    }
    amount *= p.field?.boon === "guardian" ? 0.85 : 1;
    amount *= p.field?.curse ? 1.15 : 1;
    amount =
      this.difficulty === "gentle" ? 1 : Math.max(1, amount - stat(p, "armor"));
    p.hp = Math.max(
      0,
      p.hp - amount * (this.difficulty === "adventure" ? 0.65 : 1),
    );
    p.invuln = 0.75;
    p.hit = 0.2;
    this.onSound("hurt");
    this.effects.push({
      x: p.x,
      y: p.y - 25,
      text:
        "−" +
        Math.max(
          1,
          Math.round(amount * (this.difficulty === "adventure" ? 0.65 : 1)),
        ),
      color: "#ff9c86",
      life: 0.7,
    });
    if (p.hp === 0)
      this.message(
        p.name + " is down! Stand nearby and hold Interact to revive.",
      );
  }
  attack(p, charge = 0) {
    if (!["play", "won"].includes(this.phase) || p.hp <= 0 || p.room || p.ui) return false;
    if(p.attack>0){p.queuedAttack={charge,until:this.time+.35};return false;}
    p.attack = p.attackDuration = 0.34;
    p.attackClip=null;
    this.onSound(p.equipment?.hand1?.includes('bow')?'bow':p.equipment?.hand1?.includes('wand')?'magic':'attack',p);
    if (this.canHitBoard(p)) {
      this.tableShake = 0.2;
      this.hitTable(p);
    }
    const magicSlots = ["hand1", "hand2"].filter(
      (slot) => ITEMS[p.equipment[slot]]?.magic,
    );
    if (magicSlots.length) {
      p.attackClip="cast";p.comboId=null;
      for (const slot of magicSlots) this.fireSpell(p, charge, slot);
      return true;
    }
    if (itemKind(p.equipment.hand1) === "bow") {
      this.fireArrow(p, charge);
      return true;
    }
    const weapon =
        ITEMS[p.equipment.hand1] ||
        (ITEMS[p.equipment.hand2]?.damage ? ITEMS[p.equipment.hand2] : null),
      off = ITEMS[p.equipment.hand2];
    const combo=nextCombo(p,weapon?.damage?"melee":"unarmed",this.time);
    p.attackClip=combo.clip;p.attack=p.attackDuration=combo.duration;p.attackArc=combo.arc;p.attackReach=combo.reach;
    const damage = combo.damage * (
      (weapon?.damage || 12 + stat(p, "punch")) +
      (off && ITEMS[p.equipment.hand1] && off.damage && !off.magic
        ? Math.round(off.damage * 0.5)
        : 0) +
      Math.round(charge * 16));
    const spin =
      charge > 0.6 &&
      [p.equipment.hand1, p.equipment.hand2].some(
        (id) => itemKind(id) === "sword",
      );
    if (spin) p.spin = 0.38;
    harvest(this, p, damage, (weapon ? 76 : 49)*combo.reach);
    for(const pane of this.house?.walls||[]){
      if(pane.kind!=='window'||pane.broken)continue;
      const x=Math.max(pane.x,Math.min(p.x,pane.x+pane.w)),y=Math.max(pane.y,Math.min(p.y,pane.y+pane.h)),dx=x-p.x,dy=y-p.y,d=Math.hypot(dx,dy);
      if(d<(weapon?76:49)*combo.reach&&(spin||(dx*p.faceX+dy*p.faceY)/Math.max(1,d)>.35))breakWindow(this,x,y,2);
    }
    for (const e of [...this.enemies,...(this.pvp?this.players.filter(q=>q!==p&&q.hp>0&&!q.room):[])]) {
      const dx = e.x - p.x,
        dy = e.y - p.y,
        d = Math.hypot(dx, dy);
      if (
        d < (spin ? 96 : (weapon ? 76 : 49)*combo.reach) &&
        d > 0 && clearShot(this,p,e) &&
        (spin ||
          (dx * p.faceX + dy * p.faceY) /
            (d * (Math.hypot(p.faceX, p.faceY) || 1)) >=
            Math.cos(combo.arc*Math.PI / 360))
      ) {
        if(this.players.includes(e)){this.hurt(e,damage,p);continue;}
        e.killedBy=p.id;e.ritualKill=[p.equipment.hand1,p.equipment.hand2].includes('ritual_dagger');
        e.aggro = true;
        const guard =
          e.kind === "skeleton_boss" &&
          e.state !== "recover" &&
          ((p.x - e.x) * (e.faceX || 0) + (p.y - e.y) * (e.faceY || 1)) /
            (d || 1) >
            0.3;
        e.hp -= Math.round(
          damage * (e.state === "recover" ? 1.3 : 1) * (guard ? 0.35 : 1),
        );
        e.flash = 0.13;
        if (charge > 0.6) {
          e.state = "recover";
          e.timer = 0.7;
        }
        if (e.state !== "charge") {
          this.moveActor(
            e,
            p.faceX * (13 + charge * 50),
            p.faceY * (13 + charge * 50),
            ["bat", "wasp"].includes(e.kind),
          );
        }
        this.effects.push({
          x: e.x,
          y: e.y - 24,
          text: String(damage),
          color: "#ffe8ad",
          life: 0.5,
        });
      }
    }
    return true;
  }
  canHitBoard(p) {
    const dx =
      Math.max(
        CENTER - TABLE.halfWidth,
        Math.min(CENTER + TABLE.halfWidth, p.x),
      ) - p.x;
    const dy =
      Math.max(
        CENTER - TABLE.footOffset - TABLE.halfHeight,
        Math.min(CENTER - TABLE.footOffset + TABLE.halfHeight, p.y),
      ) - p.y;
    const d = Math.hypot(dx, dy);
    return (
      !p.room &&
      d <= TABLE.attackRadius &&
      (d < 1 ||
        (dx * p.faceX + dy * p.faceY) /
          (d * (Math.hypot(p.faceX, p.faceY) || 1)) >=
          Math.cos(Math.PI / 4))
    );
  }
  hitTable(p) {
    if (!p) return false;
    if (this.phase === "won" && p.hp > 0) {
      this.newExpedition();
      return true;
    }
    if (
      this.phase !== "play" ||
      (this.locked
        ? p !== this.current
        : (this.turnOrder || []).includes(p.id)) ||
      this.roll ||
      p.hp <= 0 ||
      p.room
    )
      return false;
    if (p.progress >= FINISH) {
      this.message("Hold Interact at the table to call WILDBOUND!");
      return false;
    }
    if (!this.locked) (this.turnOrder ||= []).push(p.id);
    const dice = Array.from(
      { length: this.diceCount === 1 ? 1 : 2 },
      () => 1 + Math.floor(this.random() * 6),
    );
    const total = dice.reduce((a, b) => a + b, 0);
    this.roll = {
      dice,
      total,
      elapsed: 0,
      playerId: p.id,
      resolved: false,
      startProgress: p.progress,
      targetProgress: Math.min(FINISH, p.progress + total),
      landingAt: 1.6 + Math.min(FINISH - p.progress, total) * 0.16,
    };
    if (this.enemies.some((e) => e.hp > 0)) {
      p.coins = (p.coins || 0) + 2;
      record(p, "boldRolls");
    }
    this.onSound("roll");
    return true;
  }
  resolveRoll() {
    const r = this.roll;
    if (!r || r.resolved) return;
    r.resolved = true;
    const p = this.players.find((p) => p.id === r.playerId);
    p.progress = Math.min(FINISH, p.progress + r.total);
    p.boardProgress = p.progress;
    p.rolls++;
    if (p.rolls % 3 === 0) initializeField(p).choice = true;

    this.message(
      p.name + " rolled " + r.total + " · trail " + p.progress + "/" + FINISH,
    );
    this.spawnEvent();
  }
  spawnEvent(index) {
    if (index === undefined) {
      const weight = (e) =>
        e.environment && e.environment !== this.generatedEnvironment
          ? 0
          : Math.max(0, e.weight ?? 10);
      const sum = EVENTS.reduce((n, e) => n + weight(e), 0);
      let choice = this.random() * sum;
      index = EVENTS.length - 1;
      for (let i = 0; i < EVENTS.length; i++) {
        choice -= weight(EVENTS[i]);
        if (choice < 0) {
          index = i;
          break;
        }
      }
      if (this.players.reduce((n, p) => n + p.rolls, 0) === 1) index = this.generatedEnvironment==="temple"?EVENTS.findIndex(e=>e.kind==="tiger"):0;
    }
    this.event = EVENTS[index];
    if(!this.event||(this.event.environment&&this.event.environment!==this.generatedEnvironment))return;
    this.openingBoard = false;
    this.eventTime = this.eventDuration || 7;
    if (startHazard(this, this.event)) {
      this.message(this.event.name + " — " + this.event.tip);
      this.onSound("event");
      return;
    }
    if (!this.objective || this.objective.done) {
      const cycle = [
        "defeat",
        "protect",
        "explore",
        "rescue",
        "ritual",
        "survive",
      ];
      const kind = cycle[(this.objectiveCount || 0) % cycle.length];
      this.objectiveCount = (this.objectiveCount || 0) + 1;
      const target = {
        defeat: 3,
        protect: 30,
        explore: 20,
        rescue: 3,
        ritual: 4,
        survive: 45,
      }[kind];
      const name = {
        defeat: "Clear three creatures",
        protect: "Protect the jade relic",
        explore: "Explore twenty tiles",
        rescue: "Rescue the lost explorer",
        ritual: "Disrupt the jungle ritual",
        survive: "Survive the rising danger",
      }[kind];
      let spot = { x: 800, y: 960 };
      for (let n = 0; n < 16; n++) {
        const x = 800 + Math.cos((n * Math.PI) / 8) * 190,
          y = 800 + Math.sin((n * Math.PI) / 8) * 190;
        if (!this.blocked(x, y, 20)) {
          spot = { x, y };
          break;
        }
      }
      this.objective = {
        kind,
        name,
        target,
        start: kind === "defeat" ? this.cleared : this.explored.size,
        progress: 0,
        health: 100,
        ...spot,
        done: false,
      };
    }
    const group = this.nextId++;
    let first = null;
    for (let i = 0; i < this.event.count; i++) {
      const spawnedKind =
        this.event.squad?.[i] ||
        (this.event.frostMinions
          ? i === 0 ? "skeleton_wizard" : "skeleton"
          : this.event.mixedSkeletons
          ? i % 2
            ? "archer"
            : "skeleton"
          : this.event.wizardEscort && i > 0
            ? "skeleton"
            : this.event.kind);
      const a = this.random() * Math.PI * 2,
        d = 280 + this.random() * 95;
      const e = {
        ...this.event,
        ...(this.event.squadStats?.[spawnedKind] || {}),
        kind: spawnedKind,
        id: this.nextId++,
        group,
        x: clamp(CENTER + Math.cos(a) * d, 70, WORLD - 70),
        y: clamp(CENTER + Math.sin(a) * d, 70, WORLD - 70),
        maxHp: this.event.squadStats?.[spawnedKind]?.hp || this.event.hp,
        state: "hunt",
        timer: 1 + this.random(),
        cooldown: 1,
        flash: 0,
        dx: 0,
        dy: 0,
        attackX: 0,
        attackY: 0,
        step: 0,
        frostBound: this.event.frostMinions && spawnedKind === "skeleton",
        frostMage: this.event.frostMinions && i === 0,
        moving: false,
        faceX: 0,
        faceY: 1,
        temperament: ["bold", "patient", "restless"][
          Math.floor(this.random() * 3)
        ],
        orbit: this.random() < 0.5 ? -1 : 1,
        tacticTime: 1.4 + this.random() * 1.8,
        skin:
          this.event.kind === "lion" && this.round > 1 && this.random() < 0.4
            ? "tiger"
            : spawnedKind,
      };
      this.configureCreature(e, false);
      Object.assign(e,spawnSpot(this,a,d, this.house && e.kind === "lion" && !this.houseLionSpawned));
      if(this.house && e.kind === "lion")this.houseLionSpawned = true;
      if(this.event.spiderNest&&first){e.x=first.x+24;e.y=first.y+24;if(this.blocked(e.x,e.y)||(this.house&&insideHouse(e.x,e.y)))Object.assign(e,{x:first.x,y:first.y});}
      e.speed *= 0.88 + this.random() * 0.24;
      e.tacticTime *=
        e.temperament === "bold" ? 0.65 : e.temperament === "patient" ? 1.5 : 1;
      for (let tries = 0; tries < 40 && this.blocked(e.x, e.y); tries++) {
        e.x = clamp(e.x + Math.cos(tries * 1.7) * 24, 70, WORLD - 70);
        e.y = clamp(e.y + Math.sin(tries * 1.7) * 24, 70, WORLD - 70);
      }
      this.enemies.push(e);
      first ??= e;
    }
    for(const e of this.enemies.filter(e=>e.group===group&&e.kind==="wolf"))wolfPack(this,e);
    if(this.event.spiderNest&&first)spiderNest(this,first,group);
    this.reveal = { x: first.x, y: first.y, life: 4 };
    this.message(this.event.name + " — " + this.event.tip);
    this.onSound("event");
  }
  trap(p) {
    if (
      p.hp <= 0 ||
      p.traps <= 0 ||
      p.trapCooldown > 0 ||
      this.phase !== "play"
    )
      return false;
    p.traps--;
    p.trapCooldown = 0.6;
    this.traps.push({
      x: p.x + p.faceX * 34,
      y: p.y + p.faceY * 34,
      life: rules.trapDuration,
      owner: p.id,
      placedAt: this.time,
      variant: initializeField(p).trap,
      capture: p.field.boon === "trapper" ? 0.75 : 1,
    });
    record(p, "trapsPlaced");
    this.onSound("trap");
    return true;
  }
  update(dt, inputs = {}) {
    if (this.phase === "sealing") {
      this.sealTime += Math.min(dt, 0.05);
      this.time += Math.min(dt, 0.05);
      if (this.sealTime >= rules.sealDuration) this.completeVictory();
      return;
    }
    if (!["play", "won"].includes(this.phase)) return;
    dt = Math.min(dt, 0.05);
    ensureTemple(this);
    this.tickAdventure(dt, inputs);
    tickGhosts(this,dt);
    tickField(this, dt, inputs);
    tickHazards(this, dt);
    tickEnvironment(this, dt);
    if (this.phase === "sealing") return;
    this.bloom = Math.min(3, (this.bloom || 0) + dt);
    this.time += dt;
    this.tableShake = Math.max(0, this.tableShake - dt);
    this.eventTime = Math.max(0, this.eventTime - dt);
    if (this.reveal) {
      this.reveal.life -= dt;
      if (this.reveal.life <= 0) this.reveal = null;
    }
    if (this.roll) {
      this.roll.elapsed += dt;
      const owner = this.players.find((p) => p.id === this.roll.playerId);
      if (this.roll.elapsed >= 1.6 && !this.roll.resolved) {
        owner.boardProgress = Math.min(
          this.roll.targetProgress,
          this.roll.startProgress + (this.roll.elapsed - 1.6) / 0.16,
        );
      }
      if (this.roll.elapsed >= this.roll.landingAt) this.resolveRoll();
      if (this.roll.elapsed >= this.roll.landingAt + 0.65) {
        this.roll = null;
        if (!this.locked) {
          if (this.players.every((p) => this.turnOrder.includes(p.id))) {
            this.locked = true;
            this.turn = 0;
            this.round = 2;
          }
        } else this.turn++;
        if (this.turn >= this.players.length) {
          this.turn = 0;
          this.round++;
          this.locked = true;
        }
      }
    }
    for (const p of this.players) {
      tickJump(p,dt,this,collisionOffset(this,p));
      p.deathTime=p.hp<=0?(p.deathTime||0)+dt:0;p.getUpTime=Math.max(0,(p.getUpTime||0)-dt);
      p.sleeping = Math.max(0, (p.sleeping || 0) - dt);
      p.interactAnimation=Math.max(0,(p.interactAnimation||0)-dt);p.reviveAnimation=Math.max(0,(p.reviveAnimation||0)-dt);
      p.attack = Math.max(0, p.attack - dt);
      if(p.queuedAttack&&p.attack===0){const queued=p.queuedAttack;delete p.queuedAttack;if(queued.until>=this.time&&!p.room&&!p.ui&&p.hp>0)this.attack(p,queued.charge);}
      p.spin = Math.max(0, (p.spin || 0) - dt);
      p.stun = Math.max(0, (p.stun || 0) - dt);
      p.dodge = Math.max(0, p.dodge - dt);
      p.dashTime = Math.max(0, p.dashTime - dt);
      p.invuln = Math.max(0, p.invuln - dt);
      p.trapCooldown = Math.max(0, p.trapCooldown - dt);
      p.hit = Math.max(0, p.hit - dt);
      const input = inputs[p.device] || {};
      if (p.room || p.ui || p.consumeInput || p.stun > 0) {
        p.moving = false;p.slideX=p.slideY=0;
        continue;
      }
      if (p.sleeping > 0) {
        p.moving = false;
        p.slideX = p.slideY = 0;
        continue;
      }
      if (p.hp <= 0) {
        let helper = this.players.find(
          (q) =>
            q.hp > 0 &&
            distance(p, q) < 65 &&
            (inputs[q.device] || {}).interact,
        );
        if(helper)helper.reviveAnimation=.15;
        p.revive = helper ? p.revive + dt : Math.max(0, p.revive - dt);
        if (p.revive >= 1.6) {
          if (helper) record(helper, "rescues");
          p.hp = 55;
          p.getUpTime=.4;
          p.revive = 0;
          p.invuln = 2;
          this.onSound("heal");
          this.message(p.name + " is back on their feet.");
        }
        continue;
      }
      let mx = input.x || 0,
        my = input.y || 0;
      const len = Math.hypot(mx, my);
      p.walking=len>0&&len<.6;
      if (len > 1) {
        mx /= len;
        my /= len;
      }
      if (Math.hypot(input.aimX || 0, input.aimY || 0) > 0.2) {
        let n = Math.hypot(input.aimX, input.aimY);
        p.faceX = input.aimX / n;
        p.faceY = input.aimY / n;
      } else if (len > 0.15) {
        p.faceX = mx / (len > 1 ? 1 : len);
        p.faceY = my / (len > 1 ? 1 : len);
      }
      if(!this.openingBoard&&input.jump&&!p.jumpHeld)startJump(p);
      p.jumpHeld=!!input.jump;
      p.swimming=['water','shallow','floodbridge'].includes(waterAt(this,p.x,p.y));
      if (!this.openingBoard && input.dodge && !p.dashHeld && p.dodge === 0) {
        p.dodge = rules.dashCooldown * (p.staminaBoost > 0 ? 0.5 : 1);
        p.dashTime = rules.dashDuration;
        p.dashX = len > 0.1 ? mx / (Math.hypot(mx, my) || 1) : p.faceX;
        p.dashY = len > 0.1 ? my / (Math.hypot(mx, my) || 1) : p.faceY;
        p.invuln = 0.32;
        this.onSound("dodge");
      }
      p.dashHeld = !!input.dodge;
      p.rooted = Math.max(0, (p.rooted || 0) - dt);
      const speed =
        p.dashTime > 0
          ? rules.dashSpeed
          : p.rooted > 0
            ? 55
            : 133 * (p.field?.boon === "scout" ? 1.12 : 1);
      if (p.dashTime > 0) {
        mx = p.dashX;
        my = p.dashY;
      }
      if (!this.openingBoard) {
        const motion=iceMotion(this,p,mx,my,speed,dt),oldX=p.x,oldY=p.y;
        this.moveActor(p,motion.dx,motion.dy);
        if(Math.abs(p.x-oldX)<.01)p.slideX=0;if(Math.abs(p.y-oldY)<.01)p.slideY=0;
      }
      else p.moving = false;
      if (!this.openingBoard && input.trap) this.trap(p);
      for (const fruit of this.pickups) {
        if (!fruit.used && distance(p, fruit) < 28) {
          fruit.used = give(p.inventory, "fruit");
          if (fruit.used) this.onSound("heal");
          else this.inventoryFullNotice(p, "fruit");
        }
      }
    }
    const alive = this.players.filter((p) => p.hp > 0 && !p.room);
    for (const e of this.enemies) {
      tickJump(e,dt,this,collisionOffset(this,e));
      if (e.hp <= 0 || (e.kind === "rhino" && !e.aggro)) continue;
      if(creatures[e.kind]?.behaviors.jump&&e.state==='hunt'){
        const target=alive.reduce((best,p)=>!best||distance(e,p)<distance(e,best)?p:best,null);
        if(target&&distance(e,target)>65&&distance(e,target)<180&&clearShot(this,e,target))startJump(e);
      }
      if(tickGorilla(this,e,dt)||tickSpider(this,e,dt))continue;
      const cfg = creatures[e.kind],
        beh = cfg?.behaviors || {};
      const aiKind = cfg?.aiKind || e.kind;
      if (cfg?.faction === "neutral") continue;
      if (cfg?.faction === "ally") {
        const target = this.enemies
          .filter(
            (q) =>
              q !== e &&
              q.hp > 0 &&
              creatures[q.kind]?.faction !== "ally" &&
              creatures[q.kind]?.faction !== "neutral",
          )
          .sort((a, b) => distance(e, a) - distance(e, b))[0];
        e.cooldown -= dt;
        if (target) {
          const d = distance(e, target) || 1;
          e.faceX = (target.x - e.x) / d;
          e.faceY = (target.y - e.y) / d;
          if (d > 45 && beh.hunt)
            this.moveActor(e, e.faceX * e.speed * dt, e.faceY * e.speed * dt);
          if (d < 65 && e.cooldown <= 0 && beh.melee) {
            target.hp -= e.damage;
            e.cooldown = 1;
            e.attack = 0.34;
          }
        }
        continue;
      }
      e.x = clamp(e.x, 24, WORLD - 24);
      e.y = clamp(e.y, 24, WORLD - 24);
      e.flash = Math.max(0, e.flash - dt);
      e.frozen = Math.max(0, (e.frozen || 0) - dt);
      if (e.frozen > 0) { e.moving = false; continue; }
      e.attack = Math.max(0, (e.attack || 0) - dt);
      e.healEffect = Math.max(0, (e.healEffect || 0) - dt);
      e.throwTime = Math.max(0, (e.throwTime || 0) - dt);
      e.cooldown -= dt;
      e.tacticTime -= dt;
      e.moving = false;
      if(e.kind === "wolf"){tickWolf(this,e,alive,dt);continue;}
      const nearest = alive.reduce(
        (best, p) => (!best || distance(e, p) < distance(e, best) ? p : best),
        null,
      );
      let p =
        e.temperament === "restless" && alive.length > 1
          ? alive[e.id % alive.length]
          : nearest;
      if (aiKind === "vine")
        p = this.baits.find((b) => distance(b, e) < 180) || p;
      if (!p) continue;

      if (cfg?.stats?.detection && distance(e, p) > (this.house?2200:cfg.stats.detection))
        continue;
      const rangeToTarget = distance(e, p) || 1;

      const aimX = (p.x - e.x) / rangeToTarget,
        aimY = (p.y - e.y) / rangeToTarget;
      if (this.house && (!clearShot(this,e,p)||(rangeToTarget>110&&["lion","white_lion","snow_leopard"].includes(e.kind)))) {
        e.attack = 0;
        navigateEnemy(this,e,p,dt);
        continue;
      }
      if (beh.fireball) {
        e.fireballsAttack = Math.max(0, (e.fireballsAttack || 0) - dt);
        const previousX = e.x,
          previousY = e.y;
        e.moving = false;
        e.fireCooldown = (e.fireCooldown ?? 0.5) - dt;
        e.faceX = aimX;
        e.faceY = aimY;
        if (rangeToTarget < 360 && e.fireCooldown <= 0) {
          e.fireballsAttack = 0.45;
          this.fireballs.push({
            x: e.x,
            y: e.y,
            vx: aimX * 190,
            vy: aimY * 190,
            life: 3.1,
            trail: 0,
            damage: e.damage,
            burnDamage: cfg.stats.burnDamage,
            water: aiKind === "water_elemental",
          });
          e.fireCooldown = cfg.stats.fireCooldown || 2.4;
        }
        if (rangeToTarget < 100)
          this.moveActor(e, -aimX * e.speed * dt, -aimY * e.speed * dt);
        else if (rangeToTarget > 190)
          this.moveActor(e, aimX * e.speed * dt, aimY * e.speed * dt);
        if (e.moving && beh.fireTrail) {
          e.fireTrailTimer = (e.fireTrailTimer || 0) - dt;
          if (e.fireTrailTimer <= 0) {
            firePatch(this, previousX, previousY, 1.8, cfg.stats.burnDamage);
            e.fireTrailTimer = 0.38;
          }
          if (Math.random() < dt * 3)
            this.fireParticles.push({
              x: e.x + (Math.random() - 0.5) * 14,
              y: e.y - 10,
              life: 0.7,
              smoke: true,
            });
        }
        continue;
      }
      if (beh.flameBreath || beh.tailSwipe) {
        e.fireCooldown = (e.fireCooldown || 0) - dt;
        if (e.fireAction) {
          e.fireActionTimer -= dt;
          if (e.fireActionTimer <= 0) {
            if (e.fireAction === "tail") {
              for (const q of alive) {
                const d = distance(e, q) || 1;
                if (
                  d < 86 &&
                  ((q.x - e.x) * e.faceX + (q.y - e.y) * e.faceY) / d < 0.8
                )
                  this.hurt(q, e.damage, e);
              }
              this.effects.push({
                x: e.x + e.faceX * 36,
                y: e.y + e.faceY * 36,
                radius: 52,
                color: "#d88a49",
                life: 0.35,
              });
            } else {
              const reach = cfg.stats.flameRange || 190;
              for (let step = 2; step <= reach; step += 28) {
                const cx = e.x + e.faceX * step,
                  cy = e.y + e.faceY * step;
                firePatch(this, cx, cy, 3, cfg.stats.burnDamage);
                firePatch(
                  this,
                  cx - e.faceY * 22,
                  cy + e.faceX * 22,
                  2.4,
                  cfg.stats.burnDamage,
                );
                firePatch(
                  this,
                  cx + e.faceY * 22,
                  cy - e.faceX * 22,
                  2.4,
                  cfg.stats.burnDamage,
                );
              }
              for (const q of alive) {
                const dx = q.x - e.x,
                  dy = q.y - e.y,
                  d = Math.hypot(dx, dy) || 1;
                if (d < reach && (dx * e.faceX + dy * e.faceY) / d > 0.62) {
                  this.hurt(q, e.damage, e);
                  q.burning = Math.max(q.burning || 0, 2);
                  q.burnDamage = cfg.stats.burnDamage;
                  q.burnTick = 0.5;
                }
              }
            }
            e.fireAction = null;
            e.state = "recover";
            e.timer = 0.85;
            e.cooldown = cfg.stats.fireCooldown || 3.2;
          }
          continue;
        }
        e.faceX = aimX;
        e.faceY = aimY;
        if (e.fireCooldown <= 0) {
          if (rangeToTarget < 90) {
            e.fireAction = "tail";
            e.fireActionTimer = 0.45;
            e.state = "tailSwipe";
          } else if (rangeToTarget <= (cfg.stats.flameRange || 190)) {
            e.fireAction = "breath";
            e.fireActionTimer = 0.8;
            e.state = "breath";
          }
        }
        if (rangeToTarget > 110)
          this.moveActor(e, aimX * e.speed * dt, aimY * e.speed * dt);
        continue;
      }
      if (aiKind === "golem") {
        e.rockTimer = (e.rockTimer || 0) - dt;
        if (e.boulderReady && rangeToTarget < 235) {
          this.arrows.push({
            id: this.nextId++,
            x: e.x,
            y: e.y,
            z: 28,
            vx: aimX * 165,
            vy: aimY * 165,
            vz: 35,
            damage: e.damage,
            hostile: true,
            rock: true,
          });
          e.boulderReady = false;
          e.attack = 0.45;
          e.state = "recover";
          e.timer = 0.9;
          e.cooldown = 2;
          continue;
        }
        if (
          !e.boulderReady &&
          rangeToTarget > 170 &&
          e.rockTimer <= 0 &&
          e.state !== "rocklift"
        ) {
          e.state = "rocklift";
          e.timer = 0.8;
          e.rockTimer = 5.5;
          e.faceX = aimX;
          e.faceY = aimY;
          continue;
        }
        if (e.state === "rocklift") {
          e.timer -= dt;
          if (e.timer <= 0) {
            e.state = "hunt";
            e.boulderReady = true;
          }
          continue;
        }
      }
      if (aiKind === "skeleton_wizard") {
        e.healCooldown = (e.healCooldown ?? 2) - dt;
        const ally = this.enemies
          .filter(
            (q) => q !== e && q.hp > 0 && q.group === e.group && q.hp < q.maxHp,
          )
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (ally && e.healCooldown <= 0) {
          ally.hp = Math.min(
            ally.maxHp,
            ally.hp + Math.max(18, ally.maxHp * 0.28),
          );
          e.healCooldown = 20;
          e.healEffect = 0.8;
          this.effects.push({
            x: ally.x,
            y: ally.y,
            radius: 25,
            color: "#ffe17c",
            life: 0.8,
            text: "+",
          });
        } else if (e.cooldown <= 0 && rangeToTarget < 420) {
          this.arrows.push({
            id: this.nextId++,
            x: e.x,
            y: e.y,
            z: 20,
            vx: aimX * 210,
            vy: aimY * 210,
            vz: 0,
            damage: Math.max(1, e.damage - 4),
            hostile: true,
            ice: true,
          });
          e.cooldown = 2.8;
          e.attack = 0.4;
        }
        if (rangeToTarget < 150)
          this.moveActor(e, -aimX * 35 * dt, -aimY * 35 * dt);
        continue;
      }
      e.spitTime = Math.max(0, (e.spitTime || 0) - dt);
      if (beh.poisonSpit) {
        e.spitCooldown = (e.spitCooldown || 0) - dt;
        if (e.spitTime <= 0.2 && e.pendingSpit) {
          if (e.flash <= 0 && e.state !== "snared")
            this.poisonShots.push({ ...e.pendingSpit, x: e.x, y: e.y });
          e.pendingSpit = null;
        }
        const range = distance(e, p);
        if (
          e.spitCooldown <= 0 &&
          range > 90 &&
          range < 350 &&
          !e.pendingSpit
        ) {
          const speed = cfg.stats.spitSpeed || 190;
          e.spitTime = 0.6;
          e.spitCooldown = cfg.stats.spitCooldown || 3.5;
          e.pendingSpit = {
            vx: ((p.x - e.x) / range) * speed,
            vy: ((p.y - e.y) / range) * speed,
            life: 2,
            damage: cfg.stats.poisonDamage || 2,
            duration: cfg.stats.poisonDuration || 4,
          };
        }
      }
      if (beh.banana) {
        e.bananaTimer = (e.bananaTimer || 0) - dt;
        if (e.pendingBanana && e.throwTime <= 0.28) {
          if (e.state !== "snared" && e.flash <= 0)
            this.bananas.push({ ...e.pendingBanana, x: e.x, y: e.y });
          e.pendingBanana = null;
        }
        const range = distance(e, p);
        if (
          e.bananaTimer <= 0 &&
          range > 50 &&
          range < 300 &&
          e.state !== "snared" &&
          e.flash <= 0
        ) {
          const d = range || 1;
          e.pendingBanana = {
            x: e.x,
            y: e.y,
            z: 22,
            vx: ((p.x - e.x) / d) * (cfg.stats.bananaSpeed || 180),
            vy: ((p.y - e.y) / d) * (cfg.stats.bananaSpeed || 180),
            vz: 55,
            life: 3,
            damage: 8,
          };
          e.bananaTimer = cfg.stats.bananaCooldown || 2.5;
          e.throwTime = 0.5;
          e.faceX = (p.x - e.x) / d;
          e.faceY = (p.y - e.y) / d;
        }
      }
      if (beh.ranged) {
        const d = distance(e, p) || 1;
        e.faceX = (p.x - e.x) / d;
        e.faceY = (p.y - e.y) / d;
        const canShoot = d <= (cfg?.stats.rangedRange || 360) && clearShot(this,e,p);
        if (!canShoot) {
          if (beh.hunt !== false) navigateEnemy(this,e,p,dt);
          continue;
        }
        if (e.state === 'snared') { e.timer -= dt; if(e.timer<=0)e.hp=0; continue; }
        if (e.cooldown <= 0) {
          this.arrows.push({
            id: this.nextId++,
            x: e.x,
            y: e.y,
            z: 20,
            vx: e.faceX * 270,
            vy: e.faceY * 270,
            vz: 45,
            damage: e.damage,
            hostile: true,
          });
          e.cooldown = cfg?.stats.rangedCooldown || 2.3;
          e.attack = 0.34;
        }
        if (d < 130) this.moveActor(e, -e.faceX * 40 * dt, -e.faceY * 40 * dt);
        continue;
      }
      if (e.state === "recover") {
        e.timer -= dt;
        if (e.timer <= 0) {
          e.state = "hunt";
          e.tacticTime = 1.2 + this.random() * 1.4;
        }
        continue;
      }
      if (e.state === "flee") {
        e.timer -= dt;
        const d = distance(e, p) || 1;
        this.moveActor(
          e,
          ((e.x - p.x) / d) * e.speed * dt,
          ((e.y - p.y) / d) * e.speed * dt,
        );
        if (e.timer <= 0) e.state = "hunt";
        continue;
      }
      if (e.state === "snared") {
        e.timer -= dt;
        if (e.timer <= 0) e.hp = 0;
        continue;
      }
      const trap = this.traps.find((t) => t.life > 0 && distance(t, e) < 30);
      if (trap && trap.variant === "slow") {
        e.rooted = Math.max(e.rooted || 0, 0.5);
        this.moveActor(e, (trap.x - e.x) * dt * 0.1, (trap.y - e.y) * dt * 0.1);
      }
      if (trap && trap.variant !== "slow") {
        trap.life = 0;
        e.state = trap.variant === "interrupt" ? "recover" : "snared";
        e.timer =
          trap.variant === "interrupt"
            ? 1.8
            : rules.captureTime * (trap.capture || 1);
        e.flash = 0.2;
        this.onSound("trap");
        continue;
      }
      if (e.state === "windup") {
        e.timer -= dt;
        if (e.timer <= 0) {
          e.attack = 0.34;
          if (
            aiKind === "golem" ||
            aiKind === "vine" ||
            aiKind === "skeleton"
          ) {
            for (const q of alive)
              if (
                distance(e, q) <
                  (aiKind === "golem"
                    ? 95
                    : aiKind === "skeleton"
                      ? 65
                      : 120) &&
                (aiKind === "golem" ||
                  ((q.x - e.x) * e.dx + (q.y - e.y) * e.dy) /
                    (distance(e, q) || 1) >
                    0.65)
              ) {
                const before = q.hp;
                this.hurt(q, e.damage, e);
                if (aiKind === "golem" && q.hp < before && q.hp > 0) {
                  q.stun = cfg?.stats.stunDuration ?? 1.5;
                  q.stunMax = q.stun;
                  const d = distance(e, q) || 1;
                  this.moveActor(
                    q,
                    ((q.x - e.x) / d) * (cfg?.stats.knockback ?? 85),
                    ((q.y - e.y) / d) * (cfg?.stats.knockback ?? 85),
                  );
                }
                if (beh.root && !stat(q, "rootResist")) q.rooted = 1.5;
              }
            if (aiKind === "vine")
              this.baits = this.baits.filter((b) => distance(e, b) > 130);
            e.state = "recover";
            e.timer = cfg?.edited
              ? cfg.stats.recovery
              : aiKind === "skeleton"
                ? 1.3
                : 0.8;
            e.cooldown = 2;
            this.effects.push({
              x: e.x,
              y: e.y,
              radius: aiKind === "golem" ? 95 : 120,
              color: "#f0bd74",
              life: 0.35,
            });
          } else {
            e.state = "charge";
            e.timer = cfg?.stats
              ? cfg.stats.dashDistance / Math.max(1, cfg.stats.dashSpeed)
              : 0.48;
          }
        }
        continue;
      }
      if (e.state === "charge") {
        e.timer -= dt;
        const travel = this.moveActor(
          e,
          e.dx * (cfg?.stats.dashSpeed || 340) * dt,
          e.dy * (cfg?.stats.dashSpeed || 340) * dt,
          ["bat", "wasp"].includes(aiKind),
        );
        if (travel < dt * 80) e.timer = 0;
        for (const q of alive) if (distance(e, q) < 30) {
          const before = q.hp;
          this.hurt(q, e.damage, e);
          if (aiKind === "tsetse" && q.hp < before && q.hp > 0 && !(q.sleeping > 0)) q.sleeping = 3;
        }
        if (e.timer <= 0) {
          e.state = "recover";
          e.timer = cfg?.edited
            ? cfg.stats.recovery
            : aiKind === "crocodile"
              ? 1.3
              : 0.65;
          e.cooldown = cfg?.stats.dashCooldown || 1.8;
        }
        continue;
      }
      const d = distance(e, p),
        dx = (p.x - e.x) / (d || 1),
        dy = (p.y - e.y) / (d || 1);
      e.faceX = dx;
      e.faceY = dy;
      const special = [
        "lion",
        "crocodile",
        "boar",
        "panther",
        "golem",
        "vine",
        "snake",
        "bat",
        "wasp",
        "tsetse",
        "skeleton",
      ].includes(aiKind);
      if (
        special &&
        (beh.dash ||
          (["vine", "golem", "skeleton"].includes(aiKind) && beh.melee)) &&
        d <
          (cfg?.edited
            ? cfg.stats.attackRange
            : aiKind === "vine"
              ? 120
              : aiKind === "skeleton"
                ? 65
                : aiKind === "golem"
                  ? 95
                  : 155) &&
        e.cooldown <= 0 &&
        (!["lion", "panther", "bat", "wasp"].includes(aiKind) ||
          e.tacticTime <= 0)
      ) {
        e.state = "windup";
        e.timer = cfg?.edited
          ? cfg.stats.windup
          : aiKind === "golem"
            ? 0.9
            : aiKind === "snake"
              ? 0.85
              : 0.65;
        e.dx = dx;
        e.dy = dy;
        continue;
      }
      if (d > 23 && beh.hunt) {
        let vx = dx,
          vy = dy;
        if (beh.circle && d < 220 && e.tacticTime > 0) {
          const radial = d < 100 ? -0.65 : d > 155 ? 0.5 : 0;
          vx = dx * radial - dy * e.orbit;
          vy = dy * radial + dx * e.orbit;
        }
        if (aiKind === "snake") {
          const sway = Math.sin(this.time * 4 + e.id) * 0.7;
          vx += -dy * sway;
          vy += dx * sway;
        }
        if (crossesTable(e, p)) {
          e.detourX ??=
            CENTER +
            (Math.sign(e.x - CENTER) || e.orbit) * (TABLE.halfWidth + 22);
          if (Math.abs(e.x - e.detourX) > 4) {
            vx = Math.sign(e.detourX - e.x);
            vy = 0;
          } else {
            vx = 0;
            vy = Math.sign(p.y - e.y);
          }
        } else e.detourX = null;
        const norm = Math.hypot(vx, vy) || 1;
        vx /= norm;
        vy /= norm;
        const travel = this.moveActor(
          e,
          vx * e.speed * dt,
          vy * e.speed * dt,
          ["bat", "wasp"].includes(aiKind),
        );
        if (travel < e.speed * dt * 0.25 && e.speed > 0) {
          if (
            Math.abs(e.x - CENTER) < TABLE.halfWidth + 12 &&
            Math.abs(e.y - CENTER) < TABLE.halfHeight + 30
          )
            this.moveActor(
              e,
              (Math.sign(p.x - CENTER) || e.orbit) * e.speed * dt,
              0,
            );
          else
            this.moveActor(
              e,
              -dy * e.orbit * e.speed * dt,
              dx * e.orbit * e.speed * dt,
              ["bat", "wasp"].includes(aiKind),
            );
        }
      }
      if (d < 29 && e.cooldown <= 0) {
        if (beh.melee && !["skeleton", "vine"].includes(aiKind))
          this.hurt(p, e.damage, e);
        e.cooldown = 1;
        if (beh.steal && p.traps > 0) {
          p.traps--;
          e.state = "flee";
          e.timer = 2.5;
          this.effects.push({
            x: e.x,
            y: e.y - 25,
            text: "STOLEN!",
            color: "#efc471",
            life: 1,
          });
        }
      }
    }
    for (const e of this.enemies.filter((e) => e.hp <= 0 && !e.defeated)) {
      e.defeated = true;
      e.deathTimer = 0;
      summonGhost(this,e);
      this.enemyLoot(e);
      this.cleared++;
      this.onSound(creatureCue(e.kind,'death'),e);
      this.effects.push({
        x: e.x,
        y: e.y,
        text: e.state === "snared" ? "TRAPPED!" : "CLEARED",
        color: "#b9e6a1",
        life: 1,
      });
      if (this.random() < (e.kind === "panther" ? 0.1 : 0.05))
        this.pickups.push({ x: e.x, y: e.y, used: false, life: 45 });
      if (e.kind === "panther")
        for (const p of alive) p.hp = Math.min(100, p.hp + 25);
    }
    for (const e of this.enemies) if (e.hp <= 0) e.deathTimer = (e.deathTimer || 0) + dt;
    this.enemies = this.enemies.filter((e) => e.hp > 0 || (e.state !== "snared" && (e.deathTimer || 0) < 3.5));
    maintainSpiderWebs(this, dt);
    for (const t of this.traps) t.life -= dt;
    this.traps = this.traps.filter((t) => t.life > 0);
    for (const p of this.pickups) p.life -= dt;
    this.pickups = this.pickups.filter((p) => !p.used && p.life > 0);
    for (const fx of this.effects) fx.life -= dt;
    this.effects = this.effects.filter((f) => f.life > 0);
    if (!this.players.some((p) => p.hp > 0)) {
      this.phase = "lost";
      for (const p of this.players) {
        p.inventory = [{ type: "trap", qty: 3 }];
        p.equipment = Object.fromEntries(
          Object.keys(p.equipment).map((k) => [k, null]),
        );
      }
      this.persist();
      this.onSound("lose");
    }
  }
}
Object.assign(Game.prototype, adventureMethods);

