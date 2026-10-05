import {SKILLS,skillScrollId} from './field-skills.mjs';
export const SLOTS = [
  "head",
  "neck",
  "cape",
  "back",
  "shoulders",
  "chest",
  "gloves",
  "pants",
  "feet",
  "hand1",
  "hand2",
];
export const ITEMS = {
  unknown_mushroom:{name:'Strange mushroom',stack:999,rarity:'unique',color:'#c58bfa',sellPrice:0,description:'A mysterious mushroom found inside a question block in the TV world. Purple quality. Its purpose is unknown; no use yet.'},
  dark_essence:{name:'Dark Essence',stack:999,color:'#a269cb',material:true,description:'Extracted by salvaging a captured creature. No use yet.'},
  starter_boomerang:{name:'Starter boomerang',base:'boomerang',slot:'hand1',boomerang:true,ranged:true,damage:12,range:210,speed:330,stack:1,supplyOnly:true,color:'#bf9658',artColor:'#bf9658',description:'Throw and catch. Returns to you; no ammunition needed. One throw at a time.'},
  boomerang:{name:'Trail boomerang',base:'boomerang',slot:'hand1',boomerang:true,ranged:true,damage:20,range:260,speed:380,stack:1,rarity:'common',color:'#be9251',artColor:'#be9251',description:'A returning weapon. Hits each enemy once per throw; no ammunition needed.'},
  moon_boomerang:{name:'Moonsteel boomerang',base:'boomerang',slot:'hand1',boomerang:true,ranged:true,damage:30,range:310,speed:430,stack:1,rarity:'rare',color:'#8cd6e8',artColor:'#8cd6e8',description:'A swift moonsteel returning weapon. One throw at a time; no ammunition needed.'},
  sun_boomerang:{name:'Sunfire boomerang',base:'boomerang',slot:'hand1',boomerang:true,ranged:true,damage:42,range:360,speed:480,stack:1,rarity:'unique',color:'#f4b75d',artColor:'#f4b75d',description:'A powerful golden returning weapon. One throw at a time; no ammunition needed.'},
  critter_net:{name:'Trail catcher net',slot:'hand1',eitherHand:true,utility:true,damage:0,stack:1,color:'#b8c9a6',description:'Equip and press Attack near a critter. Requires an empty jar for small creatures or a cage for birds and scavengers.'},
  empty_jar:{name:'Empty critter jar',stack:12,color:'#abdcd9',sellPrice:2,description:'One jar holds one small critter. Use a catcher net nearby.'},
  critter_cage:{name:'Travel cage',stack:6,color:'#b69b67',sellPrice:4,description:'Holds a caught bird, mouse or scavenger.'},
  caught_frog:{name:'Frog in a jar',stack:1,color:'#85aa62',sellPrice:7,description:'A damp passenger with strong opinions about dinner.'},
  caught_dragonfly:{name:'Dragonfly in a jar',stack:1,color:'#85c6cd',sellPrice:6},
  caught_fairy:{name:'Fairy in a jar',stack:1,color:'#c7a1dd',sellPrice:12},
  caught_bird:{name:'Bird in a cage',stack:1,color:'#bca477',sellPrice:9},
  caught_white_mouse:{name:'Snow mouse in a cage',stack:1,color:'#e5e7dc',sellPrice:7},
  caught_scavenger:{name:'Critter in a cage',stack:1,color:'#9b886f',sellPrice:7},
  ice_arrow:{name:'Ice arrow',stack:99,color:'#83dcff',description:'Blue-tipped ammunition. Freezes enemies and creates frost where it lands. Load into the quiver.'},
  ice_arrow_recipe:{name:'Recipe: Ice arrows',stack:1,color:'#95dfea',recipe:true,description:'Use to learn Ice arrows in the Field Guild. Makes 20: 20 arrows + 20 Magic Essence + 3 raw ice.'},
  raw_ice:{name:'Raw ice',stack:99,color:'#b4efff',material:true,description:'Melts after five minutes outside the ice level. Used to craft ice arrows.'},
  armor_bag: { name: 'Armorer Bag', stack: 1, color: '#bb995e', bag: { slots: 10, category: 'armor' }, description: 'Ten armor slots. Open to store or retrieve equipment.' },
  relic_bag: { name: 'Reliquary Bag', stack: 1, color: '#b89bd9', bag: { slots: 10, category: 'relics' }, description: 'Ten relic slots. Stored relics grant no passive bonuses.' },
  crafting_bag: { name: 'Crafting Pouch', stack: 1, color: '#83bb92', bag: { slots: 1, category: 'crafting' }, description: 'One crafting supply slot. Holds one stack.' },
  relic_dust:{name:'Relic Dust',stack:999,color:'#c6b38d',material:true,sellPrice:1,description:'Salvaged from unwanted gear. Sell later; stacks to 999.'},
  magic_essence:{name:'Magic Essence',stack:999,color:'#77d9ec',material:true,sellPrice:2,description:'Salvaged from magical or uncommon gear. Stacks to 999.'},
  legendary_essence:{name:'Legendary Essence',stack:999,color:'#f4bd62',material:true,sellPrice:10,description:'Salvaged from legendary gear. Stacks to 999.'},
  lantern: {
    name: "Trail lantern", slot: "hand1", eitherHand: true, damage: 0,
    utility: true, stack: 1, color: "#edc776",
    lightSource: { radius: 150, intensity: 1, color: "#ffdf91" },
    description: "Either hand · light source only; deals no damage.",
  },
  torch: {
    name: "Trail torch", slot: "hand1", eitherHand: true, damage: 5,
    stack: 1, color: "#ed954d",
    lightSource: { radius: 100, intensity: 0.8, color: "#ffb35e" },
    fire: { duration: 3, damage: 2, meltRadius: 48 },
    description: "Either hand · low melee damage; ignites enemies and trees, melts ice.",
  },
  rifle: {
    name: "Safari rifle", slot: "hand1", twoHanded: true, damage: 36,
    stack: 1, color: "#96714e", ranged: true,
    shot: { range: 720, cooldown: 1.2, aimTime: 0.6, radius: 2, speed: 900 },
    ammo: "cartridge",
    description: "Both hands · hold aim for 0.6 seconds, release to consume one cartridge; reload takes 1.2 seconds.",
  },
  cartridge: {
    name: "Rifle cartridge", stack: 99, color: "#d5ad61",
    description: "One cartridge per rifle shot.",
  },
  ritual_dagger:{name:'Ritual Dagger',base:'dagger',slot:'hand1',damage:32,stack:1,rarity:'legendary',color:'#efb94e',artColor:'#73e5cc',description:'While equipped, a friendly ghost tiger follows you and fights enemies you attack or that attack you. Unequipping dismisses it. Dagger kills also summon temporary spirits.'},
  barricade: {
    name: "Trail barricade",
    stack: 5,
    color: "#a78b62",
    description:
      "Deploy from Field Kit: a temporary obstacle that blocks walkers and shots.",
  },
  stick: {
    name: "Stick",
    base: "sword",
    slot: "hand1",
    damage: 8,
    artColor: "#a78652",
    stack: 99,
    color: "#a78652",
    description: "Crafting material or improvised sword. Equip one from a stack. Small chance to break on a hit (1 in 20 / 5%); equip another stick if it breaks.",
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
  bone_shard: {
    name: "Bone shard",
    stack: 99,
    color: "#d8d0ae",
    description: "A sharp fragment from a defeated skeleton. Useful for fletching.",
  },
  golem_core: {
    name: "Golem core",
    stack: 20,
    color: "#8fc7b5",
    description: "A warm stone core. Reinforces field defenses.",
  },
  web_silk: {
    name: "Web silk",
    stack: 99,
    color: "#d8c9e7",
    description: "Strong spider silk. Ideal for binding traps.",
  },
  beast_fang: {
    name: "Beast fang",
    stack: 99,
    color: "#e7d9b5",
    description: "A sharp fang from a predator. Adds scent to bait.",
  },
  frost_berry: {
    name: "Frost berry",
    stack: 20,
    color: "#d879a4",
    description: "An ice-level berry used in restorative tonics.",
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
  starter_arrow: {
    base: "arrow",
    name: "Starter arrow",
    stack: 99,
    color: "#ddd5ae",
    description: "Starter ammunition for the starter bow.",
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
    reach: 76,
    color: "#c9d5d7",
    description: "A balanced blade. Charge to interrupt and shove.",
  },
  starter_sword: {
    base: "sword",
    name: "Starter sword",
    slot: "hand1",
    damage: 18,
    color: "#aebfc0",
    description: "A dependable starter blade.",
  },
  dagger: {
    name: "Jungle knife",
    slot: "hand1",
    damage: 15,
    reach: 54,
    light: true,
    color: "#b7d9ca",
    description: "Light weapon; equip a second in hand 2.",
  },
  starter_dagger: {
    base: "dagger",
    name: "Starter dagger",
    slot: "hand1",
    damage: 12,
    light: true,
    color: "#9fc6b5",
    description: "A light starter blade.",
  },
  shield: {
    name: "Carved shield",
    slot: "hand2",
    armor: 2,
    color: "#9fba85",
    description: "Hold LT / C to block frontal blows and catch arrows.",
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
ITEMS.starter_quiver={name:'Starter quiver',base:'quiver',slot:'back',stack:1,rarity:'common',color:'#b68a5d',artColor:'#9d724d',bowDrawSpeed:.2,arrowSpeed:.1,description:'Back-slot archery gear · includes eight starter arrows · arrows travel 10% faster · bow charges 20% faster.'};
// Rare discoveries unique to supply chests in each environment.
for(const [id,name,color,bonus,description] of [
 ['fern_pendant','Fern pendant','#8fb779',{armor:2},'Woodland charm · +2 armor.'],
 ['sunstone_pendant','Sunstone pendant','#d7b568',{bowDamage:.08},'Desert charm · +8% bow damage.'],
 ['snowflake_pendant','Snowflake pendant','#b5e5ef',{armor:3},'Winter charm · +3 armor.'],
 ['hearth_pendant','Hearth pendant','#c99777',{bowDrawSpeed:.12},'Homestead charm · 12% faster bow draw.'],
 ['jade_pendant','Jade pendant','#83d4b9',{arrowSpeed:.12},'Temple charm · 12% faster arrows.'],
])ITEMS[id]={name,base:'charm',slot:'neck',stack:1,rarity:'uncommon',color,artColor:color,...bonus,description,supplyOnly:true};
export const GEAR_SETS={
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
 if(['sword','dagger','bow','wand','shield','armor','hat','charm'].includes(item.base||id)&&!item.utility)item.sockets??=item.twoHanded?2:1;
}
for(const [id,name,mana,regen,rarity,color] of [['azure_bead','Azure bead',15,0,'common','#70c9ec'],['moon_prism','Moon prism',25,0,'rare','#b49cfa'],['starheart','Starheart',40,0,'unique','#80f4d5'],['mana_rune','Mana rune',0,1,'common','#78d6e8'],['void_sigil','Void sigil',0,2,'rare','#9f82e8'],['astral_heart','Astral heart',0,3,'unique','#e48cff']])ITEMS[id]={name,base:'trinket',trinket:true,maxMana:mana,manaRegen:regen,stack:1,rarity,color,artColor:color,description:`Socket into compatible gear: +${regen?regen+' mana/sec':mana+' maximum mana'}. No bonus while loose in your bag.`};
export const socketCount=type=>ITEMS[type]?.slot&&!ITEMS[type]?.trinket?Math.max(0,Math.min(3,Math.floor(Number(ITEMS[type].sockets)||0))):0;
export function setProgress(p,id){const def=GEAR_SETS[id];if(!def)return null;const worn=new Set(Object.values(p.equipment||{}));const checks=def.groups.map(group=>({ids:group,equipped:group.some(type=>worn.has(type))}));const count=checks.filter(g=>g.equipped).length;return {...def,id,checks,count,complete:count===checks.length};}
export function setStat(p,key){let n=0;for(const id of Object.keys(GEAR_SETS)){const s=setProgress(p,id);if(s.count>=3)n+=s.three[key]||0;if(s.complete)n+=s.full[key]||0;}return n;}
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
    i.shot ? `Aimed shot · range ${i.shot.range}` : "",
    i.magic ? `Mana ${i.manaCost} per cast` : "",
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
    (id) => ITEMS[id].slot && !ITEMS[id].supplyOnly && ITEMS[id].rarity === tier,
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
  const max = socketCount(type)?1:ITEMS[type].stack || 1;
  const capacity =
    list.reduce((n, i) => n + (i?.type === type ? max - i.qty : 0), 0) +
    Math.max(0, slots - list.filter(Boolean).length) * max;
  return capacity >= qty;
}
export function give(list, type, qty = 1, slots = 24, metadata = {}) {
  if (!canGive(list, type, qty, slots)) return false;
  const max = socketCount(type)?1:ITEMS[type].stack || 1;
  for (const i of list)
    if (i?.type === type && i.qty < max) {
      const n = Math.min(qty, max - i.qty);
      i.qty += n;
      if(type==='raw_ice'&&n>0)i.meltRemaining=Math.min(i.meltRemaining??300,metadata.meltRemaining??300);
      qty -= n;
    }
  while (qty > 0) {
    const n = Math.min(qty, max);
    const hole = list.findIndex((i) => !i);
    const item={type,qty:n,...(type==='raw_ice'?{meltRemaining:metadata.meltRemaining??300}:{}),...(metadata.sockets?.length?{sockets:[...metadata.sockets]}:{}),...(ITEMS[type].bag?{contents:structuredClone(metadata.contents||[])}:{})};
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
      if (target?.type === item.type && ITEMS[item.type].stack>1&&!socketCount(item.type)&&!item.sockets?.length&&!target.sockets?.length) {
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
