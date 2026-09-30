import {wolfMotion, validateWolfMotion, replaceWolfMotion} from './wolf-motion.mjs';
import { NIGHT_KINDS, nightMotions, validateNightMotion, replaceNightMotion } from './night-rigs.mjs';
import {
  beastMotions,
  validateBeastMotion,
  replaceBeastMotion,
} from "./beast-motion.mjs";
import {
  alligatorMotion,
  validateAlligatorMotion,
  replaceAlligatorMotion,
} from "./alligator-motion.mjs";
import {
  skeletonMotions,
  validateSkeletonMotion,
  replaceSkeletonMotion,
} from "./skeleton-motion.mjs";
import {
  playerMotion,
  replacePlayerMotion,
  validatePlayerMotion,
} from "./player-motion.mjs";
import {
  rhinoMotion,
  validateRhinoMotion,
  replaceRhinoMotion,
} from "./rhino-motion.mjs";
import {
  lionMotion,
  tigerMotion,
  replaceLionMotion,
  replaceTigerMotion,
  validateLionMotion,
} from "./lion-motion.mjs";
import {
  batMotion,
  validateBatMotion,
  replaceBatMotion,
} from "./bat-motion.mjs";
import {
  creatureMotions,
  validateCreatureMotion,
  replaceCreatureMotion,
} from "./creature-motion.mjs";
import { applyRigSpriteOverrides } from "./rig-sprite-storage.mjs";
export const RULE_DEFAULTS = {
  startingTraps: 3,
  potionHeal: 45,
  visionRadius: 280,
  dashCooldown: 3,
  dashSpeed: 360,
  dashDuration: 0.28,
  portalGrace: 10,
  portalDamage: 0.5,
  sealHold: 2.5,
  sealDuration: 3,
  arrowGravity: 180,
  bowSpeed: 180,
  bowBonusSpeed: 300,
  trapDuration: 35,
  captureTime: 2,
};
export const rules = { ...RULE_DEFAULTS };
const part = (name, parent, x, y, w, h, color, motion = "none") => ({
  name,
  parent,
  x,
  y,
  w,
  h,
  color,
  motion,
  angle: 0,
  pivotX: 0.5,
  pivotY: 0,
  source: "",
  rect: [0, 0, 48, 48],
  views: {},
});
export function rigPreset(type = "quadruped") {
  const r = {
    type,
    mode: "rig",
    stride: 4,
    rate: 8,
    bob: 1,
    tailThickness: 3,
    tailLength: 26,
    tailSegments: 9,
    tailTaper: 0.8,
    tailSwing: 5,
    tailTip: 3,
    parts: [],
  };
  if (type === "humanoid")
    r.parts = [
      part("legL", "", -5, 8, 6, 12, "#80694d", "legL"),
      part("footL", "legL", 0, 9, 8, 4, "#243b31"),
      part("legR", "", 5, 8, 6, 12, "#80694d", "legR"),
      part("footR", "legR", 0, 9, 8, 4, "#243b31"),
      part("body", "", 0, -3, 17, 16, "#638d70"),
      part("armL", "body", -11, 3, 5, 12, "#d9ab76", "armL"),
      part("handL", "armL", 0, 10, 7, 5, "#d9ab76"),
      part("armR", "body", 11, 3, 5, 12, "#d9ab76", "armR"),
      part("handR", "armR", 0, 10, 7, 5, "#d9ab76"),
      part("head", "body", 0, -19, 18, 19, "#d9ab76"),
    ];
  else if (type === "plant")
    r.parts = [
      part("base", "", 0, 17, 25, 8, "#456740"),
      part("head", "", 0, -18, 23, 15, "#bb554d"),
    ];
  else if (type === "serpent")
    r.parts = [part("head", "", 0, -17, 12, 13, "#73924e")];
  else if (type === "winged")
    r.parts = [
      part("wingL", "", -5, 0, 21, 9, "#815d91", "wingL"),
      part("wingR", "", 5, 0, 21, 9, "#815d91", "wingR"),
      part("body", "", 0, -4, 12, 17, "#675171"),
      part("head", "", 0, -11, 12, 10, "#866294"),
    ];
  else
    r.parts = [
      part("legFL", "", -9, -5, 5, 11, "#b88c49", "legL"),
      part("footFL", "legFL", 0, 8, 7, 4, "#d9b16c"),
      part("legFR", "", 9, -5, 5, 11, "#b88c49", "legR"),
      part("footFR", "legFR", 0, 8, 7, 4, "#d9b16c"),
      part("legBL", "", -8, 10, 5, 10, "#b88c49", "legR"),
      part("footBL", "legBL", 0, 8, 7, 4, "#d9b16c"),
      part("legBR", "", 8, 10, 5, 10, "#b88c49", "legL"),
      part("footBR", "legBR", 0, 8, 7, 4, "#d9b16c"),
      part("body", "", 0, -10, 18, 28, "#cba057"),
      part("head", "", 0, -22, 24, 20, "#9b7138"),
    ];
  return r;
}
// Keep the editor's base stats aligned with NIGHT_EVENTS without importing AI
// (night-enemies depends on these definitions). Saved stat edits still win.
const NIGHT_CREATURE_DEFAULTS = {
  night_stalker: { type: 'quadruped', hp: 85, speed: 80, damage: 16 },
  carrion_pack: { type: 'quadruped', hp: 48, speed: 72, damage: 10 },
  burrower: { type: 'serpent', hp: 80, speed: 64, damage: 18 },
  mimic_vine: { type: 'plant', hp: 65, speed: 0, damage: 12 },
  carnivorous_flower: { type: 'plant', hp: 115, speed: 0, damage: 14 },
  poison_pod: { type: 'plant', hp: 45, speed: 0, damage: 7 },
  hunter: { type: 'humanoid', hp: 210, speed: 68, damage: 24 },
  elephant: { type: 'quadruped', hp: 260, speed: 44, damage: 24 },
  zebra: { type: 'quadruped', hp: 65, speed: 110, damage: 9 },
  pelican: { type: 'winged', hp: 55, speed: 85, damage: 10 },
};
export function creatureDefaults(kind) {
  const night = NIGHT_CREATURE_DEFAULTS[kind];
  const type =
    kind.startsWith("explorer") ||
    ["skeleton", "skeleton_caster", "skeleton_wizard", "necromancer", "archer", "golem", "monkey", "hunter"].includes(kind)
      ? "humanoid"
      : ["vine", "carnivorous_flower", "mimic_vine", "poison_pod"].includes(kind)
        ? "plant"
        : kind === "snake"
          ? "serpent"
          : ["bat", "wasp", "tsetse", "pelican"].includes(kind)
            ? "winged"
            : "quadruped";
  const rig = rigPreset(night?.type || type);
  rig.mode = "rig";
  if (kind === "crocodile") {
    rig.tailThickness = 8;
    rig.tailTaper = 0.95;
    rig.tailLength = 34;
    rig.tailTip = 1;
  }
  return {
    name: kind,
    faction: kind.startsWith("explorer") ? "ally" : "enemy",
    aiKind: kind,
    rig,
    behaviors: {
      health: true,
      loot: false,
      hunt: true,
      jump: ["monkey","lion","tiger","panther"].includes(kind),
      circle: ["lion", "panther", "bat", "wasp", "tsetse", "fire_elemental", "water_elemental"].includes(
        kind,
      ),
      dash: [
        "lion",
        "panther",
        "crocodile",
        "boar",
        "snake",
        "bat",
        "wasp",
        "tsetse",
      ].includes(kind),
      melee: true,
      ranged: ["archer", "skeleton_wizard"].includes(kind),
      fireball: ["fire_elemental", "water_elemental"].includes(kind),
      fireTrail: ["fire_elemental", "dragon"].includes(kind),
      tailSwipe: kind === "dragon",
      flameBreath: kind === "dragon",
      steal: kind === "monkey",
      root: kind === "vine",
      banana: kind === "monkey",
      poisonSpit: kind === "vine",
    },
    stats: {
      hp: night?.hp ?? 80,
      speed: night?.speed ?? 60,
      damage: night?.damage ?? 12,
      detection: 600,
      attackRange: 65,
      windup: 0.65,
      recovery: 0.8,
      dashCooldown: kind === "panther" ? 0.65 : 1.8,
      dashDistance: kind === "panther" ? 80 : 163,
      dashSpeed: 340,
      rangedCooldown: 2.3,
      dropChance: 1,
      bananaCooldown: 2.5,
      bananaSpeed: 180,
      spitCooldown: 3.5,
      spitSpeed: 190,
      poisonDuration: 4,
      poisonDamage: 2,
      fireCooldown: kind === "dragon" ? 3.2 : 2.4,
      fireDamage: kind === "dragon" ? 18 : 12,
      burnDamage: kind === "dragon" ? 4 : 3,
      flameRange: 190,
      stunDuration: 1.5,
      knockback: 85,
    },
    drops: [],
    lootDrops: [],
    sounds: { attack: "attack", hurt: "hurt", defeat: "defeat" },
  };
}
export const creatures = {};
for (const name of [
  ...NIGHT_KINDS,
  "lion",
  "panther",
  "wolf",
  "crocodile",
  "boar",
  "snake",
  "bat",
  "beetle",
  "wasp",
  "tsetse",
  "vine",
  "golem",
  "monkey",
  "skeleton",
  "skeleton_caster",
  "necromancer",
  "archer",
  "rhino",
  "dragon",
  "fire_elemental",
  "water_elemental",
  "explorer-teal",
  "explorer-coral",
  "explorer-blue",
  "explorer-gold",
  "explorer-purple",
  "explorer-green",
])
  creatures[name] = creatureDefaults(name);
for(const [kind,base] of [['tiger','lion'],['gorilla','golem'],['white_lion','lion'],['snow_leopard','panther'],['spider','beetle'],['baby_spider','beetle'],['spider_egg','beetle']]){
  creatures[kind]=creatureDefaults(base);creatures[kind].name=kind;creatures[kind].aiKind=base;
}
for (const kind of ["skeleton_unarmed", "skeleton_boss"]) {
  creatures[kind] = creatureDefaults("skeleton");
  creatures[kind].name = kind;
  creatures[kind].aiKind = "skeleton";
}
creatures.krampus = creatureDefaults("skeleton");
creatures.krampus.name = "krampus";
creatures.krampus.aiKind = "skeleton";
creatures.krampus.stats = {...creatures.krampus.stats, hp: 260, speed: 58, damage: 26, attackRange: 74};
for (const [kind, stats] of [['skeleton_caster',{hp:92,speed:38,damage:16}],['necromancer',{hp:300,speed:35,damage:24}]]) {
  creatures[kind] = creatureDefaults('skeleton');
  creatures[kind].name = kind;
  creatures[kind].aiKind = kind;
  creatures[kind].stats = {...creatures[kind].stats,...stats,attackRange:68,rangedCooldown:2.8};
  creatures[kind].lootDrops = kind === 'necromancer' ? [] : [{item:'bone_shard',qty:1,chance:100}];
  if (kind === 'necromancer') creatures[kind].necromancerLoot = {
    pieces: ['necromancer_dagger','necromancer_wand'],
    chance: .9,
    sharedPieceChance: .28,
    onePerPlayer: true,
  };
}
creatures.skeleton_wizard = creatureDefaults("skeleton_wizard");
creatures.skeleton_wizard.name = "skeleton_wizard";
creatures.skeleton_wizard.aiKind = "skeleton_wizard";
creatures.tsetse = creatureDefaults("wasp");
creatures.tsetse.name = "tsetse";
creatures.tsetse.aiKind = "tsetse";
creatures.tsetse.stats.hp = 30;
creatures.tsetse.stats.damage = 5;
creatures.tsetse.stats.dashCooldown = 3.2;
creatures.tsetse.stats.dashDistance = 150;
creatures.tsetse.stats.dashSpeed = 260;
creatures.frost_skeleton_mage = creatureDefaults("skeleton_wizard");
creatures.frost_skeleton_mage.name = "frost_skeleton_mage";
creatures.frost_skeleton_mage.aiKind = "skeleton_wizard";
creatures.frost_skeleton_mage.stats.hp = 120;
creatures.frost_skeleton_mage.stats.damage = 16;
for (const [name, c] of Object.entries(creatures)) {
  if (name.startsWith("explorer")) {
    const color = name.slice(9);
    for (const p of c.rig.parts) {
      const type = p.name.replace(/[LR]$/, "");
      const dims = {
        head: [20, 20],
        body: [18, 16],
        arm: [6, 13],
        leg: [6, 12],
        foot: [9, 5],
        hand: [6, 6],
      }[type];
      if (!dims) continue;
      [p.w, p.h] = dims;
      p.source = "part-" + color + "-" + type + "-down";
      p.rect = [0, 0, ...dims];
      for (const facing of ["down", "up", "left", "right"])
        p.views[facing] = {
          source: "part-" + color + "-" + type + "-" + facing,
          x: facing === "up" && p.name.match(/[LR]$/) ? -p.x : p.x,
        };
      if (["arm", "leg"].includes(type)) {
        p.views.left.x = p.name.endsWith("L") ? -2 : 3;
        p.views.right.x = p.name.endsWith("L") ? -3 : 2;
      }
    }
  } else if (["skeleton", "skeleton_caster", "necromancer", "archer", "skeleton_wizard", "krampus"].includes(name)) {
    for (const p of c.rig.parts)
      p.color = p.name.includes("foot") ? "#8c8871" : "#ddd7af";
    if (name === "skeleton_wizard")
      for (const p of c.rig.parts) {
        if (p.name === "body") p.color = "#485d91";
        if (p.name.startsWith("arm")) p.color = "#7189c3";
        if (p.name === "head") p.color = "#d9d7be";
      }
    if (name === "skeleton_caster") for (const p of c.rig.parts) {
      if (p.name === 'body') p.color = '#655478';
      if (p.name.startsWith('arm')) p.color = '#8c6aa8';
    }
    if (name === "necromancer") for (const p of c.rig.parts) {
      if (p.name === 'body') p.color = '#4d315f';
      if (p.name.startsWith('arm')) p.color = '#704678';
      if (p.name === 'head') p.color = '#d7c4e3';
      if (p.name.includes('foot')) p.color = '#6b3e7b';
    }
  } else if (["lion", "panther", "boar", "crocodile", "wolf"].includes(name)) {
    const head = c.rig.parts.find((p) => p.name === "head");
    head.source = name === "wolf" ? "panther" : name;
    head.rect = name === "lion" ? [12, 21, 26, 17] : [14, 24, 22, 17];
    if (name === "wolf") for (const p of c.rig.parts) p.color = "#71808a";
    if (name === "crocodile") {
      head.w = 13;
      head.h = 22;
      for (const p of c.rig.parts) p.color = "#658249";
    }
    c.rig.parts.push(
      part(
        "tailEnd",
        "",
        0,
        0,
        c.rig.tailTip * 2,
        c.rig.tailTip * 2,
        name === "lion" ? "#76552e" : "#526d3b",
      ),
    );
  } else if (["bat", "wasp", "tsetse"].includes(name)) {
    for (const p of c.rig.parts) {
      p.source = name;
      p.rect =
        p.name === "wingL"
          ? [1, 8, 20, 24]
          : p.name === "wingR"
            ? [27, 8, 20, 24]
            : p.name === "head"
              ? [18, 4, 12, 12]
              : [18, 14, 12, 25];
      if (p.name === "wingL") p.pivotX = 1;
      if (p.name === "wingR") p.pivotX = 0;
    }
  } else if (name === "dragon") {
    for (const p of c.rig.parts) {
      p.color = p.name.startsWith("foot") ? "#e7a34d" : "#bd4b35";
      if (p.name === "body") {
        p.w = 28;
        p.h = 34;
      }
      if (p.name === "head") {
        p.w = 26;
        p.h = 22;
        p.color = "#dc6841";
      }
      if (p.name.startsWith("leg")) p.color = "#933d36";
    }
    c.rig.tailLength = 38;
    c.rig.tailThickness = 6;
    c.rig.tailSegments = 12;
    c.rig.tailTip = 5;
    c.rig.parts.push(
      part("wingL", "body", -17, -2, 20, 24, "#713a50"),
      part("wingR", "body", 17, -2, 20, 24, "#713a50"),
      part("hornL", "head", -7, -10, 4, 11, "#f0ce7a"),
      part("hornR", "head", 7, -10, 4, 11, "#f0ce7a"),
    );
  } else if (name === "fire_elemental") {
    for (const p of c.rig.parts) {
      p.color = ["head", "handL", "handR"].includes(p.name)
        ? "#ffb443"
        : "#e85e2e";
      if (p.name === "body") {
        p.w = 22;
        p.h = 24;
      }
    }
    c.rig.parts.push(
      part("core", "body", 0, 3, 10, 13, "#ffe17b"),
      part("flameCrown", "head", 0, -8, 10, 10, "#ff7b30"),
    );
  } else if (name === "water_elemental") {
    for (const p of c.rig.parts) {
      p.color = ["head", "handL", "handR"].includes(p.name) ? "#9ae7e4" : "#328b9c";
      if (p.name === "body") { p.w = 22; p.h = 24; }
    }
    c.rig.parts.push(part("core", "body", 0, 3, 10, 13, "#d4ffff"), part("crest", "head", 0, -8, 10, 10, "#55c8d0"));
  }
}
creatures.fire_elemental.dropType = "fire_wand";
creatures.frost_skeleton_mage.dropType = "ice_wand";
creatures.fire_elemental.behaviors.loot = true;
creatures.frost_skeleton_mage.behaviors.loot = true;
creatures.fire_elemental.stats.dropChance = 1;
for (const name of ["lion", "crocodile"]) {
  const r = creatures[name].rig;
  for (const p of r.parts) {
    const type = p.name.startsWith("leg")
      ? "leg"
      : p.name.startsWith("foot")
        ? "foot"
        : p.name;
    const dims = {
      head: [26, 26],
      body: [20, 28],
      leg: [7, 13],
      foot: [9, 6],
      tailEnd: [7, 11],
    }[type];
    if (dims) {
      p.source = "part-" + name + "-" + type;
      p.rect = [0, 0, ...dims];
      if (type === "head") {
        p.angle = Math.PI;
        p.pivotY = 0.5;
        p.y = -16;
        p.w = name === "crocodile" ? 15 : 26;
        p.h = name === "crocodile" ? 30 : 26;
      }
    }
  }
  r.parts.push(part("tailSegment", "", 0, 0, 8, 12, "#916b36"));
  const segment = r.parts.at(-1);
  segment.source = "part-" + name + "-tail";
  segment.rect = [0, 0, 8, 12];
}
for (const name of ["golem", "monkey"]) {
  const r = creatures[name].rig;
  for (const p of r.parts) {
    p.source = name;
    p.rect =
      p.name === "head"
        ? name === "golem"
          ? [15, 2, 18, 15]
          : [14, 23, 22, 17]
        : p.name === "body"
          ? [11, 14, 26, 18]
          : p.name.startsWith("arm")
            ? p.name.endsWith("L")
              ? [1, 16, 13, 19]
              : [33, 16, 13, 19]
            : p.name.startsWith("leg")
              ? [11, 31, 12, 14]
              : p.name.startsWith("foot")
                ? [11, 36, 12, 10]
                : [2, 27, 10, 10];
    if (p.name === "body") p.w = 23;
  }
}
for (const p of creatures.panther.rig.parts)
  if (p.name !== "head") {
    p.color = "#2c3a48";
  }
for (const p of creatures.boar.rig.parts)
  if (p.name !== "head") {
    p.color = "#785630";
  }
for (const p of creatures.rhino.rig.parts) {
  p.color = "#7f8c83";
  if (p.name === "body") p.w = 28;
  if (p.name === "head") {
    p.w = 23;
    p.h = 18;
  }
}
creatures.rhino.rig.tailLength = 9;
creatures.rhino.rig.tailThickness = 2;
creatures.snake.rig.tailThickness = 5;
creatures.snake.rig.tailLength = 34;
creatures.snake.rig.tailSegments = 20;
creatures.snake.rig.tailTip = 1;
const snakeHead = creatures.snake.rig.parts[0];
snakeHead.source = "snake";
snakeHead.rect = [19, 1, 20, 18];
snakeHead.angle = Math.PI;
snakeHead.pivotY = 0.5;
export function validateRig(r) {
  if (
    !r ||
    !["quadruped", "humanoid", "serpent", "winged", "plant"].includes(r.type) ||
    !Array.isArray(r.parts) ||
    r.parts.length > 40
  )
    return false;
  const names = new Set(r.parts.map((p) => p.name));
  if (names.size !== r.parts.length) return false;
  for (const p of r.parts) {
    if (
      !p.name ||
      (p.parent && !names.has(p.parent)) ||
      ![p.x, p.y, p.w, p.h, p.pivotX, p.pivotY, p.angle].every(
        Number.isFinite,
      ) ||
      p.w <= 0 ||
      p.h <= 0
    )
      return false;
    const seen = new Set([p.name]);
    let name = p.parent;
    while (name) {
      if (seen.has(name)) return false;
      seen.add(name);
      name = r.parts.find((p) => p.name === name)?.parent;
    }
  }
  return true;
}
export function loadDefinitions(events, items) {
  try {
    const d = JSON.parse(localStorage.getItem("wildbound-design") || "null");
    if (!d) return;
    applyDefinitions(d, events, items);
  } catch (e) {
    console.warn("Design data not loaded", e);
  }
}
export function applyDefinitions(d, events, items, { spriteOverrides = true } = {}) {
  for (const [kind, model] of Object.entries(d.nightMotions || {}))
    if (!validateNightMotion(kind, model)) throw Error('Invalid night animation: ' + kind);
  for (const [k, m] of Object.entries(d.beastMotions || {}))
    if (!beastMotions[k] || !validateBeastMotion(k, m))
      throw Error("Invalid beast rig");
  if (d.version !== 1) throw Error("Unsupported design version");
  if (d.alligator && !validateAlligatorMotion(d.alligator))
    throw Error("Invalid alligator rig");
  for (const [kind, m] of Object.entries(d.skeletonMotions || {}))
    if (!skeletonMotions[kind] || !validateSkeletonMotion(kind, m))
      throw Error("Invalid skeleton rig");
  if (d.player && !validatePlayerMotion(d.player))
    throw Error("Invalid player animation");
  if (d.wolf && !validateWolfMotion(d.wolf)) throw Error("Invalid wolf animation");
  if (d.lion && !validateLionMotion(d.lion))
    throw Error("Invalid lion animation");
  if (d.tiger && !validateLionMotion(d.tiger))
    throw Error("Invalid tiger animation");
  if (d.bat && !validateBatMotion(d.bat)) throw Error("Invalid bat animation");
  if (d.rhino && !validateRhinoMotion(d.rhino))
    throw Error("Invalid rhino animation");
  for (const [kind, model] of Object.entries(d.creatureMotions || {}))
    if (!creatureMotions[kind] || !validateCreatureMotion(kind, model))
      throw Error("Invalid creature animation: " + kind);
  for (const [k, c] of Object.entries(d.creatures || {})) {
    if (!/^[a-zA-Z0-9_-]{1,60}$/.test(k) || !validateRig(c.rig))
      throw Error("Invalid rig: " + k);
    creatures[k] = {
      ...c,
      behaviors: { ...creatureDefaults(k).behaviors, ...c.behaviors },
      stats: { ...creatureDefaults(k).stats, ...c.stats },
    };
  }
  if (!d.creatures?.panther?.edited) {
    creatures.panther.stats.dashDistance = 80;
    creatures.panther.stats.dashCooldown = 0.65;
  }
  for (const k of Object.keys(rules))
    if (Number.isFinite(d.rules?.[k]) && d.rules[k] > 0) rules[k] = d.rules[k];
  for (const [k, m] of Object.entries(d.beastMotions || {}))
    replaceBeastMotion(k, m);
  if (d.player) replacePlayerMotion(d.player);
  if (d.alligator) replaceAlligatorMotion(d.alligator);
  for (const [kind, m] of Object.entries(d.skeletonMotions || {}))
    replaceSkeletonMotion(kind, m);
  if (d.lion) replaceLionMotion(d.lion);
  if (d.tiger) replaceTigerMotion(d.tiger);
  if (d.wolf) replaceWolfMotion(d.wolf);
  if (d.bat) replaceBatMotion(d.bat);
  if (d.rhino) replaceRhinoMotion(d.rhino);
  for (const [kind, model] of Object.entries(d.creatureMotions || {}))
    replaceCreatureMotion(kind, model);
  for (const [kind, model] of Object.entries(d.nightMotions || {}))
    replaceNightMotion(kind, model);
  const savedSpriteModels = {
    player: playerMotion,
    alligator: alligatorMotion,
    lion: lionMotion,
    tiger: tigerMotion,
    wolf: wolfMotion,
    bat: batMotion,
    tsetse: batMotion,
    rhino: rhinoMotion,
    ...beastMotions,
    ...skeletonMotions,
    ...creatureMotions,
    ...nightMotions,
  };
  if (spriteOverrides) for (const [subject, model] of Object.entries(savedSpriteModels))
    applyRigSpriteOverrides(subject, model);
  if (Array.isArray(d.events) && d.events.length) {
    const stampedeSquad = events.find(e => e.type === 'stampede' && Array.isArray(e.squad))?.squad
      || ['rhino', 'elephant', 'zebra', 'zebra', 'pelican'];
    const importedEvents = d.events.map(event => event.type === 'stampede' && event.squad == null
      ? { ...event, squad: structuredClone(stampedeSquad) }
      : event);
    const added = events.filter(
      (e) =>
        [
          ...NIGHT_KINDS,
          "skeleton_unarmed",
          "skeleton_boss",
          "beetle",
          "spider",
          "gorilla",
          "blizzard",
          "white_lion",
          "snow_leopard",
          "dragon",
  "fire_elemental",
  "water_elemental",
        ].includes(e.kind) && !d.events.some((old) => old.kind === e.kind),
    );
    events.splice(0, events.length, ...importedEvents, ...added);
  }
  for(const event of events)if(event.kind==="monkey"||event.kind==="gorilla")event.environment="temple";
  for (const [k, v] of Object.entries(d.items || {}))
    if (v?.name && /^#[0-9a-f]{6}$/i.test(v.color || ""))
      items[k] = {
        ...items[k],
        ...v,
        ...(k === "charm" ? { slot: "neck" } : {}),
      };
}
export function definitionPack(events, items) {
  return {
    version: 1,
    creatures,
    rules,
    events,
    items,
    player: playerMotion,
    alligator: alligatorMotion,
    skeletonMotions,
    lion: lionMotion,
    tiger: tigerMotion,
    wolf: wolfMotion,
    bat: batMotion,
    rhino: rhinoMotion,
    creatureMotions,
    nightMotions,
    beastMotions,
  };
}
