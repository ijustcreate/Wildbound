import {REALM_ASSETS} from './realm-layout.mjs';
import {validShadowMaps,generateSceneShadowMaps,resampleShadowMaps} from './realtime-shadows.mjs';
const STORAGE_KEY='wildbound-world-design-v1';
const clone=value=>structuredClone(value);

export const WORLD_LEVELS=Object.freeze([
 {id:'forest',name:'Forest · Heartwood',environment:'forest',prey:['mother_deer','stag','baby_deer','pig'],predators:['panther'],food:.8,water:.7,scenes:[{
  id:'heartwood-village',name:'Heartwood Village',regionX:0,regionY:0,x:1120,y:880,radius:220,initial:true,
  description:'A welcoming forest clearing, just beyond the starting square. Three residents share stories around a fire; the Keeper offers a long-form exploration quest.',
  npcs:[{id:'fern',x:-46,y:4},{id:'bram',x:42,y:-12},{id:'poppy',x:3,y:48},{id:'rowan',x:0,y:-92}],
  props:[{kind:'forest_ruin',dx:-128,dy:-34,width:72,depth:34,height:44,shape:'terrace'},{kind:'forest_ruin',dx:132,dy:30,width:56,depth:28,height:32,shape:'shrine'}]
 }]},
 {id:'jungle',name:'Jungle',environment:'temple',prey:['mother_deer','pig'],predators:['tiger','gorilla','monkey'],food:.95,water:.85,scenes:[]},
 {id:'beach',name:'Beach',environment:'beach',prey:['pig','pig_spotted'],predators:['scorpion'],food:.65,water:.9,scenes:[]},
 {id:'cemetery',name:'Cemetery',environment:'graveyard',prey:['bat'],predators:['skeleton','spider'],food:.4,water:.4,scenes:[]},
 {"id":"swamp","name":"Bayou Marsh","environment":"swamp","description":"Old-growth islands, murky channels, nutria and nesting crocodiles.","prey":[],"predators":["crocodile"],"food":0.9,"water":1,"scenes":[]},
 {"id":"caverns","name":"Hollowdeep Caverns","environment":"caverns","description":"Connected chambers, crystal seams, olms and underground pools.","prey":[],"predators":["bat"],"food":0.35,"water":0.6,"scenes":[]},
 {"id":"shadow","name":"The Shadow Realm","environment":"shadow","description":"Twisted clearings, peaceful pale harts and stalking murk wolves.","prey":[],"predators":["murk_wolf"],"food":0.4,"water":0.3,"scenes":[]},
]);

export function defaultWorldDesign(){return {version:1,levels:clone(WORLD_LEVELS)};}
export function validateWorldDesign(value){
 if(!value||value.version!==1||!Array.isArray(value.levels)||value.levels.length>16)return false;
 const ids=new Set();
 for(const level of value.levels){
  if(!level||!/^[a-z0-9_-]{1,48}$/.test(level.id)||ids.has(level.id)||typeof level.name!=='string'||!['forest','temple','beach','graveyard','ice','desert','swamp','caverns','shadow'].includes(level.environment)||!Array.isArray(level.scenes)||!Array.isArray(level.prey)||!Array.isArray(level.predators)||![level.food,level.water].every(n=>Number.isFinite(n)&&n>=0&&n<=1))return false;
  ids.add(level.id);const scenes=new Set();
  for(const s of level.scenes){
   if(!s||!/^[a-z0-9_-]{1,48}$/.test(s.id)||scenes.has(s.id)||typeof s.name!=='string'||![s.regionX,s.regionY,s.x,s.y,s.radius].every(Number.isFinite)||s.radius<32||s.radius>800||!Array.isArray(s.npcs)||s.npcs.length>16||!Array.isArray(s.props)||s.props.length>128)return false;
   scenes.add(s.id);
   if(s.npcs.some(n=>!n||!['fern','bram','poppy','milo','theo','wren','rowan'].includes(n.id)||![n.x,n.y].every(Number.isFinite)))return false;
   if(s.shadowMaps!==undefined&&!validShadowMaps(s.shadowMaps))return false;
   if(s.props.some(p=>!p||![...Object.values(REALM_ASSETS).flatMap(a=>Object.keys(a)),'forest_ruin','tree','bush','fern','rock','flower'].includes(p.kind)||![p.dx,p.dy].every(Number.isFinite)))return false;
  }
 }
 return true;
}
export function readWorldDesign(storage=globalThis.localStorage){
 try{const parsed=JSON.parse(storage?.getItem(STORAGE_KEY)||'null');if(validateWorldDesign(parsed)){for(const level of WORLD_LEVELS)if(!parsed.levels.some(p=>p.id===level.id)&&parsed.levels.length<16)parsed.levels.push(clone(level));return parsed;}}catch{}
 return defaultWorldDesign();
}
export function writeWorldDesign(value,storage=globalThis.localStorage){
 if(!validateWorldDesign(value))throw Error('World design is invalid; check scene IDs, NPC positions, props and ecology values.');
 storage?.setItem(STORAGE_KEY,JSON.stringify(value));shadowSceneCache=null;return value;
}
export function worldLevel(design,id){return design.levels.find(level=>level.id===id)||design.levels[0]||null;}
export function scenesInRegion(environment,cx,cy,design=readWorldDesign()){
 return design.levels.filter(level=>level.environment===environment).flatMap(level=>level.scenes.filter(scene=>scene.regionX===cx&&scene.regionY===cy).map(scene=>({level,scene})));
}
let shadowSceneCache=null;
export function authoredShadowScenes(){
 if(!shadowSceneCache)shadowSceneCache=readWorldDesign().levels.flatMap(level=>level.scenes.map(scene=>({level,scene:scene.shadowMaps?{...scene,shadowMaps:resampleShadowMaps(scene.shadowMaps)}:{...scene,shadowMaps:generateSceneShadowMaps(scene)}})));
 return shadowSceneCache;
}
