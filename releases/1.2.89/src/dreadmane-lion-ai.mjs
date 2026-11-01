import { rules } from "./definitions.mjs";
import { clearShot, navigateEnemy } from "./navigation.mjs";
import { creatureCue } from "./sound-bank.mjs";
import { dreadmaneLionMotion } from "./dreadmane-lion-motion.mjs";

export const DREADMANE_EVENT = Object.freeze({
  name: "The Dreadmane wakes",
  kind: "dreadmane_lion",
  count: 1,
  hp: 220,
  speed: 76,
  damage: 18,
  weight: 3,
  verse: "A golden mane begins to rise.\nA thunderous warning fills the skies.",
  tip: "Leave the amber circle before the roar. Dodge across the pounce trail. Its claw attack has TWO swings; punish the recovery.",
});
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const duration = (action) => {
  const c = dreadmaneLionMotion.clips[action];
  return (c.length - (c.loop ? 0 : 1)) / c.fps;
};
function begin(e, action) {
  e.dreadAction = action;
  e.dreadAge = 0;
  e.animationAction = action;
  e.poseTime = 0;
  e.motionDuration = duration(action);
  e.state = action;
  e.moving = false;
  e.dreadHits = [];
}
function recover(e, seconds = 0.85) {
  begin(e, "idle");
  e.dreadRecovery = seconds;
  e.state = "recover";
}
function face(e, p) {
  const d = distance(e, p) || 1;
  e.faceX = (p.x - e.x) / d;
  e.faceY = (p.y - e.y) / d;
}
function damage(g, e, p, mult = 1) {
  if (
    !(e.damage > 0) ||
    p.hp <= 0 ||
    (p.jumpHeight || 0) > 22 ||
    !clearShot(g, e, p)
  )
    return false;
  const before = p.hp;
  g.hurt(p, e.damage * mult, e);
  return p.hp < before;
}
function swing(g, e, targets, stats) {
  const reach = stats.attackRange || 72;
  for (const p of targets) {
    const d = distance(e, p) || 1;
    if (d <= reach && ((p.x - e.x) * e.faceX + (p.y - e.y) * e.faceY) / d > 0.4)
      damage(g, e, p);
  }
  g.onSound?.(creatureCue("lion", "bite"), e);
}
function pounceStep(g, e, targets, from, to, stats) {
  // Only the middle of the source pounce travels. Substep collision checks so
  // a delayed frame cannot tunnel across a wall or trigger repeated contact.
  const seconds = Math.max(0, Math.min(to, 0.96) - Math.max(from, 0.25));
  let remaining =
    (stats.dashSpeed || 265) * seconds * (e.rooted > 0 ? 0.45 : 1);
  while (remaining > 0 && !e.dreadBlocked) {
    const step = Math.min(8, remaining),
      x = e.x,
      y = e.y;
    const moved = g.moveActor(e, e.faceX * step, e.faceY * step);
    remaining -= step;
    e.moving = moved > 0;
    for (const p of targets) {
      const dx = e.x - x,
        dy = e.y - y,
        length = dx * dx + dy * dy;
      const t = length
        ? clamp(((p.x - x) * dx + (p.y - y) * dy) / length, 0, 1)
        : 0;
      if (
        !e.dreadHits.includes(p.id) &&
        Math.hypot(p.x - x - dx * t, p.y - y - dy * t) < 34
      ) {
        e.dreadHits.push(p.id);
        damage(g, e, p, 1.35);
      }
    }
    if (moved < step * 0.4) e.dreadBlocked = true;
  }
}
export function tickDreadmaneLion(
  g,
  e,
  targets,
  dt,
  stats = {},
  behaviors = {},
) {
  if (e.hp <= 0 || e.faction === "ally") return;
  e.dreadRoarRange = stats.roarRange || 125;
  e.dreadClawRange = stats.attackRange || 72;
  e.dreadPounceRange =
    (stats.dashSpeed || 265) * 0.71 * (e.rooted > 0 ? 0.45 : 1);
  e.moving = false;
  if (e.frozen > 0) return;
  e.dreadRoarCooldown = Math.max(0, (e.dreadRoarCooldown ?? 3) - dt);
  e.dreadPounceCooldown = Math.max(0, (e.dreadPounceCooldown ?? 1.2) - dt);
  e.rooted = Math.max(0, (e.rooted || 0) - dt);
  if (e.state === "snared") {
    e.dreadAction = null;
    e.animationAction = "cower";
    e.poseTime = null;
    e.timer -= dt;
    if (e.timer <= 0) e.hp = 0;
    return;
  }
  const trap = g.traps?.find((t) => t.life > 0 && distance(t, e) < 30);
  if (trap?.variant === "slow") e.rooted = Math.max(e.rooted, 0.5);
  else if (trap) {
    trap.life = 0;
    e.dreadAction = null;
    e.dreadRecovery = 0;
    e.dreadHits = null;
    e.attack = 0;
    e.poseTime = null;
    e.animationAction = "cower";
    if (trap.variant === "interrupt") recover(e, 1.8);
    else {
      e.state = "snared";
      e.timer = rules.captureTime * (trap.capture || 1);
    }
    g.onSound?.("trap", e);
    return;
  }
  if (e.stun > 0) {
    e.stun = Math.max(0, e.stun - dt);
    recover(e, 0.5);
    return;
  }
  // Damage interrupts a windup or combo, giving a successful counter a window.
  if (e.flash > 0 && e.dreadAction !== "hurt") {
    begin(e, "hurt");
    e.dreadRecovery = 0;
    return;
  }
  if (e.dreadRecovery > 0) {
    e.dreadRecovery = Math.max(0, e.dreadRecovery - dt);
    e.animationAction = "idle";
    e.poseTime = null;
    if (!e.dreadRecovery) {
      e.dreadAction = null;
      e.state = "hunt";
    }
    return;
  }
  const possible = targets.filter(
    (p) => p.hp > 0 && !p.room && distance(e, p) <= (stats.detection || 600),
  );
  const p = possible.reduce(
    (a, b) => (!a || distance(e, b) < distance(e, a) ? b : a),
    null,
  );
  const active = e.dreadAction;
  if (active) {
    const before = e.dreadAge,
      after = before + dt,
      total = active === "cower" ? 0.7 : duration(active);
    e.dreadAge = after;
    e.poseTime = clamp(after / duration(active), 0, 1);
    if (
      active === "roar" &&
      before < 0.88 &&
      after >= 0.88 &&
      behaviors.melee !== false
    ) {
      for (const q of possible)
        if (
          distance(e, q) <= (stats.roarRange || 125) &&
          damage(g, e, q, 0.55)
        ) {
          if (q.hp > 0) {
            q.stun = Math.max(q.stun || 0, 0.55);
            q.stunMax = q.stun;
            const d = distance(e, q) || 1;
            g.moveActor(q, ((q.x - e.x) / d) * 30, ((q.y - e.y) / d) * 30);
          }
        }
      g.effects?.push({
        x: e.x,
        y: e.y,
        radius: stats.roarRange || 125,
        color: "#e7bb69",
        life: 0.4,
      });
      g.onSound?.(creatureCue("lion", "windup"), e);
    }
    if (
      (active === "claw_left" || active === "claw_right") &&
      before < 0.43 &&
      after >= 0.43 &&
      behaviors.melee !== false
    )
      swing(g, e, possible, stats);
    if (active === "pounce" && behaviors.dash !== false)
      pounceStep(g, e, possible, before, after, stats);
    if (after < total) return;
    // At most one transition per update; a long frame never skips telegraphing
    // the second claw or the crouch. Its next action starts at frame zero.
    if (active === "claw_left") begin(e, "claw_right");
    else if (active === "cower" && p && behaviors.dash !== false) {
      begin(e, "pounce");
      e.dreadBlocked = false;
    } else if (active === "sleep_down") begin(e, "sleep");
    else if (active === "sleep" && !p) {
      e.dreadAge = 0;
      e.poseTime = 0;
    } else if (active === "sleep" && p) begin(e, "sleep_up");
    else if (active === "sleep_up") {
      e.dreadAction = null;
      e.state = "hunt";
    } else recover(e, active === "roar" ? 1.15 : 0.8);
    return;
  }
  if (!p) {
    e.dreadRest = (e.dreadRest || 0) + dt;
    e.state = "idle";
    e.animationAction = "idle_scan";
    e.poseTime = null;
    if (e.dreadRest > 6) {
      e.dreadRest = 0;
      begin(e, "sleep_down");
    }
    return;
  }
  e.dreadRest = 0;
  face(e, p);
  const d = distance(e, p),
    visible = clearShot(g, e, p);
  if (
    visible &&
    behaviors.melee !== false &&
    e.dreadRoarCooldown <= 0 &&
    d <= (stats.roarRange || 125)
  ) {
    e.dreadRoarCooldown = stats.roarCooldown || 8;
    begin(e, "roar");
    return;
  }
  if (
    visible &&
    behaviors.melee !== false &&
    d <= (stats.attackRange || 72) &&
    (e.cooldown || 0) <= 0
  ) {
    e.cooldown = stats.recovery || 1;
    begin(e, "claw_left");
    return;
  }
  if (
    visible &&
    behaviors.dash !== false &&
    d > 100 &&
    d < 255 &&
    e.dreadPounceCooldown <= 0
  ) {
    e.dreadPounceCooldown = stats.dashCooldown || 5;
    begin(e, "cower");
    return;
  }
  e.state = "hunt";
  e.poseTime = null;
  if (behaviors.hunt !== false && d > 54) {
    const step = Math.min(d - 54, e.speed * (e.rooted > 0 ? 0.45 : 1) * dt);
    const moved = visible ? g.moveActor(e, e.faceX * step, e.faceY * step) : 0;
    if (!visible || moved < step * 0.3) navigateEnemy(g, e, p, dt);
    e.animationAction = "run";
    e.moving = true;
  } else e.animationAction = "idle";
}

export function drawDreadmaneTells(c, g) {
  c.save();
  c.lineWidth = 2;
  for (const e of g.enemies)
    if (e.kind === "dreadmane_lion" && e.hp > 0 && !(e.frozen > 0)) {
      c.strokeStyle = "#f1bd64";
      c.fillStyle = "#e9a94d35";
      if (e.dreadAction === "roar" && e.dreadAge < 0.88) {
        c.beginPath();
        c.arc(e.x, e.y, e.dreadRoarRange || 125, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      } else if (e.dreadAction === "cower") {
        c.save();
        c.translate(e.x, e.y);
        c.rotate(Math.atan2(e.faceY, e.faceX));
        c.fillRect(0, -34, e.dreadPounceRange || 188, 68);
        c.strokeRect(0, -34, e.dreadPounceRange || 188, 68);
        c.restore();
      } else if (
        ["claw_left", "claw_right"].includes(e.dreadAction) &&
        e.dreadAge < 0.43
      ) {
        c.save();
        c.translate(e.x, e.y);
        c.rotate(Math.atan2(e.faceY, e.faceX));
        c.beginPath();
        c.moveTo(0, 0);
        c.arc(0, 0, e.dreadClawRange || 72, -1.16, 1.16);
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();
      }
    }
  c.restore();
}
