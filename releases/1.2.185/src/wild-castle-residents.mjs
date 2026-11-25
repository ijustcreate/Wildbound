import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {give, ITEMS} from './items.mjs';
import {DAY_LENGTH} from './night-cycle.mjs';
import {castleInteriorPlan} from './wild-castle-interior.mjs';
import {castleInteriorBlocked, castleStory, CASTLE_INTERIOR_ORIGIN} from './wild-castle.mjs';
import {walkCastleResident} from './wild-castle-resident-route.mjs';

const cast = [
  {
    id: 'greyhaven-merlin', name: 'Merlin', title: 'Astronomer of Greyhaven', speed: 56,
    appearance: {...DEFAULT_APPEARANCE, skin: '#d6a77d', hair: 'long', hairColor: '#b6b9b7',
      facialHair: 'wizardbeard', facialHairColor: '#d6d8cf', eyeColor: '#7296b0', shirt: '#41628a',
      pants: '#3f4b65', shoes: '#313b4b'},
    equipment: {head: 'greyhaven_starwatch_hat', chest: 'greyhaven_merlin_robe', hand1: 'greyhaven_rowan_wand'},
    routine: [
      {story: 1, x: 236, y: 236, faceX: 0, faceY: 1, place: 'Kitchen', activity: 'cast',
        greeting: 'Good morning. I asked the kettle to whistle softly. It’s learning.',
        question: 'How do you warm the kettle?', answer: 'Start at the bottom. A little heat will rise through the water on its own.', demo: 'Watch Merlin light a spark'},
      {story: 2, x: 293, y: 222, faceX: -1, faceY: 0, place: 'Gallery library', activity: 'book',
        greeting: 'I came up to put one book away. Somehow I’ve taken three more down.',
        question: 'Can you make a book float?', answer: 'Only for a moment. It will settle back into your hands if you leave it room.', demo: 'Watch the book float'},
      {story: 3, x: 748, y: 346, faceX: 0, faceY: 1, place: 'High Solar study', activity: 'book',
        greeting: 'The moat was a little higher this morning. I’m marking the difference on the tide chart.',
        question: 'What’s that rowan wand for?', answer: 'It keeps the tide chart in the air while I check the figures. Take my spare for the path down to Tideglass.',
        demo: 'Watch the chart hover', item: 'greyhaven_rowan_wand'},
      {story: 1, x: 498, y: 606, faceX: 0, faceY: 1, place: 'Gate landing', activity: 'interact',
        greeting: 'That scrape you heard at the gate is a link turning in its socket. I check it just before supper.',
        question: 'How do I work the drawbridge?', answer: 'Use the lever on your right at the south door. Wait until the deck rests on the stone before crossing.'},
      {story: 3, x: 235, y: 349, faceX: 0, faceY: 1, place: 'Orb chamber', activity: 'cast',
        greeting: 'The orb catches the light off the moat after dark. Come closer and you’ll see it turn blue.',
        question: 'May I see a night-watch spell?', answer: 'Watch the blue light gather. Take my spare hat if you’re planning to stay out this late.',
        demo: 'Watch the star spell', item: 'greyhaven_starwatch_hat'},
    ],
  },
  {
    id: 'greyhaven-wart', name: 'Wart', title: 'Page of Greyhaven', speed: 74,
    appearance: {...DEFAULT_APPEARANCE, skin: '#e5b582', hair: 'shag', hairColor: '#c6a063',
      eyeColor: '#797d58', shirt: '#96573e', pants: '#846048', shoes: '#50382c'},
    equipment: {chest: 'greyhaven_wart_tunic', hand1: 'greyhaven_practice_sword'},
    routine: [
      {story: 2, x: 260, y: 434, faceX: -1, faceY: 0, place: 'Gallery bedchamber', activity: 'interact',
        greeting: 'I’ve made my bed. The other one is still a mess, and I’m fairly sure it belongs to Archimedes.',
        question: 'What do you do first thing?', answer: 'I fetch water at dawn, then try to get a little sword practice in before the hall fills up.'},
      {story: 1, x: 543, y: 350, faceX: 0.8, faceY: 1, place: 'Great Hall practice floor', activity: 'slash',
        greeting: 'Can you tell if I’m dragging my back foot? I can hear it on the stone.',
        question: 'Show me your footwork.', answer: 'Short step. Turn at the hip. Then settle before you try again. Here, there’s a spare practice sword.',
        demo: 'Watch Wart practice', item: 'greyhaven_practice_sword'},
      {story: 3, x: 696, y: 347, faceX: 1, faceY: 0, place: 'High Solar study', activity: 'write',
        greeting: 'Merlin has me copying the tide chart. So far I’ve had to draw the moat three times.',
        question: 'How is the lesson going?', answer: 'Better since I put the north arrow at the top. Would you like the page’s spare tunic?',
        item: 'greyhaven_wart_tunic'},
      {story: 1, x: 657, y: 457, faceX: 1, faceY: 0, place: 'Banquet room', activity: 'interact',
        greeting: 'We need six plates. I counted seven and found one had a loaf sitting on it.',
        question: 'Where should I sit?', answer: 'By the south end of the long table. From there you can see the hall and keep your elbows off the dishes.'},
      {story: 2, x: 344, y: 401, faceX: 1, faceY: 0, place: 'West gallery rail', activity: 'interact',
        greeting: 'I’m counting the torch brackets from here. They look like a row of stars when the hall is dark.',
        question: 'Where does Merlin go after supper?', answer: 'Up to the orb chamber. Take a tower stair to the High Solar and look on the west side. The owl usually gets there first.'},
    ],
  },
];

const runtimes = new WeakMap();
const close = {label: 'See you around the castle.', action: 'close'};
const owlQuestion = {label: 'Tell me about Archimedes.', action: 'owl'};
const owlNoticeRange = 96;
const local = p => ({x: p.x - CASTLE_INTERIOR_ORIGIN.x, y: p.y - CASTLE_INTERIOR_ORIGIN.y});
const blocked = (story, x, y, radius) => castleInteriorBlocked(story,
  x + CASTLE_INTERIOR_ORIGIN.x, y + CASTLE_INTERIOR_ORIGIN.y, radius);
const inFurniture = (item, x, y, pad = 0) => x >= item.x - pad && x <= item.x + item.w + pad &&
  y >= item.y - pad && y <= item.y + item.h + pad;
const castleVisitor = p => p.hp > 0 && !p.room && !p.trainRide && !p.pirateRide && !p.vehicleId && !p.swimming;

function routineIndex(g) {
  const time = ((g.sky?.elapsed || 0) % DAY_LENGTH + DAY_LENGTH) % DAY_LENGTH;
  if (time >= 450) return 0;
  if (time < 110) return 1;
  if (time < 240) return 2;
  return time < 300 ? 3 : 4;
}

function getCast(g) {
  const runtime = g.trainTest;
  if (!runtime?.design.wildLands || !castleStory(runtime.design.activeRoom)) return null;
  if (!runtimes.has(runtime)) {
    const index = routineIndex(g);
    const residents = cast.map(profile => {
      const {x, y, story, faceX, faceY} = profile.routine[index];
      return {...profile, x, y, story, faceX, faceY, index, hp: 1, maxHp: 1,
        kind: 'player', sprite: 'explorer-teal', radius: 7};
    });
    const merlin = residents[0];
    const owl = {id: 'greyhaven-archimedes', name: 'Archimedes', owlVariant: 'archimedes',
      visualSeed: 41, hp: 1, x: merlin.x + 21, y: merlin.y + 7, story: merlin.story,
      faceX: 0, faceY: 1, owlPhase: 'perch', owlHeight: 0};
    runtimes.set(runtime, {residents, owl});
  }
  return runtimes.get(runtime);
}

function clearSight(story, x, y, dx, dy, distance, perch) {
  const samples = Math.ceil(distance / 5);
  for (let i = 1; i < samples; i++) {
    const sx = x + dx * i / samples, sy = y + dy * i / samples;
    if (perch && inFurniture(perch, sx, sy, 1)) continue;
    if (blocked(story, sx, sy, 1)) return false;
  }
  return true;
}

function canTalk(g, p, actor, reach) {
  if (!actor || !castleVisitor(p) || actor.story !== castleStory(g.trainTest.design.activeRoom)) return false;
  const {x, y} = local(p);
  const dx = actor.x - x, dy = actor.y - y, distance = Math.hypot(dx, dy);
  return distance <= reach && clearSight(actor.story, x, y, dx, dy, distance);
}

function nearby(g, p) {
  if (p.ui) return null;
  const residents = getCast(g)?.residents || [];
  const {x, y} = local(p);
  return residents.filter(actor => canTalk(g, p, actor, 46))
    .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
}

function tickActivity(actor, place, time, talking = false) {
  const cycle = (time + (actor.id === cast[0].id ? 1 : 3)) % 8;
  const beat = actor.demoAt === undefined ? cycle : time - actor.demoAt;
  const clip = place.activity === 'book' || place.activity === 'write' ? 'interact' : place.activity;
  const active = !actor.moving && (actor.demoAt !== undefined || (!talking && beat < 1.1));
  actor.animationAction = active ? clip : undefined;
  actor.animationProgress = actor.animationAction ? Math.min(1, Math.max(0, beat / 0.85)) : undefined;
  actor.castSpark = actor.animationAction && clip === 'cast' && beat >= 0.25 && beat < 1.6 ? beat : 0;
  actor.floatingBook = !actor.moving && place.activity === 'book' && (!talking || actor.demoAt !== undefined) &&
    beat < 1.8 && beat > 0.1 ? beat : 0;
  if (actor.demoAt !== undefined && beat > 2.1) delete actor.demoAt;
}

function faceOwlAtVisitor(g, owl) {
  if (owl.story !== castleStory(g.trainTest.design.activeRoom)) return;
  // A table that supports the owl doesn't obscure its view from the tabletop.
  const perch = castleInteriorPlan(owl.story).furniture.find(item =>
    item.blocking !== false && inFurniture(item, owl.x, owl.y));
  let nearest = owlNoticeRange;
  for (const player of g.players) {
    if (!castleVisitor(player)) continue;
    const {x, y} = local(player);
    const dx = x - owl.x, dy = y - owl.y, distance = Math.hypot(dx, dy);
    if (distance <= .05 || distance >= nearest || !clearSight(owl.story, owl.x, owl.y, dx, dy, distance, perch)) continue;
    nearest = distance;
    owl.faceX = dx / distance;
    owl.faceY = dy / distance;
  }
}

function tickOwl(g, owl, merlin, dt) {
  const x = merlin.x - merlin.faceX * 10 + 21;
  const y = merlin.y - merlin.faceY * 12 + 5;
  if (owl.story !== merlin.story) Object.assign(owl, {story: merlin.story, x, y, owlHeight: 14});
  const dx = x - owl.x, dy = y - owl.y, distance = Math.hypot(dx, dy);
  const flying = distance > 5 || merlin.moving;
  if (distance > 0.05) {
    const step = Math.min(distance, dt * 125);
    owl.x += dx * step / distance;
    owl.y += dy * step / distance;
    if (distance > 2) Object.assign(owl, {faceX: dx / distance, faceY: dy / distance});
  }
  const height = flying ? 22 : blocked(owl.story, owl.x, owl.y, 2) ? 10 : 0;
  owl.owlHeight += (height - owl.owlHeight) * Math.min(1, dt * 5);
  owl.owlPhase = flying ? 'fly' : owl.owlHeight > height + 3 ? 'landing' : 'perch';
  owl.owlPhaseTime = flying ? (owl.owlPhaseTime || 0) + dt : 0;
  if (owl.owlPhase === 'perch') faceOwlAtVisitor(g, owl);
}

export function tickCastleResidents(g, dt) {
  const group = getCast(g);
  if (!group) return;
  const index = routineIndex(g);
  for (const actor of group.residents) {
    const talker = g.players.find(p => p.ui?.castleResident === actor.id && canTalk(g, p, actor, 80));
    if (talker) {
      const {x, y} = local(talker);
      const gap = Math.hypot(x - actor.x, y - actor.y) || 1;
      Object.assign(actor, {moving: false, faceX: (x - actor.x) / gap, faceY: (y - actor.y) / gap});
      tickActivity(actor, actor.routine[actor.index], g.time, true);
      continue;
    }
    const place = actor.routine[index];
    if (walkCastleResident(actor, place, dt, blocked)) {
      Object.assign(actor, {index, faceX: place.faceX, faceY: place.faceY});
      tickActivity(actor, place, g.time);
    } else {
      actor.animationAction = actor.animationProgress = undefined;
      actor.castSpark = actor.floatingBook = 0;
    }
  }
  tickOwl(g, group.owl, group.residents[0], dt);
}

export function castleResidents(g, story) {
  const group = getCast(g);
  if (!group) return [];
  return [...group.residents, group.owl].filter(actor => actor.story === story);
}

export function castleResidentPrompt(g, p) {
  const actor = nearby(g, p);
  return actor ? 'TALK TO ' + actor.name.toUpperCase() : '';
}

export function interactCastleResident(g, p) {
  const actor = nearby(g, p);
  if (!actor) return false;
  const place = actor.routine[actor.index];
  p.ui = {shop: 'npc-dialogue', castleResident: actor.id, ownerDevice: p.device,
    index: 0, node: 'greeting', routine: place.story === actor.story && !actor.moving ? actor.index : null};
  Object.assign(p, {consumeInput: true, interactUsed: true, moving: false, charge: 0});
  g.onSound?.('ui', p);
  return true;
}

export function castleResidentDialogue(g, p) {
  const ui = p.ui;
  const actor = getCast(g)?.residents.find(npc => npc.id === ui.castleResident);
  if (ui.ownerDevice !== p.device || !canTalk(g, p, actor, 80)) {
    return {text: 'The passage is empty now.', choices: [close]};
  }
  const place = actor.routine[ui.routine];
  const title = place?.place || actor.title;
  if (ui.node === 'owl') return {npc: actor, title,
    text: 'Archimedes has his own ideas about where we’re going. He flies after me on the stairs and settles down when I stop.', choices: [close]};
  if (ui.node === 'lesson' && place) {
    const choices = [];
    if (place.demo) choices.push({label: place.demo, action: 'watch'});
    if (place.item && !p.npcQuests?.greyhavenGifts?.[place.item]) {
      choices.push({label: 'Accept ' + ITEMS[place.item].name, action: 'gift'});
    }
    return {npc: actor, title, text: place.answer, choices: [...choices, close]};
  }
  const text = place?.greeting || (actor.id === cast[0].id
    ? 'I’m on my way to the next room. You can walk with me a little.'
    : 'Oh, hello! I’d better get where I’m going before someone sends for me.');
  const choices = place ? [{label: place.question, action: 'lesson'}] : [];
  if (actor.id === cast[0].id) choices.push(owlQuestion);
  return {npc: actor, title, text, choices: [...choices, close]};
}

export function castleResidentDialogueAction(g, p, action) {
  const ui = p.ui;
  const {npc, choices} = castleResidentDialogue(g, p);
  if (action === 'use') action = choices[ui.index]?.action;
  if (action?.startsWith('choice:')) action = choices[Number(action.slice(7))]?.action;
  if (!npc || action === 'close') {
    Object.assign(p, {ui: null, consumeInput: true});
    return true;
  }
  if (['next', 'down', 'prev', 'up'].includes(action)) {
    const step = action === 'next' || action === 'down' ? 1 : -1;
    ui.index = (ui.index + choices.length + step) % choices.length;
  } else if (choices.some(choice => choice.action === action)) {
    if (action === 'watch') {
      npc.demoAt = g.time;
      p.ui = null;
    } else if (action === 'gift') {
      const item = npc.routine[ui.routine].item;
      if (give(p.inventory, item)) {
        const state = (p.npcQuests ??= {}).greyhavenGifts ??= {};
        state[item] = true;
        ui.notice = ITEMS[item].name + ' added to your backpack.';
        ui.index = 0;
        g.onSound?.('loot', p);
        g.persist?.();
      } else ui.notice = 'Make room in your backpack and I’ll hold onto it for you.';
    } else {
      ui.node = action;
      ui.index = 0;
      delete ui.notice;
    }
  }
  return true;
}
