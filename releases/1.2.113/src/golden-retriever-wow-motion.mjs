import { GOLDEN_RETRIEVER_WOW_MOTION } from './golden-retriever-wow-motion-data.mjs';

const targetClips = Object.freeze({ idle: 'idle', walk: 'walk', run: 'run' });
export const goldenRetrieverWowMotionProvenance = GOLDEN_RETRIEVER_WOW_MOTION.provenance;

export function goldenRetrieverWowClip(action) {
  const sourceClip = targetClips[action];
  return sourceClip ? structuredClone(GOLDEN_RETRIEVER_WOW_MOTION.clips[sourceClip]) : null;
}
