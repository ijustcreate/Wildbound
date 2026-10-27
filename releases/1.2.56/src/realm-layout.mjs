import {swampIslands,swampTile,swampRouteDistance} from './swamp-layout.mjs';
// Native, deterministic environments. All coordinates and tuning remain plain save data.
export const REALMS = ['swamp','caverns','shadow'];
export const REALM_NAMES = {swamp:'Bayou Marsh',caverns:'Hollowdeep Caverns',shadow:'The Shadow Realm'};
export const realmHash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
export const REALM_ASSETS = {
 swamp:{mangrove:{type:'tree',size:220},old_cypress:{type:'tree',size:240},cypress_knee:{type:'rock',size:28},peat_boulder:{type:'rock',size:60},marsh_reeds:{size:38},bayou_lily:{size:24},marsh_fern:{size:34},moss_log:{type:'log',size:76}},
 caverns:{limestone_shelf:{type:'rock',size:90},stalagmite:{type:'mineral',size:64},cave_crystal:{type:'crystal',size:65},amber_crystal:{type:'crystal',size:58},cave_mushroom:{size:42},cave_drip:{size:26},ceiling_stalactite:{type:'ceiling',size:46},cave_rubble:{size:40}},
 shadow:{wither_tree:{type:'tree',size:150},root_arch:{type:'arch',size:155},shadow_obsidian:{type:'crystal',size:68},thorn_fan:{size:52},echo_fungus:{size:44},shadow_bloom:{size:36},ashen_log:{type:'log',size:80},veil_stone:{type:'rock',size:88}},
};
export const realmAsset=kind=>Object.values(REALM_ASSETS).map(a=>a[kind]).find(Boolean);
export function realmResourceScale(p){const type=realmAsset(p.kind)?.type;if(!['rock','mineral','crystal'].includes(type))return 1;const chunks=p.chunks??p.maxChunks??Math.max(2,Math.round((p.size||64)/16)),total=p.maxChunks??chunks;return Math.max(.2,Math.min(1,(chunks-(p.harvest||0)/36)/Math.max(1,total)));}
export const realmTree=p=>realmAsset(p.kind)?.type==='tree';
export const realmHarvestable=p=>['tree','rock','mineral','crystal','log'].includes(realmAsset(p.kind)?.type);
export const REALM_DEFAULTS={hazardCount:5,hazardWarning:1.6,hazardDamage:5,propDensity:100};
const settingsKey='wildbound-realm-layouts-v1';
export function readRealmLayouts(){try{return JSON.parse(globalThis.localStorage?.getItem(settingsKey)||'{}');}catch{return {};}}
export function saveRealmLayout(env,layout){if(!REALMS.includes(env))throw Error('Unknown environment');const all=readRealmLayouts();all[env]=structuredClone(layout);globalThis.localStorage?.setItem(settingsKey,JSON.stringify(all));}
const segmentDistance=(x,y,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);};
export function realmProp(kind,x,y,index=0,extra={}){const def=realmAsset(kind);if(!def)throw Error('Unknown realm asset: '+kind);return {id:'realm:'+index,kind,x,y:y-def.size*.19,rootY:y,size:def.size,procedural:true,realm:true,...extra};}
export function realmWorld(seed,env,{authored=true,settings:overrides={},layout=undefined,streamed=false}={}){
 const saved=layout!==undefined?layout:authored?readRealmLayouts()[env]:null,settings={...REALM_DEFAULTS,...saved?.settings,...overrides};
 settings.hazardCount=Math.max(0,Math.min(8,Number(settings.hazardCount)||0));settings.hazardWarning=Math.max(1,Math.min(4,Number(settings.hazardWarning)||1.6));settings.hazardDamage=Math.max(1,Math.min(8,Number(settings.hazardDamage)||5));settings.propDensity=Math.max(30,Math.min(150,Number(settings.propDensity)||100));
 const terrain=Array(2500),scenery=[];
 const chambers=[{x:800,y:800,r:245},{x:370,y:400,r:174},{x:820,y:280,r:152},{x:1250,y:440,r:190},{x:1250,y:1120,r:190},{x:780,y:1330,r:165},{x:310,y:1150,r:180},{x:260,y:750,r:140}];
 if(streamed)for(let i=1;i<chambers.length;i++){const p=chambers[i];p.x+=(realmHash(seed+i,701)-.5)*140;p.y+=(realmHash(seed+i,907)-.5)*120;p.r+=(realmHash(seed+i,301)-.5)*40;}
 let links=[[0,1],[1,2],[2,3],[3,0],[0,4],[4,5],[5,6],[6,7],[7,1],[7,0]];
 const swamp=env==='swamp'?swampIslands(seed):null;
 if(swamp){chambers.splice(0,chambers.length,...swamp.islands);links=swamp.links;}
 const route=(x,y)=>swamp?swampRouteDistance(swamp,x,y):Math.min(...links.map(([a,b])=>segmentDistance(x,y,chambers[a],chambers[b])));
 for(let ty=0;ty<50;ty++)for(let tx=0;tx<50;tx++){
  const x=tx*32+16,y=ty*32+16,id=ty*50+tx,center=Math.hypot(x-800,y-800),edge=tx<2||ty<2||tx>47||ty>47;
  const noise=Math.sin(x*.027+seed*.13)*9+Math.sin(y*.031-x*.009)*11;
  const room=Math.min(...chambers.map(a=>Math.hypot(x-a.x,(y-a.y)*1.12)-a.r));
  if(env==='caverns'){
   const open=room<noise||route(x,y)<57+noise*.35;
   terrain[id]=!edge&&open?'cave_floor':'cave_void';
   const pool=Math.min((x-1250)**2/105**2+(y-430)**2/78**2,(x-320)**2/80**2+(y-1160)**2/60**2);
   if(open&&!edge&&pool<1)terrain[id]=pool<.6?'water':'shallow';
  }else if(env==='swamp'){
   terrain[id]=swampTile(swamp,seed,x,y);
  }else{
   terrain[id]=edge?'shadow_void':room<noise+60||route(x,y)<95?'shadow_soil':'shadow_void';
   if(center<240)terrain[id]='shadow_soil';
   if(!edge&&Math.hypot(x-1240,(y-440)*1.3)<90)terrain[id]='shallow';
  }
 }
 // Pixel terrain edits are layered on generated topology, never on another save.
 for(const [id,kind]of Object.entries(saved?.tiles||{}))if(Number.isInteger(+id)&&+id>=0&&+id<2500&&REALM_TILES.includes(kind))terrain[+id]=kind;
 const kinds=Object.keys(REALM_ASSETS[env]).filter(k=>realmAsset(k).type!=='ceiling');
 for(let i=0;i<1400&&scenery.length<settings.propDensity;i++){
  const x=80+realmHash(seed+i,73)*1440,y=80+realmHash(i,seed+91)*1440;
  const tile=terrain[Math.floor(y/32)*50+Math.floor(x/32)],r=realmHash(i+seed,9);
  if(['cave_void','shadow_void','water','bridge'].includes(tile)||Math.hypot(x-800,y-800)<245||route(x,y)<(swamp?30:48)||scenery.some(p=>Math.hypot(p.x-x,p.rootY-y)<(swamp?36:55)))continue;
  let kind=kinds[Math.floor(r*kinds.length)];
  if(env==='swamp')kind=tile==='shallow'?(r>.55?'bayou_lily':'marsh_reeds'):r<.12?'old_cypress':r<.25?'mangrove':r<.54?'marsh_fern':r<.71?'cypress_knee':r<.86?'moss_log':'peat_boulder';
  if(env==='swamp'&&realmAsset(kind).type==='tree'&&scenery.some(p=>realmTree(p)&&Math.hypot(p.x-x,p.rootY-y)<105))continue;
  if(env==='shadow'&&kind==='root_arch'&&scenery.filter(p=>p.kind==='root_arch').length>=3)kind='wither_tree';
  if(env==='caverns'&&realmAsset(kind).type==='crystal'){
   const tx=Math.floor(x/32),ty=Math.floor(y/32),nearWall=[[2,0],[-2,0],[0,2],[0,-2]].some(([dx,dy])=>terrain[(ty+dy)*50+tx+dx]==='cave_void');
   if(!nearWall)kind=r>.5?'stalagmite':'cave_mushroom';
  }
  scenery.push(realmProp(kind,x,y,scenery.length,{size:Math.round(realmAsset(kind).size*(.85+realmHash(i,21)*.3))}));
 }
 // Authored wall growths and landmarks give every room a recognisable destination.
 const landmarks=env==='caverns'?[['cave_crystal',430,330],['amber_crystal',870,220],['cave_crystal',1350,520],['limestone_shelf',1150,1180],['cave_mushroom',720,1370]]:env==='swamp'?[]:[['root_arch',1280,1100],['wither_tree',380,350],['shadow_obsidian',820,240]];
 for(const [kind,x,y]of landmarks)scenery.push(realmProp(kind,x,y,scenery.length));
 if(env==='swamp')for(let i=0,trees=0;i<1600&&trees<22;i++){
  const x=100+realmHash(seed+i,541)*1400,y=100+realmHash(i,seed+941)*1400;
  if(terrain[Math.floor(y/32)*50+Math.floor(x/32)]!=='marsh_grass'||Math.hypot(x-800,y-800)<260||route(x,y)<42||scenery.some(p=>Math.hypot(p.x-x,p.rootY-y)<(realmTree(p)?110:40)))continue;
  scenery.push(realmProp(trees%3?'mangrove':'old_cypress',x,y,scenery.length));trees++;
 }
 if(env==='caverns')for(let i=0;i<settings.hazardCount;i++){const p=chambers[1+i%7];scenery.push(realmProp('ceiling_stalactite',p.x-55,p.y+65,scenery.length,{warning:settings.hazardWarning,damage:settings.hazardDamage,hazardState:'idle'}));}
 if(Array.isArray(saved?.scenery)){
  scenery.length=0;for(const p of saved.scenery.slice(0,180))if(realmAsset(p.kind)&&Number.isFinite(p.x+p.rootY)&&p.x>=32&&p.x<1568&&p.rootY>=32&&p.rootY<1568)scenery.push({...p,realm:true,procedural:true});
 }
 return {terrain,scenery,house:null,webs:[],realmState:{version:1,env,seed,settings,chambers,links,animals:Array.isArray(saved?.fauna)?structuredClone(saved.fauna.filter(a=>typeof a.kind==='string'&&Number.isFinite(a.x+a.y)&&a.x>=32&&a.x<=1568&&a.y>=32&&a.y<=1568).slice(0,24)):null,event:null}};
}
export const REALM_TILES=['marsh_grass','mud','shallow','water','bridge','cave_floor','cave_void','shadow_soil','shadow_void'];
