import {waterAt} from './environment.mjs';
import {terrainHash} from './world.mjs';
const states=new WeakMap();
export function clearWetWeather(g){states.delete(g);}
export const rainActive=g=>['monsoon','thunderstorm'].includes(g.weather?.type);
export function sheltered(g,a){return !!a.room||(g.house?.floors||[]).some(f=>a.x>=f.x&&a.x<f.x+f.w&&a.y>=f.y&&a.y<f.y+f.h);}
export function rainExposed(g,a){return rainActive(g)&&!sheltered(g,a);}
export function wetWeatherState(g){let s=states.get(g);if(!s||s.seed!==g.seed||s.terrain!==g.terrain){s={seed:g.seed,terrain:g.terrain,actors:new WeakMap(),drops:[],puddles:[],timer:0};states.set(g,s);}return s;}
export function tickWetWeather(g,dt){
 const s=wetWeatherState(g),raining=rainActive(g);s.timer-=dt;
 // A few fixed roof leaks, not an indoor rain sheet.
 if(raining&&s.timer<=0){s.timer=.35;
  for(let n=0;n<8;n++){
   const i=Math.floor((g.time||0)*20)+n,x=64+terrainHash(i+(g.seed||0),31)*1472,y=64+terrainHash(i,74)*1472;
   if(!sheltered(g,{x,y})&&!['water','shallow'].includes(waterAt(g,x,y))&&!g.blocked?.(x,y,2,false,true,false,0))addPuddle(s,x,y);
  }
  if(g.generatedEnvironment==='temple')for(const [x,y]of [[610,610],[990,720],[660,1000]]){
   addPuddle(s,x,y);s.drops.push({x,y:y-40,z:40,vy:75,life:.7,room:null});
  }
 }
 for(const puddle of s.puddles)puddle.life=raining?60:puddle.life-dt;
 s.puddles=s.puddles.filter(p=>p.life>0);
 for(const a of [...(g.players||[]),...(g.enemies||[])]){
  if(a.hp<=0)continue;
  let state=s.actors.get(a);if(!state){state={wet:0,clock:0};s.actors.set(a,state);}
  const soaked=(!a.room&&waterAt(g,a.x,a.y)==='water'&&!(a.jumpHeight>4))||rainExposed(g,a);
  state.wet=soaked?4:Math.max(0,state.wet-dt);state.clock-=dt;
  if(!soaked&&state.wet>0&&state.clock<=0){state.clock=.13+(4-state.wet)*.04;
   const seed=terrainHash(a.x+(g.time||0)*37,a.id||0);
   s.drops.push({x:(a.room?a.roomX:a.x)+(seed-.5)*12,y:(a.room?a.roomY:a.y)-6-seed*22,z:6+seed*22,vy:8,life:.65,room:a.room||null});
  }
  if(a.moving&&!a.room&&!(a.jumpHeight>2)&&s.puddles.some(p=>Math.hypot(a.x-p.x,(a.y-p.y)*1.6)<p.radius*Math.min(1,p.life/15))){
   state.splash=(state.splash||0)-dt;if(state.splash<=0){state.splash=.18;for(let n=0;n<3;n++)s.drops.push({x:a.x+(n-1)*3,y:a.y,z:0,vy:-20-n*5,life:.4,room:null});}
  }
 }
 for(const d of s.drops){d.life-=dt;d.vy+=110*dt;d.y+=d.vy*dt;}
 s.drops=s.drops.filter(d=>d.life>0).slice(-240);
}
function addPuddle(s,x,y){const key=Math.floor(x/40)+':'+Math.floor(y/40);if(s.puddles.some(p=>p.key===key))return;if(s.puddles.length>=160)return;s.puddles.push({key,x,y,radius:7+terrainHash(x,y)*9,life:60});}
export function drawPuddles(c,g){const s=wetWeatherState(g);c.save();for(const p of s.puddles){const fade=Math.min(1,p.life/15);c.globalAlpha=fade*.55;c.fillStyle='#558f95';c.beginPath();c.ellipse(p.x,p.y,p.radius*fade,p.radius*.43*fade,0,0,Math.PI*2);c.fill();c.fillStyle='#badcda';c.fillRect(p.x-p.radius*.4,p.y-1,p.radius*.5*fade,1);}c.restore();}
export function drawWetDrips(c,g,room=null){c.save();c.fillStyle='#b1e0dc';for(const d of wetWeatherState(g).drops){if((d.room||null)!==room)continue;c.globalAlpha=Math.min(.8,d.life*3);c.fillRect(Math.round(d.x),Math.round(d.y),1,2);}c.restore();}
