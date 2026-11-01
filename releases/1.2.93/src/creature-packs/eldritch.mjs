import { ellipse, facingIndex, limb, poseAt, projectPoint } from '../player-motion.mjs';
import { GREAT_OWL_WOW_MOTION } from '../great-owl-wow-motion-data.mjs';
import { BLINKY_WOW_MOTION } from '../blinky-wow-motion-data.mjs';
import { CLINGING_REMAINS_WOW_MOTION } from '../clinging-remains-wow-motion-data.mjs';

// Original, editable Wildbound pixel rigs. These are not imported meshes or
// unverified Wowhead clips: each clip below is a native animation fitted to the
// anatomy implied by its reference. Exact donor animation transfer is recorded
// in `animationSource` on every model and is intentionally not claimed here.

const joint = (parent, x, y, z) => ({ parent, position: [x, y, z] });
const humanoid = () => ({
  pelvis: joint('', 0, 0, 12), chest: joint('pelvis', 0, 0, 21), neck: joint('chest', 0, 0, 26), head: joint('neck', 0, 0, 32),
  eyeL: joint('head', -2, 3, 33), eyeR: joint('head', 2, 3, 33), beak: joint('head', 0, 5, 29),
  shoulderL: joint('chest', -5, 0, 21), elbowL: joint('shoulderL', -10, 0, 15), handL: joint('elbowL', -13, 2, 8),
  shoulderR: joint('chest', 5, 0, 21), elbowR: joint('shoulderR', 10, 0, 15), handR: joint('elbowR', 13, 2, 8),
  hipL: joint('pelvis', -3, 0, 12), kneeL: joint('hipL', -4, 0, 6), footL: joint('kneeL', -5, 2, 1),
  hipR: joint('pelvis', 3, 0, 12), kneeR: joint('hipR', 4, 0, 6), footR: joint('kneeR', 5, 2, 1),
});

function skeletonFor(kind) {
  if (kind === 'arcane_eye' || kind === 'watcher') {
    const j = kind === 'arcane_eye'
      ? {
          pelvis: joint('', 0, 0, 14), body: joint('pelvis', 0, 0, 22),
          eye: joint('body', 0, 0, 28), iris: joint('eye', 0, 0, 28),
          pupil: joint('iris', 0, 0, 28), lidTop: joint('eye', 0, -3, 28),
          lidBottom: joint('eye', 0, 3, 28), glint: joint('iris', -1, -1, 28),
          glow: joint('body', 0, 0, 22),
        }
      : { pelvis: joint('', 0, 0, 14), body: joint('pelvis', 0, 0, 22), eye: joint('body', 0, 5, 28) };
    // The Arcane Eye is only an eye; its editable rig contains eye anatomy,
    // while the distinct Watcher owns the sensor stalks.
    if (kind === 'watcher') for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2, r = 7;
      const id = `stalk${i}`;
      j[id] = joint('body', Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r), 24 + (i % 2) * 3);
      j[`${id}Tip`] = joint(id, Math.round(Math.cos(a) * (r + 4)), Math.round(Math.sin(a) * (r + 5)), 29 + (i % 3) * 5);
    }
    return j;
  }
  if (kind === 'great_owl' || kind === 'flying_raptor') {
    const owl = kind === 'great_owl';
    const j = {
      pelvis: joint('', 0, owl ? 0 : -5, 13), chest: joint('pelvis', 0, owl ? 1 : 5, 22),
      neck: joint('chest', 0, owl ? 2 : 8, 29), head: joint('neck', 0, owl ? 3 : 11, 34),
      eyeL: joint('head', -3, 5, 35), eyeR: joint('head', 3, 5, 35),
      beak: joint('head', 0, owl ? 7 : 11, owl ? 31 : 29),
      tailTip: joint('pelvis', 0, owl ? -13 : -23, 13),
    };
    for (const [s, n] of [['L', -1], ['R', 1]]) Object.assign(j, {
      [`wingRoot${s}`]: joint('chest', n * (owl ? 6 : 8), -2, 23),
      [`wingTip${s}`]: joint(`wingRoot${s}`, n * (owl ? 22 : 28), owl ? -1 : -5, owl ? 24 : 20),
      [`wingFinger${s}`]: joint(`wingRoot${s}`, n * (owl ? 17 : 23), owl ? 10 : 13, owl ? 17 : 15),
      [`hip${s}`]: joint('pelvis', n * 4, 0, 12),
      [`knee${s}`]: joint(`hip${s}`, n * 3, 0, 6), [`foot${s}`]: joint(`knee${s}`, n * 4, 3, 1),
    });
    return j;
  }
  if (kind === 'butterfly_dragon') {
    const j = { pelvis: joint('', 0, -9, 14), chest: joint('pelvis', 0, 8, 20), neck: joint('chest', 0, 13, 27), head: joint('neck', 0, 9, 30), snout: joint('head', 0, 8, 28), jaw: joint('head', 0, 6, 24), eyeL: joint('head', -3, 2, 31), eyeR: joint('head', 3, 2, 31), tailBase: joint('pelvis', 0, -12, 15), tailTip: joint('tailBase', 0, -24, 15) };
    for (const [s, n] of [['L', -1], ['R', 1]]) Object.assign(j, {
      [`wingRoot${s}`]: joint('chest', n * 6, -1, 24), [`wingTip${s}`]: joint(`wingRoot${s}`, n * 24, -4, 27), [`wingFinger${s}`]: joint(`wingRoot${s}`, n * 17, 9, 18),
      [`shoulder${s}`]: joint('chest', n * 7, 3, 17), [`elbow${s}`]: joint(`shoulder${s}`, n * 6, 5, 9), [`frontPaw${s}`]: joint(`elbow${s}`, n * 5, 5, 1),
      [`hip${s}`]: joint('pelvis', n * 6, -3, 12), [`knee${s}`]: joint(`hip${s}`, n * 5, -5, 6), [`rearPaw${s}`]: joint(`knee${s}`, n * 5, -4, 1),
    });
    return j;
  }
  if (kind === 'evil_hand') {
    const j = { wrist: joint('', 0, -10, 4), palm: joint('wrist', 0, 0, 14), thumbBase: joint('palm', -9, 4, 13), thumbTip: joint('thumbBase', -15, 8, 12) };
    // Finger joints follow the proportions used by the native hand drawing:
    // one short metacarpal, a knuckle and a clearly readable hooked tip.
    for (let i = 0; i < 4; i++) {
      const id = `finger${i}`, x = (i - 1.5) * 6;
      j[id] = joint('palm', x, 7, 14);
      j[`${id}Mid`] = joint(id, x + (i - 1.5) * 1.2, 12, 12);
      j[`${id}Tip`] = joint(`${id}Mid`, x + (i - 1.5) * 1.5, 17, 10);
    }
    return j;
  }
  if (kind === 'eye_tentacle') {
    const j = { base: joint('', 0, -12, 2), stem1: joint('base', 0, 0, 10), stem2: joint('stem1', 2, 1, 20), stem3: joint('stem2', -2, 0, 29), eye: joint('stem3', 0, 1, 36), lashL: joint('eye', -7, 3, 32), lashR: joint('eye', 7, 3, 32), jaw: joint('eye', 0, 5, 30) };
    for (let i = 0; i < 3; i++) { const id = `tendril${i}`; j[id] = joint('base', (i - 1) * 8, 0, 5); j[`${id}Tip`] = joint(id, (i - 1) * 13, 3, 2); }
    return j;
  }
  if (kind === 'jade_tentacle') {
    const j = { base: joint('', 0, -10, 1), segment1: joint('base', 0, 1, 9), segment2: joint('segment1', 1, 0, 17), segment3: joint('segment2', -1, 0, 24), tip: joint('segment3', 0, 1, 31) };
    for (const [s, n] of [['L', -1], ['R', 1]]) { j[`barb${s}`] = joint('segment2', n * 7, 0, 18); j[`barbTip${s}`] = joint(`barb${s}`, n * 6, 1, 15); }
    return j;
  }
  if (kind === 'archangel') {
    const j = humanoid();
    for (const [s, n] of [['L', -1], ['R', 1]]) { j[`wingRoot${s}`] = joint('chest', n * 5, -1, 22); j[`wingMid${s}`] = joint(`wingRoot${s}`, n * 13, -3, 34); j[`wingTip${s}`] = joint(`wingMid${s}`, n * 12, -4, 41); j[`halo${s}`] = joint('head', n * 5, -2, 39); }
    j.halo = joint('head', 0, -1, 42); j.swordTip = joint('handR', 5, 2, 0);
    return j;
  }
  if (kind === 'cave_monster') {
    const j = { pelvis: joint('', 0, -8, 11), chest: joint('pelvis', 0, 5, 18), head: joint('chest', 0, 9, 20), jaw: joint('head', 0, 8, 15), eyeL: joint('head', -4, 6, 21), eyeR: joint('head', 4, 6, 21), tailTip: joint('pelvis', 0, -20, 9) };
    for (let i = 0; i < 3; i++) for (const [s, n] of [['L', -1], ['R', 1]]) { const id = `leg${i}${s}`; j[id] = joint(i < 2 ? 'chest' : 'pelvis', n * (8 + i * 2), (i - 1) * 4, 13 - i); j[`${id}Tip`] = joint(id, n * 10, (i - 1) * 6, 2); }
    return j;
  }
  if (kind === 'tree_ent') {
    const j = { root: joint('', 0, 0, 1), trunk: joint('root', 0, 0, 10), chest: joint('trunk', 0, 0, 20), head: joint('chest', 0, 0, 30), eyeL: joint('head', -3, 5, 31), eyeR: joint('head', 3, 5, 31), leafCrown: joint('head', 0, 1, 39), rootL: joint('root', -8, -3, 1), rootR: joint('root', 8, -3, 1), branchL: joint('chest', -8, 1, 24), branchTipL: joint('branchL', -12, 6, 21), branchR: joint('chest', 8, 1, 24), branchTipR: joint('branchR', 12, 6, 21) };
    return j;
  }
  if (kind === 'spore') {
    const j = { core: joint('', 0, 0, 16), cap: joint('core', 0, 0, 24), eye: joint('core', 0, 5, 18), stalkL: joint('core', -7, 0, 15), stalkTipL: joint('stalkL', -10, 1, 8), stalkR: joint('core', 7, 0, 15), stalkTipR: joint('stalkR', 10, 1, 8) };
    for (let i = 0; i < 5; i++) { const id = `spore${i}`; const a = i * 1.256; j[id] = joint('cap', Math.round(Math.cos(a) * 13), Math.round(Math.sin(a) * 9), 26 + i % 3); }
    return j;
  }
  throw new Error(`Unknown eldritch creature: ${kind}`);
}

const palette = {
  // Corrupted Eye is one bruised, floating eyeball: the iris is the focal
  // point, not a small eye mounted on a beholder-sized orb.
  arcane_eye: { body: '#815d72', shade: '#493246', light: '#bd829c', accent: '#ec5b9a', face: '#e8d9c7', eye: '#a93ddd', outline: '#241827' },
  great_owl: { body: '#985431', shade: '#4b302b', light: '#c77d45', accent: '#e4b65f', face: '#ead19a', eye: '#ffe16a', outline: '#30251f' },
  butterfly_dragon: { body: '#347d83', shade: '#294865', light: '#72b9ae', accent: '#dd8257', face: '#e2c58e', eye: '#fff086', outline: '#222b45' },
  // Bone and old-ivory ramps keep the hand skeletal at gameplay scale; the
  // pink remains a tiny spectral edge accent rather than the main material.
  evil_hand: { body: '#b7ad91', shade: '#777565', light: '#e0d6b5', accent: '#ce7892', face: '#c9c0a4', eye: '#f5b4c4', outline: '#35343a' },
  eye_tentacle: { body: '#934450', shade: '#542b3c', light: '#c66d66', accent: '#edaa74', face: '#e6c0a4', eye: '#ffe279', outline: '#30202f' },
  jade_tentacle: { body: '#388f80', shade: '#20544d', light: '#7ac6a0', accent: '#b6d977', face: '#b8d79b', eye: '#efff9a', outline: '#183b39' },
  flying_raptor: { body: '#545663', shade: '#303441', light: '#a3a5ad', accent: '#90764f', face: '#eee8df', eye: '#f4d66c', outline: '#262833', breast: '#c7c7c6' },
  archangel: { body: '#a78963', shade: '#554a4c', light: '#f0e6d1', accent: '#72cdd1', face: '#f2d8b0', eye: '#fff2bc', outline: '#38323a', wing: '#dbe9ed', wingShade: '#8bb8c2' },
  watcher: { body: '#586992', shade: '#303957', light: '#98acd1', accent: '#e16993', face: '#d8bb9c', eye: '#fff5b4', outline: '#23253e' },
  cave_monster: { body: '#586f67', shade: '#303e43', light: '#94a18a', accent: '#cf744d', face: '#c3a177', eye: '#f4cf6c', outline: '#252e32' },
  tree_ent: { body: '#78563b', shade: '#453a2c', light: '#a47a4e', accent: '#5e8848', face: '#ccb274', eye: '#e8d775', outline: '#2d3024', leafShade: '#405d36', leafLight: '#91aa58' },
  spore: { body: '#8d638e', shade: '#4c3b65', light: '#c19ac6', accent: '#e6c85e', face: '#d8c0cc', eye: '#f8ed97', outline: '#30243f', sporeMid: '#a879ab', sporeGlow: '#d8b9db' },
};

const specialClips = {
  arcane_eye: ['idle', 'float', 'move', 'windup', 'ray', 'recover', 'hurt', 'death'],
  great_owl: ['idle', 'glide', 'swoop', 'peck', 'recover', 'hurt', 'death'],
  butterfly_dragon: ['idle', 'fly', 'windup', 'breath', 'recover', 'hurt', 'death'],
  evil_hand: ['crawl', 'idle', 'windup', 'grab', 'recover', 'hurt', 'death'],
  eye_tentacle: ['idle', 'windup', 'lash', 'recover', 'hurt', 'death'],
  jade_tentacle: ['idle', 'sway', 'windup', 'lash', 'recover', 'death'],
  flying_raptor: ['idle', 'fly', 'stalk', 'dive', 'recover', 'hurt', 'death'],
  archangel: ['idle', 'hover', 'windup', 'strike', 'recover', 'hurt', 'death'],
  watcher: ['idle', 'drift', 'windup', 'gaze', 'recover', 'hurt', 'death'],
  cave_monster: ['idle', 'crawl', 'windup', 'pounce', 'recover', 'hurt', 'death'],
  tree_ent: ['idle', 'walk', 'windup', 'slam', 'recover', 'hurt', 'death'],
  spore: ['idle', 'drift', 'windup', 'burst', 'recover', 'hurt', 'death'],
};

function clipKeys(kind, action, jointNames) {
  return Array.from({ length: 8 }, (_, frame) => {
    const t = frame / 7, phase = frame * Math.PI / 4, wave = Math.sin(phase);
    const joints = Object.fromEntries(jointNames.map(name => [name, [0, 0, 0]]));
    const set = (name, x, y, z) => { if (joints[name]) joints[name] = [x, y, z]; };
    const bob = Math.sin(phase * 2) * (action === 'idle' ? .45 : .9);
    for (const name of ['body', 'chest', 'core', 'head', 'eye', 'cap', 'pelvis']) set(name, 0, 0, bob);
    if (['move', 'glide', 'fly', 'swoop', 'stalk', 'dive', 'crawl', 'walk', 'drift'].includes(action)) {
      for (const name of ['wingTipL', 'wingTipR', 'wingMidL', 'wingMidR', 'wingFingerL', 'wingFingerR']) set(name, 0, wave * 1.4, Math.abs(wave) * 3);
      for (const name of ['footL', 'footR', 'frontPawL', 'frontPawR', 'rearPawL', 'rearPawR']) set(name, 0, Math.sin(phase) * 2, Math.max(0, -wave) * 1.5);
      if (kind === 'watcher') for (let i = 0; i < 4; i++) set(`stalk${i}`, wave * .7 * ((i % 2) ? -1 : 1), 0, bob);
      for (let i = 1; i <= 3; i++) set(`segment${i}`, wave * i * .3, 0, bob);
      set('tailTip', wave * 2, 0, bob);
    }
    if (kind === 'butterfly_dragon' && ['fly', 'breath'].includes(action)) {
      // Blinky's flight needs a full shoulder-to-sail flap, not the near-static
      // generic wing sway. The tips travel farther than the roots and fingers,
      // so the assembled butterfly wings visibly fold and open through flight.
      for (const side of ['L', 'R']) {
        set(`wingRoot${side}`, 0, wave * 2.2, wave * 3.4);
        set(`wingTip${side}`, 0, wave * 5.2, wave * 12);
        set(`wingFinger${side}`, 0, -wave * 6.2, wave * 9.5);
      }
      set('tailTip', wave * 2.4, wave * .7, bob);
      set('pelvis', 0, 0, bob + Math.abs(wave) * 1.5);
    }
    if (action === 'crawl' && kind === 'evil_hand') {
      // Two opposing finger pairs alternate their plant and reach. The palm
      // unloads as one pair curls up, then the wrist settles while that pair
      // reaches ahead; all channels remain normal editable rig keys.
      for (let i = 0; i < 4; i++) {
        const side = i % 2 ? -1 : 1;
        const lift = Math.max(0, wave * side);
        const reach = wave * side;
        set(`finger${i}`, side * wave * .45, -reach * 1.7, lift * 3.4);
        set(`finger${i}Mid`, side * wave * .7, -reach * 2.5, lift * 2.5);
        set(`finger${i}Tip`, side * wave, -reach * 3.1, lift * 1.8);
      }
      set('thumbBase', wave * .8, -wave, Math.max(0, wave) * .9);
      set('thumbTip', wave * 1.2, -wave * 1.5, Math.max(0, wave) * 1.5);
      set('wrist', 0, wave * 1.5, 1 + Math.abs(wave) * 4.2);
      set('palm', 0, wave * 2, Math.abs(wave) * 4.6);
    }
    if (action === 'windup') {
      const pull = Math.sin(t * Math.PI / 2);
      for (const name of ['head', 'eye', 'tip', 'beak']) set(name, 0, -pull * 3, -pull * 1.5);
      for (const name of ['wingTipL', 'wingTipR', 'branchTipL', 'branchTipR']) set(name, 0, 0, -pull * 2);
      if (kind === 'watcher') for (let i = 0; i < 4; i++) set(`stalk${i}Tip`, Math.sin(i + t) * 1.5, -pull * 2, pull * 2);
    }
    const hit = Math.sin(t * Math.PI);
    if (['ray', 'gaze', 'breath', 'lash', 'grab', 'peck', 'strike', 'pounce', 'swoop', 'dive', 'slam', 'burst'].includes(action)) {
      for (const name of ['head', 'eye', 'tip', 'beak', 'jaw', 'handR', 'branchTipL', 'branchTipR']) set(name, 0, hit * 5, hit * 2);
      if (kind === 'watcher') for (let i = 0; i < 4; i++) set(`stalk${i}Tip`, Math.sin(i + phase) * 2, hit * 3, hit * 2);
      for (let i = 1; i <= 3; i++) set(`segment${i}`, (i % 2 ? 1 : -1) * hit * i, hit * 2, hit * 2);
      for (const name of ['wingTipL', 'wingTipR', 'wingMidL', 'wingMidR']) set(name, 0, wave * 2, Math.abs(wave) * 3);
    }
    if (action === 'death') {
      for (const name of jointNames) set(name, 0, 0, -t * 9);
    }
    if (action === 'hurt') for (const name of ['head', 'eye', 'body', 'chest']) set(name, wave * 1.5, -2, -1);
    return { frame, joints };
  });
}

const labels = {
  arcane_eye: 'Corrupted Eye / floating eye', great_owl: 'Great Owl / gliding predator', butterfly_dragon: 'Blinky / butterfly dragon', evil_hand: 'Clinging Remains / crawling hand',
  eye_tentacle: 'Corrupted Eye Tentacle / rooted aberration', jade_tentacle: 'Jade Tentacle / linked stalk', flying_raptor: 'Flying Raptor / winged hunter', archangel: 'Archangel / winged guardian',
  watcher: 'Watcher / small floating sentry', cave_monster: 'Cave Monster / six-limbed crawler', tree_ent: 'Tree Ent / walking elder', spore: 'Brilliant Spore / drifting fungus',
};

function createModel(kind) {
  const joints = skeletonFor(kind), jointNames = Object.keys(joints);
  const clips = Object.fromEntries(specialClips[kind].map(action => [action, { fps: 10, length: 8, loop: ['idle', 'float', 'move', 'glide', 'fly', 'crawl', 'drift', 'walk', 'stalk', 'sway', 'hover'].includes(action), keys: clipKeys(kind, action, jointNames) }]));
  if (kind === 'great_owl') {
    // Replace matching base actions with sampled Archimedes motion. Keep the
    // native glide: the donor's tier-3 flight sequences alias to ground Stand.
    Object.assign(clips, structuredClone(GREAT_OWL_WOW_MOTION.clips));
  }
  if (kind === 'butterfly_dragon') {
    // Stand, Walk, Run and AttackUnarmed are independent donor tracks. The
    // source's apparent Fly ID aliases back to Run, so retain native fly.
    Object.assign(clips, structuredClone(BLINKY_WOW_MOTION.clips));
  }
  if (kind === 'evil_hand') {
    // Replace only crawl and attack with the donor's skinned hand motion.
    // Idle, windup, recover, hurt and death stay native and editable.
    for (const [action, clip] of Object.entries(CLINGING_REMAINS_WOW_MOTION.clips)) {
      clips[action] = {
        ...structuredClone(clip),
        keys: clip.keys.map(frame => ({ ...structuredClone(frame), joints: {
          ...Object.fromEntries(jointNames.map(name => [name, [0, 0, 0]])),
          ...structuredClone(frame.joints),
        } })),
      };
    }
  }
  const model = {
    version: 1, type: kind, name: labels[kind], artRevision: 1, animationSource: kind === 'great_owl' ? 'verified-wowhead-donor-motion-with-native-glide' : kind === 'butterfly_dragon' ? 'verified-wowhead-ground-motion-with-native-fly' : kind === 'evil_hand' ? 'verified-wowhead-hand-crawl-and-attack-with-native-warning-death' : 'native-wildbound-approximation',
    ...(kind === 'great_owl' ? { animationProvenance: structuredClone(GREAT_OWL_WOW_MOTION.provenance) } : {}),
    ...(kind === 'butterfly_dragon' ? { animationProvenance: structuredClone(BLINKY_WOW_MOTION.provenance) } : {}),
    ...(kind === 'evil_hand' ? { animationProvenance: structuredClone(CLINGING_REMAINS_WOW_MOTION.provenance) } : {}),
    joints, palette: { ...palette[kind] }, shape: { bodyWidth: kind === 'tree_ent' ? 13 : 9, headRadius: kind === 'arcane_eye' || kind === 'watcher' ? 7 : 5, limbWidth: kind === 'cave_monster' ? 4 : 3, wingSpan: kind === 'great_owl' ? 26 : 22 },
    visibility: Object.fromEntries(jointNames.filter(n => /^(eye|beak|snout)/.test(n)).map(n => [n, Array.from({ length: 8 }, (_, d) => d !== 4 && !(d === 3 && n === 'eyeR') && !(d === 5 && n === 'eyeL'))])),
    clips,
  };
  return model;
}

const MODELS = Object.fromEntries(Object.keys(specialClips).map(kind => [kind, createModel(kind)]));
const clone = value => structuredClone(value);
const poseFrame = (actor, time, model, action) => actor.playerFrame ?? actor.poseFrame ?? (actor.step != null && actor.moving ? actor.step * 0.65 : time * (model.clips[action]?.fps || 10));

function paintLink(c, a, b, width, color) {
  if (!a || !b) return;
  limb(c, a, b, width, color);
}
function blob(c, point, rx, ry, color) { if (point) ellipse(c, point.x, point.y, rx, ry, color); }
function pixel(c, point, dx, dy, w, h, color) { if (!point) return; c.fillStyle = color; c.fillRect(Math.round(point.x + dx), Math.round(point.y + dy), w, h); }
function eye(c, p, pal, visible = true, scale = 1) {
  if (!visible || !p) return;
  blob(c, p, 3.1 * scale, 2.7 * scale, pal.outline);
  pixel(c, p, -1, -2, 3, 3, pal.eye);
  pixel(c, p, 0, -1, 1, 2, pal.outline);
  pixel(c, p, -2, -1, 1, 1, '#fff8dc');
}
function bodyMass(c, p, w, h, pal) {
  blob(c, p, w + 1, h + 1, pal.outline);
  blob(c, p, w, h, pal.body);
  pixel(c, p, -Math.floor(w * .55), -Math.floor(h * .35), Math.max(2, Math.floor(w * .8)), Math.max(2, Math.floor(h * .3)), pal.light);
  pixel(c, p, Math.floor(w * .35), 1, Math.max(1, Math.floor(w * .34)), Math.max(2, Math.floor(h * .55)), pal.shade);
}
function pixelPolygon(c, points, color) {
  const minY = Math.floor(Math.min(...points.map(p => p.y))), maxY = Math.ceil(Math.max(...points.map(p => p.y)));
  c.fillStyle = color;
  for (let y = minY; y <= maxY; y++) {
    const scan = y + .5, intersections = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      if ((a.y <= scan && b.y > scan) || (b.y <= scan && a.y > scan)) intersections.push(a.x + (scan - a.y) * (b.x - a.x) / (b.y - a.y));
    }
    intersections.sort((a, b) => a - b);
    for (let i = 0; i + 1 < intersections.length; i += 2) {
      const x = Math.floor(intersections[i]), width = Math.max(1, Math.ceil(intersections[i + 1]) - x);
      c.fillRect(x, y, width, 1);
    }
  }
}
function pixelTriangle(c, a, b, d, outline, fill) {
  if (!a || !b || !d) return;
  const points = [a, b, d].map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
  pixelPolygon(c, points, outline);
  const center = { x: points.reduce((n, p) => n + p.x, 0) / 3, y: points.reduce((n, p) => n + p.y, 0) / 3 };
  pixelPolygon(c, points.map(p => ({ x: center.x + (p.x - center.x) * .72, y: center.y + (p.y - center.y) * .72 })), fill);
}
function pixelStar(c, center, radiusX, radiusY, points, outline, fill) {
  if (!center) return;
  const shape = Array.from({ length: points * 2 }, (_, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / points, radius = i % 2 ? .68 : 1;
    return { x: Math.round(center.x + Math.cos(angle) * radiusX * radius), y: Math.round(center.y + Math.sin(angle) * radiusY * radius) };
  });
  pixelPolygon(c, shape, outline);
  pixelPolygon(c, shape.map(p => ({ x: Math.round(center.x + (p.x - center.x) * .82), y: Math.round(center.y + (p.y - center.y) * .82) })), fill);
}

function owlWing(c, root, finger, tip, sign, pal) {
  if (!root || !finger || !tip) return;
  const mix = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const offset = (a, dx, dy) => ({ x: Math.round(a.x + dx), y: Math.round(a.y + dy) });
  const lower = (a, b, t, drop) => { const q = mix(a, b, t); return { x: Math.round(q.x), y: Math.round(q.y + drop) }; };
  // A broad shoulder-to-primary mass with a stepped fan of flight feathers.
  // The old contour collapsed into a thin bar when the owl faced the camera;
  // these larger grouped lobes read as a wing at the native game pixel scale.
  const edge = [
    root,
    offset(root, sign * 4, -4),
    offset(tip, 0, -3),
    tip,
    lower(tip, finger, .16, 7),
    lower(tip, finger, .38, 11),
    lower(tip, finger, .59, 10),
    lower(tip, finger, .80, 8),
    offset(finger, sign * 2, 3),
    offset(root, sign * 3, 5),
  ].map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
  pixelPolygon(c, edge, pal.outline);
  const center = edge.reduce((a, p) => ({ x: a.x + p.x / edge.length, y: a.y + p.y / edge.length }), { x: 0, y: 0 });
  pixelPolygon(c, edge.map(p => ({ x: Math.round(center.x + (p.x - center.x) * .86), y: Math.round(center.y + (p.y - center.y) * .86) })), pal.body);
  // One broad inner cover and a quieter outer flight-feather shadow give the
  // wing weight without drawing a stripe on every feather.
  pixelPolygon(c, [root, lower(root, finger, .28, 3), lower(root, tip, .56, -1), offset(root, sign * 2, 1)], pal.light);
  pixelPolygon(c, [lower(tip, finger, .12, 3), lower(tip, finger, .50, 6), lower(tip, finger, .88, 4), offset(finger, sign, 1)], pal.shade);
}

function archangelWing(c, root, mid, tip, sign, pal) {
  if (!root || !mid || !tip) return;
  // Broad curved energy-feather silhouette attached at the rig shoulder.
  // One large wing mass plus a few grouped feather lobes stays readable at
  // native size; it avoids the previous two thin raised-arm strokes.
  const edge = [
    { x: root.x, y: root.y + 3 },
    { x: root.x + sign * 8, y: root.y - 5 },
    { x: mid.x + sign * 4, y: mid.y + 1 },
    { x: tip.x + sign * 5, y: tip.y + 9 },
    { x: tip.x + sign * 13, y: tip.y + 7 },
    { x: tip.x + sign * 18, y: tip.y + 13 },
    { x: tip.x + sign * 17, y: tip.y + 21 },
    { x: mid.x + sign * 18, y: mid.y + 19 },
    { x: mid.x + sign * 14, y: mid.y + 26 },
    { x: root.x + sign * 12, y: root.y + 19 },
    { x: root.x + sign * 6, y: root.y + 13 },
  ];
  pixelPolygon(c, edge, pal.outline);
  pixelPolygon(c, edge.map(point => ({ x: Math.round(root.x + (point.x - root.x) * .86), y: Math.round(root.y + (point.y - root.y) * .86) })), pal.wing);
  pixelPolygon(c, [edge[1], edge[2], edge[3], edge[5], edge[6], edge[7], { x: mid.x + sign * 8, y: mid.y + 9 }], pal.wingShade);
  pixelPolygon(c, [edge[0], edge[1], edge[2], { x: mid.x + sign * 2, y: mid.y + 11 }, { x: root.x + sign * 4, y: root.y + 10 }], pal.light);
  // Three broad primary feather tips, not individual etched feather lines.
  for (const [x, y, w, h] of [[sign * 10, 15, 5, 5], [sign * 4, 20, 5, 4], [sign * -2, 23, 4, 4]])
    pixel(c, { x: mid.x, y: mid.y }, x, y, w, h, pal.wing);
}

function drawGreatOwl(c, p, pal, d, seen, link) {
  // Tail and feet sit behind the body, so the owl remains grounded instead of
  // reading as a humanoid with straight arms. In profile the layered tail
  // falls behind the body; the foreshortened rig tail alone looked like a bar.
  const profile = d === 2 || d === 6, rearSign = d === 2 ? 1 : -1;
  const pelvis = p.pelvis;
  const tail = profile ? { x: p.pelvis.x + rearSign * 7, y: p.pelvis.y + 15 } : p.tailTip;
  if (tail && pelvis) {
    paintLink(c, pelvis, tail, profile ? 8 : 7, pal.outline);
    paintLink(c, pelvis, tail, profile ? 5 : 5, pal.body);
    const fan = profile ? { x: tail.x + rearSign * 2, y: tail.y + 4 } : tail;
    blob(c, fan, profile ? 5 : 5, profile ? 4 : 2.5, pal.shade);
    if (profile) {
      paintLink(c, tail, { x: tail.x + rearSign * 1, y: tail.y + 8 }, 2, pal.face);
      paintLink(c, tail, { x: tail.x + rearSign * 4, y: tail.y + 7 }, 2, pal.light);
      pixel(c, fan, -1, 2, 3, 1, pal.accent);
    } else pixel(c, tail, -3, -1, 5, 1, pal.light);
  }
  if (profile) {
    // Side-on, the source's near wing folds into a tall fan behind the head.
    // Projected arm joints compress to a few pixels here, so expand the wing
    // around its real shoulder pivot rather than drawing two thin arm-like bars.
    const nearSide = p.wingRootL.depth > p.wingRootR.depth ? 'L' : 'R';
    const root = p[`wingRoot${nearSide}`], s = rearSign;
    const fan = [
      { x: root.x - s * 2, y: root.y + 3 }, { x: root.x + s * 3, y: root.y - 5 },
      { x: root.x + s * 8, y: root.y - 17 }, { x: root.x + s * 11, y: root.y - 29 },
      { x: root.x + s * 16, y: root.y - 26 }, { x: root.x + s * 19, y: root.y - 19 },
      { x: root.x + s * 18, y: root.y - 11 }, { x: root.x + s * 15, y: root.y - 3 },
      { x: root.x + s * 12, y: root.y + 5 }, { x: root.x + s * 7, y: root.y + 8 },
    ];
    pixelPolygon(c, fan, pal.outline);
    pixelPolygon(c, fan.map(q => ({ x: Math.round(root.x + (q.x - root.x) * .84), y: Math.round(root.y + (q.y - root.y) * .88) })), pal.body);
    pixelPolygon(c, [fan[1], fan[2], fan[3], fan[4], { x: root.x + s * 12, y: root.y - 15 }, { x: root.x + s * 6, y: root.y - 5 }], pal.shade);
    pixelPolygon(c, [fan[0], fan[1], { x: root.x + s * 8, y: root.y - 10 }, { x: root.x + s * 5, y: root.y + 2 }], pal.light);
  } else for (const side of ['L', 'R']) {
    const root = p[`wingRoot${side}`], tip = p[`wingTip${side}`], finger = p[`wingFinger${side}`];
    const sign = side === 'L' ? -1 : 1, forward = [0, 1, 7].includes(d), rear = [3, 4, 5].includes(d);
    // The donor lowers the front fan and lifts it in rear views; keep the
    // diagonals swept between those silhouettes around the same rig pivots.
    const tipSweep = forward ? 8 : rear ? -9 : 0, featherDrop = forward ? 3 : rear ? -4 : 0;
    const spanTip = { x: Math.round(root.x + (tip.x - root.x) * 1.3), y: Math.round(root.y + (tip.y - root.y) * 1.12 + tipSweep) };
    const spanFinger = { x: Math.round(root.x + (finger.x - root.x) * 1.22), y: Math.round(root.y + (finger.y - root.y) * 1.16 + featherDrop) };
    owlWing(c, root, spanFinger, spanTip, sign, pal);
  }
  for (const side of ['L', 'R']) {
    link(`hip${side}`, `knee${side}`, 5, pal.outline);
    link(`hip${side}`, `knee${side}`, 3, pal.body);
    link(`knee${side}`, `foot${side}`, 4, pal.shade);
    blob(c, p[`foot${side}`], 3.5, 2, pal.accent);
    pixel(c, p[`foot${side}`], -4, 1, 4, 1, pal.outline);
  }

  bodyMass(c, p.chest, 10, 9, pal);
  // Compact, rounded body and one buff breast shield echo the source's dense
  // torso instead of stretching into a thin human-like trunk.
  blob(c, { x: p.chest.x, y: p.chest.y + 3 }, 6, 6, pal.face);
  pixel(c, p.chest, -4, 2, 4, 2, pal.light);
  link('pelvis', 'chest', 8, pal.body);
  link('pelvis', 'chest', 4, pal.shade);
  link('chest', 'neck', 7, pal.shade);
  link('chest', 'neck', 5, pal.body);
  link('neck', 'head', 6, pal.shade);

  bodyMass(c, p.head, 8, 7, pal);
  // Twin pointed ear tufts sit outside the crown, as one stepped silhouette
  // rather than two square pixels pasted onto the skull.
  for (const sign of [-1, 1]) {
    const tuft = [
      { x: Math.round(p.head.x + sign * 3), y: Math.round(p.head.y - 2) },
      { x: Math.round(p.head.x + sign * 8), y: Math.round(p.head.y - 9) },
      { x: Math.round(p.head.x + sign * 7), y: Math.round(p.head.y - 1) },
    ];
    pixelPolygon(c, tuft, pal.outline);
    pixelPolygon(c, tuft.map(q => ({ x: Math.round(p.head.x + (q.x - p.head.x) * .72), y: Math.round(p.head.y + (q.y - p.head.y) * .72) })), pal.light);
  }

  // The cream face disk turns with the head. Rear views retain the back of the
  // head; side views show only the eye that the rig's visibility mask permits.
  if ([0, 1, 2, 3, 5, 6, 7].includes(d)) {
    blob(c, { x: p.head.x, y: p.head.y + 1 }, 7, 5.2, pal.shade);
    blob(c, { x: p.head.x, y: p.head.y + 1 }, 5.8, 4.2, pal.face);
  }
  if (d === 0 || d === 1 || d === 7) {
    // A connected brow rim frames the golden eyes and makes the face disk read
    // as an owl mask, with the beak as its central lower point.
    blob(c, { x: p.head.x, y: p.head.y - 1 }, 7, 1.8, pal.body);
    pixel(c, p.head, -6, 1, 3, 2, pal.accent);
    pixel(c, p.head, 3, 1, 3, 2, pal.accent);
  }
  eye(c, p.eyeL, pal, seen('eyeL'));
  eye(c, p.eyeR, pal, seen('eyeR'));
  link('head', 'beak', 4, pal.outline);
  pixel(c, p.beak, -2, -1, 4, 3, pal.accent);
  pixel(c, p.beak, -1, 1, 2, 2, pal.shade);
  pixel(c, p.beak, 0, 0, 1, 1, pal.light);
}

function drawEldritch(c, actor, time, model, suppliedPose) {
  const kind = model.type, d = facingIndex(actor.faceX, actor.faceY), action = actor.animationAction || actor.clip || (actor.state === 'windup' ? 'windup' : actor.state === 'recover' ? 'recover' : actor.state === 'dead' ? 'death' : actor.moving || (kind === 'evil_hand' && actor.state === 'crawl') ? (kind === 'evil_hand' ? 'crawl' : kind.includes('owl') || kind.includes('raptor') || kind.includes('dragon') || kind === 'archangel' ? 'fly' : 'move') : 'idle');
  const pose = suppliedPose || poseAt(model, model.clips[action] ? action : 'idle', poseFrame(actor, time, model, action));
  const p = Object.fromEntries(Object.entries(pose).map(([name, xyz]) => [name, projectPoint(xyz, d)]));
  if (kind === 'eye_tentacle') {
    // The source creature is a tall stalk. Preserve the planted pivot while
    // extending its articulated height so its 8-view gameplay silhouette
    // keeps that proportion instead of reading as a squat imp.
    const root = p.base;
    for (const [name, point] of Object.entries(p)) if (name !== 'base') {
      point.y = Math.round(root.y + (point.y - root.y) * 1.65);
    }
  }
  const pal = model.palette, s = model.shape, link = (a, b, width = s.limbWidth, color = pal.body) => paintLink(c, p[a], p[b], width, color);
  const seen = name => model.visibility[name]?.[d] !== false;
  const headEye = name => eye(c, p[name], pal, seen(name), kind === 'archangel' ? .8 : 1);
  if (kind === 'arcane_eye' || kind === 'watcher') {
    const count = 4;
    if (kind === 'watcher') for (let i = 0; i < count; i++) {
      // These short sensor stalks belong only to the separate Watcher.
      const rootWidth = 4, shaftWidth = 3;
      link('body', `stalk${i}`, rootWidth, pal.outline);
      link('body', `stalk${i}`, rootWidth - 2, pal.shade);
      link(`stalk${i}`, `stalk${i}Tip`, shaftWidth, pal.outline);
      link(`stalk${i}`, `stalk${i}Tip`, shaftWidth - 1.5, pal.body);
      blob(c, p[`stalk${i}Tip`], 2, 1.5, pal.body);
      pixel(c, p[`stalk${i}Tip`], -1, -1, 2, 1, pal.light);
    }
    if (kind === 'arcane_eye') {
      const b = p.body;
      // The source turns as one orb with its eye mounted on the front surface.
      // Carry that eye around the silhouette instead of stamping the full
      // magenta pupil onto every facing: front, foreshortened side, then back.
      const eyeSurface = projectPoint([0, 7.5, 0], d);
      const e = { x: b.x + eyeSurface.x, y: b.y + eyeSurface.y };
      const frontness = Math.cos(d * Math.PI / 4);
      const eyeScale = Math.max(0, Math.min(1, (frontness - .02) / .68));
      const sideOn = Math.abs(frontness) < .03;
      // Tiny corrupted motes orbit in world space and turn with the orb.
      for (const [ox, oy, color, w, h] of [
        [-15, -8, pal.accent, 2, 2], [13, -11, pal.light, 2, 2],
        [16, 7, pal.accent, 2, 1], [-12, 13, pal.light, 2, 1],
      ]) {
        const q = projectPoint([ox, oy, 0], d);
        pixel(c, b, Math.round(q.x), Math.round(q.y), w, h, color);
      }
      // Uneven lid and bruised socket keep the simple single-orb silhouette.
      blob(c, b, 14, 10, pal.outline);
      blob(c, b, 12, 8, pal.shade);
      blob(c, b, 10, 6.5, pal.body);
      const lightSide = projectPoint([-4, -2, 0], d), darkSide = projectPoint([4, 2, 0], d);
      pixel(c, b, Math.round(lightSide.x) - 3, Math.round(lightSide.y) - 1, 6, 2, pal.light);
      pixel(c, b, Math.round(darkSide.x) - 3, Math.round(darkSide.y), 6, 2, pal.shade);
      if (eyeScale > .05) {
        blob(c, e, 8.5 * eyeScale, 6 * eyeScale, pal.outline);
        blob(c, e, 7 * eyeScale, 4.5 * eyeScale, pal.face);
        const iris = { x: e.x + (p.iris.x - p.eye.x) * eyeScale, y: e.y + (p.iris.y - p.eye.y) * eyeScale };
        const pupil = { x: e.x + (p.pupil.x - p.eye.x) * eyeScale, y: e.y + (p.pupil.y - p.eye.y) * eyeScale };
        const glint = { x: e.x + (p.glint.x - p.eye.x) * eyeScale, y: e.y + (p.glint.y - p.eye.y) * eyeScale };
        blob(c, iris, 4.2 * eyeScale, 4.8 * eyeScale, pal.shade);
        blob(c, iris, 3.3 * eyeScale, 4 * eyeScale, pal.accent);
        blob(c, pupil, 1.6 * eyeScale, 3.2 * eyeScale, pal.outline);
        pixel(c, glint, -1, -1, 2, 1, '#fff2dc');
        pixel(c, e, -5 * eyeScale, -5 * eyeScale, Math.max(1, Math.round(8 * eyeScale)), Math.max(1, Math.round(2 * eyeScale)), pal.shade);
        if (eyeScale > .62) pixel(c, e, -4, 5, 7, 1, pal.light);
      } else if (sideOn) {
        // At exact profile the eye is almost occluded; keep just its lid edge.
        pixel(c, e, -1, -4, 3, 8, pal.outline);
        pixel(c, e, 0, -1, 1, 3, pal.accent);
      }
    } else {
      bodyMass(c, p.body, 6, 6, pal);
    }
    if (kind === 'watcher') { blob(c, { ...p.body, y: p.body.y - 6 }, 6, 1.5, pal.accent); pixel(c, p.body, -2, -5, 4, 1, pal.light); }
    if (kind === 'watcher') { blob(c, p.eye, 4.5, 4, pal.outline); blob(c, p.eye, 3, 2.8, pal.face); eye(c, p.eye, pal, true, .9); }
    if (action === 'ray' || action === 'gaze') { pixel(c, p.eye, -1, 3, 2, 5, pal.accent); pixel(c, p.eye, -2, 7, 4, 1, pal.light); }
  } else if (kind === 'great_owl' || kind === 'flying_raptor') {
    const owl = kind === 'great_owl';
    if (owl) {
      drawGreatOwl(c, p, pal, d, seen, link);
      return p;
    }
    if (!owl) {
      const profile = d === 2 || d === 6;
      if (profile) {
        const side = p.wingRootL.depth > p.wingRootR.depth ? 'L' : 'R';
        const root = p[`wingRoot${side}`], sign = d === 2 ? 1 : -1;
        const tip = action === 'fly' || action === 'dive' ? p[`wingTip${side}`] : { x: root.x + sign * 17, y: root.y - 4 };
        const finger = action === 'fly' || action === 'dive' ? p[`wingFinger${side}`] : { x: root.x + sign * 14, y: root.y + 12 };
        owlWing(c, root, finger, tip, sign, pal);
      } else for (const side of ['L', 'R']) {
        const root = p[`wingRoot${side}`], tip = p[`wingTip${side}`], finger = p[`wingFinger${side}`], sign = root.x <= p.chest.x ? -1 : 1;
        const extended = action === 'fly' || action === 'dive' || action === 'swoop';
        const drawTip = extended ? tip : { x: root.x + (tip.x - root.x) * .48, y: root.y + (tip.y - root.y) * .42 + 5 };
        const drawFinger = extended ? finger : { x: root.x + (finger.x - root.x) * .52, y: root.y + (finger.y - root.y) * .45 + 5 };
        owlWing(c, root, drawFinger, drawTip, sign, pal);
      }
      for (const side of ['L', 'R']) {
        link(`hip${side}`, `knee${side}`, 4, pal.outline); link(`hip${side}`, `knee${side}`, 3, pal.accent);
        link(`knee${side}`, `foot${side}`, 4, pal.outline); link(`knee${side}`, `foot${side}`, 2.5, pal.accent);
        pixel(c, p[`foot${side}`], -3, 0, 7, 2, pal.accent); pixel(c, p[`foot${side}`], -1, -1, 3, 1, pal.light);
      }
      // Compact, heavy breast and a pale ruff make Scruffbeak owl-like without
      // changing its flying-raptor rig or its existing wing animation.
      bodyMass(c, p.chest, 9, 10, pal);
      blob(c, { x: p.chest.x, y: p.chest.y + 3 }, 7, 7, pal.breast);
      pixel(c, p.chest, -4, 1, 4, 2, pal.light);
      link('pelvis', 'chest', 8, pal.outline); link('pelvis', 'chest', 5, pal.body);
      link('chest', 'neck', 7, pal.outline); link('chest', 'neck', 5, pal.body); link('neck', 'head', 6, pal.shade);
      bodyMass(c, p.head, 7, 6, pal);
      // A stepped pale cheek/ruff, paired crown tufts and a heavier hooked
      // beak borrow the source's most readable face masses.
      blob(c, { x: p.head.x, y: p.head.y + 1 }, 6, 4, pal.face);
      for (const sign of [-1, 1]) {
        const tuft = [{x:p.head.x+sign*2,y:p.head.y-3},{x:p.head.x+sign*6,y:p.head.y-9},{x:p.head.x+sign*7,y:p.head.y-1}];
        pixelPolygon(c,tuft,pal.outline);pixelPolygon(c,tuft.map(q=>({x:p.head.x+(q.x-p.head.x)*.7,y:p.head.y+(q.y-p.head.y)*.7})),pal.light);
      }
      headEye('eyeL'); headEye('eyeR');
      const beak = [{x:p.head.x-3,y:p.head.y+3},{x:p.head.x+3,y:p.head.y+3},{x:p.beak.x+2,y:p.beak.y-1},{x:p.beak.x,y:p.beak.y+4},{x:p.beak.x-2,y:p.beak.y}];
      pixelPolygon(c,beak,pal.outline);pixelPolygon(c,beak.map(q=>({x:p.head.x+(q.x-p.head.x)*.74,y:p.head.y+(q.y-p.head.y)*.78})),pal.accent);pixel(c,p.beak,-1,0,2,2,pal.shade);
      // Short layered tail feathers, held close while the bird is standing.
      link('pelvis','tailTip',7,pal.outline);link('pelvis','tailTip',5,pal.shade);pixel(c,p.tailTip,-4,-1,7,2,pal.light);pixel(c,p.tailTip,-2,1,6,2,pal.accent);
      return p;
    }
    for (const side of ['L', 'R']) {
      const root = p[`wingRoot${side}`], tip = p[`wingTip${side}`], finger = p[`wingFinger${side}`];
      pixelTriangle(c, root, finger, tip, pal.outline, pal.shade);
      link(`wingRoot${side}`, `wingTip${side}`, 7, pal.shade); link(`wingRoot${side}`, `wingTip${side}`, 4, pal.body); link(`wingRoot${side}`, `wingFinger${side}`, 3, pal.light);
      if (root && tip && finger) { pixel(c, root, -2, -1, 4, 3, pal.accent); pixel(c, tip, -2, -1, 3, 2, pal.light); pixel(c, finger, -1, -1, 3, 1, pal.face); }
      link(`hip${side}`, `knee${side}`, 4, pal.shade); link(`knee${side}`, `foot${side}`, 3, pal.body); pixel(c, p[`foot${side}`], -3, 0, 7, 2, pal.accent);
    }
    bodyMass(c, p.chest, 10, 11, pal); link('pelvis', 'chest', 9, pal.body); link('chest', 'neck', 7, pal.light); link('neck', 'head', 6, pal.body);
    bodyMass(c, p.head, 8, 7, pal);
    if (owl) {
      // Broad face and tucked ear tufts distinguish the owl's round head.
      blob(c, p.head, 5, 4, pal.face);
      pixel(c, p.head, -7, -6, 4, 4, pal.body); pixel(c, p.head, 3, -6, 4, 4, pal.body);
    }
    headEye('eyeL'); headEye('eyeR');
    link('head', 'beak', owl ? 3 : 5, pal.accent); pixel(c, p.beak, -1, -1, owl ? 2 : 3, 2, pal.light);
    link('pelvis', 'tailTip', owl ? 3 : 4, owl ? pal.shade : pal.body);
    if (!owl) { pixel(c, p.tailTip, -2, -1, 5, 2, pal.accent); pixel(c, p.tailTip, -1, 1, 3, 1, pal.light); }
  } else if (kind === 'butterfly_dragon') {
    // Blinky's identifying read is a small four-legged dragon with a long
    // neck, a curled tail and butterfly sails. The earlier build rendered a
    // barrel-bodied insect: these connected body masses lengthen the animal
    // through its facing axis, while the face and all limbs stay on the native
    // editable rig anchors.
    const localOffset = (origin, x, y, z = 0) => {
      const q = projectPoint([x, y, z], d);
      return { x: Math.round(origin.x + q.x), y: Math.round(origin.y + q.y) };
    };
    const dragonBody = [
      [-7,-10,0],[-8,-4,1],[-6,4,1],[-4,10,0],[-3,17,1],[-1,22,0],
      [2,22,0],[4,16,0],[7,8,-1],[8,0,0],[7,-7,0],[4,-11,0],
    ].map(([x,y,z])=>localOffset(p.pelvis,x,y,z));
    pixelPolygon(c,dragonBody,pal.outline);
    pixelPolygon(c,dragonBody.map(q=>({x:Math.round(p.pelvis.x+(q.x-p.pelvis.x)*.82),y:Math.round(p.pelvis.y+(q.y-p.pelvis.y)*.82)})),pal.body);
    // A single broad back light, one cool belly plate and a defined neck
    // transition supply volume without adding insect-like body rings.
    pixelPolygon(c,[[-5,-7,1],[4,-8,1],[6,1,0],[2,8,0],[-3,5,0]].map(([x,y,z])=>localOffset(p.pelvis,x,y,z)),pal.light);
    pixelPolygon(c,[[-4,8,0],[3,8,0],[4,17,0],[1,20,0],[-2,17,0]].map(([x,y,z])=>localOffset(p.pelvis,x,y,z)),pal.shade);
    // The raised neck and wedge muzzle make the species read as a dragon even
    // from the side; the eye stays on the head joint for the complete turn.
    link('chest','neck',8,pal.outline); link('chest','neck',5,pal.body);
    blob(c,p.head,7,6,pal.outline); blob(c,p.head,5,4,pal.light);
    link('head','snout',5,pal.outline); link('head','snout',3,pal.face);
    link('head','jaw',4,pal.shade);
    pixel(c,p.snout,-2,-1,4,1,pal.accent);
    headEye('eyeL'); headEye('eyeR');
    // Folded butterfly sails remain broad and attached; the spots are a pair
    // of large wing eyespots, not little scales repeated over every panel.
    for (const side of ['L', 'R']) {
      const root = p[`wingRoot${side}`], tip = p[`wingTip${side}`], finger = p[`wingFinger${side}`];
      if (!root || !tip || !finger) continue;
      const sign = root.x <= p.chest.x ? -1 : 1;
      const shoulder = { x: root.x + (tip.x - root.x) * .42, y: root.y + (tip.y - root.y) * .42 };
      const crown = { x: tip.x + sign * 2, y: tip.y - 12 };
      // Resolved sail silhouette: one upper wing and one tucked lower lobe.
      const sail = [root, finger, tip, crown, shoulder];
      pixelPolygon(c, sail, pal.outline);
      pixelPolygon(c, sail.map(point => ({ x: root.x + (point.x - root.x) * .82, y: root.y + (point.y - root.y) * .82 })), pal.shade);
      const lowerLobe = [root, finger, { x: finger.x - sign * 4, y: finger.y + 4 }, { x: root.x - sign * 2, y: root.y + 6 }];
      pixelPolygon(c, lowerLobe, pal.body);
      link(`wingRoot${side}`, `wingTip${side}`, 2.5, pal.light);
      const spot = { x: root.x + (tip.x - root.x) * .48 + (finger.x - root.x) * .18, y: root.y + (tip.y - root.y) * .48 + (finger.y - root.y) * .18 };
      blob(c, spot, 3.2, 3.5, pal.accent); blob(c, spot, 1.1, 1.5, pal.face);
      pixel(c, tip, -1, -2, 2, 2, pal.light);
      for (const [a, b, paw] of [[`shoulder${side}`, `elbow${side}`, `frontPaw${side}`], [`hip${side}`, `knee${side}`, `rearPaw${side}`]]) { link(a, b, 4.5, pal.outline); link(a, b, 3, pal.body); link(b, paw, 3, pal.shade); pixel(c,p[paw],-2,0,4,2,pal.accent); }
    }
    // The distal tail curls like the reference's banded lizard tail.
    link('tailBase','tailTip',7,pal.outline); link('tailBase','tailTip',4,pal.body);
    const tailBand=localOffset(p.tailTip,0,0,1); blob(c,tailBand,3,2,pal.accent); pixel(c,tailBand,-1,-1,2,1,pal.light);
  } else if (kind === 'evil_hand') {
    // Lay the remains palm-down: short jagged wrist stump behind one broad
    // palm, four distinct finger bones reaching forward, and a thumb hooked
    // outward. This removes the round central mark that collapsed into an
    // eye-on-a-stalk at native scale. All shapes turn in local facing space.
    const handPoint=(origin,x,y,z=0)=>{const q=projectPoint([x,y*1.55,z],d);return{x:Math.round(origin.x+q.x),y:Math.round(origin.y+q.y)}};
    const articulatedPoint = name => {
      const current = pose[name];
      if (!current) return null;
      return handPoint(palm,current[0]-pose.palm[0],current[1]-pose.palm[1],current[2]-pose.palm[2]);
    };
    const palm=p.palm;
    const wrist=p.wrist||palm;
    const stump=[[-5,-2,0],[-3,-7,0],[3,-7,0],[5,-2,0],[5,4,0],[-5,4,0]].map(([x,y,z])=>handPoint(wrist,x,y,z));
    pixelPolygon(c,stump,pal.outline);pixelPolygon(c,stump.map(q=>({x:Math.round(wrist.x+(q.x-wrist.x)*.68),y:Math.round(wrist.y+(q.y-wrist.y)*.68)})),pal.shade);
    const palmShape=[[-12,-8,0],[-10,-12,0],[-5,-14,0],[5,-14,0],[11,-10,0],[13,-3,0],[10,5,0],[5,9,0],[-5,9,0],[-10,5,0],[-13,-2,0]].map(([x,y,z])=>handPoint(palm,x,y,z));
    pixelPolygon(c,palmShape,pal.outline);
    pixelPolygon(c,palmShape.map(q=>({x:Math.round(palm.x+(q.x-palm.x)*.78),y:Math.round(palm.y+(q.y-palm.y)*.78)})),pal.body);
    pixelPolygon(c,[[-7,-8,1],[0,-10,1],[6,-6,1],[2,-2,1],[-6,-2,1]].map(([x,y,z])=>handPoint(palm,x,y,z)),pal.light);
    // Four tapered fingers, gathered into the same broad palm instead of
    // individually outlined capsules. Their uneven lengths sell a crawling
    // planted hand rather than a floating eyeball.
    for(let i=0;i<4;i++){
      const base=articulatedPoint(`finger${i}`), mid=articulatedPoint(`finger${i}Mid`), tip=articulatedPoint(`finger${i}Tip`);
      if(!base||!mid||!tip)continue;
      const dx=tip.x-base.x,dy=tip.y-base.y,length=Math.max(1,Math.hypot(dx,dy)),nx=-dy/length,ny=dx/length;
      const shape=[{x:base.x+nx*2,y:base.y+ny*2},{x:base.x-nx*2,y:base.y-ny*2},{x:mid.x-nx*1.6,y:mid.y-ny*1.6},{x:tip.x,y:tip.y},{x:mid.x+nx*1.4,y:mid.y+ny*1.4}];
      pixelPolygon(c,shape,pal.outline);
      const center=shape.reduce((sum,q)=>({x:sum.x+q.x/shape.length,y:sum.y+q.y/shape.length}),{x:0,y:0});
      pixelPolygon(c,shape.map(q=>({x:Math.round(center.x+(q.x-center.x)*.64),y:Math.round(center.y+(q.y-center.y)*.64)})),pal.body);
      pixel(c,mid,-1,0,2,1,pal.shade);
    }
    const thumbBase=articulatedPoint('thumbBase'),thumbTip=articulatedPoint('thumbTip');
    const thumb=thumbBase&&thumbTip?[handPoint(palm,-9,-8,0),handPoint(palm,-14,-5,0),thumbBase,thumbTip,handPoint(palm,-12,0,0),handPoint(palm,-7,-2,0)]:[];
    pixelPolygon(c,thumb,pal.outline);
    if(thumb.length){const center=thumb.reduce((sum,q)=>({x:sum.x+q.x/thumb.length,y:sum.y+q.y/thumb.length}),{x:0,y:0});pixelPolygon(c,thumb.map(q=>({x:Math.round(center.x+(q.x-center.x)*.7),y:Math.round(center.y+(q.y-center.y)*.7)})),pal.body);}
    pixel(c,handPoint(palm,-15,0,1),-1,-1,2,1,pal.light);
  } else if (kind === 'eye_tentacle') {
    // One tall fleshy stalk runs continuously from a grounded root collar into
    // the bulb. Leave the rig's side tendril joints available to animation,
    // but don't draw them as little feet around the base.
    blob(c, p.base, 9, 4, pal.outline);
    blob(c, p.base, 7, 3, pal.shade);
    blob(c, p.base, 5, 2, pal.body);
    link('base', 'stem1', 13, pal.outline); link('base', 'stem1', 10, pal.shade); link('base', 'stem1', 7, pal.body);
    link('stem1', 'stem2', 11, pal.outline); link('stem1', 'stem2', 8, pal.body); link('stem1', 'stem2', 4, pal.shade);
    link('stem2', 'stem3', 10, pal.outline); link('stem2', 'stem3', 7, pal.body); link('stem2', 'stem3', 3, pal.light);
    link('stem3', 'eye', 9, pal.outline); link('stem3', 'eye', 6, pal.shade); link('stem3', 'eye', 4, pal.body);
    blob(c, p.stem1, 5, 4, pal.shade); pixel(c, p.stem1, -3, -2, 5, 1, pal.light);
    blob(c, p.stem2, 4, 3, pal.shade); pixel(c, p.stem2, -2, -2, 4, 1, pal.light);
    // Large armored eye bulb with a warm vertical slit, echoing the linked
    // source model's dark lid and bright orange eye.
    blob(c, p.eye, 13, 12, pal.outline);
    blob(c, p.eye, 11, 10, pal.shade);
    blob(c, p.eye, 9, 8, pal.body);
    pixel(c, p.eye, -7, -6, 13, 2, pal.shade);
    if (seen('eye')) {
      blob(c, p.eye, 6, 6, pal.outline);
      blob(c, p.eye, 4, 5, pal.accent);
      pixel(c, p.eye, -1, -4, 2, 8, pal.outline);
      pixel(c, p.eye, -3, -2, 1, 3, pal.eye);
      pixel(c, p.eye, 2, -3, 1, 2, pal.light);
    }
  } else if (kind === 'jade_tentacle') {
    // A single tapered stalk echoes the long jade tendril in the reference.
    // Segment joints overlap into one silhouette; the old tiny side barbs
    // looked like arms and made the creature read as a little humanoid.
    // Keep the single rooted tendril, but give its anatomy a readable weight:
    // a flared foot, broad lower stem, gradual taper, and a rounded crown that
    // hooks down. Local-space bends rotate with the existing eight-view rig.
    const bend1=projectPoint([pose.segment1[0]+5,pose.segment1[1],pose.segment1[2]],d);
    const bend2=projectPoint([pose.segment2[0]+8,pose.segment2[1]+1,pose.segment2[2]],d);
    const bend3=projectPoint([pose.segment3[0]+7,pose.segment3[1]+1,pose.segment3[2]],d);
    const path=[p.base,bend1,p.segment1,bend2,p.segment2,bend3,p.segment3,p.tip];
    for(let i=0;i<path.length-1;i++){
      const t=i/(path.length-1),width=17-t*7,a=path[i],b=path[i+1];
      paintLink(c,a,b,width,pal.outline);
      paintLink(c,{x:a.x,y:a.y-1},{x:b.x,y:b.y-1},Math.max(6,width-5),t<.36?pal.shade:pal.body);
      paintLink(c,{x:a.x-1,y:a.y-2},{x:b.x-1,y:b.y-2},Math.max(2,width-10),pal.light);
    }
    // Three short oblique color breaks suggest soft segmented flesh without
    // dividing the stalk into separate stacked rings.
    for(const [joint,offset] of [[p.segment1,-1],[p.segment2,1],[p.segment3,-1]]){
      paintLink(c,{x:joint.x-3,y:joint.y+offset+1},{x:joint.x+2,y:joint.y+offset-1},2,pal.shade);
      paintLink(c,{x:joint.x-2,y:joint.y+offset},{x:joint.x+1,y:joint.y+offset-2},1,pal.light);
    }
    // Crown mass is the broadest point. A small luminous eye/node remains
    // tucked into its front while the narrow end bends down from the crown.
    blob(c,p.tip,9,8,pal.outline);blob(c,p.tip,7,6,pal.body);
    pixel(c,p.tip,-5,-4,7,2,pal.light);pixel(c,p.tip,-4,-2,5,2,pal.shade);
    if(d!==4){
      blob(c,p.tip,3,3,pal.outline);blob(c,p.tip,2,2,pal.accent);
      pixel(c,p.tip,-1,-1,1,2,pal.eye);pixel(c,p.tip,1,-2,1,1,pal.light);
    }
    const curl=projectPoint([pose.tip[0]+6,pose.tip[1]+1,pose.tip[2]-2],d);
    const point=projectPoint([pose.tip[0]+7,pose.tip[1]+2,pose.tip[2]-8],d);
    paintLink(c,p.tip,curl,7,pal.outline);paintLink(c,p.tip,curl,5,pal.body);paintLink(c,{x:p.tip.x,y:p.tip.y-2},{x:curl.x,y:curl.y-2},2,pal.light);
    paintLink(c,curl,point,5,pal.outline);paintLink(c,curl,point,3,pal.body);paintLink(c,{x:curl.x,y:curl.y-1},{x:point.x,y:point.y-1},1,pal.accent);
    blob(c,p.base,8,4,pal.outline);blob(c,p.base,6,3,pal.shade);blob(c,p.base,4,2,pal.body);pixel(c,p.base,-2,-1,4,1,pal.light);
  } else if (kind === 'archangel') {
    const profile = d === 2 || d === 6;
    if (profile) {
      const side = p.wingRootL.depth > p.wingRootR.depth ? 'L' : 'R', sign = d === 2 ? 1 : -1;
      archangelWing(c,p[`wingRoot${side}`],p[`wingMid${side}`],p[`wingTip${side}`],sign,pal);
    } else for (const side of ['L','R']) {
      const sign = p[`wingRoot${side}`].x <= p.chest.x ? -1 : 1;
      archangelWing(c,p[`wingRoot${side}`],p[`wingMid${side}`],p[`wingTip${side}`],sign,pal);
    }
    for (const side of ['L', 'R']) {
      link(`shoulder${side}`, `elbow${side}`, 6, pal.outline); link(`shoulder${side}`, `elbow${side}`, 4, pal.body);
      link(`elbow${side}`, `hand${side}`, 4, pal.shade); pixel(c,p[`hand${side}`],-2,-1,4,2,pal.light);
      link(`hip${side}`, `knee${side}`, 6, pal.outline); link(`hip${side}`, `knee${side}`, 4, pal.body);
      link(`knee${side}`, `foot${side}`, 4, pal.shade);
    }
    bodyMass(c, p.pelvis, 8, 8, pal); pixel(c,p.pelvis,-5,2,10,8,pal.shade); pixel(c,p.pelvis,-3,2,6,9,pal.light);
    bodyMass(c, p.chest, 9, 10, pal); blob(c,{x:p.chest.x,y:p.chest.y-1},7,7,pal.face);
    pixel(c,p.chest,-8,-3,6,5,pal.accent);pixel(c,p.chest,3,-3,6,5,pal.accent);
    link('chest', 'neck', 7, pal.outline); link('chest', 'neck', 5, pal.body); bodyMass(c, p.head, 6, 7, pal); headEye('eyeL'); headEye('eyeR');
    if(profile){blob(c,p.halo,3,6,pal.outline);blob(c,p.halo,2,4,pal.accent);}else{blob(c, p.halo, 10, 2, pal.outline); blob(c,p.halo,8,1,pal.accent);blob(c, p.halo, 5, 1, pal.light);}
    link('handR', 'swordTip', 4, pal.outline); link('handR','swordTip',2,pal.accent);
  } else if (kind === 'cave_monster') {
    for (let i = 0; i < 3; i++) for (const side of ['L', 'R']) { const id = `leg${i}${side}`; link('chest', id, 5, pal.outline); link('chest', id, 3, pal.body); link(id, `${id}Tip`, 3, pal.light); pixel(c, p[`${id}Tip`], -1, 0, 3, 1, pal.accent); }
    link('pelvis', 'tailTip', 9, pal.outline); link('pelvis', 'tailTip', 6, pal.body); bodyMass(c, p.chest, 12, 9, pal); bodyMass(c, p.head, 9, 7, pal);
    link('head', 'jaw', 5, pal.shade); headEye('eyeL'); headEye('eyeR'); pixel(c, p.head, -7, -2, 3, 2, pal.light); pixel(c, p.head, 4, 0, 3, 2, pal.accent);
  } else if (kind === 'tree_ent') {
    // Give the elder a walking trunk, forked shoulders and root-feet first;
    // keep the canopy compact enough that these masses remain visible.
    link('root', 'rootL', 13, pal.outline); link('root', 'rootR', 13, pal.outline); link('root', 'rootL', 8, pal.body); link('root', 'rootR', 8, pal.body);
    link('root', 'trunk', 19, pal.outline); link('root', 'trunk', 15, pal.body); link('trunk', 'chest', 22, pal.outline); link('trunk', 'chest', 18, pal.shade); link('trunk', 'chest', 14, pal.body); link('chest', 'head', 15, pal.body);
    blob(c,p.trunk,7,6,pal.body);blob(c,p.chest,9,6,pal.shade);pixel(c, p.trunk, -5, -7, 4, 13, pal.light); pixel(c, p.trunk, 3, -5, 3, 10, pal.shade); pixel(c, p.chest, 3, -5, 3, 9, pal.shade);
    for (const side of ['L', 'R']) {
      link('chest', `branch${side}`, 11, pal.outline); link('chest', `branch${side}`, 7, pal.body);
      link(`branch${side}`, `branchTip${side}`, 7, pal.outline); link(`branch${side}`, `branchTip${side}`, 4, pal.body);
      // Leaf clusters stop at the branch joints, leaving a clear forked-arm
      // silhouette instead of a canopy-wide umbrella hiding the limbs.
      blob(c, p[`branch${side}`], 6, 4, pal.leafShade); blob(c, p[`branch${side}`], 4, 3, pal.accent);
      blob(c, p[`branchTip${side}`], 5, 4, pal.outline); blob(c, p[`branchTip${side}`], 4, 3, pal.leafShade);
      pixel(c, p[`branchTip${side}`], -2, -2, 4, 2, pal.leafLight);
    }
    // A raised, asymmetric forked crown reads as branches instead of a flat
    // circular hat. The compact lobes frame a visible bark face underneath.
    const crown = {x:p.leafCrown.x,y:p.leafCrown.y-6};
    link('head','leafCrown',8,pal.outline);link('head','leafCrown',5,pal.body);pixel(c,p.head,-2,-6,4,7,pal.shade);
    const canopy = [[-13,4],[-17,0],[-13,-5],[-9,-5],[-8,-12],[-4,-9],[0,-19],[4,-11],[8,-15],[12,-9],[15,-7],[17,-2],[14,3],[8,6],[3,4],[0,8],[-5,6],[-10,8]].map(([x,y])=>({x:crown.x+x,y:crown.y+y}));
    pixelPolygon(c, canopy, pal.outline);
    pixelPolygon(c, canopy.map(q=>({x:Math.round(crown.x+(q.x-crown.x)*.78),y:Math.round(crown.y+(q.y-crown.y)*.78)})), pal.leafShade);
    pixelPolygon(c,[[-12,0],[-10,-5],[-7,-6],[-3,-3],[-5,3],[-10,4]].map(([x,y])=>({x:crown.x+x,y:crown.y+y})),pal.accent);
    pixelPolygon(c,[[2,-2],[5,-8],[9,-8],[13,-4],[10,2],[5,3]].map(([x,y])=>({x:crown.x+x,y:crown.y+y})),pal.accent);
    pixel(c, crown, -8, -10, 5, 2, pal.leafLight); pixel(c, crown, 5, -9, 5, 2, pal.leafLight);
    // Bark face sits in the crown's lower opening; it is not painted across
    // the foliage. A short branch nose/brow replaces eye-stamps on a ball.
    blob(c,p.head,7,5,pal.outline);blob(c,p.head,5,3,pal.body);pixel(c,p.head,-4,-1,8,1,pal.light);
    headEye('eyeL'); headEye('eyeR');
  } else if (kind === 'spore') {
    // The linked model is one violet spore-ball with irregular quills. A
    // single filled silhouette keeps the spikes rooted in its body instead
    // of reading as eight outlined UI rays.
    const center = p.core;
    const radii = [22,11,19,11,24,11,19,11,22,11,20,11,24,11,19,11];
    const outline = radii.map((radius,i)=>{const a=-Math.PI/2+i*Math.PI/8;return{x:Math.round(center.x+Math.cos(a)*radius),y:Math.round(center.y+Math.sin(a)*radius*.96)}});
    pixelPolygon(c, outline, pal.outline);
    pixelPolygon(c, outline.map(q=>({x:Math.round(center.x+(q.x-center.x)*.84),y:Math.round(center.y+(q.y-center.y)*.84)})), pal.shade);
    // Read as a fungal fruiting body rather than another floating eye: a
    // pale central pore, broad cap lobes and a few spore flecks replace the
    // eye and facial highlights while keeping the established star rim.
    blob(c, center, 12, 9, pal.outline); blob(c, center, 10, 7, pal.body);
    // Asymmetric cap/gill marks and dispersed pores avoid a centered pupil
    // shape, which made the original spore read like another eye creature.
    blob(c, {x:center.x-3,y:center.y-4}, 6, 3, pal.sporeMid);
    pixel(c, center, -6, -3, 4, 1, pal.sporeGlow); pixel(c, center, -4, -1, 4, 1, pal.light);
    pixel(c, center, 2, 3, 4, 1, pal.shade);
    for (const [x,y] of [[-9,1],[7,-5],[9,1],[-5,6],[1,7],[5,-2]]) pixel(c, center, x, y, 1, 1, pal.sporeGlow);
  }
  return p;
}

function validate(model) {
  if (!model || model.version !== 1 || !model.type || !model.joints || !model.clips || !model.palette) return false;
  for (const j of Object.values(model.joints)) if (!j || !Array.isArray(j.position) || j.position.length !== 3 || !j.position.every(Number.isFinite)) return false;
  for (const clip of Object.values(model.clips)) {
    if (!Number.isFinite(clip.fps) || !Number.isFinite(clip.length) || clip.length < 2 || !Array.isArray(clip.keys)) return false;
    for (const key of clip.keys) for (const value of Object.values(key.joints || {})) if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) return false;
  }
  return true;
}

const subject = kind => ({
  name: labels[kind], data: MODELS[kind], defaults: () => clone(MODELS[kind]), replace: model => { if (!validate(model) || model.type !== kind) throw new Error(`Invalid ${kind} rig`); MODELS[kind] = clone(model); return MODELS[kind]; }, draw: (c, actor, time, model = MODELS[kind], pose = null) => drawEldritch(c, actor, time, model, pose), sprite: kind,
  selected: ({ arcane_eye: 'eye', great_owl: 'wingTipL', butterfly_dragon: 'wingTipL', evil_hand: 'finger2Tip', eye_tentacle: 'eye', jade_tentacle: 'tip', flying_raptor: 'wingTipL', archangel: 'halo', watcher: 'eye', cave_monster: 'head', tree_ent: 'leafCrown', spore: 'cap' })[kind],
  palette: Object.keys(MODELS[kind].palette), shapeKeys: Object.keys(MODELS[kind].shape), tracks: Object.keys(MODELS[kind].joints).filter(n => /^(eye|wing|stalk|segment|branch|tip|tail|foot)/.test(n)).slice(0, 6), clip: kind === 'tree_ent' ? 'walk' : kind === 'spore' ? 'burst' : kind === 'great_owl' || kind === 'flying_raptor' || kind === 'butterfly_dragon' || kind === 'archangel' ? 'fly' : 'idle', scale: kind === 'butterfly_dragon' ? 4 : kind === 'spore' ? 7 : 5,
});

const defaults = {
  arcane_eye: { name: labels.arcane_eye, baseKind: 'ghost', aiKind: 'arcane_eye', rigType: 'arcane_eye', faction: 'enemy', startArea: 'any', behaviors: { float: true, ranged: true, gaze: true, melee: false, jump: false }, stats: { hp: 170, speed: 43, damage: 17, detection: 480, attackRange: 300, rayCooldown: 3.2, rayWindup: .7, recovery: .75 } },
  great_owl: { name: labels.great_owl, baseKind: 'raven', aiKind: 'great_owl', rigType: 'great_owl', faction: 'enemy', startArea: 'forest', behaviors: { fly: true, swoop: true }, stats: { hp: 95, speed: 75, damage: 14, detection: 390, attackRange: 60, diveCooldown: 2.8, recovery: .8 } },
  butterfly_dragon: { name: labels.butterfly_dragon, baseKind: 'dragon', aiKind: 'butterfly_dragon', rigType: 'butterfly_dragon', faction: 'enemy', startArea: 'forest', behaviors: { fly: true, breath: true, orbit: true }, stats: { hp: 145, speed: 62, damage: 15, detection: 470, attackRange: 230, breathCooldown: 3.8, breathDamage: 13, recovery: 1 } },
  evil_hand: { name: labels.evil_hand, baseKind: 'skeleton', aiKind: 'evil_hand', rigType: 'evil_hand', faction: 'enemy', startArea: 'caverns', behaviors: { crawl: true, pounce: true, grab: true }, stats: { hp: 58, speed: 78, damage: 11, detection: 330, attackRange: 48, pounceCooldown: 2.4, recovery: .6 } },
  eye_tentacle: { name: labels.eye_tentacle, baseKind: 'beholder', aiKind: 'eye_tentacle', rigType: 'eye_tentacle', faction: 'enemy', startArea: 'caverns', behaviors: { rooted: true, ranged: true, lash: true }, stats: { hp: 115, speed: 0, damage: 14, detection: 300, attackRange: 210, lashCooldown: 2.7, recovery: .9 } },
  jade_tentacle: { name: labels.jade_tentacle, baseKind: 'beholder', aiKind: 'jade_tentacle', rigType: 'jade_tentacle', faction: 'enemy', startArea: 'any', behaviors: { linkedHealth: true, orbitHost: true, lash: true }, stats: { hp: 130, speed: 54, damage: 12, attackRange: 72, lashCooldown: 2.2, recovery: .5 } },
  flying_raptor: { name: labels.flying_raptor, baseKind: 'raven', aiKind: 'flying_raptor', rigType: 'flying_raptor', faction: 'enemy', startArea: 'any', behaviors: { fly: true, stalk: true, dive: true }, stats: { hp: 110, speed: 84, damage: 16, detection: 500, attackRange: 52, diveCooldown: 2.1, recovery: .7 } },
  archangel: { name: labels.archangel, baseKind: 'succubus', aiKind: 'archangel', rigType: 'archangel', faction: 'enemy', startArea: 'any', behaviors: { fly: true, radiantStrike: true, guard: true }, stats: { hp: 230, speed: 52, damage: 21, detection: 560, attackRange: 82, strikeCooldown: 2.7, recovery: 1 } },
  watcher: { name: labels.watcher, baseKind: 'beholder', aiKind: 'watcher', rigType: 'watcher', faction: 'enemy', startArea: 'caverns', behaviors: { float: true, gaze: true, linkedJade: true }, stats: { hp: 125, speed: 48, damage: 13, detection: 440, attackRange: 240, gazeCooldown: 3, gazeWindup: .9, recovery: .7 } },
  cave_monster: { name: labels.cave_monster, baseKind: 'beetle', aiKind: 'cave_monster', rigType: 'cave_monster', faction: 'enemy', startArea: 'caverns', behaviors: { crawl: true, pounce: true, armored: true }, stats: { hp: 155, speed: 59, damage: 19, detection: 390, attackRange: 66, pounceCooldown: 2.6, recovery: 1 } },
  tree_ent: { name: labels.tree_ent, baseKind: 'golem', aiKind: 'tree_ent', rigType: 'tree_ent', faction: 'enemy', startArea: 'forest', behaviors: { lumbering: true, branchSlam: true }, stats: { hp: 280, speed: 31, damage: 25, detection: 470, attackRange: 85, slamCooldown: 3.6, recovery: 1.2 } },
  spore: { name: labels.spore, baseKind: 'poison_pod', aiKind: 'spore', rigType: 'spore', faction: 'enemy', startArea: 'swamp', behaviors: { rooted: true, sporeBurst: true, poisonCloud: true }, stats: { hp: 80, speed: 0, damage: 8, detection: 280, attackRange: 190, burstCooldown: 3.3, recovery: 1.1 } },
};

export const CREATURE_PACK = {
  subjects: Object.fromEntries(Object.keys(MODELS).map(kind => [kind, subject(kind)])),
  defaults,
  events: [
    { name: 'Corrupted Eye', audioCue: 'An eye in the violet dark', kind: 'arcane_eye', count: 1, hp: 170, speed: 43, damage: 17, weight: 7, devOnly: true, environment: 'caverns', verse: 'A lone eye drifts through the violet dark.\nIts bright pupil turns toward the light.', tip: 'Break line of sight during its ray windup.' },
    { name: 'The silent glide', kind: 'great_owl', count: 1, hp: 95, speed: 75, damage: 14, weight: 7, devOnly: true, environment: 'forest', verse: 'Wide wings pass over the canopy.\nA quiet shadow marks its dive.', tip: 'Dodge the marked diving strike.' },
    { name: 'Blinky among the blossoms', kind: 'butterfly_dragon', count: 1, hp: 145, speed: 62, damage: 15, weight: 5, devOnly: true, environment: 'forest', verse: 'Colorful wings flicker between trees.\nA tiny dragon circles the clearing.', tip: 'Circle away from the short, warned breath.' },
    { name: 'The hand beneath the stone', kind: 'evil_hand', count: 3, hp: 58, speed: 78, damage: 11, weight: 8, devOnly: true, environment: 'caverns', verse: 'Scraping fingers wake in the dark.\nThree pale hands crawl from the cracks.', tip: 'They leap only after drawing back.' },
    { name: 'The watching stalk', kind: 'eye_tentacle', count: 2, hp: 115, speed: 0, damage: 14, weight: 7, devOnly: true, environment: 'caverns', verse: 'The stone floor opens one unblinking eye.\nA rooted stalk coils to strike.', tip: 'Move out of the lash line while it draws back.' },
    { name: 'The Jade Watcher’s Court', kind: 'watcher', count: 1, hp: 125, speed: 48, damage: 13, weight: 3, devOnly: true, environment: 'caverns', enemies: [{ kind: 'watcher', count: 1, hp: 125, speed: 48, damage: 13 }, { kind: 'jade_tentacle', count: 3, hp: 125, speed: 54, damage: 12 }], linkedJadeGroup: true, verse: 'Three jade stalks rise around a single eye.\nThe Watcher wakes beneath the stone.', tip: 'They share a life with the Watcher; defeating the eye brings all three down.' },
    { name: 'Feathers above the ridge', kind: 'flying_raptor', count: 2, hp: 110, speed: 84, damage: 16, weight: 6, devOnly: true, verse: 'A sharp shadow banks overhead.\nTwin wings circle the ridge.', tip: 'The raptor circles once before its diving pass.' },
    { name: 'The fallen aureole', kind: 'archangel', count: 1, hp: 230, speed: 52, damage: 21, weight: 3, devOnly: true, environment: 'temple', verse: 'A pale halo dims as the wings open.\nSomething bright has fallen from above.', tip: 'Interrupt the slow radiant strike.' },
    { name: 'A smaller watcher', kind: 'watcher', count: 2, hp: 125, speed: 48, damage: 13, weight: 6, devOnly: true, environment: 'caverns', verse: 'Two sentry eyes drift through the dark.\nTheir violet light scans the cave.', tip: 'Their gaze needs a clear line and a full warning.' },
    { name: 'Cave shell-breakers', kind: 'cave_monster', count: 2, hp: 155, speed: 59, damage: 19, weight: 6, devOnly: true, environment: 'caverns', verse: 'Rock plates grind against the floor.\nThe hulking pair turn toward your steps.', tip: 'The heavy pounce has a longer recovery.' },
    { name: 'The old tree wakes', kind: 'tree_ent', count: 1, hp: 280, speed: 31, damage: 25, weight: 4, devOnly: true, environment: 'forest', verse: 'Roots pull free of the soil.\nAn elder stands beneath the canopy.', tip: 'Stay clear of its wide branch slam.' },
    { name: 'Brilliant spores at dusk', kind: 'spore', count: 4, hp: 80, speed: 0, damage: 8, weight: 7, devOnly: true, environment: 'swamp', verse: 'Soft lights gather over the marsh.\nA drifting bloom shakes out its dust.', tip: 'Move before the powder cloud bursts.' },
  ],
  onSpawn(game, event, groupActors) {
    if (!event.linkedJadeGroup) return;
    const members = groupActors || [];
    const host = members.find(actor => actor.kind === 'watcher');
    if (!host) return;
    const linkId = `jade-watch-${host.id}`;
    host.jadeLinkId = linkId;
    host.jadeHost = true;
    const children = members.filter(actor => actor.kind === 'jade_tentacle');
    for (const child of children) {
      child.jadeLinkId = linkId;
      child.jadeHostId = host.id;
      child.maxHp = host.maxHp;
      child.hp = host.hp;
      child.orbit = children.indexOf(child);
      const angle = child.orbit * Math.PI * 2 / Math.max(1, children.length);
      child.x = host.x + Math.cos(angle) * 46;
      child.y = host.y + Math.sin(angle) * 38;
    }
  },
  tickActor(game, actor, dt, livingTargets = []) {
    if (!Object.hasOwn(defaults, actor.kind)) return false;
    if (actor.jadeLinkId) syncJadeGroup(game, actor);
    if (actor.hp <= 0 || actor.frozen > 0 || actor.stun > 0) return true;
    const target = livingTargets.filter(p => p.hp > 0 && !p.room).sort((a, b) => Math.hypot(a.x - actor.x, a.y - actor.y) - Math.hypot(b.x - actor.x, b.y - actor.y))[0];
    if (!target) return true;
    act(game, actor, target, dt);
    return true;
  },
};

function syncJadeGroup(game, actor) {
  const members = (game.enemies || []).filter(other => other.jadeLinkId === actor.jadeLinkId);
  const host = members.find(other => other.jadeHost || other.kind === 'watcher');
  if (!host) { actor.hp = 0; actor.state = 'dead'; return; }
  const sharedHp = Math.min(...members.map(other => Math.max(0, Number(other.hp) || 0)));
  for (const member of members) { member.hp = sharedHp; member.maxHp = host.maxHp || member.maxHp; if (sharedHp <= 0) member.state = 'dead'; }
}

function act(game, actor, target, dt) {
  const dx = target.x - actor.x, dy = target.y - actor.y, d = Math.hypot(dx, dy) || 1;
  actor.faceX = dx / d; actor.faceY = dy / d; actor.cooldown = Math.max(0, (actor.cooldown || 0) - dt);
  const windupBeforeStep = actor.eldritchWindup || 0;
  actor.eldritchWindup = Math.max(0, windupBeforeStep - dt); actor.eldritchRecovery = Math.max(0, (actor.eldritchRecovery || 0) - dt);
  actor.eldritchStrike = Math.max(0, (actor.eldritchStrike || 0) - dt);
  if (actor.eldritchStrike > 0) { actor.moving = false; actor.state = 'attack'; if (actor.kind === 'evil_hand') actor.animationAction = 'grab'; return; }
  if (actor.eldritchRecovery > 0) { actor.moving = false; actor.state = 'recover'; if (actor.kind === 'evil_hand') actor.animationAction = 'recover'; return; }
  if (windupBeforeStep > 0) {
    actor.state = 'windup'; actor.moving = false;
    if (actor.kind === 'evil_hand') actor.animationAction = 'windup';
    if (windupBeforeStep <= dt) {
      const stats = actor.stats || {}, range = stats.attackRange || 70, inRange = Math.hypot(target.x - actor.x, target.y - actor.y) <= range + 20;
      if (inRange && typeof game.hurt === 'function') game.hurt(target, actor.damage || stats.damage || 10, actor);
      if (actor.kind === 'arcane_eye' || actor.kind === 'watcher') { if (inRange && actor.kind === 'watcher') target.rooted = Math.max(target.rooted || 0, .7); }
      if (actor.kind === 'spore' && inRange) target.poisoned = Math.max(target.poisoned || 0, 2.2);
      if (actor.kind === 'butterfly_dragon' && inRange) target.burning = Math.max(target.burning || 0, 1.5);
      if (actor.kind === 'archangel' && inRange) actor.guard = Math.max(actor.guard || 0, .9);
      actor.state = actor.kind === 'evil_hand' ? 'attack' : 'recover';
      actor.eldritchRecovery = stats.recovery || .75;
      if (actor.kind === 'evil_hand') { actor.animationAction = 'grab'; actor.eldritchStrike = .26; }
    }
    return;
  }
  const speed = actor.speed || actor.stats?.speed || 40, range = actor.stats?.attackRange || 65;
  const rooted = ['eye_tentacle', 'spore'].includes(actor.kind);
  let engage = d <= range;
  if (actor.kind === 'arcane_eye' || actor.kind === 'watcher' || actor.kind === 'butterfly_dragon' || actor.kind === 'great_owl' || actor.kind === 'flying_raptor' || actor.kind === 'archangel') engage = d < range * 1.2;
  if (!rooted && !engage) { game.moveActor?.(actor, dx / d * speed * dt, dy / d * speed * dt, ['great_owl', 'butterfly_dragon', 'flying_raptor', 'archangel', 'arcane_eye', 'watcher'].includes(actor.kind)); actor.moving = true; actor.state = actor.kind === 'tree_ent' ? 'walk' : 'hunt'; if (actor.kind === 'evil_hand') actor.animationAction = 'crawl'; return; }
  if (!engage) { actor.moving = false; actor.state = 'idle'; if (actor.kind === 'evil_hand') actor.animationAction = 'idle'; return; }
  actor.moving = false;
  if (actor.kind === 'evil_hand') actor.animationAction = 'idle';
  if (actor.cooldown <= 0) {
    const windup = ({ arcane_eye: .72, great_owl: .58, butterfly_dragon: .84, evil_hand: .48, eye_tentacle: .64, jade_tentacle: .53, flying_raptor: .45, archangel: .76, watcher: .92, cave_monster: .58, tree_ent: .88, spore: .82 })[actor.kind] || .65;
    actor.eldritchWindup = windup; actor.attack = windup; actor.cooldown = (actor.stats?.strikeCooldown || actor.stats?.diveCooldown || actor.stats?.rayCooldown || actor.stats?.gazeCooldown || actor.stats?.breathCooldown || actor.stats?.slamCooldown || actor.stats?.pounceCooldown || actor.stats?.lashCooldown || actor.stats?.burstCooldown || 2.5) + windup;
    actor.state = 'windup'; actor.animationAction = ({ arcane_eye: 'ray', great_owl: 'swoop', butterfly_dragon: 'breath', evil_hand: 'windup', eye_tentacle: 'lash', jade_tentacle: 'lash', flying_raptor: 'dive', archangel: 'strike', watcher: 'gaze', cave_monster: 'pounce', tree_ent: 'slam', spore: 'burst' })[actor.kind];
  }
}

export function validateEldritchRig(model) { return validate(model); }
export function defaultEldritchRig(kind) { if (!MODELS[kind]) throw new Error(`Unknown eldritch creature: ${kind}`); return clone(MODELS[kind]); }
export function renderEldritchPreview(c, kind, actor, time, model = MODELS[kind]) { return drawEldritch(c, actor, time, model); }
