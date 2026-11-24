import { pixelPolygon } from './pixel-shapes.mjs';

export const WITCH_HAT_PALETTES = Object.freeze({
  witch_hat: Object.freeze({outline:'#252e29', underside:'#344033', shadow:'#43563d', body:'#5c734b', light:'#879359'}),
  witch_hat_plum: Object.freeze({outline:'#2d2635', underside:'#443548', shadow:'#574364', body:'#725783', light:'#9675a5'}),
  witch_hat_slate: Object.freeze({outline:'#222d36', underside:'#303e4e', shadow:'#3f5366', body:'#526d85', light:'#7891a3'}),
  witch_hat_russet: Object.freeze({outline:'#392824', underside:'#543833', shadow:'#714738', body:'#975f44', light:'#b88358'}),
});

const fittings = {leather:'#43352e', brass:'#b89457', glint:'#ddba76'};

// Skull-relative views in S, SW, W, NW, N, NE, E, SE order. The point leans
// back from the face, and the near and far brim separate as the hat turns.
const views = [
  {
    brim:[[-12,-5],[-10,-7],[-6,-8],[6,-8],[10,-7],[12,-5],[8,-3],[-8,-3]],
    brimLight:[[-11,-6],[-7,-7],[0,-7],[-3,-5],[-8,-5]],
    crown:[[-6,-8],[-5,-13],[-3,-17],[-1,-21],[2,-21],[5,-18],[6,-17],[3,-18],[2,-16],[3,-13],[6,-8]],
    shadow:[[2,-20],[5,-18],[3,-18],[2,-16],[4,-13],[6,-8],[0,-8],[2,-13]],
    light:[[-5,-10],[-4,-15],[-1,-19],[1,-19],[-1,-14],[-2,-10]],
    band:[[-6,-10],[-2,-9],[3,-9],[5,-10],[6,-8],[-6,-8]], buckle:[-1,-9],
  },
  {
    brim:[[-12,-6],[-8,-8],[4,-8],[10,-7],[12,-5],[7,-3],[-8,-4]],
    brimLight:[[-11,-6],[-7,-7],[-2,-7],[-3,-5],[-7,-5]],
    crown:[[-6,-8],[-4,-12],[-1,-16],[4,-19],[8,-20],[11,-19],[10,-17],[7,-17],[4,-15],[3,-11],[6,-7]],
    shadow:[[8,-19],[10,-19],[9,-17],[6,-17],[4,-15],[4,-11],[6,-7],[2,-8],[1,-12],[5,-16]],
    light:[[-4,-10],[-2,-14],[2,-17],[6,-18],[4,-16],[0,-13],[-1,-10]],
    band:[[-6,-10],[-2,-9],[3,-9],[5,-10],[6,-7],[-5,-8]], buckle:[-4,-9],
  },
  {
    brim:[[-12,-5],[-7,-7],[6,-7],[11,-6],[12,-4],[7,-3],[-8,-3]],
    brimLight:[[-11,-5],[-7,-6],[-1,-6],[-3,-5],[-8,-4]],
    crown:[[-6,-7],[-4,-12],[-1,-15],[4,-19],[9,-20],[12,-18],[10,-17],[7,-17],[4,-14],[3,-10],[6,-7]],
    shadow:[[8,-19],[11,-18],[8,-17],[5,-14],[4,-10],[6,-7],[1,-7],[0,-11],[3,-15]],
    light:[[-4,-9],[-3,-12],[1,-16],[5,-18],[7,-18],[4,-16],[1,-13],[-1,-9]],
    band:[[-6,-9],[-3,-8],[2,-8],[5,-9],[6,-7],[-6,-7]], buckle:[-5,-8],
  },
  {
    brim:[[-11,-7],[-6,-10],[2,-10],[10,-9],[12,-7],[7,-4],[-5,-3],[-9,-4]],
    brimLight:[[-10,-7],[-6,-9],[-2,-9],[-3,-7],[-6,-5],[-8,-5]],
    crown:[[-6,-9],[-6,-13],[-3,-16],[2,-17],[7,-16],[12,-14],[10,-12],[7,-13],[3,-12],[4,-9],[6,-8]],
    shadow:[[4,-16],[8,-15],[11,-14],[9,-13],[5,-13],[3,-11],[6,-8],[0,-8],[0,-12]],
    light:[[-5,-11],[-5,-13],[-2,-15],[2,-16],[5,-15],[1,-14],[-2,-12],[-2,-10]],
    band:[[-6,-11],[-3,-10],[2,-10],[4,-11],[6,-8],[-6,-9]],
  },
  {
    brim:[[-11,-6],[-7,-8],[6,-8],[10,-7],[12,-5],[7,-3],[-7,-3],[-10,-4]],
    brimLight:[[-10,-6],[-6,-7],[-1,-7],[-3,-5],[-8,-5]],
    crown:[[-6,-8],[-4,-13],[-3,-18],[-1,-21],[2,-20],[4,-17],[3,-15],[4,-12],[6,-8]],
    shadow:[[0,-20],[3,-19],[4,-17],[3,-15],[5,-11],[6,-8],[0,-8],[1,-13]],
    light:[[-5,-10],[-4,-14],[-2,-18],[-1,-19],[-1,-15],[-2,-10]],
    band:[[-6,-10],[-3,-9],[3,-9],[5,-10],[6,-8],[-6,-8]],
  },
  {
    brim:[[-12,-7],[-9,-9],[2,-10],[8,-9],[11,-7],[8,-4],[-5,-3],[-10,-5]],
    brimLight:[[-11,-7],[-8,-8],[-3,-8],[-4,-6],[-8,-5]],
    crown:[[-6,-8],[-5,-10],[-8,-13],[-12,-15],[-11,-17],[-6,-17],[0,-15],[4,-12],[6,-9],[5,-8]],
    shadow:[[-4,-16],[0,-15],[5,-12],[6,-9],[4,-8],[0,-8],[0,-12]],
    light:[[-10,-16],[-7,-16],[-3,-15],[-1,-12],[-3,-10],[-5,-11],[-7,-14]],
    band:[[-6,-10],[-3,-10],[2,-10],[5,-11],[6,-9],[5,-8],[-6,-8]],
  },
  {
    brim:[[-12,-4],[-10,-6],[-6,-7],[7,-7],[12,-5],[8,-3],[-7,-3]],
    brimLight:[[-11,-5],[-7,-6],[-2,-6],[-3,-4],[-8,-4]],
    crown:[[-6,-7],[-4,-10],[-7,-14],[-11,-17],[-12,-19],[-8,-20],[-4,-18],[0,-16],[4,-12],[6,-7]],
    shadow:[[-5,-18],[-1,-16],[4,-12],[6,-7],[1,-7],[1,-11],[-3,-15]],
    light:[[-11,-19],[-8,-18],[-5,-16],[-4,-13],[-2,-10],[-3,-9],[-5,-11],[-7,-15]],
    band:[[-6,-9],[-3,-8],[2,-8],[5,-9],[6,-7],[-6,-7]], buckle:[3,-8],
  },
  {
    brim:[[-12,-5],[-9,-7],[-3,-8],[7,-8],[12,-5],[8,-4],[-8,-3]],
    brimLight:[[-11,-6],[-8,-7],[-3,-7],[-3,-5],[-8,-5]],
    crown:[[-6,-7],[-4,-11],[-6,-15],[-10,-17],[-11,-19],[-8,-20],[-4,-19],[1,-16],[4,-12],[6,-8]],
    shadow:[[-4,-18],[1,-16],[4,-12],[6,-8],[2,-8],[0,-12],[-2,-14]],
    light:[[-10,-19],[-7,-19],[-4,-17],[-3,-14],[-1,-11],[-2,-10],[-4,-12],[-6,-16]],
    band:[[-6,-9],[-2,-9],[3,-9],[5,-10],[6,-8],[-6,-7]], buckle:[2,-9],
  },
];

// A compact three-quarter icon keeps the opening silhouette above the rim at
// 24 pixels and uses the same cloth and fitting colors as the wearable.
const icon = {
  brim:[[-10,-6],[-7,-8],[3,-8],[8,-7],[10,-5],[6,-3],[-7,-3]],
  brimLight:[[-9,-6],[-5,-7],[0,-7],[-2,-5],[-6,-5]],
  crown:[[-5,-8],[-4,-12],[-1,-16],[4,-19],[7,-20],[9,-19],[8,-17],[5,-17],[3,-14],[3,-11],[5,-8]],
  shadow:[[7,-19],[8,-18],[5,-17],[3,-14],[3,-11],[5,-8],[0,-8],[1,-12],[3,-15]],
  light:[[-4,-10],[-3,-13],[0,-16],[3,-18],[5,-18],[2,-15],[0,-12],[-1,-10]],
  band:[[-5,-10],[-2,-9],[2,-9],[4,-10],[5,-8],[-5,-8]], buckle:[-2,-9],
};

const left = -14, top = -23, width = 29, height = 23;
const neighbors = [[1,0],[-1,0],[0,1],[0,-1]];
const index = (x, y) => (y-top)*width+x-left;

function fitHat(view, worn) {
  const crownBase=Math.max(...view.crown.map(([,y])=>y));
  const nearEdge=Math.max(...view.brim.map(([,y])=>y));
  const widthScale=worn?.86:1;
  const brimPoint=([x,y])=>[Math.round(x*widthScale),Math.round(nearEdge+(worn?1:0)+(y-nearEdge)*.78)];
  const crownPoint=([x,y])=>[Math.round(x*widthScale),Math.round(crownBase+(worn?2:1)+(y-crownBase)*(worn?.91:1))];
  return {
    brim:view.brim.map(brimPoint), brimLight:view.brimLight.map(brimPoint),
    crown:view.crown.map(crownPoint), shadow:view.shadow.map(crownPoint),
    light:view.light.map(crownPoint), band:view.band.map(crownPoint),
    buckle:view.buckle&&crownPoint(view.buckle),
  };
}

function rasterize(view) {
  const pixels = Array(width*height).fill(null);
  const pen = {
    fillStyle:null,
    fillRect(x, y, w) {
      for (let column = x; column < x+w; column++) pixels[index(column,y)] = this.fillStyle;
    },
  };
  const shape = (vertices, color) => pixelPolygon(pen, vertices.map(([x,y]) => ({x,y})), color);

  shape(view.brim, 'shadow');
  const lowerBrim = Math.max(...view.brim.map(([,y]) => y)) - 1;
  for (let y = lowerBrim; y < top+height; y++) {
    for (let x = left; x < left+width; x++) {
      const pixel = index(x,y);
      if (pixels[pixel]) pixels[pixel] = 'underside';
    }
  }
  shape(view.brimLight, 'light');
  shape(view.crown, 'body');
  shape(view.shadow, 'shadow');
  shape(view.light, 'light');
  shape(view.band, 'leather');

  if (view.buckle) {
    const [x,y] = view.buckle;
    pen.fillStyle = 'brass';
    pen.fillRect(x,y,3);
    pen.fillRect(x,y+1,3);
    pixels[index(x,y)] = 'glint';
    pixels[index(x+1,y+1)] = 'leather';
  }
  // Outline the assembled hat once so the brim and crown read as one object.
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

const wornRuns = views.map(view=>rasterize(fitHat(view,true)));
const iconRuns = rasterize(fitHat(icon,false));

function paint(c, runs, x, y, id) {
  const palette = Object.hasOwn(WITCH_HAT_PALETTES,id) ? WITCH_HAT_PALETTES[id] : WITCH_HAT_PALETTES.witch_hat;
  for (const [dx,dy,w,role] of runs) {
    c.fillStyle = palette[role] ?? fittings[role];
    c.fillRect(x+dx,y+dy,w,1);
  }
}

export function drawWitchHat(c, h, d, id = 'witch_hat') {
  paint(c,wornRuns[d],Math.round(h.x),Math.round(h.y),id);
  return true;
}

export function drawWitchHatIcon(c, id = 'witch_hat') {
  paint(c,iconRuns,12,22,id);
}
