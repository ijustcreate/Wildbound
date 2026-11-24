import {daylight,lightSources} from './night-cycle.mjs';
import {outdoorLightingFrame,drawOutdoorSunShadows} from './outdoor-lighting.mjs';
import {GARDEN_LAMPS,GARDEN_TREES} from './diagon-garden-layout.mjs';
import {WorldLightRenderer} from './world-lighting.mjs';

const gardenLights=GARDEN_LAMPS.map(p=>({...p,height:44,district:'diagon'}));
const gardenCasters=GARDEN_TREES.map(p=>({...p,kind:'tree',rootY:p.y,lightOpacity:.78}));
const streetBlockers=new WeakMap();
function frontageBlock(caster,x,y,width,depth,height){
 let block=streetBlockers.get(caster);
 if(!block){
  block={x,y,rootY:y,kind:'shop',width,depth,height,lightBlocker:true,lightOpacity:.92};
  streetBlockers.set(caster,block);
 }
 return block;
}
const intersects=(r,b)=>r.x<b.right&&r.x+r.w>b.left&&r.y<b.bottom&&r.y+r.h>b.top;

export function drawAlleyStreetLighting(c,renderer,g,bounds,visible,{lamps,candles,shops,facades,nocturnePaths,actors,paths}){
 const time=g.time||0,day=daylight(g);
 c.save();c.beginPath();
 for(const path of nocturnePaths)if(intersects(path,bounds)){
  const inlet=path===nocturnePaths[0]?48:0;
  c.rect(path.x+inlet,path.y,path.w-inlet,path.h);
 }
 c.fillStyle='#101a2c5c';c.fill();c.restore();
 const inlet=nocturnePaths[0];
 if(inlet&&intersects(inlet,bounds)){
  const shade=c.createLinearGradient(inlet.x-39,0,inlet.x+48,0);
  shade.addColorStop(0,'#101a2c00');shade.addColorStop(1,'#101a2c5c');
  c.fillStyle=shade;c.fillRect(inlet.x-39,inlet.y,87,inlet.h);
 }
 const sources=[...lamps,...candles,...gardenLights].filter(p=>visible(p.x,p.y,155,155)).map(p=>{
  const green=p.district==='nocturne',candle=p.lightKind==='candle'||candles.includes(p);
  const radius=candle?113:green?143:128;
  return {...p,radius,color:green?'#70e895':'#f5be73',intensity:green?.98:1.02,
   owner:`alley-light:${p.x}:${p.y}`,
   flicker:(green?1:1-day*.48)*(1+Math.sin(time*9+p.x)*.055+Math.cos(time*5.8+p.y)*.045)};
 });
 sources.push(...lightSources(g).filter(p=>visible(p.x,p.y,p.radius,p.radius)));
 const props=[
  ...gardenCasters.filter(p=>visible(p.x,p.y,230,230)),
  ...shops.map(s=>frontageBlock(s,s.x,s.y+9,192,86,106)),
  ...facades.filter(p=>visible(p.x,p.y,230,230)).map(p=>frontageBlock(p,p.x,p.y,p.halfWidth*1.8,p.halfDepth*1.25,85)),
 ];
 const nearbyActors=actors.filter(a=>visible(a.x,a.y,175,175));
 const frame=outdoorLightingFrame(g,{view:renderer,sources,scenery:props,actors:nearbyActors,active:renderer.dynamicShadows,sun:day*.55});
 c.save();c.beginPath();
 for(const path of paths)if(intersects(path,bounds))c.rect(path.x,path.y,path.w,path.h);
 c.clip();
 if(renderer.dynamicShadows&&bounds.left<8890){
  c.save();c.beginPath();c.rect(bounds.left,bounds.top,8890-bounds.left,bounds.bottom-bounds.top);c.clip();
  drawOutdoorSunShadows(c,g,props,nearbyActors,{strength:day*.85});c.restore();
 }
 (renderer.worldLights??=new WorldLightRenderer()).drawGround(c,frame,(p,r)=>visible(p.x,p.y,r,r));
 c.restore();
 return frame;
}

// Reuse the same occlusion textures over the scene to pick up colour on low
// props and on actors that do not use the humanoid lighting shader.
export function drawAlleyReflectedLight(c,renderer,frame,visible){
 c.save();c.globalAlpha*=.54;
 renderer.worldLights.drawGround(c,frame,(source,radius)=>visible(source.x,source.y,radius,radius));
 c.restore();
}

export function drawNocturneStreetFog(c,g,bounds,paths){
 const clipped=paths.filter(path=>intersects(path,bounds));
 if(!clipped.length)return;
 const {left,top,right,bottom}=bounds;
 c.save();c.beginPath();
 for(const {x,y,w,h} of clipped)c.rect(x,y,w,h);
 c.clip();
 for(let i=0;i<3;i++){
  const offset=((g.time||0)*(7+i*2)+i*97) % 250;
  const fog=c.createLinearGradient(left+offset-90,top,left+offset+285,bottom);
  fog.addColorStop(0,'#7f969e00');fog.addColorStop(.32,'#8299a018');
  fog.addColorStop(.47,'#8ca59b15');fog.addColorStop(.69,'#92a8a500');fog.addColorStop(1,'#92a8a500');
  c.fillStyle=fog;c.fillRect(left,top,right-left,bottom-top);
 }
 for(let y=Math.floor(top/25)*25;y<=bottom;y+=25)for(let x=Math.floor(Math.max(left,8198)/29)*29;x<=right;x+=29){
  if(!clipped.some(a=>x>=a.x&&x<a.x+a.w&&y>=a.y&&y<a.y+a.h))continue;
  const i=Math.floor(x/29),j=Math.floor(y/25),seed=hash(i,j,13);
  if(seed>.45)continue;
  c.fillStyle=seed>.28?'#9da18046':'#302f35a0';
  c.fillRect(x+Math.floor(seed*28),y+Math.floor(hash(i,j,7)*20),seed>.3?3:2,1);
 }
 c.restore();
}

function hash(x,y,s){
 let n=Math.imul(x+19,374761393)+Math.imul(y+11,668265263)+Math.imul(s,2246822519);
 n=Math.imul(n^n>>>13,1274126177);
 return ((n^n>>>16)>>>0)/4294967296;
}

// The dust belongs to world cells, so the same specks drift through both
// camera layouts. Bound screen work and keep flight inside playable paths.
export function drawAlleyDust(c,time,bounds,{paths,insideNocturne,zoom}){
 if(zoom<.29)return;
 const step=68;
 const limits=paths.filter(path=>intersects(path,bounds));
 let budget=88;
 c.save();c.beginPath();
 for(const path of limits)c.rect(path.x,path.y,path.w,path.h);
 c.clip();
 for(let j=Math.floor((bounds.top-34)/step);j<=bounds.bottom/step&&budget>0;j++){
  for(let i=Math.floor(bounds.left/step);i<=bounds.right/step&&budget>0;i++){
   const seed=hash(i,j,2);
   const x=i*step+13+seed*36+Math.sin(time*(.45+seed*.35)+j)*12;
   const floor=j*step+13+hash(i,j,7)*40;
   if(!limits.some(p=>x>=p.x&&x<p.x+p.w&&floor>=p.y&&floor<p.y+p.h))continue;
   const phase=(time*(.12+.09*seed)+hash(i,j,5))%1;
   const alpha=Math.sin(Math.PI*phase)**1.6;
   if(alpha<.07)continue;
   const y=Math.round(floor-8-phase*33),px=Math.round(x),green=insideNocturne(x,floor);
   c.globalAlpha=alpha*.29;c.fillStyle=green?'#64bf87':'#d9a85e';c.fillRect(px-1,y-1,3,3);
   c.globalAlpha=alpha*.87;c.fillStyle=green?'#adf8ac':'#ffe2a1';c.fillRect(px,y,seed>.93?2:1,1);
   budget--;
  }
 }
 c.restore();
}
