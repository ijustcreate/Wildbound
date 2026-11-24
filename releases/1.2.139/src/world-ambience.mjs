import {waterAt} from './environment.mjs';
import {isUndergroundRoom} from './underground-audio.mjs';
import {weatherIntensity} from './wet-weather.mjs';
import {DIAGON_AMBIENCE,diagonStreetListeners,inDiagonAudio} from './diagon-alley-audio.mjs';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// The world is sampled on a coarse grid and refreshed at a low cadence. This
// produces a few stable, positional sound fields without scanning the map on
// every render frame or starting a voice for every water tile.
export function worldAmbienceEmitters(game,listeners){
 const found=new Map();
 if(inDiagonAudio(game)){
  const street=diagonStreetListeners(listeners);
  for(const emitter of DIAGON_AMBIENCE)addNear(found,street,emitter);
  return [...found.values()];
 }
 for(const listener of listeners){
  if(listener.room||listener.hp<=0||game.trainTest)continue;
  const cx=Math.floor(listener.x/32),cy=Math.floor(listener.y/32),radius=9;
  let waterWeight=0,waterX=0,waterY=0,closest=Infinity;
  for(let oy=-radius;oy<=radius;oy++)for(let ox=-radius;ox<=radius;ox++){
   const x=(cx+ox)*32+16,y=(cy+oy)*32+16,d=Math.hypot(x-listener.x,y-listener.y);
   if(d>330)continue;
   const ground=waterAt(game,x,y);
   if(!['water','shallow'].includes(ground))continue;
   closest=Math.min(closest,d);
   const weight=1/(1+d/180);waterWeight+=weight;waterX+=x*weight;waterY+=y*weight;
  }
  if(closest<300){
   const x=Math.round((waterWeight?waterX/waterWeight:listener.x)/64)*64;
   const y=Math.round((waterWeight?waterY/waterWeight:listener.y)/64)*64;
   const key='water:'+x+':'+y,old=found.get(key);
   if(!old||closest<old.distance)found.set(key,{key,kind:'water',x,y,distance:closest,radius:390});
  }
 }
 // Fire patches and installed campfires are point sources. Include only nearby
 // sources, so particle/effect collections do not turn into unbounded audio.
 for(const fire of game.firePatches||[]){
  const x=fire.x+16,y=fire.y+16;
  addNear(found,listeners,{key:'fire:'+fire.x+':'+fire.y,kind:'fire',x,y,radius:260});
 }
 for(const p of game.scenery||[]){
  if(!['campfire','fireplace','torch','old_well','fountain'].includes(p.kind)||p.depleted)continue;
  const kind=['old_well','fountain'].includes(p.kind)?'water':'fire';
  addNear(found,listeners,{key:p.id||p.kind+':'+Math.round(p.x)+':'+Math.round(p.y),kind,x:p.x,y:p.y,radius:kind==='water'?300:230});
 }
 for(const p of game.portals||[])if(p.oldWell&&!p.room){
  addNear(found,listeners,{key:'well:'+p.id,kind:'water',x:p.x,y:p.y,radius:250});
 }
 // A short, fixed set of emitters keeps the procedural loop count predictable.
 return [...found.values()].filter(e=>!listeners.every(p=>isUndergroundRoom(game,p.room))&&e.distance<e.radius)
  .sort((a,b)=>score(a,listeners)-score(b,listeners)).slice(0,8);
}
function addNear(found,listeners,e){
 let distance=Infinity;
 for(const p of listeners){if(p.hp<=0||p.room)continue;distance=Math.min(distance,Math.hypot(p.x-e.x,p.y-e.y));}
 if(distance>=e.radius)return;
 const old=found.get(e.key);if(!old||distance<old.distance)found.set(e.key,{...e,distance});
}
function score(e,listeners){return Math.min(...listeners.filter(p=>p.hp>0&&!p.room).map(p=>Math.hypot(p.x-e.x,p.y-e.y)),Infinity);}

export function weatherAudioState(game,listeners){
 const w=game.weather;if(!w)return null;
 const type=w.type||'';
 const t=game.time||0;
 const gust=.72+.2*Math.sin(t*.31+(game.seed||0)*.0007)+.08*Math.sin(t*.83);
 const base=weatherIntensity(game);
 const isRain=['monsoon','thunderstorm'].includes(type),isWind=['blizzard','sandstorm'].includes(type);
 if(!isRain&&!isWind)return null;
 const sheltered=listeners.length>0&&listeners.every(p=>p.room||underRoof(game,p));
 return {type,intensity:clamp(base*(.78+.22*gust),0,1),wind:gust,sheltered};
}
function underRoof(game,p){return (game.house?.floors||[]).some(f=>p.x>=f.x&&p.x<f.x+f.w&&p.y>=f.y&&p.y<f.y+f.h);}
