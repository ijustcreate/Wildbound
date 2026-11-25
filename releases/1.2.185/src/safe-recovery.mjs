import {roomBlocked} from './shops.mjs';
import {actorRadius,collisionOffset} from './navigation.mjs';
import {clearSwordPolish} from './sword-charge-state.mjs';
import {waterAt} from './environment.mjs';
const records=new WeakMap();
const context=(g,p)=>[g.seed,g.generatedEnvironment,p.room||'outside',g.localWorld?.id||'',g.shadowPassages?.active||''].join(':');
function state(g){let value=records.get(g);if(!value){value=new Map();records.set(g,value);}return value;}
function supportedRoom(g,p){const door=(g.portals||[]).find(d=>d.id===p.room);return !!door&&!door.oldWell&&!door.temple;}
export function validRecoveryPoint(g,p,point){
  if(!Number.isFinite(point.x)||!Number.isFinite(point.y))return false;
  if(p.room)return supportedRoom(g,p)&&point.x>=25&&point.x<=295&&point.y>=45&&point.y<=218&&!roomBlocked(point.x,point.y);
  if(['quicksand','lava','pit','void','shadow_void','water'].includes(waterAt(g,point.x,point.y)))return false;
  if((g.lava||[]).some(cell=>cell.life>0&&point.x>=cell.x-8&&point.x<cell.x+40&&point.y>=cell.y-8&&point.y<cell.y+40))return false;
  if((g.traps||[]).some(trap=>trap.life>0&&Math.hypot(point.x-trap.x,point.y-trap.y)<24))return false;
  return !g.blocked(point.x,point.y,actorRadius(p),false,false,false,collisionOffset(g,p),0);
}
export function rememberSafePositions(g,dt){
  const all=state(g);
  for(const p of g.players||[]){
    if(p.hp<=0||p.ui||p.trainRide||p.pirateRide||p.vehicleId||p.broomMount||p.controlledFollowerId||p.jumpHeight>0||p.groundHeight>0||p.roomJumpHeight>0||p.swimming||p.dashTime>0)continue;
    const key=context(g,p);let record=all.get(p.id);
    if(!record||record.context!==key){record={context:key,age:0,last:null,entrance:null};all.set(p.id,record);}
    const point={x:p.room?p.roomX:p.x,y:p.room?p.roomY:p.y};
    if(!validRecoveryPoint(g,p,point)){record.age=0;continue;}
    record.age+=dt;
    if(record.age>=.6){record.last=point;record.entrance||=point;}
  }
}
export function recoveryReason(g,p){
  if(!p||p.hp<=0)return 'Use Revive and Continue for a fallen explorer.';
  if(g.remoteAuthoritative)return 'The host controls recovery in this expedition.';
  if(p.pirateRide)return 'Walk ashore before using ground recovery.';
  if(p.trainRide||p.vehicleId||p.broomMount)return 'Stop and leave your vehicle before using ground recovery.';
  if(p.controlledFollowerId)return 'Return control to your explorer before recovering.';
  if(p.ui?.carry)return 'Place or cancel the held inventory item before recovering.';
  if(p.room&&!supportedRoom(g,p))return 'Use this room’s entrance or return ability; ground recovery is available outdoors and in storage.';
  return '';
}
export function recoverToSafety(g,p,{entrance=false}={}){
  const reason=recoveryReason(g,p);if(reason)return {ok:false,message:reason};
  const record=state(g).get(p.id),same=record?.context===context(g,p);
  const origin={x:p.room?p.roomX:p.x,y:p.room?p.roomY:p.y};
  const candidates=[];
  if(entrance){if(same&&record.entrance)candidates.push(record.entrance);}
  else {
    // Nearby first: recovery is not a shortcut back through an explored map.
    for(let radius=16;radius<=128;radius+=16)for(let i=0;i<16;i++)candidates.push({x:origin.x+Math.cos(i*Math.PI/8)*radius,y:origin.y+Math.sin(i*Math.PI/8)*radius});
    if(same&&record.last&&Math.hypot(record.last.x-origin.x,record.last.y-origin.y)<=192)candidates.push(record.last);
  }
  const target=candidates.find(point=>validRecoveryPoint(g,p,point)&&!(g.enemies||[]).some(e=>e.hp>0&&!e.friendly&&e.owner==null&&e.allyOwner==null&&!e.wildlife&&!e.neutral&&Math.hypot(e.x-point.x,e.y-point.y)<80));
  if(!target)return {ok:false,message:entrance?'No recorded safe position is available here. Your progress is unchanged.':'No clear nearby ground. Try the confirmed recorded position option.'};
  if(p.room){p.roomX=target.x;p.roomY=target.y;p.roomJumpHeight=0;p.roomJumpVelocity=0;p.roomMoving=false;}
  else {p.x=target.x;p.y=target.y;}
  for(const key of ['jumpHeight','jumpVelocity','groundHeight','dashTime','dashRecovery','charge','attack','interactTime','dx','dy','moving','swimming','diveDepth','wingHover','sink','quicksandUnder'])p[key]=0;
  clearSwordPolish(p);p.previousInput={};p.interactUsed=false;p.ui=null;p.consumeInput=true;
  for(const key of ['swordDash','swordStrike','swordFacing','swordDashRequested'])delete p[key];
  p.dashGhosts=[];
  // Never heal, reset an encounter, discard a carried item or restore old saves.
  g.persist?.();return {ok:true,message:entrance?'Returned to the recorded safe position. Health and possessions unchanged.':'Moved to nearby clear ground. Health and possessions unchanged.'};
}
