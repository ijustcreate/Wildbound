import { definitionPack, applyDefinitions } from './definitions.mjs';
import { registerCryptGearArt } from './crypt-gear.mjs';
import {completeHumanoidActions} from './native-humanoid-base.mjs';
import {widenHumanoidStance} from './humanoid-chat-update.mjs';
import {playerMotion,replacePlayerMotion,upgradePlayerToNative,defaultNativePlayerMotion} from './player-motion.mjs';
import {oathlessCaptainMotion} from './oathless-captain-motion.mjs';
import {villagerMotion} from './villager-motion.mjs';

const RIG_KEYS = ['player', 'warlock', 'grim_reaper', 'safari_hunter', 'alan', 'banshee', 'succubus', 'imp', 'zombie', 'ghost', 'alligator', 'skeletonMotions', 'lion', 'tiger', 'wolf', 'murk_wolf', 'dreadmane_lion', 'slime', 'shore_goblin', 'oathless_captain', 'villager', 'bat', 'rhino', 'creatureMotions', 'beastMotions', 'nightMotions','graveyard_cat','marsh_firefly'];
export function rigPack(events, items) {
  const definitions = definitionPack(events, items);
  return structuredClone(Object.fromEntries([['version', 1], ...RIG_KEYS.map(key => [key, definitions[key]])]));
}

export async function saveProjectRigs(events, items) {
  if (!globalThis.window?.desktop?.saveProjectRigs) return 'Saved on this computer. Use the desktop app to save to the project.';
  return window.desktop.saveProjectRigs(rigPack(events, items));
}

export async function loadProjectRigs(events, items) {
  const desktop = globalThis.window?.desktop;
  let data;
  if (desktop?.loadProjectRigs) data = await desktop.loadProjectRigs();
  else {
    const response = await fetch('/Wildbound/releases/1.2.78/authored/rigs.json');
    if (response.ok) data = await response.json();
    else if (response.status !== 404) throw Error('Could not load shared rigs.');
  }
  if (data) {
    // Shared project data wins over this computer's old local sprite overrides.
    for (const [key, current] of Object.entries(definitionPack(events, items))) {
      if (!RIG_KEYS.includes(key) || !data[key]) continue;
      const pairs = key.endsWith('Motions') ? Object.entries(current).map(([kind, model]) => [model, data[key][kind]]) : [[current, data[key]]];
      for (const [model, saved] of pairs) if (saved) {
        for (const field of ['boneSprites', 'renderOrder', 'jointAngles', 'wearables']) {
          if (!Object.hasOwn(saved, field)) delete model[field];
        }
      }
    }
    applyDefinitions(data, events, items, { spriteOverrides: false });
  } else if (desktop?.saveProjectRigs && localStorage.getItem('wildbound-design')) {
    await saveProjectRigs(events, items);
  }
  // Older authored rigs predate this gear. Fill only absent views; never replace
  // fitted art the player authored for the new shield.
  registerCryptGearArt();
  replacePlayerMotion(data?.player?upgradePlayerToNative(playerMotion):defaultNativePlayerMotion());
  completeHumanoidActions(oathlessCaptainMotion,playerMotion);
  completeHumanoidActions(villagerMotion,playerMotion);
  for(const [key,model] of Object.entries(definitionPack(events,items)))if(RIG_KEYS.includes(key)&&model?.joints?.handL)widenHumanoidStance(model);
}
