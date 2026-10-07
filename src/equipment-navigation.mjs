// Matches the three-column body layout beside the live character preview.
export const EQUIPMENT_NEIGHBORS={
 head:{up:'feet',down:'neck',prev:'back',next:'cape'},
 neck:{up:'head',down:'chest',prev:'back',next:'cape'},
 shoulders:{up:'cape',down:'hand2',prev:'chest',next:'gloves'},
 cape:{up:'head',down:'shoulders',prev:'neck',next:'back'},
 chest:{up:'neck',down:'pants',prev:'gloves',next:'shoulders'},
 back:{up:'head',down:'gloves',prev:'cape',next:'neck'},
 gloves:{up:'back',down:'hand1',prev:'shoulders',next:'chest'},
 pants:{up:'chest',down:'feet',prev:'hand1',next:'hand2'},
 hand1:{up:'gloves',down:'feet',prev:'hand2',next:'pants'},
 hand2:{up:'shoulders',down:'feet',prev:'pants',next:'hand1'},
 feet:{up:'pants',down:'head',prev:'hand1',next:'hand2'},
};
export const equipmentNeighbor=(slot,direction)=>EQUIPMENT_NEIGHBORS[slot]?.[direction]||'head';
