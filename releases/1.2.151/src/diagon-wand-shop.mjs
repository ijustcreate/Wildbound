import {OLLIVANDERS_ASSETS, drawOllivandersAsset} from './diagon-wand-shop-assets.mjs';
import {
  drawOllivandersGround, drawOllivandersArchitecture,
} from './diagon-wand-shop-architecture.mjs';
import {
  OLLIVANDERS_FURNITURE, OLLIVANDERS_LAYOUT, ollivandersRoomOpen,
} from './diagon-wand-shop-layout.mjs';
import {drawForestAsset} from './forest-props.mjs';
import {drawForestTree} from './forest-tree-art.mjs';
import {pixelPolygon} from './pixel-shapes.mjs';
import {alleyMerchantActor} from './diagon-alley.mjs';

export {OLLIVANDERS_ASSETS};

const {counter, halfDepth} = OLLIVANDERS_LAYOUT;

// One counter display shares a ground depth. Its objects sit on the top plane
// even when the adventurer stands immediately in front of the cabinet.
const counterDisplay = [
  ['quill_ink', -36, -30],
  ['ledger', -23, -27],
  ['velvet_case', 1, -26],
  ['brass_scales', 25, -28],
  ['counter_bell', 37, -24],
];

const rockGarden = [
  ['forest_round_shrub_medium', -125, -25, 47],
  ['forest_moss_rock_pair', -122, 12, 36],
  ['forest_round_shrub_small', -91, 106, 48],
  ['forest_woodland_daisy', -58, 105, 38],
  ['forest_moss_rock_scatter', -129, 99, 41],
  ['forest_round_shrub_small', 93, 108, 43],
  ['forest_meadow_tuft', 137, 39, 34],
  ['forest_limestone_pebble', 152, -37, 44],
  ['forest_meadow_tuft', 140, -51, 38],
];

const apronBounds = {x: -188, y: -147, w: 380, h: 286};
let apron;

const apronShape = (c, points, color) =>
  pixelPolygon(c, points.map(([x,y]) => ({x,y})), color);

function paintApron(c) {
  // Paint the worn ground first. Broken edge clusters carry the native
  // woodland greens into the slate alley without a square backdrop.
  apronShape(c, [
    [-184,-101],[-165,-130],[-128,-144],[-66,-134],[-31,-136],[7,-127],
    [63,-119],[103,-116],[143,-92],[150,-61],[148,-40],[178,-31],[191,-26],
    [191,32],[158,37],[151,63],[157,83],[135,112],[107,130],[62,128],
    [30,137],[-10,128],[-65,132],[-113,128],[-145,120],[-176,95],[-177,58],
    [-186,25],[-176,-6],[-181,-42],
  ], '#535c4b');
  apronShape(c, [
    [-184,-101],[-165,-130],[-128,-144],[-79,-134],[-88,-115],[-147,-90],
    [-149,-55],[-174,-37],[-179,-52],
  ], '#52644c');
  apronShape(c, [
    [-175,66],[-159,72],[-149,97],[-115,117],[-79,119],[-91,130],
    [-132,126],[-154,115],[-174,92],
  ], '#606a4b');
  apronShape(c, [
    [134,66],[157,79],[145,100],[121,119],[101,129],[66,128],
    [77,114],[106,107],[125,85],
  ], '#58664b');

  const outline = [
    [-155,-91],[-138,-105],[89,-105],[123,-91],[138,-64],[142,-28],
    [174,-24],[191,-21],[191,25],[174,27],[141,28],[135,54],[125,92],
    [101,111],[-125,111],[-148,98],[-157,70],
  ];
  apronShape(c, outline, '#454d42');
  c.save();
  c.beginPath();
  outline.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
  c.closePath();
  c.clip();
  c.fillStyle = '#56584d';
  c.fillRect(-157,-106,349,217);
  const tones = ['#808173','#757869','#888678','#6d7467','#918978'];
  for (let row = 0; row < 16; row++) {
    for (let column = 0; column < 19; column++) {
      const v = (row * 17 + column * 13 + row * column * 3) % 31;
      const x = -170 + column * 21 + (row % 2) * 10;
      const y = -108 + row * 14;
      const lit = y > 69 || x > 106;
      const color = tones[(v + (lit ? 0 : 1)) % tones.length];
      apronShape(c, [[x+1,y+3],[x+4,y+1],[x+18,y+1],[x+20,y+4],
        [x+19,y+11],[x+15,y+13],[x+3,y+13],[x+1,y+10]], color);
      if (v % 4 === 0) {
        c.fillStyle = '#a09b87';
        c.fillRect(x+5,y+2,9,2);
      }
    }
  }
  c.restore();
  const moss = [
    [[-151,-61],[-141,-66],[-136,-59],[-125,-55],[-132,-49],[-153,-48]],
    [[-156,53],[-143,55],[-135,64],[-140,71],[-150,69]],
    [[-129,93],[-110,92],[-102,98],[-86,100],[-93,111],[-129,111]],
    [[80,108],[95,101],[115,98],[122,89],[130,94],[115,110]],
    [[123,-52],[135,-49],[147,-37],[146,-31],[138,-33],[126,-43]],
  ];
  for (const points of moss) apronShape(c, points, '#535e43');
  const scatter = [
    [-164,-76,7,2],[-147,-119,12,3],[-156,-113,5,2],[-173,-15,6,2],
    [-173,77,8,3],[-161,96,5,2],[-126,120,9,2],[-118,123,6,2],
    [98,121,10,2],[121,105,6,2],[138,89,7,2],[148,-34,7,2],
  ];
  c.fillStyle = '#7d8060';
  for (const [x,y,w,h] of scatter) c.fillRect(x,y,w,h);
}

export function drawOllivandersApron(c, shop) {
  const {x,y,w,h} = apronBounds;
  if (!apron && typeof document !== 'undefined') {
    apron = document.createElement('canvas');
    apron.width = w;
    apron.height = h;
    const pen = apron.getContext('2d');
    pen.translate(-x,-y);
    paintApron(pen);
  }
  if (apron) {
    c.drawImage(apron, shop.x + x, shop.y + y);
  } else {
    c.save();
    c.translate(shop.x, shop.y);
    paintApron(c);
    c.restore();
  }
}

const courtyardCache = new WeakMap();

function courtyard(shop) {
  if (!courtyardCache.has(shop)) {
    const plants = rockGarden.map(([forestAsset,x,y,size]) => ({
      forestAsset, x: shop.x+x, y: shop.y+y, rootY: shop.y+y, size,
    }));
    const tree = {
      kind: 'tree', treeType: 'birch', seed: 1107, size: 72,
      x: shop.x - 123, y: shop.y - 56, rootY: shop.y - 56, season: 'summer',
    };
    courtyardCache.set(shop, {plants,tree});
  }
  return courtyardCache.get(shop);
}

export function ollivandersFloor(c, shop, open = true) {
  drawOllivandersApron(c, shop);
  drawOllivandersGround(c, shop, open);
}

export function ollivandersSubjects(shop) {
  return OLLIVANDERS_FURNITURE.map(prop => ({
    shopAsset: 'ollivanders:' + prop.kind,
    x: shop.x + prop.x,
    y: shop.y + prop.y,
    depth: shop.y + prop.y,
    variant: prop.variant,
    display: prop.kind === 'sorting_counter',
  }));
}

export function drawOllivandersSubject(c, prop) {
  drawOllivandersAsset(c, prop.shopAsset, prop.x, prop.y, 1, {variant: prop.variant});
  if (prop.shopAsset === 'ollivanders:travel_trunk') {
    drawOllivandersAsset(c, 'wood_samples', prop.x + 1, prop.y - 19);
  }
  if (!prop.display) return;
  for (const [kind, x, y] of counterDisplay) {
    drawOllivandersAsset(c, kind, prop.x + x, prop.y + y);
  }
  drawOllivandersAsset(c, 'measuring_tape', prop.x + 24, prop.y - 23);
}

export function ollivandersKeeper(shop) {
  return alleyMerchantActor(shop);
}

export function assembleOllivanders(c, shop, g, objects) {
  const open = ollivandersRoomOpen(shop, g.players);
  ollivandersFloor(c, shop, open);
  const {plants,tree} = courtyard(shop);
  for (const plant of plants) {
    objects.push({depth: plant.rootY, paint: () => drawForestAsset(c, plant, g.time, g)});
  }
  objects.push({depth: tree.rootY, paint: () => drawForestTree(c, tree, g.time, g)});

  if (!open) {
    objects.push({depth: shop.y + halfDepth, paint: () => {
      drawOllivandersArchitecture(c, shop, false);
    }});
    return;
  }

  drawOllivandersArchitecture(c, shop, true);
  for (const subject of ollivandersSubjects(shop)) objects.push(subject);
  const keeper = ollivandersKeeper(shop);
  objects.push({depth: keeper.y, player: keeper});
}
