import { poseAt, projectPoint, facingIndex, ellipse, limb, validateMotion } from './player-motion.mjs';
import { paintLayers } from './render-order.mjs';
import { ITEMS, itemKind, SAFARI_HUNTER_SET } from './items.mjs';
import { directionalHelmet, wearableDetails } from './wearable-art.mjs';
import { drawItem } from './item-art.mjs';
import {flowerDefaults,upgradeFlowerMotion,drawCarnivorous} from './carnivorous-art.mjs';

export const HUNTER_EQUIPMENT = Object.freeze({ ...SAFARI_HUNTER_SET, hand1: 'rifle', hand2: null });

// Positions and key deltas are absolute, as in the Animation Studio pose format.
// Every factory call owns its joints, clips, palette and optional sprite layers.
export const NIGHT_KINDS = ['carnivorous_flower', 'night_stalker', 'burrower', 'mimic_vine', 'poison_pod', 'carrion_pack', 'hunter', 'elephant', 'zebra', 'pelican'];
export const STAMPEDE_KINDS = ['elephant', 'zebra', 'pelican'];
export const nightRigLabels = {
  carnivorous_flower: 'Carnivorous flower / rooted jaws', night_stalker: 'Night stalker / crouching predator',
  burrower: 'Burrower / segmented ambusher', mimic_vine: 'Mimic vine / grasping tendril',
  poison_pod: 'Poison pod / spore sacs', carrion_pack: 'Carrion pack / scavenger',
  hunter: 'Hunter / safari rifle', elephant: 'Elephant / stampede', zebra: 'Zebra / stampede', pelican: 'Pelican / stampede',
};
const actions = {
  carnivorous_flower: ['sway', 'grab', 'mouth', 'wilt'], night_stalker: ['crouch', 'stalk', 'pounce', 'retreat'],
  burrower: ['underground', 'emerge', 'bite', 'burrow'], mimic_vine: ['wrap', 'grab', 'cut', 'retract'],
  poison_pod: ['swell', 'spit', 'burst', 'wilt'], carrion_pack: ['stalk', 'bite', 'feed', 'retreat'],
  hunter: ['aim', 'shoot', 'reload', 'retreat'], elephant: ['charge', 'trumpet'], zebra: ['charge', 'rear'], pelican: ['charge', 'fly', 'flap'],
};
const plantKinds = ['carnivorous_flower', 'mimic_vine', 'poison_pod'];
function skeleton(kind) {
  const q = {
    pelvis: ['', 0, -9, 14], chest: ['pelvis', 0, 7, 17], neck: ['chest', 0, 14, 21], head: ['neck', 0, 20, 22],
    jaw: ['head', 0, 25, 18], eyeL: ['head', -3, 23, 24], eyeR: ['head', 3, 23, 24],
    earL: ['head', -5, 17, 28], earR: ['head', 5, 17, 28],
    tailBase: ['pelvis', 0, -17, 15], tailMid: ['tailBase', 1, -25, 13], tailTip: ['tailMid', 3, -33, 16],
  };
  for (const [side, s] of [['L', -1], ['R', 1]]) Object.assign(q, {
    ['shoulder' + side]: ['chest', s * 6, 8, 15], ['elbow' + side]: ['shoulder' + side, s * 7, 11, 7],
    ['frontPaw' + side]: ['elbow' + side, s * 7, 15, 1], ['hip' + side]: ['pelvis', s * 6, -9, 12],
    ['knee' + side]: ['hip' + side, s * 7, -14, 6], ['rearPaw' + side]: ['knee' + side, s * 7, -10, 1],
  });
  if (plantKinds.includes(kind)) {
    const spec = { pelvis: ['', 0, 0, 1], stem1: ['pelvis', 0, 0, 9], stem2: ['stem1', 0, 1, 17],
      neck: ['stem2', 0, 2, 25], head: ['neck', 0, 4, 31], jawTop: ['head', 0, 7, 35], jawBottom: ['head', 0, 7, 26],
      leafL: ['stem1', -13, 0, 6], leafR: ['stem1', 13, 0, 6], eyeL: ['head', -4, 9, 33], eyeR: ['head', 4, 9, 33] };
    if (kind === 'mimic_vine') for (let i = 0; i < 7; i++) {
      const angle = i * .8, radius = 12 - i;
      spec['tendril' + i] = [i ? 'tendril' + (i - 1) : 'stem2', Math.sin(angle) * radius, 5 + Math.cos(angle) * radius, 17 + i];
    }
    if (kind === 'poison_pod') for (const [side, s] of [['L', -1], ['R', 1]]) spec['sac' + side] = ['head', s * 9, 3, 23];
    return spec;
  }
  if (kind === 'burrower') {
    const spec = { pelvis: ['', 0, -13, 4], head: ['pelvis', 0, 9, 10], jaw: ['head', 0, 14, 5],
      eyeL: ['head', -3, 12, 12], eyeR: ['head', 3, 12, 12], clawL: ['head', -10, 14, 3], clawR: ['head', 10, 14, 3] };
    for (let i = 0; i < 6; i++) spec['segment' + i] = [i ? 'segment' + (i - 1) : 'pelvis', 0, 5 - i * 5, 7 - i * .6];
    return spec;
  }
  if (kind === 'hunter' || kind === 'pelican') {
    const spec = { pelvis: ['', 0, -1, 14], chest: ['pelvis', 0, 0, 24], neck: ['chest', 0, 1, 29], head: ['neck', 0, 3, 34],
      eyeL: ['head', -2, 7, 35], eyeR: ['head', 2, 7, 35] };
    for (const [side, s] of [['L', -1], ['R', 1]]) Object.assign(spec, {
      ['hip' + side]: ['pelvis', s * 4, 0, 14], ['knee' + side]: ['hip' + side, s * 4, 2, 7], ['foot' + side]: ['knee' + side, s * 4, 5, 1],
      ['shoulder' + side]: ['chest', s * 7, 0, 25], ['elbow' + side]: ['shoulder' + side, s * 9, 5, 20], ['hand' + side]: ['elbow' + side, s * 6, 11, 22],
    });
    if (kind === 'hunter') Object.assign(spec, { hat: ['head', 0, 2, 40], rifleStock: ['handR', 5, 7, 23], rifleMuzzle: ['rifleStock', -3, 31, 24] });
    else Object.assign(spec, { beak: ['head', 0, 24, 31], pouch: ['head', 0, 15, 25], wingTipL: ['shoulderL', -23, -7, 23], wingTipR: ['shoulderR', 23, -7, 23], tailTip: ['pelvis', 0, -14, 16] });
    return spec;
  }
  if (kind === 'elephant') {
    for (const v of Object.values(q)) { v[1] *= 1.35; v[2] *= 1.15; if (v[3] > 2) v[3] *= 1.25; }
    Object.assign(q, { trunkBase: ['head', 0, 29, 22], trunkMid: ['trunkBase', 0, 35, 11], trunkTip: ['trunkMid', 0, 40, 5],
      tuskL: ['head', -6, 34, 18], tuskR: ['head', 6, 34, 18] });
  }
  if (kind === 'zebra') { q.head[3] += 7; q.neck[3] += 4; q.earL[3] += 8; q.earR[3] += 8; q.jaw[3] += 7; q.eyeL[3] += 7; q.eyeR[3] += 7; }
  if (kind === 'carrion_pack') { q.chest[3] += 3; q.head[3] -= 4; q.jaw[3] -= 4; q.tailTip = ['tailMid', 1, -28, 7]; }
  return q;
}
const colors = {
  carnivorous_flower: ['#568447', '#294830', '#f4c747', '#a63837', '#fff1c7'],
  night_stalker: ['#343a52', '#191e32', '#68708a', '#505771', '#a3e8bc'],
  burrower: ['#93674e', '#483b38', '#ca9970', '#c17d65', '#f4dca8'],
  mimic_vine: ['#547c45', '#273f32', '#a3b664', '#70934c', '#c2cc83'],
  poison_pod: ['#7b8e3f', '#3b512e', '#bbd365', '#935dae', '#e6ed8b'],
  carrion_pack: ['#9a8060', '#51433c', '#cab28b', '#775c51', '#ead8ab'],
  hunter: ['#a79462', '#5b523d', '#d7c58a', '#bf906a', '#424e50'],
  elephant: ['#879594', '#4d6061', '#b4beba', '#9aa5a2', '#f4e7ba'],
  zebra: ['#e6e4cc', '#353c40', '#fff3d9', '#6b7774', '#262f36'],
  pelican: ['#e8e5ce', '#7a8d93', '#fff8e6', '#e6bb68', '#f6d887'],
};
function keys(kind, action, spec) {
  return Array.from({ length: 8 }, (_, frame) => {
    const t = frame / 7, phase = frame * Math.PI / 4, wave = Math.sin(phase), pulse = Math.sin(t * Math.PI);
    const j = Object.fromEntries(Object.keys(spec).map(n => [n, [0, 0, 0]]));
    const move = (names, x, y, z) => { for (const n of names) if (j[n]) j[n] = [j[n][0] + x, j[n][1] + y, j[n][2] + z]; };
    const all = Object.keys(j), upper = all.filter(n => !/^(foot|frontPaw|rearPaw|knee|hip)/.test(n));
    const walking = ['walk', 'run', 'charge', 'stalk', 'retreat'].includes(action);
    if (plantKinds.includes(kind)) {
      const wilt = ['wilt', 'death', 'cut'].includes(action) ? t : action === 'retract' ? t * .8 : 0;
      for (const n of all.filter(n => n !== 'pelvis')) {
        const height = spec[n][3]; j[n] = [wave * height / 18, 0, -wilt * Math.max(0, height - 2)];
      }
      const reach = ['grab', 'attack'].includes(action) ? pulse * 17 : 0;
      move(['neck', 'head', 'jawTop', 'jawBottom', 'eyeL', 'eyeR'], 0, reach, -reach * .35);
      const gape = action === 'mouth' ? 5 * (1 + wave) : ['grab', 'attack'].includes(action) ? 7 * (1 - t) : 1 + wave;
      j.jawTop[2] += gape; j.jawBottom[2] -= gape;
      if (kind === 'mimic_vine') for (let i = 0; i < 7; i++) {
        const n = 'tendril' + i, wrap = action === 'wrap', angle = i * .95 + t * Math.PI;
        if (wrap) j[n] = [Math.cos(angle) * 10 - spec[n][1], 18 + Math.sin(angle) * 8 - spec[n][2], i * 2 + 8 - spec[n][3]];
        else { j[n][0] += Math.sin(phase - i * .5) * 3; j[n][1] += reach * i / 6; }
        if (action === 'retract') j[n] = j[n].map((v, axis) => v - spec[n][axis + 1] * t * .65);
      }
      if (kind === 'poison_pod') {
        const swell = action === 'swell' ? t * 5 : action === 'burst' ? pulse * 14 : wave;
        move(['sacL'], -swell, 0, swell * .4); move(['sacR'], swell, 0, swell * .4);
        if (action === 'spit' || action === 'attack') move(['head', 'jawTop', 'jawBottom'], 0, pulse * 10, pulse * 3);
      }
    } else if (kind === 'burrower') {
      const height = action === 'underground' ? 0 : action === 'emerge' ? t : ['burrow', 'death'].includes(action) ? 1 - t : 1;
      for (const n of all) j[n][2] = -(1 - height) * (spec[n][3] + 3);
      for (let i = 0; i < 6; i++) j['segment' + i][0] = Math.sin(phase - i * .7) * 2;
      if (action === 'bite' || action === 'attack') { move(['head', 'eyeL', 'eyeR', 'jaw', 'clawL', 'clawR'], 0, pulse * 10, pulse * 6); j.jaw[2] -= pulse * 6; }
    } else {
      move(upper, 0, 0, walking ? Math.abs(wave) * 1.4 : wave * .35);
      if (walking) for (const [side, sign] of [['L', 1], ['R', -1]]) {
        const stride = wave * sign * (action === 'stalk' ? 2 : action === 'walk' ? 3 : 6) * (action === 'retreat' ? -1 : 1);
        move(['frontPaw' + side, 'foot' + side], 0, stride, Math.max(0, -stride));
        move(['rearPaw' + side], 0, -stride, Math.max(0, stride));
        move(['elbow' + side], 0, stride * .4, 0); move(['knee' + side], 0, -stride * .5, 0);
      }
      move(['tailMid'], wave * 2, 0, 0); move(['tailTip'], Math.sin(phase - .7) * 4, 0, 0);
      if (action === 'crouch' || action === 'stalk') move(upper, 0, -2, -5);
      if (action === 'pounce') { move(all, 0, pulse * 14, pulse * 10); move(['frontPawL', 'frontPawR'], 0, pulse * 7, pulse * 5); }
      if (['bite', 'feed', 'attack'].includes(action) && kind !== 'hunter') {
        move(['neck', 'head', 'jaw', 'eyeL', 'eyeR', 'earL', 'earR'], 0, pulse * 7, -pulse * 5); move(['jaw'], 0, 2, -pulse * 4);
      }
      if (kind === 'hunter') {
        const aiming = ['aim', 'shoot', 'attack'].includes(action), reload = action === 'reload';
        move(['handL', 'handR', 'elbowL', 'elbowR', 'rifleStock', 'rifleMuzzle'], 0, aiming ? 3 : 0, aiming ? 5 : 0);
        if (action === 'shoot' || action === 'attack') move(['handL', 'handR', 'rifleStock', 'rifleMuzzle'], 0, -pulse * 4, pulse);
        if (reload) { move(['handL'], 4 * pulse, -6 * pulse, -4 * pulse); move(['rifleMuzzle'], 0, -5 * pulse, 8 * pulse); }
      }
      if (kind === 'elephant') { move(['trunkMid'], wave * 2, 0, action === 'trumpet' ? pulse * 13 : 0); move(['trunkTip'], wave * 3, -pulse * 3, action === 'trumpet' ? pulse * 25 : 0); }
      if (action === 'rear') move(upper.concat(['frontPawL', 'frontPawR']), 0, -pulse * 8, pulse * 16);
      if (kind === 'pelican') {
        const flying = ['fly', 'flap', 'charge', 'run'].includes(action);
        move(['wingTipL', 'wingTipR'], 0, wave * 3, wave * (flying ? 14 : 2));
        if (action === 'fly') move(all, 0, 0, 8);
      }
      if (action === 'death') for (const n of all) j[n] = [j[n][0] + t * 6, j[n][1], -t * Math.max(0, spec[n][3] - 2)];
    }
    if (action === 'hit' || action === 'hurt') move(all.filter(n => n !== 'pelvis'), Math.sin(t * Math.PI * 3) * 3, -pulse * 3, 0);
    return { frame, joints: j };
  });
}
export function legacyNightMotion(kind) {
  if (!NIGHT_KINDS.includes(kind)) throw Error('Unknown night rig: ' + kind);
  const spec = skeleton(kind), [body, shade, light, face, detail] = colors[kind];
  const clips = [...new Set(['idle', 'walk', 'run', 'attack', 'hit', 'hurt', 'death', ...actions[kind]])];
  return {
    version: 1, type: kind, name: nightRigLabels[kind],
    joints: Object.fromEntries(Object.entries(spec).map(([n, [parent, ...position]]) => [n, { parent, position }])),
    palette: { body, shade, light, face, detail, outline: '#202b30', eye: kind === 'night_stalker' ? '#bbffca' : '#f1d889' },
    shape: { bodyWidth: kind === 'elephant' ? 14 : 8, headRadius: kind === 'elephant' ? 9 : plantKinds.includes(kind) ? 10 : 5, limbWidth: kind === 'elephant' ? 7 : 3, tailWidth: 2 },
    visibility: Object.fromEntries(Object.keys(spec).map(n => [n, Array.from({ length: 8 }, (_, d) => !n.startsWith('eye') || (d < 3 || d > 5) && !(n === 'eyeL' && d === 6) && !(n === 'eyeR' && d === 2))])),
    clips: Object.fromEntries(clips.map(action => [action, { fps: action === 'stalk' ? 7 : 12, length: 8,
      loop: ['idle', 'walk', 'run', 'sway', 'mouth', 'stalk', 'crouch', 'underground', 'wrap', 'feed', 'aim', 'charge', 'fly', 'flap'].includes(action), keys: keys(kind, action, spec) }])),
  };
}
export function defaultNightMotion(kind){const model=legacyNightMotion(kind);return kind==='carnivorous_flower'?flowerDefaults(model):model;}
export const nightMotions = Object.fromEntries(NIGHT_KINDS.map(k => [k, defaultNightMotion(k)]));
export const nightMotionRevisions = Object.fromEntries(NIGHT_KINDS.map(k => [k, 0]));
export function validateNightMotion(kind, model) {
  if (!NIGHT_KINDS.includes(kind) || model?.type !== kind) return false;
  if(kind==='carnivorous_flower'&&model.artGeneration!==2){if(!validateMotion(model,legacyNightMotion(kind)))return false;model=upgradeFlowerMotion(model,legacyNightMotion(kind));}
  const def = defaultNightMotion(kind);
  return validateMotion(model, def) && Object.keys(def.visibility).every(n => Array.isArray(model.visibility?.[n]) && model.visibility[n].length === 8 && model.visibility[n].every(v => typeof v === 'boolean'));
}
export function replaceNightMotion(kind, model) {
  if (!validateNightMotion(kind, model)) throw Error('Invalid ' + kind + ' animation. Nothing imported.');
  const copy = kind==='carnivorous_flower'?upgradeFlowerMotion(model,legacyNightMotion(kind)):structuredClone(model), target = nightMotions[kind];
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, copy); nightMotionRevisions[kind]++;
}
const attackAction = { carnivorous_flower: 'grab', night_stalker: 'pounce', burrower: 'bite', mimic_vine: 'grab', poison_pod: 'spit', carrion_pack: 'bite', hunter: 'shoot', elephant: 'charge', zebra: 'charge', pelican: 'flap' };
export function nightAction(kind, actor = {}, model = nightMotions[kind]) {
  const valid = name => model?.clips[name] ? name : null;
  if (actor.animationAction) return valid(actor.animationAction) || 'idle';
  if (actor.hp <= 0 || actor.dead) return plantKinds.includes(kind) && model.clips.wilt ? 'wilt' : 'death';
  if (actor.hit > 0 || actor.flash > 0) return 'hit';
  if (actor.state === 'snared') return 'idle';
  if (actor.night?.phase && actor.state !== 'stampede') {
    const phase = actor.night.phase;
    const mapped = {
      carnivorous_flower: { idle: 'sway', grab: 'grab', holding: 'mouth', recover: 'sway' },
      mimic_vine: { idle: 'idle', grab: 'grab', holding: 'wrap', recover: 'retract' },
      poison_pod: { idle: 'idle', barbs: 'spit', recover: 'idle' },
      burrower: { idle: 'underground', burrow: 'underground', emerge: 'emerge', exposed: 'bite' },
      night_stalker: { idle: actor.moving ? 'stalk' : 'crouch', windup: 'crouch', pounce: 'pounce', recover: 'retreat' },
      hunter: { idle: actor.moving ? 'walk' : 'idle', aim: 'aim', fire: 'shoot', recover: 'reload' },
      carrion_pack: { idle: actor.moving ? 'stalk' : 'idle', windup: 'crouch', recover: 'bite' },
    }[kind]?.[phase];
    if (mapped) return valid(mapped) || 'idle';
    if (valid(phase)) return phase;
  }
  if (actor.state === 'fire') return valid('shoot') || valid('spit') || 'attack';
  if (actor.state === 'swallow') return valid('mouth') || valid('wrap') || 'attack';
  if (actor.state === 'stampede') return valid('charge') || 'run';
  if (actor.state === 'windup') return valid({ night_stalker: 'crouch', hunter: 'aim', burrower: 'emerge', poison_pod: 'swell', carnivorous_flower: 'mouth', mimic_vine: 'wrap' }[kind]) || 'idle';
  if (actor.state === 'charge' || actor.state === 'attack' || actor.attack > 0) return attackAction[kind];
  if (actor.state === 'recover') return valid({ night_stalker: 'retreat', carrion_pack: 'retreat', hunter: 'reload', burrower: 'burrow', mimic_vine: 'retract' }[kind]) || 'idle';
  if (valid(actor.state)) return actor.state;
  if (kind === 'burrower' && actor.underground) return 'underground';
  if (actor.moving || Math.hypot(actor.vx || 0, actor.vy || 0) > 2) return valid('stalk') || 'run';
  return kind === 'carnivorous_flower' ? 'sway' : 'idle';
}
// Explicit editor frames win; runtime can provide normalized animationProgress or
// a countdown timer + motionDuration, or elapsed stateAge/animationTime in seconds.
export function nightFrame(kind, actor, time, model = nightMotions[kind]) {
  const action = nightAction(kind, actor, model), clip = model.clips[action];
  if (Number.isFinite(actor.playerFrame)) return actor.playerFrame;
  if (Number.isFinite(actor.poseTime)) return actor.poseTime * (clip.length - 1);
  if (Number.isFinite(actor.animationProgress)) return Math.max(0, Math.min(1, actor.animationProgress)) * (clip.length - 1);
  // Runtime deathTimer is elapsed seconds. It must beat stale attack/phase
  // countdowns, finish the collapse once, then hold until corpse removal.
  if (['death', 'wilt'].includes(action) && Number.isFinite(actor.deathTimer))
    return Math.min(clip.length - 1, Math.max(0, actor.deathTimer) * clip.fps);
  const phase = actor.night?.phase;
  const duration = actor.night?.duration || actor.motionDuration || {
    grab: .8, holding: 3, barbs: .75, emerge: .85, exposed: 1, pounce: .38,
    aim: 1.15, windup: .7, recover: kind === 'hunter' ? 1.4 : kind === 'night_stalker' ? 1.5 : 1.2,
  }[phase];
  if (!clip.loop && Number.isFinite(actor.night?.timer) && duration > 0)
    return Math.max(0, Math.min(1, 1 - actor.night.timer / duration)) * (clip.length - 1);
  if (!clip.loop) {
    if (Number.isFinite(actor.timer) && actor.motionDuration > 0) return Math.max(0, Math.min(1, 1 - actor.timer / actor.motionDuration)) * (clip.length - 1);
    if (actor.hit > 0 || actor.flash > 0) return Math.max(0, 1 - (actor.hit || actor.flash) / .2) * (clip.length - 1);
    return Math.min(clip.length - 1, Math.max(0, actor.animationTime ?? actor.stateAge ?? 0) * clip.fps);
  }
  return (Number.isFinite(actor.animationTime) ? actor.animationTime : time) * clip.fps + (Number.isFinite(actor.id) ? actor.id * .73 : 0);
}

export function drawNightRig(c, actor, time, model = nightMotions[actor.sprite] || nightMotions[actor.kind], suppliedPose = null) {
  const kind = model.type, d = facingIndex(actor.faceX, actor.faceY), pal = model.palette, s = model.shape;
  const pose = suppliedPose || poseAt(model, nightAction(kind, actor, model), nightFrame(kind, actor, time, model));
  if(kind==='carnivorous_flower')return drawCarnivorous(c,actor,model,pose,d);
  const p = Object.fromEntries(Object.entries(pose).map(([n, v]) => [n, projectPoint(v, d)]));
  const queue = [], visible = n => model.visibility?.[n]?.[d] !== false;
  // Preview defaults use real equippable IDs. An explicit equipment object is
  // authoritative, including empty slots after a drop or gear swap.
  const gear = actor.equipment ?? HUNTER_EQUIPMENT;
  const add = (id, bones, fn, depth) => { if (visible(bones[0])) queue.push({ id, bone: bones[0], bones, depth: depth ?? p[bones[0]].depth, fn }); };
  const ball = (n, rx, ry, color) => ellipse(c, p[n].x, p[n].y, rx, ry, color);
  const line = (a, b, w, color) => limb(c, p[a], p[b], w, color);
  const outlined = (a, b, w, color) => { line(a, b, w + 2, pal.outline); line(a, b, w, color); };
  const dot = (n, dx, dy, w, h, color) => { c.fillStyle = color; c.fillRect(Math.round(p[n].x + dx), Math.round(p[n].y + dy), w, h); };
  // Transverse marks follow the projected limb/torso axis in every facing.
  const bands = (a, b, radius, count, width = 1) => {
    const dx = p[b].x - p[a].x, dy = p[b].y - p[a].y, length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length, ny = dx / length;
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1), x = p[a].x + dx * t, y = p[a].y + dy * t;
      limb(c, { x: x - nx * radius, y: y - ny * radius }, { x: x + nx * radius, y: y + ny * radius }, width, pal.shade);
    }
  };
  const fern = (a, b) => {
    const dx = p[b].x - p[a].x, dy = p[b].y - p[a].y, length = Math.hypot(dx, dy) || 1;
    for (let i = 1; i <= 4; i++) for (const side of [-1, 1]) {
      const t = i / 5, x = p[a].x + dx * t, y = p[a].y + dy * t, spread = 7 - i;
      const tip = { x: x - side * dy / length * spread + dx / length * 2, y: y + side * dx / length * spread + dy / length * 2 };
      limb(c, { x, y }, tip, 3, pal.body);
      limb(c, { x, y }, tip, 1, pal.light);
    }
  };
  if (plantKinds.includes(kind)) {
    add('Root', ['pelvis'], () => { ball('pelvis', 12, 4, pal.shade); ball('pelvis', 8, 2, pal.light); }, -100);
    for (const [a, b] of [['pelvis', 'stem1'], ['stem1', 'stem2'], ['stem2', 'neck'], ['neck', 'head'], ['stem1', 'leafL'], ['stem1', 'leafR']])
      add('Stem ' + b, [b, a], () => {
        outlined(a, b, b.startsWith('leaf') ? 5 : s.limbWidth, pal.body);
        if (kind === 'mimic_vine') fern(a, b);
      });
    if (kind === 'mimic_vine') for (let i = 0; i < 7; i++) {
      const n = 'tendril' + i, parent = i ? 'tendril' + (i - 1) : 'stem2';
      add('Tendril ' + i, [n, parent], () => { outlined(parent, n, s.limbWidth, pal.body); fern(parent, n); });
    }
    add('Head', ['head'], () => {
      if (kind === 'mimic_vine') {
        ball('head', Math.max(2, s.headRadius * .3), 3, pal.shade);
        ball('head', Math.max(1, s.headRadius * .2), 2, pal.face);
        fern('neck', 'head');
        return;
      }
      if (kind === 'carnivorous_flower') for (let i = 0; i < 10; i++) {
        const x = p.head.x + Math.cos(i * Math.PI / 5) * 11, y = p.head.y + Math.sin(i * Math.PI / 5) * 10;
        ellipse(c, x, y, 5, 4, pal.light);
        ellipse(c, x - 1, y - 1, 2, 2, pal.detail);
      }
      ball('head', s.headRadius, s.headRadius * .8, pal.outline);
      ball('head', s.headRadius - 1, s.headRadius * .7, pal.face);
    });
    for (const n of ['jawTop', 'jawBottom']) add(n, [n, 'head'], () => {
      if (kind === 'mimic_vine') { outlined('head', n, 2, pal.body); fern('head', n); return; }
      ball(n, s.headRadius, 3, pal.face);
      for (let x = -6; x <= 6; x += 4) dot(n, x, n === 'jawTop' ? 1 : -3, 2, 3, pal.detail);
    }, p.head.depth + .1);
    if (kind === 'poison_pod') for (const n of ['sacL', 'sacR']) add(n, [n, 'head'], () => { ball(n, 6, 8, pal.outline); ball(n, 5, 7, pal.face); for (let i = -3; i <= 3; i += 3) dot(n, i, i, 2, 2, pal.detail); });
  } else if (kind === 'burrower') {
    add('Burrow mound', ['pelvis'], () => { ellipse(c, p.pelvis.x, p.pelvis.depth * .5, 14, 5, pal.shade); ellipse(c, p.pelvis.x, p.pelvis.depth * .5, 9, 3, pal.outline); }, -100);
    for (let i = 5; i >= 0; i--) { const n = 'segment' + i; if (pose[n][2] > 0) add('Armor ' + i, [n], () => { ball(n, 8 - i * .7, 5, pal.outline); ball(n, 7 - i * .7, 4, pal.body); dot(n, -3, -3, 5, 1, pal.light); }); }
    if (pose.head[2] > 0) {
      add('Head', ['head'], () => { ball('head', 7, 6, pal.outline); ball('head', 6, 5, pal.body); });
      add('Jaw', ['jaw', 'head'], () => { ball('jaw', 6, 3, pal.face); for (let i = -4; i <= 4; i += 2) dot('jaw', i, -3, 1, 3, pal.detail); });
      for (const n of ['clawL', 'clawR']) add(n, [n, 'head'], () => outlined('head', n, 2, pal.detail));
    }
  } else {
    const biped = kind === 'hunter' || kind === 'pelican';
    for (const side of ['L', 'R']) for (const chain of biped ? [['hip', 'knee', 'foot'], ...(kind === 'hunter' ? [['shoulder', 'elbow', 'hand']] : [])] : [['shoulder', 'elbow', 'frontPaw'], ['hip', 'knee', 'rearPaw']]) {
      const [a, b, end] = chain.map(n => n + side);
      add(end, [end, b, a], () => {
        outlined(a, b, s.limbWidth, kind === 'zebra' ? pal.body : pal.shade);
        outlined(b, end, s.limbWidth, kind === 'pelican' ? pal.face : pal.body);
        if (kind === 'zebra') { bands(a, b, s.limbWidth / 2, 2); bands(b, end, s.limbWidth / 2, 2); }
        ball(end, kind === 'elephant' ? 4 : 3, 2, kind === 'hunter' && end.startsWith('hand') ? pal.face : pal.shade);
      }, (p[a].depth + p[end].depth) / 2);
    }
    if (p.tailBase) for (const [a, b] of [['pelvis', 'tailBase'], ['tailBase', 'tailMid'], ['tailMid', 'tailTip']]) add('Tail ' + b, [b, a], () => outlined(a, b, s.tailWidth, pal.shade));
    add('Body', ['chest', 'pelvis'], () => {
      outlined('pelvis', 'chest', s.bodyWidth * (biped ? 1.5 : 2), pal.body);
      line('pelvis', 'chest', s.bodyWidth * .55, pal.light);
      if (kind === 'zebra') bands('pelvis', 'chest', s.bodyWidth - 1, 5, 1.5);
      if (kind === 'carrion_pack') for (let i = 0; i < 7; i++) {
        const t = i / 7, x = p.pelvis.x + (p.chest.x - p.pelvis.x) * t, y = p.pelvis.y + (p.chest.y - p.pelvis.y) * t;
        ellipse(c, x + (i % 2 ? 4 : -4), y, 1.5, 1.5, pal.shade);
      }
      if (kind === 'hunter') wearableDetails(c, p, gear, actor.appearance, d, time, actor.field?.cosmetics);
    }, (p.chest.depth + p.pelvis.depth) / 2);
    add('Neck', ['neck', 'chest'], () => outlined('chest', 'neck', kind === 'pelican' ? 5 : s.headRadius, pal.body));
    if (kind === 'pelican') {
      for (const side of ['L', 'R']) add('Wing ' + side, ['wingTip' + side, 'shoulder' + side], () => {
        const a = p['shoulder' + side], b = p['wingTip' + side];
        outlined('shoulder' + side, 'wingTip' + side, 7, pal.body);
        for (let i = 1; i <= 5; i++) { const t = i / 5, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t; limb(c, { x, y }, { x, y: y + 5 + t * 3 }, 3, pal.shade); }
      });
      add('Beak', ['beak', 'head', 'pouch'], () => { outlined('head', 'pouch', 8, pal.face); outlined('head', 'beak', 3, pal.detail); }, p.head.depth + .2);
    }
    for (const n of ['earL', 'earR']) if (p[n]) add(n, [n, 'head'], () => { ball(n, kind === 'elephant' ? 9 : 3, kind === 'elephant' ? 12 : 5, pal.shade); ball(n, kind === 'elephant' ? 7 : 1.5, kind === 'elephant' ? 9 : 3, pal.face); });
    add('Head', ['head', 'neck'], () => { ball('head', s.headRadius + 1, s.headRadius, pal.outline); ball('head', s.headRadius, s.headRadius - 1, kind === 'hunter' ? pal.face : pal.body); });
    if (p.jaw) add('Jaw', ['jaw', 'head'], () => { outlined('head', 'jaw', s.headRadius, pal.face); if (['night_stalker', 'carrion_pack'].includes(kind)) { dot('jaw', -3, 1, 1, 3, pal.detail); dot('jaw', 2, 1, 1, 3, pal.detail); } });
    if (kind === 'elephant') {
      for (const n of ['tuskL', 'tuskR']) add(n, [n, 'head'], () => outlined('head', n, 2, pal.detail));
      for (const [a, b, w] of [['head', 'trunkBase', 7], ['trunkBase', 'trunkMid', 5], ['trunkMid', 'trunkTip', 3]]) add(b, [b, a], () => outlined(a, b, w, pal.body));
    }
    if (kind === 'zebra') add('Mane', ['neck', 'head'], () => { line('chest', 'neck', 3, pal.shade); dot('head', -3, -3, 6, 2, pal.shade); });
    if (kind === 'hunter') {
      if (gear.head) add('Safari hat', ['hat', 'head'], () => {
        const h = { x: p.hat.x, y: p.hat.y + 6 };
        if (!directionalHelmet(c, gear.head, h, d, actor.field?.cosmetics)) drawItem(c, gear.head, h.x, h.y, 14);
      }, p.head.depth + 1);
      if (gear.hand1) add('Rifle', ['rifleStock', 'rifleMuzzle', 'handR'], () => {
        if (itemKind(gear.hand1) === 'rifle') {
          outlined('rifleStock', 'rifleMuzzle', 2, ITEMS[gear.hand1]?.artColor || '#39434b'); ball('rifleStock', 3, 2, '#916642');
          line('handR', 'rifleStock', 3, '#916642');
        } else drawItem(c, gear.hand1, p.handR.x, p.handR.y, 16);
      }, Math.max(p.handR.depth, p.rifleMuzzle.depth) + 1);
    }
  }
  for (const n of ['eyeL', 'eyeR']) if (visible(n) && (kind !== 'burrower' || pose.head[2] > 0)) add(n, [n, 'head'], () => {
    if (kind === 'mimic_vine') { ball(n, 2, 1, pal.body); return; }
    ball(n, 1.7, 1.5, pal.outline); dot(n, 0, 0, 1, 1, pal.eye);
  }, p.head.depth + 2);
  paintLayers(queue, model, d, c, p);
  return p;
}
