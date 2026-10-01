import { ITEMS, give, clearSlot } from './items.mjs';

export const INVENTORY_TABS = ['gear', 'crafting', 'relics', 'other'];
export function inventoryCategory(type) {
  const def = ITEMS[type];
  if (!def || def.bag) return 'other';
  if (def.relic || def.trinket || /charm|talisman/.test(type)) return 'relics';
  if (def.material || def.recipe || def.craftingTool || ['stick', 'log', 'stone', 'bone_shard', 'golem_core', 'web_silk', 'beast_fang', 'frost_berry'].includes(type)) return 'crafting';
  if (def.slot) return 'gear';
  return 'other';
}

// Display slots map back to stable saved indices; empty cells never hide items.
export function tabIndices(list, tab) {
  const occupied = [], empty = [];
  for (let i = 0; i < 24; i++) {
    if (!list[i]) empty.push(i);
    else if (inventoryCategory(list[i].type) === tab) occupied.push(i);
  }
  return [...occupied, ...empty];
}

export function bagAccepts(bag, item) {
  const rule = ITEMS[bag?.type]?.bag, def = ITEMS[item?.type];
  if (!rule || !def || def.bag) return false;
  return rule.category === 'armor'
    ? !!def.slot && !['hand1', 'hand2', 'neck'].includes(def.slot)
    : inventoryCategory(item.type) === rule.category;
}

export function storeInBag(list, bag, index) {
  const item = list?.[index];
  if (!bagAccepts(bag, item)) return false;
  const contents = structuredClone(bag.contents || []);
  if (!give(contents, item.type, item.qty, ITEMS[bag.type].bag.slots, item)) return false;
  bag.contents = contents;
  clearSlot(list, index);
  return true;
}

export function takeFromBag(bag, index, destination) {
  const item = bag?.contents?.[index];
  if (!item || !give(destination, item.type, item.qty, 24, item)) return false;
  clearSlot(bag.contents, index);
  return true;
}
