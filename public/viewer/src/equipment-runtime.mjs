import { ITEMS, SAFARI_HUNTER_SET } from "./items.mjs";

// Shared catalog queries; side effects live in night-equipment.mjs.
export function equipmentAttack(actor) {
  const hands = ["hand1", "hand2"].map(slot => ({ slot, type: actor.equipment?.[slot] }))
    .filter(({ type }) => ITEMS[type] && !ITEMS[type].utility);
  const weapon = hands.find(({ type }) => ITEMS[type].damage > 0);
  if (weapon) return { ...weapon, kind: ITEMS[weapon.type].shot ? "rifle" : "weapon", damage: ITEMS[weapon.type].damage };
  const utility = ["hand1", "hand2"].some(slot => ITEMS[actor.equipment?.[slot]]?.utility);
  return { kind: utility ? "utility" : "unarmed", damage: utility ? 0 : null };
}
export function equipmentLights(actor, anchors = {}) {
  if (actor.hp <= 0) return [];
  return ["hand1", "hand2"].flatMap(slot => {
    const type = actor.equipment?.[slot], light = ITEMS[type]?.lightSource;
    return light ? [{ ...light, type, slot, x: anchors[slot]?.x ?? actor.x, y: anchors[slot]?.y ?? actor.y }] : [];
  });
}
// Supply inventory separately, e.g. [{type: "cartridge", qty: 12}].
export function safariHunterLoadout() {
  return { ...SAFARI_HUNTER_SET, hand1: "rifle", hand2: "occupied" };
}
