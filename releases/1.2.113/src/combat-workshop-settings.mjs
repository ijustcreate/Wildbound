const STORAGE_KEY = 'wildbound-combat-workshop-v1';

export const COMBAT_FIELDS = Object.freeze([
  {group:'Impact', key:'impactShake', label:'Camera impact strength', value:0.9, min:0, max:1.6, step:0.05},
  {group:'Impact', key:'impactFreeze', label:'Heavy and guarded impacts briefly pause combat', value:true},
  {group:'Counterattack', key:'guardWindow', label:'Timed guard window (seconds)', value:0.22, min:0.1, max:0.45, step:0.01},
  {group:'Counterattack', key:'caughtWindow', label:'Guarded rush opening (seconds)', value:1.2, min:0.55, max:2.4, step:0.05},
  {group:'Counterattack', key:'missedWindow', label:'Missed rush opening (seconds)', value:0.95, min:0.5, max:2.2, step:0.05},
  {group:'Counterattack', key:'counterBonus', label:'Counter damage bonus (fraction)', value:0.28, min:0, max:0.65, step:0.01},
  {group:'Boomerang', key:'boomerangTurnTime', label:'Turnaround (seconds)', value:0.10, min:0, max:0.35, step:0.01},
  {group:'Boomerang', key:'boomerangReturnSpeed', label:'Return speed (multiplier)', value:1.08, min:0.7, max:1.85, step:0.01},
  {group:'Boomerang', key:'boomerangGuide', label:'Show the return path for the thrower', value:true},
  {group:'Elemental', key:'shatterBonus', label:'Heavy shatter damage bonus (fraction)', value:0.65, min:0, max:0.85, step:0.01},
  {group:'Elemental', key:'shatterRange', label:'Shatter shard reach (world pixels)', value:78, min:42, max:112, step:1},
  {group:'Elemental', key:'thermalBonus', label:'Thermal shock damage bonus (fraction)', value:0.42, min:0, max:0.75, step:0.01},
  {group:'Elemental', key:'thermalOpening', label:'Thermal shock flinch (seconds)', value:0.38, min:0.1, max:0.65, step:0.01},
  {group:'Co-op', key:'teamCallouts', label:'Show repeat co-op finish callouts', value:true},
]);

export function normalizeCombatTuning(raw) {
  const values = {};
  for (const field of COMBAT_FIELDS) {
    const input = raw && Object.hasOwn(raw, field.key) ? raw[field.key] : null;
    if (typeof field.value === 'boolean') {
      values[field.key] = typeof input === 'boolean' ? input : field.value;
    } else {
      values[field.key] = Number.isFinite(input)
        ? Math.max(field.min, Math.min(field.max, input))
        : field.value;
    }
  }
  return values;
}

export const DEFAULT_COMBAT_TUNING = Object.freeze(normalizeCombatTuning());

function loadCombatTuning() {
  try {
    return normalizeCombatTuning(JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) || '{}'));
  } catch {
    return {...DEFAULT_COMBAT_TUNING};
  }
}

// All combat entry points read the same object, including an expedition already in progress.
export const combatTuning = loadCombatTuning();

export function saveCombatTuning(raw) {
  const next = normalizeCombatTuning(raw);
  globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
  Object.assign(combatTuning, next);
  return {...combatTuning};
}
