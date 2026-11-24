// Shared contract for units that can carry other units. Vehicles are the first
// implementation; horses, carts, boats and similar mounts can reuse this API.
export const MOUNTABLE_UNIT_CATEGORIES=Object.freeze(['vehicle','mount','beast','boat']);
export const isMountableUnit=unit=>!!unit&&MOUNTABLE_UNIT_CATEGORIES.includes(unit.unitCategory);
export const unitSeats=unit=>unit?.seats||{};
export const unitSeatOwner=(unit,seat)=>unitSeats(unit)[seat]||null;
