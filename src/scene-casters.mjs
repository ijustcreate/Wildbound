import {propLightGeometry} from './world-lighting.mjs';
import {treeType} from './forest-tree-art.mjs';
import {BOARD_TABLE} from './board-table.mjs';
import {hunterPets} from './hunter-pets.mjs';
import {daylight} from './night-cycle.mjs';
import {authoredShadowScenes} from './world-authoring.mjs';
const fields=['x','y','rootY','size','kind','width','depth','height','shadowHeight','shadowShape','radiusX','radiusY','fallen','falling','depleted','destroyed','cut','bushBurnAt','lightBlocker','lightHeight','lightGeometry','treeType'];
const caches=new WeakMap();
// Compare primitive state without allocating a serialized full-world signature.
// Static arrays retain identity until a harvest, editor change or region load.
export function scenePropCasters(game){
 let entry=caches.get(game);if(!entry){entry={props:new WeakMap(),list:[],revision:0};caches.set(game,entry);}
 const list=[];let changed=false;
 for(const p of game.scenery){
  if(['tall_grass','short_grass','grass','fern','flower','forest_understory'].includes(p.kind))continue;
  let slot=entry.props.get(p);
  let stale=!slot;
  if(slot)for(let i=0;i<fields.length;i++)if(slot.values[i]!==p[fields[i]]){stale=true;break;}
  if(stale){
   const geometry=propLightGeometry(p),wide=geometry.tree||/bush|shrub|rock|boulder|ruin/.test(p.kind),size=p.size||48;
   const conifer=p.kind==='snow_tree'||p.kind==='tree'&&treeType(p)==='pine';
   const canopy=p.kind==='tree'||p.kind==='snow_tree';
   const shrub=p.kind==='bush'||p.kind==='frost_shrub';
   const shape=p.shadowShape||(canopy?(conifer?'forest_conifer':'forest_canopy'):shrub?'forest_bush':geometry.tree?'tree':p.kind);
   const defaultWidth=wide?.42:.28;
   const width=p.shadowShape?defaultWidth:canopy?(conifer?.48:.61):shrub?.5:defaultWidth;
   const caster=p.depleted||p.destroyed||p.fallen||p.cut||!geometry.volumes.length?null:{x:geometry.x,y:geometry.y,
    shadowShape:shape,shadowHeight:p.shadowHeight||geometry.height,
    radiusX:p.radiusX||Math.max(6,size*width),radiusY:p.radiusY||Math.max(5,size*(wide?.32:.22))};
   slot={values:fields.map(n=>p[n]),caster};entry.props.set(p,slot);changed=true;
  }
  if(slot.caster)list.push(slot.caster);
 }
 const identical=list.length===entry.list.length&&list.every((p,i)=>{const old=entry.list[i];return p===old||['x','y','shadowShape','shadowHeight','radiusX','radiusY'].every(k=>p[k]===old[k]);});
 if(!identical){entry.list=list;entry.source=game.scenery;entry.length=game.scenery.length;entry.revision++;}
 return {casters:entry.list,revision:entry.revision};
}

const shadowRegionSize = 1600;
const shadowRegionMargin = 220;

export function prepareWorldShadowFrame(game, {shareRegions = false} = {}) {
 const casters = [];
 const {generatedEnvironment, house, eventTestBoard} = game;
 for (const board of [BOARD_TABLE, eventTestBoard].filter(Boolean)) {
  casters.push({x:board.x+board.w/2, y:board.y+board.h/2, shadowShape:'box',
   shadowHeight:board.surfaceHeight, radiusX:board.w/2, radiusY:board.h/2});
 }
 const props = scenePropCasters(game);
 casters.push(...props.casters);
 for (const chest of game.supplyChests || []) {
  if (!chest.opened) casters.push({...chest, kind:'supply_chest', shadowShape:'box', shadowHeight:30, radiusX:20, radiusY:14});
 }
 for (const group of [game.players, game.followers, game.enemies, game.questNpcs, game.villagers, game.ghosts]) {
  for (const actor of group || []) {
   if (!actor || actor.room || actor.hp === 0 || actor.swimming) continue;
   const kind = String(actor.kind || 'actor').toLowerCase();
   const shape = actor.shadowShape || (kind === 'golem' ? 'golem'
    : /bat|crow|raven|wasp|bee|tsetse/.test(kind) ? 'bird'
    : /crocodile|elephant|lion|tiger|wolf|boar|rhino|zebra|dragon/.test(kind) ? 'quadruped' : 'actor');
   const wide = shape === 'quadruped';
   const lift = Math.max(0,actor.jumpHeight || 0) + Math.max(0,actor.groundHeight || 0);
   casters.push({...actor, shadowDynamic:true, shadowShape:shape, shadowLift:lift,
    shadowHeight:Math.max(18,actor.shadowHeight || actor.height || 52),
    radiusX:actor.radiusX || (wide ? 24 : shape === 'bird' ? 12 : actor.kind === 'golem' ? 28 : 11),
    radiusY:actor.radiusY || (wide ? 13 : shape === 'bird' ? 7 : actor.kind === 'golem' ? 25 : 16)});
  }
 }
 for (const pet of hunterPets(game)) {
  if (!pet.room && Number.isFinite(pet.x)) {
   casters.push({...pet, shadowDynamic:true, shadowHeight:Math.max(18,pet.shadowHeight || pet.roostHeight || 38), radius:13});
  }
 }
 for (const item of house?.furniture || []) {
  if (!item.destroyed) casters.push({x:item.x+item.w/2, y:item.y+item.h/2, shadowShape:'furniture',
   shadowHeight:item.surfaceHeight || 34, radiusX:item.w*.5, radiusY:item.h*.5});
 }
 for (const vehicle of house?.vehicles || []) {
  casters.push({x:vehicle.x, y:vehicle.y, shadowShape:'vehicle', shadowHeight:42, radiusX:vehicle.w*.42, radiusY:vehicle.h*.38});
 }
 for (const piece of [...(house?.walls || []), ...(house?.doors || [])]) {
  if (!piece.destroyed && !piece.broken) casters.push({x:piece.x+piece.w/2, y:piece.y+piece.h/2, shadowShape:'wall',
   shadowHeight:piece.height || 58, radiusX:piece.w*.5, radiusY:piece.h*.5});
 }

 const authored = new Map();
 for (const {level,scene} of authoredShadowScenes()) {
  if (level.environment !== generatedEnvironment) continue;
  const key = `${scene.regionX},${scene.regionY}`;
  if (!authored.has(key)) authored.set(key, []);
  authored.get(key).push(scene);
 }
 const forest = generatedEnvironment === 'forest';
 // Forest rebuilds its static field when geometry changes, independently of actor motion.
 const staticRevision = forest && !house ? [props.revision,
  (game.supplyChests || []).map(c=>[c.x,c.y,c.opened].join(',')).join(';'), eventTestBoard?.x, eventTestBoard?.y].join(':') : null;
 const options = {darkness:.035+.34*daylight(game), softActors:forest, budgetMs:forest ? .8 : Infinity, staticRevision};
 // Split views can overlap. Cache only the selected regions for this draw.
 const selected = shareRegions ? new Map() : null;
 return {
  options,
  region(cx, cy) {
   const key = `${cx},${cy}`;
   const cached = selected?.get(key);
   if (cached) return cached;
   const left = cx * shadowRegionSize, top = cy * shadowRegionSize;
   const right = left + shadowRegionSize + shadowRegionMargin;
   const bottom = top + shadowRegionSize + shadowRegionMargin;
   const region = {left, top, scenes:authored.get(key), casters:casters.filter(c=>
    c.x >= left-shadowRegionMargin && c.x < right && c.y >= top-shadowRegionMargin && c.y < bottom)};
   selected?.set(key, region);
   return region;
  },
 };
}
