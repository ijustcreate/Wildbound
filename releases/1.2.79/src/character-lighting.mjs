import {daylight,lightSources} from './night-cycle.mjs';
import {worldLightField} from './world-lighting.mjs';
import {pointLightVisibility} from './realtime-shadows.mjs';

export function characterLightingFrame(game,room=null,{occluded=true}={}){
 const sources=lightSources(game,room);
 return {sun:game.generatedEnvironment==='forest'?daylight(game)*(!game.weather?1:.45):0,ambient:daylight(game),sources,field:occluded?worldLightField(game,sources,room):null,room,time:game.time||0};
}
export function characterLightingAt(frame,actor,{lift=(actor.jumpHeight||0)+(actor.groundHeight||0),bodyHeight=22}={}){
 if(!frame)return null;
 if((frame.room||null)!==(actor.room||null))return null;
 const lights=frame.sources.map(source=>{
  const sourceHeight=source.height??36,pointHeight=lift+bodyHeight;
  const distance=Math.hypot(actor.x-source.x,actor.y-source.y,pointHeight-sourceHeight),radius=Math.max(1,source.radius||1);
  const strength=Math.max(0,1-distance/radius)**2*(source.intensity??1)*pointLightVisibility(frame.field,source,{x:actor.x,y:actor.y,z:pointHeight},`actor:${actor.id}`);
  return {...source,strength,dx:source.x-actor.x,dy:source.y-actor.y+pointHeight-sourceHeight};
 }).filter(source=>source.strength>.015).sort((a,b)=>b.strength-a.strength).slice(0,4);
 return {sun:frame.sun||0,ambient:Math.max(0,Math.min(1,frame.ambient)),bodyHeight,lights};
}
// Alpha-clipped palette tint: keeps silhouettes and pixel edges intact, affects
// hair, skin AND equipment, and never changes the unlit animation cache.
let characterRim=null;
export function shadeCharacterSurface(surface,lighting,{pixelsPerWorld=1}={}){
 if(!lighting||(!lighting.lights.length&&!lighting.sun))return;
 const c=surface.getContext('2d'),w=surface.width,h=surface.height;c.save();
 c.globalCompositeOperation='source-atop';
 if(lighting.sun){
  const sun=c.createLinearGradient(w*.25,h*.25,w*.65,h*.7);sun.addColorStop(0,'#ffe4a0');sun.addColorStop(.6,'#ffe4a000');sun.addColorStop(1,'#326856');
  c.globalAlpha=lighting.sun*.13;c.fillStyle=sun;c.fillRect(0,0,w,h);
 }
 // Scene night shading already supplies ambient darkness. Only add local
 // source color here, never a second blue night wash over each character.
 const cx=w/2,cy=h/2-(lighting.bodyHeight??22)*pixelsPerWorld,radius=24*pixelsPerWorld;
 for(const source of lighting.lights){
  const distance=Math.hypot(source.dx,source.dy)||1;
  const dx=source.dx/distance*radius,dy=source.dy/distance*radius;
  const gradient=c.createLinearGradient(cx+dx,cy+dy,cx-dx,cy-dy);
  const color=/^#[\da-f]{6}$/i.test(source.color||'')?source.color:'#ffd28b';
  gradient.addColorStop(0,color);gradient.addColorStop(1,color+'00');
  // Keep palette/outline contrast. The scene halo supplies broad illumination;
  // this restrained directional tint supplies source-facing color, not paint.
  c.globalAlpha=Math.min(.24,source.strength*.23);c.fillStyle=gradient;c.fillRect(0,0,w,h);
 }
 c.restore();
 // A thin inner-silhouette rim, never an external halo or a uniformly traced
 // outline. This surface is a lit copy; animation/wardrobe caches stay unlit.
 if(typeof document==='undefined'||!c.drawImage)return;
 characterRim??=document.createElement('canvas');
 if(characterRim.width!==w||characterRim.height!==h){characterRim.width=w;characterRim.height=h;}
 const rim=characterRim.getContext('2d'),step=Math.max(1,Math.round(pixelsPerWorld));
 c.save();c.globalCompositeOperation='source-atop';
 for(const light of lighting.lights){
  const len=Math.hypot(light.dx,light.dy)||1;
  rim.globalCompositeOperation='source-over';rim.clearRect(0,0,w,h);rim.drawImage(surface,0,0);
  rim.globalCompositeOperation='destination-out';rim.drawImage(surface,-light.dx/len*step,-light.dy/len*step);
  rim.globalCompositeOperation='source-in';rim.fillStyle=/^#[\da-f]{6}$/i.test(light.color||'')?light.color:'#ffd28b';rim.fillRect(0,0,w,h);
  c.globalAlpha=Math.min(.35,light.strength*.48);c.drawImage(characterRim,0,0);
 }
 c.restore();
}
