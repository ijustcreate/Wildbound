import {castleInteriorPlan} from './wild-castle-interior.mjs';
import {CASTLE_INTERIOR_SIZE} from './wild-castle-site.mjs';

const spacing = 8;
const cols = Math.ceil(CASTLE_INTERIOR_SIZE.width / spacing);
const rows = Math.ceil(CASTLE_INTERIOR_SIZE.height / spacing);
const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const actorRoutes = new WeakMap();
const floorGrids = new WeakMap();
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cellPoint = cell => ({x: (cell % cols + .5) * spacing, y: (Math.floor(cell / cols) + .5) * spacing});
const inGrid = (col, row) => col >= 0 && col < cols && row >= 0 && row < rows;
const radiusFor = actor => actor.radius ?? 9;

function clearSegment(a, b, blocked) {
 const samples = Math.max(1, Math.ceil(distance(a, b) / 2));
 for (let i = 1; i <= samples; i++) {
  const t = i / samples;
  if (blocked(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false;
 }
 return true;
}

function positionGrid(collision, story, radius) {
 let floors = floorGrids.get(collision);
 if (!floors) floorGrids.set(collision, floors = new Map());
 const key = `${story}:${radius}`;
 if (!floors.has(key)) floors.set(key, new Int8Array(cols * rows));
 return floors.get(key);
}

function nearbyCells(point, accept) {
 const col = Math.floor(point.x / spacing), row = Math.floor(point.y / spacing), cells = [];
 for (let y = row - 2; y <= row + 2; y++) for (let x = col - 2; x <= col + 2; x++) {
  if (!inGrid(x, y)) continue;
  const cell = y * cols + x;
  if (accept(cell)) cells.push(cell);
 }
 return cells;
}

function compact(start, points, blocked) {
 if (points.length <= 1) return points;
 const path = [];
 let anchor = start, i = 0;
 while (i < points.length) {
  let next = i;
  while (next + 1 < points.length && clearSegment(anchor, points[next + 1], blocked)) next++;
  anchor = points[next];
  path.push(anchor);
  i = next + 1;
 }
 return path;
}

function findRoute(start, ends, blocked, grid) {
 if (!ends.length) return null;
 const nearest = point => Math.min(...ends.map(end => distance(point, end)));
 let bestCost = Infinity, bestEnd, bestCell = -1;
 for (const end of ends) {
  const cost = distance(start, end);
  if (cost < bestCost && clearSegment(start, end, blocked)) {
   bestCost = cost;
   bestEnd = end;
  }
 }
 if (bestCost <= nearest(start)) return {waypoints: [bestEnd], transfer: bestEnd.transfer};

 const passable = cell => {
  if (grid[cell] === 0) {
   const {x, y} = cellPoint(cell);
   grid[cell] = blocked(x, y) ? -1 : 1;
  }
  return grid[cell] === 1;
 };
 const goals = new Map();
 for (const end of ends) {
  for (const cell of nearbyCells(end, id => passable(id) && clearSegment(cellPoint(id), end, blocked))) {
   if (!goals.has(cell)) goals.set(cell, []);
   goals.get(cell).push(end);
  }
 }
 if (!goals.size) return bestEnd ? {waypoints: [bestEnd], transfer: bestEnd.transfer} : null;

 const costs = new Float64Array(grid.length).fill(Infinity);
 const parent = new Int32Array(grid.length).fill(-1);
 const closed = new Uint8Array(grid.length);
 const open = [];
 const push = (id, point, cost, from = -1) => {
  const score = cost + nearest(point);
  if (score >= bestCost) return;
  costs[id] = cost;
  parent[id] = from;
  open.push({id, point, cost, score});
 };
 for (const id of nearbyCells(start, cell => passable(cell) && clearSegment(start, cellPoint(cell), blocked))) {
  const point = cellPoint(id);
  push(id, point, distance(start, point));
 }
 while (open.length) {
  let i = 0;
  for (let j = 1; j < open.length; j++) {
   const a = open[j], b = open[i];
   if (a.score < b.score || a.score === b.score && a.cost > b.cost) i = j;
  }
  const [{id, point, cost, score}] = open.splice(i, 1);
  if (score >= bestCost) break;
  if (closed[id]) continue;
  closed[id] = 1;
  for (const end of goals.get(id) ?? []) {
   const total = cost + distance(point, end);
   if (total < bestCost) {
    bestCost = total;
    bestEnd = end;
    bestCell = id;
   }
  }
  const col = id % cols, row = Math.floor(id / cols);
  for (const [dx, dy] of offsets) {
   const x = col + dx, y = row + dy, next = y * cols + x, costAtNext = cost + spacing;
   if (!inGrid(x, y) || closed[next] || costAtNext >= costs[next] || !passable(next)) continue;
   const nextPoint = cellPoint(next);
   if (!clearSegment(point, nextPoint, blocked)) continue;
   push(next, nextPoint, costAtNext, id);
  }
 }
 if (!bestEnd) return null;
 const points = [bestEnd];
 for (let cell = bestCell; cell !== -1; cell = parent[cell]) points.push(cellPoint(cell));
 return {waypoints: compact(start, points.reverse(), blocked), transfer: bestEnd.transfer};
}

function stairGoals(story, destinationStory, collision, radius) {
 const direction = Math.sign(destinationStory - story), next = story + direction;
 const plan = castleInteriorPlan(story), nextPlan = castleInteriorPlan(next);
 return plan.stairs.filter(stair => stair.direction === direction).flatMap(stair => {
  const exit = nextPlan.stairs.find(other => other.link === stair.link && other.direction === -direction);
  if (!exit || collision(next, exit.spawn.x, exit.spawn.y, radius)) return [];
  const transfer = {story: next, ...exit.spawn};
  return [0, -stair.w / 4, stair.w / 4].map(offset => ({
   x: stair.x + stair.w / 2 + offset, y: stair.y + stair.h / 2, transfer,
  }));
 });
}

export function routeCastleResident(actor, destination, collision) {
 const {story} = actor, radius = radiusFor(actor);
 if (!destination || !castleInteriorPlan(story) || !castleInteriorPlan(destination.story)) return null;
 if (collision(story, actor.x, actor.y, radius)) return null;
 // The one-pixel margin covers the gap between two-pixel collision samples
 // when the walk later divides a planned segment into smaller frame steps.
 const clearance = radius + 1;
 const blocked = (x, y) => collision(story, x, y, clearance);
 const grid = positionGrid(collision, story, clearance);
 const routeTo = goals => findRoute(actor, goals.filter(point => !blocked(point.x, point.y)), blocked, grid);
 if (story !== destination.story) return routeTo(stairGoals(story, destination.story, collision, radius));
 const exact = routeTo([destination]);
 if (exact) return exact;
 // Fixtures block their centers. Start with the closest walk-up points and widen as needed.
 for (let reach = 4; reach <= 56; reach += 4) {
  const ring = Array.from({length: 12}, (_, i) => {
   const angle = i * Math.PI / 6;
   return {x: destination.x + reach * Math.cos(angle), y: destination.y + reach * Math.sin(angle)};
  });
  const route = routeTo(ring);
  if (route) return route;
 }
 return null;
}

export function walkCastleResident(actor, destination, dt, collision) {
 actor.moving = actor.walking = false;
 actor.moveSpeed = 0;
 actor.movementGait = 'idle';
 if (!destination) return false;
 const key = `${actor.story},${radiusFor(actor)}:${destination.story},${destination.x},${destination.y}`;
 let state = actorRoutes.get(actor);
 if (!state || state.key !== key || distance(state, actor) > .001) {
  state = {key, x: actor.x, y: actor.y, route: routeCastleResident(actor, destination, collision), index: 0};
  actorRoutes.set(actor, state);
 }
 if (!state.route) return false;
 const {waypoints, transfer} = state.route;
 const blocked = (x, y) => collision(actor.story, x, y, radiusFor(actor));
 let remaining = Math.max(0, (actor.speed || 0) * dt), walked = 0;
 while (state.index < waypoints.length) {
  const point = waypoints[state.index], length = distance(actor, point);
  if (length < .001) { state.index++; continue; }
  if (remaining === 0) break;
  const step = Math.min(remaining, length);
  const faceX = (point.x - actor.x) / length, faceY = (point.y - actor.y) / length;
  const next = step === length ? point : {x: actor.x + faceX * step, y: actor.y + faceY * step};
  if (!clearSegment(actor, next, blocked)) {
   actorRoutes.delete(actor);
   break;
  }
  Object.assign(actor, {x: next.x, y: next.y, faceX, faceY});
  walked += step;
  remaining -= step;
  if (step === length) state.index++;
 }
 state.x = actor.x;
 state.y = actor.y;
 if (walked > 0) {
  actor.moving = actor.walking = true;
  actor.moveSpeed = dt > 0 ? walked / dt : 0;
  actor.movementGait = 'walk';
  actor.step = (actor.step || 0) + walked * .13;
 }
 if (state.index < waypoints.length) return false;
 if (!transfer) return true;
 if (collision(transfer.story, transfer.x, transfer.y, radiusFor(actor))) return false;
 Object.assign(actor, transfer);
 actorRoutes.delete(actor);
 return false;
}
