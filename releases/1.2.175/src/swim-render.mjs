import {BREATH_SECONDS} from './swimming.mjs';
export function drawSwimmer(c,a,time,draw){
 const depth=a.diveDepth||0;c.save();
 if(depth>.12){c.fillStyle=`rgba(4,29,38,${.56-depth*.2})`;c.beginPath();c.ellipse(a.x,a.y,13-depth*7,6-depth*3,0,0,Math.PI*2);c.fill();}
 else{c.beginPath();c.rect(a.x-70,a.y-90,140,91);c.clip();draw({...a,y:a.y+20+Math.sin(time*3)*.6,equipment:{...a.equipment,hand1:null,hand2:null,cape:null},groundHeight:0});}
 c.restore();
}
export function drawBreath(c,a){
 if(!(a.breathVisible>0))return;c.save();c.globalAlpha*=a.breathVisible;c.fillStyle='#102b35';c.fillRect(a.x-17,a.y+10,34,6);c.fillStyle=a.breath<5?'#fa8976':'#a3efff';c.fillRect(a.x-16,a.y+11,32*Math.max(0,Math.min(1,a.breath/BREATH_SECONDS)),4);c.font='5px monospace';c.textAlign='center';c.fillStyle='#e0ffff';c.fillText('AIR',a.x,a.y+23);c.restore();
}
export function drawSwimBubbles(c,effect){
 const age=Math.max(0,effect.duration-effect.life),depth=effect.swimDepth||0;
 const alpha=c.globalAlpha*(1-depth*.78)*.58;
 c.save();c.fillStyle='#b5e8e3';
 for(let i=0;i<2;i++){
  const step=age-i*.10;
  if(step<0)continue;
  const x=Math.round(effect.x+(i?3:-1)+Math.sin(step*8+effect.seed)*1.3);
  const y=Math.round(effect.y+depth*5-step*16);
  c.globalAlpha=alpha*Math.max(0,1-step/.5);
  c.fillRect(x,y,i?1:2,1);
 }
 c.restore();
}
export function drawWaterline(c,a,time,draw,{bob=1,shift=0,radius=17}={}){
 const phase=Number.isFinite(a.id)?a.id:a.x*.13+a.y*.03;
 const wave=Math.sin(time*2.7+phase)*.75*bob;
 c.save();c.beginPath();c.rect(a.x-radius*4,a.y-radius*4,radius*8,radius*4+1);c.clip();
 c.translate(0,wave);draw({...a,y:a.y+shift});c.restore();
 c.save();c.strokeStyle='#b5f4e9b8';c.lineWidth=1;
 for(const side of [-1,1]){c.beginPath();c.ellipse(a.x+side*(radius*.65),a.y+1,radius*.65+Math.sin(time*3+side)*1.5,2.5,0,side<0?0:Math.PI,side<0?Math.PI:Math.PI*2);c.stroke();}
 c.restore();
}
