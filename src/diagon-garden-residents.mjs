import {GARDEN_PATHS} from './diagon-garden-layout.mjs';

const [entry,loop,north]=GARDEN_PATHS.map(path=>path.points);
const pathPoint=([x,y])=>({x,y});
const stop=(x,y,name,routine,faceX,faceY)=>({x,y,name,routine,faceX,faceY,fixed:true});

export const GARDEN_AVENUE={x:7880,y:4020};

export const GARDEN_RESIDENT_PLACES=Object.freeze({
 gardenAvenue:GARDEN_AVENUE,
 gardenGate:pathPoint(entry[1]),
 gardenEntry:pathPoint(entry[2]),
 gardenEast:pathPoint(loop[0]),
 gardenNorth:pathPoint(loop[1]),
 gardenLinden:pathPoint(loop[2]),
 gardenHedge:pathPoint(loop[3]),
 gardenWest:pathPoint(loop[4]),
 gardenFlowers:pathPoint(loop[5]),
 gardenSouth:pathPoint(loop[6]),
 gardenSundial:pathPoint(loop[7]),
 gardenReeds:pathPoint(loop[8]),
 gardenWater:pathPoint(loop[9]),
 gardenLamp:pathPoint(loop[10]),
 gardenChimes:pathPoint(north[1]),
 gardenSteps:pathPoint(north[2]),
 gardenHeather:stop(7260,3865,'the upper heather beds','tend',-1,0),
 gardenDaisies:stop(7529,3956,'the east daisy bed','tend',-1,-.45),
 gardenFern:stop(7338,4142,'the flower beds','tend',.6,-1),
 gardenSeedlings:stop(7465,4120,'the reed beds','tend',-.3,-1),
 gardenPoolEast:stop(7487,4081,'the east pool bank','watch',-1,-.1),
 gardenPoolWest:stop(7315,4054,'the west pool bank','watch',1,.2),
 gardenOwl:stop(...north[3],'the owl walk','watch',-1,-.4),
 gardenStudy:stop(7390,4195,'the south bench','read',.35,1),
 gardenShade:stop(7352,3998,'the linden walk','read',1,.4),
});

export const GARDEN_RESIDENT_WALKS=[
 ['gardenAvenue','gardenGate','gardenEntry','gardenEast','gardenNorth','gardenLinden','gardenHedge','gardenWest',
  'gardenFlowers','gardenSouth','gardenSundial','gardenReeds','gardenWater','gardenLamp','gardenEast'],
 ['gardenNorth','gardenChimes','gardenSteps','gardenOwl','gardenHeather'],
 ['gardenEntry','gardenDaisies'],
 ['gardenSouth','gardenFern'],
 ['gardenReeds','gardenSeedlings','gardenWater'],
 ['gardenWater','gardenPoolEast','gardenLamp'],
 ['gardenWest','gardenPoolWest'],
 ['gardenSundial','gardenStudy'],
 ['gardenLinden','gardenShade'],
];

export const GARDEN_RESIDENTS=Object.freeze([
 {
  id:'neville',name:'Neville Longbottom',title:'Herbology student',speed:34,
  look:{hair:'crop',hairColor:'#634938',skin:'#d3a07b',eyeColor:'#7b6448',shirt:'#70784d',pants:'#575249'},
  equipment:{gloves:'alley_copperweave_gloves',back:'hogwarts_scarf_red',feet:'hogwarts_shoes'},
  stops:['gardenFern','gardenSeedlings','gardenSeedlings','gardenFern'],
  greeting:'Professor Sprout said to thin the moonmint. I brought spare gloves in case the cuttings have other ideas.',
  question:'What are you doing with the cuttings?',
  story:'I’m checking the stems before I plant them. A little patience now saves having to untangle two sets of roots next week.',
  topic:{label:'Help sort the moonmint',text:'Neville holds up two cuttings. One stem is square and the other is smooth and round. Which would you put in the moonmint bundle?',replies:[
   {label:'The one with a square stem.',text:'“That’s the moonmint.” Neville ties the stem in with the others and offers you a stoppered sample.',reward:'alley_moonmint_tonic',claim:'irene-mossmere',sound:'heal'},
   {label:'The one with a round stem.',text:'Neville rolls the stem in his fingers. “Feel the corners on the other one? Let’s put this one back.”',sound:'alleyCloth'},
  ]},
 },
 {
  id:'luna',name:'Luna Lovegood',title:'Wildlife observer',speed:32,
  look:{hair:'long',hairColor:'#dfc58f',skin:'#e3bc9d',eyeColor:'#a1b9c7',shirt:'#ad88ac',pants:'#536878',face:'glasses'},
  equipment:{back:'hogwarts_scarf_blue',cape:'alley_lantern_mantle',feet:'hogwarts_shoes'},
  stops:['gardenPoolEast','gardenOwl','gardenPoolWest','gardenPoolEast'],
  greeting:'I’ve been watching the pool. The fish keep passing the same reed, though they don’t all pass it on the same side.',
  question:'What have you seen today?',
  story:'An owl was watching a butterfly over the water. I put them both down in my notes so I could remember who noticed whom first.',
  lore:{label:'Is there a story about the pond?',text:'They say a swim here can mend a broken heart. Jump in carrying your own heart and the pond gives it back to you. Carry somebody else’s and it finds its way back to them. I wonder how the pond knows.'},
  topic:{label:'Learn to check a wing pattern',text:'“Wait till it lands and turns toward the light,” Luna says. “If you use a net and a bottle for a closer look, remember to let it back out.”',replies:[
   {label:'Take an empty critter bottle.',text:'Luna checks the stopper and hands you a clean critter bottle.',reward:'empty_jar',claim:'celia-pollen',sound:'loot'},
   {label:'I’ll watch them where they land.',text:'Luna moves over. “The light is better on this side. You can see the little marks on the wings.”',sound:'alleyPages'},
  ]},
 },
 {
  id:'hermione',name:'Hermione Granger',title:'Student researcher',speed:42,
  look:{hair:'waves',hairColor:'#663b2d',skin:'#d2a084',eyeColor:'#69513c',shirt:'#834a46',pants:'#484763'},
  equipment:{chest:'hogwarts_student_robes',back:'hogwarts_scarf_red',feet:'hogwarts_shoes'},
  stops:['gardenStudy','gardenStudy','flourishStudy','gardenShade'],
  greeting:'The book says moonmint prefers shade. It doesn’t specify morning or afternoon, which makes the directions rather hard to follow.',
  question:'What are you looking up?',
  story:'I’m comparing two editions. Flourish & Blotts has the older one, so I’m going over at midday to see whether they changed the drawing of the leaf.',
  topic:{label:'Compare the garden’s lamp wards',text:'Hermione points to two diagrams in her book. “Which one would light the garden path without startling anything at the pool?”',replies:[
   {label:'Aim the light down at the stones.',text:'“Exactly.” Hermione marks the narrower ward. “We only need to see where we’re walking.”',sound:'magic'},
   {label:'Cast a broad light over the garden.',text:'Hermione turns the book sideways. “Try tracing the edge of that spell. It reaches all the way to the owl’s branch.”',sound:'click'},
  ]},
 },
 {
  id:'sprout',name:'Professor Pomona Sprout',title:'Herbology professor',speed:31,
  look:{build:'broad',hair:'waves',hairColor:'#aaa088',skin:'#ba8566',eyeColor:'#656549',shirt:'#777d50',pants:'#584f42',face:'freckles'},
  equipment:{head:'witch_hat_russet',gloves:'alley_copperweave_gloves',cape:'moss_cape',feet:'hogwarts_shoes'},
  stops:['gardenDaisies','gardenHeather','gardenHeather','gardenDaisies'],
  greeting:'Could you step on the stones, please? The seedlings at the edge are nearly invisible until you’ve put a boot on them.',
  question:'Can I help in the garden?',
  story:'Watch the young plants first. If something has chewed a new leaf, move it gently and check underneath before you give it any more water.',
  topic:{label:'Practice handling a critter net',text:'Professor Sprout shows you how to hold the hoop low. “Equip the net in either hand, swing once when you’re close, and keep an empty bottle or cage ready.”',replies:[
   {label:'Take a spare catcher net.',text:'Professor Sprout hands you a spare net. “A steady hand does more good than a hard swing.”',reward:'critter_net',claim:'vesper-rill',sound:'equip'},
   {label:'I have the equipment I need.',text:'“Good. Leave yourself room to move and try to keep off the flower beds.”',sound:'alleyCloth'},
  ]},
 },
]);
