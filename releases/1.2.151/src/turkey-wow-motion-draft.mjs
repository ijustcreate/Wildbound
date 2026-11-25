import { TURKEY_WOW_MOTION_DRAFT } from './turkey-wow-motion-data.mjs';

// Add donor clips under unmistakably draft-only names to an isolated model
// copy. Runtime WildlifePack and saved rigs never import this helper.
export function turkeyWowMotionDraftModel(model) {
  const result = structuredClone(model);
  for (const [name, clip] of Object.entries(TURKEY_WOW_MOTION_DRAFT.clips)) {
    result.clips[`wowhead-${name}`] = structuredClone(clip);
  }
  return result;
}

export const turkeyWowMotionDraftProvenance = TURKEY_WOW_MOTION_DRAFT.provenance;
