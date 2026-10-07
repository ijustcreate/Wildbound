import {BANSHEE_EQUIPMENT,stat} from './items.mjs';
import {enemyQuiver,retrieveEnemyArrows} from './arrow-supplies.mjs';
import {clearShot,navigateEnemy} from './navigation.mjs';
import {bowHandleWorld} from './player-motion.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {bansheeVisualActor,bansheeMotion} from './banshee-motion.mjs';

// Append-only event registration keeps every existing saved event index intact.
export const BANSHEE_EVENT=Object.freeze({name:'The Banshee Queen',kind:'banshee_queen',count:6,hp:340,speed:44,damage:24,weight:8,
 squad:['banshee_queen','skeleton','skeleton','skeleton','skeleton_unarmed','skeleton_unarmed'],
 verse:'A torn cloak whispers through the trees.\nFive silent bones attend their queen.',tip:'Dodge her drawn bow, clear the five skeletal guards, and claim the Banshee set.'});
export function initializeBansheeQueen(e){e.equipment={...BANSHEE_EQUIPMENT,...e.equipment};e.startingArrows??=36;e.arrowsLeft??=e.startingArrows;e.boss=true;}
export function tickBansheeQueen(g,e,p,dt,stats={},beh={}){
 if(e.hp<=0||e.frozen>0||e.faction==='ally')return;
 if(e.state==='snared'){
  e.bansheeDrawLeft=0;e.bansheeAim=null;e.timer-=dt;if(e.timer<=0)e.hp=0;return;
 }
 if(e.flash>0){e.bansheeDrawLeft=0;e.bansheeAim=null;e.cooldown=Math.max(e.cooldown||0,.6);return;}
 enemyQuiver(e);
 if(retrieveEnemyArrows(g,e,dt)){e.bansheeDrawLeft=0;e.bansheeAim=null;return;}
 const d=Math.hypot(p.x-e.x,p.y-e.y)||1,canShoot=d<=(stats.rangedRange||420)&&clearShot(g,e,p);
 if(!canShoot){e.bansheeDrawLeft=0;e.bansheeAim=null;if(beh.hunt!==false)navigateEnemy(g,e,p,dt);return;}
 if(e.bansheeDrawLeft>0){
  e.bansheeDrawLeft=Math.max(0,e.bansheeDrawLeft-dt);
  if(e.bansheeDrawLeft===0&&e.bansheeAim&&e.arrowsLeft>0){
   const tip=bowHandleWorld(bansheeVisualActor({...e,charge:1.2,bowAiming:true}),g.time,bansheeMotion,PLAYER_RENDER_SIZE),z=18;
   g.arrows.push({id:g.nextId++,x:tip.x,y:tip.y+z,z,vx:e.bansheeAim.x*300,vy:e.bansheeAim.y*300,vz:45,damage:e.damage,hostile:true,ammoType:'arrow',shaftLength:24});
   e.arrowsLeft--;e.attack=.34;e.cooldown=stats.rangedCooldown||2.4;e.bansheeAim=null;g.onSound?.('bow',e);
  }
  return;
 }
 e.faceX=(p.x-e.x)/d;e.faceY=(p.y-e.y)/d;
 if(e.cooldown<=0&&e.arrowsLeft>0){e.bansheeDrawDuration=stats.windup||.8;e.bansheeDrawLeft=e.bansheeDrawDuration;e.bansheeAim={x:e.faceX,y:e.faceY};return;}
 if(d<145&&beh.hunt!==false)g.moveActor(e,-e.faceX*35*dt,-e.faceY*35*dt);
}
export const bansheeArrowBonus=p=>({bansheeFreezeChance:Math.max(0,Math.min(1,stat(p,'arrowFreezeChance')))});
// Bonus is snapshotted at release and rolled once per projectile on a real enemy.
export function bansheeArrowImpact(g,a,target){
 if(a.bansheeFreezeRolled||a.hostile||target.practiceTarget||target.hp<=0||['ally','neutral'].includes(target.faction)||!g.enemies.includes(target)||!(a.bansheeFreezeChance>0))return false;
 a.bansheeFreezeRolled=true;
 if(g.random()>=a.bansheeFreezeChance)return false;
 target.frozen=Math.max(target.frozen||0,1.5);return true;
}
