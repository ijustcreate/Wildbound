import { DEFAULT_APPEARANCE, HAIR_STYLES, FACE_STYLES } from './appearance.mjs';

export const NPC_QUEST_EQUIPMENT = Object.freeze({
  head: 'keeper_crown', chest: 'keeper_robes', pants: 'keeper_sash',
  hand1: 'keeper_staff', hand2: 'keeper_blade', neck: 'keeper_band',
});
const branch = (id, label, description, objective, completion) =>
  ({ id, label, title: label, description, objective, completion });
const stage = (id, title, reward, branches) => ({ id, title, reward, branches });

// This module deliberately has no dependency on definitions, items or runtime.
export const npcQuestConfig = {
  id: 'rowan', name: 'The Keeper', title: 'Collector · Crafter · Guide',
  appearance: { ...DEFAULT_APPEARANCE, skin: '#b4aaa0', shirt: '#625b60', pants: '#514b50', shoes: '#393438', hair: 'long', hairColor: '#181619', eyeColor: '#d6a14b' },
  equipment: { ...NPC_QUEST_EQUIPMENT },
  backstory: 'No one knows where The Keeper came from. A quiet wanderer with amber eyes, The Keeper gathers lost things: broken tools, forgotten keepsakes, and stories left beside the road. Patient hands mend what can be repaired; gentle guidance helps lost travelers find their way. The Keeper asks little, but remembers every kindness.',
  greeting: 'Something lost brought you here. Perhaps we can mend it together.',
  dialogue: { start: 'greeting', nodes: {
    greeting: { text: 'Come closer, traveler. I am called The Keeper. Have you lost something, or found something worth saving?', choices: [
      { label: 'Tell me your story.', next: 'story' }, { label: 'How can I help?', next: 'quests' },
    ] },
    story: { text: 'Where I began matters less than what we leave behind. I collect what others overlook and mend what still has use. Sometimes the lost thing is a traveler. Those I guide home.', choices: [
      { label: 'Let me help you mend what is lost.', next: 'quests' }, { label: 'Let us start again.', next: 'greeting' },
    ] },
    quests: { text: 'Choose one task at each step. Gathering, mending, and guiding all have their place. Either path earns the same keepsake. Return when your work is done.', choices: [
      { label: 'Tell me about yourself.', next: 'story' }, { label: 'Safe travels.', next: 'farewell' },
    ] },
    farewell: { text: 'Keep what matters. Mend what you can. Leave a light for those still finding their way.', choices: [] },
  } },
  stages: [
    stage('trail-signs', 'A crown of remnants', 'keeper_crown', [
      branch('sticks', 'Gather the overlooked', 'Collect three sticks to repair forgotten trail markers.', { type: 'collect', item: 'stick', count: 3 }, 'What others overlook can still guide someone home. Keep this crown of remnants.'),
      branch('stones', 'Remember the way', 'Collect three stones to rebuild a scattered cairn.', { type: 'collect', item: 'stone', count: 3 }, 'A forgotten path has a sign again. This crown remembers your kindness.'),
    ]),
    stage('steady-hands', 'The mender’s robes', 'keeper_robes', [
      branch('sticks', 'Make a mending frame', 'Collect five sticks for a frame to mend worn travelers cloth.', { type: 'collect', item: 'stick', count: 5 }, 'Patient work gives worn things another journey. These robes are yours.'),
      branch('bats', 'Quiet the dusk path', 'Defeat two bats so travelers can reach the mending camp.', { type: 'defeat', kind: 'bat', count: 2 }, 'You made room for quiet work. Take these robes with my thanks.'),
    ]),
    stage('sure-footing', 'Threads of the road', 'keeper_sash', [
      branch('stones', 'Mend the crossing', 'Collect five stones to repair a broken travelers crossing.', { type: 'collect', item: 'stone', count: 5 }, 'Small repairs hold a journey together. Wear this sash as a reminder.'),
      branch('visit', 'Survey the marked route', 'Survey the marked route away from The Keeper, then return with your trail notes.', { type: 'visit', count: 1 }, 'Your notes weave a safer road for the next traveler. This sash is yours.'),
    ]),
    stage('old-roads', 'A guide’s staff', 'keeper_staff', [
      branch('skeletons', 'Guide through the old road', 'Defeat three skeletons blocking the old travelers road.', { type: 'defeat', kind: 'skeleton', count: 3 }, 'A guide makes room for others to pass. Carry this staff on the next road.'),
      branch('spiders', 'Untangle the trail', 'Defeat three spiders threatening travelers on the trail.', { type: 'defeat', kind: 'spider', count: 3 }, 'The way is open again. May this staff steady your steps.'),
    ]),
    stage('shelter', 'The salvaged blade', 'keeper_blade', [
      branch('sticks', 'Repair the workbench', 'Collect eight sticks to rebuild The Keeper’s salvaging workbench.', { type: 'collect', item: 'stick', count: 8 }, 'A broken workbench serves again. Take this blade and put it to good use.'),
      branch('stones', 'Restore the workshop hearth', 'Collect eight stones to repair the workshop hearth.', { type: 'collect', item: 'stone', count: 8 }, 'Warmth and patient hands restore what was lost. This blade is yours.'),
    ]),
    stage('guardian', 'A circle of remembrance', 'keeper_band', [
      branch('skeletons', 'Keep the way home open', 'Defeat five skeletons threatening the route home.', { type: 'defeat', kind: 'skeleton', count: 5 }, 'You gather, mend, and guide with care. Keep this band, and remember those still lost.'),
      branch('spiders', 'Protect the quiet paths', 'Defeat five spiders threatening the quiet travelers paths.', { type: 'defeat', kind: 'spider', count: 5 }, 'No path is too small to protect. This band remembers the care you have given.'),
    ]),
  ],
};

export const NPC_QUEST_EVENT = {
  name: 'The Keeper', type: 'friendly_npc', kind: 'wayfarer_npc',
  count: 0, weight: 6, npcId: 'rowan',
  verse: 'Lost things rest in patient hands.\nA quiet guide walks forgotten lands.',
  tip: 'Speak with The Keeper. Choose a task, help mend the road, and return for a keepsake.',
};

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 10000;
const id = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,60}$/.test(value)
  && !['__proto__', 'constructor', 'prototype'].includes(value);
const color = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
const unique = values => new Set(values).size === values.length;
function jsonSafe(value, seen = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if ((!record(value) && !Array.isArray(value)) || seen.has(value)) return false;
  seen.add(value);
  const valid = Object.entries(value).every(([key, entry]) =>
    !['__proto__', 'constructor', 'prototype'].includes(key) && jsonSafe(entry, seen));
  seen.delete(value);
  return valid;
}

export function validateNpcQuestConfig(config) {
  try {
    if (!record(config) || !jsonSafe(config) || config.id !== 'rowan'
      || !['name', 'title', 'backstory', 'greeting'].every(key => text(config[key]))) return false;
    const a = config.appearance;
    if (!record(a) || !['skin', 'shirt', 'pants', 'shoes', 'hairColor'].every(key => color(a[key]))
      || !Object.hasOwn(HAIR_STYLES, a.hair) || (a.face !== undefined && !Object.hasOwn(FACE_STYLES, a.face))
      || (a.eyeColor !== undefined && !color(a.eyeColor))) return false;
    if (!record(config.equipment) || !Object.keys(NPC_QUEST_EQUIPMENT).every(slot =>
      id(config.equipment[slot]) || config.equipment[slot] === null || config.equipment[slot] === '')
      || Object.keys(config.equipment).some(slot => !Object.hasOwn(NPC_QUEST_EQUIPMENT, slot))) return false;
    const graph = config.dialogue;
    if (!record(graph) || !record(graph.nodes) || !id(graph.start) || !Object.hasOwn(graph.nodes, graph.start)
      || !Object.entries(graph.nodes).every(([key, node]) => id(key) && record(node) && text(node.text)
        && Array.isArray(node.choices) && node.choices.every(choice => record(choice) && text(choice.label)
          && id(choice.next) && Object.hasOwn(graph.nodes, choice.next)))) return false;
    if (!Array.isArray(config.stages) || config.stages.length !== 6
      || !unique(config.stages.map(s => s.id)) || !unique(config.stages.map(s => s.reward))) return false;
    return config.stages.every(s => record(s) && id(s.id) && text(s.title) && id(s.reward)
      && Array.isArray(s.branches) && s.branches.length >= 2 && unique(s.branches.map(b => b.id))
      && s.branches.every(b => {
        if (!record(b) || !id(b.id) || !['label', 'title', 'description', 'completion'].every(key => text(b[key]))) return false;
        const o = b.objective;
        if (!record(o) || !Number.isInteger(o.count) || o.count < 1 || o.count > 8) return false;
        if (o.type === 'collect') return ['stick', 'stone'].includes(o.item) && o.kind === undefined;
        if (o.type === 'defeat') return ['skeleton', 'bat', 'spider'].includes(o.kind) && o.item === undefined;
        return o.type === 'visit' && o.count === 1 && o.item === undefined && o.kind === undefined;
      }));
  } catch { return false; }
}

export function getNpcQuestConfig() { return npcQuestConfig; }
let npcQuestRevision=0;
export function getNpcQuestRevision(){return npcQuestRevision;}

// Preserve the exported object's identity and never partially accept invalid data.
export function replaceNpcQuestConfig(config) {
  if (!validateNpcQuestConfig(config)) throw new Error('Invalid NPC quest configuration');
  const next = structuredClone(config);
  for (const key of Object.keys(npcQuestConfig)) delete npcQuestConfig[key];
  Object.assign(npcQuestConfig, next);
  npcQuestRevision++;
  return npcQuestConfig;
}
