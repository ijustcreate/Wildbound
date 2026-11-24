import {rules} from './definitions.mjs';
import {recordBowledTrap} from './weapon-knockback.mjs';

export function nearbyEnemyTrap(game,enemy){
  return game.traps?.find(trap=>trap.life>0&&trap.variant!=='slow'&&Math.hypot(trap.x-enemy.x,trap.y-enemy.y)<30);
}

export function triggerEnemyTrap(game,enemy,trap,flashRecovery=1.8){
  const interrupted=trap.variant==='interrupt';
  trap.life=0;
  enemy.state=interrupted?'recover':'snared';
  enemy.timer=interrupted?flashRecovery:rules.captureTime*(trap.capture??1);
  enemy.flash=.2;
  enemy.attack=0;
  enemy.moving=false;
  game.onSound?.('trap',enemy);
  recordBowledTrap(game,enemy,trap);
  return interrupted;
}
