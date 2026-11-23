import {projectPoint,facingIndex} from './player-motion.mjs';
import {pixelVolume,pixelLine,pixelPolygon} from './pixel-shapes.mjs';
const pink={body:'#df9b96',shade:'#ad646f',light:'#f8c8b4',outline:'#633f4b'},brown={body:'#a88665',shade:'#69504a',light:'#d8b993',outline:'#443b38'};
/** Independent limbs, floppy ears and a corkscrew tail; no rotated flat sprite.
 * The sampled pose is stateless and keeps the feet anchored to world ground. */
export function pigPose(e,time){
 const frozen=e.frozen>0||e.state==='snared',dead=e.hp<=0,action=dead?'death':frozen?'idle':e.flash>0?'hurt':e.state==='flee'?'flee':e.moving?'walk':'snuffle';
 const phase=frozen||dead?0:(e.step??time*3)*(action==='flee'?1.9:1.15),stride=e.moving&&!frozen&&!dead?Math.sin(phase)*3.8:0;
 const bob=frozen||dead?0:e.moving?Math.abs(Math.sin(phase))*1.3:Math.sin(time*1.7)*.35;
 return {action,phase,stride,bob,body:dead?8:15+bob,head:dead?6:15+bob+(action==='snuffle'?Math.sin(time*2.4)*1.4:0),ear:frozen||dead?0:Math.sin(phase+.6)*1.7,tail:frozen||dead?0:Math.sin(time*3.2)*1.5};
}
export function drawPig(c,e,time,size=47){
 const pose=pigPose(e,time),pal=e.kind==='pig_spotted'?brown:pink,d=facingIndex(e.faceX,e.faceY),parts=[];
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.scale(size/47,size/47);c.imageSmoothingEnabled=false;
 const vol=(center,rx,ry,rz,p=pal)=>parts.push({depth:projectPoint(center,d).depth,paint:()=>pixelVolume(c,center,rx,ry,rz,d,p)});
 const line=(a,b,color,width=2)=>parts.push({depth:(projectPoint(a,d).depth+projectPoint(b,d).depth)/2,paint:()=>pixelLine(c,projectPoint(a,d),projectPoint(b,d),color,width)});
 const poly=(points,color)=>parts.push({depth:points.reduce((n,v)=>n+projectPoint(v,d).depth,0)/points.length,paint:()=>pixelPolygon(c,points.map(v=>projectPoint(v,d)),color)});
 for(const side of [-1,1])for(const end of [-1,1]){
  const swing=pose.stride*(side===end?1:-1),foot=[side*6,end*10+swing,1],knee=[side*6,end*10+swing*.5,5+Math.max(0,swing)*.6];
  line([side*7,end*10,pose.body-4],knee,pal.shade,4);line(knee,foot,pal.body,3);
  vol(foot,3,3,2,{...pal,body:'#65514c',light:'#ab8580',shade:'#453b39'});
  line([side*6,end*10+swing-2,2],[side*6,end*10+swing+2,2],pal.outline,1);
 }
 vol([0,-2,pose.body],11,17,10);vol([0,0,pose.body-5],8,12,4,{...pal,body:pal.light,light:pal.light});
 // Large dark saddle spot wraps over the back and both flanks of the brown pig.
 if(e.kind==='pig_spotted'){
  const spot={...pal,body:'#5c4140',shade:'#47343a',light:'#896257'};
  vol([0,-5,pose.body+8],7,7,2,spot);
  for(const side of [-1,1])vol([side*9,-6,pose.body+3],2,6,5,spot);
 }
 const curl=[[0,-18,pose.body+2],[3+pose.tail,-22,pose.body+5],[5+pose.tail,-22,pose.body+9],[3+pose.tail,-20,pose.body+10],[1+pose.tail,-21,pose.body+8],[2+pose.tail,-23,pose.body+7]];
 for(let n=1;n<curl.length;n++){line(curl[n-1],curl[n],pal.outline,3);line(curl[n-1],curl[n],pal.light,1);}
 vol([0,13,pose.head],9,9,9);vol([0,19,pose.head-2],7.5,6,5,{...pal,body:pal.light});
 const snout={...pal,body:e.kind==='pig_spotted'?'#bd9381':'#ce7885',shade:'#854959',light:'#f0b0aa'};
 vol([0,24,pose.head-1],6,3,4,snout);
 for(const side of [-1,1]){
  vol([side*2.6,26.5,pose.head],1,1,1.4,{...pal,body:'#633d4b',shade:'#633d4b',light:'#633d4b'});
  const top=pose.head+11,ear=pose.ear;
  poly([[side*5,10,top-5],[side*12,10+ear,top+3],[side*12,14+ear,top-2],[side*7,16,top-4]],pal.outline);
  poly([[side*6,11,top-5],[side*11,11+ear,top+1],[side*10,14+ear,top-3]],pal.body);
  poly([[side*7,12,top-4],[side*10,12+ear,top],[side*9,14,top-3]],snout.shade);
  const eye=[side*6.7,19,pose.head+4];vol(eye,1.4,1.3,1.6,{...pal,body:'#f8efdb',light:'#f8efdb'});
  vol([side*6.8,20,pose.head+4],.7,.7,1,{...pal,body:'#292f3c',light:'#292f3c'});
  if(pose.action==='snuffle'&&Math.floor(time*2)%9===8)line([side*5.5,20,pose.head+4],[side*7,20,pose.head+4],pal.shade,2);
 }
 line([-3,23,pose.head-4],[3,23,pose.head-4],pal.shade,1);
 parts.sort((a,b)=>a.depth-b.depth);for(const p of parts)p.paint();c.restore();return pose;
}
