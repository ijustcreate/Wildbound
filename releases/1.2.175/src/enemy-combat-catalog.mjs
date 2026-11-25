// Explicit combat identities. Bespoke controllers keep their authored moves;
// this contract adds species-specific reactions, openings and readable timing.
const groups={
  predator:['lion','tiger','white_lion','panther','snow_leopard','wolf','murk_wolf','dreadmane_lion','night_stalker','carrion_pack','werewolf','fox','arctic_fox'],
  rush:['crocodile','boar','rhino','elephant','zebra','triceratops'],
  serpent:['snake','anaconda','burrower'],
  insect:['bat','raven','crow','beetle','wasp','bee','tsetse','scorpion','jumping_spider','spider','tarantula','baby_spider','crab','pelican','great_owl','flying_raptor'],
  plant:['vine','carnivorous_flower','mimic_vine','poison_pod','tree_ent','spore','forest_golem'],
  fighter:['skeleton','skeleton_unarmed','skeleton_boss','krampus','zombie','monkey','gorilla','hunter','shore_goblin','oathless_captain','grim_reaper','evil_hand','archangel','skeleton_deckhand','ogre','jimothy','enchanted_broom','cave_monster'],
  caster:['archer','skeleton_caster','necromancer','skeleton_wizard','frost_skeleton_mage','banshee_queen','succubus','imp','ghost','beholder','lesser_beholder','arcane_eye','watcher','eye_tentacle','jade_tentacle','blaise','voodoo_doll','enchanted_book','mindflayer','succubus_2'],
  heavy:['golem','crystal_golem','mana_golem','dragon','butterfly_dragon','scorpion_boss','fire_elemental','water_elemental','slime','squashling','gargoyle'],
  nest:['bee_hive','spider_egg','mausoleum'],
};
const signatures={burrower:'burrowing emergence bite',gargoyle:'stone-wing dive',
 lion:'springing pounce',tiger:'crossing rake',white_lion:'long snowbound leap',panther:'stalk, pounce and alternating claws',snow_leopard:'crouched flank pounce',wolf:'pack lunge',murk_wolf:'shadow pack bite',dreadmane_lion:'roar and committed rush',night_stalker:'shadow ambush',carrion_pack:'scavenger pack rush',werewolf:'leap and claw chain',fox:'darting bite',arctic_fox:'warning snap',
 crocodile:'short jaw surge',boar:'straight tusk rush',rhino:'horn charge',elephant:'heavy trunk strike',zebra:'hind-leg kick',triceratops:'territorial horn drive',snake:'coiled needle strike',anaconda:'body sweep and constriction',bat:'passing wing dive',raven:'swoop and peel-away',crow:'circling peck',beetle:'braced mandible bite',wasp:'sting-and-pass',bee:'hive-defense sting',tsetse:'sleeping dart dive',scorpion:'raised-tail sting',jumping_spider:'committed jumping bite',spider:'web hunt and fanged lunge',tarantula:'heavy web bite',baby_spider:'short skitter bite',crab:'sideways pincer snap',pelican:'passing beak swoop',great_owl:'talon pass',flying_raptor:'locked diving slash',
 vine:'rooted forward lash',carnivorous_flower:'open-jaw bite',mimic_vine:'disguised grab',poison_pod:'poison burst',tree_ent:'branch slam',spore:'rooted spore eruption',forest_golem:'root snare',skeleton:'measured sword cut',skeleton_unarmed:'left-right fist chain',skeleton_boss:'guarded heavy cut',krampus:'whip crack',zombie:'dragging grab',monkey:'snatch and escape',gorilla:'fist slam',hunter:'tracking weapon strike',shore_goblin:'sand-side slash',oathless_captain:'bash and boarding rush',grim_reaper:'scythe sweep and drain',evil_hand:'finger pounce and grab',archangel:'radiant guard strike',skeleton_deckhand:'cutlass slash',ogre:'committed club slam',jimothy:'sidestep feint',enchanted_broom:'sweeping pass',cave_monster:'armored pounce',
 archer:'committed bow draw',skeleton_caster:'healing channel',necromancer:'summon and heal',skeleton_wizard:'charged spell volley',frost_skeleton_mage:'frost channel',banshee_queen:'frost flight and scream',succubus:'heart bolt and life drain',imp:'flying fire shot',ghost:'phase and spectral swipe',beholder:'alternating eye rays',lesser_beholder:'single eye-ray pulse',arcane_eye:'locked gaze beam',watcher:'rooting gaze',eye_tentacle:'anchored long lash',jade_tentacle:'orbiting linked lash',blaise:'cinder bolt and trail',voodoo_doll:'delayed curse',enchanted_book:'page volley',mindflayer:'psionic pulse',succubus_2:'gliding heart shot',
 golem:'raised stone slam',crystal_golem:'shard burst',mana_golem:'arc bolt',dragon:'breath or rear tail sweep',butterfly_dragon:'held breath fan',scorpion_boss:'claw and tail sequence',fire_elemental:'cinder shot and hot wake',water_elemental:'slow tidal pulse',slime:'squash and spring',squashling:'pumpkin body slam',bee_hive:'guarded brood release',spider_egg:'hatching brood',mausoleum:'crypt defenders',
};
const openings={predator:[1.22,'Evade the committed leap; punish the landing.'],rush:[1.28,'Sidestep the drive; punish its braking turn.'],serpent:[1.24,'Step across the locked strike; attack the uncoiling body.'],insect:[1.18,'Let the pass or sting miss; catch the turn or lowered tail.'],plant:[1.3,'Bait the lash or burst, then close while the plant resets.'],fighter:[1.2,'Step outside the weapon arc and punish the follow-through.'],caster:[1.25,'Interrupt preparation or close during spell recovery.'],heavy:[1.32,'Leave the committed impact area and punish the long reset.'],nest:[1.1,'Clear its defenders before pressuring the source.']};
const pressureWeights={beetle:.65,tree_ent:.55,golem:.55,ogre:.65,crystal_golem:.45,mana_golem:.65,forest_golem:.65,slime:1.5,zombie:.7,ghost:1.4,spore:1.4};
const openingBonuses={snake:1.25,crocodile:1.35,boar:1.28,bat:1.15,wasp:1.2,golem:1.35,water_elemental:1.25,fire_elemental:1.18,necromancer:1.3,skeleton_unarmed:1.15,skeleton_boss:1.22,tree_ent:1.35,spore:1.25,evil_hand:1.2,archangel:1.2,slime:1.3};
export const ENEMY_COMBAT_CATALOG=Object.freeze(Object.fromEntries(Object.entries(groups).flatMap(([family,kinds])=>kinds.map(kind=>[kind,Object.freeze({kind,family,attack:signatures[kind],opening:openings[family][1],openingMultiplier:openingBonuses[kind]??openings[family][0],pressureWeight:pressureWeights[kind]??(family==='heavy'?.65:family==='caster'?1.25:1),windupClip:family==='caster'?'cast':family==='serpent'?'coil':'windup',recoveryClip:'recover'})]))));
export function combatPhase(e){
  if(e.kind==='bee_hive'){if(e.broodRecovery>0)return 'recover';if(e.spawnTimer>0&&e.spawnTimer<.25)return 'windup';}
  if(e.kind==='spider_egg'&&e.hatchIn>0&&e.hatchIn<1)return 'windup';
  if(e.kind==='bee'){if(e.attack>0)return 'active';if(e.cooldown>0)return 'recover';}
  if(e.fireAction&&e.fireActionTimer>0||e.beholderRayTime>0||e.bansheeDrawLeft>0||e.ghostWindup>0||e.impWindup>0||e.succubusWindup>0)return 'windup';
  if(e.recovery>0||e.captainRecovery>0||e.shoreRecovery>0)return 'recover';
  if(['ghost','imp','succubus','banshee_queen'].includes(e.kind)&&e.attack>0)return 'active';
  if(['ghost','imp','succubus'].includes(e.kind)&&e.cooldown>0&&(e.ghostAim!==undefined||e.impWindupDuration||e.succubusWindupDuration))return 'recover';
  const raw=e.speciesCombat?.phase||e.tactics?.phase||e.constructAI?.phase||e.faunaCombat?.phase||e.night?.phase||e.wolfCombat?.phase||e.wildlifeBehaviorPhase||e.state||'idle';
  if(e.eldritchWindup>0)return 'windup';if(e.eldritchRecovery>0||e.reaperRecovery>0)return 'recover';
  if(raw==='active')return 'active';
  if(/recover|stagger|exhaust|land|rest|brak/.test(raw))return 'recover';
  if(/windup|warn|chargeup|rocklift|channel|coil|prepare/i.test(raw))return 'windup';
  if(/charge|attack|strike|swoop|dive|slam|bite|swipe|grab|lash|breath|tailSwipe/.test(raw))return 'active';
  return 'approach';
}
export function updateEnemyCombatReadability(g,dt){
  for(const e of g.enemies||[]){
    if(e.hp<=0||e.faction==='ally'||e.controlledBy||!ENEMY_COMBAT_CATALOG[e.kind])continue;
    if((e.frozen>0||e.stun>0||e.sleeping>0)&&(e.eldritchWindup>0||e.eldritchDash)){
      e.eldritchWindup=e.eldritchStrike=0;delete e.eldritchDash;e.eldritchImpactPending=false;e.eldritchRecovery=.8;e.state='recover';
    }
    if((e.frozen>0||e.stun>0)&&e.pantherContactPending)delete e.pantherContactPending;
    const phase=combatPhase(e),previous=e.enemyCombatRead;
    const timer=e.speciesCombat?.remaining??e.tactics?.remaining??e.constructAI?.timer??e.faunaCombat?.timer??e.night?.timer??(e.eldritchWindup>0?e.eldritchWindup:e.eldritchRecovery>0?e.eldritchRecovery:e.timer);
    if(previous?.phase!==phase)e.enemyCombatRead={phase,age:0,duration:Math.max(.15,Number(timer)||.65)};
    else previous.age+=dt;
  }
}
export function reactSpeciesHit(g,e,amount,type,context){
 if(!g||e.combatRole||type!=='physical')return amount;
 if(e.kind==='archangel'&&e.guard>0&&combatPhase(e)!=='recover'){
  const p=context?.p||context?.shot,dx=(p?.x??e.x)-e.x,dy=(p?.y??e.y)-e.y;
  if((dx*(e.faceX||0)+dy*(e.faceY||0))/Math.max(1,Math.hypot(dx,dy))>.35){if(context?.heavy)e.guard=0;else return Math.round(amount*.55);}
 }
 if(context?.heavy&&e.eldritchWindup>0&&g.time>=(e.enemyInterruptAt||0)&&['arcane_eye','watcher','evil_hand','spore','butterfly_dragon'].includes(e.kind)){
  e.eldritchWindup=e.eldritchStrike=0;e.eldritchImpactPending=false;e.eldritchRecovery=.9;e.enemyInterruptAt=g.time+2;e.state='recover';e.animationAction='recover';e.poseTime=0;
 }
 if(!e.speciesCombat)return amount;
 e.tacticalBlocked=false;
 const s=e.speciesCombat,p=context?.p||context?.shot;
 const dx=(p?.x??e.x)-e.x,dy=(p?.y??e.y)-e.y,d=Math.hypot(dx,dy)||1;
 const front=(dx*(e.faceX||0)+dy*(e.faceY||0))/d>.35;
 if(context?.heavy&&s.phase==='windup'&&g.time>=(s.interruptedUntil||0)){
  s.phase='recover';s.remaining=s.duration=e.kind==='beetle'?1.2:.85;s.interruptedUntil=g.time+2;
  e.state='recover';e.timer=e.motionDuration=s.duration;e.enemyFlinchUntil=g.time+.1;return amount;
 }
 if(front&&s.phase==='approach'&&['beetle','skeleton_boss'].includes(e.kind)){e.tacticalBlocked=true;e.guardFlash=.16;return Math.max(1,Math.round(amount*(context?.heavy?.8:e.kind==='beetle'?.65:.45)));}
 return amount;
}
export function speciesOpeningDamage(g,e,amount){
  if(!g||e.combatRole||e.practiceTarget||!ENEMY_COMBAT_CATALOG[e.kind])return amount;
  if(combatPhase(e)!=='recover')return amount;
  return Math.round(amount*ENEMY_COMBAT_CATALOG[e.kind].openingMultiplier);
}
