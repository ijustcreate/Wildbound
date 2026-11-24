import {railwayStream,streamRegion,streamImage} from './railway-stream.mjs';
import {nativeWildBlocked} from './wild-native-biomes.mjs';
import {drawLandscapeGround} from './forest-art.mjs';
import {createForestScenery,forestNoise} from './forest-landscape.mjs';
import {nearestTrainTrack} from './train-track.mjs';
import {railwaySurface} from './railway-water.mjs';
import {drawRailwayFloorFallback} from './railway-floor-fallback.mjs';

const previewGrass=['#3e5e45','#4b6846','#567447','#617e49'];
function previewForestColor(d,x,y){
 const surface=railwaySurface(d,x,y);
 if(surface==='water')return '#255563';
 if(surface==='shallow')return '#55887e';
 return previewGrass[Math.min(3,Math.floor(forestNoise(x/240,y/240,42)*4))];
}
export function railwayForestProps(t,bounds){const d=t.design,props=[];t.forestChunks??=new Map();if(d.nativeForest!==false)for(let cy=Math.max(0,Math.floor((bounds.top-180)/1600));cy<=Math.min(Math.ceil(d.height/1600)-1,Math.floor((bounds.bottom+180)/1600));cy++)for(let cx=Math.max(0,Math.floor((bounds.left-180)/1600));cx<=Math.min(Math.ceil(d.width/1600)-1,Math.floor((bounds.right+180)/1600));cx++){const key=cx+':'+cy;let chunk=t.forestChunks.get(key);if(!chunk&&railwayStream(t)){streamRegion(t,cx*1600+800,cy*1600+800);continue;}if(!chunk){const terrain=Array(2500).fill('grass'),plan={seed:42+cx*71+cy*179,routes:[],landmarks:[],cover:[],routeField:new Float32Array(10000).fill(200),paving:{cells:Array(576).fill(0)}};chunk=createForestScenery(plan.seed,terrain,plan).map(o=>({...o,id:'rail-native:'+key+':'+o.id,x:o.x+cx*1600,y:o.y+cy*1600,rootY:(o.rootY??o.y)+cy*1600})).filter(o=>{if(o.x>d.width-30||o.y>d.height-30||railwaySurface(d,o.x,o.rootY)!=='grass')return false;const s=d.station;if(s&&(Math.abs(o.x-s.x)<s.w/2+100&&Math.abs(o.rootY-s.y)<s.h/2+140||Math.abs(o.x-s.platformX)<s.platformLength/2+50&&Math.abs(o.rootY-s.platformY)<s.platformWidth/2+60))return false;return Math.min(...[t.route,...(t.otherRoutes||[])].map(route=>nearestTrainTrack(route,o.x,o.rootY).distance))>(o.kind==='tree'||o.kind==='palm'?95:55);});if(t.forestChunks.size>=24)t.forestChunks.delete(t.forestChunks.keys().next().value);t.forestChunks.set(key,chunk);}props.push(...chunk.filter(o=>o.x>bounds.left-180&&o.x<bounds.right+180&&o.y>bounds.top-180&&o.y<bounds.bottom+240));}
 props.push(...d.scenery.filter(o=>o.x>bounds.left-180&&o.x<bounds.right+180&&o.y>bounds.top-180&&o.y<bounds.bottom+240&&railwaySurface(d,o.x,o.rootY??o.y)==='grass'));t.visibleForest=props;return props;}
export function railwayForestBlocked(t,x,y,from=null){if(!streamRegion(t,x,y,100))return true;if(t.design.wildLands)return nativeWildBlocked(t,x,y,8,from);return(t.visibleForest||[]).some(o=>['tree','palm','snow_tree','leafless_tree','rock'].includes(o.kind)&&Math.hypot(o.x-x,(o.rootY??o.y)-y)<Math.max(8,(o.size||64)*(o.kind==='rock'?.15:.1)));}
export function drawRailwayForestFloor(c,t,bounds,time){let missing=0;const d=t.design;t.floorChunks??=new Map();for(let cy=Math.max(0,Math.floor(bounds.top/1600));cy<=Math.min(Math.ceil(d.height/1600)-1,Math.floor(bounds.bottom/1600));cy++)for(let cx=Math.max(0,Math.floor(bounds.left/1600));cx<=Math.min(Math.ceil(d.width/1600)-1,Math.floor(bounds.right/1600));cx++){
 const key=cx+':'+cy,x=cx*1600,y=cy*1600;
 if(railwayStream(t)){
  const image=streamImage(t,'forest','forest:'+key+':800',{x,y,span:1600,size:800},60);
  if(image){c.imageSmoothingEnabled=false;c.drawImage(image,x,y,1600,1600);}
  else {drawRailwayFloorFallback(c,d,x,y,1600,64,(wx,wy)=>previewForestColor(d,wx,wy));missing++;}
  continue;
 }
 let world=t.floorChunks.get(key);if(!world){const seed=42+cx*71+cy*179,terrain=Array.from({length:2500},(_,i)=>railwaySurface(d,x+(i%50)*32+16,y+Math.floor(i/50)*32+16)),plan={seed,routes:[],landmarks:[],cover:[],routeField:new Float32Array(10000).fill(200),paving:{cells:Array(576).fill(0)}};world={seed,terrain,scenery:(t.forestChunks?.get(key)||[]).map(o=>({...o,x:o.x-x,y:o.y-y,rootY:o.rootY-y})),forestLandscape:plan,environment:'forest',generatedEnvironment:'forest'};if(t.floorChunks.size>=8)t.floorChunks.delete(t.floorChunks.keys().next().value);t.floorChunks.set(key,world);}c.save();c.translate(x,y);drawLandscapeGround(c,world,{sx:0,sy:0,ex:50,ey:50});c.restore();
}if(t.streamCoverage){t.streamCoverage.groundPending+=missing;t.streamCoverage.groundReady=true;}}
