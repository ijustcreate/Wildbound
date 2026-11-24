import { hoodOpening } from "./headwear-geometry.mjs";
import { pixelPolygon } from "./pixel-shapes.mjs";

// Skull-local integer pixels. S, SW, W, NW and N are separate turn drawings.
// Mirrored geometry keeps the broad upper-left light in screen space.
const cowls = {
  reaper_hood: [
    [[-8,3],[-7,-6],[-5,-9],[-1,-11],[3,-9],[6,-5],[7,3],[5,6],[2,4],[-3,6],[-6,7]],
    [[-8,2],[-7,-5],[-4,-9],[0,-11],[4,-8],[6,-5],[7,2],[6,6],[2,4],[-3,7],[-6,6]],
    [[-8,2],[-6,-4],[-4,-8],[1,-10],[6,-7],[7,-4],[6,0],[7,5],[4,6],[0,5],[-5,7],[-7,5]],
    [[-7,2],[-7,-4],[-4,-9],[0,-11],[5,-8],[7,-4],[7,3],[4,6],[0,5],[-4,7],[-6,5]],
    [[-7,2],[-6,-6],[-4,-9],[0,-11],[5,-8],[7,-3],[7,3],[5,6],[1,5],[-3,7],[-6,5]],
  ],
  warlock_hood: [
    [[-7,3],[-7,-5],[-5,-8],[-4,-10],[-2,-8],[0,-12],[2,-8],[5,-10],[6,-6],[7,-4],[7,3],[4,5],[0,6],[-4,5]],
    [[-7,3],[-7,-5],[-4,-10],[-2,-8],[-1,-12],[2,-8],[5,-9],[7,-4],[7,2],[6,5],[2,5],[-2,6],[-5,5]],
    [[-7,2],[-6,-4],[-4,-9],[-3,-11],[0,-8],[2,-11],[4,-8],[6,-8],[7,-4],[7,3],[4,5],[-1,6],[-5,5]],
    [[-7,1],[-6,-5],[-3,-10],[-1,-8],[1,-11],[4,-8],[6,-7],[7,-3],[7,3],[4,6],[0,5],[-5,6]],
    [[-7,2],[-7,-4],[-5,-7],[-4,-9],[-2,-8],[0,-11],[2,-8],[4,-9],[6,-6],[7,-3],[7,2],[5,5],[0,6],[-5,5]],
  ],
  ghost_hood: [
    [[-8,2],[-7,-4],[-5,-8],[-2,-10],[2,-10],[5,-8],[7,-5],[7,0],[8,5],[4,4],[2,6],[-1,4],[-4,7],[-5,4],[-8,4]],
    [[-8,2],[-7,-4],[-4,-8],[0,-10],[3,-10],[6,-7],[7,-3],[7,1],[8,5],[5,4],[3,6],[0,4],[-3,7],[-5,5],[-7,5]],
    [[-8,2],[-7,-4],[-5,-7],[-2,-9],[2,-10],[5,-8],[7,-5],[7,0],[8,4],[6,5],[4,4],[1,6],[-1,4],[-5,6],[-7,5]],
    [[-8,3],[-7,-4],[-4,-8],[-1,-10],[3,-10],[6,-7],[7,-2],[7,2],[7,5],[4,4],[3,7],[0,5],[-3,6],[-6,5]],
    [[-7,3],[-7,-5],[-4,-9],[0,-10],[4,-9],[7,-5],[7,1],[8,5],[5,4],[3,6],[1,4],[-2,7],[-4,5],[-7,5]],
  ],
  banshee_hood: [
    [[-8,4],[-7,-4],[-6,-8],[-3,-10],[0,-11],[4,-9],[6,-7],[7,-3],[8,4],[5,3],[4,6],[2,5],[0,4],[-2,5],[-5,6],[-6,3]],
    [[-8,3],[-7,-4],[-5,-8],[-1,-11],[3,-9],[6,-8],[7,-4],[8,4],[5,4],[4,6],[1,5],[-2,5],[-5,6],[-5,3]],
    [[-7,3],[-7,-3],[-5,-8],[-2,-10],[2,-10],[6,-9],[7,-7],[6,-4],[8,3],[6,5],[3,6],[0,4],[-3,5],[-5,3]],
    [[-7,4],[-6,-4],[-4,-8],[-1,-10],[3,-9],[6,-8],[7,-4],[8,3],[6,5],[3,6],[0,4],[-4,5]],
    [[-7,4],[-7,-3],[-5,-7],[-2,-9],[0,-10],[4,-8],[6,-7],[7,-3],[8,4],[5,5],[2,6],[0,7],[-3,6],[-6,5]],
  ],
};

const metal = {
  death_eater_ivory_mask: { ink:"#3a3032", dark:"#81645a", base:"#cdb58d", light:"#f5e3ba", shine:"#fff0ce", trim:"#a7494e", leather:"#594038" },
  death_eater_iron_mask: { ink:"#272638", dark:"#4f4a65", base:"#8181a0", light:"#aeb2c8", shine:"#d2cbec", trim:"#a96bbf", leather:"#49405e" },
  death_eater_copper_mask: { ink:"#39272d", dark:"#784941", base:"#b97545", light:"#e8ac68", shine:"#ffd598", trim:"#599f8e", leather:"#674240" },
};
const reaperCloth = { ink:"#242127", dark:"#34313b", base:"#4d4954", light:"#716973", shine:"#977f78" };
const ghostCloth = { ink:"#476c69", dark:"#77a59a", base:"#b5d6c4", light:"#e8f1d7", shine:"#f5fae4" };
const bone = { ink:"#342c32", dark:"#90816c", base:"#cdbd9b", light:"#ece0be", shine:"#fff0d1" };
const brass = { ink:"#775039", dark:"#a87739", base:"#e5b159", light:"#ffe098", shine:"#fff2c8" };
const wood = { ink:"#3a3227", dark:"#67513b", base:"#9e7951", light:"#c9a46c", shine:"#f1d090", trim:"#7a9d64", leather:"#77573b" };
const skullFaces = [
  [[-6,-4],[-5,-7],[-2,-8],[2,-8],[5,-6],[6,-3],[6,1],[4,3],[3,6],[-3,6],[-4,3],[-6,1]],
  [[-6,-4],[-4,-7],[0,-8],[4,-7],[6,-4],[5,1],[3,3],[1,5],[-3,6],[-5,4],[-6,1]],
  [[-6,-3],[-5,-6],[-1,-8],[3,-7],[5,-4],[4,0],[2,2],[1,4],[-2,5],[-5,4],[-6,1],[-7,0]],
  [[-6,-3],[-5,-6],[-1,-8],[3,-7],[5,-5],[6,-2],[5,2],[2,4],[-2,5],[-5,3],[-6,0]],
  [[-6,-3],[-5,-6],[-2,-8],[2,-8],[5,-6],[6,-3],[5,2],[3,4],[-3,4],[-5,2]],
];
const plates = {
  jungle_mask: [
    [[-7,-5],[-5,-6],[-2,-5],[0,-7],[2,-5],[5,-6],[7,-5],[6,1],[4,4],[2,6],[-2,6],[-4,4],[-6,1]],
    [[-7,-4],[-5,-6],[-3,-5],[-1,-7],[2,-5],[4,-6],[5,-3],[4,1],[2,4],[-2,6],[-5,4],[-6,1]],
    [[-7,-4],[-5,-6],[-3,-5],[-2,-5],[-2,-2],[-3,0],[-3,2],[-5,6],[-6,4],[-7,2]],
  ],
  death_eater_ivory_mask: [
    [[-6,-3],[-4,-6],[0,-7],[4,-6],[6,-3],[5,1],[3,3],[2,6],[0,7],[-2,6],[-3,3],[-5,1]],
    [[-6,-3],[-4,-6],[-1,-7],[3,-5],[4,-3],[3,1],[1,4],[-1,7],[-3,6],[-4,3],[-6,1]],
    [[-7,-2],[-5,-5],[-2,-6],[0,-4],[1,-2],[0,1],[-2,3],[-4,6],[-6,4],[-6,1]],
  ],
  death_eater_iron_mask: [
    [[-7,-6],[-4,-5],[-1,-6],[0,-5],[1,-6],[4,-5],[7,-6],[6,-1],[4,2],[2,4],[0,7],[-2,4],[-4,2],[-6,-1]],
    [[-7,-6],[-4,-5],[-2,-6],[1,-5],[4,-6],[4,-2],[2,1],[0,4],[-2,7],[-4,4],[-6,1]],
    [[-7,-4],[-6,-6],[-3,-5],[1,-6],[1,-2],[0,1],[-2,3],[-4,6],[-5,4],[-6,1]],
  ],
  death_eater_copper_mask: [
    [[-2,-6],[2,-6],[3,-5],[6,-5],[7,-3],[6,-1],[7,2],[5,4],[3,5],[-3,5],[-5,4],[-7,2],[-6,-1],[-7,-3],[-6,-5],[-3,-5]],
    [[-4,-6],[0,-6],[2,-5],[5,-5],[6,-3],[4,-1],[5,2],[3,4],[-1,5],[-5,4],[-7,2],[-6,-1],[-7,-3],[-6,-5]],
    [[-6,-5],[-3,-6],[-1,-5],[2,-4],[2,-2],[0,0],[2,2],[0,4],[-4,5],[-6,3],[-7,0]],
  ],
};

const cache = new Map();
const supported = new Set([...Object.keys(cowls), ...Object.keys(plates), "skeleton_skull", "halo"]);
const offsets = [[-1,0],[1,0],[0,-1],[0,1]];
const key = (x, y) => `${x},${y}`;
const unpack = (cell) => cell.split(",").map(Number);

function polygonPixels(points) {
  const cells = new Set();
  const pen = {
    fillRect(x, y, width) {
      for (let column = x; column < x + width; column++) cells.add(key(column, y));
    },
  };
  pixelPolygon(pen, points.map(([x, y]) => ({ x, y })), "#000000");
  return cells;
}

function draft(direction) {
  const view = Math.min(direction, 8 - direction);
  const flip = direction > 4 ? -1 : 1;
  const pixels = new Map();
  const turn = (points) => points.map(([x, y]) => [x * flip, y]);
  const outline = (shape, palette) => {
    for (const cell of shape) {
      const [x, y] = unpack(cell);
      const edge = offsets.some(([dx, dy]) => !shape.has(key(x + dx, y + dy)));
      const tone = edge ? palette.ink : x >= 3 || y >= 3 ? palette.dark : y <= -4 && x <= 1 ? palette.light : palette.base;
      pixels.set(cell, tone);
    }
  };
  const plane = (shape, points, color) => {
    for (const cell of polygonPixels(turn(points))) {
      if (shape.has(cell)) pixels.set(cell, color);
    }
  };
  const mark = (shape, x, y, width, height, color) => {
    for (let dx = 0; dx < width; dx++) for (let dy = 0; dy < height; dy++) {
      const cell = key((x + dx) * flip, y + dy);
      if (shape.has(cell)) pixels.set(cell, color);
    }
  };
  return { view, flip, pixels, outline, plane, mark, turn };
}

function paintCowl(state, id, palette, direction, icon) {
  const { view, pixels, outline, plane, mark, turn } = state;
  const p = id === "reaper_hood" ? reaperCloth : id === "ghost_hood" ? ghostCloth : palette;
  const mass = polygonPixels(turn(cowls[id][view]));
  const opening = polygonPixels(hoodOpening(direction));
  const hasMask = id === "reaper_hood" || id === "ghost_hood";
  // Open cowls reveal the living face. Spectral cloth and the Reaper mask hide
  // it with the same cavity that the rig's animated eyes or bone plate sit in.
  if (!hasMask) for (const cell of opening) mass.delete(cell);
  outline(mass, p);
  const rear = view >= 3;
  if (id === "reaper_hood") {
    plane(mass, [[-5,-8],[-1,-10],[2,-8],[-3,-7],[-5,-3],[-6,-4]], p.light);
    plane(mass, [[2,-7],[5,-5],[5,3],[4,4],[2,1]], p.dark);
    if (rear) {
      const crease = view === 3 ? 1 : 0;
      mark(mass,crease,-7,1,8,palette.dark);
      mark(mass,crease+1,-6,1,3,p.light);
    }
  } else if (id === "warlock_hood") {
    const x = [0,-1,-3,1,0][view];
    plane(mass, [[x-2,-7],[x,-11],[x+1,-8],[x+4,-6],[x+2,-6]], p.light);
    plane(mass, [[3,-6],[5,-5],[6,2],[3,4],[4,0]], p.dark);
    mark(mass,x,-7,1,1,p.shine);
    if (!rear) {
      const eyes = [[-2,2],[-3,0],[-4]][view];
      for (const eye of eyes) pixels.set(key(eye * state.flip,-2),"#a7dec8");
    } else {
      mark(mass,x,-4,1,6,p.dark);
      mark(mass,x+1,-3,1,3,p.light);
    }
  } else if (id === "ghost_hood") {
    plane(mass, [[-7,-3],[-4,-8],[-1,-9],[1,-8],[-3,-7],[-5,-3],[-6,2]], p.light);
    plane(mass, [[3,-7],[5,-6],[6,-2],[7,4],[4,3],[3,2]], p.dark);
    if (rear) plane(mass, [[-1,-6],[1,-4],[2,0],[1,3],[-1,1],[-2,-2]], p.light);
  } else {
    const peak = [0,-1,2,1,0][view];
    plane(mass, [[peak-4,-7],[peak,-10],[peak+3,-8],[peak+2,-7],[peak,-8],[peak-3,-6]], p.light);
    mark(mass,peak-1,-8,2,1,p.trim);
    if (!rear) {
      mark(mass,peak,-7,1,1,p.shine);
      mark(mass,-6,2,2,1,p.trim);
      mark(mass,4,3,2,1,p.trim);
    } else {
      plane(mass, [[-3,-4],[0,-2],[4,-4],[2,-1],[0,1],[-2,-1]], p.trim);
      mark(mass,0,-1,1,2,p.dark);
    }
  }
  if (hasMask) {
    const voidColor = id === "reaper_hood" ? "#201e26" : "#101a1c";
    for (const cell of opening) pixels.set(cell, voidColor);
  }
  if (id === "reaper_hood" && !rear) {
    const face = [
      [[-4,-3],[-2,-5],[2,-5],[4,-3],[3,0],[2,1],[2,3],[-2,3],[-2,1],[-4,0]],
      [[-5,-3],[-3,-5],[0,-5],[2,-3],[1,0],[0,1],[-1,3],[-3,3],[-4,0]],
      [[-6,-3],[-4,-5],[-2,-4],[-1,-2],[-2,0],[-2,2],[-4,3],[-5,1],[-6,0]],
    ][view];
    const plate = polygonPixels(turn(face));
    for (const cell of plate) {
      const [x,y] = unpack(cell);
      pixels.set(cell, y >= 1 ? bone.dark : x >= 2 ? bone.base : bone.light);
    }
    const eyes = [[-3,1],[-4,-1],[-5]][view];
    for (const x of eyes) mark(plate,x,-2,2,2,bone.ink);
    const chin = [0,-2,-4][view];
    mark(plate,chin,1,1,1,bone.ink);
    mark(plate,chin-1,2,3,1,bone.light);
  }
  if (icon && !rear && id !== "reaper_hood") {
    for (const cell of opening) {
      if (!pixels.has(cell)) pixels.set(cell, id === "banshee_hood" ? "#392d43" : "#312438");
    }
    if (id === "ghost_hood") {
      mark(opening,-3,-2,2,1,"#bff5e7");
      mark(opening,1,-2,2,1,"#bff5e7");
    }
  }
}

function paintFacePlate(state, id, palette) {
  const { view, turn, outline, plane, mark } = state;
  const p = id === "jungle_mask" ? { ...wood, trim:palette.base } : metal[id];
  if (view > 0) {
    const strap = [
      null,
      [[-5,-3],[5,-2],[6,0],[4,1],[-4,-1]],
      [[-4,-3],[4,-3],[6,-2],[6,0],[4,0],[-3,-1]],
      [[-6,-4],[-4,-3],[4,-2],[6,-3],[6,-1],[4,0],[-4,-1],[-6,0]],
      [[-6,-3],[-3,-2],[3,-2],[6,-3],[6,-1],[3,0],[-3,0],[-6,-1]],
    ][view];
    const refit = id === "jungle_mask" && view === 2 ? strap.map(([x,y]) => [x,y-1]) : strap;
    const tie = polygonPixels(turn(refit));
    outline(tie,{...p,base:p.leather,ink:p.dark});
    if (view >= 3) {
      const clasp = view === 3 ? 2 : 0;
      if (id === "jungle_mask") {
        mark(tie,clasp-1,-2,3,2,p.trim);
        mark(tie,clasp,-2,1,1,p.shine);
      } else if (id === "death_eater_ivory_mask") {
        mark(tie,clasp,-2,2,1,p.trim);
        mark(tie,clasp+1,-1,1,1,p.light);
      } else if (id === "death_eater_iron_mask") {
        mark(tie,clasp-1,-2,4,2,p.dark);
        mark(tie,clasp-1,-2,4,1,p.light);
      } else {
        mark(tie,clasp-2,-2,1,2,p.light);
        mark(tie,clasp+1,-2,1,2,p.trim);
      }
      if (view === 3) mark(tie,-6,-3,2,3,p.base);
      return;
    }
    mark(tie,0,-2,2,1,p.light);
  }
  const face = polygonPixels(turn(plates[id][view]));
  outline(face,p);
  const nose = [0,-2,-5][view];
  const fringe = [5,3,0][view];
  if (id === "jungle_mask") {
    plane(face, [[-7,-5],[fringe,-4],[fringe,-2],[-6,-3]], p.trim);
    plane(face, [[-6,1],[-3,2],[-1,5],[-4,4]], p.trim);
    if (view < 2) plane(face, [[fringe,0],[fringe+1,2],[1,5],[2,2]], palette.dark);
    mark(face,nose,-4,1,6,p.light);
    mark(face,nose-2,3,4,1,p.dark);
    mark(face,nose-2,4,4,1,p.shine);
  } else if (id === "death_eater_ivory_mask") {
    plane(face,[[-5,-4],[0,-6],[fringe,-4],[fringe-1,-3],[0,-4],[-4,-2]],p.shine);
    for (const x of view === 0 ? [-4,3] : view === 1 ? [-5,0] : [-6]) {
      mark(face,x,1,2,1,p.trim);
      mark(face,x+(x<0?1:0),2,1,2,p.trim);
    }
    mark(face,nose-1,4,3,1,p.dark);
  } else if (id === "death_eater_iron_mask") {
    plane(face,[[-6,-5],[-2,-4],[nose,-3],[fringe,-5],[fringe-1,-3],[nose,-1],[-5,-3]],p.light);
    mark(face,nose,-4,1,3,p.trim);
    mark(face,nose,3,1,2,p.trim);
    mark(face,nose+1,1,1,3,p.dark);
  } else {
    plane(face,[[-6,-3],[-3,-5],[2,-5],[fringe,-3],[fringe-1,-2],[0,-3],[-4,-2]],p.light);
    mark(face,nose,-4,1,2,p.trim);
    mark(face,-5,1,2,2,p.trim);
    if(view<2)mark(face,fringe-2,1,2,2,p.trim);
    mark(face,nose-2,3,4,1,p.light);
  }
  const sockets = [[-4,2],[-5,-1],[-6]][view];
  for (const x of sockets) mark(face,x,-2,view===2?2:3,id==="jungle_mask"?2:1,p.ink);
  if (id !== "jungle_mask") {
    mark(face,nose,-1,1,2,p.light);
    mark(face,nose,1,1,1,p.dark);
  }
}

function paintSkull(state) {
  const { view, turn, outline, plane, mark } = state;
  const shape = polygonPixels(turn(skullFaces[view]));
  outline(shape,bone);
  if (view >= 3) {
    plane(shape,[[-4,0],[-2,2],[0,3],[4,1],[2,3],[-2,3]],bone.dark);
    return;
  }
  const eyes = [[-4,2],[-5,0],[-5]][view];
  for (const x of eyes) {
    mark(shape,x,-1,3,2,bone.ink);
    mark(shape,x+1,-2,2,1,bone.ink);
    mark(shape,x+1,1,2,1,bone.dark);
  }
  const center = [0,-2,-4][view];
  mark(shape,center,1,1,2,bone.ink);
  mark(shape,center-2,3,5,1,bone.dark);
  for (const x of [center-2,center,center+2]) mark(shape,x,4,1,2,bone.light);
}

function paintRing(state, icon) {
  const { view, turn, pixels } = state;
  const wide = icon ? 10 : view === 2 ? 6 : 7;
  const top = icon ? -4 : -12;
  const tilt = view === 1 ? 1 : view === 3 ? -1 : 0;
  // Rounded hollow shape with a one-pixel far rim and stronger near edge.
  const ring = polygonPixels(turn([[-wide,top+2],[-wide+2,top],[wide-2,top+tilt],
    [wide,top+2+tilt],[wide-1,top+4+tilt],[wide-3,top+5+tilt],[-wide+3,top+5],[-wide+1,top+4]]));
  const hole = polygonPixels(turn([[-wide+2,top+2],[-wide+4,top+1],[wide-4,top+1+tilt],
    [wide-2,top+2+tilt],[wide-4,top+3+tilt],[-wide+4,top+3]]));
  for (const cell of ring) {
    if (hole.has(cell)) continue;
    const [x,y] = unpack(cell);
    const shade = y <= top+1 ? (x < 1 ? brass.shine : brass.light)
      : y >= top+4 ? (x < 0 ? brass.base : brass.dark)
      : x < 0 ? brass.light : brass.base;
    pixels.set(cell, shade);
  }
}

function renderPixels(id, direction, colors, icon) {
  const p = colors ?? wood;
  const cacheKey = JSON.stringify([id,direction,icon,p]);
  const saved = cache.get(cacheKey);
  if (saved) return saved;
  const state = draft(direction);
  if (cowls[id]) paintCowl(state,id,p,direction,icon);
  else if (plates[id]) paintFacePlate(state,id,p);
  else if (id === "skeleton_skull") paintSkull(state);
  else paintRing(state,icon);
  const pixels = [...state.pixels].map(([cell,color]) => [...unpack(cell),color]);
  if (cache.size >= 160) cache.delete(cache.keys().next().value);
  cache.set(cacheKey,pixels);
  return pixels;
}

export function drawMaskHeadwear(context, head, direction, id, palette, time = 0) {
  if (!supported.has(id)) return false;
  const facing = ((direction % 8) + 8) % 8;
  const x = Math.round(head.x), y = Math.round(head.y);
  // Any moving eye/trail is rendered by the rig after this stable hood layer.
  for (const [column,row,color] of renderPixels(id,facing,palette,false)) {
    context.fillStyle = color;
    context.fillRect(x + column, y + row, 1, 1);
  }
  return true;
}

export function drawMaskHeadwearIcon(context, id, palette) {
  if (!supported.has(id)) return false;
  const pixels = renderPixels(id,0,palette,true);
  const xmin = Math.min(...pixels.map(([x]) => x)), xmax = Math.max(...pixels.map(([x]) => x));
  const ymin = Math.min(...pixels.map(([,y]) => y)), ymax = Math.max(...pixels.map(([,y]) => y));
  const scale = Math.min(1.42, 20 / Math.max(xmax - xmin + 1,ymax - ymin + 1));
  const offsetX = (24 - (xmax - xmin + 1) * scale) / 2;
  const offsetY = (24 - (ymax - ymin + 1) * scale) / 2;
  for (const [x,y,color] of pixels) {
    const col = (x - xmin) * scale + offsetX, row = (y - ymin) * scale + offsetY;
    const left = Math.round(col), top = Math.round(row);
    context.fillStyle = color;
    context.fillRect(left,top,Math.round(col + scale) - left,Math.round(row + scale) - top);
  }
  return true;
}
