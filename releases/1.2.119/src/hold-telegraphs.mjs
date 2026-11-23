const clamp=v=>Math.max(0,Math.min(1,v));
const round=Math.round;
export function holdTelegraphGeometry({length,width,charge=0}){
 const reach=Math.max(1,Number(length)||1),half=Math.max(2,(Number(width)||8)/2),cut=Math.min(4,half*.45,reach*.1);
 return {reach,half,progress:clamp(charge/1.2),outline:[[0,-half+cut],[cut,-half],[reach-cut,-half],[reach,-half+cut],[reach,half-cut],[reach-cut,half],[cut,half],[0,half-cut]]};
}
function path(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(round(x),round(y)):c.moveTo(round(x),round(y)));c.closePath();}
// Ground-space pixel geometry only: bounded strokes, no blur, textures or particle simulations.
export function drawHoldTelegraph(c,{x,y,dx=1,dy=0,length,width,charge=0,time=0,color='#b7f5dc',kind='spell',scale=1,reducedMotion=false}){
 const {reach,half,progress,outline}=holdTelegraphGeometry({length,width,charge}),ready=progress>=1;
 c.save();c.translate(round(x),round(y));c.rotate(Math.atan2(dy,dx));c.lineJoin='miter';
 // 1. A shaped footprint with a dark keyline and inset rails reads over bright sand and dark grass alike.
 path(c,outline);c.fillStyle=color;c.globalAlpha*=ready?.14:.075;c.fill();c.globalAlpha/=ready?.14:.075;
 c.strokeStyle='#102d2b';c.lineWidth=4*scale;c.stroke();c.strokeStyle=color;c.lineWidth=1*scale;c.stroke();
 c.globalAlpha*=.45;c.strokeStyle=color;c.lineWidth=1;
 for(const side of [-1,1]){c.beginPath();c.moveTo(7,side*(half-3));c.lineTo(reach-9,side*(half-3));c.stroke();}
 c.globalAlpha/=.45;
 // 2. Eight charging notches and a gathering ground ring make partial and full charge distinguishable.
 for(let i=0;i<8;i++){
  c.globalAlpha*=i<Math.floor(progress*8+1e-6)?.95:.18;c.fillStyle=color;
  const at=8+(reach-22)*(i+.5)/8;
  for(const side of [-1,1])c.fillRect(round(at)-1,round(side*(half+3))-1,2,2);
  c.globalAlpha/=i<Math.floor(progress*8+1e-6)?.95:.18;
 }
 c.strokeStyle=color;c.lineWidth=1.5*scale;
 for(let i=0;i<8;i++){const start=i*Math.PI/4+.06,end=Math.min((i+1)/8,progress)*Math.PI*2-.02;if(end>start){c.beginPath();c.arc(0,0,8*scale,start,end);c.stroke();}}
 // 3. Flowing chevrons lead to a split landing reticle; readiness locks a bright core into the marker.
 const phase=reducedMotion?0:(time*.8)%1;
 for(let i=0;i<3;i++){
  const at=12+(reach-30)*((i+phase)/3);c.globalAlpha*=.25+progress*.45;c.strokeStyle=color;c.lineWidth=1*scale;
  c.beginPath();c.moveTo(round(at-3),-3);c.lineTo(round(at),0);c.lineTo(round(at-3),3);c.stroke();c.globalAlpha/=.25+progress*.45;
 }
 c.strokeStyle=color;c.lineWidth=1.5*scale;
 const radius=Math.max(5,half*.7);
 c.save();c.translate(round(reach),0);
 if(kind==='sword'){
  for(const side of [-1,1]){c.beginPath();c.moveTo(-5,side*(half+2));c.lineTo(2,side*(half+2));c.lineTo(2,side*(half-2));c.stroke();}
  path(c,[[-4,0],[0,-4],[4,0],[0,4]]);c.stroke();
 }else{
  for(let i=0;i<4;i++){c.beginPath();c.arc(0,0,radius,i*Math.PI/2+.2,(i+1)*Math.PI/2-.2);c.stroke();}
  c.beginPath();c.moveTo(-3,0);c.lineTo(3,0);c.moveTo(0,-3);c.lineTo(0,3);c.stroke();
 }
 if(ready){c.fillStyle='#fff4cd';c.fillRect(-1,-1,3,3);c.fillStyle=color;c.fillRect(-3,-1,1,2);c.fillRect(3,-1,1,2);}
 c.restore();c.restore();
}
