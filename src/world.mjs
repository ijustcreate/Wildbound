import {templeLayout} from './temple.mjs';
import {iceWorld} from './ice-world.mjs';
import {contains} from './house-design.mjs';
import {makeHouse,insideHouse} from './expansion.mjs';
// Matches the visible board footprint (including the lower carved rim).
export const TABLE = {
  halfWidth: 85,
  halfHeight: 48,
  footOffset: 11,
  attackRadius: 28,
};
export function crossesTable(a, b) {
  const steps = Math.max(1, Math.ceil(Math.hypot(a.x - b.x, a.y - b.y) / 12));
  for (let i = 1; i < steps; i++) {
    const t = i / steps,
      x = a.x + (b.x - a.x) * t,
      y = a.y + (b.y - a.y) * t;
    if (
      Math.abs(x - 800) < TABLE.halfWidth + 12 &&
      Math.abs(y + TABLE.footOffset - 800) < TABLE.halfHeight + 12
    )
      return true;
  }
  return false;
}
export const terrainHash = (x, y) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
export function createScenery(seed = 0, environment = "forest") {
  const result = [];
  for (let y = 1; y < 49; y++)
    for (let x = 1; x < 49; x++) {
      const r = terrainHash(x + seed * 0.173, y - seed * 0.117);
      if (Math.hypot(x - 25, y - 25) > 6 && r > 0.91)
        result.push({
          id: `${x}:${y}`,
          x: x * 32 + 16,
          y: y * 32 + 16,
          kind: environment === "desert"
            ? r > 0.975 ? "palm" : r > 0.965 ? "cactus" : r > 0.935 ? "rock" : "dune"
            : r > 0.975 ? "tree" : r > 0.954 ? "rock" : r > 0.931 ? "fern" : "flower",
          size:
            r > 0.975
              ? 78 + Math.floor(terrainHash(y, x) * 48)
              : r > 0.954
                ? 32 + Math.floor(terrainHash(y, x) * 32)
                : 28 + Math.floor(terrainHash(y, x) * 16),
          procedural: true,
        });
    }
  return result;
}
export function generateWorld(seed, environment = "forest") {
  const terrain = Array(2500).fill("grass");
  if(environment==='ice')return iceWorld(seed);
  if(environment==='temple'){
    const house=templeLayout();for(let y=0;y<50;y++)for(let x=0;x<50;x++)if(x*32>=480&&x*32<1120&&y*32>=450&&y*32<1120)terrain[y*50+x]='temple_stone';
    const scenery=createScenery(seed).filter(p=>!(p.x>425&&p.x<1175&&p.y>395&&p.y<1175));
    for(let y=96;y<1530;y+=96)for(let x=96;x<1530;x+=96){if(x>400&&x<1200&&y>370&&y<1190||Math.abs(x-800)<75)continue;scenery.push({id:'jungle:'+x+':'+y,x,y,kind:'tree',size:95+terrainHash(x+seed,y)*35,procedural:true});}
    return {terrain,scenery,house,webs:[],templeChest:null,ghosts:[]};
  }
  if(environment==='house'){
    const house=makeHouse();
    for(let y=0;y<50;y++)for(let x=0;x<50;x++){
      const px=x*32+16,py=y*32+16;
      if(insideHouse(px,py,house))terrain[y*50+x]='wood';
      if(house.paths.some(r=>contains(r,px,py)))terrain[y*50+x]='path';
      if(house.pools.some(r=>contains(r,px,py)))terrain[y*50+x]='water';
    }
    const scenery=createScenery(seed).filter(p=>!(p.x>288&&p.x<1312&&p.y>112&&p.y<1520));
    scenery.push(...house.trees.map((t,i)=>({...t,id:'yard:'+i,kind:'tree',procedural:true})));
    return {terrain,house,webs:[],scenery};
  }
  if (environment === "desert") {
    terrain.fill("sand");
    for (let y = 0; y < 50; y++) for (let x = 0; x < 50; x++) {
      const r = terrainHash(x + seed * 0.07, y - seed * 0.11);
      if (r > 0.84 && Math.hypot(x - 25, y - 25) > 7) terrain[y * 50 + x] = "quicksand";
      if (Math.hypot(x - 13, y - 14) < 3.2 || Math.hypot(x - 37, y - 34) < 2.6) terrain[y * 50 + x] = "shallow";
    }
    return { terrain, house:null, webs:[], scenery: createScenery(seed, environment).filter((p) => terrain[Math.floor(p.y / 32) * 50 + Math.floor(p.x / 32)] === "sand") };
  }
  for (let y = 0; y < 50; y++)
    for (const side of [0, 1]) {
      const x = Math.round(
        (side ? 38 : 11) + Math.sin(y * 0.19 + seed * 0.013 + side) * 2,
      );
      const bridges = [8, 24, 40].some((b) => Math.abs(y - b) <= 1);
      for (let dx = -1; dx <= 1; dx++)
        terrain[y * 50 + x + dx] = bridges ? "bridge" : "water";
    }
  // One wadeable bank tile on each side, with the existing deep river channel retained.
  const banks = terrain.slice();
  for (let y = 0; y < 50; y++)
    for (let x = 0; x < 50; x++)
      if (terrain[y * 50 + x] === "water") {
        for (const dx of [-1, 1])
          if (
            x + dx >= 0 &&
            x + dx < 50 &&
            terrain[y * 50 + x + dx] === "grass"
          )
            banks[y * 50 + x + dx] = "shallow";
      }
  terrain.splice(0, terrain.length, ...banks);
  const scenery = createScenery(seed, environment).filter((p) => {
    const x = Math.floor(p.x / 32),
      y = Math.floor(p.y / 32);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (terrain[(y + dy) * 50 + x + dx] !== "grass") return false;
    return true;
  });
  return { terrain, scenery, house:null, webs:[] };
}
export function defaultFootprint(name, width, height) {
  const mask = Array(width * height).fill(0);
  if (!["tree", "rock", "table", "cactus", "palm"].includes(name)) return mask;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width,
        v = (y + 0.5) / height;
      if (
        name === "tree"
          ? ((u - 0.5) / 0.14) ** 2 + ((v - 0.85) / 0.09) ** 2 <= 1
          : name === "rock"
            ? ((u - 0.5) / 0.34) ** 2 + ((v - 0.69) / 0.2) ** 2 <= 1
            : ["cactus", "palm"].includes(name)
              ? ((u - 0.5) / 0.2) ** 2 + ((v - 0.86) / 0.12) ** 2 <= 1
              : u > 0.08 && u < 0.92 && v > 0.25 && v < 0.9
      )
        mask[y * width + x] = 1;
    }
  return mask;
}
export function ensureFootprint(sprite, name) {
  sprite.footprint ??= defaultFootprint(name, sprite.width, sprite.height);
  sprite.occludes ??= name === "tree";
  return sprite;
}
export function propDepth(prop, sprite) {
  const mask = sprite?.footprint;
  if (!mask?.some(Boolean)) return prop.y + prop.size * 0.4;
  let bottom = 0;
  for (let i = 0; i < mask.length; i++)
    if (mask[i]) bottom = Math.max(bottom, Math.floor(i / sprite.width));
  return prop.y - prop.size / 2 + ((bottom + 0.5) * prop.size) / sprite.height;
}
export function footprintHit(prop, sprite, x, y, radius = 8) {
  if(prop.procedural&&!prop.falling&&!prop.depleted){
    const sizes={tree:[12,8,.35],snow_tree:[8,6,.35],rock:[Math.max(10,25-(prop.chipped||0)*3)/2,8,.19],ice_rock:[25,10,.19],ice_spire:[25,10,.19],frozen_log:[28,7,.19],winter_cache:[20,12,.19]};
    const shape=sizes[prop.kind];if(shape){const scale=prop.size/64,baseY=prop.y+prop.size*shape[2],halfW=shape[0]*scale,depth=shape[1]*scale;const nx=Math.max(prop.x-halfW,Math.min(x,prop.x+halfW)),ny=Math.max(baseY-depth,Math.min(y,baseY));return Math.hypot(x-nx,y-ny)<radius;}
  }
  if (prop.falling || prop.depleted) return false;
  if (!sprite?.footprint) {
    if (!prop.procedural || !["tree", "rock", "cactus", "palm"].includes(prop.kind)) return false;
    const by = prop.y + prop.size * (prop.kind === "tree" ? 0.35 : 0.19);
    return (
      Math.hypot(
        (x - prop.x) / (prop.kind === "tree" ? 0.12 : 0.3),
        (y - by) / 0.12,
      ) <
      prop.size + radius * 5
    );
  }
  const unitX = prop.size / sprite.width,
    unitY = prop.size / sprite.height,
    left = prop.x - prop.size / 2,
    top = prop.y - prop.size / 2;
  if (
    x + radius < left ||
    x - radius > left + prop.size ||
    y + radius < top ||
    y - radius > top + prop.size
  )
    return false;
  const minX = Math.max(0, Math.floor((x - radius - left) / unitX)),
    maxX = Math.min(sprite.width - 1, Math.floor((x + radius - left) / unitX)),
    minY = Math.max(0, Math.floor((y - radius - top) / unitY)),
    maxY = Math.min(sprite.height - 1, Math.floor((y + radius - top) / unitY));
  for (let py = minY; py <= maxY; py++)
    for (let px = minX; px <= maxX; px++) {
      if (!sprite.footprint[py * sprite.width + px]) continue;
      const cx = Math.max(
          left + px * unitX,
          Math.min(x, left + (px + 1) * unitX),
        ),
        cy = Math.max(top + py * unitY, Math.min(y, top + (py + 1) * unitY));
      if ((cx - x) ** 2 + (cy - y) ** 2 <= radius ** 2) return true;
    }
  return false;
}
export function isOccluded(prop, sprite, player) {
  if (!sprite?.occludes || player.y + 14 >= propDepth(prop, sprite))
    return false;
  const left = prop.x - prop.size / 2,
    top = prop.y - prop.size / 2;
  for (const [dx, dy] of [
    [0, -10],
    [-8, -5],
    [8, -5],
    [0, 5],
  ]) {
    const x = Math.floor(((player.x + dx - left) / prop.size) * sprite.width),
      y = Math.floor(((player.y + dy - top) / prop.size) * sprite.height);
    if (
      x >= 0 &&
      y >= 0 &&
      x < sprite.width &&
      y < sprite.height &&
      sprite.pixels[y * sprite.width + x]
    )
      return true;
  }
  return false;
}
