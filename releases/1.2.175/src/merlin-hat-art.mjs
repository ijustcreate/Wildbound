import {pixelPolygon} from './pixel-shapes.mjs';
import {witchHatFrame} from './witch-hat-motion.mjs';

export const MERLIN_HAT_BOUNDS = Object.freeze({left:-13, right:13, top:-29, bottom:-3});

const ink = '#232942';
const palette = {
  cloth:'#46699a', rear:'#3e5c86', fold:'#314a73', light:'#7192bc', crease:'#3e5985',
  gold:'#d5ab5e', bright:'#eed18a', faded:'#b18a55',
};

// The cone narrows directly from the seated hem. Its loose peak folds toward
// the nape, which changes the visible profile as the head turns.
const south = {
  outline:[[-8,-5],[-7,-11],[-5,-17],[-4,-21],[-1,-25],[2,-27],[5,-27],[8,-25],[9,-22],
    [7,-22],[6,-23],[4,-22],[2,-19],[3,-15],[5,-11],[7,-7],[7,-5],[4,-3],[-4,-3]],
  light:[[-7,-7],[-6,-11],[-4,-17],[-3,-21],[-1,-24],[2,-26],[5,-26],[3,-25],
    [1,-22],[0,-19],[-1,-14],[-3,-10],[-4,-6]],
  fold:[[5,-26],[8,-25],[8,-22],[6,-23],[3,-22],[2,-19],[3,-15],[5,-11],[7,-7],
    [6,-5],[3,-5],[2,-11],[1,-15],[0,-18],[1,-22]],
  stars:[[-1,-13,2],[3,-8,1],[1,-20,1]],
};
const southwest = {
  outline:[[-8,-5],[-7,-10],[-5,-16],[-1,-22],[3,-26],[6,-27],[9,-26],[11,-23],
    [10,-21],[8,-23],[5,-22],[3,-19],[3,-15],[4,-12],[6,-8],[7,-6],[5,-4],[1,-3],[-5,-3]],
  light:[[-7,-7],[-6,-10],[-4,-15],[0,-21],[4,-25],[7,-26],[5,-24],[2,-21],
    [0,-17],[-2,-12],[-3,-7]],
  fold:[[7,-26],[9,-26],[11,-23],[10,-22],[8,-23],[5,-22],[3,-19],[3,-15],[4,-12],[6,-8],
    [6,-6],[2,-5],[1,-10],[1,-14],[2,-18],[3,-22]],
  stars:[[-2,-12,2],[2,-7,1],[3,-21,1]],
};
const west = {
  outline:[[-7,-5],[-6,-10],[-4,-15],[-1,-20],[3,-24],[7,-26],[10,-25],[11,-22],
    [11,-20],[9,-22],[7,-22],[5,-20],[3,-16],[3,-12],[5,-8],[6,-5],[3,-4],[-4,-3]],
  light:[[-6,-7],[-5,-11],[-2,-17],[1,-21],[5,-24],[8,-25],[6,-23],[3,-21],
    [0,-16],[-2,-12],[-2,-7]],
  fold:[[8,-25],[10,-25],[11,-22],[10,-21],[8,-22],[5,-20],[3,-16],[3,-12],[5,-8],
    [5,-5],[2,-5],[1,-10],[1,-15],[3,-19],[5,-22]],
  stars:[[-1,-11,2],[0,-18,1]],
};
const northwest = {
  outline:[[-8,-5],[-7,-10],[-6,-15],[-3,-20],[1,-23],[5,-25],[8,-24],[10,-22],
    [11,-20],[9,-19],[7,-21],[4,-21],[2,-19],[2,-15],[4,-11],[7,-7],[7,-5],[3,-4],[-5,-4]],
  light:[[-7,-6],[-6,-11],[-5,-15],[-2,-19],[2,-22],[5,-24],[6,-23],[2,-21],
    [0,-18],[-2,-14],[-3,-9],[-4,-6]],
  fold:[[6,-24],[8,-24],[10,-22],[10,-20],[8,-20],[6,-21],[3,-20],[2,-17],[3,-14],
    [5,-10],[7,-6],[2,-5],[0,-10],[-1,-15],[1,-19],[3,-22]],
  stars:[[1,-9,2],[-1,-16,1]],
};
const north = {
  outline:[[-8,-5],[-7,-10],[-5,-14],[-4,-18],[-5,-21],[-7,-21],[-8,-20],[-9,-20],[-9,-23],
    [-7,-25],[-4,-25],[-1,-24],[3,-21],[5,-17],[6,-12],[8,-7],[7,-5],[3,-4],[-4,-4]],
  light:[[-8,-24],[-5,-24],[-2,-23],[1,-21],[2,-18],[1,-15],[0,-17],[-2,-20],[-5,-21],[-7,-21]],
  fold:[[0,-23],[3,-21],[5,-17],[6,-12],[8,-7],[7,-5],[3,-5],[3,-9],[2,-14],[2,-18]],
  stars:[[1,-11,2],[-3,-8,1]],
};
const northeast = {
  outline:[[-7,-5],[-7,-8],[-4,-12],[-2,-16],[-3,-19],[-6,-21],[-8,-21],[-11,-19],
    [-11,-21],[-9,-23],[-6,-25],[-2,-24],[2,-22],[5,-18],[6,-13],[8,-7],[7,-5],[3,-4],[-4,-4]],
  light:[[-10,-22],[-7,-24],[-4,-24],[-1,-22],[1,-19],[1,-16],[-1,-13],[-3,-9],
    [-5,-6],[-5,-9],[-3,-13],[-2,-17],[-4,-20],[-7,-22]],
  fold:[[-2,-23],[2,-22],[5,-18],[6,-13],[8,-7],[6,-5],[2,-5],[1,-10],[1,-15],[1,-19]],
  stars:[[-1,-9,2],[0,-17,1]],
};
const east = {
  outline:[[-6,-5],[-5,-9],[-3,-13],[-3,-16],[-5,-20],[-8,-22],[-11,-20],[-11,-23],
    [-9,-25],[-6,-26],[-2,-24],[2,-21],[4,-17],[6,-12],[7,-7],[7,-5],[4,-3],[-3,-4]],
  light:[[-10,-23],[-8,-25],[-5,-25],[-2,-23],[1,-20],[1,-17],[-1,-15],[-1,-13],
    [-3,-10],[-4,-7],[-5,-6],[-4,-10],[-3,-13],[-3,-17],[-5,-20],[-8,-23]],
  fold:[[-2,-23],[2,-21],[4,-17],[6,-12],[7,-7],[6,-5],[2,-5],[2,-12],[1,-16],[0,-20]],
  stars:[[2,-11,2],[-1,-18,1]],
};
const southeast = {
  outline:[[-7,-6],[-5,-10],[-3,-15],[-3,-19],[-5,-22],[-8,-23],[-10,-21],[-11,-23],
    [-8,-26],[-5,-27],[-1,-26],[3,-22],[5,-18],[6,-13],[8,-7],[8,-5],[5,-3],[0,-3],[-5,-4]],
  light:[[-10,-24],[-7,-26],[-4,-26],[-1,-24],[1,-21],[1,-17],[-1,-14],[-2,-9],[-4,-6],
    [-5,-7],[-3,-12],[-3,-16],[-3,-20],[-5,-23],[-8,-24]],
  fold:[[-1,-25],[3,-22],[5,-18],[6,-13],[8,-7],[7,-5],[4,-4],[3,-10],[2,-15],[1,-19]],
  stars:[[1,-13,2],[4,-8,1],[-2,-21,1]],
};

const views = [south, southwest, west, northwest, north, northeast, east, southeast];
const posesByView = views.map(() => new Map());
const {left, right, top, bottom} = MERLIN_HAT_BOUNDS;
const width = right-left, height = bottom-top;
const index = (x,y) => (y-top)*width+x-left;

function rasterize(view, facing, sway = 0, scale = 1) {
  const pixels = Array(width*height).fill(null);
  const pen = {
    fillStyle:null,
    fillRect(x,y,span) {
      if (y < top || y >= bottom) return;
      for (let px = Math.max(left,x); px < Math.min(right,x+span); px++) pixels[index(px,y)] = this.fillStyle;
    },
  };
  const rear = facing >= 3 && facing <= 5;
  const lean = facing >= 4 ? -1 : 1;
  const point = ([x,y]) => {
    const loose = Math.max(0,(-y-12)/15);
    return {x:(x+sway*1.1*loose*loose)*scale, y:bottom+(y-bottom+sway*lean*.53*loose*loose)*scale};
  };
  const paint = (points,color) => pixelPolygon(pen,points.map(point),color);
  paint(view.outline,rear ? palette.rear : palette.cloth);
  const coverage = pixels.slice();
  paint(view.fold,palette.fold);
  paint(view.light,rear ? palette.crease : palette.light);

  for (const [x,y,spread] of view.stars) {
    const center = point([x,y]);
    const cx = Math.round(center.x), cy = Math.round(center.y);
    const star = spread === 2 && scale === 1 ? 2 : 1;
    const colors = rear ? [palette.faded,palette.gold] : [palette.gold,palette.bright];
    pen.fillStyle = colors[0];
    for (let offset = -star; offset <= star; offset++) pen.fillRect(cx,cy+offset,1);
    pen.fillRect(cx-star,cy,star*2+1);
    pen.fillStyle = colors[1];
    pen.fillRect(cx,cy,1);
  }

  const spans = [];
  for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
    const offset = index(x,y);
    if (!coverage[offset]) continue;
    const edge = x===left || x===right-1 || !coverage[offset-1] || !coverage[offset+1] ||
      !coverage[offset-width] || !coverage[offset+width];
    const color = edge ? ink : pixels[offset];
    const run = spans.at(-1);
    if (run && run[1]===y && run[0]+run[2]===x && run[3]===color) run[2]++;
    else spans.push([x,y,1,color]);
  }
  return spans;
}

function draw(c, spans, x, y) {
  for (const [dx,dy,width,color] of spans) {
    c.fillStyle = color;
    c.fillRect(x+dx,y+dy,width,1);
  }
}

export function drawMerlinHat(c,h,d,motion) {
  const {crown} = witchHatFrame(motion);
  const facing = Number.isInteger(d) && views[d] ? d : 0;
  const poses = posesByView[facing];
  if (!poses.has(crown)) poses.set(crown,rasterize(views[facing],facing,crown));
  draw(c,poses.get(crown),Math.round(h.x),Math.round(h.y));
  return true;
}

const icon = rasterize(southwest,1,0,.76);
export function drawMerlinHatIcon(c) {
  draw(c,icon,12,22);
}
