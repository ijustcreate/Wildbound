import {realmTerrainAt} from './realm-world.mjs';
import {REALMS,REALM_ASSETS,realmAsset,realmHash,realmTree,realmResourceScale} from './realm-layout.mjs';
import {makeSwampTreeSprite,swampMossCurtains} from './swamp-art.mjs';
import {swampSurface,swampGroundColor} from './swamp-terrain.mjs';
// Same indexed-pixel format as the sprite editor. No external raster dependency.
function painter(){
 const s={width:64,height:64,palette:['transparent'],pixels:Array(4096).fill(0),footprint:Array(4096).fill(0),occludes:false};
 const color=c=>{let i=s.palette.indexOf(c);if(i<0){i=s.palette.length;s.palette.push(c);}return i;};
 const rect=(x,y,w,h,c)=>{const k=color(c);for(let yy=Math.max(0,Math.round(y));yy<Math.min(64,Math.round(y+h));yy++)for(let xx=Math.max(0,Math.round(x));xx<Math.min(64,Math.round(x+w));xx++)s.pixels[yy*64+xx]=k;};
 const poly=(points,c)=>{const k=color(c);for(let y=0;y<64;y++){const intersections=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y+.5)!==(b[1]>y+.5))intersections.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));}intersections.sort((a,b)=>a-b);for(let i=0;i<intersections.length;i+=2)for(let x=Math.max(0,Math.ceil(intersections[i]));x<Math.min(64,intersections[i+1]);x++)s.pixels[y*64+x]=k;}};
 const oval=(x,y,rx,ry,c)=>{for(let yy=-ry;yy<=ry;yy+=2){const w=Math.round(Math.sqrt(Math.max(0,1-yy*yy/(ry*ry)))*rx);rect(x-w,y+yy,w*2,2,c);}};
 return {s,rect,poly,oval};
}
export function makeRealmSprite(kind){
 if(kind==='mangrove'||kind==='old_cypress')return makeSwampTreeSprite(kind);
 const {s,rect:r,poly:p,oval:o}=painter(),type=realmAsset(kind)?.type;
 const shadow=['wither_tree','root_arch','shadow_obsidian','thorn_fan','echo_fungus','shadow_bloom','ashen_log','veil_stone'].includes(kind);
 const outline=shadow?'#211b32':'#24352f',wood=shadow?'#504254':'#75664b',light=shadow?'#8f7184':'#b0a275';
 if(type==='tree'){
  s.occludes=true;
  p([[14,60],[24,48],[26,28],[21,19],[26,16],[33,29],[36,18],[41,21],[36,41],[39,50],[51,60],[40,60],[32,53],[24,61]],outline);
  p([[24,57],[29,42],[29,25],[33,32],[34,46],[40,57],[33,54],[30,48],[28,57]],wood);r(29,31,3,18,light);
  if(kind==='wither_tree'){
   p([[28,32],[16,25],[12,13],[7,10],[14,10],[20,22],[28,25]],wood);p([[35,35],[47,27],[50,13],[56,9],[52,21],[52,30],[36,41]],wood);
   p([[29,28],[29,8],[34,3],[33,17],[37,14],[42,8],[40,21],[33,28]],wood);r(14,15,2,7,light);r(49,23,2,6,light);
   r(29,41,3,2,'#c49cc3');r(34,40,3,2,'#c49cc3');
  }else{
   const c=kind==='old_cypress'?['#293d36','#405a43','#637650','#8c955d']:['#223d35','#345b44','#57774f','#87975e'];
   const crowns=kind==='old_cypress'?[[31,12,15,10],[25,23,20,9],[37,29,20,10]]:[[18,21,16,11],[39,15,19,11],[47,29,13,9],[27,31,20,10]];
   for(const [x,y,rx,ry]of crowns){o(x,y,rx,ry,outline);o(x,y-2,rx-2,ry-1,c[1]);o(x-3,y-5,rx-5,Math.max(3,ry-5),c[2]);r(x-rx+6,y-8,Math.max(4,rx-7),2,c[3]);}
   // Spanish moss hangs in broad, readable curtains, separate from trunk collision.
   for(const [x,y,h]of [[12,29,13],[21,34,12],[45,32,16],[52,26,13]]){r(x,y,3,h,'#738574');r(x+1,y+3,3,h-2,'#4f6658');r(x+1,y+h,1,3,'#9aab84');}
   if(kind==='mangrove'){p([[25,46],[19,48],[12,59],[16,60],[24,53]],wood);p([[37,44],[46,49],[54,59],[49,60],[43,53]],wood);}
  }
 }else if(kind==='stalagmite'){
  o(32,59,24,4,outline);
  for(const [x,y,w]of [[19,34,10],[32,12,13],[47,39,9]]){p([[x-w,59],[x-5,y+13],[x-2,y],[x+2,y-2],[x+5,y+15],[x+w,59]],'#364343');p([[x-w+3,57],[x-3,y+14],[x-1,y+2],[x+1,y+2],[x+3,57]],'#99a295');p([[x+1,y+3],[x+4,y+16],[x+w-2,57],[x+3,57]],'#66786e');r(x-2,y+8,2,11,'#c9cbb0');}
 }else if(type==='crystal'||type==='mineral'){
  const colors=kind==='amber_crystal'?['#58443e','#a36f45','#e6b96d','#f6e4aa']:kind==='shadow_obsidian'?['#29263c','#625174','#aa80ba','#ded1ee']:kind==='stalagmite'?['#3a4247','#66716d','#a4a693','#d3cbb0']:['#24434b','#397e8b','#7cc8c6','#c7f3e1'];
  o(32,59,24,4,outline);
  for(const [x,y,w,h]of [[13,34,12,24],[28,10,16,49],[44,29,13,28]]){p([[x,y+7],[x+w*.5,y],[x+w,y+9],[x+w-2,y+h],[x+2,y+h]],colors[0]);p([[x+2,y+8],[x+w*.5,y+2],[x+w*.5,y+h-2],[x+3,y+h-2]],colors[2]);p([[x+w*.5,y+2],[x+w-2,y+9],[x+w-3,y+h-2],[x+w*.5,y+h-2]],colors[1]);r(x+3,y+9,2,h*.5,colors[3]);}
 }else if(type==='rock'){
  const ramp=shadow?['#25263b','#45455b','#747080','#a49a9d']:['#303d3b','#596964','#87958a','#bcc0a6'];
  if(kind==='cypress_knee'){p([[19,59],[22,42],[28,17],[33,13],[39,37],[45,59]],outline);p([[23,57],[28,30],[31,20],[33,56]],wood);p([[31,20],[37,40],[41,58],[33,56]],light);}
  else{p([[8,58],[7,43],[15,28],[39,24],[55,38],[58,57]],ramp[0]);p([[11,43],[18,30],[38,27],[52,39],[31,44]],ramp[2]);p([[11,43],[31,44],[31,57],[12,55]],ramp[1]);p([[31,44],[52,39],[55,54],[31,57]],ramp[1]);r(19,30,17,3,ramp[3]);r(13,50,17,2,ramp[2]);r(35,47,16,2,ramp[0]);if(kind==='peat_boulder'){r(16,32,18,4,'#66805b');r(12,38,14,3,'#849461');}}
 }else if(type==='log'){
  p([[6,48],[12,38],[49,42],[59,51],[54,60],[15,58]],outline);p([[12,40],[48,44],[53,54],[15,52]],wood);r(14,42,27,3,light);r(15,50,30,3,outline);o(51,51,7,8,light);o(51,51,4,5,wood);r(50,48,2,5,outline);if(kind==='moss_log'){r(14,40,20,4,'#698451');r(18,39,10,2,'#a2ad6e');}
 }else if(type==='arch'){
  s.occludes=true;p([[3,61],[8,33],[21,14],[41,12],[56,28],[61,61],[52,61],[48,33],[38,23],[24,24],[17,36],[13,61]],outline);p([[7,59],[12,33],[24,18],[41,16],[52,30],[57,59],[53,56],[47,31],[39,22],[23,23],[16,35],[11,59]],wood);r(24,17,16,3,light);r(11,39,3,14,light);
 }else if(type==='ceiling'){
  p([[18,7],[47,7],[39,23],[33,53],[27,28]],outline);p([[22,9],[33,10],[33,47],[28,26]],'#a8ada0');p([[33,10],[43,9],[36,23],[33,47]],'#687a78');r(26,11,3,13,'#d8d3b7');
 }else if(kind==='marsh_reeds'||kind==='thorn_fan'||kind==='marsh_fern'){
  for(const [x,h,d]of [[15,27,-8],[25,42,-3],[32,33,4],[40,45,5],[48,24,9]]){p([[29,61],[x-2,61-h],[x+d,54-h],[x+2,61-h],[34,61]],shadow?'#6c4d68':'#526e46');r(x,59-h,2,h-4,shadow?'#a17c96':'#9b9e5f');if(kind==='marsh_reeds')r(x-1,51-h,4,10,'#8e6845');else for(let j=1;j<4;j++)p([[x,61-h+j*7],[x-8,56-h+j*7],[x-3,64-h+j*7]],shadow?'#8c617d':'#7e9258');}
 }else if(kind==='bayou_lily'){
  o(31,54,23,7,'#294a3b');o(29,51,21,6,'#547854');p([[29,51],[49,47],[47,54]],'#243e35');o(28,45,8,4,'#e0d2ae');r(26,40,4,7,'#f0e6cb');r(26,44,5,2,'#e1b870');
 }else if(kind==='cave_mushroom'||kind==='echo_fungus'){
  for(const [x,y,w,h]of [[22,50,13,20],[40,55,14,30],[49,58,9,13]]){r(x-2,y-h,5,h,'#a8b4a1');o(x,y-h,w,6,outline);o(x,y-h-2,w-2,5,shadow?'#997da9':'#74aaa0');r(x-w+5,y-h-5,w-4,2,shadow?'#d8b7dc':'#bce0c2');}
 }else if(kind==='shadow_bloom'){
  r(30,35,3,25,'#7a667f');for(const [x,y]of [[25,36],[35,36],[30,31],[30,42]])o(x,y,6,5,'#9d748f');r(28,35,5,5,'#e6b6c6');p([[31,53],[15,44],[20,55]],'#60566c');
 }else if(kind==='cave_drip'){r(31,40,2,8,'#8ab9b7');o(32,59,16,3,'#42646b');o(32,59,10,1,'#8ab9b7');}
 else {for(const [x,y,w]of [[18,52,12],[35,56,15],[46,47,8]]){p([[x-w/2,y],[x-3,y-8],[x+w/2,y-5],[x+w/2+2,y+2]],'#596963');r(x-3,y-7,5,2,'#a9b1a0');}}
 return s;
}
export const REALM_SPRITES=Object.fromEntries(Object.values(REALM_ASSETS).flatMap(a=>Object.keys(a).map(k=>[k,makeRealmSprite(k)])));
// Reference-keyed cache respects a sprite replaced by the editor and is bounded by the catalog.
const rasterCache=new Map();
export function drawRealmSprite(c,kind,x,y,size,library){
 const s=library?.[kind]||REALM_SPRITES[kind];if(!s)return false;
 let cached=rasterCache.get(kind);
 if(!cached||cached.source!==s){const canvas=document.createElement('canvas');canvas.width=s.width;canvas.height=s.height;const ctx=canvas.getContext('2d');for(let yy=0;yy<s.height;yy++)for(let xx=0;xx<s.width;xx++){const v=s.pixels[yy*s.width+xx];if(v){ctx.fillStyle=s.palette[v];ctx.fillRect(xx,yy,1,1);}}cached={source:s,canvas};rasterCache.set(kind,cached);}
 c.imageSmoothingEnabled=false;c.drawImage(cached.canvas,Math.round(x-size/2),Math.round(y-size*61/64),size,size);return true;
}
export function drawRealmProp(c,p,time,g={},renderOptions={}){
 if(!p.realm&&!realmAsset(p.kind))return false;
 if(p.kind==='ceiling_stalactite'&&!g.realmEditor)return true;
 const y=p.rootY??p.y+p.size*.19;
 const library=renderOptions.spriteLibrary||g.spriteLibrary;
 const resourceType=realmAsset(p.kind)?.type,resourceScale=realmResourceScale(p);
 c.save();
 if(!renderOptions.dynamicShadows&&!p.depleted&&resourceType){c.fillStyle='#0d142033';c.beginPath();c.ellipse(p.x+4,y+2,p.size*.27*resourceScale,p.size*.075*resourceScale,0,0,Math.PI*2);c.fill();}
 if(p.fallen){c.fillStyle='#3b3935';c.fillRect(p.x-p.size*.1,y-5,p.size*.2,7);c.fillStyle='#a39474';c.fillRect(p.x-p.size*.08,y-6,p.size*.16,3);c.restore();return true;}
 if(p.depleted&&!p.falling){c.restore();return true;}
 if(!renderOptions.dynamicShadows&&resourceType==='crystal'){const glow=c.createRadialGradient(p.x,y-20,1,p.x,y-20,p.size*.8*resourceScale);glow.addColorStop(0,p.kind==='shadow_obsidian'?'#a481d633':'#83dbd833');glow.addColorStop(1,'#83dbd800');c.fillStyle=glow;c.fillRect(p.x-p.size*resourceScale,y-p.size*resourceScale,p.size*2*resourceScale,p.size*2*resourceScale);}
 if(p.falling){c.translate(p.x,y);c.rotate((p.fallDirection||1)*Math.min(1,p.falling/1.1)*Math.PI/2);c.globalAlpha*=Math.max(0,1-Math.max(0,p.falling-1)*2);drawRealmSprite(c,p.kind,0,0,p.size*resourceScale,library);}
 else if(!drawLivingSwampTree(c,p,y,time,library))drawRealmSprite(c,p.kind,p.x,y,p.size*resourceScale,library);
 if(realmTree(p)&&p.harvest&&!p.falling&&time-(p.hitAt||0)<4){c.fillStyle='#c9bd83';c.fillRect(p.x-15,y+8,30*Math.min(1,p.harvest/(p.maxHarvest||90)),3);}
 c.restore();return true;
}
// Cache two alpha layers, never regenerate tree geometry for a wind frame.
const livingTrees=new Map();
export function drawLivingSwampTree(c,p,y,time=0,library){
 if(typeof document==='undefined')return false;
 if(!['old_cypress','mangrove'].includes(p.kind)||library?.[p.kind]&&!library[p.kind].nativeSwampTree)return false;
 const seed=p.treeVariantSeed??(p.kind==='old_cypress'?31:21),varied=p.treeVariantSeed!==undefined,key=`${p.kind}:${seed}:${varied}`;
 let entry=livingTrees.get(key);
 if(!entry){
  const raster=s=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const pen=canvas.getContext('2d');for(let i=0;i<s.pixels.length;i++)if(s.pixels[i]){pen.fillStyle=s.palette[s.pixels[i]];pen.fillRect(i%128,Math.floor(i/128),1,1);}return canvas;};
  entry={body:raster(makeSwampTreeSprite(p.kind,{seed,varied,part:'body'})),moss:raster(makeSwampTreeSprite(p.kind,{seed,varied,part:'moss'}))};
  if(livingTrees.size>=32)livingTrees.delete(livingTrees.keys().next().value);livingTrees.set(key,entry);
 }
 const scale=p.size/128,left=p.x-p.size/2,top=y-p.size*61/64;
 c.imageSmoothingEnabled=false;c.drawImage(entry.body,left,top,p.size,p.size);
 const type=p.kind==='old_cypress'?'cypress':'mangrove',phase=(p.windSeed??p.seed??p.x*.013+p.y*.017);
 for(const [x,my,h]of swampMossCurtains(type,seed,varied))for(let band=0;band<3;band++){
  const sy=Math.floor(my+122+band*h/3),height=Math.floor(my+122+(band+1)*h/3)-sy+(band===2?1:0);
  const sway=Math.round(Math.sin(time*1.35+phase+x*.13)*2.2*band/2);
  c.drawImage(entry.moss,x+60,sy,8,height,left+(x+60+sway)*scale,top+sy*scale,8*scale,height*scale);
 }
 return true;
}
export const REALM_COLORS={swamp:{marsh_grass:'#435d42',mud:'#665f43',water:'#233c38',shallow:'#4d6957',bridge:'#8b7956'},caverns:{cave_floor:'#495258',cave_void:'#11151f',water:'#203b48',shallow:'#3b6470'},shadow:{shadow_soil:'#383047',shadow_void:'#100f1c',shallow:'#655575'}};
export function drawRealmGround(c,g,{sx=0,sy=0,ex=50,ey=50}={}){
 if(g.generatedEnvironment==='swamp')return drawSwampGround(c,g,{sx,sy,ex,ey});
 const palette=REALM_COLORS[g.generatedEnvironment];if(!palette)return false;
 c.fillStyle=g.generatedEnvironment==='swamp'?'#233c38':'#100f1c';c.fillRect(sx*32,sy*32,(ex-sx+1)*32,(ey-sy+1)*32);
 const tile=(x,y)=>realmTerrainAt(g,x,y);
 for(let ty=g.mapMode==='boundless'?sy:Math.max(0,sy);ty<(g.mapMode==='boundless'?ey+1:Math.min(50,ey+1));ty++)for(let tx=g.mapMode==='boundless'?sx:Math.max(0,sx);tx<(g.mapMode==='boundless'?ex+1:Math.min(50,ex+1));tx++){
  const k=tile(tx,ty),x=tx*32,y=ty*32,r=realmHash(tx+g.seed,ty),isVoid=k?.endsWith('_void');c.fillStyle=palette[k]||'#55634c';c.fillRect(x,y,32.5,32.5);
  if(isVoid){
   // Broken shelves follow only exposed boundaries, with a solid interior behind them.
   for(const [dx,dy]of [[0,-1],[-1,0],[1,0],[0,1]])if((g.mapMode==='boundless'||tx+dx>=0&&ty+dy>=0&&tx+dx<50&&ty+dy<50)&&!tile(tx+dx,ty+dy)?.endsWith('_void')){c.fillStyle=g.generatedEnvironment==='caverns'?'#697477':'#67536f';const w=dx?8:32,h=dy?8:32;c.fillRect(x+(dx>0?24:0),y+(dy>0?24:0),w,h);c.fillStyle=g.generatedEnvironment==='caverns'?'#333c49':'#322b42';c.fillRect(x+(dx>0?18:dx<0?8:4),y+(dy>0?18:dy<0?8:4),dx?8:24,dy?8:24);}
   continue;
  }
  if(k==='bridge'){c.fillStyle='#453f32';for(let j=0;j<32;j+=8)c.fillRect(x,y+j,32,2);c.fillStyle='#b09b6c';c.fillRect(x+2,y+3,2,28);c.fillRect(x+27,y+3,2,28);}
  else if(k==='water'||k==='shallow'){c.fillStyle=k==='water'?'#809a8426':'#bac89a32';const shift=Math.round(Math.sin((g.time||0)*1.1+tx+ty)*3);c.fillRect(x+5,y+10+shift,15,2);if(r>.6)c.fillRect(x+15,y+24-shift,10,1);}
  else{
   // Broad mineral/soil masses cross tile boundaries instead of repeating brick-like stamps.
   for(let yy=0;yy<32;yy+=8)for(let xx=0;xx<32;xx+=8){const v=Math.sin((x+xx)*.011+(y+yy)*.008)+Math.cos((y+yy)*.017);c.fillStyle=v>.7?'#ffffff06':v<-.5?'#070b1210':'#00000000';c.fillRect(x+xx,y+yy,8.5,8.5);}
   if(r>.78){c.fillStyle='#c4c0ad21';c.fillRect(x+4,y+23,8,2);}
   if(g.generatedEnvironment==='swamp')for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])if(['water','shallow'].includes(tile(tx+dx,ty+dy))){c.fillStyle='#8d946843';c.fillRect(x+(dx>0?26:0),y+(dy>0?26:0),dx?6:32,dy?6:32);}
  }
 }
 return true;
}
// Chunk-sized, bounded cache. Signatures include the editable neighbor tiles so
// painting a bank invalidates both its own chunk and the adjacent interpolation.
const swampGroundCache=new Map();
function drawSwampGround(c,g,{sx,sy,ex,ey}){
 const at=(tx,ty)=>realmTerrainAt(g,tx,ty)||'water';
 for(let cy=Math.floor(sy/8);cy<=Math.floor(ey/8);cy++)for(let cx=Math.floor(sx/8);cx<=Math.floor(ex/8);cx++){
  const tiles=[];for(let y=cy*8-1;y<=cy*8+8;y++)for(let x=cx*8-1;x<=cx*8+8;x++)tiles.push(at(x,y));
  const key=cx+','+cy+':'+tiles.join(','),lookup=(x,y)=>tiles[(y-(cy*8-1))*10+x-(cx*8-1)]||'water';
  let canvas=swampGroundCache.get(key);
  if(!canvas){canvas=document.createElement('canvas');canvas.width=canvas.height=128;const p=canvas.getContext('2d'),ox=cx*256,oy=cy*256;
   for(let y=0;y<128;y++)for(let x=0;x<128;x++){const wx=ox+x*2+1,wy=oy+y*2+1,surface=swampSurface(lookup,wx,wy);p.fillStyle=swampGroundColor(surface.height,wx,wy);p.fillRect(x,y,1,1);}
   for(let i=0;i<90;i++){const x=Math.floor(realmHash(i+cx*71,cy+31)*128),y=Math.floor(realmHash(i+cy*43,cx+17)*128),wx=ox+x*2,wy=oy+y*2,s=swampSurface(lookup,wx,wy);if(s.kind==='water'&&i%3===0){p.fillStyle='#41675c';p.fillRect(x,y,3+realmHash(i,7)*7,1);}else if(s.kind==='marsh_grass'){p.fillStyle=i%3?'#708052':'#485f42';p.fillRect(x,y,2,1);}}
   // Authored crossings stay tile-exact, including their physical support surface.
   for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(lookup(cx*8+x,cy*8+y)==='bridge'){p.fillStyle='#514c36';p.fillRect(x*16,y*16,16,16);for(let k=0;k<16;k+=4){p.fillStyle='#8c7951';p.fillRect(x*16+k,y*16,3,16);p.fillStyle='#ad9867';p.fillRect(x*16+k,y*16,1,16);}}
   if(swampGroundCache.size>=128)swampGroundCache.delete(swampGroundCache.keys().next().value);swampGroundCache.set(key,canvas);
  }
  c.save();c.beginPath();c.rect(sx*32,sy*32,(ex-sx+1)*32,(ey-sy+1)*32);c.clip();c.imageSmoothingEnabled=false;c.drawImage(canvas,cx*256,cy*256,256,256);c.restore();
 }
 return true;
}
export function drawRealmAtmosphere(c,g){
 if(!REALMS.includes(g.generatedEnvironment)||g.phase==='won')return;
 const time=g.time||0;
 for(const p of g.scenery||[]){
  if(p.kind==='cave_drip'){const t=(time*.65+realmHash(p.x,p.y))%1;c.fillStyle='#b3d2d399';c.fillRect(p.x,p.rootY-60+t*60,2,4);c.strokeStyle='#8db1bc66';c.beginPath();c.ellipse(p.x,p.rootY,t*10,t*3,0,0,Math.PI*2);c.stroke();}
  if(p.kind!=='ceiling_stalactite'||p.hazardState!=='warning')continue;
  const t=p.hazardTime||0,w=p.warning||1.6;c.fillStyle='#090b16aa';c.beginPath();c.ellipse(p.x,p.rootY,8+Math.min(1,t/w)*15,5+Math.min(1,t/w)*7,0,0,Math.PI*2);c.fill();c.strokeStyle='#d7c9a1';c.lineWidth=2;c.stroke();
  for(let i=0;i<9;i++){const fall=(t*44+i*9)%60;c.fillStyle=i%2?'#c0bba777':'#e3d8adbb';c.fillRect(p.x-16+realmHash(i,p.x)*32,p.rootY-65+fall,2,3);}
  if(t>w)drawRealmSprite(c,'ceiling_stalactite',p.x,p.rootY-100+(t-w)/.35*100,46,g.spriteLibrary);
 }
}
