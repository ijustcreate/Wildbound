export const EMPORIUM_OWLS={
 eeylops_hedwig_cage:{name:'Snowy Owl',variant:'hedwig',color:'#e9e4ce',price:45,description:'A full-sized snowy owl with bright amber eyes.'},
 eeylops_pigwidgeon_cage:{name:'Tiny Barn Owl',variant:'pigwidgeon',color:'#ad8861',price:35,description:'A quick little barn owl with a pale heart-shaped face.'},
 eeylops_archimedes_cage:{name:'Great Horned Owl',variant:'archimedes',color:'#966237',price:55,description:'A full-sized brown owl with tall ear tufts.'},
};

export const PIRATE_PARROT_CAGE='pirate_parrot_cage';
export const BIRD_CAGES={
 ...EMPORIUM_OWLS,
 [PIRATE_PARROT_CAGE]:{name:'Scarlet Parrot',variant:'parrot',color:'#cc5344'},
};
export const emporiumOwlVariant=variant=>Object.values(BIRD_CAGES).find(bird=>bird.variant===variant);

export const EMPORIUM_OWL_ITEMS={...Object.fromEntries(Object.entries(EMPORIUM_OWLS).map(([id,owl])=>[
 id,{name:owl.name+' · owl cage',stack:1,rarity:'uncommon',color:owl.color,supplyOnly:true,sellPrice:Math.floor(owl.price/2),
  owlCage:true,description:owl.description+' Adopt this owl as a companion. It follows you, fights beside you, and can be named in Companion care.'},
])),
 [PIRATE_PARROT_CAGE]:{name:'Parrot Cage',stack:1,rarity:'rare',color:BIRD_CAGES[PIRATE_PARROT_CAGE].color,supplyOnly:true,sellPrice:25,
  owlCage:true,parrotCage:true,description:'Use to call your scarlet parrot. It follows you and fights beside you. Keep the cage to call it back.'},
};

export const EMPORIUM_OWL_STOCK=Object.entries(EMPORIUM_OWLS).map(([id,owl])=>[id,owl.price]);
