import { SWING_ACTIONS } from './combat-animation.mjs';

const clamp = value => Math.max(-1, Math.min(1, value));
const turnAngle = actor => Math.atan2(-(actor.faceX || 0), actor.faceY ?? 1);
const fullTurn = Math.PI * 2;
const flickActions = new Set([...SWING_ACTIONS, 'punch', 'ranged', 'cast', 'parry', 'woodcut', 'mine']);

export function witchHatFrame(motion) {
  return {
    crown: Math.round(clamp(motion?.crown ?? 0) * 2) || 0,
    brim: Math.round(clamp(motion?.brim ?? 0) * 2) || 0,
  };
}

// Render-only history. Split views and shadows can reuse a sample at the same
// time, and afterimages cannot drive the live spring backwards.
export class WitchHatInertia {
  samples = new Map();

  sample(actor, time) {
    if (actor.id == null || !Number.isFinite(actor.x) || !Number.isFinite(actor.y)) return;
    const key = `${actor.sprite || actor.kind || 'player'}:${actor.id}`;
    const previous = this.samples.get(key);
    const dt = previous ? time - previous.time : 0;
    if (previous && dt <= 0 && dt > -.25) return previous.motion;

    const angle = turnAngle(actor);
    let lean = 0, velocity = 0;
    if (previous && dt > 0 && dt <= .25 && Math.hypot(actor.x - previous.x, actor.y - previous.y) < 80) {
      const yaw = angle - previous.angle;
      const turn = Math.atan2(Math.sin(yaw), Math.cos(yaw));
      const moving = actor.moving || actor.dashTime > 0 || actor.broomMount;
      const drag = moving ? -(actor.x - previous.x) / dt / 310 : 0;
      const target = .72 * clamp(drag + turn / dt / 18);

      // Solve the damped spring over this interval with a constant target.
      const damping = 7, frequency = 13;
      const offset = previous.lean - target;
      const sine = Math.sin(frequency * dt), cosine = Math.cos(frequency * dt);
      const amplitude = (previous.velocity + damping * offset) / frequency;
      const decay = Math.exp(-damping * dt);
      lean = target + decay * (offset * cosine + amplitude * sine);
      velocity = decay * (previous.velocity * cosine - (damping * amplitude + frequency * offset) * sine);
    }
    const motion = { crown: lean, brim: lean * .56 + velocity * .014 };
    if (this.samples.size >= 256 && !previous) this.samples.delete(this.samples.keys().next().value);
    this.samples.set(key, { x: actor.x, y: actor.y, angle, time, lean, velocity, motion });
    return motion;
  }
}

// Add the gait and the delayed cloth flick around that fixed skull attachment.
// Studio and other direct renders get the same clip-driven motion by scrubbing.
export function witchHatMotion(actor, time, direction, action, progress) {
  if (actor.angleRestOnly || actor.liveHeadwearPreviewView != null || action === 'death' || action === 'sleep') return;
  const spring = actor.witchHatInertia;
  const forward = -Math.sin(direction * Math.PI / 4);
  const side = Math.abs(forward) < .1 ? 1 : forward;
  let crown = (spring?.crown ?? 0) + Math.sin(time * 2.8) * .20;
  let brim = (spring?.brim ?? 0) + Math.sin(time * 2.1) * .10;

  if (action === 'walk' || action === 'run' || action === 'dash') {
    const strength = action === 'walk' ? .52 : 1;
    const phase = fullTurn * progress;
    crown += strength * (.52 * Math.sin(phase - .75) - (spring ? .13 : .34) * forward);
    brim += strength * (.34 * Math.sin(phase - .25) - .12 * forward);
  } else if (flickActions.has(action) || action === 'land' || action === 'hurt') {
    const phase = Math.max(0, Math.min(1, progress));
    const envelope = Math.sin(Math.PI * phase);
    crown += side * envelope * .94 * Math.sin(fullTurn * (phase - .19));
    brim += side * envelope * .63 * Math.sin(fullTurn * (phase - .09));
  } else if (action === 'broom_ride') {
    crown += Math.sin(time * 7) * .27 - forward * .18;
    brim += Math.sin(time * 7 + .7) * .18;
  }
  return { crown: clamp(crown), brim: clamp(brim) };
}
