export const SLOTS = [
  "head",
  "neck",
  "cape",
  "shoulders",
  "chest",
  "gloves",
  "pants",
  "feet",
  "hand1",
  "hand2",
];
export const ITEMS = {
  ritual_dagger:{name:'Ritual Dagger',base:'dagger',slot:'hand1',damage:32,stack:1,rarity:'legendary',color:'#efb94e',artColor:'#73e5cc',description:'Legendary · dagger kills summon a ghost ally for 30 seconds. Up to six spirits follow each wielder.'},
  barricade: {
    name: "Trail barricade",
    stack: 5,
    color: "#a78b62",
    description:
      "Deploy from Field Kit: a temporary obstacle that blocks walkers and shots.",
  },
  stick: {
    name: "Stick",
    stack: 99,
    color: "#a78652",
    description: "Gathered by striking trees. Crafting material.",
  },
  log: {
    name: "Log",
    stack: 30,
    color: "#bd945b",
    description: "Harvested from a felled tree. Timber material.",
  },
  stone: {
    name: "Stone chunk",
    stack: 99,
    color: "#a5b1a1",
    description: "Mined from rocks. Building material.",
  },
  jade_scarab: {
    name: "Jade scarab",
    base: "relic",
    relic: true,
    relicStyle: "scarab",
    rarity: "rare",
    color: "#70c49a",
    artColor: "#55bd89",
    stack: 1,
    armor: 1,
    rootResist: true,
    description: "Carried relic · Armor +1 · resist roots.",
  },
  lions_eye: {
    name: "Lion's eye",
    base: "relic",
    relic: true,
    relicStyle: "eye",
    rarity: "rare",
    color: "#70c49a",
    artColor: "#d89443",
    stack: 1,
    punch: 2,
    description: "Carried relic · Fists +2.",
  },
  river_stone: {
    name: "River stone",
    base: "relic",
    relic: true,
    relicStyle: "stone",
    rarity: "rare",
    color: "#70c49a",
    artColor: "#73b6c0",
    stack: 1,
    magnet: 12,
    description: "Carried relic · Loot reach +12.",
  },
  ash_reliquary: {
    name: "Ash reliquary",
    base: "relic",
    relic: true,
    relicStyle: "reliquary",
    rarity: "rare",
    color: "#70c49a",
    artColor: "#bf8467",
    stack: 1,
    poisonResist: 1,
    description: "Carried relic · Resist poison.",
  },
  warden_totem: {
    name: "Warden totem",
    base: "relic",
    relic: true,
    relicStyle: "totem",
    rarity: "unique",
    color: "#c58bfa",
    artColor: "#8c9f63",
    stack: 1,
    armor: 2,
    description: "Carried relic · Armor +2.",
  },
  sun_dial: {
    name: "Sun dial",
    base: "relic",
    relic: true,
    relicStyle: "sun",
    rarity: "unique",
    color: "#c58bfa",
    artColor: "#e8b84e",
    stack: 1,
    punch: 3,
    description: "Carried relic · Fists +3.",
  },
  moon_reliquary: {
    name: "Moon reliquary",
    base: "relic",
    relic: true,
    relicStyle: "moon",
    rarity: "unique",
    color: "#c58bfa",
    artColor: "#a49bd9",
    stack: 1,
    armor: 1,
    magnet: 8,
    description: "Carried relic · Armor +1 · loot reach +8.",
  },
  amber_reliquary: {
    name: "Amber reliquary",
    base: "relic",
    relic: true,
    relicStyle: "amber",
    rarity: "unique",
    color: "#c58bfa",
    artColor: "#d99a3f",
    stack: 1,
    magnet: 16,
    poisonResist: 1,
    description: "Carried relic · Loot reach +16 · resist poison.",
  },
  trap: {
    name: "Snare trap",
    stack: 20,
    color: "#c7ab66",
    description: "Q / X: place directly from your pack.",
  },
  stamina_potion: {
    name: "Stamina potion",
    stack: 20,
    color: "#7fdb87",
    description: "Halves dash cooldown for 30 seconds. Use from backpack.",
  },
  potion: {
    name: "Health potion",
    stack: 20,
    color: "#ef698b",
    description: "H / RB: restore 45 health.",
  },
  arrow: {
    name: "Arrow",
    stack: 99,
    color: "#ddd5ae",
    description: "Consumed when fired; recover from ground or enemy loot.",
  },
  fruit: {
    name: "Sweet fruit",
    stack: 20,
    color: "#cbbc68",
    description: "T / D-pad down: toss to distract a biting plant.",
  },
  coconut: {
    name: "Coconut",
    stack: 20,
    color: "#c6a36a",
    description: "Eat from the backpack to restore 18 HP.",
  },
  meat: {
    name: "Raw meat",
    stack: 20,
    color: "#d98d73",
    description: "Plant bait. Meat is used before fruit.",
  },
  sword: {
    name: "Keeper sword",
    slot: "hand1",
    damage: 24,
    color: "#c9d5d7",
    description: "A balanced blade. Charge to interrupt and shove.",
  },
  dagger: {
    name: "Jungle knife",
    slot: "hand1",
    damage: 15,
    light: true,
    color: "#b7d9ca",
    description: "Light weapon; equip a second in hand 2.",
  },
  shield: {
    name: "Carved shield",
    slot: "hand2",
    armor: 2,
    color: "#9fba85",
    description: "Hold LT / C to block frontal blows and catch arrows.",
  },
  bow: {
    name: "Reed bow",
    slot: "hand1",
    twoHanded: true,
    damage: 18,
    color: "#d9b77c",
    description: "Uses both hands. Hold attack to draw, release to shoot.",
  },
  hat: { name: "Scout hat", slot: "head", armor: 2, color: "#ceb379" },
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
  rare: "#68aaff",
  unique: "#c58bfa",
  legendary: "#ffad4f",
};
const gearVariants = [
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
for (const [id, item] of Object.entries(ITEMS)) {
  item.base ??= id;
  item.rarity ??= "common";
  item.artColor ??= item.color;
  if (item.slot) item.color = RARITIES[item.rarity];
  if (item.relic) item.color = RARITIES[item.rarity];
}
export const itemKind = (id) => ITEMS[id]?.base || id;
export function itemStats(id) {
  const i = ITEMS[id];
  if (!i) return "";
  return [
    i.damage ? `Damage ${i.damage}` : "",
    i.magic ? `Mana ${i.manaCost} per cast` : "",
    i.armor ? `Armor +${i.armor}` : "",
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
    (id) => ITEMS[id].slot && ITEMS[id].rarity === tier,
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
export function canGive(list, type, qty = 1, slots = 24) {
  if (!ITEMS[type] || qty <= 0) return false;
  const max = ITEMS[type].stack || 1;
  const capacity =
    list.reduce((n, i) => n + (i?.type === type ? max - i.qty : 0), 0) +
    Math.max(0, slots - list.filter(Boolean).length) * max;
  return capacity >= qty;
}
export function give(list, type, qty = 1, slots = 24) {
  if (!canGive(list, type, qty, slots)) return false;
  const max = ITEMS[type].stack || 1;
  for (const i of list)
    if (i?.type === type && i.qty < max) {
      const n = Math.min(qty, max - i.qty);
      i.qty += n;
      qty -= n;
    }
  while (qty > 0) {
    const n = Math.min(qty, max);
    const hole = list.findIndex((i) => !i);
    if (hole >= 0) list[hole] = { type, qty: n };
    else list.push({ type, qty: n });
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
    gear = { ...p.equipment };
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
    if (gear[s] && gear[s] !== "occupied" && !give(pack, gear[s])) return false;
    gear[s] = null;
  }
  gear[slot] = item.type;
  if (def.twoHanded) gear.hand2 = "occupied";
  p.inventory = pack;
  p.equipment = gear;
  return true;
}
export function unequip(p, slot) {
  const type = p.equipment[slot];
  if (!type) return false;
  if (type === "occupied") slot = "hand1";
  const id = p.equipment[slot];
  if (!give(p.inventory, id)) return false;
  p.equipment[slot] = null;
  if (ITEMS[id].twoHanded) p.equipment.hand2 = null;
  return true;
}
export function transfer(from, to, index, slots = 24) {
  const i = from[index];
  if (!i || !give(to, i.type, i.qty, slots)) return false;
  clearSlot(from, index);
  return true;
}
export function stat(p, key) {
  const equipped = Object.values(p.equipment || {}).reduce(
    (n, t) => n + (ITEMS[t]?.[key] || 0),
    0,
  );
  const carriedRelics = (p.inventory || []).reduce((n, item) => {
    const def = ITEMS[item?.type];
    return n + (def?.relic ? (def[key] || 0) * (item.qty || 1) : 0);
  }, 0);
  return equipped + carriedRelics;
}
export function freshCharacter(id, name) {
  return {
    id,
    name,
    inventory: [{ type: "trap", qty: 3 }],
    equipment: Object.fromEntries(SLOTS.map((s) => [s, null])),
    chests: [[], [], []],
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
  p.equipment ||= {};
  for (const slot of SLOTS) p.equipment[slot] ??= null;
  if (itemKind(p.equipment.head) === "charm" && !p.equipment.neck) {
    p.equipment.neck = p.equipment.head;
    p.equipment.head = null;
  }
  p.coins = Math.max(0, Math.floor(Number(p.coins) || 0));
}
export const sellValue = (type) =>
  ITEMS[type]?.slot || ITEMS[type]?.relic
    ? { common: 8, rare: 24, unique: 60, legendary: 150 }[ITEMS[type].rarity] ||
      8
    : { stamina_potion: 5, potion: 3, trap: 2, arrow: 1, fruit: 1, meat: 1 }[
        type
      ] || 1;
export function splitStack(list, index, amount, slots = 24) {
  const item = list[index];
  if (!item || list.filter(Boolean).length >= slots || item.qty < 2)
    return false;
  amount = amount === undefined ? Math.floor(item.qty / 2) : Number(amount);
  if (!Number.isInteger(amount) || amount < 1 || amount >= item.qty)
    return false;
  item.qty -= amount;
  const hole = list.findIndex((i) => !i);
  if (hole >= 0) list[hole] = { type: item.type, qty: amount };
  else list.push({ type: item.type, qty: amount });
  return true;
}
export function sellStack(p, index, stock = (p.robotStock ||= [])) {
  const item = p.inventory[index];
  if (!item || p.field?.favorites?.includes(item.type)) return false;
  if (!give(stock, item.type, item.qty, 120)) return false;
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
      } else {
        actor.equipment[slot] = null;
        if (ITEMS[type].twoHanded) actor.equipment.hand2 = null;
        actor.inventory.push({ type, qty: 1 });
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
      placeAt(dest, to.index, { type, qty: 1 });
      actor.equipment[slot] = null;
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
        actor.inventory.push({ type, qty: 1 });
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
      if (target?.type === item.type && ITEMS[item.type].stack) {
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
  if (storage) storage.splice(0, storage.length, ...chest);
  return true;
}

export const chestName = (owner, index) =>
  owner?.chestNames?.[index] || `Chest ${index + 1}`;
