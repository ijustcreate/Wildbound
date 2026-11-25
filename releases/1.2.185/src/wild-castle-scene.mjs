import {drawActorGameplayFx} from './gameplay-fx.mjs';
import {drawMinimapPlayer} from './minimap-player.mjs';
import {hunterPets} from './hunter-pets.mjs';
import {drawPortalFlash} from './portal-transition.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {CASTLE_INTERIOR_ORIGIN,GREYHAVEN_HEARTH,castleSeatFor,castleStoryName,toCastleWorld} from './wild-castle.mjs';
import {castleAtriumPose} from './wild-castle-atrium.mjs';
import {flooFireGreen} from './floo-travel.mjs';
import {CASTLE_INTERIOR_SIZE,castleInteriorPlan,castleInteriorSubjects,drawCastleInteriorGround} from './wild-castle-interior.mjs';
import {castleResidents} from './wild-castle-residents.mjs';
import {greyhavenCastSubjects} from './greyhaven-cast.mjs';
import {drawSnowyOwl} from './snowy-owl-art.mjs';
import {TRAIN_SEATED_PELVIS_HEIGHT} from './train-clips.mjs';

function drawCastleResident(c, renderer, actor, time) {
 const {x,y}=actor;
 if(actor.owlVariant)drawSnowyOwl(c,actor,time,28);
 else{
  c.fillStyle='#1717184d';c.fillRect(Math.round(x-9),Math.round(y-1),19,4);
  renderer.animator.draw(c,actor,time,PLAYER_RENDER_SIZE*(actor.id==='greyhaven-wart'?.88:1));
  if(actor.floatingBook){
   const by=Math.round(y-30-Math.sin(actor.floatingBook/1.8*Math.PI)*15),bx=Math.round(x+19);
   c.fillStyle='#342e43';c.fillRect(bx-2,by-2,15,9);
   c.fillStyle='#cbb78b';c.fillRect(bx,by-1,11,6);
   c.fillStyle='#645563';c.fillRect(bx+5,by-1,1,6);
  }
  if(actor.castSpark){
   const bx=x+actor.faceX*19,by=y-34-actor.castSpark*9;
   c.fillStyle='#86bcca';c.fillRect(Math.round(bx-2),Math.round(by),5,1);
   c.fillRect(Math.round(bx),Math.round(by-2),1,5);
   c.fillStyle='#e2eee3';c.fillRect(Math.round(bx),Math.round(by),1,1);
  }
 }
}

export function drawCastleMap(c,renderer,story,party,w,h){
 if(renderer.splitChild)return;
 const {width,height}=CASTLE_INTERIOR_SIZE,plan=castleInteriorPlan(story);
 const split=renderer.splitViews?.length>1;
 const mapWidth=split?Math.min(84,Math.max(60,Math.round(w*.083))):98,mapHeight=Math.ceil(height*mapWidth/width);
 const x=split?Math.round(w*(renderer.uiPlayArea?.x??.5)-mapWidth/2):(renderer.hudAnchor?.x??w-mapWidth-12);
 const y=split?32:(renderer.hudAnchor?.y??h-mapHeight-46);
 c.save();
 c.fillStyle='#181b23e8';c.fillRect(x-3,y-17,mapWidth+6,mapHeight+20);
 c.fillStyle='#9e846953';c.fillRect(x-2,y-17,mapWidth+4,1);
 c.font='600 9px system-ui';c.textAlign='center';c.fillStyle='#ecd4a3';
 c.fillText(story+' · '+castleStoryName(story),x+mapWidth/2,y-6);
 const scale=mapWidth/width;
 c.save();c.translate(x,y);c.scale(scale,scale);
 c.fillStyle='#a09784';
 for(const f of plan.floors){
  if(f.r!==undefined){c.beginPath();c.arc(f.x,f.y,f.r,0,Math.PI*2);c.fill();}
  else c.fillRect(f.x,f.y,f.w,f.h);
 }
 c.fillStyle='#403a39';
 for(const item of [...plan.walls,...(plan.voids||[])])c.fillRect(item.x,item.y,item.w,item.h);
 c.fillStyle='#eee1b3';
 for(const stair of plan.stairs)c.fillRect(stair.x+stair.w/2-6,stair.y+stair.h/2-5,12,10);
 c.restore();
 for(let i=party.length-1;i>=0;i--){
  const p=party[i];
  const mx=x+(p.x-CASTLE_INTERIOR_ORIGIN.x)*scale,my=y+(p.y-CASTLE_INTERIOR_ORIGIN.y)*scale;
  drawMinimapPlayer(c,mx,my,p,split ? .85 : 1);
 }
 c.restore();
}

export function drawCastlePrompts(ctx,renderer,w,h,speakers){
 const {camera,cameraOwnerIds}=renderer,labels=[];
 for(const {player,prompt} of speakers){
  if(!prompt||player.ui||cameraOwnerIds?.length&&!cameraOwnerIds.includes(player.id))continue;
  const x=Math.round(w/2+(player.x-camera.x)*camera.zoom);
  const foot=Math.round(h/2+(player.y-camera.y)*camera.zoom);
  const below=prompt.includes('TALK TO ')&&foot+17*camera.zoom<h-12;
  const y=Math.round(foot+(below?17:-44)*camera.zoom);
  if(x<0||x>w||y<18||y>h)continue;
  labels.push({x,y,prompt,below,color:player.color||'#ffe3a7'});
 }
 if(!labels.length)return;
 ctx.save();
 ctx.font='650 12px system-ui';
 for(const label of labels)label.half=Math.min(w-20,ctx.measureText(label.prompt).width)/2;
 const crowded=labels.some((a,i)=>labels.slice(i+1).some(b=>Math.abs(a.x-b.x)<a.half+b.half+6&&Math.abs(a.y-b.y)<26));
 const gap=crowded?14:17,placed=[];
 ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.lineWidth=crowded?2.5:3;ctx.strokeStyle='#201e24';
 if(crowded)ctx.font='650 10px system-ui';
 for(const label of labels){
  const half=crowded?Math.min(w-20,ctx.measureText(label.prompt).width)/2:label.half;
  const x=Math.max(half+8,Math.min(w-half-8,label.x));
  let {y}=label;
  const collides=()=>placed.some(p=>Math.abs(p.x-x)<p.half+half+6&&Math.abs(p.y-y)<gap);
  const direction=label.below?1:-1;
  while(collides())y+=gap*direction;
  if(y<18||y>h-7){
   y=label.y-gap*direction;
   while(collides())y-=gap*direction;
  }
  if(y<18||y>h-7)continue;
  placed.push({x,y,half});
  ctx.fillStyle=label.color;
  ctx.strokeText(label.prompt,x,y,w-20);ctx.fillText(label.prompt,x,y,w-20);
 }
 ctx.restore();
}

export function drawCastleScene(renderer,g,w,h,story,party,promptFor){
 const ctx=renderer.ctx,origin=CASTLE_INTERIOR_ORIGIN,raised=g.trainTest.greyhavenBridgeRaised===true;
 ctx.save();ctx.translate(origin.x,origin.y);drawCastleInteriorGround(ctx,story,g.time,raised);ctx.restore();
 renderer.drawWorldLoot(g,w,h);
 renderer.drawCombatGround(g,w,h);
 const people=party.filter(a=>!a.room&&!a.controlledBy).map(player=>{
  const seat=castleSeatFor(g,player);
  if(!seat){
   const actor=castleAtriumPose(player,g);
   return {player,actor,depth:actor.y-origin.y};
  }
  const at=toCastleWorld(seat.seat),lift=TRAIN_SEATED_PELVIS_HEIGHT*PLAYER_RENDER_SIZE/48;
  return {player,depth:seat.seatDepth,seated:true,actor:{...player,x:at.x,y:at.y+lift,
   faceX:seat.faceX,faceY:seat.faceY,animationAction:'train_sit',moving:false,step:0}};
 });
 const actors=[...(g.enemies||[]),...(g.villageFollowers||[]),...(g.ghosts||[]),...hunterPets(g)].filter(a=>!a.room&&!a.controlledBy);
 const subjects=[
  ...castleInteriorSubjects(story,g.time,raised,flooFireGreen(g,GREYHAVEN_HEARTH.id)),
  ...castleResidents(g,story).map(resident=>({resident,depth:resident.y})),
  ...greyhavenCastSubjects(g,story,renderer.animator),
  ...actors.map(actor=>({actor,depth:actor.y-origin.y})),
  ...people,
 ].sort((a,b)=>a.depth-b.depth);
 for(const subject of subjects){
  const actor=subject.actor;
  if(actor){
   if(!subject.seated){ctx.fillStyle='#1717184d';ctx.fillRect(Math.round(actor.x-11),Math.round(actor.y-2),22,5);}
   drawActorGameplayFx(ctx,g,actor,PLAYER_RENDER_SIZE,'back');
   renderer.animator.draw(ctx,actor,g.time,PLAYER_RENDER_SIZE);
   drawActorGameplayFx(ctx,g,actor,PLAYER_RENDER_SIZE,'front');
  }else{
   ctx.save();ctx.translate(origin.x,origin.y);
   if(subject.resident)drawCastleResident(ctx,renderer,subject.resident,g.time);
   else subject.paint(ctx);
   ctx.restore();
  }
 }
 renderer.drawCombatProjectiles(g,w,h);
 renderer.drawCombatEffects(g);
 ctx.restore();
 drawCastleMap(ctx,renderer,story,people.map(q=>q.actor),w,h);
 drawCastlePrompts(ctx,renderer,w,h,people.map(({player,actor})=>({player:actor,prompt:promptFor(g,player)})));
 const {notice,noticeUntil,time}=g.trainTest;
 if(!renderer.splitChild&&notice&&noticeUntil>time){
  ctx.save();ctx.font='600 11px system-ui';ctx.textAlign='center';
  const space=Math.max(120,w-124),center=space/2;
  const lines=[''];
  for(const word of notice.split(' ')){
   const index=lines.length-1,line=lines[index];
   if(line&&ctx.measureText(`${line} ${word}`).width>space-30)lines.push(word);
   else lines[index]=line?`${line} ${word}`:word;
  }
  const width=Math.min(space-16,Math.max(...lines.map(line=>ctx.measureText(line).width))+24);
  const top=h-64-lines.length*14;
  ctx.fillStyle='#231e27e8';ctx.fillRect(center-width/2,top,width,lines.length*14+12);
  ctx.fillStyle='#f1d5a6';lines.forEach((line,index)=>ctx.fillText(line,center,top+15+index*14));
  ctx.restore();
 }
 drawPortalFlash(ctx,g,w,h,renderer.cameraOwnerIds);
}
