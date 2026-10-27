import {waterAt,isShallow} from './environment.mjs';
import {damageStructureMelee} from './structure-destruction.mjs';
import {damageEnemy} from './enemy-damage.mjs';

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
const inventoryHas=(p,type)=>!!(p.inventory||[]).some(i=>i?.type===type&&i.qty>0);
export function houseChestFor(g,p){return (g.house?.furniture||[]).find(f=>f.kind==='chest'&&!f.opened&&distance(p,{x:f.x+f.w/2,y:f.y+f.h/2})<62)||null;}
export function openHouseChest(g,p){const chest=houseChestFor(g,p);if(!chest)return false;chest.opened=true;for(const item of chest.loot||[])g.dropLoot(chest.x+chest.w/2,chest.y+chest.h+14,item.type,item.qty||1,chest.chestId,true);g.onSound?.('loot',chest);g.message(chest.chestId==='house-engine-part'?'Garage chest opened. Find the replacement engine part.':'Bedroom chest opened. You found a car key.');g.persist?.();return true;}
export function vehicleForPoint(g,p){return (g.house?.vehicles||[]).find(v=>distance(p,v)<Math.max(72,(v.w||80)*.8)||distance(p,hoodPoint(v))<70)||null;}
export function interactHouseVehicle(g,p){const v=vehicleForPoint(g,p);if(!v)return false;const hood=hoodPoint(v);if(Math.hypot(p.x-hood.x,p.y-hood.y)<58&&!p.vehicleId){v.hoodOpen=!v.hoodOpen;g.message(v.hoodOpen?(v.enginePartInstalled?'The hood is open. The engine is ready.':'The hood is open. Select the replacement engine part in your inventory and press Use.'):'You closed the hood.');g.onSound?.(v.hoodOpen?'doorOpen':'doorClose',v);return true;}return enterOrExitHouseVehicle(g,p);}
export function tryInstallVehiclePart(g,p,index){const item=p.inventory?.[index],v=vehicleForPoint(g,p);if(item?.type!=='car_engine_part'||!v||!v.hoodOpen||v.enginePartInstalled)return false;item.qty--;if(item.qty<=0)p.inventory[index]=null;v.enginePartInstalled=true;g.message('Engine part installed. Close the hood, then use the driver seat with the car key.');g.onSound?.('repairDone',v);g.persist?.();return true;}
export function houseVehicleForPlayer(g,p){return (g.house?.vehicles||[]).find(v=>Object.values(v.seats||{}).includes(p.id)||v.occupiedBy===p.id)||null;}
export function vehicleDriver(g,v){const id=occupiedSeats(v).driver||v.occupiedBy;return (g.players||[]).find(p=>p.id===id)||null;}
export function vehicleSeatForPlayer(v,p){return Object.entries(v.seats||{}).find(([,id])=>id===p.id)?.[0]||null;}
export function vehiclePassengers(g,v){return Object.entries(v.seats||{}).filter(([seat])=>seat!=='driver').map(([,id])=>g.players.find(p=>p.id===id)).filter(Boolean);}
export function enterOrExitHouseVehicle(g,p){
 const current=houseVehicleForPlayer(g,p);
 if(current){const seat=vehicleSeatForPlayer(current,p)||'driver',v=seatPoint(current,seat),a=current.heading||0;const preferred=seat.includes('right')?Math.PI/2:-Math.PI/2,exitAngle=[preferred,preferred+Math.PI].find(angle=>!g.blocked(v.x+Math.cos(a+angle)*42,v.y+Math.sin(a+angle)*42,10,false,false,false,14));if(current.speed&&Math.abs(current.speed)>18){g.message('Stop the car before getting out.');return true;}if(exitAngle===undefined){g.message('There is no room to get out here.');return true;}const exit={x:v.x+Math.cos(a+exitAngle)*42,y:v.y+Math.sin(a+exitAngle)*42};delete occupiedSeats(current)[seat];p.vehicleId=null;p.vehicleSeat=null;p.x=exit.x;p.y=exit.y;p.moving=false;current.occupiedBy=occupiedSeats(current).driver||null;g.message('You got out of the car.');return true;}
 const vehicle=(g.house?.vehicles||[]).find(v=>distance(p,v)<Math.max(64,v.w*.65)&&VEHICLE_SEATS.some(s=>!(v.seats||{})[s.id]));if(!vehicle)return false;const seats=occupiedSeats(vehicle),seat=VEHICLE_SEATS.find(s=>!seats[s.id])?.id;if(!seat)return false;seats[seat]=p.id;p.vehicleId=vehicle.id;p.vehicleSeat=seat;p.x=vehicle.x;p.y=vehicle.y;p.moving=false;vehicle.occupiedBy=seats.driver||null;p.jumpHeight=0;p.jumpVelocity=0;p.jumpHeld=false;p.dashTime=0;p.dashRecovery=0;p.charge=0;p.bowAiming=false;p.swimming=false;delete p.queuedAttack;g.message(seat==='driver'?'You are driving. Stick left/right: steer. Bottom face: gas. Left face: brake. Hold stick down + gas: reverse. Keyboard: W/S gas and brake/reverse; A/D steer.':'Passenger seat occupied. Aim and fire through the window.');return true;
}
export function toggleGarageDoor(g,p){const b=(g.house?.furniture||[]).find(f=>f.kind==='garage_button'&&distance(p,{x:f.x+f.w/2,y:f.y+f.h/2})<58);if(!b)return false;const d=(g.house?.doors||[]).find(d=>d.kind==='garage');if(!d)return false;d.open=!d.open;g.message(d.open?'Garage door opened.':'Garage door closed.');g.onSound?.(d.open?'doorOpen':'doorClose',p);return true;}
export function vehicleMotion(g,p,input,dt){
 const v=houseVehicleForPlayer(g,p);if(!v||vehicleDriver(g,v)!==p)return {dx:0,dy:0};
 const pad=p.device?.startsWith('pad:'),keyboard=clamp(-(input.y||0),-1,1);
 const gas=pad?clamp(input.vehicleGas||0,0,1):Math.max(0,keyboard);
 const brake=pad?clamp(input.vehicleBrake||0,0,1):Math.max(0,-keyboard);
 const reversing=pad?!!input.vehicleReverse:keyboard<0;
 const steer=clamp(input.x||0,-1,1),water=waterAt(g,v.x,v.y),deep=water==='water',shallow=isShallow(water);
 v.speed??=0;v.heading??=0;v.wheelAngle??=0;
 const wantsPower=pad?gas>0:keyboard!==0;
 if(wantsPower&&!v.engineOn){
  if(!v.enginePartInstalled){if(!v.engineWarning){g.message('The engine is missing a part. Open the hood and install the replacement part.');v.engineWarning=true;}return {dx:0,dy:0};}
  if(!inventoryHas(p,'car_key')){if(!v.keyWarning){g.message('You need the car key to start this car.');v.keyWarning=true;}return {dx:0,dy:0};}
  v.engineOn=true;v.engineWarning=false;v.keyWarning=false;v.engineStart=.35;g.onSound?.('engineStart',v);g.message('The engine starts.');
 }
 // A brake press stops either direction and never turns into reverse on a pad.
 const power=pad?gas:reversing?brake:gas,targetSign=reversing?-1:1;
 const opposing=power>0&&v.speed*targetSign<0;
 v.braking=(pad&&brake>0)||opposing||(!pad&&reversing&&v.speed>0);
 const oldSpeed=v.speed;
 if((pad&&brake>0)||opposing){
  const strength=pad&&brake>0?brake:power;
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
 v.heading=oldHeading+turn;v.steer=steer;v.moving=Math.abs(v.speed)>5;v.wet=shallow;v.submerging=deep;
 return {dx:Math.sin(mid)*travel+(Math.sin(v.heading)-Math.sin(oldHeading))*wheelBase*.5,
  dy:-Math.cos(mid)*travel-(Math.cos(v.heading)-Math.cos(oldHeading))*wheelBase*.5};
}
export function syncHouseVehicle(g,p){const v=houseVehicleForPlayer(g,p);if(!v)return;v.x=p.x;v.y=p.y;v.moving=Math.abs(v.speed||0)>5;p.faceX=Math.sin(v.heading||0);p.faceY=-Math.cos(v.heading||0);v.occupants={...occupiedSeats(v)};}
export function tickVehicleEffects(g,v,dt){v.effects??={tracks:[],splashes:[],hitCooldown:0};v.effects.hitCooldown=Math.max(0,v.effects.hitCooldown-dt);v.engineStart=Math.max(0,(v.engineStart||0)-dt);if(v.engineOn){v.engineSoundTimer=(v.engineSoundTimer||0)-dt;if(v.engineSoundTimer<=0&&Math.abs(v.speed||0)>2){v.engineSoundTimer=.7;g.onSound?.('engineRun',v);}}if(v.submerging){v.sink=Math.min(1,(v.sink||0)+dt/3);v.speed*=Math.max(0,1-2.5*dt);if(v.sink>=.85)v.occupiable=false;}else v.sink=Math.max(0,(v.sink||0)-dt*.35);if(Math.abs(v.speed||0)>18){v.effects.trackTimer=(v.effects.trackTimer||0)-dt;if(v.effects.trackTimer<=0){v.effects.trackTimer=.12;for(const side of [-1,1])v.effects.tracks.push({x:v.x-Math.cos(v.heading||0)*30-Math.sin(v.heading||0)*side*18,y:v.y-Math.sin(v.heading||0)*30+Math.cos(v.heading||0)*side*18,angle:v.heading||0,life:8,skid:Math.abs(v.steer||0)>.55});}}if(v.wet&&Math.abs(v.speed||0)>12){v.effects.splashTimer=(v.effects.splashTimer||0)-dt;if(v.effects.splashTimer<=0){v.effects.splashTimer=.12;v.effects.splashes.push({x:v.x,y:v.y,life:.6});}}for(const t of v.effects.tracks)t.life-=dt;v.effects.tracks=v.effects.tracks.filter(t=>t.life>0).slice(-240);for(const s of v.effects.splashes)s.life-=dt;v.effects.splashes=v.effects.splashes.filter(s=>s.life>0).slice(-60);}
export function resolveVehicleImpact(g,p,oldX,oldY){const v=houseVehicleForPlayer(g,p);if(!v)return;const speed=Math.abs(v.speed||0);if(speed<14)return;const dx=p.x-oldX,dy=p.y-oldY,len=Math.hypot(dx,dy)||1,fx=dx/len,fy=dy/len,hitbox=Math.max(v.w,v.h)*.45;if(g.house?.walls?.some(w=>!w.destroyed&&Math.hypot(p.x-Math.max(w.x,Math.min(p.x,w.x+w.w)),p.y-Math.max(w.y,Math.min(p.y,w.y+w.h)))<hitbox)){v.speed*=-.22;v.damage=(v.damage||0)+speed*.025;damageStructureMelee(g,{x:p.x-fx*hitbox,y:p.y-fy*hitbox,faceX:fx,faceY:fy},speed*1.8,hitbox+20,true);g.onSound?.('carHit',v);}if(v.effects.hitCooldown>0)return;const enemy=(g.enemies||[]).find(e=>e.hp>0&&!e.room&&Math.hypot(e.x-p.x,e.y-p.y)<hitbox+18);if(enemy){v.effects.hitCooldown=.35;const amount=Math.max(5,(speed-14)*.22);damageEnemy(enemy,amount,'physical',{g,p});enemy.x+=fx*Math.min(70,speed*.22);enemy.y+=fy*Math.min(70,speed*.22);enemy.stun=Math.max(enemy.stun||0,.15+speed/900);g.effects?.push({x:enemy.x,y:enemy.y,text:'CAR HIT',color:'#ffd58a',life:.5});g.onSound?.('carHit',v);}}
