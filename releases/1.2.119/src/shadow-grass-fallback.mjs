// Cached native blades for machines without the forest WebGL grass renderer.
import {grassFieldInstances} from './grass-field.mjs';
import {paintPixelMeadow,meadowTerrainKey} from './pixel-meadow.mjs';
const caches=new WeakMap(),colors=['#393047','#50405e','#6b5878','#82708f'];
function blade(c,x,y,h,lean,color){c.fillStyle=color;c.beginPath();c.moveTo(x-1,y);c.lineTo(x+lean,y-h);c.lineTo(x+1,y);c.closePath();c.fill();}
export function drawShadowGrassFallback(c,g,camera,w,h,front=false){
 if(g.generatedEnvironment!=='shadow')return false;
 const sx=Math.floor((camera.x-w/camera.zoom/2-32)/256),sy=Math.floor((camera.y-h/camera.zoom/2-32)/256),ex=Math.floor((camera.x+w/camera.zoom/2+32)/256),ey=Math.floor((camera.y+h/camera.zoom/2+80)/256);
 if((ex-sx+1)*(ey-sy+1)>128)return false;
 let cache=caches.get(g);if(!cache){cache=new Map();caches.set(g,cache);}
 const actors=[...(g.players||[]),...(g.enemies||[]),...[g.realmState,...(g.boundlessLoadedChunks||[]).map(r=>r.realmState)].filter(Boolean).flatMap(s=>(s.animals||[]).filter(a=>a.kind==='shadow_stag'))].filter(a=>!a.room&&!(a.hp<=0)&&!(a.jumpHeight>8));
 c.save();c.imageSmoothingEnabled=false;
 for(let cy=sy;cy<=ey;cy++)for(let cx=sx;cx<=ex;cx++){
  const x=cx*256,y=cy*256;if(g.mapMode!=='boundless'&&(x<0||y<0||x>=1600||y>=1600))continue;
  const key=cx+':'+cy,revision=g.seed+':'+meadowTerrainKey(g,x,y);let e=cache.get(key);
  if(!e||e.revision!==revision){
   const data=grassFieldInstances(g,{sx:x,sy:y,ex:x+256,ey:y+256},[]),canvas=document.createElement('canvas');canvas.width=128;canvas.height=152;const pen=canvas.getContext('2d');pen.translate(0,24);pen.drawImage(paintPixelMeadow(g,x,y),0,0);
   for(let i=0;i<data.length;i+=8)blade(pen,(data[i]-x)/2,(data[i+1]-y)/2,data[i+2]/2,data[i+4]/2,colors[Math.floor(data[i+2])%4]);
   e={revision,data,canvas};cache.set(key,e);
  }else{cache.delete(key);cache.set(key,e);}
  if(!front)c.drawImage(e.canvas,x,y-48,256,304);
  else for(let i=0;i<e.data.length;i+=8){const px=e.data[i],py=e.data[i+1];if(actors.some(a=>Math.abs(a.x-px)<12&&py>=a.y&&py<a.y+12))blade(c,px,py,e.data[i+2]*.6,e.data[i+4],colors[Math.floor(e.data[i+2])%4]);}
 }
 while(cache.size>64)cache.delete(cache.keys().next().value);
 c.restore();return true;
}
