import {DEFAULT_APPEARANCE} from './appearance.mjs';

const look = (skin, hair, hairColor, shirt, pants, shoes, details = {}) =>
  ({...DEFAULT_APPEARANCE, skin, hair, hairColor, shirt, pants, shoes, ...details});

export const GREYHAVEN_CAST_ART = {
  'greyhaven-mim': {
    scale: .94, costume: 'mim',
    appearance: look('#cb9a7a', 'shag', '#a398ab', '#773e69', '#503547', '#362b35', {build: 'slim', eyeColor: '#87b56b'}),
    equipment: {hand1: 'greyhaven_rowan_wand'},
  },
  'greyhaven-ector': {
    scale: 1.02, costume: 'ector',
    appearance: look('#d7a17b', 'none', '#5f433a', '#9e573b', '#675044', '#483631', {build: 'broad', facialHair: 'moustache', facialHairColor: '#61463d'}),
  },
  'greyhaven-kay': {
    scale: 1.08, costume: 'kay',
    appearance: look('#dfb895', 'sidepart', '#af8f54', '#813a48', '#514350', '#3e322f', {build: 'slim', eyeColor: '#607f93'}),
  },
  'greyhaven-robin': {
    scale: 1, costume: 'robin',
    appearance: look('#bc895e', 'waves', '#503226', '#326851', '#5e5940', '#48372c', {build: 'slim', facialHair: 'stubble', facialHairColor: '#553b2c', eyeColor: '#758754'}),
    equipment: {hand1: 'bow'},
  },
  'greyhaven-little-john': {
    scale: 1.15, costume: 'john',
    appearance: look('#b97b59', 'crop', '#845134', '#aa8052', '#625b40', '#443930', {build: 'broad', facialHair: 'shortbeard', facialHairColor: '#874e33', face: 'freckles'}),
  },
  'greyhaven-marian': {
    scale: 1, costume: 'marian',
    appearance: look('#a76955', 'braids', '#302a39', '#813f61', '#583346', '#402c39', {eyeColor: '#60453c'}),
  },
};

export function greyhavenCastLook(actor, id) {
  const art = GREYHAVEN_CAST_ART[id];
  return art ? {...actor, appearance: {...art.appearance}, equipment: {...art.equipment}, greyhavenCostume: art.costume, greyhavenScale: art.scale} : actor;
}

const ink = '#302833';
const gold = '#d8aa59';

function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}

function stitch(c, x0, y0, x1, y1, width, color) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    rect(c, x0 + (x1 - x0) * t - Math.floor(width / 2), y0 + (y1 - y0) * t, width, width, color);
  }
}

const fronts = [1, .72, .24, 0, 0, 0, .24, .72];
const side = [0, -1, -1, -1, 0, 1, 1, 1];

// Clothing sits on the projected joints so a turn keeps the closures on the same side.
export function drawGreyhavenBodice(c, p, d, costume) {
  const {x, y} = p.chest;
  const front = fronts[d];
  const turn = side[d];
  const shoulder = turn >= 0 ? p.shoulderR : p.shoulderL;
  const opposite = turn >= 0 ? p.shoulderL : p.shoulderR;
  const width = Math.max(4, Math.round(Math.abs(p.shoulderL.x - p.shoulderR.x) / 2));
  const closure = x + turn * (front < .3 ? 2 : 1);
  const pelt = (base, light, shade) => {
    rect(c, x - width - 1, y - 2, width * 2 + 3, 3, ink);
    rect(c, x - width, y - 3, width * 2 + 1, 3, base);
    rect(c, x - width, y - 3, width + 1, 1, light);
    rect(c, x - 1, y + 1, width + 1, 2, shade);
  };
  switch (costume) {
    case 'mim':
      pelt('#563257', '#7b4a75', '#46283f');
      if (front) {
        rect(c, closure - 1, y - 1, 3, 3, '#9c6046');
        rect(c, closure - 1, y - 1, 2, 1, '#e8b36d');
        rect(c, closure + 1, y, 1, 1, '#d79159');
      }
      break;
    case 'ector':
      if (front) {
        stitch(c, x - width + 2, y - 1, closure + 1, p.pelvis.y + 1, 2, '#563b32');
        rect(c, closure + 1, y + 3, 4, 3, '#82583d');
        rect(c, closure + 1, y + 3, 3, 1, '#a97850');
        rect(c, closure, y, 2, 2, gold);
      } else stitch(c, shoulder.x, shoulder.y + 1, p.pelvis.x, p.pelvis.y, 2, '#603e34');
      break;
    case 'kay':
      pelt('#c4ab86', '#f1d6ad', '#987962');
      if (front > .3) stitch(c, closure, y + 3, p.pelvis.x, p.pelvis.y - 1, 1, '#ba765f');
      break;
    case 'robin':
      pelt('#456343', '#698357', '#2f4337');
      if (front) {
        stitch(c, opposite.x, opposite.y - 1, p.pelvis.x + 2, p.pelvis.y - 1, 2, '#704535');
        rect(c, closure, y + 4, 2, 2, '#ad8150');
      }
      break;
    case 'john':
      stitch(c, shoulder.x, y + 1, p.pelvis.x + width * .55, p.pelvis.y - 1, 4, '#4a5740');
      stitch(c, opposite.x, y + 1, p.pelvis.x - width * .55, p.pelvis.y - 1, 4, '#667052');
      if (front) rect(c, closure, y + 3, 2, 1, '#cc9a65');
      break;
    case 'marian':
      pelt('#434c6d', '#68799a', '#333851');
      if (front) {
        rect(c, closure - 1, y + 1, 3, 2, '#ba8f61');
        rect(c, closure, y + 1, 1, 1, '#efc982');
      }
      break;
  }
}

const hems = {
  mim: {base: '#653a58', shade: '#472b47', light: '#89516f', belt: '#c18a4b', half: 6, length: 12},
  ector: {base: '#7c5038', shade: '#573a32', light: '#956643', belt: '#513c32', half: 6, length: 7},
  kay: {base: '#813a48', shade: '#562b39', light: '#9f4b54', belt: '#5d4039', half: 5, length: 5},
  marian: {base: '#813e62', shade: '#572c4a', light: '#a75572', belt: '#c79a61', half: 6, length: 12},
};

export function drawGreyhavenHem(c, p, d, costume) {
  const cloth = hems[costume];
  if (!cloth) return;
  const front = fronts[d];
  if (costume === 'ector' && !front) return;
  const {x, y} = p.pelvis;
  const turn = side[d];
  const half = cloth.half - (d === 2 || d === 6 ? 2 : 0);
  const foot = Math.max(p.footL.y, p.footR.y);
  const length = Math.min(cloth.length, Math.max(2, Math.floor(foot - y - 3)));
  for (let row = -1; row < length; row++) {
    const width = Math.max(2, half - (row < 2 ? 1 : row === length - 1 ? 1 : 0));
    const fold = turn * (row > length / 2 ? 1 : 0);
    const left = x - width + fold;
    rect(c, left, y + row, width * 2 + 1, 1, ink);
    if (row < length - 1) {
      rect(c, left + 1, y + row, width * 2 - 1, 1, cloth.base);
      rect(c, left + width, y + row, Math.max(1, width - 1), 1, cloth.shade);
      if (row >= 2) rect(c, left + 2, y + row, row < 4 ? 2 : 1, 1, cloth.light);
    }
  }
  rect(c, x - half + 1, y - 1, half * 2 - 1, 2, cloth.belt);
  if (front && costume === 'marian') {
    rect(c, x + 1 + turn, y + 1, 2, 3, gold);
    rect(c, x + 2 + turn, y + 3, 2, 1, '#a9784a');
  }
}

export function drawGreyhavenCarry(c, p, d, costume) {
  if (costume === 'kay') {
    const {x, y} = p.shoulderR;
    rect(c, x - 2, y - 2, 5, 5, '#38424b');
    rect(c, x - 1, y - 3, 3, 1, '#748a91');
    rect(c, x - 2, y - 2, 4, 2, '#82969b');
    rect(c, x - 1, y - 2, 2, 1, '#c0c7b8');
    rect(c, x, y, 2, 2, '#647682');
  }
  if (costume === 'ector') {
    const {x, y} = p.handR;
    rect(c, x - 2, y - 6, 5, 7, '#45322e');
    rect(c, x - 1, y - 6, 4, 1, '#cab48e');
    rect(c, x - 1, y - 5, 3, 5, '#744f37');
    rect(c, x + 1, y - 4, 1, 2, '#b48950');
    rect(c, x - 1, y - 2, 2, 2, '#d7a17b');
  }
  if (costume === 'robin') {
    const {x, y} = p.chest;
    const turn = side[d];
    const offset = turn < 0 ? -5 : 5;
    if (d !== 2 && d !== 6) {
      stitch(c, x + offset, y - 6, p.pelvis.x - offset, p.pelvis.y, 4, '#48322e');
      stitch(c, x + offset - 1, y - 5, p.pelvis.x - offset - 1, p.pelvis.y - 1, 2, '#936045');
      rect(c, x + offset - 2, y - 9, 2, 3, '#bca583');
      rect(c, x + offset + 1, y - 11, 2, 4, '#ddc487');
    } else {
      stitch(c, x - turn * 5, y - 7, x - turn * 5, p.pelvis.y, 3, '#80543d');
      rect(c, x - turn * 5, y - 10, 1, 3, '#d8b87c');
    }
  }
  if (costume === 'john') {
    const hand = p.handR;
    const turn = side[d] || 1;
    stitch(c, hand.x + turn * 6, hand.y - 18, hand.x - turn * 5, hand.y + 13, 3, '#533c2d');
    stitch(c, hand.x + turn * 6, hand.y - 17, hand.x - turn * 5, hand.y + 11, 1, '#b59162');
    rect(c, hand.x - 1, hand.y - 1, 3, 3, '#b97b59');
  }
}
