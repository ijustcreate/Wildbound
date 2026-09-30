import {drawParticleEffect} from './particles.mjs';
import {drawWaterSurface} from './water-surface.mjs';
import {drawSwimmer,drawBreath} from './swim-render.mjs';
import {drawBowAim} from './bow-aim.mjs';
import {drawSinking} from './quicksand.mjs';
import {drawNightLight, drawNightStatus, enemyVisibility} from './night-cycle.mjs';
import {drawLivingEcosystem} from './living-ecosystem.mjs';
import {drawNightEnemyEffects, nightEnemyOpacity} from './night-enemies.mjs';
import {drawNightEquipment} from './night-equipment.mjs';
import {NIGHT_KINDS} from './night-rigs.mjs';
import {drawTemple} from './temple.mjs';
import {drawIceHints,iceSolid,iceBase,clipSnow,snowRim,drawSnowGround,snowAt} from './ice-world.mjs';
import { drawFieldWorld } from "./field-art.mjs";
import {drawExpansion,drawTreeWeb} from './expansion.mjs';
import { waterAt, isShallow, drawTracks, drawProp } from "./environment.mjs";
import { drawRain, drawFog } from "./weather-art.mjs";
import { drawPortal } from "./portal-art.mjs";
import {
  CENTER,
  WORLD,
  TILE,
  FINISH,
  expeditionCameraTarget,
  clamp,
} from "./core.mjs";
import { propDepth, isOccluded } from "./world.mjs";
import { Animator } from "./animation.mjs";
import { drawBoard } from "./board.mjs";
import {BOARD_TABLE,boardActorDepth,boardTableDepth} from './board-table.mjs';
import { canSee, VISION } from "./adventure.mjs";
import { ITEMS } from "./items.mjs";
import { drawHazards, drawWeather } from "./hazards.mjs";
import { rules } from "./definitions.mjs";
import { drawItem } from "./item-art.mjs";
import { rigSubject } from "./rig-subjects.mjs";
import { ellipse } from "./player-motion.mjs";
import { actorContact } from './contact-shadow.mjs';
import {drawCorpse} from './corpse-pose.mjs';
import {drawEmbeddedArrow} from './embedded-arrow.mjs';
import {drawForestGround,drawFallingLeaves} from './forest.mjs';
const hash = (x, y) => {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
// A tsetse is a biting fly, but its long legs, narrow abdomen, wings, and
// needle-like proboscis should read immediately as a mosquito to players.
function drawMosquito(ctx, a, time) {
  const flap = Math.sin(time * 38 + a.id * 0.7) * 2;
  const angle = Math.atan2(a.faceY || 0, a.faceX || 1);
  ctx.save();
  ctx.translate(a.x, a.y - 15);
  ctx.rotate(angle);
  ctx.lineCap = "round";

  // translucent wings
  ctx.fillStyle = "#d8eef044";
  ctx.strokeStyle = "#d8eef0aa";
  ctx.lineWidth = 1;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(1, side * 2);
    ctx.quadraticCurveTo(9, side * (10 + flap), 19, side * (7 + flap));
    ctx.quadraticCurveTo(11, side * 1, 1, side * 2);
    ctx.fill();
    ctx.stroke();
  }

  // long abdomen with a visible red-brown banding
  ctx.fillStyle = "#252832";
  ctx.beginPath();
  ctx.ellipse(-5, 0, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8e4650";
  ctx.fillRect(-10, -2, 3, 4);
  ctx.fillRect(-4, -2, 3, 4);
  ctx.fillStyle = "#c8a36a";
  ctx.fillRect(-17, -1, 5, 2);

  // head and proboscis
  ctx.fillStyle = "#11161b";
  ctx.beginPath();
  ctx.arc(8, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c8a36a";
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(24, 0);
  ctx.stroke();

  // six spindly legs
  ctx.strokeStyle = "#252832";
  ctx.lineWidth = 1.2;
  for (const side of [-1, 1]) {
    for (const x of [-5, 0, 5]) {
      ctx.beginPath();
      ctx.moveTo(x, side * 2);
      ctx.lineTo(x - 4, side * 8);
      ctx.lineTo(x - 10, side * 10);
      ctx.stroke();
    }
  }
  ctx.restore();
}
export class Renderer {
  constructor(canvas, assets) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.assets = assets;
    this.animator = new Animator(assets);
    this.canopyAlpha = new Map();
    this.camera = { x: CENTER, y: CENTER, zoom: 2.6 };
    this.age = 0;
    this.groundChunks = new Map();
    this.actorQueue = [];
    this.decor = [];
    this.showLootDetails = false;
    this.pixelScale = 2;
    this.viewport = { w: 1, h: 1 };
  }
  resize() {
    const w = Math.max(1, Math.round(this.canvas.clientWidth / 2)),
      h = Math.max(1, Math.round(this.canvas.clientHeight / 2));
    const pixelW = w * this.pixelScale, pixelH = h * this.pixelScale;
    if (this.canvas.width !== pixelW || this.canvas.height !== pixelH) {
      this.canvas.width = pixelW;
      this.canvas.height = pixelH;
      this.ctx.setTransform(this.pixelScale, 0, 0, this.pixelScale, 0, 0);
    }
    this.ctx.imageSmoothingEnabled = false;
    this.viewport = { w, h };
    return { w, h };
  }
  screenToWorld(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    const {w,h}=this.viewport;
    return {
      x:
        (((x - rect.left) / rect.width) * w) /
          this.camera.zoom +
        this.camera.x -
        w / this.camera.zoom / 2,
      y:
        (((y - rect.top) / rect.height) * h) /
          this.camera.zoom +
        this.camera.y -
        h / this.camera.zoom / 2,
    };
  }
  draw(game, dt) {
    const { w, h } = this.resize(),
      ctx = this.ctx;
    this.age += dt;
    const pull =
      game.phase === "sealing"
        ? Math.min(1, game.sealTime / rules.sealDuration)
        : 0;
    this.decor =
      !pull && game.bloom >= 3
        ? game.scenery || []
        : (game.scenery || [])
            .filter(
              (d) =>
                game.bloom >= 3 ||
                Math.hypot(d.x - CENTER, d.y - CENTER) < game.bloom * 430,
            )
            .map((d) =>
              pull
                ? {
                    ...d,
                    x: CENTER + (d.x - CENTER) * (1 - pull) ** 2,
                    y: CENTER + (d.y - CENTER) * (1 - pull) ** 2,
                    size: d.size * (1 - pull),
                  }
                : d,
            );
    const target = expeditionCameraTarget(game, w, h);
    if (game.phase === "play" && game.openingBoard)
      Object.assign(this.camera, target);
    const k = 1 - Math.exp(-dt * 3);
    for (const v of ["x", "y", "zoom"])
      this.camera[v] += (target[v] - this.camera[v]) * k;
    ctx.fillStyle = "#10271f";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);
    this.floor(ctx, w, h, game);
    drawSnowGround(ctx,game);
    drawExpansion(ctx,game);
    drawForestGround(ctx,game,p=>this.visible(p,w,h,160));
    drawTemple(ctx,game,this.animator);
    drawTracks(ctx, game);
    drawLivingEcosystem(ctx, game, 'ground');
    ctx.save();
    if (pull) {
      ctx.translate(CENTER, CENTER);
      ctx.scale((1 - pull) ** 2, (1 - pull) ** 2);
      ctx.translate(-CENTER, -CENTER);
    }
    drawHazards(ctx, game);
    ctx.restore();
    if (game.victoryChest) {
      ctx.fillStyle = "#675464";
      ctx.fillRect(CENTER - 20, CENTER + 105, 40, 24);
      ctx.fillStyle = "#d9c075";
      ctx.fillRect(CENTER - 20, CENTER + 102, 40, 7);
      ctx.fillRect(CENTER - 2, CENTER + 108, 4, 9);
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "VICTORY CHEST · " + (game.controlLabels?.interact || "E / Y"),
        CENTER,
        CENTER + 141,
      );
    }
    for (const orb of game.xpOrbs || []) {
      if (!this.visible(orb, w, h, 24) || !canSee(game, orb)) continue;
      const pop = Math.min(1, Math.max(0, (game.time - (orb.bornAt || game.time)) / 0.35));
      const y = orb.y - 5 + (1 - pop) * 10 + Math.sin(game.time * 3 + orb.id) * 2;
      ellipse(ctx, orb.x, orb.y + 3, 6, 2, "#071b2377");
      ellipse(ctx, orb.x, y, 7, 7, "#53b4ef33");
      ellipse(ctx, orb.x, y, 4, 4, "#647adc");
      ellipse(ctx, orb.x, y, 3, 3, "#83d8f0");
      ctx.fillStyle = "#e0ffff";
      ctx.fillRect(Math.round(orb.x - 1), Math.round(y - 2), 2, 2);
    }
    const selectedLoot = new Set(
      game.players
        .filter((p) => !p.room && !p.ui && p.hp > 0)
        .map((p) => game.nearbyLoot(p)),
    );
    for (const l of game.loot) {
      if (!this.visible(l, w, h, 40)) continue;
      if (!canSee(game, l)) continue;
      ctx.fillStyle = "#07100d88";
      ctx.beginPath();
      ctx.ellipse(l.x, l.y + (l.embedded?1:6), l.embedded?3:9, l.embedded?1.5:4, 0, 0, Math.PI * 2);
      ctx.fill();
      const selected = selectedLoot.has(l);
      if (selected) {
        ctx.strokeStyle = "#f0d79d";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(l.x, l.y + 6, 12, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (l.embedded && l.type === "arrow") {
        drawEmbeddedArrow(ctx,l);
      } else {
        if (ITEMS[l.type]?.gmOnly) drawParticleEffect(ctx,'pink-sparkle',l.x,l.y-8,game.time,l.id);
        const fall=l.salvageBorn===undefined?0:Math.max(0,1-(game.time-l.salvageBorn)/.55);
        drawItem(ctx, l.type, l.x, l.y - 3 - Math.sin(fall*Math.PI/2)*24, 24);
      }
      if (ITEMS[l.type]?.slot) {
        ctx.fillStyle = ITEMS[l.type].color;
        ctx.fillRect(l.x - 8, l.y + 9, 16, 1);
      }
      if (l.qty > 1) {
        ctx.font = "bold 6px monospace";
        ctx.textAlign = "right";
        ctx.fillStyle = "#101e18";
        ctx.fillRect(l.x + 2, l.y + 5, 12, 8);
        ctx.fillStyle = "#f0e6c5";
        ctx.fillText(l.qty, l.x + 13, l.y + 11);
      }
    }
    for (const b of game.baits) {
      ctx.fillStyle = "#dc9880";
      ctx.fillRect(b.x - 4, b.y - 3, 8, 6);
    }
    for (const bolt of game.spells || []) {
      if (!this.visible(bolt, w, h, 80) || !canSee(game, bolt)) continue;
      ctx.fillStyle = bolt.color;
      const size = bolt.size || 6;
      if (bolt.fire || bolt.water) {
        for (let i = 3; i >= 0; i--)
          ellipse(
            ctx,
            bolt.x - bolt.vx * Math.min(bolt.age??1,i*0.012),
            bolt.y - 16 - bolt.vy * Math.min(bolt.age??1,i*0.012),
            Math.max(1, size * 0.7 - i),
            Math.max(1, size * 0.7 - i),
            bolt.water
              ? i > 1
                ? "#237e9b"
                : "#55d5db"
              : i > 1
                ? "#bb3928"
                : "#ff782b",
          );
        ellipse(
          ctx,
          bolt.x,
          bolt.y - 16,
          size * 0.4,
          size * 0.4,
          bolt.water ? "#d8ffff" : "#ffd654",
        );
        ellipse(
          ctx,
          bolt.x + 1,
          bolt.y - 17,
          size * 0.18,
          size * 0.18,
          "#fff3b0",
        );
        continue;
      }
      ctx.fillRect(
        Math.round(bolt.x - size / 2),
        Math.round(bolt.y - 16 - size / 2),
        size,
        size,
      );
      ctx.fillStyle = "#f2efff";
      ctx.fillRect(Math.round(bolt.x) - 1, Math.round(bolt.y) - 17, 2, 2);
      ctx.fillStyle = bolt.color;
      ctx.fillRect(
        Math.round(bolt.x - bolt.vx * 0.03) - 1,
        Math.round(bolt.y - bolt.vy * 0.03) - 17,
        2,
        2,
      );
    }
    for (const a of game.arrows) {
      if (!this.visible(a, w, h, 80) || !canSee(game, a)) continue;
      if(a.stuck&&!a.enemy&&!a.rock&&!a.ice){drawEmbeddedArrow(ctx,a);continue;}
      ctx.save();
      ctx.translate(a.x, a.y - (a.z || 0));
      ctx.rotate(a.angle ?? Math.atan2(a.vy, a.vx));
      if (a.rock) {
        ctx.fillStyle = "#45564e";
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#9ca89a";
        ctx.fillRect(-4, -5, 6, 3);
      } else if (a.ice) {
        ctx.fillStyle = "#8fe9ff";
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(5, 0);
        ctx.lineTo(0, 7);
        ctx.lineTo(-5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#e5fcff";
        ctx.fillRect(-1, -3, 2, 6);
      } else {
        ctx.fillStyle = "#ba9763";
        const depth = Math.max(5, Math.min(30, a.embedDepth || 7));
        ctx.fillRect(a.stuck ? -depth - 7 : -9, -1, a.stuck ? depth + 19 : 17, 2);
        ctx.fillStyle = "#f0e7cd";
        ctx.fillRect(a.stuck ? depth + 8 : 6, -2, 4, 4);
        if (a.stuck) {
          ctx.fillStyle = "#d7bd78";
          ctx.fillRect(-depth - 9, -2, 3, 4);
          ctx.fillStyle = "#e8d6a1";
          ctx.fillRect(-depth - 8, -1, 2, 2);
        }
      }
      if (a.rock) {
        ctx.fillStyle = "#839187";
        ctx.fillRect(-7, 4, 3, 2);
        ctx.fillRect(3, -5, 2, 2);
      }
      ctx.restore();
    }
    for (const d of game.portals) {
      if(d.temple)continue;
      const owner = game.players.find((p) => p.id === d.owner);
      drawPortal(
        ctx,
        { ...d, color: owner?.color || d.color },
        game.time,
        "PRIVATE STORAGE",
      );
    }
    for (const d of this.decor)
      if (
        !iceSolid(d) && !this.assets.library[d.kind]?.occludes &&
        !this.assets.library[d.kind]?.footprint?.some(Boolean) &&
        this.visible(d, w, h)
      ) {
        ctx.save();const base=iceBase(d);clipSnow(ctx,game,d.x,base.y,d.size*2);
        drawProp(ctx, d, game.time,game) ||
          this.assets.draw(ctx, d.kind, d.x, d.y, d.size);
        drawTreeWeb(ctx,d);ctx.restore();snowRim(ctx,game,d.x,base.y,d.size*.5);
      }
    for (const p of game.pickups)
      this.assets.draw(ctx, "fruit", p.x, p.y + Math.sin(this.age * 4) * 2, 26);
    for (const t of game.traps) {
      if (!this.visible(t, w, h, 90)) continue;
      if (t.variant && t.variant !== "snare") {
        ctx.strokeStyle = {
          slow: "#81c386",
          lure: "#d9b66e",
          interrupt: "#b8b2fa",
        }[t.variant];
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.variant === "slow" ? 85 : 30, 0, Math.PI * 2);
        ctx.stroke();
      }
      this.animator.draw(
        ctx,
        {
          ...t,
          kind: "trap",
          age: game.time - (t.placedAt ?? game.time - 1),
          faceX: 0,
          faceY: 1,
        },
        game.time,
        38,
      );
      ctx.strokeStyle = "#d3c87e";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.ellipse(t.x, t.y + 6, 23, 13, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const e of game.enemies)
      if (e.state === "windup" && !e.night) {
        ctx.fillStyle = "#e96b5140";
        ctx.strokeStyle = "#ff9470";
        ctx.lineWidth = 1;
        if (e.kind === "golem" || e.kind === "vine") {
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.kind === "golem" ? 95 : 120, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.save();
          ctx.translate(e.x, e.y);
          ctx.rotate(Math.atan2(e.dy, e.dx));
          ctx.fillRect(0, -13, 165, 26);
          ctx.strokeRect(0, -13, 165, 26);
          ctx.restore();
        }
      }
    for (const b of game.barricades || []) {
      drawItem(ctx, "barricade", b.x, b.y - 6, 42);
    }
    if (game.ping && game.ping.until > game.time) {
      ctx.strokeStyle = game.ping.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        game.ping.x,
        game.ping.y,
        20 + Math.sin(game.time * 5) * 5,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    drawIceHints(ctx,game);
    drawFieldWorld(ctx, game);
    this.boardBase(ctx, game);
    const actors = this.actorQueue;
    actors.length = 0;
    for (const p of game.players)
      if (!p.room) actors.push({ ...p, isPlayer: true, drawDepth: boardActorDepth(game,p) });
    for (const e of game.enemies)
      if (pull || (canSee(game, e) && this.visible(e, w, h, 180))) {
        const actor = pull
          ? {
              ...e,
              x: CENTER + (e.x - CENTER) * (1 - pull) ** 2,
              y: CENTER + (e.y - CENTER) * (1 - pull) ** 2,
            }
          : e;
        actors.push({
          ...actor,
          drawDepth: boardActorDepth(game,actor,actor.y + (rigSubject(e.kind) ? 0 : 14)),
        });
      }
    for (const d of this.decor)
      if (
        (iceSolid(d) || this.assets.library[d.kind]?.occludes ||
          this.assets.library[d.kind]?.footprint?.some(Boolean)) &&
        this.visible(d, w, h)
      )
        actors.push({
          ...d,
          isScenery: true,
          drawDepth: iceSolid(d)?iceBase(d).y:propDepth(d, this.assets.library[d.kind]),
        });
    // Floor-level actors behind the table are occluded. Supported/airborne
    // actors over its footprint are drawn above it, including the back half.
    actors.push({ isBoard: true, drawDepth: boardTableDepth() });
    actors.sort((a, b) => a.drawDepth - b.drawDepth);
    for (const a of actors) {
      if (a.isBoard) {
        this.boardTop(ctx, game);
        continue;
      }
      if (a.isScenery) {
        const obscures = game.players.some((p) =>
            isOccluded(a, this.assets.library[a.kind], p),
          ),
          target = obscures ? 0.28 : 1,
          old = this.canopyAlpha.get(a.id) ?? 1,
          alpha = old + (target - old) * (1 - Math.exp(-dt * 9));
        this.canopyAlpha.set(a.id, alpha);
        ctx.save();
        ctx.globalAlpha = alpha;const base=iceBase(a);clipSnow(ctx,game,a.x,base.y,a.size*2);
        drawProp(ctx, a, game.time,game) ||
          this.assets.draw(ctx, a.kind, a.x, a.y, a.size);
        drawTreeWeb(ctx,a);
        ctx.restore();snowRim(ctx,game,a.x,base.y,a.size*.5);
        continue;
      }
      const player = a.isPlayer,
        size = player
          ? 43
          : a.kind==='elephant'?82:a.kind==='baby_spider'?27:["golem", "crocodile", "lion", "tiger", "white_lion", "rhino", "dragon", "zebra", "carnivorous_flower"].includes(a.kind)
            ? 61
            : a.kind === "bat" || a.kind === "wasp" || a.kind === "tsetse"
              ? 34
              : 47;
      ctx.save();
      ctx.globalAlpha *= player ? 1 : Math.min(enemyVisibility(game, a), nightEnemyOpacity(game, a));
      const contact=actorContact(game,a,size,player||!!rigSubject(a.kind));
      ctx.fillStyle = `rgba(9,28,22,${a.swimming?0:contact.alpha*(1-Math.min(1,(a.sink||0)/48))})`;
      ctx.beginPath();
      ctx.ellipse(
        contact.x,
        contact.y,
        contact.rx,
        contact.ry,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      if (player) {
        if (a.poison > 0) {
          ctx.fillStyle = "#a0e565";
          ctx.font = "6px monospace";
          ctx.textAlign = "center";
          ctx.fillText("POISON " + a.poison.toFixed(1) + "s", a.x, a.y + 48);
        }
        if (a.hp <= 0) {
          drawParticleEffect(ctx,'knockout',a.x,a.y-14,game.time,a.id);
        }
        if (a.stun > 0) {
          ctx.fillStyle = "#ffe38e";
          for (let n = 0; n < 3; n++) {
            const angle = game.time * 7 + (n * Math.PI * 2) / 3;
            ctx.fillRect(
              a.x + Math.cos(angle) * 10 - 1,
              a.y - 35 + Math.sin(angle) * 4,
              3,
              3,
            );
          }
          ctx.font = "6px monospace";
          ctx.textAlign = "center";
          ctx.fillText("STUN " + a.stun.toFixed(1) + "s", a.x, a.y + 39);
          ctx.fillRect(
            a.x - 12,
            a.y + 42,
            (24 * a.stun) / (a.stunMax || 1.5),
            2,
          );
        }
        if (a.sealHold > 0) {
          ctx.fillStyle = "#d0b1f7";
          ctx.fillRect(
            a.x - 20,
            a.y - 45,
            (40 * a.sealHold) / rules.sealHold,
            4,
          );
          ctx.font = "7px monospace";
          ctx.textAlign = "center";
          ctx.fillText("WILDBOUND…", a.x, a.y - 51);
        }
        if (a.charge > 0) {
          const aimTime=ITEMS[a.equipment?.hand1]?.shot?.aimTime || 1.2;
          ctx.fillStyle = a.charge>=aimTime ? '#a6e3b1' : "#e9c677";
          ctx.fillRect(a.x - 12, a.y - 39, 24 * Math.min(1, a.charge / aimTime), 2);
        }
        if(a.rifleReload>0) {
          ctx.fillStyle='#afbbcf';ctx.fillRect(a.x-12,a.y-43,24*Math.max(0,1-a.rifleReload/(ITEMS.rifle.shot.cooldown)),2);
        }
        if (a.spin > 0) {
          ctx.save();
          ctx.globalAlpha = Math.min(0.8, a.spin * 2.4);
          ctx.strokeStyle = "#ffe08a";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(a.x, a.y - 8, 66 + (0.38 - a.spin) * 65, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        ctx.strokeStyle = a.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(contact.x, contact.y, 18, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (a.id === game.current?.id) {
          ctx.fillStyle = a.color;
          ctx.beginPath();
          const lift=a.swimming?-20:(a.groundHeight||0)+(a.jumpHeight||0);
          ctx.moveTo(a.x - 4, a.y - lift - 34);
          ctx.lineTo(a.x + 4, a.y - lift - 34);
          ctx.lineTo(a.x, a.y - lift - 29);
          ctx.fill();
        }
      }
      ctx.save();
      const grounded=!['bat','wasp','bee','dragon','pelican'].includes(a.kind),snowBase=a.y+(player||rigSubject(a.kind)?1:14);
      if(grounded)clipSnow(ctx,game,a.x,snowBase,200);
      if (a.invuln > 0 && Math.floor(this.age * 15) % 2) ctx.globalAlpha *= 0.5;
      if (!player && a.kind === 'necromancer') {
        drawParticleEffect(ctx,'purple-aura',a.x,a.y-22,game.time,a.id);
        drawParticleEffect(ctx,'purple-eyes',a.x,a.y-37,game.time,a.id+17);
      }
      if (!player && a.summonFootprint) drawParticleEffect(ctx,'purple-eyes',a.x,a.y-32,game.time,a.id+31);
      const dead = !player && a.hp <= 0;
      if (dead) {
        drawCorpse(ctx,a,rigSubject(a.sprite||a.kind)?.data,contact,size,
          (actor,time,scale)=>this.animator.draw(ctx,actor,time,scale));
      } else if (player&&a.swimming) {
        drawSwimmer(ctx,a,game.time,actor=>this.animator.draw(ctx,actor,game.time,size));
      } else if (player&&a.sink>0) {
        drawSinking(ctx,a,actor=>this.animator.draw(ctx,actor,game.time,size));
      } else if (player&&waterAt(game,a.x,a.y)==='mud'&&!(a.jumpHeight>0)&&!(a.groundHeight>0)) {
        ctx.beginPath();ctx.rect(a.x-100,a.y-180,200,181);ctx.clip();
        this.animator.draw(ctx,{...a,y:a.y+3},game.time,size);
      } else if (a.kind === "tsetse") {
        drawMosquito(ctx, a, game.time);
      } else {
        this.animator.draw(
          ctx,
          a.sink ? { ...a, y: a.y + a.sink } : a,
          game.time,
          size,
        );
      }
      ctx.restore();
      if(player)drawBowAim(ctx,a);
      if (!player && a.hp>0 && (a.frostMage || (a.kind === "skeleton" && a.frostBound))) {
        ctx.fillStyle = "#8cecff";
        ctx.fillRect(a.x - 5, a.y - 29, 3, 2);
        ctx.fillRect(a.x + 2, a.y - 29, 3, 2);
      }
      if (player && a.sleeping > 0) {
        ctx.save();
        ctx.fillStyle = "#bdefff";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        const bob = Math.sin(game.time * 3) * 2;
        ctx.fillText("Z", a.x + 16, a.y - 32 + bob);
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("z", a.x + 25, a.y - 43 + bob);
        ctx.restore();
      }
      if(grounded)snowRim(ctx,game,a.x,snowBase,size*.5);
      if (!player && a.state === "breath") {
        ctx.save();
        ctx.globalAlpha = 0.27 + Math.sin(game.time * 18) * 0.08;
        ctx.fillStyle = "#ff7438";
        ctx.beginPath();
        const angle = Math.atan2(a.faceY, a.faceX);
        ctx.moveTo(a.x, a.y);
        ctx.arc(a.x, a.y, 150, angle - 0.52, angle + 0.52);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      if (!player && a.boulderReady) {
        ctx.fillStyle = "#55655b";
        ctx.beginPath();
        ctx.arc(a.x, a.y - 28, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#a3ab99";
        ctx.fillRect(a.x - 4, a.y - 34, 5, 3);
      }
      if (!player && a.summonPulse > 0) drawParticleEffect(ctx,'purple-aura',a.x,a.y-18,game.time,a.id+43);
      if (!player && a.state === "rocklift") {
        ctx.fillStyle = "#5d655b88";
        ctx.beginPath();
        ctx.ellipse(a.x, a.y + 10, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#87958a";
        const lift = (game.time * 12) % 7;
        ctx.fillRect(a.x - 6, a.y + 7 - lift, 5, 4);
        ctx.fillRect(a.x + 4, a.y + 9 - lift * 0.7, 4, 3);
      }
      if (!player && a.healEffect > 0) {
        ctx.strokeStyle = "#ffe17c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(a.x, a.y - 13, 18 * (1 - a.healEffect / 0.8), 0, Math.PI * 2);
        ctx.stroke();
      }
      if (
        player &&
        a.attack > 0.1 &&
        !ITEMS[a.equipment?.hand1]?.magic && !ITEMS[a.equipment?.hand2]?.magic &&
        ITEMS[a.equipment?.hand1]?.base !== "bow" &&
        !ITEMS[a.equipment?.hand1]?.ranged && !ITEMS[a.equipment?.hand1]?.utility
      ) {
        const angle = Math.atan2(a.faceY, a.faceX),progress=1-a.attack/(a.attackDuration||.34),big=a.attackClip==='swipe_big',upper=a.attackClip==='uppercut';
        const radius=(big?44:upper?24:34)*(a.attackReach||1),half=(a.attackArc||90)*Math.PI/360;
        const direction=a.attackClip==='swipe_two'?-1:1,center=angle+direction*(progress-.5)*half;
        ctx.strokeStyle=big?'#ffcd70':'#ffe5a3';ctx.lineWidth=big?6:3;ctx.beginPath();
        ctx.arc(a.x,a.y-(a.jumpHeight||0)-(a.groundHeight||0)-(upper?progress*22:0),radius,center-half*.65,center+half*.65);ctx.stroke();
        if (ITEMS[a.equipment?.hand1]?.truthSword || ITEMS[a.equipment?.hand2]?.truthSword) { ctx.strokeStyle='#ff8fc8';ctx.lineWidth=3;ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(a.x,a.y,radius+10,center-half,center+half);ctx.stroke();ctx.globalAlpha=1; }

      }
      if (a.state === "snared") {
        const age = Math.max(0, rules.captureTime - a.timer);
        this.animator.draw(
          ctx,
          {
            kind: "trap",
            x: a.x,
            y: a.y,
            faceX: 0,
            faceY: 1,
            animationAction: age < 0.5 ? "snap" : "hold",
            playerFrame: Math.min(7, (age / 0.5) * 7),
          },
          game.time,
          48,
        );
      }
      if (!player && a.hp > 0 && a.hp < a.maxHp) {
        const healthY = a.y - (a.kind === "lion" ? 49 : 31);
        ctx.fillStyle = "#182f21";
        ctx.fillRect(a.x - 15, healthY, 30, 3);
        ctx.fillStyle = "#df9a70";
        ctx.fillRect(a.x - 15, healthY, (30 * a.hp) / a.maxHp, 3);
      }
      if (player) {
        drawBreath(ctx,a);
        ctx.textAlign = "center";
        ctx.font = "5px monospace";
        ctx.fillStyle = a.color;
        ctx.fillText(
          a.hp <= 0 ? "HOLD INTERACT TO REVIVE" : a.name.toUpperCase(),
          a.x,
          a.y + 29,
        );
        if (a.hp <= 0) {
          ctx.fillStyle = "#d1e2a4";
          ctx.fillRect(a.x - 15, a.y - 30, (30 * a.revive) / 1.6, 3);
        }
      }
      ctx.restore();
    }
    // Draw burn sparks after actors so the fire visibly clings to the target.
    drawLivingEcosystem(ctx, game, 'air');
    drawNightEnemyEffects(ctx, game);
    drawNightEquipment(ctx, game);
    for (const f of game.fireParticles || []) {
      ctx.fillStyle = f.smoke ? "#aaa99dbb" : "#ffb63a";
      ctx.fillRect(
        Math.round(f.x),
        Math.round(f.y - (1 - f.life) * 12),
        f.smoke ? 4 : 3,
        f.smoke ? 4 : 5,
      );
    }
    for (const fx of game.effects) {
      ctx.globalAlpha = Math.min(1, fx.life * 2);
      ctx.fillStyle = fx.color;
      ctx.strokeStyle = fx.color;
      if(fx.particle){drawParticleEffect(ctx,fx.particle,fx.x,fx.y,Math.max(0,fx.duration-fx.life),Number(fx.seed)||0);
      } else if (fx.text) {
        ctx.textAlign = "center";
        ctx.font = "bold 7px monospace";
        ctx.fillText(fx.text, fx.x, fx.y - (1 - fx.life) * 17);
      } else {
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius * (1 - fx.life), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    drawRain(ctx, game, this.camera, w, h);
    drawFallingLeaves(ctx,game,p=>this.visible(p,w,h,160));
    ctx.restore();
    drawFog(ctx, game, this.camera, w, h);
    drawNightLight(ctx, game, this.camera, w, h);
    drawWeather(ctx, game, w, h);
    drawNightStatus(ctx, game, w, h);
    this.lootPrompts(game, w, h);
    if (pull) {
      ctx.textAlign = "center";
      ctx.font = "bold 28px Georgia";
      ctx.fillStyle = "#efe2ff";
      ctx.fillText("WILDBOUND!", w / 2, h / 2 - 80);
    }
    const bx = w / 2 + (CENTER - this.camera.x) * this.camera.zoom,
      by = h / 2 + (CENTER - this.camera.y) * this.camera.zoom;
    if (bx < 0 || bx > w || by < 0 || by > h) {
      const dx = bx - w / 2,
        dy = by - h / 2,
        s = Math.min(
          (w / 2 - 28) / Math.max(1, Math.abs(dx)),
          (h / 2 - 65) / Math.max(1, Math.abs(dy)),
        );
      const x = w / 2 + dx * s,
        y = h / 2 + dy * s;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(dy, dx));
      ctx.fillStyle = "#ffe2a0";
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-6, -6);
      ctx.lineTo(-6, 6);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#ffe2a0";
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      ctx.fillText("BOARD", x, y + 15);
    }
    const gradient = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.25,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.65,
    );
    gradient.addColorStop(0, "#071c1300");
    gradient.addColorStop(1, "#061a17bb");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    for (const p of game.players.filter((p) => p.hp <= 0 && !p.room)) {
      const dx = (p.x - this.camera.x) * this.camera.zoom,
        dy = (p.y - this.camera.y) * this.camera.zoom;
      const scale = Math.min(
        1,
        (w / 2 - 25) / Math.max(1, Math.abs(dx)),
        (h / 2 - 60) / Math.max(1, Math.abs(dy)),
      );
      const x = w / 2 + dx * scale,
        y = h / 2 + dy * scale;
      ctx.save();
      ctx.translate(x, y - (scale === 1 ? 22 : 0));
      ctx.rotate(scale === 1 ? Math.PI / 2 : Math.atan2(dy, dx));
      ctx.fillStyle = "#ffe4a5";
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-5, -4);
      ctx.lineTo(-5, 4);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#ffe4a5";
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      ctx.fillText(p.name + " · REVIVE", x, y + 14);
    }
    this.minimap(ctx, game, w, h);
  }
  visible(p, w, h, margin = 100) {
    return (
      Math.abs(p.x - this.camera.x) < w / this.camera.zoom / 2 + margin &&
      Math.abs(p.y - this.camera.y) < h / this.camera.zoom / 2 + margin
    );
  }
  lootPrompts(game, w, h) {
    if (!this.showLootDetails) return;
    const ctx = this.ctx,
      used = new Set(),
      boxes = [];
    ctx.save();
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    for (const p of game.players) {
      if (p.room || p.ui || p.hp <= 0) continue;
      const item = game.nearbyLoot(p);
      if (!item || used.has(item.id) || !canSee(game, item)) continue;
      used.add(item.id);
      const sx = (item.x - this.camera.x) * this.camera.zoom + w / 2,
        sy = (item.y - this.camera.y) * this.camera.zoom + h / 2;
      if (sx < 0 || sx > w || sy < 0 || sy > h) continue;
      const name =
          (ITEMS[item.type]?.name || item.type) +
          (item.qty > 1 ? " ×" + item.qty : ""),
        hint = ITEMS[item.type]?.slot
          ? (game.controlLabels?.interact || "E / Y") +
            ": collect · hold: equip"
          : (game.controlLabels?.interact || "E / Y") + ": collect",
        source = item.source || "Ground loot",
        width = Math.min(
          w - 16,
          Math.max(
            ctx.measureText(name).width,
            ctx.measureText(hint).width,
            ctx.measureText(source).width,
          ) + 20,
        ),
        height = 57;
      const heroes = game.players
        .filter((q) => !q.room && q.hp > 0)
        .map((q) => ({
          x: (q.x - this.camera.x - 16) * this.camera.zoom + w / 2,
          y: (q.y - this.camera.y - 38) * this.camera.zoom + h / 2,
          width: 32 * this.camera.zoom,
          height: 48 * this.camera.zoom,
        }));
      const candidates = [
        [sx - width / 2, sy - 38 * this.camera.zoom - height],
        [sx + 20 * this.camera.zoom, sy - height - 10],
        [sx - width - 20 * this.camera.zoom, sy - height - 10],
        [sx - width / 2, sy + 20 * this.camera.zoom],
      ].map(([x, y]) => ({
        x: clamp(x, 8, w - width - 8),
        y: clamp(y, 8, h - height - 8),
      }));
      const chosen =
        candidates.find(
          (a) =>
            ![...heroes, ...boxes.map((b) => ({ ...b, height }))].some(
              (b) =>
                a.x < b.x + b.width &&
                a.x + width > b.x &&
                a.y < b.y + b.height &&
                a.y + height > b.y,
            ),
        ) || candidates[0];
      const x = chosen.x;
      let y = chosen.y;
      for (
        let n = 0;
        n < 12 &&
        boxes.some(
          (b) =>
            x < b.x + b.width &&
            x + width > b.x &&
            y < b.y + height &&
            y + height > b.y,
        );
        n++
      )
        y = y + height * 2 < h ? y + height + 5 : Math.max(8, y - height - 5);
      boxes.push({ x, y, width });
      ctx.strokeStyle = p.color || "#dfc383";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 12 * this.camera.zoom);
      ctx.lineTo(clamp(sx, x + 8, x + width - 8), y + height);
      ctx.stroke();
      ctx.fillStyle = "#0e1b18ef";
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = ITEMS[item.type]?.color || "#efe3bc";
      ctx.fillText(name, x + 10, y + 16);
      ctx.font = "10px monospace";
      ctx.fillStyle = "#b9cbbd";
      ctx.fillText(source, x + 10, y + 31);
      ctx.fillStyle = "#efe3bc";
      ctx.fillText(hint, x + 10, y + 46);
      ctx.font = "12px monospace";
    }
    ctx.restore();
  }
  ground(ctx, sx, sy, ex, ey, desert) {
    for (let cy = Math.floor(sy / 8); cy < Math.ceil(ey / 8); cy++)
      for (let cx = Math.floor(sx / 8); cx < Math.ceil(ex / 8); cx++) {
        const key = `${desert}:${cx}:${cy}`;
        let canvas = this.groundChunks.get(key);
        if (!canvas) {
          canvas = document.createElement("canvas");
          canvas.width = canvas.height = 256;
          const c = canvas.getContext("2d");
          for (let yy = 0; yy < 8; yy++)
            for (let xx = 0; xx < 8; xx++) {
              const x = cx * 8 + xx,
                y = cy * 8 + yy,
                r = hash(x, y),
                d = Math.hypot(x - 24.5, y - 24.5);
              c.fillStyle = desert
                ? ["#b98d55", "#c49a60", "#ae804b", "#d0a66b"][
                    Math.floor(r * 4)
                  ]
                : d < 5
                  ? ["#465139", "#414e36", "#48543b"][Math.floor(r * 3)]
                  : ["#263f2c", "#29422e", "#2d4631", "#304733"][
                      Math.floor(r * 4)
                    ];
              c.fillRect(xx * 32, yy * 32, 32, 32);
            }
          if (this.groundChunks.size >= 100)
            this.groundChunks.delete(this.groundChunks.keys().next().value);
          this.groundChunks.set(key, canvas);
        }
        ctx.drawImage(canvas, cx * 256, cy * 256);
      }
  }
  floor(ctx, w, h, game) {
    const sx = Math.max(
        0,
        Math.floor((this.camera.x - w / this.camera.zoom / 2) / 32),
      ),
      ex = Math.min(
        50,
        Math.ceil((this.camera.x + w / this.camera.zoom / 2) / 32),
      ),
      sy = Math.max(
        0,
        Math.floor((this.camera.y - h / this.camera.zoom / 2) / 32),
      ),
      ey = Math.min(
        50,
        Math.ceil((this.camera.y + h / this.camera.zoom / 2) / 32),
      );
    this.ground(ctx, sx, sy, ex, ey, game.generatedEnvironment === "desert");
    for (let y = sy; y < ey; y++)
      for (let x = sx; x < ex; x++) {
        const r = hash(x, y),
          d = Math.hypot(x - 24.5, y - 24.5);
        const kind = waterAt(game, x * 32 + 16, y * 32 + 16);
        if(game.house?.pools&&kind==='water')continue;
        if(['snow','ice','wood','path','temple_stone'].includes(kind)){
          ctx.fillStyle=kind==='temple_stone'?(r>.5?'#7c8766':'#6c785c'):kind==='snow'?(r>.5?'#dce9eb':'#cadde1'):kind==='ice'?'#96c9df':kind==='wood'?(y%2?'#997450':'#a5815a'):'#c1b49a';
          ctx.fillRect(x*32,y*32,32,32);ctx.strokeStyle=kind==='ice'?'#e3f6f7':kind==='wood'?'#73573f':'#b3cdd4';ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(x*32+2,y*32+16);ctx.lineTo(x*32+30,y*32+(kind==='ice'?4:16));ctx.stroke();continue;
        }
        if (kind === "quicksand") {
          ctx.fillStyle = "#8e6a45";
          ctx.fillRect(x * 32, y * 32, 32, 32);
          ctx.fillStyle='#ae8757';
          for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])if(waterAt(game,(x+dx)*32+16,(y+dy)*32+16)!=='quicksand')ctx.fillRect(x*32+(dx===1?29:0),y*32+(dy===1?29:0),dx?3:32,dy?3:32);
          ctx.strokeStyle = "#c29a62aa";
          if(r>.76){
          ctx.beginPath();
          ctx.arc(
            x * 32 + 16,
            y * 32 + 16,
            8 + Math.sin(game.time * 2 + x + y) * 2,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
          }
        }
        if (kind === 'mud') {
          ctx.fillStyle=r>.5?'#887653':'#7c704f';ctx.fillRect(x*32,y*32,32,32);
          for(let n=0;n<8;n++){ctx.fillStyle=n%2?'#b9a07166':'#574d3c55';ctx.fillRect(x*32+hash(x+n,y)*28,y*32+hash(y+n,x)*28,3,1);}
          ctx.fillStyle='#c9b88a66';ctx.fillRect(x*32+5+Math.sin(game.time*1.3+y)*3,y*32+11,14,1);ctx.fillRect(x*32+13,y*32+24,10,1);
        }
        if (game.generatedEnvironment === "desert" && kind === "shallow") {
          ctx.fillStyle = "#4a9a91";
          ctx.fillRect(x * 32, y * 32, 32, 32);
          ctx.fillStyle = "#78c6ae66";
          ctx.fillRect(x * 32 + 4, y * 32 + 9, 20, 2);
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = "#6e9b53";
            ctx.fillRect(x * 32 + 7, y * 32 + 7, 2, 13);
            ctx.fillRect(x * 32 + 10, y * 32 + 4, 2, 16);
            ctx.fillRect(x * 32 + 14, y * 32 + 10, 2, 10);
          }
        }
        if (["water", "shallow", "bridge", "floodbridge"].includes(kind)) {
          drawWaterSurface(ctx,game,x*32,y*32,32,32);
          ctx.fillStyle = "#588a963f";
          ctx.fillRect(
            x * 32 + ((game.time * 6 + y * 3) % 20),
            y * 32 + 8,
            12,
            2,
          );
          ctx.fillRect(x * 32 + 3, y * 32 + 23, 17, 2);
          if (kind === "bridge" || kind === "floodbridge") {
            ctx.fillStyle = "#8f714a";
            ctx.fillRect(x * 32, y * 32 + 2, 32, 28);
            ctx.fillStyle = "#493d2e";
            for (let n = 0; n < 32; n += 6)
              ctx.fillRect(x * 32 + n, y * 32 + 2, 1, 28);
          }
          if (kind === "floodbridge") {
            ctx.fillStyle = "#477d91aa";
            ctx.fillRect(x * 32, y * 32, 32, 32);
            ctx.fillStyle = "#a1cac47f";
            ctx.fillRect(
              x * 32 + 3,
              y * 32 + 12 + Math.sin(game.time * 2 + x) * 4,
              24,
              1,
            );
          }
        }
        if (kind === "grass" && d > 5 && r > 0.22) {
          for (let i = 0; i < 3; i++) {
            const px = x * 32 + 4 + hash(x + i, y) * 24,
              py = y * 32 + 8 + hash(x, y + i) * 20;
            ctx.fillStyle = i === 0 ? "#66804b" : "#45633d";
            ctx.fillRect(Math.round(px), py - 4, 1, 5);
            ctx.fillRect(
              Math.round(px + Math.sin(game.time * 1.5 + x + i) * 1.3),
              py - 6,
              1,
              3,
            );
          }
        }
        ctx.strokeStyle = d < 5 ? "#81926b20" : "#6b866120";
        ctx.lineWidth = 0.6;
        ctx.strokeRect(x * 32 + 0.3, y * 32 + 0.3, 31.4, 31.4);
        ctx.fillStyle = d < 5 ? "#77806035" : "#5d774050";
        ctx.fillRect(x * 32 + 5 + r * 19, y * 32 + 7 + r * 16, 2, 1);
        if (r > 0.7) {
          ctx.fillStyle = "#132f2350";
          ctx.fillRect(x * 32 + 20, y * 32 + 12, 3, 2);
        }
        if (
          game.phase === "won" ||
          (game.bloom < 3 &&
            Math.hypot(x * 32 + 16 - CENTER, y * 32 + 16 - CENTER) >
              game.bloom * 430)
        ) {
          ctx.fillStyle = "#888a8e";
          ctx.fillRect(x * 32, y * 32, 32.5, 32.5);
          ctx.strokeStyle = "#73767a";
          ctx.strokeRect(x * 32, y * 32, 32, 32);
        }
        if (game.phase === "sealing") {
          ctx.fillStyle =
            "rgba(136,138,142," + Math.min(1, game.sealTime / 3) + ")";
          ctx.fillRect(x * 32, y * 32, 32.5, 32.5);
        }
      }
    ctx.strokeStyle = "#a2b67840";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, WORLD - 4, WORLD - 4);
  }
  boardBase(ctx, game) {
    ctx.save();
    const b=BOARD_TABLE;
    ctx.fillStyle='#17251d55';ctx.beginPath();ctx.ellipse(CENTER,CENTER+9,36,15,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#443020';
    for(const x of [b.x+3,b.x+b.w-8])ctx.fillRect(x,b.y+8,5,23);
    ctx.fillStyle='#5a3d28';ctx.fillRect(b.x,b.y-b.surfaceHeight+5,b.w,b.h);
    ctx.restore();
  }
  boardTop(ctx, game) {
    ctx.save();
    const b=BOARD_TABLE;
    ctx.fillStyle='#987047';ctx.fillRect(b.x,b.y-b.surfaceHeight,b.w,b.h);
    ctx.translate(
      CENTER + (game.tableShake ? Math.sin(this.age * 90) * 2 : 0),
      CENTER-b.surfaceHeight,
    );
    // Full board (including both leaves) fits on a two-tile tabletop.
    ctx.scale(60 / 282, 28 / 160);
    drawBoard(ctx, game, game.roll?.elapsed??this.age,{drawDie});
    ctx.restore();
  }
  minimap(ctx, game, w, h) {
    const s = 65,
      x = w - s - 14,
      y = h - s - 65;
    ctx.fillStyle = "#10271ecc";
    ctx.fillRect(x - 4, y - 4, s + 8, s + 8);
    ctx.strokeStyle = "#82966860";
    ctx.strokeRect(x, y, s, s);
    for (const i of game.explored) {
      const tx = i % 50,
        ty = Math.floor(i / 50),
        kind = waterAt(game, tx * 32 + 16, ty * 32 + 16);
      ctx.fillStyle =
        kind === "water"
          ? "#244b60"
          : isShallow(kind)
            ? "#497b79"
            : kind === "bridge"
              ? "#a28a56"
              : "#334c35";
      ctx.fillRect(
        x + (tx * s) / 50,
        y + (ty * s) / 50,
        s / 50 + 0.1,
        s / 50 + 0.1,
      );
    }
    for (const e of game.enemies) {
      if (
        !game.explored.has(Math.floor(e.y / 32) * 50 + Math.floor(e.x / 32)) &&
        !canSee(game, e)
      )
        continue;
      ctx.fillStyle = "#ed9275";
      ctx.fillRect(x + (e.x / WORLD) * s, y + (e.y / WORLD) * s, 1.5, 1.5);
    }
    const treasures = [
      ...game.loot,
      ...(game.phase === "won" ? [{ x: 800, y: 915 }] : []),
    ];
    for (const t of treasures) {
      if (
        game.phase !== "won" &&
        !game.explored.has(Math.floor(t.y / 32) * 50 + Math.floor(t.x / 32))
      )
        continue;
      ctx.fillStyle = "#ffe18c";
      ctx.fillRect(x + (t.x / WORLD) * s - 1, y + (t.y / WORLD) * s - 1, 2, 2);
    }
    ctx.fillStyle = "#d4ba72";
    ctx.fillRect(x + s / 2 - 1.5, y + s / 2 - 1.5, 3, 3);
    for (const p of game.players) {
      const mx = x + (p.x / WORLD) * s,
        my = y + (p.y / WORLD) * s;
      if (p.room) {
        ctx.strokeStyle = "#cc81ff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(mx, my, 2, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.hp <= 0) {
        ctx.fillStyle = "#ffdda4";
        ctx.shadowColor = "#ffba65";
        ctx.shadowBlur = 4 + 3 * Math.sin(this.age * 6);
        ctx.fillRect(mx - 2, my - 2, 4, 4);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = p.color;
        ctx.font = "6px monospace";
        ctx.textAlign = "center";
      }
    }
    ctx.fillStyle = "#a4b58e";
    ctx.font = "4px monospace";
    ctx.textAlign = "center";
    ctx.fillText("● PARTY · + DOWN · ◇ LOOT", x + s / 2, y + s + 8);
    for (const door of game.portals) {
      ctx.strokeStyle =
        game.players.find((p) => p.id === door.owner)?.color || "#b987dd";
      ctx.strokeRect(
        x + (door.x / WORLD) * s - 2,
        y + (door.y / WORLD) * s - 2,
        4,
        4,
      );
    }
    if (game.ping?.until > game.time) {
      ctx.strokeStyle = game.ping.color;
      ctx.beginPath();
      ctx.arc(
        x + (game.ping.x / WORLD) * s,
        y + (game.ping.y / WORLD) * s,
        4,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
  }
}
function trailPoint(i) {
  const a = (i / 48) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.cos(a) * 35, y: Math.sin(a) * 23 };
}
export function drawDie(ctx, x, y, size, value, angle) {
  const rx = angle + 0.55,
    ry = angle * 0.71 + 0.45,
    rz = angle * 0.33;
  const rotate = ([a, b, c]) => {
    let yy = b * Math.cos(rx) - c * Math.sin(rx),
      zz = b * Math.sin(rx) + c * Math.cos(rx);
    let xx = a * Math.cos(ry) + zz * Math.sin(ry);
    zz = -a * Math.sin(ry) + zz * Math.cos(ry);
    return [
      xx * Math.cos(rz) - yy * Math.sin(rz),
      xx * Math.sin(rz) + yy * Math.cos(rz),
      zz,
    ];
  };
  const vertices = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ].map(rotate);
  const faces = [
    { v: [0, 1, 2, 3], n: 7 - value, c: "#8c754d" },
    { v: [4, 7, 6, 5], n: value, c: "#f2ddb0" },
    { v: [0, 4, 5, 1], n: 2, c: "#d7bb85" },
    { v: [3, 2, 6, 7], n: 5, c: "#a68a5b" },
    { v: [0, 3, 7, 4], n: 3, c: "#c5a872" },
    { v: [1, 5, 6, 2], n: 4, c: "#e8ce9b" },
  ].sort(
    (a, b) =>
      a.v.reduce((s, i) => s + vertices[i][2], 0) -
      b.v.reduce((s, i) => s + vertices[i][2], 0),
  );
  ctx.save();
  ctx.translate(x, y);
  for (const f of faces) {
    const p = f.v.map((i) => [vertices[i][0] * size, vertices[i][1] * size]);
    ctx.beginPath();
    p.forEach((v, i) => (i ? ctx.lineTo(...v) : ctx.moveTo(...v)));
    ctx.closePath();
    ctx.fillStyle = f.c;
    ctx.fill();
    ctx.strokeStyle = "#725431";
    ctx.lineWidth = 0.7;
    ctx.stroke();
    const coords =
      f.n === 1
        ? [[0.5, 0.5]]
        : f.n === 2
          ? [
              [0.25, 0.25],
              [0.75, 0.75],
            ]
          : f.n === 3
            ? [
                [0.25, 0.25],
                [0.5, 0.5],
                [0.75, 0.75],
              ]
            : f.n === 4
              ? [
                  [0.25, 0.25],
                  [0.75, 0.25],
                  [0.25, 0.75],
                  [0.75, 0.75],
                ]
              : f.n === 5
                ? [
                    [0.25, 0.25],
                    [0.75, 0.25],
                    [0.5, 0.5],
                    [0.25, 0.75],
                    [0.75, 0.75],
                  ]
                : [
                    [0.25, 0.25],
                    [0.25, 0.5],
                    [0.25, 0.75],
                    [0.75, 0.25],
                    [0.75, 0.5],
                    [0.75, 0.75],
                  ];
    ctx.fillStyle = "#3a3927";
    for (const [u, v] of coords) {
      const a =
          p[0][0] * (1 - u) * (1 - v) +
          p[1][0] * u * (1 - v) +
          p[2][0] * u * v +
          p[3][0] * (1 - u) * v,
        b =
          p[0][1] * (1 - u) * (1 - v) +
          p[1][1] * u * (1 - v) +
          p[2][1] * u * v +
          p[3][1] * (1 - u) * v;
      ctx.fillRect(Math.round(a) - 1, Math.round(b) - 1, 2, 2);
    }
  }
  ctx.restore();
}
export function drawMenu(canvas, assets, time) {
  const w = Math.round(canvas.clientWidth / 2),
    h = Math.round(canvas.clientHeight / 2);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const c = canvas.getContext("2d");
  c.imageSmoothingEnabled = false;
  c.fillStyle = "#12342a";
  c.fillRect(0, 0, w, h);
  const cx = w * 0.52,
    cy = h * 0.48;
  c.save();
  c.translate(cx, cy);
  c.rotate(-0.14);
  for (let y = -7; y < 8; y++)
    for (let x = -7; x < 8; x++) {
      c.strokeStyle = "#79997416";
      c.strokeRect(x * 23, y * 23, 23, 23);
    }
  c.restore();
  const g = c.createRadialGradient(cx, cy, 10, cx, cy, w * 0.66);
  g.addColorStop(0, "#b6aa6539");
  g.addColorStop(1, "#0a211e00");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) {
    let x = hash(i, 3) * w,
      y = hash(i, 7) * h;
    if (Math.hypot((x - cx) * 0.8, y - cy) < w * 0.27) continue;
    assets.draw(c, i % 3 ? "fern" : "tree", x, y, i % 3 ? 60 : 110);
  }
  c.save();
  c.translate(cx, cy + Math.sin(time) * 2);
  c.rotate(-0.12);
  c.fillStyle = "#051e1966";
  c.fillRect(-79, -53, 164, 142);
  c.scale(0.78, 0.78);
  drawBoard(c, { players: [], current: null, roll: null, event: null }, time);
  c.restore();
  assets.draw(c, "explorer-teal", cx - 85, cy + 71, 49);
  assets.draw(c, "explorer-coral", cx + 76, cy + 63, 49);
  assets.draw(c, "lion", cx + 89, cy - 91, 64);
  assets.draw(c, "bat", cx - 74, cy - 96 + Math.sin(time * 2) * 4, 42);
  drawDie(c, cx - 12, cy - 11, 10, 4, 0.4);
  drawDie(c, cx + 17, cy + 9, 8, 3, 0.8);
  for (let i = 0; i < 17; i++) {
    c.fillStyle = i % 2 ? "#b8c87588" : "#e5bf7966";
    c.fillRect(
      hash(i, 12) * w + Math.sin(time + i) * 4,
      hash(i, 14) * h + Math.cos(time * 0.6 + i) * 5,
      1,
      1,
    );
  }
  const vignette = c.createRadialGradient(cx, cy, w * 0.2, cx, cy, w * 0.8);
  vignette.addColorStop(0, "#071c1300");
  vignette.addColorStop(1, "#061d19bb");
  c.fillStyle = vignette;
  c.fillRect(0, 0, w, h);
}


