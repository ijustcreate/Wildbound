import { itemKind } from './items.mjs';

// Shared contract for native Wildbound pixel assets. This is deliberately
// data-only so the game, editor, tests and future import tools agree on the
// same standards without replacing articulated rigs with baked frames.
export const PIXEL_ART_STANDARDS = Object.freeze({
  revision: 1,
  rig: 'captain-native-v1',
  directions: Object.freeze(['front', 'front-diagonal', 'profile', 'rear-diagonal', 'back', 'rear-diagonal', 'profile', 'front-diagonal']),
  requiredClips: Object.freeze(['idle', 'walk', 'run', 'slash', 'ranged', 'cast', 'jump_air']),
  pixelGrid: 1,
  hairRamp: 4,
  outline: 'warm-dark',
  authoredRule: 'parts-and-keys',
});

export const WEARABLE_SLOTS = Object.freeze([
  'head', 'neck', 'cape', 'back', 'shoulders', 'chest', 'gloves',
  'pants', 'feet', 'hand1', 'hand2',
]);

const knownKinds = new Set([
  'hat', 'armor', 'pants', 'gloves', 'boots', 'shoulder_armor', 'cape',
  'shield', 'sword', 'dagger', 'bow', 'wand', 'staff', 'scythe', 'quiver',
  'charm', 'boomerang', 'rifle', 'whip', 'critter_net', 'lantern', 'torch',
]);

function issue(code, message, severity = 'review') {
  return { code, message, severity };
}

// This audit checks the asset contract, not aesthetics. A green row means an
// item is routable through the shared renderer and is ready for visual review
// in all eight directions; it does not claim that a human has approved its
// silhouette or color design.
export function auditWearableCatalog(items = {}) {
  const rows = Object.entries(items)
    .filter(([, def]) => def?.slot || def?.relic)
    .map(([id, def]) => {
      const issues = [];
      const kind = def.base || itemKind(id);
      if (def.slot && !WEARABLE_SLOTS.includes(def.slot))
        issues.push(issue('unknown-slot', `Slot “${def.slot}” is not in the shared wearable contract.`, 'error'));
      if (def.slot && !knownKinds.has(kind) && !def.humanoidWings)
        issues.push(issue('unknown-kind', `Item kind “${kind}” has no shared humanoid renderer contract.`, 'error'));
      if (def.slot && !def.description)
        issues.push(issue('missing-description', 'Add a concise in-game description before approving this wearable.', 'review'));
      if (def.slot && !def.artColor && !def.color)
        issues.push(issue('missing-palette', 'Add a base color or artColor for inventory and fallback rendering.', 'review'));
      if (def.slot && def.twoHanded && def.slot !== 'hand1')
        issues.push(issue('two-hand-slot', 'Two-handed items must originate in hand1 so the equip system can occupy hand2.', 'error'));
      return {
        id,
        name: def.name || id,
        slot: def.slot || 'relic',
        kind,
        renderer: def.humanoidWings ? 'articulated-appendage' : 'shared-humanoid',
        editable: true,
        directions: PIXEL_ART_STANDARDS.directions.length,
        clips: PIXEL_ART_STANDARDS.requiredClips.length,
        issues,
        status: issues.some(item => item.severity === 'error') ? 'blocked' : issues.length ? 'review' : 'ready',
      };
    });
  return {
    standards: PIXEL_ART_STANDARDS,
    total: rows.length,
    ready: rows.filter(row => row.status === 'ready').length,
    review: rows.filter(row => row.status === 'review').length,
    blocked: rows.filter(row => row.status === 'blocked').length,
    rows,
  };
}

export function artPipelineSummary(items = {}) {
  const audit = auditWearableCatalog(items);
  const issues = audit.rows.flatMap(row => row.issues.map(detail => ({ ...detail, id: row.id, name: row.name })));
  return { ...audit, issues };
}
