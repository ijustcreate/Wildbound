import {block as b, shape as p, line as l, casework} from './diagon-shop-brush.mjs';
import {OLLIVANDERS_LAYOUT} from './diagon-wand-shop-layout.mjs';
import {drawFlooHearth} from './floo-art.mjs';
import {flooFireGreen} from './floo-travel.mjs';

const oak=['#272632','#393142','#514355','#736179','#ae8593'];
const copper=['#332c34','#514049','#805b5e','#a77a6e','#d1a282'];
const teal=['#23343d','#304852','#426068','#698982','#b3bc9f'];
const ink='#242933',bronze='#b9976b',silver='#c5c3bb',purple='#9382b1';

function bottle(c,x,y,height,color){
 l(c,ink,x-3,y-2,x-3,y-height+4,7);
 b(c,x-3,y-height+1,5,3,bronze);
 p(c,color,[[x-5,y-2],[x-5,y-height+6],[x-2,y-height+3],[x+1,y-height+3],[x+5,y-height+7],[x+5,y-2]]);
 b(c,x-4,y-height+7,1,height-9,silver);
 b(c,x-4,y-6,7,2,'#d8d0ac');
}
function caseShelf(c,palette,paint){
 casework(c,-26,0,52,50,5,palette);
 b(c,-23,-40,46,28,ink);
 for(const y of [-37,-21]){
  paint(c,y);
  b(c,-24,y,48,3,palette[2]);b(c,-22,y,43,1,palette[3]);
 }
}
function moonChart(c){
 p(c,copper[3],[[-18,0],[-17,-24],[-12,-33],[12,-33],[17,-24],[18,0]]);
 b(c,-14,-24,28,22,oak[0]);
 p(c,purple,[[-2,-21],[-8,-17],[-9,-11],[-4,-7],[2,-7],[5,-10],[0,-10],[-3,-14]]);
 for(const [x,y] of [[-10,-20],[9,-20],[7,-12],[-9,-7]])b(c,x,y,2,1,silver);
}
function robe(c){
 l(c,bronze,0,-1,0,-56,3);b(c,-11,-3,22,3,oak[1]);
 p(c,ink,[[-8,-51],[7,-51],[15,-44],[9,-34],[15,-9],[4,-5],[-14,-8],[-10,-33],[-16,-41]]);
 p(c,'#455674',[[-6,-49],[6,-49],[11,-43],[6,-35],[12,-10],[2,-8],[-11,-10],[-8,-35],[-13,-41]]);
 l(c,'#8189a0',-6,-48,-4,-12,2);l(c,'#a89a80',0,-49,2,-11);
 b(c,-6,-43,5,3,bronze);
}
function hat(c){
 p(c,oak[0],[[-14,-3],[-10,-10],[-6,-12],[-3,-27],[2,-28],[11,-23],[4,-21],[7,-10],[15,-6],[13,-2]]);
 p(c,'#624a76',[[-12,-5],[-5,-10],[-2,-25],[2,-26],[8,-23],[3,-21],[5,-11],[11,-6],[5,-4]]);
 b(c,-4,-11,10,2,bronze);b(c,0,-12,3,3,silver);
}
function folded(c){
 for(const [dx,dy,color] of [[0,-3,'#455775'],[-2,-7,'#7b5c78'],[1,-11,'#91848c']]){
  p(c,color,[[-14+dx,dy],[-11+dx,dy-5],[10+dx,dy-5],[14+dx,dy-1],[11+dx,dy+2],[-12+dx,dy+1]]);
  b(c,-8+dx,dy-4,16,1,'#b39a9b');
 }
}
function curiousTray(c){
 casework(c,-16,0,32,9,4,copper);
 for(const [x,h,color] of [[-8,5,purple],[0,9,silver],[8,6,'#6ea29d']])
  p(c,color,[[x-3,-7],[x,-7-h],[x+3,-8],[x+1,-5],[x-2,-5]]);
}
function wandCrate(c){
 casework(c,-23,0,46,29,6,oak);
 for(const [x,color] of [[-15,bronze],[-7,'#bb937b'],[2,'#a587a5'],[10,silver]])
  l(c,color,x,-24,x+10,-34,2);
}
function copperGloves(c){
 for(const x of [-6,7]){
  p(c,copper[1],[[x-6,-2],[x-6,-12],[x-1,-15],[x+2,-12],[x+7,-11],[x+6,-5],[x+1,-1]]);
  p(c,copper[3],[[x-5,-3],[x-4,-11],[x,-13],[x+4,-10],[x+4,-5],[x+1,-3]]);
  b(c,x-5,-4,8,1,silver);
 }
}
function retort(c){
 casework(c,-22,0,44,17,6,teal);
 l(c,copper[3],-14,-16,-14,-47,3);l(c,copper[3],-14,-47,7,-47,3);
 l(c,silver,7,-46,12,-39,3);
 p(c,ink,[[8,-40],[13,-40],[13,-34],[20,-28],[21,-22],[17,-17],[7,-17],[4,-23],[8,-33]]);
 p(c,'#629f95',[[10,-38],[12,-38],[12,-34],[18,-28],[19,-22],[16,-19],[8,-19],[6,-23],[10,-32]]);
 b(c,8,-24,2,4,'#c1e2bb');b(c,9,-26,3,1,'#c1e2bb');
}
function mortar(c){
 p(c,ink,[[-11,-7],[11,-7],[10,-2],[5,0],[-5,0],[-10,-3]]);
 p(c,teal[3],[[-9,-8],[9,-8],[9,-6],[5,-2],[-5,-2],[-8,-4]]);
 l(c,silver,0,-7,10,-16,3);
}
function fern(c){
 p(c,copper[2],[[-8,-8],[8,-8],[6,-1],[-6,0]]);
 for(const [x,y] of [[-11,-25],[-4,-29],[3,-30],[11,-22]])l(c,'#7eab84',0,-8,x,y,2);
}
function lamp(c,time,phosphor){
 b(c,-8,-4,16,4,copper[1]);l(c,copper[2],0,-2,0,-32,3);b(c,-8,-33,16,5,ink);
 const color=Math.sin(time*3.2)>.1?phosphor[0]:phosphor[1];
 p(c,color,[[-7,-27],[7,-27],[6,-15],[-6,-15]]);
 b(c,-1,-28,2,13,bronze);b(c,-7,-15,14,2,copper[3]);
}
const curioLight=(c,time)=>lamp(c,time,['#edc08c','#be8886']);
const apothecaryLight=(c,time)=>lamp(c,time,['#b2d5a5','#8ca9a8']);
const solid=(width,depth)=>({width,depth});
const prop=(id,label,x,y,w,h,paint,more={})=>({id,label,x,y,w,h,paint,...more});
function counter(id,palette){return prop(id,'enamel and brass counter',-10,-5,96,39,
 c=>casework(c,-48,0,96,36,13,palette),{solid:OLLIVANDERS_LAYOUT.counter});}
const curiosCounter='curios-counter', nightCounter='nightglass-counter';

export const nocturneCurios={keeper:{x:-10,y:-36},props:[
 counter(curiosCounter,copper),
 prop('moon-chart','carved moon chart',-72,-60,40,35,moonChart),
 prop('curios-cabinet','glazed arcane cabinet',-23,-57,54,53,c=>caseShelf(c,oak,(pen,y)=>{
  for(const [x,height,color] of [[-15,11,purple],[0,15,teal[3]],[14,10,copper[3]]])bottle(pen,x,y,height,color);
 }),{solid:solid(52,12)}),
 prop('robe-form','moonstitch fitting form',42,-57,36,59,robe,{solid:solid(24,11)}),
 prop('curios-fireplace','curio shop fireplace',76,-48,46,58,
  (c,time,g)=>drawFlooHearth(c,time,flooFireGreen(g,'nocturne-curios')),{animated:true,depthOffset:-16}),
 prop('wand-crate','open ashwood wand crate',-79,44,47,38,wandCrate,{solid:solid(46,14)}),
 prop('hat-stand','plum inkcap and stand',-28,56,33,51,c=>{b(c,-10,-5,20,5,copper[2]);l(c,bronze,0,-4,0,-24,3);c.translate(0,-20);hat(c);},{solid:solid(19,9)}),
 prop('display-bench','mantle folding bench',44,57,48,24,c=>casework(c,-22,0,44,20,6,oak),{solid:solid(44,11)}),
 prop('mantle-folds','folded navy mantles',43,57,35,36,c=>{c.translate(0,-21);folded(c);},{surface:'display-bench'}),
 prop('pin-tray','lavender pin tray',-34,-5,34,46,c=>{c.translate(0,-37);curiousTray(c);},{surface:curiosCounter}),
 prop('silver-polish','counter polishing cloth',25,-5,31,49,c=>{c.translate(0,-35);folded(c);},{surface:curiosCounter}),
 prop('curios-window-lamp','lantern at the entrance',87,50,22,38,curioLight,{animated:true}),
 prop('curios-fern','fern in a copper pot',-87,-27,24,32,fern),
]};
export const nightglass={keeper:{x:-10,y:-36},props:[
 counter(nightCounter,teal),
 prop('bottle-cabinet','moonmint bottle shelves',-63,-56,54,52,c=>caseShelf(c,teal,(pen,y)=>{
  for(const [x,height,color] of [[-15,13,teal[3]],[-5,10,purple],[5,15,'#81a779'],[15,11,copper[3]]])bottle(pen,x,y,height,color);
 }),{solid:solid(52,12)}),
 prop('nightglass-retort','bubbling copper retort',5,-59,46,51,retort,{solid:solid(44,13)}),
 prop('ingredient-stand','nightglass ingredient rack',55,-56,52,53,c=>caseShelf(c,copper,(pen,y)=>{
  for(const x of [-15,0,15]){b(pen,x-5,y-10,10,9,teal[1]);b(pen,x-4,y-8,8,2,silver);}
 }),{solid:solid(50,12)}),
 prop('nightglass-lamp','green glass shelf lamp',86,-50,21,36,apothecaryLight,{animated:true}),
 prop('brewing-bench','moonmint workbench',-72,52,46,23,c=>casework(c,-22,0,44,21,7,teal),{solid:solid(44,11)}),
 prop('mortar','stone mortar and pestle',-76,52,24,40,c=>{c.translate(0,-23);mortar(c);},{surface:'brewing-bench'}),
 prop('moonmint','sprigs of moonmint',-60,52,27,49,c=>{c.translate(0,-21);fern(c);},{surface:'brewing-bench'}),
 prop('copperweave-gloves','copperweave gloves',-35,-5,27,52,c=>{c.translate(0,-36);copperGloves(c);},{surface:nightCounter}),
 prop('tonic-samples','moonmint tonic samples',-2,-5,31,53,c=>{bottle(c,-9,-36,16,teal[3]);bottle(c,6,-36,14,'#a49bca');},{surface:nightCounter}),
 prop('lodestone-tray','lodestone brooch tray',23,-5,34,52,c=>{c.translate(0,-37);curiousTray(c);},{surface:nightCounter}),
 prop('nightglass-ferns','sidewalk herbs',74,58,25,34,fern),
 prop('nightglass-glassware','green mixing glasses',19,53,36,33,c=>{
  casework(c,-17,0,34,17,5,copper);bottle(c,-7,-17,12,'#7d98a9');bottle(c,7,-17,14,teal[3]);
 },{solid:solid(34,11)}),
 prop('entrance-mint-lamp','mint glass entry lantern',87,40,20,36,apothecaryLight,{animated:true}),
]};
