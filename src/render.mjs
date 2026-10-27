import './broom-passenger-art.mjs';
import {drawDragonBreath} from './dragon-events.mjs';
import {drawForestSunlight} from './forest-sunlight.mjs';
import {swordLoadout,paintSwordImpact} from './sword-feel.mjs';
import {drawBoundlessGrass,drawBoundlessRoutes} from './boundless-art.mjs';
import {scenePropCasters} from './scene-casters.mjs';
import {nearbyScenery} from './performance.mjs';
import {LocomotionHistory} from './native-locomotion.mjs';
import {GrassFieldRenderer} from './grass-field.mjs';
import {drawShoreGoblinTells} from './shore-goblin-ai.mjs';
import {drawDeathSteps} from './death-steps.mjs';
import {drawReaperDrain} from './reaper-ai.mjs';
import {drawBansheeSkills} from './banshee-queen.mjs';
import {drawFrostPrison} from './frost-prison.mjs';
import {drawCaptainTells} from './oathless-captain-ai.mjs';
import {drawDreadmaneTells} from './dreadmane-lion-ai.mjs';
import {drawVictoryChest} from './victory-chest.mjs';
import {packAssets} from './world-pack-assets.mjs';
import {drawOldWells} from './old-well.mjs';
import {drawRoomScene} from './hero-ui.mjs';
import {sharedRoomGroups,roomWindowLayout,sharedRoomCamera} from './room-windows.mjs';
import {anacondaRenderParts,drawAnacondaSegment,drawAnacondaShadow} from './anaconda-art.mjs';
import {drawMerchant} from './traveling-merchant.mjs';
import {visibleVillagers,drawVillagerNpc,drawVillagerCampfire} from './villagers.mjs';
import {drawQuestNpc,drawNpcQuestMarkers} from './npc-quests.mjs';
import {drawBiomeTile,drawBiomeAccents,drawBiomeAir} from './biome-art.mjs';
import {drawDesertChunk} from './desert-art.mjs';
import {drawRealmGround,drawRealmAtmosphere,REALM_COLORS} from './realm-art.mjs';
import {realmContexts} from './realm-world.mjs';
import {drawRealmLife,drawRealmEvent} from './realm-life.mjs';
import {drawMarshFireflyGlows} from './swamp-fireflies.mjs';
import {drawBeachGround,drawBeachGulls} from './beach-art.mjs';
import {drawWildFaunaTells} from './wild-fauna.mjs';
import {WILD_FAUNA_KINDS} from './wild-fauna-data.mjs';
import {clipRiverTile,drawDepthCorners} from './river-edges.mjs';
import {drawSupplyChest} from './supply-chests.mjs';
import {resizeGameSurface,PLAYER_RENDER_SIZE,creatureRenderSize,actorRenderSize} from './render-settings.mjs';
import {drawMagicBolt} from "./magic-bolt-render.mjs";
import {drawFriendshipHearts} from './friendship-hearts.mjs';
import {drawJumanjiVines} from './jumanji-vines.mjs';
import {drawMagicBurst} from './magic-bolt-effects.mjs';
import {hunterPets} from './hunter-pets.mjs';
import {drawHunterPet} from './hunter-pet-render.mjs';
import {drawFearFace} from './temple.mjs';
import {applyCelShading} from './cel-shading.mjs';
import {drawParticleEffect,beginParticleFrame} from './particles.mjs';
import {drawWaterSurface} from './water-surface.mjs';
import {drawBridges} from './bridges.mjs';
import {vehicleSceneryDepth} from './vehicle-ground.mjs';
import {terrainActorDepth} from './terrain-support.mjs';
import {drawSwimmer,drawBreath,drawWaterline} from './swim-render.mjs';
import {drawBowAim,drawPounceAim} from './bow-aim.mjs';
import {drawSinking} from './quicksand.mjs';
import {QuicksandSurface} from './quicksand-surface.mjs';
import {drawNightLight, drawNightStatus, enemyVisibility,enemySightOpacity} from './night-cycle.mjs';
import {drawMysteryWorld,drawMysteryTracker} from './mysteries.mjs';
import {drawHouseLights} from './house-lights.mjs';
import {drawHouseCar,drawVehicleEffects,drawVehicleHood,drawVehicleWheels} from './house-render.mjs';
import {drawWorldGrid} from './world-grid.mjs';
import {drawPavingTile} from './house-paving.mjs';
import {vegetationBlocked} from './house-surfaces.mjs';
import {drawLivingEcosystem} from './living-ecosystem.mjs';
import {drawNightEnemyEffects, nightEnemyOpacity} from './night-enemies.mjs';
import {drawNightEquipment} from './night-equipment.mjs';
import {NIGHT_KINDS} from './night-rigs.mjs';
import {drawTemple} from './temple.mjs';
import {drawDestruction} from './structure-destruction.mjs';
import {drawIceHints,iceSolid,iceBase,clipSnow,snowRim,drawSnowGround,snowAt,snowShadowFactor,drawWinterTile} from './ice-world.mjs';
import { drawFieldWorld } from "./field-art.mjs";
import {drawExpansion,drawTreeWeb} from './expansion.mjs';
import { waterAt, isShallow, drawTracks, drawProp } from "./environment.mjs";
import {drawBansheeSteps} from './banshee-steps.mjs';
import {drawChristmasGround,drawChristmasSpirit} from './christmas.mjs';
import {drawSuccubusEffects} from './succubus-charm.mjs';
import {drawImpGround,drawImpBombs} from './imps.mjs';
import {drawZombieTells} from './zombies.mjs';
import {renderLOD,DecorationCache,ActorPoseCache} from './render-lod.mjs';
import { drawRain, drawFog } from "./weather-art.mjs";
import {drawPuddles,drawWetDrips} from './wet-weather.mjs';
import { drawPortal } from "./portal-art.mjs";
import {
  CENTER,
  WORLD,
  TILE,
  FINISH,
  EVENTS,
  expeditionCameraTarget,
  clamp,
} from "./core.mjs";
import { propDepth, isOccluded } from "./world.mjs";
import { Animator } from "./animation.mjs";
import {characterLightingFrame} from './character-lighting.mjs';
import {WorldLightRenderer,propLightGeometry} from './world-lighting.mjs';
import { drawBoard } from "./board.mjs";
import {BOARD_TABLE,boardActorDepth,boardTableDepth} from './board-table.mjs';
import {boardTableLegs} from './board-table-geometry.mjs';
import { canSee, VISION } from "./adventure.mjs";
import { ITEMS } from "./items.mjs";
import { drawHazards, drawWeather } from "./hazards.mjs";
import { rules } from "./definitions.mjs";
import { drawItem } from "./item-art.mjs";
import {drawPumpkin} from './pumpkin-art.mjs';
import { rigSubject } from "./rig-subjects.mjs";
import { ellipse,playerPose,playerMotion,playerAction,playerFrame,projectPoint,facingIndex } from "./player-motion.mjs";
import { actorContact } from './contact-shadow.mjs';
import {authoredShadowScenes} from './world-authoring.mjs';
import {drawRealtimeWorldShadows,runtimeSun} from './realtime-shadows.mjs';
import {emptyShadowMaps} from './realtime-shadows.mjs';
import {daylight} from './night-cycle.mjs';
import {dynamicShadowsEnabled} from './shadow-settings.mjs';
import {drawCorpse} from './corpse-pose.mjs';
import {drawEmbeddedArrow,drawFlyingArrow,arrowVisualAngle,drawArrowTrail} from './embedded-arrow.mjs';
import {drawBoomerang} from './boomerang.mjs';
import {drawForestGround,drawFallingLeaves} from './forest.mjs';
import {hasForestLandscape,drawLandscapeGround,drawForestBank} from './forest-art.mjs';
import {meleeProfile} from './melee-geometry.mjs';
import {SealVortex,sealSurfaceSize} from './seal-vortex.mjs';
import {drawWorldTravel,clearWorldTravelArt,warmWorldTravelArt} from './wildbound-travel-art.mjs';
import {houseKeepsWorld,recalledEnemy} from './house-victory.mjs';
import {drawGraveyardGround,drawGraveEmergence} from './graveyard-art.mjs';
import {controlledUnit} from './controlled-unit.mjs';
import {drawCampfire,drawCampfireLabel} from './campfire-art.mjs';
import {drawGraveyardEcology} from './graveyard-ecology.mjs';
import {drawCryptWeaponFlames} from './crypt-gear.mjs';
const hash = (x, y) => {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const sortedProceduralScenery = new Set(["palm"]);
const sceneryNeedsDepthSort = (d, library = {}) =>
  d.realm ||
  d.graveyard&&['leafless_tree','grave_forest_tree','gravestone','mausoleum','cemetery_fence','cemetery_gate','pumpkin_crop'].includes(d.kind) ||
  d.coastal&&['tree','palm','rock','beach_arch'].includes(d.kind) ||
  ['tall_grass','short_grass'].includes(d.kind) ||
  d.kind === "forest_ruin" ||
  iceSolid(d) ||
  sortedProceduralScenery.has(d.kind) ||
  library[d.kind]?.occludes ||
  library[d.kind]?.footprint?.some(Boolean);
// A tsetse is a biting fly, but its long legs, narrow abdomen, wings, and
// needle-like proboscis should read immediately as a mosquito to players.
function drawMosquito(ctx, a, time) {
  const flap = Math.sin(time * 38 + a.id * 0.7) * 2;
  const angle = Math.atan2(a.faceY || 0, a.faceX || 1);
  ctx.save();
  ctx.translate(a.x, a.y - 15);
  ctx.rotate(angle);
  ctx.lineCap = "round";

  // translucent wings
  ctx.fillStyle = "#d8eef044";
  ctx.strokeStyle = "#d8eef0aa";
  ctx.lineWidth = 1;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(1, side * 2);
    ctx.quadraticCurveTo(9, side * (10 + flap), 19, side * (7 + flap));
    ctx.quadraticCurveTo(11, side * 1, 1, side * 2);
    ctx.fill();
    ctx.stroke();
  }

  // long abdomen with a visible red-brown banding
  ctx.fillStyle = "#252832";
  ctx.beginPath();
  ctx.ellipse(-5, 0, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8e4650";
  ctx.fillRect(-10, -2, 3, 4);
  ctx.fillRect(-4, -2, 3, 4);
  ctx.fillStyle = "#c8a36a";
  ctx.fillRect(-17, -1, 5, 2);

  // head and proboscis
  ctx.fillStyle = "#11161b";
  ctx.beginPath();
  ctx.arc(8, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c8a36a";
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(24, 0);
  ctx.stroke();

  // six spindly legs
  ctx.strokeStyle = "#252832";
  ctx.lineWidth = 1.2;
  for (const side of [-1, 1]) {
    for (const x of [-5, 0, 5]) {
      ctx.beginPath();
      ctx.moveTo(x, side * 2);
      ctx.lineTo(x - 4, side * 8);
      ctx.lineTo(x - 10, side * 10);
      ctx.stroke();
    }
  }
  ctx.restore();
}
export class Renderer {
  constructor(canvas, assets) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.assets = assets;
    this.animator = new Animator(assets);
    this.canopyAlpha = new Map();
    this.camera = { x: CENTER, y: CENTER, zoom: 2.6 };
    this.age = 0;
    this.groundChunks = new Map();
    this.actorQueue = [];
    this.decor = [];
    this.showLootDetails = false;
    this.dynamicShadows = dynamicShadowsEnabled();
    this.pixelScale = 2;
    this.viewport = { w: 1, h: 1 };
    this.uiPlayArea = {x: .5, y: .5, width: 1};
  }
  setDynamicShadows(enabled){
    const next=!!enabled;if(next===this.dynamicShadows)return;
    this.dynamicShadows=next;this.decorationCache=new DecorationCache();this.worldLights=new WorldLightRenderer();
  }
  resize() {
    // Two samples per logical world pixel already preserve the half-pixel
    // character art. Extra OS-DPI supersampling adds cost without new artwork.
    const {w,h}=resizeGameSurface(this.canvas,this.ctx,this.pixelScale,{densityLimit:1});
    this.viewport = { w, h };
    return { w, h };
  }
  screenToWorld(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    const {w,h}=this.viewport;
    return {
      x:
        (((x - rect.left) / rect.width) * w) /
          this.camera.zoom +
        this.camera.x -
        w / this.camera.zoom / 2,
      y:
        (((y - rect.top) / rect.height) * h) /
          this.camera.zoom +
        this.camera.y -
        h / this.camera.zoom / 2,
    };
  }
  draw(game, dt, {sealCapture=false}={}) {
    if(game.worldTravel&&!sealCapture){drawWorldTravel(this,game,dt);return;}
    if(!sealCapture)warmWorldTravelArt(this,game);
    if(!sealCapture&&this.worldTravelArt)clearWorldTravelArt(this);
    if(game.phase==='sealing'&&!sealCapture){this.drawSeal(game,dt);return;}
    // Frozen travel/sealing frames must not scan scenery for local lights.
    this.animator.lighting=characterLightingFrame(game,null,{occluded:this.dynamicShadows});
    this.worldLights ||= new WorldLightRenderer();
    if(!sealCapture&&this.sealReady&&(this.sealReady.game!==game||this.sealReady.seed!==game.seed||game.phase!=='play')){this.sealReady.canvas.width=this.sealReady.canvas.height=1;this.sealReady=null;}
    if(!sealCapture&&this.sealGame){this.sealVortex?.clear();for(const key of ['sealAnchors','sealFrame','sealHouseBackdrop'])if(this[key]){this[key].width=this[key].height=1;this[key]=null;}this.sealGame=null;}
    this.lod=renderLOD(this.camera.zoom);
    this.decorationCache ||= new DecorationCache();
    this.actorPoseCache ||= new ActorPoseCache();
    const cacheWorld=game.seed+':'+game.generatedEnvironment;
    if(this.cacheWorld!==cacheWorld){this.decorationCache=new DecorationCache();this.actorPoseCache=new ActorPoseCache();this.worldLights=new WorldLightRenderer();this.cacheWorld=cacheWorld;}
    beginParticleFrame(this.ctx,{budget:this.lod===2?128:this.lod===1?256:384,quality:this.lod===2?.3:this.lod===1?.6:1});
    const { w, h } = this.resize(),
      ctx = this.ctx;
    this.age += dt;
    const cryptParty=sharedRoomGroups(game);
    if(cryptParty.length===1&&cryptParty[0].portal.mausoleum&&game.players.every(p=>p.room===cryptParty[0].id)){this.drawRoomWindows(ctx,game,w,h);applyCelShading(ctx);return;}
    const viewDecor=nearbyScenery(game.scenery||[],this.camera.x,this.camera.y,Math.hypot(w/this.camera.zoom/2,h/this.camera.zoom/2)+220);
    this.decor =
      (game.mapMode==='boundless'||game.bloom >= 3)
        ? viewDecor
        : viewDecor
            .filter(
              (d) =>
                game.bloom >= 3 ||
                Math.hypot(d.x - CENTER, d.y - CENTER) < game.bloom * 430,
            );
    const playArea = game.phase === 'play' ? this.uiPlayArea : {x:.5,y:.5,width:1};
    const target = expeditionCameraTarget(game, w * Math.max(.15, playArea.width), h);
    target.x -= (playArea.x - .5) * w / target.zoom;
    target.y -= (playArea.y - .5) * h / target.zoom;
    if (game.phase === "play" && game.openingBoard)
      Object.assign(this.camera, target);
    const k = 1 - Math.exp(-dt * 3);
    if(game.players.some(p=>!p.room))for (const v of ["x", "y", "zoom"])
      this.camera[v] += (target[v] - this.camera[v]) * k;
    ctx.fillStyle = "#10271f";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);
    if(game.phase==='play'&&game.openingBoard){
      // A quiet opening stage keeps the unrevealed world out of the first shot.
      ctx.fillStyle='#888a8e';ctx.fillRect(this.camera.x-w/this.camera.zoom,this.camera.y-h/this.camera.zoom,w*2/this.camera.zoom,h*2/this.camera.zoom);
      this.boardBase(ctx,game);
      const party=game.players.map(p=>({...p,depth:p.y}));party.push({board:true,depth:boardTableDepth()});
      for(const p of party.sort((a,b)=>a.depth-b.depth)){
        if(p.board){this.boardTop(ctx,game);continue;}
        this.animator.draw(ctx,p,game.time,PLAYER_RENDER_SIZE);
      }
      ctx.restore();applyCelShading(ctx);return;
    }
    this.floor(ctx, w, h, game);
    const cemeteryGround=packAssets(game).cemetery;
    if(game.generatedEnvironment==='graveyard'&&cemeteryGround?.complete&&cemeteryGround.naturalWidth)ctx.drawImage(cemeteryGround,0,0,1600,1600);
    drawBeachGulls(ctx,game,p=>this.visible(p,w,h,40));
    const bridgeBounds={sx:Math.floor((this.camera.x-w/this.camera.zoom/2-40)/32),sy:Math.floor((this.camera.y-h/this.camera.zoom/2-40)/32),ex:Math.ceil((this.camera.x+w/this.camera.zoom/2+40)/32),ey:Math.ceil((this.camera.y+h/this.camera.zoom/2+40)/32)};
    drawBridges(ctx,game,false,bridgeBounds);
    drawPuddles(ctx,game);
    drawSnowGround(ctx,game);
    for(const patch of game.arrowIcePatches||[]){
      ctx.save();ctx.globalAlpha=Math.min(.7,patch.life/2);ctx.fillStyle='#97dcf0';ctx.beginPath();
      for(let i=0;i<7;i++){const a=i*Math.PI*2/6,x=patch.x+Math.cos(a)*patch.radius,y=patch.y+Math.sin(a)*patch.radius*.55;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.fill();
      ctx.strokeStyle='#e2ffff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(patch.x-17,patch.y+5);ctx.lineTo(patch.x+9,patch.y-6);ctx.stroke();ctx.restore();
    }
    drawExpansion(ctx,game,(p,margin=64)=>this.visible(p,w,h,margin),{floorOnly:true});
    drawWorldGrid(ctx,this.camera,w,h);
    this.grassField ||= new GrassFieldRenderer();
    this.shaderGrass=this.grassField.draw(ctx,game,this.camera,w,h);
    drawForestGround(ctx,game,p=>this.visible(p,w,h,160)&&(!this.lod||Math.abs(Math.floor(p.x+p.y))%(this.lod===1?2:4)===0),{dynamicShadows:this.dynamicShadows,shaderGrass:this.shaderGrass});
    drawForestSunlight(ctx,game,{left:this.camera.x-w/(2*this.camera.zoom),right:this.camera.x+w/(2*this.camera.zoom),top:this.camera.y-h/(2*this.camera.zoom),bottom:this.camera.y+h/(2*this.camera.zoom)},daylight(game)*(game.weather?.type==='monsoon'?.35:1));
    if(this.dynamicShadows){
      const cameraLeft=this.camera.x-w/(2*this.camera.zoom),cameraTop=this.camera.y-h/(2*this.camera.zoom);
      const minX=Math.floor(cameraLeft/1600),minY=Math.floor(cameraTop/1600),maxX=Math.floor((cameraLeft+w/this.camera.zoom)/1600),maxY=Math.floor((cameraTop+h/this.camera.zoom)/1600);
      const intensity=.035+.34*daylight(game);
      const casters=[];
      for(const b of [BOARD_TABLE,game.eventTestBoard].filter(Boolean))casters.push({x:b.x+b.w/2,y:b.y+b.h/2,shadowShape:'box',shadowHeight:b.surfaceHeight,radiusX:b.w/2,radiusY:b.h/2});
      const propCasters=scenePropCasters(game);casters.push(...propCasters.casters);
      for(const chest of game.supplyChests||[])if(!chest.opened)casters.push({...chest,kind:'supply_chest',shadowShape:'box',shadowHeight:30,radiusX:20,radiusY:14});
      for(const actor of [...(game.players||[]),...(game.followers||[]),...(game.enemies||[]),...(game.questNpcs||[]),...(game.villagers||[]),...(game.ghosts||[])])if(actor&&!actor.room&&actor.hp!==0&&!actor.swimming){const kind=String(actor.kind||'actor').toLowerCase(),shape=actor.shadowShape||(kind==='golem'?'golem':/bat|crow|raven|wasp|bee|tsetse/.test(kind)?'bird':/crocodile|elephant|lion|tiger|wolf|boar|rhino|zebra|dragon/.test(kind)?'quadruped':'actor'),wide=shape==='quadruped',lift=Math.max(0,actor.jumpHeight||0)+Math.max(0,actor.groundHeight||0);casters.push({...actor,shadowDynamic:true,shadowShape:shape,shadowLift:lift,shadowHeight:Math.max(18,actor.shadowHeight||actor.height||52),radiusX:actor.radiusX|| (wide?24:shape==='bird'?12:actor.kind==='golem'?28:11),radiusY:actor.radiusY|| (wide?13:shape==='bird'?7:actor.kind==='golem'?25:16)});}
      for(const pet of hunterPets(game))if(!pet.room&&Number.isFinite(pet.x))casters.push({...pet,shadowDynamic:true,shadowHeight:Math.max(18,pet.shadowHeight||pet.roostHeight||38),radius:13});
      for(const f of game.house?.furniture||[])if(!f.destroyed)casters.push({x:f.x+f.w/2,y:f.y+f.h/2,shadowShape:'furniture',shadowHeight:f.surfaceHeight||34,radiusX:f.w*.5,radiusY:f.h*.5});
      for(const v of game.house?.vehicles||[])casters.push({x:v.x,y:v.y,shadowShape:'vehicle',shadowHeight:42,radiusX:v.w*.42,radiusY:v.h*.38});
      for(const f of [...(game.house?.walls||[]),...(game.house?.doors||[])])if(!f.destroyed&&!f.broken)casters.push({x:f.x+f.w/2,y:f.y+f.h/2,shadowShape:'wall',shadowHeight:f.height||58,radiusX:f.w*.5,radiusY:f.h*.5});
      const authored=authoredShadowScenes().filter(({level})=>level.environment===game.generatedEnvironment);
      const regions=new Map();for(const entry of authored){const key=`${entry.scene.regionX},${entry.scene.regionY}`;if(!regions.has(key))regions.set(key,[]);regions.get(key).push(entry.scene);}
      // Static forest geometry changes on harvest/streaming, not actor motion.
      // Passing its revision avoids serializing every height plane and prop on every frame.
      const staticRevision=game.generatedEnvironment==='forest'&&!game.house?[propCasters.revision,(game.supplyChests||[]).map(c=>[c.x,c.y,c.opened].join(',')).join(';'),game.eventTestBoard?.x,game.eventTestBoard?.y].join(':'):null;
      this.shadowFallbacks ||= new Map();
      for(let cy=minY;cy<=maxY;cy++)for(let cx=minX;cx<=maxX;cx++){
        const left=cx*1600,top=cy*1600,near=casters.filter(c=>c.x>=left-220&&c.x<left+1820&&c.y>=top-220&&c.y<top+1820),scenes=regions.get(`${cx},${cy}`);
        if(scenes?.length){for(const [index,scene]of scenes.entries()){const sun=runtimeSun(game,scene.shadowMaps.lightAzimuth,scene.shadowMaps.lightElevation);drawRealtimeWorldShadows(ctx,scene,left,top,{azimuth:sun.azimuth,elevation:sun.elevation,darkness:intensity,softActors:game.generatedEnvironment==='forest',budgetMs:game.generatedEnvironment==='forest'?.8:Infinity,staticRevision,casters:index===0?near:[]});}}
        else {const key=`${game.generatedEnvironment}:${cx}:${cy}`;let fallback=this.shadowFallbacks.get(key);if(!fallback){const shadowMaps=emptyShadowMaps(256,256);shadowMaps.raySteps=12;fallback={id:key,shadowMaps};this.shadowFallbacks.set(key,fallback);if(this.shadowFallbacks.size>12)this.shadowFallbacks.delete(this.shadowFallbacks.keys().next().value);}const sun=runtimeSun(game,fallback.shadowMaps.lightAzimuth,fallback.shadowMaps.lightElevation);drawRealtimeWorldShadows(ctx,fallback,left,top,{azimuth:sun.azimuth,elevation:sun.elevation,darkness:intensity,softActors:game.generatedEnvironment==='forest',budgetMs:game.generatedEnvironment==='forest'?.8:Infinity,staticRevision,casters:near});}
      }
    }
    if(this.dynamicShadows&&game.phase==='play')this.worldLights.drawGround(ctx,this.animator.lighting,(s,radius)=>this.visible(s,w,h,radius));
    drawExpansion(ctx,game,(p,margin=64)=>this.visible(p,w,h,margin),{structuresOnly:true,lightPaint:this.dynamicShadows?(c,f,paint)=>this.worldLights.drawStructure(c,f,paint,this.animator.lighting):null});
    drawTemple(ctx,game,this.animator,{lightPaint:this.dynamicShadows?(c,f,paint)=>this.worldLights.drawStructure(c,f,paint,this.animator.lighting):null});
    drawDestruction(ctx,game,p=>this.visible(p,w,h,80));
    drawNpcQuestMarkers(ctx,game,p=>this.visible(p,w,h,100));
    drawBiomeAccents(ctx,game,p=>this.visible(p,w,h,120)&&(!this.lod||Math.abs(Math.floor(p.x+p.y))%(this.lod===1?2:4)===0));
    drawTracks(ctx, game);
    drawChristmasGround(ctx,game);
    for(const v of game.house?.vehicles||[])drawVehicleEffects(ctx,v);
    drawBansheeSteps(ctx,game);drawDeathSteps(ctx,game);
    drawImpGround(ctx,game);
    drawZombieTells(ctx,game);

    drawLivingEcosystem(ctx, game, 'ground');
    drawGraveyardEcology(ctx,game,'ground');
    drawRealmEvent(ctx,game);
    drawRealmLife(ctx,game,'ground');
    drawHazards(ctx, game);
    for(const npc of game.questNpcs||[]) if(!npc.rescueExplorer&&!npc.santa&&this.visible(npc,w,h,120)){drawCampfire(ctx,npc.campX??npc.x,(npc.campY??npc.y)+10,game.time,npc.id);drawCampfireLabel(ctx,npc.campX??npc.x,(npc.campY??npc.y)+10);}
    drawWildFaunaTells(ctx,game,p=>canSee(game,p)&&this.visible(p,w,h,90));
    for (const orb of game.xpOrbs || []) {
      if (!this.visible(orb, w, h, 24) || !canSee(game, orb)) continue;
      const y = orb.y - 5 - (orb.z||0) + Math.sin(game.time * 3 + orb.id) * 1.2;
      const size=orb.amount>4?3:2;
      if(orb.attracted){ctx.strokeStyle='#80e5ef77';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(orb.x,y);ctx.lineTo(orb.x-(orb.vx||0)*.035,y-(orb.vy||0)*.035);ctx.stroke();}
      ellipse(ctx, orb.x, orb.y + 3, size+1, 1, "#071b2377");
      ellipse(ctx, orb.x, y, size+3, size+3, "#53b4ef33");
      ellipse(ctx, orb.x, y, size, size, "#647adc");
      ellipse(ctx, orb.x, y, size-1, size-1, "#83d8f0");
      ctx.fillStyle = "#e0ffff";
      ctx.fillRect(Math.round(orb.x - 1), Math.round(y - 2), 2, 2);
    }
    const selectedLoot = new Set(
      game.players
        .filter((p) => !p.room && !p.ui && p.hp > 0)
        .map((p) => game.nearbyLoot(p)),
    );
    for (const l of game.loot) {
      if (!this.visible(l, w, h, 40)) continue;
      if (!canSee(game, l)) continue;
      if(l.quicksandHidden)continue;
      const lootY=l.y+(l.quicksandSink||0);
      ctx.fillStyle = "#07100d88";
      ctx.beginPath();
      ctx.ellipse(l.x, lootY + (l.embedded?1:6), l.embedded?3:9, l.embedded?1.5:4, 0, 0, Math.PI * 2);
      ctx.fill();
      const selected = selectedLoot.has(l);
      if (selected) {
        ctx.strokeStyle = "#f0d79d";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(l.x, lootY + 6, 12, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (l.embedded && l.type === "arrow") {
        drawEmbeddedArrow(ctx,{...l,y:lootY},game.time,this.showLootDetails);
      } else {
        if (ITEMS[l.type]?.gmOnly) drawParticleEffect(ctx,'pink-sparkle',l.x,lootY-8,game.time,l.id);
        const fall=l.salvageBorn===undefined?0:Math.max(0,1-(game.time-l.salvageBorn)/.55);
        if(l.type==='jack_o_lantern')drawPumpkin(ctx,l.x,lootY-3-Math.sin(fall*Math.PI/2)*24,{carved:true,time:game.time});
        else drawItem(ctx, l.type, l.x, lootY + (l.type==='log'?6:-3) - Math.sin(fall*Math.PI/2)*24, 24);
      }
      if (ITEMS[l.type]?.slot) {
        ctx.fillStyle = ITEMS[l.type].color;
        ctx.fillRect(l.x - 8, lootY + 9, 16, 1);
      }
      if (l.qty > 1) {
        ctx.font = "bold 6px monospace";
        ctx.textAlign = "right";
        ctx.fillStyle = "#101e18";
        ctx.fillRect(l.x + 2, lootY + 5, 12, 8);
        ctx.fillStyle = "#f0e6c5";
        ctx.fillText(l.qty, l.x + 13, lootY + 11);
      }
    }
    for (const b of game.baits) {
      ctx.fillStyle = "#dc9880";
      ctx.fillRect(b.x - 4, b.y - 3, 8, 6);
    }
    for (const bolt of game.spells || []) {
      if (this.visible(bolt,w,h,80) && canSee(game,bolt)) drawMagicBolt(ctx,bolt);
    }
    for(const b of game.boomerangs||[])if(this.visible(b,w,h,80)&&canSee(game,b))drawBoomerang(ctx,b,game.time);
    for (const a of game.arrows) {
      if (!this.visible(a, w, h, 80) || !canSee(game, a)) continue;
      drawArrowTrail(ctx,a,game.time);
      if(a.stuck&&!a.rock&&!a.ice){drawEmbeddedArrow(ctx,a,game.time,this.showLootDetails);continue;}
      ctx.save();
      ctx.translate(a.x, a.y - (a.z || 0));
      ctx.rotate(a.rock||a.ice?(a.angle??Math.atan2(a.vy,a.vx)):arrowVisualAngle(a));
      if (a.rock) {
        ctx.fillStyle = "#45564e";
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#9ca89a";
        ctx.fillRect(-4, -5, 6, 3);
      } else if (a.ice) {
        ctx.fillStyle = "#8fe9ff";
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(5, 0);
        ctx.lineTo(0, 7);
        ctx.lineTo(-5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#e5fcff";
        ctx.fillRect(-1, -3, 2, 6);
      } else {
        drawFlyingArrow(ctx,a,game.time);
      }
      if (a.rock) {
        ctx.fillStyle = "#839187";
        ctx.fillRect(-7, 4, 3, 2);
        ctx.fillRect(3, -5, 2, 2);
      }
      ctx.restore();
    }
    if(game.portals?.some(d=>d.oldWell))drawOldWells(ctx,game);
    for (const d of game.portals) {
      if(d.temple||d.oldWell)continue;
      const owner = game.players.find((p) => p.id === d.owner);
      drawPortal(
        ctx,
        { ...d, color: owner?.color || d.color },
        game.time,
        d.forestTravel === 'outbound' ? 'HEARTWOOD PASSAGE' :
          d.forestTravel === 'return' ? 'RETURN TO GAME' : 'PRIVATE STORAGE',
      );
    }
    for (const d of this.decor)
      if (
        this.visible(d, w, h) &&
        !sceneryNeedsDepthSort(d, this.assets.library)
      ) {
        if(['short_grass','tall_grass','grass'].includes(d.kind)&&vegetationBlocked(game,d.x,d.rootY??d.y+d.size*.4,Math.max(6,(d.size||20)*.35)))continue;
        ctx.save();const base=iceBase(d);clipSnow(ctx,game,d.x,base.y,d.size*2);
        const paint=c=>this.decorationCache.draw(c,d,this.lod,pen=>drawProp(pen, d, ['mangrove','old_cypress'].includes(d.kind)&&this.lod<2?game.time:this.lod?0:game.time,game,{dynamicShadows:this.dynamicShadows,shaderGrass:this.shaderGrass,spriteLibrary:this.assets.library}) ||this.assets.draw(pen,d.kind,d.x,d.y,d.size));
        if(this.dynamicShadows)this.worldLights.drawProp(ctx,d,paint,this.animator.lighting);else paint(ctx);
        drawTreeWeb(ctx,d);ctx.restore();snowRim(ctx,game,d.x,base.y,d.size*.5);
      }
    for (const p of game.pickups)
      this.assets.draw(ctx, "fruit", p.x, p.y + Math.sin(this.age * 4) * 2, 26);
    for (const t of game.traps) {
      if (!this.visible(t, w, h, 90)) continue;
      if (t.variant && t.variant !== "snare") {
        ctx.strokeStyle = {
          slow: "#81c386",
          lure: "#d9b66e",
          interrupt: "#b8b2fa",
        }[t.variant];
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.variant === "slow" ? 85 : 30, 0, Math.PI * 2);
        ctx.stroke();
      }
      this.animator.draw(
        ctx,
        {
          ...t,
          kind: "trap",
          age: game.time - (t.placedAt ?? game.time - 1),
          faceX: 0,
          faceY: 1,
        },
        game.time,
        38,
      );
      ctx.strokeStyle = "#d3c87e";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.ellipse(t.x, t.y + 6, 23, 13, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const e of game.enemies)
      if ((e.state === "windup"||e.kind==='golem'&&(e.state==='rocklift'||e.controlledAttack?.phase==='windup')) && !e.night && !['anaconda','shore_goblin'].includes(e.kind)) {
        ctx.fillStyle = "#e96b5140";
        ctx.strokeStyle = "#ff9470";
        ctx.lineWidth = 1;
        if (e.kind === "golem" || e.kind === "vine") {
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.kind === "golem" ? 95 : 120, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.save();
          ctx.translate(e.x, e.y);
          ctx.rotate(Math.atan2(e.dy, e.dx));
          ctx.fillRect(0, -13, 165, 26);
          ctx.strokeRect(0, -13, 165, 26);
          ctx.restore();
        }
      }
    for (const b of game.barricades || []) {
      drawItem(ctx, "barricade", b.x, b.y - 6, 42);
    }
    if (game.ping && game.ping.until > game.time) {
      ctx.strokeStyle = game.ping.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        game.ping.x,
        game.ping.y,
        20 + Math.sin(game.time * 5) * 5,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    drawIceHints(ctx,game);
    drawFieldWorld(ctx, game);
    if(!sealCapture)this.boardBase(ctx, game);
    if(!sealCapture&&game.eventTestBoard)this.boardBase(ctx,game,game.eventTestBoard);
    const actors = this.actorQueue;
    actors.length = 0;
    if(!sealCapture)for(const v of game.house?.vehicles||[])if(this.visible(v,w,h,120))actors.push({...v,isHouseVehicle:true,drawDepth:v.y});
    for(const chest of game.supplyChests||[])actors.push({...chest,isSupplyChest:true,drawDepth:chest.y});
    for(const pet of hunterPets(game))if(!sealCapture&&!pet.controlledBy&&Number.isFinite(pet.x))actors.push({...pet,drawDepth:pet.y+(pet.roostHeight>0?1:0)});
    for (const p of game.players) if (!sealCapture) {
      if (!p.vehicleId&&!p.controlledFollowerId&&!p.room) actors.push({ ...p, isPlayer: true, drawDepth: terrainActorDepth(game,p,boardActorDepth(game,p)) });
      else if(p.controlledFollowerId&&p.controlPetPosition&&!p.controlPetPosition.room){
        const hero={...p,...p.controlPetPosition,...(p.controlMainLoadout||{}),controlledFollowerId:null,controlledByFollower:true,moving:!!p.controlPetPosition.moving,walking:!!p.controlPetPosition.walking,animationAction:null,poseTime:null,playerFrame:undefined,attack:0,charge:0,jumpHeight:0,groundHeight:0,dodge:0,dashTime:0,blocking:false,bowAiming:false};
        actors.push({...hero,isPlayer:true,hidePlayerMarker:true,drawDepth:terrainActorDepth(game,hero,boardActorDepth(game,hero))});
      }
    }
    const controlledPresentation=actor=>{const owner=game.players.find(p=>controlledUnit(game,p)===actor);return owner?{...actor,isPlayer:true,controlledBy:owner.id,name:owner.name,color:owner.color}:actor;};
    for(const ghost of game.ghosts||[])if(!sealCapture&&!ghost.room){const shown=controlledPresentation(ghost);actors.push({...shown,isGhostActor:true,drawDepth:terrainActorDepth(game,shown,boardActorDepth(game,shown))});}
    const queued=new Set(actors.map(a=>a.id).filter(Boolean));
    for(const follower of game.followers||[])if(!sealCapture&&!follower.room&&!queued.has(follower.id)&&this.visible(follower,w,h,180)){const shown=controlledPresentation(follower);actors.push({...shown,drawDepth:terrainActorDepth(game,shown,boardActorDepth(game,shown))});}
    for (const e of game.enemies){
      // Long bodies need individual depth entries: roots and jumping heroes
      // can pass between coils, even when the snake's head is off-camera.
      if(e.kind==='anaconda'){
        for(const part of anacondaRenderParts(e))if(canSee(game,part)&&this.visible(part,w,h,60))actors.push(part);
      }else if (canSee(game, e) && this.visible(e, w, h, 180)) {
        const actor = e;
        const shown=controlledPresentation(actor);
        actors.push({
          ...shown,
          drawDepth: terrainActorDepth(game,actor,boardActorDepth(game,actor,actor.y + (rigSubject(e.kind)||WILD_FAUNA_KINDS.includes(e.kind) ? 0 : 14))),
        });
      }
    }
    for (const d of this.decor)
      if (
        this.visible(d, w, h) &&
        sceneryNeedsDepthSort(d, this.assets.library)
      )
        actors.push({
          ...d,
          sourceProp: d,
          isScenery: true,
          drawDepth: vehicleSceneryDepth(game,d,iceSolid(d)?iceBase(d).y:propDepth(d, this.assets.library[d.kind])),
        });
    // Floor-level actors behind the table are occluded. Supported/airborne
    // actors over its footprint are drawn above it, including the back half.
    if(!sealCapture)actors.push({ isBoard: true, drawDepth: boardTableDepth() });
    if(!sealCapture&&game.eventTestBoard)actors.push({isEventTestBoard:true,drawDepth:boardTableDepth(game.eventTestBoard)});
    if(!sealCapture&&game.victoryChest)actors.push({isVictoryChest:true,drawDepth:927});
    if(game.merchant)actors.push({isMerchant:true,drawDepth:game.merchant.y+12});
    if(!sealCapture)for(const npc of game.questNpcs||[])if(this.visible(npc,w,h,90))actors.push({...npc,isQuestNpc:true,drawDepth:npc.y});
    if(!sealCapture&&game.villageCampState?.fire){const fire=game.villageCampState.fire;actors.push({isVillagerCampfire:true,x:fire.x,y:fire.y,drawDepth:fire.y});}
    if(!sealCapture)for(const v of visibleVillagers(game))if(this.visible(v,w,h,90)){const shown=controlledPresentation(v);actors.push({...shown,isVillager:true,drawDepth:v.y});}
    actors.sort((a, b) => a.drawDepth - b.drawDepth);
    for (const a of actors) {
      if(a.isHouseVehicle){drawHouseCar(ctx,a,game);continue;}
      if(a.isAnacondaSegment){ctx.save();ctx.globalAlpha*=enemySightOpacity(game,a,rules.visionRadius)*Math.min(enemyVisibility(game,a.anacondaActor),nightEnemyOpacity(game,a.anacondaActor));
        const draw=()=>{drawAnacondaShadow(ctx,a.anacondaActor,a.anacondaIndex);drawAnacondaSegment(ctx,a.anacondaActor,a.anacondaIndex,game.time);};
        if(waterAt(game,a.x,a.y)==='water')drawWaterline(ctx,a,game.time,draw,{radius:13});else draw();
        if(a.anacondaIndex===0&&a.anacondaActor.faction==='ally')drawFriendshipHearts(ctx,a.anacondaActor,game.time,70);ctx.restore();continue;}
      if(a.isVictoryChest){drawVictoryChest(ctx,game);continue;}
      if(a.isMerchant){drawMerchant(ctx,game,this.animator);continue;}
      if(a.isVillagerCampfire){drawVillagerCampfire(ctx,game,game.villageCampState.fire);continue;}
      if(a.isVillager){drawVillagerNpc(ctx,game,a,this.animator);if(a.isPlayer){ctx.save();ctx.strokeStyle=a.color;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(a.x,a.y+10,18,6,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle=a.color;ctx.font='7px sans-serif';ctx.textAlign='center';if(game.players.length>1)ctx.fillText(a.name.toUpperCase(),a.x,a.y-48);ctx.restore();}continue;}
      if(a.isQuestNpc){drawQuestNpc(ctx,game,a,this.animator);continue;}
      if(a.isSupplyChest){drawSupplyChest(ctx,game,a);continue;}
      if(a.isEventTestBoard){this.eventTestBoard(ctx,game);continue;}
      if (a.isBoard) {
        this.boardTop(ctx, game);
        continue;
      }
      if (a.isScenery) {
        if(['short_grass','tall_grass','grass'].includes(a.kind)&&vegetationBlocked(game,a.x,a.rootY??a.y+a.size*.4,Math.max(6,(a.size||20)*.35)))continue;
        const obscures = !a.fallen && game.players.some((p) =>
            isOccluded(a, this.assets.library[a.kind], p),
          ),
          target = obscures ? 0.28 : 1,
          alphaKey = a.id ?? `${a.kind}:${Math.round(a.x)}:${Math.round(a.y)}`,
          old = this.canopyAlpha.get(alphaKey) ?? 1,
          alpha = old + (target - old) * (1 - Math.exp(-dt * 9));
        this.canopyAlpha.set(alphaKey, alpha);
        ctx.save();
        ctx.globalAlpha = alpha;const base=iceBase(a);clipSnow(ctx,game,a.x,base.y,a.size*2);
        const paint=c=>this.decorationCache.draw(c,a,this.lod,pen=>drawProp(pen,a.sourceProp||a,['mangrove','old_cypress'].includes(a.kind)&&this.lod<2?game.time:this.lod?0:game.time,game,{dynamicShadows:this.dynamicShadows,shaderGrass:this.shaderGrass,spriteLibrary:this.assets.library}) ||this.assets.draw(pen,a.kind,a.x,a.y,a.size));
        if(this.dynamicShadows)this.worldLights.drawProp(ctx,a,paint,this.animator.lighting);else paint(ctx);
        drawTreeWeb(ctx,a);
        ctx.restore();snowRim(ctx,game,a.x,base.y,a.size*.5);
        continue;
      }
      if(a.hunterPet===true&&!a.controlledBy){const owner=game.players.find(p=>p.id===a.owner);if(owner){ctx.save();if(a.spiritGhost){ctx.globalAlpha=.78;ctx.filter='sepia(.6) hue-rotate(155deg) saturate(1.7)';}if(a.ritualPet)this.animator.draw(ctx,a,game.time,43);else drawHunterPet(ctx,a,owner,game.time,a.kind==='bat'?34:43);ctx.restore();}continue;}
      const player = a.isPlayer,
        size = actorRenderSize(a);
      ctx.save();
      ctx.globalAlpha *= player || a.isGhostActor ? (a.isGhostActor ? .78 : 1) : enemySightOpacity(game,a,rules.visionRadius)*Math.min(enemyVisibility(game, a), nightEnemyOpacity(game, a));
      if(a.isGhostActor)ctx.filter='sepia(.6) hue-rotate(155deg) saturate(1.7)';
      const contact=actorContact(game,a,size,player||!!rigSubject(a.kind)||WILD_FAUNA_KINDS.includes(a.kind));
      const floating=waterAt(game,a.x,a.y)==='water'&&!(a.jumpHeight>0)&&!(a.groundHeight>0);
      const snowShadow=snowShadowFactor(game,a.x,a.y);
      if(!this.dynamicShadows){
        ctx.fillStyle = `rgba(9,28,22,${a.swimming||floating?0:contact.alpha*snowShadow*(1-Math.min(1,(a.sink||0)/48))})`;
        ctx.beginPath();ctx.ellipse(contact.x,contact.y,contact.rx,contact.ry,0,0,Math.PI*2);ctx.fill();
      }
      if(this.dynamicShadows&&player&&!floating&&!a.swimming&&!(a.jumpHeight>1)){
        if(playerMotion.locomotionRevision>=1){
          this.animator.locomotionHistory??=new LocomotionHistory();
          const presentation=this.animator.locomotionHistory.sample(a,game.time,playerAction(a),playerFrame(a,game.time));
          const pose=playerPose({...a,...presentation},game.time),d=presentation.locomotionVisualDirection??facingIndex(a.faceX,a.faceY),scale=size/48;
          for(const side of ['L','R'])if(pose['foot'+side][2]<2){
            const p=projectPoint(pose['foot'+side],d);
            ellipse(ctx,a.x+p.x*scale,a.y-(a.groundHeight||0)+p.y*scale+2,3.6,1.25,'#142b2866');
          }
        }else {ctx.fillStyle='#142b2845';ctx.fillRect(contact.x-contact.rx*.65,contact.y,contact.rx*1.3,1.5);}
      }
      if (player) {
        if (a.poison > 0) {
          ctx.fillStyle = "#a0e565";
          ctx.font = "6px monospace";
          ctx.textAlign = "center";
          ctx.fillText("POISON " + a.poison.toFixed(1) + "s", a.x, a.y + 48);
        }
        if (a.hp <= 0) {
          drawParticleEffect(ctx,'knockout',a.x,a.y-14,game.time,a.id);
        }
        if (a.stun > 0) {
          ctx.fillStyle = "#ffe38e";
          for (let n = 0; n < 3; n++) {
            const angle = game.time * 7 + (n * Math.PI * 2) / 3;
            ctx.fillRect(
              a.x + Math.cos(angle) * 10 - 1,
              a.y - 35 + Math.sin(angle) * 4,
              3,
              3,
            );
          }
          ctx.font = "6px monospace";
          ctx.textAlign = "center";
          ctx.fillText("STUN " + a.stun.toFixed(1) + "s", a.x, a.y + 39);
          ctx.fillRect(
            a.x - 12,
            a.y + 42,
            (24 * a.stun) / (a.stunMax || 1.5),
            2,
          );
        }
        if (a.sealHold > 0) {
          ctx.fillStyle = "#d0b1f7";
          ctx.fillRect(
            a.x - 20,
            a.y - 45,
            (40 * a.sealHold) / rules.sealHold,
            4,
          );
          ctx.font = "7px monospace";
          ctx.textAlign = "center";
          ctx.fillText("WILDBOUND…", a.x, a.y - 51);
        }
        if (a.charge > 0) {
          const aimTime=ITEMS[a.equipment?.hand1]?.shot?.aimTime || 1.2;
          ctx.fillStyle = a.charge>=aimTime ? '#a6e3b1' : "#e9c677";
          ctx.fillRect(a.x - 12, a.y - 39, 24 * Math.min(1, a.charge / aimTime), 2);
        }
        if(a.rifleReload>0) {
          ctx.fillStyle='#afbbcf';ctx.fillRect(a.x-12,a.y-43,24*Math.max(0,1-a.rifleReload/(ITEMS.rifle.shot.cooldown)),2);
        }
        if (a.spin > 0) {
          ctx.save();
          ctx.globalAlpha = Math.min(0.8, a.spin * 2.4);
          ctx.strokeStyle = "#ffe08a";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(a.x, a.y - 8, 66 + (0.38 - a.spin) * 65, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        if(!a.hidePlayerMarker){
        ctx.strokeStyle = a.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(contact.x, contact.y-(a.controlledBy?4:0), 18, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        }
        if (!a.hidePlayerMarker&&(a.id === game.current?.id || a.controlledBy === game.current?.id)) {
          ctx.fillStyle = a.color;
          ctx.beginPath();
          const lift=a.swimming?-20:(a.groundHeight||0)+(a.jumpHeight||0);
          ctx.moveTo(a.x - 4, a.y - lift - 34);
          ctx.lineTo(a.x + 4, a.y - lift - 34);
          ctx.lineTo(a.x, a.y - lift - 29);
          ctx.fill();
        }
      }
      ctx.save();
      const grounded=!['bat','wasp','bee','dragon','pelican'].includes(a.kind),snowBase=a.y+(player||rigSubject(a.kind)?1:14);
      if(grounded)clipSnow(ctx,game,a.x,snowBase,200,a.kind==='dreadmane_lion'?560:300);
      if (a.invuln > 0 && Math.floor(this.age * 15) % 2) ctx.globalAlpha *= 0.5;
      if(player&&a.dashGhosts?.length){
        for(const ghost of a.dashGhosts){
          const alpha=Math.max(0,1-ghost.age/.16)*.24;
          if(alpha<=0)continue;
          ctx.save();ctx.globalAlpha*=alpha;ctx.filter='blur(1.2px) saturate(1.15)';
          this.animator.draw(ctx,{...a,...ghost},Math.max(0,game.time-ghost.age),size);
          ctx.restore();
        }
      }
      if (!player && a.kind === 'necromancer' && a.hp>0) {
        drawParticleEffect(ctx,'purple-aura',a.x,a.y-22,game.time,a.id);
      }
      if (!player && a.summonFootprint) drawParticleEffect(ctx,'purple-eyes',a.x,a.y-32,game.time,a.id+31);
      const dead = !player && a.hp <= 0;
      if (dead) {
        const draw=()=>drawCorpse(ctx,a,rigSubject(a.sprite||a.kind)?.data,contact,size,
          (actor,time,scale)=>this.animator.draw(ctx,actor,time,scale));
        if(floating)drawWaterline(ctx,a,game.time,draw,{radius:18});else draw();
      } else if (player&&a.hp<=0&&floating) {
        drawWaterline(ctx,a,game.time,actor=>this.animator.draw(ctx,{...actor,animationAction:'death',deathTime:1},game.time,size),{shift:-1,radius:19});
      } else if (player&&a.swimming) {
        drawSwimmer(ctx,a,game.time,actor=>this.animator.draw(ctx,actor,game.time,size));
      } else if (!player&&a.kind==='snake'&&floating) {
        drawWaterline(ctx,a,game.time,actor=>this.animator.draw(ctx,actor,game.time,size),{shift:-10,radius:15});
      } else if (!player&&(a.kind==='oathless_captain'||a.villagerId==='april')&&a.swimming&&floating) {
        drawWaterline(ctx,a,game.time,actor=>this.animator.draw(ctx,actor,game.time,size),{shift:-12,radius:18});
      } else if (player&&a.sink>0) {
        drawSinking(ctx,a,actor=>this.animator.draw(ctx,actor,game.time,size));
      } else if (player&&waterAt(game,a.x,a.y)==='mud'&&!(a.jumpHeight>0)&&!(a.groundHeight>0)) {
        ctx.beginPath();ctx.rect(a.x-100,a.y-180,200,181);ctx.clip();
        this.animator.draw(ctx,{...a,y:a.y+3},game.time,size);
      } else if(drawGraveEmergence(ctx,a,game.time,size)) {
        // Authored crawl-up pose is clipped to the attached grave's soil plane.
      } else if (a.kind === "tsetse") {
        this.animator.draw(ctx,a,game.time,size);
      } else {
        this.actorPoseCache.draw(ctx,a.sink?{...a,y:a.y+a.sink}:a,this.lod,game.time,size,
          (c,actor,time)=>this.animator.draw(c,actor,time,size));
        drawChristmasSpirit(ctx,a,game.time);
      }
      ctx.restore();
      if(a.kind==='golem'&&(a.rockGrabCharge||0)>.28){
        const x=a.x+(a.faceX||0)*11,y=a.y+(a.faceY||0)*11-34-(a.rockGrabCharge||0)*10;
        ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.fillStyle='#18282477';ctx.beginPath();ctx.ellipse(0,28,12,4,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#263b3a';ctx.beginPath();ctx.moveTo(-8,1);ctx.lineTo(-6,-6);ctx.lineTo(-2,-11);ctx.lineTo(6,-8);ctx.lineTo(10,-1);ctx.lineTo(7,6);ctx.lineTo(0,9);ctx.lineTo(-7,6);ctx.closePath();ctx.fill();
        ctx.fillStyle='#758b80';ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(-4,-5);ctx.lineTo(-1,-8);ctx.lineTo(4,-6);ctx.lineTo(7,-1);ctx.lineTo(4,4);ctx.lineTo(-3,5);ctx.closePath();ctx.fill();
        ctx.fillStyle='#c1c6a8';ctx.fillRect(-3,-6,4,2);ctx.fillRect(2,-2,3,2);ctx.fillStyle='#455e55';ctx.fillRect(-5,3,4,2);ctx.restore();
      }
      drawFrostPrison(ctx,a,game.time);
      if(player&&a.scaredTime>0)drawFearFace(ctx,a.x,a.y-(a.jumpHeight||a.groundHeight||0)-43);
      if(player&&a.pounceAim)drawPounceAim(ctx,a);
      else if(player)drawBowAim(ctx,a,1,game.time);
      if(player)drawCryptWeaponFlames(ctx,a,game.time);
      if (!player && a.hp>0 && (a.frostMage || (a.kind === "skeleton" && a.frostBound))) {
        ctx.fillStyle = "#8cecff";
        ctx.fillRect(a.x - 5, a.y - 29, 3, 2);
        ctx.fillRect(a.x + 2, a.y - 29, 3, 2);
      }
      if (player && a.sleeping > 0) {
        ctx.save();
        ctx.fillStyle = "#bdefff";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        const bob = Math.sin(game.time * 3) * 2;
        ctx.fillText("Z", a.x + 16, a.y - 32 + bob);
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("z", a.x + 25, a.y - 43 + bob);
        ctx.restore();
      }
      if(grounded)snowRim(ctx,game,a.x,snowBase,size*.5);
      if (!player && a.state === "breath") {
        ctx.save();
        ctx.globalAlpha = 0.27 + Math.sin(game.time * 18) * 0.08;
        ctx.fillStyle = "#ff7438";
        ctx.beginPath();
        const angle = Math.atan2(a.faceY, a.faceX);
        ctx.moveTo(a.x, a.y);
        ctx.arc(a.x, a.y, 150, angle - 0.52, angle + 0.52);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      if (!player && a.boulderReady) {
        ctx.fillStyle = "#55655b";
        ctx.beginPath();
        ctx.arc(a.x, a.y - 28, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#a3ab99";
        ctx.fillRect(a.x - 4, a.y - 34, 5, 3);
      }
      if (!player && a.summonPulse > 0) drawParticleEffect(ctx,'purple-aura',a.x,a.y-18,game.time,a.id+43);
      if (!player && a.state === "rocklift") {
        ctx.fillStyle = "#5d655b88";
        ctx.beginPath();
        ctx.ellipse(a.x, a.y + 10, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#87958a";
        const lift = (game.time * 12) % 7;
        ctx.fillRect(a.x - 6, a.y + 7 - lift, 5, 4);
        ctx.fillRect(a.x + 4, a.y + 9 - lift * 0.7, 4, 3);
      }
      if (!player && a.healEffect > 0) {
        ctx.strokeStyle = "#ffe17c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(a.x, a.y - 13, 18 * (1 - a.healEffect / 0.8), 0, Math.PI * 2);
        ctx.stroke();
      }
      if (
        player &&
        a.attack > 0.1 && !swordLoadout(a) &&
        !ITEMS[a.equipment?.hand1]?.magic && !ITEMS[a.equipment?.hand2]?.magic &&
        ITEMS[a.equipment?.hand1]?.base !== "bow" &&
        !ITEMS[a.equipment?.hand1]?.ranged && !ITEMS[a.equipment?.hand1]?.utility
      ) {
        const angle = Math.atan2(a.faceY, a.faceX),progress=1-a.attack/(a.attackDuration||.34),big=a.attackClip==='swipe_big',melee=meleeProfile(a);
        const radius=a.meleeSweep?96:melee.range,half=a.meleeSweep?Math.PI:melee.arc*Math.PI/360;
        const direction=a.attackClip==='swipe_two'?-1:1,center=angle+direction*(progress-.5)*half;
        // The cone marks the ground-space hit area, including uppercuts and jumps.
        const y=a.y;
        ctx.save();ctx.translate(a.x,y);ctx.rotate(angle);
        ctx.strokeStyle=big?'#ffcd70':'#ffe5a3';ctx.lineWidth=big?5:3;ctx.globalAlpha=.28;
        ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,radius,-half,half);ctx.closePath();ctx.stroke();
        ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(0,0,radius,center-angle-half*.2,center-angle+half*.2);ctx.stroke();ctx.restore();
        if(melee.whip){ctx.strokeStyle='#ff8fc8';ctx.lineWidth=2;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(a.x,y,radius*.82,center-half*.72,center+half*.72);ctx.stroke();ctx.globalAlpha=1;}
        if (ITEMS[a.equipment?.hand1]?.truthSword || ITEMS[a.equipment?.hand2]?.truthSword) { ctx.strokeStyle='#ff8fc8';ctx.lineWidth=3;ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(a.x,a.y,radius+10,center-half,center+half);ctx.stroke();ctx.globalAlpha=1; }

      }
      if (a.state === "snared") {
        const age = Math.max(0, rules.captureTime - a.timer);
        this.animator.draw(
          ctx,
          {
            kind: "trap",
            x: a.x,
            y: a.y,
            faceX: 0,
            faceY: 1,
            animationAction: age < 0.5 ? "snap" : "hold",
            playerFrame: Math.min(7, (age / 0.5) * 7),
          },
          game.time,
          48,
        );
      }
      if(!player)drawFriendshipHearts(ctx,a,game.time);
      if(!player)drawJumanjiVines(ctx,a,game.time);
      if(!player&&a.kind==='alan'&&a.hp>0&&!a.dialogueResolved){
        ctx.save();ctx.textAlign='center';ctx.font='bold 10px sans-serif';ctx.fillStyle='#c9e4a4';
        ctx.fillText('ALAN',a.x,a.y-58-(a.jumpHeight||0));
        ctx.font='9px sans-serif';ctx.fillStyle='#f0deb0';ctx.fillText('Interact · Talk',a.x,a.y+20);
        ctx.restore();
      }
      if (!player && a.hp > 0 && a.hp < a.maxHp) {
        const healthY = a.y - (a.kind === 'imp'?40+(a.impFlightHeight??20):a.kind === 'succubus'?49+(a.succubusFlightHeight||0):a.kind === 'panther' ? 53 + (a.groundHeight||0) : a.kind === "lion" ? 49 : 31);
        ctx.fillStyle = "#182f21";
        ctx.fillRect(a.x - 15, healthY, 30, 3);
        ctx.fillStyle = "#df9a70";
        ctx.fillRect(a.x - 15, healthY, (30 * a.hp) / a.maxHp, 3);
      }
      if (!player && a.kind === 'panther' && a.hp > 0 && (a.pantherEnergy??100) < (a.pantherEnergyMax||100)-1) {
        const energyY=a.y-48-(a.groundHeight||0),energy=Math.max(0,Math.min(a.pantherEnergyMax||100,a.pantherEnergy));
        ctx.fillStyle='#14242b';ctx.fillRect(a.x-15,energyY,30,3);
        ctx.fillStyle=energy>=(a.pantherEnergyMax||100)*.48?'#d8c471':'#8bafad';ctx.fillRect(a.x-15,energyY,30*energy/(a.pantherEnergyMax||100),3);
      }
      if (player) {
        drawBreath(ctx,a);
        ctx.textAlign = "center";
        ctx.font = "5px monospace";
        ctx.fillStyle = a.color;
        ctx.font='7px sans-serif';
        if(!a.hidePlayerMarker&&(game.players.length>1||a.hp<=0))ctx.fillText(
          a.hp <= 0 ? "HOLD INTERACT TO REVIVE" : a.name.toUpperCase(),
          a.x,
          a.hp<=0?a.y+24:a.y-48-(a.jumpHeight||0),
        );
        if (a.hp <= 0) {
          ctx.fillStyle = "#d1e2a4";
          ctx.fillRect(a.x - 15, a.y - 30, (30 * a.revive) / 1.6, 3);
        }
      }
      ctx.restore();
    }
    drawSuccubusEffects(ctx,game);
    if(this.shaderGrass)this.grassField.draw(ctx,game,this.camera,w,h,true);
    drawImpBombs(ctx,game);
    // Draw burn sparks after actors so the fire visibly clings to the target.
    drawBridges(ctx,game,true,bridgeBounds);
    drawLivingEcosystem(ctx, game, 'air');
    drawGraveyardEcology(ctx,game,'air');
    drawRealmLife(ctx,game,'air');
    drawRealmAtmosphere(ctx,game);
    if(!sealCapture){
      const visibleGame=Object.create(game);visibleGame.enemies=game.enemies.filter(e=>!e.room&&canSee(game,e)&&this.visible(e,w,h,120));
      drawShoreGoblinTells(ctx,visibleGame);drawDreadmaneTells(ctx,visibleGame);drawCaptainTells(ctx,visibleGame);drawReaperDrain(ctx,visibleGame);drawBansheeSkills(ctx,visibleGame);
      for(const e of visibleGame.enemies)if(e.hp>0&&e.spawnReadyAt>game.time){ctx.save();ctx.strokeStyle='#fff3ae';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.ellipse(e.x,e.y,24,10,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
    }
    drawNightEnemyEffects(ctx, game);
    drawNightEquipment(ctx, game);
    for (const f of game.fireParticles || []) {
      ctx.fillStyle = f.smoke ? "#aaa99dbb" : "#ffb63a";
      ctx.fillRect(
        Math.round(f.x),
        Math.round(f.y - (1 - f.life) * 12),
        f.smoke ? 4 : 3,
        f.smoke ? 4 : 5,
      );
    }
    for (const fx of game.effects) {
      if(fx.room)continue;
      ctx.globalAlpha = Math.min(1, fx.life * 2);
      ctx.fillStyle = fx.color;
      ctx.strokeStyle = fx.color;
      if(fx.dragonBreath){drawDragonBreath(ctx,fx);
      }else if(fx.swordImpact){paintSwordImpact(ctx,fx);
      }else if(fx.magicBolt){drawMagicBurst(ctx,fx);
      }else if(fx.particle){drawParticleEffect(ctx,fx.particle,fx.x,fx.y,Math.max(0,fx.duration-fx.life),Number(fx.seed)||0);
      } else if (fx.text) {
        ctx.textAlign = "center";
        ctx.font = "bold 7px monospace";
        ctx.fillText(fx.text, fx.x, fx.y - (1 - fx.life) * 17);
      } else {
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius * (1 - fx.life), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    drawRain(ctx, game, this.camera, w, h);
    drawWetDrips(ctx,game);
    drawFallingLeaves(ctx,game,p=>this.visible(p,w,h,160));
    drawBiomeAir(ctx,game,p=>this.visible(p,w,h,30),{left:Math.max(0,this.camera.x-w/this.camera.zoom/2),top:Math.max(0,this.camera.y-h/this.camera.zoom/2),right:Math.min(WORLD,this.camera.x+w/this.camera.zoom/2),bottom:Math.min(WORLD,this.camera.y+h/this.camera.zoom/2)},this.lod);
    drawMysteryWorld(ctx,game);
    drawHouseLights(ctx,game);
    ctx.restore();
    if(!sealCapture)this.rememberSealScene(game,w,h);
    if(!sealCapture){
      // On restoring directly into a room there may be no last surface frame.
      // Preserve the entrance view for presentation only; never reveal tiles or
      // move/simulate a fake player in the actual world.
      const fogGame=Object.create(game);
      fogGame.players=game.players.every(p=>p.room)?game.players.map(p=>({...p,room:null})):game.players;
      drawFog(ctx, fogGame, this.camera, w, h);
    }
    drawNightLight(ctx, game, this.camera, w, h,null,{occluded:this.dynamicShadows});
    drawMarshFireflyGlows(ctx,game,this.camera,w,h);
    if(sealCapture)return;
    drawWeather(ctx, game, w, h);
    drawNightStatus(ctx, game, w, h);
    this.houseRoomTitle(ctx,game,w,h);
    drawMysteryTracker(ctx,game,w);
    this.lootPrompts(game, w, h);
    const bx = w / 2 + (CENTER - this.camera.x) * this.camera.zoom,
      by = h / 2 + (CENTER - this.camera.y) * this.camera.zoom;
    if (bx < 0 || bx > w || by < 0 || by > h) {
      const dx = bx - w / 2,
        dy = by - h / 2,
        s = Math.min(
          (w / 2 - 28) / Math.max(1, Math.abs(dx)),
          (h / 2 - 65) / Math.max(1, Math.abs(dy)),
        );
      const x = w / 2 + dx * s,
        y = h / 2 + dy * s;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(dy, dx));
      ctx.fillStyle = "#ffe2a0";
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-6, -6);
      ctx.lineTo(-6, 6);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#ffe2a0";
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      ctx.fillText("BOARD", x, y + 15);
    }
    const gradient = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.25,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.65,
    );
    gradient.addColorStop(0, "#071c1300");
    gradient.addColorStop(1, "#061a17bb");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    for (const p of game.players.filter((p) => p.hp <= 0 && !p.room)) {
      const dx = (p.x - this.camera.x) * this.camera.zoom,
        dy = (p.y - this.camera.y) * this.camera.zoom;
      const scale = Math.min(
        1,
        (w / 2 - 25) / Math.max(1, Math.abs(dx)),
        (h / 2 - 60) / Math.max(1, Math.abs(dy)),
      );
      const x = w / 2 + dx * scale,
        y = h / 2 + dy * scale;
      ctx.save();
      ctx.translate(x, y - (scale === 1 ? 22 : 0));
      ctx.rotate(scale === 1 ? Math.PI / 2 : Math.atan2(dy, dx));
      ctx.fillStyle = "#ffe4a5";
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-5, -4);
      ctx.lineTo(-5, 4);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#ffe4a5";
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      ctx.fillText(p.name + " · REVIVE", x, y + 14);
    }
    this.minimap(ctx, game, w, h);
    this.drawRoomWindows(ctx,game,w,h);
    applyCelShading(ctx);
  }
  drawRoomWindows(ctx,game,w,h){
    const groups=sharedRoomGroups(game),full=groups.length===1&&groups[0].portal.mausoleum&&game.players.every(p=>p.room===groups[0].id);
    const windows=roomWindowLayout(groups,w,h,{full});this.roomWindows=windows;
    for(const box of windows){
      const {portal,players,x,y,width,height}=box,p=players[0],header=18,footer=15,innerW=Math.max(1,width-8),innerH=Math.max(1,height-header-footer-8);
      ctx.save();ctx.fillStyle='#061510b8';ctx.fillRect(x+4,y+5,width,height);ctx.fillStyle='#142b25';ctx.fillRect(x,y,width,height);
      ctx.strokeStyle='#b8a16c';ctx.lineWidth=1;ctx.strokeRect(x,y,width,height);ctx.textAlign='left';ctx.font='bold 8px sans-serif';ctx.fillStyle='#f0dfad';
      ctx.fillText(portal.temple?'TEMPLE · UPPER SANCTUM':portal.mausoleum?'MAUSOLEUM · LOWER CRYPT':'LOWER TUNNELS',x+7,y+12,width-14);
      ctx.save();ctx.beginPath();ctx.rect(x+4,y+header,innerW,innerH);ctx.clip();ctx.translate(x+4,y+header);
      const previous=this.animator.lighting;this.animator.lighting=characterLightingFrame(game,box.id);
      try{
        if(portal.oldWell){const camera=sharedRoomCamera(players,innerW,innerH-24,this.camera.zoom||2.6);drawRoomScene(ctx,game,p,portal,this,{width:innerW,height:innerH,top:12,bottom:12,...camera});}
        else{const scale=Math.min(innerW/320,innerH/240);ctx.translate((innerW-320*scale)/2,(innerH-240*scale)/2);ctx.scale(scale,scale);drawRoomScene(ctx,game,p,portal,this);}
      }finally{this.animator.lighting=previous;}
      ctx.restore();ctx.fillStyle='#d0c59e';ctx.font='7px sans-serif';ctx.fillText(players.map(q=>q.name||'Player').join(' · ')+'  |  Return at the stairs / exit',x+7,y+height-5,width-14);ctx.restore();
    }
  }
  rememberSealScene(game,w,h){
    if(houseKeepsWorld(game))return;
    if(game.phase!=='play'||!game.players.some(p=>p.sealHold>0))return;
    const size=sealSurfaceSize(w,h);
    if(this.sealReady?.game!==game){if(this.sealReady){this.sealReady.canvas.width=this.sealReady.canvas.height=1;}this.sealReady={game,canvas:document.createElement('canvas')};}
    const saved=this.sealReady,c=saved.canvas;
    if(c.width!==size.width||c.height!==size.height){c.width=size.width;c.height=size.height;}
    const pen=c.getContext('2d');pen.resetTransform();pen.globalCompositeOperation='copy';pen.drawImage(this.canvas,0,0,c.width,c.height);pen.globalCompositeOperation='source-over';
    const sx=c.width/w,sy=c.height/h;
    // Replace the protected silhouettes with cached floor art, not empty square
    // holes. The real party/table are re-layered above the warp; no clones leave.
    const cut=(x,y,width,height)=>{
      pen.save();pen.beginPath();pen.ellipse((w/2+(x+width/2-this.camera.x)*this.camera.zoom)*sx,(h/2+(y+height/2-this.camera.y)*this.camera.zoom)*sy,width*.7*this.camera.zoom*sx,height*.7*this.camera.zoom*sy,0,0,Math.PI*2);pen.clip();
      pen.setTransform(sx*this.camera.zoom,0,0,sy*this.camera.zoom,(w/2-this.camera.x*this.camera.zoom)*sx,(h/2-this.camera.y*this.camera.zoom)*sy);
      const bounds={sx:Math.max(0,Math.floor((x-width*.2)/TILE)),sy:Math.max(0,Math.floor((y-height*.2)/TILE)),ex:Math.min(WORLD/TILE,Math.ceil((x+width*1.2)/TILE)),ey:Math.min(WORLD/TILE,Math.ceil((y+height*1.2)/TILE))};
      if(hasForestLandscape(game))drawLandscapeGround(pen,game,bounds);
      for(let ty=bounds.sy;ty<bounds.ey;ty++)for(let tx=bounds.sx;tx<bounds.ex;tx++){
        const kind=waterAt(game,tx*TILE+16,ty*TILE+16);
        if(['water','shallow','bridge','floodbridge'].includes(kind)){drawWaterSurface(pen,game,tx*TILE,ty*TILE,TILE,TILE);continue;}
        if(hasForestLandscape(game)&&kind==='grass')continue;
        pen.fillStyle=['ice','snow'].includes(kind)?'#b8cad1':kind==='wood'?'#997450':kind==='temple_stone'?'#7c8766':kind==='path'?'#c1b49a':game.generatedEnvironment==='desert'?'#beaa70':'#66804b';pen.fillRect(tx*TILE,ty*TILE,TILE,TILE);
      }
      pen.restore();
    };
    cut(BOARD_TABLE.x-5,BOARD_TABLE.y-BOARD_TABLE.surfaceHeight-3,BOARD_TABLE.w+10,BOARD_TABLE.h+BOARD_TABLE.surfaceHeight+32);
    for(const a of [...game.players.filter(p=>!p.room),...(game.ghosts||[]).filter(p=>!p.room),...hunterPets(game)])cut(a.x-36,a.y-65-(a.jumpHeight||0)-(a.groundHeight||0),72,104+(a.jumpHeight||0)+(a.groundHeight||0));
    Object.assign(saved,{w,h,time:game.time,seed:game.seed,camera:{...this.camera}});
  }
  drawSeal(game,dt){
    const {w,h}=this.resize(),output=this.ctx,p=Math.min(1,Math.max(0,(game.sealTime||0)/rules.sealDuration));
    this.age+=dt;
    this.sealVortex ||= new SealVortex();
    // Camera stays steady through the pull. Resizing/restore starts a fresh,
    // bounded capture, not a screenshot of an already distorted screenshot.
    if(this.sealGame!==game||this.sealW!==w||this.sealH!==h||p<this.sealProgress){
      if(!houseKeepsWorld(game)&&this.sealHouseBackdrop){this.sealHouseBackdrop.width=this.sealHouseBackdrop.height=1;this.sealHouseBackdrop=null;}
      this.sealVortex.clear();this.sealGame=game;this.sealW=w;this.sealH=h;
      const size=sealSurfaceSize(w,h),ready=this.sealReady;
      let snapshot;
      if(!houseKeepsWorld(game)&&ready?.game===game&&ready.seed===game.seed&&ready.w===w&&ready.h===h&&Math.abs(game.time-ready.time)<.25){snapshot=ready.canvas;this.camera={...ready.camera};this.sealReady=null;}
      else{
        snapshot=document.createElement('canvas');snapshot.width=size.width;snapshot.height=size.height;
        const capture=new Renderer(snapshot,this.assets);capture.camera={...this.camera};capture.age=this.age;
        capture.animator=this.animator;capture.canopyAlpha=this.canopyAlpha;
        capture.decorationCache=this.decorationCache;capture.actorPoseCache=this.actorPoseCache;capture.cacheWorld=this.cacheWorld;
        capture.resize=()=>{const c=capture.ctx;c.setTransform(size.width/w,0,0,size.height/h,0,0);c.imageSmoothingEnabled=false;capture.viewport={w,h};return {w,h};};
        const view=Object.create(game);view.phase='play';view.openingBoard=false;
        if(houseKeepsWorld(game)){
          // Cache the real house/yard separately; only the transparent hostile
          // layer is fed to the warp shader. No world redraws in the frame loop.
          view.enemies=game.enemies.filter(e=>!recalledEnemy(e));view.spells=[];view.arrows=[];
          capture.draw(view,0,{sealCapture:true});
          if(this.sealHouseBackdrop){this.sealHouseBackdrop.width=this.sealHouseBackdrop.height=1;}
          this.sealHouseBackdrop=snapshot;
          snapshot=document.createElement('canvas');snapshot.width=size.width;snapshot.height=size.height;
          const enemies=snapshot.getContext('2d');enemies.setTransform(size.width/w,0,0,size.height/h,0,0);enemies.imageSmoothingEnabled=false;
          enemies.translate(w/2,h/2);enemies.scale(this.camera.zoom,this.camera.zoom);enemies.translate(-this.camera.x,-this.camera.y);
          for(const a of [...game.enemies,...(game.ghosts||[])].filter(a=>!a.room&&recalledEnemy(a)).sort((a,b)=>a.y-b.y)){
            if(a.kind==='anaconda'){
              for(const part of anacondaRenderParts(a))if(this.visible(part,w,h,60)){drawAnacondaShadow(enemies,a,part.anacondaIndex);drawAnacondaSegment(enemies,a,part.anacondaIndex,game.time);}
              continue;
            }
            if(!this.visible(a,w,h,140))continue;
            ellipse(enemies,a.x,a.y+2,16,5,'#17362d88');
            const scale=a.kind==='elephant'?82:['crocodile','lion','tiger','white_lion','rhino','dragon','zebra','carnivorous_flower'].includes(a.kind)?61:['bat','wasp','bee','tsetse'].includes(a.kind)?34:47;
            this.animator.draw(enemies,a,game.time,scale);
          }
        }else capture.draw(view,0,{sealCapture:true});
      }
      this.sealVortex.capture(snapshot,w,h,w/2+(CENTER-this.camera.x)*this.camera.zoom,h/2+(CENTER-this.camera.y)*this.camera.zoom);
      // Simulation is frozen during sealing. Rasterize the unchanged party/table
      // once too, rather than rebuilding humanoid equipment on every warp frame.
      const anchors=document.createElement('canvas');anchors.width=size.width;anchors.height=size.height;const c=anchors.getContext('2d');
      c.setTransform(size.width/w,0,0,size.height/h,0,0);c.imageSmoothingEnabled=false;c.translate(w/2,h/2);c.scale(this.camera.zoom,this.camera.zoom);c.translate(-this.camera.x,-this.camera.y);
      this.boardBase(c,game);
      const party=game.players.filter(a=>!a.room).map(a=>({...a,isPlayer:true,drawDepth:boardActorDepth(game,a)}));
      for(const ghost of game.ghosts||[])if(!ghost.room&&(!houseKeepsWorld(game)||!recalledEnemy(ghost)))party.push({...ghost,isGhostActor:true,drawDepth:ghost.y});
      for(const pet of hunterPets(game))if(Number.isFinite(pet.x))party.push({...pet,drawDepth:pet.y});
      party.push({isBoard:true,drawDepth:boardTableDepth()});
      for(const a of party.sort((a,b)=>a.drawDepth-b.drawDepth)){
        if(a.isBoard){this.boardTop(c,game);continue;}
        if(a.hunterPet){const owner=game.players.find(hero=>hero.id===a.owner);if(owner){c.save();if(a.spiritGhost){c.globalAlpha=.78;c.filter='sepia(.6) hue-rotate(155deg) saturate(1.7)';}if(a.ritualPet)this.animator.draw(c,a,game.time,43);else drawHunterPet(c,a,owner,game.time,a.kind==='bat'?34:43);c.restore();}continue;}
        c.save();if(a.isGhostActor){c.globalAlpha=.78;c.filter='sepia(.6) hue-rotate(155deg) saturate(1.7)';}
        ellipse(c,a.x,a.y+2,16,5,'#17362d88');this.animator.draw(c,{...a,moving:false,attack:0,charge:0},game.time,PLAYER_RENDER_SIZE);
        c.restore();
      }
      if(this.sealAnchors){this.sealAnchors.width=this.sealAnchors.height=1;}this.sealAnchors=anchors;
      this.sealFrame ||= document.createElement('canvas');this.sealFrame.width=size.width;this.sealFrame.height=size.height;
      this.sealGame=game;
    }
    this.sealProgress=p;
    // All finale raster work happens at the capped logical resolution. Upscale
    // once at the end; high-DPI/4K monitors don't multiply clip and particle work.
    const ctx=this.sealFrame?.getContext('2d')||output;
    if(this.sealFrame){ctx.setTransform(this.sealFrame.width/w,0,0,this.sealFrame.height/h,0,0);ctx.imageSmoothingEnabled=false;}
    ctx.fillStyle='#505b5d';ctx.fillRect(0,0,w,h);
    if(this.sealHouseBackdrop)ctx.drawImage(this.sealHouseBackdrop,0,0,w,h);
    else{
    ctx.save();ctx.translate(w/2,h/2);ctx.scale(this.camera.zoom,this.camera.zoom);ctx.translate(-this.camera.x,-this.camera.y);
    // The room revealed by the disappearing jungle is cached tile-simple art.
    const tile=TILE;
    const sx=Math.max(0,Math.floor((this.camera.x-w/this.camera.zoom/2)/tile)),sy=Math.max(0,Math.floor((this.camera.y-h/this.camera.zoom/2)/tile));
    const ex=Math.min(WORLD/tile,Math.ceil((this.camera.x+w/this.camera.zoom/2)/tile)),ey=Math.min(WORLD/tile,Math.ceil((this.camera.y+h/this.camera.zoom/2)/tile));
    ctx.fillStyle='#888a8e';ctx.fillRect(0,0,WORLD,WORLD);ctx.strokeStyle='#73767a';ctx.lineWidth=1/this.camera.zoom;
    ctx.beginPath();for(let x=sx;x<=ex;x++){ctx.moveTo(x*tile,sy*tile);ctx.lineTo(x*tile,ey*tile);}for(let y=sy;y<=ey;y++){ctx.moveTo(sx*tile,y*tile);ctx.lineTo(ex*tile,y*tile);}ctx.stroke();ctx.restore();
    }
    this.sealVortex.drawWorld(ctx,p);this.sealVortex.drawAir(ctx,p);
    if(this.sealAnchors)ctx.drawImage(this.sealAnchors,0,0,w,h);this.sealVortex.drawAir(ctx,p,true);
    ctx.save();ctx.globalAlpha=Math.min(1,p*9)*(1-Math.max(0,(p-.94)/.06));ctx.textAlign='center';
    const titleY=Math.max(41,h*.18),titleW=Math.min(w-20,300);ctx.fillStyle='#142f28dd';ctx.fillRect(w/2-titleW/2,titleY-30,titleW,52);ctx.strokeStyle='#bfa46a66';ctx.lineWidth=1;ctx.strokeRect(w/2-titleW/2+.5,titleY-29.5,titleW-1,51);
    ctx.fillStyle='#18352d';ctx.font=`bold ${Math.max(16,Math.min(28,w*.044))}px Georgia`;ctx.fillText('WILDBOUND!',w/2,Math.max(42,h*.18)+1);
    ctx.fillStyle='#f3dfaa';ctx.fillText('WILDBOUND!',w/2,Math.max(41,h*.18));ctx.font='9px monospace';ctx.fillStyle='#d9eee0';ctx.fillText(houseKeepsWorld(game)?'THE ENCOUNTERS RETURN TO THE BOARD':'THE JUNGLE RETURNS TO THE BOARD',w/2,Math.max(55,h*.18+15));ctx.restore();
    if(this.sealFrame)output.drawImage(this.sealFrame,0,0,w,h);
    // No minimap, weather, blur layers or full-scene shader passes during warp.
  }
  visible(p, w, h, margin = 100) {
    return (
      Math.abs(p.x - this.camera.x) < w / this.camera.zoom / 2 + margin &&
      Math.abs(p.y - this.camera.y) < h / this.camera.zoom / 2 + margin
    );
  }
  lootPrompts(game, w, h) {
    if (!this.showLootDetails) return;
    const ctx = this.ctx,
      used = new Set(),
      boxes = [];
    ctx.save();
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    for (const p of game.players) {
      if (p.room || p.ui || p.hp <= 0) continue;
      if (game.phase === 'play' && p.progress >= 48 && Math.hypot(p.x - 800, p.y - 800) < 120) continue;
      const item = game.nearbyLoot(p);
      if (!item || item.quicksandHidden || used.has(item.id) || !canSee(game, item)) continue;
      used.add(item.id);
      const sx = (item.x - this.camera.x) * this.camera.zoom + w / 2,
        sy = (item.y - this.camera.y) * this.camera.zoom + h / 2;
      if (sx < 0 || sx > w || sy < 0 || sy > h) continue;
      const name =
          (ITEMS[item.type]?.name || item.type) +
          (item.qty > 1 ? " ×" + item.qty : ""),
        hint = ITEMS[item.type]?.slot
          ? (game.controlLabels?.interact || "E / Y") +
            ": collect · hold: equip"
          : (game.controlLabels?.interact || "E / Y") + ": collect",
        source = item.source || "Ground loot",
        width = Math.min(
          w - 16,
          Math.max(
            ctx.measureText(name).width,
            ctx.measureText(hint).width,
            ctx.measureText(source).width,
          ) + 20,
        ),
        height = 57;
      const heroes = game.players
        .filter((q) => !q.room && q.hp > 0)
        .map((q) => ({
          x: (q.x - this.camera.x - 16) * this.camera.zoom + w / 2,
          y: (q.y - this.camera.y - 38) * this.camera.zoom + h / 2,
          width: 32 * this.camera.zoom,
          height: 48 * this.camera.zoom,
        }));
      const candidates = [
        [sx - width / 2, sy - 38 * this.camera.zoom - height],
        [sx + 20 * this.camera.zoom, sy - height - 10],
        [sx - width - 20 * this.camera.zoom, sy - height - 10],
        [sx - width / 2, sy + 20 * this.camera.zoom],
      ].map(([x, y]) => ({
        x: clamp(x, 8, w - width - 8),
        y: clamp(y, 8, h - height - 8),
      }));
      const chosen =
        candidates.find(
          (a) =>
            ![...heroes, ...boxes.map((b) => ({ ...b, height }))].some(
              (b) =>
                a.x < b.x + b.width &&
                a.x + width > b.x &&
                a.y < b.y + b.height &&
                a.y + height > b.y,
            ),
        ) || candidates[0];
      const x = chosen.x;
      let y = chosen.y;
      for (
        let n = 0;
        n < 12 &&
        boxes.some(
          (b) =>
            x < b.x + b.width &&
            x + width > b.x &&
            y < b.y + height &&
            y + height > b.y,
        );
        n++
      )
        y = y + height * 2 < h ? y + height + 5 : Math.max(8, y - height - 5);
      boxes.push({ x, y, width });
      ctx.strokeStyle = p.color || "#dfc383";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 12 * this.camera.zoom);
      ctx.lineTo(clamp(sx, x + 8, x + width - 8), y + height);
      ctx.stroke();
      ctx.fillStyle = "#0e1b18ef";
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = ITEMS[item.type]?.color || "#efe3bc";
      ctx.fillText(name, x + 10, y + 16);
      ctx.font = "10px monospace";
      ctx.fillStyle = "#b9cbbd";
      ctx.fillText(source, x + 10, y + 31);
      ctx.fillStyle = "#efe3bc";
      ctx.fillText(hint, x + 10, y + 46);
      ctx.font = "12px monospace";
    }
    ctx.restore();
  }
  ground(ctx, sx, sy, ex, ey, desert, game=null) {
    for (let cy = Math.floor(sy / 8); cy < Math.ceil(ey / 8); cy++)
      for (let cx = Math.floor(sx / 8); cx < Math.ceil(ex / 8); cx++) {
        const key = `${game?.mapMode}:${game?.generatedEnvironment}:${desert||game?.mapMode==='boundless'?game?.seed||0:0}:${cx}:${cy}`;
        let canvas = this.groundChunks.get(key);
        if (!canvas) {
          canvas = document.createElement("canvas");
          canvas.width = canvas.height = 256;
          const c = canvas.getContext("2d");
          if(desert&&game)drawDesertChunk(c,game,cx,cy);
          else {
          for (let yy = 0; yy < 8; yy++)
            for (let xx = 0; xx < 8; xx++) {
              const x = cx * 8 + xx,
                y = cy * 8 + yy,
                r = hash(x, y),
                d = Math.hypot(x - 24.5, y - 24.5);
              c.fillStyle = desert
                ? ["#b98d55", "#c49a60", "#ae804b", "#d0a66b"][
                    Math.floor(r * 4)
                  ]
                : d < 5
                  ? ["#465139", "#414e36", "#48543b"][Math.floor(r * 3)]
                  : ["#263f2c", "#29422e", "#2d4631", "#304733"][
                      Math.floor(r * 4)
                    ];
              if(game?.mapMode==='boundless'&&(x<0||y<0||x>=50||y>=50))drawBoundlessGrass(c,game,x*32,y*32,cx*256,cy*256);
              else c.fillRect(xx * 32, yy * 32, 32, 32);
            }
          }
          if (this.groundChunks.size >= 100)
            this.groundChunks.delete(this.groundChunks.keys().next().value);
          this.groundChunks.set(key, canvas);
        }
        ctx.drawImage(canvas, cx * 256, cy * 256);
      }
  }
  floor(ctx, w, h, game) {
    const boundless=game.mapMode==='boundless';
    const rawSx = Math.floor((this.camera.x - w / this.camera.zoom / 2) / 32),
      rawEx = Math.ceil((this.camera.x + w / this.camera.zoom / 2) / 32),
      rawSy = Math.floor((this.camera.y - h / this.camera.zoom / 2) / 32),
      rawEy = Math.ceil((this.camera.y + h / this.camera.zoom / 2) / 32);
    const sx = boundless ? rawSx : Math.max(
        0,
      rawSx,
      ),
      ex = Math.min(
        boundless?rawEx:50,
        rawEx,
      ),
      sy = boundless ? rawSy : Math.max(
        0,
        rawSy,
      ),
      ey = Math.min(
        boundless?rawEy:50,
        rawEy,
      );
    const landscape=hasForestLandscape(game);
    if(game.phase!=='won'&&drawRealmGround(ctx,game,{sx,sy,ex,ey}))return;
    if(game.generatedEnvironment==='beach'&&game.phase!=='won'){drawBeachGround(ctx,game,{sx,sy,ex,ey});drawBoundlessRoutes(ctx,game,{sx,sy,ex,ey});return;}
    if(game.generatedEnvironment==='graveyard'&&game.phase!=='won'){drawGraveyardGround(ctx,game,{sx,sy,ex,ey});drawBoundlessRoutes(ctx,game,{sx,sy,ex,ey});return;}
    this.ground(ctx, sx, sy, ex, ey, game.generatedEnvironment === "desert",game);
    if(landscape&&sx<50&&sy<50&&ex>0&&ey>0)
      drawLandscapeGround(ctx,game,{sx:Math.max(0,sx),sy:Math.max(0,sy),ex:Math.min(50,ex),ey:Math.min(50,ey)});
    for (let y = sy; y < ey; y++)
      for (let x = sx; x < ex; x++) {
        const r = hash(x, y),
          d = Math.hypot(x - 24.5, y - 24.5);
        const kind = waterAt(game, x * 32 + 16, y * 32 + 16);
        const streamed=boundless&&(x<0||y<0||x>=50||y>=50);
        if((game.phase==='won'&&!houseKeepsWorld(game))||(!boundless&&game.bloom<3&&Math.hypot(x*32+16-CENTER,y*32+16-CENTER)>game.bloom*430)){
          ctx.fillStyle='#888a8e';ctx.fillRect(x*32,y*32,32.5,32.5);continue;
        }
        if(game.house?.pools&&kind==='water')continue;
        if(game.generatedEnvironment==='desert'&&kind==='sand')continue;
        if(streamed&&kind==='sand'){
          ctx.fillStyle=['#b98d55','#c49a60','#ae804b','#d0a66b'][Math.floor(r*4)];ctx.fillRect(x*32,y*32,32,32);continue;
        }
        // The cached base pass already paints outer grass in world coordinates.
        if(drawBiomeTile(ctx,game,kind,x*32,y*32))continue;
        if(['snow','ice'].includes(kind)){drawWinterTile(ctx,kind,x*32,y*32,32);continue;}
        if(['wood','path','temple_stone'].includes(kind)){
          if(kind==='path'){if(!(streamed&&landscape))drawPavingTile(ctx,game,x*32,y*32);continue;}
          ctx.fillStyle=kind==='temple_stone'?(r>.5?'#7c8766':'#6c785c'):kind==='wood'?(y%2?'#997450':'#a5815a'):'#c1b49a';
          ctx.fillRect(x*32,y*32,32,32);ctx.strokeStyle=kind==='wood'?'#73573f':'#b3cdd4';ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(x*32+2,y*32+16);ctx.lineTo(x*32+30,y*32+16);ctx.stroke();continue;
        }
        if (kind === "quicksand") {
          // One coherent pass below replaces individual tile rims and circles.
          if(streamed){ctx.fillStyle='#c4a263';ctx.fillRect(x*32,y*32,32,32);}
          continue;
        }
        if (kind === 'mud') {
          ctx.fillStyle=r>.5?'#887653':'#7c704f';ctx.fillRect(x*32,y*32,32,32);
          for(let n=0;n<8;n++){ctx.fillStyle=n%2?'#b9a07166':'#574d3c55';ctx.fillRect(x*32+hash(x+n,y)*28,y*32+hash(y+n,x)*28,3,1);}
          ctx.fillStyle='#c9b88a66';ctx.fillRect(x*32+5+Math.sin(game.time*1.3+y)*3,y*32+11,14,1);ctx.fillRect(x*32+13,y*32+24,10,1);
        }
        if (game.generatedEnvironment === "desert" && kind === "shallow") {
          ctx.fillStyle = "#4a9a91";
          ctx.fillRect(x * 32, y * 32, 32, 32);
          ctx.fillStyle = "#78c6ae66";
          ctx.fillRect(x * 32 + 4, y * 32 + 9, 20, 2);
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = "#6e9b53";
            ctx.fillRect(x * 32 + 7, y * 32 + 7, 2, 13);
            ctx.fillRect(x * 32 + 10, y * 32 + 4, 2, 16);
            ctx.fillRect(x * 32 + 14, y * 32 + 10, 2, 10);
          }
        }
        if (["water", "shallow", "bridge", "floodbridge"].includes(kind)) {
          ctx.save();if(landscape&&kind==='shallow')clipRiverTile(ctx,game,x*32,y*32);
          drawWaterSurface(ctx,game,x*32,y*32,32,32);
          if(landscape&&kind==='water')drawDepthCorners(ctx,game,x*32,y*32);
          if(landscape)drawForestBank(ctx,game,x*32,y*32,kind);
          ctx.restore();
          if(!landscape){
          ctx.fillStyle = "#588a963f";
          ctx.fillRect(
            x * 32 + ((game.time * 6 + y * 3) % 20),
            y * 32 + 8,
            12,
            2,
          );
          ctx.fillRect(x * 32 + 3, y * 32 + 23, 17, 2);
          }
        }
        if (!landscape && kind === "grass" && d > 5 && r > 0.22) {
          for (let i = 0; i < 3; i++) {
            const px = x * 32 + 4 + hash(x + i, y) * 24,
              py = y * 32 + 8 + hash(x, y + i) * 20;
            ctx.fillStyle = i === 0 ? "#66804b" : "#45633d";
            ctx.fillRect(Math.round(px), py - 4, 1, 5);
            ctx.fillRect(
              Math.round(px + Math.sin(game.time * 1.5 + x + i) * 1.3),
              py - 6,
              1,
              3,
            );
          }
        }
        if(!landscape){
        ctx.fillStyle = d < 5 ? "#77806035" : "#5d774050";
        ctx.fillRect(x * 32 + 5 + r * 19, y * 32 + 7 + r * 16, 2, 1);
        if (r > 0.7) {
          ctx.fillStyle = "#132f2350";
          ctx.fillRect(x * 32 + 20, y * 32 + 12, 3, 2);
        }
        }
        if (
          (game.phase === "won"&&!houseKeepsWorld(game)) ||
          (!boundless&&game.bloom < 3 &&
            Math.hypot(x * 32 + 16 - CENTER, y * 32 + 16 - CENTER) >
              game.bloom * 430)
        ) {
          ctx.fillStyle = "#888a8e";
          ctx.fillRect(x * 32, y * 32, 32.5, 32.5);

        }
      }
    (this.quicksandSurface ||= new QuicksandSurface()).draw(ctx,game,{sx,sy,ex,ey});
    if(boundless){
      drawBoundlessRoutes(ctx,game,{sx,sy,ex,ey});
      ctx.fillStyle='#071b187a';
      for(let y=sy;y<ey;y++)for(let x=sx;x<ex;x++)
        if(!game.explored.has(`${x},${y}`))ctx.fillRect(x*32,y*32,32.5,32.5);
    }
    if(!boundless){ctx.strokeStyle = "#a2b67840";ctx.lineWidth = 2;ctx.strokeRect(2, 2, WORLD - 4, WORLD - 4);}
  }
  boardBase(ctx, game, b=BOARD_TABLE) {
    ctx.save();
    if(!this.dynamicShadows||game.openingBoard){ctx.fillStyle='#17251d55';ctx.fillRect(b.x,b.y+5,b.w,b.h);}
    ctx.fillStyle='#443020';
    for(const leg of boardTableLegs(b))ctx.fillRect(leg.x-leg.rx,leg.y-leg.maxZ,leg.rx*2,leg.maxZ);
    ctx.fillStyle='#5a3d28';ctx.fillRect(b.x,b.y-b.surfaceHeight+5,b.w,b.h);
    ctx.restore();
  }
  boardTop(ctx, game, b=BOARD_TABLE) {
    ctx.save();
    ctx.fillStyle='#987047';ctx.fillRect(b.x,b.y-b.surfaceHeight,b.w,b.h);
    ctx.translate(
      b.x+b.w/2 + (game.tableShake ? Math.sin(this.age * 90) * 2 : 0),
      b.y+b.h/2-b.surfaceHeight,
    );
    // Full board (including both leaves) fits on a two-tile tabletop.
    ctx.scale(60 / 280, 28 / 192);
    drawBoard(ctx, game, game.roll?.elapsed??this.age,{drawDie});
    ctx.restore();
  }
  eventTestBoard(ctx,game){
    const b=game.eventTestBoard;
    // Reuse the real board art, with stationary pawns and no normal dice roll.
    this.boardTop(ctx,{...game,players:game.players.map(p=>({...p,progress:0,boardProgress:0})),roll:null,tableShake:0},b);
    ctx.save();ctx.strokeStyle='#7fe7ef';ctx.lineWidth=1.5;ctx.strokeRect(b.x,b.y-b.surfaceHeight,b.w,b.h);
    ctx.font='bold 8px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
    const label='EVENT TEST · '+b.nextEvent+' / '+EVENTS.length,x=b.x+b.w/2,y=b.y-b.surfaceHeight-10;
    const width=ctx.measureText(label).width+12;ctx.fillStyle='#102b32ee';ctx.fillRect(x-width/2,y-7,width,14);
    ctx.fillStyle='#a9f5fa';ctx.fillText(label,x,y);ctx.restore();
  }
  houseRoomTitle(ctx,game,w,h){
    const player=game.players.find(p=>p.hp>0&&!p.room);
    const indoors=player&&(game.house?.floors||[]).some(r=>player.x>=r.x&&player.y>=r.y&&player.x<r.x+r.w&&player.y<r.y+r.h);
    const room=indoors?(game.house.rooms||[]).reduce((best,r)=>!best||Math.hypot(r.x-player.x,r.y-player.y)<Math.hypot(best.x-player.x,best.y-player.y)?r:best,null):null;
    const name=room?.name||'';if(this.lastHouseRoom!==name){this.lastHouseRoom=name;this.houseRoomSince=game.time;}
    const age=game.time-this.houseRoomSince;if(!name||age>2.5)return;
    ctx.save();ctx.globalAlpha=Math.min(1,(2.5-age)*2);ctx.font='12px Georgia';ctx.textAlign='center';
    const width=ctx.measureText(name).width+24;ctx.fillStyle='#132c27df';ctx.fillRect(w/2-width/2,42,width,22);ctx.fillStyle='#eddbaf';ctx.fillText(name,w/2,57);ctx.restore();
  }
  minimap(ctx, game, w, h) {
    ctx.save();
    const s = 65,
      x = w - s - 14,
      y = h - s - 88;
    ctx.fillStyle = "#10271ecc";
    ctx.fillRect(x - 4, y - 4, s + 8, s + 8);
    ctx.strokeStyle = "#82966860";
    ctx.strokeRect(x, y, s, s);
    if(game.mapMode==='boundless'){
      const cells=21,cell=s/cells,cx=Math.floor(this.camera.x/32),cy=Math.floor(this.camera.y/32),startX=cx-10,startY=cy-10;
      const screen=(point)=>({x:x+(point.x/32-startX)*cell,y:y+(point.y/32-startY)*cell});
      for(let ty=startY;ty<startY+cells;ty++)for(let tx=startX;tx<startX+cells;tx++){
        if(!game.explored.has(`${tx},${ty}`))continue;
        const kind=waterAt(game,tx*32+16,ty*32+16),px=x+(tx-startX)*cell,py=y+(ty-startY)*cell;
        ctx.fillStyle=REALM_COLORS[game.generatedEnvironment]?.[kind]|| (kind==='water'?'#244b60':isShallow(kind)?'#497b79':kind==='bridge'?'#a28a56':kind==='ice'?'#8daebb':kind==='sand'?'#b99a62':kind==='temple_stone'?'#727d5e':'#334c35');ctx.fillRect(px,py,cell+.15,cell+.15);
      }
      for(const region of realmContexts(game))for(const n of region.realmState?.event?.nodes||[]){if(n.done||region.realmState.event.done)continue;const p=screen(n);if(p.x>=x&&p.x<=x+s&&p.y>=y&&p.y<=y+s){ctx.fillStyle='#d1b8e7';ctx.fillRect(p.x-1.5,p.y-1.5,3,3);}}
      // A local, player-centered map keeps this fast at any world coordinate.
      const center=screen({x:800,y:800});ctx.fillStyle='#d4ba72';ctx.fillRect(center.x-1.4,center.y-1.4,2.8,2.8);
      for(const e of game.enemies)if(e.hp>0&&canSee(game,e)){const p=screen(e);if(p.x>=x&&p.x<=x+s&&p.y>=y&&p.y<=y+s){ctx.fillStyle='#ed9275';ctx.fillRect(p.x-1,p.y-1,2,2);}}
      for(const item of game.loot)if(canSee(game,item)){const p=screen(item);if(p.x>=x&&p.x<=x+s&&p.y>=y&&p.y<=y+s){ctx.fillStyle='#ffe18c';ctx.fillRect(p.x-1,p.y-1,2,2);}}
      for(const p of game.players){const raw=screen(p),mx=clamp(raw.x,x+2,x+s-2),my=clamp(raw.y,y+2,y+s-2),outside=raw.x<x||raw.x>x+s||raw.y<y||raw.y>y+s;
        ctx.fillStyle=p.color||'#75e6c6';ctx.beginPath();if(outside){ctx.moveTo(mx,my-2.3);ctx.lineTo(mx+2.3,my+2);ctx.lineTo(mx-2.3,my+2);}else ctx.arc(mx,my,2.2,0,Math.PI*2);ctx.closePath();ctx.fill();
      }
      ctx.fillStyle='#a4b58e';ctx.font='4px monospace';ctx.textAlign='center';ctx.fillText('NEARBY · PARTY · VISIBLE THREATS',x+s/2,y+s+8);ctx.restore();return;
    }
    for (const i of game.explored) {
      const tx = i % 50,
        ty = Math.floor(i / 50),
        kind = waterAt(game, tx * 32 + 16, ty * 32 + 16);
      ctx.fillStyle = REALM_COLORS[game.generatedEnvironment]?.[kind] || (
        kind === "water"
          ? "#244b60"
          : isShallow(kind)
            ? "#497b79"
            : kind === "bridge"
              ? "#a28a56"
              : "#334c35");
      ctx.fillRect(
        x + (tx * s) / 50,
        y + (ty * s) / 50,
        s / 50 + 0.1,
        s / 50 + 0.1,
      );
    }
    for (const e of game.enemies) {
      if (
        !game.explored.has(Math.floor(e.y / 32) * 50 + Math.floor(e.x / 32)) &&
        !canSee(game, e)
      )
        continue;
      ctx.fillStyle = "#ed9275";
      ctx.fillRect(x + (e.x / WORLD) * s, y + (e.y / WORLD) * s, 1.5, 1.5);
    }
    if(game.realmState?.event&&!game.realmState.event.done)for(const n of game.realmState.event.nodes.filter(n=>!n.done)){ctx.fillStyle='#d1b8e7';ctx.fillRect(x+n.x/WORLD*s-2,y+n.y/WORLD*s-2,4,4);}
    const treasures = [
      ...game.loot,
      ...(game.phase === "won" ? [{ x: 800, y: 915 }] : []),
    ];
    for (const t of treasures) {
      if (
        game.phase !== "won" &&
        !game.explored.has(Math.floor(t.y / 32) * 50 + Math.floor(t.x / 32))
      )
        continue;
      ctx.fillStyle = "#ffe18c";
      ctx.fillRect(x + (t.x / WORLD) * s - 1, y + (t.y / WORLD) * s - 1, 2, 2);
    }
    ctx.fillStyle = "#d4ba72";
    ctx.fillRect(x + s / 2 - 1.5, y + s / 2 - 1.5, 3, 3);
    ctx.fillStyle = "#a4b58e";
    ctx.font = "4px monospace";
    ctx.textAlign = "center";
    ctx.fillText("● PARTY · + DOWN · ◇ LOOT", x + s / 2, y + s + 8);
    for (const door of game.portals) {
      ctx.strokeStyle =
        game.players.find((p) => p.id === door.owner)?.color || "#b987dd";
      ctx.strokeRect(
        x + (door.x / WORLD) * s - 2,
        y + (door.y / WORLD) * s - 2,
        4,
        4,
      );
    }
    if (game.ping?.until > game.time) {
      ctx.strokeStyle = game.ping.color;
      ctx.beginPath();
      ctx.arc(
        x + (game.ping.x / WORLD) * s,
        y + (game.ping.y / WORLD) * s,
        4,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    // Party markers stay above terrain, treasure, portals and pings.
    for (const p of game.players) {
      const mx = x + (p.x / WORLD) * s,
        my = y + (p.y / WORLD) * s;
      if (p.room) {
        ctx.strokeStyle = "#cc81ff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(mx, my, 2, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.hp <= 0) {
        ctx.fillStyle = "#ffdda4";
        ctx.shadowColor = "#ffba65";
        ctx.shadowBlur = 4 + 3 * Math.sin(this.age * 6);
        ctx.fillRect(mx - 2, my - 2, 4, 4);
        ctx.shadowBlur = 0;
      } else {
        ctx.beginPath();
        ctx.arc(mx, my, 2.3, 0, Math.PI * 2);
        ctx.fillStyle = p.color || "#75e6c6";
        ctx.fill();
        ctx.strokeStyle = "#071b16";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.strokeStyle = "#f0fff3";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
function trailPoint(i) {
  const a = (i / 48) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.cos(a) * 35, y: Math.sin(a) * 23 };
}
export function drawDie(ctx, x, y, size, value, angle) {
  const rx = angle,
    ry = angle * 0.71,
    rz = angle * 0.33;
  const rotate = ([a, b, c]) => {
    let yy = b * Math.cos(rx) - c * Math.sin(rx),
      zz = b * Math.sin(rx) + c * Math.cos(rx);
    let xx = a * Math.cos(ry) + zz * Math.sin(ry);
    zz = -a * Math.sin(ry) + zz * Math.cos(ry);
    return [
      xx * Math.cos(rz) - yy * Math.sin(rz),
      xx * Math.sin(rz) + yy * Math.cos(rz),
      zz,
    ];
  };
  const vertices = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ].map(rotate);
  const faces = [
    { v: [0, 1, 2, 3], n: 7 - value, c: "#8c754d" },
    { v: [4, 7, 6, 5], n: value, c: "#f2ddb0" },
    { v: [0, 4, 5, 1], n: 2, c: "#d7bb85" },
    { v: [3, 2, 6, 7], n: 5, c: "#a68a5b" },
    { v: [0, 3, 7, 4], n: 3, c: "#c5a872" },
    { v: [1, 5, 6, 2], n: 4, c: "#e8ce9b" },
  ].sort(
    (a, b) =>
      a.v.reduce((s, i) => s + vertices[i][2], 0) -
      b.v.reduce((s, i) => s + vertices[i][2], 0),
  );
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle='#14251b55';ctx.beginPath();ctx.ellipse(.8,1.5,size*1.2,size*.95,0,0,Math.PI*2);ctx.fill();
  for (const f of faces) {
    const p = f.v.map((i) => [vertices[i][0] * size, vertices[i][1] * size]);
    const area=p.reduce((sum,v,i)=>sum+v[0]*p[(i+1)%4][1]-p[(i+1)%4][0]*v[1],0);
    if(area>=-.01)continue;
    ctx.beginPath();
    p.forEach((v, i) => (i ? ctx.lineTo(...v) : ctx.moveTo(...v)));
    ctx.closePath();
    ctx.fillStyle = f.c;
    ctx.fill();
    ctx.strokeStyle = "#725431";
    ctx.lineWidth = .35;
    ctx.stroke();
    const coords =
      f.n === 1
        ? [[0.5, 0.5]]
        : f.n === 2
          ? [
              [0.25, 0.25],
              [0.75, 0.75],
            ]
          : f.n === 3
            ? [
                [0.25, 0.25],
                [0.5, 0.5],
                [0.75, 0.75],
              ]
            : f.n === 4
              ? [
                  [0.25, 0.25],
                  [0.75, 0.25],
                  [0.25, 0.75],
                  [0.75, 0.75],
                ]
              : f.n === 5
                ? [
                    [0.25, 0.25],
                    [0.75, 0.25],
                    [0.5, 0.5],
                    [0.25, 0.75],
                    [0.75, 0.75],
                  ]
                : [
                    [0.25, 0.25],
                    [0.25, 0.5],
                    [0.25, 0.75],
                    [0.75, 0.25],
                    [0.75, 0.5],
                    [0.75, 0.75],
                  ];
    ctx.fillStyle = "#3a3927";
    for (const [u, v] of coords) {
      const a =
          p[0][0] * (1 - u) * (1 - v) +
          p[1][0] * u * (1 - v) +
          p[2][0] * u * v +
          p[3][0] * (1 - u) * v,
        b =
          p[0][1] * (1 - u) * (1 - v) +
          p[1][1] * u * (1 - v) +
          p[2][1] * u * v +
          p[3][1] * (1 - u) * v;
      ctx.save();ctx.translate(a,b);ctx.transform((p[1][0]-p[0][0])/(size*2),(p[1][1]-p[0][1])/(size*2),(p[3][0]-p[0][0])/(size*2),(p[3][1]-p[0][1])/(size*2),0,0);ctx.beginPath();ctx.arc(0,0,size*.13,0,Math.PI*2);ctx.fill();ctx.restore();
    }
  }
  ctx.restore();
}
export function drawMenu(canvas, assets, time) {
  const w = Math.round(canvas.clientWidth / 2),
    h = Math.round(canvas.clientHeight / 2);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const c = canvas.getContext("2d");
  c.imageSmoothingEnabled = false;
  c.fillStyle = "#12342a";
  c.fillRect(0, 0, w, h);
  const cx = w * 0.52,
    cy = h * 0.48;
  c.save();
  c.translate(cx, cy);
  c.rotate(-0.14);
  for (let y = -7; y < 8; y++)
    for (let x = -7; x < 8; x++) {
      c.strokeStyle = "#79997416";
      c.strokeRect(x * 23, y * 23, 23, 23);
    }
  c.restore();
  const g = c.createRadialGradient(cx, cy, 10, cx, cy, w * 0.66);
  g.addColorStop(0, "#b6aa6539");
  g.addColorStop(1, "#0a211e00");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) {
    let x = hash(i, 3) * w,
      y = hash(i, 7) * h;
    if (Math.hypot((x - cx) * 0.8, y - cy) < w * 0.27) continue;
    assets.draw(c, i % 3 ? "fern" : "tree", x, y, i % 3 ? 60 : 110);
  }
  c.save();
  c.translate(cx, cy + Math.sin(time) * 2);
  c.rotate(-0.12);
  c.fillStyle = "#051e1966";
  c.fillRect(-79, -53, 164, 142);
  c.scale(0.78, 0.78);
  drawBoard(c, { players: [], current: null, roll: null, event: null }, time);
  c.restore();
  assets.draw(c, "explorer-teal", cx - 85, cy + 71, 49);
  assets.draw(c, "explorer-coral", cx + 76, cy + 63, 49);
  assets.draw(c, "lion", cx + 89, cy - 91, 64);
  assets.draw(c, "bat", cx - 74, cy - 96 + Math.sin(time * 2) * 4, 42);
  drawDie(c, cx - 12, cy - 11, 10, 4, 0.4);
  drawDie(c, cx + 17, cy + 9, 8, 3, 0.8);
  for (let i = 0; i < 17; i++) {
    c.fillStyle = i % 2 ? "#b8c87588" : "#e5bf7966";
    c.fillRect(
      hash(i, 12) * w + Math.sin(time + i) * 4,
      hash(i, 14) * h + Math.cos(time * 0.6 + i) * 5,
      1,
      1,
    );
  }
  const vignette = c.createRadialGradient(cx, cy, w * 0.2, cx, cy, w * 0.8);
  vignette.addColorStop(0, "#071c1300");
  vignette.addColorStop(1, "#061d19bb");
  c.fillStyle = vignette;
  c.fillRect(0, 0, w, h);
}


