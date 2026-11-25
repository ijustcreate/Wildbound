import {actorRadius} from './navigation.mjs';
import {creatures} from './definitions.mjs';
import {HOLLOW_ROOM,HOLLOW_NAV,MOUNTAIN_ASCENT,MOUNTAIN_CAVE_TRAIL,mountainHeight,mountainLineOpen,mountainTerrainBlocked} from './wild-mountain-layout.mjs';

const CAVE_GROUP=[['shore_goblin',7475,5200],['skeleton_unarmed',8680,5470],['skeleton',8715,4760]];
const MOUNTAIN_GROUP=[['golem',17270,7370],['skeleton',16655,6800],['skeleton_unarmed',17690,6400]];
const graphs=new Map(),routes=new WeakMap();
const point=([x,y])=>({x,y});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function tickMountainEncounters(g){
 const t=g.trainTest,d=t?.design;
 if(!d?.wildLands||t.wildLandsOverview||d.activeRoom&&d.activeRoom!==HOLLOW_ROOM)return;
 const cave=d.activeRoom===HOLLOW_ROOM,key=cave?'hollowEncounter':'mountainEncounter';
 if(t[key])return;
 const group=cave?CAVE_GROUP:MOUNTAIN_GROUP;
 if(!group.some(([,x,y])=>g.players.some(p=>p.hp>0&&!p.trainRide&&Math.hypot(p.x-x,p.y-y)<(cave?700:550))))return;
 t[key]=true;
 for(const [kind,x,y] of group){
  const stats=creatures[kind].stats;
  const enemy={kind,id:g.nextId++,group:key,x,y,hp:stats.hp,maxHp:stats.hp,speed:stats.speed,damage:stats.damage,
   wildMountain:true,homeX:x,homeY:y,skin:kind,
   state:'hunt',faceX:0,faceY:1,step:0,attack:0,cooldown:.9,flash:0,dx:0,dy:0,timer:1,tacticTime:1.6,orbit:1,temperament:'patient'};
  g.configureCreature(enemy,false);
  if(enemy.hp>0&&!mountainTerrainBlocked(d,x,y,actorRadius(enemy)))g.enemies.push(enemy);
 }
}

function graph(d,radius){
 const key=(d.activeRoom||'mountain')+':'+radius;
 if(graphs.has(key))return graphs.get(key);
 const points=(d.activeRoom===HOLLOW_ROOM?HOLLOW_NAV:[...MOUNTAIN_ASCENT,...MOUNTAIN_CAVE_TRAIL.slice(1)]).map(point);
 const edges=points.map((from,i)=>points.flatMap((to,j)=>{
  const cost=distance(from,to);
  return i!==j&&cost<770&&mountainLineOpen(d,from,to,radius)?[{j,cost}]:[];
 }));
 const result={points,edges};graphs.set(key,result);return result;
}

export function mountainPursuitRoute(d,actor,target,radius=actorRadius(actor)){
 if(mountainLineOpen(d,actor,target,radius))return [{x:target.x,y:target.y}];
 const {points,edges}=graph(d,radius),length=points.length;
 const costs=Array(length).fill(Infinity),parents=Array(length).fill(-1),used=new Set();
 const ends=points.map(p=>distance(p,target)<720&&mountainLineOpen(d,p,target,radius)?distance(p,target):Infinity);
 points.forEach((p,i)=>{if(distance(p,actor)<720&&mountainLineOpen(d,actor,p,radius))costs[i]=distance(p,actor);});
 let end=-1,best=Infinity;
 for(let iteration=0;iteration<length;iteration++){
  let i=-1;
  for(let j=0;j<length;j++)if(!used.has(j)&&costs[j]<(i<0?best:costs[i]))i=j;
  if(i<0)break;
  used.add(i);
  if(costs[i]+ends[i]<best){end=i;best=costs[i]+ends[i];}
  for(const {j,cost} of edges[i])if(costs[i]+cost<costs[j]){costs[j]=costs[i]+cost;parents[j]=i;}
 }
 if(end<0)return [];
 const found=[{x:target.x,y:target.y}];
 for(let i=end;i>=0;i=parents[i])found.push(points[i]);
 return found.reverse();
}

export function tickMountainPursuit(g,e,dt,targets){
 if(!e.wildMountain||e.hp<=0||e.attack>0||e.frozen>0||e.stun>0||e.rooted>0)return false;
 const d=g.trainTest?.design;
 if(!d?.wildLands)return false;
 const target=targets.filter(p=>!p.trainRide&&!p.pirateRide&&!p.swimming&&distance(e,p)<740)
  .sort((a,b)=>distance(e,a)-distance(e,b))[0];
 if(target&&Math.abs(mountainHeight(d,e.x,e.y)-mountainHeight(d,target.x,target.y))<58&&mountainLineOpen(d,e,target,actorRadius(e)))return false;
 // On separated shelves, follow the connected footpath. The native creature
 // combat controller regains control as soon as both feet share a clear lane.
 const goal=target||{x:e.homeX,y:e.homeY};
 if(!goal||distance(e,goal)<12){e.moving=false;return true;}
 const now=g.trainTest.time;
 let route=routes.get(e);
 if(!route||route.room!==d.activeRoom||now>=route.until||distance(goal,route.goal)>45){
  route={room:d.activeRoom,goal:{x:goal.x,y:goal.y},until:now+.65,path:mountainPursuitRoute(d,e,goal)};
  routes.set(e,route);
 }
 while(route.path[0]&&distance(e,route.path[0])<10)route.path.shift();
 const next=route.path[0];
 if(!next){e.moving=false;return true;}
 const span=distance(e,next),stride=Math.min(span,e.speed*dt);
 e.faceX=(next.x-e.x)/span;e.faceY=(next.y-e.y)/span;
 e.cooldown=Math.max(0,e.cooldown-dt);e.state='hunt';
 g.moveActor(e,e.faceX*stride,e.faceY*stride);
 return true;
}
