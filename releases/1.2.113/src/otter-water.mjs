import {drawWaterline} from './swim-render.mjs';
export function drawOtterWater(c,a,time,draw){
 const depth=['dive','underwater','surface'].includes(a.animationAction)?Math.max(0,Math.min(1,a.otterDiveDepth||0)):0;
 if(depth<.85)drawWaterline(c,a,time,actor=>{c.save();c.globalAlpha*=1-depth*.4;draw(actor);c.restore();},{shift:-4,radius:17,bob:.4});
 if(depth>.12){c.save();c.strokeStyle='#b5e0d2a0';c.lineWidth=1;for(let i=0;i<3;i++){const phase=(time*1.7+i*.31)%1,x=a.x+Math.sin((a.id||0)+i*2)*7,y=a.y-phase*7;c.beginPath();c.ellipse(Math.round(x),Math.round(y),1+phase*1.7,.7+phase,0,0,Math.PI*2);c.stroke();}c.restore();}
}
