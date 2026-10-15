import {sealSurfaceSize} from './seal-vortex.mjs';
import {WORLD_TRAVEL_SECONDS,WORLD_TRAVEL_EVENTS,preparedHouseWorldView} from './house-worlds.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
const smooth=t=>t*t*(3-2*t);
export function warmWorldTravelArt(r,g){
 const pending=g.houseWorldsEnabled&&g.roll?.resolved&&g.houseWorlds?.pending;
 if(!pending||r.travelWarmScheduled)return;
 if(r.preparedTravel?.pending!==pending)r.preparedTravel={pending};
 const prepared=r.preparedTravel;if(prepared.depart&&prepared.arrive)return;
 r.travelWarmScheduled=true;
 const idle=globalThis.requestIdleCallback||((fn)=>setTimeout(fn,0));
 idle(()=>{
  r.travelWarmScheduled=false;if(g.houseWorlds?.pending!==pending||g.worldTravel)return;
  const {w,h}=r.viewport,stage=prepared.depart?'arrive':'depart',view=stage==='arrive'?preparedHouseWorldView(g):g;
  if(view)prepared[stage]=captureTravelFrame(r,view,{stage},w,h);
 });
}
export function clearWorldTravelArt(r){
 const cache=r.worldTravelArt;if(!cache)return;
 for(const canvas of [cache.background,...cache.party.map(p=>p.image)])canvas.width=canvas.height=1;
 r.worldTravelArt=null;
}
export function drawWorldTravel(r,g,dt){
 const travel=g.worldTravel,{w,h}=r.resize(),c=r.ctx;
 let cache=r.worldTravelArt;
 if(!cache||cache.travel!==travel||cache.stage!==travel.stage||cache.w!==w||cache.h!==h){
  clearWorldTravelArt(r);
  const prepared=r.preparedTravel?.[travel.stage];
  if(prepared&&r.preparedTravel.pending.serial===travel.serial&&prepared.w===w&&prepared.h===h){cache=r.worldTravelArt=prepared;cache.travel=travel;r.preparedTravel[travel.stage]=null;}
  else cache=r.worldTravelArt=captureTravelFrame(r,g,travel,w,h);
  r.camera={...cache.camera};
 }
 drawTravelFrame(c,cache,travel,w,h);
}
function captureTravelFrame(r,g,travel,w,h){
  // One capped raster per stage; world simulation and rig drawing do not run each frame.
  const size=sealSurfaceSize(w,h),background=document.createElement('canvas');background.width=size.width;background.height=size.height;
  const capture=new r.constructor(background,r.assets);capture.camera={x:800,y:800,zoom:Math.min(w/630,h/440)};capture.animator=r.animator;
  capture.resize=()=>{capture.ctx.setTransform(size.width/w,0,0,size.height/h,0,0);capture.ctx.imageSmoothingEnabled=false;return {w,h};};
  const view=Object.create(g);view.worldTravel=null;view.openingBoard=false;view.phase='play';view.reveal=null;view.roll=null;
  capture.draw(view,0,{sealCapture:true});
  const bc=background.getContext('2d'),camera=capture.camera;
  bc.save();bc.translate(w/2,h/2);bc.scale(camera.zoom,camera.zoom);bc.translate(-camera.x,-camera.y);capture.boardBase(bc,view);capture.boardTop(bc,view);bc.restore();
  const party=g.players.map(p=>{
   const image=document.createElement('canvas');image.width=96;image.height=112;
   capture.animator.draw(image.getContext('2d'),{...p,x:48,y:85,room:null,attack:0,moving:false,jumpHeight:0,groundHeight:0},g.time,PLAYER_RENDER_SIZE);
   return {image,x:Math.max(30,Math.min(w-30,w/2+(p.x-800)*camera.zoom)),y:Math.max(90,Math.min(h-45,h/2+(p.y-800)*camera.zoom)),scale:camera.zoom};
  });
  const cache={travel,stage:travel.stage,w,h,background,party,camera,captures:(r.worldTravelCaptureCount=(r.worldTravelCaptureCount||0)+1)};
  return cache;
}
function drawTravelFrame(c,cache,travel,w,h){
 const raw=Math.min(1,travel.elapsed/WORLD_TRAVEL_SECONDS[travel.stage]),e=smooth(raw),depart=travel.stage==='depart',amount=depart?e:1-e;
 c.fillStyle='#10271f';c.fillRect(0,0,w,h);c.drawImage(cache.background,0,0,w,h);
 c.fillStyle='rgba(5,20,20,'+(Math.sin(raw*Math.PI)*.24)+')';c.fillRect(0,0,w,h);
 const cx=w/2,cy=h/2-10;
 for(let i=0;i<40;i++){
  const phase=(i/40+travel.elapsed*.55)%1,a=i*2.399963+travel.elapsed*5,rad=20+(1-phase)*Math.min(w,h)*.42;
  c.globalAlpha=Math.sin(phase*Math.PI)*.7;c.fillStyle=i%3?'#8de4be':'#ffe0a1';c.fillRect(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad*.62,2,2);
 }
 c.globalAlpha=1;
 for(const [i,p]of cache.party.entries()){
  const dx=p.x-cx,dy=p.y-cy,d=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)+amount*5+i*.03;
  const scale=p.scale*Math.max(.02,1-amount),x=cx+Math.cos(angle)*d*(1-amount),y=cy+Math.sin(angle)*d*(1-amount)-Math.sin(amount*Math.PI)*25;
  c.save();c.translate(x,y);c.globalAlpha=1-Math.max(0,(amount-.86)/.14);c.rotate(amount*.65);c.scale(scale,scale);c.drawImage(p.image,-48,-85);c.restore();
 }
 for(let n=2;n>=0;n--){c.strokeStyle=['#fff2c3','#96ebcf','#44948d'][n];c.lineWidth=2;c.beginPath();c.ellipse(cx,cy,14+n*7+Math.sin(travel.elapsed*8)*2,6+n*3,travel.elapsed*.8,0,Math.PI*2);c.stroke();}
 const title=WORLD_TRAVEL_EVENTS[travel.to].name,boxW=Math.min(w-20,390),boxY=h-64;
 c.fillStyle='#102c27ed';c.fillRect((w-boxW)/2,boxY,boxW,51);c.strokeStyle='#bda66d';c.strokeRect((w-boxW)/2+.5,boxY+.5,boxW-1,50);
 c.textAlign='center';c.fillStyle='#f7e1af';c.font='bold 16px Georgia';c.fillText(title,w/2,boxY+21,boxW-16);
 c.fillStyle='#c2dfce';c.font='10px system-ui';c.fillText(depart?'THE BOARD CALLS EVERY EXPLORER THROUGH':travel.to==='house'?'HOME REMEMBERS. YOUR JOURNEY CONTINUES.':'ROLL FIVE OR EIGHT TO FIND YOUR WAY HOME',w/2,boxY+39,boxW-16);
}
