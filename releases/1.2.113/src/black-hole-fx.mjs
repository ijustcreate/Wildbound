export const BLACK_HOLE_CACHE_LIMIT=64;
const textures=new Map(),TAU=Math.PI*2;
export const blackHoleTextureStats=()=>({textures:textures.size,bytes:textures.size*64*64*4,limit:BLACK_HOLE_CACHE_LIMIT});
// Original native-pixel vortex, not reference-GIF frames. Only 16 baked phases;
// seed variation and edited palettes share a hard 64-raster eviction ceiling.
export function blackHoleTexture(e,phase,seed=0){
 const frame=((Math.floor(phase*16)%16)+16)%16,variant=((Math.floor(seed)%4)+4)%4,key=[e.start,e.end,frame,variant].join(':');
 if(textures.has(key))return textures.get(key);if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d'),turn=frame/16*TAU,shift=variant*.39;
 for(let y=0;y<64;y+=2)for(let x=0;x<64;x+=2){
  const dx=x-31,dy=y-31,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx),warp=Math.sin(a*3-turn+shift)*1.4+Math.sin(a*7+turn)*.55;
  const rim=18+warp,swirl=Math.sin(a*3+r*.39-turn*2+shift);let color=null;
  if(r<12+warp*.2)color='#02090b';
  else if(r<rim-3.5)color=r>rim-6?'#5a3c23':'#071316';
  else if(r<rim+3){color=r<rim-1?'#fff7ba':r<rim+1?e.start:'#dba338';if(Math.sin(a*4-turn)> .78&&r>rim)color='#fff8cf';}
  else if(r<30&&swirl>.48){color=swirl>.86&&r<26?e.end:r<27?'#694020':'#241a1d';}
  else if(r>23&&r<31&&Math.sin(a*5-r*.62+turn)>.93)color='#192830';
  if(color){c.fillStyle=color;c.fillRect(x,y,2,2);}
 }
 // The cool streak stays inside the black core; clear corners remain transparent.
 c.fillStyle='#102a33';for(let n=0;n<5;n++)c.fillRect(26+n*2,39-n*4,2,4);
 if(textures.size>=BLACK_HOLE_CACHE_LIMIT)textures.delete(textures.keys().next().value);textures.set(key,canvas);return canvas;
}
function fleckTexture(color){
 const key='fleck:'+color;if(textures.has(key))return textures.get(key);if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=8;const c=canvas.getContext('2d');c.fillStyle=color;c.fillRect(3,1,2,6);c.fillRect(1,3,6,2);
 if(textures.size>=BLACK_HOLE_CACHE_LIMIT)textures.delete(textures.keys().next().value);textures.set(key,canvas);return canvas;
}
export function drawBlackHoleFX(c,e,time,seed,stamp,maxCount){
 if(!Number.isFinite(time)||time<0||time>e.life)return;
 const u=time/e.life,fade=e.loop?.95:Math.min(1,u*12,(1-u)*6),scale=e.size/8,r=Math.max(24,Math.min(160,e.spread))*scale;
 const phase=u*2,pulse=1+Math.sin(u*TAU*3)*.035,width=Math.round(r*2*pulse);
 stamp(blackHoleTexture(e,phase,seed),0,0,width,width,0,fade);
 // Tiny orbiting blue/gold flecks spiralling inward. All use the same stamp budget.
 const count=Math.min(e.count,maxCount,32);
 for(let n=0;n<count;n++){
  const t=(u+n*.618034)%1,a=n*2.399963-u*TAU*2+seed*.17,rad=r*(.52+(1-t)*.26),size=Math.max(1,Math.round(scale*(n%5===0?3:2)));
  stamp(fleckTexture(n%3===0?'#77a8c5':e.end),Math.round(Math.cos(a)*rad),Math.round(Math.sin(a)*rad),size,size,0,fade*(.2+.5*t));
 }
}
