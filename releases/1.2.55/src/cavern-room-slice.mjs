// Opt-in playable room for visual review. Uses editable terrain and native props.
import {realmProp} from './realm-layout.mjs';
import {makeCavernNativeSample} from './cavern-native-sample.mjs';

const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const rooms=[{x:440,y:800,rx:200,ry:162},{x:730,y:700,rx:98,ry:91}];
const tunnel=[{x:575,y:745},{x:630,y:683},{x:685,y:690}];
const segment=(x,y,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a.x-dx*t,y-a.y-dy*t);};
const inside=(x,y)=>Math.min(...rooms.map(r=>Math.hypot((x-r.x)/r.rx,(y-r.y)/r.ry)-1),Math.min(...[0,1].map(i=>segment(x,y,tunnel[i],tunnel[i+1])-49))/49);
const pool=(x,y)=>Math.min(Math.hypot((x-350)/93,(y-838)/66)-1,Math.hypot((x-407)/74,(y-864)/49)-1);

export function installCavernRoomSlice(g,assets,renderer){
 const native={limestone_shelf:makeCavernNativeSample('limestone_shelf'),cave_crystal:makeCavernNativeSample('cave_crystal')};
 Object.assign(assets.library,native);assets.cache.clear();g.spriteLibrary=assets.library;
 for(let ty=0;ty<50;ty++)for(let tx=0;tx<50;tx++){
  const x=tx*32+16,y=ty*32+16,d=inside(x,y),water=pool(x,y);
  g.terrain[ty*50+tx]=d>0?'cave_void':water<-.12?'water':water<.12?'shallow':'cave_floor';
 }
 const props=[];
 for(const [kind,x,y,size] of [
  ['limestone_shelf',278,737,92],['limestone_shelf',384,652,80],['limestone_shelf',516,915,102],
  ['cave_crystal',376,668,80],['cave_crystal',750,676,72],['cave_crystal',719,742,54],
  ['stalagmite',541,672,56],['stalagmite',470,938,62],['cave_mushroom',290,802,43],['cave_mushroom',860,697,38],
  ['cave_drip',354,879,24]
 ])props.push(realmProp(kind,x,y,props.length,{size}));
 g.scenery=props;g.realmState={version:1,env:'caverns',seed:g.seed,settings:{hazardWarning:1.6,hazardDamage:5},chambers:rooms.map(r=>({...r,r:130})),links:[[0,1]],animals:[],event:null};
 g.generatedEnvironment='caverns';g.environment='caverns';g.bloom=3;g.time=20;g.weather=null;g.enemies=[];g.supplyChests=[];g.effects=[];
 const originalFloor=renderer.floor.bind(renderer);
 renderer.floor=(ctx,w,h,game)=>{
  originalFloor(ctx,w,h,game);ctx.save();
  // Replace the pool's square tile seams with a broad irregular limestone bank.
  ctx.fillStyle='#495258';ctx.fillRect(256,768,224,160);
  const shape=(points,color)=>{ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(const [x,y]of points.slice(1))ctx.lineTo(x,y);ctx.closePath();ctx.fillStyle=color;ctx.fill();};
  shape([[267,820],[281,806],[302,801],[319,786],[346,783],[365,793],[384,788],[408,797],[428,808],[455,810],[468,829],[457,847],[462,868],[442,882],[421,882],[402,900],[376,899],[355,909],[333,898],[311,900],[296,884],[278,879],[269,860],[258,843]],'#63827b');
  shape([[280,826],[296,814],[318,812],[333,796],[351,795],[369,803],[388,798],[406,808],[425,817],[448,818],[456,833],[447,847],[451,864],[431,874],[413,872],[394,889],[374,887],[355,897],[336,886],[315,889],[303,874],[284,869],[277,853],[269,841]],'#315963');
  shape([[281,827],[296,816],[317,814],[332,799],[350,798],[366,806],[386,802],[402,811],[420,820],[444,821],[451,835],[443,847],[447,859],[429,868],[411,866],[393,882],[374,880],[356,889],[338,879],[317,882],[307,869],[288,864],[282,850],[275,840]],'#244852');
  ctx.fillStyle='#9fc6b5';for(const [x,y,wave]of [[296,834,18],[327,820,12],[378,842,16],[424,833,11],[344,865,14]])ctx.fillRect(x,y,wave,2);
  ctx.fillStyle='#bdd1b4';ctx.fillRect(290,826,7,1);ctx.fillRect(370,817,9,1);ctx.fillRect(432,850,6,1);
  ctx.restore();
 };
 return {spawn:{x:440,y:790},rooms,tunnel,props,native};
}
