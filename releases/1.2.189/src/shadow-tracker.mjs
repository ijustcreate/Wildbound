import { DEFAULT_APPEARANCE } from './appearance.mjs';
import { realmTerrainAt } from './realm-world.mjs';

const encounters = new WeakMap();
const TALK_REACH = 64;
const WAIT_REACH = 105;
const TRACKER = {
  id: 'shadow-drizzt', name: 'Drizzt Do’Urden', title: 'Ranger of the Shadow Realm',
  sprite: 'player', hp: 1, maxHp: 1, faceX: 0, faceY: 1,
  appearance: {
    ...DEFAULT_APPEARANCE, skin: '#555065', hair: 'long', hairColor: '#e5e6ec',
    face: 'elf', eyeColor: '#b694d6', shirt: '#426056', pants: '#393c50',
  },
  equipment: { cape: 'banshee_cape', hand1: 'starter_sword', hand2: 'sword' },
};
const PANTHER = {
  id: 'shadow-guenhwyvar', name: 'Guenhwyvar', sprite: 'panther', kind: 'panther',
  faction: 'ally', hp: 1, maxHp: 1, faceX: .5, faceY: 1, step: 0,
};
const APPROACHES = [[-8, -152], [112, -128], [-134, -92], [155, 10], [-160, 42], [21, 167]];
const LOOP = [[35, 19], [100, 13], [119, -49], [76, -97], [12, -66], [35, 19]];
const TRAIL_LAYOUTS = [LOOP, LOOP.map(([x, y]) => [-x, y]), LOOP.map(([x, y]) => [-y, x]), LOOP.map(([x, y]) => [y, -x])];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function active(g) {
  return g.generatedEnvironment === 'shadow' && g.phase === 'play' && !g.realmEditor && g.realmState;
}

function findStation(g) {
  const { originX = 0, originY = 0 } = g.realmState;
  const open = ({ x, y }) => realmTerrainAt(g, Math.floor(x / 32), Math.floor(y / 32)) === 'shadow_soil' && !g.blocked(x, y, 12);
  const segmentOpen = (a, b) => {
    const steps = Math.ceil(distance(a, b) / 10);
    for (let i = 1; i <= steps; i++) {
      if (!open({ x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps })) return false;
    }
    return true;
  };
  for (const [dx, dy] of APPROACHES) {
    const anchor = { x: originX + 800 + dx, y: originY + 800 + dy };
    if (!open(anchor)) continue;
    for (const rotated of TRAIL_LAYOUTS) {
      const route = rotated.map(([x, y]) => ({ x: anchor.x + x, y: anchor.y + y }));
      if (route.every((point, i) => segmentOpen(route[i - 1] || anchor, point))) return { anchor, route };
    }
  }
  return null;
}

export function tickShadowTracker(g, dt) {
  if (!active(g) || g.paused) return;
  let state = encounters.get(g.realmState);
  if (!state?.tracker) {
    const now = g.time ?? 0;
    if (!g.terrain?.length || state?.retryAt > now) return;
    const station = findStation(g);
    if (!station) {
      encounters.set(g.realmState, { retryAt: now + 2 });
      return;
    }
    state = {
      tracker: { ...TRACKER, ...station.anchor }, panther: { ...PANTHER, ...station.route[0] },
      route: station.route, trail: null,
    };
    encounters.set(g.realmState, state);
  }
  if (!state.trail) return;
  const { trail, panther, route } = state;
  const owner = g.players.find(p => p.id === trail.owner && p.hp > 0 && !p.room);
  if (!owner || distance(owner, state.tracker) > 370) {
    Object.assign(panther, route[0], { moving: false });
    state.trail = null;
    return;
  }
  const target = route[trail.next];
  const gap = distance(panther, target);
  panther.moving = false;
  if (gap < 1) {
    if (distance(owner, target) > WAIT_REACH * .64) return;
    if (trail.next < route.length - 1) trail.next++;
    else {
      state.trail = null;
      g.message?.('Guenhwyvar has led you back to Drizzt.');
    }
    return;
  }
  if (distance(owner, panther) > WAIT_REACH) return;
  const step = Math.min(gap, dt * 58);
  const faceX = (target.x - panther.x) / gap, faceY = (target.y - panther.y) / gap;
  const x = panther.x + faceX * step, y = panther.y + faceY * step;
  if (g.blocked(x, y, 10)) {
    Object.assign(panther, route[0]);
    state.trail = null;
    g.message?.('Guenhwyvar returns to Drizzt. Something has blocked the trail.');
    return;
  }
  Object.assign(panther, { x, y, faceX, faceY, moving: step > 0, step: panther.step + step * .18 });
}

function encounter(g) {
  const state = active(g) && encounters.get(g.realmState);
  return state?.tracker ? state : null;
}

export function shadowTrackerActors(g) {
  const state = encounter(g);
  return state ? [
    { ...state.tracker, isQuestNpc: true, shadowTracker: true, drawDepth: state.tracker.y },
    { ...state.panther, drawDepth: state.panther.y },
  ] : [];
}

export function drawShadowTrackerTrail(c, g) {
  const state = encounter(g);
  if (!state?.trail) return;
  const { route, trail } = state;
  c.save();
  for (let i = 1; i <= trail.next; i++) {
    const a = route[i - 1], b = route[i];
    const rotation = Math.atan2(b.y - a.y, b.x - a.x);
    for (let j = 1; j <= 4; j++) {
      const progress = j / 5;
      c.save();
      c.translate(Math.round(a.x + (b.x - a.x) * progress), Math.round(a.y + (b.y - a.y) * progress));
      c.rotate(rotation);
      c.translate(0, j % 2 ? 5 : -5);
      c.fillStyle = i === trail.next ? '#b2c6de' : '#698099';
      c.fillRect(-3, -2, 4, 4);
      c.fillRect(2, -4, 2, 2);
      c.fillRect(3, -1, 2, 2);
      c.fillRect(2, 2, 2, 2);
      c.restore();
    }
  }
  c.restore();
}

export function openShadowTrackerDialogue(g, p) {
  const state = encounter(g);
  if (!state || p.ui || p.room || p.hp <= 0 || distance(p, state.tracker) > TALK_REACH) return false;
  p.ui = { shop: 'npc-dialogue', shadowTracker: true, npcId: TRACKER.id, ownerDevice: p.device, node: 'greet', index: 0 };
  p.consumeInput = true;
  p.interactUsed = true;
  p.menuRepeat = 0;
  p.charge = 0;
  g.onSound?.('ui', p);
  return true;
}

export function shadowTrackerView(g, p) {
  const state = encounter(g);
  if (!state) return null;
  const node = p.ui.node;
  const texts = {
    greet: 'Wait here a moment. Guenhwyvar’s ears moved before the brush did. We’ll let her see what’s on the other side.',
    trail: 'She’ll circle the clearing and wait at each bend. Follow her pale pawprints, and give her enough room to hear ahead of us.',
    panther: 'I used to look for her shape against the dark. These days I watch the birds. If they settle again, Guenhwyvar is already past them.',
  };
  const choices = node === 'trail' ? [
    { label: 'Follow Guenhwyvar.', action: 'start', disabled: Boolean(state.trail) },
    { label: 'Ask about Guenhwyvar instead.', action: 'panther' },
    { label: 'Leave the tracks undisturbed.', action: 'close' },
  ] : [
    { label: 'Could she show me the trail?', action: 'trail' },
    ...(node === 'panther' ? [] : [{ label: 'How do you tell where she’s gone?', action: 'panther' }]),
    { label: 'I’ll leave you to watch the woods.', action: 'close' },
  ];
  return { npc: state.tracker, title: TRACKER.title, text: texts[node], choices };
}

export function validShadowTrackerDialogue(g, p) {
  const state = encounter(g);
  return state && p.ui?.ownerDevice === p.device && !p.room && p.hp > 0 && distance(p, state.tracker) <= 100;
}

export function shadowTrackerAction(g, p, action) {
  const state = encounter(g), u = p.ui;
  if (!validShadowTrackerDialogue(g, p)) {
    p.ui = null;
    return true;
  }
  const { choices } = shadowTrackerView(g, p);
  if (['next', 'prev', 'down', 'up'].includes(action)) {
    const step = action === 'next' || action === 'down' ? 1 : -1;
    u.index = (u.index + step + choices.length) % choices.length;
    return true;
  }
  if (action === 'use') action = choices[u.index]?.action;
  if (action?.startsWith('choice:')) action = choices[Number(action.slice(7))]?.action;
  if (action === 'close') {
    p.ui = null;
    p.consumeInput = true;
  } else if (choices.some(choice => choice.action === action && !choice.disabled)) {
    if (action === 'start') {
      state.trail = { owner: p.id, next: 1 };
      p.ui = null;
      p.consumeInput = true;
      g.message?.('Follow Guenhwyvar’s pawprints around the clearing.');
    } else {
      u.node = action;
      u.index = 0;
    }
  }
  return true;
}
