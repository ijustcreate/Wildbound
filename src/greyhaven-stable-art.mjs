import {PLAYER_RENDER_SIZE} from './render-settings.mjs';

const ink = '#312424';
const timber = ['#352621', '#51362b', '#79523b', '#a4784c', '#c19a66'];
const slate = ['#2f3536', '#444c49', '#59615a', '#747c6a'];
const coats = {
  chestnut: {dark: '#4d2927', shade: '#734438', body: '#9d6447', light: '#ca8962', mane: '#382528', blanket: '#826344'},
  grey: {dark: '#434343', shade: '#6c7470', body: '#999d94', light: '#c7c5af', mane: '#474844', blanket: '#a65648'},
  pony: {dark: '#4e3928', shade: '#7c5a35', body: '#ab8151', light: '#cba770', mane: '#554333', blanket: '#657a67'},
};

function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function polygon(c, color, points) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(Math.round(points[0][0]), Math.round(points[0][1]));
  for (const [x, y] of points.slice(1)) c.lineTo(Math.round(x), Math.round(y));
  c.closePath();
  c.fill();
}

function limb(c, x, y, fx, fy, stride, color, front) {
  const kneeX = x + fx * stride * .56, kneeY = y - 8 + fy * stride * .38;
  const hoofX = x + fx * stride, hoofY = y + Math.min(0, stride * .4) + fy * stride * .45;
  polygon(c, ink, [[x - 2, y - 16], [x + 3, y - 15], [kneeX + 2, kneeY], [hoofX + 2, hoofY], [hoofX - 2, hoofY + 1], [kneeX - 2, kneeY], [x - 3, y - 8]]);
  polygon(c, color, [[x - 1, y - 15], [x + 2, y - 15], [kneeX + 1, kneeY], [hoofX + 1, hoofY - 2], [hoofX - 1, hoofY - 2], [kneeX - 1, kneeY], [x - 2, y - 8]]);
  if (front) rect(c, hoofX - 2, hoofY - 2, 4, 2, '#463332');
}

function drawRider(c, rider, animator, time, fx, fy, x, y, bob) {
  if (!rider || !animator) return;
  animator.draw(c, {...rider, kind: 'player', sprite: 'explorer-teal', x, y: y - 13 - bob,
    faceX: fx, faceY: fy, hp: Math.max(1, rider.hp || 1), moving: false, walking: false,
    equipment: {...rider.equipment, hand1: null, hand2: null},
    animationAction: 'broom_ride', animationProgress: undefined, poseTime: undefined, playerFrame: undefined,
    moveSpeed: 0, groundHeight: 0, jumpHeight: 0, flash: 0, attack: 0, spin: 0, charge: 0, hit: 0,
    bowAiming: false, bowAimBlend: 0, bowVisualAngle: undefined, dashTime: 0, gatherTime: 0,
  }, time, PLAYER_RENDER_SIZE * .92);
}

export function drawGreyhavenHorse(c, horse, time, kind, rider, animator) {
  const coat = coats[kind];
  const x = horse.x, y = horse.y;
  const heading = Math.hypot(horse.faceX, horse.faceY) || 1;
  const fx = horse.faceX / heading, fy = horse.faceY / heading;
  const scale = kind === 'pony' ? .81 : 1;
  const front = fy > -.25;
  const phase = horse.moving ? time * (horse.moveSpeed > 220 ? 19 : 15) : time * 2;
  const bob = horse.moving ? Math.round(Math.sin(phase * 2) * 1.4) : Math.round(Math.sin(phase) * .7);
  const stride = horse.moving ? 7 : 0;
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(scale, scale);
  c.fillStyle = '#20241c52';
  c.beginPath();
  c.ellipse(0, 1, 10 + Math.abs(fx) * 10, 4, 0, 0, Math.PI * 2);
  c.fill();
  const leg = (along, across, offset, light) => limb(c,
    fx * along - fy * across, fy * along * .46 + fx * across * .65,
    fx, fy, Math.sin(phase + offset) * stride, light ? coat.shade : coat.dark, light);
  const flank = fx < 0 ? 1 : -1;
  leg(-11, -flank * 5, 1.5, false);
  leg(10, -flank * 5, 3.2, false);
  const rearX = -fx * 13, rearY = -fy * 6 - 18 - bob;
  const frontX = fx * 12, frontY = fy * 6 - 19 - bob;
  const tailSway = Math.round(Math.sin(time * 3.5) * 3);
  polygon(c, ink, [[rearX - 2, rearY - 2], [rearX - fx * 6 - 2, rearY + 2], [rearX - fx * 8 + tailSway, rearY + 13],
    [rearX - fx * 5 + tailSway + 2, rearY + 15], [rearX - fx * 4 + 3, rearY + 5], [rearX + 3, rearY - 1]]);
  const width = 9 - Math.abs(fx) * 4;
  const left = Math.min(rearX, frontX) - width, right = Math.max(rearX, frontX) + width;
  const top = Math.min(rearY, frontY), bottom = Math.max(rearY, frontY) + 8;
  polygon(c, ink, [[left + 4, top - 4], [right - 5, top - 4], [right, top + 1], [right, bottom - 4],
    [right - 5, bottom], [left + 6, bottom], [left + 1, bottom - 4], [left - 1, top + 3]]);
  polygon(c, coat.body, [[left + 4, top - 3], [right - 5, top - 3], [right - 1, top + 1], [right - 1, bottom - 4],
    [right - 5, bottom - 1], [left + 6, bottom - 1], [left + 2, bottom - 5], [left, top + 3]]);
  polygon(c, coat.shade, [[left + 2, top + 4], [left + 13, bottom - 5], [right - 3, bottom - 7],
    [right - 1, bottom - 4], [right - 5, bottom - 1], [left + 6, bottom - 1], [left + 2, bottom - 5]]);
  rect(c, left + 5, top - 2, Math.max(5, (right - left) * .43), 2, coat.light);
  const saddleY = -22 - bob;
  if (kind !== 'pony') {
    rect(c, -7, saddleY - 1, 14, 10, ink);
    rect(c, -6, saddleY, 12, 8, coat.blanket);
    rect(c, -5, saddleY + 6, 10, 1, '#d1ae72');
    rect(c, -5, saddleY - 1, 10, 3, '#4f362d');
  }
  leg(-10, flank * 5, 4.7, true);
  leg(10, flank * 5, .15, true);
  const pollX = fx * 19, pollY = fy * 8 - 31 - bob;
  const noseX = pollX + fx * 8, noseY = pollY + 5 + fy * 3;
  const neck = () => {
    polygon(c, ink, [[frontX - 5, frontY + 2], [frontX - 6, frontY - 4], [pollX - 5, pollY + 1], [pollX - 3, pollY - 3],
      [pollX + 5, pollY - 3], [pollX + 7, pollY + 3], [frontX + 6, frontY + 2], [frontX + 3, frontY + 7]]);
    polygon(c, coat.body, [[frontX - 4, frontY + 2], [pollX - 4, pollY + 1], [pollX - 2, pollY - 2], [pollX + 5, pollY - 2],
      [pollX + 6, pollY + 3], [frontX + 4, frontY + 3], [frontX + 2, frontY + 6]]);
    polygon(c, coat.mane, [[pollX - fx * 4 - 2, pollY - 2], [pollX - fx * 3 + 2, pollY - 2],
      [frontX - fx * 5 + 2, frontY - 2], [frontX - fx * 5 - 3, frontY + 1]]);
    polygon(c, ink, [[pollX - 5, pollY - 3], [pollX - 6, pollY - 10], [pollX - 3, pollY - 9], [pollX - 1, pollY - 4],
      [pollX + 2, pollY - 4], [pollX + 4, pollY - 10], [pollX + 6, pollY - 10], [pollX + 6, pollY - 3],
      [noseX + 4, noseY + 1], [noseX + 3, noseY + 5], [noseX - 4, noseY + 5], [noseX - 6, noseY + 2]]);
    polygon(c, coat.light, [[pollX - 3, pollY - 2], [pollX + 3, pollY - 2], [noseX + 3, noseY + 1],
      [noseX + 2, noseY + 4], [noseX - 3, noseY + 4], [noseX - 4, noseY + 1]]);
    rect(c, pollX - 4, pollY - 8, 1, 4, coat.shade);
    rect(c, pollX + 4, pollY - 8, 1, 4, coat.shade);
    rect(c, pollX + fx * 2 - 1, pollY + 1, 2, 2, ink);
    rect(c, noseX - 3, noseY + 1, 6, 2, '#614a40');
    if (kind !== 'pony') rect(c, noseX - 3, noseY - 1, 6, 1, '#563d31');
  };
  if (!front) neck();
  if (rider && animator) {
    c.save();
    c.scale(1 / scale, 1 / scale);
    c.translate(-Math.round(x), -Math.round(y));
    drawRider(c, rider, animator, time, fx, fy, x, y, bob);
    c.restore();
  }
  if (front) neck();
  c.restore();
}

const stableX = 17964, stableY = 2238;
export function drawGreyhavenStable(c, open, foreground = false) {
  c.save();
  c.translate(stableX, stableY);
  if (foreground) {
    for (const [x, w] of [[-43, 24], [19, 25]]) {
      rect(c, x, -13, w, 15, timber[0]);
      rect(c, x + 1, -12, w - 2, 11, timber[2]);
      rect(c, x + 1, -12, w - 2, 2, timber[4]);
      rect(c, x + 1, -5, w - 2, 2, timber[1]);
    }
    const gateX = open ? -19 : -17;
    rect(c, gateX, -16, open ? 10 : 34, 16, timber[0]);
    rect(c, gateX + 1, -13, open ? 8 : 32, 3, timber[3]);
    rect(c, gateX + 1, -5, open ? 8 : 32, 3, timber[2]);
    for (const x of open ? [-17, -12] : [-15, -8, -1, 6, 13]) rect(c, x, -15, 2, 14, timber[3]);
    rect(c, -19, -19, 3, 21, timber[0]);
    rect(c, 17, -19, 3, 21, timber[0]);
    if (!open) rect(c, 11, -8, 5, 4, '#a7915d');
    c.restore();
    return;
  }
  polygon(c, '#3b484054', [[-53, -46], [51, -47], [53, 9], [26, 14], [-46, 8]]);
  polygon(c, '#6b5b42', [[-40, -47], [41, -47], [43, -2], [21, 1], [-25, 1], [-42, -3]]);
  polygon(c, '#897653', [[-39, -39], [39, -39], [38, -5], [26, -3], [-40, -3]]);
  for (const [x, y, w] of [[-35, -16, 11], [18, -23, 14], [-9, -28, 10], [-36, -6, 9], [-10, -5, 14], [22, -7, 10]]) {
    rect(c, x, y, w, 1, '#b8a171');
    rect(c, x + 2, y + 1, Math.floor(w / 2), 1, '#a38b5d');
  }
  rect(c, -41, -62, 82, 23, timber[0]);
  rect(c, -40, -60, 80, 20, timber[2]);
  for (let x = -39; x < 40; x += 6) rect(c, x, -57, 1, 16, timber[1]);
  rect(c, -41, -45, 82, 4, timber[1]);
  rect(c, -41, -45, 82, 1, timber[3]);
  for (const x of [-43, 35]) {
    polygon(c, timber[0], [[x, -48], [x + 8, -52], [x + 8, -5], [x, 0]]);
    polygon(c, timber[2], [[x + 2, -47], [x + 6, -49], [x + 6, -8], [x + 2, -6]]);
    rect(c, x + 2, -47, 2, 38, timber[3]);
    rect(c, x, -6, 8, 6, slate[1]);
  }
  polygon(c, ink, [[-48, -57], [-31, -80], [31, -80], [48, -57], [46, -53], [-46, -53]]);
  polygon(c, slate[2], [[-46, -57], [-30, -78], [30, -78], [46, -57]]);
  polygon(c, slate[1], [[-46, -57], [46, -57], [44, -54], [-44, -54]]);
  for (let row = 0; row < 4; row++) {
    const y = -76 + row * 5, width = 31 + row * 4;
    rect(c, -width, y, width * 2, 1, slate[1]);
    for (let x = -width + 4 + row % 2 * 5; x < width - 5; x += 11) rect(c, x, y + 1, 7, 1, slate[3]);
  }
  rect(c, -18, -53, 36, 8, timber[0]);
  rect(c, -17, -52, 34, 6, timber[2]);
  rect(c, -3, -51, 7, 2, '#cfa878');
  rect(c, -4, -49, 2, 2, '#cfa878');
  rect(c, 4, -49, 2, 2, '#cfa878');
  c.restore();
}

export function drawStormLantern(c, player, time) {
  const x = Math.round(player.x + (player.faceX > .1 ? -7 : 7));
  const y = Math.round(player.y - 12);
  const light = c.createRadialGradient(x, y, 1, x, y, 29);
  light.addColorStop(0, '#efbf725c');
  light.addColorStop(.36, '#d6964950');
  light.addColorStop(1, '#d6964900');
  c.fillStyle = light;
  c.fillRect(x - 29, y - 29, 58, 58);
  rect(c, x - 3, y - 3, 6, 8, '#644030');
  rect(c, x - 2, y - 2, 4, 5, '#dd9251');
  rect(c, x - 1, y - 1, 2, 3, Math.sin(time * 8) > 0 ? '#efb66b' : '#ffd38a');
  rect(c, x - 2, y - 5, 4, 1, '#493931');
}

export function drawStableChore(c, chore, time, active = true, full = false) {
  const {x, y, kind} = chore;
  const amber = '#e2bf78';
  c.save();
  c.translate(Math.round(x), Math.round(y));
  if (kind === 'bucket') {
    rect(c, -2, -13, 6, 2, '#9e9b80');
    rect(c, -4, -12, 2, 4, '#736d5c');
    rect(c, 4, -12, 2, 4, '#736d5c');
    polygon(c, ink, [[-6, -8], [7, -8], [5, 0], [-4, 0]]);
    polygon(c, timber[3], [[-5, -7], [6, -7], [4, -1], [-3, -1]]);
    rect(c, -4, -7, 9, 2, '#42433d');
  } else if (kind === 'trough') {
    rect(c, -17, -4, 34, 7, '#35452f8a');
    rect(c, -13, -4, 3, 6, timber[0]);
    rect(c, 10, -4, 3, 6, timber[0]);
    rect(c, -17, -14, 34, 12, timber[0]);
    rect(c, -16, -13, 32, 9, timber[3]);
    rect(c, -13, -11, 26, 5, full ? '#5d837e' : timber[1]);
    if (full) rect(c, -10, -10, 14, 1, '#a0aaa1');
  } else if (kind === 'hay') {
    rect(c, -17, -5, 35, 9, '#35452f8a');
    for (const [bx, by] of [[-15, -10], [1, -9], [-7, -20]]) {
      rect(c, bx, by, 17, 10, '#594733');
      rect(c, bx + 1, by + 1, 15, 8, full ? '#ba9a56' : '#957845');
      rect(c, bx + 2, by + 1, 13, 2, '#d6b875');
      rect(c, bx + 4, by + 1, 1, 8, '#766045');
      rect(c, bx + 12, by + 1, 1, 8, '#766045');
    }
  } else if (kind === 'lantern') {
    rect(c, -7, -18, 3, 19, timber[1]);
    rect(c, -7, -19, 9, 2, timber[3]);
    rect(c, -4, -15, 8, 11, ink);
    rect(c, -3, -13, 6, 7, active ? '#b98652' : '#776b47');
    rect(c, -1, -12, 3, 5, active ? '#f8d191' : '#95805b');
  } else if (kind === 'tracks') {
    for (const [dx, dy] of [[-7, 5], [-1, 0], [5, -4], [10, -7]]) {
      rect(c, dx - 2, dy - 1, 4, 3, '#343b34');
      rect(c, dx - 1, dy - 1, 2, 1, '#cdb988');
      rect(c, dx - 1, dy, 2, 1, '#73867e');
    }
  } else if (kind === 'ring') {
    rect(c, -3, -12, 5, 13, timber[1]);
    rect(c, -2, -12, 2, 13, timber[3]);
    rect(c, 0, -9, 4, 5, '#ac9568');
    rect(c, 1, -8, 2, 3, timber[0]);
  }
  if (active && kind !== 'tracks') {
    const height = kind === 'hay' || kind === 'lantern' ? -27 : -19;
    const rise = height + Math.round(Math.sin(time * 4) * 2);
    polygon(c, ink, [[0, rise - 4], [4, rise], [0, rise + 4], [-4, rise]]);
    polygon(c, amber, [[0, rise - 2], [2, rise], [0, rise + 2], [-2, rise]]);
  }
  c.restore();
}

export function drawRaceFlag(c, point, number, goal, passed, time, count) {
  const {x, y} = point;
  const color = goal ? '#efc179' : passed ? '#78816b' : '#a3765b';
  const wave = Math.round(Math.sin(time * 6 + number) * 2);
  rect(c, x - 14, y - 22, 2, 22, timber[0]);
  rect(c, x + 14, y - 22, 2, 22, timber[0]);
  rect(c, x - 14, y - 23, 2, 3, '#d4af75');
  rect(c, x + 14, y - 23, 2, 3, '#d4af75');
  polygon(c, color, [[x + 14, y - 22], [x + 20, y - 22 + wave], [x + 32, y - 18 + wave], [x + 19, y - 15], [x + 14, y - 15]]);
  if (goal) {
    c.save();
    c.font = 'bold 10px monospace';
    c.textAlign = 'center';
    c.strokeStyle = '#2d2927';
    c.lineWidth = 2;
    const text = count || (number === 7 ? 'FINISH' : number);
    c.strokeText(text, x, y - 27);
    c.fillStyle = '#ffe2a2';
    c.fillText(text, x, y - 27);
    c.restore();
    rect(c, x - 12, y - 1, 25, 2, '#e7be7690');
  }
}

export function drawRaceHurdle(c, point) {
  const {x, y} = point;
  rect(c, x - 16, y - 10, 3, 12, timber[0]);
  rect(c, x + 13, y - 10, 3, 12, timber[0]);
  polygon(c, timber[0], [[x - 23, y - 4], [x - 2, y - 9], [x + 21, y - 2], [x + 21, y + 1], [x - 3, y - 5], [x - 22, y - 1]]);
  polygon(c, timber[3], [[x - 23, y - 4], [x - 2, y - 9], [x + 21, y - 2], [x + 21, y - 1], [x - 3, y - 7], [x - 22, y - 3]]);
}
