import { creatures } from './definitions.mjs';
import { createScenery, terrainHash } from './world.mjs';

// Boundless worlds are streamed in fixed 50×50 tile regions. Only scenery
// within one region of an active explorer is resident in the live simulation.
export const BOUNDLESS_CHUNK_TILES = 50;
export const BOUNDLESS_CHUNK_SIZE = BOUNDLESS_CHUNK_TILES * 32;
export const BOUNDLESS_SAFE_RADIUS = 620;
export const BOUNDLESS_SCENERY_MARGIN = 1;
const biomes = ['forest', 'desert', 'ice', 'temple'];
const species = {
  forest: ['panther', 'tiger', 'lion'],
  desert: ['lion', 'panther', 'tiger'],
  ice: ['snow_leopard', 'white_lion', 'tiger'],
  temple: ['tiger', 'gorilla', 'monkey'],
};
const keyOf = (x, y) => `${x},${y}`;
const chunkOf = n => Math.floor(n / BOUNDLESS_CHUNK_SIZE);
const chunkSeed = (seed, x, y) => Math.floor(Math.abs(terrainHash(seed + x * 127.1, y * 311.7) * 2147483647));

export function boundlessBiomeAt(g, x, y) {
  const cx = chunkOf(x), cy = chunkOf(y);
  if (cx === 0 && cy === 0) {
    const base = g.generatedEnvironment || g.environment || 'forest';
    return base === 'house' ? 'forest' : base;
  }
  const h = terrainHash((g.seed || 0) + cx * 73.19, cy * 41.73 + 9.1);
  return biomes[Math.floor(h * biomes.length)];
}

/** Deterministic terrain lookup for streamed regions; does not allocate tiles. */
export function boundlessTerrainAt(g, tx, ty) {
  if (tx >= 0 && ty >= 0 && tx < 50 && ty < 50)
    return g.terrain?.[ty * 50 + tx] || 'grass';
  const x = tx * 32 + 16, y = ty * 32 + 16;
  const biome = boundlessBiomeAt(g, x, y);
  const seed = g.seed || 0;
  const chunkX = chunkOf(x), chunkY = chunkOf(y);
  const lx = ((tx % 50) + 50) % 50, ly = ((ty % 50) + 50) % 50;
  const r = terrainHash(seed + chunkX * 811 + lx * 17, chunkY * 617 + ly * 29);
  if (biome === 'desert') {
    if (r > .986 && Math.hypot(lx - 25, ly - 25) > 4) return 'quicksand';
    if (r < .008) return 'shallow';
    return 'sand';
  }
  if (biome === 'ice') return r > .82 ? 'ice' : 'snow';
  if (biome === 'temple' && r > .93) return 'temple_stone';
  // Occasional connected river ribbons with walkable crossings.
  const riverX = 12 + Math.round(Math.sin(ly * .17 + seed * .013 + chunkX) * 3);
  if (Math.abs(lx - riverX) <= (Math.floor(ly / 8) % 2 === 0 ? 1 : 0))
    return Math.abs(lx - riverX) < 1 && ly % 16 < 2 ? 'bridge' : 'water';
  return 'grass';
}

function createChunkProps(g, cx, cy) {
  const x = cx * BOUNDLESS_CHUNK_SIZE, y = cy * BOUNDLESS_CHUNK_SIZE;
  const biome = boundlessBiomeAt(g, x + BOUNDLESS_CHUNK_SIZE / 2, y + BOUNDLESS_CHUNK_SIZE / 2);
  const seed = chunkSeed(g.seed || 0, cx, cy);
  const props = createScenery(seed, biome === 'desert' ? 'desert' : 'forest').filter((_,i)=>i%2===0);
  for (const prop of props) {
    prop.x += x; prop.y += y;
    prop.id = `boundless:${cx}:${cy}:${prop.id}`;
    if (biome === 'ice') {
      if (prop.kind === 'tree') prop.kind = 'snow_tree';
      else if (prop.kind === 'rock') prop.kind = 'ice_rock';
      else if (prop.kind === 'flower') prop.kind = 'frost_shrub';
    } else if (biome === 'temple' && prop.kind === 'tree') {
      prop.kind = 'tree'; prop.size *= 1.22;
    }
  }
  return props;
}

function spawnThreat(g, explorer) {
  const bx = explorer.x - 800, by = explorer.y - 800, angle = Math.atan2(by, bx) + (g.random() - .5) * 1.4;
  const distance = 240 + g.random() * 100;
  const x = explorer.x + Math.cos(angle) * distance, y = explorer.y + Math.sin(angle) * distance;
  const biome = boundlessBiomeAt(g, x, y), choices = species[biome] || species.forest;
  const kind = choices[Math.floor(g.random() * choices.length)], config = creatures[kind];
  if (!config || g.blocked(x, y, 22)) return false;
  const e = {
    kind, id: g.nextId++, group: `boundless:${chunkOf(x)},${chunkOf(y)}`,
    x, y, hp: config.stats.hp, maxHp: config.stats.hp,
    speed: config.stats.speed, damage: config.stats.damage,
    state: 'hunt', timer: 1, cooldown: 1, flash: 0, dx: 0, dy: 0,
    attackX: 0, attackY: 0, step: 0, moving: false,
    faceX: -Math.cos(angle), faceY: -Math.sin(angle),
    temperament: 'restless', orbit: g.random() < .5 ? -1 : 1,
    tacticTime: 1.8, boundlessThreat: true,
  };
  g.configureCreature(e, false);
  g.enemies.push(e);
  return true;
}

/** Keep outer scenery and encounters proportional to active play, not travel distance. */
export function updateBoundlessWorld(g, dt) {
  if (g.mapMode !== 'boundless' || g.phase !== 'play' || g.openingBoard) return;
  const players = g.players.filter(p => p.hp > 0 && !p.room);
  const needed = new Set();
  for (const p of players) {
    const cx = chunkOf(p.x), cy = chunkOf(p.y);
    for (let dy = -BOUNDLESS_SCENERY_MARGIN; dy <= BOUNDLESS_SCENERY_MARGIN; dy++)
      for (let dx = -BOUNDLESS_SCENERY_MARGIN; dx <= BOUNDLESS_SCENERY_MARGIN; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x === 0 && y === 0) continue;
        needed.add(keyOf(x, y));
      }
  }
  const loaded = g.boundlessLoadedChunks ||= [];
  const byKey = new Map(loaded.map(entry => [entry.key, entry]));
  let changed = false;
  for (const key of needed) {
    if (byKey.has(key)) continue;
    const [cx, cy] = key.split(',').map(Number);
    const prefix=`boundless:${cx}:${cy}:`;
    const existing=(g.scenery||[]).filter(prop=>prop.id?.startsWith(prefix));
    const entry = { key, scenery: existing.length?existing:createChunkProps(g, cx, cy) };
    if(!existing.length)g.scenery.push(...entry.scenery);
    loaded.push(entry); byKey.set(key, entry); changed = true;
    // Spread chunk creation across frames so entering Boundless never builds
    // an entire neighborhood in one synchronous burst.
    break;
  }
  if (loaded.length !== needed.size || loaded.some(entry => !needed.has(entry.key))) {
    for (let i = loaded.length - 1; i >= 0; i--) if (!needed.has(loaded[i].key)) {
      const old = new Set(loaded[i].scenery); g.scenery = g.scenery.filter(p => !old.has(p)); loaded.splice(i, 1); changed = true;
    }
  }
  if (changed) g.boundlessSceneryRevision = (g.boundlessSceneryRevision || 0) + 1;

  // A generous board clearing stays peaceful. Threats are admitted only when
  // someone has deliberately travelled beyond it and remain hard-capped.
  g.boundlessSpawnTimer = Math.max(0, (g.boundlessSpawnTimer || 0) - Math.min(dt, .05));
  const explorer = players.find(p => Math.hypot(p.x - 800, p.y - 800) > BOUNDLESS_SAFE_RADIUS);
  const activeThreats = g.enemies.filter(e => e.hp > 0 && e.boundlessThreat);
  if (explorer && activeThreats.length < 8 && g.boundlessSpawnTimer <= 0) {
    if (spawnThreat(g, explorer)) g.boundlessSpawnTimer = 18 + g.random() * 8;
    else g.boundlessSpawnTimer = 2;
  }
  // Cull encounters that are far outside every player's active region.
  if (players.length) g.enemies = g.enemies.filter(e => !e.boundlessThreat || e.hp > 0 || players.some(p => Math.hypot(e.x - p.x, e.y - p.y) < 600));
}
