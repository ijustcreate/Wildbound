import {paintShadowWoodlandProp,finishShadowWoodlandProp} from './shadow-woodland-props.mjs';
// Native indexed scenery and a bounded, cosmetic River of Souls presentation.
// Shadow void remains impassable; no saved terrain or custom artwork is replaced.
import {drawShadowAir} from './shadow-atmosphere.mjs';
import {SHADOW_FOREST_PROPS} from './shadow-forest-layout.mjs';
import {paintShadowForestProp} from './shadow-forest-art.mjs';
import {clipShadowWater,drawShadowSkyWater} from './shadow-water-reflections.mjs';
import {drawShadowBankTile,drawShadowLedgeTile} from './shadow-ledge-art.mjs';
import {paintShadowFloor,shadowFloorContext,shadowFloorContextKey} from './shadow-floor-art.mjs';
import {polishShadowConcept} from './shadow-concept-polish.mjs';
import {paintMoonveilTree} from './shadow-moonveil-tree.mjs';
export const UNDERWORLD_PALETTE=Object.freeze({ink:'#121326',deep:'#1b1b32',stone:'#373347',face:'#5b516c',rim:'#8b7b98',river:'#25263f',soul:'#afbbd4',flame:'#70c9ed'});
export const UNDERWORLD_KINDS=['wither_tree','root_arch','shadow_obsidian','thorn_fan','echo_fungus','shadow_bloom','ashen_log','veil_stone','underworld_gate','underworld_ribs','soul_brazier','underworld_columns','underworld_bones','underworld_urn','underworld_rubble','underworld_buttress','soul_candles',...Object.keys(SHADOW_FOREST_PROPS)];
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const voidTile=k=>k==='shadow_void',riverTile=k=>voidTile(k)||k==='shallow'||k==='water';
const mix=(a,b,t)=>a+(b-a)*t;
function noise(x,y,seed){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return mix(mix(hash(ix+seed,iy),hash(ix+seed+1,iy),u),mix(hash(ix+seed,iy+1),hash(ix+seed+1,iy+1),u),v);}
function painter(size=64){
 const s={width:size,height:size,palette:['transparent'],pixels:Array(size*size).fill(0),footprint:Array(size*size).fill(0),occludes:false};
 const color=c=>{let i=s.palette.indexOf(c);if(i<0){i=s.palette.length;s.palette.push(c);}return i;};
 const rect=(x,y,w,h,c)=>{const k=color(c);for(let yy=Math.max(0,Math.round(y));yy<Math.min(size,Math.round(y+h));yy++)for(let xx=Math.max(0,Math.round(x));xx<Math.min(size,Math.round(x+w));xx++)s.pixels[yy*size+xx]=k;};
 const poly=(pts,c)=>{const k=color(c);for(let y=0;y<size;y++){const xs=[];for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>y+.5)!==(b[1]>y+.5))xs.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)for(let x=Math.max(0,Math.ceil(xs[i]));x<Math.min(size,xs[i+1]);x++)s.pixels[y*size+x]=k;}};
 return {s,r:rect,p:poly};
}
export function makeUnderworldSprite(kind){
 if(!UNDERWORLD_KINDS.includes(kind))return null;
 const {s,r,p}=painter(['underworld_gate','underworld_buttress','wither_tree'].includes(kind)?128:64),{ink,deep,stone,face,rim,soul,flame}=UNDERWORLD_PALETTE;
 if(paintShadowWoodlandProp(kind,{s,r,p}))return s;
 if(kind==='wither_tree'){paintMoonveilTree({s,r,p});return s;}
 if(paintShadowForestProp(kind,{s,r,p})){polishShadowConcept(kind,{s,r,p});finishShadowWoodlandProp(kind,{s,r,p});return s;}
 if(kind==='underworld_buttress'){
  s.anchorY=122/128;s.occludes=true;
  p([[5,122],[11,77],[7,35],[22,47],[26,11],[37,32],[47,4],[61,30],[72,7],[83,39],[100,17],[104,60],[119,44],[114,90],[124,122]],'#171a2b');
  p([[11,117],[19,58],[26,26],[34,41],[38,67],[47,70],[40,106],[34,120]],'#38374d');
  p([[39,117],[41,73],[48,20],[56,33],[58,61],[67,71],[60,100],[63,120]],'#404157');
  p([[63,119],[69,59],[73,25],[82,51],[89,68],[87,92],[98,119]],'#30394c');
  p([[91,117],[95,55],[100,34],[105,63],[112,62],[108,91],[118,116]],'#364354');
  for(const [x,y,w,h]of [[24,46,10,18],[48,38,9,26],[71,51,11,19],[99,72,9,15]]){
   p([[x,y+h],[x+2,y],[x+w*.65,y+4],[x+w,y+h-6],[x+w*.65,y+h]],'#4a4b63');
   p([[x-4,y+h+11],[x+w,y+h+7],[x+w+4,y+h+11],[x,y+h+15]],'#26293e');
  }
  p([[10,113],[23,108],[44,116],[60,108],[79,117],[94,110],[116,117],[122,122],[7,122]],'#202438');
 }else if(kind==='underworld_gate'){
  // One massive, asymmetrical skull carved into fluted basalt, with a dark throat.
  s.anchorY=122/128;s.occludes=true;
  p([[3,122],[9,71],[4,29],[22,37],[29,16],[46,9],[63,4],[88,10],[103,26],[122,17],[116,63],[124,122],[105,122],[99,90],[88,79],[77,83],[69,108],[62,121],[54,104],[49,83],[36,79],[27,91],[22,122]],ink);
  p([[12,118],[18,66],[15,39],[29,44],[34,24],[49,16],[62,10],[85,17],[99,35],[111,29],[105,65],[115,118],[106,118],[98,83],[83,70],[70,76],[64,93],[57,75],[39,69],[28,84],[21,118]],stone);
  p([[29,42],[38,26],[55,18],[60,13],[57,37],[45,43],[37,61],[24,72]],face);
  p([[66,14],[83,21],[96,37],[104,42],[103,67],[91,58],[83,42],[69,37]],'#354c5e');
  p([[26,51],[39,43],[53,48],[50,62],[40,68],[29,62]],ink);p([[74,47],[88,42],[100,52],[96,64],[83,67],[76,61]],ink);
  p([[31,54],[40,48],[49,50],[45,56],[35,59]],'#527b8d');p([[81,50],[89,47],[95,53],[87,58],[80,57]],'#527b8d');
  p([[61,48],[54,68],[62,73],[69,65]],deep);p([[60,51],[58,65],[62,67]],rim);
  p([[31,72],[42,70],[53,78],[56,100],[51,107],[45,83],[36,80]],face);
  p([[74,77],[84,70],[96,75],[92,82],[83,84],[77,106],[72,99]],'#4d6777');
  for(const [x,y,h]of [[27,83,34],[35,82,27],[43,86,21],[81,86,20],[90,84,28],[99,88,30]]){r(x,y,3,h,deep);r(x-2,y,2,h-5,'#526d7d');}
  p([[48,27],[52,22],[50,37],[45,43],[42,42]],rim);r(35,31,9,2,'#66838f');r(78,28,9,2,'#526d7d');
 }else if(kind==='root_arch'||kind==='underworld_ribs'){
  s.occludes=true;
  p([[3,61],[7,35],[14,14],[26,4],[39,5],[53,18],[59,39],[62,61],[50,61],[48,37],[41,20],[33,15],[24,19],[17,36],[15,61]],ink);
  p([[7,60],[11,35],[17,17],[27,8],[38,9],[49,22],[55,41],[58,60],[52,59],[47,34],[39,17],[31,12],[22,19],[15,38],[12,59]],face);
  p([[12,59],[15,35],[22,20],[28,17],[24,26],[20,38],[19,61]],stone);
  p([[36,17],[43,24],[49,41],[50,61],[45,60],[43,41],[38,28]],stone);
  for(const [x,y,w,h]of [[12,39,3,14],[18,24,3,9],[26,11,7,3],[42,23,3,8],[50,42,3,13]])r(x,y,w,h,rim);
  if(kind==='underworld_ribs')for(const [x,y,dx]of [[15,39,7],[19,29,7],[46,31,-7],[50,43,-7]])p([[x,y],[x+dx,y+3],[x+dx*.7,y+9],[x,y+7]],'#627e89');
 }else if(kind==='wither_tree'){
  s.occludes=true;
  p([[18,61],[24,46],[27,25],[17,18],[9,5],[17,9],[24,19],[29,20],[30,5],[35,2],[34,23],[42,19],[51,5],[55,4],[48,24],[37,33],[38,46],[47,60],[36,57],[30,52],[26,61]],ink);
  p([[23,58],[28,43],[30,24],[20,18],[15,10],[23,21],[32,27],[33,8],[34,28],[44,21],[51,11],[46,26],[35,34],[35,47],[40,56],[31,49],[27,57]],face);
  r(29,32,3,18,stone);r(25,46,2,8,rim);r(36,29,5,2,rim);
 }else if(kind==='shadow_obsidian'){
  for(const [x,y,w]of [[14,31,10],[31,10,14],[48,35,10]]){p([[x-w/2,58],[x-w/2,y+6],[x+1,y],[x+w/2,y+9],[x+w/2,58]],ink);p([[x-w/2+2,55],[x-2,y+8],[x+1,y+3],[x+1,56]],face);p([[x+1,y+3],[x+w/2-2,y+10],[x+w/2-1,56],[x+1,56]],stone);r(x-2,y+10,2,Math.min(15,57-y),'#81adb7');}
 }else if(kind==='veil_stone'){
  p([[7,56],[8,40],[22,25],[43,27],[57,43],[56,59],[19,61]],ink);p([[11,42],[23,29],[42,31],[52,43],[31,46]],face);p([[11,43],[31,47],[31,57],[16,57]],stone);p([[32,47],[52,44],[52,55],[32,57]],'#20313e');r(23,30,13,2,rim);
 }else if(kind==='ashen_log'){
  p([[5,48],[13,39],[49,43],[59,53],[53,61],[13,59]],ink);p([[12,42],[47,46],[51,54],[14,54]],stone);r(15,43,24,3,face);p([[48,47],[54,50],[55,55],[50,59],[46,55]],rim);r(49,51,3,5,stone);
 }else if(kind==='thorn_fan'){
  for(const [x,y]of [[12,25],[21,15],[31,8],[43,20],[52,31]]){p([[28,61],[x-2,y+9],[x,y],[x+3,y+13],[35,61]],stone);p([[29,58],[x,y+7],[x+1,y+17]],rim);}
 }else if(kind==='echo_fungus'){
  for(const [x,y,w,h]of [[19,57,13,17],[38,59,16,30],[50,61,10,13]]){r(x-2,y-h,4,h,stone);p([[x-w,y-h],[x-w+4,y-h-5],[x+3,y-h-7],[x+w,y-h],[x+w-3,y-h+3],[x-w+3,y-h+3]],ink);r(x-w+4,y-h-3,w+4,4,'#557f85');r(x-w+5,y-h-3,w-3,2,'#90b9b7');}
 }else if(kind==='shadow_bloom'){
  r(30,38,3,22,stone);p([[31,55],[18,43],[23,55],[31,58],[44,47],[41,57]],face);p([[31,21],[22,33],[24,42],[31,47],[39,40],[40,32]],'#355f6c');p([[30,25],[26,34],[29,41],[33,39],[35,32]],soul);
 }else if(kind==='underworld_columns'){
  s.occludes=true;
  p([[5,61],[8,55],[58,55],[61,61]],ink);r(9,54,48,5,stone);r(11,53,43,2,rim);
  for(const [x,y,h,w]of [[16,11,43,12],[47,27,27,12]]){
   r(x-w/2-2,y+3,w+4,h,ink);r(x-w/2,y+3,w,h,face);r(x+1,y+3,w/2-2,h,stone);r(x-3,y+6,2,h-4,rim);r(x+2,y+7,2,h-5,deep);
   p([[x-w/2-3,y+4],[x-w/2-3,y],[x-2,y-3],[x+3,y],[x+w/2+3,y-1],[x+w/2+3,y+4]],ink);r(x-w/2-1,y+1,w+2,2,'#77919b');r(x-w/2-3,y+h,w+6,3,ink);
  }
  p([[23,54],[29,45],[42,47],[46,55]],ink);p([[26,52],[31,47],[41,49],[41,53]],face);
 }else if(kind==='underworld_bones'){
  for(const [x,y,w]of [[10,56,26],[27,49,27],[24,59,27]]){r(x,y,w,3,'#4c6974');r(x+2,y-1,w-3,2,'#b5c7bd');r(x-1,y-2,3,3,'#b5c7bd');r(x+w-1,y+1,3,3,'#8da8a6');}
  p([[20,45],[21,35],[27,30],[39,31],[44,37],[44,47],[39,48],[38,54],[26,54],[25,48]],ink);p([[23,43],[24,36],[29,33],[38,34],[41,39],[40,47],[25,47]],'#9bb4b1');r(26,39,5,5,deep);r(34,39,5,5,deep);r(31,44,2,3,stone);r(28,49,9,3,'#9bb4b1');r(30,49,1,4,deep);r(34,49,1,4,deep);
 }else if(kind==='underworld_urn'){
  p([[19,61],[16,55],[13,38],[19,28],[23,25],[22,19],[40,19],[40,26],[46,33],[49,45],[44,58],[39,61]],ink);
  p([[21,57],[18,45],[18,36],[26,29],[27,24],[36,24],[36,29],[44,37],[44,48],[39,57]],'#60516b');p([[21,35],[26,32],[26,55],[22,54],[20,44]],'#87708b');r(23,20,17,3,'#a98d9f');r(21,43,23,3,'#b297a3');r(22,46,21,2,'#3b384a');r(30,31,4,6,'#3b384a');r(34,36,5,2,'#3b384a');r(35,37,2,9,'#3b384a');
 }else if(kind==='underworld_rubble'){
  for(const [x,y,w,h]of [[7,53,17,8],[24,48,19,12],[40,55,16,7]]){p([[x,y],[x+4,y-h],[x+w-5,y-h-2],[x+w,y-3],[x+w-2,y+3],[x+1,y+3]],ink);p([[x+2,y-2],[x+5,y-h+2],[x+w-5,y-h],[x+w-2,y-3]],face);r(x+4,y-2,w-6,3,stone);}
 }else if(kind==='soul_candles'){
  // Three uneven wax candles; hot pink and violet are the identifying accent.
  p([[10,61],[14,57],[48,57],[54,61]],ink);
  for(const [i,x,y,h]of [[0,18,39,20],[1,31,24,35],[2,44,46,13]]){
   r(x-4,y,8,h,ink);r(x-3,y,6,h,'#b9a1ca');r(x-2,y,2,h,'#edcce5');r(x+1,y+3,2,h-3,'#836890');r(x-3,y,6,2,'#f3d9eb');r(x-1,y-4,1,4,'#41253f');r(x-3,y-10,6,7,i===1?'#a858ed':'#e34caf');r(x-2,y-12,3,9,i===1?'#d594ff':'#ff8bd4');r(x-1,y-8,2,4,'#ffe2f1');r(x+2,y+5,1,6,'#eed0e6');
  }
 }else if(kind==='soul_brazier'){
  p([[17,61],[20,56],[25,54],[26,34],[19,31],[15,23],[48,23],[44,32],[37,35],[38,54],[44,57],[47,61]],ink);r(24,56,16,3,face);r(28,34,7,21,stone);r(28,35,3,18,rim);p([[19,25],[44,25],[40,31],[25,31]],face);r(22,24,19,2,rim);
  p([[24,24],[20,17],[25,13],[25,5],[30,11],[35,1],[35,14],[41,9],[43,17],[38,24]],'#255b88');p([[26,23],[25,17],[30,12],[32,7],[33,17],[37,15],[39,21],[35,24]],flame);r(29,17,5,7,'#c0eeef');
 }
 if(['root_arch','ashen_log','thorn_fan'].includes(kind)){s.palette=s.palette.map(c=>({[stone]:'#352e47',[face]:'#51435e',[rim]:'#81718e'})[c]||c);}
 polishShadowConcept(kind,{s,r,p});
 finishShadowWoodlandProp(kind,{s,r,p});
 return s;
}

const groundCache=new Map(),CACHE_LIMIT=64;
const localShadowFloor=Object.freeze([Object.freeze({})]);
export function underworldCacheStats(){return {entries:groundCache.size,limit:CACHE_LIMIT,maxPixels:CACHE_LIMIT*128*128};}
function groundChunk(g,cx,cy,at,states,material){
 const tiles=[];for(let y=cy*8-1;y<=cy*8+8;y++)for(let x=cx*8-1;x<=cx*8+8;x++)tiles.push(at(x,y)||'shadow_void');
 const ox=cx*256,oy=cy*256,seed=g.seed||0;
 const hasFloor=tiles.includes('shadow_soil'),layoutKey=hasFloor?shadowFloorContextKey(states,ox,oy,256,at):'';
 const materialKey=hasFloor&&material?`${material.x}:${material.y}:${material.seed}`:'';
 const key=`${cx}:${cy}:${seed}:${materialKey}:${layoutKey}:${tiles.join(',')}`;let canvas=groundCache.get(key);if(canvas)return canvas;
 canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');
 const tile=(x,y)=>tiles[(y-cy*8+1)*10+x-cx*8+1]||'shadow_void';
 const image=c.createImageData(128,128),data=image.data;
 if(hasFloor)paintShadowFloor(image,ox,oy,tile,material?.seed??seed,shadowFloorContext(states,ox,oy,256,at),material?.x,material?.y);
 const riverColors=[[27,63,77],[32,73,85],[38,82,94]],legacyColors=[[38,57,69],[45,64,77],[52,73,85],[59,80,92]];
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const wx=ox+x*2,wy=oy+y*2,k=tile(Math.floor(wx/32),Math.floor(wy/32));
  if(k==='shadow_soil')continue;
  let color;
  if(riverTile(k)){const flow=Math.sin(wx*.013+Math.sin(wy*.008)*3)+Math.cos(wy*.019);color=riverColors[flow>.7?2:flow<-.65?0:1];}
  else{const v=noise(wx/170,wy/170,seed)*.72+noise(wx/37,wy/37,seed+23)*.28;color=legacyColors[Math.min(3,Math.floor(v*4))];}
  const offset=(y*128+x)*4;data[offset]=color[0];data[offset+1]=color[1];data[offset+2]=color[2];data[offset+3]=255;
 }
 c.putImageData(image,0,0);
 c.scale(.5,.5);c.translate(-ox,-oy);
 for(let ty=cy*8;ty<cy*8+8;ty++)for(let tx=cx*8;tx<cx*8+8;tx++){
  const k=tile(tx,ty);
  if(k==='shadow_soil')drawShadowBankTile(c,tx,ty,tile);
  else if(voidTile(k))drawShadowLedgeTile(c,tx,ty,tile);
 }
 if(groundCache.size>=CACHE_LIMIT)groundCache.delete(groundCache.keys().next().value);groundCache.set(key,canvas);return canvas;
}
export function drawUnderworldGround(c,g,bounds,at,material){
 const {sx=0,sy=0,ex=50,ey=50}=bounds;c.save();c.beginPath();c.rect(sx*32,sy*32,(ex-sx+1)*32,(ey-sy+1)*32);c.clip();c.imageSmoothingEnabled=false;
 const states=[...new Set([g.realmState,...(g.boundlessLoadedChunks||[]).map(e=>e.realmState)].filter(Boolean))];
 const floorStates=states.length?states:localShadowFloor;
 for(let cy=Math.floor(sy/8);cy<=Math.floor(ey/8);cy++)for(let cx=Math.floor(sx/8);cx<=Math.floor(ex/8);cx++)c.drawImage(groundChunk(g,cx,cy,at,floorStates,material),cx*256,cy*256,256,256);
 drawShadowSkyWater(c,g,bounds,at);drawUnderworldWater(c,g,bounds,at);drawUnderworldSouls(c,g,bounds,at);c.restore();return true;
}
function drawUnderworldWater(c,g,{sx=0,sy=0,ex=50,ey=50},at){
 const time=g.time||0;c.save();
 if(!clipShadowWater(c,{sx,sy,ex,ey},at)){c.restore();return;}
 for(let row=Math.floor(sy*32/47);row*47<(ey+1)*32;row++){
  const y=row*47+(time*3)%47;c.strokeStyle=row%3?'#8ab8ba16':'#9bd2cd22';c.lineWidth=1;c.beginPath();
  for(let x=sx*32-16;x<=(ex+1)*32+32;x+=16){const dy=Math.sin(x*.017+row*.7-time*.1)*7;(x===sx*32-16?c.moveTo(x,y+dy):c.lineTo(x,y+dy));}c.stroke();
 }
 // The existing eastern shallow basin becomes a slow spectral eddy.
 for(const ctx of [g.realmState,...(g.boundlessLoadedChunks||[]).map(e=>e.realmState)].filter(Boolean)){
  const x=(ctx.originX||0)+1240,y=(ctx.originY||0)+440;if(x<sx*32-100||x>(ex+1)*32+100||y<sy*32-100||y>(ey+1)*32+100||!riverTile(at(Math.floor(x/32),Math.floor(y/32))))continue;
  for(let ring=0;ring<5;ring++){c.strokeStyle=ring%2?'#9cd6cd2b':'#619ba633';c.lineWidth=2;c.beginPath();for(let i=0;i<24;i++){const a=i/23*Math.PI*1.65+time*.08+ring*.7,r=18+ring*12+i*.4,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.7;i?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();}
 }
 for(const p of g.scenery||[])if(p.kind==='soul_candles'&&!p.depleted&&p.x>=sx*32-90&&p.x<(ex+1)*32+90){const y=p.rootY??p.y+p.size*.19;c.fillStyle=p.candleHue==='purple'?'#c282ff29':'#ff75c829';for(let i=0;i<9;i++){const yy=y+12+i*7,w=Math.max(2,33-i*2+Math.sin(time*2+i)*4);c.fillRect(Math.round(p.x-w/2+Math.sin(time+i)*3),Math.round(yy),Math.round(w),1);}}
 // Thin river mist is behind actors, separate from the foreground air ribbons.
 c.globalAlpha=.045;c.fillStyle='#a1ced1';for(let y=Math.floor(sy*32/120)*120;y<(ey+1)*32;y+=120){const shift=Math.sin(time*.17+y)*10;c.fillRect(sx*32,y+shift,(ex-sx+1)*32,9);}
 c.restore();
}
export function drawUnderworldSouls(c,g,{sx=0,sy=0,ex=50,ey=50},at){
 const time=g.time||0,spacing=Math.max(64,Math.ceil(Math.sqrt(Math.max(1,(ex-sx+1)*(ey-sy+1)*1024)/80)/16)*16);let count=0;
 for(let gy=Math.floor(sy*32/spacing);gy<=Math.floor((ey+1)*32/spacing)&&count<80;gy++)for(let gx=Math.floor(sx*32/spacing);gx<=Math.floor((ex+1)*32/spacing)&&count<80;gx++){
  const phase=hash(gx+g.seed,gy),jitter=hash(gy+g.seed+31,gx-17),x=Math.round(gx*spacing+10+phase*(spacing-20)+Math.sin(time*.19+jitter*8)*6),y=Math.round(gy*spacing+8+(jitter*(spacing-16)+time*(2+phase*3))%(spacing-16));
  const tx=Math.floor(x/32),ty=Math.floor(y/32);if(!riverTile(at(tx,ty))||[[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy])=>!riverTile(at(tx+dx,ty+dy))))continue;
  count++;c.save();c.translate(x,y);c.rotate((jitter-.5)*.9);const scale=.65+phase*.6;c.scale(scale,scale);c.globalAlpha=.24+phase*.17;c.fillStyle=phase>.5?'#a0cecb':'#75aeb5';
  c.beginPath();c.moveTo(-3,-10);c.lineTo(2,-11);c.lineTo(5,-7);c.lineTo(3,-2);c.lineTo(7,1);c.lineTo(12,-4);c.lineTo(14,-3);c.lineTo(10,4);c.lineTo(4,4);c.lineTo(2,12);c.lineTo(-2,18);c.lineTo(-6,22);c.lineTo(-4,12);c.lineTo(-5,3);c.lineTo(-12,0);c.lineTo(-15,-5);c.lineTo(-12,-5);c.lineTo(-8,-1);c.lineTo(-3,-2);c.closePath();c.fill();
  c.fillStyle='#204753';c.fillRect(-2,-8,1,2);c.fillRect(1,-8,1,2);c.fillRect(-1,-4,2,2);c.restore();
  c.fillStyle='#7caeb329';c.fillRect(x-19,y+24,26,1);c.fillRect(x+8,y+29,17,1);
 }
 return count;
}
export function drawUnderworldAtmosphere(c,g,{sx=0,sy=0,ex=50,ey=50}={}){
 if(g.generatedEnvironment!=='shadow')return;
 const time=g.time||0,left=sx*32,top=sy*32,right=(ex+1)*32,bottom=(ey+1)*32;
 drawShadowAir(c,g,{sx,sy,ex,ey});
 for(const p of g.scenery||[])if(p.kind==='soul_brazier'&&!p.depleted){const y=p.rootY??p.y+p.size*.19;if(p.x<left-60||p.x>right+60||y<top-60||y>bottom+60)continue;const s=p.size/64,f=Math.sin(time*8+p.x)*2;c.fillStyle='#8edaf0';c.fillRect(Math.round(p.x-2*s),Math.round(y-45*s+f),Math.max(1,3*s),Math.max(2,7*s));}
 for(const p of g.scenery||[])if(p.kind==='soul_candles'&&!p.depleted){
  const y=p.rootY??p.y+p.size*.19;if(p.x<left-90||p.x>right+90||y<top-90||y>bottom+90)continue;
  const s=p.size/64,color=p.candleHue==='purple'?'#c282ff':'#ff75c8';
  c.save();const glow=c.createRadialGradient(p.x,y-17*s,0,p.x,y-17*s,34*s);glow.addColorStop(0,color+'29');glow.addColorStop(1,color+'00');c.fillStyle=glow;c.fillRect(p.x-36*s,y-53*s,72*s,72*s);c.restore();
  for(const [i,x,fy]of [[0,18,30],[1,31,15],[2,44,37]]){const px=p.x+(x-32)*s,py=y-(61-fy)*s+Math.sin(time*8+p.x+i)*.7;c.fillStyle=i===1?'#d594ff':'#ff8bd4';c.fillRect(Math.round(px-s),Math.round(py-2*s),Math.max(1,2*s),Math.max(2,4*s));c.fillStyle='#ffe5f4';c.fillRect(Math.round(px),Math.round(py),Math.max(1,s),Math.max(1,2*s));}
 }
}
