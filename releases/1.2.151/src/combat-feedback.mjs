export function resolvedDamageFeedback(g,target,amount,color='#fff2cf',type='physical'){
  if(!g?.effects||!Number.isFinite(amount)||amount<=0)return;
  const now=g.time||0;
  const previous=g.effects.find(f=>f.resolvedDamage&&f.targetId===target.id&&f.damageType===type&&now-f.damageAt<.2&&f.life>0);
  if(previous){previous.amount+=amount;previous.damageAt=now;previous.text=String(Math.round(previous.amount*10)/10);previous.life=.65;previous.x=target.x;previous.y=target.y-30;return;}
  if(g.effects.filter(f=>f.resolvedDamage&&f.life>0).length>=48)return;
  g.effects.push({resolvedDamage:true,targetId:target.id,damageType:type,damageAt:now,amount,x:target.x,y:target.y-30,text:String(Math.round(amount*10)/10),color,life:.65});
}
