import {drawGorilla} from './temple.mjs';
import { NIGHT_KINDS, STAMPEDE_KINDS, nightMotions, nightMotionRevisions, nightAction, nightFrame } from './night-rigs.mjs';
import { ITEMS } from "./items.mjs";
import {
  playerMotion,
  playerMotionRevision,
  playerFrame,
  playerAction,
  playerLayers,
} from "./player-motion.mjs";
import {
  lionAction,
  lionFrame,
  lionMotion,
  tigerMotion,
  lionRevision,
  tigerRevision,
} from "./lion-motion.mjs";
import { rigSubject } from "./rig-subjects.mjs";
import { animationFrame } from "./frame-workshop.mjs";
import { spriteToRgba } from "./pixels.mjs";
import { creatures } from "./definitions.mjs";
import { drawRig } from "./rig-render.mjs";
import {
  rhinoMotion,
  rhinoFrame,
  rhinoMotionRevision,
} from "./rhino-motion.mjs";
import { facingIndex } from "./player-motion.mjs";
// Poses are independent of frame rate. Rasterize articulated parts at 64px,
// then scale with nearest-neighbour sampling to retain actual pixel edges.
export class Animator {
  constructor(assets) {
    this.assets = assets;
    this.surface = document.createElement("canvas");
    this.surface.width = this.surface.height = 64;
    this.ctx = this.surface.getContext("2d");
    this.frameCache = new WeakMap();
    this.rigSurface = document.createElement("canvas");
    this.rigSurface.width = this.rigSurface.height = 256;
    this.stampedeFrames = new Map();
    this.playerFrames = new Map();
    this.playerRevision = playerMotionRevision;
    this.catFrames = new Map();
    this.catRevisions = { lion: lionRevision, tiger: tigerRevision };
    this.stampedeRevision = rhinoMotionRevision;
    this.nightStampedeFrames = new Map();
    this.nightStampedeRevisions = { ...nightMotionRevisions };
  }
  draw(ctx, actor, time, size = 48) {
    if(actor.jumpHeight>0||actor.groundHeight>0)actor={...actor,y:actor.y-(actor.jumpHeight||0)-(actor.groundHeight||0)};
    if (this.metrics?.enabled)
      return this.metrics.measure("animation", () =>
        this.drawActor(ctx, actor, time, size),
      );
    return this.drawActor(ctx, actor, time, size);
  }
  drawActor(ctx, actor, time, size = 48) {
    if(actor.kind==='gorilla'){drawGorilla(ctx,actor,time);return;}
    if(actor.kind==='spider_egg'){
      ctx.save();ctx.translate(actor.x,actor.y);ctx.fillStyle='#afa8bf';ctx.beginPath();ctx.ellipse(0,0,12,15,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f0e8e7';ctx.lineWidth=2;
      for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(-10,i*4);ctx.lineTo(10,-i*3);ctx.stroke();}
      ctx.fillStyle='#fff4ca';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText(Math.max(0,Math.ceil(actor.hatchIn))+'s',0,-20);ctx.restore();return;
    }
    const nameKey = actor.sprite || actor.kind,
      rig = actor.rigOverride || creatures[nameKey]?.rig;
    // Players have exactly one animation path. Old sheets and creature modes
    // cannot override the shared player definition loaded by Animation Studio.
    if (rigSubject(nameKey)) {
      if (STAMPEDE_KINDS.includes(nameKey) && actor.state === 'stampede' && !actor.aggro &&
          !(actor.flash > 0) && !(actor.hit > 0) && !(actor.hp <= 0) && !actor.dead &&
          !actor.animationAction && !Number.isFinite(actor.playerFrame) && !Number.isFinite(actor.poseTime) &&
          !Number.isFinite(actor.animationProgress) && !actor.rigOverride) {
        if (this.nightStampedeRevisions[nameKey] !== nightMotionRevisions[nameKey]) {
          this.nightStampedeFrames.clear();
          this.nightStampedeRevisions[nameKey] = nightMotionRevisions[nameKey];
        }
        const model = nightMotions[nameKey], action = nightAction(nameKey, actor, model), clip = model.clips[action];
        const raw = nightFrame(nameKey, actor, time, model), sample = Math.floor(((raw % clip.length + clip.length) % clip.length) * 2) / 2;
        const key = [nameKey, facingIndex(actor.faceX, actor.faceY), action, sample].join(':');
        let surface = this.nightStampedeFrames.get(key);
        if (!surface) {
          surface = document.createElement('canvas'); surface.width = surface.height = 256;
          const cc = surface.getContext('2d'); cc.translate(128, 128);
          rigSubject(nameKey).draw(cc, { ...actor, playerFrame: sample }, time, model);
          if (this.nightStampedeFrames.size >= 192) this.nightStampedeFrames.delete(this.nightStampedeFrames.keys().next().value);
          this.nightStampedeFrames.set(key, surface);
        }
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(surface, Math.round(actor.x - size * 8 / 3), Math.round(actor.y - size * 8 / 3), size * 16 / 3, size * 16 / 3);
        return;
      }
      if (
        (nameKey === "player" || nameKey?.startsWith("explorer")) &&
        !actor.animationAction &&
        !Number.isFinite(actor.playerFrame) &&
        !Number.isFinite(actor.poseTime) &&
        !actor.rigOverride &&
        !(actor.hit > 0) &&
        !actor.equipment?.cape &&
        !actor.field?.cosmetics?.cape &&
        playerAction(actor) === "idle" && !playerLayers(actor,time).length
      ) {
        if (this.playerRevision !== playerMotionRevision) {
          this.playerFrames.clear();
          this.playerRevision = playerMotionRevision;
        }
        const clip = playerMotion.clips.idle,
          frame =
            Math.floor(
              (((playerFrame(actor, time) % clip.length) + clip.length) %
                clip.length) *
                2,
            ) / 2;
        const key = JSON.stringify([
          facingIndex(actor.faceX, actor.faceY),
          frame,
          actor.equipment,
          actor.appearance,
          actor.field?.cosmetics,
          (actor.inventory || [])
            .filter((i) => ITEMS[i?.type]?.relic)
            .slice(0, 2)
            .map((i) => i.type),
          Math.sin(time * 2) > 0,
        ]);
        let surface = this.playerFrames.get(key);
        if (!surface) {
          surface = document.createElement("canvas");
          surface.width = surface.height = 256;
          const cc = surface.getContext("2d");
          cc.translate(128, 128);
          rigSubject(nameKey).draw(cc, { ...actor, playerFrame: frame }, time);
          if (this.playerFrames.size >= 96)
            this.playerFrames.delete(this.playerFrames.keys().next().value);
          this.playerFrames.set(key, surface);
        }
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          surface,
          Math.round(actor.x - (size * 8) / 3),
          Math.round(actor.y - (size * 8) / 3),
          (size * 16) / 3,
          (size * 16) / 3,
        );
        return;
      }
      if (
        ["lion", "tiger"].includes(nameKey) &&
        !actor.animationAction &&
        !Number.isFinite(actor.playerFrame) &&
        !Number.isFinite(actor.poseTime) &&
        !actor.rigOverride &&
        !(actor.flash > 0) &&
        !(actor.hit > 0) &&
        ["idle", "run"].includes(lionAction(actor))
      ) {
        const motion = nameKey === "tiger" ? tigerMotion : lionMotion,
          revision = nameKey === "tiger" ? tigerRevision : lionRevision;
        if (this.catRevisions[nameKey] !== revision) {
          this.catFrames.clear();
          this.catRevisions[nameKey] = revision;
        }
        const action = lionAction(actor),
          clip = motion.clips[action],
          frame =
            Math.floor(
              (((lionFrame(actor, time, motion) % clip.length) + clip.length) %
                clip.length) *
                2,
            ) / 2;
        const key = [
          nameKey,
          actor.skin || "",
          facingIndex(actor.faceX, actor.faceY),
          action,
          frame,
        ].join(":");
        let surface = this.catFrames.get(key);
        if (!surface) {
          surface = document.createElement("canvas");
          surface.width = surface.height = 256;
          const cc = surface.getContext("2d");
          cc.translate(128, 128);
          rigSubject(nameKey).draw(cc, { ...actor, playerFrame: frame }, time, motion);
          if (this.catFrames.size >= 96)
            this.catFrames.delete(this.catFrames.keys().next().value);
          this.catFrames.set(key, surface);
        }
        ctx.drawImage(
          surface,
          Math.round(actor.x - (size * 8) / 3),
          Math.round(actor.y - (size * 8) / 3),
          (size * 16) / 3,
          (size * 16) / 3,
        );
        return;
      }
      // The herd shares one rig. Reuse quarter-key poses instead of rasterizing
      // every limb for every animal at every display refresh. Editor poses bypass this.
      if (
        nameKey === "rhino" &&
        actor.state === "stampede" &&
        !actor.aggro &&
        !(actor.flash > 0) &&
        !(actor.hit > 0) &&
        !actor.animationAction &&
        !Number.isFinite(actor.playerFrame) &&
        !Number.isFinite(actor.poseTime) &&
        !actor.rigOverride
      ) {
        if (this.stampedeRevision !== rhinoMotionRevision) {
          this.stampedeFrames.clear();
          this.stampedeRevision = rhinoMotionRevision;
        }
        const clip = rhinoMotion.clips.charge;
        const raw = rhinoFrame(actor, time);
        const frame = clip.loop
          ? ((raw % clip.length) + clip.length) % clip.length
          : Math.max(0, Math.min(clip.length - 1, raw));
        const sample = Math.floor(frame * 4) / 4;
        const key = facingIndex(actor.faceX, actor.faceY) + ":" + sample;
        let surface = this.stampedeFrames.get(key);
        if (!surface) {
          surface = document.createElement("canvas");
          surface.width = surface.height = 256;
          const c = surface.getContext("2d");
          c.translate(128, 128);
          rigSubject(nameKey).draw(c, { ...actor, playerFrame: sample }, time);
          if (this.stampedeFrames.size >= 64)
            this.stampedeFrames.delete(this.stampedeFrames.keys().next().value);
        } else this.stampedeFrames.delete(key);
        this.stampedeFrames.set(key, surface);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          surface,
          Math.round(actor.x - (size * 8) / 3),
          Math.round(actor.y - (size * 8) / 3),
          (size * 16) / 3,
          (size * 16) / 3,
        );
        return;
      }
      const c = this.rigSurface.getContext("2d");
      c.clearRect(0, 0, 256, 256);
      c.save();
      c.translate(128, 128);
      const cfg = creatures[nameKey];
      const motionDuration =
        actor.state === "windup"
          ? cfg?.edited
            ? cfg.stats.windup
            : nameKey === "snake"
              ? 0.85
              : nameKey === "golem"
                ? 0.9
                : 0.65
          : actor.state === "charge"
            ? (cfg?.stats.dashDistance || 163) /
              Math.max(1, cfg?.stats.dashSpeed || 340)
            : cfg?.edited
              ? cfg.stats.recovery
              : 0.65;
      // Night behavior owns state timing. Avoid replacing its duration with the
      // legacy charge/recovery heuristic; explicit stateAge also remains usable.
      rigSubject(nameKey).draw(c, NIGHT_KINDS.includes(nameKey) ? actor : { ...actor, motionDuration }, time);
      c.restore();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        this.rigSurface,
        Math.round(actor.x - (size * 8) / 3),
        Math.round(actor.y - (size * 8) / 3),
        (size * 16) / 3,
        (size * 16) / 3,
      );
      return;
    }
    if (rig?.mode === "rig") {
      const c = this.rigSurface.getContext("2d");
      c.clearRect(0, 0, 256, 256);
      c.imageSmoothingEnabled = false;
      c.save();
      c.translate(128, 128);
      const posed = ["skeleton", "archer"].includes(actor.kind)
        ? {
            ...actor,
            equipment: { hand1: actor.kind === "skeleton" ? "sword" : "bow" },
          }
        : actor;
      drawRig(c, this.assets, posed, time, rig);
      c.restore();
      ctx.drawImage(
        this.rigSurface,
        Math.round(actor.x - (size * 8) / 3),
        Math.round(actor.y - (size * 8) / 3),
        (size * 16) / 3,
        (size * 16) / 3,
      );
      return;
    }
    const frame =
      rig?.mode === "frames"
        ? animationFrame(this.assets.animationBank, nameKey, actor, time)
        : null;
    if (frame) {
      let canvas = this.frameCache.get(frame);
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.width = canvas.height = 64;
        canvas
          .getContext("2d")
          .putImageData(new ImageData(spriteToRgba(frame), 64, 64), 0, 0);
        this.frameCache.set(frame, canvas);
      }
      ctx.drawImage(
        canvas,
        Math.round(actor.x - (size * 2) / 3),
        Math.round(actor.y - (size * 2) / 3),
        (size * 4) / 3,
        (size * 4) / 3,
      );
      return;
    }
    const c = this.ctx;
    c.clearRect(0, 0, 64, 64);
    c.imageSmoothingEnabled = false;
    c.save();
    c.translate(32, 32);
    const name = actor.sprite || actor.kind,
      skin = actor.skin || name,
      source =
        this.assets.canvas(name) ||
        (["skeleton", "archer"].includes(name)
          ? this.assets.canvas("explorer-teal")
          : null);
    if (!source) {
      c.restore();
      return;
    }
    const frozen = actor.state === "snared" || actor.state === "windup";
    const part = (sx, sy, sw, sh, x, y, w, h, angle = 0) => {
      c.save();
      c.translate(Math.round(x), Math.round(y));
      c.rotate(angle);
      c.drawImage(
        source,
        (sx / 48) * source.width,
        (sy / 48) * source.height,
        (sw / 48) * source.width,
        (sh / 48) * source.height,
        Math.round(-w / 2),
        0,
        w,
        h,
      );
      c.restore();
    };
    if (name === "wasp") {
      const flap = frozen ? 0.4 : 0.5 + Math.sin(time * 29) * 0.4;
      part(0, 8, 23, 32, -9, -9, 26, Math.max(7, Math.round(31 * flap)), -0.2);
      part(25, 8, 23, 32, 9, -9, 26, Math.max(7, Math.round(31 * flap)), 0.2);
      part(17, 9, 14, 35, 0, -14, 15, 34);
    } else {
      // Keep custom sprites (for example the tiger's 10x3 art) pixel-square
      // when they are placed in the 48px animation cell.
      const scale = Math.min(48 / source.width, 48 / source.height),
        width = source.width * scale,
        height = source.height * scale;
      c.drawImage(source, -width / 2, -height / 2, width, height);
    }
    c.restore();
    ctx.drawImage(
      this.surface,
      Math.round(actor.x - (size * 2) / 3),
      Math.round(actor.y - (size * 2) / 3),
      (size * 4) / 3,
      (size * 4) / 3,
    );
  }
}
