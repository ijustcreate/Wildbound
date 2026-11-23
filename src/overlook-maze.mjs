import {give, ITEMS} from './items.mjs';
import {emitGameplayFx} from './gameplay-fx.mjs';
import {OVERLOOK_AXE, OVERLOOK_BUCKET, VILLA_OVERLOOK, WILDS_OVERLOOK, overlookNorth} from './overlook-maze-layout.mjs';

const HEDGE_HEALTH = 50, HEDGE_HEIGHT = 72, CHEST_REACH = 56;
const views = new WeakMap();

export function overlookMazeFor(game) {
  const train = game.trainTest;
  const world = train?.design.wildLands && !train.design.activeRoom ? WILDS_OVERLOOK : !train && overlookNorth(game) ? VILLA_OVERLOOK : null;
  if (!world) return null;
  const owner = train || game.house;
  if (owner.overlookMaze?.version !== 2) owner.overlookMaze = {version: 2, opened: !!owner.overlookMaze?.opened, damage: {}};
  const state = owner.overlookMaze;
  const cached = views.get(owner);
  if (cached?.state === state) return cached;
  const view = {...world, state};
  views.set(owner, view);
  return view;
}

export function* nearbyOverlookParts(maze, x, y, r) {
  const left = Math.floor((x - r - maze.x) / OVERLOOK_BUCKET), right = Math.floor((x + r - maze.x) / OVERLOOK_BUCKET);
  const top = Math.floor((y - r - maze.y) / OVERLOOK_BUCKET), bottom = Math.floor((y + r - maze.y) / OVERLOOK_BUCKET);
  if (left === right && top === bottom) { yield* maze.buckets.get(left + ':' + top) || []; return; }
  const seen = new Set();
  for (let by = top; by <= bottom; by++) for (let bx = left; bx <= right; bx++) {
    for (const part of maze.buckets.get(bx + ':' + by) || []) if (!seen.has(part)) { seen.add(part); yield part; }
  }
}

export function overlookPartBroken(maze, part) {
  return (maze.state.damage[part.id] || 0) >= HEDGE_HEALTH;
}

export function overlookPartArt(maze, part) {
  const damage = (maze.state.damage[part.id] || 0) / HEDGE_HEALTH;
  let mask = 0;
  for (const [direction, ids] of part.neighbors.entries()) {
    if (ids.some(id => !overlookPartBroken(maze, maze.parts[id]))) mask |= 1 << direction;
  }
  return {...part, mask, damage, broken: damage >= 1};
}

const clamp = (value, a, b) => Math.max(a, Math.min(b, value));
function pointOnPart(part, x, y) {
  return {x: clamp(x, part.x, part.x + part.w), y: clamp(y, part.y, part.y + part.h)};
}

export function overlookBlocked(game, x, y, r, elevation, projectile) {
  const maze = overlookMazeFor(game);
  if (!maze || y < maze.y - r || y > maze.y + maze.h + r || x < maze.x - r || x > maze.x + maze.w + r) return false;
  if (projectile || elevation < HEDGE_HEIGHT) for (const part of nearbyOverlookParts(maze, x, y, r)) {
    if (overlookPartBroken(maze, part)) continue;
    const q = pointOnPart(part, x, y);
    if ((x - q.x) ** 2 + (y - q.y) ** 2 < r * r) return true;
  }
  const chest = maze.chest;
  return elevation < 24 && Math.abs(x - chest.x) < 21 + r && Math.abs(y - chest.y + 4) < 12 + r;
}

function cutHedge(game, maze, part, amount) {
  const damage = Math.min(HEDGE_HEALTH, (maze.state.damage[part.id] || 0) + amount);
  maze.state.damage[part.id] = damage;
  const contact = {x: part.x + part.w / 2, y: part.y + part.h / 2};
  if (damage === HEDGE_HEALTH) {
    game.onSound?.('woodBreak', contact);
    const clippings = game.effects ||= [];
    if (clippings.filter(fx => fx.overlookClippings).length < 18) clippings.push({
      ...contact, overlookClippings: true, seed: part.seed, life: .42, maxLife: .42,
    });
  } else game.onSound?.('hit', contact);
  return true;
}

export function damageOverlookMelee(game, player, damage, range, spin = false) {
  const maze = overlookMazeFor(game);
  if (!maze || !(damage > 0) || player.room || player.trainRide) return false;
  let best;
  for (const part of nearbyOverlookParts(maze, player.x, player.y, range)) {
    if (overlookPartBroken(maze, part)) continue;
    const q = pointOnPart(part, player.x, player.y), dx = q.x - player.x, dy = q.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance > range || !spin && distance > 1 && (dx * (player.faceX || 0) + dy * (player.faceY || 0)) < distance * .4) continue;
    const edge = Math.hypot(player.x - part.x - part.w / 2, player.y - part.y - part.h / 2);
    if (best && (distance > best.distance || distance === best.distance && edge >= best.edge)) continue;
    let clear = true;
    for (let d = 5; d < distance - 1; d += 5) if (game.projectileBlocked?.(player.x + dx * d / distance, player.y + dy * d / distance, .5)) { clear = false; break; }
    if (clear) best = {part, distance, edge};
  }
  return !!best && cutHedge(game, maze, best.part, Math.max(14, damage));
}

export function damageOverlookProjectile(game, bolt, radius) {
  const maze = overlookMazeFor(game);
  if (!maze || !(bolt.damage > 0)) return false;
  for (const part of nearbyOverlookParts(maze, bolt.x, bolt.y, radius)) {
    if (overlookPartBroken(maze, part)) continue;
    const q = pointOnPart(part, bolt.x, bolt.y);
    if (Math.hypot(bolt.x - q.x, bolt.y - q.y) <= radius) return cutHedge(game, maze, part, bolt.damage);
  }
  return false;
}

export function nearOverlookChest(game, player) {
  const maze = overlookMazeFor(game);
  if (!maze || player.hp <= 0 || player.room || player.trainRide || player.vehicleId ||
    Math.hypot(player.x - maze.chest.x, player.y - maze.chest.y) > CHEST_REACH) return null;
  return maze;
}

export function interactOverlookChest(game, player) {
  const maze = nearOverlookChest(game, player);
  if (!maze || maze.state.opened || !ITEMS[OVERLOOK_AXE]) return false;
  if (!give(player.inventory, OVERLOOK_AXE, 1)) {
    game.message?.('Make room in your pack for the axe.');
    return true;
  }
  maze.state.opened = true;
  game.onSound?.('chestOpen', maze.chest);
  emitGameplayFx(game, 'chest', maze.chest);
  game.message?.('You found the Cursed Axe.');
  game.persist?.();
  return true;
}
