import { TURKEY_WOW_MOTION_DRAFT } from './turkey-wow-motion-data.mjs';

// Return independent clips so creature instances and Rig Studio cannot mutate
// the generated donor data record.
export function turkeyWowClip(action) {
  const clip = TURKEY_WOW_MOTION_DRAFT.clips[action];
  return clip ? structuredClone(clip) : null;
}

export const turkeyWowMotionProvenance = TURKEY_WOW_MOTION_DRAFT.provenance;
