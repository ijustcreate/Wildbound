import {DEFAULT_APPEARANCE} from './appearance.mjs';

export const HOOK_LOOT=['pirate_captain_hat','pirate_captain_coat','pirate_hand_hook','fancy_rapier'];
export const PARROT_CAGE='pirate_parrot_cage';
export const PARROT_CAGE_CHANCE=.24;
const outfit=(skin,hair,hairColor,shirt,pants,details={})=>({...DEFAULT_APPEARANCE,skin,hair,hairColor,shirt,pants,...details});
const deck=(x,y)=>({x,y,level:'deck'});
const hold=(x,y)=>({x,y,level:'hold'});
const throughHatch=[deck(-173,48),hold(-173,47)];

export const PIRATE_CREW=[
 {key:'hook',name:'Captain Hook',role:'Captain of the ship',size:54,hp:265,damage:26,speed:64,
  appearance:outfit('#bd896b','waves','#241d2b','#723043','#30213c',{facialHair:'moustache',eyeColor:'#434052'}),
  equipment:{head:HOOK_LOOT[0],chest:HOOK_LOOT[1],hand2:HOOK_LOOT[2],hand1:HOOK_LOOT[3],feet:'warlock_boots'},
  route:[deck(-245,-30),deck(-227,-50),deck(-193,-54),deck(-228,-37)],
  line:'Every plank aboard answers to me. A clever visitor remembers whose quarterdeck this is.',
  reply:'Smee! See that the new visitor keeps one eye on the horizon and the other off my charts.'},
 {key:'smee',name:'Mr. Smee',role:'Boatswain',size:45,hp:105,damage:13,speed:45,
  appearance:outfit('#d6a17c','crop','#c3b8a4','#52848d','#a48669',{build:'broad',facialHair:'stubble',eyeColor:'#698b8b',shirtStripe:'#cbbca3'}),
  equipment:{head:'linen_cap',hand1:'dagger'},dye:'#9b4c4d',
  route:[deck(-215,13),deck(-214,49),...throughHatch,hold(-149,41),hold(-205,57),hold(-218,19),hold(-205,45),hold(-173,47),deck(-173,48),deck(-205,26)],
  line:'Mind your head on the hatch! If you hear someone counting barrels below, that’s me trying to remember which count I was on.',
  reply:'The captain gives orders, I give the orders legs. That is a boatswain’s whole life in one sentence.'},
 {key:'nell',name:'Nell Cross',role:'Deck lookout',size:43,hp:101,damage:15,speed:54,
  appearance:outfit('#8c5949','braids','#30262e','#4d6873','#5a473a',{eyeColor:'#4c8792'}),
  equipment:{head:'alley_inkcap',hand1:'sword',feet:'leather_boots'},
  route:[deck(122,60),deck(182,59),deck(202,18),deck(172,38)],
  line:'The birds smell land before we see it. A red feather in a cage means one of ours got any closer than it wanted.',
  reply:'The fellow in the main crow’s nest draws watch pay for lying down. Ask him how he does it.'},
 {key:'bram',name:'Bram Harker',role:'Gunner',size:49,hp:123,damage:17,speed:51,
  appearance:outfit('#a56c53','crop','#3a2926','#92563c','#4e5654',{build:'broad',facialHair:'fullbeard'}),
  equipment:{head:'safari_hat',hand1:'dagger',feet:'warlock_boots'},
  route:[deck(-78,66),deck(-40,49),deck(-43,26),deck(-78,36)],
  line:'Powder stays dry or we might as well be hauling church bells. Stay clear of the carriage when the gun rolls back.',
  reply:'I keep a dagger for rope and a cannon for hard conversations. Label the two when you put my kit away.'},
 {key:'orla',name:'Orla Vane',role:'Hold quartermaster',size:46,hp:108,damage:15,speed:50,
  appearance:outfit('#b77b56','bob','#4a2931','#967245','#3e4b49',{eyeColor:'#655c45'}),
  equipment:{head:'ranger_hood',hand1:'sword',feet:'warlock_boots'},
  route:[hold(-40,52),hold(22,53),hold(68,42),hold(72,13),hold(26,27),hold(-27,42)],
  line:'Rations to port, spare line to starboard. If Smee says he lent out a barrel, count the barrels again.',
  reply:'I left the last apple for a parrot. It called me a thief, ate the apple, and learned nothing.'},
 {key:'rook',name:'Rook Fenton',role:'Sailmaker',size:42,hp:90,damage:12,speed:46,
  appearance:outfit('#936047','sidepart','#413035','#657166','#655044',{facialHair:'stubble',eyeColor:'#4e5c55'}),
  equipment:{head:'leather_hood',hand1:'dagger'},
  route:[hold(-237,-20),hold(-201,-21),hold(-181,-29),hold(-216,-42),hold(-241,-34)],
  line:'Salt eats good thread for supper. See this stitch? It’ll last until a certain captain tries to haul sail in a squall.',
  reply:'The boatswain and I never quarrel. He forgets what I was cross about before I have time to finish.'},
 {key:'lazy',name:'Lazy Pirate',role:'Crow’s-nest lookout',size:46,
  appearance:outfit('#b88664','crop','#594438','#857f65','#5a5249',{facialHair:'stubble'}),
  equipment:{head:'hat'},
  route:[{level:'nest',nest:'main',x:18,y:-17}],
  line:'Quiet up here, if you leave the shouting on deck. There’s another ship tucked away in a cave beneath the mountain. Took a sharp eye to spot that one.',
  reply:'Follow the coast below the mountain and watch for the cave harbor. I’ll keep looking from here. It’s a very important kind of sitting.'},
];
