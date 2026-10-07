import {CARTOON_EFFECTS,FX_STYLES} from './cartoon-fx-presets.mjs';
import {drawCartoonFX} from './cartoon-fx-render.mjs';
import {PIXEL_EFFECTS} from './pixel-fx-presets.mjs';
import {drawPixelFX} from './pixel-fx-render.mjs';
export {loadParticleSprites,particleSpriteStatus} from './particle-sprites.mjs';
// Seeded, time-sampled particles: bounded cost, no simulation state in saved games.
export const PARTICLE_KEY='wildbound-particles-v1';
export const DEFAULT_EFFECTS={
  ...CARTOON_EFFECTS,
  ...PIXEL_EFFECTS,
  'arrow-splash':{name:'Arrow water impact',count:7,life:.4,speedX:0,speedY:-22,spread:12,gravity:95,size:2,orbit:3,shape:'square',blend:'source-over',start:'#e3fffa',end:'#4da8c1'},
  'salvage-hands':{name:'Salvage hand sparks',count:6,life:.45,speedX:0,speedY:-5,spread:4,gravity:2,size:1,orbit:2,shape:'square',blend:'lighter',start:'#e7f8de',end:'#7dcdd8'},
  'salvage-burst':{name:'Salvage completion burst',count:12,life:.3,speedX:0,speedY:-9,spread:12,gravity:22,size:1,orbit:3,shape:'star',blend:'lighter',start:'#fff0be',end:'#cbb17e'},
  'purple-aura':{name:'Necromancer purple aura',count:28,life:1.2,speedX:0,speedY:-8,spread:38,gravity:-4,size:3,orbit:14,shape:'star',blend:'lighter',start:'#f2b4ff',end:'#6e2eaa'},
  'purple-eyes':{name:'Warlock eyes',count:8,life:.7,speedX:0,speedY:-2,spread:12,gravity:0,size:2,orbit:5,shape:'star',blend:'lighter',start:'#fff0ff',end:'#a936e8'},
  'pink-sparkle':{name:'GM item sparkle',count:10,life:1,speedX:0,speedY:-9,spread:18,gravity:0,size:2,orbit:9,shape:'star',blend:'lighter',start:'#fff0ff',end:'#ff63bb'},
  splash:{name:'Water entry splash',count:24,life:.8,speedX:0,speedY:-32,spread:28,gravity:95,size:3,orbit:7,shape:'square',blend:'source-over',start:'#e3fffa',end:'#4da8c1'},
  'jump-splash':{name:'Jump water impact',count:42,life:1,speedX:0,speedY:-55,spread:62,gravity:110,size:5,orbit:16,shape:'square',blend:'source-over',start:'#e3fffa',end:'#4da8c1'},
  bubbles:{name:'Diving bubbles',count:7,life:.65,speedX:0,speedY:-12,spread:12,gravity:0,size:2,orbit:3,shape:'square',blend:'source-over',start:'#dbfff9',end:'#6ab8ce'},
  'swim-wake':{name:'Swimming wake',count:10,life:.65,speedX:0,speedY:2,spread:20,gravity:0,size:2,orbit:8,shape:'square',blend:'source-over',start:'#b5f4e9',end:'#3c91a7'},
  torch:{name:'Temple torch fire',count:44,life:1.1,speedX:0,speedY:-25,spread:7,gravity:-9,size:4,orbit:0,shape:'square',blend:'lighter',start:'#fff0a3',end:'#e74c21'},
  rain:{name:'Rain study (preview only)',count:160,life:.8,speedX:-28,speedY:230,spread:500,gravity:0,size:1,orbit:0,shape:'streak',blend:'source-over',start:'#abcbd8',end:'#608fa8'},
  knockout:{name:'Knocked-out stars',count:7,life:2,speedX:0,speedY:-12,spread:3,gravity:0,size:3,orbit:15,shape:'star',blend:'source-over',start:'#fff5ba',end:'#d6ad5b'},
};
export const LIMITS={count:[1,400,1],life:[.1,8,.1],speedX:[-300,300,1],speedY:[-300,300,1],spread:[0,600,1],gravity:[-150,150,1],size:[1,16,.5],orbit:[0,100,1]};
export function validEffect(v){return !!v&&typeof v.name==='string'&&v.name.trim().length>0&&v.name.length<=60&&Object.entries(LIMITS).every(([k,[a,b]])=>Number.isFinite(v[k])&&v[k]>=a&&v[k]<=b)&&(v.count%1===0)&&['square','star','streak','sprite'].includes(v.shape)&&(!v.fx||FX_STYLES.includes(v.fx))&&(v.shape!=='sprite'||FX_STYLES.includes(v.fx))&&(v.loop===undefined||typeof v.loop==='boolean')&&(!v.description||(typeof v.description==='string'&&v.description.length<=400))&&['source-over','lighter'].includes(v.blend)&&/^#[0-9a-f]{6}$/i.test(v.start)&&/^#[0-9a-f]{6}$/i.test(v.end);}
export const effects=structuredClone(DEFAULT_EFFECTS);
try{const data=JSON.parse(globalThis.localStorage?.getItem(PARTICLE_KEY)||'{}');for(const [id,v]of Object.entries(data))if(/^[a-z0-9_-]{1,60}$/.test(id)&&validEffect(v))effects[id]=v;}catch{}
export function saveEffect(id,value){if(!/^[a-z0-9_-]{1,60}$/.test(id)||!validEffect(value))throw Error('Invalid effect settings');const next={...effects,[id]:structuredClone(value)};globalThis.localStorage?.setItem(PARTICLE_KEY,JSON.stringify(next));effects[id]=next[id];}
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
export function particleSamples(effect,time,seed=0){
 const points=[];
 for(let i=0;i<effect.count;i++){
  const phase=time/effect.life+i/effect.count,cycle=Math.floor(phase),u=phase-cycle,t=u*effect.life,n=i+cycle*719+seed;
  const angle=time*2+i*6.283/effect.count;
  points.push({x:(noise(n)-.5)*effect.spread+effect.speedX*t+Math.cos(angle)*effect.orbit,y:effect.speedY*t+.5*effect.gravity*t*t+Math.sin(angle)*effect.orbit*.28,u,size:effect.size*(1-u*.7),alpha:Math.min(1,u*12)*(1-u)});
 }return points;
}
const frames=new WeakMap(),palettes=new WeakMap();
export function beginParticleFrame(c,{budget=768,maxEmitters=48,quality=1,reducedMotion=false}={}){
 const state={budget:Math.max(0,Math.min(2000,budget|0)),maxEmitters:Math.max(0,Math.min(100,maxEmitters|0)),quality:Math.max(.2,Math.min(1,quality)),reducedMotion:!!reducedMotion,draws:0,emitters:0,culled:0};frames.set(c,state);return state;
}
export const particleFrameStats=c=>({...frames.get(c)});
export function drawParticleEffect(c,id,x,y,time,seed=0){
 const effect=typeof id==='string'?effects[id]:id;if(!effect)return;
 if(effect.loop&&Number.isFinite(time)&&time>=0)time%=effect.life;
 const frame=frames.get(c);if(frame&&(frame.emitters>=frame.maxEmitters||frame.draws>=frame.budget))return;
 // World-to-screen culling before allocating, preparing colors or transforming.
 if(c.getTransform&&c.canvas){const m=c.getTransform(),sx=m.a*x+m.c*y+m.e,sy=m.b*x+m.d*y+m.f,extent=(effect.spread+effect.orbit+Math.abs(effect.speedY)*effect.life+Math.abs(effect.gravity)*effect.life**2+180)*Math.max(Math.hypot(m.a,m.b),Math.hypot(m.c,m.d));if(sx+extent<0||sy+extent<0||sx-extent>c.canvas.width||sy-extent>c.canvas.height){if(frame)frame.culled++;return;}}
 if(frame)frame.emitters++;
 const alpha=c.globalAlpha??1;c.save();c.translate(x,y);c.globalCompositeOperation=frame?.reducedMotion?'source-over':effect.blend;
 const spend=()=>{if(frame){if(frame.draws>=frame.budget)return false;frame.draws++;}return true;};
 if(effect.fx&&effect.shape==='sprite'){
  const stamp=(sprite,px,py,w,h,angle,opacity)=>{if(!spend())return;if(frame?.reducedMotion){angle=0;opacity*=.55;}c.globalAlpha=alpha*opacity;c.save();c.translate(px,py);if(angle)c.rotate(angle);if(sprite)c.drawImage(sprite,-w/2,-h/2,w,h);else{c.fillStyle=effect.start;c.fillRect(-2,-2,4,4);}c.restore();};
  if(frame?.reducedMotion&&effect.fx==='pixel-black-hole')time=effect.life*.5;
  const quality=frame?.quality??1;const draw=effect.fx.startsWith('pixel-')?drawPixelFX:drawCartoonFX;draw(c,effect,time,seed,stamp,Math.max(1,Math.floor(effect.count*quality)));c.restore();return;
 }
 let palette=palettes.get(effect);if(!palette||palette.start!==effect.start||palette.end!==effect.end){const a=rgb(effect.start),b=rgb(effect.end);palette={start:effect.start,end:effect.end,colors:Array.from({length:16},(_,n)=>`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*n/15)).join(',')})`)};palettes.set(effect,palette);}
 const count=Math.min(effect.count,Math.floor(effect.count*(frame?.quality??1))||1);
 for(let i=0;i<count;i++){
  if(!spend())break;
  const phase=time/effect.life+i/count,cycle=Math.floor(phase),u=phase-cycle,t=u*effect.life,n=i+cycle*719+seed,angle=time*2+i*6.283/count;
  const x=Math.round((noise(n)-.5)*effect.spread+effect.speedX*t+Math.cos(angle)*effect.orbit),y=Math.round(effect.speedY*t+.5*effect.gravity*t*t+Math.sin(angle)*effect.orbit*.28),s=Math.max(1,Math.round(effect.size*(1-u*.7)));
  c.globalAlpha=alpha*Math.min(1,u*12)*(1-u);c.fillStyle=palette.colors[Math.min(15,Math.floor(u*16))];
  if(effect.shape==='star'){c.fillRect(x-s,y,s*2+1,1);c.fillRect(x,y-s,1,s*2+1);}
  else if(effect.shape==='streak'){for(let k=0;k<7;k++)c.fillRect(x+Math.round(k*effect.speedX/Math.max(1,Math.abs(effect.speedY))),y+k*2,s,2);}
  else c.fillRect(x-s/2,y-s/2,s,s);
 }c.restore();
}
export function spawnParticleEffect(game,id,x,y,seed=0){const effect=effects[id];if(!effect)return false;game.effects||=[];if(game.effects.filter(f=>f.particle).length>=48)return false;game.effects.push({particle:id,x,y,life:effect.life,duration:effect.life,seed});return true;}
