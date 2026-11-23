import {projectPoint} from './player-motion.mjs';

// One warm silhouette around joined anatomical volumes. Depth-tested surfaces
// keep the cream muzzle/eyes on the face as the animal turns, not on its back.
const sprites=new Map();
export const OTTER_ART_REVISION=2,OTTER_CACHE_LIMIT=128;
function rasterOtter(model,pose,d,actor){
 const pal=model.palette,s=model.shape,fur=[pal.outline,pal.shade,pal.body,pal.light],cream=[pal.shade,pal.creamShade,pal.cream,pal.creamLight],dark=[pal.nose,pal.nose,pal.nose,pal.shade],shell=[pal.outline,pal.find,'#b8abc0','#e6d7cd'];
 const width=112,height=80,ox=56,oy=44,depths=new Float32Array(width*height).fill(-Infinity),colors=new Uint8Array(width*height),materials=[];
 const a=d*Math.PI/4,co=Math.cos(a),si=Math.sin(a);
 const volume=(center,rx,ry,rz,pal=fur)=>{
  const p=projectPoint(center,d),mat=materials.indexOf(pal)<0?materials.push(pal)-1:materials.indexOf(pal),lim=Math.ceil(Math.max(rx,ry)+rz+1);
  for(let y=-lim;y<=lim;y++)for(let x=-lim;x<=lim;x++){
   const bx=x*co,by=-x*si,bz=-y,A=si*si/rx**2+co*co/ry**2+.25/rz**2,B=2*(bx*si/rx**2+by*co/ry**2+bz*.5/rz**2),C=bx*bx/rx**2+by*by/ry**2+bz*bz/rz**2-1,disc=B*B-4*A*C;
   if(disc<0)continue;
   const ray=(-B+Math.sqrt(disc))/(2*A),xx=Math.round(p.x)+x+ox,yy=Math.round(p.y)+y+oy;if(xx<1||xx>=width-1||yy<1||yy>=height-1)continue;
   const index=yy*width+xx,z=ray+p.depth;if(z<depths[index])continue;
   const nx=(bx+si*ray)/rx**2,ny=(by+co*ray)/ry**2,nz=(bz+.5*ray)/rz**2,light=(-.45*nx-.3*ny+.82*nz)/Math.hypot(nx,ny,nz);
   depths[index]=z;colors[index]=mat*4+(light>.78?3:light>.04?2:1);
  }
 };
 const visible=n=>model.visibility?.[n]?.[d]!==false;
 const at=(n,rx,ry,rz,material=fur,offset=[0,0,0])=>{if(visible(n))volume(pose[n].map((v,i)=>v+offset[i]),rx,ry,rz,material);};
 const link=(a,b,r1,r2)=>{if(!visible(b))return;const av=pose[a],bv=pose[b],steps=Math.max(2,Math.ceil(Math.hypot(...av.map((v,i)=>v-bv[i]))/3));for(let i=0;i<=steps;i++){const t=i/steps,r=r1+(r2-r1)*t;volume(av.map((v,k)=>v+(bv[k]-v)*t),r,r*1.3,r*.8);}};
 for(const [a,b,r1,r2]of [['pelvis','tailBase',s.tailWidth,s.tailWidth],['tailBase','tailMid',s.tailWidth,3.6],['tailMid','tailTip',3.6,1.8],['tailTip','tailEnd',1.8,.8]])link(a,b,r1,r2);
 for(const side of ['L','R'])for(const [a,b,end]of [['shoulder','elbow','frontPaw'],['hip','knee','rearPaw']]){link(a+side,b+side,3.2,2.3);link(b+side,end+side,2.3,2);at(end+side,s.pawSize,3.8,1.9);}
 at('pelvis',s.bodyWidth,9,s.bodyHeight);at('spine',s.bodyWidth,9,s.bodyHeight);at('chest',s.bodyWidth*.9,8,s.bodyHeight);link('chest','neck',6,5.5);
 at('belly',6.5,11,3,cream);at('neck',5,4,4,cream,[0,2,-1]);
 for(const side of ['L','R'])at('ear'+side,2.2,2,2.2);
 at('head',s.headWidth,7.8,s.headHeight);at('jaw',6,4.5,2.7,cream);
 for(const side of [-1,1])at('muzzle',s.muzzleWidth*.5,3.1,2.8,cream,[side*2.8,0,0]);
 at('nose',2.2,1.5,1.5,dark);
 for(const side of ['L','R']){at('eye'+side,1.65,1.35,1.65,dark);if(actor.hp>0)at('eye'+side,.6,.6,.65,cream,[.1,.7,.7]);}
 const showFind=!!actor.otterFind||['belly_float','eat'].includes(actor.animationAction);
 if(showFind){at('find',4.1,3,1.8,shell);for(const x of [-2,0,2])at('find',1.3,2.2,1.4,shell,[x,1,1]);}
 const pixels=[],c={fillStyle:'',fillRect(x,y,w,h){pixels.push([x,y,w,h,this.fillStyle]);}};
 for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
  const i=y*width+x;if(depths[i]===-Infinity)continue;
  const edge=[i-1,i+1,i-width,i+width].some(n=>depths[n]===-Infinity),code=colors[i],pal=materials[Math.floor(code/4)];c.fillStyle=edge?fur[0]:pal[code%4];c.fillRect(x,y,1,1);
 }
 // Two restrained whisker strokes on each visible cheek. Test their depth too:
 // far-side whiskers must not be stamped across the rear of the skull.
 c.fillStyle=cream[1];
 if(visible('muzzle'))for(const side of [-1,1])for(const slope of [-1,1])for(let n=0;n<6;n++){
  const v=pose.muzzle,p=projectPoint([v[0]+side*(6+n),v[1]-n*.2,v[2]+slope*n*.18],d),x=Math.round(p.x)+ox,y=Math.round(p.y)+oy,i=y*width+x;
  if(x>0&&x<width&&y>0&&y<height&&p.depth>=depths[i]-.5)c.fillRect(x,y,1,1);
 }
 const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):typeof document!=='undefined'?Object.assign(document.createElement('canvas'),{width,height}):null;if(canvas){const target=canvas.getContext('2d');for(const [x,y,w,h,color]of pixels){target.fillStyle=color;target.fillRect(x,y,w,h);}}
 return {canvas,pixels,ox,oy};
}
export function drawOtterPixels(c,model,pose,d,actor={}){
 const key=JSON.stringify([OTTER_ART_REVISION,d,model.palette,model.shape,model.visibility,!!actor.otterFind,['belly_float','eat'].includes(actor.animationAction),actor.hp>0,Object.values(pose).map(v=>v.map(n=>Math.round(n*2)/2))]);
 let sprite=sprites.get(key);if(!sprite){sprite=rasterOtter(model,pose,d,actor);if(sprites.size>=OTTER_CACHE_LIMIT)sprites.delete(sprites.keys().next().value);sprites.set(key,sprite);}
 c.imageSmoothingEnabled=false;if(sprite.canvas&&typeof c.drawImage==='function')c.drawImage(sprite.canvas,-sprite.ox,-sprite.oy);else for(const [x,y,w,h,color]of sprite.pixels){c.fillStyle=color;c.fillRect(x-sprite.ox,y-sprite.oy,w,h);}
}
