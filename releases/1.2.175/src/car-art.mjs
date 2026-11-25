import {drawPixelShadedCar} from './car-pixel-shader.mjs';
import {drawCarRoof} from './car-roof.mjs';
import {drawVehicleWater} from './vehicle-water.mjs';
import {timeOfDay} from './night-cycle.mjs';
import {carCabinWindows,carInteriorImage} from './car-interior.mjs';
export {carOccupantActor} from './car-interior.mjs';
import {carProject} from './car-projection.mjs';
export {carProject} from './car-projection.mjs';
import {nearbyScenery} from './performance.mjs';
// Same oblique ground plane and upright height convention as articulated actors.

const paint=(c,points,color)=>{c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();};
const rect=(x,y,w,h,z)=>[[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]];
export const CAR_BODY_CLEARANCE=9;
const palette={ink:'#182b2c',shadow:'#294942',body:'#507565',light:'#86a18a',glass:'#294a50',seat:'#243b39'};
const reflectionCache=new WeakMap();
export function vehicleReflectionColors(v,g){const key=Math.floor(v.x/24)+':'+Math.floor(v.y/24)+':'+Math.floor((g?.time||0)*2);let cached=reflectionCache.get(v);if(cached?.key===key)return cached.colors;
 const trees=nearbyScenery(g?.scenery||[],v.x,v.y-60,180).filter(p=>!p.fallen&&!p.depleted&&/tree|palm/.test(p.kind)).slice(0,8),colors=[];
 for(let y=0;y<4;y++)for(let x=0;x<8;x++){let color=y<2?'#8dbcc2':'#b6cebd';if((x+Math.floor(v.x/24))%7<2&&y===0)color='#e1e7d0';for(const t of trees){const col=((Math.floor((t.x-v.x)/24)+4)%8+8)%8;if(Math.abs(x-col)<=1&&y>=1+Math.abs(x-col))color=y===3?'#345c44':'#638462';}colors.push(color);}reflectionCache.set(v,{key,colors});return colors;
}
function glass(c,v,g,corners){const poly=corners.map(p=>carProject(v,...p));paint(c,poly,palette.glass);return {poly,reflect(){const colors=vehicleReflectionColors(v,g);c.save();c.globalAlpha*=.14;for(let y=0;y<4;y++)for(let x=0;x<8;x++){const point=(u,t)=>corners[0].map((n,i)=>(n*(1-u)+corners[1][i]*u)*(1-t)+(corners[3][i]*(1-u)+corners[2][i]*u)*t);paint(c,[[x/8,y/4],[(x+1)/8,y/4],[(x+1)/8,(y+1)/4],[x/8,(y+1)/4]].map(([u,t])=>carProject(v,...point(u,t))),colors[y*8+x]);}c.restore();}};}
export function drawCar(c,v,g){
 if(!(v.sink>=1)){
  const w=v.w||96,h=v.h||144;
  paint(c,[[-w*.39,-h*.5],[w*.39,-h*.5],[w*.47,-h*.43],[w*.47,h*.43],[w*.38,h*.5],[-w*.38,h*.5],[-w*.47,h*.43],[-w*.47,-h*.43]].map(([x,y])=>carProject(v,x+3,y+5,0)),'#10282155');
  if(timeOfDay(g||{})==='night'&&!(v.sink>0)){c.save();c.globalAlpha*=.10;for(const side of[-1,1]){const x=side*w*.31;paint(c,[[x-4,-h*.515,20],[x-23,-h*1.35,0],[x+23,-h*1.35,0],[x+4,-h*.515,20]].map(p=>carProject(v,...p)),'#f5e4ad');}c.restore();}
  const seats=Object.values(v.seats||v.occupants||{driver:v.occupiedBy}),occupied=g?.players?.some(p=>seats.includes(p.id));
  // Effect timers and tracks change while parked; only shell inputs invalidate it.
  const cacheKey=occupied?null:JSON.stringify([v.x,v.y,v.w,v.h,v.heading,v.hoodOpen,v.braking,v.sink,v.wheelAngle,v.wheelRotation,vehicleReflectionColors(v,g)]);
  drawPixelShadedCar(c,v,g,drawCarShell,{cacheKey});
 }
 drawVehicleWater(c,v);
}
function drawCarShell(c,v,g){const w=v.w||96,h=v.h||144,a=v.heading||0,project=ps=>ps.map(p=>carProject(v,...p));if(v.sink>=1)return;c.save();
 const sink=v.sink||0;if(sink>0){
  // Fall below the surface first, then progressively hide the hull behind water.
  const extent=(Math.abs(Math.sin(a))*w+Math.abs(Math.cos(a))*h)*.36;
  const fall=Math.min(1,sink/.18),depth=8*fall*fall+4*sink*sink;
  const waterline=v.y+extent-Math.max(12,extent*1.88+18)*Math.max(0,(sink-.12)/.88);
  c.beginPath();c.rect(v.x-240,v.y-300,480,Math.max(0,waterline-(v.y-300)));c.clip();
  c.translate(v.x,v.y+depth);c.scale(1,1-.12*fall);c.translate(-v.x,-v.y);
 }
 drawCarWheelWells(c,v);drawCarWheels(c,v);
 const outline=[[-w*.39,-h*.5],[w*.39,-h*.5],[w*.47,-h*.43],[w*.47,h*.43],[w*.38,h*.5],[-w*.38,h*.5],[-w*.47,h*.43],[-w*.47,-h*.43]];

 // The top and the visible body faces share a fixed beltline.
 paint(c,outline.map(([x,y])=>carProject(v,x,y,23)),palette.ink);
 paint(c,project(rect(-w*.42,-h*.46,w*.84,h*.91,23)),palette.body);
 paint(c,project(rect(-w*.38,-h*.44,w*.76,h*.21,24)),'#678a74');
 paint(c,project(rect(-w*.33,-h*.42,w*.62,h*.025,24)),palette.light);
 drawCarRearDeck(c,v);
 // Tyres sit behind the body skin. Openings and trim belong to that skin,
 // so steering can never rotate or translate a wheel arch.

 drawCarBodySides(c,v,outline);
 drawCarWheelArches(c,v);
 drawCarBumpers(c,v);
 // Every visible pane reveals the same fitted cabin and seated actors.
 const cabin=carInteriorImage(v,g);
 for(const {outer,corners} of carCabinWindows(v)){
  if(outer)paint(c,project(outer),'#253f40');
  const win=glass(c,v,g,corners);c.save();c.beginPath();win.poly.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.clip();
  c.imageSmoothingEnabled=false;c.drawImage(cabin,v.x-160,v.y-150,320,240);c.restore();win.reflect();
 }
 drawCarRoof(c,v);

 drawCarHood(c,v);c.restore();}
export function carWheelGeometry(v,side,axle){const w=v.w||96,h=v.h||144,x=side*w*.40,y=axle<0?-h*.3:h*.28,steer=axle<0?v.wheelAngle||0:0;return{steer,radius:10,halfWidth:3.5,center:{x,y,z:10},point:(dx,dy,z)=>carProject(v,x+Math.cos(steer)*dx-Math.sin(steer)*dy,y+Math.sin(steer)*dx+Math.cos(steer)*dy,z)};}
export function drawCarBumpers(c,v){const w=v.w||96,h=v.h||144;for(const end of[-1,1]){
 if(Math.cos(v.heading||0)*end<=1e-8)continue;
 const y=end*(h*.5+2),face=([x,z])=>carProject(v,x,y,z),quad=(x,z,width,height,color)=>paint(c,[face([x,z]),face([x+width,z]),face([x+width,z+height]),face([x,z+height])],color);
 if(end<0){
  // The nose has its own lamps/grille above a raised, chamfered bumper.
  paint(c,[[-w*.445,12],[-w*.405,CAR_BODY_CLEARANCE],[w*.405,CAR_BODY_CLEARANCE],[w*.445,12],[w*.425,22],[w*.38,23],[-w*.38,23],[-w*.425,22]].map(face),'#1c332c');
  quad(-w*.405,15,w*.81,7.5,'#4a6b50');
  quad(-w*.215,17,w*.43,5.5,'#1c302a');
  for(const z of[18,20])quad(-w*.19,z,w*.38,1,'#778c70');
  for(const side of[-1,1]){const x=side<0?-w*.39:w*.235,lampWidth=w*.155;
   quad(x,16.5,lampWidth,6.5,'#21382e');quad(x+1,17.5,lampWidth-2,4.5,'#e6dfb1');
   quad(x+2,20,lampWidth-4,1.5,'#fff3cc');
   quad(side<0?x+1:x+lampWidth-3,17.5,2,3.5,'#c98d4c');
  }
  quad(-w*.415,11,w*.83,4,'#435b49');
  quad(-w*.39,14,w*.78,1.5,'#a0ad90');
  quad(-w*.36,CAR_BODY_CLEARANCE,w*.72,2,'#1c322b');
  for(const x of[-w*.34,w*.28])quad(x,10,w*.06,4,'#233a30');
  quad(-w*.16,10,w*.32,2,'#172c27');
  continue;
 }
 quad(-w*.445,CAR_BODY_CLEARANCE,w*.89,23-CAR_BODY_CLEARANCE,'#172e2e');quad(-w*.405,CAR_BODY_CLEARANCE+1,w*.81,21-(CAR_BODY_CLEARANCE+1),'#355b50');
 // The back reads as a hatch with paired lamps, inset plate and a low bumper.
 quad(-w*.32,14,w*.64,8,'#4a6852');quad(-w*.35,CAR_BODY_CLEARANCE,w*.70,2,'#203831');
 for(const side of[-1,1]){const x=side<0?-w*.385:w*.255;
  quad(x,15,w*.13,7,'#293d35');quad(x+1,16,w*.13-2,5,v.braking?'#ff7957':'#c47951');
  quad(side<0?x+w*.09:x+1,16,w*.025,3,'#e2d7ad');
 }
 quad(-w*.12,10,w*.24,5,'#243d32');quad(-w*.10,11,w*.20,3,'#c4c69b');
 quad(-w*.045,19,w*.09,1.5,'#20382e');
}}
function drawCarRearDeck(c,v){const w=v.w||96,h=v.h||144;
 paint(c,[[-w*.38,h*.365,23],[w*.38,h*.365,23],[w*.35,h*.475,24],[-w*.35,h*.475,24]].map(p=>carProject(v,...p)),'#5b795d');
 c.strokeStyle='#2e4b3c';c.lineWidth=1;c.beginPath();for(const [i,p]of [[-w*.31,h*.445,24],[w*.31,h*.445,24]].entries()){const q=carProject(v,...p);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);}c.stroke();
 // Rear glass wiper: one short, quiet cluster above the hatch edge.
 const a=carProject(v,-w*.10,h*.34,26),b=carProject(v,w*.09,h*.34,26);c.strokeStyle='#263e36';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
}
function drawCarDoors(c,v,side){const w=v.w||96,h=v.h||144,x=side*w*.472;
 const line=(points,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.map(([y,z])=>carProject(v,x,y,z)).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();};
 line([[-h*.165,22],[-h*.165,11],[h*.16,11],[h*.16,22]],'#263f34');
 line([[h*.025,22],[h*.025,11]],'#263f34');
 for(const y of[-h*.012,h*.135]){line([[y-2,18],[y+2,18]],'#20392f',2);line([[y-1.5,19],[y+1.5,19]],'#a4b294');}
}
export function drawCarWheels(c,v,visibleSideOnly=false){
 const wheels=[];for(const side of[-1,1])for(const axle of[-1,1]){if(visibleSideOnly&&Math.sin(v.heading||0)*side<=1e-8)continue;const geometry=carWheelGeometry(v,side,axle);wheels.push({geometry,depth:geometry.point(0,0,0).y});}
 for(const {geometry:g}of wheels.sort((a,b)=>a.depth-b.depth)){
  const ring=(x,r=g.radius)=>Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return g.point(x,Math.sin(a)*r,g.center.z+Math.cos(a)*r);});
  const inner=ring(-g.halfWidth),outer=ring(g.halfWidth),angle=(v.heading||0)+g.steer,faces=[];
  for(let i=0;i<16;i++){const j=(i+1)%16,t=(i+.5)*Math.PI/8;
   if(Math.sin(t)*Math.cos(angle)+.72*Math.cos(t)<=0)continue;
   const points=[inner[i],inner[j],outer[j],outer[i]];
   faces.push({points,depth:points.reduce((n,p)=>n+p.y,0)/4,color:Math.cos(t)>.3?'#43504b':'#1b282b'});
  }
  for(const f of faces.sort((a,b)=>a.depth-b.depth))paint(c,f.points,f.color);
  if(Math.abs(Math.sin(angle))<.06)continue;
  const visible=Math.sin(angle)>=0?g.halfWidth:-g.halfWidth;
  paint(c,ring(visible),'#152328');paint(c,ring(visible,6.5),'#7b8d7d');paint(c,ring(visible,4.5),'#344b48');
  for(let i=0;i<5;i++){const a=-(v.wheelRotation||0)+i*Math.PI*2/5,hub=g.point(visible,0,g.center.z),tip=g.point(visible,Math.sin(a)*5.3,g.center.z+Math.cos(a)*5.3);c.strokeStyle='#b9c3a4';c.lineWidth=1;c.beginPath();c.moveTo(hub.x,hub.y);c.lineTo(tip.x,tip.y);c.stroke();}
  const hub=g.point(visible,0,g.center.z);c.fillStyle='#c2c7aa';c.fillRect(Math.round(hub.x)-1,Math.round(hub.y)-1,2,2);
 }
}
function drawCarWheelWells(c,v){for(const side of[-1,1]){if(Math.sin(v.heading||0)*side<=1e-8)continue;for(const axle of[-1,1]){
 // Only the recess above the raised sill is opaque; the space below is air.
 const points=carWheelArchPoints(v,side,axle);
 paint(c,points,'#172b2a');
}}}
// Body coordinates deliberately omit wheelAngle and wheelRotation. The curve
// reaches the sill at both ends, so there are no straight opening sidewalls.
export function carWheelArchPoints(v,side,axle){const w=v.w||96,h=v.h||144,x=side*w*.47,y=axle<0?-h*.3:h*.28,limit=Math.acos((CAR_BODY_CLEARANCE-10)/12);return Array.from({length:25},(_,i)=>{const t=-limit+i*limit/12;return carProject(v,x,y+Math.sin(t)*12,10+Math.cos(t)*12);});}
function drawCarBodySides(c,v,outline){const a=v.heading||0;
 for(let i=0;i<outline.length;i++){
  const p=outline[i],q=outline[(i+1)%outline.length];
  // Clockwise footprint: outward normal is (dy,-dx).
  if(Math.sin(a)*(q[1]-p[1])-Math.cos(a)*(q[0]-p[0])<=1e-8)continue;
  c.save();c.beginPath();c.rect(v.x-300,v.y-300,600,600);
  if(i===2||i===6){const side=i===2?1:-1;for(const axle of[-1,1]){const arc=carWheelArchPoints(v,side,axle);arc.forEach((p,j)=>j?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}}
  c.clip('evenodd');
  const dx=q[0]-p[0],dy=q[1]-p[1],nx=Math.cos(a)*dy+Math.sin(a)*dx,ny=Math.sin(a)*dy-Math.cos(a)*dx;
  const light=(-nx-ny*.6)/(Math.hypot(nx,ny)||1),shade=light>.3?'#4b6b51':light<-.3?'#2a4438':'#385845';
  paint(c,[[...p,CAR_BODY_CLEARANCE],[...q,CAR_BODY_CLEARANCE],[...q,23],[...p,23]].map(p=>carProject(v,...p)),shade);
  if(i===2||i===6)drawCarDoors(c,v,i===2?1:-1);
  c.restore();
 }
}
export function drawCarWheelArches(c,v){for(const side of[-1,1]){if(Math.sin(v.heading||0)*side<=1e-8)continue;for(const axle of[-1,1]){const points=carWheelArchPoints(v,side,axle);for(const[color,width]of [['#1b3432',3],['#81988a',1]]){c.strokeStyle=color;c.lineWidth=width;c.lineCap='butt';c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}}}}
export function drawCarHood(c,v){if(!v.hoodOpen)return;const w=v.w||96,h=v.h||144;paint(c,[[-w*.33,-h*.43,24],[w*.33,-h*.43,24],[w*.33,-h*.25,50],[-w*.33,-h*.25,50]].map(p=>carProject(v,...p)),palette.shadow);}
