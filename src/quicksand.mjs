import {waterAt} from './environment.mjs';
export const SAND_HEAD_DEPTH=38,MAX_SAND_DEPTH=48;
export const QUICKSAND_LOOT_HIDE_DEPTH=24,QUICKSAND_LOOT_GRACE=1;
/** Loot sinks below the sand surface, but remains interactable for one second. */
export function tickQuicksandLoot(g,dt){
 if(!g.loot?.length||!(dt>0))return false;
 let changed=false;
 for(const loot of [...g.loot]){
  if(loot.quicksandHidden){
   loot.quicksandGrace=Math.max(0,(loot.quicksandGrace??QUICKSAND_LOOT_GRACE)-dt);
   if(loot.quicksandGrace<=0){g.loot=g.loot.filter(item=>item!==loot);changed=true;}
   continue;
  }
  if(waterAt(g,loot.x,loot.y)!=='quicksand')continue;
  loot.quicksandSink=Math.min(QUICKSAND_LOOT_HIDE_DEPTH,(loot.quicksandSink||0)+26*dt);
  if(loot.quicksandSink>=QUICKSAND_LOOT_HIDE_DEPTH){loot.quicksandHidden=true;loot.quicksandGrace=QUICKSAND_LOOT_GRACE;changed=true;}
 }
 return changed;
}
export function tickQuicksand(g,p,input,dt){
 const sand=!p.room&&waterAt(g,p.x,p.y)==='quicksand'&&!(p.groundHeight>0);
 let depth=p.sink||0;
 if(p.hp<=0||!sand)depth=Math.max(0,depth-60*dt);
 else if(p.jumpHeight>0)depth=Math.max(0,depth-65*dt);
 else if(input.jump&&!p.jumpHeld&&!p.ui&&!p.consumeInput&&!(p.stun>0)&&!(p.rooted>0))depth=Math.max(0,depth-22);
 else{
  const struggling=!p.ui&&!p.consumeInput&&p.moving&&Math.hypot(input.x||0,input.y||0)>.15;
  depth=Math.max(0,Math.min(MAX_SAND_DEPTH,depth+(struggling?-8:5)*dt));
 }
 p.sink=depth;p.quicksandUnder=sand&&depth>=SAND_HEAD_DEPTH&&!(p.jumpHeight>0)&&p.hp>0;
}
export function drawSinking(c,a,draw){
 c.save();c.beginPath();c.rect(a.x-100,a.y-180,200,181);c.clip();
 if(a.sink<MAX_SAND_DEPTH)draw({...a,y:a.y+a.sink});
 c.restore();
 c.save();c.strokeStyle='#78613b88';c.lineWidth=1;c.beginPath();c.ellipse(a.x,a.y,Math.max(4,13-a.sink*.15),3,0,0,Math.PI*2);c.stroke();c.restore();
}
