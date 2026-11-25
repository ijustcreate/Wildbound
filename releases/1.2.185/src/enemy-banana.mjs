import {requestEnemyGroupTurn} from './enemy-group-combat.mjs';
import {clearShot} from './navigation.mjs';

export function tickBananaAttack(game,enemy,target,dt,mayStart=true,stats={}){
  enemy.throwTime=Math.max(0,(enemy.throwTime||0)-dt);
  enemy.bananaTimer=Math.max(0,(enemy.bananaTimer||0)-dt);
  if(enemy.pendingBanana&&enemy.throwTime<=.28){
    const pending=enemy.pendingBanana;
    const hasTarget=pending.targetId==null||target?.id===pending.targetId;
    if(enemy.flash<=0&&enemy.state!=='snared'&&hasTarget){
      game.bananas.push({...pending,x:enemy.x,y:enemy.y});
    }
    enemy.pendingBanana=null;
  }
  if(enemy.throwTime>0)return true;
  if(!mayStart||!target||enemy.bananaTimer>0||enemy.flash>0)return false;
  const dx=target.x-enemy.x,dy=target.y-enemy.y,distance=Math.hypot(dx,dy);
  if(distance<=50||distance>=300||!clearShot(game,enemy,target)||!requestEnemyGroupTurn(game,enemy,target,{flightSpeed:stats.bananaSpeed||180}))return false;
  const speed=stats.bananaSpeed||180;
  enemy.faceX=dx/distance;enemy.faceY=dy/distance;
  enemy.pendingBanana={targetId:target.id,x:enemy.x,y:enemy.y,z:22,vx:enemy.faceX*speed,vy:enemy.faceY*speed,vz:55,life:3,damage:8};
  enemy.bananaTimer=stats.bananaCooldown||2.5;
  enemy.throwTime=.5;
  return true;
}
