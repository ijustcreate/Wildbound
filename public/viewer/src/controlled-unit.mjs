// A controller may temporarily drive a party follower instead of the owner's
// body. Keep this tolerant of older snapshots and authored follower shapes.
export function controlledUnit(game, owner) {
  const direct = owner?.controlledFollower || owner?.controlledUnit || owner?.controlledActor;
  if (direct && direct !== owner && direct.hp > 0) return direct;
  const pools = [game?.followers, game?.allies, game?.ghosts, game?.enemies];
  for (const pool of pools) for (const actor of pool || []) {
    if (!actor || actor === owner || actor.hp <= 0) continue;
    if (actor.controlledBy === owner.id || actor.controllerOwner === owner.id || actor.followingController === owner.id) return actor;
  }
  return null;
}
export function prepareControlledUnit(owner, actor) {
  actor.owner ??= owner.id; actor.controllerOwner ??= owner.id;
  actor.name ||= owner.name; actor.color ||= owner.color;
  if(!actor.equipment || !Object.keys(actor.equipment).length) actor.equipment = structuredClone(owner.equipment || {});
  actor.inventory ||= owner.inventory || [];
  actor.faceX ??= owner.faceX ?? 0; actor.faceY ??= owner.faceY ?? 1;
  actor.hp ??= owner.hp; actor.maxHp ??= owner.maxHp || actor.hp;
  actor.faction ||= 'ally'; actor.moving = false; return actor;
}
export function isControlledUnit(game, actor) { return !!actor && game?.players?.some(owner => controlledUnit(game, owner) === actor); }
