import { SKUNK_WOW_MOTION } from './skunk-wow-motion-data.mjs';

// Clone the source-derived frames so editor or actor-specific changes never
// mutate the shared donor record.
export function skunkWowClip(action) {
  const clip = SKUNK_WOW_MOTION.clips[action];
  return clip ? structuredClone(clip) : null;
}

export const skunkWowMotionProvenance = SKUNK_WOW_MOTION.provenance;
