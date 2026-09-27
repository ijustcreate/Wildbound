import {drawIceProp,iceBase,ICE_PROPS} from './ice-world.mjs';
import { terrainHash } from "./world.mjs";
export const propBase = (p) => ICE_PROPS.includes(p.kind)?iceBase(p):({
  x: p.x,
  y: p.y + p.size * (p.kind === "tree" ? 0.35 : 0.19),
});
export function waterAt(g, x, y) {
  if (g.phase === "won") return "grass";
  const tx = Math.floor(x / 32),
    ty = Math.floor(y / 32);
  if (tx < 0 || ty < 0 || tx >= 50 || ty >= 50) return "water";
  let base = g.terrain?.[ty * 50 + tx] || "grass";
  if(g.house?.pools){if(g.house.pools.some(p=>x>=p.x&&y>=p.y&&x<p.x+p.w&&y<p.y+p.h))return 'water';if(base==='water')base='grass';}
  if (g.weather?.type !== "monsoon") return base;
  if (base === "bridge") return "floodbridge";
  if (base === "grass")
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = tx + dx,
        ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= 50 || ny >= 50) continue;
      if (["water", "shallow", "bridge"].includes(g.terrain?.[ny * 50 + nx]))
        return "shallow";
    }
  return base;
}
export const isShallow = (type) => type === "shallow" || type === "floodbridge";
export const isQuicksand = (type) => type === "quicksand";
export function harvest(g, p, damage, range) {
  const candidates = g.scenery
    .filter(
      (s) => !s.falling && !s.depleted && ["tree", "rock", "snow_tree", "ice_rock", "ice_spire", "frozen_log"].includes(s.kind),
    )
    .map((s) => ({ s, b: propBase(s) }))
    .filter(({ b }) => {
      const dx = b.x - p.x,
        dy = b.y - (p.y + 14),
        d = Math.hypot(dx, dy);
      return (
        d < range &&
        d > 0 &&
        (dx * p.faceX + dy * p.faceY) /
          (d * (Math.hypot(p.faceX, p.faceY) || 1)) >=
          Math.cos(Math.PI / 4)
      );
    })
    .sort(
      (a, b) =>
        Math.hypot(a.b.x - p.x, a.b.y - p.y) -
        Math.hypot(b.b.x - p.x, b.b.y - p.y),
    );
  const hit = candidates[0];
  if (!hit) return false;
  const { s, b } = hit;
  g.onSound(["rock","ice_rock","ice_spire"].includes(s.kind)?"mine":"harvest",p);
  s.hitAt = g.time;
  s.harvest = (s.harvest || 0) + Math.max(12, damage);
  const drop = (type, qty) => {
    g.dropLoot(p.x + p.faceX * 12, p.y + p.faceY * 12, type, qty, "Harvested");
    g.loot.at(-1).manualPickup = true;
  };
  if (["tree","snow_tree","frozen_log"].includes(s.kind)) {
    drop("stick", 1);
    s.maxHarvest ||= Math.round(s.size * 0.85);
    if (s.harvest >= s.maxHarvest) {
      s.falling = 0.001;
      s.fallDirection = p.faceX < 0 ? -1 : 1;
      s.logCount = Math.max(2, Math.round(s.size / 32));
    }
  } else {
    s.maxHarvest = 36;
    s.chunks ??= Math.max(2, Math.round(s.size / 16));
    if (s.harvest >= 36) {
      s.harvest -= 36;
      s.chunks--;
      s.chipped = (s.chipped || 0) + 1;
      drop("stone", 1);
      if (s.chunks <= 0) {
        s.depleted = true;
        s.falling = 0.001;
      }
    }
  }
  (g.environmentParticles ||= []).push({
    x: b.x,
    y: b.y - 12,
    life: 0.5,
    kind: s.kind,
  });
  g.persist();
  return true;
}
export function tickEnvironment(g, dt) {
  g.footprints ||= [];
  g.environmentParticles ||= [];
  g.footprints = g.footprints.filter((f) => g.time - f.time < 18);
  g.environmentParticles = g.environmentParticles.filter(
    (f) => (f.life -= dt) > 0,
  );
  for (const s of g.scenery)
    if (s.falling) {
      s.falling += dt;
      if (s.falling >= 1.2 && !s.depleted) {
        s.depleted = true;
        const b = propBase(s);
        g.dropLoot(
          b.x + s.fallDirection * s.size * 0.35,
          b.y,
          "log",
          s.logCount || 2,
          "Felled tree",
        );
        g.loot.at(-1).manualPickup = true;
        g.persist();
      }
    }
  g.scenery = g.scenery.filter((s) => !(s.falling >= 1.5));
  for (const a of [...g.players, ...g.enemies]) {
    if (
      a.room ||
      a.hp <= 0 ||
      ["bat", "wasp", "snake", "vine"].includes(a.kind)
    )
      continue;
    const last = a.trackPosition;
    if (
      last &&
      Math.hypot(a.x - last.x, a.y - last.y) >= 15 &&
      Math.hypot(a.x - last.x, a.y - last.y) < 100
    ) {
      a.trackSide = -(a.trackSide || 1);
      const angle = Math.atan2(a.y - last.y, a.x - last.x),
        water = isShallow(waterAt(g, a.x, a.y + 14));
      g.footprints.push({
        x: a.x + Math.sin(angle) * a.trackSide * 3,
        y: a.y + 14 - Math.cos(angle) * a.trackSide * 3,
        angle,
        time: g.time,
        water,
        animal: !!a.kind,
      });
      a.trackPosition = { x: a.x, y: a.y };
    } else if (!last || Math.hypot(a.x - last.x, a.y - last.y) >= 100)
      a.trackPosition = { x: a.x, y: a.y };
  }
  if (g.footprints.length > 600)
    g.footprints.splice(0, g.footprints.length - 600);
}
export function drawTracks(c, g) {
  for (const f of g.footprints || []) {
    const t = g.time - f.time;
    c.save();
    c.translate(f.x, f.y);
    if (f.water) {
      if (t > 1) {
        c.restore();
        continue;
      }
      c.globalAlpha = (1 - t) * 0.6;
      c.strokeStyle = "#b1d3bc";
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(0, 0, 3 + t * 13, 1 + t * 5, 0, 0, Math.PI * 2);
      c.stroke();
      if (t < 0.3) {
        c.fillStyle = "#c8e6d4";
        c.fillRect(-5, -4 - t * 12, 2, 2);
        c.fillRect(4, -2 - t * 8, 2, 2);
      }
    } else {
      c.globalAlpha = Math.max(0, 1 - t / 18) * 0.36;
      c.rotate(f.angle);
      c.fillStyle = "#15281f";
      c.fillRect(-2, -1, f.animal ? 3 : 5, 2);
      if (f.animal) {
        c.fillRect(2, -2, 1, 1);
        c.fillRect(2, 1, 1, 1);
      }
    }
    c.restore();
  }
  for (const f of g.environmentParticles || []) {
    c.fillStyle = f.kind === "tree" ? "#c29a57" : "#a5aaa2";
    for (let i = 0; i < 6; i++) {
      const a = i * 2.4;
      c.fillRect(
        f.x + Math.cos(a) * (1 - f.life) * 25,
        f.y + Math.sin(a) * 14 * (1 - f.life) + 8 * (1 - f.life),
        2,
        2,
      );
    }
  }
}
export function drawProp(c, p, time) {
  if(drawIceProp(c,p,time))return true;
  if (!p.procedural) return false;
  const base = propBase(p),
    seed = terrainHash(p.x, p.y),
    scale = p.size / 64;
  c.save();
  c.translate(Math.round(base.x), Math.round(base.y));
  c.scale(scale, scale);
  if (p.falling) {
    c.rotate(
      ((p.fallDirection || 1) * Math.min(1, p.falling / 1.1) * Math.PI) / 2,
    );
    c.globalAlpha *= Math.max(0, 1 - Math.max(0, p.falling - 1) * 2);
  }
  const r = (x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  if (p.kind === "tree") {
    r(-13, -2, 26, 4, "#192d22");
    r(-6, -39, 12, 39, "#493d2c");
    r(-4, -39, 5, 38, "#98704a");
    r(1, -35, 3, 33, "#bd945b");
    r(-10, -4, 6, 5, "#6d5036");
    r(5, -6, 6, 6, "#795a39");
    const sway = Math.sin(time * 1.5 + seed * 8) * 1.1;
    for (let i = 0; i < 7; i++) {
      const h = terrainHash(i, seed * 100),
        x = Math.cos(i * 2.4) * 15 + sway,
        y = -36 - Math.sin(i * 1.8) * 9;
      const crown = (cx, cy, rx, ry, color) => {
        for (let row = -ry; row <= ry; row += 2) {
          const half =
            Math.floor(
              (Math.sqrt(Math.max(0, 1 - (row * row) / (ry * ry))) * rx) / 2,
            ) * 2;
          r(cx - half, cy + row, half * 2, 2, color);
        }
      };
      crown(x, y, 14, 12, "#203d2d");
      crown(x - 1, y - 2, 12, 10, "#31573b");
      crown(x - 3, y - 6, 9, 5, "#60804a");
      crown(x - 5, y - 8, 5, 2, "#8c9b5c");
      for (let n = 0; n < 6; n++) {
        const lx = x - 8 + terrainHash(n, i + seed) * 17,
          ly = y - 7 + terrainHash(i, n + seed) * 13;
        r(lx, ly, 2, 1, n % 2 ? "#436943" : "#789154");
      }
    }
  } else if (p.kind === "palm") {
    r(-3, -42, 6, 42, "#765331");
    r(-8, -45, 16, 5, "#3e7047");
    r(-22, -51, 18, 5, "#4f8750");
    r(5, -54, 18, 5, "#4f8750");
    r(-16, -42, 5, 4, "#6b9b52");
    r(12, -43, 5, 4, "#6b9b52");
  } else if (p.kind === "cactus") {
    r(-4, -31, 8, 31, "#4f7049");
    r(-12, -21, 8, 5, "#5f8251");
    r(-12, -27, 5, 11, "#5f8251");
    r(4, -15, 8, 5, "#5f8251");
    r(7, -22, 5, 12, "#5f8251");
    r(-2, -29, 2, 4, "#a8aa61");
  } else if (p.kind === "dune") {
    r(-22, -3, 44, 5, "#8f693f");
    r(-17, -9, 34, 7, "#d5ad71");
    r(-9, -14, 18, 6, "#e0bb7c");
  } else if (p.kind === "rock") {
    const chip = p.chipped || 0,
      w = Math.max(10, 25 - chip * 3);
    r(-w / 2 - 3, -4, w + 6, 7, "#24372d");
    r(-w / 2, -18, w, 19, "#545f59");
    r(-w / 2 + 3, -24, w - 5, 21, "#899087");
    r(-w / 2 + 3, -24, w - 8, 5, "#bbc0a1");
    r(1, -18, w / 2 - 1, 18, "#6b766d");
    r(-3, -21, 2, 11, "#424f4a");
    r(-3, -11, 7, 2, "#424f4a");
  } else {
    const sway = Math.sin(time * 2 + seed * 7) * 2;
    r(-2, -1, 4, 3, "#233c2b");
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 5 + sway;
      r(x, -5 - Math.abs(i - 2) * 2, 4, 8, "#426b43");
      r(x + 1, -8 - Math.abs(i - 2) * 2, 2, 7, "#779250");
    }
    if (p.kind === "flower") {
      r(-1 + sway, -14, 3, 12, "#557445");
      r(-5 + sway, -15, 10, 4, "#d7976b");
      r(-2 + sway, -18, 4, 10, "#e8b57e");
      r(-1 + sway, -15, 2, 3, "#e9d391");
    }
  }
  c.restore();
  if (p.harvest && !p.falling && time - (p.hitAt || 0) < 4) {
    c.fillStyle = "#152c25";
    c.fillRect(base.x - 17, base.y + 8, 34, 5);
    c.fillStyle = p.kind === "tree" ? "#cba568" : "#a0c6c2";
    c.fillRect(
      base.x - 16,
      base.y + 9,
      32 * Math.min(1, p.harvest / (p.maxHarvest || 36)),
      3,
    );
  }
  return true;
}
