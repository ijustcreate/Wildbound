import {block as b, shape as p, line as l, casework} from './diagon-shop-brush.mjs';
import {drawItem} from './item-art.mjs';
import {drawJungleFern} from './fern-art.mjs';

const dark='#403534', maroon='#73463f', rose='#ae655e', pink='#d78d77';
const mint='#648879', cream='#e9ceab', ivory='#f6e2bf', brass='#c39b62';
const wood=[dark,maroon,'#985a4d','#be7b60','#d69672'];
const enamel=[dark,'#4f6966','#75958a','#bec6ac',ivory];

function counter(c) {
  casework(c,-49,0,98,34,12,[dark,maroon,rose,cream,ivory]);
  for(const x of [-42,-14,14]) {
    b(c,x,-18,24,13,maroon);b(c,x+2,-16,20,9,'#b36a5d');
    b(c,x+3,-15,18,1,pink);
  }
  b(c,-40,-31,30,1,'#b39e8c');b(c,9,-28,23,1,'#c3aa93');
}
function scoopCase(c) {
  p(c,dark,[[-23,-2],[-23,-16],[-17,-22],[18,-22],[23,-16],[23,-2],[20,0],[-20,0]]);
  b(c,-21,-16,42,12,'#769997');b(c,-18,-19,36,5,'#acc4b6');
  for(const [x,color,lit] of [[-16,pink,'#f4b299'],[-7,cream,ivory],[2,mint,'#b5c8a0'],[11,'#987259','#bc9371']]) {
    p(c,color,[[x,-6],[x,-11],[x+2,-14],[x+6,-14],[x+8,-11],[x+8,-6]]);
    b(c,x+2,-13,4,2,lit);
  }
  l(c,'#dce2c5',-18,-17,-8,-17);b(c,-21,-4,42,3,maroon);
}
function churn(c) {
  p(c,dark,[[-13,-2],[-14,-25],[-10,-33],[9,-33],[14,-25],[13,-2],[7,0],[-8,0]]);
  p(c,'#91634a',[[-11,-4],[-12,-25],[-8,-30],[9,-30],[12,-25],[11,-4],[7,-2],[-7,-2]]);
  b(c,-9,-27,5,23,'#ba8860');b(c,4,-26,4,23,'#724a3c');b(c,-12,-22,24,4,mint);
  b(c,-12,-11,24,4,'#536d62');b(c,-10,-22,12,1,'#abbea3');
  b(c,-2,-40,4,11,maroon);b(c,-2,-40,11,3,dark);b(c,7,-39,5,5,brass);
}
function syrup(c) {
  b(c,-14,-4,28,4,dark);b(c,-13,-5,26,2,brass);
  for(const [x,h,color] of [[-11,14,'#9b494f'],[-3,17,'#699580'],[6,12,'#bb8958']]) {
    p(c,dark,[[x,-5],[x,-h+4],[x+2,-h+2],[x+2,-h],[x+5,-h],[x+5,-h+3],[x+7,-h+5],[x+7,-5]]);
    b(c,x+1,-h+5,5,h-10,color);b(c,x+2,-h,3,2,brass);b(c,x+1,-8,5,2,cream);
  }
}
function sundae(c) {
  p(c,dark,[[-9,-18],[-6,-22],[-1,-24],[6,-21],[9,-17],[8,-11],[4,-8],
    [2,-5],[2,-3],[6,-3],[6,0],[-6,0],[-6,-3],[-2,-3],[-2,-5],[-5,-8],[-9,-12]]);
  p(c,rose,[[-7,-15],[-7,-19],[-4,-21],[0,-21],[3,-19],[3,-14]]);
  p(c,cream,[[-2,-17],[1,-22],[5,-21],[8,-17],[7,-14],[-2,-14]]);
  p(c,'#9ab7ad',[[-7,-13],[7,-13],[5,-10],[2,-8],[1,-5],[-1,-5],[-2,-8],[-5,-10]]);
  b(c,-4,-1,8,1,cream);b(c,0,-24,3,3,'#ae514b');
}
function cones(c) {
  b(c,-10,-2,20,2,dark);b(c,-9,-8,18,3,maroon);b(c,-8,-8,16,1,brass);
  for(let i=0;i<3;i++) {
    const x=-8+i*6,y=-12+(i%2)*2;
    p(c,'#ae754b',[[x,y],[x+6,y],[x+3,y+9]]);
    b(c,x,y,5,1,cream);b(c,x+2,y+4,2,1,'#8c5b40');
  }
}
function frogs(c) {
  p(c,'#674b66',[[-15,-3],[-10,-10],[10,-10],[15,-4],[12,0],[-12,0]]);
  b(c,-10,-9,20,1,'#c092ae');b(c,-11,-3,22,1,brass);
  drawItem(c,'chocolate_frog',0,-11,17);
}
function register(c) {
  casework(c,-10,-1,20,12,5,[dark,'#776a4a','#9b865b','#c4a56b','#e5c98a']);
  b(c,-7,-16,14,4,dark);b(c,-6,-15,9,2,mint);b(c,-4,-12,9,2,brass);
  b(c,-4,-6,8,1,cream);
}
function table(c) {
  b(c,-11,-17,3,16,dark);b(c,8,-17,3,16,dark);b(c,-1,-21,3,20,maroon);
  p(c,dark,[[-17,-19],[-17,-24],[-11,-29],[11,-29],[17,-24],[17,-19],[11,-15],[-11,-15]]);
  p(c,cream,[[-15,-20],[-15,-24],[-10,-28],[10,-28],[15,-24],[15,-20],[10,-17],[-10,-17]]);
  b(c,-9,-27,11,1,ivory);b(c,7,-21,6,1,'#bda98b');
}
function chair(c) {
  l(c,dark,-8,-17,-8,-2,2);l(c,dark,8,-17,8,-2,2);
  p(c,dark,[[-9,-14],[-9,-25],[-5,-30],[5,-30],[9,-25],[9,-14],[6,-13],[6,-25],
    [3,-28],[-3,-28],[-6,-25],[-6,-13]]);
  l(c,mint,-5,-24,5,-18);l(c,mint,5,-24,-5,-18);
  p(c,maroon,[[-10,-11],[-6,-14],[6,-14],[10,-11],[8,-7],[-8,-7]]);
  b(c,-6,-13,12,2,pink);
}
function menu(c) {
  p(c,dark,[[-17,-5],[-14,-33],[14,-33],[17,-5],[14,0],[9,0],[9,-5],[-9,-5],[-9,0],[-14,0]]);
  b(c,-12,-31,24,23,maroon);b(c,-10,-29,20,19,'#4b6058');
  b(c,-7,-25,14,2,cream);b(c,-7,-20,10,1,ivory);b(c,-7,-17,13,1,'#afc3a5');b(c,-7,-14,9,1,pink);
}
function planter(c) {
  casework(c,-18,0,36,14,5,wood);
  drawJungleFern(c,{x:0,y:-12,seed:4},0,0);
  for(const [x,y] of [[-9,-24],[1,-29],[9,-23]]) {
    b(c,x,y,4,4,cream);b(c,x+1,y-2,2,7,pink);b(c,x+1,y+1,2,2,brass);
  }
}
function parasol(c) {
  b(c,-2,-47,4,46,dark);b(c,-1,-45,1,42,brass);b(c,-10,-3,20,3,'#555e56');
  p(c,dark,[[-32,-27],[-27,-37],[-14,-47],[-2,-51],[3,-51],[16,-46],[28,-37],[32,-27],[25,-25],[-26,-25]]);
  p(c,rose,[[-30,-28],[-26,-37],[-12,-46],[-2,-49],[2,-49],[16,-44],[26,-36],[30,-28]]);
  p(c,cream,[[-22,-28],[-18,-37],[-7,-46],[-2,-49],[-7,-35],[-8,-28]]);
  p(c,cream,[[7,-28],[4,-36],[1,-49],[10,-44],[17,-35],[21,-28]]);
  b(c,-27,-28,54,2,pink);b(c,-2,-54,4,4,brass);
}
function iceChest(c) {
  casework(c,-21,0,42,27,8,enamel);
  b(c,-16,-14,30,10,'#547068');b(c,-14,-12,26,6,'#72978d');
  b(c,-5,-19,10,3,brass);b(c,-4,-19,8,1,cream);
  b(c,-17,-6,34,2,'#bdd0b3');
}

const props=[
  {id:'marble-serving-counter',w:98,h:34,x:-8,y:-5,paint:counter,solid:{width:98,depth:18}},
  {id:'chilled-scoop-case',w:46,h:23,x:-17,y:-30,paint:scoopCase,surface:'marble-serving-counter'},
  {id:'syrup-bottles',w:28,h:19,x:16,y:-34,paint:syrup,surface:'marble-serving-counter'},
  {id:'waffle-cone-rack',w:22,h:16,x:-44,y:-29,paint:cones,surface:'marble-serving-counter'},
  {id:'brass-till',w:22,h:17,x:31,y:-26,paint:register,surface:'marble-serving-counter'},
  {id:'chocolate-frog-tray',w:32,h:23,x:12,y:-24,paint:frogs,surface:'marble-serving-counter'},
  {id:'hand-cranked-churn',w:31,h:42,x:-77,y:-52,paint:churn,solid:{width:26,depth:16}},
  {id:'mint-ice-chest',w:44,h:27,x:53,y:-54,paint:iceChest,solid:{width:42,depth:19}},
  {id:'chalk-menu-easel',w:36,h:34,x:84,y:-37,paint:menu,solid:{width:29,depth:12}},
  {id:'cafe-table',w:34,h:29,x:-66,y:45,paint:table,solid:{width:30,depth:16}},
  {id:'parfait-dish',w:19,h:24,x:-66,y:22,paint:sundae,surface:'cafe-table'},
  {id:'wrought-iron-chair',w:24,h:32,x:-49,y:65,paint:chair,solid:{width:19,depth:12}},
  {id:'striped-cafe-parasol',w:68,h:54,x:-86,y:37,paint:parasol,solid:{width:12,depth:8}},
  {id:'terracotta-flower-box',w:40,h:38,x:81,y:68,paint:planter,solid:{width:34,depth:12}},
];

export default {props};

