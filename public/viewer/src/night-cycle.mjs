import {eventHasStartingAreas} from './starting-area.mjs';
import { ITEMS } from './items.mjs';
import {houseLightSources} from './house-lights.mjs';

// Eight minutes of simulation time. Menus/pause never advance the sky.
export const DAY_LENGTH = 480;
export function ensureNightCycle(g) {
  g.sky ||= { elapsed: 0, days: 0, phase: 'day' };
  g.noises ||= [];
  return g.sky;
}
export function timeOfDay(g) {
  const t = ((g.sky?.elapsed || 0) % DAY_LENGTH + DAY_LENGTH) % DAY_LENGTH;
  return t < 240 ? 'day' : t < 300 ? 'dusk' : t < 450 ? 'night' : 'dawn';
}
export function daylight(g) {
  const t = ((g.sky?.elapsed || 0) % DAY_LENGTH + DAY_LENGTH) % DAY_LENGTH;
  if (t < 240) return 1;
  if (t < 300) return 1 - (t - 240) / 60;
  if (t < 450) return 0;
  return (t - 450) / 30;
}
export function carriedLight(p) {
  return ['hand1', 'hand2'].map(slot => ITEMS[p.equipment?.[slot]]?.lightSource)
    .filter(Boolean).sort((a, b) => b.radius - a.radius)[0] || null;
}
export function sightRadius(g, p, base = 280) {
  const ambient = base * (0.30 + daylight(g) * 0.70);
  return Math.max(ambient, carriedLight(p)?.radius || 0) * (g.weather?.type === 'monsoon' ? 0.8 : 1);
}
export function lightSources(g) {
  const sources = (g.players || []).filter(p => p.hp > 0 && !p.room).flatMap(p => {
    const light = carriedLight(p);
    return light ? [{ x: p.x, y: p.y, ...light }] : [];
  });
  for (const f of g.firePatches || []) if (f.life > 0)
    sources.push({ x: f.x + 16, y: f.y + 16, radius: 90, intensity: 0.8, color: '#ffaf55' });
  sources.push(...houseLightSources(g));
  return sources;
}
export function lightAt(g, point) {
  let light = daylight(g);
  for (const s of lightSources(g)) {
    const d = Math.hypot(point.x - s.x, point.y - s.y);
    light = Math.max(light, Math.max(0, 1 - d / s.radius) * (s.intensity || 1));
  }
  return light;
}
export function eventAvailable(g, event) {
  return (!event.environment || event.environment === g.generatedEnvironment)
    && (!event.environments || event.environments.includes(g.generatedEnvironment))
    && (!event.times || event.times.includes(timeOfDay(g)))
    && eventHasStartingAreas(g,event);
}
export function emitNoise(g, source, kind = 'step', radius = 100) {
  if (!source || source.room || !Number.isFinite(source.x + source.y)) return;
  ensureNightCycle(g);
  const old = g.noises.find(n => n.sourceId === source.id && n.kind === kind && n.age < 0.15);
  if (old) { Object.assign(old, { x: source.x, y: source.y, radius: Math.max(old.radius, radius), age: 0 }); return; }
  g.noises.push({ x: source.x, y: source.y, sourceId: source.id, kind, radius, age: 0 });
  if (g.noises.length > 64) g.noises.splice(0, g.noises.length - 64);
}
export function loudestNoise(g, listener, maxAge = 5) {
  let best = null, score = 0;
  for (const n of g.noises || []) {
    if (n.sourceId === listener.id || n.age > maxAge) continue;
    const d = Math.hypot(n.x - listener.x, n.y - listener.y);
    const value = (1 - d / n.radius) / (1 + n.age);
    if (value > score) { score = value; best = n; }
  }
  return best;
}
export function tickNightCycle(g, dt) {
  const sky = ensureNightCycle(g);
  if (g.phase !== 'play') return;
  sky.elapsed += dt;
  sky.days = Math.floor(sky.elapsed / DAY_LENGTH);
  const phase = timeOfDay(g);
  if (phase !== sky.phase) {
    sky.phase = phase;
    g.message?.({ dusk: 'Dusk falls. Equip a lantern or torch before the hunt.', night: 'Night has arrived. Watch the tracks and listen for movement.', dawn: 'Dawn breaks. The jungle stirs.', day: 'Daylight returns.' }[phase]);
  }
  for (const n of g.noises) n.age += dt;
  g.noises = g.noises.filter(n => n.age < 6);
}
export function movementNoise(g, p, moved) {
  if (p.room || p.hp <= 0 || moved <= 0.01 || p.jumpHeight > 2) return;
  p.noiseDistance = (p.noiseDistance || 0) + moved;
  if (p.noiseDistance < 22) return;
  p.noiseDistance %= 22;
  emitNoise(g, p, 'step', p.dashTime > 0 ? 220 : p.walking ? 45 : 125);
}

// Applied to the actor and its shadow/health bar, leaving tracks readable.
export function enemyVisibility(g, e) {
  if (e.kind !== 'night_stalker' || e.hp <= 0) return 1;
  if (e.flash > 0 || ['pounce', 'windup', 'charge'].includes(e.state)) return 0.9;
  return Math.max(0.055, Math.min(1, lightAt(g, e) * 1.5));
}

export function drawNightLight(c, g, camera, w, h) {
  if (g.phase !== 'play') return;
  const dark = 1 - daylight(g);
  c.save();
  if (dark > 0) {
    c.fillStyle = `rgba(14,22,52,${dark * 0.25})`;
    c.fillRect(0, 0, w, h);
  }
  c.globalCompositeOperation = 'screen';
  for (const s of lightSources(g)) {
    const x = w / 2 + (s.x - camera.x) * camera.zoom, y = h / 2 + (s.y - camera.y) * camera.zoom;
    const radius = s.radius * camera.zoom;
    if (x + radius < 0 || y + radius < 0 || x - radius > w || y - radius > h) continue;
    const gradient = c.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, '#ffdc8c24'); gradient.addColorStop(0.4, '#ffa44b12'); gradient.addColorStop(1, '#ffa44b00');
    c.fillStyle = gradient; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  c.restore();
}
export function drawNightStatus(c, g, w, h) {
  if (g.phase !== 'play') return;
  const phase = timeOfDay(g), t = (g.sky?.elapsed || 0) % DAY_LENGTH;
  const next = phase === 'day' ? 240 : phase === 'dusk' ? 300 : phase === 'night' ? 450 : DAY_LENGTH;
  c.save(); c.font = '8px monospace'; c.textAlign = 'right';
  const text = `${phase.toUpperCase()} · ${Math.ceil(next - t)}s`;
  c.fillStyle = '#11281fe8'; c.fillRect(w - 133, h - 24, 124, 17);
  c.fillStyle = phase === 'night' ? '#c8d8ff' : '#ebd494'; c.fillText(text, w - 17, h - 12);
  const hunter = g.enemies?.find(e=>e.kind==='hunter' && e.night?.objective?.status==='active');
  if(hunter) {
    const remaining=Math.ceil(120-hunter.night.objective.elapsed);
    const label=`HUNTER · ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')} · Survive or defeat him`;
    c.textAlign='center';c.fillStyle='#201b17eb';c.fillRect(w/2-150,36,300,28);
    c.fillStyle='#edcc83';c.fillText(label,w/2,47);
    c.fillStyle='#567a5a';c.fillRect(w/2-138,54,276*(1-remaining/120),3);
  }
  c.restore();
}
export function rewardNightHunts(g) {
  for(const result of g.nightEnemies?.objectives || []) {
    if(result.rewarded)continue;
    result.rewarded=true;
    for(const p of g.players)p.coins=(p.coins||0)+20;
    g.message(result.status==='killed'?'Hunter defeated. His equipment is yours to collect.':'The hunter withdraws. You survived the two-minute hunt.');
    g.onSound('win');g.persist();
  }
}
