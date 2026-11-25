import {greyhavenCastLook} from './greyhaven-cast-art.mjs';
import {
  greyhavenMimActive, greyhavenMimPrompt, greyhavenMimSubjects,
  interactGreyhavenMim, startGreyhavenMim, tickGreyhavenMim,
} from './greyhaven-mim.mjs';
import {
  greyhavenOutlawActorHidden, greyhavenOutlawProfiles, greyhavenOutlawPrompt,
  greyhavenOutlawSubjects, greyhavenOutlawStatus, interactGreyhavenOutlaw, startGreyhavenOutlaw, tickGreyhavenOutlaws,
} from './greyhaven-outlaws.mjs';
import {
  greyhavenStableActorHidden, greyhavenStableDialogue, greyhavenStableProfiles, greyhavenStablePrompt,
  greyhavenStableSubjects, interactGreyhavenStable, startGreyhavenStable, tickGreyhavenStables,
} from './greyhaven-stables.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {castleInteriorBlocked, castleStory, toCastleWorld} from './wild-castle.mjs';

const mim = {id: 'greyhaven-mim', name: 'Madam Mim', title: 'Greyhaven’s rival spellwright',
  story: 3, x: 480, y: 288, faceX: 0, faceY: 1};

export const GREYHAVEN_CAST = [mim, ...greyhavenStableProfiles, ...greyhavenOutlawProfiles].map(profile =>
  greyhavenCastLook({kind: 'player', sprite: 'explorer-teal', hp: 1, maxHp: 1, ...profile}, profile.id));

const close = {label: 'I’ll see you around Greyhaven.', action: 'close'};
const conversations = {
  'greyhaven-mim': {
    greeting: 'Merlin thinks a spell gets better if you write it down. I think it gets better if it grows legs. Fancy letting me prove it?',
    lesson: 'When I’m small, light will catch me. When I’m hungry, put something between me and yourself. And when I get too big, watch where I’m about to put my feet.',
    challenge: 'Accept Mim’s shapeshifting challenge',
    question: 'What are the rules?',
  },
  'greyhaven-robin': {
    greeting: 'The treasurer sends the market’s grain money out by rail. Our friends can get it back if I can give them a clear gate and a way into the strongbox.',
    lesson: 'My bow is yours at the practice line. Pin the gate rope and knock the key from its hook. Then use the lookout and signal points to stage the relief-train robbery.',
    challenge: 'Take Robin’s bow and set up the robbery',
    question: 'What does the party need?',
  },
  'greyhaven-little-john': {
    greeting: 'It’s my log when I’m on it, yours if you can put me in the moat. I’ve a spare staff for anyone willing to risk wet boots.',
    lesson: 'Mind your balance. A block turns a shove, but you still need to plant your feet. Anyone who falls can ride the current to the bank.',
    challenge: 'Step onto the log for a staff duel',
    question: 'How does the crossing work?',
  },
  'greyhaven-marian': {
    greeting: 'Three townsfolk need to leave before the steward starts checking names. I’ve kept the music going and found a side route through the banquet crowd.',
    lesson: 'Watch the guard and the dancers. Guide a guest out when the music swells, or duck into the crowd until there’s room. Come back for the next guest.',
    challenge: 'Help Marian get the townsfolk out',
    question: 'When should we move?',
  },
};

const world = npc => npc.story ? toCastleWorld(npc) : npc;
const distance = (p, npc) => Math.hypot(p.x - world(npc).x, p.y - world(npc).y);
const inWilds = g => g.trainTest?.design?.wildLands;

function inStory(g, story) {
  const room = g.trainTest?.design.activeRoom;
  return inWilds(g) && (story ? castleStory(room) === story : !room);
}

function npcHidden(g, npc) {
  if (npc.id === mim.id) return greyhavenMimActive(g);
  return greyhavenStableActorHidden(g, npc.id) || greyhavenOutlawActorHidden(g, npc.id);
}

function canSpeak(g, p, npc, reach) {
  if (!npc || !inStory(g, npc.story) || !(p.hp > 0) || p.room || p.trainRide || p.pirateRide ||
      p.vehicleId || p.broomMount || p.wingHover || p.swimming || p.spectator || p.disconnected || npcHidden(g, npc)) return false;
  const gap = distance(p, npc);
  if (gap > reach) return false;
  if (!npc.story) return true;
  const point = world(npc);
  const count = Math.ceil(gap / 5);
  for (let i = 1; i < count; i++) {
    const fraction = i / count;
    if (castleInteriorBlocked(npc.story, p.x + (point.x - p.x) * fraction, p.y + (point.y - p.y) * fraction, 1)) return false;
  }
  return true;
}

function nearby(g, p) {
  if (p.ui || !inWilds(g)) return null;
  return GREYHAVEN_CAST.filter(npc => canSpeak(g, p, npc, 44))
    .sort((a, b) => distance(p, a) - distance(p, b))[0];
}

export function tickGreyhavenCast(g, dt) {
  if (!inWilds(g)) return;
  tickGreyhavenMim(g, dt);
  tickGreyhavenStables(g, dt);
  tickGreyhavenOutlaws(g, dt);
}

export function greyhavenCastPrompt(g, p) {
  if (!inWilds(g) || p.ui) return '';
  const prompt = greyhavenMimPrompt(g, p) || greyhavenStablePrompt(g, p) || greyhavenOutlawPrompt(g, p);
  if (prompt) return prompt;
  const npc = nearby(g, p);
  return npc ? `TALK TO ${npc.name.toUpperCase()}` : '';
}

export function interactGreyhavenCast(g, p) {
  if (!inWilds(g) || p.ui) return false;
  if (interactGreyhavenMim(g, p) || interactGreyhavenStable(g, p) || interactGreyhavenOutlaw(g, p)) return true;
  const npc = nearby(g, p);
  if (!npc) return false;
  p.ui = {shop: 'npc-dialogue', greyhavenCast: npc.id, npcId: npc.id, ownerDevice: p.device, node: 'greeting', index: 0};
  Object.assign(p, {consumeInput: true, interactUsed: true, moving: false, charge: 0});
  g.onSound?.('ui', p);
  return true;
}

export function greyhavenCastDialogue(g, p) {
  const npc = GREYHAVEN_CAST.find(n => n.id === p.ui?.greyhavenCast);
  if (!canSpeak(g, p, npc, 76)) return {choices: [close]};
  const stable = greyhavenStableDialogue(g, p, npc.id);
  if (stable) return {...stable, npc, choices: [...stable.choices, close]};
  const entry = conversations[npc.id];
  const lesson = p.ui.node === 'lesson';
  const status = npc.id === mim.id && p.npcQuests?.greyhavenMim === true
    ? 'You saw every trick I had ready. I’ve been thinking of another. Care for a rematch?'
    : greyhavenOutlawStatus(g, p, npc.id);
  const choices = [{label: entry.challenge, action: 'start'}];
  if (!lesson) choices.push({label: entry.question, action: 'lesson'});
  return {npc, text: lesson ? entry.lesson : status || entry.greeting, choices: [...choices, close]};
}

export function greyhavenCastDialogueAction(g, p, action) {
  const {npc, choices} = greyhavenCastDialogue(g, p);
  const ui = p.ui;
  if (action === 'use') action = choices[ui.index]?.action;
  if (action?.startsWith('choice:')) action = choices[Number(action.slice(7))]?.action;
  if (!npc || ui.ownerDevice !== p.device || action === 'close') {
    Object.assign(p, {ui: null, consumeInput: true});
  } else if (['next', 'down', 'prev', 'up'].includes(action)) {
    const step = action === 'next' || action === 'down' ? 1 : -1;
    ui.index = (ui.index + step + choices.length) % choices.length;
  } else if (choices.some(choice => !choice.disabled && choice.action === action)) {
    if (action === 'start') {
      if (npc.id === mim.id) startGreyhavenMim(g, p);
      else if (greyhavenStableProfiles.some(profile => profile.id === npc.id)) startGreyhavenStable(g, p, npc.id);
      else startGreyhavenOutlaw(g, p, npc.id);
    } else if (action === 'lesson') {
      ui.node = 'lesson';
      ui.index = 0;
      delete ui.notice;
    }
  }
  return true;
}

export function greyhavenCastSubjects(g, story, animator, visible = () => true) {
  if (!inStory(g, story)) return [];
  const inhabitants = GREYHAVEN_CAST.filter(npc => npc.story === story && !npcHidden(g, npc) && visible(npc, 85));
  const subjects = inhabitants.map(npc => ({x: npc.x, y: npc.y, depth: npc.y, paint(c) {
    const speaker = g.players.find(p => p.ui?.greyhavenCast === npc.id && canSpeak(g, p, npc, 76));
    const at = world(npc);
    const pose = speaker ? {...npc, faceX: speaker.x - at.x, faceY: speaker.y - at.y} : npc;
    c.fillStyle = '#211a2150';
    c.fillRect(Math.round(npc.x - 9), Math.round(npc.y - 1), 18, 4);
    animator.draw(c, pose, g.time, PLAYER_RENDER_SIZE * npc.greyhavenScale);
  }}));
  if (story === 3) subjects.push(...greyhavenMimSubjects(g, story));
  subjects.push(...greyhavenStableSubjects(g, story, animator), ...greyhavenOutlawSubjects(g, story, animator));
  return subjects.filter(subject => subject.x === undefined || subject.y === undefined || visible(subject, subject.radius ?? 180));
}
