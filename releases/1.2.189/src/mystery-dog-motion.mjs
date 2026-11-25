import {poseAt} from './player-motion.mjs';
import {ikChain, solveTwoBone} from './ik.mjs';

const TAU = Math.PI * 2;
const sides = ['L', 'R'];
const joints = {
  pelvis: {parent: '', position: [0, -8, 15]},
  chest: {parent: 'pelvis', position: [0, 6, 17]},
  neck: {parent: 'chest', position: [0, 10, 22]},
  head: {parent: 'neck', position: [0, 14, 34.5]},
  muzzle: {parent: 'head', position: [0, 20, 33.5]},
  nose: {parent: 'muzzle', position: [0, 24, 35.5]},
  jaw: {parent: 'head', position: [0, 17, 30.5]},
  tag: {parent: 'neck', position: [0, 13, 18]},
  tailBase: {parent: 'pelvis', position: [0, -15, 17]},
  tailMid: {parent: 'tailBase', position: [0, -22, 20]},
  tailTip: {parent: 'tailMid', position: [0, -24, 27]},
};

for (const [side, sign] of [['L', -1], ['R', 1]]) {
  joints[`eye${side}`] = {parent: 'head', position: [sign * 2.6, 17, 37.1]};
  joints[`ear${side}`] = {parent: 'head', position: [sign * 3.1, 12.5, 37.5]};
  joints[`earTip${side}`] = {parent: `ear${side}`, position: [sign * 4.1, 11.5, 43.5]};
  joints[`shoulder${side}`] = {parent: 'chest', position: [sign * 4, 5, 15]};
  joints[`elbow${side}`] = {parent: `shoulder${side}`, position: [sign * 4, 6, 8]};
  joints[`frontPaw${side}`] = {parent: `elbow${side}`, position: [sign * 4, 8, 1]};
  joints[`hip${side}`] = {parent: 'pelvis', position: [sign * 4, -10, 14]};
  joints[`knee${side}`] = {parent: `hip${side}`, position: [sign * 4, -8, 8]};
  joints[`hock${side}`] = {parent: `knee${side}`, position: [sign * 4, -13, 4]};
  joints[`rearPaw${side}`] = {parent: `hock${side}`, position: [sign * 4, -11, 1]};
}

const rest = Object.fromEntries(Object.entries(joints).map(([name, joint]) => [name, joint.position]));
const offset = ([x, y, z], dx, dy, dz) => [x + dx, y + dy, z + dz];
const delta = (a, b) => a.map((value, i) => value - b[i]);
const length = (a, b) => Math.hypot(...delta(a, b));
const frontLengths = [length(rest.shoulderL, rest.elbowL), length(rest.elbowL, rest.frontPawL)];
const hindLengths = [length(rest.hipL, rest.kneeL), length(rest.kneeL, rest.hockL)];
const seatHockHeight = 0.57;
const seatHockReach = -Math.sqrt(length(rest.hockL, rest.rearPawL) ** 2 - seatHockHeight ** 2);

function setLegs(pose, side, front, rear, hockOffset) {
  const shoulder = pose[`shoulder${side}`];
  const forelimb = solveTwoBone(shoulder, offset(shoulder, 0, -1, 0), front, front, frontLengths);
  pose[`elbow${side}`] = forelimb.mid;
  pose[`frontPaw${side}`] = forelimb.end;

  const hip = pose[`hip${side}`];
  const hock = offset(rear, 0, hockOffset[0], hockOffset[1]);
  const hindlimb = solveTwoBone(hip, offset(hip, 0, 1, 0), hock, hock, hindLengths);
  pose[`knee${side}`] = hindlimb.mid;
  pose[`hock${side}`] = hindlimb.end;
  pose[`rearPaw${side}`] = offset(hindlimb.end, 0, -hockOffset[0], -hockOffset[1]);
}

const faceParts = ['head', 'muzzle', 'nose', 'jaw', 'eyeL', 'eyeR', 'earL', 'earR', 'earTipL', 'earTipR'];
function setHead(pose, pitch) {
  const [x, y, z] = pose.neck;
  const cosine = Math.cos(pitch);
  const sine = Math.sin(pitch);
  for (const part of faceParts) {
    const [side, forward, up] = delta(rest[part], rest.neck);
    pose[part] = [x + side, y + forward * cosine - up * sine, z + forward * sine + up * cosine];
  }
}

function setTail(pose, swing, tipSwing) {
  let parent = 'tailBase';
  for (const [part, angle] of [['tailMid', swing], ['tailTip', tipSwing]]) {
    const [, forward, up] = delta(rest[part], rest[parent]);
    pose[part] = offset(pose[parent], -forward * Math.sin(angle), forward * Math.cos(angle), up);
    parent = part;
  }
}

// Phase offsets are front left/right, then rear left/right.
const gaits = {
  walk: {cycle: 0.95, stance: 0.73, reach: 2.6, lift: 2.7, phases: [0, 0.5, 0.24, 0.74]},
  trot: {cycle: 0.62, stance: 0.59, reach: 3.05, lift: 3.4, phases: [0, 0.5, 0.5, 0]},
  run: {cycle: 0.55, stance: 0.32, reach: 4.8, lift: 4.9, phases: [0, 0.09, 0.50, 0.60]},
};

function step(phase, stance, reach, lift) {
  const progress = phase % 1;
  if (progress < stance) return [reach * (1 - 2 * progress / stance), 0];
  const swing = (progress - stance) / (1 - stance);
  return [-reach * Math.cos(Math.PI * swing), lift * Math.sin(Math.PI * swing) ** 2];
}

function stridePose(phase, action) {
  const {stance, reach, lift, phases} = gaits[action];
  const angle = phase * TAU;
  const run = action === 'run';
  const bounce = run ? Math.sin(angle - 0.75) * 1.2 : Math.sin(angle * 2) * 0.28;
  const pitch = run ? Math.cos(angle) * 1.1 : Math.cos(angle * 2) * 0.25;
  const level = bounce - (run ? 1.75 : 0.7);
  const pose = {...rest};
  pose.pelvis = offset(rest.pelvis, 0, 0, level - pitch);
  pose.chest = offset(rest.chest, 0, 0.45, level + pitch);
  pose.neck = offset(rest.neck, 0, 0.6, level + pitch * 0.65);
  pose.tag = offset(rest.tag, 0, 0.6, level + pitch * 0.65);
  pose.tailBase = offset(rest.tailBase, 0, 0, level - pitch);
  setHead(pose, run ? -0.12 + pitch * 0.08 : -0.04 + pitch * 0.05);
  setTail(pose, Math.sin(angle) * 0.13, Math.sin(angle - 0.5) * 0.23);

  for (const [index, side] of sides.entries()) {
    pose[`shoulder${side}`] = offset(rest[`shoulder${side}`], 0, 0.45, level + pitch);
    pose[`hip${side}`] = offset(rest[`hip${side}`], 0, 0, level - pitch);
    const [frontY, frontZ] = step(phase + phases[index], stance, reach, lift);
    const [rearY, rearZ] = step(phase + phases[index + 2], stance, reach, lift * 0.9);
    const front = offset(rest[`frontPaw${side}`], 0, frontY - 1, frontZ);
    const rear = offset(rest[`rearPaw${side}`], 0, rearY, rearZ);
    setLegs(pose, side, front, rear, [-2, 3]);
  }
  return pose;
}

function restingPose(phase, action) {
  const sit = action === 'sit';
  const wag = action === 'wag';
  const angle = phase * TAU;
  const breath = Math.sin(angle) * 0.33;
  const pose = {...rest};
  pose.pelvis = offset(rest.pelvis, 0, sit ? -1 : 0, sit ? -8.5 : breath * 0.25);
  pose.chest = offset(rest.chest, 0, sit ? -1.5 : 0, breath - (sit ? 2 : 0));
  pose.neck = offset(rest.neck, 0, sit ? -1.75 : 0, breath - (sit ? 1.1 : 0));
  pose.tag = offset(rest.tag, 0, sit ? -1.75 : 0, breath - (sit ? 1.1 : 0));
  pose.tailBase = offset(rest.tailBase, 0, sit ? -0.4 : 0, sit ? -7 : breath * 0.25);
  setHead(pose, (sit ? 0.13 : 0.015) + Math.sin(angle - 0.6) * 0.035);
  setTail(pose, Math.sin(angle) * (wag ? 0.55 : 0.12), Math.sin(angle - 0.55) * (wag ? 0.72 : 0.2));

  if (sit) {
    for (const side of sides) {
      pose[`shoulder${side}`] = offset(rest[`shoulder${side}`], 0, -1.5, breath - 2);
      pose[`hip${side}`] = offset(rest[`hip${side}`], 0, -1, -8.5);
      const front = offset(rest[`frontPaw${side}`], 0, -0.5, 0);
      const rear = offset(rest[`rearPaw${side}`], 0, 2, 0);
      setLegs(pose, side, front, rear, [seatHockReach, seatHockHeight]);
    }
  }
  return pose;
}

// Store original motion as the same per-joint delta keys the native timeline
// reads. A looping clip omits the repeated terminal sample.
function makeClip(cycle, length, sample) {
  return {
    length,
    fps: length / cycle,
    loop: true,
    keys: Array.from({length}, (_, frame) => ({
      frame,
      joints: Object.fromEntries(Object.entries(sample(frame / length)).map(([name, point]) => [name, delta(point, rest[name])])),
    })),
  };
}

export const MYSTERY_DOG_RIG = {
  version: 1,
  type: 'mystery_dog',
  name: 'Mystery Dog',
  joints,
  palette: {},
  ik: Object.fromEntries(['frontPawL', 'frontPawR', 'hockL', 'hockR'].map(end => [end, ikChain({joints}, end)])),
  clips: {
    idle: makeClip(3.1, 16, phase => restingPose(phase, 'idle')),
    sit: makeClip(3.1, 16, phase => restingPose(phase, 'sit')),
    wag: makeClip(0.74, 16, phase => restingPose(phase, 'wag')),
    walk: makeClip(gaits.walk.cycle, 28, phase => stridePose(phase, 'walk')),
    trot: makeClip(gaits.trot.cycle, 18, phase => stridePose(phase, 'trot')),
    run: makeClip(gaits.run.cycle, 16, phase => stridePose(phase, 'run')),
  },
};

export function sampleMysteryDogPose(actor, time = 0) {
  const {clips} = MYSTERY_DOG_RIG;
  const requested = actor.animationAction || actor.state;
  const action = Object.hasOwn(clips, requested) ? requested
    : !actor.moving ? 'idle' : actor.walking ? 'walk' : 'trot';
  const clip = clips[action];
  if (Number.isFinite(actor.playerFrame)) return poseAt(MYSTERY_DOG_RIG, action, actor.playerFrame);
  const frame = Number.isFinite(actor.poseTime) ? actor.poseTime * (clip.length - 1) : time * clip.fps;
  return poseAt(MYSTERY_DOG_RIG, action, frame);
}
