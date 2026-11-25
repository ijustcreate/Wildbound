import {returnToWildSlimeCheckpoint} from './wild-slime-hollow.mjs';

export function continueAfterDefeat(game){
 if(game?.phase!=='lost')return false;
 const atMossbell=returnToWildSlimeCheckpoint(game);
 for(const p of game.players||[]){
  p.hp=Math.min(p.maxHp||100,55);p.revive=0;p.getUpTime=.6;p.invuln=3;
  p.stun=0;p.frozen=0;p.sink=0;p.attack=0;p.charge=0;p.dodge=0;p.dashTime=0;p.dashRecovery=0;
 }
 game.phase='play';game.message?.(atMossbell?'You regrouped at the Mossbell Lantern.':'You found your way back. Keep going.');game.persist?.();return true;
}
