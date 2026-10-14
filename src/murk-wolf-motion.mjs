import {defaultWolfMotion, drawWolf} from './wolf-motion.mjs';
import {validateMotion} from './player-motion.mjs';

// The motion-transfer subject has its own mutable rig, never the live wolf rig.
export function defaultMurkWolfMotion() {
  const model = defaultWolfMotion();
  model.name = 'Murk Wolf';
  model.palette = {...model.palette, body:'#536462', shade:'#293b3c', head:'#7d9290', eyes:'#9de5b0'};
  model.joints.jawTip = {parent:'head', position:[0,24,12]};
  return model;
}
export const murkWolfMotion = defaultMurkWolfMotion();
export const validateMurkWolfMotion = model => validateMotion(model, defaultMurkWolfMotion());
export function replaceMurkWolfMotion(model) {
  if (!validateMurkWolfMotion(model)) throw Error('Invalid Murk Wolf rig');
  for (const key of Object.keys(murkWolfMotion)) delete murkWolfMotion[key];
  Object.assign(murkWolfMotion, structuredClone(model));
}
export function drawMurkWolf(c, actor, time, model = murkWolfMotion, pose = null) {
  return drawWolf(c, actor, time, model, pose);
}
