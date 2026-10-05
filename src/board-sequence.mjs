import {finishBoardTurn} from './board-turns.mjs';
import {travelHouseWorlds} from './house-worlds.mjs';
export const BOARD_REVEAL_SECONDS=5;
export const EVENT_DURATIONS=[1,3,5,7,12,20];
export const eventDuration=value=>EVENT_DURATIONS.includes(Number(value))?Number(value):BOARD_REVEAL_SECONDS;
// Roll time is independent of world time: hazards, actors and air stay frozen.
export function tickBoardSequence(g,dt,inputs={}){
 const r=g.roll;if(!r)return false;
 r.elapsed+=dt;
 const owner=g.players.find(p=>p.id===r.playerId);
 const input=inputs[owner?.device]||{};
 const confirm=!!input.use||!!input.attack;
 const dismiss=r.resolved&&confirm&&!r.confirmHeld;
 r.confirmHeld=confirm;
 for(const p of g.players){const input=inputs[p.device]||{};p.previousInput={...input};p.jumpHeld=!!input.jump;p.dashHeld=!!input.dodge;p.charge=0;}
 if(owner&&r.elapsed>=1.6&&!r.resolved)owner.boardProgress=Math.min(r.targetProgress,r.startProgress+(r.elapsed-1.6)/.16);
 if(r.elapsed>=r.landingAt&&!r.resolved){g.resolveRoll();g.eventOnBoard=true;}
 if(dismiss||r.elapsed>=r.landingAt+eventDuration(g.eventDuration)){
  g.roll=null;g.eventTime=0;
  finishBoardTurn(g,r);
  travelHouseWorlds(g,r.total);
 }
 return true;
}
export function boardDicePose(roll,index){
 const t=Math.min(1.6,Math.max(0,roll.elapsed)),u=t/1.6,energy=1-u;
 const seed=(roll.tossSeed??((roll.total||7)*.073+(roll.startProgress||0)*.13));
 const phase=seed*6.283+index*2.4;
 const endX=Math.cos(phase)*49,endY=Math.sin(phase)*34;
 const travel=1-Math.pow(1-u,3);
 const startX=(index?1:-1)*66,startY=Math.sin(phase+1)*43;
 return {x:startX+(endX-startX)*travel+Math.sin(u*9+phase)*8*energy,
 y:startY+(endY-startY)*travel-Math.abs(Math.sin(u*13))*10*energy,size:5,
 angle:energy*energy*(12+index*3),value:roll.dice[index]};
}
