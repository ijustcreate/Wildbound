import {drawParticleEffect} from './particles.mjs';
import {pixelPolygon} from './pixel-shapes.mjs';

const brick=['#77645c','#8b766a','#8c7c70','#6c5f59','#987f6c'];
const amber=['#553320','#a94c20','#ed9a3e','#f9d68d'];
const emerald=['#175959','#238463','#64dc81','#dcffd0'];
const pixel=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};

export function drawFlooHearth(c,time=0,green=false){
 const r=(...args)=>pixel(c,...args);
 r(-25,0,50,5,'#20232674');r(-23,-42,46,43,'#302b2b');
 for(let row=0;row<7;row++){
  const y=-42+row*6;
  for(let column=row%2?-1:0;column<5;column++){
   const x=-23+column*10+(row%2?5:0),left=Math.max(-22,x),right=Math.min(22,x+9);
   if(right<=left)continue;
   r(left,y+1,right-left,5,brick[(row*3+column+5)%brick.length]);
   r(left,y+1,right-left,1,'#b2987b66');
  }
 }
 r(-17,-29,34,30,'#42312d');r(-15,-25,30,26,'#2a2729');r(-12,-30,24,5,'#2a2729');
 r(-22,-31,7,29,'#a98f78');r(15,-31,7,29,'#63534e');
 r(-23,-39,46,6,'#51433f');r(-24,-44,48,5,'#af937a');r(-25,-45,50,2,'#c2a58a');
 r(-19,-31,38,2,'#ba9d7f');r(-11,-30,22,1,'#89705f');r(-21,-1,42,4,'#7a675e');
 r(-14,-3,28,2,'#995f3a');r(-10,-4,20,2,'#332a27');r(-10,-5,6,1,'#e18b51');r(1,-5,8,1,'#c96940');
 const colors=green?emerald:amber;
 const timeStep=Math.floor(time*16)/16;
 for(let i=0;i<4;i++){
  const x=-9+i*6,y=-5+(i%2),pulse=Math.sin(timeStep*(9+i)+i*2.8),height=9+i%3*2+Math.round((pulse+1)*3)+(green?7:0);
  const lean=Math.round(Math.sin(timeStep*7+i*1.4)*3);
  const tongue=[[x-5,y],[x-5,y-height*.36],[x-3+lean,y-height*.58],[x+lean,y-height],
   [x+lean+2,y-height*.56],[x+4,y-height*.34],[x+5,y]];
  pixelPolygon(c,tongue.map(([x,y])=>({x,y})),colors[1]);
  pixelPolygon(c,tongue.map(([u,v])=>({x:x+(u-x)*.66,y:y+(v-y)*.79})),colors[2]);
  pixelPolygon(c,tongue.map(([u,v])=>({x:x+(u-x)*.42,y:y+(v-y)*.48})),colors[3]);
 }
 if(!green){
  c.save();c.beginPath();c.rect(-14,-28,28,24);c.clip();c.globalAlpha*=.46;
  c.translate(0,-4);c.scale(.65,.65);drawParticleEffect(c,'campfire-flame',0,0,time,47);c.restore();
 }
 for(let i=0;i<5;i++){
  const phase=(time*(.76+i*.05)+i*.37)%1,x=Math.sin(i*1.9+phase*2.4)*(5+phase*6);
  if(phase<.88)r(x,-9-phase*22,1+(i%3===0),1,colors[2+(i%2)]);
 }
 if(green)for(let i=0;i<18;i++){
  const phase=(time*1.7+i*.113)%1,x=Math.sin(phase*7+i*1.23)*(10+18*phase);
  r(x,-8-phase*76,phase<.5?3:2,phase<.5?3:2,colors[1+(i%3)]);
 }
}
