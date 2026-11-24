import {houseLivingTarget,interactHouseLiving,tickHouseLiving} from './house-living.mjs';
import {houseLightOn,isHouseLight,toggleWorldLight} from './house-lights.mjs';
import {interactHouseSurface,surfaceAction} from './house-surfaces.mjs';
import {
 houseChestFor,houseVehicleEntry,houseVehicleForPlayer,hitVehicleTree,interactHouseVehicle,
 openHouseChest,resolveVehicleImpact,syncHouseVehicle,tickVehicleEffects,toggleGarageDoor,
 vehicleDriver,vehicleMotion,
} from './house-vehicles.mjs';
import {wildHomesteadAt} from './wild-homestead-layout.mjs';
import {homesteadBoardPrompt,interactHomesteadBoard,tickHomesteadBoard} from './homestead-board.mjs';

const available=g=>g.trainTest?.design.wildLands&&!g.trainTest.design.activeRoom;
const nearby=(p,b,radius=60)=>Math.hypot(p.x-b.x-b.w/2,p.y-b.y-b.h/2)<radius;
const onFoot=p=>!p.trainRide&&!p.pirateRide&&!p.vehicleId&&!p.broomMount&&!p.wingHover&&!p.room&&!p.swimming&&p.hp>0&&!(p.jumpHeight>2);

function canUseHome(g,p){
 return onFoot(p)&&wildHomesteadAt(g.trainTest?.design,p.x,p.y,74);
}

export function interactWildHomestead(g,p){
 if(!available(g))return false;
 if(p.vehicleId)return interactHouseVehicle(g,p);
 if(!onFoot(p))return false;
 const nearHome=canUseHome(g,p);
 if(nearHome&&toggleGarageDoor(g,p))return true;
 if(houseVehicleEntry(g,p))return interactHouseVehicle(g,p);
 if(!nearHome)return false;
 return interactHomesteadBoard(g,p)||openHouseChest(g,p)||interactHouseLiving(g,p)
  ||interactHouseSurface(g,p)||toggleWorldLight(g,p);
}

export function wildHomesteadPrompt(g,p){
 if(!available(g))return '';
 if(p.vehicleId||p.bedRest)return '';
 if(!onFoot(p))return '';
 const nearHome=canUseHome(g,p);
 const furniture=g.house?.furniture||[],doors=g.house?.doors||[];
 if(nearHome&&furniture.some(f=>f.kind==='garage_button'&&nearby(p,f,58)))return 'GARAGE DOOR';
 if(houseVehicleEntry(g,p))return 'ENTER CAR';
 if(!nearHome)return '';
 const board=homesteadBoardPrompt(g,p);if(board)return board;
 if(houseChestFor(g,p))return 'OPEN CHEST';
 const living=houseLivingTarget(g,p);
 if(living?.kind==='bed')return 'REST';
 if(living?.kind==='wrapped_gift')return 'UNWRAP GIFT';
 if(living)return (living.kind==='sink'?'TAP ':'STOVE ')+(living.applianceOn?'OFF':'ON');
 const lamp=furniture.find(f=>isHouseLight(f)&&nearby(p,f,65));
 const door=doors.find(d=>!d.destroyed&&nearby(p,d,64));
 const table=surfaceAction(g,p);
 if(table)return table.prop.lit?'EXTINGUISH CANDLE':'LIGHT CANDLE';
 if(lamp)return houseLightOn(g,lamp)?'LIGHT OFF':'LIGHT ON';
 return door?(door.open?'CLOSE DOOR':'OPEN DOOR'):'';
}

export function tickWildHomestead(g,dt,inputs){
 if(!available(g))return;
 tickHomesteadBoard(g,dt);
 tickHouseLiving(g,dt,inputs);
 for(const vehicle of g.house?.vehicles||[])tickVehicleEffects(g,vehicle,dt);
}

export function tickWildHomesteadVehicle(g,p,input,old,dt,use){
 if(!p.vehicleId||!available(g))return false;
 const vehicle=houseVehicleForPlayer(g,p);
 if(!vehicle){p.vehicleId=null;p.vehicleSeat=null;return false;}
 if(use){interactHouseVehicle(g,p);return true;}
 p.walking=false;p.moving=false;p.moveSpeed=0;
 if(vehicleDriver(g,vehicle)!==p){
  p.x=vehicle.x;p.y=vehicle.y;g.tickWeaponInput?.(p,input,old,dt);return true;
 }
 const x=p.x,y=p.y,{dx,dy}=vehicleMotion(g,p,input,dt);
 g.moveActor(p,dx,dy);syncHouseVehicle(g,p);hitVehicleTree(g,p,x,y);resolveVehicleImpact(g,p,x,y);
 return true;
}
