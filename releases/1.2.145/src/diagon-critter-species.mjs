const species={
 moonvein_butterfly:{name:'Moonvein butterfly',habitat:'garden',container:'empty_jar',color:'#96d2cf',speed:31,
  description:'A twilight butterfly with pale veins running through its turquoise wings.'},
 gloamwhisker_rat:{name:'Gloamwhisker rat',habitat:'nocturne',container:'critter_cage',color:'#a796aa',speed:82,
  description:'A soot-gray rat with lilac ears and a striped tail. It makes quick trips between the Nocturne shop fronts.'},
 cobble_jumper:{name:'Cobble-jumper',habitat:'either',container:'empty_jar',color:'#a9ad67',speed:36,
  description:'A tiny jumping spider with amber eyes and a moss-colored saddle.'},
};

export const DIAGON_CRITTER_SPECIES=Object.freeze(species);
export const DIAGON_CRITTER_ITEMS=Object.freeze(Object.fromEntries(Object.entries(species).map(([id,s])=>[
 'caught_'+id,{name:s.name,stack:1,color:s.color,captureContainer:s.container,sellPrice:6,diagonCritter:true,description:s.description},
])));
