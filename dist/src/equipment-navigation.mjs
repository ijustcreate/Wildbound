// Matches the displayed paper doll, including the lower-left glove slot.
export const EQUIPMENT_NEIGHBORS={
 head:{up:'feet',down:'neck',prev:'neck',next:'back'},
 back:{up:'head',down:'cape',prev:'head',next:'neck'},
 neck:{up:'head',down:'shoulders',prev:'cape',next:'cape'},
 cape:{up:'head',down:'chest',prev:'neck',next:'neck'},
 shoulders:{up:'neck',down:'hand1',prev:'chest',next:'chest'},
 chest:{up:'cape',down:'hand2',prev:'shoulders',next:'shoulders'},
 hand1:{up:'shoulders',down:'gloves',prev:'hand2',next:'hand2'},
 hand2:{up:'chest',down:'pants',prev:'hand1',next:'hand1'},
 gloves:{up:'hand1',down:'feet',prev:'pants',next:'feet'},
 pants:{up:'hand2',down:'feet',prev:'feet',next:'gloves'},
 feet:{up:'gloves',down:'head',prev:'gloves',next:'pants'},
};
export const equipmentNeighbor=(slot,direction)=>EQUIPMENT_NEIGHBORS[slot]?.[direction]||'head';
