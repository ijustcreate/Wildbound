const mix=(hex,target,t)=>'#'+[1,3,5].map((k,i)=>Math.round(parseInt(hex.slice(k,k+2),16)*(1-t)+target[i]*t).toString(16).padStart(2,'0')).join('');
export const portalPalette=color=>[.88,.7,.48,.25,0].map(t=>mix(color,[5,12,18],t)).concat([.3,.65,1].map(t=>mix(color,[245,255,250],t)));
export function portalFloorSamples(time){
 return Array.from({length:20},(_,i)=>{
  const u=((time*.42+i*.618034)%1+1)%1,a=i*2.399963+time*.38,r=7+(1-u)*24;
  const x=Math.cos(a)*r,groundY=Math.sin(a)*r*.32,z=Math.max(0,(u-.32)/.68)**2*15;
  return {x,y:groundY-z,groundY,z,alpha:Math.sin(u*Math.PI)*.8};
 });
}
export function drawPortalFloor(c,time,color,front){
 const pal=portalPalette(color),samples=portalFloorSamples(time);c.save();const alpha=c.globalAlpha;c.globalCompositeOperation='lighter';
 if(!front){
  // Elliptical light follows the floor plane, with a tight contact core.
  for(let n=6;n>=1;n--){c.globalAlpha=alpha*(.012+(7-n)*.004);c.fillStyle=pal[4];c.beginPath();c.ellipse(0,0,6+n*5,1+n*1.45,0,0,Math.PI*2);c.fill();}
  for(let i=0;i<42;i++){const a=i*Math.PI*2/42,r=17+Math.sin(time*2+i*.3)*1.2;c.globalAlpha=alpha*(.09+.15*Math.max(0,Math.sin(a+time)));c.fillStyle=pal[5];c.fillRect(Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r*.3),2,1);}
 }
 for(const p of samples){if((p.groundY>=0)!==front)continue;
  c.globalAlpha=alpha*p.alpha*.12*(1-p.z/20);c.fillStyle=pal[4];c.beginPath();c.ellipse(p.x,p.groundY,2.2, .7,0,0,Math.PI*2);c.fill();
  c.globalAlpha=alpha*p.alpha*.3;c.fillStyle=pal[4];c.fillRect(Math.round(p.x),Math.round(p.y+2),1,2);
  c.globalAlpha=alpha*p.alpha;c.fillStyle=p.z>5?pal[6]:pal[5];c.fillRect(Math.round(p.x),Math.round(p.y),p.z>5?1:2,1);
 }c.restore();
}
