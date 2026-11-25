import {ALLEY_SHOP_ROOMS,mirroredShopPoint,shopCutawayOpen} from './diagon-shop-rooms.mjs';
import {dropStolenHeart,stolenHeartMetadata,stolenHeartOwnerKey} from './stolen-heart.mjs';
import {emitGameplayFx} from './gameplay-fx.mjs';
import {RETURNED_HEART_GLOW_SECONDS} from './returned-heart-glow.mjs';

export const BORGIN_MIRROR_SHOP='borgin-burkes';
export const BORGIN_MIRROR_ASSET='borgin-uneasy-mirror';
export const MIRROR_STARE_SECONDS=30;
export const MIRROR_EMERGENCE_SECONDS=.9;
const mirrorAsset=()=>ALLEY_SHOP_ROOMS[BORGIN_MIRROR_SHOP].props.find(prop=>prop.id===BORGIN_MIRROR_ASSET);
const watches=new WeakMap();
const active=g=>g.trainTest?.design.activeRoom==='diagon';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const current=p=>p.npcQuests?.borginMirror;
const actorFor=(g,key)=>g.players.find(p=>stolenHeartOwnerKey(p)===key);
const wasIssued=(g,p)=>!!(current(p)?.heartIssued||g.trainTest?.borginMirrorClaims?.[stolenHeartOwnerKey(p)]);

export function borginMirrorPoint(shop,asset=mirrorAsset()){
 return mirroredShopPoint(shop,asset);
}

function canSeeMirror(p,mirror,shop){
 const dy=p.y-mirror.y;
 return p.hp>0&&!p.room&&!p.swimming&&!p.trainRide&&!p.vehicleId&&!p.broomMount&&!p.controlledFollowerId&&!p.disconnected&&
  dy>=12&&dy<=72&&Math.abs(p.x-mirror.x)<=28&&shopCutawayOpen(shop,[p]);
}

function gazing(p,mirror){
 if(p.ui||p.moving||p.attack>0||p.charge>0||p.jumpHeight>2||p.stun>0||p.frozen>0)return false;
 const fx=p.faceX||0,fy=p.faceY??1;
 return (fx*(mirror.x-p.x)+fy*(mirror.y-p.y))/Math.max(1,distance(mirror,p)*Math.hypot(fx,fy))>=.78;
}

function story(p){
 return {watch:watches.get(p),resting:current(p)?.atRest};
}

export function borginMirrorView(g,shop,asset=mirrorAsset()){
 if(!active(g)||shop?.id!==BORGIN_MIRROR_SHOP)return null;
 const point=borginMirrorPoint(shop,asset),encounter=g.trainTest.borginMirrorFight;
 if(encounter?.phase==='emerging'){
  const viewer=actorFor(g,encounter.owner);
  if(viewer)return {viewer,skeletal:true,heart:encounter.heart,progress:1,
   emergence:Math.min(1,encounter.elapsed/MIRROR_EMERGENCE_SECONDS)};
 }
 let viewer=null,best=Infinity;
 for(const hero of g.players){
  if(!canSeeMirror(hero,point,shop))continue;
  const span=distance(hero,point);
  if(span<best){viewer=hero;best=span;}
 }
 if(!viewer)return null;
 const {watch,resting}=story(viewer),elapsed=watch?.seconds||0;
 const heart=!wasIssued(g,viewer);
 const sameFight=encounter?.phase==='fight'&&encounter.owner===stolenHeartOwnerKey(viewer);
 return {viewer,skeletal:!resting&&!sameFight&&(heart||elapsed>=1.35),heart,progress:elapsed/MIRROR_STARE_SECONDS,emergence:null};
}

function startEncounter(g,hero){
 const metadata=stolenHeartMetadata(hero);
 g.trainTest.borginMirrorFight={phase:'emerging',owner:stolenHeartOwnerKey(hero),metadata,
  elapsed:0,heart:!wasIssued(g,hero)};
 for(const p of g.players)watches.delete(p);
 g.onSound?.('magic',hero);
 g.message?.('Your reflection takes a step toward the glass.');
 g.persist?.();
}

function wakeReflection(g,encounter,point,shop){
 const hero=actorFor(g,encounter.owner);
 if(!hero){delete g.trainTest.borginMirrorFight;return;}
 const home=[35,29,45,53].map(dy=>({x:point.x,y:point.y+dy})).find(q=>
  shopCutawayOpen(shop,[q])&&!g.blocked(q.x,q.y,7,false,false,false,0,0,false,q));
 if(!home){delete g.trainTest.borginMirrorFight;return;}
 const id=g.nextId++,maxHp=Math.max(88,Math.min(210,Math.round((hero.maxHp||150)*.65)));
 const actor={id,group:id,...home,homeX:home.x,homeY:home.y,kind:'skeleton_unarmed',sprite:'skeleton_unarmed',
  name:hero.name+'’s Reflection',borginReflection:true,mirrorOwner:encounter.owner,mirrorHeartVisible:encounter.heart,
  mirrorReward:encounter.metadata,faction:'enemy',hp:maxHp,maxHp,speed:62,damage:18,state:'hunt',aggro:true,
  cooldown:.6,step:0,faceX:0,faceY:1,flash:0,timer:0,tacticTime:1,orbit:1,equipment:{}};
 encounter.phase='fight';encounter.actor=actor;
 g.enemies.push(actor);
 emitGameplayFx(g,'magic',home,{scale:.6,life:.27});
 g.onSound?.('growl',actor);
 g.persist?.();
}

export function tickBorginMirror(g,shop,dt){
 if(!active(g)||!shop)return;
 const point=borginMirrorPoint(shop),encounter=g.trainTest.borginMirrorFight;
 for(const hero of g.players){
  if(canSeeMirror(hero,point,shop))continue;
  watches.delete(hero);
  const quest=current(hero);
  if(quest?.atRest)delete quest.atRest;
 }
 if(encounter?.phase==='fight'){
  const restored=g.enemies.find(e=>e.id===encounter.actor?.id&&e.borginReflection);
  if(restored)encounter.actor=restored;
  else if(encounter.actor?.hp>0)g.enemies.push(encounter.actor);
  if(encounter.actor)g.nextId=Math.max(g.nextId,encounter.actor.id+1);
  return;
 }
 if(encounter?.phase==='emerging'){
  encounter.elapsed+=dt;
  if(encounter.elapsed+1e-5>=MIRROR_EMERGENCE_SECONDS)wakeReflection(g,encounter,point,shop);
  return;
 }
 for(const hero of g.players){
  if(!canSeeMirror(hero,point,shop))continue;
  const {watch,resting}=story(hero);
  if(resting||!gazing(hero,point)){watches.delete(hero);continue;}
  const seconds=(watch?.seconds||0)+Math.min(.1,Math.max(0,dt));
  if(seconds+1e-5>=MIRROR_STARE_SECONDS){startEncounter(g,hero);return;}
  watches.set(hero,{seconds});
 }
}

export function borginReflectionTargets(g,targets,shop){
 if(!active(g)||!shop)return [];
 return targets.filter(p=>shopCutawayOpen(shop,[p]));
}

export function settleBorginReflection(g,e){
 if(!e.borginReflection)return false;
 const t=g.trainTest,encounter=t?.borginMirrorFight;
 const owner=actorFor(g,e.mirrorOwner);
 if(owner){
  const quest=(owner.npcQuests??={}).borginMirror??={};
  quest.atRest=true;
  if(e.mirrorHeartVisible)quest.heartIssued=true;
 }
 if(t&&e.mirrorHeartVisible&&!t.borginMirrorClaims?.[e.mirrorOwner]){
  (t.borginMirrorClaims??={})[e.mirrorOwner]=true;
  dropStolenHeart(g,e.x,e.y+8,e.mirrorReward);
 }
 e.defeated=true;e.deathTimer=0;e.animationAction='death';e.state='death';e.moving=false;e.mirrorHeartVisible=false;
 if(encounter?.actor?.id===e.id)delete t.borginMirrorFight;
 g.onSound?.('magic',e);
 g.message?.('The glass clears. The reflection looking back is yours again.');
 g.persist?.();
 return true;
}

export function restoreBorginHeart(g,p){
 const quest=current(p);
 if(quest){delete quest.heartIssued;delete quest.atRest;}
 watches.delete(p);
 (p.field??={}).returnedHeartGlow=RETURNED_HEART_GLOW_SECONDS;
 emitGameplayFx(g,'magic',p,{targetId:p.id,life:.7,scale:.85});
 g.onSound?.('heal',p);
}
