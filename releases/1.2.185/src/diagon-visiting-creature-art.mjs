export const DIAGON_VISITING_CREATURE_BOUNDS = Object.freeze({
  'newts-niffler': {halfWidth: 19, height: 21, below: 4, radius: 7},
  fawkes: {halfWidth: 23, height: 50, below: 4, radius: 7},
  buckbeak: {halfWidth: 31, height: 46, below: 7, radius: 14},
});

const headings = [
  {ahead: 0, depth: 1},
  {ahead: .71, depth: .71},
  {ahead: 1, depth: 0},
  {ahead: .71, depth: -.71},
  {ahead: 0, depth: -1},
];

// Integer scan lines keep the sprite edges crisp against the alley's cobbles.
function polygon(c, color, points) {
  c.fillStyle = color;
  const top = Math.min(...points.map(([, y]) => y));
  const bottom = Math.max(...points.map(([, y]) => y));
  for (let y = Math.floor(top); y < bottom; y++) {
    const scan = y + .5, edges = [];
    for (let i = 0; i < points.length; i++) {
      const [ax, ay] = points[i], [bx, by] = points[(i + 1) % points.length];
      if ((ay <= scan && by > scan) || (by <= scan && ay > scan)) {
        edges.push(ax + (scan - ay) / (by - ay) * (bx - ax));
      }
    }
    edges.sort((a, b) => a - b);
    for (let i = 1; i < edges.length; i += 2) {
      const left = Math.ceil(edges[i - 1] - .5), right = Math.ceil(edges[i] - .5);
      if (right > left) c.fillRect(left, y, right - left, 1);
    }
  }
}

function rect(c, color, x, y, width, height) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), width, height);
}

const niffler = {
  ink: '#24202d', shade: '#343344', coat: '#49475a', rim: '#666475',
  belly: '#635a68', skin: '#866966', bill: '#bc9888', gloss: '#d6b7a2',
};

function drawNiffler(c, {ahead, depth}, stride, idle) {
  const phase = stride ? stride % 3 - 1 : 0;
  const coin = !stride && idle === 2 && depth >= 0;
  const lift = stride === 2 || coin ? -1 : 0;
  const tail = -ahead * 8, tailY = -7 - depth * 3 + lift;
  const head = ahead * 7, headY = -11 + depth * 2 + lift;
  const {ink, shade, coat, rim, belly, skin, bill, gloss} = niffler;
  const body = () => {
    polygon(c, ink, [[-10,-10],[-6,-14],[2,-14],[8,-10],[10,-5],[6,-1],[-6,-1],[-10,-5]].map(([x,y])=>[x,y+lift]));
    polygon(c, coat, [[-9,-10],[-5,-13],[2,-13],[7,-10],[9,-5],[5,-2],[-6,-2],[-9,-5]].map(([x,y])=>[x,y+lift]));
    polygon(c, belly, [[-2,-8],[3,-9],[7,-6],[5,-2],[-2,-2],[-4,-5]].map(([x,y])=>[x+ahead*2,y+lift]));
    rect(c, rim, -5, -12 + lift, 6, 1);
    rect(c, skin, -6 - phase, -2 + depth, 3, 2);
    rect(c, bill, 3 + phase, -2 + depth, 3, 2);
  };
  const face = () => {
    polygon(c, ink, [[head-5,headY-4],[head+1,headY-5],[head+5,headY-3],
      [head+7,headY+1],[head+4,headY+4],[head-3,headY+4],[head-6,headY+1]]);
    polygon(c, shade, [[head-4,headY-3],[head+2,headY-4],[head+5,headY-1],
      [head+5,headY+2],[head-3,headY+3],[head-5,headY]]);
    rect(c, rim, head - 3, headY - 3, 4, 1);
    if (depth < -.5) return;
    const nose = head + ahead * 4, noseY = headY + 1 + Math.max(0, depth);
    polygon(c, skin, [[nose-3,noseY-1],[nose+4,noseY-1],[nose+7,noseY+1],
      [nose+6,noseY+4],[nose+1,noseY+4],[nose-3,noseY+2]]);
    rect(c, bill, nose - 1, noseY, 6, 2);
    rect(c, gloss, nose + 3, noseY, 2, 1);
    rect(c, ink, head + 1, headY - 1, 2, 2);
    if (depth > .9) rect(c, ink, head - 3, headY - 1, 1, 1);
    rect(c, '#d8c9a4', head + 1, headY - 1, 1, 1);
  };
  polygon(c, shade, [[tail-7,tailY+2],[tail-6,tailY],[tail-2,tailY-2],
    [tail+2,tailY-2],[tail+1,tailY+2],[tail-4,tailY+4]]);
  if (depth < -.5) {
    face();
    body();
  } else {
    body();
    face();
  }
  if (coin) {
    const x = Math.round(ahead * 5), y = -7 + lift;
    rect(c, '#8a5534', x - 2, y, 5, 4);
    rect(c, '#e6ad54', x - 1, y - 1, 3, 5);
    rect(c, '#ffdf92', x, y - 1, 1, 2);
    rect(c, shade, x - 3, y + 2, 2, 2);
    rect(c, shade, x + 2, y + 3, 2, 2);
  }
}

const phoenix = {
  ink: '#48232e', rust: '#7e2e33', shade: '#a43b32', coat: '#cb5338',
  coral: '#e27143', gold: '#f1a658', light: '#ffd58a', talon: '#aa713f',
};

function drawFawkes(c, {ahead, depth}, stride, idle) {
  const flight = stride > 0, flap = flight ? [0, 1, 0, -1][stride - 1] : 0;
  const rise = flight ? -10 - (flap === 1 ? 3 : 0) : 0;
  const face = Math.round(ahead * 4), high = Math.round(-22 + depth * 2 + rise);
  const tail = Math.round(-ahead * 8), tailY = -8 + rise;
  const {ink, rust, shade, coat, coral, gold, light, talon} = phoenix;
  const wing = (sign, far) => {
    const joint = sign * 2, tip = sign * (flight ? 18 - Math.abs(flap) * 2 : idle === 1 ? 11 : 8);
    const brow = high + 5 + (far ? -3 : 0), tipY = brow + (flight ? -flap * 10 : idle === 1 ? 4 : 7);
    polygon(c, ink, [[joint,brow],[tip*.65,tipY-4],[tip,tipY],[tip-sign*3,tipY+6],
      [tip-sign*7,tipY+8],[joint,brow+11]]);
    polygon(c, far ? shade : coat, [[joint,brow+1],[tip*.65,tipY-3],[tip-sign,tipY+1],
      [tip-sign*4,tipY+6],[tip-sign*7,tipY+7],[joint,brow+9]]);
    polygon(c, coral, [[joint,brow+1],[tip*.65,tipY-3],[tip-sign*2,tipY],
      [tip-sign*5,tipY+3],[joint,brow+4]]);
    for (let i=0; i<3; i++) {
      const x = tip - sign * (3+i*2), y = tipY+3+Math.min(i,2);
      rect(c, i === 0 ? gold : rust, x, y, 1, 2);
    }
  };
  wing(-1, depth > -.5);
  polygon(c, ink, [[tail+5,tailY-4],[tail-4,tailY-5],[tail-10,tailY+2],
    [tail-11,tailY+7],[tail-7,tailY+9],[tail-3,tailY+6],[tail+2,tailY+7],[tail+4,tailY+1]]);
  polygon(c, rust, [[tail+4,tailY-3],[tail-4,tailY-4],[tail-9,tailY+2],
    [tail-10,tailY+7],[tail-7,tailY+8],[tail-3,tailY+5],[tail+1,tailY+6]]);
  polygon(c, gold, [[tail-2,tailY-3],[tail-4,tailY+2],[tail-9,tailY+7],
    [tail-7,tailY+8],[tail-2,tailY+4],[tail+1,tailY-2]]);
  rect(c, coral, tail - 1, tailY + 2, 2, 3);
  rect(c, talon, -5, -4 + rise, 3, flight ? 2 : 4);
  rect(c, talon, 2, -4 + rise, 3, flight ? 2 : 4);
  if (!flight) {
    rect(c, gold, -5, -1, 4, 1);
    rect(c, gold, 2, -1, 4, 1);
  }
  polygon(c, ink, [[-4,high+3],[3,high+2],[8,high+6],[7,high+15],[3,high+19],
    [-4,high+18],[-8,high+14],[-8,high+8]]);
  polygon(c, coat, [[-3,high+4],[3,high+3],[7,high+7],[6,high+14],[2,high+18],
    [-4,high+17],[-7,high+13],[-7,high+8]]);
  polygon(c, depth > -.5 ? gold : coral, [[face-3,high+5],[face+2,high+5],
    [face+4,high+9],[face+2,high+15],[face-2,high+16],[face-5,high+11]]);
  wing(1, depth < -.5);
  polygon(c, ink, [[face-6,high-3],[face-7,high-10],[face-3,high-8],[face-2,high-5],
    [face+2,high-7],[face+2,high-4],[face+5,high-1],[face+5,high+5],
    [face+1,high+8],[face-4,high+6],[face-6,high+2]]);
  polygon(c, gold, [[face-5,high-3],[face-6,high-8],[face-3,high-6],[face-3,high-3],
    [face+1,high-5],[face+1,high-3],[face+4,high],[face+4,high+4],
    [face+1,high+7],[face-4,high+5],[face-5,high+1]]);
  rect(c, coral, face - 4, high - 2, 3, 6);
  rect(c, light, face, high - 1, 3, 1);
  if (depth < -.5) return;
  const beak = face+ahead*3;
  polygon(c, ink, [[beak-1,high+2],[beak+6,high+2],[beak+8,high+5],[beak+6,high+8],[beak+3,high+5]]);
  rect(c, light, beak + 2, high + 3, 4, 2);
  rect(c, talon, beak + 5, high + 5, 2, 2);
  rect(c, ink, face + 1, high + 1, 2, idle === 3 && !flight ? 1 : 2);
  if (depth > .9) rect(c, ink, face-3,high+1,1,1);
}

const hippogriff = {
  ink: '#303137', dark: '#47474e', shade: '#606064', coat: '#85837d',
  rim: '#a29e92', ash: '#bcb8aa', ivory: '#d4cdb6', light: '#eee2c2',
  beak: '#a78358', gold: '#cba471', iris: '#eeb75d',
};

function drawBuckbeak(c, {ahead, depth}, stride, idle) {
  const {ink, dark, shade, coat, rim, ash, ivory, light, beak, gold, iris} = hippogriff;
  const hip = -Math.round(ahead * 12), chest = Math.round(ahead * 10);
  const low = stride === 2 || stride === 4 ? 1 : 0;
  const nod = !stride && idle === 1 ? 2 : 0, swish = !stride && idle === 2 ? 3 : 0;
  const tailY = -18 - depth * 4, shoulderY = -18 + depth * 4 + low;
  const leg = (front, far, sign) => {
    const root = front ? chest : hip, side = (1 - ahead) * 5;
    const x = root + sign * (side + 3), y = (front ? depth : -depth) * 4 + (far ? -2 : 1);
    const gait = stride ? [0,2,0,-2][(stride + (far ? 2 : 0) + (front ? 0 : 2)) % 4] : 0;
    const foot = x + ahead * gait, footY = y + depth * gait * .5 + Math.min(0, gait) * .5;
    polygon(c, ink, [[x-3,y-17],[x+3,y-16],[x+2,y-8],[foot+2,footY-3],
      [foot+4,footY-1],[foot+3,footY+1],[foot-3,footY+1],[foot-3,footY-3],[x-2,y-8],[x-4,y-12]]);
    polygon(c, far ? dark : front ? rim : coat, [[x-2,y-16],[x+2,y-15],[x+1,y-7],
      [foot+1,footY-3],[foot+2,footY-1],[foot-2,footY-1],[x-1,y-7],[x-3,y-12]]);
    if (front) {
      rect(c, far ? beak : gold, foot-2,footY-4,4,2);
      rect(c, far ? rim : ivory, foot+1,footY-1,3,1);
    }
  };
  const neck = () => {
    const head = Math.round(ahead * 16), eyeY = Math.round(-31 + depth * 5 + nod + low);
    polygon(c, ink, [[chest-7,shoulderY],[head-8,eyeY+1],[head-7,eyeY-7],[head-5,eyeY-8],
      [head-4,eyeY-5],[head+2,eyeY-6],[head+8,eyeY-2],[head+9,eyeY+3],[head+5,eyeY+8],
      [chest+7,shoulderY+4],[chest+3,shoulderY+9],[chest-3,shoulderY+9]]);
    polygon(c, ivory, [[chest-6,shoulderY],[head-7,eyeY+1],[head-6,eyeY-6],[head-4,eyeY-4],
      [head+2,eyeY-5],[head+7,eyeY-2],[head+8,eyeY+3],[head+4,eyeY+8],
      [chest+6,shoulderY+4],[chest+2,shoulderY+8],[chest-3,shoulderY+8]]);
    polygon(c, ash, [[head-6,eyeY-1],[head-3,eyeY+2],[head-1,eyeY+6],
      [chest+1,shoulderY+3],[chest+3,shoulderY+7],[chest-3,shoulderY+8],[chest-6,shoulderY]]);
    polygon(c, light, [[head-3,eyeY-4],[head+2,eyeY-5],[head+6,eyeY-2],
      [head+6,eyeY+2],[head+2,eyeY],[head-1,eyeY+1]]);
    for (let i = 0; i < 3; i++) rect(c, rim, head - 3 + i, eyeY + 5 + i * 2, 2, 1);
    if (depth < -.5) return;
    const point = Math.round(head + ahead * 4);
    polygon(c, ink, [[point-4,eyeY+2],[point+4,eyeY+1],[point+9,eyeY+4],[point+8,eyeY+8],
      [point+4,eyeY+10],[point+4,eyeY+6],[point-3,eyeY+6]]);
    polygon(c, gold, [[point-3,eyeY+3],[point+4,eyeY+2],[point+8,eyeY+4],[point+7,eyeY+7],
      [point+5,eyeY+8],[point+5,eyeY+6],[point-3,eyeY+5]]);
    rect(c, beak, point+3,eyeY+5,4,1);
    rect(c, ink, head+1,eyeY-1,3,idle === 3 && !stride ? 1 : 2);
    rect(c, iris, head+2,eyeY-1,1,1);
    if (depth > .9) {
      rect(c, ink, head-5,eyeY-1,2,2);
      rect(c, iris, head-4,eyeY-1,1,1);
    }
  };
  const tail = () => {
    const tip = hip - ahead * 10 + swish;
    polygon(c, ink, [[hip-4,tailY-2],[hip,tailY-1],[tip+3,tailY+4],[tip+1,tailY+13],
      [tip-4,tailY+15],[tip-3,tailY+9],[hip-5,tailY+4]]);
    polygon(c, shade, [[hip-3,tailY-1],[hip-1,tailY],[tip+2,tailY+4],[tip,tailY+12],
      [tip-3,tailY+14],[tip-2,tailY+9],[hip-4,tailY+3]]);
    rect(c, rim, tip-1,tailY+6,1,4);
  };
  leg(false,true,-1);
  leg(true,true,-1);
  if (depth >= -.5) tail();
  if (depth < -.5) neck();
  const width = 8 - ahead * 2, left = hip-width, right = chest+width;
  const top = Math.min(tailY,shoulderY)-4, bottom = Math.max(tailY,shoulderY)+8;
  polygon(c, ink, [[left,top+6],[left+4,top+1],[right-5,top],[right,top+4],
    [right,bottom-5],[right-5,bottom],[left+5,bottom-1],[left,bottom-4]]);
  polygon(c, coat, [[left+1,top+6],[left+5,top+2],[right-5,top+1],[right-1,top+5],
    [right-1,bottom-5],[right-5,bottom-1],[left+5,bottom-2],[left+1,bottom-5]]);
  polygon(c, shade, [[left+2,top+7],[left+7,bottom-5],[right-4,bottom-6],
    [right-3,bottom-3],[right-5,bottom-1],[left+6,bottom-2],[left+1,bottom-5]]);
  const wingX = Math.round(ahead * 5), wingY = top+3;
  polygon(c, dark, [[wingX+6,wingY-1],[wingX+10,wingY+4],[wingX+5,wingY+9],
    [wingX-2,wingY+11],[left+2,wingY+12],[left,wingY+10],[wingX-7,wingY+4]]);
  polygon(c, ash, [[wingX+6,wingY],[wingX+8,wingY+3],[wingX+4,wingY+7],[wingX-2,wingY+9],
    [left+2,wingY+11],[left+1,wingY+10],[wingX-6,wingY+4]]);
  polygon(c, rim, [[wingX+7,wingY+2],[wingX+4,wingY+7],[wingX-2,wingY+9],
    [left+2,wingY+11],[left+1,wingY+10],[wingX-3,wingY+6]]);
  for (let i = 0; i < 4; i++) {
    rect(c, shade, left+3+i*2,wingY+8-Math.floor(i*.5),4,1);
  }
  rect(c, ivory, wingX-4,wingY+2,5,1);
  leg(false,false,1);
  leg(true,false,1);
  if (depth < -.5) tail();
  if (depth >= -.5) neck();
}

const art = {
  'newts-niffler': drawNiffler,
  fawkes: drawFawkes,
  buckbeak: drawBuckbeak,
};
const frames = new Map();

function creatureFrame(id, heading, stride, idle) {
  const key = [id,heading,stride,idle].join(':');
  if (frames.has(key)) return frames.get(key);
  const {halfWidth,height,below} = DIAGON_VISITING_CREATURE_BOUNDS[id];
  const canvas = new OffscreenCanvas(halfWidth*2,height+below);
  const c = canvas.getContext('2d');
  c.translate(halfWidth,height);
  art[id](c,headings[heading],stride,idle);
  frames.set(key,canvas);
  return canvas;
}

export function drawDiagonVisitingCreature(c, actor, time = 0) {
  const id = actor.residentId;
  if (!Object.hasOwn(art,id)) return false;
  const direction = Math.round(Math.atan2(actor.faceX || 0, actor.faceY ?? 1)/(Math.PI/4));
  const heading = Math.abs(direction);
  const motion = id === 'fawkes' ? time*10 : (actor.step||0)*1.4;
  const stride = actor.moving ? 1 + Math.floor(Math.max(0,motion))%4 : 0;
  const cycle = Math.max(0,time)%5.8;
  const idle = stride ? 0 : cycle>5.55 ? 3 : cycle>4.1 && cycle<4.55 ? 2 : cycle>2.3 && cycle<2.65 ? 1 : 0;
  const {halfWidth,height,radius} = DIAGON_VISITING_CREATURE_BOUNDS[id];
  c.save();
  c.translate(Math.round(actor.x),Math.round(actor.y));
  if (!actor.portrait) {
    rect(c,'#25263441',-radius,0,radius*2,2);
    rect(c,'#25263441',-radius+3,2,radius*2-6,1);
  }
  if (direction < 0) c.scale(-1,1);
  if (typeof OffscreenCanvas === 'function' && c.drawImage) {
    c.imageSmoothingEnabled = false;
    c.drawImage(creatureFrame(id,heading,stride,idle),-halfWidth,-height);
  } else {
    art[id](c,headings[heading],stride,idle);
  }
  c.restore();
  return true;
}
