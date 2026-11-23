// Landscape tracing of the approved sketch, in normalized map coordinates.
export const LAND_OUTLINE=[[.03,.09],[.12,.04],[.24,.065],[.31,.025],[.43,.04],[.49,.075],[.55,.035],[.68,.045],[.75,.02],[.86,.05],[.96,.08],[.975,.22],[.95,.34],[.975,.45],[.95,.56],[.98,.66],[.955,.76],[.90,.80],[.86,.87],[.78,.895],[.72,.96],[.62,.925],[.54,.96],[.46,.91],[.36,.955],[.28,.91],[.20,.93],[.15,.865],[.08,.85],[.055,.74],[.025,.68],[.055,.57],[.025,.48],[.045,.35],[.02,.27]];
export const PORTAL_ISLAND=[[.88,.875],[.92,.855],[.965,.88],[.98,.935],[.95,.975],[.89,.96],[.865,.92]];
export const REGION_SHAPES={
 jungle:[[.045,.06],[.23,.06],[.33,.045],[.43,.07],[.445,.23],[.42,.35],[.30,.375],[.19,.35],[.07,.38]],
 swamp:[[.70,.04],[.91,.055],[.965,.09],[.95,.29],[.90,.325],[.77,.32],[.71,.29]],
 ice:[[.46,.43],[.53,.405],[.60,.43],[.605,.49],[.655,.51],[.65,.64],[.60,.69],[.57,.665],[.49,.685],[.445,.635],[.45,.54],[.43,.50]],
 graveyard:[[.13,.535],[.23,.515],[.335,.545],[.36,.62],[.34,.82],[.26,.865],[.155,.845],[.12,.76]],
 house:[[.43,.73],[.56,.72],[.615,.78],[.59,.88],[.44,.875],[.405,.81]]
};
const scale=points=>points.map(([x,y])=>[x*16000,y*9600]);
const coast=scale(LAND_OUTLINE),island=scale(PORTAL_ISLAND),regions=Object.fromEntries(Object.entries(REGION_SHAPES).map(([k,v])=>[k,scale(v)]));
export function inWildPolygon(x,y,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
const segmentDistance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-u*dx,y-a[1]-u*dy);};
function edgeDistance(x,y,polygon){let best=Infinity;for(let i=0;i<polygon.length;i++)best=Math.min(best,segmentDistance(x,y,polygon[i],polygon[(i+1)%polygon.length]));return best;}
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
export const WILD_BRIDGES=[{id:'woodland',x:10900,y:4710,w:760,h:110},{id:'bayou',x:12960,y:3230,w:110,h:720},{id:'south',x:8870,y:7600,w:150,h:820}];
export const WILD_BIOMES=['forest','jungle','ice','graveyard','house','beach','swamp'];
export function sketchBiome(x,y){for(const [kind,polygon]of Object.entries(regions))if(inWildPolygon(x,y,polygon))return kind;return 'forest';}
const biomeCache=new Uint8Array(500*300).fill(255),terrainCache=new Uint8Array(500*300),pathCache=new Uint8Array(500*300);
export function sketchTile(x,y){
 const tx=Math.floor(x/32),ty=Math.floor(y/32);if(tx<0||ty<0||tx>=500||ty>=300)return -1;
 const index=ty*500+tx;if(biomeCache[index]!==255)return index;
 x=tx*32+16;y=ty*32+16;const main=inWildPolygon(x,y,coast),offshore=inWildPolygon(x,y,island),shore=edgeDistance(x,y,main?coast:offshore?island:coast);
 let biome=sketchBiome(x,y),terrain=0;
 if(!main&&!offshore)terrain=shore<110?2:1;
 else{
  if(offshore||shore<380||x<2200&&y>3200||y>8400)biome='beach';
  const river=riverDistance(x,y);if(river<120)terrain=1;else if(river<175)terrain=2;
  if(biome==='swamp'&&river>240){const wet=Math.sin(x/380)*Math.sin(y/420);if(wet>.66)terrain=2;}
 }
 biomeCache[index]=WILD_BIOMES.indexOf(biome);terrainCache[index]=terrain;pathCache[index]=!terrain&&trailDistance(x,y)<52?1:0;return index;
}
export function sketchGround(x,y){const i=sketchTile(x,y);return i<0?'beach':WILD_BIOMES[biomeCache[i]];}
export function sketchSurface(x,y){const i=sketchTile(x,y);return i<0?'water':['grass','water','shallow'][terrainCache[i]];}
// Continuous surface classification is for the pixel-art edge mask only. The
// cached 32px classification above remains authoritative for movement/collision.
export function sketchSurfaceAt(x,y){
 const main=inWildPolygon(x,y,coast),offshore=inWildPolygon(x,y,island),shore=edgeDistance(x,y,main?coast:offshore?island:coast);
 if(!main&&!offshore)return shore<110?'shallow':'water';
 const river=riverDistance(x,y);
 if(river<120)return 'water';
 if(river<175)return 'shallow';
 if(sketchBiome(x,y)==='swamp'&&river>240&&Math.sin(x/380)*Math.sin(y/420)>.66)return 'shallow';
 return 'grass';
}
// Distance fields are 1-Lipschitz: a tile farther than its half-diagonal
// from every wet boundary cannot contain a shoreline pixel.
export function sketchUniformSurfaceTile(x,y){
 x+=16;y+=16;const margin=23,main=inWildPolygon(x,y,coast),offshore=inWildPolygon(x,y,island),shore=edgeDistance(x,y,main?coast:offshore?island:coast);
 if(!main&&!offshore)return shore>110+margin?'water':shore<110-margin?'shallow':null;
 if(shore<margin)return null;const river=riverDistance(x,y);
 if(river<120-margin)return 'water';if(river>120+margin&&river<175-margin)return 'shallow';
 if(river>175+margin&&((!inWildPolygon(x,y,regions.swamp)&&edgeDistance(x,y,regions.swamp)>margin)||Math.sin(x/380)*Math.sin(y/420)<.66-margin*(1/380+1/420)))return 'grass';return null;
}
export function wildLandsPathAt(x,y){const i=sketchTile(x,y);return i>=0&&!!pathCache[i];}
export function wildLandsBridgeDeck(d,x,y){return d.wildLands&&!d.activeRoom&&WILD_BRIDGES.some(b=>Math.abs(x-b.x)<b.w/2&&Math.abs(y-b.y)<b.h/2)?10:0;}
