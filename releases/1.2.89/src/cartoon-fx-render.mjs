import {particleSprite} from './particle-sprites.mjs';
const TAU=Math.PI*2,cache=new WeakMap(),captions=new Map();
function plan(effect){let p=cache.get(effect);if(p&&p.count===effect.count)return p;const data=new Float32Array(effect.count*4);for(let i=0;i<effect.count;i++){const t=i*2.39996323;data.set([Math.cos(t),Math.sin(t),(i*0.61803398875)%1,(i*0.41421356237)%1],i*4);}p={count:effect.count,data};cache.set(effect,p);return p;}
function caption(text){if(captions.has(text))return captions.get(text);if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=256;c.height=96;const ctx=c.getContext('2d');ctx.font='900 italic 64px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=10;ctx.strokeStyle='#6b241a';ctx.strokeText(text,128,48);ctx.fillStyle='#ffe77b';ctx.fillText(text,128,48);captions.set(text,c);return c;}
export function drawCartoonFX(c,e,time,seed,stamp,maxCount=e.count){
 if(!Number.isFinite(time)||time<0||time>e.life)return;
 const u=time/e.life,fade=Math.min(1,u*14)*(1-u)**.7,scale=e.size/8,r=Math.max(12,e.spread)*scale,t=time,fx=e.fx,arr=plan(e).data;
 const image=(name,x,y,w,h=w,angle=0,alpha=fade,color=u>.7?e.end:e.start)=>{if(alpha<=.005)return;const sprite=particleSprite(name,color);stamp(sprite,x,y,w,h,angle,alpha);};
 const ring=(color=e.start,k=1)=>image('ring',0,0,r*2*(.12+u*.95)*k,r*2*(.12+u*.95)*k,0,fade,color);
 switch(fx){
  case 'impact':ring();image('spark',0,0,60*scale*(1-u),60*scale*(1-u),u,fade);break;
  case 'shockwave':ring();break;
  case 'runes':image('rune',0,10,r*1.8,r*.65,t*.2,fade);break;
  case 'leaves':image('spark',0,-8,70*scale*(1-u),70*scale*(1-u),t*.5,fade);break;
  case 'lightning':image('orb',0,0,45*scale,45*scale,0,fade);break;
  case 'boom':image('burst',0,-8,r*(1+.5*Math.sin(u*Math.PI)),r*(1+.5*Math.sin(u*Math.PI)),t*.1,fade);break;
  case 'heart':image('heart',0,-18*u,68*scale*(.7+.3*Math.sin(u*Math.PI)),68*scale*(.7+.3*Math.sin(u*Math.PI)),Math.sin(t*5)*.1,fade);image('spark',0,-10,50*scale*(1-u),70*scale*(1-u),0,fade,'#ffffff');break;
  case 'energy':ring();ring('#ddfaff',.7);image('burst',0,0,70*scale*(1-u),70*scale*(1-u),t,fade);break;
  case 'crescent':image('crescent',0,0,r*1.6,r*1.6,-1+u*2,fade);break;
  case 'vortex':ring();image('swirl',0,0,r*1.3,r*1.3,-t,fade);break;
  case 'column':image('flame',0,15,45*scale,80*scale*(.65+.35*Math.sin(t*4)),0,fade,'#ffbf62');break;
  case 'bounce':ring('#ffffff',.65);break;
  case 'ghosts':image('orb',0,5,70*scale,40*scale,0,fade);break;
  case 'splatter':image('splat',0,0,r*1.3,r*1.3,t*.15,fade);break;
  case 'fireball':image('flame',0,0,r*.9,r*1.1,-t*.5,fade,'#ffe58d');ring();break;
  case 'water':image('ring',0,10,r*2*u,r*.65*u,0,fade);break;
  case 'bloom':image('swirl',0,0,r*1.3,r*1.3,u*.3,fade);break;
 }
 if(fx==='boom'||fx==='bounce')stamp(caption(fx==='boom'?'BOOM!':'BOING!'),0,-12,r*1.5,r*.56,Math.sin(t*7)*.06,fade);
 for(let i=0;i<Math.min(e.count,maxCount);i++){
  const j=i*4,dx=arr[j],dy=arr[j+1],a=arr[j+2],b=arr[j+3];let name='spark',x=dx*r*u,y=dy*r*u,s=(5+a*7)*scale,angle=(a*TAU)+t*(b-.5)*4,alpha=fade*(.5+a*.5);
  if(['impact','shockwave','energy','bloom'].includes(fx)){name='streak';s=12*scale;angle=Math.atan2(dy,dx)+Math.PI/2;image(name,x,y,s*.35,s*(1.2+a*2.5),angle,alpha);continue;}
  if(fx==='runes'){name=i%3?'streak':'spark';x=dx*r*.65;y=dy*r*.2-80*scale*u;image(name,x,y,s*.5, name==='streak'?50*scale*(1-u):s,0,alpha);continue;}
  if(fx==='lightning'){name='lightning';const turn=i*TAU/e.count;image(name,Math.cos(turn)*r*.5,Math.sin(turn)*r*.5,14*scale,r*(.65+a*.35),turn+Math.PI/2,alpha);continue;}
  if(fx==='leaves'){name='leaf';s=12*scale;y+=e.gravity*t*t*.5;}
  else if(fx==='heart'){name='heart';s=14*scale;y-=u*25;}
  else if(fx==='smoke'||fx==='column'){name='smoke';s=(24+a*22)*(1+u)*scale;x=dx*r*.4*(.2+u);y=-r*u*(fx==='column'?1.8:.6)+dy*15;alpha*=.6;}
  else if(fx==='vortex'){name='orb';const turn=a*TAU+t*2+seed*.13,radius=r*.3+e.orbit*scale;x=Math.cos(turn)*radius;y=Math.sin(turn)*radius;s=8*scale;}
  else if(fx==='ghosts'){name='ghost';s=(22+a*16)*scale;x=dx*r*.75*u;y=-u*(40+a*70)*scale;angle=dx*.2;}
  else if(fx==='splatter'){name='droplet';s=(5+a*9)*scale;}
  else if(fx==='fireball'){name=i%3?'flame':'smoke';s=(18+a*20)*scale;}
  else if(fx==='water'){name='droplet';x=dx*r*u;y=10-(35+a*45)*scale*Math.sin(u*Math.PI)+e.gravity*t*t*.15;s=8*scale;}
  else if(fx==='bounce'){name=i%3?'spark':'smoke';s=10*scale;y+=e.gravity*t*t*.3;}
  else if(fx==='crescent'){name='streak';x=Math.cos(a*TAU+u*2)*r*.65;y=Math.sin(a*TAU+u*2)*r*.65;s=12*scale;}
  image(name,x+e.speedX*t,y+e.speedY*t*.2,s,s,angle,alpha,fx==='bounce'?(i%3===0?'#ffffff':i%3===1?'#6fffc8':'#ff83cb'):e.start);
 }
}
