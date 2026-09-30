export const BOARD_REVEAL_SECONDS=5;
// Roll time is independent of world time: hazards, actors and air stay frozen.
export function tickBoardSequence(g,dt,inputs={}){
 const r=g.roll;if(!r)return false;
 r.elapsed+=dt;
 const owner=g.players.find(p=>p.id===r.playerId);
 for(const p of g.players){const input=inputs[p.device]||{};p.previousInput={...input};p.jumpHeld=!!input.jump;p.dashHeld=!!input.dodge;p.charge=0;}
 if(owner&&r.elapsed>=1.6&&!r.resolved)owner.boardProgress=Math.min(r.targetProgress,r.startProgress+(r.elapsed-1.6)/.16);
 if(r.elapsed>=r.landingAt&&!r.resolved){g.resolveRoll();g.eventOnBoard=true;}
 if(r.elapsed>=r.landingAt+BOARD_REVEAL_SECONDS){
  g.roll=null;g.eventTime=0;
  if(!g.locked){if(g.players.every(p=>g.turnOrder.includes(p.id))){g.locked=true;g.turn=0;g.round=2;}}
  else g.turn++;
  if(g.turn>=g.players.length){g.turn=0;g.round++;g.locked=true;}
 }
 return true;
}
export function boardDicePose(roll,index){
 const t=roll.elapsed,energy=Math.max(0,1-t/1.6);
 return {x:(roll.dice.length===1?0:index?26:-26)+Math.sin(t*10+index)*5*energy,
 y:49-Math.abs(Math.sin(t*14+index))*7*energy,size:5,
 angle:t<1.6?t*8+index:0,value:roll.dice[index]};
}
