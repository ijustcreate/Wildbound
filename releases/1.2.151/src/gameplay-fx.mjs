import {drawParticleEffect,effects,particleFrameStats} from './particles.mjs';
import {GAMEPLAY_FX} from './gameplay-fx-presets.mjs';
import {ITEMS} from './items.mjs';
import {magicBoltColor,magicChargePalette} from './magic-bolt-render.mjs';
import {wandTipWorld} from './player-motion.mjs';
import {drawManaWardSparkles} from './diagon-garden-ward-art.mjs';
import {drawReturnedHeartGlow} from './returned-heart-glow.mjs';
export {GAMEPLAY_FX};
const limits=new WeakMap();
export function emitGameplayFx(g,id,point,options={}){
 const entry=GAMEPLAY_FX[id];if(!g||!entry||!point)return false;
 const room=options.room??point.room??null,x=room?(point.roomX??point.x):point.x,y=room?(point.roomY??point.y):point.y;
 if(!Number.isFinite(x)||!Number.isFinite(y))return false;
 let limit=limits.get(g);if(!limit||limit.time!==g.time){limit={time:g.time,count:0};limits.set(g,limit);}if(limit.count>=24)return false;
 const list=g.effects??=[];if(list.filter(f=>f.gameplayFx).length>=96)return false;limit.count++;
 const life=options.life??effects[entry.slot].life;
 list.push({gameplayFx:id,particle:entry.slot,x,y,room,life,duration:life,seed:Number(point.id)||0,...options});return true;
}
export function drawGameplayFx(c,id,x,y,time,seed=0,context,overrides){
 const slot=GAMEPLAY_FX[id]?.slot;if(!slot)return;
 // Leave the majority of the native raster allowance available for combat/status feedback.
 if(['loot','fog','fireflies','leaves','rain-splash','snow'].includes(id)&&particleFrameStats(c).pixelFxEmitters>=4)return;
 const effect=overrides?{...effects[slot],...overrides}:slot;
 drawParticleEffect(c,effect,x,y,time,seed,context);
}
export function drawGameplayTransient(c,g,fx){
 const target=fx.targetId!=null?[...(g.players||[]),...(g.enemies||[]),...(g.ghosts||[])].find(a=>a.id===fx.targetId):null;
 if(target&&(target.room||null)!==(fx.room||null))return;
 const x=target?(fx.room?(target.roomX??target.x):target.x):fx.x,y=target?(fx.room?(target.roomY??target.y):target.y)-(target.jumpHeight||0)-(target.groundHeight||0):fx.y;
 c.save();c.globalAlpha*=fx.opacity??1;
 const slot=effects[fx.particle],overrides={loop:false,life:fx.duration,...(fx.angle!=null?{pxAngle:fx.angle*180/Math.PI}:{}),...(fx.scale?{pxScale:fx.scale}:{}),...(fx.pxOptions?{pxOptions:fx.pxOptions}:{})};
 if(fx.gameplayFx==='life-steal')overrides.pxOptions={...slot.pxOptions,target:[(fx.fromX-x)/slot.pxScale,(fx.fromY-y)/slot.pxScale]};
 // Blink-in uses the same editable travel slot with the inverse module.
 if(fx.arrive)overrides.pixelfx='arcane/blink-in';
 drawParticleEffect(c,{...slot,...overrides},x,y,Math.max(0,fx.duration-fx.life),Number(fx.seed)||0,target?{actor:target,time:g.time,size:43}:undefined);c.restore();
}
export function actorGameplayStatuses(a,time){
 if(a.hp<=0)return [];
 return [['burning',a.burning>0],['poison',a.poison>0],['frozen',a.frozen>0||a.bansheeIce>0],['stunned',a.stun>0],['sleep',a.sleeping>0],['charm',a.succubusCharm?.remaining>0],['slow',a.slowUntil>time]].filter(([,on])=>on).map(([id])=>id);
}
export function drawActorGameplayFx(c,g,a,size,layer='front'){
 const x=a.room?(a.roomX??a.x):a.x,y=(a.room?(a.roomY??a.y):a.y)-(a.jumpHeight||0)-(a.groundHeight||0),context={actor:a,time:g.time,size,layer};
 drawReturnedHeartGlow(c,a,g.time,x,y,size,layer);
 for(const id of actorGameplayStatuses(a,g.time))drawGameplayFx(c,id,x,y,g.time,Number(a.id)||0,context);
 if(layer==='front')drawManaWardSparkles(c,a,g.time,x,y);
 if(layer!=='front'||a.hp<=0||!(a.charge>0))return;
 const effect=effects[GAMEPLAY_FX.charge.slot];
 for(const slot of ['hand1','hand2']){
  const def=ITEMS[a.equipment?.[slot]];
  if(!def?.magic)continue;
  const color=magicBoltColor(def),palette=magicChargePalette(color);
  if(effect.pixelfx!=='arcane/spell-charge'){
   drawGameplayFx(c,'charge',x,y,g.time,Number(a.id)||0,context,{start:palette[6],end:color});
   continue;
  }
  const tip=wandTipWorld(a.room?{...a,x,y:a.roomY??a.y}:a,slot,g.time,undefined,size);
  if(!tip)continue;
  const angle=effect.pxAngle*Math.PI/180,localX=(effect.pxFlip?-15:15)*effect.pxScale,localY=-22*effect.pxScale;
  const fxX=tip.x-(localX*Math.cos(angle)-localY*Math.sin(angle));
  const fxY=tip.y-(localX*Math.sin(angle)+localY*Math.cos(angle));
  drawGameplayFx(c,'charge',fxX,fxY,g.time,(Number(a.id)||0)+(slot==='hand2'?479:0),{layer},
   {pxOptions:{...effect.pxOptions,palette}});
 }
}
// Only local accents: existing weather, fog, trees and collectible wildlife remain authoritative.
export function drawGameplayAtmosphere(c,g,camera,w,h,visible=()=>true){
 if(g.phase!=='play'||g.players?.every(p=>p.room))return;
 const env=g.generatedEnvironment,left=camera.x-w/camera.zoom/2,top=camera.y-h/camera.zoom/2;
 const time=g.time||0;
 if(env==='graveyard'){c.save();c.globalAlpha*=.2;drawGameplayFx(c,'fog',camera.x,camera.y+35,time,3);c.restore();}
 if(env==='swamp'&&((g.sky?.elapsed||0)%480)>=300&&((g.sky?.elapsed||0)%480)<450)for(const a of (g.realmState?.animals||[]).filter(a=>a.kind==='marsh_firefly').slice(0,2))if(visible(a,100)){c.save();c.globalAlpha*=.3;drawGameplayFx(c,'fireflies',a.x,a.y,time,7);c.restore();}
 if(env==='forest'){
  const tree=(g.scenery||[]).find(a=>['tree','oak','pine'].includes(a.kind)&&!a.fallen&&visible(a,120));
  if(tree){c.save();c.globalAlpha*=.45;drawGameplayFx(c,'leaves',tree.x,tree.y-35,time,5);c.restore();}
 }
 if(['monsoon','thunderstorm'].includes(g.weather?.type))for(let i=0;i<2;i++){
  const x=left+w/camera.zoom*(.3+i*.4),y=top+h/camera.zoom*(.65+i*.2);
  if(!(g.house?.floors||[]).some(f=>x>=f.x&&x<f.x+f.w&&y>=f.y&&y<f.y+f.h))drawGameplayFx(c,'rain-splash',x,y,time+i*.3,20+i);
 }
 if(env==='ice'){c.save();c.globalAlpha*=.45;drawGameplayFx(c,'snow',camera.x,camera.y,time,11);c.restore();}
}
