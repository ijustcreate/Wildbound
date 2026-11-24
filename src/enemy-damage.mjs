import {speciesOpeningDamage,reactSpeciesHit} from './enemy-combat-catalog.mjs';
import {resolvedDamageFeedback} from './combat-feedback.mjs';
import {recordEnemyPressure,enemyOpeningDamage} from './enemy-systems.mjs';
import {tacticalDamage} from './combat-tactics-state.mjs';
import {emitGameplayFx} from './gameplay-fx.mjs';
import {interruptShoreGoblin} from './shore-goblin-state.mjs';
import {interruptReaper} from './reaper-state.mjs';
import {interruptGhost} from './ghost-ai.mjs';
import {consumeLifeSteal} from './dark-essence.mjs';
import {markSkunkAttacked} from './skunk-state.mjs';
import {showCombatImpact} from './combat-impact.mjs';
import {planFrostFinisher,finishCombatFrost} from './frost-shatter.mjs';
import {readCounterOpening,claimCounterOpening} from './counterattack.mjs';
import {recordTeamFinish} from './team-combat.mjs';
import {recordWeaponCombo} from './weapon-combo-discovery.mjs';
import {championPower} from './arena-drink-state.mjs';
export const DAMAGE_COLORS={physical:'#fff2cf',magic:'#c6a3ff',fire:'#ff9b57',ice:'#7ee5ff',poison:'#ade96e',spectral:'#7ebaff'};
export function damageEnemy(target,amount,type='physical',context){
  if(!Number.isFinite(amount)||amount<=0)return;
  const raw=tacticalDamage(target,amount,type,context);
  amount=reactSpeciesHit(context?.g,target,Math.max(enemyOpeningDamage(context?.g,target,raw),speciesOpeningDamage(context?.g,target,raw)),type,context);
  const game=context?.g;
  const source=context?.p||game?.players?.find(p=>p.id===context?.shot?.owner);if(source?.happyUntil>(game?.time??Infinity))amount*=1.1;
  amount*=championPower(source);
  const guarded=type==='physical'&&(target.tacticalBlocked||context?.glancing);
  const direct=game&&!context.secondary;
  const showHit=()=>{
    if(!direct)return null;
    const impact=showCombatImpact(game,source||context.shot,target,{
      kind:guarded?'shieldBlock':undefined,heavy:!!context.heavy,cut:!!context.cut,
    });
    if(guarded&&impact)game.onSound?.('shield',target);
    if(impact?.kind==='cut')game.onSound?.('bladeContact',target);
    if(context.melee&&['heavy','boss'].includes(impact?.kind))game.onSound?.('hurt',target);
    if(!impact&&type==='physical'&&!guarded)emitGameplayFx(game,'hit',{id:target.id,x:target.x,y:target.y-18},{scale:.65});
    return impact;
  };
  if(!target.practiceTarget){
    const frost=planFrostFinisher(target,amount,type,context);
    const opening=direct&&context.melee&&context.heavy&&type==='physical'&&!guarded
      ?readCounterOpening(game,target,source):null;
    amount+=(frost?.bonus||0)+(opening?Math.min(22,Math.round(raw*(opening.bonusMultiplier-1))):0);
    const dealt=Math.min(Math.max(0,target.hp),amount);if(!dealt)return 0;
    recordEnemyPressure(game,target,source,amount,{heavy:!!context?.heavy,type});
    const impact=frost?.kind!=='thermal_shock'?showHit():null;
    if(target.kind==='skunk')markSkunkAttacked(context?.g,target,context?.p||context?.shot||null);
    if(target.kind==='chicken'&&!target.carriedBy&&target.hp>amount){
      const source=context?.p||context?.shot;target.state='flee';target.timer=0;target.calmPlacement=false;
      target.fleeTime=Math.max(target.fleeTime||0,3.2);target.fleeFromX=source?.x??target.x-(target.faceX||0)*32;target.fleeFromY=source?.y??target.y-(target.faceY||1)*32;
    }
    interruptShoreGoblin(target);interruptReaper(target);if(target.kind==='ghost'){interruptGhost(target);if(target.state==='windup'){target.state='recover';target.timer=.4;target.cooldown=.5;}}target.hp=Math.max(0,target.hp-amount);target.flash=Math.max(target.flash||0,impact?.kind === 'boss' ? 0.24 : 0.18);
    if(context)consumeLifeSteal(context.g,context.p,target,dealt,context.shot);
    resolvedDamageFeedback(context?.g,target,dealt,DAMAGE_COLORS[type],type);
    if(frost)finishCombatFrost(game,source,target,frost,damageEnemy);
    if(opening&&claimCounterOpening(game,target,source,opening)){
      recordWeaponCombo(game,source,'counterattack');
      if(opening.kind==='caught')recordTeamFinish(game,opening.ownerId,source,'team_guard');
    }
    return dealt;
  }
  showHit();
  target.hits++;target.score+=amount;target.flash=Math.max(target.flash||0,.18);target.reportRemaining=63;
  target.combatText.unshift({amount,type,life:.5,age:0,offset:0});
  target.combatText.length=Math.min(8,target.combatText.length);
}
