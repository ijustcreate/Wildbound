import { SHEEP_WOW_MOTION } from './sheep-wow-motion-data.mjs';

// Return independent clip objects so editor edits cannot mutate the shared
// generated donor record or leak between sheep instances.
export function sheepWowClip(action) {
  const clip = SHEEP_WOW_MOTION.clips[action];
  return clip ? structuredClone(clip) : null;
}

export const sheepWowMotionProvenance = SHEEP_WOW_MOTION.provenance;
