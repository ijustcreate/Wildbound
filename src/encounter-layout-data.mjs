export const ENCOUNTER_LAYOUTS = {
  ember_clearing: {
    name: 'Ember Clearing',
    description: 'A campfire sits between the approach and two enemies. Side gaps let either player circle behind the group.',
    entry: [0, 100],
    fire: [0, 39],
    spawns: [[0, -20], [0, -76]],
    walls: [
      {point: [-96, 18], width: 49, depth: 38, height: 32, shape: 'terrace'},
      {point: [99, -12], width: 47, depth: 35, height: 42, shape: 'pillar'},
    ],
    routes: [
      [[0, 100], [0, -70]],
      [[0, 100], [-49, 35], [-49, -76], [0, -98]],
      [[0, 100], [52, 30], [52, -76], [0, -98]],
    ],
    supplies: [['starter_bow', 1, -18, 83], ['arrow', 8, 22, 83]],
  },
  snare_pass: {
    name: 'Snare Pass',
    description: 'Two ruined walls frame a straight center lane. The side path comes around behind the enemies.',
    entry: [0, 96],
    trap: [0, 34],
    spawns: [[0, -19], [0, -70]],
    walls: [
      {point: [-61, 21], width: 52, depth: 47, height: 42, shape: 'terrace'},
      {point: [65, 21], width: 58, depth: 47, height: 42, shape: 'terrace'},
    ],
    routes: [
      [[0, 96], [0, -95]],
      [[0, 96], [119, 69], [119, -62], [38, -80], [0, -92]],
    ],
    supplies: [['trap', 3, -20, 81], ['fruit', 2, 24, 81]],
  },
  shieldgate: {
    name: 'Shieldgate Ruins',
    description: 'A broken wall divides a guarded lane from a fire-lit flank. A stone backstop catches enemies shoved up the flank.',
    entry: [0, 105],
    fire: [59, 43],
    trap: [-62, 32],
    spawns: [[-62, -34], [59, -25], [-58, -91]],
    walls: [
      {point: [0, 21], width: 45, depth: 52, height: 56, shape: 'pillar'},
      {point: [59, -98], width: 61, depth: 33, height: 37, shape: 'terrace'},
    ],
    routes: [
      [[0, 105], [-62, 54], [-62, -105]],
      [[0, 105], [59, 59], [59, -59], [-62, -59]],
    ],
    supplies: [['ice_wand', 1, 20, 90], ['arrow', 6, 47, 74], ['trap', 2, -23, 89]],
  },
};

const unit = (kind, hp, speed, damage, combatRole) => ({kind, count: 1, hp, speed, damage, manualOverride: true, ...(combatRole ? {combatRole} : {})});

export const COMBO_ENCOUNTERS = [
  {
    name: 'Ember Clearing', kind: 'slime', environment: 'forest', comboLayout: 'ember_clearing',
    count: 2, hp: 75, speed: 44, damage: 8, weight: 12,
    verse: 'An old fire keeps the clearing bright.\nTwo shapes gather beyond the light.',
    tip: 'There’s a bow by the near side of the campfire. The slimes are on the far side.',
    enemies: [unit('slime', 75, 43, 8), unit('slime', 85, 46, 9)],
  },
  {
    name: 'Snare Pass', kind: 'zombie', environment: 'forest', comboLayout: 'snare_pass',
    count: 2, hp: 108, speed: 43, damage: 12, weight: 12,
    verse: 'Two walls narrow the road ahead.\nSlow feet drag through the stones.',
    tip: 'Take a snare at the near end, or circle around the right wall to meet the pack from behind.',
    enemies: [unit('zombie', 108, 43, 12), unit('zombie', 112, 42, 12)],
  },
  {
    name: 'Shieldgate Ruins', kind: 'skeleton', environment: 'forest', comboLayout: 'shieldgate',
    count: 3, hp: 124, speed: 58, damage: 14, weight: 10,
    verse: 'The shield holds fast in the old gate.\nA fire burns on the open flank.',
    tip: 'The shield and archer cover the left lane. The campfire, Frost wand, and open flank are on the right.',
    enemies: [unit('skeleton', 124, 58, 14, 'shield'), unit('lion', 148, 74, 17, 'charger'), unit('archer', 84, 60, 12, 'archer')],
  },
];

export const hasEncounterLayout = id => Object.hasOwn(ENCOUNTER_LAYOUTS, id);

const campfireCache = new WeakMap();
export function encounterCampfires(game) {
  const scenery = game.scenery;
  if (!scenery) return [];
  const cached = campfireCache.get(scenery);
  if (cached?.length === scenery.length) return cached.fires;
  const fires = scenery.filter(prop => prop.kind === 'encounter_campfire');
  campfireCache.set(scenery, {length: scenery.length, fires});
  return fires;
}
