// Walk the ring around the central portrait, never jump through the paper doll.
export const EQUIPMENT_NEIGHBORS={
 head:{up:'feet',down:'chest',prev:'shoulders',next:'neck'},
 neck:{up:'feet',down:'back',prev:'head',next:'cape'},
 shoulders:{up:'head',down:'chest',prev:'cape',next:'head'},
 cape:{up:'neck',down:'back',prev:'neck',next:'shoulders'},
 chest:{up:'shoulders',down:'gloves',prev:'back',next:'back'},
 back:{up:'cape',down:'pants',prev:'chest',next:'chest'},
 gloves:{up:'chest',down:'hand1',prev:'pants',next:'pants'},
 pants:{up:'back',down:'hand2',prev:'gloves',next:'gloves'},
 hand1:{up:'gloves',down:'feet',prev:'hand2',next:'hand2'},
 hand2:{up:'pants',down:'feet',prev:'hand1',next:'hand1'},
 feet:{up:'hand1',down:'head',prev:'hand1',next:'hand2'},
};
export const equipmentNeighbor=(slot,direction)=>EQUIPMENT_NEIGHBORS[slot]?.[direction]||'head';
