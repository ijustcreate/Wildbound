const hash=(x,y,seed=0)=>{const n=Math.sin((x+seed*.031)*127.1+(y-seed*.017)*311.7)*43758.5453;return n-Math.floor(n);};
const sand=['#b58e61','#c39b69','#d0a975','#dcb983','#e5c68f','#ecd39d'];
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
export const DESERT_CLUTTER=['pebbles','dry_grass','shale','rib_bones','thorn_branch','cactus_seedling','red_shards','salt_crust'];
export const DESERT_WIND_LIMIT=160;
export function desertSandColor(x,y,seed=0){
 const phase=seed*.0031,crest=Math.sin(y*.031+x*.009+Math.sin(x*.009+phase)*1.9+phase);
 const broad=Math.sin(x*.006-y*.008+phase)*.13,ripples=Math.sin(y*.21+x*.025+Math.sin(x*.017)*2)*.07;
 const v=(crest+1)*.38+.12+broad+ripples;
 return sand[Math.max(0,Math.min(sand.length-1,Math.floor(v*sand.length)))];
}
// Absolute-coordinate sampling guarantees adjoining chunks use the same dune
// field. Native four-pixel colour clusters replace repeated 32px tile stripes.
export function drawDesertSand(c,x,y,w=32,h=32,seed=0,offsetX=0,offsetY=0){
 for(let py=y;py<y+h;py+=4)for(let px=x;px<x+w;px+=4){
  rect(c,px-offsetX,py-offsetY,Math.min(4,x+w-px),Math.min(4,y+h-py),desertSandColor(px,py,seed));
  const r=hash(px,py,seed);if(r>.91)rect(c,px-offsetX+(r>.97?1:2),py-offsetY+2,r>.97?2:1,1,r>.96?'#efdaa9':'#a8845b');
 }
}
export function drawDesertClutter(c,kind,x,y,variant=0){
 const shade='#a17d55',dark='#805f47',light='#d9ba88',bone='#ead4a4';
 if(kind==='pebbles'||kind==='shale'){for(let i=0;i<3;i++){const px=x-7+i*6,py=y+(i%2)*2;rect(c,px,py,kind==='shale'?7:4,2,shade);rect(c,px+1,py-2,kind==='shale'?5:3,2,i===1?'#9a7156':light);rect(c,px+3,py-1,2,2,dark);}}
 else if(kind==='dry_grass'){for(let i=0;i<5;i++){const xx=x-4+i*2,hh=4+(i*3+variant)%7;for(let k=0;k<hh;k+=2)rect(c,xx+(i-2)*k*.17,y-k,1,2,i%2?'#99834f':'#c8b579');}rect(c,x-5,y,11,1,shade);}
 else if(kind==='rib_bones'){rect(c,x-9,y-2,18,2,shade);rect(c,x-8,y-4,17,2,bone);for(let i=0;i<4;i++){rect(c,x-6+i*4,y-7,2,7,bone);rect(c,x-5+i*4,y-7,2,1,'#f1dfb5');}rect(c,x+8,y-5,4,4,'#cbb388');rect(c,x+11,y-4,2,1,dark);}
 else if(kind==='thorn_branch'){for(let i=0;i<15;i++){rect(c,x-7+i,y-Math.round(i*.25),1,2,dark);if(i%4===0){rect(c,x-7+i,y-Math.round(i*.25)-3,1,3,shade);rect(c,x-6+i,y-Math.round(i*.25)+2,2,1,shade);}}}
 else if(kind==='cactus_seedling'){rect(c,x-4,y,9,2,shade);rect(c,x-2,y-10,5,11,'#57774d');rect(c,x-1,y-10,2,9,'#9daf6b');rect(c,x-6,y-7,2,5,'#496940');rect(c,x-5,y-4,4,2,'#7b9757');rect(c,x+3,y-6,3,2,'#7b9757');rect(c,x+5,y-8,2,4,'#496940');if(variant%3===0){rect(c,x-1,y-12,3,2,'#dc8d79');rect(c,x,y-13,1,1,'#f2c895');}}
 else if(kind==='red_shards'){for(let i=0;i<4;i++){const xx=x-8+i*5,yy=y+(i%2)*3;rect(c,xx,yy,4,2,'#90664e');rect(c,xx+1,yy-1,4,2,i%2?'#c39873':'#b7805e');rect(c,xx+2,yy-1,2,1,'#dec29a');}}
 else{for(let i=0;i<8;i++){const xx=x-8+(i*7)%17,yy=y-2+(i*3)%5;rect(c,xx,yy,2+(i%3),1,i%2?'#e7d3a4':'#c9b78e');}}
}
export function drawDesertChunk(c,g,cx,cy){
 const x=cx*256,y=cy*256,seed=g.seed||0;drawDesertSand(c,x,y,256,256,seed,x,y);
 for(let gy=Math.floor((y-24)/48);gy<Math.ceil((y+280)/48);gy++)for(let gx=Math.floor((x-24)/48);gx<Math.ceil((x+280)/48);gx++){
  const r=hash(gx,gy,seed);if(r<.54)continue;
  const px=gx*48+12+hash(gx+17,gy,seed)*24,py=gy*48+12+hash(gx,gy+29,seed)*24;
  if(Math.hypot(px-800,py-800)<115)continue;
  const tx=Math.floor(px/32),ty=Math.floor(py/32);if(g.terrain?.[ty*50+tx]!=='sand')continue;
  // Draw over chunk borders as well: the same deterministic feature is clipped
  // into both neighbours rather than abruptly cut off at a seam.
  const kind=DESERT_CLUTTER[Math.floor(hash(gx+5,gy+11,seed)*DESERT_CLUTTER.length)];drawDesertClutter(c,kind,px-x,py-y,Math.floor(r*100));
 }
}
export function drawDesertWind(c,g,bounds={left:0,top:0,right:1600,bottom:1600},lod=0){
 const t=g.time||0,seed=g.seed||0,count=lod>=2?48:lod===1?96:DESERT_WIND_LIMIT;
 const w=Math.max(1,bounds.right-bounds.left),h=Math.max(1,bounds.bottom-bounds.top),wrap=(n,r)=>(n%r+r)%r;
 const gust=.65+.35*Math.sin(t*.7+seed*.01),speed=32+gust*28,base=c.globalAlpha;
 c.save();
 for(let i=0;i<count;i++){
  const x=bounds.left+wrap(hash(i,17,seed)*w+t*speed*(.7+hash(i,7,seed)*.6),w);
  const y=bounds.top+wrap(hash(i,29,seed)*h+t*7+Math.sin(t*.9+i)*3,h);
  if(Math.hypot(x-800,y-800)>(g.bloom??3)*430)continue;
  const pulse=.35+.65*Math.sin(t*.8+i*.9)**2;c.globalAlpha=base*(.16+gust*.16)*pulse;
  const length=i%7===0?5:2;rect(c,x,y,length,1,i%3?'#efcf99':'#a87f54');
  if(i%7===0){c.globalAlpha*=.4;rect(c,x-4,y+1,3,1,'#edcc97');}
 }
 c.restore();return count;
}
