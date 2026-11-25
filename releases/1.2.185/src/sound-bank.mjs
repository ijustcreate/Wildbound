import {ENCOUNTER_CUES} from './encounter-cues.mjs';
// Recorded CC0 sources; provenance and transformations: assets/sfx/CREDITS.md.
const files=(dir,names)=>names.split(',').map(n=>`assets/sfx/${dir}/${n}.ogg`);
const oga=(names)=>names.split(',').map(n=>`assets/sfx/oga-rpg/${n}.ogg`);
const ui=(names)=>({files:files('ui',names),bus:'ui',gain:.18,priority:70,group:'ui',polyphony:4,cooldown:70,maxDuration:1.6,spatial:false});
const rpg=(names,gain=.28)=>({files:files('rpg',names),gain,priority:45,group:'action',polyphony:8,cooldown:110,distance:650});
const impact=(name,gain=.26)=>({files:files('impact',`${name}_000,${name}_001,${name}_002`),gain,priority:50,group:'impact',polyphony:6,cooldown:110,distance:620});
const recordedSteps=(name,gain=.13)=>({files:files('footsteps',`${name}-1,${name}-2,${name}-3`),gain});
const streetFoley=(names,gain,options={})=>({
 files:files('rpg',names),gain,alleyStreet:true,group:'alley-foley',priority:16,polyphony:3,
 cooldown:180,distance:180,maxDuration:.55,...options,
});
export const CUES={
 energyBladeIgnite:{synthesis:'ignite',gain:.12,group:'energy-blade',priority:36,polyphony:3,cooldown:260,distance:310,maxDuration:.43},
 energyBladeSwing:{synthesis:'swing',gain:.19,group:'energy-blade',priority:46,polyphony:4,cooldown:110,distance:420,maxDuration:.24},
 energyBladeHit:{synthesis:'hit',gain:.19,group:'impact',priority:52,polyphony:4,cooldown:125,distance:420,maxDuration:.14},
 zonkoFireworkLaunch:{...rpg('cloth3,cloth4',.19),rate:1.24,distance:480,maxDuration:.36},
 zonkoFireworkBurst:{...impact('impactWood_heavy',.29),rate:.87,distance:740,maxDuration:.75},
 rifle:impact('impactMetal_heavy',.5),stalkerStep:impact('footstep_grass',.22),
 pirateCannon:{...impact('impactMining',.46),rate:.58,lowpass:1600,distance:1450,cooldown:180,maxDuration:1.1},
 crocodileTick:{files:files('ui','tick_001'),gain:.2,rate:.86,group:'ship-clock',priority:24,polyphony:1,cooldown:420,distance:580,maxDuration:.2},
 crocodileTock:{files:files('ui','tick_004'),gain:.19,rate:.68,group:'ship-clock',priority:24,polyphony:1,cooldown:420,distance:580,maxDuration:.22},
 stalkerBreath:{files:['assets/sfx/creatures/snarl.ogg'],gain:.09,rate:.55,maxDuration:1.1},
 focus:ui('select_001,select_002'),click:ui('click_001,click_002'),back:ui('back_001'),error:ui('error_003'),join:ui('confirmation_001'),ready:ui('confirmation_002'),save:ui('confirmation_003'),
 attack:rpg('knifeSlice,knifeSlice2'),bow:rpg('cloth1,cloth2'),magic:ui('glass_001,glass_002'),hit:impact('impactPunch_medium'),shield:impact('impactMetal_medium'),hurt:impact('impactPunch_heavy'),
 bladeContact:{files:oga('blade_01,blade_02'),gain:.19,priority:55,group:'impact',polyphony:4,cooldown:100,distance:590,maxDuration:.55},
 roll:impact('impactWood_light'),event:ui('bong_001'),trap:rpg('metalLatch'),heal:ui('glass_003'),defeat:impact('impactSoft_heavy'),dodge:rpg('cloth3,cloth4'),dashWhoosh:{files:files('rpg','cloth3,cloth4'),gain:.18,rate:.62,maxDuration:.32,bus:'sfx',priority:52,group:'movement',polyphony:4,cooldown:140,distance:620},win:ui('confirmation_004'),lose:ui('error_008'),
 loot:rpg('handleCoins,handleCoins2'),drop:rpg('dropLeather'),equip:rpg('beltHandle1,beltHandle2'),inventory:rpg('bookOpen'),close:rpg('bookClose'),doorOpen:rpg('doorOpen_1,doorOpen_2'),doorClose:rpg('doorClose_1,doorClose_2'),
 harvest:rpg('chop'),mine:impact('impactMining'),fall:impact('impactWood_heavy'),wallBreak:impact('impactWood_heavy',.34),treeBreak:impact('impactWood_heavy',.42),rockBreak:impact('impactMining',.4),hatch:impact('impactGlass_light'),glassBreak:impact('impactGlass_heavy',.38),web:rpg('clothBelt'),portal:ui('maximize_005'),
 level:{files:['assets/sfx/ui/level-up.wav'],bus:'ui',gain:.2,priority:80,group:'progression',polyphony:1,cooldown:650,maxDuration:.72,spatial:false},
 grass:impact('footstep_grass',.13),wood:impact('footstep_wood',.13),snow:impact('footstep_snow',.13),stone:impact('footstep_concrete',.11),carpet:impact('footstep_carpet',.13),
 sand:recordedSteps('sand'),water:recordedSteps('water',.19),mud:recordedSteps('mud',.15),dirt:recordedSteps('dirt'),gravel:recordedSteps('gravel'),ice:recordedSteps('ice'),tile:recordedSteps('tile'),slide:ui('scratch_001'),
 wind:{files:['assets/sfx/ambience/wind.wav'],bus:'ambience',gain:.15},rain:{files:['assets/sfx/ambience/rain.ogg'],bus:'ambience',gain:.18},forest_ambient:{files:['assets/sfx/ambience/forest_ambient_20s_loop.wav'],bus:'ambience',gain:.10},
 alley_ambient:{files:['assets/sfx/ambience/wind.wav'],bus:'ambience',gain:.047,lowpass:2400},
 alleyClock:streetFoley('metalClick',.09,{rate:.9,distance:145,maxDuration:.24}),
 alleyPages:streetFoley('bookFlip1,bookFlip2,bookFlip3',.085,{distance:145}),
 alleyCloth:streetFoley('cloth1,cloth2',.07,{rate:.74,distance:175}),
 alleyPerch:streetFoley('cloth3,cloth4',.085,{rate:1.24,distance:175,maxDuration:.3}),
 alleyPost:streetFoley('metalLatch,metalClick',.09,{distance:170}),
 alleyKettle:streetFoley('metalPot1,metalPot2,metalPot3',.11,{rate:1.05,distance:220}),
 alleyStep:streetFoley('footstep00,footstep01,footstep03,footstep04',.085,{distance:140,maxDuration:.34}),
 desert_ambient:{files:['assets/sfx/ambience/desert-wind-06.mp3'],bus:'ambience',gain:.075,maxDuration:8},
 ice_ambient:{files:['assets/sfx/ambience/blizzard-wind-04.wav'],bus:'ambience',gain:.11},
 beach_ambient:{files:['assets/sfx/ambience/beach_waves_01.flac','assets/sfx/ambience/beach_waves_02.flac'],bus:'ambience',gain:.08},
 swamp_ambient:{files:['assets/sfx/ambience/swamp.ogg'],bus:'ambience',gain:.09},
 cave_ambient:{files:['assets/sfx/ambience/dungeon_ambient_1_0.ogg'],bus:'ambience',gain:.08},
 temple_ambient:{files:['assets/sfx/ambience/dungeon_ambient_1_0.ogg'],bus:'ambience',gain:.055,rate:.92,lowpass:2200},
 house_ambient:{files:['assets/sfx/ambience/room-tone-54.wav'],bus:'ambience',gain:.055},
 graveyard_ambient:{files:['assets/sfx/ambience/horror-wind-whisper-38.wav'],bus:'ambience',gain:.055,maxDuration:6},
 shadow_ambient:{files:['assets/sfx/ambience/night-ambience-01.wav'],bus:'ambience',gain:.07},
 jump:rpg('cloth1,cloth2',.13),land:impact('impactSoft_medium',.21),splash:{...recordedSteps('water',.26),rate:.84,group:'movement',priority:40,cooldown:200,distance:420,maxDuration:.55},
 repair:impact('impactMetal_light',.13),repairDone:ui('confirmation_003'),engineStart:impact('impactMetal_heavy',.22),engineRun:impact('impactMetal_light',.08),carHit:impact('impactMetal_heavy',.28),death:impact('impactSoft_heavy',.3),
};
// Explicit action aliases let custom controller/canvas UI share the same polished
// UI bus as DOM controls without silently dropping the game's generic `ui` calls.
CUES.ui=CUES.click;
CUES.confirm=ui('confirmation_001,confirmation_002');
CUES.cancel=CUES.back;
CUES.menuError=CUES.error;
CUES.flight={files:['assets/sfx/dragon2/flap.ogg'],bus:'sfx',gain:.12,rate:.72,maxDuration:.65,group:'movement',priority:25,polyphony:2,cooldown:260,distance:420};
CUES.broomFlight={files:files('rpg','cloth3,cloth4'),bus:'sfx',gain:.08,rate:.62,maxDuration:.32,group:'movement',priority:24,polyphony:2,cooldown:520,distance:420};
CUES.vault=CUES.jump;
CUES.climb=rpg('cloth1,cloth2',.16);
CUES.mount=rpg('cloth1,cloth2',.18);
CUES.dismount=CUES.land;
CUES.craftStart=impact('impactMetal_light',.18);
CUES.craftComplete=ui('confirmation_003,confirmation_004');
CUES.purchase=rpg('handleCoins,handleCoins2',.2);
CUES.sell=rpg('handleCoins,handleCoins2',.16);
CUES.questAccept=ui('confirmation_002,confirmation_003');
CUES.questUpdate=ui('select_001,select_002');
CUES.discovery=ui('maximize_005,bong_001');
CUES.checkpoint=CUES.portal;
CUES.puzzleSwitch=ui('click_001,click_002');
CUES.puzzleSolved=ui('confirmation_004');
CUES.puzzleFailed=CUES.error;
CUES.buildPlace=impact('impactWood_light',.18);
CUES.buildRemove=impact('impactWood_medium',.2);
CUES.buildRotate=ui('click_001,click_002');
CUES.buildPaint=ui('click_001,click_002');
CUES.vehicleSkid=rpg('footstep08,footstep09',.18);
CUES.bossPhase=ui('bong_001');
CUES.rescue=CUES.win;
// Share the player footstep voice budget across every surface.
for(const name of ['grass','wood','snow','sand','water','stone','mud','dirt','gravel','ice','tile','carpet','stalkerStep'])Object.assign(CUES[name],{group:'footstep',priority:15,polyphony:4,cooldown:190,distance:300,maxDuration:.45});
for(const name of ['attack','bow','magic','rifle'])Object.assign(CUES[name],{bus:'sfx',group:'weapon',priority:65,polyphony:6,cooldown:100,spatial:true,distance:650});
for(const name of ['hurt','death','defeat','shield'])Object.assign(CUES[name],{priority:85,group:'critical',polyphony:6,cooldown:180});
for(const name of ['event','win','lose','repairDone'])Object.assign(CUES[name],{priority:95,group:'notification',polyphony:3,cooldown:550});
Object.assign(CUES.jump,{group:'movement',priority:35,cooldown:200,maxDuration:.4});
Object.assign(CUES.land,{group:'movement',priority:40,cooldown:220,maxDuration:.45});
Object.assign(CUES.repair,{group:'repair',priority:30,cooldown:420,maxDuration:.35,distance:220});
Object.assign(CUES,ENCOUNTER_CUES);
CUES.dragonBreath={files:['assets/sfx/dragon2/breath.ogg'],gain:.3,priority:65,cooldown:400,distance:750};
CUES.swing=CUES.attack;
// Twenty-three newly integrated CC0 clips add material and creature variation.
CUES.attack.files.push(...oga('blade_01,blade_02,blade_03'));
CUES.inventory.files.push(...oga('book_01'));
CUES.doorOpen.files.push(...oga('chain_01,lock_01'));
CUES.doorClose.files.push(...oga('lock_02'));
CUES.loot.files.push(...oga('item_gem_01,item_gem_02'));
CUES.mine.files.push(...oga('item_stone_01'));
CUES.wallBreak.files.push(...oga('item_wood_01'));
CUES.treeBreak.files.push(...oga('wood_01'));
CUES.shield.files.push(...oga('metal_01'));
CUES.magic.files.push(...oga('spell_fire_01'));
CUES.coin={files:oga('item_coins_01,item_coins_02'),bus:'sfx',gain:.24,group:'reward',priority:55,polyphony:6,cooldown:90,distance:520,maxDuration:.9};
CUES.lobbyBell={...impact('impactBell_heavy',.15),rate:1.7,maxDuration:.75,cooldown:200};
CUES.lobbyKick={...impact('impactSoft_heavy',.13),rate:1.32,maxDuration:.32};
CUES.pickup={files:oga('item_misc_01'),bus:'sfx',gain:.22,group:'reward',priority:45,polyphony:6,cooldown:100,distance:520,maxDuration:.9};
CUES.chestOpen={files:oga('item_wood_01,lock_01,lock_02'),bus:'sfx',gain:.24,group:'interaction',priority:50,polyphony:4,cooldown:220,distance:520,maxDuration:1.1};
CUES.woodBreak={files:oga('item_wood_01,wood_01'),bus:'sfx',gain:.3,group:'impact',priority:50,polyphony:5,cooldown:100,distance:620,maxDuration:.8};
CUES.creatureStep={files:oga('creature_misc_01'),bus:'sfx',gain:.11,group:'footstep',priority:12,polyphony:4,cooldown:180,distance:360,maxDuration:.45};
export const FAMILIES={gorilla:[9,.65],lion:[1,.75],tiger:[1,.7],white_lion:[1,.66],panther:[2,.85],snow_leopard:[2,.78],wolf:[3,1],crocodile:[4,.65],boar:[5,.9],snake:[6,1.5],bat:[7,1.9],beetle:[8,1.6],wasp:[8,2.2],bee:[8,2.3],vine:[6,.65],golem:[9,.5],monkey:[0,1],skeleton:[10,1.1],skeleton_unarmed:[10,1.2],skeleton_boss:[10,.65],archer:[10,1.05],skeleton_wizard:[10,.85],rhino:[5,.6],dragon:[9,.55],fire_elemental:[6,.65],spider:[8,1.25],baby_spider:[8,1.8],spider_egg:[8,.8]};
Object.assign(FAMILIES,{fox:[3,1.6],shore_goblin:[6,1.35],dreadmane_lion:[1,.6],oathless_captain:[10,.8],grim_reaper:[10,.55],banshee_queen:[6,.72],succubus:[6,.9],imp:[0,1.45],zombie:[9,.8],tarantula:[8,.85],anaconda:[6,.5],tsetse:[8,2.5],water_elemental:[6,1.1],frost_skeleton_mage:[10,.8],hunter:[10,1],night_stalker:[2,.75],carrion_pack:[3,.85],burrower:[9,.65],mimic_vine:[6,.8],carnivorous_flower:[6,.7],poison_pod:[8,.7],elephant:[9,.45],zebra:[5,1.1],pelican:[7,1.1],bee_hive:[8,.65]});
export function creatureCue(kind,action){
 const cue=creatureRecording(kind,action);
 const supplemental=action==='death'?oga('creature_die_01'):action==='hurt'?oga('creature_hurt_01,creature_hurt_02'):action==='spawn'?oga('creature_misc_01'):action==='attack'?oga('creature_monster_01'):[];
 if(/slime|squashling/i.test(kind))supplemental.push(...oga('creature_slime_01'));
 cue.files.push(...supplemental);
 return {...cue,bus:'sfx',group:action==='death'?'critical':'creature',priority:action==='death'?85:action==='spawn'?25:action==='hurt'?60:55,
   polyphony:action==='death'?6:4,cooldown:action==='spawn'?1800:action==='hurt'?240:360,distance:action==='spawn'?420:620,key:`creature:${kind}:${action}`};
}
function creatureRecording(kind,action){
 if(kind==='dragon')return {files:['assets/sfx/dragon2/'+(action==='spawn'?'flap':action==='hurt'?'hurt':action==='death'?'death':'attack')+'.ogg'],rate:1,gain:.28,maxDuration:action==='death'?4:2};
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
 const [n,rate]=FAMILIES[kind]||[10,1];
 let sources=n?[`assets/sfx/creatures/monster-${n}.wav`]:files('creatures','monkey-1,monkey-2,monkey-3');
 if(n===8)sources=files('creatures','tiny0,tiny1,tiny2');
 if(n===10&&action!=='spawn')sources=files('impact',action==='death'?'impactPlate_heavy_000,impactPlate_heavy_001':'impactMetal_light_000,impactMetal_light_001');
 if(action==='attack'&&n===1)sources=['assets/sfx/creatures/snarl.ogg'];
 return {files:sources,rate:rate*(action==='death'?.75:action==='hurt'?1.15:1),gain:action==='spawn'?.28:.2,maxDuration:action==='spawn'?2:action==='death'?1.8:.75};
}
// Only bundled recordings may enter the decoder cache; custom cue objects still work.
export const SOUND_FILES=new Set(Object.values(CUES).flatMap(c=>c.files??[]));
for(const kind of [...Object.keys(FAMILIES),'unknown'])for(const action of ['spawn','attack','hurt','death','windup','swoop','swipe','bite'])for(const file of creatureCue(kind,action).files)SOUND_FILES.add(file);
