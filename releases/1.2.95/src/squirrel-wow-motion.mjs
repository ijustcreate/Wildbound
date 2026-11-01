import { SQUIRREL_WOW_MOTION } from './squirrel-wow-motion-data.mjs';

const targetClips = Object.freeze({
  idle: 'freeze',
  freeze: 'freeze',
  walk: 'walk',
  run: 'scamper',
  scamper: 'scamper',
});

export const squirrelWowMotionProvenance = SQUIRREL_WOW_MOTION.provenance;

export function squirrelWowClip(action) {
  const sourceClip = targetClips[action];
  if (!sourceClip) return null;
  return structuredClone(SQUIRREL_WOW_MOTION.clips[sourceClip]);
}
