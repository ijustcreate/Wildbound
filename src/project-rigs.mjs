import { definitionPack, applyDefinitions } from './definitions.mjs';

const RIG_KEYS = ['player', 'alligator', 'skeletonMotions', 'lion', 'tiger', 'wolf', 'bat', 'rhino', 'creatureMotions', 'beastMotions'];
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
    const response = await fetch('./authored/rigs.json');
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
}
