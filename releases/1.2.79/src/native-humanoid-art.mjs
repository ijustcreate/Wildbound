import {drawOrientedPixelVolume} from './murk-wolf-pixels.mjs';
import {projectPoint} from './player-motion.mjs';
import {gearPalette} from './gear-art.mjs';
import {pixelPolygon} from './pixel-shapes.mjs';
import {ellipse} from './player-motion.mjs';

const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const unit=v=>{const len=Math.hypot(...v)||1;return v.map(n=>n/len);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const mix=(a,b,t=.5)=>a.map((v,i)=>v+(b[i]-v)*t);
const cache=new Map();
function basis(up,right=[1,0,0]){
  const z=unit(up),y=unit(cross(z,right));return [unit(cross(y,z)),y,z];
}
function material(color,join=false){
  const p=gearPalette(null,color);
  return {body:p.base,shade:p.dark,light:p.light,outline:join?p.dark:p.ink};
}
function volume(c,origin,axes,radii,d,palette){
  // Each local piece is cached on its own orientation, palette and geometry;
  // translation never invalidates it. Bound the cache during long play sessions.
  if(typeof document==='undefined'||!c.drawImage)return drawOrientedPixelVolume(c,origin,axes,radii,d,palette);
  const rounded=axes.map(v=>v.map(n=>Math.round(n*32)/32));
  const key=JSON.stringify([rounded,radii.map(n=>Math.round(n*8)/8),d,palette]);
  let image=cache.get(key);
  if(!image){
    image=document.createElement('canvas');image.width=image.height=96;
    const pen=image.getContext('2d');pen.translate(48,48);
    drawOrientedPixelVolume(pen,[0,0,0],rounded,radii,d,palette);
    if(cache.size>=384)cache.delete(cache.keys().next().value);
    cache.set(key,image);
  }
  const p=projectPoint(origin,d);c.save();c.imageSmoothingEnabled=false;
  c.drawImage(image,Math.round(p.x)-48,Math.round(p.y)-48);c.restore();
}
function segment(c,a,b,width,d,color,right,join=true){
  const p=projectPoint(a,d),q=projectPoint(b,d),mat=material(color,join);
  const length=Math.hypot(q.x-p.x,q.y-p.y)||1,nx=-(q.y-p.y)/length,ny=(q.x-p.x)/length;
  const shape=(radius,taper=1)=>[{x:p.x+nx*radius,y:p.y+ny*radius},{x:q.x+nx*radius*taper,y:q.y+ny*radius*taper},{x:q.x-nx*radius*taper,y:q.y-ny*radius*taper},{x:p.x-nx*radius,y:p.y-ny*radius}];
  pixelPolygon(c,shape(width/2+.4,.8),mat.outline);
  ellipse(c,p.x,p.y,width/2,width/2,mat.outline);ellipse(c,q.x,q.y,width*.4,width*.4,mat.outline);
  pixelPolygon(c,shape(Math.max(.6,width/2-.3),.8),mat.body);
  const offset=width*.22;
  pixelPolygon(c,[{x:p.x-nx*offset-.5,y:p.y-ny*offset},{x:q.x-nx*offset-.5,y:q.y-ny*offset},{x:q.x-nx*offset+.3,y:q.y-ny*offset},{x:p.x-nx*offset+.3,y:p.y-ny*offset}],mat.light);
}
export function drawNativeArm(c,points,side,d,shirt,skin,part='all'){
  const shoulder=points['shoulder'+side],elbow=points['elbow'+side],hand=points['hand'+side];
  const right=unit(sub(points.shoulderR,points.shoulderL));
  if(part!=='lower'){
    segment(c,shoulder,elbow,3.7,d,skin,right);
    segment(c,shoulder,mix(shoulder,elbow,.58),4.4,d,shirt,right);
  }
  if(part!=='upper'){
    segment(c,elbow,hand,3.1,d,skin,right);
    volume(c,hand,basis(sub(hand,elbow),right),[1.65,1.25,1.8],d,material(skin));
    const thumb=projectPoint(hand.map((v,i)=>v+right[i]*(side==='L'?1:-1)*1.1),d),p=material(skin);
    c.fillStyle=p.light;c.fillRect(Math.round(thumb.x),Math.round(thumb.y),1,1);
  }
  return true;
}
export function drawNativeLeg(c,points,side,d,color){
  const hip=points['hip'+side],knee=points['knee'+side],foot=points['foot'+side];
  const right=unit(sub(points.hipR,points.hipL));
  segment(c,hip,knee,4.8,d,color,right);
  segment(c,knee,foot,3.9,d,color,right);
  return true;
}
export function drawNativeTorso(c,points,d,color,skin){
  const up=sub(points.chest,points.pelvis),right=unit(sub(points.shoulderR,points.shoulderL));
  const axes=basis(up,right),length=Math.hypot(...up);
  // Let the collar support the jaw instead of exposing a narrow skin post.
  segment(c,points.chest,mix(points.chest,points.head,.64),3.8,d,skin,right);
  const breadth=Math.hypot(...sub(points.shoulderR,points.shoulderL))/2;
  const chest=projectPoint(points.chest,d),pelvis=projectPoint(points.pelvis,d),mat=material(color);
  const half=(d===2||d===6)?3.3:(d===0||d===4)?breadth+1:breadth+.3;
  const shoulderStep=(d===2||d===6)?0:1;
  const rearLift=d>=3&&d<=5?2:0;
  pixelPolygon(c,[{x:chest.x-half+shoulderStep,y:chest.y-1-rearLift},{x:chest.x+half-shoulderStep,y:chest.y-1-rearLift},{x:chest.x+half+.4,y:chest.y+.6-rearLift},{x:chest.x+half+.2,y:chest.y+2-rearLift},{x:chest.x+half-.4,y:chest.y+3},{x:pelvis.x+half*.75,y:pelvis.y+1},{x:pelvis.x-half*.75,y:pelvis.y+1},{x:chest.x-half+.4,y:chest.y+3},{x:chest.x-half-.2,y:chest.y+2-rearLift},{x:chest.x-half-.4,y:chest.y+.6-rearLift}],mat.outline);
  pixelPolygon(c,[{x:chest.x-half+.7,y:chest.y-rearLift},{x:chest.x+half-.7,y:chest.y-rearLift},{x:chest.x+half-.5,y:chest.y+1-rearLift},{x:chest.x+half-.9,y:chest.y+2.5-rearLift},{x:pelvis.x+half*.75-.5,y:pelvis.y},{x:pelvis.x-half*.75+.5,y:pelvis.y},{x:chest.x-half+.9,y:chest.y+2.5-rearLift},{x:chest.x-half+.5,y:chest.y+1-rearLift}],mat.body);
  pixelPolygon(c,[{x:chest.x-half+.8,y:chest.y},{x:chest.x-half+2,y:chest.y},{x:pelvis.x-half*.75+1.7,y:pelvis.y-1},{x:pelvis.x-half*.75+.7,y:pelvis.y-1}],mat.light);
  pixelPolygon(c,[{x:chest.x+half-1.5,y:chest.y+1},{x:chest.x+half-.7,y:chest.y+1},{x:pelvis.x+half*.75-.5,y:pelvis.y},{x:pelvis.x+half*.75-1.4,y:pelvis.y}],mat.shade);
  const shoulders=mix(points.shoulderL,points.shoulderR);
  // Shoulder sleeves meet the torso silhouette without another floating oval.
  // Broad collar folds and a single front closure, attached in the torso frame.
  const collar=gearPalette(null,color),front=axes[1];
  if(d<3||d>5){
    for(const side of [-1,1]){
      const q=shoulders.map((v,i)=>v+right[i]*side*1.7+front[i]*2.7+axes[2][i]*.6),p=projectPoint(q,d);
      c.fillStyle=collar.light;c.fillRect(Math.round(p.x)-1,Math.round(p.y),2,2);
    }
    const a=projectPoint(shoulders.map((v,i)=>v+front[i]*2.8),d);
    c.fillStyle=collar.dark;c.fillRect(Math.round(a.x),Math.round(a.y)+2,1,Math.max(1,Math.round(length*.55)));
  }
  return true;
}
export function drawNativePelvis(c,points,d,color,plain=false){
  const right=unit(sub(points.hipR,points.hipL)),axes=basis(sub(points.chest,points.pelvis),right);
  const center=mix(points.hipL,points.hipR);center[2]+=.7;
  volume(c,center,axes,[Math.hypot(...sub(points.hipR,points.hipL))/2+1.6,2.4,2.4],d,material(color));
  const waist=points.pelvis.map((v,i)=>v+axes[1][i]*2.5),p=projectPoint(waist,d);
  if(!plain&&(d<3||d>5)){c.fillStyle='#624735';c.fillRect(Math.round(p.x)-3,Math.round(p.y)-1,7,1);c.fillStyle='#bda16c';c.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,2,1);}
  return true;
}
