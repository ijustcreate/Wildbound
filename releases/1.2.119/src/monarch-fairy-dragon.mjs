import {facingIndex,projectPoint} from './player-motion.mjs';
import {pixelLine,pixelPolygon,pixelVolume} from './pixel-shapes.mjs';

// Native articulated wildlife rig. The wing roots, shoulder pivots, hip pairs,
// neck, head, and tail remain separate moving shapes; it is never a baked frame.
export const MONARCH_FAIRY_DRAGON_RIG=Object.freeze({
 id:'monarch_fairy_dragon',views:Object.freeze([0,1,2,3,4,5,6,7]),
 joints:Object.freeze({body:[0,0,9],head:[0,6,11],tail:[0,-7,7],wingL:[-3,-1,12],wingR:[3,-1,12],foreL:[-3,4,7],foreR:[3,4,7],hindL:[-3,-4,6],hindR:[3,-4,6]}),
 clips:Object.freeze({idle:{wingRate:8,bob:.8},flutter:{wingRate:15,bob:1.8},flee:{wingRate:19,bob:2.2}}),
});

const shell={body:'#282839',shade:'#171b2c',light:'#49506a',outline:'#171827'};
const scales={body:'#d17a3e',shade:'#8d4938',light:'#f2b85d',outline:'#342638'};
const wingRamp={edge:'#30273a',lower:'#bd5738',upper:'#e28a42',lit:'#f6c96b',spot:'#fff0d0'};
const cache=new Map();

function paintPose(c,a,time,view){
 const rate=a.state==='flee'?19:a.state==='flutter'||a.moving?15:8,phase=time*rate+(a.phase||0),flutter=Math.sin(phase),spread=10+Math.abs(flutter)*2;
 const lift=flutter*6,beat=Math.round(Math.sin(phase)*5),parts=[];
 const q=v=>projectPoint(v,view);
 const poly=(points,color,depth)=>parts.push({depth,paint:()=>pixelPolygon(c,points.map(q),color)});
 const line=(from,to,color,width=1,depth=0)=>parts.push({depth,paint:()=>pixelLine(c,q(from),q(to),color,width)});
 const vol=(center,rx,ry,rz,pal,depth=0)=>parts.push({depth,paint:()=>pixelVolume(c,center,rx,ry,rz,view,pal)});

 // Far wings are deliberately dimmer and sit behind the torso; each monarch
 // wing has one broad dark rim, a warm panel, and two cream spot clusters.
 for(const side of [1,-1]){
  const far=side===-1,wingColor=far?wingRamp.lower:wingRamp.upper;
  const root=[side*2,-1,11],outer=[side*spread,-3,15+lift],tip=[side*(spread+2),-4,10+lift],inner=[side*5,-3,7+lift*.5];
  const points=[root,outer,tip,inner];
  const depth=far?-5:5;
  poly(points,wingRamp.edge,depth-1);
  poly([[side*3,-1,11],[side*(spread-2),-3,14+lift],[side*spread,-4,10+lift],[side*5,-3,8+lift*.5]],wingColor,depth);
  line([side*4,-2,10],[side*(spread-1),-3,12+lift],far?'#683b43':'#a84e36',1,depth+1);
  line([side*5,-2,9],[side*(spread-2),-3,8+lift],far?'#683b43':'#a84e36',1,depth+1);
  const spotPal={body:wingRamp.spot,shade:wingRamp.spot,light:wingRamp.spot,outline:wingRamp.spot};
  vol([side*7,-2,12+lift*.45],1.15,1,0.7,spotPal,depth+2);
  vol([side*10,-3,11+lift*.7],.8,.8,.6,spotPal,depth+2);
  // Lower lobe gives the butterfly silhouette its notched trailing edge.
  poly([[side*2,-2,9],[side*7,-4,8+lift*.4],[side*spread,-4,6+lift],[side*5,-4,5+lift*.3]],wingRamp.edge,depth-1);
  poly([[side*3,-2,9],[side*7,-4,8+lift*.4],[side*(spread-1),-4,6+lift],[side*5,-4,6+lift*.3]],far?wingRamp.lower:wingRamp.lit,depth);
  vol([side*7,-3,7+lift*.45],.9,.8,.55,spotPal,depth+1);
 }

 // Tail curves behind the compact dragon body and ends in a small leaf-shaped
 // star tip. Feet and neck are separate pivoted segments for a living gait.
 const gait=a.moving?Math.sin(time*9+(a.phase||0))*1.4:Math.sin(time*3+(a.phase||0))*.35;
  line([0,-5,8],[0,-10,7+gait],shell.outline,2,-3);
  line([0,-10,7+gait],[0,-14,8+Math.sin(time*4+(a.phase||0))],scales.shade,2,-4);
  vol([0,-15,8+Math.sin(time*4+(a.phase||0))],2,2,1.2,{body:scales.body,shade:scales.shade,light:scales.light,outline:scales.outline},-4);
 for(const side of [-1,1])for(const y of [4,-4]){
  const stride=a.moving?gait*(y>0?1:-1):0;
  line([side*2,y,7],[side*3,y+stride,4],shell.shade,1,4+side);
  line([side*3,y+stride,4],[side*3.5,y+stride+1,3],shell.outline,1,4+side);
 }
 vol([0,-1,9],6,8,4.5,{...shell,body:scales.body,shade:scales.shade,light:scales.light},7);
 // Pale throat and two short curled horns distinguish the fairy-dragon head.
 vol([0,3,8],2.7,3,2.3,{body:'#f4d8ad',shade:'#c59786',light:'#fff0d0',outline:'#74515b'},8);
 vol([0,6,11],4,4.2,3.4,{...scales},9);
 vol([0,9,10],2,2.2,1.65,{body:'#e4a050',shade:'#aa5a40',light:'#f3bd72',outline:'#75424a'},10);
 for(const side of [-1,1]){
  line([side*1.6,6,13],[side*2.6,7.4,15],scales.shade,2,10);
  if(![3,4,5].includes(view)){
   vol([side*2.15,7.4,11.8],.9,.75,.7,{body:'#243038',shade:'#243038',light:'#fff1b1',outline:'#243038'},11);
   vol([side*2.35,7.5,12.1],.4,.4,.4,{body:'#fff3bc',shade:'#fff3bc',light:'#fffbe0',outline:'#fff3bc'},12);
  }
 }
 // A pair of pinprick nostrils anchors the short dragon muzzle in the front.
 if(![3,4,5].includes(view))for(const side of [-1,1])vol([side*.8,10,10.6],.35,.45,.35,{body:'#603746',shade:'#603746',light:'#603746',outline:'#603746'},12);
 // Tiny wingbeat flicker on the brow is a single warm pixel cluster, not glow.
 line([-1.2,9,12],[0,9.7,12.5],scales.light,1,12);
 parts.sort((x,y)=>x.depth-y.depth);for(const p of parts)p.paint();
 return beat;
}

export function drawMonarchFairyDragon(c,a,time,size=38){
 const view=facingIndex(a.faceX,a.faceY),flee=a.state==='flee',rate=flee?19:a.state==='flutter'||a.moving?15:8,bob=a.hp<=0?0:Math.sin(time*(flee?9:5)+(a.phase||0))*(flee?2:1.2);
 c.save();c.translate(Math.round(a.x),Math.round(a.y-5-bob));c.scale(size/32,size/32);c.imageSmoothingEnabled=false;
 const key=[view,Math.round(Math.sin(time*rate+(a.phase||0))*5),a.moving?1:0,flee?1:0].join(':');
 let frame=cache.get(key);
 if(!frame&&globalThis.document){frame=document.createElement('canvas');frame.width=frame.height=48;const g=frame.getContext('2d');g.translate(24,24);paintPose(g,a,time,view);if(cache.size>=96)cache.delete(cache.keys().next().value);cache.set(key,frame);}
 if(frame)c.drawImage(frame,-24,-24,48,48);else paintPose(c,a,time,view);
 c.restore();
}
