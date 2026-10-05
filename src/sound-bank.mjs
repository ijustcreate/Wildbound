// Recorded CC0 sources; provenance and transformations: assets/sfx/CREDITS.md.
const files=(dir,names)=>names.split(',').map(n=>`assets/sfx/${dir}/${n}.ogg`);
const ui=(names)=>({files:files('ui',names),bus:'ui',gain:.24});
const rpg=(names,gain=.35)=>({files:files('rpg',names),gain});
const impact=(name,gain=.32)=>({files:files('impact',`${name}_000,${name}_001,${name}_002`),gain});
export const CUES={
 rifle:impact('impactMetal_heavy',.5),stalkerStep:impact('footstep_grass',.22),
 stalkerBreath:{files:['assets/sfx/creatures/snarl.ogg'],gain:.09,rate:.55,maxDuration:1.1},
 focus:ui('select_001,select_002'),click:ui('click_001,click_002'),back:ui('back_001'),error:ui('error_003'),join:ui('confirmation_001'),ready:ui('confirmation_002'),save:ui('confirmation_003'),
 attack:rpg('knifeSlice,knifeSlice2'),bow:rpg('cloth1,cloth2'),magic:ui('glass_001,glass_002'),hit:impact('impactPunch_medium'),shield:impact('impactMetal_medium'),hurt:impact('impactPunch_heavy'),
 roll:impact('impactWood_light'),event:ui('bong_001'),trap:rpg('metalLatch'),heal:ui('glass_003'),defeat:impact('impactSoft_heavy'),dodge:rpg('cloth3,cloth4'),win:ui('confirmation_004'),lose:ui('error_008'),
 loot:rpg('handleCoins,handleCoins2'),drop:rpg('dropLeather'),equip:rpg('beltHandle1,beltHandle2'),inventory:rpg('bookOpen'),close:rpg('bookClose'),doorOpen:rpg('doorOpen_1,doorOpen_2'),doorClose:rpg('doorClose_1,doorClose_2'),
 harvest:rpg('chop'),mine:impact('impactMining'),fall:impact('impactWood_heavy'),hatch:impact('impactGlass_light'),web:rpg('clothBelt'),portal:ui('maximize_005'),level:ui('confirmation_003'),
 grass:impact('footstep_grass',.13),wood:impact('footstep_wood',.13),snow:impact('footstep_snow',.13),sand:impact('footstep_carpet',.13),water:rpg('footstep08,footstep09',.12),slide:ui('scratch_001'),
 wind:{files:['assets/sfx/ambience/wind.wav'],bus:'ambience',gain:.15},rain:{files:['assets/sfx/ambience/rain.ogg'],bus:'ambience',gain:.18},forest_ambient:{files:['assets/sfx/ambience/forest_ambient_20s_loop.wav'],bus:'ambience',gain:.42},
};
export const FAMILIES={gorilla:[9,.65],lion:[1,.75],tiger:[1,.7],white_lion:[1,.66],panther:[2,.85],snow_leopard:[2,.78],wolf:[3,1],crocodile:[4,.65],boar:[5,.9],snake:[6,1.5],bat:[7,1.9],beetle:[8,1.6],wasp:[8,2.2],bee:[8,2.3],vine:[6,.65],golem:[9,.5],monkey:[0,1],skeleton:[10,1.1],skeleton_unarmed:[10,1.2],skeleton_boss:[10,.65],archer:[10,1.05],skeleton_wizard:[10,.85],rhino:[5,.6],dragon:[9,.55],fire_elemental:[6,.65],spider:[8,1.25],baby_spider:[8,1.8],spider_egg:[8,.8]};
export function creatureCue(kind,action){
 if(kind==='wolf')return {files:[`assets/sfx/wolf/${action==='spawn'?'howl':action==='death'?'whimper':action==='hurt'?'yelp':'snarl'}.wav`],rate:1,gain:action==='spawn'?.23:.28,maxDuration:action==='spawn'?2.4:1};
 if(kind==='panther'){
  const panther={
   spawn:{files:['assets/sfx/creatures/monster-2.wav'],rate:.78,gain:.17,maxDuration:1.1},
   windup:{files:['assets/sfx/creatures/snarl.ogg'],rate:.7,gain:.18,maxDuration:.48},
   swoop:{files:['assets/sfx/rpg/cloth3.ogg','assets/sfx/rpg/cloth4.ogg'],rate:.7,gain:.33,maxDuration:.36},
   swipe:{files:['assets/sfx/rpg/knifeSlice.ogg','assets/sfx/rpg/knifeSlice2.ogg'],rate:.83,gain:.3,maxDuration:.36},
   bite:{files:['assets/sfx/creatures/snarl.ogg'],rate:.9,gain:.28,maxDuration:.48},
   hurt:{files:['assets/sfx/creatures/monster-2.wav'],rate:1.2,gain:.19,maxDuration:.45},
   death:{files:['assets/sfx/creatures/monster-2.wav'],rate:.62,gain:.23,maxDuration:1.4},
  };
  return panther[action] || panther.bite;
 }
 const [n,rate]=FAMILIES[kind]||FAMILIES.lion;
 let sources=n?[`assets/sfx/creatures/monster-${n}.wav`]:files('creatures','monkey-1,monkey-2,monkey-3');
 if(n===8)sources=files('creatures','tiny0,tiny1,tiny2');
 if(n===10&&action!=='spawn')sources=files('impact',action==='death'?'impactPlate_heavy_000,impactPlate_heavy_001':'impactMetal_light_000,impactMetal_light_001');
 if(action==='attack'&&n===1)sources=['assets/sfx/creatures/snarl.ogg'];
 return {files:sources,rate:rate*(action==='death'?.75:action==='hurt'?1.15:1),gain:action==='spawn'?.28:.2,maxDuration:action==='spawn'?2:action==='death'?1.8:.75};
}
