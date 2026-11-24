import {trainCars,trainRiderWorld} from './train-track.mjs';
import {pirateShip,pirateShipPoint,piratePlankHeight,PIRATE_SHIP_LAYOUT} from './pirate-ship.mjs';

function positionOnTrain(cars,surface){
 if(!cars[surface.car]||surface.gangway&&!cars[surface.gangway.to])return null;
 const {x,y,z}=trainRiderWorld(cars,surface);
 return {x,y,railwayLootLift:20+z};
}

function positionOnShip(ship,surface){
 if(ship?.id!==surface.shipId)return null;
 const {x,y}=pirateShipPoint(ship,surface.x,surface.y);
 const nest=PIRATE_SHIP_LAYOUT.nests.find(nest=>nest.id===surface.nest);
 const floor=surface.level==='hold'?PIRATE_SHIP_LAYOUT.holdZ:nest?.z??PIRATE_SHIP_LAYOUT.deckZ;
 return {x,y,railwayLootLift:surface.level==='plank'?piratePlankHeight(ship,surface.y):floor+ship.z};
}

export function railwayLootAnchor(g,p){
 if(!g.trainTest)return null;
 const train=p.trainRide,ride=p.pirateRide;
 if(train){
  const {car,x,y,gangway}=train;
  const railwaySurface={kind:'train',car,x,y,...(gangway?{gangway:{...gangway}}:{})};
  const position=positionOnTrain(trainCars(g.trainTest),railwaySurface);
  return position&&{...position,railwaySurface};
 }
 if(ride){
  const ship=pirateShip(g);
  if(!ship)return null;
  const {x,y}=ride;
  const level=ride.level==='rope'?'deck':ride.level;
  const railwaySurface={kind:'ship',shipId:ship.id,x,y,level,...(level==='nest'?{nest:ride.nest}:{})};
  return {...positionOnShip(ship,railwaySurface),railwaySurface};
 }
 return null;
}

export function tickRailwayLoot(g,cars){
 for(const item of g.loot||[]){
  const surface=item.railwaySurface;
  if(!surface)continue;
  const position=surface.kind==='train'?positionOnTrain(cars,surface):positionOnShip(pirateShip(g),surface);
  if(position)Object.assign(item,position);
 }
}

export function canReachRailwayLoot(p,item){
 const surface=item.railwaySurface;
 if(!surface)return !p.trainRide&&!p.pirateRide;
 if(surface.kind==='train'){
  const ride=p.trainRide;
  return !!ride&&(ride.car===surface.car||ride.gangway?.to===surface.car||
   !!surface.gangway&&(ride.car===surface.gangway.to||ride.gangway?.to===surface.gangway.to));
 }
 const ride=p.pirateRide;
 if(!ride||ride.shipId!==surface.shipId||ride.level==='rope')return false;
 if(surface.level==='hold'||ride.level==='hold')return surface.level===ride.level;
 if(surface.level==='nest'||ride.level==='nest')return surface.level===ride.level&&surface.nest===ride.nest;
 return true;
}
