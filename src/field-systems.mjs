import { ITEMS, SLOTS, give, take, equip, stat, itemKind,refreshVitals,clearSlot,gearStat } from "./items.mjs";

export const SYMBOLS = ["◆", "●", "▲", "✦", "■", "✚"];
export const RECIPES = [
  {id:'azure_bead',name:'Azure bead (+15 mana)',ingredients:{stone:3,bone_shard:1},output:'azure_bead',qty:1},
  {id:'moon_prism',name:'Moon prism (+25 mana)',ingredients:{azure_bead:2,golem_core:1},output:'moon_prism',qty:1},
  {id:'starheart',name:'Starheart (+40 mana)',ingredients:{moon_prism:2,golem_core:2},output:'starheart',qty:1},
  { id: 'torch', name: 'Trail torch', ingredients: { stick: 2 }, output: 'torch', qty: 1 },
  {
    id: "arrow",
    name: "Trail arrows",
    ingredients: { stick: 2, stone: 1 },
    output: "arrow",
    qty: 8,
  },
  { id: "bone_arrow", name: "Bone-fletched arrows", ingredients: { stick: 2, bone_shard: 1 }, output: "arrow", qty: 12 },
  { id: "reinforced_barricade", name: "Core-reinforced barricade", ingredients: { log: 1, golem_core: 1 }, output: "barricade", qty: 2 },
  { id: "silk_trap", name: "Silk snare", ingredients: { stick: 2, web_silk: 1 }, output: "trap", qty: 2 },
  { id: "scented_bait", name: "Scented bait", ingredients: { fruit: 1, beast_fang: 1 }, output: "fruit", qty: 3 },
  {
    id: "trap",
    name: "Snare trap",
    ingredients: { stick: 3, stone: 2 },
    output: "trap",
    qty: 1,
  },
  {
    id: "potion",
    name: "Forest tonic",
    ingredients: { frost_berry: 2 },
    output: "potion",
    qty: 1,
  },
  {
    id: "cover",
    name: "Trail barricade",
    ingredients: { log: 2, stone: 2 },
    output: "barricade",
    qty: 1,
  },
];
export const BOONS = [
  {
    id: "guardian",
    name: "Guardian",
    detail: "Take 15% less damage this expedition.",
  },
  { id: "scout", name: "Scout", detail: "Move 12% faster this expedition." },
  {
    id: "trapper",
    name: "Trapper",
    detail: "Traps capture 25% faster this expedition.",
  },
];
export const SKILLS = [
  { id: "second_wind", name: "Second Wind", cost: 20, max: 1, detail: "Once per expedition, recover from a knockdown at 35 HP." },
  { id: "long_jump", name: "Trail Legs", cost: 15, max: 2, detail: "Jump farther and higher. Each rank adds 15% reach." },
  { id: "quick_revive", name: "Quick Rescue", cost: 25, max: 1, detail: "Hold Interact near a downed friend for an instant revive." },
  { id: "pack_mule", name: "Pack Mule", cost: 20, max: 1, detail: "Carry four additional backpack stacks." },
  { id: "scavenger", name: "Scavenger", cost: 15, max: 1, detail: "Enemy material drops are more likely to appear." },
  { id: "steady_hand", name: "Steady Hand", cost: 15, max: 1, detail: "Bow charge builds more quickly and holds its depth longer." },
];
export function initializeField(p) {
  p.field ||= {
    favorites: [],
    loadouts: [],
    access: "shared",
    trap: "snare",
    symbol: SYMBOLS[(p.id || 0) % 6],
    overflow: [],
    cosmetics: {},
    totals: {},
    skills: {},
  };
  for (const [key, value] of Object.entries({
    favorites: [],
    loadouts: [],
    access: "shared",
    trap: "snare",
    symbol: SYMBOLS[0],
    overflow: [],
    cosmetics: {},
    totals: {},
    skills: {},
  }))
    p.field[key] ??= structuredClone(value);
  return p.field;
}
export function protectedItem(p, type) {
  return initializeField(p).favorites.includes(type);
}
export function category(type) {
  const i = ITEMS[type];
  return i?.relic
    ? "Relics"
    : i?.slot
      ? "Equipment"
      : i?.material || ["stick", "log", "stone", "bone_shard", "golem_core", "web_silk", "beast_fang", "frost_berry"].includes(type)
        ? "Materials"
        : "Supplies";
}
export function storageCapacity(g, p, list) {
  return list === g.victoryRewards ||
    list === g.sharedStash ||
    list === initializeField(p).overflow
    ? Infinity
    : 24;
}
export function accessFor(g, p) {
  if (!Number.isInteger(p.ui?.storage)) return "shared";
  const owner = g.shopOwner(p);
  return owner?.id === p.id ? "shared" : initializeField(owner || p).access;
}
export function canAccess(g, p, withdraw = false) {
  const mode = accessFor(g, p);
  return mode === "shared" || (!withdraw && mode === "deposit");
}
export function allContainers(g, p) {
  return [
    { name: "Backpack", list: p.inventory, capacity: 24 },
    ...p.chests.map((list, i) => ({
      name: p.chestNames?.[i] || `Chest ${i + 1}`,
      list,
      capacity: 24,
    })),
    { name: "Shared stash", list: g.sharedStash, capacity: Infinity },
    { name: "Recovery", list: initializeField(p).overflow, capacity: Infinity },
  ];
}
export function searchStorage(g, p, query = "", group = "All") {
  const q = query.trim().toLowerCase();
  return allContainers(g, p).flatMap((c) =>
    c.list.flatMap((item, index) =>
      item &&
      ITEMS[item.type] &&
      (group === "All" || category(item.type) === group) &&
      `${ITEMS[item.type].name} ${category(item.type)} ${ITEMS[item.type].rarity || ""} ${Object.keys(ITEMS[item.type]).join(" ")}`
        .toLowerCase()
        .includes(q)
        ? [{ ...c, item, index }]
        : [],
    ),
  );
}
export function transferBatch(
  p,
  from,
  to,
  capacity = 24,
  predicate = () => true,
) {
  let moved = 0,
    left = 0;
  from.forEach((item, index) => {
    if (!item || protectedItem(p, item.type) || !predicate(item)) return;
    if (give(to, item.type, item.qty, capacity,item)) {
      from[index] = null;
      moved++;
    } else left++;
  });
  while (from.length && !from.at(-1)) from.pop();
  return `${moved} stack${moved === 1 ? "" : "s"} moved${left ? ` · ${left} could not fit` : ""}. Locked items stay in place.`;
}
export function sortContainer(list) {
  const sorted = list
    .filter(Boolean)
    .sort(
      (a, b) =>
        category(a.type).localeCompare(category(b.type)) ||
        (ITEMS[a.type]?.name || a.type).localeCompare(
          ITEMS[b.type]?.name || b.type,
        ),
    );
  list.splice(0, list.length, ...sorted);
}
export function craft(p, id) {
  const r = RECIPES.find((r) => r.id === id);
  if (!r) return "Unknown recipe.";
  const next = structuredClone(p.inventory);
  for (const [type, qty] of Object.entries(r.ingredients))
    if (!take(next, type, qty))
      return `Need ${Object.entries(r.ingredients)
        .map(([t, n]) => `${n} ${ITEMS[t]?.name || t}`)
        .join(" + ")}.`;
  if (!give(next, r.output, r.qty)) return "Make room in the backpack first.";
  p.inventory = next;
  return `${r.name} crafted.`;
}
export function applyLoadout(g, p, index) {
  const wanted = initializeField(p).loadouts[index];
  if (!wanted) return "Save a loadout first.";
  const containers = allContainers(g, p);
  const draft = containers.map((c) => structuredClone(c.list));
  const actor = { inventory: [], equipment: {} };
  for (const [slot,type] of Object.entries(p.equipment))
    if (type && type !== "occupied") give(actor.inventory, type, 1, Infinity,{sockets:p.equipmentSockets?.[slot]});
  for (const slot of SLOTS) {
    const type = wanted.gear[slot];
    if (!type || type === "occupied") continue;
    let i = actor.inventory.findIndex((v) => v?.type === type);
    if (i < 0) {
      const source = draft.find((a) => a.some((v) => v?.type === type));
      if (!source)
        return `Missing ${ITEMS[type]?.name || type}; nothing changed.`;
      const sourceIndex=source.findIndex(item=>item?.type===type),stored=source[sourceIndex];const sockets=structuredClone(stored.sockets||[]);if(--stored.qty===0)clearSlot(source,sourceIndex);
      actor.inventory.push({ type, qty: 1,sockets });
      i = actor.inventory.length - 1;
    }
    if (!equip(actor, i, slot))
      return "Loadout is incompatible; nothing changed.";
  }
  for (const item of actor.inventory.filter(Boolean))
    if (!give(draft[0], item.type, item.qty,24,item))
      return "Backpack needs room for the unequipped gear; nothing changed.";
  containers.forEach((c, i) => c.list.splice(0, c.list.length, ...draft[i]));
  p.equipment = actor.equipment;
  p.equipmentSockets=actor.equipmentSockets||{};refreshVitals(p);
  return `${wanted.name} equipped.`;
}
export function compareItem(p, type) {
  const d = ITEMS[type];
  if (!d) return "";
  const notes = [];
  if (d.slot) {
    const current = ITEMS[p.equipment[d.slot]] || {};
    for (const key of ["damage", "armor", "punch", "reach", "resistance","maxHp","maxMana"]) {
      const n = (d[key] || 0) - (current[key] || 0);
      if (n) notes.push(`${key} ${n > 0 ? "+" : ""}${n}`);
    }
  }
  if (d.twoHanded) notes.push("Uses both hands");
  if (d.relic)
    notes.push(
      "Bonus applies only while carried; storing removes " +
        Object.entries(d)
          .filter(
            ([k, v]) =>
              typeof v === "number" && !["variant", "tier"].includes(k),
          )
          .map(([k, v]) => `${k} ${v}`)
          .join(", "),
    );
  return notes.join(" · ") || "No stat change";
}
export function itemStatDelta(p, type, sockets=[]) {
  const d = ITEMS[type];
  if (!d?.slot) return [];
  const current = p.equipment[d.slot];
  return [['damage','Damage'],['armor','Armor'],['punch','Fists'],['reach','Reach'],['magnet','Loot reach'],['maxHp','Health'],['maxMana','Mana']]
    .map(([key,label]) => {const next=gearStat(type,sockets,key),was=gearStat(current,p.equipmentSockets?.[d.slot],key);return {key,label,value:next-was,next,current:was};})
    .filter((entry) => entry.value !== 0);
}
export function record(p, key, amount = 1) {
  const f = initializeField(p);
  f.totals[key] = (f.totals[key] || 0) + amount;
}
export function choosePath(g, p, choice) {
  if (!p.field?.choice) return "No board choice available.";
  if (choice === "supplies") {
    give(p.field.overflow, "potion", 1, Infinity);
    g.message("A tonic waits in Recovery.");
  } else if (choice === "treasure") {
    g.spawnEvent();
    give(p.field.overflow, "charm", 1, Infinity);
    g.message("Another encounter answers. An Amber charm waits in Recovery.");
  } else {
    p.field.curse = true;
    p.coins = (p.coins || 0) + 20;
    g.message(
      "20 gold claimed. Incoming damage increases 15% until the next expedition.",
    );
  }
  p.field.choice = false;
  g.persist();
  return "Path chosen.";
}
export function regroup(g, p) {
  if (
    p.hp <= 0 ||
    p.room ||
    g.enemies.some((e) => e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) < 180)
  )
    return "Find a safe clearing before regrouping.";
  const target = g.players.find((q) => q !== p && !q.room && q.hp > 0);
  if (!target) return "Your party is already together.";
  for (let n = 0; n < 16; n++) {
    const a = (n * Math.PI) / 8,
      x = target.x + Math.cos(a) * 55,
      y = target.y + Math.sin(a) * 55;
    if (!g.blocked(x, y)) {
      p.x = x;
      p.y = y;
      return "Rejoined the party.";
    }
  }
  return "No clear ground near your teammate.";
}
export function tickField(g, dt, inputs) {
  g.barricades = (g.barricades || []).filter((b) => (b.life -= dt) > 0);
  for (const t of g.traps)
    if (t.variant === "slow")
      for (const e of g.enemies)
        if (Math.hypot(e.x - t.x, e.y - t.y) < 85) {
          e.slowUntil = g.time + 0.2;
        }
  for (const p of g.players) {
    const f = initializeField(p);
    if (p.hp > 0 && !p.room) {
      f.travel = (f.travel || 0) + (p.moving ? dt : 0);
      if (p.progress >= 12 && !f.boon && !f.boonReady) f.boonReady = true;
    }
    const i = inputs[p.device] || {};
    if (i.block && i.interact && p.hp > 0 && !p.room && !p.ui) {
      const down = g.players.find(
        (q) => q.hp <= 0 && !q.room && Math.hypot(q.x - p.x, q.y - p.y) < 60,
      );
      if (down) {
        const x = down.x + (i.x || 0) * 65 * dt,
          y = down.y + (i.y || 0) * 65 * dt;
        if (!g.blocked(x, y)) {
          down.x = x;
          down.y = y;
        }
      }
    }
  }
  if (g.objective && !g.objective.done) {
    const o = g.objective;
    if (o.kind === "survive")
      o.progress = Math.min(o.target, (o.progress || 0) + dt);
    else if (o.kind === "explore") o.progress = g.explored.size - o.start;
    else if (o.kind === "defeat") o.progress = g.cleared - o.start;
    else if (o.kind === "protect") {
      o.progress += dt;
      for (const e of g.enemies)
        if (e.hp > 0 && Math.hypot(e.x - o.x, e.y - o.y) < 70)
          o.health -= dt * 3;
      if (o.health <= 0) {
        o.done = true;
        o.failed = true;
        g.message("The relic was lost. Another trail opportunity will appear.");
      }
    } else {
      const helping = g.players.filter(
        (p) =>
          p.hp > 0 &&
          !p.room &&
          !p.ui &&
          Math.hypot(p.x - o.x, p.y - o.y) < 65 &&
          (inputs[p.device] || {}).interact,
      );
      o.progress = Math.max(0, o.progress + (helping.length ? dt : -dt * 0.5));
    }

    if (!o.done && o.progress >= o.target) {
      o.done = true;
      for (const p of g.players) {
        p.coins = (p.coins || 0) + 10;
        record(p, "objectives");
      }
      g.message("Trail objective complete · 10 gold for each explorer.");
      g.persist();
    }
  }
  for (const t of g.traps) {
    if (t.variant === "lure")
      for (const e of g.enemies) {
        if (Math.hypot(e.x - t.x, e.y - t.y) < 160 && e.state === "hunt") {
          g.moveActor(e, (t.x - e.x) * dt * 0.25, (t.y - e.y) * dt * 0.25);
        }
      }
  }
}
