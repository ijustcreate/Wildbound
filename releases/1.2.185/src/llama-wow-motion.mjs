import { LLAMA_WOW_MOTION } from './llama-wow-motion-data.mjs';

// Return fresh clips so Rig Studio edits and actors cannot mutate donor data.
export function llamaWowClip(action) {
  const clip = LLAMA_WOW_MOTION.clips[action];
  return clip ? structuredClone(clip) : null;
}

export const llamaWowMotionProvenance = LLAMA_WOW_MOTION.provenance;
