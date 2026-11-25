// Coordinates are ground-plane offsets from the shop center. Every prop's y
// is the near edge of its footprint, also used for actor depth sorting.
export const OLLIVANDERS_LAYOUT = Object.freeze({
  halfWidth: 108,
  halfDepth: 82,
  entranceHalf: 24,
  wall: 5,
  counter: Object.freeze({x: -10, y: -5, width: 90, depth: 18}),
  keeper: Object.freeze({x: -9, y: -35}),
  service: Object.freeze({x: 48, y: 12}),
});

export const OLLIVANDERS_FURNITURE = Object.freeze([
  {kind: 'wand_box_cabinet', x: -76, y: -62, width: 42, depth: 12, variant: 0},
  {kind: 'wand_box_cabinet', x: -31, y: -62, width: 42, depth: 12, variant: 1},
  {kind: 'wand_box_cabinet', x: 14, y: -62, width: 42, depth: 12, variant: 2},
  {kind: 'wand_box_cabinet', x: 59, y: -62, width: 42, depth: 12, variant: 3},
  {kind: 'rolling_ladder', x: 32, y: -50, width: 15, depth: 8},
  {kind: 'sorting_counter', ...OLLIVANDERS_LAYOUT.counter},
  {kind: 'travel_trunk', x: -77, y: 57, width: 37, depth: 19},
  {kind: 'ladder_stool', x: -60, y: 40, width: 19, depth: 11},
  {kind: 'stained_glass_lamp', x: -70, y: -18, width: 16, depth: 11},
  {kind: 'potted_fern', x: 84, y: 63, width: 16, depth: 12},
].map(Object.freeze));

export function ollivandersRoomOpen(shop, players) {
  const {halfWidth, halfDepth, entranceHalf} = OLLIVANDERS_LAYOUT;
  return players.some(player => {
    if (player.ui?.alleyShop === shop.id) return true;
    const x = player.x - shop.x, y = player.y - shop.y;
    return (Math.abs(x) < halfWidth && Math.abs(y) < halfDepth) ||
      (x >= halfWidth && x < halfWidth + 8 && Math.abs(y) < entranceHalf);
  });
}

export function ollivandersInCounterReach(shop, player) {
  const x = player.x - shop.x, y = player.y - shop.y;
  // Reach through the open entry, then across the customer side of the room.
  return (x >= -42 && x <= 98 && y >= -7 && y <= 51) ||
    (x > 98 && x <= 140 && Math.abs(y) < OLLIVANDERS_LAYOUT.entranceHalf);
}

export function ollivandersBlocked(shop, wx, wy, radius) {
  const x = wx - shop.x, y = wy - shop.y;
  const {halfWidth, halfDepth, entranceHalf, wall} = OLLIVANDERS_LAYOUT;
  if (Math.abs(x) > halfWidth + wall + radius ||
      Math.abs(y) > halfDepth + wall + radius) return false;
  if (Math.abs(Math.abs(y) - halfDepth) < wall + radius ||
      Math.abs(x + halfWidth) < wall + radius ||
      (Math.abs(x - halfWidth) < wall + radius &&
        Math.abs(y) > entranceHalf - radius)) return true;
  return OLLIVANDERS_FURNITURE.some(prop =>
    Math.abs(x - prop.x) < prop.width / 2 + radius &&
    y > prop.y - prop.depth - radius && y < prop.y + radius);
}
