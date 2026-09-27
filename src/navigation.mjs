import {rigSubject} from './rig-subjects.mjs';
export const collisionOffset=(g,e)=>(g.house||g.generatedEnvironment==='ice')?(!e.kind||rigSubject(e.kind)?0:14):14;
export const actorRadius=e=>e.kind==='dragon'?42:e.kind==='rhino'?34:['golem','gorilla'].includes(e.kind)?26:e.kind==='baby_spider'?6:8;
export const usesDoors=e=>['monkey','skeleton','skeleton_unarmed','skeleton_boss','archer','skeleton_wizard'].includes(e.kind);
export const flies=e=>['bat','wasp','bee','dragon'].includes(e.kind);
export function clearShot(g,a,b,r=2){const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(d/4));for(let i=1;i<n;i++)if(g.projectileBlocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,r))return false;return true;}
export function advanceShot(g,b,dt,r=2){const dx=b.vx*dt,dy=b.vy*dt,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4));for(let i=0;i<n;i++){const x=b.x+dx/n,y=b.y+dy/n;if(g.projectileBlocked(x,y,r)){b.life=0;return false;}b.x=x;b.y=y;}return true;}
const caches=new WeakMap(),routes=new WeakMap();
function gridFor(g,e){
 const signature=(g.house?.doors||[]).map(d=>d.open?'1':'0').join('')+':'+Math.floor((g.time||0)/2);
 let cache=caches.get(g);if(!cache||cache.house!==g.house||cache.signature!==signature){cache={house:g.house,signature,grids:new Map()};caches.set(g,cache);}
 const radius=actorRadius(e),door=usesDoors(e),flying=flies(e),key=[radius,door,flying].join(':');
 if(!cache.grids.has(key)){const grid=new Uint8Array(2500);for(let y=0;y<50;y++)for(let x=0;x<50;x++)grid[y*50+x]=!g.blocked(x*32+16,y*32+16,radius,flying,false,door,collisionOffset(g,e));cache.grids.set(key,grid);}
 return {grid:cache.grids.get(key),signature};
}
export function findPath(g,e,target){
 const {grid}=gridFor(g,e),cell=a=>Math.max(0,Math.min(49,Math.floor(a.y/32)))*50+Math.max(0,Math.min(49,Math.floor(a.x/32))),start=cell(e),goal=cell(target);
 const heuristic=id=>Math.abs(id%50-goal%50)+Math.abs(Math.floor(id/50)-Math.floor(goal/50));
 const costs=new Float32Array(2500).fill(Infinity),parents=new Int32Array(2500).fill(-1),closed=new Uint8Array(2500),open=[start];costs[start]=0;
 let found=-1;
 for(let iter=0;open.length&&iter<2500;iter++){
  let best=0;for(let i=1;i<open.length;i++)if(costs[open[i]]+heuristic(open[i])<costs[open[best]]+heuristic(open[best]))best=i;
  const id=open.splice(best,1)[0];if(closed[id])continue;closed[id]=1;
  if(id===goal){found=id;break;}
  const x=id%50,y=Math.floor(id/50);
  for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(nx<0||ny<0||nx>=50||ny>=50)continue;const next=ny*50+nx;if(!grid[next]||closed[next])continue;const cost=costs[id]+1;if(cost<costs[next]){costs[next]=cost;parents[next]=id;open.push(next);}}
 }
 if(found<0)return [];
 const path=[];while(found!==start&&found>=0){path.push({x:(found%50)*32+16,y:Math.floor(found/50)*32+16});found=parents[found];}return path.reverse();
}
export function navigateEnemy(g,e,target,dt){
 if(!target||!e.speed){e.moving=false;return false;}
 if(e.state==='snared'){e.timer-=dt;if(e.timer<=0)e.hp=0;return false;}
 const trap=g.traps?.find(t=>t.life>0&&t.variant!=='slow'&&Math.hypot(t.x-e.x,t.y-e.y)<30);if(trap){trap.life=0;e.state='snared';e.timer=2;return false;}
 const {signature}=gridFor(g,e),goal=Math.floor(target.x/32)+':'+Math.floor(target.y/32);
 let route=routes.get(e);if(!route||route.goal!==goal||route.signature!==signature||(g.time||0)>route.expires){route={goal,signature,expires:(g.time||0)+.9,path:findPath(g,e,target)};routes.set(e,route);}
 while(route.path.length&&Math.hypot(e.x-route.path[0].x,e.y-route.path[0].y)<8)route.path.shift();
 let next=route.path[0];
 if(!next&&g.house&&!usesDoors(e)&&Math.hypot(target.x-e.x,target.y-e.y)>70){
   const floors=g.house.floors||[{x:480,y:480,w:640,h:640}],left=Math.min(...floors.map(f=>f.x))-64,right=Math.max(...floors.map(f=>f.x+f.w))+64,top=Math.min(...floors.map(f=>f.y))-64,bottom=Math.max(...floors.map(f=>f.y+f.h))+64;
   const points=[{x:left,y:bottom},{x:right,y:bottom},{x:right,y:top},{x:left,y:top}];
   const patrol=e.housePatrol;if(!patrol||patrol.signature!==signature||(g.time||0)>patrol.expires){
     let path=[];let index=e.patrolIndex??points.reduce((best,p,i)=>Math.hypot(e.x-p.x,e.y-p.y)<Math.hypot(e.x-points[best].x,e.y-points[best].y)?i:best,0);
     for(let i=0;i<points.length;i++){const point=points[index%points.length];if(Math.hypot(e.x-point.x,e.y-point.y)>38){path=findPath(g,e,point);if(path.length)break;}index++;}
     e.patrolIndex=index%points.length;e.housePatrol={signature,expires:(g.time||0)+3,path};
   }
   while(e.housePatrol.path.length&&Math.hypot(e.x-e.housePatrol.path[0].x,e.y-e.housePatrol.path[0].y)<8)e.housePatrol.path.shift();
   next=e.housePatrol.path[0];if(!next)e.patrolIndex=(e.patrolIndex+1)%points.length;
 }
 if(!next){e.moving=false;return false;}
 if(usesDoors(e))for(const d of g.house?.doors||[])if(!d.open&&Math.hypot(e.x-d.x-d.w/2,e.y+collisionOffset(g,e)-d.y-d.h/2)<56&&Math.hypot(next.x-d.x-d.w/2,next.y+collisionOffset(g,e)-d.y-d.h/2)<68)d.open=true;
 const d=Math.hypot(next.x-e.x,next.y-e.y)||1;e.faceX=(next.x-e.x)/d;e.faceY=(next.y-e.y)/d;e.state='hunt';const step=Math.min(d,e.speed*dt);return g.moveActor(e,e.faceX*step,e.faceY*step,flies(e))>0;
}
