import {waterAt} from './environment.mjs';
import {ensureSkeletonEquipment} from './skeleton-equipment.mjs';
import {CONTROLLED_WATER_FIELDS} from './controlled-water.mjs';
import {updateAnacondaBody} from './anaconda-body.mjs';
import {creatureEgg} from './stationary-creatures.mjs';
import {navigateEnemy} from './navigation.mjs';

const heroFollowActors=new WeakMap();
export function followControlledUnit(game,player,follower,dt){
  const pet=player.controlPetPosition;
  if(!pet)return;
  pet.moving=false;pet.walking=false;pet.locomotionSpeed=0;
  const elapsed=Math.max(0,Math.min(.1,dt||0));
  if(!elapsed||game.paused)return;
  let actor=heroFollowActors.get(pet);
  if(!actor){actor={id:player.id,heroFollower:true,faction:'ally',allyOwner:player.id,speed:145};heroFollowActors.set(pet,actor);}
  actor.x=pet.x;actor.y=pet.y;actor.hp=player.hp;actor.step=pet.step||0;
  const distance=Math.hypot(follower.x-pet.x,follower.y-pet.y);
  if(distance>80)actor.following=true;
  if(distance<=56)actor.following=false;
  if(actor.following){
    const gap=Math.max(0,distance-56),ratio=gap/(distance||1);
    const target={x:pet.x+(follower.x-pet.x)*ratio,y:pet.y+(follower.y-pet.y)*ratio};
    if(game.moveActor&&game.blocked)navigateEnemy(game,actor,target,elapsed);
    else{
      const step=Math.min(gap,145*elapsed),dx=(follower.x-pet.x)/(distance||1)*step,dy=(follower.y-pet.y)/(distance||1)*step;
      if(!game.blocked?.(actor.x+dx,actor.y+dy,8)){actor.x+=dx;actor.y+=dy;}
    }
    const dx=actor.x-pet.x,dy=actor.y-pet.y,travel=Math.hypot(dx,dy);
    if(travel>.01){pet.x=actor.x;pet.y=actor.y;pet.faceX=dx/travel;pet.faceY=dy/travel;pet.moving=true;pet.walking=true;pet.step=(pet.step||0)+travel*.13;pet.locomotionSpeed=travel/elapsed;}
  }
  pet.swimming=waterAt(game,pet.x,pet.y)==='water';
  pet.diveDepth=0;pet.breath=20;pet.breathVisible=0;pet.drownClock=0;pet.room=null;
}

const ownerKey = (p) => String(p.profileId || p.id);
export const FELINE_CONTROL_KINDS = new Set(['lion','tiger','panther','white_lion','snow_leopard']);

export function ownedFollowers(game, player) {
  const candidates = [
    ...(game.enemies || []).filter((a) => a.allyOwner === player.id),
    ...(game.villageFollowers || []).filter((a) => a.ownerKey === ownerKey(player)),
    ...(game.ghosts || []).filter((a) => a.pet && a.owner === player.id),
    player.hunterPet,
    player.ritualPet,
  ].filter((a) => a && a.hp > 0 && !a.defeated && !creatureEgg(a));
  return [...new Map(candidates.map((a) => [a.id, a])).values()];
}

function restoreMain(player, fallbackPosition = true) {
  const position = player.controlPetPosition || (fallbackPosition ? player.controlMainPosition : null);
  if (position) Object.assign(player, position);
  if (player.controlMainLoadout) {
    player.inventory = player.controlMainLoadout.inventory;
    player.equipment = player.controlMainLoadout.equipment;
    player.equipmentSockets = player.controlMainLoadout.equipmentSockets;
  }
  delete player.controlMainPosition;
  delete player.controlPetPosition;
  delete player.controlMainLoadout;
  delete player.controlledFollowerId;
}

export function controlledFollower(game, player) {
  if (!player.controlledFollowerId) return null;
  const follower = ownedFollowers(game, player).find((a) => a.id === player.controlledFollowerId);
  if (follower) {
    // Equip/drag/craft transactions can replace containers while this player
    // carries the controlled unit's UI. Publish the committed containers back.
    if(player.controlMainLoadout){follower.inventory=player.inventory;follower.equipment=player.equipment;follower.equipmentSockets=player.equipmentSockets;}
    return follower;
  }
  restoreMain(player);
  game.message?.(`${player.name}'s follower fell. Control returned to ${player.name}.`);
  return null;
}

function beginControl(player, follower) {
  ensureSkeletonEquipment(follower);
  if (!player.controlMainPosition) {
    player.controlMainPosition = { x: player.x, y: player.y, room: player.room || null, roomX: player.roomX, roomY: player.roomY,
      jumpHeight: player.jumpHeight || 0, groundHeight: player.groundHeight || 0, jumpVelocity: player.jumpVelocity || 0,
      jumpAge: player.jumpAge || 0, landTime: player.landTime || 0, swimming: !!player.swimming,diveDepth:0,breath:player.breath??20,breathVisible:0,drownClock:0 };
    player.controlPetPosition = { ...player.controlMainPosition };
    player.controlMainLoadout = {
      inventory: player.inventory,
      equipment: player.equipment,
      equipmentSockets: player.equipmentSockets,
    };
  }
  // Route the existing inventory UI to the controlled creature's own bag.
  // Empty loadout slots keep the hero's equipment and backpack out of view.
  follower.inventory = Array.isArray(follower.inventory) ? follower.inventory : [];
  follower.equipment ||= {};
  if (follower.villagerId === 'april' && !Object.hasOwn(follower.equipment,'hand1'))
    follower.equipment.hand1 = 'april_blade';
  follower.animationAction = null;
  follower.poseTime = null;
  delete follower.gestureAge;
  delete follower.captainAction;
  player.inventory = follower.inventory;
  player.equipment = follower.equipment ||= {};
  player.equipmentSockets = follower.equipmentSockets ||= {};
  player.controlledFollowerId = follower.id;
  follower.controlledBy = player.id;
  player.x = follower.x;
  player.y = follower.y;
  for (const key of ['jumpHeight','groundHeight','jumpVelocity','jumpAge','landTime']) player[key] = follower[key] || 0;
  if (follower.room) {
    player.room = follower.room;
    player.roomX = follower.roomX;
    player.roomY = follower.roomY;
  } else {
    player.room = null;
    delete player.roomX;
    delete player.roomY;
  }
}

// JSON checkpoints preserve values, not shared references between owner and bag.
export function restoreFollowerControl(game,player){
 const follower=controlledFollower(game,player);
 if(follower)beginControl(player,follower);
 return follower;
}

export function cycleFollowerControl(game, player) {
  const roster = ownedFollowers(game, player);
  const current = controlledFollower(game, player);
  if (!current && !roster.length) return null;
  const index = current ? roster.findIndex((a) => a.id === current.id) : -1;
  if (current && index === roster.length - 1) {
    delete current.controlledBy;
    restoreMain(player);
    game.message?.("Back to your character.");
    return null;
  }
  if (current) delete current.controlledBy;
  const next = roster.length ? roster[(index + 1) % roster.length] : null;
  if (!next) {
    restoreMain(player);
    game.message?.("Back to your character.");
    return null;
  }
  beginControl(player, next);
  game.message?.(`Controlling ${next.name || next.kind}. Your hero is following. Right bumper cycles companions.`);
  return next;
}

export function syncControlledFollower(game, player, dt = 1 / 60) {
  const follower = controlledFollower(game, player);
  if (!follower) return null;
  follower.pickupTime=Math.max(0,(follower.pickupTime||0)-dt);
  follower.controlledBy = player.id;
  follower.faceX = player.faceX;
  follower.faceY = player.faceY;
  follower.moving = player.moving;
  follower.walking = player.walking;
  follower.step = player.step;
  if (follower.villagerId === 'april' && !follower.controlledAttack) {
    if (follower.jumpHeight > 0) {
      follower.animationAction = 'jump';
      follower.poseTime = null;
    } else if (follower.animationAction === 'jump') {
      follower.animationAction = null;
      follower.poseTime = null;
    }
  }
  for (const key of ['attack','attackDuration','attackClip','attackArc','attackReach','spin','meleeSweep','bowAiming','bowAimBlend','pounceAim'])
    follower[key] = player[key] || (typeof player[key] === 'boolean' ? false : 0);
  follower.room = player.room || null;
  if (player.room) {
    follower.roomX = player.roomX;
    follower.roomY = player.roomY;
  } else if(follower.controlledAttack?.phase!=='pounce') {
    delete follower.roomX;
    delete follower.roomY;
    follower.x = player.x;
    follower.y = player.y;
    if(follower.kind==='anaconda')updateAnacondaBody(game,follower);
  }
  if (follower.villagerId === 'april') {
    // April's swim state follows her actual floor tile, not the displaced
    // player's cached water flag. The hero slot temporarily carries inputs
    // and may have entered control (or jumped) in a different water state.
    const inWater = !follower.room && waterAt(game, follower.x, follower.y) === 'water' &&
      !(follower.jumpHeight > 0 || follower.groundHeight > 0) && follower.hp > 0;
    follower.swimming = inWater;
    player.swimming = inWater;
    if (!inWater) player.diveDepth = 0;
  } else follower.swimming = !!player.swimming;
  for(const key of CONTROLLED_WATER_FIELDS)follower[key]=player[key];

  // The real hero follows with its own footprint, route and grounded gait.
  if (!player.room) {
    player.controlPetPosition ||= {x:follower.x,y:follower.y};
    followControlledUnit(game,player,follower,dt);
  } else {
    player.controlPetPosition.room = player.room;
    player.controlPetPosition.roomX = player.roomX;
    player.controlPetPosition.roomY = player.roomY;
  }
  return follower;
}
