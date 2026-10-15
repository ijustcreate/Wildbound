export function nearbyGhost(g,a,range=160){
 return (g.enemies||[]).filter(e=>e.kind==='ghost'&&e.hp>0&&!e.room&&Math.hypot(e.x-a.x,e.y-a.y)<range).sort((x,y)=>Math.hypot(x.x-a.x,x.y-a.y)-Math.hypot(y.x-a.x,y.y-a.y))[0]||null;
}
export function fleeGhostCritter(g,a,dt,valid){
 if(g.paused||!(dt>0))return false;
 const ghost=nearbyGhost(g,a);if(!ghost)return false;
 const speed=['bird','grave_moth','dragonfly','fairy'].includes(a.kind)?95:a.kind==='graveyard_cat'?115:60;
 const angle=Math.hypot(a.x-ghost.x,a.y-ghost.y)>.01?Math.atan2(a.y-ghost.y,a.x-ghost.x):(Number(a.id)||0)*2.4;
 const steps=Math.max(1,Math.ceil(speed*Math.min(dt,1)/3)),step=speed*Math.min(dt,1)/steps;
 a.fleeing=true;a.idle='run';a.moving=false;
 for(let n=0;n<steps;n++)for(const turn of [0,-.5,.5,-1,1]){
  const vx=Math.cos(angle+turn),vy=Math.sin(angle+turn),x=a.x+vx*step,y=a.y+vy*step;
  if(valid&&!valid(x,y))continue;
  a.x=x;a.y=y;a.faceX=vx;a.faceY=vy;a.moving=true;a.step=(a.step||0)+step*.13;break;
 }
 return true;
}
