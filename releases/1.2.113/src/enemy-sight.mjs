// Perception only: hiding never deletes enemies or changes collision geometry.
export function enemyCanSeeTarget(enemy, target) {
  if (!target || target.room || target.hp <= 0) return false;
  if (target.underBridge || target.quicksandUnder) return false;
  const submerged = target.swimming && (target.diveDepth || 0) > .12;
  return !submerged || ['crocodile', 'alligator'].includes(enemy.kind);
}
export function forgetHiddenTarget(enemy) {
  enemy.moving = false;
  enemy.attack = 0;
  enemy.fireballsAttack = 0;
  enemy.throwTime = 0;
  enemy.target = null;
  enemy.lastSeen = null;
  if (enemy.night) { enemy.night.phase = 'idle'; enemy.night.timer = 0; }
}
