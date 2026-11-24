import {waterAt} from './environment.mjs';
import {COMBO_ENCOUNTERS, ENCOUNTER_LAYOUTS, hasEncounterLayout} from './encounter-layout-data.mjs';

const wetGround = new Set(['water', 'shallow', 'floodbridge', 'quicksand', 'mud']);
const stages = [0, 7, 16];
const offsetPoint = (anchor, [x, y]) => ({x: anchor.x + x, y: anchor.y + y});

function canUseForestLayouts(game, preview = false) {
  return !game.house && !game.trainTest && (preview || (game.generatedEnvironment || game.environment) === 'forest');
}

function hasLiveLayoutEnemies(game) {
  return game.enemies.some(enemy => enemy.comboLayout && enemy.hp > 0);
}

export function encounterLayoutAvailable(game, event) {
  if (!hasEncounterLayout(event.comboLayout)) return true;
  if (!canUseForestLayouts(game) || hasLiveLayoutEnemies(game)) return false;
  const liveHostiles = game.enemies.filter(enemy => enemy.hp > 0 && !enemy.wildlife && !enemy.stampede && !['ally', 'neutral'].includes(enemy.faction));
  if (liveHostiles.length >= 36) return false;
  const stage = COMBO_ENCOUNTERS.findIndex(card => card.name === event.name);
  const progress = Math.max(0, ...game.players.map(player => player.progress || 0));
  return (stage < 0 || progress >= stages[stage]) && Boolean(findEncounterSite(game, event));
}

export function nextFeaturedEncounter(game, events, available) {
  if (!game.roll?.resolved || !canUseForestLayouts(game) || hasLiveLayoutEnemies(game)) return null;
  const progress = Math.max(0, ...game.players.map(player => player.progress || 0));
  for (const [stage, card] of COMBO_ENCOUNTERS.entries()) {
    if (progress < stages[stage]) break;
    const index = events.findIndex(event => event.name === card.name && event.comboLayout === card.comboLayout);
    const event = events[index];
    if (event && !game.encounteredEvents?.[event.name] && !event.devOnly && event.weight > 0 && available(game, event)) return index;
  }
  return null;
}

function pointOpen(game, {x, y}, radius) {
  if (x < 40 || x > 1560 || y < 40 || y > 1560) return false;
  for (const [dx, dy] of [[0, 0], [radius, radius], [radius, -radius], [-radius, radius], [-radius, -radius]]) {
    if (wetGround.has(waterAt(game, x + dx, y + dy + 9))) return false;
  }
  return !game.blocked(x, y, radius) && !game.blocked(x, y, radius, false, false, false, 0);
}

function routeOpen(game, anchor, route) {
  for (let i = 1; i < route.length; i++) {
    const a = offsetPoint(anchor, route[i - 1]);
    const b = offsetPoint(anchor, route[i]);
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 16);
    for (let step = 0; step <= steps; step++) {
      const t = step / Math.max(1, steps);
      const point = {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t};
      if (!pointOpen(game, point, 8)) return false;
    }
  }
  return true;
}

function fireLaneOpen(game, {x, y}, layout) {
  if (!layout.fire) return true;
  const [fireX, fireY] = layout.fire;
  const target = layout.spawns.find(point => point[0] === fireX);
  if (!target) return true;
  for (let laneY = fireY + 34; laneY >= target[1]; laneY -= 10) {
    if (game.projectileBlocked(x + fireX, y + laneY, 3)) return false;
  }
  return true;
}

export function findEncounterSite(game, event, {preview = false} = {}) {
  const id = event.comboLayout;
  if (!hasEncounterLayout(id) || !canUseForestLayouts(game, preview)) return null;
  const layout = ENCOUNTER_LAYOUTS[id];
  const origin = game.players.find(player => player.id === game.roll?.playerId && player.hp > 0 && !player.room)
    ?? game.players.find(player => player.hp > 0 && !player.room);
  if (!origin) return null;

  const saved = game.scenery.find(prop => prop.encounterVenue?.id === id)?.encounterVenue;
  if (saved) return {anchor: saved, existing: true};

  const candidates = [];
  for (let y = 176; y < 1416; y += 32) for (let x = 176; x < 1416; x += 32) {
    const entry = offsetPoint({x, y}, layout.entry);
    const distance = Math.hypot(entry.x - origin.x, entry.y - origin.y);
    if (distance < 36 || distance > 665) continue;
    const score = Math.abs(distance - 89) + Math.max(0, 145 - Math.hypot(x - 800, y - 800)) * 2;
    candidates.push({x, y, score});
  }
  candidates.sort((a, b) => a.score - b.score);
  const reserves = game.scenery.flatMap(prop => prop.encounterVenue ? [prop.encounterVenue] : []);
  for (const {x, y} of candidates) {
    const anchor = {x, y};
    if (reserves.some(other => Math.hypot(other.x - x, other.y - y) < 166)) continue;
    if (!layout.spawns.every(point => pointOpen(game, offsetPoint(anchor, point), 14))) continue;
    if (layout.fire && !pointOpen(game, offsetPoint(anchor, layout.fire), 19)) continue;
    if (!layout.walls.every(wall => pointOpen(game, offsetPoint(anchor, [wall.point[0], wall.point[1] - wall.depth / 2]), wall.width / 2))) continue;
    if (!layout.supplies.every(([, , dx, dy]) => pointOpen(game, offsetPoint(anchor, [dx, dy]), 10))) continue;
    if (!layout.routes.every(route => routeOpen(game, anchor, route))) continue;
    if (!fireLaneOpen(game, anchor, layout)) continue;
    return {anchor, existing: false};
  }
  return null;
}

export function placeEncounterLayout(game, event, site = findEncounterSite(game, event)) {
  if (!site) return null;
  const id = event.comboLayout;
  const layout = ENCOUNTER_LAYOUTS[id];
  const {anchor, existing} = site;
  if (!existing) {
    for (const [index, wall] of layout.walls.entries()) {
      const {x, y} = offsetPoint(anchor, wall.point);
      game.scenery.push({id: `encounter:${id}:wall:${index}`, kind: 'forest_ruin', x, y, rootY: y,
        width: wall.width, depth: wall.depth, height: wall.height, shape: wall.shape,
        size: Math.max(wall.width, wall.height + wall.depth), procedural: true, seed: (x + y) * (index + 1),
        ...(index === 0 ? {encounterVenue: {id, ...anchor}} : {}),
      });
    }
    if (layout.fire) {
      const {x, y} = offsetPoint(anchor, layout.fire);
      game.scenery.push({id: `encounter:${id}:fire`, kind: 'encounter_campfire', x, y, size: 64, seed: x * .7 + y});
    }
    for (const [item, count, x, y] of layout.supplies) {
      if (item === 'starter_bow' && game.players.some(player =>
        Object.values(player.equipment || {}).includes(item) || player.inventory?.some(slot => slot?.type === item))) continue;
      game.dropLoot(anchor.x + x, anchor.y + y, item, count, `${layout.name} supplies`, true);
    }
  }
  return {entry: offsetPoint(anchor, layout.entry), spawns: layout.spawns.map(point => offsetPoint(anchor, point))};
}
