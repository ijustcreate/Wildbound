import { hoodOpening } from './headwear-geometry.mjs';
import { pixelPolygon } from './pixel-shapes.mjs';

// The five constructed views turn from front to back. Opposite-side views use
// the same shell geometry, with the lit edge placed in screen space afterward.
const SCOUT = [
  {crown:[[-6,-5],[-5,-8],[-3,-9],[0,-8],[3,-9],[5,-8],[6,-5]], rim:[[-9,-4],[-6,-6],[6,-6],[9,-4],[7,-3],[-6,-3]]},
  {crown:[[-6,-5],[-5,-8],[-2,-9],[1,-8],[3,-9],[5,-7],[6,-5]], rim:[[-9,-4],[-6,-6],[6,-6],[8,-5],[5,-3],[-6,-3]]},
  {crown:[[-5,-5],[-5,-8],[-2,-9],[0,-8],[4,-8],[5,-5]], rim:[[-9,-4],[-5,-5],[6,-6],[9,-5],[7,-4],[-7,-3]]},
  {crown:[[-5,-5],[-5,-8],[-2,-9],[3,-9],[5,-7],[6,-5]], rim:[[-8,-5],[-5,-6],[5,-6],[8,-5],[6,-3],[-5,-3]]},
  {crown:[[-6,-5],[-5,-8],[-2,-9],[3,-9],[5,-8],[6,-5]], rim:[[-8,-4],[-6,-6],[6,-6],[8,-4],[6,-3],[-6,-3]]},
];
const SAFARI = [
  {crown:[[-6,-5],[-6,-7],[-4,-10],[-2,-11],[2,-11],[5,-9],[6,-6],[6,-5]], rim:[[-8,-5],[-5,-6],[5,-6],[8,-5],[6,-3],[-6,-3]]},
  {crown:[[-6,-5],[-6,-7],[-4,-10],[-1,-11],[3,-10],[5,-8],[6,-5]], rim:[[-8,-5],[-5,-6],[5,-6],[8,-5],[5,-3],[-6,-3]]},
  {crown:[[-6,-5],[-6,-7],[-4,-10],[-1,-11],[3,-10],[5,-8],[6,-5]], rim:[[-9,-4],[-6,-6],[5,-6],[8,-5],[5,-4],[-6,-3]]},
  {crown:[[-5,-5],[-5,-8],[-2,-11],[2,-11],[5,-9],[6,-6]], rim:[[-7,-5],[-4,-6],[6,-7],[8,-5],[5,-3],[-5,-3]]},
  {crown:[[-6,-5],[-5,-8],[-3,-10],[-1,-11],[2,-11],[5,-9],[6,-5]], rim:[[-7,-5],[-4,-6],[4,-6],[8,-5],[6,-3],[-5,-3]]},
];
const MARLOW = [
  {crown:[[-5,-5],[-5,-9],[-3,-10],[-1,-10],[1,-9],[4,-10],[5,-8],[5,-5]], rim:[[-10,-5],[-7,-6],[6,-6],[10,-5],[8,-4],[5,-3],[-6,-3]]},
  {crown:[[-5,-6],[-5,-9],[-2,-10],[0,-9],[4,-10],[6,-8],[6,-5]], rim:[[-10,-5],[-7,-4],[-5,-6],[7,-7],[10,-6],[8,-4],[6,-3],[-7,-4]]},
  {crown:[[-5,-6],[-5,-9],[-2,-10],[2,-9],[4,-10],[6,-8],[6,-6]], rim:[[-10,-5],[-7,-5],[-3,-5],[7,-7],[10,-7],[9,-5],[5,-4],[-8,-3]]},
  {crown:[[-5,-6],[-5,-9],[-2,-10],[2,-10],[5,-9],[6,-6]], rim:[[-9,-6],[-6,-7],[6,-7],[10,-6],[7,-4],[4,-3],[-7,-4]]},
  {crown:[[-5,-6],[-5,-8],[-3,-10],[2,-10],[5,-9],[6,-6]], rim:[[-9,-6],[-6,-7],[6,-7],[9,-6],[7,-4],[4,-3],[-6,-3]]},
];

const LINEN_CROWNS = [
  [[-6,-4],[-6,-7],[-4,-9],[-2,-10],[2,-10],[5,-8],[6,-5],[4,-3],[-4,-3]],
  [[-6,-4],[-6,-7],[-4,-9],[-1,-10],[3,-10],[5,-8],[6,-5],[4,-3],[-5,-3]],
  [[-6,-4],[-6,-7],[-4,-9],[-1,-10],[2,-10],[5,-8],[6,-5],[4,-3],[-3,-3]],
  [[-6,-4],[-6,-7],[-4,-9],[-2,-10],[3,-10],[6,-8],[6,-4],[4,-3],[-4,-3]],
  [[-6,-4],[-6,-7],[-4,-9],[-2,-10],[2,-10],[5,-8],[6,-5],[5,-3],[-5,-3]],
];
const LINEN_BILLS = [
  [[-6,-4],[-4,-5],[4,-5],[6,-4],[4,-2],[-5,-2]],
  [[-8,-3],[-5,-5],[1,-5],[2,-3],[-4,-2],[-7,-2]],
  [[-8,-3],[-5,-5],[-1,-5],[1,-4],[-4,-2],[-8,-2]],
  [[-6,-3],[-5,-4],[1,-4],[0,-3]],
  [[-5,-4],[5,-4],[4,-3],[-4,-3]],
];

const INKCAPS = [
  [[-6,-6],[-5,-10],[-3,-13],[-1,-16],[2,-16],[5,-14],[3,-14],[1,-13],[2,-11],[5,-6]],
  [[-6,-6],[-5,-10],[-2,-13],[2,-15],[6,-16],[8,-15],[7,-14],[4,-14],[1,-11],[2,-8],[5,-6]],
  [[-6,-5],[-4,-9],[-1,-13],[4,-15],[7,-15],[9,-14],[8,-13],[5,-13],[3,-11],[2,-8],[5,-6]],
  [[-5,-7],[-5,-11],[-2,-14],[2,-15],[7,-14],[8,-12],[6,-12],[3,-13],[1,-11],[4,-8]],
  [[-5,-7],[-4,-11],[-2,-15],[1,-16],[3,-14],[3,-10],[5,-7]],
];
const INKCAP_RIMS = [
  [[-9,-4],[-7,-7],[6,-7],[9,-5],[7,-3],[-7,-3]],
  [[-9,-4],[-7,-7],[7,-7],[9,-6],[7,-4],[4,-3],[-7,-3]],
  [[-9,-4],[-7,-6],[5,-6],[9,-7],[8,-5],[5,-4],[-8,-3]],
  [[-8,-5],[-6,-7],[7,-8],[9,-6],[7,-4],[3,-3],[-6,-3]],
  [[-8,-5],[-6,-7],[5,-7],[8,-5],[6,-4],[3,-3],[-5,-3]],
];

const SANTA_CAPS = [
  [[-6,-4],[-5,-8],[-3,-10],[0,-12],[2,-11],[4,-9],[5,-6],[6,-4]],
  [[-6,-4],[-5,-8],[-2,-10],[1,-12],[4,-11],[7,-9],[7,-6],[5,-5],[3,-7],[4,-4]],
  [[-6,-4],[-5,-8],[-2,-10],[1,-12],[4,-11],[7,-9],[8,-6],[7,-5],[4,-6],[3,-8],[4,-4]],
  [[-6,-4],[-5,-8],[-2,-10],[1,-11],[4,-10],[7,-8],[8,-5],[6,-4],[3,-6],[4,-4]],
  [[-6,-4],[-5,-8],[-3,-10],[0,-11],[3,-10],[5,-8],[6,-4],[3,-3],[-5,-3]],
];
const SANTA_CUFFS = [
  [[-6,-5],[-4,-6],[4,-6],[6,-5],[6,-3],[3,-2],[-4,-2],[-6,-3]],
  [[-6,-5],[-4,-6],[3,-6],[6,-5],[6,-3],[3,-2],[-5,-2],[-6,-3]],
  [[-6,-5],[-4,-6],[0,-6],[5,-5],[5,-3],[1,-2],[-5,-3],[-6,-4]],
  [[-6,-5],[-3,-6],[2,-6],[6,-5],[5,-3],[1,-2],[-4,-3]],
  [[-6,-5],[-4,-6],[4,-6],[6,-5],[5,-3],[1,-2],[-5,-3]],
];

const LEATHER_HOODS = [
  [[-7,1],[-7,-5],[-5,-9],[-3,-10],[3,-10],[6,-8],[7,-4],[7,2],[5,4],[2,5],[-3,5],[-6,3]],
  [[-7,1],[-7,-5],[-5,-9],[-2,-10],[3,-10],[6,-8],[7,-3],[6,4],[3,5],[-2,4],[-6,3]],
  [[-7,1],[-7,-5],[-5,-8],[-3,-10],[2,-10],[6,-8],[7,-5],[7,1],[4,5],[1,5],[-3,4],[-6,3]],
  [[-7,0],[-7,-4],[-5,-8],[-2,-10],[3,-10],[6,-8],[7,-4],[6,2],[3,5],[-1,6],[-5,4]],
  [[-7,-1],[-7,-5],[-5,-9],[-2,-10],[3,-10],[6,-8],[7,-4],[6,1],[4,4],[1,6],[-1,6],[-5,3]],
];
const RANGER_HOODS = [
  [[-7,1],[-7,-5],[-5,-9],[-2,-10],[1,-11],[4,-9],[6,-7],[7,-3],[7,2],[5,5],[1,6],[-3,5],[-6,3]],
  [[-7,0],[-7,-5],[-5,-9],[-2,-10],[1,-11],[5,-10],[7,-8],[7,-4],[7,1],[5,5],[2,6],[-3,4],[-6,3]],
  [[-7,0],[-7,-4],[-5,-8],[-2,-10],[2,-11],[7,-11],[8,-10],[6,-8],[7,-5],[7,1],[5,5],[2,6],[-4,4],[-6,3]],
  [[-7,0],[-7,-4],[-5,-8],[-2,-10],[2,-11],[7,-10],[8,-9],[6,-7],[7,-3],[6,2],[3,5],[0,7],[-4,5]],
  [[-7,0],[-7,-4],[-5,-8],[-2,-10],[1,-11],[4,-10],[6,-8],[7,-3],[6,2],[4,4],[1,7],[-1,7],[-5,4]],
];

const SHELLS = [
  [[-7,-3],[-6,-7],[-3,-10],[2,-10],[5,-8],[7,-5],[7,-3],[5,-2],[3,-4],[-3,-4],[-5,-2]],
  [[-7,-3],[-6,-7],[-3,-10],[2,-10],[5,-8],[7,-5],[7,-3],[4,-2],[2,-4],[-4,-4],[-6,-2]],
  [[-6,-3],[-6,-7],[-3,-10],[1,-10],[4,-9],[7,-6],[8,-4],[6,-3],[3,-3],[1,-4],[-5,-4]],
  [[-6,-3],[-6,-7],[-3,-9],[2,-10],[5,-8],[7,-6],[7,-3],[4,-2],[2,-1],[-3,-3]],
  [[-6,-3],[-6,-7],[-3,-10],[2,-10],[5,-8],[6,-5],[6,-3],[3,-2],[1,-1],[-1,-1],[-4,-2]],
];

const GOURDS = [
  [[-7,-3],[-6,-5],[-4,-6],[0,-6],[3,-6],[6,-5],[7,-3],[7,1],[5,3],[2,4],[-3,4],[-6,2]],
  [[-7,-3],[-6,-5],[-4,-6],[2,-6],[5,-5],[7,-3],[7,1],[4,3],[1,4],[-3,4],[-6,2]],
  [[-6,-3],[-5,-5],[-3,-6],[1,-6],[4,-5],[6,-3],[6,1],[4,3],[1,4],[-3,4],[-5,2]],
  [[-7,-3],[-5,-5],[-2,-6],[2,-6],[5,-5],[7,-3],[7,1],[5,3],[1,4],[-2,4],[-6,2]],
  [[-7,-3],[-6,-5],[-3,-6],[3,-6],[6,-5],[7,-3],[7,1],[5,3],[2,4],[-3,4],[-6,2]],
];

const fixed = {
  santa_hat:{ink:'#38282c', dark:'#82343b', base:'#bd4245', light:'#dc6260', fur:'#eee7d1', furShade:'#b6bba9'},
  jack_o_lantern:{dark:'#893d21', base:'#bb5526', light:'#e99443', rib:'#d06a2a', stem:'#64663c', stemLight:'#899052', amber:'#ffdc71'},
};

const point = (x,y) => `${x},${y}`;
const worldFacing = d => d <= 4 ? d : 8-d;

function pixelPlan(d) {
  const pixels = new Map(), mirror = d > 4 ? -1 : 1;
  const scan = (vertices, action, flip = mirror) => {
    const pen = {fillRect(x,y,w) {for(let n=0;n<w;n++)action(point(x+n,y));}};
    pixelPolygon(pen,vertices.map(([x,y])=>({x:x*flip,y})),false);
  };
  return {
    pixels,
    shape(vertices,role) {scan(vertices,key=>pixels.set(key,role));},
    shade(vertices,role) {scan(vertices,key=>{if(pixels.has(key))pixels.set(key,role);});},
    cut(vertices) {scan(vertices,key=>pixels.delete(key),1);},
    mark(x,y,role) {const key=point(x*mirror,y);if(pixels.has(key))pixels.set(key,role);},
    edge(fromY = -12) {
      const original = new Set(pixels.keys());
      for(const key of original){
        const [x,y] = key.split(',').map(Number);
        if (!original.has(point(x,y+1)) || !original.has(point(x+1,y))) pixels.set(key,'ink');
        else if (y < fromY && !original.has(point(x-1,y))) pixels.set(key,'light');
      }
    },
  };
}

function buildBrim(plan, view, parts, kind) {
  const {shape,shade,mark,edge} = plan;
  shape(parts.rim, 'dark');
  shade([[-10,-6],[-5,-7],[4,-7],[3,-5],[-8,-4]], 'base');
  shape(parts.crown, 'base');
  shade([[-6,-9],[-3,-12],[1,-12],[0,-8],[-2,-6],[-6,-6]], 'light');
  shade([[1,-11],[6,-10],[8,-7],[6,-5],[2,-5],[3,-8]], 'dark');
  edge(-7);
  shade([[-6,-6],[-3,-6],[0,-5],[4,-6],[6,-6],[5,-5],[-5,-5]], 'leather');
  if (kind === 'safari' && view < 3) {
    const buckle = [0,-2,-4][view];
    mark(buckle,-6,'trim');mark(buckle+1,-6,'shine');
  } else if (kind === 'marlow' && view < 3) {
    const tuck = [2,-3,-4][view];
    mark(tuck,-5,'trim');
  }
}

function buildLinen(plan, view) {
  const {shape,shade,mark,edge} = plan;
  shape(LINEN_CROWNS[view],'base');
  shade([[-5,-9],[-2,-10],[1,-10],[0,-7],[-3,-6],[-5,-6]],'light');
  shade([[2,-10],[6,-8],[6,-3],[1,-3],[3,-7]],'dark');
  shape(LINEN_BILLS[view],view > 2 ? 'dark' : 'base');
  edge(-8);
  const seam = [0,-2,-3,-1,0][view];
  mark(seam,-8,'light'); mark(seam,-7,'dark');
  if (view < 3) mark(view === 0 ? -3 : -5,-3,'light');
}

function buildInkcap(plan, view) {
  const {shape,shade,mark,edge} = plan;
  shape(INKCAP_RIMS[view],'dark');
  shade([[-9,-5],[-5,-7],[2,-7],[0,-5],[-6,-4]],'base');
  shape(INKCAPS[view],'base');
  shade([[-5,-8],[-3,-12],[2,-15],[6,-16],[3,-13],[0,-11],[-1,-8]],'light');
  shade([[1,-12],[7,-16],[9,-14],[4,-13],[3,-10],[6,-6],[0,-6]],'dark');
  edge(-8);
  shade([[-5,-8],[-2,-7],[4,-8],[5,-7],[2,-6],[-5,-6]],'leather');
  if (view < 3) {
    const nib = [-2,-3,-4][view];
    mark(nib,-7,'trim');mark(nib+1,-9,'shine');mark(nib+1,-8,'trim');
  }
}

function buildSanta(plan, view) {
  const {shape,shade,mark,edge} = plan;
  shape(SANTA_CAPS[view],'base');
  shade([[-5,-8],[-2,-11],[1,-12],[2,-11],[-1,-8],[-2,-5],[-5,-5]],'light');
  shade([[3,-11],[6,-10],[8,-8],[8,-5],[4,-5],[2,-7]],'dark');
  shape(SANTA_CUFFS[view],'fur');
  shade([[-6,-4],[-3,-3],[2,-3],[6,-4],[6,-2],[-6,-2]],'furShade');
  edge();
  const [x,y] = [[3,-9],[7,-6],[8,-5],[7,-4],[1,-4]][view];
  shape([[x-1,y-1],[x+1,y-1],[x+2,y],[x+1,y+2],[x-1,y+2],[x-2,y]],'fur');
  mark(x+1,y,'furShade');mark(x,y+1,'furShade');
}

function buildHood(plan, d, kind) {
  const view = worldFacing(d), {shape,shade,cut,mark,edge} = plan;
  const leather = kind === 'leather_hood';
  shape((leather ? LEATHER_HOODS : RANGER_HOODS)[view],'base');
  shade([[-7,-6],[-4,-10],[-1,-11],[3,-9],[1,-7],[-3,-6],[-5,1],[-7,2]], 'light');
  shade([[2,-10],[7,-8],[8,-2],[7,3],[2,7],[1,4],[3,0],[3,-5]], 'dark');
  if (view < 3) {
    cut(hoodOpening(d));
    // The opening can separate a few edge pixels from a narrow cheek seam.
    // Keep the cloth joined to its crown after clipping the bare face.
    const start = [...plan.pixels.keys()].find(key=>Number(key.split(',')[1])<=-8);
    const pending = [start], connected = new Set();
    while (pending.length) {
      const pixel = pending.pop();
      if (!plan.pixels.has(pixel) || connected.has(pixel)) continue;
      connected.add(pixel);
      const [x,y] = pixel.split(',').map(Number);
      pending.push(point(x+1,y),point(x-1,y),point(x,y+1),point(x,y-1));
    }
    for (const pixel of plan.pixels.keys()) if (!connected.has(pixel)) plan.pixels.delete(pixel);
  }
  edge(-7);
  if (view < 3) {
    const lip = [0,-2,-4][view];
    mark(lip,-7,leather ? 'dark' : 'light');
    mark(lip-1,-7,leather ? 'dark' : 'light');
  } else {
    shade([[-4,-4],[-2,-2],[0,-1],[3,-4],[3,-3],[0,1],[-3,-2]], 'dark');
    mark(0,-1,'dark');
    if (!leather) mark(view===3 ? 2 : 0,2,'light');
  }
}

function buildShell(plan, view) {
  const {shape,shade,mark,edge} = plan;
  shape(SHELLS[view],'base');
  shade([[-6,-7],[-3,-10],[1,-10],[3,-8],[1,-6],[-3,-5],[-6,-5]],'light');
  shade([[2,-10],[6,-9],[8,-6],[7,-3],[1,-2],[0,-4],[3,-6]],'dark');
  edge(-8);
  const ridge = [0,-2,-3,3,0][view];
  mark(ridge,-9,'light'); mark(ridge+1,-8,'base'); mark(ridge+2,-7,'light');
  const lip = [-5,-5,-5,2,0][view];
  mark(lip,-4,'light');mark(lip+1,-4,'base');
}

function buildGourd(plan, view) {
  const {shape,shade,mark,edge} = plan;
  shape(GOURDS[view],'base');
  shade([[-6,-3],[-4,-6],[-1,-6],[-2,-3],[-2,1],[-4,2],[-6,0]],'light');
  shade([[2,-6],[6,-5],[7,-3],[7,2],[4,3],[1,3],[3,0],[3,-3]],'dark');
  shade([[-2,-6],[0,-6],[0,-4],[-1,-2],[-1,1],[0,3],[-2,3],[-3,0],[-3,-2]],'rib');
  edge();
  const stem = [0,1,1,-1,0][view];
  shape([[stem-1,-6],[stem-1,-8],[stem+1,-8],[stem+2,-7],[stem+1,-6]],'stem');
  mark(stem,-8,'stemLight');
  if (view > 2) return;
  const eyes = [[-4,2],[-4,1],[-4]][view];
  for (const x of eyes) {
    mark(x,-4,'ink');mark(x-1,-3,'ink');mark(x,-3,'amber');mark(x+1,-3,'ink');
    mark(x+1,-2,'ember');mark(x,-2,'amber');
  }
  if (view === 0) mark(-2,-3,'ink');
  const mouth = view===2 ? -4 : -3;
  const width = view===2 ? 3 : 7;
  for(let x=mouth;x<mouth+width;x++) {
    mark(x,0,'ink');mark(x,x%2===0 ? 2 : 1,'amber');
  }
  if (view !== 2) mark(view === 0 ? 0 : -1,-1,'ember');
}

const designs = new Map([
  ['hat',(plan,view)=>buildBrim(plan,view,SCOUT[view],'scout')],
  ['linen_cap',buildLinen],
  ['safari_hat',(plan,view)=>buildBrim(plan,view,SAFARI[view],'safari')],
  ['marlow_hat',(plan,view)=>buildBrim(plan,view,MARLOW[view],'marlow')],
  ['alley_inkcap',buildInkcap], ['santa_hat',buildSanta],
  ['leather_hood',(plan,view,d)=>buildHood(plan,d,'leather_hood')],
  ['ranger_hood',(plan,view,d)=>buildHood(plan,d,'ranger_hood')],
  ['alan_turtle_helmet',buildShell], ['jack_o_lantern',buildGourd],
]);

const artwork = new Map([...designs].map(([id,build]) => [id, Array.from({length:8},(_,d) => {
  const plan = pixelPlan(d);
  build(plan,worldFacing(d),d);
  const pixels = [...plan.pixels].map(([key,role])=>[...key.split(',').map(Number),role]);
  return {pixels, indexed:plan.pixels};
})]));

function material(id,p,time) {
  return {...p,...fixed[id],ember:Math.sin(time*11)>0 ? '#fff1a1' : '#f08b37'};
}

export function drawClothHeadwear(c,h,d,id,p,time=0) {
  const view = artwork.get(id)?.[d];
  if (!view) return false;
  const colors = material(id,p,time), x = Math.round(h.x), y = Math.round(h.y);
  for (const [dx,dy,role] of view.pixels) {
    c.fillStyle = colors[role];
    c.fillRect(x+dx,y+dy,1,1);
  }
  return true;
}

export function drawClothHeadwearIcon(c,id,p) {
  const view = artwork.get(id)?.[id === 'jack_o_lantern' ? 0 : 1];
  if (!view) return false;
  const {indexed,pixels} = view;
  const xMin = Math.min(...pixels.map(([x])=>x)), yMin = Math.min(...pixels.map(([,y])=>y));
  const w = Math.max(...pixels.map(([x])=>x))-xMin+1, h = Math.max(...pixels.map(([,y])=>y))-yMin+1;
  const scale = Math.min(20/w,20/h), width = Math.round(w*scale), height = Math.round(h*scale);
  const left = Math.floor((24-width)/2), top = Math.floor((24-height)/2);
  const colors = material(id,p,0);
  for (let y=0;y<height;y++) {
    for (let x=0;x<width;x++) {
      const source = point(xMin+Math.floor((x+.5)*w/width),yMin+Math.floor((y+.5)*h/height));
      const role = indexed.get(source);
      if (!role) continue;
      c.fillStyle = colors[role];
      c.fillRect(x+left,y+top,1,1);
    }
  }
  return true;
}
