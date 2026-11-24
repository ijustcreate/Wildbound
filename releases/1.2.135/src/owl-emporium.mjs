export const EMPORIUM_OWLS={
 eeylops_hedwig_cage:{name:'Hedwig',variant:'hedwig',color:'#e9e4ce',price:45,description:'A full-sized snowy owl with bright amber eyes.'},
 eeylops_pigwidgeon_cage:{name:'Pigwidgeon',variant:'pigwidgeon',color:'#ad8861',price:35,description:'A small, quick brown owl with a pale round face.'},
 eeylops_archimedes_cage:{name:'Archimedes',variant:'archimedes',color:'#966237',price:55,description:'A full-sized brown horned owl with tall ear tufts.'},
};

export const EMPORIUM_OWL_ITEMS=Object.fromEntries(Object.entries(EMPORIUM_OWLS).map(([id,owl])=>[
 id,{name:owl.name+' · owl cage',stack:1,rarity:'uncommon',color:owl.color,supplyOnly:true,sellPrice:Math.floor(owl.price/2),
  owlCage:true,description:owl.description+' Use from your backpack to summon or recall your owl. The cage stays with you.'},
]));

export const EMPORIUM_OWL_STOCK=Object.entries(EMPORIUM_OWLS).map(([id,owl])=>[id,owl.price]);
