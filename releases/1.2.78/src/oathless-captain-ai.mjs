import { rules } from "./definitions.mjs";
import { clearShot, navigateEnemy } from "./navigation.mjs";
import {
  oathlessCaptainMotion,
  CAPTAIN_EQUIPMENT,
} from "./oathless-captain-motion.mjs";
import { waterAt } from "./environment.mjs";

export const CAPTAIN_EVENT = Object.freeze({
  name: "The broken oath",
  kind: "oathless_captain",
  count: 1,
  hp: 190,
  speed: 68,
  damage: 17,
  weight: 3,
  verse: "A faded banner bars the way.\nIts captain has a toll to pay.",
  tip: "Step aside from the blue charge lane. Her shield bash staggers; strike during her recovery.",
});
export function initializeCaptain(e) {
  e.equipment ??= { ...CAPTAIN_EQUIPMENT };
  e.captainBashCooldown ??= 1.5;
  e.captainChargeCooldown ??= 1;
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const duration = (name) => {
  const c = oathlessCaptainMotion.clips[name];
  return (c.length - (c.loop ? 0 : 1)) / c.fps;
};
function start(e, action) {
  e.captainAction = action;
  e.captainAge = 0;
  e.animationAction = action;
  e.poseTime = 0;
  e.state = action;
  e.moving = false;
  e.captainHits = [];
}
function recover(e, seconds = 0.8) {
  start(e, "guard");
  e.captainRecovery = seconds;
  e.state = "recover";
  e.poseTime = null;
}
function hit(g, e, p, mult) {
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
function swing(g, e, targets, range, mult, stagger = false) {
  for (const p of targets) {
    const d = dist(e, p) || 1;
    if (d > range || ((p.x - e.x) * e.faceX + (p.y - e.y) * e.faceY) / d < 0.35)
      continue;
    if (hit(g, e, p, mult) && stagger && p.hp > 0) {
      p.stun = Math.max(p.stun || 0, 0.4);
      p.stunMax = p.stun;
      g.moveActor(p, e.faceX * 20, e.faceY * 20);
    }
  }
  g.onSound?.("attack", e);
}
export function tickCaptain(g, e, targets, dt, stats = {}, beh = {}) {
  if (e.hp <= 0 || e.faction === "ally") return;
  initializeCaptain(e);
  e.swimming = waterAt(g,e.x,e.y) === "water" && !(e.jumpHeight > 0);
  e.moving = false;
  if (e.frozen > 0) return;
  e.captainClock = (e.captainClock || 0) + dt;
  e.captainTellRange =
    (stats.dashSpeed || 240) * 0.6 * (e.rooted > 0 ? 0.45 : 1) + 72;
  e.captainBashCooldown = Math.max(0, e.captainBashCooldown - dt);
  e.captainChargeCooldown = Math.max(0, e.captainChargeCooldown - dt);
  e.rooted = Math.max(0, (e.rooted || 0) - dt);
  if (e.state === "snared") {
    e.captainAction = null;
    e.animationAction = "kneel";
    e.poseTime = null;
    e.timer -= dt;
    if (e.timer <= 0) e.hp = 0;
    return;
  }
  const trap = g.traps?.find((t) => t.life > 0 && dist(t, e) < 30);
  if (trap?.variant === "slow") e.rooted = Math.max(e.rooted, 0.5);
  else if (trap) {
    trap.life = 0;
    e.attack = 0;
    e.captainAction = null;
    e.captainRecovery = 0;
    e.poseTime = null;
    if (trap.variant === "interrupt") recover(e, 1.8);
    else {
      e.state = "snared";
      e.animationAction = "kneel";
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
  if (e.flash > 0 && e.captainAction !== "hurt") {
    start(e, "hurt");
    e.captainRecovery = 0;
    return;
  }
  if (e.captainRecovery > 0) {
    e.captainRecovery = Math.max(0, e.captainRecovery - dt);
    e.animationAction = "guard";
    e.poseTime = null;
    if (!e.captainRecovery) {
      e.captainAction = null;
      e.state = "hunt";
    }
    return;
  }
  const possible = targets.filter(
      (p) => p.hp > 0 && !p.room && dist(e, p) < (stats.detection || 600),
    ),
    target = possible.reduce(
      (a, b) => (!a || dist(e, b) < dist(e, a) ? b : a),
      null,
    );
  const active = e.captainAction;
  if (active) {
    const before = e.captainAge,
      age = before + dt,
      total =
        active === "guard"
          ? 0.65
          : active === "charge"
            ? 0.6
            : duration(active);
    e.captainAge = age;
    e.poseTime = Math.min(1, age / duration(active));
    if (beh.melee !== false) {
      const impact = {
        slash: 0.55,
        thrust: 0.42,
        shield_bash: 0.43,
        charge_end: 0.28,
      }[active];
      if (impact !== undefined && before < impact && age >= impact)
        swing(
          g,
          e,
          possible,
          active === "thrust" ? 82 : active === "shield_bash" ? 61 : 72,
          active === "shield_bash" ? 0.65 : active === "charge_end" ? 1.3 : 1,
          active === "shield_bash",
        );
    }
    if (active === "charge" && beh.dash !== false) {
      let travel =
        (stats.dashSpeed || 240) *
        Math.max(0, Math.min(age, 0.6) - before) *
        (e.rooted > 0 ? 0.45 : 1);
      while (travel > 0 && !e.captainBlocked) {
        const step = Math.min(8, travel),
          moved = g.moveActor(e, e.faceX * step, e.faceY * step);
        travel -= step;
        e.moving = moved > 0;
        if (moved < step * 0.4) e.captainBlocked = true;
      }
    }
    if (age < total) return;
    if (active === "guard" && target && beh.dash !== false) {
      start(e, "charge");
      e.captainBlocked = false;
    } else if (active === "charge") start(e, "charge_end");
    else recover(e, active === "shield_bash" ? 1.1 : 0.8);
    return;
  }
  if (!target) {
    e.state = "idle";
    e.animationAction = "idle";
    e.poseTime = null;
    return;
  }
  const d = dist(e, target) || 1;
  e.faceX = (target.x - e.x) / d;
  e.faceY = (target.y - e.y) / d;
  const visible = clearShot(g, e, target);
  if (
    visible &&
    beh.melee !== false &&
    d < 61 &&
    e.captainBashCooldown <= 0 &&
    e.equipment.hand2
  ) {
    e.captainBashCooldown = stats.bashCooldown || 6;
    start(e, "shield_bash");
    return;
  }
  if (
    visible &&
    beh.melee !== false &&
    d < (stats.attackRange || 72) &&
    (e.cooldown || 0) <= 0
  ) {
    e.cooldown = 1;
    e.captainCombo = (e.captainCombo || 0) + 1;
    start(e, e.captainCombo % 2 ? "slash" : "thrust");
    return;
  }
  if (
    visible &&
    beh.dash !== false &&
    d > 120 &&
    d < 240 &&
    e.captainChargeCooldown <= 0
  ) {
    e.captainChargeCooldown = stats.dashCooldown || 6;
    start(e, "guard");
    return;
  }
  e.poseTime = null;
  e.state = "hunt";
  if (beh.hunt !== false && d > 52) {
    const step = Math.min(d - 52, e.speed * dt * (e.rooted > 0 ? 0.45 : 1));
    const moved = visible ? g.moveActor(e, e.faceX * step, e.faceY * step) : 0;
    if (!visible || moved < step * 0.3) navigateEnemy(g, e, target, dt);
    e.moving = true;
    e.animationAction = "run";
  } else e.animationAction = "guard";
}
export function drawCaptainTells(c, g) {
  c.save();
  c.lineWidth = 2;
  c.strokeStyle = "#94c7ed";
  c.fillStyle = "#75b7e830";
  for (const e of g.enemies) {
    if (
      e.kind !== "oathless_captain" ||
      e.hp <= 0 ||
      e.frozen > 0 ||
      e.captainRecovery > 0
    )
      continue;
    c.save();
    c.translate(e.x, e.y);
    c.rotate(Math.atan2(e.faceY, e.faceX));
    if (e.captainAction === "guard") {
      const range = (e.captainTellRange || 216) - 72;
      c.fillRect(0, -22, range + 72, 44);
      c.strokeRect(0, -22, range + 72, 44);
    } else if (
      ["slash", "thrust", "shield_bash"].includes(e.captainAction) &&
      e.captainAge <
        { slash: 0.55, thrust: 0.42, shield_bash: 0.43 }[e.captainAction]
    ) {
      const r =
        e.captainAction === "shield_bash"
          ? 61
          : e.captainAction === "thrust"
            ? 82
            : 72;
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, r, -1.2, 1.2);
      c.closePath();
      c.fill();
      c.stroke();
    }
    c.restore();
  }
  c.restore();
}
