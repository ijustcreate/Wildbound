import {drawVehicleWater} from './vehicle-water.mjs';
import {timeOfDay} from './night-cycle.mjs';
import {drawPlayer,playerMotion} from './player-motion.mjs';
import {nearbyScenery} from './performance.mjs';
// Same oblique ground plane and upright height convention as articulated actors.
export function carProject(v,x,y,z=0){const a=v.heading||0,c=Math.cos(a),s=Math.sin(a);return {x:v.x+c*x-s*y,y:v.y+(s*x+c*y)*.72-z};}
const paint=(c,points,color)=>{c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();};
const rect=(x,y,w,h,z)=>[[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]];
const palette={ink:'#182b2c',shadow:'#294942',body:'#507565',light:'#86a18a',glass:'#294a50',seat:'#243b39'};
const reflectionCache=new WeakMap();
function reflection(v,g){const key=Math.floor(v.x/24)+':'+Math.floor(v.y/24)+':'+Math.floor((g?.time||0)*2);let cached=reflectionCache.get(v);if(cached?.key===key)return cached.colors;
 const trees=nearbyScenery(g?.scenery||[],v.x,v.y-60,180).filter(p=>!p.fallen&&!p.depleted&&/tree|palm/.test(p.kind)).slice(0,8),colors=[];
 for(let y=0;y<4;y++)for(let x=0;x<8;x++){let color=y<2?'#8dbcc2':'#b6cebd';if((x+Math.floor(v.x/24))%7<2&&y===0)color='#e1e7d0';for(const t of trees){const col=((Math.floor((t.x-v.x)/24)+4)%8+8)%8;if(Math.abs(x-col)<=1&&y>=1+Math.abs(x-col))color=y===3?'#345c44':'#638462';}colors.push(color);}reflectionCache.set(v,{key,colors});return colors;
}
function glass(c,v,g,corners){const poly=corners.map(p=>carProject(v,...p));paint(c,poly,palette.glass);return {poly,reflect(){const colors=reflection(v,g);c.save();c.globalAlpha*=.2;for(let y=0;y<4;y++)for(let x=0;x<8;x++){const point=(u,t)=>corners[0].map((n,i)=>(n*(1-u)+corners[1][i]*u)*(1-t)+(corners[3][i]*(1-u)+corners[2][i]*u)*t);paint(c,[[x/8,y/4],[(x+1)/8,y/4],[(x+1)/8,(y+1)/4],[x/8,(y+1)/4]].map(([u,t])=>carProject(v,...point(u,t))),colors[y*8+x]);}c.restore();}};}
function seat(c,v,x,y){const w=(v.w||96)/96;paint(c,rect(x-8*w,y-7,16*w,13,9).map(p=>carProject(v,...p)),palette.seat);paint(c,rect(x-7*w,y+2,14*w,5,20).map(p=>carProject(v,...p)),'#789083');paint(c,rect(x-5*w,y+3,10*w,3,25).map(p=>carProject(v,...p)),'#a1b0a0');}
export function carOccupantActor(p,v){return {...p,animationAction:'sit',playerFrame:0,faceX:Math.sin(v.heading||0),faceY:-Math.cos(v.heading||0),jumpHeight:0,groundHeight:0,hit:0,equipment:{head:p.equipment?.head,chest:p.equipment?.chest,gloves:p.equipment?.gloves},locomotionTransition:null,locomotionVisualDirection:undefined};}
export function drawCar(c,v,g){const w=v.w||96,h=v.h||144,a=v.heading||0,project=ps=>ps.map(p=>carProject(v,...p));if(v.sink>=1){drawVehicleWater(c,v);return;}c.save();
 const sink=v.sink||0;if(sink>0){
  // Fall below the surface first, then progressively hide the hull behind water.
  const extent=(Math.abs(Math.sin(a))*w+Math.abs(Math.cos(a))*h)*.36;
  const fall=Math.min(1,sink/.18),depth=8*fall*fall+4*sink*sink;
  const waterline=v.y+extent-Math.max(12,extent*1.88+18)*Math.max(0,(sink-.12)/.88);
  c.beginPath();c.rect(v.x-240,v.y-300,480,Math.max(0,waterline-(v.y-300)));c.clip();
  c.translate(v.x,v.y+depth);c.scale(1,1-.12*fall);c.translate(-v.x,-v.y);
 }drawCarWheels(c,v);
 if(timeOfDay(g||{})==='night'){c.save();c.globalAlpha*=.13;paint(c,[[-w*.2,-h*.49,16],[-w*.8,-h*1.3,0],[w*.8,-h*1.3,0],[w*.2,-h*.49,16]].map(p=>carProject(v,...p)),'#f5e4ad');c.restore();}
 const outline=[[-w*.39,-h*.5],[w*.39,-h*.5],[w*.47,-h*.43],[w*.47,h*.43],[w*.38,h*.5],[-w*.38,h*.5],[-w*.47,h*.43],[-w*.47,-h*.43]];
 paint(c,outline.map(([x,y])=>carProject(v,x+3,y+5,0)),'#10282155');
 // Visible vertical side faces change with heading; the car is not a rotated flat sprite.
 for(let i=0;i<outline.length;i++){const p=outline[i],q=outline[(i+1)%outline.length],dy=Math.sin(a)*(q[0]-p[0])+Math.cos(a)*(q[1]-p[1]);if(dy===0||Math.sin(a)*(p[0]+q[0])+Math.cos(a)*(p[1]+q[1])<0)continue;paint(c,project([[...p,4],[...q,4],[...q,17],[...p,17]]),i<4?palette.shadow:'#3c5d51');}
 paint(c,outline.map(([x,y])=>carProject(v,x,y,17)),palette.ink);
 paint(c,project(rect(-w*.42,-h*.46,w*.84,h*.91,18)),palette.body);
 paint(c,project(rect(-w*.38,-h*.44,w*.76,h*.21,19)),'#678a74');
 paint(c,project(rect(-w*.33,-h*.42,w*.62,h*.025,20)),palette.light);
 // Front windscreen and rear glass each reveal real seats and upright occupants.
 for(const rear of [false,true]){const corners=rear?[[-w*.32,h*.19,30],[w*.32,h*.19,30],[w*.37,h*.32,18],[-w*.37,h*.32,18]]:[[-w*.38,-h*.25,19],[w*.38,-h*.25,19],[w*.32,-h*.025,32],[-w*.32,-h*.025,32]];
 const win=glass(c,v,g,corners);c.save();c.beginPath();win.poly.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.clip();
 for(const [id,side]of (rear?[['rear-left',-1],['rear-right',1]]:[['driver',-1],['front',1]])){const x=side*w*.17,y=rear?h*.23:-h*.07;seat(c,v,x,y);const pid=(v.seats||v.occupants||{driver:v.occupiedBy})[id],p=g?.players?.find(p=>p.id===pid);if(p){const anchor=carProject(v,x,y,5);c.save();c.translate(anchor.x,anchor.y+16);c.scale(1.15,1.15);drawPlayer(c,carOccupantActor(p,v),g?.time||0,playerMotion);c.restore();}}
 c.restore();win.reflect();
 }
 // Raised roof, side windows and pillars.
 for(const side of [-1,1]){const x=side*w*.34;paint(c,project([[x,-h*.025,32],[x,h*.19,30],[side*w*.43,h*.24,18],[side*w*.43,-h*.15,19]]),'#253f40');paint(c,project([[x,-h*.01,29],[x,h*.15,28],[side*w*.42,h*.18,20],[side*w*.42,-h*.1,20]]),'#769b95');}
 paint(c,project(rect(-w*.32,-h*.025,w*.64,h*.215,33)),palette.shadow);paint(c,project(rect(-w*.29,-h*.01,w*.58,h*.18,34)),'#648773');paint(c,project(rect(-w*.26,0,w*.5,h*.022,34)),palette.light);
 for(const sign of [-1,1]){const y=sign*h*.47;paint(c,project(rect(-w*.4,y,w*.8,h*.025,14)),'#a7b29b');paint(c,project(rect(-w*.22,y,w*.44,h*.025,15)),palette.ink);for(const side of [-1,1])paint(c,project(rect(side<0?-w*.38:w*.26,sign<0?y+h*.025:y-h*.035,w*.12,h*.035,18)),sign<0?'#e5dfb0':v.braking?'#ff7253':'#b66a50');}
 drawCarHood(c,v);c.restore();drawVehicleWater(c,v);}
export function drawCarWheels(c,v){const w=v.w||96,h=v.h||144;for(const side of [-1,1])for(const y of [-h*.3,h*.28]){const x=side*w*.47,steer=y<0?v.wheelAngle||0:0,point=(dx,dy,z)=>carProject(v,x+Math.cos(steer)*dx-Math.sin(steer)*dy,y+Math.sin(steer)*dx+Math.cos(steer)*dy,z);paint(c,[point(-5,-13,2),point(5,-13,2),point(5,13,2),point(-5,13,2)],'#111e20');paint(c,[point(-5,-13,2),point(-5,-13,12),point(5,-13,12),point(5,13,12),point(-5,13,12),point(-5,13,2)],'#1b292a');paint(c,[point(-2,-8,13),point(2,-8,13),point(2,8,13),point(-2,8,13)],'#a3b0a8');}}
export function drawCarHood(c,v){if(!v.hoodOpen)return;const w=v.w||96,h=v.h||144;paint(c,[[-w*.33,-h*.43,19],[w*.33,-h*.43,19],[w*.33,-h*.25,50],[-w*.33,-h*.25,50]].map(p=>carProject(v,...p)),palette.shadow);}
