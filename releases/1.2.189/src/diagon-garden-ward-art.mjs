import {GARDEN_POOL} from './diagon-garden-layout.mjs';
import {gardenManaWardRemaining,gardenPondSoak,inGardenPond} from './diagon-garden-ward.mjs';

const blue=['#4199d1','#70d0f1','#a3e6ff','#e2f9ff'];
function pixel(c,x,y,w,h,color){
 c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);
}

export function drawManaWardSparkles(c,actor,time,x=actor.x,y=actor.y-(actor.jumpHeight||0)-(actor.groundHeight||0)){
 if(actor.hp<=0||inGardenPond(actor)||gardenManaWardRemaining(actor)<=0)return;
 const seed=(Number(actor.id)||0)*.618;
 const movement=actor.moving?1:0;
 c.save();
 const alpha=c.globalAlpha;
 for(let i=0;i<7;i++){
  const age=(time*(.58+i*.031)+i*.147+seed)%1;
  const flicker=Math.sin(age*Math.PI);
  if(flicker<.13)continue;
  const angle=i*2.39996+time*.73;
  const px=x+Math.cos(angle)*(10+age*12)+age*(9-(actor.faceX||0)*movement*21);
  const py=y-10-i%3*5-age*35+Math.sin(angle)*7-(actor.faceY||0)*age*movement*12;
  c.globalAlpha=alpha*flicker*.42;
  pixel(c,px-1,py-1,3,3,blue[0]);
  c.globalAlpha=alpha*flicker;
  if(i%3===0){
   pixel(c,px-1,py,3,1,blue[1]);pixel(c,px,py-1,1,3,blue[2]);
  }
  pixel(c,px,py,1,1,blue[3]);
 }
 c.restore();
}

export function drawGardenWardWater(c,players,time){
 const swimmers=players.filter(inGardenPond);
 if(!swimmers.length)return;
 const {x,y,rx,ry}=GARDEN_POOL;
 c.save();c.beginPath();c.ellipse(x,y,rx-11,ry-9,0,0,Math.PI*2);c.clip();
 for(const p of swimmers){
  const soak=gardenPondSoak(p),charged=gardenManaWardRemaining(p)>0;
  const phase=(time*.95+(Number(p.id)||0)*.71)%1;
  for(let ring=0;ring<2;ring++){
   const t=(phase+ring*.49)%1,d=7+t*(p.moving?23:17);
   c.globalAlpha=(1-t)*(.29+(charged?.2:soak*.025));
   for(let a=0;a<20;a++){
    if((a+ring*2)%7>=5)continue;
    const angle=a*Math.PI/10;
    pixel(c,p.x+Math.cos(angle)*d,p.y+Math.sin(angle)*d*.46,2,1,ring?blue[1]:blue[2]);
   }
  }
  const steps=Math.min(5,Math.ceil(soak));
  for(let i=0;i<steps;i++){
   const a=time*.67+i*Math.PI*2/5,d=8+i%2*3;
   c.globalAlpha=.48+.30*Math.sin(time*3+i);
   pixel(c,p.x+Math.cos(a)*d,p.y+Math.sin(a)*d*.55,2,1,blue[3]);
  }
 }
 c.restore();
}
