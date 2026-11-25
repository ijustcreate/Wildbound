const living = actor => actor && actor.hp > 0 && !actor.room && !actor.dead;

export function markSkunkAttacked(_game, skunk, attacker = null) {
  if (skunk?.kind !== 'skunk' || !living(skunk) || skunk.faction === 'ally' || skunk.allyOwner != null) return false;
  skunk.skunkAttacked = true;
  if (attacker && Number.isFinite(attacker.x) && Number.isFinite(attacker.y)) {
    skunk.skunkAttackerId = attacker.id;
    skunk.skunkThreatX = attacker.x;
    skunk.skunkThreatY = attacker.y;
  }
  skunk.aggro = true;
  return true;
}
