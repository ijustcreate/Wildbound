const clamp=v=>Math.max(0,Math.min(1,v));
export function holdTelegraphGeometry({length,width,charge=0}){
 const reach=Math.max(1,Number(length)||1),half=Math.max(2,(Number(width)||8)/2),cut=Math.min(4,half*.45,reach*.1);
 return {reach,half,progress:clamp(charge/1.2),outline:[[0,-half+cut],[cut,-half],[reach-cut,-half],[reach,-half+cut],[reach,half-cut],[reach-cut,half],[cut,half],[0,half-cut]]};
}

export function drawProjectileHoldPath(c,points,{color,charge=0,lift=0}){
 if(!points.length)return;
 const first=points[0],last=points.at(-1),screenY=point=>point.y-point.z-lift;
 c.save();
 c.globalAlpha*=.55+clamp(charge/1.2)*.24;
 c.strokeStyle=color;
 c.lineWidth=1.5;
 c.lineCap='butt';
 c.setLineDash([3,7]);
 c.beginPath();
 c.moveTo(first.x,screenY(first));
 for(const point of points.slice(1))c.lineTo(point.x,screenY(point));
 c.stroke();
 c.fillStyle=color;
 c.fillRect(Math.floor(last.x),Math.floor(screenY(last)),1,1);
 c.restore();
}
