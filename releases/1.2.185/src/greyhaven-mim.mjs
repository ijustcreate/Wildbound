import {drawItem} from './item-art.mjs';
import {compilePixelRecipe} from './pixel-recipe.mjs';
import {drawPixelRecipe} from './pixel-recipe-canvas.mjs';
import {castleStory, CASTLE_INTERIOR_ORIGIN, toCastleWorld} from './wild-castle.mjs';

const STORY = 3;
const CENTER = {x: 480, y: 288};
const LANTERN = {x: 480, y: 343};
const PERCH = {x: 480, y: 301};
const FROG = {x: 480, y: 263};
const GIANT = {x: 480, y: 258};
const CROCKS = [{x: 429, y: 300}, {x: 531, y: 300}];
const SCREENS = [{x: 416, y: 332}, {x: 544, y: 332}];
const SLAM_RADIUS = 37;
const MOTH_CYCLE = 4.4;
const MOTH_PERCH_AT = 2.8;
const attempts = new WeakMap();

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const local = p => ({x: p.x - CASTLE_INTERIOR_ORIGIN.x, y: p.y - CASTLE_INTERIOR_ORIGIN.y});
const onSolar = g => g.trainTest?.design?.wildLands && castleStory(g.trainTest.design.activeRoom) === STORY;
const canEnter = p => p.hp > 0 && !p.room && !p.spectator && !p.disconnected && !p.lobbyDisconnected &&
  !p.unavailable && !p.trainRide && !p.pirateRide && !p.vehicleId && !p.broomMount && !p.wingHover &&
  !p.swimming && !p.controlledFollowerId;
const insideArena = q => q.x >= 373 && q.x <= 587 && q.y >= 195 && q.y <= 408;
const inDuel = p => canEnter(p) && insideArena(local(p));
const attempt = g => onSolar(g) ? attempts.get(g.trainTest) : undefined;

function say(g, text) {
  const t = g.trainTest;
  t.notice = text;
  t.noticeUntil = (t.time || 0) + 5.5;
  g.message?.(text);
}

export const greyhavenMimActive = g => !!attempt(g);
export const greyhavenMimComplete = p => p.npcQuests?.greyhavenMim === true;

export function startGreyhavenMim(g, p) {
  if (!onSolar(g) || !inDuel(p) || p.jumpHeight > 0 || distance(local(p), CENTER) > 80) {
    if (p.ui) p.ui.notice = 'Step onto the crest rug before you challenge Mim.';
    return false;
  }
  if (greyhavenMimActive(g)) {
    if (p.ui) p.ui.notice = 'Mim has already started the duel.';
    return false;
  }
  attempts.set(g.trainTest, {form: 'moth', age: 0, away: 0, marks: 0,
    position: {...CENTER}, entrants: new Set([p.id]), cooldown: 0, flash: 0, dart: 0});
  Object.assign(p, {ui: null, consumeInput: true, interactUsed: true, moving: false, charge: 0});
  say(g, 'Mim scatters into wings. At the lantern, wait until she settles over the brass ring.');
  g.onSound?.('magic', p);
  return true;
}

export function resetGreyhavenMim(g) {
  return attempts.delete(g.trainTest);
}

function mothPerched(state) {
  return state.age % MOTH_CYCLE >= MOTH_PERCH_AT && state.dart <= 0 && distance(state.position, PERCH) < 11;
}

function tickMoth(state, dt) {
  const cycle = state.age % MOTH_CYCLE;
  const orbitX = 480 + Math.sin(cycle * 4.8) * 69;
  const orbitY = 267 + Math.cos(cycle * 3.4) * 36;
  const settle = state.dart > 0 ? 0 : clamp((cycle - 2.35) / .38, 0, 1);
  const x = lerp(orbitX, PERCH.x, settle);
  const y = lerp(orbitY, PERCH.y, settle) - state.dart * 18;
  const follow = Math.min(1, dt * (state.dart > 0 ? 19 : 11));
  state.position.x = lerp(state.position.x, x, follow);
  state.position.y = lerp(state.position.y, y, follow);
}

function startFrog(g, state, p) {
  Object.assign(state, {form: 'frog', age: 0, marks: 0, cooldown: 2.7,
    crocks: CROCKS.map(q => ({...q, used: false})), strike: null, open: 0});
  say(g, 'Mim crouches as a frog. Rattle a crock, then snip the spell cord while her tongue is tangled.');
  g.onSound?.('magic', p);
}

function startGiant(g, state, p) {
  Object.assign(state, {form: 'giant', age: 0, cooldown: 1.35,
    screens: SCREENS.map(q => ({...q, broken: false})), strike: null, impact: 0});
  say(g, 'Mim shoulders up into a moss giant. Bait her slam at each wooden screen and dodge out of the ring.');
  g.onSound?.('bossPhase', p);
}

function hurtParty(g, party, source, hit, amount) {
  for (const p of party) {
    if ((p.jumpHeight || 0) < 15 && hit(local(p))) g.hurt?.(p, amount, toCastleWorld(source));
  }
}

function segmentDistance(a, b, point) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const fraction = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(point.x - a.x - dx * fraction, point.y - a.y - dy * fraction);
}

function nearest(party, point) {
  return party.map(local).reduce((closest, p) => distance(p, point) < distance(closest, point) ? p : closest);
}

function frogStrike(state, target, crock = null) {
  state.strike = {target, crock, elapsed: 0, warnsFor: .57, duration: 1.03};
}

function tickFrog(g, state, party, dt) {
  if (state.open > 0) {
    state.open = Math.max(0, state.open - dt);
    if (state.open <= 0) {
      state.crocks.forEach(crock => { crock.used = false; });
      state.cooldown = 1.9;
      say(g, 'The cord slipped away. The crocks rise back into place.');
    }
    return;
  }
  const strike = state.strike;
  if (!strike) {
    if (state.cooldown <= 0 && party.length) frogStrike(state, nearest(party, FROG));
    return;
  }
  const before = strike.elapsed;
  strike.elapsed += dt;
  if (before < strike.warnsFor && strike.elapsed >= strike.warnsFor && !strike.crock) {
    hurtParty(g, party, FROG, q => segmentDistance(FROG, strike.target, q) <= 10, 10);
  }
  if (strike.elapsed < strike.duration) return;
  state.strike = null;
  state.cooldown = 2.3;
  if (strike.crock) {
    strike.crock.used = true;
    state.open = 3.7;
    say(g, 'The crock snagged her tongue. Get close and snip the spell cord.');
    g.onSound?.('drop', toCastleWorld(strike.crock));
  }
}

function giantStrike(state, target) {
  state.strike = {target, elapsed: 0, duration: 1.14};
}

function tickGiant(g, state, party, dt) {
  if (state.screens.every(screen => screen.broken)) return;
  const strike = state.strike;
  if (!strike) {
    if (state.cooldown <= 0 && party.length) giantStrike(state, nearest(party, GIANT));
    return;
  }
  strike.elapsed += dt;
  if (strike.elapsed < strike.duration) return;
  state.strike = null;
  state.impact = .62;
  state.impactPoint = strike.target;
  state.cooldown = 1.42;
  const broken = state.screens.filter(screen => !screen.broken && distance(screen, strike.target) <= SLAM_RADIUS);
  for (const screen of broken) screen.broken = true;
  hurtParty(g, party, GIANT, q => distance(strike.target, q) <= SLAM_RADIUS, 20);
  g.onSound?.('bossPhase', toCastleWorld(strike.target));
  if (state.screens.every(screen => screen.broken)) {
    say(g, 'Splintered oak binds the giant’s roots. Approach Mim and break the exposed moss sigil.');
  } else if (broken.length) {
    say(g, 'The screen splinters. Bait Mim toward the other one.');
  }
}

export function tickGreyhavenMim(g, dt) {
  const state = attempts.get(g.trainTest);
  if (!state) return;
  if (!onSolar(g)) { resetGreyhavenMim(g); return; }
  const party = g.players.filter(inDuel);
  state.away = party.length ? 0 : state.away + dt;
  if (state.away > 2) {
    resetGreyhavenMim(g);
    say(g, 'Mim calls off the duel. You can challenge her again in the High Solar.');
    return;
  }
  if (!party.length) return;
  state.age += dt;
  for (const timer of ['cooldown', 'flash', 'dart', 'impact']) {
    state[timer] = Math.max(0, (state[timer] || 0) - dt);
  }
  if (state.form === 'moth') tickMoth(state, dt);
  if (state.form === 'frog') tickFrog(g, state, party, dt);
  if (state.form === 'giant') tickGiant(g, state, party, dt);
}

function actionFor(g, p) {
  const state = attempt(g);
  if (!state || !inDuel(p) || p.ui || p.jumpHeight > 0) return null;
  const q = local(p);
  if (state.form === 'moth' && distance(q, LANTERN) <= 33) {
    return {kind: 'lantern', prompt: mothPerched(state) ? 'FLASH THE LANTERN NOW' : 'WAIT FOR THE MOTH TO SETTLE'};
  }
  if (state.form === 'frog') {
    if (state.open > 0 && distance(q, FROG) <= 36) return {kind: 'cord', prompt: 'SNIP THE SPELL CORD'};
    const crock = state.crocks.find(c => !c.used && distance(q, c) <= 32);
    if (crock && !state.strike && state.open <= 0) return {kind: 'crock', crock, prompt: 'RATTLE THE CROCK'};
  }
  if (state.form === 'giant') {
    if (state.screens.every(screen => screen.broken) && distance(q, GIANT) <= 40) {
      return {kind: 'sigil', prompt: 'BREAK THE MOSS SIGIL'};
    }
    const screen = state.screens.find(panel => !panel.broken && distance(q, panel) <= 36);
    if (screen && !state.strike) return {kind: 'screen', screen, prompt: 'BAIT THE GIANT’S SLAM'};
  }
  return null;
}

export function greyhavenMimPrompt(g, p) {
  const action = actionFor(g, p);
  if (action) return action.prompt;
  const state = attempt(g);
  if (!state || !inDuel(p) || p.ui || p.jumpHeight > 0) return '';
  const text = state.form === 'moth' ? 'WATCH THE BRASS RING FROM THE LANTERN' :
    state.form === 'frog' ? (state.open ? 'GET CLOSE TO THE TANGLED FROG' : state.strike ? 'WATCH THE TONGUE' : 'FIND A CROCK') :
    state.screens.every(screen => screen.broken) ? 'APPROACH THE MOSS SIGIL' : state.strike ? 'DODGE THE SLAM RING' : 'FIND A WOODEN SCREEN';
  return {text, interact: false};
}

export function interactGreyhavenMim(g, p) {
  const action = actionFor(g, p);
  if (!action) return false;
  const state = attempt(g);
  state.entrants.add(p.id);
  switch (action.kind) {
    case 'lantern':
      if (state.cooldown > 0) break;
      state.cooldown = .56;
      state.flash = .4;
      g.onSound?.('magic', p);
      if (mothPerched(state)) {
        state.marks++;
        state.age = 0;
        if (state.marks >= 2) startFrog(g, state, p);
        else say(g, 'The light caught her. Wait for her next pass.');
      } else {
        state.dart = .6;
        say(g, 'Mim darts clear. Wait until her wings fold above the brass ring.');
      }
      break;
    case 'crock':
      frogStrike(state, action.crock, action.crock);
      g.onSound?.('ui', p);
      break;
    case 'cord':
      state.marks++;
      state.open = 0;
      state.cooldown = 2.25;
      if (state.marks >= 2) startGiant(g, state, p);
      else {
        say(g, 'One cord cut. Rattle the other crock to catch her again.');
        g.onSound?.('magic', p);
      }
      break;
    case 'screen':
      giantStrike(state, action.screen);
      g.onSound?.('ui', p);
      break;
    case 'sigil': {
      for (const member of g.players) {
        if (state.entrants.has(member.id) || inDuel(member)) (member.npcQuests ??= {}).greyhavenMim = true;
      }
      resetGreyhavenMim(g);
      say(g, 'Madam Mim yields. “Same rug again tomorrow, if you think this was luck.”');
      g.onSound?.('loot', p);
      g.persist?.();
      break;
    }
  }
  return true;
}

export function greyhavenMimBlocked(g, x, y, radius = 0, height = 0, from = null) {
  const state = attempt(g);
  if (state?.form !== 'giant' || height >= 25) return false;
  const q = local({x, y});
  const within = (point, screen) => Math.abs(point.x - screen.x) < 17 + radius &&
    Math.abs(point.y - screen.y) < 5 + radius;
  return state.screens.some(screen => !screen.broken && within(q, screen) &&
    (!from || !within(local(from), screen) || distance(q, screen) < distance(local(from), screen)));
}

function pixelForm(palette, rows) {
  const width = Math.max(...rows.map(row => row.length));
  return compilePixelRecipe({width, height: rows.length, x: -Math.floor(width / 2), y: -rows.length,
    palette, rows: rows.map(row => row.padEnd(width, '.'))});
}

// The ochre pin at the collar survives all three forms as a pair of pale gold marks.
const mothColors = {o: '#432b44', s: '#803e62', p: '#c47383', l: '#eb9b99', y: '#f3d293', b: '#72563b'};
const mothOpen = pixelForm(mothColors, [
  '...oooo.......o...o.......oooo',
  '..olllpo.......o.o.......oplllo',
  '.olllppsoo.....oyo.....oospplllo',
  'olllpppppsoo..oyyyo..oosppppplllo',
  'olppllyyyppso.oybbo.osppyyyllpplo',
  'oppllyyyyypsoooyybooospyyyyyllppo',
  '.osppyyyyypsoobyyyoosppyyyyyppso',
  '..ospppppppsobbbbyosppppppppso',
  '...oospsssoobybyyyobsossspsoo',
  '....opppspobyyybybospspppo',
  '....ollyypobbbbyboospyyllo',
  '.....olyyssoobboosssyylo',
  '......ossssoo...oossso',
  '.......oooo.......ooo',
]);

const mothClosed = pixelForm(mothColors, [
  '......o...o',
  '.......o.o',
  '.......oyo',
  '......oyyyo',
  '....ooooyboo',
  '...olllooyplo',
  '..olllppobpppo',
  '..ollpypobyppso',
  '.olpypypsobpsso',
  '.opypyypsoboossso',
  '..osppspsoboossoo',
  '...ospsssoo...oo',
  '....ooooo',
]);

const frogArt = pixelForm({o: '#293633', s: '#43563a', b: '#637547', m: '#769652', l: '#9ab65f',
  c: '#d1bb84', h: '#e8d4a3', u: '#b78858', a: '#eca85e', k: '#382d36'}, [
  '.........oooo..........oooo',
  '.......oomllmo........omlmmoo',
  '......omllllllooooooooomllllmo',
  '.....omollmlcmlllllllllocllmmo',
  '....ommocackcmlllllllllocackcmo',
  '....olmoccukcmmmmmmmmmmoocukcmo',
  '...omllboooobmllllllllmmboooobo',
  '...osbbmsbbbbmmllllllmmmbbbsmso',
  '..ossbmlmllmmmbbbbbbbbbmmmlmbso',
  '.osbbllmssssssbbbbbbbbsssssmmbso',
  'osbbbllmsoccchhhhhhchccossmlbbso',
  'osbmmmlmbschhhcccccchhcmmsmmmbso',
  'osbmmllmbschccccccccccccmmllmbso',
  '.osmmllmmsbmcccccucucbmmmbmmbso',
  '..osmmmmmmmmssssssssssssmmmmso',
  '...oobmmlmbbsoooooooooosbmmbo',
  '.....oobbsssso.........osbbooo',
  '....ombbobmmo.........omobmboo',
  '....ooooooooo.........oooooooo',
]);

const giantArt = pixelForm({o: '#303238', d: '#494346', r: '#676360', g: '#858078', l: '#a29b88',
  s: '#464f32', m: '#64764b', v: '#829554', h: '#a8ad65', a: '#f4cd85'}, [
  '....................ooooo',
  '.................ooommmhmooo',
  '................ommmhvvvvmvoo',
  '..............oosvvvhhhhvvvmo',
  '.............omsvvvhgggghvmsso',
  '.....oooo...ossmhhglgggrghvsoo....oooo',
  '...oovvmmoooossmgggrrrrdrrsssooooomvvvoo',
  '..ovhmvvmvsmmossgggrrdddrgdmssmmmvmmvhhvo',
  '.ovhvvvvmvvvsosgrdooaadooaorsmmmvmmmsvhvvo',
  '.osvmvhhvvvmmsosrrgadrrrgadosmmmmhmssmvvvo',
  'osmvhhhvmmmsdossgggrggggrrrssmmmmvhmvvmsso',
  'osvvhvvvvmmssddossddggrrdrrssmmmmhvvmvmssdo',
  'osmmvvmmmmmmsrsdossrrrrrrrsssssmvvvmvmssddo',
  '.osmdggmmmsrrrrrdsorrrrssssdddsmvvvmvmsddo',
  '.orsrgggrsrrgglgrddsssssddddddssmggmmsddo',
  '.orggllgrgrrrgrddrrrrddrrrrrrdddrrrgrdddo',
  '.orggggrrdrrrgddrrgmlvmlaamgdrrddgggrddo',
  '.orggrrrdddrrdrrgggghmmadammgrrddgrrrddo',
  '.odgggrrddorrrrrrrgghvmvaamgdrdddrgrrddo',
  '.odrrgrrrdodrrrrrgggmmvmvmmrdrdodrggdddo',
  '.oddrrrdddosdrrrrggvmmmvmvmgddodrgrddo',
  '.odrrrggddoosmmrrgmmmvmvmmsddoodrggdrdo',
  'odrgggrddddoosmmrrmmmmmmmsddooodrggrddo',
  'odgggrrddddooosmmsssssssdddoooodrgrgddo',
  'odggrggdddooossmmmmsssmssddoooodrrgdddo',
  '.odgrgrrddoorsmmmmssmmmmmssdrdodrrrrddo',
  '..odrrrddooorrggmssooommsssgrdoodrrrdo',
  '...oooooo...orrggrdo..odrgrgrdo..oooo',
  '............orgrrrdo..odgrrrrdo',
  '...........orrrgrrdo..odrrrgrddo',
  '..........odgggrrrdo..odrrggrddo',
  '..........odrrddrddo..odrgrrddrdo',
  '..........ooooooooo...oooooooooo',
]);

function drawRing(c, point, radius, fill, stroke, sy = 1) {
  c.beginPath();
  c.ellipse(point.x, point.y, radius, radius * sy, 0, 0, Math.PI * 2);
  if (fill) { c.fillStyle = fill; c.fill(); }
  c.strokeStyle = stroke;
  c.lineWidth = 2;
  c.stroke();
}

function drawFrogTongue(c, strike) {
  const {target, crock, elapsed, warnsFor, duration} = strike;
  const windup = elapsed < warnsFor;
  const retract = clamp((elapsed - warnsFor) / (duration - warnsFor), 0, 1);
  const x = lerp(target.x, FROG.x, retract), y = lerp(target.y, FROG.y, retract);
  c.strokeStyle = windup ? '#d88577a8' : '#f7a499';
  c.lineWidth = windup ? 2 : 4;
  if (windup) c.setLineDash([4, 5]);
  c.beginPath();
  c.moveTo(FROG.x, FROG.y - 7);
  c.quadraticCurveTo((x + FROG.x) / 2, (y + FROG.y) / 2 - 13, x, y);
  c.stroke();
  if (windup) c.setLineDash([]);
  if (crock && !windup) drawCrock(c, {x, y});
}

function drawCrock(c, {x, y}) {
  c.fillStyle = '#372f37'; c.fillRect(Math.round(x - 8), Math.round(y - 12), 16, 12);
  c.fillStyle = '#936049'; c.fillRect(Math.round(x - 6), Math.round(y - 10), 12, 8);
  c.fillStyle = '#b28058'; c.fillRect(Math.round(x - 5), Math.round(y - 10), 4, 7);
  c.fillStyle = '#e2bb83'; c.fillRect(Math.round(x - 6), Math.round(y - 10), 11, 2);
  c.fillStyle = '#573b39'; c.fillRect(Math.round(x - 4), Math.round(y - 15), 8, 3);
}

function drawScreen(c, {x, y, broken}) {
  c.fillStyle = '#251e2199'; c.fillRect(x - 20, y - 1, 40, 5);
  if (broken) {
    for (const [dx, dy, width] of [[-21, 2, 14], [-9, -3, 10], [3, 1, 16], [14, -3, 8]]) {
      c.fillStyle = '#513735'; c.fillRect(x + dx, y + dy, width, 4);
      c.fillStyle = '#a2754d'; c.fillRect(x + dx + 2, y + dy, width - 3, 1);
    }
    return;
  }
  c.fillStyle = '#392e34'; c.fillRect(x - 17, y - 23, 34, 27);
  c.fillStyle = '#996a46'; c.fillRect(x - 15, y - 21, 30, 19);
  for (const offset of [-13, -3, 7]) {
    c.fillStyle = '#ad7e55'; c.fillRect(x + offset, y - 20, 6, 16);
    c.fillStyle = '#775236'; c.fillRect(x + offset + 6, y - 20, 2, 16);
  }
  c.fillStyle = '#c29a61'; c.fillRect(x - 16, y - 18, 32, 2); c.fillRect(x - 16, y - 8, 32, 2);
  c.fillStyle = '#574038'; c.fillRect(x - 15, y - 23, 4, 26); c.fillRect(x + 11, y - 23, 4, 26);
}

function drawMoth(c, state) {
  const {x, y} = state.position;
  const settled = mothPerched(state);
  const flutter = Math.floor(state.age * 16) % 3;
  const loft = settled ? 10 : 23 + Math.sin(state.age * 16) * 3;
  c.fillStyle = '#31293969'; c.fillRect(Math.round(x - 9), Math.round(y), 18, 2);
  drawPixelRecipe(c, settled || flutter === 0 ? mothClosed : mothOpen, 0, Math.round(x), Math.round(y - loft));
}

function drawFrog(c, state) {
  const {x, y} = FROG;
  const height = state.open || state.strike ? 0 : Math.max(0, Math.sin(state.age * 5.8)) * 4;
  c.fillStyle = '#29253379'; c.fillRect(x - 16, y, 32, 4);
  drawPixelRecipe(c, frogArt, 0, x, Math.round(y - height));
  if (state.open) {
    c.fillStyle = '#b67551'; c.fillRect(x - 2, y - 4, 4, 8);
    c.fillStyle = '#ffe5a1'; c.fillRect(x - 1, y - 4, 2, 5);
  }
}

function drawGiant(c, state) {
  const {x, y} = GIANT, strike = state.strike;
  const brace = strike ? strike.elapsed / strike.duration : 0;
  const posed = state.screens.every(screen => screen.broken);
  c.fillStyle = '#29253389'; c.fillRect(x - 30, y - 1, 60, 6);
  c.save();
  c.translate(x, y + (posed ? 4 : 0));
  c.scale(1.52 + (posed ? .1 : 0), 1.52 + Math.round(brace * 4) * .035 - (posed ? .19 : 0));
  drawPixelRecipe(c, giantArt, 0);
  c.restore();
  if (posed) drawRing(c, {x, y: y - 25}, 8 + Math.sin(state.age * 7), '#c3d87b42', '#e1ed9b');
}

export function greyhavenMimSubjects(g, story) {
  const state = attempt(g);
  if (!state || story !== STORY) return [];
  const subject = (depth, paint) => ({depth, paint});
  if (state.form === 'moth') return [
    subject(0, c => {
      drawRing(c, PERCH, 10, '#b58d5145', '#ba955c', .64);
      if (state.flash) drawRing(c, PERCH, 46 * (1 - state.flash / .51), '#ffd79524', '#ffda8a91', .68);
    }),
    subject(LANTERN.y, c => drawItem(c, 'lantern', LANTERN.x, LANTERN.y - 13, 25)),
    subject(state.position.y, c => drawMoth(c, state)),
  ];
  if (state.form === 'frog') return [
    ...state.crocks.filter(crock => !crock.used && (state.strike?.crock !== crock ||
      state.strike.elapsed < state.strike.warnsFor)).map(crock => subject(crock.y, c => drawCrock(c, crock))),
    subject(FROG.y, c => drawFrog(c, state)),
    ...(state.strike ? [subject(FROG.y + 1, c => drawFrogTongue(c, state.strike))] : []),
  ];
  return [
    ...(state.strike ? [subject(0, c => drawRing(c, state.strike.target, SLAM_RADIUS, '#cf63354a', '#f7ab74'))] : []),
    ...(state.impact ? [subject(0, c => {
      const radius = SLAM_RADIUS + (1 - state.impact / .62) * 11;
      drawRing(c, state.impactPoint, radius, null, '#e5ca8cab');
    })] : []),
    ...state.screens.map(screen => subject(screen.y, c => drawScreen(c, screen))),
    subject(GIANT.y, c => drawGiant(c, state)),
  ];
}
