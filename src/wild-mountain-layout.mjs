import {greywakeShoreAt} from './wild-mountain-shore.mjs';

export const EAST_WILDS_WIDTH=19200;
export const HOLLOW_ROOM='smugglers-hollow';
export const MOUNTAIN_NAME='Greywake Mountain';
export const HOLLOW_GATE={id:HOLLOW_ROOM,name:'Smugglers’ Hollow',x:16680,y:8155};
export const HOLLOW_EXIT={x:8110,y:5630};
export const HOLLOW_ARRIVAL={x:8110,y:5564};
export const MOUNTAIN_OUTLINE=[
 [14960,6530],[15240,6240],[15780,5900],[16580,5660],[17240,5730],[17880,5860],
 [18450,6240],[18810,6830],[18630,7540],[18130,8070],[17340,8310],[16750,8300],
 [16030,8050],[15500,7650],[15120,7380],[14890,7130],
];
export const MOUNTAIN_BOUNDS={left:14800,top:5340,right:19000,bottom:8470};
export const MOUNTAIN_ASCENT=[
 [15160,7190,0,94],[15660,7180,0,100],[16120,7190,45,105],[16710,7430,104,112],
 [17330,7380,159,116],[17820,7100,224,120],[17260,6900,265,115],[16650,6810,306,111],
 [16430,6540,340,106],[16980,6200,399,100],[17510,6310,445,118],[17910,6500,465,118],
];
export const MOUNTAIN_UPPER_START=4;
export const MOUNTAIN_UPPER_HEIGHT=MOUNTAIN_ASCENT[MOUNTAIN_UPPER_START][2];
export const MOUNTAIN_SUMMIT=[[17756,6486],[17825,6374],[17952,6350],[18066,6419],[18061,6537],[17857,6586]];
export const MOUNTAIN_DESCENTS=[
 {id:'cave-trail-ledge',launch:[15949,7271],landing:[15886,7388],duration:.73},
 {id:'snowline-ledge',launch:[16606,6542],landing:[16705,6722],duration:.94},
];
export const MOUNTAIN_OCEAN_DESCENT={id:'summit-ocean-ledge',launch:[18042,6475],landing:[18820,6475],duration:2.3,water:true};
export const MOUNTAIN_CAVE_TRAIL=[
 MOUNTAIN_ASCENT[1],[15780,7420,0,102],[16130,7710,0,108],[16440,7970,0,100],[16680,8170,0,115],
];
export const HOLLOW_BOUNDS={left:7160,top:4330,right:9130,bottom:5780};
export const HOLLOW_OUTLINE=[
 [7210,4950],[7270,4780],[7430,4560],[7690,4450],[7920,4520],[8080,4430],
 [8350,4350],[8570,4430],[8650,4540],[8820,4570],[9020,4760],[9050,4970],
 [8960,5210],[9020,5460],[8910,5640],[8630,5720],[8430,5660],[8290,5700],
 [8180,5760],[8030,5750],[7950,5650],[7680,5620],[7440,5480],[7290,5310],
];
export const HOLLOW_WATER=[
 [7500,4940],[7740,4830],[7990,4800],[8160,4820],[8320,4910],[8520,4860],
 [8760,4930],[8840,5080],[8770,5270],[8630,5360],[8420,5310],[8270,5230],
 [8000,5300],[7740,5260],[7550,5170],
];
export const HOLLOW_ROCKS=[
 [[7470,4790],[7510,4630],[7670,4610],[7800,4680],[7720,4780]],
 [[8190,4770],[8230,4610],[8390,4520],[8490,4560],[8550,4730],[8450,4770]],
 [[8730,5500],[8810,5390],[8930,5430],[8910,5560],[8800,5590]],
 [[7590,5470],[7660,5370],[7800,5400],[7840,5490],[7740,5540]],
];
export const HOLLOW_NAV=[
 [8110,5595],[8030,5450],[7945,5335],[7880,5355],[7710,5320],[7410,5210],[7380,4950],
 [7440,4740],[7610,4800],[7840,4790],[7950,4650],[8090,4550],[8150,4800],[8330,4840],
 [8595,4810],[8660,4690],[8830,4790],[8960,4920],[8880,5150],[8840,5335],[8620,5470],
 [8465,5410],[8290,5365],
];

const within=(b,x,y)=>x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom;
function inside(points,x,y){
 let hit=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [ax,ay]=points[j],[bx,by]=points[i];
  if((ay>y)!==(by>y)&&x<ax+(bx-ax)*(y-ay)/(by-ay))hit=!hit;
 }
 return hit;
}
function segment(a,b,x,y){
 const dx=b[0]-a[0],dy=b[1]-a[1];
 const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
 return {t,distance:Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)};
}
function distanceTo(points,x,y){
 let distance=Infinity;
 for(let i=0;i<points.length;i++)distance=Math.min(distance,segment(points[i],points[(i+1)%points.length],x,y).distance);
 return distance;
}
function trailAt(points,x,y,padding=0){
 let best=null;
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1],{t,distance}=segment(a,b,x,y);
  if(points===MOUNTAIN_ASCENT&&i===points.length-2&&t===1)continue;
  const width=a[3]+(b[3]-a[3])*t-padding;
  if(distance>width||best&&best.distance<distance)continue;
  best={distance,width,height:a[2]+(b[2]-a[2])*t,index:i,t};
 }
 return best;
}
export function mountainTrail(x,y,padding=0){
 if(inside(MOUNTAIN_SUMMIT,x,y)){
  const edge=distanceTo(MOUNTAIN_SUMMIT,x,y);
  if(edge>=padding)return {distance:0,width:edge,height:MOUNTAIN_ASCENT.at(-1)[2],index:MOUNTAIN_ASCENT.length-2,t:1};
 }
 return trailAt(MOUNTAIN_ASCENT,x,y,padding)||trailAt(MOUNTAIN_CAVE_TRAIL,x,y,padding);
}
export const inMountainBounds=(x,y)=>within(MOUNTAIN_BOUNDS,x,y);
export const mountainLand=(x,y)=>greywakeShoreAt(x,y)==='sand'||inMountainBounds(x,y)&&inside(MOUNTAIN_OUTLINE,x,y);
export function mountainSurface(x,y){
 const shore=greywakeShoreAt(x,y);
 if(shore)return shore==='sand'?'grass':'shallow';
 if(!inMountainBounds(x,y))return null;
 if(inside(MOUNTAIN_OUTLINE,x,y))return 'grass';
 return x>15600&&distanceTo(MOUNTAIN_OUTLINE,x,y)<88?'shallow':null;
}
export function hollowSurface(x,y){
 if(!within(HOLLOW_BOUNDS,x,y)||!inside(HOLLOW_OUTLINE,x,y))return 'void';
 if(inside(HOLLOW_WATER,x,y))return distanceTo(HOLLOW_WATER,x,y)<27?'shallow':'water';
 return 'grass';
}
export function mountainHeight(d,x,y){
 if(d.activeRoom||!mountainLand(x,y))return 0;
 return mountainTrail(x,y)?.height||0;
}

export function mountainDescentLaunch(d,p,mx,my){
 if(d.activeRoom||!d.wildLands||!inMountainBounds(p.x,p.y))return null;
 const height=mountainHeight(d,p.x,p.y);
 const intent=Math.hypot(mx,my);
 if(height<=20||intent<.24)return null;
 const ocean=MOUNTAIN_OCEAN_DESCENT;
 if(mx/intent>.72&&inside(MOUNTAIN_SUMMIT,p.x,p.y)&&Math.hypot(p.x-ocean.launch[0],p.y-ocean.launch[1])<=78)return ocean;
 const marked=MOUNTAIN_DESCENTS.find(link=>{
  const [x,y]=link.launch,[lx,ly]=link.landing,vx=lx-x,vy=ly-y;
  return Math.hypot(p.x-x,p.y-y)<39&&height>mountainHeight(d,lx,ly)+20&&(mx*vx+my*vy)/(Math.hypot(vx,vy)*intent)>.56;
 });
 if(marked)return marked;

 // An ordinary jump along the trail stays ordinary. Cross a cliff only when
 // there is a lower surface with room to land directly ahead of the player.
 let crossedLedge=false;
 const dx=mx/intent,dy=my/intent;
 for(let distance=10;distance<=220;distance+=5){
  const x=p.x+dx*distance,y=p.y+dy*distance;
  if(!mountainLand(x,y))return null;
  const below=mountainHeight(d,x,y),blocked=mountainTerrainBlocked(d,x,y,12);
  if(below>height+18)return null;
  if(crossedLedge&&!blocked&&below<height-20){
   return {id:'nearby-trail-drop',landing:[x,y],duration:Math.max(.48,distance/190)};
  }
  crossedLedge||=blocked||below<height-18;
  if(!crossedLedge&&distance>=35)return null;
 }
 return null;
}

function descentLink(motion){
 if(motion.id===MOUNTAIN_OCEAN_DESCENT.id)return MOUNTAIN_OCEAN_DESCENT;
 if(motion.id==='nearby-trail-drop')return motion;
 return MOUNTAIN_DESCENTS.find(item=>item.id===motion.id);
}

export function mountainDescentCorridor(d,p,x,y){
 const motion=p?.mountainDescent;
 if(!motion||d.activeRoom)return false;
 const link=descentLink(motion);
 return !!link&&(link.water||mountainLand(x,y))&&segment([motion.x,motion.y],link.landing,x,y).distance<=15;
}

export function beginMountainDescent(d,p,link){
 p.mountainDescent={id:link.id,x:p.x,y:p.y,z:mountainHeight(d,p.x,p.y),elapsed:0};
 if(link.id==='nearby-trail-drop')Object.assign(p.mountainDescent,{landing:link.landing,duration:link.duration});
}

export function advanceMountainDescent(g,p,dt){
 const motion=p.mountainDescent,d=g.trainTest.design;
 if(!motion)return false;
 const link=descentLink(motion);
 if(!link||d.activeRoom){delete p.mountainDescent;return false;}
 const [x,y]=link.landing;
 const distance=Math.hypot(x-motion.x,y-motion.y)||1;
 const duration=link.launch?link.duration*distance/Math.hypot(x-link.launch[0],y-link.launch[1]):link.duration;
 motion.elapsed=Math.min(duration,motion.elapsed+dt);
 const t=motion.elapsed/duration,dx=motion.x+(x-motion.x)*t-p.x,dy=motion.y+(y-motion.y)*t-p.y;
 p.faceX=(x-motion.x)/distance;p.faceY=(y-motion.y)/distance;
 p.moving=false;
 g.moveActor(p,dx,dy);
 const base=mountainHeight(d,p.x,p.y),landing=mountainHeight(d,x,y);
 const rise=link.water?110:39,fall=landing-motion.z;
 const absolute=link.water?motion.z+rise*t+(fall-rise)*t*t:motion.z+fall*t+Math.sin(t*Math.PI)*rise;
 const velocity=(link.water?rise+2*(fall-rise)*t:fall+Math.cos(t*Math.PI)*rise*Math.PI)/duration;
 const landed=t>=1&&Math.hypot(x-p.x,y-p.y)<=5;
 Object.assign(p,{jumpHeight:landed?0:Math.max(.01,absolute-base),jumpAge:motion.elapsed,
  jumpVelocity:landed?0:velocity,trainGround:base});
 if(landed){
  delete p.mountainDescent;
  Object.assign(p,{x,y,trainGround:landing,landTime:.2,dashTime:0});
 }
 if(t>=1&&!landed){
  // An externally moved actor cannot remain suspended over the cliff.
  delete p.mountainDescent;Object.assign(p,{x:motion.x,y:motion.y,jumpHeight:0,jumpVelocity:0,trainGround:motion.z});
 }
 return true;
}
export function mountainMovementScale(d,x,y,dx,dy){
 if(d.activeRoom||!inMountainBounds(x,y))return 1;
 const length=Math.hypot(dx,dy);
 if(length<.01)return 1;
 const from=mountainHeight(d,x,y),to=mountainHeight(d,x+dx,y+dy);
 return to>from?Math.max(.74,1-(to-from)/length*.85):1;
}
export function mountainTerrainBlocked(d,x,y,r=0){
 if(d.activeRoom===HOLLOW_ROOM){
  if(hollowSurface(x,y)==='void'||HOLLOW_ROCKS.some(poly=>inside(poly,x,y)))return true;
  if(r<=0)return false;
  return [[-r,0],[r,0],[0,-r],[0,r]].some(([dx,dy])=>
   hollowSurface(x+dx,y+dy)==='void'||HOLLOW_ROCKS.some(poly=>inside(poly,x+dx,y+dy)));
 }
 if(d.activeRoom||x<15520||!mountainLand(x,y)||greywakeShoreAt(x,y))return false;
 if(mountainTrail(x,y,r*.72))return false;
 // The lower coastal approach remains open where the first trail meets the mainland.
 return x>15720||y<6940||y>7380;
}

export function mountainLineOpen(d,from,to,radius=7){
 const span=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(1,Math.ceil(span/14));
 let previous=mountainHeight(d,from.x,from.y);
 for(let i=1;i<=steps;i++){
  const x=from.x+(to.x-from.x)*i/steps,y=from.y+(to.y-from.y)*i/steps,height=mountainHeight(d,x,y);
  if(mountainTerrainBlocked(d,x,y,radius)||Math.abs(height-previous)>20||
    (d.activeRoom===HOLLOW_ROOM?hollowSurface(x,y)!=='grass':!mountainLand(x,y)))return false;
  previous=height;
 }
 return true;
}
