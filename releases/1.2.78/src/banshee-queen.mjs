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
export const BANSHEE_DASH_COOLDOWN=8,BANSHEE_FROST_COOLDOWN=12,BANSHEE_FROST_CHARGE=1.8;
export function cancelBansheeSkill(e){e.bansheeDrawLeft=0;e.bansheeAim=null;e.bansheeFrostCharge=false;e.bansheeDashLeft=0;}
function releaseQueenArrows(g,e,spread=false,frost=false){
 if(!e.bansheeAim||e.arrowsLeft<(spread?3:1))return;
 const tip=bowHandleWorld(bansheeVisualActor({...e,charge:1.2,bowAiming:true}),g.time,bansheeMotion,47),z=18;
 const base=Math.atan2(e.bansheeAim.y,e.bansheeAim.x),speed=frost?380:300;
 for(const offset of spread?[-.2,0,.2]:[0]){
  const angle=base+offset;
  g.arrows.push({id:g.nextId++,x:tip.x,y:tip.y+z,z,vx:(offset?Math.cos(angle):e.bansheeAim.x)*speed,vy:(offset?Math.sin(angle):e.bansheeAim.y)*speed,vz:frost?0:45,...(frost?{gravity:0,bansheeFrost:true,rangeLeft:460}:{}),damage:e.damage,hostile:true,owner:e.id,ammoType:'arrow',shaftLength:24});
  e.arrowsLeft--;
 }
 e.attack=.34;e.cooldown=2.4;e.bansheeAim=null;e.bansheeFrostCharge=false;g.onSound?.('bow',e);
}
export function tickBansheeQueen(g,e,p,dt,stats={},beh={}){
 e.bansheeDashCooldown=Math.max(0,(e.bansheeDashCooldown||0)-dt);
 e.bansheeFrostCooldown=Math.max(0,(e.bansheeFrostCooldown||0)-dt);e.moving=false;
 if(e.hp<=0||e.frozen>0||e.stun>0||e.faction==='ally'){e.stun=Math.max(0,(e.stun||0)-dt);cancelBansheeSkill(e);return;}
 if(e.state==='snared'){cancelBansheeSkill(e);e.timer-=dt;if(e.timer<=0)e.hp=0;return;}
 if(e.flash>0){cancelBansheeSkill(e);e.cooldown=Math.max(e.cooldown||0,.6);return;}
 if(!p||p.hp<=0||p.room){cancelBansheeSkill(e);e.bansheeSafeTime=0;return;}
 enemyQuiver(e);
 const d=Math.hypot(p.x-e.x,p.y-e.y)||1,canShoot=d<=(stats.rangedRange||420)&&clearShot(g,e,p);
 // Every nearby player counts, even when the current aim is a farther target.
 const close=(g.players||[p]).filter(q=>q.hp>0&&!q.room).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0]||p;
 const closeD=Math.hypot(close.x-e.x,close.y-e.y)||1;
 e.bansheeSafeTime=closeD>=180&&canShoot?(e.bansheeSafeTime||0)+dt:0;
 if(e.bansheeDashLeft>0){
  const elapsed=Math.min(dt,e.bansheeDashLeft);e.bansheeDashLeft=Math.max(0,e.bansheeDashLeft-dt);
  let remaining=380*elapsed;while(remaining>0){const step=Math.min(6,remaining),moved=g.moveActor(e,e.bansheeRetreat.x*step,e.bansheeRetreat.y*step);remaining-=step;if(moved<step*.3){e.bansheeDashLeft=0;break;}e.moving=true;}
  if(e.bansheeDashLeft===0){e.bansheeAim={x:e.faceX,y:e.faceY};if(clearShot(g,e,p)&&beh.ranged!==false)releaseQueenArrows(g,e,true);else e.bansheeAim=null;}
  return;
 }
 if(closeD<125&&e.bansheeDashCooldown<=0&&beh.dash!==false){
  cancelBansheeSkill(e);e.bansheeDashCooldown=stats.dashCooldown||BANSHEE_DASH_COOLDOWN;e.bansheeDashLeft=.32;
  e.faceX=(close.x-e.x)/closeD;e.faceY=(close.y-e.y)/closeD;e.bansheeRetreat={x:-e.faceX,y:-e.faceY};e.bansheeSafeTime=0;return;
 }
 if(!canShoot){cancelBansheeSkill(e);if(beh.hunt!==false)navigateEnemy(g,e,p,dt);return;}
 if(e.bansheeDrawLeft>0){
  e.bansheeDrawLeft=Math.max(0,e.bansheeDrawLeft-dt);
  if(e.bansheeDrawLeft<=1e-8){e.bansheeDrawLeft=0;releaseQueenArrows(g,e,false,!!e.bansheeFrostCharge);e.cooldown=stats.rangedCooldown||2.4;}
  return;
 }
 if(retrieveEnemyArrows(g,e,dt)){cancelBansheeSkill(e);return;}
 e.faceX=(p.x-e.x)/d;e.faceY=(p.y-e.y)/d;
 if(e.cooldown<=0&&e.arrowsLeft>0&&beh.ranged!==false){
  const frost=e.bansheeSafeTime>=2&&e.bansheeFrostCooldown<=0&&beh.frostShot!==false;
  e.bansheeFrostCharge=frost;if(frost)e.bansheeFrostCooldown=stats.frostCooldown||BANSHEE_FROST_COOLDOWN;
  e.bansheeDrawDuration=frost?BANSHEE_FROST_CHARGE:stats.windup||.8;e.bansheeDrawLeft=e.bansheeDrawDuration;e.bansheeAim={x:e.faceX,y:e.faceY};return;
 }
 if(d<145&&beh.hunt!==false)g.moveActor(e,-e.faceX*35*dt,-e.faceY*35*dt);
}
export function drawBansheeSkills(c,g){
 for(const e of g.enemies){if(e.kind!=='banshee_queen'||e.hp<=0)continue;
  if(e.bansheeFrostCharge&&e.bansheeDrawLeft>0&&e.bansheeAim){const a=bowHandleWorld(bansheeVisualActor(e),g.time,bansheeMotion,47),t=1-e.bansheeDrawLeft/BANSHEE_FROST_CHARGE;c.save();c.strokeStyle='#8fe5ff88';c.lineWidth=1;c.setLineDash([4,5]);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(a.x+e.bansheeAim.x*420,a.y+e.bansheeAim.y*420);c.stroke();c.setLineDash([]);c.fillStyle='#c3f6ff';for(let i=0;i<7;i++){const ang=i*Math.PI*2/7+g.time*3,r=8-5*t;c.fillRect(a.x+Math.cos(ang)*r,a.y+Math.sin(ang)*r,2,2);}c.font='9px sans-serif';c.textAlign='center';c.fillText('FROST SHOT',e.x,e.y-51);c.restore();}
 }
}
export const bansheeArrowBonus=p=>({bansheeFreezeChance:Math.max(0,Math.min(1,stat(p,'arrowFreezeChance')))});
// Bonus is snapshotted at release and rolled once per projectile on a real enemy.
export function bansheeArrowImpact(g,a,target){
 if(a.bansheeFreezeRolled||a.hostile||target.practiceTarget||target.hp<=0||['ally','neutral'].includes(target.faction)||!g.enemies.includes(target)||!(a.bansheeFreezeChance>0))return false;
 a.bansheeFreezeRolled=true;
 if(g.random()>=a.bansheeFreezeChance)return false;
 target.frozen=Math.max(target.frozen||0,1.5);return true;
}
