import {carRoofGeometry} from './car-roof.mjs';
import {carProject} from './car-projection.mjs';
import {drawPlayer,playerMotion} from './player-motion.mjs';

const paint=(c,points,color)=>{c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();};
export function carOccupantActor(p,v,seat=p.vehicleSeat||'driver'){
 return {...p,animationAction:seat==='driver'?'car_drive':'car_sit',playerFrame:0,
  faceX:Math.sin(v.heading||0),faceY:-Math.cos(v.heading||0),jumpHeight:0,groundHeight:0,hit:0,
  moving:false,swimming:false,dashTime:0,attack:0,charge:0,bowAiming:false,
  equipment:{head:p.equipment?.head,chest:p.equipment?.chest,gloves:p.equipment?.gloves},
  locomotionTransition:null,locomotionHeadDirection:undefined,locomotionVisualDirection:((v.heading||0)+Math.PI)*4/Math.PI};
}
export function carCabinWindows(v){const w=v.w||96,h=v.h||144,{base}=carRoofGeometry(v);
 const windows=[
  {id:'front',corners:[[-w*.38,-h*.25,23],[w*.38,-h*.25,23],base[1],base[0]]},
  {id:'rear',corners:[base[5],base[4],[w*.38,h*.365,23],[-w*.38,h*.365,23]]}
 ];
 for(const side of[-1,1])if(Math.sin(v.heading||0)*side>1e-8){
  const top=side<0?[base[0],base[7],base[6],base[5]]:[base[1],base[2],base[3],base[4]],outer=[...top,[side*w*.38,h*.365,23],[side*w*.38,-h*.25,23]];
  const corners=[[side*w*.36,-h*.035,35],[side*w*.36,h*.20,35],[side*w*.375,h*.33,25],[side*w*.375,-h*.20,25]];
  windows.push({id:side<0?'left':'right',outer,corners});
 }
 return windows;
}

// One shared interior image is viewed through every pane; occupants are not
// painted onto the glass, so changing sides cannot erase or duplicate them.
export function drawCarInterior(c,v,g){
 const w=v.w||96,h=v.h||144,a=v.heading||0,queue=[];
 const depth=(x,y,z=0)=>Math.sin(a)*x+Math.cos(a)*y+z*.12;
 const face=(points,color)=>queue.push({depth:points.reduce((n,p)=>n+depth(...p),0)/points.length,draw(){paint(c,points.map(p=>carProject(v,...p)),color);}});
 const box=(x,y,ww,hh,z,top,base,light)=>{
  face([[x,y,top],[x+ww,y,top],[x+ww,y+hh,top],[x,y+hh,top]],light);
  const corners=[[x,y],[x+ww,y],[x+ww,y+hh],[x,y+hh]];
  for(let i=0;i<4;i++){const p=corners[i],q=corners[(i+1)%4];if(Math.sin(a)*(q[1]-p[1])-Math.cos(a)*(q[0]-p[0])<=0)continue;face([[...p,z],[...q,z],[...q,top],[...p,top]],base);}
 };
 face([[-w*.37,-h*.25,9],[w*.37,-h*.25,9],[w*.37,h*.35,9],[-w*.37,h*.35,9]],'#1d3031');
 // Dashboard, glovebox, instrument binnacle and broad vent clusters.
 box(-w*.35,-h*.245,w*.70,h*.085,14,23,'#263a3b','#4e625c');
 box(-w*.27,-h*.228,w*.20,h*.045,23,26,'#203333','#657b6c');
 face([[-w*.255,-h*.228,26.1],[-w*.09,-h*.228,26.1],[-w*.09,-h*.2,26.1],[-w*.255,-h*.2,26.1]],'#172f32');
 for(const x of[-w*.23,-w*.16])box(x,-h*.221,w*.035,h*.01,26,26.3,'#97ab90','#97ab90');
 for(const x of[-w*.045,w*.19])box(x,-h*.207,w*.10,h*.016,23,23.4,'#1d3031','#1d3031');
 box(-3,-h*.13,6,h*.34,9,13,'#283b39','#66786a');
 box(-1,-h*.025,2,3,13,18,'#1c3030','#acb49a');
 for(const [id,side,rear]of[['driver',-1,false],['front',1,false],['rear-left',-1,true],['rear-right',1,true]]){
  const x=side*w*.18,y=rear?h*.27:-h*.10,sw=w*.235;
  box(x-sw/2,y-8,sw,17,10,15,'#394a43','#82917b');
  box(x-sw/2,y+5,sw,4,15,28,'#46594d','#8b9b83');
  box(x-sw*.33,y+5,sw*.66,3,28,32,'#53665a','#a6b29a');
  const pid=(v.seats||v.occupants||{driver:v.occupiedBy})[id],p=g?.players?.find(p=>p.id===pid);
  if(p)queue.push({depth:depth(x,y,18),draw(){const anchor=carProject(v,x,y,6);c.save();c.translate(anchor.x,anchor.y);c.scale(1.05,1.05);drawPlayer(c,carOccupantActor(p,v,id),g?.time||0,playerMotion);c.restore();}});
 }
 // Tilted steering ring, column and rotating spokes in front of the driver.
 const wheelX=-w*.18,wheelY=-h*.10-7.4,wheelZ=23;
 queue.push({depth:depth(wheelX,wheelY,wheelZ),draw(){
  const point=(x,t)=>carProject(v,wheelX+x,wheelY+Math.sin(t)*2.7,wheelZ+Math.sin(t)*3.7);
  const centre=carProject(v,wheelX,wheelY,wheelZ),ring=Array.from({length:17},(_,i)=>{const t=i*Math.PI/8;return point(Math.cos(t)*5,t);});
  c.strokeStyle='#172a2d';c.lineWidth=2.2;c.beginPath();ring.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();
  c.strokeStyle='#9aa38b';c.lineWidth=1;
  for(let i=0;i<3;i++){const t=i*Math.PI*2/3+(v.wheelAngle||0)*2,p=point(Math.cos(t)*4.4,t);c.beginPath();c.moveTo(centre.x,centre.y);c.lineTo(p.x,p.y);c.stroke();}
  c.fillStyle='#2b4241';c.fillRect(centre.x-1.5,centre.y-1.5,3,3);
 }});
 for(const item of queue.sort((a,b)=>a.depth-b.depth))item.draw();
}

let cabinCanvas;
export function carInteriorImage(v,g){
 cabinCanvas??=document.createElement('canvas');
 if(cabinCanvas.width!==640){cabinCanvas.width=640;cabinCanvas.height=480;}
 const c=cabinCanvas.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,640,480);c.translate(320,300);c.scale(2,2);
 drawCarInterior(c,{...v,x:0,y:0},g);return cabinCanvas;
}
