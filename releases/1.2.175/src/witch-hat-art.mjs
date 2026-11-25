import { pixelPolygon } from './pixel-shapes.mjs';
import { witchHatFrame } from './witch-hat-motion.mjs';

export const WITCH_HAT_PALETTES = Object.freeze({
  witch_hat: Object.freeze({outline:'#252e29', underside:'#344033', shadow:'#43563d', body:'#5c734b', light:'#879359'}),
  witch_hat_plum: Object.freeze({outline:'#2d2635', underside:'#443548', shadow:'#574364', body:'#725783', light:'#9675a5'}),
  witch_hat_slate: Object.freeze({outline:'#222d36', underside:'#303e4e', shadow:'#3f5366', body:'#526d85', light:'#7891a3'}),
  witch_hat_russet: Object.freeze({outline:'#392824', underside:'#543833', shadow:'#714738', body:'#975f44', light:'#b88358'}),
  witch_hat_parchment: Object.freeze({outline:'#3d342e', underside:'#5c4b42', shadow:'#aa9079', body:'#e3cfad', light:'#fff1d1'}),
});

const fittings = {leather:'#43352e', brass:'#b89457', glint:'#ddba76'};
export const WITCH_HAT_BOUNDS = Object.freeze({left:-17, right:17, top:-23, bottom:-1});

// Skull-local drawings in S, SW, W, NW, N, NE, E, SE order. The upper
// contour rolls back from a broad seated crown. The front ends of the brim
// turn up in profile while the nape and the middle of the brim stay seated.
const views = [
  {
    brim:[[-13,-6],[-10,-7],[-5,-8],[5,-8],[10,-7],[13,-5],[11,-3],[5,-2],[-5,-2],[-10,-3]],
    top:[[-13,-6],[-10,-7],[-5,-8],[5,-8],[10,-7],[13,-5],[8,-4],[1,-4],[-5,-3],[-10,-4]],
    rim:[[-12,-6],[-7,-7],[-3,-6],[-6,-5],[-10,-5]],
    crown:[[-6,-6],[-5,-12],[-3,-17],[-1,-20],[3,-21],[6,-20],[4,-19],[3,-17],[3,-14],[6,-7]],
    shade:[[2,-20],[5,-20],[4,-19],[3,-17],[3,-14],[6,-7],[1,-6],[1,-11],[0,-14]],
    light:[[-5,-9],[-4,-13],[-2,-18],[1,-20],[3,-20],[1,-17],[-1,-13],[-1,-9]],
    band:[[-6,-8],[-2,-7],[3,-7],[5,-8],[6,-6],[2,-5],[-4,-5],[-6,-6]], clasp:[-1,-7],
  },
  {
    brim:[[-13,-7],[-10,-8],[-5,-8],[4,-7],[9,-8],[13,-7],[11,-4],[6,-3],[-4,-2],[-10,-3]],
    top:[[-13,-7],[-10,-8],[-5,-8],[4,-7],[9,-8],[13,-7],[10,-5],[5,-4],[-4,-3],[-10,-4]],
    rim:[[-12,-7],[-7,-7],[-4,-6],[-7,-5],[-11,-5]],
    crown:[[-6,-6],[-5,-11],[-3,-15],[1,-19],[5,-21],[9,-21],[11,-20],[8,-20],[6,-18],[4,-15],[4,-11],[6,-7]],
    shade:[[5,-21],[9,-21],[10,-20],[8,-20],[6,-18],[4,-15],[4,-11],[6,-7],[2,-6],[1,-10],[2,-15]],
    light:[[-5,-9],[-4,-12],[-1,-16],[3,-19],[6,-20],[4,-18],[1,-15],[-1,-11],[-1,-9]],
    band:[[-6,-8],[-2,-7],[2,-7],[5,-8],[6,-7],[3,-6],[-3,-5],[-6,-6]], clasp:[-4,-7],
  },
  {
    brim:[[-13,-8],[-10,-8],[-5,-6],[1,-6],[7,-7],[11,-7],[13,-6],[10,-4],[4,-3],[-4,-3],[-10,-5]],
    top:[[-13,-8],[-10,-8],[-5,-6],[1,-6],[7,-7],[11,-7],[13,-6],[9,-5],[3,-4],[-4,-4],[-10,-6]],
    rim:[[-13,-8],[-10,-8],[-5,-6],[-3,-5],[-7,-5],[-11,-6]],
    crown:[[-6,-6],[-5,-11],[-2,-16],[2,-19],[7,-21],[11,-21],[13,-20],[10,-20],[7,-18],[5,-15],[4,-11],[5,-6]],
    shade:[[7,-21],[11,-21],[12,-20],[9,-20],[7,-18],[5,-15],[4,-11],[5,-6],[1,-6],[1,-11],[3,-15]],
    light:[[-5,-8],[-4,-12],[-1,-16],[3,-19],[7,-20],[5,-18],[1,-15],[-1,-11],[-1,-8]],
    band:[[-6,-8],[-2,-7],[3,-7],[5,-8],[5,-6],[1,-5],[-4,-5],[-6,-6]], clasp:[-5,-7],
  },
  {
    brim:[[-12,-8],[-9,-10],[-4,-10],[3,-9],[10,-8],[13,-6],[10,-4],[5,-3],[-5,-3],[-10,-5]],
    top:[[-12,-8],[-9,-10],[-4,-10],[3,-9],[10,-8],[13,-6],[9,-5],[4,-4],[-5,-4],[-10,-6]],
    rim:[[-11,-8],[-8,-9],[-4,-9],[-3,-7],[-7,-6],[-10,-7]],
    crown:[[-6,-7],[-6,-12],[-3,-16],[1,-18],[5,-19],[9,-18],[12,-16],[10,-16],[7,-17],[4,-16],[3,-13],[4,-10],[7,-7]],
    shade:[[4,-19],[9,-18],[12,-16],[10,-16],[7,-17],[4,-16],[3,-13],[4,-10],[7,-7],[2,-6],[0,-11],[1,-15]],
    light:[[-5,-9],[-5,-12],[-2,-16],[2,-17],[5,-18],[3,-16],[-1,-14],[-2,-10]],
    band:[[-6,-9],[-3,-8],[2,-8],[5,-9],[7,-7],[3,-6],[-3,-6],[-6,-7]],
  },
  {
    brim:[[-13,-6],[-10,-8],[-5,-9],[4,-9],[10,-8],[13,-6],[10,-4],[5,-3],[-6,-3],[-11,-4]],
    top:[[-13,-6],[-10,-8],[-5,-9],[4,-9],[10,-8],[13,-6],[8,-5],[3,-4],[-6,-4],[-11,-5]],
    rim:[[-12,-6],[-8,-8],[-4,-8],[-3,-6],[-7,-5],[-10,-5]],
    crown:[[-6,-7],[-5,-12],[-3,-16],[-1,-19],[2,-20],[5,-18],[6,-16],[4,-17],[2,-17],[2,-14],[4,-11],[6,-7]],
    shade:[[1,-20],[5,-18],[6,-16],[4,-17],[2,-17],[2,-14],[4,-11],[6,-7],[2,-6],[-1,-10],[0,-15]],
    light:[[-5,-10],[-3,-15],[-1,-18],[1,-19],[1,-17],[-1,-14],[-2,-10]],
    band:[[-6,-9],[-2,-8],[3,-8],[5,-9],[6,-7],[3,-6],[-4,-6],[-6,-7]],
  },
  {
    brim:[[-13,-6],[-10,-8],[-4,-9],[4,-10],[9,-10],[12,-8],[10,-6],[5,-4],[-5,-3],[-10,-4]],
    top:[[-13,-6],[-10,-8],[-4,-9],[4,-10],[9,-10],[12,-8],[8,-6],[3,-5],[-5,-4],[-10,-5]],
    rim:[[-12,-6],[-8,-8],[-4,-8],[-3,-6],[-7,-5],[-10,-5]],
    crown:[[-7,-7],[-4,-10],[-3,-13],[-4,-16],[-7,-17],[-11,-16],[-13,-16],[-10,-18],[-6,-19],[-1,-18],[3,-16],[6,-12],[6,-7]],
    shade:[[-1,-18],[3,-16],[6,-12],[6,-7],[1,-6],[-1,-11],[-2,-15],[-5,-17]],
    light:[[-11,-17],[-7,-18],[-3,-17],[-1,-15],[-1,-12],[-3,-10],[-3,-13],[-5,-16],[-8,-17]],
    band:[[-6,-8],[-2,-8],[3,-8],[6,-9],[6,-7],[3,-6],[-3,-6],[-7,-7]],
  },
  {
    brim:[[-13,-6],[-10,-7],[-5,-7],[1,-6],[6,-6],[10,-8],[13,-8],[10,-5],[4,-3],[-4,-3],[-10,-4]],
    top:[[-13,-6],[-10,-7],[-5,-7],[1,-6],[6,-6],[10,-8],[13,-8],[10,-6],[4,-4],[-4,-4],[-10,-5]],
    rim:[[-12,-6],[-8,-7],[-4,-6],[-2,-5],[-7,-5],[-10,-5]],
    crown:[[-6,-6],[-4,-11],[-5,-15],[-7,-18],[-10,-20],[-13,-20],[-11,-21],[-7,-21],[-3,-20],[1,-17],[4,-13],[6,-6]],
    shade:[[-5,-20],[-2,-19],[1,-17],[4,-13],[6,-6],[1,-6],[0,-10],[-2,-14],[-4,-17]],
    light:[[-11,-20],[-7,-20],[-4,-18],[-2,-15],[-1,-12],[-2,-9],[-3,-12],[-4,-15],[-7,-18]],
    band:[[-6,-7],[-3,-7],[2,-7],[5,-8],[6,-6],[4,-5],[-1,-5],[-6,-6]], clasp:[3,-7],
  },
  {
    brim:[[-13,-7],[-10,-8],[-5,-7],[4,-8],[10,-8],[13,-7],[10,-3],[4,-2],[-5,-3],[-10,-4]],
    top:[[-13,-7],[-10,-8],[-5,-7],[4,-8],[10,-8],[13,-7],[10,-4],[4,-3],[-5,-4],[-10,-5]],
    rim:[[-12,-7],[-8,-7],[-4,-6],[-5,-5],[-9,-5]],
    crown:[[-6,-7],[-4,-11],[-4,-15],[-6,-18],[-8,-20],[-11,-20],[-9,-21],[-5,-21],[-1,-19],[3,-15],[5,-11],[6,-6]],
    shade:[[-4,-20],[-1,-19],[3,-15],[5,-11],[6,-6],[2,-6],[0,-10],[-1,-15],[-3,-18]],
    light:[[-9,-20],[-6,-20],[-3,-18],[-1,-15],[0,-12],[-2,-9],[-3,-13],[-4,-17],[-6,-19]],
    band:[[-6,-8],[-2,-7],[2,-7],[6,-8],[6,-6],[4,-5],[-2,-5],[-6,-7]], clasp:[2,-7],
  },
];

const left = -18, top = -23, width = 37, height = 23;
const neighbors = [[1,0],[-1,0],[0,1],[0,-1]];
const index = (x, y) => (y-top)*width+x-left;

function rasterize(view, crownFlex = 0, brimFlex = 0, icon = false, lean = 1) {
  const pixels = Array(width*height).fill(null);
  const pen = {
    fillStyle:null,
    fillRect(x, y, w) {
      for (let column = x; column < x+w; column++) pixels[index(column,y)] = this.fillStyle;
    },
  };
  const projectedX = x => icon ? x*.78 : x;
  const brimPoint = ([x,y]) => {
    const edge = Math.max(0, (Math.abs(x)-5)/8);
    return {x:projectedX(x), y:y-Math.sign(x)*brimFlex*.7*edge};
  };
  const crownPoint = ([x,y]) => {
    // The band is pinned to the skull. Only the cloth above it can bend.
    const height = Math.max(0, (-y-8)/13);
    const tip = Math.min(1, Math.max(0, (x*lean-1)/8));
    const fold = crownFlex*lean;
    return {
      x:projectedX(x)+crownFlex*1.6*height*height,
      y:y+fold*(fold>0 ? 2.2 : .6)*tip*height,
    };
  };
  const shape = (vertices, color, point) => pixelPolygon(pen, vertices.map(point), color);

  shape(view.brim, 'underside', brimPoint);
  shape(view.top, 'body', brimPoint);
  shape(view.rim, 'light', brimPoint);
  shape(view.crown, 'body', crownPoint);
  shape(view.shade, 'shadow', crownPoint);
  shape(view.light, 'light', crownPoint);
  shape(view.band, 'leather', ([x,y]) => ({x:projectedX(x),y}));

  if (view.clasp) {
    const [anchor,y] = view.clasp;
    const x = Math.round(projectedX(anchor));
    pen.fillStyle = 'brass';
    pen.fillRect(x,y,3);
    pen.fillRect(x,y+1,3);
    pixels[index(x,y)] = 'glint';
    pixels[index(x+1,y+1)] = 'leather';
  }
  // Outline the assembled silhouette once, so the bent crown and brim
  // remain connected and the bright rim reads as the edge of one felt piece.
  const coverage = pixels.slice();
  for (let y = top+1; y < top+height-1; y++) {
    for (let x = left+1; x < left+width-1; x++) {
      if (!coverage[index(x,y)]) continue;
      for (const [dx,dy] of neighbors) {
        const edge = index(x+dx,y+dy);
        if (!coverage[edge]) pixels[edge] = 'outline';
      }
    }
  }

  const runs = [];
  for (let y = top; y < top+height; y++) {
    let x = left;
    while (x < left+width) {
      const start = x, role = pixels[index(x,y)];
      do x++; while (x < left+width && pixels[index(x,y)] === role);
      if (role) runs.push([start,y,x-start,role]);
    }
  }
  return runs;
}

// Quantized poses keep sharp native pixels and bound per-view cache use to 25
// shapes, shared by every color. Identity transforms use the neutral pose.
const wornRuns = views.map(view => new Map([[12,rasterize(view)]]));
const iconRuns = rasterize(views[1], 0, 0, true);

function paint(c, runs, x, y, id) {
  const palette = Object.hasOwn(WITCH_HAT_PALETTES,id) ? WITCH_HAT_PALETTES[id] : WITCH_HAT_PALETTES.witch_hat;
  for (const [dx,dy,w,role] of runs) {
    c.fillStyle = palette[role] ?? fittings[role];
    c.fillRect(x+dx,y+dy,w,1);
  }
}

export function drawWitchHat(c, h, d, id = 'witch_hat', motion) {
  const {crown, brim} = witchHatFrame(motion);
  const key = (crown+2)*5+brim+2;
  const poses = wornRuns[d];
  let runs = poses.get(key);
  if (!runs) {
    runs = rasterize(views[d], crown, brim, false, d>=5 ? -1 : 1);
    poses.set(key, runs);
  }
  paint(c, runs, Math.round(h.x), Math.round(h.y), id);
  return true;
}

export function drawWitchHatIcon(c, id = 'witch_hat') {
  paint(c, iconRuns, 12, 22, id);
}
