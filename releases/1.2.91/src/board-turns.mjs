import {FINISH} from './core.mjs';
// Finished pieces wait for their owner's call, without blocking other rollers.
export function skipFinishedBoardTurns(g){
 if(g.repeatTurnPlayerId!=null&&g.players.find(p=>p.id===g.repeatTurnPlayerId)?.progress>=FINISH)g.repeatTurnPlayerId=null;
 if(!g.locked||!g.players.some(p=>p.progress<FINISH))return;
 for(let n=0;n<g.players.length;n++){
  const p=g.players.find(p=>p.id===g.turnOrder?.[g.turn])||g.players[g.turn];
  if(p&&p.progress<FINISH)return;
  g.turn++;
  if(g.turn>=g.players.length){g.turn=0;g.round++;}
 }
}
// Only the completed roll decides the bonus; later dice settings cannot change it.
export function finishBoardTurn(g,roll){
 const owner=g.players.find(p=>p.id===roll.playerId);
 const doubles=roll.dice?.length===2&&Number.isInteger(roll.dice[0])&&roll.dice[0]>=1&&roll.dice[0]<=6&&roll.dice[0]===roll.dice[1];
 if(doubles&&owner?.hp>0&&!owner.room&&owner.progress<FINISH){
  g.repeatTurnPlayerId=owner.id;
  g.message(owner.name+' rolled doubles — roll again!');
  return;
 }
 g.repeatTurnPlayerId=null;
 if(!g.locked){if(g.players.every(p=>g.turnOrder.includes(p.id))){g.locked=true;g.turn=0;g.round=2;}}
 else g.turn++;
 if(g.turn>=g.players.length){g.turn=0;g.round++;g.locked=true;}
 skipFinishedBoardTurns(g);
}
