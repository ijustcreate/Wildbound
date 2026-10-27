import {waterAt} from './environment.mjs';

const ownerKey = (p) => String(p.profileId || p.id);
export const FELINE_CONTROL_KINDS = new Set(['lion','tiger','panther','white_lion','snow_leopard']);

export function ownedFollowers(game, player) {
  const candidates = [
    ...(game.enemies || []).filter((a) => a.allyOwner === player.id),
    ...(game.villageFollowers || []).filter((a) => a.ownerKey === ownerKey(player)),
    ...(game.ghosts || []).filter((a) => a.pet && a.owner === player.id),
    player.hunterPet,
    player.ritualPet,
  ].filter((a) => a && a.hp > 0 && !a.defeated);
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
  if (follower) return follower;
  restoreMain(player);
  game.message?.(`${player.name}'s follower fell. Control returned to ${player.name}.`);
  return null;
}

function beginControl(player, follower) {
  if (!player.controlMainPosition) {
    player.controlMainPosition = { x: player.x, y: player.y, room: player.room || null, roomX: player.roomX, roomY: player.roomY,
      jumpHeight: player.jumpHeight || 0, groundHeight: player.groundHeight || 0, jumpVelocity: player.jumpVelocity || 0,
      jumpAge: player.jumpAge || 0, landTime: player.landTime || 0, swimming: !!player.swimming };
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
  if (follower.villagerId === 'april' && (!follower.equipment.hand1 || follower.equipment.hand1 === 'sword'))
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
  game.message?.(`Controlling ${next.name || next.kind}. Your hero is following. RB cycles companions.`);
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

  // Keep the real hero visible as a little companion behind the controlled
  // creature. This detached position is only for rendering until control ends.
  if (!player.room) {
    const pet = player.controlPetPosition || (player.controlPetPosition = { x: follower.x, y: follower.y });
    const fx = follower.faceX || 0, fy = follower.faceY || 1;
    // Keep the avatar at companion spacing, matching ordinary allied-creature
    // following, instead of overlapping the controlled creature.
    const tx = follower.x - fx * 56 + fy * 18, ty = follower.y - fy * 56 - fx * 18;
    const dx = tx - pet.x, dy = ty - pet.y, d = Math.hypot(dx, dy);
    const step = Math.min(d, Math.max(1, 145 * dt));
    if (d > 0.01) {
      pet.x += dx / d * step;
      pet.y += dy / d * step;
      pet.faceX = dx / d;
      pet.faceY = dy / d;
      pet.moving = step > 0.01;
      pet.step = (pet.step || 0) + step * .13;
    }
    // The displaced player is still rendered as a swimming companion while
    // following a swimmer; carry the water state into its presentation copy.
    pet.swimming=!!player.swimming;
    pet.diveDepth=player.diveDepth||0;
    pet.breath=player.breath;
    pet.breathVisible=player.breathVisible;
    pet.room = null;
  } else {
    player.controlPetPosition.room = player.room;
    player.controlPetPosition.roomX = player.roomX;
    player.controlPetPosition.roomY = player.roomY;
  }
  return follower;
}
