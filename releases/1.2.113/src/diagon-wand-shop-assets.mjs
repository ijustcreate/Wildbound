import {drawJungleFern} from './fern-art.mjs';
import {drawRefinedFurniture} from './furniture-art.mjs';
import {pixelPolygon} from './pixel-shapes.mjs';
import {drawStationCargo} from './station-prop-art.mjs';
import {
  OLLIVANDERS_ARCHITECTURE_ASSETS,
  drawOllivandersArchitecturalAsset,
} from './diagon-wand-shop-architecture.mjs';

// Fixed Wildbound camera. Dimensions are native world pixels, with (0, 0)
// centered on the near ground edge. Only the top plane recedes into the room.
const wood = {
  ink: '#30282b',
  recess: '#403036',
  shade: '#593a37',
  base: '#7b5142',
  light: '#a57451',
  rim: '#c09569',
};
const brass = {
  ink: '#443a2a',
  shade: '#786040',
  base: '#aa8752',
  light: '#d7b477',
  rim: '#ead2a2',
};
const iron = {ink: '#272f31', shade: '#394549', base: '#516167', light: '#798b85'};
const paper = {shade: '#9c8563', base: '#d5ba8d', rim: '#e7d2a3'};
const velvet = {ink: '#302a39', shade: '#514052', base: '#795266', light: '#a2707c'};
const glass = {shade: '#765456', plum: '#a96e73', green: '#91a571', gold: '#e1b981', core: '#f0d69a'};
const boxColors = [
  ['#694852', '#a87273'],
  ['#55615b', '#8c9a7c'],
  ['#775944', '#b19265'],
  ['#596079', '#8c8c99'],
  ['#6e644a', '#aaa279'],
];

function rectangle(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

function silhouette(c, points, color) {
  pixelPolygon(c, points.map(([x, y]) => ({x, y})), color);
}

function cabinet(c, variant) {
  const r = (x, y, w, h, color) => rectangle(c, x, y, w, h, color);
  // Solid back and molded cornice. Deep shelf recesses keep the three visual
  // tiers of packed boxes together, even when viewed at one gameplay pixel.
  silhouette(c, [[-21,-59],[-17,-63],[15,-64],[20,-60],[20,-3],[17,0],[-18,0],[-21,-3]],wood.ink);
  r(-18,-59,36,55,wood.shade);
  r(-14,-56,29,41,wood.recess);
  r(-13,-55,27,39,'#352c34');
  r(14,-58,3,54,wood.ink);
  r(-18,-58,3,54,wood.base);
  r(-17,-57,1,48,wood.light);

  const bundles = [
    [[-13,-49,19,4],[-11,-54,24,4],[7,-49,6,4]],
    [[-13,-37,21,4],[-8,-42,20,4],[-12,-45,17,2]],
    [[-11,-25,24,4],[-13,-30,19,4],[-9,-32,18,2]],
    [[-13,-16,22,4],[-7,-21,20,4],[10,-16,4,4]],
  ];
  for (const [row, boxes] of bundles.entries()) {
    for (const [i, [x,y,w,h]] of boxes.entries()) {
      // Keep one uneven course per shelf; small paper ends identify the boxes.
      const [body, top] = boxColors[(row * 2 + i + variant) % boxColors.length];
      const offset = variant && i === 1 ? 2 - row % 2 : 0;
      r(x + offset, y, w - offset, h, body);
      r(x + offset, y, w - offset - 2, 1, top);
      if (h >= 4 && w > 8) r(x + w - 7, y + 2, 3, 1, paper.base);
    }
  }
  for (const y of [-45,-33,-21,-12]) {
    r(-15,y,30,2,wood.base);
    r(-14,y,21,1,wood.light);
  }
  r(-16,-11,31,8,wood.base);
  r(-13,-9,25,5,wood.shade);
  r(-5,-9,10,2,brass.shade);
  r(-3,-9,5,1,brass.light);
  r(-21,-60,42,3,wood.base);
  r(-18,-61,33,2,wood.light);
  r(-16,-62,19,1,wood.rim);
  r(-19,-4,38,2,wood.base);
}

function ladder(c) {
  const r = (x, y, w, h, color) => rectangle(c, x, y, w, h, color);
  // A slight lean toward the shelving. Tread surfaces stay horizontal.
  silhouette(c,[[-7,-55],[-3,-56],[-4,-13],[-5,-4],[-8,-4]],wood.ink);
  silhouette(c,[[5,-55],[8,-55],[7,-13],[6,-4],[3,-4]],wood.ink);
  silhouette(c,[[-6,-54],[-4,-54],[-5,-11],[-6,-6],[-7,-6]],wood.light);
  silhouette(c,[[6,-54],[7,-54],[6,-11],[5,-6],[4,-6]],wood.base);
  for (const [x,y] of [[-5,-46],[-5,-37],[-5,-28],[-6,-19],[-6,-10]]) {
    r(x,y,12,3,wood.shade);
    r(x,y,11,1,wood.rim);
  }
  r(-8,-7,3,4,wood.ink);
  r(4,-7,3,4,wood.ink);
  r(-7,-7,1,3,wood.base);
  r(5,-7,1,3,wood.base);
  r(-8,-5,5,2,iron.base);
  r(3,-5,5,2,iron.base);
  r(-8,-3,5,3,iron.ink);
  r(3,-3,5,3,iron.ink);
  r(-7,-2,2,1,iron.light);
  r(4,-2,2,1,iron.light);
}

function counter(c) {
  const r = (x, y, w, h, color) => rectangle(c, x, y, w, h, color);
  // Shallow top projects toward the viewing camera. The modest overhang
  // casts its own shadow, leaving most of the lighter wood patina near the top.
  silhouette(c,[[-45,-24],[-40,-38],[39,-38],[45,-24],[45,-19],[41,-16],[41,-2],[37,0],[-39,0],[-43,-2],[-43,-18],[-45,-19]],wood.ink);
  r(-41,-19,80,17,wood.shade);
  r(-38,-16,67,13,wood.base);
  r(-37,-16,27,1,wood.light);
  r(9,-16,17,1,wood.light);
  r(31,-17,9,14,wood.recess);
  r(-39,-18,82,2,wood.ink);
  r(-37,-12,18,7,wood.shade);
  r(-17,-12,22,7,wood.shade);
  r(7,-12,20,7,wood.shade);
  r(-36,-11,16,2,'#865c49');
  r(-16,-11,20,2,'#865c49');
  r(8,-11,18,2,'#865c49');
  r(-40,-4,79,2,wood.ink);
  r(-38,-4,62,1,wood.base);
  silhouette(c,[[-43,-24],[-39,-37],[38,-37],[43,-24],[41,-21],[-41,-21]],wood.light);
  silhouette(c,[[-42,-25],[-38,-36],[37,-36],[41,-24],[-42,-24]],'#a58158');
  r(-35,-35,60,1,wood.rim);
  r(-33,-33,64,1,'#8e6649');
  r(-26,-32,13,1,'#b58c60');
  r(13,-28,22,1,'#93704e');
  r(-43,-24,84,2,wood.rim);
  r(-42,-22,83,2,wood.base);
  r(-36,-23,19,1,'#d3aa78');
  r(29,-22,8,1,'#bb8c60');
}

function openCase(c) {
  const r = (x, y, w, h, color) => rectangle(c, x, y, w, h, color);
  silhouette(c,[[-13,-5],[-11,-13],[10,-13],[12,-4],[10,0],[-12,0]],wood.ink);
  r(-10,-12,20,5,velvet.shade);
  r(-9,-11,17,2,velvet.base);
  silhouette(c,[[-11,-6],[10,-6],[12,-3],[10,-1],[-11,-1]],velvet.base);
  r(-10,-6,18,1,velvet.light);
  // One wand catches the counter light against the open velvet.
  r(-8,-4,16,1,wood.rim);
  r(-8,-3,4,1,brass.light);
  r(-11,-1,21,1,wood.light);
  r(-1,-1,3,1,brass.light);
}

function woodSamples(c) {
  const r = (x, y, w, h, color) => rectangle(c, x, y, w, h, color);
  silhouette(c,[[-8,-3],[-7,-13],[-4,-14],[-3,-5],[0,-20],[3,-20],[4,-6],[5,-16],[8,-14],[8,-4],[5,0],[-5,0]],wood.ink);
  r(-6,-12,2,8,wood.rim);
  r(1,-19,2,14,'#926044');
  r(5,-14,2,10,'#a39474');
  silhouette(c,[[-8,-6],[-5,-8],[5,-8],[8,-6],[6,-2],[4,0],[-4,0],[-7,-2]],wood.shade);
  r(-6,-6,12,2,wood.light);
  r(-5,-3,6,2,wood.base);
  r(-3,-6,2,1,wood.rim);
}

function measuringTape(c) {
  const r = (x, y, w, h, color) => rectangle(c, x, y, w, h, color);
  silhouette(c,[[-8,-2],[-7,-5],[-3,-6],[-1,-4],[3,-4],[3,-7],[7,-7],[8,-5],[7,-2],[4,-1],[0,-1],[-3,-3],[-6,-1]],brass.ink);
  silhouette(c,[[-7,-2],[-6,-4],[-3,-5],[-1,-3],[4,-3],[5,-6],[7,-6],[6,-3],[4,-2],[0,-2],[-3,-4],[-6,-2]],brass.light);
  r(-6,-4,1,1,brass.shade);
  r(0,-3,1,1,brass.shade);
  r(5,-5,1,1,brass.shade);
}

function scales(c) {
  const r = (x, y, w, h, color) => rectangle(c, x, y, w, h, color);
  r(-2,-16,4,13,brass.ink);
  r(-1,-16,2,13,brass.light);
  silhouette(c,[[-9,-15],[-4,-16],[-1,-18],[2,-18],[6,-16],[10,-15],[10,-13],[5,-14],[0,-15],[-6,-14],[-9,-13]],brass.shade);
  r(-8,-15,16,1,brass.base);
  r(0,-18,2,1,brass.rim);
  for (const x of [-8,6]) {
    silhouette(c,[[x+1,-14],[x+2,-14],[x+5,-6],[x+4,-6],[x+1,-12],[x-1,-6],[x-2,-6]],brass.base);
    silhouette(c,[[x-3,-7],[x+6,-7],[x+4,-4],[x,-4]],brass.shade);
    r(x-2,-7,7,1,brass.light);
  }
  silhouette(c,[[-6,-2],[-3,-4],[3,-4],[6,-2],[6,0],[-6,0]],brass.ink);
  r(-4,-2,7,1,brass.base);
  r(-3,-3,5,1,brass.light);
}

function bell(c) {
  const r = (x, y, w, h, color) => rectangle(c, x, y, w, h, color);
  silhouette(c,[[-6,-2],[-5,-4],[-4,-7],[-1,-8],[-1,-9],[1,-9],[1,-8],[4,-6],[5,-3],[6,-2],[5,0],[-5,0]],brass.ink);
  silhouette(c,[[-4,-3],[-3,-6],[-1,-7],[2,-7],[3,-6],[4,-3]],brass.base);
  r(-2,-6,2,3,brass.light);
  r(-2,-6,1,1,brass.rim);
  r(-5,-2,10,1,brass.light);
}

function quillAndInk(c) {
  const r = (x, y, w, h, color) => rectangle(c, x, y, w, h, color);
  silhouette(c,[[-3,-5],[-2,-12],[1,-18],[5,-21],[8,-22],[7,-18],[5,-13],[2,-12],[-1,-5]],paper.shade);
  silhouette(c,[[-2,-9],[0,-15],[4,-19],[7,-21],[6,-17],[4,-15],[2,-15]],paper.rim);
  silhouette(c,[[-6,-3],[-5,-7],[-3,-8],[-3,-10],[1,-10],[1,-8],[3,-6],[3,-2],[1,0],[-4,0]],iron.ink);
  r(-5,-6,5,5,iron.base);
  r(-4,-6,2,3,iron.light);
  r(-3,-9,4,1,iron.light);
}

function ledger(c) {
  const r = (x, y, w, h, color) => rectangle(c, x, y, w, h, color);
  silhouette(c,[[-10,-1],[-9,-9],[-5,-10],[-1,-9],[1,-10],[10,-9],[11,-2],[7,0],[-3,-1],[-7,0]],velvet.ink);
  silhouette(c,[[-9,-2],[-8,-8],[-5,-9],[-1,-8],[-1,-2],[-5,-3]],paper.base);
  silhouette(c,[[0,-2],[0,-8],[3,-9],[9,-8],[10,-3],[6,-3]],paper.rim);
  r(-7,-7,4,1,paper.shade);
  r(-7,-5,4,1,paper.shade);
  r(2,-7,5,1,paper.shade);
  r(2,-5,4,1,paper.shade);
  r(-1,-1,2,1,velvet.light);
}

function travelTrunk(c) {
  // The station trunk travels naturally with this shop's stock. Clip away the
  // overlapping suitcase and rescale the leather trunk as a single native prop.
  c.save();
  c.translate(0,-1);
  c.scale(.7,.7);
  c.beginPath();
  c.rect(-28,-35,56,37);
  c.clip();
  drawStationCargo(c,'trunks',0,0);
  c.restore();
}

function stool(c) {
  // The house bench painter supplies the seat, apron and peg legs.
  drawRefinedFurniture(c,{kind:'bench',x:-10,y:-12,w:20,h:7});
  rectangle(c,-7,-7,3,2,brass.shade);
  rectangle(c,4,-7,3,2,brass.shade);
  rectangle(c,-7,-7,1,1,brass.light);
  rectangle(c,4,-7,1,1,brass.light);
}

function stainedGlassLamp(c) {
  const r = (x, y, w, h, color) => rectangle(c, x, y, w, h, color);
  silhouette(c,[[-8,-2],[-5,-5],[-2,-6],[-2,-28],[2,-28],[2,-6],[6,-4],[8,-2],[7,0],[-7,0]],iron.ink);
  r(-1,-24,2,19,iron.base);
  r(-1,-22,1,10,brass.base);
  r(-5,-3,9,2,iron.base);
  r(-4,-3,3,1,brass.light);
  silhouette(c,[[-12,-25],[-10,-31],[-7,-37],[-4,-40],[-1,-41],[0,-43],[2,-43],[3,-40],[7,-37],[11,-30],[12,-25],[9,-23],[-9,-23]],iron.ink);
  silhouette(c,[[-10,-26],[-7,-33],[-4,-38],[2,-39],[6,-36],[9,-30],[10,-26],[7,-24],[-7,-24]],glass.shade);
  silhouette(c,[[-9,-27],[-6,-34],[-3,-35],[-4,-27],[-6,-25]],glass.green);
  silhouette(c,[[-3,-27],[-2,-36],[2,-38],[4,-32],[4,-25],[0,-25]],glass.gold);
  silhouette(c,[[5,-33],[8,-28],[9,-26],[6,-25],[5,-27]],glass.plum);
  r(-1,-34,2,5,glass.core);
  r(-8,-25,16,2,brass.shade);
  r(-6,-25,8,1,brass.light);
}

function pottedFern(c) {
  const r = (x, y, w, h, color) => rectangle(c, x, y, w, h, color);
  silhouette(c,[[-12,-11],[-9,-15],[8,-15],[12,-11],[10,-4],[7,-1],[-7,-1],[-10,-4]],'#463938');
  silhouette(c,[[-10,-11],[-8,-13],[7,-13],[10,-11],[8,-4],[6,-2],[-6,-2],[-8,-5]],'#9c644b');
  silhouette(c,[[-9,-10],[-6,-12],[-5,-7],[-3,-3],[-6,-3],[-8,-6]],'#bf8261');
  silhouette(c,[[0,-12],[8,-12],[10,-10],[6,-3],[-1,-3],[3,-6]],'#74463c');
  r(-10,-11,20,2,'#bc7b5e');
  r(-8,-12,16,1,'#514137');
  r(-8,-10,6,1,'#d39a6c');
  // The same broad fronds found along Wildbound forest paths.
  drawJungleFern(c,{x:0,y:-12,seed:2},0,0);
}

const propDefinitions = [
  ['wand_box_cabinet', 42, 64, cabinet, 4],
  ['rolling_ladder', 16, 56, ladder],
  ['sorting_counter', 90, 38, counter],
  ['velvet_case', 26, 13, openCase],
  ['wood_samples', 16, 20, woodSamples],
  ['measuring_tape', 16, 7, measuringTape],
  ['brass_scales', 23, 18, scales],
  ['counter_bell', 12, 9, bell],
  ['quill_ink', 16, 22, quillAndInk],
  ['ledger', 22, 10, ledger],
  ['travel_trunk', 39, 26, travelTrunk],
  ['ladder_stool', 20, 20, stool],
  ['stained_glass_lamp', 24, 43, stainedGlassLamp],
  ['potted_fern', 33, 34, pottedFern],
];

const props = new Map(propDefinitions.map(([kind,w,h,paint,variants=1]) => [
  kind, {id: 'ollivanders:'+kind, kind, w, h, paint, variants, shop: 'ollivanders'},
]));

export const OLLIVANDERS_ASSETS = [
  ...OLLIVANDERS_ARCHITECTURE_ASSETS,
  ...[...props.values()].map(({id,kind,w,h,shop}) => ({id,kind,w,h,shop})),
];

// These finite per-prop variants are the complete cache key space. No camera,
// light level, or player position ever invalidates the raster.
const rasters = new Map();
export const ollivandersPropRasterCount = () => rasters.size;

export function drawOllivandersAsset(c, id, x, y, scale = 1, {variant = 0} = {}) {
  const kind = id.replace(/^ollivanders:/,'');
  const prop = props.get(kind);
  if (!prop) return drawOllivandersArchitecturalAsset(c, id, x, y, scale);
  const view = Number.isFinite(variant) ? Math.abs(Math.trunc(variant)) % prop.variants : 0;
  c.save();
  c.translate(Math.round(x),Math.round(y));
  c.scale(scale,scale);
  c.imageSmoothingEnabled = false;
  if (typeof document === 'undefined') {
    prop.paint(c,view);
  } else {
    const key = prop.id+':'+view;
    const margin = 3;
    const left = Math.ceil(prop.w / 2) + margin;
    const top = prop.h + margin;
    let sprite = rasters.get(key);
    if (!sprite) {
      sprite = document.createElement('canvas');
      sprite.width = left * 2 + 1;
      sprite.height = top + margin;
      const painter = sprite.getContext('2d');
      painter.imageSmoothingEnabled = false;
      painter.translate(left,top);
      prop.paint(painter,view);
      rasters.set(key,sprite);
    }
    c.drawImage(sprite,-left,-top);
  }
  c.restore();
  return true;
}
