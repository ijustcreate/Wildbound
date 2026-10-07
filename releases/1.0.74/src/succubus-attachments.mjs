// Optional native-pixel attachments. Default humanoids gain no extra bones.
export const SUCCUBUS_JOINTS=Object.freeze({
 wingRootL:{parent:'chest',position:[-4,-3,24]},wingMidL:{parent:'wingRootL',position:[-12,-4,31]},wingTipL:{parent:'wingMidL',position:[-23,-3,24]},
 wingRootR:{parent:'chest',position:[4,-3,24]},wingMidR:{parent:'wingRootR',position:[12,-4,31]},wingTipR:{parent:'wingMidR',position:[23,-3,24]},
 tailBase:{parent:'pelvis',position:[0,-4,15]},tailMid:{parent:'tailBase',position:[6,-9,8]},tailTip:{parent:'tailMid',position:[12,-5,5]},
});
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function line(c,a,b,color,width=1){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)));for(let i=0;i<=n;i++)rect(c,a.x+(b.x-a.x)*i/n-width/2,a.y+(b.y-a.y)*i/n-width/2,width,width,color);}
// Fill a small integer triangle, no antialiasing, texture atlas or particles.
function triangle(c,a,b,d,color){
 const cross=(p,q,x,y)=>(q.x-p.x)*(y-p.y)-(q.y-p.y)*(x-p.x),area=cross(a,b,d.x,d.y);if(Math.abs(area)<.01)return;
 const sign=Math.sign(area);c.fillStyle=color;
 for(let y=Math.floor(Math.min(a.y,b.y,d.y));y<=Math.ceil(Math.max(a.y,b.y,d.y));y++)for(let x=Math.floor(Math.min(a.x,b.x,d.x));x<=Math.ceil(Math.max(a.x,b.x,d.x));x++)
  if([cross(a,b,x+.5,y+.5),cross(b,d,x+.5,y+.5),cross(d,a,x+.5,y+.5)].every(v=>v*sign>=0))c.fillRect(x,y,1,1);
}
export function attachmentPose(positions,actor,time,model){
 const out={...positions},flying=actor.wingHover||actor.succubusFlightHeight>1||actor.animationAction==='fly',phase=(actor.attachmentTime??time)*(flying?9:2.5),flap=Math.sin(phase);
 for(const [name,j]of Object.entries(SUCCUBUS_JOINTS)){
  const parent=name.startsWith('wing')?'chest':'pelvis',anchor=positions[parent],rest=model?.joints[parent]?.position||(parent==='chest'?[0,0,23]:[0,0,15]);
  if(out[name]){out[name]=out[name].map((v,i)=>v+anchor[i]-rest[i]);continue;}
  out[name]=j.position.map((v,i)=>v+anchor[i]-rest[i]);
  if(name.startsWith('wingMid'))out[name][2]+=flap*(flying?5:1);
  if(name.startsWith('wingTip')){out[name][0]*=flying?1:.66;out[name][2]+=flap*(flying?8:2)-4;}
  if(name.startsWith('tail'))out[name][0]+=Math.sin(phase*.6)*(name==='tailTip'?3:1);
 }
 return out;
}
export function drawHumanoidWing(c,p,side,palette={}){
 const root=p['wingRoot'+side],mid=p['wingMid'+side],tip=p['wingTip'+side],sign=side==='L'?-1:1;
 const low={x:root.x+(tip.x-root.x)*.3+sign*2,y:root.y+12},notch={x:root.x+(tip.x-root.x)*.68,y:tip.y+7};
 const ink=palette.ink||'#281e34',base=palette.base||'#564065',dark=palette.dark||'#35273f',light=palette.light||'#8e738e',bone=palette.bone||'#c3beb3';
 triangle(c,root,mid,tip,ink);triangle(c,root,tip,low,ink);
 const inner={x:mid.x+(root.x-mid.x)*.18,y:mid.y+2};
 triangle(c,root,inner,tip,base);triangle(c,root,tip,notch,base);triangle(c,root,notch,low,dark);
 for(const end of [mid,tip,notch,low])line(c,root,end,ink,2);
 line(c,root,mid,light);line(c,mid,tip,bone);line(c,mid,{x:mid.x+sign*2,y:mid.y-3},bone,2);
 line(c,tip,{x:tip.x+sign*2,y:tip.y-2},bone);
}
export function drawHumanoidTail(c,p){
 const a=p.tailBase,b=p.tailMid,d=p.tailTip,points=[a];
 for(let n=1;n<=10;n++){const t=n/10,u=1-t;points.push({x:u*u*a.x+2*u*t*b.x+t*t*d.x,y:u*u*a.y+2*u*t*b.y+t*t*d.y});}
 for(let n=1;n<points.length;n++)line(c,points[n-1],points[n],'#291c2b',3);
 for(let n=1;n<points.length;n++)line(c,points[n-1],points[n],'#935365',1);
 triangle(c,{x:d.x-3,y:d.y-3},{x:d.x+3,y:d.y-3},{x:d.x,y:d.y+4},'#342135');
 triangle(c,{x:d.x-2,y:d.y-2},{x:d.x+1,y:d.y-2},{x:d.x,y:d.y+2},'#bd7787');
}
export function drawSuccubusHorns(c,h,d,palette={}){
 const ink=palette.ink||'#2d1e28',base=palette.base||'#7c3b50',light=palette.light||'#b55c6d',trim=palette.trim||'#c0a06d';
 const profile=d===2||d===6,sign=d===2?-1:1;
 const horns=profile?[[sign*2,sign]]:[[-4,-1],[4,1]];
 for(const [x,s]of horns){for(let n=0;n<7;n++){const bend=n<4?n*.65:2-(n-4)*.6;rect(c,h.x+x+s*bend-1,h.y-5-n,3,2,ink);rect(c,h.x+x+s*bend,h.y-5-n,1,1,n<3?base:light);}rect(c,h.x+x-1,h.y-4,3,1,trim);}
 rect(c,h.x-4,h.y-4,9,1,'#352735');rect(c,h.x-3,h.y-4,7,1,'#8e6c4e');
}
export function paintSuccubusItem(c,id){
 if(id==='succubus_horns'){drawSuccubusHorns(c,{x:12,y:15},0);rect(c,8,15,9,3,'#312332');rect(c,9,15,7,1,'#c0a06d');rect(c,11,15,2,2,'#e5bf7c');return true;}
 if(id==='succubus_wings'){
  for(const [side,sign]of [['L',-1],['R',1]])drawHumanoidWing(c,{['wingRoot'+side]:{x:12,y:10},['wingMid'+side]:{x:12+sign*4,y:4},['wingTip'+side]:{x:12+sign*9,y:10}},side);
  rect(c,11,10,3,6,'#b29363');rect(c,12,11,1,3,'#eed9a2');return true;
 }
 if(id==='succubus_whip'){
  const points=[{x:6,y:21},{x:9,y:16},{x:9,y:7},{x:14,y:4},{x:20,y:7},{x:20,y:12},{x:15,y:14},{x:13,y:11}];
  for(let i=1;i<points.length;i++){line(c,points[i-1],points[i],'#302030',3);line(c,points[i-1],points[i],i===1?'#ba9760':'#974863');}rect(c,6,18,3,2,'#e1bb77');rect(c,18,7,1,4,'#da8ca6');return true;
 }return false;
}
