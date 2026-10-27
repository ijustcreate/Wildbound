import {playerMotion,playerMotionRevision,playerPose,projectPoint,facingIndex,drawPlayer} from './player-motion.mjs';
import {solveTwoBone} from './ik.mjs';
import {LOBBY_PLAYER_SIZE} from './render-settings.mjs';
export const TARGET_REPORT_SECONDS=60;
export const targetReportAlpha=t=>t.hits>0?Math.min(1,Math.max(0,(t.reportRemaining||0)/3)):0;
export const lobbyPropDepth=o=>o.y+(o.id==='board'?30:o.id==='television'?22:o.id==='difficulty'?10:20);
export function lobbyActorDepth(actor,furniture,objects){
 const elevation=(actor.jumpHeight||0)+(actor.groundHeight||0),radius=8;
 return furniture.reduce((depth,f)=>{
  const o=objects.find(o=>o.id===f.id);
  return o&&elevation>=f.surfaceHeight&&actor.x>=f.x-radius&&actor.x<=f.x+f.w+radius&&actor.y>=f.y-radius&&actor.y<=f.y+f.h+radius?Math.max(depth,lobbyPropDepth(o)+1):depth;
 },actor.y);
}
export const lobbyLabelY=o=>o.y-({difficulty:145,television:98,'character-station':62,environment:53,'dice-count':52,'starter-chest':54,board:49,'target-lever':50}[o.id]||50);
export function canUseLobbyTV(state,actor=state,controllers=[{x:721,y:225},{x:849,y:225}]){
 if(!state||state.y<210||state.y>270||(actor?.jumpHeight||state.jumpHeight||0)>0||(actor?.groundHeight||state.groundHeight||0)>0||actor?.wingHover||state.wingHover)return false;
 return controllers.some(pad=>Math.hypot(state.x-pad.x,state.y-pad.y)<=34);
}
export function lobbyObjectNearby(o,players,members,controllers){return players.some(p=>{const s=members.get(p.id);return s?.spawned&&!p.room&&!p.lobbyDisconnected&&(o.id==='television'?canUseLobbyTV(s,s,controllers):Math.hypot(s.x-o.x,s.y-o.y)<100);});}
let seatModel,seatRevision=-1,surface;
export function lobbySeatedModel(){
  if(seatRevision===playerMotionRevision&&seatModel)return seatModel;
  seatRevision=playerMotionRevision;seatModel=structuredClone(playerMotion);
  const rest=seatModel.joints,pose=Object.fromEntries(Object.entries(rest).map(([n,j])=>[n,[...j.position]]));
  const drop=rest.pelvis.position[2]-7;
  for(const n of Object.keys(pose))if(!/^(knee|foot)/.test(n))pose[n][2]-=drop;
  for(const [side,sign] of [['L',-1],['R',1]]){
    const hip=pose['hip'+side],shoulder=pose['shoulder'+side];
    const length=(a,b)=>Math.hypot(...rest[a].position.map((v,i)=>v-rest[b].position[i]));
    const leg=solveTwoBone(hip,[hip[0],hip[1]+7,hip[2]],pose['foot'+side],[hip[0],hip[1]+7,1],[length('hip'+side,'knee'+side),length('knee'+side,'foot'+side)]);
    pose['knee'+side]=leg.mid;pose['foot'+side]=leg.end;
    const arm=solveTwoBone(shoulder,[shoulder[0]+sign*2,shoulder[1]+4,shoulder[2]-5],pose['hand'+side],[sign*3,8,10],[length('shoulder'+side,'elbow'+side),length('elbow'+side,'hand'+side)]);
    pose['elbow'+side]=arm.mid;pose['hand'+side]=arm.end;
  }
  seatModel.clips.lobby_sit={length:1,fps:1,loop:true,keys:[{frame:0,joints:Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,v.map((x,i)=>x-rest[n].position[i])]))}]};
  return seatModel;
}
export function seatedLobbyActor(actor,slot){return {...actor,animationAction:'lobby_sit',playerFrame:0,moving:false,attack:0,charge:0,bowAiming:false,bowVisualAngle:undefined,bowAimBlend:undefined,jumpHeight:0,groundHeight:0,equipment:{...actor.equipment,hand1:null,hand2:null},lobbyController:{slot}};}
export function lobbyControllerGrip(actor,slot){
  const a=seatedLobbyActor(actor,slot),model=lobbySeatedModel(),pose=playerPose(a,0,model),d=facingIndex(a.faceX,a.faceY);
  const build=a.appearance?.build==='broad'?1.12:a.appearance?.build&&a.appearance.build!=='standard'?.9:1;
  const hand=pose.handL.map((v,i)=>(v+pose.handR[i])/2),p=projectPoint([hand[0]*build,hand[1],hand[2]],d),scale=LOBBY_PLAYER_SIZE/48;
  return {x:a.x+p.x*scale,y:a.y+(p.y+2)*scale};
}
export function drawSeatedLobbyPlayer(c,actor,slot){
  surface||=Object.assign(document.createElement('canvas'),{width:512,height:512});
  const pen=surface.getContext('2d');pen.clearRect(0,0,512,512);pen.save();pen.scale(4,4);pen.translate(64,64);
  drawPlayer(pen,seatedLobbyActor(actor,slot),0,lobbySeatedModel());pen.restore();
  c.imageSmoothingEnabled=false;c.drawImage(surface,Math.round(actor.x-LOBBY_PLAYER_SIZE*4/3),Math.round(actor.y-LOBBY_PLAYER_SIZE*4/3),LOBBY_PLAYER_SIZE*8/3,LOBBY_PLAYER_SIZE*8/3);
}
