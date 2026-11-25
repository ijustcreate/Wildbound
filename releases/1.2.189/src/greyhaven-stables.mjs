import {timeOfDay} from './night-cycle.mjs';
import {railwaySurface} from './railway-water.mjs';
import {castleInteriorBlocked, castleStory, toCastleWorld} from './wild-castle.mjs';
import {greyhavenCastLook} from './greyhaven-cast-art.mjs';
import {drawGreyhavenHorse, drawGreyhavenStable, drawStableChore, drawStormLantern, drawRaceFlag, drawRaceHurdle} from './greyhaven-stable-art.mjs';

const ECTOR = 'greyhaven-ector';
const KAY = 'greyhaven-kay';
export const greyhavenStableProfiles = [
  {id: ECTOR, name: 'Sir Ector', title: 'Lord of Greyhaven', story: 1, x: 382, y: 418, faceX: 0, faceY: 1},
  {id: KAY, name: 'Kay', title: 'Greyhaven’s young knight', story: 0, x: 17994, y: 2258, faceX: -1, faceY: 1},
];

const gate = {x: 17964, y: 2238};
const mount = {x: 17977, y: 2209, faceX: -.8, faceY: .6};
const ponyHome = {x: 17965, y: 2253};
const ponyStart = {x: 18051, y: 2248};
const dayChores = [
  {story: 1, x: 236, y: 227, kind: 'bucket', prompt: 'TAKE THE WATER BUCKET', result: 'Take the bucket to the trough right of the castle bridge.'},
  {story: 0, x: 17898, y: 2194, kind: 'trough', prompt: 'WATER THE HORSES', result: 'The trough is full. Set out the hay east of the stable.'},
  {story: 0, x: 18027, y: 2221, kind: 'hay', prompt: 'SET OUT THE HAY', result: 'The stable hands leave the key with you. Take the stable gate or go challenge Kay.'},
];
const nightChores = [
  {story: 0, x: 17929, y: 2231, kind: 'lantern', prompt: 'TAKE ECTOR’S STORM LANTERN', result: 'Wet hoofprints flash in the lantern light just to the southwest.'},
  {story: 0, x: 17900, y: 2252, kind: 'tracks', prompt: 'CHECK THE HOOFPRINTS', result: 'The prints veer south. Follow them onto the grass.'},
  {story: 0, x: 17924, y: 2287, kind: 'tracks', prompt: 'FOLLOW THE HOOFPRINTS', result: 'A tail has brushed the wet grass here. Look east for the next prints.'},
  {story: 0, x: 17981, y: 2282, kind: 'tracks', prompt: 'FOLLOW THE HOOFPRINTS', result: 'Something shifts near the hay fence to the northeast. Walk up quietly.'},
  {...ponyStart, story: 0, kind: 'pony', prompt: 'SOOTHE THE LOST PONY', result: 'Bracken is following you. Walk him to the ring at the stable gate.'},
  {...ponyHome, story: 0, kind: 'ring', prompt: 'TIE BRACKEN AT THE GATE', result: 'Bracken is home. Ector has left ten coins in the tack box for the night watch.'},
];

const raceStart = {x: 18004, y: 2298};
const course = [
  {x: 18142, y: 2291}, {x: 18214, y: 2397}, {x: 18056, y: 2478},
  {x: 17869, y: 2506}, {x: 17779, y: 2404}, {x: 17885, y: 2323}, raceStart,
];
const shortcuts = {
  1: {x: 18193, y: 2329, pause: .72, message: 'Kay cuts across the wet grass. His horse skids in the turn.'},
  3: {x: 17957, y: 2450, pause: 1.16, message: 'Kay cuts toward the loose rail. His horse refuses it.'},
};
const coursePoints = [raceStart, ...course];
const courseDistance = coursePoints.map((point, i) => i ? Math.hypot(point.x - coursePoints[i - 1].x, point.y - coursePoints[i - 1].y) : 0);
const legStart = courseDistance.map((_, i) => courseDistance.slice(0, i + 1).reduce((sum, length) => sum + length, 0));
const reach = 26;
const firstPrize = 20;
const recordFor = p => p.npcQuests?.greyhavenStables || {};
const saveRecord = p => ((p.npcQuests ??= {}).greyhavenStables ??= {});
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const surface = g => g.trainTest?.design?.wildLands && !g.trainTest.design.activeRoom;
const visitor = p => p.hp > 0 && !p.room && !p.trainRide && !p.pirateRide && !p.vehicleId &&
  !p.broomMount && !p.wingHover && !p.swimming && !p.controlledFollowerId && !(p.jumpHeight > 4);
const runtimes = new WeakMap();

function runtime(g, create = false) {
  const t = g.trainTest;
  if (!t?.design?.wildLands) return null;
  if (create && !runtimes.has(t)) runtimes.set(t, {gateOpen: false, ponies: new Map(), race: null});
  return runtimes.get(t);
}

function stepFor(record, sequence) {
  return sequence === dayChores ? record.dayStep : record.nightStep;
}

function choreFor(p) {
  const record = recordFor(p);
  if (!record.stableUnlocked) return dayChores[record.dayStep];
  if (!record.nightDone) return nightChores[record.nightStep];
  return null;
}

function playNotice(g, p, text, key = 'ui') {
  const t = g.trainTest;
  t.notice = text;
  t.noticeUntil = t.time + 5;
  g.message?.(text);
  g.onSound?.(key, p);
}

export function greyhavenStableDialogue(g, p, id) {
  const record = recordFor(p);
  if (id === KAY) {
    if (!record.stableUnlocked) return {text: 'Ask my father for a stable key. I’m happy to beat you as soon as he lets you near a horse.', choices: []};
    if (runtime(g)?.race) return {text: 'Someone is already out on the course. The gate will be clear when they come round.', choices: []};
    const personal = record.bestRace ? ` Your best winning time is ${record.bestRace.toFixed(1)} seconds.` : '';
    return {text: `One lap round the flags. Steer to each gold flag in order, and use Attack to ask your horse for a burst of speed. I know every shortcut in this field.${personal}`,
      choices: [{action: 'start', label: 'Saddle up and race Kay'}]};
  }
  if (id !== ECTOR) return null;
  const afterDark = timeOfDay(g) === 'night';
  const sequence = record.stableUnlocked ? nightChores : dayChores;
  const progress = stepFor(record, sequence);
  if (sequence === nightChores && record.nightDone) return {text: 'Bracken is asleep with his nose in the hay. The younger horses settle faster with him back in his stall.', choices: []};
  if (Number.isInteger(progress) && progress < sequence.length) {
    const chore = sequence[progress];
    return {text: sequence === dayChores ? 'The horses are waiting on you.' : 'Keep your ears open around the yard.', choices: [],
      quest: {title: sequence === dayChores ? 'The stable key' : 'Bracken after dark', description: chore.prompt[0] + chore.prompt.slice(1).toLowerCase(), progress, target: sequence.length}};
  }
  if (!record.stableUnlocked) return {text: 'Take the kitchen bucket out to the horse trough, then set out the hay. A hand with those jobs would earn you a stable key.',
    choices: [{action: 'start', label: 'Take on the stable chores'}]};
  if (afterDark) return {text: 'Bracken slipped his tether. Take my storm lantern off the stable post and look for his wet hoofprints. Walk him back when you find him.',
    choices: [{action: 'start', label: 'Find Bracken after dark'}]};
  return {text: 'You’ve earned your key. Kay is waiting by the yard. Come find me after dark and I’ll show you what changes on a night watch.', choices: []};
}

function startRace(g, p) {
  const stable = runtime(g, true);
  if (stable.race || !surface(g) || !visitor(p) || !recordFor(p).stableUnlocked) return false;
  stable.race = {owner: p, elapsed: -3, next: 0, boost: 0, retryBoost: 0,
    kay: {x: raceStart.x - 2, y: raceStart.y - 20, faceX: 1, faceY: 0, next: 0, pause: 0, shortcuts: new Set()}};
  Object.assign(p, raceStart, {faceX: 1, faceY: 0, moving: false, walking: false, attack: 0, charge: 0,
    dashTime: 0, dashRecovery: 0, jumpHeight: 0, jumpVelocity: 0, step: 0, moveSpeed: 0,
    bowAiming: false, swordChargeAim: false, blocking: false, ui: null});
  playNotice(g, p, 'Kay’s race begins in three. Follow the gold flag. Attack to sprint and Interact to dismount.');
  return true;
}

export function startGreyhavenStable(g, p, id) {
  const view = greyhavenStableDialogue(g, p, id);
  if (!view) return false;
  if (!view.choices.some(choice => choice.action === 'start')) return true;
  if (id === KAY) {
    startRace(g, p);
    return true;
  }
  const record = saveRecord(p);
  if (record.stableUnlocked) record.nightStep = 0;
  else record.dayStep = 0;
  const first = choreFor(p);
  Object.assign(p, {ui: null, consumeInput: true});
  playNotice(g, p, first.kind === 'bucket' ? 'The water bucket is by the kitchen hearth.' : 'Ector’s lantern hangs on the post left of the stable gate.');
  g.persist?.();
  return true;
}

function actionFor(g, p) {
  const d = g.trainTest?.design;
  if (!d?.wildLands || p.ui || !visitor(p)) return null;
  const story = castleStory(d.activeRoom);
  if (d.activeRoom && !story) return null;
  const stables = runtime(g), record = recordFor(p), chore = choreFor(p);
  if (surface(g) && stables?.race?.owner === p) return {type: 'dismount', prompt: 'DISMOUNT'};
  if (chore?.story === story) {
    const point = story ? toCastleWorld(chore) : chore;
    const near = distance(p, point) <= (chore.kind === 'tracks' ? 31 : reach);
    const pony = stables?.ponies.get(p);
    if (near && (chore.kind !== 'ring' || pony && distance(pony, ponyHome) <= 42) &&
        (!story || !castleInteriorBlocked(story, (p.x + point.x) / 2, (p.y + point.y) / 2, 0))) return {type: 'chore', chore, prompt: chore.prompt};
  }
  if (story || distance(p, gate) > 26) return null;
  if (!record.stableUnlocked) return {type: 'locked', prompt: 'CHECK THE LOCKED STABLE GATE'};
  return stables?.gateOpen ? null : {type: 'gate', prompt: 'UNLOCK THE STABLE GATE'};
}

export function greyhavenStablePrompt(g, p) {
  const action = actionFor(g, p);
  if (action?.type !== 'dismount') return action?.prompt || '';
  const race = runtime(g).race;
  return {text: race.elapsed < 0 ? `RIDE IN ${Math.ceil(-race.elapsed)}` : `FLAG ${race.next + 1} / ${course.length} · ATTACK TO GALLOP`, interact: false};
}

function finishChore(g, p, chore) {
  const record = saveRecord(p);
  if (dayChores.includes(chore)) {
    record.dayStep++;
    if (record.dayStep === dayChores.length) record.stableUnlocked = true;
  } else {
    record.nightStep++;
    const state = runtime(g, true);
    if (chore.kind === 'pony') state.ponies.set(p, {...ponyStart, faceX: -1, faceY: 1});
    if (record.nightStep === nightChores.length) {
      state.ponies.delete(p);
      record.nightDone = true;
      p.coins = (p.coins || 0) + 10;
    }
  }
  p.interactUsed = true;
  playNotice(g, p, chore.result, record.nightDone || chore.kind === 'hay' ? 'loot' : 'ui');
  g.persist?.();
}

export function interactGreyhavenStable(g, p) {
  const action = actionFor(g, p);
  if (!action) return false;
  if (action.type === 'chore') finishChore(g, p, action.chore);
  if (action.type === 'gate') {
    runtime(g, true).gateOpen = true;
    playNotice(g, p, 'You turn Ector’s key and open the stable gate.', 'door');
  }
  if (action.type === 'locked') playNotice(g, p, 'The stable gate is locked. Ask Sir Ector in the Great Hall for the key.');
  if (action.type === 'dismount') finishRace(g, runtime(g).race, 'You brought the horse back. Kay will run the course again.');
  return true;
}

export function greyhavenStableBlocked(g, x, y, radius = 0, from = null) {
  if (!surface(g)) return false;
  const hit = (left, top, right, bottom) => x + radius > left && x - radius < right && y + radius > top && y - radius < bottom;
  if (hit(17922, 2186, 18006, 2195) || hit(17922, 2195, 17930, 2238) || hit(17998, 2195, 18006, 2238) ||
      hit(17922, 2232, 17945, 2239) || hit(17983, 2232, 18006, 2239)) return true;
  if (runtime(g)?.gateOpen || from && from.y < gate.y + radius && y > from.y) return false;
  return hit(17945, 2233, 17983, 2239);
}

function finishRace(g, race, message) {
  const state = runtime(g);
  if (state?.race !== race) return;
  const p = race.owner;
  state.race = null;
  Object.assign(p, {moving: false, walking: false, moveSpeed: 0, movementGait: 'idle'});
  playNotice(g, p, message, race.won ? 'win' : 'dismount');
  if (race.won) {
    const record = saveRecord(p);
    if (!record.bestRace) p.coins = (p.coins || 0) + firstPrize;
    record.bestRace = Math.min(record.bestRace || Infinity, race.elapsed);
    g.persist?.();
  }
}

function guideTo(actor, point, speed, dt) {
  const gap = distance(actor, point);
  if (gap < .01) return;
  const step = Math.min(gap, speed * dt);
  const vx = (point.x - actor.x) / gap, vy = (point.y - actor.y) / gap;
  Object.assign(actor, {x: actor.x + vx * step, y: actor.y + vy * step, faceX: vx, faceY: vy, moving: step > 0});
}

function raceProgress(actor, next) {
  if (next === course.length) return legStart[next];
  const point = course[next], previous = coursePoints[next], length = courseDistance[next + 1];
  const projection = ((actor.x - previous.x) * (point.x - previous.x) + (actor.y - previous.y) * (point.y - previous.y)) / length;
  return legStart[next] + Math.max(0, Math.min(length, projection));
}

function advanceKay(g, race, dt) {
  const kay = race.kay;
  if (kay.next === course.length) return;
  if (kay.pause > 0) {
    kay.pause -= dt;
    kay.moving = false;
    return;
  }
  const point = course[kay.next];
  const badTurn = shortcuts[kay.next];
  if (!kay.detour && badTurn && !kay.shortcuts.has(kay.next) &&
      raceProgress(race.owner, race.next) > raceProgress(kay, kay.next) + 9) {
    kay.detour = badTurn;
    kay.shortcuts.add(kay.next);
    playNotice(g, race.owner, badTurn.message);
  }
  if (kay.detour) {
    guideTo(kay, kay.detour, 260, dt);
    if (distance(kay, kay.detour) < 1) {
      kay.pause = kay.detour.pause;
      kay.detour = null;
    }
    return;
  }
  guideTo(kay, point, 216, dt);
  if (distance(kay, point) < 1) {
    kay.next++;
    if (kay.next === course.length) {
      kay.moving = false;
      playNotice(g, race.owner, 'Kay has crossed the finish. Bring your horse in through the remaining flags.');
    }
  }
}

function rideAt(g, p, x, y) {
  const d = g.trainTest.design;
  if (x < 17720 || x > 18249 || y < 2274 || y > 2543 || railwaySurface(d, x, y) !== 'grass' ||
      g.blocked?.(x, y, 9, false, false, false, 0, 0, false, p)) return false;
  Object.assign(p, {x, y});
  return true;
}

export function tickGreyhavenStablePlayer(g, p, input, old, dt) {
  const race = runtime(g)?.race;
  if (race?.owner !== p) return false;
  if ((input.interact && !old.interact) || (input.loot && !old.loot)) {
    finishRace(g, race, 'You dismounted. Kay will be by the stable for another lap.');
    return true;
  }
  const before = Math.ceil(-race.elapsed);
  race.elapsed += dt;
  if (race.elapsed < 0) {
    const seconds = Math.ceil(-race.elapsed);
    if (seconds < before) playNotice(g, p, String(seconds));
    return true;
  }
  if (before > 0) playNotice(g, p, 'Ride!');
  const mx = input.x || 0, my = input.y || 0;
  const magnitude = Math.hypot(mx, my), norm = Math.max(1, magnitude);
  if (race.boost > 0) race.boost -= dt;
  if (race.retryBoost > 0) race.retryBoost -= dt;
  if (input.attack && !old.attack && race.retryBoost <= 0) {
    race.boost = 1.18;
    race.retryBoost = 2.4;
  }
  const speed = race.boost > 0 ? 289 : 208;
  const x = p.x, y = p.y;
  if (magnitude > .08) {
    const dx = mx / norm * speed * dt, dy = my / norm * speed * dt;
    if (!rideAt(g, p, x + dx, y + dy)) {
      rideAt(g, p, x + dx, y);
      rideAt(g, p, p.x, y + dy);
    }
    Object.assign(p, {faceX: mx / magnitude, faceY: my / magnitude});
  }
  const travelled = distance(p, {x, y});
  Object.assign(p, {moving: travelled > .03, moveSpeed: dt ? travelled / dt : 0, step: p.step + travelled * .13});
  if (distance(p, course[race.next]) <= 22) {
    race.next++;
    if (race.next === course.length) {
      race.won = race.kay.next !== course.length;
      finishRace(g, race, race.won ? `You beat Kay in ${race.elapsed.toFixed(1)} seconds. “My horse hates shortcuts,” he mutters.` : 'Kay finished first. Ask him at the stable to race again.');
      return true;
    }
  }
  advanceKay(g, race, dt);
  if (race.elapsed >= 24) finishRace(g, race, 'The horses have had enough for this lap. Kay is waiting by the stable.');
  return true;
}

export function tickGreyhavenStables(g, dt) {
  if (!surface(g)) {
    const race = runtime(g)?.race;
    if (race) finishRace(g, race, 'The race ended when the party left the yard.');
    return;
  }
  const state = runtime(g, true);
  const race = state.race;
  if (race && (!g.players.includes(race.owner) || !visitor(race.owner))) finishRace(g, race, 'Kay calls the race off and walks the horses back to the stable.');
  for (const player of state.ponies.keys()) if (!g.players.includes(player)) state.ponies.delete(player);
  for (const p of g.players) {
    if (choreFor(p)?.kind !== 'ring') continue;
    if (!state.ponies.has(p)) state.ponies.set(p, {...ponyStart, faceX: -1, faceY: 1});
    const pony = state.ponies.get(p);
    const gap = distance(p, pony);
    pony.moving = false;
    if (!visitor(p) || gap < 22 || gap > 102) continue;
    const target = {x: p.x + (pony.x - p.x) * 18 / gap, y: p.y + (pony.y - p.y) * 18 / gap};
    if (greyhavenStableBlocked(g, target.x, target.y, 9) || railwaySurface(g.trainTest.design, target.x, target.y) !== 'grass') continue;
    guideTo(pony, target, 96, dt);
  }
}

export function greyhavenStableActorHidden(g, id) {
  return id === KAY && !!runtime(g)?.race;
}

export function drawGreyhavenRider(c, g, p, animator) {
  const race = runtime(g)?.race;
  if (race?.owner !== p) return false;
  drawGreyhavenHorse(c, p, g.time, 'chestnut', p, animator);
  return true;
}

export function greyhavenStableSubjects(g, story, animator, actorFor) {
  const d = g.trainTest?.design;
  if (!d?.wildLands || (story ? castleStory(d.activeRoom) !== story : !surface(g))) return [];
  const state = runtime(g), t = g.time || 0;
  const subject = (point, paint) => ({x: point.x, y: point.y, depth: point.y, paint});
  const jobs = new Set((g.players || []).map(choreFor).filter(chore => chore?.story === story));
  const subjects = [...jobs].filter(chore => ['bucket', 'tracks'].includes(chore.kind)).map(chore => {
    const near = chore.kind !== 'tracks' || g.players.some(p => choreFor(p) === chore && distance(p, chore) < 95);
    return near ? subject(chore, c => drawStableChore(c, chore, t)) : null;
  }).filter(Boolean);
  if (story) return subjects;
  const stable = {x: gate.x, y: 2193};
  subjects.push(subject(stable, c => drawGreyhavenStable(c, !!state?.gateOpen)));
  subjects.push(subject(gate, c => drawGreyhavenStable(c, !!state?.gateOpen, true)));
  for (const chore of [dayChores[1], dayChores[2], nightChores[0], nightChores[5]]) {
    const full = g.players.some(p => recordFor(p).dayStep > (chore.kind === 'trough' ? 1 : 2));
    subjects.push(subject(chore, c => drawStableChore(c, chore, t, jobs.has(chore), full)));
  }
  if (!state?.race) subjects.push(subject(mount, c => drawGreyhavenHorse(c, mount, t, 'chestnut')));
  if (jobs.has(nightChores[4])) subjects.push(subject(ponyStart, c => drawGreyhavenHorse(c, {...ponyStart, faceX: -.5, faceY: 1}, t, 'pony')));
  for (const p of g.players || []) {
    const record = recordFor(p);
    if (record.nightStep > 0 && !record.nightDone && visitor(p) && distance(p, gate) < 195) {
      subjects.push(subject({x: p.x, y: p.y + 1}, c => drawStormLantern(c, p, t)));
    }
    const pony = state?.ponies.get(p);
    if (choreFor(p)?.kind === 'ring' && pony) subjects.push(subject(pony, c => drawGreyhavenHorse(c, pony, t, 'pony')));
  }
  const race = state?.race;
  if (!race) return subjects;
  const kay = race.kay;
  const kayLook = actorFor?.(KAY) || greyhavenCastLook(greyhavenStableProfiles[1], KAY);
  subjects.push(subject(kay, c => drawGreyhavenHorse(c, kay, t, 'grey', kayLook, animator)));
  for (let i = 0; i < course.length; i++) {
    const point = course[i];
    const goal = i === race.next;
    subjects.push(subject(point, c => drawRaceFlag(c, point, i + 1, goal, i < race.next, t, goal && race.elapsed < 0 ? Math.ceil(-race.elapsed) : 0)));
  }
  subjects.push(subject(shortcuts[3], c => drawRaceHurdle(c, shortcuts[3])));
  return subjects;
}
