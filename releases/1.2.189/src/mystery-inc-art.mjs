import {facingIndex, projectPoint} from './actor-projection.mjs';
import {sampleMysteryDogPose} from './mystery-dog-motion.mjs';

const ink = '#2e201d';
const coat = '#b27831';
const light = '#cb9142';
const shade = '#8d5429';
const farCoat = '#774723';
const patch = '#3e2c23';
const innerEar = '#dfab88';
const ivory = '#fff3da';
const nose = '#332627';
const teal = '#23aaa3';
const gold = '#f0cb64';

const paths = new Map();
function drawPath(c, outline, fill, border = ink, width = 1.2) {
  let path = paths.get(outline);
  if (!path) {
    path = new Path2D(outline);
    paths.set(outline, path);
  }
  if (fill) {
    c.fillStyle = fill;
    c.fill(path);
  }
  if (border) {
    c.strokeStyle = border;
    c.lineWidth = width;
    c.stroke(path);
  }
}

function oval(c, x, y, rx, ry, fill) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}

const nearEar = 'M-7 -4 Q-11 -8 -9 -14 Q-8 -18 -6 -17 L-5 -13 Q-1 -12 -1 -9 L-3 -5 Z';
const farEar = 'M0 -8 Q2 -12 0 -15 Q0 -17 4 -17 L7 -20 Q9 -19 8 -16 L5 -12 7 -8 Z';
const nearEarPink = 'M-7 -14 Q-7 -12 -4 -11 Q-2 -9 -5 -6 Q-8 -7 -8 -11 Z';
const farEarPink = 'M2 -15 Q5 -16 6 -15 L5 -12 3 -11 Z';

const headArt = [
  {
    skull: 'M-8 -4 Q-7 -9 0 -9 Q7 -9 8 -4 L8 5 Q7 11 0 12 Q-7 11 -8 5 Z',
    muzzle: 'M-8 2 Q-5 -1 0 0 Q5 -1 8 2 Q11 4 8 7 Q6 10 1 8 Q-4 10 -8 7 Q-11 5 -8 2 Z',
    grin: 'M-7 6 Q-4 9 0 7 Q4 9 7 6',
    nose: 'M-5 1 Q0 -1 5 1 Q6 2 3 5 Q0 7 -3 5 Q-6 3 -5 1 Z',
    eyes: [[-3.8,-3.8,2.65,3.55, .7],[3.8,-3.8,2.65,3.55, -.7]],
    cheek: 'M-6 8 Q-1 12 5 9 Q2 12 -1 12 Q-5 11 -6 8 Z',
    brows: 'M-6 -8 Q-4 -10 -2 -8 M2 -8 Q4 -10 6 -8',
  },
  {
    skull: 'M-7 4 Q-10 -1 -7 -6 Q-5 -10 2 -9 Q7 -8 7 -3 L9 4 Q9 9 4 12 Q-2 13 -5 8 Z',
    muzzle: 'M-1 2 Q2 -2 6 -1 Q11 -4 15 -2 Q18 0 15 5 Q11 10 6 7 Q1 10 -2 7 Q-4 4 -1 2 Z',
    grin: 'M-3 3 Q-3 6 0 7 Q3 8 6 6 Q9 8 12 6',
    nose: 'M9 -3 Q13 -5 16 -2 Q17 0 15 2 Q13 4 10 2 Q8 1 9 -3 Z',
    eyes: [[.3,-4.1,3.05,3.8,1],[5.3,-4.9,1.8,2.95,.55]],
    cheek: 'M-5 7 Q-1 12 6 9 Q4 13 -1 12 Q-4 11 -5 7 Z',
    brows: 'M-2 -8 Q1 -10 3 -8 M4 -8 Q6 -9 7 -7',
  },
  {
    skull: 'M-7 5 Q-10 1 -8 -5 Q-5 -10 1 -9 Q6 -9 7 -4 L9 5 Q8 11 2 12 Q-4 12 -7 5 Z',
    muzzle: 'M1 0 Q5 -3 9 -1 Q13 -5 17 -3 Q20 -1 17 4 Q15 9 9 8 Q4 12 0 8 Q-3 5 1 0 Z',
    grin: 'M-1 3 Q-1 7 3 7 Q5 7 7 6 Q10 9 14 6',
    nose: 'M11 -3 Q16 -5 19 -2 Q20 1 17 4 Q14 5 11 2 Q10 0 11 -3 Z',
    eyes: [[1.8,-4.05,2.85,3.75,1]],
    cheek: 'M-5 6 Q-2 12 6 10 Q2 14 -2 11 Z',
    brows: 'M-1 -8 Q1 -10 4 -8',
  },
];

function drawHead(c, point, view, mirror, blink) {
  c.save();
  c.translate(point.x, point.y);
  c.scale(mirror, 1);
  drawPath(c, farEar, shade);
  if (view < 2) drawPath(c, farEarPink, innerEar, null);

  if (view >= 3) {
    drawPath(c, 'M-8 4 Q-10 0 -8 -5 Q-5 -10 2 -9 Q8 -8 8 -2 L7 5 Q5 10 0 10 Q-5 9 -8 4 Z', coat);
    drawPath(c, 'M-7 -4 Q-4 -8 2 -7 Q4 -7 6 -4 Q1 -5 -3 -2 Q-6 0 -7 -4 Z', light, null);
    drawPath(c, 'M-7 3 Q-1 9 6 4 Q6 8 1 10 Q-6 9 -7 3 Z', shade, null);
  } else {
    const art = headArt[view];
    drawPath(c, art.skull, coat);
    drawPath(c, art.cheek, shade, null);
    drawPath(c, 'M-6 -5 Q-3 -9 1 -8 Q-2 -6 -4 -3 Q-6 -2 -6 -5 Z', light, null);
    for (const [x, y, rx, ry, pupil] of art.eyes) {
      if (blink) {
        c.save();
        c.translate(x, y);
        drawPath(c, 'M-2 0 Q0 1.5 2 0', null, ink, 1.1);
        c.restore();
      } else {
        oval(c, x, y, rx + .6, ry + .55, ink);
        oval(c, x, y, rx, ry, ivory);
        oval(c, x + pupil, y + .85, 1.25, 1.6, ink);
      }
    }
    drawPath(c, art.brows, null, ink, 1.15);
    drawPath(c, art.muzzle, coat);
    drawPath(c, art.grin, null, ink, 1.1);
    drawPath(c, art.nose, nose, ink, .8);
    if (view === 0) {
      oval(c, -4.7, 4.9, .48, .55, patch);
      oval(c, 4.7, 4.9, .48, .55, patch);
      drawPath(c, 'M-2 1 L1 1', null, '#685148', 1);
    } else {
      oval(c, 8, 3.3, .55, .52, patch);
      oval(c, 10.8, 4.5, .53, .48, patch);
      drawPath(c, 'M11 -2 Q13 -3 15 -2', null, '#685148', 1);
    }
  }
  drawPath(c, nearEar, coat);
  if (view <= 2) drawPath(c, nearEarPink, innerEar, null);
  c.restore();
}

function drawTail(c, start, bend, tip, endOn) {
  const sweep = Math.sign(bend.x - start.x) || -1;
  const bendX = bend.x + sweep * (endOn ? 3 : 2);
  const tipX = tip.x - sweep * (endOn ? 1 : 2);
  c.beginPath();
  c.moveTo(start.x, start.y);
  c.bezierCurveTo(start.x + sweep * 3, start.y + 2, bendX, bend.y + 4, bendX, bend.y);
  c.bezierCurveTo(bendX, bend.y - 3, tipX - sweep * 4, tip.y + 1, tipX, tip.y);
  c.strokeStyle = ink;
  c.lineWidth = 3.7;
  c.stroke();
  c.strokeStyle = coat;
  c.lineWidth = 2.1;
  c.stroke();
}

function drawLeg(c, [root, joint, hock, paw], forward, close, rear) {
  const color = close ? coat : farCoat;
  const u = rear ? 4.5 : 3.3;
  c.beginPath();
  c.moveTo(root.x - u, root.y - 2.5);
  c.quadraticCurveTo(joint.x - 2.9, joint.y - 2, joint.x - 2, joint.y + 1);
  c.lineTo(hock.x - 1.35, hock.y);
  c.quadraticCurveTo(paw.x - 1.9, paw.y - 1, paw.x - 3.3, paw.y + .5);
  c.quadraticCurveTo(paw.x - 3.9, paw.y + 3.1, paw.x, paw.y + 3);
  c.quadraticCurveTo(paw.x + 4, paw.y + 3, paw.x + 3.5 + forward, paw.y + .8);
  c.quadraticCurveTo(paw.x + 3.4 + forward, paw.y - 1.6, paw.x + 1.65, paw.y - 1.6);
  c.lineTo(hock.x + 1.5, hock.y - 1.4);
  c.quadraticCurveTo(joint.x + 3.4, joint.y, root.x + u, root.y + 1);
  c.lineTo(root.x + u - .5, root.y - 4);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.strokeStyle = ink;
  c.lineWidth = 1.2;
  c.stroke();
  if (close) {
    oval(c, paw.x + forward, paw.y + .35, 2.3, .7, light);
    c.fillStyle = shade;
    c.fillRect(Math.round(paw.x + forward + .4), Math.round(paw.y + 1), 1, 1);
  }
}

function drawTorso(c, p, view, mirror) {
  c.save();
  c.translate(p.pelvis.x, p.pelvis.y);
  c.scale(mirror, 1);
  if (view === 0 || view === 4) {
    const torso = 'M-8 -5 Q-5 -9 0 -8 Q5 -9 8 -5 L9 1 Q7 9 0 10 Q-7 9 -9 1 Z';
    drawPath(c, torso, coat);
    drawPath(c, 'M-8 1 Q-5 7 0 7 Q5 7 8 1 Q7 9 0 10 Q-7 9 -8 1 Z', shade, null);
    drawPath(c, 'M-7 -3 Q-5 -8 0 -7 Q4 -7 5 -5 Q0 -6 -3 -3 Q-6 -1 -7 -3 Z', light, null);
    if (view === 4) drawPath(c, 'M0 -8 Q5 -9 7 -6 Q5 -2 1 -2 Q-1 -4 0 -8 Z', patch, null);
  } else {
    // Deform the painted chest-to-rump contour at the projected joint anchors.
    // The same back, loin tuck and chest volume remain readable through the turn.
    const length = Math.abs(p.chest.x - p.pelvis.x);
    c.transform(length / 14, (p.chest.y - p.pelvis.y) / 14, 0, 1, 0, 0);
    drawPath(c, 'M-10 1 Q-11 -5 -5 -7 Q-1 -9 5 -7 Q12 -6 15 -9 Q20 -8 22 -3 Q24 4 18 9 Q13 12 8 7 Q6 4 2 4 Q-3 8 -7 7 Q-10 6 -10 1 Z', coat);
    drawPath(c, 'M-10 1 Q-7 5 -3 4 Q0 2 3 2 Q7 2 10 6 Q15 10 21 5 Q18 11 14 10 Q11 10 8 7 Q6 4 2 4 Q-3 8 -7 7 Q-10 6 -10 1 Z', shade, null);
    drawPath(c, 'M-8 -3 Q-3 -9 5 -7 Q10 -6 13 -7 Q11 -4 6 -4 Q-3 -6 -8 -3 Z', light, null);
    drawPath(c, mirror === 1
      ? 'M-3 -7 Q3 -9 9 -6 Q6 -4 3 -2 Q0 0 -2 -2 Q-4 -4 -3 -7 Z'
      : 'M-1 -8 Q4 -8 8 -6 Q6 -3 2 -2 Q0 -2 -1 -4 Z', patch, null);
    drawPath(c, 'M13 0 Q16 -3 17 0 Q19 4 16 5 Q12 4 13 0 Z M12 6 Q14 5 15 7 Q14 9 12 8 Z', patch, null);
  }
  c.restore();
}

function drawNeck(c, chest, head, neck, view, mirror) {
  // The neck tapers into the jaw and overlaps the rib cage at the collar.
  c.beginPath();
  c.moveTo(chest.x - 7.4, chest.y + 1);
  c.quadraticCurveTo(neck.x - 6.4, neck.y - 4, head.x - 5.8, head.y + 1);
  c.lineTo(head.x + 5.5, head.y + 3);
  c.quadraticCurveTo(neck.x + 5.5, neck.y, chest.x + 7.5, chest.y + 2.5);
  c.quadraticCurveTo(chest.x + 2, chest.y + 8, chest.x - 7.4, chest.y + 1);
  c.closePath();
  c.fillStyle = coat;
  c.fill();
  c.strokeStyle = ink;
  c.lineWidth = 1.2;
  c.stroke();

  c.save();
  c.translate(neck.x, neck.y + 3.4);
  c.scale(mirror, 1);
  if (view === 0 || view === 4) {
    drawPath(c, 'M-6.1 -2 Q0 1 6.1 -2 L6.3 1.1 Q0 4.6 -6.3 1.1 Z', teal);
    drawPath(c, 'M-4.8 -.6 Q0 1.3 4.8 -.6', null, '#61cfc0', .85);
  } else {
    drawPath(c, 'M-6.2 -3.6 Q-.5 .3 6.1 -1.5 L6.9 1.2 Q1 4.7 -6.9 -.5 Z', teal);
    drawPath(c, 'M-5.3 -2.1 Q-.5 1.2 5.8 -.1', null, '#61cfc0', .85);
  }
  if (view < 3) {
    c.translate(view === 0 ? 0 : view === 1 ? 4.4 : 5.5, 2);
    drawPath(c, 'M0 -1.1 L0 1.8', null, gold, 1.2);
    drawPath(c, 'M0 1 L2.7 3.6 0 6.4 -2.6 3.6 Z', gold, ink, .9);
    drawPath(c, 'M0 2.3 L1.45 3.6 0 4.9 -1.45 3.6 Z', '#1c7974', null);
  }
  c.restore();
}

function paintDog(c, pose, direction, blink) {
  const p = Object.fromEntries(Object.entries(pose).map(([name, point]) => [name, projectPoint(point, direction)]));
  const view = Math.min(direction, 8 - direction);
  const mirror = direction > 0 && direction < 4 ? -1 : 1;
  const endOn = view === 0 || view === 4;
  const forward = endOn ? 0 : mirror;
  c.lineJoin = 'round';
  c.lineCap = 'round';

  if (view < 3) drawTail(c, p.tailBase, p.tailMid, p.tailTip, endOn);
  const legs = [];
  for (const side of ['L', 'R']) {
    const elbow = p['elbow' + side], frontPaw = p['frontPaw' + side];
    const foreleg = [p['shoulder' + side], elbow, {
      x: (elbow.x + frontPaw.x) / 2,
      y: (elbow.y + frontPaw.y) / 2,
    }, frontPaw];
    const hindleg = ['hip', 'knee', 'hock', 'rearPaw'].map(name => p[name + side]);
    const close = endOn || side === (mirror === 1 ? 'L' : 'R');
    legs.push({points: foreleg, close, rear: false}, {points: hindleg, close, rear: true});
  }
  legs.sort((a, b) => a.points[0].depth - b.points[0].depth);
  for (const {points, close, rear} of legs) drawLeg(c, points, forward, close, rear);
  if (view < 3) drawTorso(c, p, view, mirror);
  drawNeck(c, p.chest, p.head, p.neck, view, mirror);
  if (view >= 3) drawTorso(c, p, view, mirror);
  drawHead(c, p.head, view, mirror, blink);
  if (view >= 3) drawTail(c, p.tailBase, p.tailMid, p.tailTip, endOn);
}

const tileWidth = 92;
const tileHeight = 76;
const originX = 46;
const originY = 66;
const lastFrames = new Map();

function dogFrame(actor, time, direction) {
  const tick = Math.floor(time * 20);
  const key = [tick, actor.animationAction, actor.state, actor.moving,
    actor.playerFrame, actor.poseTime, actor.step].join(':');
  const last = lastFrames.get(direction);
  if (last?.key === key) return last.canvas;

  const canvas = last?.canvas || document.createElement('canvas');
  if (!last) {
    canvas.width = tileWidth;
    canvas.height = tileHeight;
  }
  const c = canvas.getContext('2d', {willReadFrequently: true});
  c.clearRect(0, 0, tileWidth, tileHeight);
  c.save();
  c.translate(originX, originY);
  paintDog(c, sampleMysteryDogPose(actor, tick / 20), direction, tick % 91 === 70 || tick % 91 === 71);
  c.restore();

  // Snap coverage to the native pixel grid before the world or portrait scales it.
  const frame = c.getImageData(0, 0, tileWidth, tileHeight);
  for (let i = 3; i < frame.data.length; i += 4) {
    frame.data[i] = frame.data[i] >= 128 ? 255 : 0;
  }
  c.putImageData(frame, 0, 0);
  lastFrames.set(direction, {key, canvas});
  return canvas;
}

export function drawMysteryDog(c, actor, time, size) {
  const direction = facingIndex(actor.faceX, actor.faceY);
  const frame = dogFrame(actor, time, direction);
  const scale = size / 54;
  c.save();
  c.imageSmoothingEnabled = false;
  c.translate(Math.round(actor.x), Math.round(actor.y));
  c.scale(scale, scale);
  c.drawImage(frame, -originX, -originY);
  c.restore();
}
