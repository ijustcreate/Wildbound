// Cosmetic, world-anchored air. No emitters, saved actors or gameplay RNG.
import {drawShadowGroundFog} from './shadow-ground-fog.mjs';
export const SHADOW_AIR_BUDGET=Object.freeze({motes:144,dust:240,fog:24});
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
// Coarsen at wide zooms so work stays bounded even in a whole-world preview.
function cells(bounds,spacing,limit,draw){
 const {left,top,right,bottom}=bounds;
 let step=spacing;
 while((Math.ceil((right-left)/step)+3)*(Math.ceil((bottom-top)/step)+3)>limit)step*=1.25;
 let count=0;
 for(let y=Math.floor(top/step)-1;y<=Math.floor(bottom/step)+1;y++)for(let x=Math.floor(left/step)-1;x<=Math.floor(right/step)+1;x++){
  if(count>=limit)return count;
  if(draw(x,y,step)!==false)count++;
 }
 return count;
}
export function drawShadowAir(c,g,{sx=0,sy=0,ex=50,ey=50}={}){
 const counts={motes:0,dust:0,fog:0};if(g.generatedEnvironment!=='shadow')return counts;
 const bounds={left:sx*32,top:sy*32,right:(ex+1)*32,bottom:(ey+1)*32};
 if(!Object.values(bounds).every(Number.isFinite)||bounds.right<=bounds.left||bounds.bottom<=bounds.top)return counts;
 const time=g.time||0,seed=g.seed||0;
 c.save();c.beginPath();c.rect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top);c.clip();
 counts.fog=drawShadowGroundFog(c,g,{sx,sy,ex,ey},'front');
 counts.dust=cells(bounds,60,SHADOW_AIR_BUDGET.dust,(gx,gy,step)=>{
  const h=hash(gx+seed+73,gy),j=hash(gy+61,gx),phase=(time*(.025+h*.025)+j)%1;
  const x=(gx+h)*step+Math.sin(time*.16+j*9)*9+(phase-.5)*26,y=(gy+j)*step-phase*30;
  c.globalAlpha=(.1+h*.24)*Math.sin(phase*Math.PI);c.fillStyle=h>.6?'#c5b9d8':'#afc5c9';
  c.fillRect(Math.round(x),Math.round(y),h>.85?2:1,1);
 });
 counts.motes=cells(bounds,92,SHADOW_AIR_BUDGET.motes,(gx,gy,step)=>{
  const h=hash(gx+seed+19,gy),j=hash(gy-23,gx),phase=time*(.35+h*.35)+j*12;
  const x=Math.round((gx+h)*step+Math.sin(phase*.6)*15),y=Math.round((gy+j)*step+Math.cos(phase*.47)*20);
  const pulse=.45+.55*(.5+.5*Math.sin(phase)),color=h<.4?'#f395dc':h<.74?'#be95ff':'#a3e0e7',size=h>.8?2:1;
  c.fillStyle=color;c.globalAlpha=pulse*.035;c.fillRect(x-6,y-6,13,13);
  c.globalAlpha=pulse*.12;c.fillRect(x-3,y-3,7,7);c.globalAlpha=pulse*.72;c.fillRect(x,y,size,size);
  if(h>.88){c.globalAlpha=pulse*.25;c.fillRect(x-2,y,6,1);c.fillRect(x,y-2,1,6);}
 });
 c.restore();return counts;
}
