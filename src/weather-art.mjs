import { nearbyScenery } from "./performance.mjs";
import { sightRadius } from './night-cycle.mjs';
import { terrainHash } from "./world.mjs";
import { rules } from "./definitions.mjs";
import { waterAt, isShallow } from "./environment.mjs";
let fogCanvas, memoryCanvas, memoryKey, memorySet;
export function drawFog(ctx, g, camera, w, h) {
  if (g.phase !== "play") return;
  // Fog is deliberately soft. A half-resolution mask preserves its world-space
  // footprint while reducing blur/compositing pixels by three quarters.
  const outputW = w,
    outputH = h;
  w = Math.ceil(w / 2);
  h = Math.ceil(h / 2);
  camera = { ...camera, zoom: camera.zoom / 2 };
  fogCanvas ||= document.createElement("canvas");
  memoryCanvas ||= document.createElement("canvas");
  if (fogCanvas.width !== w || fogCanvas.height !== h) {
    fogCanvas.width = w;
    fogCanvas.height = h;
  }
  // Cache a softly edged exploration mask. The live vision cut-outs are continuous circles.
  const key = g.seed + ":" + g.explored.size;
  if (memoryKey !== key || memorySet !== g.explored) {
    memorySet = g.explored;
    memoryKey = key;
    memoryCanvas.width = 400;
    memoryCanvas.height = 400;
    const m = memoryCanvas.getContext("2d");
    m.fillStyle = "#fff";
    for (const i of g.explored)
      m.fillRect((i % 50) * 8, Math.floor(i / 50) * 8, 8, 8);
  }
  const c = fogCanvas.getContext("2d");
  c.clearRect(0, 0, w, h);
  c.globalCompositeOperation = "source-over";
  c.fillStyle = "#070f16";
  c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = "destination-out";
  c.globalAlpha = 0.38;
  c.imageSmoothingEnabled = true;
  // Feather roughly half a tile in world space while retaining the explored grid.
  c.filter = `blur(${Math.max(.75,16*camera.zoom)}px)`;
  c.drawImage(
    memoryCanvas,
    w / 2 - camera.x * camera.zoom,
    h / 2 - camera.y * camera.zoom,
    1600 * camera.zoom,
    1600 * camera.zoom,
  );
  c.filter = "none";
  c.globalAlpha = 1;
  for (const p of g.players) {
    if (p.room || p.hp <= 0) continue;
    const radius = sightRadius(g, p, rules.visionRadius) * camera.zoom;
    const x = w / 2 + (p.x - camera.x) * camera.zoom,
      y = h / 2 + (p.y - camera.y) * camera.zoom;
    const gradient = c.createRadialGradient(x, y, radius * 0.35, x, y, radius);
    gradient.addColorStop(0, "rgba(0,0,0,1)");
    gradient.addColorStop(0.25, "rgba(0,0,0,.92)");
    gradient.addColorStop(0.6, "rgba(0,0,0,.5)");
    gradient.addColorStop(0.82, "rgba(0,0,0,.15)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = gradient;
    c.beginPath();
    c.arc(x, y, radius, 0, Math.PI * 2);
    c.fill();
  }
  c.globalCompositeOperation = "source-over";
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(fogCanvas, 0, 0, outputW, outputH);
  ctx.restore();
}
export function drawRain(c, g, camera, w, h) {
  if (g.weather?.type !== "monsoon") return;
  const left = camera.x - w / camera.zoom / 2 - 100,
    top = camera.y - h / camera.zoom / 2 - 30;
  const right = left + w / camera.zoom + 200,
    bottom = top + h / camera.zoom + 160;
  const wind = 8 + Math.sin(g.time * 0.6) * 5;
  for (let ty = Math.floor(top / 28); ty < bottom / 28; ty++)
    for (let tx = Math.floor(left / 28); tx < right / 28; tx++) {
      const seed = terrainHash(tx, ty),
        speed = 1.2 + seed * 1.7,
        cycle = g.time * speed + seed * 23,
        phase = cycle % 1;
      const x = tx * 28 + terrainHash(tx + Math.floor(cycle), ty) * 28,
        y = ty * 28 + seed * 28;
      let hitY = y,
        canopy = false;
      for (const p of nearbyScenery(g.scenery, x, y, 0)) {
        if (
          p.kind === "tree" &&
          !p.falling &&
          Math.abs(x - p.x) < p.size * 0.32 &&
          Math.abs(y - (p.y - p.size * 0.23)) < p.size * 0.2
        ) {
          hitY = p.y - p.size * 0.37;
          canopy = true;
          break;
        }
      }
      if (phase < 0.76) {
        const z = (1 - phase / 0.76) * (65 + seed * 45);
        c.strokeStyle = seed > 0.7 ? "#b1d1cf80" : "#7aa9b15c";
        c.lineWidth = seed > 0.85 ? 1.3 : 0.7;
        c.beginPath();
        c.moveTo(x + (wind * z) / 70, hitY - z);
        c.lineTo(x + (wind * z) / 70 - 2, hitY - z + 5 + seed * 7);
        c.stroke();
      } else {
        const t = (phase - 0.76) / 0.24;
        c.globalAlpha = (1 - t) * 0.6;
        c.strokeStyle = canopy ? "#a9ca97" : "#b6d6cb";
        c.lineWidth = 0.7;
        c.beginPath();
        c.ellipse(
          x,
          hitY,
          1 + t * (isShallow(waterAt(g, x, y)) ? 8 : 4),
          0.5 + t * 1.8,
          0,
          0,
          Math.PI * 2,
        );
        c.stroke();
        if (canopy || seed > 0.6) {
          c.fillStyle = "#bddbcc";
          c.fillRect(x - 2 - t * 4, hitY - Math.sin(t * Math.PI) * 4, 1, 1);
          c.fillRect(x + 2 + t * 3, hitY - Math.sin(t * Math.PI) * 3, 1, 1);
        }
        c.globalAlpha = 1;
      }
    }
}
