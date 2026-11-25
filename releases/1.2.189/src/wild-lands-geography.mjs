import {MOSSBELL_TRAIL} from './wild-slime-hollow-site.mjs';
import {MOONVEIL_TRAIL} from './wild-runic-sanctuary-site.mjs';
import {TIDEGLASS_PATHS} from './tideglass-layout.mjs';

// Landscape tracing of the approved sketch, in normalized map coordinates.
export const LAND_OUTLINE=[[.03,.09],[.12,.04],[.24,.065],[.31,.025],[.43,.04],[.49,.075],[.55,.035],[.68,.045],[.75,.02],[.86,.05],[.96,.08],[.975,.22],[.95,.34],[.975,.45],[.95,.56],[.98,.66],[.955,.76],[.90,.80],[.86,.87],[.78,.895],[.72,.96],[.62,.925],[.54,.96],[.46,.91],[.36,.955],[.28,.91],[.20,.93],[.15,.865],[.08,.85],[.055,.74],[.025,.68],[.055,.57],[.025,.48],[.045,.35],[.02,.27]];
export const PORTAL_ISLAND=[[.88,.875],[.92,.855],[.965,.88],[.98,.935],[.95,.975],[.89,.96],[.865,.92]];
export const REGION_SHAPES={
 jungle:[[.045,.06],[.23,.06],[.33,.045],[.43,.07],[.445,.23],[.42,.35],[.30,.375],[.19,.35],[.07,.38]],
 swamp:[[.70,.04],[.91,.055],[.965,.09],[.95,.29],[.90,.325],[.77,.32],[.71,.29]],
 ice:[[.46,.43],[.53,.405],[.60,.43],[.605,.49],[.655,.51],[.65,.64],[.60,.69],[.57,.665],[.49,.685],[.445,.635],[.45,.54],[.43,.50]],
 graveyard:[[.135,.527],[.23,.515],[.335,.545],[.36,.62],[.34,.82],[.26,.865],[.155,.845],
  [.126,.815],[.110,.778],[.107,.743],[.116,.706],[.123,.659],[.127,.603]],
 house:[[.43,.73],[.56,.72],[.615,.78],[.59,.88],[.44,.875],[.405,.81]]
};
const scale=points=>points.map(([x,y])=>[x*16000,y*9600]);
const coast=scale(LAND_OUTLINE),island=scale(PORTAL_ISLAND),regions=Object.fromEntries(Object.entries(REGION_SHAPES).map(([k,v])=>[k,scale(v)]));
// The Homestead valley extends north around the Overlook. Keep both Frostmere
// snowfields and its station outside this tapered grass corridor.
const homesteadValley=[
 [7010,7136],[7232,6576],[7200,5680],[7312,5136],[7392,4688],[7600,4512],
 [7890,4424],[8376,4424],[8720,4496],[8912,4736],[8976,5136],[9016,5696],
 [9112,6192],[8976,6608],[9056,7152],
];
export function inWildPolygon(x,y,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
const segmentDistance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-u*dx,y-a[1]-u*dy);};
function edgeDistance(x,y,polygon){let best=Infinity;for(let i=0;i<polygon.length;i++)best=Math.min(best,segmentDistance(x,y,polygon[i],polygon[(i+1)%polygon.length]));return best;}

function roundedBoundary(points){
 const outline=points.flatMap(([x,y],i)=>{
  const [nx,ny]=points[(i+1)%points.length];
  return [[x*.78+nx*.22,y*.78+ny*.22],[x*.22+nx*.78,y*.22+ny*.78]];
 });
 const edges=outline.map(([x,y],i)=>{
  const [nx,ny]=outline[(i+1)%outline.length],dx=nx-x,dy=ny-y;
  return {x,y,dx,dy,ny,invLengthSquared:1/(dx*dx+dy*dy||1)};
 });
 return {edges,left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),
  top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))};
}
const westWoodland=roundedBoundary([
 [975,2985],[1480,2980],[2120,2990],[2220,3150],[2290,3480],[2380,3940],[2410,4440],[2320,4780],
 [2185,5065],[2075,5000],[2060,4680],[1980,4390],[1940,4080],[1850,3830],[1700,3580],[1510,3340],[1250,3180],
]);
const southWestWoodland=roundedBoundary([
 [3010,8130],[3400,8020],[4070,8150],[4700,8060],[5620,8070],[6170,8020],[6740,8040],
 [6440,8260],[6100,8300],[5770,8585],[5450,8620],[5190,8395],[4780,8330],[4000,8470],[3420,8450],
]);
const southEastWoodland=roundedBoundary([
 [7360,8200],[7820,8080],[8480,8170],[9110,8140],[9760,8230],[10340,8190],[11380,8080],[12380,8140],
 [12165,8420],[11400,8420],[10530,8525],[10050,8610],[9350,8510],[8860,8450],[8295,8600],[7810,8510],[7360,8510],
]);
const overlookSnow=roundedBoundary([
 [7090,5190],[7100,4840],[7250,4660],[7645,4465],[8030,4330],[8350,4385],[8535,4110],[8760,4165],
 [8935,4450],[9065,4770],[9150,5190],[9200,5720],[9115,6100],[8925,5905],[8845,5430],[8755,4860],
 [8600,4620],[8250,4585],[7950,4720],[7710,4800],[7600,5080],[7480,5420],[7270,5295],
]);
const cemeteryShore=roundedBoundary([
 [2100,5020],[2440,5080],[2530,5650],[2470,6310],[2490,6900],[2510,7550],[2420,7890],[1990,7730],
 [1760,7490],[1650,7220],[1760,6840],[1935,6470],[1990,6000],[2040,5560],
]);
const eastWoodland=roundedBoundary([
 [13330,7860],[14010,7220],[14400,6760],[14600,6300],[14540,5690],[14540,5080],[14560,4490],
 [14720,4140],[15010,4045],[15300,4210],[15575,4460],[16065,4490],[16320,4650],[16260,4840],
 [16095,5230],[16205,5560],[16390,5770],[16150,6060],[15610,6200],[15220,6200],[15090,6565],
 [15180,6870],[14730,7010],[14290,7215],[13925,7530],[13770,7795],
]);
const eastWoodlandLake=roundedBoundary([
 [15075,5570],[15240,5320],[15415,5315],[15590,5380],[15890,5525],[16005,5730],[15895,5875],
 [15630,5905],[15470,5875],[15245,5855],[15125,5730],
]);
export const EAST_WOODLAND_LAKE_BOUNDS=Object.freeze({
 left:eastWoodlandLake.left-64,top:eastWoodlandLake.top-64,right:eastWoodlandLake.right+64,bottom:eastWoodlandLake.bottom+64,
});

function overlapsBoundary(shape,x,y,pad){
 return x>=shape.left-pad&&x<=shape.right+pad&&y>=shape.top-pad&&y<=shape.bottom+pad;
}
function edgeVariation(x,y){
 return 24*Math.sin(x*.011+y*.008)+14*Math.sin(x*.023-y*.021)+7*Math.sin(x*.063+y*.051);
}
function paintedMargin(shape,x,y,pad=64){
 if(!overlapsBoundary(shape,x,y,pad))return -Infinity;
 let inside=false,distanceSquared=Infinity;
 for(const edge of shape.edges){
  const px=x-edge.x,py=y-edge.y;
  if((edge.y>y)!==(edge.ny>y)&&px<py*edge.dx/edge.dy)inside=!inside;
  const u=Math.max(0,Math.min(1,(px*edge.dx+py*edge.dy)*edge.invLengthSquared));
  const rx=px-u*edge.dx,ry=py-u*edge.dy;
  distanceSquared=Math.min(distanceSquared,rx*rx+ry*ry);
 }
 return (inside?1:-1)*Math.sqrt(distanceSquared)+edgeVariation(x,y);
}
const forestMargin=(x,y)=>Math.max(paintedMargin(westWoodland,x,y),paintedMargin(southWestWoodland,x,y),paintedMargin(southEastWoodland,x,y));
export const eastWoodlandLakeDepth=(x,y)=>paintedMargin(eastWoodlandLake,x,y,150);
export function eastWoodlandTerrain(x,y){
 const lake=eastWoodlandLakeDepth(x,y);
 if(lake>=0)return lake<52?'shallow':'water';
 if(paintedMargin(eastWoodland,x,y)>=0)return lake>-95?'beach':'forest';
 return null;
}
export function eastWoodlandIntersects(left,top,right,bottom){
 return right>=eastWoodland.left-48&&left<=eastWoodland.right+48&&
  bottom>=eastWoodland.top-48&&top<=eastWoodland.bottom+48;
}
export function eastWoodlandUniformTile(x,y){
 const cx=x+16,cy=y+16;
 const edge=paintedMargin(eastWoodland,cx,cy,190),lake=eastWoodlandLakeDepth(cx,cy);
 // Sample water and land rims in the pixel mask. Well inside the preserve,
 // the classification is uniform and needs no finer shoreline samples.
 if(lake>112)return 'water';
 if(lake>=-60)return null;
 if(edge>60)return 'grass';
 if(edge>=-175)return null;
 return undefined;
}
export const wildLandsOpenOcean=(x,y)=>!inWildPolygon(x,y,coast)&&!inWildPolygon(x,y,island)&&!eastWoodlandTerrain(x,y);
export const wildLandsCoastDistance=(x,y)=>Math.min(edgeDistance(x,y,coast),edgeDistance(x,y,island),Math.abs(paintedMargin(eastWoodland,x,y,180)));

export function wildLandsPaintedBiome(x,y){
 const east=eastWoodlandTerrain(x,y);
 if(east==='forest'||east==='beach')return east;
 if(paintedMargin(overlookSnow,x,y)>0)return 'ice';
 if(paintedMargin(cemeteryShore,x,y)>0)return 'graveyard';
 return forestMargin(x,y)>0?'forest':null;
}

function beachMargin(x,y,shore){
 const east=eastWoodlandTerrain(x,y);
 if(east)return 95+eastWoodlandLakeDepth(x,y);
 const west=Math.min(2200-x+edgeVariation(x,y),y-3200+34*Math.sin(x*.019));
 const south=y-8400+edgeVariation(x,y);
 const sand=Math.max(380-shore+edgeVariation(x,y)*.5,west,south);
 const clearing=Math.max(forestMargin(x,y),paintedMargin(cemeteryShore,x,y));
 return Math.min(sand,Math.max(136-shore,-clearing));
}
function smooth(points){const result=[],p=scale(points);for(let i=0;i<p.length-1;i++){const a=p[Math.max(0,i-1)],b=p[i],c=p[i+1],d=p[Math.min(p.length-1,i+2)];for(let step=0;step<12;step++){const t=step/12,t2=t*t,t3=t2*t;result.push([0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)));}}result.push(p.at(-1));return result;}
function spatialLines(paths,margin){const bins=new Map();for(const points of paths)for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];for(let cy=Math.floor((Math.min(a[1],b[1])-margin)/512);cy<=Math.floor((Math.max(a[1],b[1])+margin)/512);cy++)for(let cx=Math.floor((Math.min(a[0],b[0])-margin)/512);cx<=Math.floor((Math.max(a[0],b[0])+margin)/512);cx++){const key=cx+cy*64;if(!bins.has(key))bins.set(key,[]);bins.get(key).push([a,b]);}}return (x,y)=>{let distance=Infinity;for(const [a,b]of bins.get(Math.floor(x/512)+Math.floor(y/512)*64)||[])distance=Math.min(distance,segmentDistance(x,y,a,b));return distance;};}
export const WILD_RIVERS=[
 smooth([[.685,-.02],[.68,.16],[.68,.34],[.675,.48],[.68,.60],[.65,.745],[.56,.79],[.48,.835],[.40,.89],[.39,.98]]),
 smooth([[.68,.32],[.78,.34],[.88,.33],[.96,.30]]),
 smooth([[.945,.035],[.955,.16],[.95,.30]])
];
const riverDistance=spatialLines(WILD_RIVERS,250);
export const WILD_TRAILS=[smooth([[.19,.20],[.205,.30],[.35,.40],[.50,.38],[.56,.50]]),smooth([[.19,.80],[.25,.70],[.37,.64],[.50,.72],[.50,.81]]),smooth([[.87,.50],[.79,.53],[.69,.49],[.61,.50]]),smooth([[.81,.20],[.81,.33],[.86,.50],[.82,.81]])];
const trailDistance=spatialLines(WILD_TRAILS,85);
const mossbellTrailDistance=spatialLines([MOSSBELL_TRAIL.map(({x,y})=>[x,y])],42);
const moonveilTrailDistance=spatialLines([MOONVEIL_TRAIL],26);
const tideglassTrailDistance=spatialLines(TIDEGLASS_PATHS,42);
export const WILD_BRIDGES=[{id:'woodland',x:10900,y:4710,w:760,h:110},{id:'bayou',x:12960,y:3230,w:110,h:720},{id:'south',x:8870,y:7600,w:150,h:820}];
export const WILD_BIOMES=['forest','jungle','ice','graveyard','house','beach','swamp'];
export function sketchBiome(x,y){
 const painted=wildLandsPaintedBiome(x,y);
 if(painted)return painted;
 if(x>=7010&&x<=9112&&y>=4424&&y<=7152&&inWildPolygon(x,y,homesteadValley))return 'house';
 for(const [kind,polygon]of Object.entries(regions))if(inWildPolygon(x,y,polygon))return kind;
 return 'forest';
}
const SKETCH_COLS=600,SKETCH_ROWS=300;
const biomeCache=new Uint8Array(SKETCH_COLS*SKETCH_ROWS).fill(255),terrainCache=new Uint8Array(SKETCH_COLS*SKETCH_ROWS),pathCache=new Uint8Array(SKETCH_COLS*SKETCH_ROWS);
export function sketchTile(x,y){
 const tx=Math.floor(x/32),ty=Math.floor(y/32);if(tx<0||ty<0||tx>=SKETCH_COLS||ty>=SKETCH_ROWS)return -1;
 const index=ty*SKETCH_COLS+tx;if(biomeCache[index]!==255)return index;
 x=tx*32+16;y=ty*32+16;const main=inWildPolygon(x,y,coast),offshore=inWildPolygon(x,y,island),shore=edgeDistance(x,y,main?coast:offshore?island:coast);
 const east=eastWoodlandTerrain(x,y);
 let biome=sketchBiome(x,y),terrain=0;
 if(east){if(east==='water')terrain=1;else if(east==='shallow')terrain=2;}
 else if(!main&&!offshore)terrain=Math.min(shore,Math.abs(paintedMargin(eastWoodland,x,y,180)))<110?2:1;
 else{
  if(offshore||beachMargin(x,y,shore)>0)biome='beach';
  const river=riverDistance(x,y);if(river<120)terrain=1;else if(river<175)terrain=2;
  if(biome==='swamp'&&river>240){const wet=Math.sin(x/380)*Math.sin(y/420);if(wet>.66)terrain=2;}
 }
 biomeCache[index]=WILD_BIOMES.indexOf(biome);terrainCache[index]=terrain;pathCache[index]=!terrain&&trailDistance(x,y)<52?1:0;return index;
}
export function sketchGround(x,y){const i=sketchTile(x,y);return i<0?'beach':WILD_BIOMES[biomeCache[i]];}
export function sketchSurface(x,y){const i=sketchTile(x,y);return i<0?'water':['grass','water','shallow'][terrainCache[i]];}
export function sketchBeachMargin(x,y){
 if(inWildPolygon(x,y,island))return 380;
 return beachMargin(x,y,edgeDistance(x,y,coast));
}
const SHELF_VARIATION=15;
function shelfVariation(x,y){
 return 7*Math.sin(x*.047+y*.061)+5*Math.sin(x*.109-y*.079)+3*Math.sin(x*.191+y*.156);
}
// Continuous surface classification is for the pixel-art edge mask only. The
// cached 32px classification above remains authoritative for movement/collision.
export function sketchSurfaceAt(x,y){
 const east=eastWoodlandTerrain(x,y);
 if(east)return east==='water'||east==='shallow'?east:'grass';
 const main=inWildPolygon(x,y,coast),offshore=inWildPolygon(x,y,island),shore=edgeDistance(x,y,main?coast:offshore?island:coast);
 if(!main&&!offshore)return Math.min(shore,Math.abs(paintedMargin(eastWoodland,x,y,180)))<110+shelfVariation(x,y)?'shallow':'water';
 const river=riverDistance(x,y);
 if(river<120+shelfVariation(x,y))return 'water';
 if(river<175)return 'shallow';
 if(sketchBiome(x,y)==='swamp'&&river>240&&Math.sin(x/380)*Math.sin(y/420)>.66)return 'shallow';
 return 'grass';
}
// Distance fields are 1-Lipschitz: a tile farther than its half-diagonal
// from every wet boundary cannot contain a shoreline pixel.
export function sketchUniformSurfaceTile(x,y){
 // Leave a two-pixel apron for the crest geometry at wet/dry tile seams.
 const east=eastWoodlandUniformTile(x,y);if(east!==undefined)return east;
 x+=16;y+=16;const margin=26,shelfMargin=margin+SHELF_VARIATION,main=inWildPolygon(x,y,coast),offshore=inWildPolygon(x,y,island),shore=edgeDistance(x,y,main?coast:offshore?island:coast);
 if(!main&&!offshore)return shore>110+shelfMargin?'water':shore<110-shelfMargin&&shore>margin?'shallow':null;
 if(shore<margin)return null;const river=riverDistance(x,y);
 if(river<120-shelfMargin)return 'water';if(river>120+shelfMargin&&river<175-margin)return 'shallow';
 if(river>175+margin&&((!inWildPolygon(x,y,regions.swamp)&&edgeDistance(x,y,regions.swamp)>margin)||Math.sin(x/380)*Math.sin(y/420)<.66-margin*(1/380+1/420)))return 'grass';return null;
}
export function wildLandsPathAt(x,y){
 const i=sketchTile(x,y);
 return i>=0&&(!!pathCache[i]||mossbellPathAt(x,y)||moonveilPathAt(x,y)||
  tideglassTrailDistance(x,y)<38&&eastWoodlandTerrain(x,y)==='forest');
}
export function moonveilPathAt(x,y){
 return x>=12149&&x<=12262&&y>=4990&&y<=5171&&moonveilTrailDistance(x,y)<21;
}
export function mossbellPathAt(x,y){
 if(x<12554||x>12684||y<4550||y>5090)return false;
 const halfWidth=17+16*Math.max(0,Math.min(1,(y-4688)/192));
 return mossbellTrailDistance(x,y)<halfWidth;
}
export function wildLandsBridgeDeck(d,x,y){return d.wildLands&&!d.activeRoom&&WILD_BRIDGES.some(b=>Math.abs(x-b.x)<b.w/2&&Math.abs(y-b.y)<b.h/2)?10:0;}
