export const GARDEN_MANA_BONUS=30;
export const GARDEN_MANA_SECONDS=600;

export function gardenManaWardRemaining(p){
 const remaining=p?.field?.gardenManaWard;
 return Number.isFinite(remaining)?Math.max(0,Math.min(GARDEN_MANA_SECONDS,remaining)):0;
}
