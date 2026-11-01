// Seeded coastal terrain. All collision stays on the ground plane; scenery
// sprite bounds are deliberately unrelated to the two feet of the sea arch.
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
export const BEACH_SCENERY_LIMIT=112;
export const beachShore=(x,seed=0)=>370+Math.sin(x*.005+seed*.013)*38+Math.sin(x*.014)*15;
export const BEACH_PIER=Object.freeze({x:416,y:160,w:64,h:416});
export function beachWorld(seed=0){
 const terrain=Array(2500).fill('sand'),scenery=[],pools=[{x:280,y:1060,rx:100,ry:57},{x:1290,y:1030,rx:74,ry:52},{x:1200,y:1390,rx:100,ry:48}];
 for(let y=0;y<50;y++)for(let x=0;x<50;x++){
  const px=x*32+16,py=y*32+16,shore=beachShore(px,seed),id=y*50+x;
  if(py<shore-62)terrain[id]='water';else if(py<shore+18)terrain[id]='shallow';
  for(const p of pools){const d=((px-p.x)/p.rx)**2+((py-p.y)/p.ry)**2;if(d<1)terrain[id]=d<.30?'water':'shallow';}
  if(px>=BEACH_PIER.x&&px<BEACH_PIER.x+BEACH_PIER.w&&py>=BEACH_PIER.y&&py<BEACH_PIER.y+BEACH_PIER.h)terrain[id]='wood';
 }
 const prop=(kind,x,groundY,size,extra={})=>{const offset=kind==='tree'?.35:.19;scenery.push({id:'coast:'+scenery.length,kind,x,y:groundY-size*offset,rootY:groundY,size,procedural:true,coastal:true,...extra});};
 // The arch spans real open ground, with two small non-harvestable foundations.
 prop('beach_arch',1296,510,244);
 prop('beach_foundation',1219,501,28,{beachFootprint:[23,15]});
 prop('beach_foundation',1373,501,28,{beachFootprint:[23,15]});
 for(const [x,y,size]of [[1430,660,158],[1490,840,168],[1415,1140,142],[120,650,126],[1320,1460,145]])prop('tree',x,y,size,{beachFootprint:[size*.11,12],treeType:'oak',leafHabit:'evergreen'});
 for(const [x,y,size]of [[270,620,124],[190,1370,134],[1200,665,124],[1450,1410,116]])prop('palm',x,y,size,{beachFootprint:[size*.08,10],coconuts:3});
 for(const [i,[x,y,size]]of [[1320,364,142],[1460,382,180],[1530,545,176],[140,370,106],[260,1110,112],[355,1010,78],[1250,1088,86],[1300,1390,94]].entries())prop('rock',x,y,size,{beachFootprint:[size*.30,size*.12],beachCliff:i<3});
 // Broken headlands, isolated sea stacks and a southern boulder shelf. Leave
 // the pier, arch opening and all four board approaches clear and connected.
 for(const [x,y,size]of [[76,432,158],[188,466,124],[326,452,132],[594,440,110],[920,442,128],[1114,470,148],[1512,986,192],[1450,1290,160],[1120,1512,140]])
  prop('rock',x,y,size,{beachFootprint:[size*.26,size*.12],beachCliff:true});
 for(const [x,y,size]of [[88,562,58],[252,518,52],[670,465,54],[1018,505,64],[1168,562,72],[1440,710,66],[1458,1080,68],[1430,1204,54],[1050,1490,68],[996,1510,46],[540,1376,65],[468,1450,48]])
  prop('rock',x,y,size,{beachFootprint:[size*.29,size*.12]});
 for(let i=0;i<230&&scenery.length<BEACH_SCENERY_LIMIT;i++){
  const x=64+hash(seed+i,23)*1472,y=480+hash(seed+i,51)*1050,tx=Math.floor(x/32),ty=Math.floor(y/32);
  if(terrain[ty*50+tx]!=='sand'||Math.hypot(x-800,y-800)<370||scenery.some(p=>Math.hypot(p.x-x,p.rootY-y)<85))continue;
  const r=hash(i,seed+13),size=r>.86?70:40+hash(i,9)*20;
  prop(r>.86?'rock':r>.69?'beach_driftwood':'beach_grass',x,y,size,r>.86?{beachFootprint:[size*.29,size*.10]}:{});
 }
 return {terrain,scenery,house:null,webs:[],beachVersion:2};
}
