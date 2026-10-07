export const DAMAGE_COLORS={physical:'#fff2cf',magic:'#c6a3ff',fire:'#ff9b57',ice:'#7ee5ff',poison:'#ade96e',spectral:'#7ebaff'};
export function damageEnemy(target,amount,type='physical'){
  if(!Number.isFinite(amount)||amount<=0)return;
  if(!target.practiceTarget){target.hp-=amount;return;}
  target.hits++;target.score+=amount;target.flash=.18;
  target.combatText.unshift({amount,type,life:.5,age:0,offset:0});
  target.combatText.length=Math.min(8,target.combatText.length);
}
