import {snapshot} from './rooms.mjs';
import {seatOpeningParty} from './opening-board.mjs';
import {restoreForestLandscape} from './forest-landscape.mjs';
import {checkpointBoundlessWorld} from './boundless-world.mjs';

export const FOREST_PORTAL_EVENT = Object.freeze({
  name: 'Heartwood Passage',
  poi: 'Heartwood Clearing',
});

const protectedKeys = new Set([
  'forestJourney', 'random', 'persist', 'onSound', 'spriteLibrary',
  'saving', 'saveError', 'controlLabels',
  'persistentWorld',
]);

function capture(g) {
  checkpointBoundlessWorld(g);
  const state = snapshot(g);
  delete state.forestJourney;
  return structuredClone(state);
}

function applyWorld(g, state) {
  const party = g.players;
  for (const key of Object.keys(g))
    if (!protectedKeys.has(key) && key !== 'players' && typeof g[key] !== 'function' && !(key in state))
      delete g[key];
  const world = structuredClone(state);
  delete world.players;
  Object.assign(g, world);
  g.players = party;
  g.explored = new Set(state.explored || []);
  g.forestLandscape = null;
  restoreForestLandscape(g, state.forestLandscapeVersion);
  g.boundlessLoadedChunks = [];
  for (const door of g.portals || []) if (door.forestTravel) door.entryReady = [];
  for (const p of party) {
    p.room = null;
    p.ui = null;
    p.previousInput = {};
    p.charge = 0;
    p.jumpHeight = 0;
    p.groundHeight = 0;
  }
}

function portal(g, x, y, direction) {
  return {
    id: g.nextId++, x, y, forestTravel: direction, closing: null,
    color: '#51cfa2', entryReady: [],
  };
}

function homePortalSpot(g, owner) {
  const angle = Math.atan2(owner.faceY || 0, owner.faceX || 1);
  for (let n = 0; n < 16; n++) {
    const a = angle + n * Math.PI / 8;
    const x = owner.x + Math.cos(a) * 64, y = owner.y + Math.sin(a) * 64;
    if ([.5, .75, 1].every(t => !g.blocked(owner.x + (x-owner.x)*t, owner.y + (y-owner.y)*t, 18)))
      return {x, y};
  }
  return null;
}

/** The event is intentionally called only by the developer console. */
export function openForestPortal(g, ownerId) {
  if (g.phase !== 'play') return {ok:false,message:'Start an expedition before opening Heartwood Passage.'};
  const owner = g.players.find(p => String(p.id) === String(ownerId));
  if (!owner || owner.hp <= 0 || owner.room) return {ok:false,message:'Open this event from a living explorer outside a room.'};
  if (g.forestJourney?.active === 'forest') return {ok:false,message:'The party is already in Heartwood Clearing. Use the return portal.'};
  if (g.portals.some(d => d.forestTravel === 'outbound')) return {ok:false,message:'Heartwood Passage is already open.'};
  const spot = homePortalSpot(g, owner);
  if (!spot) return {ok:false,message:'Move into open ground and try the portal again.'};
  g.portals.push(portal(g, spot.x, spot.y, 'outbound'));
  g.openingBoard = false;
  g.message('Heartwood Passage opens. Walk into the green portal to take the board and party to the endless forest.');
  g.persist();
  return {ok:true,message:'Heartwood Passage opened beside '+owner.name+'. The whole party travels together.'};
}

/** Switch worlds as a party, retaining the same live player objects and their inventory. */
export function travelThroughForestPortal(g, door) {
  if (g.phase !== 'play' || !door?.forestTravel || !g.portals.includes(door)) return false;
  const journey = g.forestJourney ?? {active:'home',home:null,forest:null};
  if (door.forestTravel === 'outbound') {
    if (journey.active !== 'home') return false;
    journey.home = capture(g);
    if (!journey.forest) {
      const fresh = new g.constructor(g.random);
      fresh.players = structuredClone(g.players);
      fresh.seed = (g.seed + 7919) % 1000000;
      fresh.environment = 'forest';
      fresh.generatedEnvironment = '';
      fresh.mapMode = 'boundless';
      fresh.difficulty = g.difficulty;
      fresh.diceCount = g.diceCount;
      fresh.start();
      fresh.openingBoard = false;
      fresh.portals.push(portal(fresh, 800, 905, 'return'));
      journey.forest = capture(fresh);
    }
    applyWorld(g, journey.forest);
    seatOpeningParty(g.players);
    for (const p of g.players) if (p.hunterPet && typeof p.hunterPet === 'object') {
      p.hunterPet.x = p.x - 24; p.hunterPet.y = p.y + 12;
      p.hunterPet.room = null;
    }
    journey.active = 'forest';
    g.forestJourney = journey;
    g.message('LIVE SERVER · HEARTWOOD FOREST ENTERED. This is the persistent shared world; the green return portal stays open behind the party.');
  } else {
    if (journey.active !== 'forest' || !journey.home) return false;
    journey.forest = capture(g);
    const oldPositions = new Map((journey.home.players || []).map(p => [p.id, {x:p.x,y:p.y}]));
    applyWorld(g, journey.home);
    for (const p of g.players) {
      const spot = oldPositions.get(p.id) || {x:800,y:875};
      p.x = spot.x; p.y = spot.y;
      if (p.hunterPet && typeof p.hunterPet === 'object') {
        p.hunterPet.x = p.x - 24; p.hunterPet.y = p.y + 12;
        p.hunterPet.room = null;
      }
    }
    journey.active = 'home';
    g.forestJourney = journey;
    g.message('The party returns to its game. Heartwood Passage remains open.');
  }
  g.persist();
  return true;
}
