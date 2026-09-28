import { ITEMS, give, sellValue, take } from "./items.mjs";
export const ROOM_STATIONS = {
  robot: { x: 65, y: 184, r: 12 },
  vending: { x: 255, y: 158, halfW: 16, halfH: 10 },
};
export function roomBlocked(x, y) {
  return (
    Math.hypot(x - ROOM_STATIONS.robot.x, y - ROOM_STATIONS.robot.y) < 20 ||
    (Math.abs(x - 255) < 24 && Math.abs(y - 156) < 17) ||
    [60, 160, 260].some((cx) => Math.abs(x - cx) < 27 && y > 59 && y < 100)
  );
}
export function vendingStock() {
  return Array.from({ length: 12 }, (_, i) => ({
    type: i % 3 === 1 ? "stamina_potion" : "potion",
    price: i % 3 === 1 ? 15 : 10,
    qty: 5,
  }));
}
export function purchaseVending(p, owner, index) {
  owner.vendingStock ||= vendingStock();
  p.vendingOrders ||= [];
  const slot = owner.vendingStock[index];
  if (!slot || slot.qty < 1) return "Sold out.";
  if ((p.coins || 0) < slot.price) return "Not enough gold.";
  if (p.vendingOrders.length >= 6)
    return "Collect your purchases before buying more.";
  p.coins -= slot.price;
  slot.qty--;
  p.vendingOrders.push({
    id: (p.nextVendingId = (p.nextVendingId || 0) + 1),
    owner: owner.profileId || owner.id,
    slot: index,
    type: slot.type,
    elapsed: 0,
    ready: false,
  });
  return "Dispensing… collect your item from the tray.";
}
export function collectVending(p, id) {
  const order = p.vendingOrders?.find((o) => o.id === id);
  if (!order?.ready) return false;
  if (!give(p.inventory, order.type)) return false;
  p.vendingOrders = p.vendingOrders.filter((o) => o !== order);
  return true;
}
export function useStamina(p) {
  if (p.hp <= 0 || !take(p.inventory, "stamina_potion")) return false;
  if (!(p.staminaBoost > 0)) p.dodge = (p.dodge || 0) * 0.5;
  p.staminaBoost = 30;
  return true;
}
