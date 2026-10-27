import {vehicleWaterTarget,startVehicleSplash,tickVehicleWaterParticles} from './vehicle-water.mjs';
import {waterAt,isShallow,propBase} from './environment.mjs';
import {setTreeFallDirection} from './tree-fall.mjs';
import {damageStructureVehicle} from './structure-destruction.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {stationaryCreature} from './stationary-creatures.mjs';

export const VEHICLE_SEATS=Object.freeze([
 {id:'driver',label:'Driver',side:'left',x:-22,y:-34},
 {id:'front',label:'Front passenger',side:'right',x:22,y:-34},
 {id:'rear-left',label:'Rear left',side:'left',x:-22,y:30},
 {id:'rear-right',label:'Rear right',side:'right',x:22,y:30},
]);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const seatPoint=(v,seat)=>{const s=VEHICLE_SEATS.find(q=>q.id===seat)||VEHICLE_SEATS[0],a=v.heading||0,c=Math.cos(a),d=Math.sin(a);return {x:v.x+c*s.x-d*s.y,y:v.y+d*s.x+c*s.y};};
const occupiedSeats=v=>v.seats||(v.seats={});
const hoodPoint=v=>({x:v.x+Math.sin(v.heading||0)*(v.h||128)*.62,y:v.y-Math.cos(v.heading||0)*(v.h||128)*.62});
export function houseChestFor(g,p){return (g.house?.furniture||[]).find(f=>f.kind==='chest'&&!f.opened&&distance(p,{x:f.x+f.w/2,y:f.y+f.h/2})<62)||null;}
export function openHouseChest(g,p){const chest=houseChestFor(g,p);if(!chest)return false;chest.opened=true;for(const item of chest.loot||[])g.dropLoot(chest.x+chest.w/2,chest.y+chest.h+14,item.type,item.qty||1,chest.chestId,true);g.onSound?.('loot',chest);g.message(chest.chestId==='house-engine-part'?'Garage chest opened. You found spare supplies.':'Bedroom chest opened. You found a car key.');g.persist?.();return true;}
export function vehicleForPoint(g,p){return (g.house?.vehicles||[]).find(v=>distance(p,v)<Math.max(72,(v.w||80)*.8)||distance(p,hoodPoint(v))<70)||null;}
export function interactHouseVehicle(g,p){return enterOrExitHouseVehicle(g,p);}
export function tryInstallVehiclePart(g,p,index){const item=p.inventory?.[index],v=vehicleForPoint(g,p);if(item?.type!=='car_engine_part'||!v||!v.hoodOpen||v.enginePartInstalled)return false;item.qty--;if(item.qty<=0)p.inventory[index]=null;v.enginePartInstalled=true;g.message('Optional engine spare fitted. The car is ready to drive.');g.onSound?.('repairDone',v);g.persist?.();return true;}
export function houseVehicleForPlayer(g,p){return (g.house?.vehicles||[]).find(v=>Object.values(v.seats||{}).includes(p.id)||v.occupiedBy===p.id)||null;}
export function vehicleDriver(g,v){const id=occupiedSeats(v).driver||v.occupiedBy;return (g.players||[]).find(p=>p.id===id)||null;}
export function vehicleSeatForPlayer(v,p){return Object.entries(v.seats||{}).find(([,id])=>id===p.id)?.[0]||null;}
export function vehiclePassengers(g,v){return Object.entries(v.seats||{}).filter(([seat])=>seat!=='driver').map(([,id])=>g.players.find(p=>p.id===id)).filter(Boolean);}
export function enterOrExitHouseVehicle(g,p){
 const current=houseVehicleForPlayer(g,p);
 if(current?.submerging){g.message('The car is going under…');return true;}
 if(current){const seat=vehicleSeatForPlayer(current,p)||'driver',v=seatPoint(current,seat),a=current.heading||0;const preferred=seat.includes('right')?Math.PI/2:-Math.PI/2,exitAngle=[preferred,preferred+Math.PI].find(angle=>!g.blocked(v.x+Math.cos(a+angle)*42,v.y+Math.sin(a+angle)*42,10,false,false,false,14));if(current.speed&&Math.abs(current.speed)>18){g.message('Stop the car before getting out.');return true;}if(exitAngle===undefined){g.message('There is no room to get out here.');return true;}const exit={x:v.x+Math.cos(a+exitAngle)*42,y:v.y+Math.sin(a+exitAngle)*42};delete occupiedSeats(current)[seat];p.vehicleId=null;p.vehicleSeat=null;p.x=exit.x;p.y=exit.y;p.moving=false;current.occupiedBy=occupiedSeats(current).driver||null;g.message('You got out of the car.');return true;}
 const vehicle=(g.house?.vehicles||[]).find(v=>v.occupiable!==false&&!v.submerging&&!(v.sink>0)&&(distance(p,v)<Math.max(72,(v.w||80)*.8)||distance(p,hoodPoint(v))<70)&&VEHICLE_SEATS.some(s=>!(v.seats||{})[s.id]));if(!vehicle)return false;const seats=occupiedSeats(vehicle),seat=VEHICLE_SEATS.find(s=>!seats[s.id])?.id;if(!seat)return false;seats[seat]=p.id;p.vehicleId=vehicle.id;p.vehicleSeat=seat;p.x=vehicle.x;p.y=vehicle.y;p.moving=false;vehicle.occupiedBy=seats.driver||null;if(seat==='driver'){vehicle.hoodOpen=false;vehicle.engineOn=true;vehicle.engineWarning=false;vehicle.keyWarning=false;vehicle.engineStart=.35;g.onSound?.('engineStart',vehicle);}p.jumpHeight=0;p.jumpVelocity=0;p.jumpHeld=false;p.dashTime=0;p.dashRecovery=0;p.charge=0;p.bowAiming=false;p.swimming=false;delete p.queuedAttack;g.message(seat==='driver'?'You are driving. Stick left/right: steer. Bottom face: gas. Left face: reverse gas. Opposite pedal brakes before changing direction. Keyboard: W/S gas and brake/reverse; A/D steer.':'Passenger seat occupied. Aim and fire through the window.');return true;
}
export function toggleGarageDoor(g,p){const b=(g.house?.furniture||[]).find(f=>f.kind==='garage_button'&&distance(p,{x:f.x+f.w/2,y:f.y+f.h/2})<58);if(!b)return false;const d=(g.house?.doors||[]).find(d=>d.kind==='garage');if(!d)return false;d.open=!d.open;g.message(d.open?'Garage door opened.':'Garage door closed.');g.onSound?.(d.open?'doorOpen':'doorClose',p);return true;}
export function vehicleMotion(g,p,input,dt){
 const v=houseVehicleForPlayer(g,p);if(!v||vehicleDriver(g,v)!==p)return {dx:0,dy:0};
 if(v.submerging){v.speed=0;v.engineOn=false;return {dx:0,dy:0};}
 const pad=p.device?.startsWith('pad:'),keyboard=clamp(-(input.y||0),-1,1);
 const gas=pad?clamp(input.vehicleGas||0,0,1):Math.max(0,keyboard);
 const brake=pad?clamp(input.vehicleBrake||0,0,1):Math.max(0,-keyboard);
 const reversing=pad?brake>gas:keyboard<0;
 const steer=clamp(input.x||0,-1,1),water=waterAt(g,v.x,v.y),deep=water==='water',shallow=isShallow(water);
 v.speed??=0;v.heading??=0;v.wheelAngle??=0;
 const wantsPower=pad?gas>0||brake>0:keyboard!==0;
 if(wantsPower&&!v.engineOn){
  v.engineOn=true;v.engineWarning=false;v.keyWarning=false;v.engineStart=.35;g.onSound?.('engineStart',v);g.message('The engine starts.');
 }
 // Each face position accelerates its direction; opposing power brakes first.
 const both=pad&&gas>0&&brake>0;
 const power=pad?Math.abs(gas-brake):reversing?brake:gas,targetSign=reversing?-1:1;
 const opposing=power>0&&v.speed*targetSign<0;
 v.braking=both||opposing||(!pad&&reversing&&v.speed>0);
 const oldSpeed=v.speed;
 if(both||opposing){
  const strength=both?Math.max(gas,brake):power;
  v.speed=Math.sign(v.speed)*Math.max(0,Math.abs(v.speed)-(v.brakePower||270)*strength*dt);
 }else if(power>0&&v.engineOn){
  v.speed=clamp(v.speed+targetSign*(reversing?(v.reverseAcceleration||95):(v.acceleration||150))*power*dt,-(v.reverseSpeed||105),v.maxSpeed||280);
 }else v.speed*=Math.exp(-(v.coastDrag||1.8)*dt);
 if(Math.abs(v.speed)<.1)v.speed=0;
 if(shallow||deep)v.speed*=Math.exp(-(deep?3.5:1.8)*dt);
 v.reverse=v.speed<-.1;
 const maxSteer=(v.maxSteer??.58)/(1+Math.abs(v.speed)/240);
 v.wheelAngle+=(steer*maxSteer-v.wheelAngle)*(1-Math.exp(-dt*(v.steeringResponse||8)));
 // Front-wheel traction drives a bicycle model. Move the rear axle, then
 // reconstruct the body center: the rear follows the steered front wheels.
 const wheelBase=v.wheelBase||((v.h||144)*.58),oldHeading=v.heading;
 const travel=(oldSpeed+v.speed)*.5*Math.cos(v.wheelAngle)*dt;
 const turn=travel/wheelBase*Math.tan(v.wheelAngle),mid=oldHeading+turn*.5;
 v.heading=oldHeading+turn;v.steer=steer;v.moving=Math.abs(v.speed)>5;v.wet=shallow;
 return {dx:Math.sin(mid)*travel+(Math.sin(v.heading)-Math.sin(oldHeading))*wheelBase*.5,
  dy:-Math.cos(mid)*travel-(Math.cos(v.heading)-Math.cos(oldHeading))*wheelBase*.5};
}
export function vehicleColliderBlocked(g,p,x,y){
 const v=houseVehicleForPlayer(g,p);if(!v)return false;
 const a=v.heading||0,r=(v.w||96)*.42,axle=(v.h||144)*.24;
 return [-axle,0,axle].some(offset=>g.blocked(x-Math.sin(a)*offset,y+Math.cos(a)*offset,r,false,true,false,0,0,false,p));
}
export function hitVehicleTree(g,p,oldX,oldY){
 const v=houseVehicleForPlayer(g,p),speed=Math.abs(v?.speed||0);if(!v||speed<14||v.effects?.hitCooldown>0)return false;
 const a=v.heading||0,c=Math.cos(a),s=Math.sin(a),tree=(g.scenery||[]).find(t=>{
  if(t.falling||t.fallen||t.depleted||!['tree','snow_tree','palm','leafless_tree','grave_forest_tree'].includes(t.kind))return false;
  const b=propBase(t),dx=b.x-v.x,dy=b.y-v.y,r=Math.max(8,(t.size||64)*.1);
  return Math.abs(c*dx+s*dy)<(v.w||96)*.5+r+6&&Math.abs(-s*dx+c*dy)<(v.h||144)*.5+r+6;
 });if(!tree)return false;
 const sign=Math.sign(v.speed)||1,dx=p.x-oldX||s*sign,dy=p.y-oldY||-c*sign;
 if(speed>110){tree.falling=.001;setTreeFallDirection(tree,dx,dy);tree.harvest=tree.maxHarvest||Math.round(tree.size*.85);tree.logCount=Math.max(2,Math.round(tree.size/32));tree.hitAt=g.time;}
 v.effects??={tracks:[],splashes:[],hitCooldown:0};v.effects.hitCooldown=.45;v.damage=(v.damage||0)+speed*.025;v.speed*=-.12;g.onSound?.('carHit',v);return true;
}
export function syncHouseVehicle(g,p){const v=houseVehicleForPlayer(g,p);if(!v)return;v.x=p.x;v.y=p.y;v.moving=Math.abs(v.speed||0)>5;p.faceX=Math.sin(v.heading||0);p.faceY=-Math.cos(v.heading||0);v.occupants={...occupiedSeats(v)};}
export function tickVehicleEffects(g,v,dt){
 v.waterProbe=Math.max(0,(v.waterProbe||0)-dt);
 if(v.waterProbe===0&&v.occupiable!==false&&(v.submerging||waterAt(g,v.x,v.y)==='water')){
  const target=vehicleWaterTarget(g,v);v.waterProbe=.3;if(target){v.waterEntry={fromX:v.x,fromY:v.y,fromHeading:v.heading||0,...target,progress:0};v.submerging=true;v.occupiable=false;v.engineOn=false;v.moving=false;}
  if(v.submerging)g.message?.('The car is sinking…');
 }
 let sinkingDt=dt;
 if(v.waterEntry&&v.waterEntry.progress<1){const e=v.waterEntry,remaining=(1-e.progress)*.55;e.progress=Math.min(1,e.progress+dt/.55);const t=e.progress*e.progress*(3-2*e.progress);v.x=e.fromX+(e.x-e.fromX)*t;v.y=e.fromY+(e.y-e.fromY)*t;const turn=Math.atan2(Math.sin(e.heading-e.fromHeading),Math.cos(e.heading-e.fromHeading));v.heading=e.fromHeading+turn*t;for(const id of Object.values(v.seats||{})){const rider=g.players?.find(p=>p.id===id);if(rider){rider.x=v.x;rider.y=v.y;}}sinkingDt=Math.max(0,dt-remaining);if(e.progress===1){startVehicleSplash(v);g.onSound?.('splash',v);}}
 if(v.submerging){v.sink=Math.min(1,(v.sink||0)+sinkingDt/3);v.speed=0;
  if(v.sink>=1&&!v.ridersEjected){
  const riders=Object.entries(v.seats||{});if(v.occupiedBy!=null&&!riders.some(([,id])=>id===v.occupiedBy))riders.push(['driver',v.occupiedBy]);
  for(const [seat,id]of riders){const p=g.players?.find(p=>p.id===id);if(!p)continue;const exit=seatPoint(v,seat);Object.assign(p,{vehicleId:null,vehicleSeat:null,x:exit.x,y:exit.y,moving:false,jumpHeight:0,jumpVelocity:0,groundHeight:0,diving:false});p.swimming=waterAt(g,p.x,p.y)==='water';}
  v.seats={};v.occupants={};v.occupiedBy=null;g.message?.('The car has gone under. Swim to safety!');v.ridersEjected=true;
  }
 }
 v.effects??={tracks:[],splashes:[],hitCooldown:0};v.effects.hitCooldown=Math.max(0,v.effects.hitCooldown-dt);v.effects.structureCooldown=Math.max(0,(v.effects.structureCooldown||0)-dt);v.engineStart=Math.max(0,(v.engineStart||0)-dt);if(v.engineOn){v.engineSoundTimer=(v.engineSoundTimer||0)-dt;if(v.engineSoundTimer<=0&&Math.abs(v.speed||0)>2){v.engineSoundTimer=.7;g.onSound?.('engineRun',v);}}if(!v.submerging)v.sink=Math.max(0,(v.sink||0)-dt*.35);if(v.submerging&&v.sink<1){v.effects.sinkRipple=(v.effects.sinkRipple||0)-dt;if(v.effects.sinkRipple<=0){v.effects.sinkRipple=.3;v.effects.splashes.push({x:v.x,y:v.y,life:.6});}}const rear=(side)=>{const a=v.heading||0,lx=side*(v.w||96)*.47,ly=(v.h||144)*.28;return {x:v.x+Math.cos(a)*lx-Math.sin(a)*ly,y:v.y+(Math.sin(a)*lx+Math.cos(a)*ly)*.72};};const wheels=[rear(-1),rear(1)];v.effects.trackTimer=(v.effects.trackTimer||0)-dt;if(Math.abs(v.speed||0)>8&&!v.wet&&!v.submerging&&v.effects.trackTimer<=0){v.effects.trackTimer=.06;for(let i=0;i<2;i++){const now=wheels[i],old=v.effects.lastWheels?.[i];if(old&&distance(old,now)>1&&distance(old,now)<90)v.effects.tracks.push({x:old.x,y:old.y,x2:now.x,y2:now.y,angle:v.heading||0,life:6,skid:Math.abs(v.steer||0)>.55});}v.effects.lastWheels=wheels;}else if(Math.abs(v.speed||0)<=8||v.wet||v.submerging)v.effects.lastWheels=wheels;if(v.wet&&Math.abs(v.speed||0)>12){v.effects.splashTimer=(v.effects.splashTimer||0)-dt;if(v.effects.splashTimer<=0){v.effects.splashTimer=.12;v.effects.splashes.push({x:v.x,y:v.y,life:.6});}}for(const t of v.effects.tracks)t.life-=dt;v.effects.tracks=v.effects.tracks.filter(t=>t.life>0).slice(-480);tickVehicleWaterParticles(v,dt);for(const s of v.effects.splashes)s.life-=dt;v.effects.splashes=v.effects.splashes.filter(s=>s.life>0).slice(-60);}
export function vehicleBumper(v,sign=Math.sign(v.speed)||1){
 const fx=Math.sin(v.heading||0)*sign,fy=-Math.cos(v.heading||0)*sign;
 return {x:v.x+fx*(v.h||144)*.5,y:v.y+fy*(v.h||144)*.5,faceX:fx,faceY:fy};
}
export function resolveVehicleImpact(g,p,oldX,oldY){
 const v=houseVehicleForPlayer(g,p);if(!v)return;const speed=Math.abs(v.speed||0);if(speed<14)return;
 v.effects??={tracks:[],splashes:[],hitCooldown:0};
 const bumper=vehicleBumper(v),fx=bumper.faceX,fy=bumper.faceY;
 if((v.effects.structureCooldown||0)<=0&&damageStructureVehicle(g,bumper,speed,(v.w||96)*.47)){
  v.effects.structureCooldown=.18;v.damage=(v.damage||0)+speed*.018;
  // A hard impact slows the car without flipping its travel direction.
  v.speed*=speed>160?.68:.35;g.onSound?.('carHit',v);
 }
 if(v.effects.hitCooldown>0)return;
 const enemy=(g.enemies||[]).find(e=>e.hp>0&&!e.room&&Math.hypot(e.x-bumper.x,e.y-bumper.y)<(v.w||96)*.5+18||e.hp>0&&!e.room&&Math.hypot(e.x-p.x,e.y-p.y)<(v.w||96)*.5);
 if(enemy){v.effects.hitCooldown=.35;const amount=5+speed*.12+speed*speed*.002;
  damageEnemy(enemy,amount,'physical',{g,p});if(!stationaryCreature(enemy)){enemy.x+=fx*Math.min(70,speed*.22);enemy.y+=fy*Math.min(70,speed*.22);}enemy.stun=Math.max(enemy.stun||0,.15+speed/900);g.effects?.push({x:enemy.x,y:enemy.y,text:'CAR HIT',color:'#ffd58a',life:.5});g.onSound?.('carHit',v);
 }
}
