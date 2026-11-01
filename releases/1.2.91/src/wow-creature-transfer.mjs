import {wowCreatureMotion} from './wow-creature-motion-data.mjs';

// The imported data are joint offsets only; the editable Wildbound body,
// palette, silhouette and all eight facings remain native pixel art.
export function applyWowCreatureMotion(model, kind) {
  const donor=wowCreatureMotion[kind];
  if(!donor)return model;
  for(const [name,clip] of Object.entries(donor.clips))model.clips[name]=structuredClone(clip);
  model.motionSource={kind:'wowhead-bone-transfer',displayId:donor.displayId};
  return model;
}

// Upgrades a stored rig while retaining any per-part art, paint or clip edits.
export function upgradeWowCreatureMotion(saved, previous, fresh) {
  if(saved?.motionSource?.displayId===fresh.motionSource?.displayId)return structuredClone(saved);
  const result=structuredClone(fresh);
  for(const field of ['palette','shape','joints','visibility','clips','boneSprites']) {
    if(!saved[field])continue;
    result[field]??={};
    for(const [name,value] of Object.entries(saved[field]))
      if(JSON.stringify(value)!==JSON.stringify(previous[field]?.[name]))result[field][name]=structuredClone(value);
  }
  if(saved.name!==previous.name)result.name=saved.name;
  for(const [name,value] of Object.entries(saved))
    if(!(name in result))result[name]=structuredClone(value);
  return result;
}
