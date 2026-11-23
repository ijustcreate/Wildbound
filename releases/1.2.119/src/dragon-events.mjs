import {clearShot} from './navigation.mjs';
import {firePatch} from './hazards.mjs';
export const DRAGON_EVENTS=[
 {name:'Winter on blue wings',kind:'dragon',dragonVariant:'blue',environment:'ice',count:1,hp:310,speed:44,damage:22,weight:2,verse:'A sapphire wing blots out the light.\nThe dragon breathes a frozen night.',tip:'Dodge the blue dragon’s warned cone. Its icy breath freezes explorers.'},
 {name:'The bones that burned violet',kind:'dragon',dragonVariant:'bone',environment:'graveyard',count:1,hp:340,speed:42,damage:25,weight:2,verse:'Old bones rise on wings of night.\nViolet fire gives them light.',tip:'Stay clear of the bone dragon’s purple fire and strike between breaths.'},
];
export function dragonBreath(g,e,targets,cfg){
 const variant=e.dragonVariant||'red',reach=cfg.stats.flameRange||190,color=variant==='blue'?'#8edeea':variant==='bone'?'#ac69e3':'#ed7b39';
 g.effects.push({x:e.x,y:e.y,life:.65,duration:.65,color,dragonBreath:{x:e.faceX,y:e.faceY,reach,variant}});
 g.onSound?.('dragonBreath',e);
 for(const q of targets){const dx=q.x-e.x,dy=q.y-e.y,d=Math.hypot(dx,dy)||1;if(d>=reach||(dx*e.faceX+dy*e.faceY)/d<.72||!clearShot(g,e,q,3))continue;
  const hp=q.hp;g.hurt(q,e.damage,e);if(q.hp>=hp)continue;
  if(variant==='blue')q.frozen=Math.max(q.frozen||0,1.25);else{q.burning=Math.max(q.burning||0,2);q.burnDamage=cfg.stats.burnDamage;q.burnTick=.5;}
 }
 if(variant!=='blue')for(let step=28;step<=reach;step+=28){const x=e.x+e.faceX*step,y=e.y+e.faceY*step;if(g.blocked?.(x,y,3))break;const patch=firePatch(g,x,y,3,cfg.stats.burnDamage);if(variant==='bone')patch.color='#ac69e3';}
}
export function drawDragonBreath(c,fx){
 const b=fx.dragonBreath,age=1-fx.life/fx.duration;c.save();c.translate(fx.x,fx.y-16);c.rotate(Math.atan2(b.y,b.x));
 for(let i=0;i<30;i++){const t=(i/30+age*.8)%1,x=16+t*(b.reach-16),spread=7+t*31,y=Math.sin(i*17.13)*spread,size=Math.max(2,Math.round(2+t*5));c.globalAlpha=(1-t)*Math.min(1,fx.life*5);c.fillStyle=i%3===0?(b.variant==='blue'?'#e4ffff':b.variant==='bone'?'#e2c3ff':'#ffe2a0'):fx.color;c.fillRect(Math.round(x),Math.round(y),size+2,size);}c.restore();
}
