import {interruptShoreGoblin} from './shore-goblin-state.mjs';
import {interruptReaper} from './reaper-state.mjs';
import {interruptGhost} from './ghost-ai.mjs';
import {consumeLifeSteal} from './dark-essence.mjs';
export const DAMAGE_COLORS={physical:'#fff2cf',magic:'#c6a3ff',fire:'#ff9b57',ice:'#7ee5ff',poison:'#ade96e',spectral:'#7ebaff'};
export function damageEnemy(target,amount,type='physical',context){
  if(!Number.isFinite(amount)||amount<=0)return;
  if(!target.practiceTarget){
    const dealt=Math.min(Math.max(0,target.hp),amount);if(!dealt)return 0;
    interruptShoreGoblin(target);interruptReaper(target);if(target.kind==='ghost'){interruptGhost(target);if(target.state==='windup'){target.state='recover';target.timer=.4;target.cooldown=.5;}}target.hp=Math.max(0,target.hp-amount);target.flash=.18;
    if(context)consumeLifeSteal(context.g,context.p,target,dealt,context.shot);
    return dealt;
  }
  target.hits++;target.score+=amount;target.flash=.18;target.reportRemaining=63;
  target.combatText.unshift({amount,type,life:.5,age:0,offset:0});
  target.combatText.length=Math.min(8,target.combatText.length);
}
