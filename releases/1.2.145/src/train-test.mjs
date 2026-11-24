import {trainEngineProfile} from './train-construction.mjs';
import {emergencyTrainBrake,trainBrakingPower,tickTrainJourney,tickTrainRest,trainCarName,resetTrainJourney} from './train-journey.mjs';
import {cancelConductorDestination,unattendedTrainSpeed,finishUnattendedStop} from './train-autostop.mjs';
import {advanceRailwayTicket,cancelRailwayTicket,finishRailwayTicket} from './train-ticket-service.mjs';
import {tickTrainConductor,nearbyTrainConductor,interactTrainConductor,tickTrainConductorDialogue} from './train-conductor.mjs';
import {clearSwordPolish} from './sword-charge-state.mjs';
import {tickAlley,interactAlley,alleyPrompt,alleyBlocked,alleyFlooPrompt,interactFlooHearth,inDiagon,transferAlleyPurchases} from './diagon-alley.mjs';
import {privateStoragePortal,tickPortalClosures,tickRailwayStoragePlayer} from './storage-portals.mjs';
import {collectNearbyWorldLoot} from './inventory-world.mjs';
import {railwayLootAnchor,tickRailwayLoot} from './railway-loot.mjs';
import {transferDiagonCritters} from './diagon-critters.mjs';
import {clearPirateRide,interactPirateShip,pirateShipBlocked,pirateShipPrompt,stepOntoPiratePlank,tickPirateShip,tickPirateShipPlayer} from './pirate-ship.mjs';
import {interactMystery,mysteryPrompt} from './mystery-inc.mjs';
import {tickBorginHeartPond} from './borgin-heart-pond.mjs';
import {validBorginDialogue} from './borgin-heart-dialogue.mjs';
import {tickStationOwls,openOwlCage,owlPrompt,transferStationOwls} from './station-owls.mjs';
import {trainFurnitureBlocks} from './train-surfaces.mjs';
import {emitGameplayFx} from './gameplay-fx.mjs';
import {tickEnergyBlade,tickEnergyMotionTail,tickRailwayEnergyBurns} from './energy-blade.mjs';
import {trainStudents,nearbyTrainStudent,interactTrainStudent,transferTrainStudentGifts} from './train-students.mjs';
import {tickChocolateFrogs} from './chocolate-frogs.mjs';
import {trainTailor,nearbyTrainTailor,openTrainTailor,transferTailorPurchases} from './train-tailor.mjs';
import {bridgeSupportAt,tickTrainBridgeWater,resetRailwayBridges} from './train-bridges.mjs';
import {stopRailwayStream,streamRegion} from './railway-stream.mjs';
import {nativeWildIceMotion,nearbyNativeIce,interactNativeIce} from './wild-native-biomes.mjs';
export {harvestNativeGravestone} from './wild-native-biomes.mjs';
import {tickSceneryFalls,tickTracks} from './environment.mjs';
import {structureBlocked,toggleDoor} from './expansion.mjs';
import {interactWildHomestead,wildHomesteadPrompt,tickWildHomestead,tickWildHomesteadVehicle} from './wild-homestead.mjs';
import {homesteadBoardHolds} from './homestead-board.mjs';
import {boardTableBlocked} from './board-table.mjs';
import {tickTickTockCrocodile} from './tick-tock-crocodile.mjs';
import {tickHollowStalactites} from './hollow-stalactites.mjs';
import {bayouGoblinPrompt,interactBayouGoblin} from './bayou-goblin-hut.mjs';
import {bayouGoblinHutBlocked} from './bayou-goblin-hut-layout.mjs';
import {tickDestruction} from './structure-destruction.mjs';
import {tickTrainImpacts} from './train-impact.mjs';
import {tickWildLandsContent,interactWildLandsSite,nearbyWildSite,VEIL_GLAIVE_CHEST} from './wild-lands-content.mjs';
import {interactOverlookChest} from './overlook-maze.mjs';
import {tickPlayerIce} from './frost-prison.mjs';
import {BROOM_HOVER_HEIGHT,tickBroomFlight,dismountBroom} from './broom-mount.mjs';
import {tickWingFlight} from './wing-flight.mjs';
import {tickGhosts} from './temple.mjs';
import {tickHunterPets} from './hunter-pets.mjs';
import {tickVillagers} from './villagers.mjs';
import {controlledFollower,cycleFollowerControl,syncControlledFollower} from './follower-control.mjs';
import {tickFollowerAttack} from './follower-attacks.mjs';
import {tickField} from './field-systems.mjs';
import {tickCharmStatuses,charmInputs,isCharmed,tickCharmedPlayer} from './succubus-charm.mjs';
import {playerInput} from './inventory-input.mjs';
import {tickSwimBreath} from './swimming.mjs';
import {tickNightEquipment} from './night-equipment.mjs';
import {tickNightCycle} from './night-cycle.mjs';
import {swordStep} from './sword-feel.mjs';
import {hasAimWeapon,updateAimFacing,updateBowAimBlend} from './ranged-aim.mjs';
import {itemKind} from './items.mjs';
import {wildLandsInteract,wildLandsBlocked,wildLandsGatePrompt} from './wild-lands-world.mjs';
import {interactTideglass,tideglassPrompt} from './tideglass-quest.mjs';
import {HOLLOW_ROOM,advanceMountainDescent,beginMountainDescent,mountainDescentCorridor,mountainDescentLaunch,mountainHeight,mountainLand,mountainTerrainBlocked,mountainTrail} from './wild-mountain-layout.mjs';
import {tickMountainEncounters} from './wild-mountain-encounters.mjs';
import {tickWildBiomeSpawns} from './wild-biome-spawns.mjs';
import {catchableWildCoastalCritter,tickWildCoastalCritters} from './wild-coastal-critters.mjs';
import {inQuidditch,interactQuidditchScene,quidditchScenePrompt,tickQuidditchScene} from './quidditch-scene.mjs';
import {quidditchFieldBlocked} from './quidditch-layout.mjs';
import {tickDiagonFootprints} from './diagon-footprints.mjs';
import {tickGardenBench} from './diagon-garden-benches.mjs';
import {tickGardenPond,transferGardenManaWards} from './diagon-garden-ward.mjs';
import {nearbyTrainTicketBooth,openTrainTicketDialogue,tickTrainTicketDialogue} from './train-ticket-dialogue.mjs';
import {diagonArenaBlocked,inDiagonArena} from './diagon-arena-layout.mjs';
import {interactDiagonArena,tickDiagonArena} from './diagon-arena.mjs';
import {hogsmeadeBlocked,hogsmeadePrompt,interactHogsmeade} from './hogsmeade.mjs';
import {tickLupin} from './remus-lupin.mjs';
import {tickShackBoggart} from './hogsmeade-boggart.mjs';
import {controllerButtonNames,trainCabButtons} from './controls.mjs';
import {railwayForestBlocked} from './railway-forest.mjs';
import {railwaySurface} from './railway-water.mjs';
import {stationDeckAt,stationBlocked,tickStationCats,syncStationAssets} from './railway-station.mjs';
import {claimTrainCocoa,transferTrainTreats} from './hot-chocolate.mjs';
import {startJump,tickJump,releaseJump,jumpMotion} from './jumping.mjs';
import {readTrainDesign,validateTrainDesign,trainInterior,tenderLayout,trainDoorGeometry,trainSideDoorSpans,trainSideDoorway,trainSideWallHeight} from './train-design.mjs';
import {compartmentSeatStandY,nativeCompartmentAisle} from './train-interior.mjs';
import {buildTrainRoute,sampleTrainRoute,trainCars,trainWorld,trainLocal,nearestTrainTrack,railwayWater,railElevation,trainRiderWorld,trainGangwayEnds} from './train-track.mjs';
import {playTrainAudio,stopTrainAudio} from './train-audio.mjs';
export {buildTrainRoute,sampleTrainRoute} from './train-track.mjs';
export {validateTrainDesign} from './train-design.mjs';
export {drawTrainTest} from './train-world-art.mjs';
import {tickSalvage} from './salvage.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const combatCollisionCars=new WeakMap();
function collisionCars(t){
 const frame=combatCollisionCars.get(t);
 if(!frame||t.derailed||frame.distance!==t.distance||frame.route!==t.route)return trainCars(t);
 return frame.cars??=trainCars(t);
}
const notice=(t,text)=>{t.notice=text;t.noticeUntil=t.time+5;};
function cue(g,event,p){playTrainAudio(g.trainAudio,event,p,g.trainTest.speed);}
export function createTrainRuntime(design) {
 const route=buildTrainRoute(design);
 return {
  design, route, distance:design.spawnDistance, speed:0, throttle:0, engine:false, time:0,
  previous:new Map(), cocoaTaken:new Set(), cocoaRewards:{}, doors:{}, roof:{}, particles:[],
  routeSegments:[{at:-Infinity,route,offset:0}],
  otherRoutes:design.routes.filter(other=>other.id!==route.id).map(other=>buildTrainRoute(design,other.id)),
 };
}

export function enterTrainTest(g,worldDesign=null,{persistent=false}={}){
 if(g.trainTest)return {ok:false,message:'A railway expedition is already active.'};
 if(!g.players.length)return {ok:false,message:'Join with an explorer before opening the train level.'};
 try{
  const train=createTrainRuntime(worldDesign||readTrainDesign());
  if(persistent){
   train.persistent=true;
   Object.assign(g,{houseWorldsEnabled:false,houseWorlds:null,explored:new Set(),boundlessLoadedChunks:[]});
  }else{
   const excluded=new Set(['players','phase','sky','time','persist','random','onSound','spriteLibrary','trainAudio','trainTest']);
   const returnWorld=Object.fromEntries(Object.entries(g).filter(([key,value])=>!excluded.has(key)&&typeof value!=='function'));
   const copies=structuredClone(returnWorld);
   Object.assign(train,{returnPlayers:g.players,returnPhase:g.phase,returnSky:structuredClone(g.sky),returnTime:g.time,returnPersist:g.persist,returnWildState:returnWorld});
   Object.assign(g,copies);
   g.players=structuredClone(g.players);
   g.persist=()=>{};
  }
  g.trainTest=train;
  for(const key of ['loot','arrows','spells','effects','traps','pickups','baits','portals','xpOrbs','boomerangs','rifleShots','chocolateFrogs','scenery','barricades','villagers','templeBolts'])g[key]=[];
  g.enemies=(g.enemies||[]).filter(e=>e.allyOwner||e.faction==='ally');
  g.ghosts=(g.ghosts||[]).filter(e=>e.pet);
  Object.assign(g,{house:null,event:null,openingBoard:false,objective:null,localWorld:null,interiorWorld:null,worldTravel:null,generatedEnvironment:'forest',mapMode:'boundless',cleared:0,phase:'play'});
  spawnOutside(g);
  if(typeof Worker!=='undefined')train.preparing=true;
  notice(train,'Jump onto a raised doorway to board. Cab controls are in the locomotive.');
  return {ok:true,message:persistent?'The Wild Lands is ready. Save in Camp to continue later.':'Train test ready. Return from train test restores your expedition.'};
 }catch(error){return {ok:false,message:error.message};}
}
export function leaveTrainTest(g){const t=g.trainTest;if(!t||t.persistent)return;const alleyChanges=transferAlleyPurchases(g,t),owlChanges=transferStationOwls(g,t),wardChanges=transferGardenManaWards(g.players,t.returnPlayers);stopRailwayStream(t);stopTrainAudio(g.trainAudio);if(t.returnWildState)Object.assign(g,t.returnWildState);transferTrainTreats(g,t);const studentChanges=transferTrainStudentGifts(g,t),tailorChanges=transferTailorPurchases(g,t),critterChanges=transferDiagonCritters(t);g.players=t.returnPlayers;g.phase=t.returnPhase;g.time=t.returnTime;g.sky=t.returnSky;g.persist=t.returnPersist;delete g.trainTest;if(Object.keys(t.cocoaRewards).length||studentChanges||tailorChanges||owlChanges||alleyChanges||critterChanges||wardChanges)g.persist?.();}
export function spawnOutside(g){for(const p of g.players)clearPirateRide(p);const t=g.trainTest,c=trainCars(t)[2],q=trainWorld(c,-c.length/2+17,c.width/2+52);for(const[p,i]of g.players.map((p,i)=>[p,i])){Object.assign(p,{x:q.x+Math.cos(c.a)*i*30,y:q.y+Math.sin(c.a)*i*30,room:null,vehicleId:null,jumpHeight:0,jumpVelocity:0,jumpHeld:false,groundHeight:0,dashTime:0,dashRecovery:0,dashHeld:false,consumeInput:false,doodadAttackConsumed:false,wingHover:false,broomMount:null,swimming:false,underBridge:false,trainDeck:false,trainGround:0,trainBoardAfter:0,trainVisualLift:0,diveDepth:0,moving:false,ui:null,state:'idle',rooted:0,stun:0,hit:0,sleeping:0,deathTime:0,getUpTime:0,attack:0,charge:0,bowAiming:false,foundUnique:0,pickupTime:0,gatherTime:0,parry:0,hp:Math.max(1,p.hp)});delete p.trainRide;delete p.animationAction;clearSwordPolish(p);delete p.swordDash;delete p.swordStrike;delete p.swordFacing;p.swordChargeAim=false;if(p.controlPetPosition)Object.assign(p.controlPetPosition,{x:p.x-30,y:p.y+20});}for(const [i,a]of [...(g.enemies||[]),...(g.ghosts||[]),...(g.villageFollowers||[]),...g.players.flatMap(p=>[p.hunterPet,p.ritualPet].filter(Boolean))].entries())Object.assign(a,{x:q.x+30+(i%4)*22,y:q.y+30+Math.floor(i/4)*22,room:null,swimming:false});}
export function repairTrain(g){const t=g.trainTest;if(!t)return {ok:false,message:'Enter a dev railway first.'};cancelRailwayTicket(g,'The railway was reset.');resetRailwayBridges(t.design);delete t.derailed;t.distance=t.design.spawnDistance;t.routeSegments=[{at:-Infinity,route:t.route,offset:0}];t.pendingRoute=null;t.speed=0;t.throttle=0;t.engine=false;t.driver=null;delete t.autoStationStop;delete t.conductor;resetTrainJourney(t);g.phase='play';spawnOutside(g);notice(t,'Railway bridges repaired. Train reset and ready to board.');return {ok:true,message:'Railway bridges repaired. Train parked and explorers safely beside the coach.'};}
export function applyTrainDesign(g,raw){const d=validateTrainDesign(raw),route=buildTrainRoute(d);if(g?.trainTest){const t=g.trainTest;cancelRailwayTicket(g,'The active railway was changed.');stopRailwayStream(t);t.design=d;delete t.derailed;t.route=route;t.routeSegments=[{at:-Infinity,route,offset:0}];t.pendingRoute=null;delete t.autoStationStop;delete t.conductor;resetTrainJourney(t);t.distance=d.spawnDistance;t.speed=0;t.throttle=0;t.engine=false;t.doors={};t.roof={};t.particles=[];delete t.nativeFarView;delete t.floorLod;delete t.meadowRailField;delete t.nativeKinds;delete t.wildNativeWorlds;delete t.nativePopulated;delete t.nativeCollision;delete t.nativeCollisionAreas;delete t.nativeCollisionRoom;delete t.trees;delete t.forestChunks;delete t.floorChunks;delete t.meadowMask;delete t.forestWorld;delete t.stationCats;delete t.wildFloorChunks;delete t.wildPropChunks;delete t.wildPropData;delete t.distantProps;delete t.distantStations;delete t.distantTrain;delete t.wildMap;delete t.wildOverview;t.otherRoutes=d.routes.filter(r=>r.id!==d.activeRoute).map(r=>buildTrainRoute(d,r.id));spawnOutside(g);notice(t,'Saved railway applied. Train parked and explorers placed beside the coach.');}return d;}
export async function openTrainEditor(g,host){const {TrainEditor}=await import('./train-editor.mjs');document.querySelector('dialog[data-railway-modal]')?.remove();const opener=document.activeElement,modal=document.createElement('dialog');modal.id='train-editor-dialog';modal.dataset.railwayModal='true';modal.style.cssText='padding:0;border:0;background:transparent;max-width:none;max-height:none;width:100vw;height:100vh';const box=document.createElement('section');box.dataset.trainEditor='true';modal.append(box);document.body.append(modal);modal.showModal();const editor=await new TrainEditor({game:g,embedded:true}).mount(box);modal.oncancel=e=>{e.preventDefault();try{editor.close();}catch(error){editor.message(error.message);}};modal.addEventListener('close',()=>{if(opener?.isConnected)opener.focus();});return editor;}

export function trainInteriorBlocked(t,c,x,y,ignore,height=0){
 const r=7,exit=trainSideDoorway(c,x)||height>=trainSideWallHeight(c);
 if(Math.abs(x)>c.length/2-r||Math.abs(y)>c.width/2-r&&!exit||Math.abs(y)>c.width/2+8)return true;
 if(c.kind==='engine'&&x> -c.length*.07&&Math.abs(y)<c.width/2-16)return true;
 if(c.kind==='tender'){
  const coal=tenderLayout(c);
  if(Math.abs(x)<coal.bunkerLength/2+r&&Math.abs(y)<coal.bunkerWidth/2+r)return true;
 }
 for(const item of trainInterior(t.design,c)){
  if(item.id===ignore)continue;
  const o=item.kind==='door'?trainDoorGeometry(item,t.doors[c.id+':'+item.id]??item.open):item;
  if(trainFurnitureBlocks(o,x,y,height,r))return true;
 }
 return false;
}
export function restoreCompartmentRiders(t,players){
 if(t.derailed||!players.some(p=>p.trainRide))return;
 const cars=trainCars(t);
 for(const p of players){
  const ride=p.trainRide,height=p.jumpHeight||p.groundHeight||0;
  if(!ride||ride.seat||ride.driving||ride.gangway)continue;
  const car=cars[ride.car],aisle=car&&nativeCompartmentAisle(t.design,car);
  if(!aisle||aisle.wallY===car.width/2-23||Math.abs(ride.y-aisle.wallY)>=9.5||
   !trainInteriorBlocked(t,car,ride.x,ride.y,null,height))continue;
  // A saved rider overlapping the moved wall can step onto the nearest clear side.
  const near=Math.sign(ride.y-aisle.wallY)||1;
  const y=[aisle.wallY+near*10,aisle.wallY-near*10].find(spot=>!trainInteriorBlocked(t,car,ride.x,spot,null,height));
  if(y===undefined)continue;
  ride.y=y;
  const point=trainRiderWorld(cars,ride);p.x=point.x;p.y=point.y;
 }
}
function walkInside(t,c,r,dx,dy,height=0){
 if(!dx&&!dy)return;
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4)),stepX=dx/steps,stepY=dy/steps;
 const ignored=r.seat?.split(':').slice(1).join(':');
 for(let j=0;j<steps;j++){
  if(stepX&&!trainInteriorBlocked(t,c,r.x+stepX,r.y,ignored,height))r.x+=stepX;
  if(stepY&&!trainInteriorBlocked(t,c,r.x,r.y+stepY,ignored,height))r.y+=stepY;
 }
}
const BROOM_CABIN_HOVER=10;
const carFloor=c=>20+c.z;
const carRoof=c=>carFloor(c)+trainSideWallHeight(c);

function doorwayGuide(car,x){
 let offset=null;
 for(const {min,max} of trainSideDoorSpans(car)){
  const distance=clamp(x,min+10,max-10)-x;
  if(Math.abs(distance)<=12&&(offset===null||Math.abs(distance)<Math.abs(offset)))offset=distance;
 }
 return offset;
}

function broomTrainHover(p,cs,jump){
 if(p.trainRide)return BROOM_CABIN_HOVER;
 if(!p.broomMount||!jump)return BROOM_HOVER_HEIGHT;
 const ground=p.trainGround||0;
 let target=BROOM_HOVER_HEIGHT,doorHeight=null;
 for(const car of cs){
  const local=trainLocal(car,p);
  if(Math.abs(local.x)>car.length/2+44||Math.abs(local.y)>car.width/2+60)continue;
  if(Math.abs(local.y)>car.width/2-8&&doorwayGuide(car,local.x)!==null&&(p.jumpHeight||0)+ground<carRoof(car)){
   doorHeight=carFloor(car)+6-ground;
  }else target=Math.max(target,carRoof(car)+12-ground);
 }
 return doorHeight===null?target:Math.max(BROOM_HOVER_HEIGHT,doorHeight);
}

function blocksCarExterior(c,q,radius,height,airborne){
 const doorway=airborne&&height>=carFloor(c)&&Math.abs(q.y)>=c.width/2-9&&trainSideDoorway(c,q.x);
 return Math.abs(q.x)<c.length/2+radius&&Math.abs(q.y)<c.width/2+radius&&height<carRoof(c)&&!doorway;
}

function separateCarExterior(p,cs){
 if(p.underBridge||p.swimming)return;
 const height=(p.jumpHeight||0)+(p.groundHeight||0)+(p.trainGround||0);
 for(const car of cs){
  const q=trainLocal(car,p);
  if(!blocksCarExterior(car,q,6,height,p.jumpHeight>0))continue;
  const toEnd=car.length/2-Math.abs(q.x),toSide=car.width/2-Math.abs(q.y);
  const x=toEnd<toSide?Math.sign(q.x||1)*(car.length/2+9):q.x;
  const y=toEnd<toSide?q.y:Math.sign(q.y||1)*(car.width/2+9);
  const outside=trainWorld(car,x,y);p.x=outside.x;p.y=outside.y;
 }
}

function boardingAllowed(t,p){
 return !t.derailed&&!p.trainRide&&!p.underBridge&&!p.wingHover&&p.jumpHeight>0&&!(p.trainBoardAfter>t.time);
}

function guideTrainApproach(g,t,p,cars,motion,dt){
 if(!boardingAllowed(t,p)||Math.hypot(motion.dx,motion.dy)<.01)return motion;
 const height=p.jumpHeight+(p.trainGround||0);
 for(const car of cars){
  const q=trainLocal(car,p),gap=Math.abs(q.y)-car.width/2;
  if(gap<-1||gap>22||height<carFloor(car)-12||height>=carRoof(car))continue;
  const side=Math.sign(q.y),cos=Math.cos(car.a),sin=Math.sin(car.a);
  if(side*(-sin*motion.dx+cos*motion.dy)>-.15)return motion;
  const offset=doorwayGuide(car,q.x);
  if(offset===null)continue;
  const along=clamp(offset,-42*dt,42*dt),inward=side*12*dt;
  if(along){
   // Align along the side before the normal movement tries the threshold.
   const point=trainWorld(car,q.x+along,q.y);
   if(!trainWorldBlocked(g,point.x,point.y,8,!!p.broomMount,true,p.jumpHeight,false,p)){
    p.x=point.x;p.y=point.y;
   }
  }
  return {dx:motion.dx+sin*inward,dy:motion.dy-cos*inward};
 }
 return motion;
}

export function tryBoardTrain(g,p,cs=trainCars(g.trainTest),previous=null){
 const t=g.trainTest;
 if(!boardingAllowed(t,p))return false;
 const height=p.jumpHeight+(p.trainGround||0);
 for(const car of cs){
  const q=trainLocal(car,p),sideDistance=Math.abs(q.y),edge=car.width/2;
  if(height<carFloor(car)||height>=carRoof(car)||sideDistance>edge||sideDistance<edge-9||!trainSideDoorway(car,q.x))continue;
  if(previous&&Math.abs(trainLocal(car,previous).y)<=sideDistance+.01)continue;
  const lift=p.broomMount?BROOM_CABIN_HOVER:height-carFloor(car);
  if(trainInteriorBlocked(t,car,q.x,q.y,null,lift))continue;
  p.trainRide={car:car.index,x:q.x,y:q.y};
  Object.assign(p,{swimming:false,underBridge:false,trainDeck:false,trainGround:0,trainVisualLift:carFloor(car),
   groundHeight:0,jumpHeight:lift,jumpVelocity:lift>0&&!p.broomMount?p.jumpVelocity||0:0});
  cue(g,'door',p);notice(t,p.broomMount?'Broom aboard. Fly back through the doorway to leave.':'Boarded. Interact near seats, tables, doors or cab controls.');
  return true;
 }
 return false;
}
export function leaveTrainCar(g,p,c,r){const t=g.trainTest,side=Math.sign(r.y||1),q=trainWorld(c,r.x,side*Math.max(Math.abs(r.y),c.width/2+8));delete p.trainRide;Object.assign(p,{x:q.x,y:q.y,trainGround:0,trainDeck:false,groundHeight:0,swimming:false,underBridge:false,jumpHeight:20+c.z+(p.jumpHeight||p.groundHeight||0),jumpVelocity:Math.max(0,p.jumpVelocity||0),jumpHeld:!!p.jumpHeld,trainBoardAfter:t.time+.6});cue(g,'door',p);notice(t,'Left the train. Jump onto the raised floor to board again.');}
function stand(t,c,r){
 const seat=trainInterior(t.design,c).find(o=>c.id+':'+o.id===r.seat);
 if(!seat){delete r.seat;return true;}
 const leaveSeat=(x,y)=>{delete r.seat;r.x=x;r.y=y;return true;};
 if(nativeCompartmentAisle(t.design,c)){
  const y=compartmentSeatStandY(seat);
  if(!trainInteriorBlocked(t,c,seat.x,y))return leaveSeat(seat.x,y);
 }
 for(const a of[(seat.facing||0)*Math.PI/2,0,Math.PI/2,Math.PI,Math.PI*1.5]){
  const x=seat.x+Math.cos(a)*(seat.w/2+12),y=seat.y+Math.sin(a)*(seat.h/2+12);
  if(!trainInteriorBlocked(t,c,x,y))return leaveSeat(x,y);
 }
 notice(t,'There is no room to stand beside this seat.');
 return false;
}
function nearCompartmentDoor(aisle,c,r,door){
 // From inside a native room, reaching toward a sofa should not open the door next to it.
 return !aisle||r.y>=door.y||Math.abs(r.x-door.x)<Math.min(door.w/2+2,(c.length-70)/16);
}
export function trainInteraction(g,p,cs=trainCars(g.trainTest)){
 if(inDiagonArena(g))return interactDiagonArena(g,p);
 if(inQuidditch(g))return interactQuidditchScene(g,p);
 const t=g.trainTest,r=p.trainRide,c=r?cs[r.car]:null;
 if(!r&&interactFlooHearth(g,p))return true;
 if(!r&&openTrainTicketDialogue(g,p))return true;
 if(!r&&interactHogsmeade(g,p))return true;
 if(!r&&interactTideglass(g,p))return true;
 if(!r&&interactBayouGoblin(g,p))return true;
 if(!r&&interactMystery(g,p))return true;
 if(interactOverlookChest(g,p))return true;
 if(interactPirateShip(g,p))return true;
 if(interactAlley(g,p)||openOwlCage(g,p)||interactWildLandsSite(g,p)||wildLandsInteract(g,p)||!r&&interactNativeIce(g,p))return true;
 if(!r)return interactWildHomestead(g,p)||toggleDoor(g,p);
 if(r.seat)return stand(t,c,r);
 const closeCup=closerTrainCocoa(g,p,cs);if(closeCup)return claimTrainCocoa(g,p,c.id+':'+closeCup.id);
 if(interactTrainConductor(g,p,cs))return true;
 if(interactTrainStudent(g,p,cs))return true;
 if(openTrainTailor(g,p,cs))return true;
 const allObjects=trainInterior(t.design,c),cup=allObjects.filter(o=>o.kind==='table').slice(0,c.kind==='compartments'?2:0).find(o=>Math.hypot(o.x-r.x,o.y-r.y)<30&&!t.cocoaTaken.has(c.id+':'+o.id));if(cup)return claimTrainCocoa(g,p,c.id+':'+cup.id);
 const objs=allObjects,near=objs.filter(o=>Math.hypot(o.x-r.x,o.y-r.y)<Math.max(25,Math.hypot(o.w,o.h)/2+12)).sort((a,b)=>Math.hypot(a.x-r.x,a.y-r.y)-Math.hypot(b.x-r.x,b.y-r.y));
 const aisle=nativeCompartmentAisle(t.design,c);
 const door=near.find(o=>o.kind==='door'&&nearCompartmentDoor(aisle,c,r,o));if(door){const key=c.id+':'+door.id,next=!(t.doors[key]??door.open);if(!next&&g.players.some(q=>q.trainRide?.car===c.index&&Math.abs(q.trainRide.x-door.x)<door.w/2+8&&Math.abs(q.trainRide.y-door.y)<door.h/2+8)){notice(t,'The doorway is occupied.');return true;}t.doors[key]=next;cue(g,'door',p);notice(t,next?'Compartment door opened.':'Compartment door closed.');return true;}
 const console=near.find(o=>o.kind==='console');if(console){if(t.driver&&t.driver!==p.id){notice(t,'Another explorer has the controls.');return true;}t.driver=p.id;r.driving=true;if(cancelConductorDestination(t)){notice(t,'Cab controls taken. The conductor’s destination was cleared.');g.persist?.();return true;}t.engine=!t.engine;if(t.engine){delete t.emergencyBrake;t.throttle=Math.max(t.throttle,.2);cue(g,'steam',p);notice(t,'Steam on. Up/down: throttle · attack: whistle · dash: emergency brake · jump: leave controls. Interact here to stop.');}else{t.throttle=0;cue(g,'brake',p);notice(t,'Steam closed. The train is braking.');}return true;}
 const seat=near.find(o=>o.kind==='seat'&&![...trainStudents(g,cs),trainTailor(g,cs)].filter(Boolean).some(n=>n.seatId===c.id+':'+o.id)&&!g.players.some(q=>q.trainRide?.seat===c.id+':'+o.id));if(seat){r.seat=c.id+':'+seat.id;r.x=seat.x;r.y=seat.y;r.facing=(seat.facing??0)*Math.PI/2;p.groundHeight=0;p.jumpHeight=0;p.jumpVelocity=0;notice(t,'Seated. Rest quietly to recover health. Interact or jump to stand.');return true;}
 if(trainSideDoorway(c,r.x)&&Math.abs(r.y)>c.width/2-12){leaveTrainCar(g,p,c,r);return true;}
 return false;
}
function closerTrainCocoa(g,p,cs){const t=g.trainTest,r=p.trainRide,c=r&&cs[r.car];if(!c||c.kind!=='compartments')return null;const cup=trainInterior(t.design,c).filter(o=>o.kind==='table').slice(0,2).find(o=>!t.cocoaTaken.has(c.id+':'+o.id)&&Math.hypot(o.x-r.x,o.y-r.y)<30);if(!cup)return null;const npc=nearbyTrainStudent(g,p,cs)||nearbyTrainTailor(g,p,cs);return !npc||Math.hypot(cup.x-r.x,cup.y-r.y)<Math.hypot(npc.local.x-r.x,npc.local.y-r.y)?cup:null;}
export function trainPrompt(g,p){
 if(inQuidditch(g))return quidditchScenePrompt(g,p);
 const t=g.trainTest,cs=trainCars(t),r=p.trainRide,names=controllerButtonNames(p.controllerFamily||'generic'),key=p.device==='keyboard'?'E':names[3],jump=p.device==='keyboard'?'J':names[0];
 const ship=pirateShipPrompt(g,p);if(p.pirateRide||ship)return ship?key+' · '+ship:'';
 if(!r){
  const floo=alleyFlooPrompt(g,p);if(floo)return key+' · '+floo;
  const booth=nearbyTrainTicketBooth(g,p);if(booth)return key+' · TICKET OFFICE · '+booth.stationName.toUpperCase();
  const hogsmeade=hogsmeadePrompt(g,p);if(hogsmeade)return key+' · '+hogsmeade;
  const tideglass=tideglassPrompt(g,p);if(tideglass)return key+' · '+tideglass;
  const goblin=bayouGoblinPrompt(g,p);if(goblin)return key+' · '+goblin;
  const mystery=mysteryPrompt(g,p);if(mystery)return key+' · '+mystery;
  const magic=alleyPrompt(g,p)||owlPrompt(g,p);if(magic)return key+' · '+magic;
  const ice=nearbyNativeIce(g,p);if(ice)return key+' · '+(ice.kind==='winter_cache'?'WINTER SUPPLIES':'FROST BERRIES');
  const site=nearbyWildSite(g,p);
  if(site&&!t.wildExploration?.opened.has(site.id))return key+(site===VEIL_GLAIVE_CHEST?' · OPEN VEILKEEPER’S CHEST':' · SUPPLIES');
  const gate=wildLandsGatePrompt(g,p);if(gate)return key+' · '+gate;
  const home=wildHomesteadPrompt(g,p);if(home)return key+' · '+home;
  return '';
 }
 if(r.driving){
  if(p.device==='keyboard')return 'J LEAVE CONTROLS · W/S OR ↑↓ THROTTLE · F WHISTLE · SPACE BRAKE';
  const buttons=trainCabButtons(g.mapping),label=action=>names[buttons[action]]||'BUTTON '+buttons[action];
  return label('jump')+' LEAVE CONTROLS · LEFT STICK / D-PAD ↑↓ THROTTLE · '+label('attack')+' WHISTLE · '+label('dodge')+' BRAKE';
 }
 if(r.gangway)return 'GANGWAY · '+trainCarName(cs[r.car],true).toUpperCase()+' → '+trainCarName(cs[r.gangway.to],true).toUpperCase();
 const c=cs[r.car];
 if(r.seat)return key+' · STAND'+(t.passengerRest?.[p.id]?.resting?' · RESTING':'');
 if(nearbyTrainConductor(g,p,cs))return key+' · TALK TO CONDUCTOR';
 if(closerTrainCocoa(g,p,cs))return key+' · TAKE HOT CHOCOLATE';
 const student=nearbyTrainStudent(g,p,cs);if(student)return key+' · TALK TO '+student.name.toUpperCase();
 const tailor=nearbyTrainTailor(g,p,cs);if(tailor)return key+' · HOGWARTS ROBES';
 const objects=trainInterior(t.design,c);
 if(c.kind==='compartments'&&objects.filter(o=>o.kind==='table').slice(0,2).some(o=>!t.cocoaTaken.has(c.id+':'+o.id)&&Math.hypot(o.x-r.x,o.y-r.y)<30))return key+' · TAKE HOT CHOCOLATE';
 const aisle=nativeCompartmentAisle(t.design,c);
 const o=objects.find(o=>['door','console','seat'].includes(o.kind)&&Math.hypot(o.x-r.x,o.y-r.y)<30
  &&(o.kind!=='door'||nearCompartmentDoor(aisle,c,r,o)));
 return o?key+' · '+(o.kind==='console'?(t.engine?'STOP ENGINE':'START ENGINE'):o.kind==='door'?((t.doors[c.id+':'+o.id]??o.open)?'CLOSE DOOR':'OPEN DOOR'):'SIT'):Math.abs(r.x)>c.length/2-39?'WALK OUT · '+jump+' · JUMP OFF':'';
}

function tickRailwaySalvage(g,dt,inputs){
 for(const p of g.players){
  if(p.salvageFinish>0)p.salvageFinish=Math.max(0,p.salvageFinish-dt);
  const held=p.ui&&!isCharmed(p)&&(p.ui.salvagePointer||playerInput(g.players,p,inputs).salvage);
  if(held||p.salvageHold)tickSalvage(g,p,!!held,dt,railwayLootAnchor);
 }
}

export function tickTrainTest(g,dt,inputs){
 if(inDiagonArena(g)||inQuidditch(g)){
  const t=g.trainTest,previousTime=t.time;
  const result=inDiagonArena(g)?tickDiagonArena(g,dt,inputs):tickQuidditchScene(g,dt,inputs);
  if(t.time>previousTime){
   const elapsed=t.time-previousTime;
   tickNightCycle(g,elapsed);
   tickRailwaySalvage(g,elapsed,inputs);
  }
  if(t.railwayTicket&&t.time>previousTime){
   const previousDistance=t.distance,previousRoute=t.route,elapsed=t.time-previousTime;
   if(advanceRailwayTicket(g,elapsed)){
    tickTrainJunction(t,t.distance-previousDistance);tickTrainBridgeWater(g,elapsed,previousDistance);finishRailwayTicket(g);
    tickTrainJourney(g,elapsed,previousDistance,previousRoute,trainCars(t)[0]);
   }
  }
  return result;
 }
 const t=g.trainTest;if(!t)return false;const costs={};let markTime=performance.now();const mark=name=>{const now=performance.now();costs[name]=now-markTime;markTime=now;};syncStationAssets(g);mark('station-assets');if(inDiagon(g))g.house={walls:[],doors:[],furniture:[],floors:[],pools:[],vehicles:[]};if(t.preparing)return true;if(!['play','won'].includes(g.phase))return true;dt=Math.max(0,Math.min(dt,.05));t.time+=dt;g.time+=dt;const d=t.design;
 if(d.wildLands)tickNightCycle(g,dt);else if(g.sky)g.sky.elapsed=(g.sky.elapsed+dt)%480;
 tickLupin(g);tickWildLandsContent(g);tickAlley(g,dt);tickPirateShip(g,dt);tickTickTockCrocodile(g);tickMountainEncounters(g);tickWildBiomeSpawns(g);
 tickWildCoastalCritters(g,dt);
 tickShackBoggart(g);
 if(g.portals.length)tickPortalClosures(g,dt,g.portals.filter(d=>d.railwayScene&&privateStoragePortal(d)));
 tickCharmStatuses(g,dt);inputs=charmInputs(g,inputs);tickField(g,dt,inputs);g.tickWorldLoot?.(dt);tickGhosts(g,dt);tickHunterPets(g,dt,inputs);tickVillagers(g,dt);tickWildHomestead(g,dt,inputs);
 mark('globals');const previousDistance=t.distance,previousRoute=t.route,previousEngine=trainCars(t)[0];
 const previousSpeed=t.speed,ticketApproach=advanceRailwayTicket(g,dt);
 let delta=t.speed-previousSpeed;
 if(!ticketApproach){const target=unattendedTrainSpeed(g,dt);delta=clamp(target-t.speed,-trainBrakingPower(t)*dt,d.acceleration*dt);t.speed=Math.max(0,t.speed+delta);t.distance+=t.speed*dt;finishUnattendedStop(g);}
 tickTrainJunction(t,ticketApproach?t.distance-previousDistance:Math.max(0,t.speed*dt));
 tickTrainBridgeWater(g,dt,previousDistance);if(ticketApproach)finishRailwayTicket(g);
 const cs=trainCars(t);tickRailwayLoot(g,cs);tickTrainConductor(g,cs,dt,trainInteriorBlocked);tickChocolateFrogs(g,dt);tickStationOwls(g,dt);t.audioEngine=cs[0];tickTrainJourney(g,dt,previousDistance,previousRoute,cs[0]);tickTrainImpacts(g,previousEngine,cs[0]);mark('movement-impacts');tickStationCats(t,dt,g.players);mark('cats');
 if(t.speed>2&&t.time>(t.nextChuff||0)){cue(g,'chuff',cs[0]);t.nextChuff=t.time+Math.max(.09,26/(t.speed+25));}if(t.speed>12&&t.time>(t.nextClack||0)){cue(g,'clack',cs[2]);t.nextClack=t.time+Math.max(.16,65/t.speed);}
 if(t.driver&&!g.players.some(p=>p.id===t.driver&&p.trainRide?.driving)){t.driver=null;}
 for(const p of g.players){const old=t.previous.get(p.id)||{},input=trainPlayerInput(g,p,inputs,old),use=input.interact&&!old.interact,jump=input.jump&&!old.jump;t.previous.set(p.id,{...input});if(input.inventory&&!old.inventory){if(p.ui)p.ui=null;else g.openInventory?.(p);}
  tickEnergyBlade(g,p,dt);
  if(p.trainRide){const ride=p.trainRide,car=cs[ride.car];if(car){p.trainVisualLift=20+car.z;const carried=trainRiderWorld(cs,ride);p.x=carried.x;p.y=carried.y;if(ride.seat){p.faceX=Math.cos(car.a+ride.facing);p.faceY=Math.sin(car.a+ride.facing);}}}
  p.consumeInput=!!p.ui;tickPlayerIce(p,dt);const swordPause=g.tickPlayerCombatTimers?.(p,dt)||0;g.tickHeroVitals?.(p,dt);
  if(homesteadBoardHolds(g,p)){p.moving=false;p.walking=false;p.charge=0;continue;}
  if(p.mountainDescent&&advanceMountainDescent(g,p,dt)){p.trainVisualLift=p.trainGround;continue;}
  if(p.ui){
   p.charge=0;p.moving=false;
   if(p.ui.trainTicketStation)tickTrainTicketDialogue(g,p);
   if(p.ui?.trainConductor)tickTrainConductorDialogue(g,p);
   if(p.ui?.borginHeart&&!validBorginDialogue(g,p))p.ui=null;
   if(!p.ui)continue;
   if(p.ui.trainStudentGift&&(!p.trainRide||t.derailed))p.ui=null;
   else{
    if((p.ui.trainTicketStation||p.ui.trainConductor||p.ui.trainStudentGift||p.ui.alleyResident||p.ui.nocturneSpiderMerchant||p.ui.nocturneDarkWizard||p.ui.borginHeart||p.ui.bellglassDivination||p.ui.lupin||p.ui.pirateCrew||p.ui.bayouGoblin||p.ui.hogsmeadeNpc||p.ui.flooHearth||p.ui.mysteryVisitor)&&use&&!input.close)input.use=true;
    for(const action of ['close','next','prev','down','up','panel','use','offhand','sockets','store','drop','dropOne','pick','split']){
     if(!p.ui)break;
     if(input[action]&&!old[action])g.inventoryAction?.(p,action);
    }
   }
   continue;
  }
  if(tickRailwayStoragePlayer(g,p,input,old,dt))continue;
  let r=p.trainRide,c=r?cs[r.car]:null;const locomotionStep=p.step||0,motionStart=r?{car:r.car,x:r.x,y:r.y,gangway:!!r.gangway}:{x:p.x,y:p.y};let mx=clamp(input.x||0,-1,1),my=clamp(input.y||0,-1,1);const norm=Math.max(1,Math.hypot(mx,my));
  if(tickGardenBench(g,p,input,use,jump))continue;
  if(p.hp<=0){g.tickDownedPlayer?.(p,dt,inputs);p.moving=false;continue;}
  if(isCharmed(p)){tickCharmedPlayer(g,p,dt);continue;}
  if(p.stun>0||p.frozen>0||p.sleeping>0){p.moving=false;continue;}
  if(jump&&!p.trainRide&&!p.pirateRide&&!p.vehicleId&&!p.room&&!p.broomMount&&!p.wingHover){
   const ledge=mountainDescentLaunch(d,p,mx,my);
   if(ledge&&startJump(p)){
    beginMountainDescent(d,p,ledge);advanceMountainDescent(g,p,dt);p.trainVisualLift=p.trainGround;
    continue;
   }
  }
  if(tickWildHomesteadVehicle(g,p,input,old,dt,use))continue;
  const pick=input.loot&&!old.loot;
  const picked=pick?collectNearbyWorldLoot(g,p):use&&collectNearbyWorldLoot(g,p,true);
  if(input.controlCycle&&!old.controlCycle&&!p.trainRide)cycleFollowerControl(g,p);const controlled=controlledFollower(g,p);
  updateAimFacing(p,input);p.bowAiming=!!(input.block&&hasAimWeapon(p)&&!p.swimming&&!r?.seat&&!r?.driving);p.holdingPosition=!!input.holdPosition;updateBowAimBlend(p,input,dt);p.blocking=!!input.block&&!hasAimWeapon(p)&&itemKind(p.equipment?.hand2)==='shield';
  if(!r?.seat&&!r?.driving){g.tickWeaponInput?.(p,input,old,dt);if(input.potion&&!old.potion)g.usePotion?.(p);if(input.summon&&!old.summon)g.raiseSkeleton?.(p);if(input.trap)g.trap?.(p);}else p.charge=0;
  // Diving clears weapon charge every frame. A net can still scoop a nearby
  // coastal critter on release without enabling underwater weapon attacks.
  if(p.swimming&&old.attack&&!input.attack&&[p.equipment?.hand1,p.equipment?.hand2].includes('critter_net')&&
   catchableWildCoastalCritter(g,p))g.attack?.(p);
  p.walking=Math.hypot(mx,my)>0&&Math.hypot(mx,my)<.75;const motion=g.playerDashMotion?.(p,r?.seat||r?.driving?{...input,dodge:false}:input,dt,mx/norm,my/norm,controlled)||{x:mx/norm,y:my/norm,speed:133};mx=motion.x;my=motion.y;let moveScale=(p.bowAiming||p.holdingPosition||p.swordChargeAim||p.swordDash)?0:motion.speed;const swordProgress=1-(p.attack||0)/(p.attackDuration||.34),step=p.swordFacing&&!p.dashTime&&!p.dashRecovery&&!p.swimming&&!(p.jumpHeight>0)?swordStep(p.attackClip,p.swordPrevious,swordProgress):0;if(p.swordFacing&&p.attack>0){p.faceX=p.swordFacing.x;p.faceY=p.swordFacing.y;moveScale*=swordPause>0?0:swordProgress<.48?.48:.85;}
  if(!p.pirateRide){
   if(jump&&!p.broomMount){
    const underDeck=p.underBridge||p.swimming&&railwayWater(d,p.x,p.y)&&
     (bridgeSupportAt(t,p.x,p.y)||stationDeckAt(d,p.x,p.y)>0);
    if(r?.seat)stand(t,c,r);
    else if(r?.driving){delete r.driving;t.driver=null;mx=my=0;notice(t,'Controls released. Steam setting held.');}
    else if(!underDeck)startJump(p);
   }
   if(!input.jump)releaseJump(p);p.jumpHeld=!!input.jump;
   if(!tickBroomFlight(g,p,dt,broomTrainHover(p,cs,input.jump))&&!tickWingFlight(g,p,input,dt,0))tickJump(p,dt,g);
  }
  if(moveScale>0&&!p.dashTime&&!p.dashRecovery){const stride=jumpMotion(p,mx,my,moveScale,dt);if(stride){mx=stride.dx/(moveScale*dt);my=stride.dy/(moveScale*dt);}}
  if(step&&moveScale){mx+=(p.swordFacing?.x||0)*step/(moveScale*dt);my+=(p.swordFacing?.y||0)*step/(moveScale*dt);}
  const aboardShip=!!p.pirateRide;
  if(aboardShip)tickPirateShipPlayer(g,p,{x:mx*moveScale,y:my*moveScale},dt,use&&!picked);
  else if(r){
   if(r.driving){
    if(input.dodge&&!old.dodge)emergencyTrainBrake(g,p,c);
    if(t.engine&&!t.emergencyBrake)t.throttle=clamp(t.throttle-clamp(input.y||0,-1,1)*dt*.4,0,1);
    if(input.attack&&!old.attack&&t.speed>3&&t.time>(t.whistleUntil||0)){cue(g,'whistle',c);t.whistleUntil=t.time+2;}
   }
   else if(!r.seat){const dx=(Math.cos(c.a)*mx+Math.sin(c.a)*my)*moveScale*dt,dy=(-Math.sin(c.a)*mx+Math.cos(c.a)*my)*moveScale*dt;
    if(r.gangway){const [from,to]=trainGangwayEnds(cs,r),length=Math.max(1,dist(from,to)),axis={x:(to.x-from.x)/length,y:(to.y-from.y)/length};r.gangway.progress+=(mx*axis.x+my*axis.y)*moveScale*dt/length;r.y=clamp(r.y+dy,-10,10);if(r.gangway.progress>=1){const direction=r.gangway.direction;r.car=r.gangway.to;c=cs[r.car];r.x=-direction*(c.length/2-14);delete r.gangway;}else if(r.gangway.progress<=0){r.x=r.gangway.direction*(c.length/2-14);delete r.gangway;}}
    else{const wanted=r.x+dx,direction=Math.sign(wanted),nextIndex=r.car+(direction>0?-1:1),next=cs[nextIndex];
     if(next&&Math.abs(wanted)>c.length/2-14&&Math.abs(r.y)<12){const overshoot=Math.abs(wanted)-(c.length/2-14);r.x=direction*(c.length/2-14);r.gangway={to:nextIndex,direction,progress:0};const [a,b]=trainGangwayEnds(cs,r);r.gangway.progress=Math.min(1,overshoot/Math.max(1,dist(a,b)));}
     else{const outward=Math.sign(r.y||dy)*dy>0,edge=Math.abs(r.y+dy)>c.width/2,doorway=trainSideDoorway(c,r.x),clearsWall=(p.jumpHeight||p.groundHeight||0)>=trainSideWallHeight(c);
      if(outward&&edge&&(doorway||clearsWall)){r.y+=dy;leaveTrainCar(g,p,c,r);r=null;c=null;}else walkInside(t,c,r,dx,dy,p.jumpHeight||p.groundHeight||0);}
    }
   }
   if(use&&!picked&&p.trainRide&&!p.trainRide.gangway&&!trainInteraction(g,p,cs))collectNearbyWorldLoot(g,p);
   r=p.trainRide;if(r){c=cs[r.car];const q=trainRiderWorld(cs,r);p.x=q.x;p.y=q.y;p.moving=!r.seat&&!r.driving&&Math.hypot(mx,my)>.1;p.moveSpeed=p.moving?105:0;if(r.seat){p.faceX=Math.cos(c.a+r.facing);p.faceY=Math.sin(c.a+r.facing);}else if(p.moving&&!p.swordFacing&&!input.aimX&&!input.aimY){p.faceX=mx/(Math.hypot(mx,my)||1);p.faceY=my/(Math.hypot(mx,my)||1);}}
  }else{
   const previous={x:p.x,y:p.y};
   const motion=guideTrainApproach(g,t,p,cs,nativeWildIceMotion(g,p,mx,my,moveScale,dt),dt);
   g.moveActor(p,motion.dx,motion.dy);
   updateTrainWater(t,p,previous);
   const boarded=tryBoardTrain(g,p,cs,previous);
   if(!boarded)separateCarExterior(p,cs);
   p.moving=Math.hypot(mx,my)>.1;p.moveSpeed=p.moving?145:0;if(p.moving&&!p.swordFacing&&!input.aimX&&!input.aimY){p.faceX=mx/(Math.hypot(mx,my)||1);p.faceY=my/(Math.hypot(mx,my)||1);}
   if(!boarded&&!stepOntoPiratePlank(g,p,previous)){
    if(!(p.jumpHeight>0)&&use&&!picked){
     const room=d.activeRoom;
     if(!trainInteraction(g,p,cs))collectNearbyWorldLoot(g,p);
     if(d.activeRoom!==room)return true;
    }
   }
  }
  if(p.gardenBench)continue;
  if(!p.trainRide&&!p.pirateRide){p.trainVisualLift=p.trainGround||0;tickSwimBreath(g,p,input,dt);}
  g.tickMeleeContact?.(p);syncControlledFollower(g,p,dt);if(controlled){tickFollowerAttack(g,controlled,dt);controlled.jumpHeight=p.jumpHeight;controlled.jumpVelocity=p.jumpVelocity;}if(!p.ui)g.tickAutomaticLoot?.(p);
  if(!aboardShip&&!p.pirateRide){const end=p.trainRide,travel=end?(motionStart.car===end.car?Math.hypot(end.x-motionStart.x,end.y-motionStart.y):0):motionStart.car===undefined?Math.hypot(p.x-motionStart.x,p.y-motionStart.y):0;p.moving=(end?.gangway?Math.hypot(mx,my)>.1:travel>.02)&&!end?.seat&&!end?.driving;p.step=locomotionStep+(end?.gangway||motionStart.gangway?Math.hypot(mx,my)*moveScale*dt:travel)*.13;p.moveSpeed=dt>0?travel/dt:0;p.movementGait=p.moving?(p.walking?'walk':'run'):'idle';p.locomotionTransition=null;delete p.playerFrame;delete p.poseTime;}
 }
 if(d.activeRoom===HOLLOW_ROOM)tickHollowStalactites(g,dt);
 for(const p of g.players)tickEnergyMotionTail(g,p,dt);
 tickRailwayEnergyBurns(g,dt);
 if(t.railwayTicket)finishRailwayTicket(g);
 if(inDiagon(g))tickGardenPond(g,dt);
 tickBorginHeartPond(g);
 tickDiagonFootprints(g);mark('players');t.fallingScenery??=new Set();for(const o of g.scenery||[])if(o.falling)t.fallingScenery.add(o);if(t.fallingScenery.size){const view=Object.create(g);view.scenery=[...t.fallingScenery];tickSceneryFalls(view,dt);for(const o of t.fallingScenery)if(!o.falling)t.fallingScenery.delete(o);}
 tickDestruction(g,dt);tickNightEquipment(g,dt);
 // Actors may sample a pursuit line many times while the cars stay fixed for this tick.
 combatCollisionCars.set(t,{distance:t.distance,route:t.route});
 try{g.tickProjectiles?.(dt);g.tickCombatActors?.(dt);}finally{combatCollisionCars.delete(t);}
 if(d.wildLands)tickTracks(g);
 for(const fx of g.effects||[])fx.life-=dt;g.effects=(g.effects||[]).filter(f=>f.life>0);for(const trap of g.traps||[])trap.life-=dt;g.traps=(g.traps||[]).filter(f=>f.life>0);
 tickTrainRest(g,dt,cs);
 mark('combat-effects');for(const c of cs){const occupied=g.players.some(p=>p.trainRide?.car===c.index||p.trainRide?.gangway?.to===c.index),target=occupied?0:1;t.roof[c.id]=(t.roof[c.id]??1)+(target-(t.roof[c.id]??1))*(1-Math.exp(-dt*8));}
 if(delta<-.01&&t.speed>12&&t.time>(t.nextBrakeFx||0)){for(const car of cs.slice(0,3)){const q=trainWorld(car,0,d.gauge/2,2);emitGameplayFx(g,'brake',q,{life:.25,angle:car.a});}t.nextBrakeFx=t.time+.18;}
 // Bounded world-space exhaust, embers, piston steam and curve sparks.
 const emit=(q,kind,vx,vy,life,size)=>{if(t.particles.length<220)t.particles.push({x:q.x,y:q.y-(q.z||0),vx,vy,life,max:life,size,kind});};
 if(t.engine&&t.time>(t.nextSmoke||0)){const c=cs[0],q=trainWorld(c,c.length*.39,0,trainEngineProfile(c).stackTop);emit(q,'smoke',Math.cos(c.a)*t.speed*.3-12,Math.sin(c.a)*t.speed*.3-24,3.6,8+Math.sin(t.time*3)*2);emit(q,'ember',-Math.cos(c.a)*25+Math.sin(t.time*31)*10,-30,.8,2);t.nextSmoke=t.time+.075;}
 if(t.speed>8&&t.time>(t.nextSteam||0)){const c=cs[0];for(const side of[-1,1])emit(trainWorld(c,c.length*.32,side*c.width/2,9),'steam',-Math.sin(c.a)*side*15,Math.cos(c.a)*side*15-8,.5,5);t.nextSteam=t.time+.25;}
 if(t.speed>55&&t.time>(t.nextSpark||0)){for(const c of cs){const a=sampleTrainRoute(t.route,c.s-22),b=sampleTrainRoute(t.route,c.s+22),turn=Math.abs(Math.atan2(Math.sin(b.a-a.a),Math.cos(b.a-a.a)));if(turn>.025){const side=Math.sin(b.a-a.a)>0?1:-1;emit(trainWorld(c,c.length*.3,side*d.gauge/2,2),'spark',-Math.cos(c.a)*45,-20,.3,2);}}t.nextSpark=t.time+.1;}
 for(const p of t.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.kind==='smoke'){p.seed??=(Math.sin(p.x*3+p.y*7)+1)*50;const age=p.max-p.life;p.vx+=(-12+Math.sin(age*2+p.seed)*7-p.vx)*dt*.9;p.vy+=(-24+Math.cos(age*1.8+p.seed)*5-p.vy)*dt*.65;p.size+=dt*(7+age*2);}if(p.kind==='ember'||p.kind==='spark')p.vy+=dt*65;}t.particles=t.particles.filter(p=>p.life>0);
 if(!g.players.some(p=>p.hp>0))g.phase='lost';mark('exhaust');t.updateCosts=costs;
 tickRailwaySalvage(g,dt,inputs);
 return true;
}

export function requestTrainRoute(g,id){const t=g.trainTest;if(!t)return {ok:false,message:'Enter the train test first.'};const target=t.design.routes.find(r=>r.id===id);if(!target)return {ok:false,message:'Unknown railway route.'};if(id===t.route.id){t.pendingRoute=null;return {ok:true,message:'Current route retained.'};}const current=t.design.routes.find(r=>r.id===t.route.id);if(!target.nodes.some(id=>current.nodes.includes(id)))return {ok:false,message:'Routes need a shared track point to form a junction.'};buildTrainRoute(t.design,id);t.pendingRoute=id;notice(t,'Points set for '+target.name+'. The train changes route at the next shared junction.');return {ok:true,message:t.notice};}
function tickTrainJunction(t,travel){if(!t.pendingRoute||travel<=0)return;const active=t.design.routes.find(r=>r.id===t.route.id),target=t.design.routes.find(r=>r.id===t.pendingRoute),segment=t.routeSegments.at(-1),oldS=t.distance-travel+segment.offset;let best=null;for(const id of target.nodes.filter(id=>active.nodes.includes(id))){const n=t.design.nodes.find(n=>n.id===id),point=nearestTrainTrack(t.route,n.x,n.y),ahead=((point.s-oldS)%t.route.length+t.route.length)%t.route.length;if(ahead<=travel+.1&&(!best||ahead<best.ahead))best={n,ahead};}if(!best)return;const route=buildTrainRoute(t.design,target.id),point=nearestTrainTrack(route,best.n.x,best.n.y),at=t.distance-travel+best.ahead;t.routeSegments.push({at,route,offset:point.s-at});t.route=route;t.design.activeRoute=target.id;t.pendingRoute=null;t.otherRoutes=t.design.routes.filter(r=>r.id!==target.id).map(r=>buildTrainRoute(t.design,r.id));notice(t,'Junction passed: '+target.name+'. Each carriage follows through in order.');if(t.routeSegments.length>12&&t.distance-t.routeSegments[1].at>2200)t.routeSegments.shift();}

// Swimming is a lower traversal layer. Only a walker entering along the bridge
// from the bank acquires the deck; a swimmer never snaps up when crossing rails.
export function updateTrainWater(t,p,previous=p){
 if(t.design.activeRoom==='diagon'){
  p.trainDeck=false;p.underBridge=false;p.trainGround=0;
  p.swimming=p.hp>0&&!(p.jumpHeight>0)&&!p.broomMount&&!p.wingHover&&!p.vehicleId&&railwayWater(t.design,p.x,p.y);
  if(!p.swimming)p.diveDepth=0;
  return;
 }
 const d=t.design,q=[t.route,...(t.otherRoutes||[])].map(route=>nearestTrainTrack(route,p.x,p.y)).sort((a,b)=>a.distance-b.distance)[0];
 const surface=railwaySurface(d,p.x,p.y),water=surface!=='grass';
 const stationFloor=stationDeckAt(d,p.x,p.y),railSupport=bridgeSupportAt(t,p.x,p.y);
 const bridge=water&&(railSupport||stationFloor>0),deckHeight=bridge?Math.max(stationFloor,railElevation(d,q)):0;
 const oldDeck=p.trainDeck,oldGround=p.trainGround||0,airborne=p.jumpHeight>0;
 const fromBank=!railwayWater(d,previous.x,previous.y)&&!p.swimming;
 const clearsDeck=airborne&&p.jumpHeight+oldGround>=deckHeight;
 p.trainDeck=bridge&&(!!oldDeck||fromBank&&!airborne||clearsDeck);
 p.trainGround=water?(p.trainDeck?deckHeight:0):Math.max(d.wildLands?mountainHeight(d,p.x,p.y):0,stationFloor,q.distance<d.gauge/2+17&&railSupport?railElevation(d,q):0);
 // Move the airborne reference plane with the deck while preserving screen height.
 if(airborne&&(p.trainDeck||oldDeck))p.jumpHeight=Math.max(.01,p.jumpHeight+oldGround-p.trainGround);
 p.underBridge=bridge&&!p.trainDeck;
 p.swimming=surface==='water'&&!p.trainDeck&&!airborne;
 if(!p.swimming)p.diveDepth=0;
}

export function trainWorldBlocked(g,x,y,radius=7,flying=false,ignoreWater=false,height=0,projectile=false,from=null){
 if(inDiagonArena(g))return diagonArenaBlocked(x,y,radius);
 if(inQuidditch(g))return quidditchFieldBlocked(x,y,radius,height,g.trainTest.quidditch);
 const t=g.trainTest,d=t.design;if(inDiagon(g))return alleyBlocked(g,x,y,radius,projectile?null:from,height);if(alleyBlocked(g,x,y,radius))return true;if(x<radius||y<radius||x>d.width-radius||y>d.height-radius)return true;
 if(hogsmeadeBlocked(g,x,y,radius,height))return true;
 if(bayouGoblinHutBlocked(d,x,y,radius,height,from,projectile,flying))return true;
 if(!flying&&boardTableBlocked(g,x,y,radius,height,from))return true;
 if(from?.pirateRide)return pirateShipBlocked(g,x,y,radius,from,height);
 if(d.wildLands&&d.activeRoom===HOLLOW_ROOM&&mountainTerrainBlocked(d,x,y,radius))return true;
 if(!flying&&pirateShipBlocked(g,x,y,radius,from,height))return true;
 if(from?.trainRide){const c=collisionCars(t)[from.trainRide.car],q=trainLocal(c,{x,y});return trainInteriorBlocked(t,c,q.x,q.y,null,height);}
 if(!projectile&&from&&(!(from.underBridge||from.swimming)||railwaySurface(d,from.x,from.y)==='grass')){
  const elevation=height+(from.trainGround||0),airborne=height>(from.groundHeight||0);
  if(collisionCars(t).some(c=>blocksCarExterior(c,trainLocal(c,{x,y}),radius,elevation,airborne)))return true;
 }
 if(projectile)for(const c of collisionCars(t)){const q=trainLocal(c,{x,y});if(Math.abs(q.x)>c.length/2+radius||Math.abs(q.y)>c.width/2+radius)continue;if(Math.abs(q.y)>c.width/2-5-radius&&!trainSideDoorway(c,q.x)||Math.abs(q.x)>c.length/2-5-radius&&Math.abs(q.y)>12)return true;if(c.kind==='engine'&&q.x>-c.length*.07&&Math.abs(q.y)<c.width/2-16)return true;for(const item of trainInterior(d,c)){const o=item.kind==='door'?trainDoorGeometry(item,t.doors[c.id+':'+item.id]??item.open):item;if(!['wall','door','console','firebox','table'].includes(o.kind))continue;if(Math.abs(q.x-o.x)<o.w/2+radius&&Math.abs(q.y-o.y)<o.h/2+radius)return true;}}
 const descent=from?.mountainDescent&&mountainDescentCorridor(d,from,x,y);
 if(d.wildLands&&from&&!projectile&&!descent&&Math.abs(mountainHeight(d,from.x,from.y)-mountainHeight(d,x,y))>18)return true;
 if(flying)return d.wildLands&&!d.activeRoom&&!descent&&mountainTerrainBlocked(d,x,y,radius);
 if(!ignoreWater&&railwaySurface(d,x,y)==='water')return true;
 if(d.wildLands&&!descent&&wildLandsBlocked(d,x,y,t,radius))return true;
 const authored=d.wildLands&&(d.activeRoom===HOLLOW_ROOM||!d.activeRoom&&(mountainLand(x,y)||mountainTrail(x,y)));
 return !!(stationBlocked(d,x,y,radius,height)||structureBlocked(g,x,y,radius,false,0,height,projectile,from,flying)||!authored&&railwayForestBlocked(t,x,y,projectile?null:from));
}

export function moveTrainRider(g,p,dx,dy){
 const r=p.trainRide,c=trainCars(g.trainTest)[r.car];if(!c||r.seat||r.driving||r.gangway)return 0;const old={x:r.x,y:r.y};walkInside(g.trainTest,c,r,Math.cos(c.a)*dx+Math.sin(c.a)*dy,-Math.sin(c.a)*dx+Math.cos(c.a)*dy,p.jumpHeight||p.groundHeight||0);const world=trainWorld(c,r.x,r.y);p.x=world.x;p.y=world.y;return Math.hypot(r.x-old.x,r.y-old.y);
}

function trainPlayerInput(g,p,inputs,old){const input={...playerInput(g.players,p,inputs)};if(p.broomMount&&!p.ui){if(input.loot&&!old.loot)dismountBroom(g,p);for(const key of ['attack','dodge','block','trap','controlCycle','interact'])input[key]=false;}return input;}
