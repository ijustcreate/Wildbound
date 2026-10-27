import {eventHasStartingAreas} from './starting-area.mjs';
import { ITEMS } from './items.mjs';
import {houseLightSources} from './house-lights.mjs';
import {cemeteryEvent} from './graveyard-events.mjs';
import {UPPER_TORCHES} from './temple-upper-art.mjs';
import {worldLightField} from './world-lighting.mjs';
import {pointLightVisibility} from './realtime-shadows.mjs';
const sourceFrames=new WeakMap();
let nightMask;

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
  if(g.generatedEnvironment==='caverns')return .4;
  if(g.generatedEnvironment==='shadow')return .3;
  const t = ((g.sky?.elapsed || 0) % DAY_LENGTH + DAY_LENGTH) % DAY_LENGTH;
  if (t < 240) return 1;
  if (t < 300) return 1 - (t - 240) / 60;
  if (t < 450) return 0;
  return (t - 450) / 30;
}
export function carriedLight(p) {
  const equipped=['hand1', 'hand2'].map(slot => ITEMS[p.equipment?.[slot]]?.lightSource)
    .filter(Boolean).map(light=>({...light,radius:280,inventoryLight:true}));
  // Merely carrying a lantern or torch improves visibility; combat effects are
  // deliberately checked against equipment slots in night-equipment.mjs.
  const packed=(p.inventory||[]).some(item=>item&&['torch','lantern'].includes(item.type));
  if(packed)equipped.push({radius:280,intensity:.92,color:'#ffbd70',inventoryLight:true});
  return equipped.sort((a, b) => b.radius - a.radius)[0] || null;
}
export function sightRadius(g, p, base = 280) {
  const ambient = base * (0.52 + daylight(g) * 0.48);
  return Math.max(ambient, carriedLight(p)?.radius || 0) * (g.weather?.type === 'monsoon' ? 0.8 : 1);
}
export function lightSources(g,room=null) {
  const frameKey=`${g.time||0}:${g.sky?.elapsed||0}:${room||''}:${(g.players||[]).map(p=>[p.id,p.x,p.y,p.room,p.roomX,p.roomY,p.equipment?.hand1,p.equipment?.hand2,(p.inventory||[]).some(i=>i&&['torch','lantern'].includes(i.type)),p.controlPetPosition?.x,p.controlPetPosition?.y,p.controlMainLoadout?.equipment?.hand1,p.controlMainLoadout?.equipment?.hand2].join(',')).join(';')}:${(g.villageCampState?.fire?[g.villageCampState.fire.x,g.villageCampState.fire.y].join(','):'')}`;
  const fireKey=[...(g.spells||[]).filter(b=>b.fire&&b.life>0),...(g.fireballs||[]).filter(b=>!b.ice&&!b.water&&b.life>0),...(g.effects||[]).filter(f=>f.particle==='cinder-trail'&&f.life>0)].map(f=>[f.x,f.y,f.life].join(',')).join(';');
  const cacheKey=frameKey+':'+fireKey;
  const cached=sourceFrames.get(g);if(cached?.key===cacheKey)return cached.sources;
  const sources = (g.players || []).filter(p => p.hp > 0 && (p.room||null)===room).flatMap(p => {
    const light = carriedLight(p);
    return light ? [{ x: room?p.roomX:p.x, y: room?p.roomY:p.y, ...light, owner:`actor:${p.id}`, room, height:30+(p.jumpHeight||0)+(p.groundHeight||0) }] : [];
  });
  // When the hero is controlling a companion, the active source follows that
  // companion while this second source stays on the displaced hero.
  if(!room)for(const p of g.players||[])if(p.hp>0&&p.controlMainLoadout&&p.controlPetPosition){
    const hero={...p,...p.controlMainLoadout,equipment:p.controlMainLoadout.equipment,inventory:p.controlMainLoadout.inventory};
    const light=carriedLight(hero);if(light)sources.push({x:p.controlPetPosition.x,y:p.controlPetPosition.y,...light,owner:`actor:${p.id}:hero`,room:null,height:30+(p.controlPetPosition.jumpHeight||0)});
  }
  if(room){
    const portal=g.portals?.find(d=>d.id===room);
    if(portal?.temple)for(const s of sources){s.radius*=.5;s.height=18;}
    if(portal?.temple)sources.push(...UPPER_TORCHES.map(t=>({...t,room,height:18,radius:115,intensity:.75,color:'#ffc76f'})));
    if(portal?.oldWell){
      if(portal.well?.exit)sources.push({...portal.well.exit,room,height:18,radius:80,intensity:.8,color:'#ffdb98'});
      for(const t of portal.well?.candles||[])sources.push({...t,room,height:18,radius:t.radius||80,intensity:.7,color:'#ffbc73'});
    }
    sourceFrames.set(g,{key:cacheKey,sources});return sources;
  }
  for (const f of g.firePatches || []) if (f.life > 0)
    sources.push({ x: f.x + 16, y: f.y + 16, height:12,radius: 90, intensity: 0.8, color: '#ffaf55' });
  const flames=[...(g.spells||[]).filter(b=>b.fire&&b.life>0),...(g.fireballs||[]).filter(b=>!b.ice&&!b.water&&b.life>0)].filter(b=>!b.room).slice(0,12);
  for(const b of flames)sources.push({x:b.x,y:b.y-12,height:18,radius:95,intensity:.85,color:'#ff9a48',owner:'fire:'+b.visualSeed});
  const trailLights=[];
  for(const p of g.scenery||[])if(p.kind==='tall_grass'&&p.grassFire>0&&trailLights.length<16){
    const source={x:p.x,y:p.rootY??p.y+p.size*.4,height:9,radius:75,intensity:.65*Math.min(1,p.grassFire/.25),color:'#ff963f'};trailLights.push(source);sources.push(source);
  }
  for(const f of g.effects||[])if(f.particle==='cinder-trail'&&f.life>0&&!f.room&&trailLights.length<16&&!trailLights.some(s=>Math.hypot(s.x-f.x,s.y-f.y)<24)){
    const source={x:f.x,y:f.y,height:9,radius:75,intensity:.65*Math.min(1,f.life/.5),color:'#ff963f'};trailLights.push(source);sources.push(source);
  }
  for(const npc of g.questNpcs||[])if(Number.isFinite(npc.campX??npc.x)&&Number.isFinite(npc.campY??npc.y))
    sources.push({x:npc.campX??npc.x,y:(npc.campY??npc.y)+10,height:16,radius:150,intensity:.82,color:'#ffad4c'});
  if(g.villageCampState?.fire)sources.push({x:g.villageCampState.fire.x,y:g.villageCampState.fire.y,height:20,radius:150,intensity:.92,color:'#ffad4c',owner:`camp:${g.villageCampState.campId}`});
  for(const p of g.scenery||[])if(p.realm&&!p.depleted&&!p.falling&&['cave_crystal','amber_crystal','shadow_obsidian'].includes(p.kind))sources.push({x:p.x,y:p.rootY-18,height:22,radius:100,intensity:.55,color:p.kind==='amber_crystal'?'#e8bd78':p.kind==='shadow_obsidian'?'#b291d1':'#91d9d1'});
  sources.push(...houseLightSources(g));
  sourceFrames.set(g,{key:cacheKey,sources});return sources;
}
export function lightAt(g, point) {
  let light = daylight(g);
  if(light>=1)return light;
  const sources=lightSources(g),field=worldLightField(g,sources),z=point.z??((point.jumpHeight||0)+(point.groundHeight||0)+18);
  for (const s of sources) {
    const d = Math.hypot(point.x - s.x, point.y - s.y);
    light = Math.max(light, Math.max(0, 1 - d / s.radius) * (s.intensity || 1)*pointLightVisibility(field,s,{x:point.x,y:point.y,z},`actor:${point.id}`));
  }
  return light;
}
export function eventAvailable(g, event) {
  return (g.generatedEnvironment!=='graveyard'||cemeteryEvent(event))
    && (!event.environment || event.environment === g.generatedEnvironment)
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
// Same radius as sight/fog, feathered before the boolean culling boundary.
export function enemySightOpacity(g,e,base=280){
 let alpha=0;
 for(const p of g.players||[]){
  if(p.room||p.hp<=0)continue;
  const radius=sightRadius(g,p,base),distance=Math.hypot(e.x-p.x,e.y-p.y);
  const t=Math.max(0,Math.min(1,(radius-distance)/(radius*.32)));
  alpha=Math.max(alpha,t*t*(3-2*t));
 }
 return alpha;
}

export function lanternGlowStops(source,flicker=1){
 const color=/^#[\da-f]{6}$/i.test(source.color||'')?source.color:'#ffbd70';
 const rgb=color.slice(1).match(/../g).map(v=>parseInt(v,16)),level=(source.intensity??1)*flicker;
 const rgba=(values,alpha)=>`rgba(${values.map(Math.round).join(',')},${alpha*level})`;
 const pale=rgb.map(v=>v+(255-v)*.5);
 const edge=rgb[0]>rgb[2]*1.3?[rgb[0],rgb[1]*.83,rgb[2]*.65]:rgb;
 return source.inventoryLight?[
  [0,rgba(pale,.13)],[.38,rgba(rgb,.18)],[.72,rgba(edge,.26)],
  [.86,rgba(edge,.21)],[.95,rgba(edge,.08)],[1,rgba(edge,0)]
 ]:[[0,rgba(pale,.14)],[.62,rgba(rgb,.09)],[1,rgba(rgb,0)]];
}
export function drawNightLight(c, g, camera, w, h,room=null,{occluded=false}={}) {
  if (g.phase !== 'play') return;
  const dark = 1 - daylight(g);
  c.save();
  if (dark > 0) {
    const fixtures=houseLightSources(g).filter(s=>s.houseFixture);
    if(fixtures.length&&g.generatedEnvironment==='house'&&typeof document!=='undefined'){
      nightMask||=document.createElement('canvas');if(nightMask.width!==w||nightMask.height!==h){nightMask.width=w;nightMask.height=h;}
      const mask=nightMask.getContext('2d');mask.clearRect(0,0,w,h);mask.globalCompositeOperation='source-over';mask.fillStyle=`rgba(9,16,39,${dark*.28})`;mask.fillRect(0,0,w,h);
      mask.globalCompositeOperation='destination-out';mask.save();mask.beginPath();
      for(const floor of g.house.floors||[])mask.rect(w/2+(floor.x-camera.x)*camera.zoom,h/2+(floor.y-camera.y)*camera.zoom,floor.w*camera.zoom,floor.h*camera.zoom);mask.clip();
      for(const s of fixtures){const x=w/2+(s.x-camera.x)*camera.zoom,y=h/2+(s.y-camera.y)*camera.zoom,r=s.radius*camera.zoom;
        const glow=mask.createRadialGradient(x,y,0,x,y,r);glow.addColorStop(0,'#000e');glow.addColorStop(.55,'#000a');glow.addColorStop(1,'#0000');mask.fillStyle=glow;mask.fillRect(x-r,y-r,r*2,r*2);}
      mask.restore();mask.globalCompositeOperation='source-over';c.drawImage(nightMask,0,0);
    }else{c.fillStyle = `rgba(9,16,39,${dark * 0.28})`;c.fillRect(0, 0, w, h);}
  }
  // Dynamic mode already composites height-tested light beneath scenery and
  // source-facing light/rims on surfaces. Never wash an unoccluded disc over it.
  if(occluded){c.restore();return;}
  c.globalCompositeOperation = 'screen';
  for (const [index,s] of lightSources(g,room).entries()) {
    const x = w / 2 + (s.x - camera.x) * camera.zoom, y = h / 2 + (s.y - (s.height||0) - camera.y) * camera.zoom;
    const clock=(g.sky?.elapsed||g.time||0)*9+index*4.7;
    const flicker=s.inventoryLight?1+Math.sin(clock)*.025+Math.sin(clock*2.37)*.015:1;
    const radius = s.radius * camera.zoom * flicker;
    if (x + radius < 0 || y + radius < 0 || x - radius > w || y - radius > h) continue;
    const gradient = c.createRadialGradient(x, y, 0, x, y, radius);
    const glow=s.inventoryLight?Math.max(.88,Math.min(1.12,flicker)):1;
    for(const [stop,color]of lanternGlowStops(s,glow))gradient.addColorStop(stop,color);
    c.fillStyle = gradient; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  c.restore();
}
export function drawNightStatus(c, g, w, h) {
  if (g.phase !== 'play') return;
  const phase = timeOfDay(g), t = (g.sky?.elapsed || 0) % DAY_LENGTH;
  const next = phase === 'day' ? 240 : phase === 'dusk' ? 300 : phase === 'night' ? 450 : DAY_LENGTH;
  c.save(); c.font = '8px monospace'; c.textAlign = 'right';
  const text = g.generatedEnvironment==='caverns'?'UNDERGROUND':g.generatedEnvironment==='shadow'?'BEYOND THE VEIL':`${phase.toUpperCase()} · ${Math.ceil(next - t)}s`;
  c.fillStyle = '#11281fe8'; c.fillRect(w - 133, h - 68, 124, 17);
  c.fillStyle = phase === 'night' ? '#c8d8ff' : '#ebd494'; c.fillText(text, w - 17, h - 56);
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
