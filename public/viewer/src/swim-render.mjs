import {BREATH_SECONDS} from './swimming.mjs';
export function drawSwimmer(c,a,time,draw){
 const depth=a.diveDepth||0;c.save();
 if(depth>.12){c.fillStyle=`rgba(4,29,38,${.56-depth*.2})`;c.beginPath();c.ellipse(a.x,a.y,13-depth*7,6-depth*3,0,0,Math.PI*2);c.fill();}
 else{c.beginPath();c.rect(a.x-70,a.y-90,140,91);c.clip();draw({...a,y:a.y+20+Math.sin(time*3)*.6,equipment:{...a.equipment,hand1:null,hand2:null,cape:null},groundHeight:0});}
 c.restore();
 if(depth<=.12){c.save();c.strokeStyle='#b5f4e9aa';c.lineWidth=1;c.beginPath();c.ellipse(a.x,a.y+1,12+Math.sin(time*4),3,0,0,Math.PI);c.stroke();c.restore();}
}
export function drawBreath(c,a){
 if(!(a.breathVisible>0))return;c.save();c.globalAlpha*=a.breathVisible;c.fillStyle='#102b35';c.fillRect(a.x-17,a.y+10,34,6);c.fillStyle=a.breath<5?'#fa8976':'#a3efff';c.fillRect(a.x-16,a.y+11,32*Math.max(0,Math.min(1,a.breath/BREATH_SECONDS)),4);c.font='5px monospace';c.textAlign='center';c.fillStyle='#e0ffff';c.fillText('AIR',a.x,a.y+23);c.restore();
}
