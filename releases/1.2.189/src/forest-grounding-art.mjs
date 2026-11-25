const MUSHROOM_BLADES=[[-5,-2,4],[-2,0,5],[1,1,4],[4,3,3]];
const ROCK_BLADES=[[-16,-2,4],[-12,1,6],[-9,2,4],[4,-2,4],[8,0,5],[12,-3,4],[16,2,5]];
const mushroomBrushes=new WeakMap();

function drawBlades(c,x,y,blades,scale,bend){
 x=Math.round(x);y=Math.round(y);
 for(const [offset,lean,height]of blades){
  const base=x+Math.round(offset*scale),h=Math.max(2,Math.round(height*scale));
  const top=Math.round((lean+bend)*scale);
  c.fillStyle='#38553a';c.fillRect(base-1,y,3,1);
  for(let i=1;i<=h;i++){
   const step=Math.round(top*(i/h)**2);
   c.fillStyle=i>=h-1?'#718c4e':'#506e43';
   c.fillRect(base+step,y-i,i<h-1?2:1,1);
  }
 }
}

export function drawRockGrass(c,p,root){
 drawBlades(c,p.x,root+2,ROCK_BLADES,Math.max(.5,Math.min(1.45,p.size/64)),0);
}

export function drawMushroomGrass(c,x,y,scale,bend=0){
 drawBlades(c,x+1,y+1,MUSHROOM_BLADES,scale,bend);
}

export function mushroomGrassBend(p,g,root){
 const time=g.time;
 if(!Number.isFinite(time))return 0;
 let closest=24,bend=0;
 for(const player of g.players||[]){
  if(!player.moving||player.moveSpeed===0||player.room||player.swimming||player.trainRide||player.vehicleId||player.flyingMounted||player.hp<=0||player.jumpHeight>5)continue;
  const dx=player.x-p.x,dy=player.y-root,distance=Math.hypot(dx,dy*1.25);
  if(distance>=closest)continue;
  closest=distance;
  const direction=Math.abs(player.faceX)>.3?Math.sign(player.faceX):dx>0?-1:1;
  bend=direction*5*(1-distance/24);
 }
 if(bend){mushroomBrushes.set(p,{time,bend});return bend;}
 const brush=mushroomBrushes.get(p);
 if(!brush)return 0;
 const age=time-brush.time;
 if(age<0||age>=.28){mushroomBrushes.delete(p);return 0;}
 return brush.bend*(1-age/.28)**2;
}
