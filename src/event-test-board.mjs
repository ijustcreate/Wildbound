export function canHitEventTestBoard(g, p) {
  const b = g.eventTestBoard;
  if (!b || g.phase !== 'play' || p.hp <= 0 || p.ui || p.room) return false;
  const x = Math.max(b.x, Math.min(p.x, b.x + b.w));
  const y = Math.max(b.y, Math.min(p.y, b.y + b.h));
  return Math.hypot(p.x - x, p.y - y) <= 40;
}
export function hitEventTestBoard(g, p, events) {
  if (!canHitEventTestBoard(g, p) || !events.length || g.event || g.roll) return false;
  const b = g.eventTestBoard;
  const index = Math.max(0, Math.min(events.length - 1, Math.floor(b.nextEvent || 0)));
  g.spawnEvent(index, {test:true});
  b.nextEvent = (index + 1) % events.length;
  p.attack = p.attackDuration = .34;
  g.persist();
  return true;
}
