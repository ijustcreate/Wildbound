const masks=new Map();
// Inner edge of the stone well in the 1516 x 1038 board artwork.
// Keep a small inset so glow rectangles cannot paint over its rim.
export const BOARD_WELL_CLIP=[[704,404],[819,404],[894,460],[894,566],[824,610],[704,610],[637,555],[637,463]]
  .map(([x,y])=>[x/1516*280-140,y/1038*192-96]);
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function magicParticle(index,count,time,age,goal,settings){
  const u=index/count,angle=u*Math.PI*8-time*settings.swirlSpeed,r=2+19*Math.sqrt(u);
  const x=Math.cos(angle)*r,y=Math.sin(angle)*r*.72;
  const progress=goal?smooth((age-u*.3)/settings.gatherTime):0;
  // A bowed path keeps the assembly fluid instead of a straight crossfade.
  const curl=Math.sin(progress*Math.PI)*(1-u)*7;
  return {x:x*(1-progress)+(goal?.x||0)*progress+Math.cos(angle+progress*5)*curl,
    y:y*(1-progress)+(goal?.y||0)*progress+Math.sin(angle+progress*5)*curl,
    alpha:goal?.alpha??(.35+.5*(.5+.5*Math.sin(index*3.7+time*2))),progress};
}
function textMask(title,warning,size,color){
  const key=title+'|'+warning+'|'+size+'|'+color;if(masks.has(key))return masks.get(key);
  if(typeof document==='undefined')return {points:[],lines:[]};
  const canvas=document.createElement('canvas');canvas.width=300;canvas.height=210;const c=canvas.getContext('2d');c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';
  const wrap=(text,font,width)=>{c.font=font;const out=[];for(const word of String(text).split(/\s+/)){const line=out.at(-1);if(line&&c.measureText(line+' '+word).width<=width)out[out.length-1]+=' '+word;else out.push(word);}return out;};
  const titleFont=`700 ${24*size}px system-ui`,bodyFont=`600 ${16*size}px system-ui`;
  const titles=wrap(title.toUpperCase(),titleFont,258),warnings=wrap(warning,bodyFont,244);
  const lines=[...titles.map(text=>({text,font:titleFont,height:29*size})),...warnings.map(text=>({text,font:bodyFont,height:21*size}))];
  const height=lines.reduce((n,l)=>n+l.height,0)+(warning?9:0),fit=Math.min(1,174/height);
  c.translate(150,105);c.scale(fit,fit);let y=-height/2;
  for(let i=0;i<lines.length;i++){const l=lines[i];if(i===titles.length&&warning)y+=9;c.font=l.font;c.fillText(l.text,0,y+l.height/2);y+=l.height;}
  const pixels=c.getImageData(0,0,300,210).data,points=[];
  for(let y=0;y<210;y+=3)for(let x=0;x<300;x+=3)if(pixels[(y*300+x)*4+3]>90)points.push({x:(x-150)/6.5,y:(y-105)/6.5});
  const result={points,canvas};if(masks.size>=12)masks.delete(masks.keys().next().value);masks.set(key,result);return result;
}
export function drawBoardMagic(c,time,settings,{title='',warning='',age=0}={}){
  const reduced=settings.reducedMotion||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const mask=title?textMask(title,warning,settings.textSize,settings.letters):null;
  const points=mask?.points||[],count=settings.particles;
  c.save();c.beginPath();
  for(const [i,[x,y]]of BOARD_WELL_CLIP.entries())i?c.lineTo(x,y):c.moveTo(x,y);
  c.closePath();c.clip();
  const well=c.createRadialGradient(-3,-4,1,0,0,27);well.addColorStop(0,'#0c5946');well.addColorStop(1,'#032a24');c.fillStyle=well;c.fillRect(-30,-30,60,60);
  // A readable spiral anchors the free particles; no random allocations per frame.
  c.strokeStyle=settings.energy;c.globalAlpha=title.length ? .18 : .52;c.lineWidth=.7;
  c.beginPath();for(let n=0;n<100;n++){const t=n/99,r=1+t*17,a=t*Math.PI*4-(reduced?0:time*settings.swirlSpeed*.25);const x=Math.cos(a)*r,y=Math.sin(a)*r*.78;n?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
  const settle=reduced?1:smooth((age-settings.gatherTime*.7)/.55);
  for(let i=0;i<count;i++){
    const goal=points.length?points[Math.floor(i*points.length/count)]:null;
    const p=magicParticle(i,count,reduced?0:time,reduced?100:age,goal,settings),size=settings.particleSize;
    c.globalAlpha=(goal?.alpha??.85)*(goal?1-settle*.7:.65);c.fillStyle=goal&&p.progress>.6?settings.letters:settings.energy;
    if(settings.glow>0){c.globalAlpha*=.13*settings.glow;c.fillRect(p.x-size*3,p.y-size*3,size*6,size*6);c.globalAlpha=(goal?1-settle*.7:.65);}
    c.fillRect(p.x-size/2,p.y-size/2,size,size);
  }
  // Resolve to crisp glyphs after assembly so particle density never harms reading.
  if(mask&&settle>0){c.globalAlpha=settle;c.drawImage(mask.canvas,-150/6.5,-105/6.5,300/6.5,210/6.5);}
  c.restore();
}
