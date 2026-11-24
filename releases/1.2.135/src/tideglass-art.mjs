import {TIDEGLASS_BEACON,TIDEGLASS_CAMP,TIDEGLASS_SIGNALS,TIDEGLASS_VAULT,
 TIDEGLASS_PATHS,tideglassEdge,tideglassIntersects,tideglassPathDistance} from './tideglass-layout.mjs';
import {TIDEGLASS_SURVEYOR,tideglassBeaconLit,tideglassSignalLit} from './tideglass-quest.mjs';
import {paintTideglassBeacon,paintTideglassCamp} from './tideglass-landmark-art.mjs';

const stone=['#263e43','#374e52','#4b6464','#627775','#80928a','#a1aaa0'];
const brass=['#564942','#7c644c','#ad895f','#d0ad7c'];
const kelp=['#314c45','#4d6a51','#70906a','#a6ae71'];
const sight=(b,x,y,rx,above=rx)=>x+rx>b.left&&x-rx<b.right&&y+rx>b.top&&y-above<b.bottom;
const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,w,h);};
const face=(c,points,color)=>{
 c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x/2)*2,Math.round(y/2)*2):c.moveTo(Math.round(x/2)*2,Math.round(y/2)*2));
 c.closePath();c.fillStyle=color;c.fill();
};
function ellipse(c,x,y,w,h,color){
 c.fillStyle=color;c.beginPath();c.ellipse(x,y,w,h,0,0,Math.PI*2);c.fill();
}
function hash(x,y){
 let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967296;
}
function basalt(c,x,y,w,h,seed=0){
 const top=y-h;
 face(c,[[x-w*.65,y-4],[x-w*.34,y-14],[x+w*.6,y-10],[x+w*.89,y+10],[x-w*.25,y+16]],'#233e4170');
 face(c,[[x-w*.5,top+9],[x-w*.27,top],[x+w*.29,top-2],[x+w*.52,top+12],[x+w*.46,y-5],[x+w*.2,y+1],[x-w*.44,y-3]],stone[0]);
 face(c,[[x-w*.46,top+12],[x-w*.18,top+17],[x+w*.03,top+12],[x+w*.03,y-4],[x-w*.45,y-2]],stone[2]);
 face(c,[[x+w*.03,top+12],[x+w*.5,top+12],[x+w*.43,y-5],[x+w*.2,y-2],[x+w*.05,y-4]],stone[1]);
 face(c,[[x-w*.46,top+10],[x-w*.28,top+1],[x+w*.3,top-1],[x+w*.5,top+11],[x+w*.02,top+17]],stone[3]);
 box(c,x-w*.28,top+3,w*.35,3,stone[4]);
 for(let i=0;i<Math.min(5,h/13);i++){
  const px=x+(i%2-.6)*w*.42,py=top+17+i*14+Math.floor(hash(seed+i,29)*5);
  if(py>y-8)continue;
  box(c,px,py,4+i%2*5,2,stone[1]);
  if(i%2===0)box(c,px+2,py-2,4,2,kelp[1]);
 }
}

function ruinArch(c,x,y){
 const height=113;
 basalt(c,x-53,y,36,height,8);
 basalt(c,x+53,y-5,39,height-4,9);
 for(const [px,py,w] of [[x-45,y-111,29],[x+40,y-116,33],[x-27,y-122,29],[x+15,y-125,41]]){
  face(c,[[px-w/2,py-6],[px+w/2,py-8],[px+w/2+4,py+3],[px+w/2,py+12],[px-w/2,py+14]],stone[1]);
  face(c,[[px-w/2,py-6],[px+w/2,py-8],[px+w/2+4,py+1],[px-w/2,py+4]],stone[4]);
  box(c,px-w/2+3,py+6,w*.32,3,kelp[2]);
 }
 box(c,x-6,y-126,13,15,brass[1]);box(c,x-3,y-125,6,10,brass[3]);
}
function windflag(c,x,y,time,color){
 box(c,x-1,y-72,4,70,stone[0]);box(c,x-2,y-74,7,4,brass[2]);
 const lift=Math.round(Math.sin(time*2.8+x*.04)*2)*2;
 face(c,[[x+2,y-69],[x+23,y-66],[x+45,y-68+lift],[x+33,y-55+lift],[x+52,y-52+lift],[x+24,y-52],[x+2,y-53]],color);
 box(c,x-7,y-4,16,5,stone[2]);
}
function cairn(c,x,y,time,signal,lit){
 ellipse(c,x,y+2,22,9,'#233c3e88');
 basalt(c,x,y,39,14,x);
 basalt(c,x,y-8,23,38,y);
 const py=y-31,pulse=.7+Math.sin(time*2.2+x*.04)*.2;
 box(c,x-10,py-12,20,22,brass[0]);box(c,x-8,py-10,16,18,brass[2]);
 box(c,x-6,py-8,12,14,lit?signal.color:'#315357');
 if(lit){
  c.save();c.globalAlpha*=pulse;
  box(c,x-2,py-5,4,8,'#eef5d2');box(c,x-5,py-2,10,2,'#eef5d2');c.restore();
  for(let i=0;i<5;i++){
   const phase=(time*.65+i*.21)%1;
   c.save();c.globalAlpha*=1-phase;box(c,x+Math.sin(i*3+time)*14,y-36-phase*29,2,2,signal.color);c.restore();
  }
 }
}
function lockbox(c,x,y,lit){
 ellipse(c,x,y+1,24,8,'#2d413e99');
 face(c,[[x-21,y-29],[x-15,y-36],[x+20,y-36],[x+25,y-27],[x+23,y],[x-21,y]],stone[0]);
 box(c,x-18,y-28,38,24,brass[0]);box(c,x-18,y-26,38,4,brass[3]);
 box(c,x-14,y-19,31,12,'#5f6258');
 for(const offset of [-13,15])box(c,x+offset,y-28,4,24,brass[2]);
 box(c,x-6,y-19,13,9,brass[3]);box(c,x-2,y-18,6,6,lit?'#a4e7d3':'#263c3c');
}

function sign(c,x,y,label,side=1){
 box(c,x-2,y-45,5,45,'#43514a');box(c,x-5,y-3,12,5,stone[1]);
 const w=label.length*5.7+22;
 face(c,[[x-w/2,y-45],[x+w/2-6,y-45],[x+w/2+6*side,y-36],[x+w/2-6,y-27],[x-w/2,y-27]],brass[0]);
 box(c,x-w/2+2,y-43,w-6,14,brass[2]);
 c.save();c.font='bold 8px monospace';c.fillStyle='#273e3d';c.textAlign='center';c.fillText(label,x,y-33);c.restore();
}
function groundRing(c,x,y,radius,lit,time){
 ellipse(c,x,y+4,radius+12,radius*.58+9,stone[1]);
 ellipse(c,x,y,radius+5,radius*.56+4,stone[4]);
 ellipse(c,x,y,radius,radius*.54,stone[2]);
 ellipse(c,x,y,radius*.85,radius*.44,'#456664');
 for(let i=0;i<24;i++){
  const angle=i*Math.PI/12,x0=x+Math.cos(angle)*radius*.92,y0=y+Math.sin(angle)*radius*.49;
  box(c,x0,y0,i%4===0?7:4,i%4===0?4:2,i%4===0?brass[2]:stone[5]);
 }
 for(const [radiusScale,pace,color] of [[.76,.25,'#8fcbc2'],[.52,-.31,'#9fb4e5'],[.29,.54,'#e3bb89']]){
  for(let i=0;i<36;i++){
   const a=i*Math.PI/18;
   if(i%3!==0&&!lit)continue;
   const phase=lit?time*pace:0,r=radius*radiusScale;
   box(c,x+Math.cos(a+phase)*r,y+Math.sin(a+phase)*r*.51,i%6===0?5:3,2,color);
  }
 }
 box(c,x-3,y-3,7,7,lit?'#f5f3c5':brass[2]);
}

const scattered=new Map();
function coastPlants(cx,cy){
 const key=cx+':'+cy;
 if(scattered.has(key))return scattered.get(key);
 const result=[];
 for(let i=0;i<23;i++){
  const r=hash(cx*41+i*13,cy*73+i*17),s=hash(cx*89-i*17,cy*41+i*83),x=cx*320+20+r*280,y=cy*320+20+s*280;
  const edge=tideglassEdge(x,y);
  if(edge<14||tideglassPathDistance(x,y)<52||[TIDEGLASS_CAMP,TIDEGLASS_BEACON,...TIDEGLASS_SIGNALS].some(a=>Math.hypot(x-a.x,y-a.y)<153))continue;
  const tone=hash(cy+i, cx-i);
  result.push({x,y,tone,size:9+Math.floor(tone*14),rock:tone>.82,seed:i});
 }
 scattered.set(key,result);return result;
}
function saltLeaves(c,{x,y,tone,size,seed},time){
 const sway=Math.round(Math.sin(time*1.8+seed)*2);
 ellipse(c,x,y+1,size*.6,4,'#2c4c435c');
 for(let j=-2;j<=2;j++){
  const h=size-3*Math.abs(j),direction=j*3,top=x+direction+sway;
  face(c,[[x+j*2,y],[top-2,y-h*.71],[top,y-h],[top+2,y-h*.64],[x+j*2+2,y]],kelp[(j+4)%3]);
  if(tone>.67&&j%2===0)box(c,top-1,y-h-2,4,3,tone>.74?'#c1afcb':'#d4c79c');
 }
}
const sightSigns=[
 {x:15105,y:4760,text:'TIDEGLASS REACH'},
 {x:16355,y:4490,text:'STACKS / SOUTH SHORE'},
 {x:16680,y:2335,text:'STORMWATCH'},
];

export function drawTideglassGround(c,t,bounds){
 if(!tideglassIntersects(bounds.left,bounds.top,bounds.right,bounds.bottom))return;
 const orrery=TIDEGLASS_SIGNALS[1],lit=tideglassSignalLit(t,orrery);
 if(sight(bounds,orrery.x,orrery.y+40,160))groundRing(c,orrery.x,orrery.y+26,116,lit,t.time);
 const {x,y}=TIDEGLASS_BEACON;
 if(sight(bounds,x,y+26,180))groundRing(c,x,y+20,130,tideglassBeaconLit(t),t.time);
 for(const path of TIDEGLASS_PATHS)for(let i=1;i<path.length;i++){
  const [ax,ay]=path[i-1],[bx,by]=path[i],dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy);
  for(let d=25;d<length-12;d+=38){
   const x=ax+dx*d/length,y=ay+dy*d/length;
   if(!sight(bounds,x,y,50)||tideglassEdge(x,y)<18)continue;
   const n=hash(x,y),side=((i+Math.floor(d/38))%2?1:-1)*26;
   box(c,x-dy/length*side,y+dx/length*side,8+Math.round(n*5),4,n>.48?'#a29375':'#4e6460');
  }
 }
}

export function drawTideglassLights(c,t,bounds,dark){
 const {x,y}=TIDEGLASS_BEACON,focusY=y-173;
 if(!tideglassBeaconLit(t)||!sight(bounds,x,focusY,182))return;
 const pulse=.85+Math.sin(t.time*1.7)*.10;
 const glass=c.createRadialGradient(x+5,focusY,4,x,focusY+5,145);
 glass.addColorStop(0,'#d4fff0a6');glass.addColorStop(.23,'#9cebd366');glass.addColorStop(.57,'#65c9c233');glass.addColorStop(1,'#3b9ea000');
 const spill=c.createRadialGradient(x,y+11,15,x,y+11,158);
 spill.addColorStop(0,'#78cdc952');spill.addColorStop(.54,'#67bcb32c');spill.addColorStop(1,'#438e9600');
 c.save();c.globalCompositeOperation='screen';c.globalAlpha*=pulse*(.42+dark*.58);
 c.fillStyle=glass;c.fillRect(x-148,focusY-146,296,296);
 c.fillStyle=spill;c.fillRect(x-158,y-147,316,316);
 c.restore();
}

export function tideglassSubjects(t,bounds){
 if(!tideglassIntersects(bounds.left-360,bounds.top-280,bounds.right+360,bounds.bottom+280))return [];
 const list=[],time=t.time,add=(x,y,rx,height,paint,actor=null)=>{
  if(sight(bounds,x,y,rx,height))list.push({tideglass:{paint,actor},x,y,depth:y});
 };
 for(const node of TIDEGLASS_SIGNALS){
  const {x,y,id,color}=node,lit=tideglassSignalLit(t,node);
  add(x,y,65,100,c=>cairn(c,x,y,time,node,lit));
  if(id==='orrery'){
   for(const [dx,dy,w,h] of [[-95,5,34,77],[-80,-20,32,106],[92,-20,36,105],[100,7,30,72]]){
    add(x+dx,y+dy,29,h+10,c=>{
     basalt(c,x+dx,y+dy,w,h,dx);
     if(lit)box(c,x+dx-5,y+dy-h+10,10,3,color);
    });
   }
  }else if(id==='wind'){
   add(x,y-54,95,150,c=>ruinArch(c,x,y-54));
   add(x-80,y-8,56,78,c=>windflag(c,x-80,y-8,time,'#b8866b'));
   add(x+83,y-14,56,78,c=>windflag(c,x+83,y-14,time,'#c69a75'));
  }else{
   for(const [dx,dy,w,h] of [[-112,-38,55,99],[-62,-80,62,156],[-11,-130,57,139],[67,-88,74,171],[112,-48,66,108],[136,-6,38,70]]){
    add(x+dx,y+dy,w+20,h+18,c=>basalt(c,x+dx,y+dy,w,h,dx));
   }
  }
 }
 const {x,y}=TIDEGLASS_VAULT;
 add(x,y,60,58,c=>lockbox(c,x,y,tideglassBeaconLit(t)));
 add(TIDEGLASS_BEACON.x,TIDEGLASS_BEACON.y,185,260,c=>
  paintTideglassBeacon(c,TIDEGLASS_BEACON.x,TIDEGLASS_BEACON.y,tideglassBeaconLit(t),time));
 add(TIDEGLASS_CAMP.x,TIDEGLASS_CAMP.y,125,118,c=>paintTideglassCamp(c,TIDEGLASS_CAMP.x,TIDEGLASS_CAMP.y,time));
 for(const {x,y,text} of sightSigns)add(x,y,90,54,c=>sign(c,x,y,text));
 const mara=TIDEGLASS_SURVEYOR;
 add(mara.x,mara.y,60,75,null,mara);
 for(let cy=Math.floor((bounds.top-40)/320);cy<=Math.floor((bounds.bottom+110)/320);cy++)
  for(let cx=Math.floor((bounds.left-90)/320);cx<=Math.floor((bounds.right+90)/320);cx++)
   for(const plant of coastPlants(cx,cy))add(plant.x,plant.y,27,plant.size+15,
    plant.rock?c=>basalt(c,plant.x,plant.y,plant.size*1.7,plant.size*.7,plant.seed):c=>saltLeaves(c,plant,time));
 return list;
}
