import {assembleOllivanders,drawOllivandersSubject} from './diagon-wand-shop.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {
 ALLEY,ALLEY_PATHS,NOCTURNE_STREETS,ALLEY_SHOPS,ALLEY_CLOSED_FRONTAGES,OLLIVANDERS_PASSAGE,NOCTURNE_CONNECTOR,
 alleyGate,alleyPrompt,alleyShopGround,holdingWand,insideNocturne,
} from './diagon-alley.mjs';
import {drawPortal} from './portal-art.mjs';
import {drawStoragePortals} from './storage-portals.mjs';
import {drawSnowyOwl} from './snowy-owl-art.mjs';
import {assembleAlleyShop} from './diagon-shop-scenes.mjs';
import {drawAlleyPaving,drawNocturnePaving,streetLamp,drawAlleyFountain,paintAlleyHeadstone,drawClosedFrontageGround,drawClosedFrontage,
 DIAGON_STREET_LAMPS,NOCTURNE_WALL_CANDLES,drawNocturneWallCandles} from './diagon-alley-street-art.mjs';
import {drawNocturneRearGround,queueNocturneGraves,drawNightglassRearDoor,NIGHTGLASS_REAR_DOOR} from './diagon-nocturne-rear.mjs';
import {drawAlleyStreetLighting,drawAlleyDust,drawAlleyReflectedLight,drawNocturneStreetFog} from './diagon-street-lighting.mjs';
import {queueAlleyWayfinding,drawNocturneRatHoles,drawOllivandersPassage,drawNocturneThreshold,queueNocturneConnectorWall} from './diagon-wayfinding.mjs';
import {DIAGON_PORTAL_COLOR,paintDiagonBrickWing,queueDiagonEntryPlaza} from './diagon-entry-plaza.mjs';
import {inGardenPond} from './diagon-garden-ward.mjs';
import {drawActorGameplayFx} from './gameplay-fx.mjs';
import {activePatronuses} from './patronus.mjs';
import {drawSwimmer,drawBreath} from './swim-render.mjs';
import {drawPortalFlash} from './portal-transition.mjs';
import {queueAlleyStreetProps} from './diagon-alley-props.mjs';
import {shape} from './diagon-shop-brush.mjs';
import {alleyResidentsFor,drawAlleyResidentActivity} from './diagon-residents.mjs';
import {drawDiagonFootprints} from './diagon-footprints.mjs';
import {drawMageGardenGround,queueMageGarden,insideMageGarden} from './diagon-mage-garden.mjs';
import {queueNocturneSpiderStall} from './nocturne-spider-merchant.mjs';
import {nocturneDuelLootHint,queueNocturneDarkWizards} from './nocturne-dark-wizard-art.mjs';
import {NOCTURNE_EDGE_FRONTAGES} from './nocturne-edge-frontages.mjs';
import {queueHunterOwlPets} from './hunter-pet-render.mjs';
import {queueAlleyGardenProps} from './diagon-garden-props.mjs';
import {queueDiagonCritters} from './diagon-critter-art.mjs';
import {nocturneCatFor,NOCTURNE_RAT_HOLES} from './diagon-garden-cats.mjs';
import {diagonCritterPrompt} from './diagon-critters.mjs';
import {activeGardenBench,gardenBenchActor} from './diagon-garden-benches.mjs';
import {actionInputLabel} from './action-prompts.mjs';
import {prepareDiagonGardenApproach} from './diagon-alley-assets.mjs';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
const mainPaving={...ALLEY,right:8900};
const nocturnePaving=[...NOCTURNE_STREETS,...ALLEY_SHOPS.filter(s=>s.district==='nocturne').map(alleyShopGround)];
function text(c,t,x,y,size=14,color='#eee0b4'){c.font=`${size}px Georgia`;c.textAlign='center';c.fillStyle=color;c.fillText(t,x,y);c.textAlign='start';}
export function drawAlleyGate(c,g){const a=alleyGate(g);if(!a)return;const t=g.trainTest,open=t.alleyOpened,progress=open?Math.min(1,(t.time-t.alleyOpenedAt)/.65):0;
 c.save();c.translate(Math.round(a.x),Math.round(a.y));
 paintDiagonBrickWing(c,-141,9,55,45);paintDiagonBrickWing(c,86,9,55,45);
 shape(c,'#33423966',[[-92,-3],[-72,-18],[78,-15],[102,-3],[98,18],[72,29],[-81,24],[-96,13]]);
 shape(c,'#41483e',[[-90,6],[-90,-75],[-73,-94],[73,-94],[90,-75],[90,6],[80,10],[-80,10]]);
 rect(c,-83,-76,166,78,'#68695a');rect(c,-75,-86,150,10,'#a4a088');
 for(const x of [-80,62]){
  rect(c,x,-77,18,73,'#858572');
  for(let y=-72;y<-7;y+=15){
   rect(c,x+2,y,14,11,'#92907a');rect(c,x+2,y,12,2,'#b2ad92');
   rect(c,x+12,y+3,4,8,'#6b715f');
  }
  rect(c,x-4,-79,26,5,'#b4af93');rect(c,x-3,-7,25,7,'#555f50');
 }
 const stones=['#8b7864','#998573','#aa9278','#817363'];
 for(let row=0;row<7;row++)for(let col=0;col<8;col++){
  const side=col<4?-1:1,dx=side*progress*(30+(3-Math.abs(col-3.5))*10);
  const x=-62+col*16+dx,y=-84+row*12+progress*Math.abs(col-3.5)*-4;
  const tint=(col*3+row*5)%stones.length;
  shape(c,stones[tint],[[x,y+2],[x+2,y],[x+13,y],[x+15,y+2],[x+15,y+10],[x+1,y+10]]);
  if(tint!==3)rect(c,x+2,y+1,10,1,'#ba9e80');
 }
 rect(c,-72,2,144,5,'#96927a');rect(c,-74,7,148,3,'#646c57');
 shape(c,'#637454',[[-85,-70],[-78,-76],[-62,-75],[-57,-71],[-62,-67],[-72,-68],[-79,-63]]);
 shape(c,'#7c875e',[[62,4],[68,-1],[81,-3],[86,1],[83,7],[72,8]]);
 c.restore();
 if(progress>.7)drawPortal(c,{x:a.x,y:a.y-12,color:DIAGON_PORTAL_COLOR,forestTravel:true},t.time,'DIAGON ALLEY');
 if(!open&&g.players.some(p=>holdingWand(p)&&Math.hypot(p.x-a.x,p.y-a.y)<180)){for(let i=0;i<6;i++){const f=(t.time*.6+i/6)%1;rect(c,a.x-50+i*18,a.y-20-f*50,2,2,'#f1d48c');}}
 text(c,open?'Diagon Alley':'An ordinary brick wall?',a.x,a.y+54,11);
}
const alleyFrontages=[...ALLEY_CLOSED_FRONTAGES,...NOCTURNE_EDGE_FRONTAGES];

export function drawDiagonAlley(renderer,g,w,h){const c=renderer.ctx,t=g.trainTest,cam=renderer.camera;
 const halfWidth=w/(2*cam.zoom),halfHeight=h/(2*cam.zoom);
 const bounds={left:cam.x-halfWidth,right:cam.x+halfWidth,top:cam.y-halfHeight,bottom:cam.y+halfHeight};
 const visible=(x,y,padX,padY)=>Math.abs(x-cam.x)<halfWidth+padX&&Math.abs(y-cam.y)<halfHeight+padY;
 if(g.players.some(p=>p.x<8200&&p.y<4470))prepareDiagonGardenApproach();
 const shops=ALLEY_SHOPS.filter(s=>visible(s.x,s.y,250,350));
 rect(c,bounds.left,bounds.top,w/cam.zoom+2,h/cam.zoom+2,'#121820');
 // The walkable geometry is the same cutout used by movement. The setback
 // behind the shops recedes into stepped blue shadow on the unlit side.
 for(const [padding,color] of [[32,'#19212a'],[18,'#212b33'],[7,'#2d373c']]){
  for(const area of ALLEY_PATHS)rect(c,area.x-padding,area.y-padding,area.w+padding*2,area.h+padding*2,color);
 }
 c.save();c.beginPath();
 for(const area of ALLEY_PATHS)c.rect(area.x,area.y,area.w,area.h);
 c.clip();
 rect(c,bounds.left,bounds.top,w/cam.zoom+2,h/cam.zoom+2,'#535456');
 drawAlleyPaving(c,mainPaving,bounds);
 c.restore();
 drawNocturnePaving(c,nocturnePaving,bounds);
 drawNocturneThreshold(c,visible);
 drawNocturneRearGround(c,g,visible);
 drawNocturneRatHoles(c,NOCTURNE_RAT_HOLES,visible);
 drawMageGardenGround(c,g,visible,renderer.animator);
 drawOllivandersPassage(c,OLLIVANDERS_PASSAGE,visible);
 drawDiagonFootprints(c,g,visible);
 if(visible(8000,4040,90,80))paintAlleyHeadstone(c,8000,4082);
 const objects=[];
 queueMageGarden(c,g,visible,objects);
 queueAlleyGardenProps(c,g.time,visible,objects);
 queueDiagonCritters(c,g,visible,objects);
 const alleyCat=nocturneCatFor(g);
 if(alleyCat&&visible(alleyCat.x,alleyCat.y,35,48))objects.push({depth:alleyCat.y,player:alleyCat,size:36});
 if(visible(8000,4163,90,115))objects.push({depth:4183,paint:()=>drawAlleyFountain(c,g.time)});
 queueAlleyStreetProps(c,g.time,visible,objects);
 queueNocturneSpiderStall(c,g,visible,objects);
 queueHunterOwlPets(c,g,visible,objects);
 queueNocturneDarkWizards(c,g,visible,objects,renderer.animator,bounds);
 queueNocturneGraves(c,g,visible,objects);
 queueAlleyWayfinding(c,visible,objects);
 queueNocturneConnectorWall(c,NOCTURNE_CONNECTOR,visible,objects);
 queueDiagonEntryPlaza(c,visible,objects);
 for(const frontage of alleyFrontages){
  if(!visible(frontage.x,frontage.y,frontage.halfWidth+23,frontage.halfDepth+80))continue;
  drawClosedFrontageGround(c,frontage);
  objects.push({depth:frontage.y+frontage.halfDepth,paint:()=>drawClosedFrontage(c,frontage)});
 }
 for(const s of shops){
  if(s.id==='ollivanders')assembleOllivanders(c,s,g,objects);
  else assembleAlleyShop(c,s,g,objects,renderer.animator);
 }
 renderer.drawWorldLoot(g,w,h);
 if(visible(NIGHTGLASS_REAR_DOOR.x,NIGHTGLASS_REAR_DOOR.y,38,70))
  objects.push({depth:NIGHTGLASS_REAR_DOOR.y+NIGHTGLASS_REAR_DOOR.halfSpan,paint:()=>drawNightglassRearDoor(c,!!t.nocturneCemetery?.door)});
 for(const {x,y,district} of DIAGON_STREET_LAMPS)
  if(visible(x,y,34,73))objects.push({depth:y,paint:()=>streetLamp(c,x,y,district,g.time)});
 for(const candle of NOCTURNE_WALL_CANDLES)
  if(visible(candle.x,candle.y,24,52))objects.push({depth:candle.y+4,paint:()=>drawNocturneWallCandles(c,candle,g.time)});
 const actors=[...g.players,...alleyResidentsFor(g)];
 for(const p of actors)if(visible(p.x,p.y,80,100))objects.push({depth:p.y,player:gardenBenchActor(g,p)});
 for(const e of g.enemies||[])if(e.borginReflection&&(e.hp>0||(e.deathTimer||0)<1.7)&&visible(e.x,e.y,64,85)){
  objects.push({depth:e.y,player:e,size:PLAYER_RENDER_SIZE});
 }
 for(const a of activePatronuses(g))if(visible(a.x,a.y,80,100))objects.push({depth:a.y,player:a,size:43});
 for(const a of g.stationOwls||[])if(!a.hidden&&visible(a.x,a.y,80,100))objects.push({depth:a.y,owl:a});
 const lighting=drawAlleyStreetLighting(c,renderer,g,bounds,visible,{
  lamps:DIAGON_STREET_LAMPS,candles:NOCTURNE_WALL_CANDLES,
  shops,facades:alleyFrontages,nocturnePaths:nocturnePaving,actors,paths:ALLEY_PATHS,
 });
 const priorLight=renderer.animator.lighting;
 renderer.animator.lighting=lighting;
 try{
 for(const a of objects.sort((a,b)=>a.depth-b.depth)){
  if(a.paint)a.paint();
  if(a.shopAsset)drawOllivandersSubject(c,a);
  if(a.player){
   const size=a.size||PLAYER_RENDER_SIZE;
   const paint=p=>renderer.animator.draw(c,p,g.time,size);
   if(inGardenPond(a.player))drawSwimmer(c,a.player,g.time,paint);
   else paint(a.player);
   drawActorGameplayFx(c,g,a.player,size,'front');
  }
  if(a.owl)drawSnowyOwl(c,a.owl,g.time);
 }
 }finally{renderer.animator.lighting=priorLight;}
 renderer.drawCombatEffects(g);
 drawAlleyReflectedLight(c,renderer,lighting,visible);
 drawNocturneStreetFog(c,g,bounds,nocturnePaving);
 drawAlleyDust(c,g.time,bounds,{paths:ALLEY_PATHS,insideNocturne,zoom:cam.zoom});
 for(const p of g.players)if(inGardenPond(p)&&visible(p.x,p.y,30,34))drawBreath(c,p);
 drawAlleyResidentActivity(c,g,visible);
 drawStoragePortals(c,g,d=>visible(d.x,d.y,70,70));
 drawPortal(c,{...ALLEY.entry,color:DIAGON_PORTAL_COLOR,forestTravel:true},g.time,'RETURN');text(c,'Return to Jungle Ruins station',8000,5725,12);
 c.restore();
 const nearWorkshop=g.players.some(p=>shops.some(s=>Math.hypot(p.x-s.x,p.y-s.y)<188));
 if(!nearWorkshop&&!g.players.some(p=>insideMageGarden(p.x,p.y))){
  const nocturne=g.players.some(p=>insideNocturne(p.x,p.y));
  rect(c,16,16,244,46,nocturne?'#252337e8':'#152b2ce8');c.font='17px Georgia';c.fillStyle='#edddb2';c.fillText(nocturne?'Nocturne Alley':'Diagon Alley',27,36);
  c.font='10px system-ui';c.fillText('Walk into a shop · Interact to browse',27,51);
 }
 for(const p of g.players){
  const seated=activeGardenBench(g,p),loot=seated?'':nocturneDuelLootHint(g,p);
  const prompt=loot?'':alleyPrompt(g,p),critter=seated?'':diagonCritterPrompt(g,p);
 const label=loot||(critter?actionInputLabel(g,p,'attack')+' · '+critter:
   prompt.startsWith('WALK THROUGH THE ')?prompt:prompt?actionInputLabel(g,p,'interact')+' · '+prompt:'');
  if(label){c.textAlign='center';c.font='bold 13px system-ui';c.fillStyle='#e8d49a';c.fillText(label,w/2,h-30);c.textAlign='start';break;}
 }
 if(t.noticeUntil>t.time){c.font='13px system-ui';c.fillStyle='#f1e4bf';c.fillText(t.notice,22,h-55);}drawPortalFlash(c,g,w,h);
}
