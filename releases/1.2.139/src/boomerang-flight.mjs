export const BOOMERANG_SWEEP_STEP = 4;

export function boomerangDirection(x, y) {
  const length = Math.hypot(x, y);
  return length ? {x: x / length, y: y / length} : {x: 0, y: 1};
}

export function traceBoomerangPath(from, to, blocked) {
  if (!blocked) return {end: to, blocked: false};
  const dx = to.x - from.x, dy = to.y - from.y;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / BOOMERANG_SWEEP_STEP));
  let end = from;
  for (let step = 1; step <= steps; step++) {
    const next = {x: from.x + dx * step / steps, y: from.y + dy * step / steps};
    if (blocked(next.x, next.y)) return {end, blocked: true};
    end = next;
  }
  return {end, blocked: false};
}

export function projectBoomerangTurn(origin, direction, range, blocked) {
  const heading = boomerangDirection(direction.x, direction.y);
  const target = {x: origin.x + heading.x * range, y: origin.y + heading.y * range};
  return traceBoomerangPath(origin, target, blocked).end;
}

// First contact along the blade's swept segment, including a target already in its reach.
export function boomerangContact(from, to, target, radius) {
  const x = from.x - target.x, y = from.y - target.y;
  const offset = x * x + y * y - radius * radius;
  if (offset <= 0) return from;
  const dx = to.x - from.x, dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = x * dx + y * dy;
  const discriminant = projection * projection - lengthSquared * offset;
  if (!lengthSquared || projection >= 0 || discriminant < 0) return null;
  const ratio = (-projection - Math.sqrt(discriminant)) / lengthSquared;
  return ratio <= 1 ? {x: from.x + dx * ratio, y: from.y + dy * ratio} : null;
}
