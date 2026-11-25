import {block as b, shape as p, line as l, casework} from './diagon-shop-brush.mjs';

const ink='#36383b', stone='#9c9f97', pale='#d9d0b7', cream='#eee0bd';
const brass='#b99a61', gleam='#dfc182', mahogany=[ink,'#59433c','#79554b','#a58063','#c49e73'];

function counter(c) {
  casework(c,-48,0,96,38,13,[ink,'#646868','#9ba39d',pale,cream]);
  b(c,-44,-21,88,2,'#d2ccba');
  for(const x of [-41,-12,17]) {
    b(c,x,-17,24,13,'#777f7e');b(c,x+2,-15,20,9,'#aab0a6');b(c,x+2,-15,20,1,pale);
  }
  b(c,-43,-5,86,2,'#686e6d');
}
function grille(c) {
  p(c,ink,[[-42,0],[-42,-41],[-35,-54],[35,-54],[42,-41],[42,0],[38,0],[38,-39],[32,-50],
    [-32,-50],[-38,-39],[-38,0]]);
  b(c,-33,-50,66,2,gleam);
  for(const x of [-34,-25,-16,16,25,34]){
    b(c,x,-42,2,40,'#665d50');b(c,x,-42,1,32,brass);
  }
  b(c,-37,-40,74,2,brass);b(c,-38,-16,19,2,brass);b(c,19,-16,19,2,brass);
  p(c,brass,[[-6,-50],[0,-54],[6,-50],[0,-44]]);
}
function ledger(c) {
  b(c,-2,-12,4,12,ink);b(c,-8,-2,16,2,mahogany[1]);
  p(c,mahogany[1],[[-12,-12],[-10,-22],[10,-22],[12,-12]]);
  p(c,cream,[[-10,-14],[-8,-21],[-1,-20],[0,-18],[2,-20],[8,-21],[10,-14],[3,-14],[0,-12],[-3,-14]]);
  b(c,-7,-19,4,1,'#96816a');b(c,3,-19,4,1,'#96816a');b(c,-1,-15,2,2,'#aa7a56');
}
function scales(c) {
  b(c,-8,-2,16,2,ink);b(c,-5,-3,10,2,brass);b(c,-1,-21,3,19,brass);
  b(c,-11,-20,23,2,gleam);b(c,0,-23,2,3,gleam);
  for(const x of [-10,10]) {
    l(c,brass,x,-18,x-4,-10);l(c,brass,x,-18,x+4,-10);
    p(c,brass,[[x-6,-10],[x+6,-10],[x+4,-6],[x-4,-6]]);b(c,x-5,-10,8,1,gleam);
  }
}
function galleons(c) {
  for(const [x,y,h] of [[-10,-1,5],[-3,-3,9],[5,-1,5],[8,-5,3]]) {
    b(c,x,y-h,8,h,brass);b(c,x+1,y-h-1,6,2,gleam);b(c,x,y-1,8,1,'#745f49');
    if(h>5)b(c,x,y-4,8,1,'#8d7049');
  }
}
function tray(c) {
  p(c,mahogany[1],[[-14,-2],[-11,-10],[11,-10],[14,-3],[12,0],[-12,0]]);
  p(c,'#655665',[[-13,-2],[-10,-9],[10,-9],[12,-2]]);
  b(c,-9,-6,18,1,'#baa580');b(c,-11,-2,22,1,mahogany[3]);
}
function drawers(c) {
  casework(c,-31,0,62,62,5,[ink,'#4d514f','#71756d','#9b9980','#b4ab8d']);
  for(let j=0;j<5;j++){
    for(let i=0;i<4;i++){
      const x=-27+i*13,y=-54+j*10;
      b(c,x,y,12,9,'#5c605a');b(c,x+1,y+1,10,6,'#8e8d79');
      b(c,x+3,y+2,5,1,brass);b(c,x+5,y+5,2,1,'#4c4f4a');
    }
  }
  b(c,-26,-5,52,2,'#a39d87');
}
function vault(c) {
  p(c,ink,[[-27,0],[-27,-41],[-20,-54],[-9,-62],[12,-62],[23,-52],[27,-40],[27,0]]);
  p(c,'#656f72',[[-24,-3],[-24,-40],[-18,-52],[-8,-59],[10,-59],[21,-50],[24,-38],[24,-3]]);
  p(c,ink,[[-20,-33],[-14,-45],[-6,-50],[9,-50],[17,-42],[20,-33],[17,-18],[7,-12],[-7,-12],[-16,-20]]);
  p(c,'#7a8b88',[[-17,-33],[-12,-43],[-5,-47],[8,-47],[15,-40],[17,-31],[14,-20],[6,-15],[-6,-15],[-13,-21]]);
  l(c,'#afb2a1',-15,-38,-7,-45);l(c,'#a6aa9b',-8,-31,9,-31,2);
  l(c,brass,-6,-36,7,-25,2);l(c,brass,-6,-25,7,-36,2);b(c,-3,-34,6,6,gleam);
  b(c,-20,-31,5,4,brass);b(c,15,-31,5,4,brass);b(c,-23,-5,46,2,pale);
}
function trolley(c) {
  casework(c,-17,-6,34,19,7,mahogany);
  l(c,brass,-17,-24,-22,-34,2);l(c,gleam,-22,-34,-13,-34,2);
  for(const x of [-11,11]) {
    p(c,ink,[[x-4,-7],[x+3,-7],[x+5,-4],[x+3,0],[x-3,0],[x-5,-3]]);
    b(c,x-1,-5,3,3,brass);
  }
  b(c,-13,-13,27,2,brass);b(c,-3,-27,14,5,mahogany[3]);
}
function quill(c) {
  b(c,-6,-6,11,6,ink);b(c,-4,-5,7,4,'#697d80');b(c,-5,-7,9,2,'#99a7a1');
  p(c,cream,[[-2,-4],[0,-15],[4,-21],[11,-24],[10,-18],[5,-13]]);
  l(c,'#c0ad8b',-2,-5,7,-19);
}
function chair(c) {
  b(c,-8,-14,3,14,ink);b(c,6,-14,3,14,ink);
  p(c,mahogany[1],[[-11,-10],[-11,-27],[-8,-32],[8,-32],[11,-27],[11,-10]]);
  p(c,'#795867',[[-8,-15],[-8,-27],[-5,-29],[5,-29],[8,-27],[8,-15]]);
  b(c,-7,-13,14,4,mahogany[3]);b(c,-4,-27,8,1,'#aa8286');
}
function clock(c) {
  p(c,ink,[[-9,0],[-9,-42],[-4,-49],[5,-49],[9,-44],[9,0]]);
  b(c,-7,-39,14,37,mahogany[1]);b(c,-5,-26,10,20,'#443d40');
  b(c,-1,-24,2,12,brass);b(c,-3,-14,6,5,gleam);
  p(c,pale,[[-6,-42],[-3,-46],[4,-46],[7,-42],[5,-37],[-4,-37]]);
  l(c,ink,1,-42,1,-45);l(c,ink,1,-42,4,-41);
}
function rail(c) {
  for(const x of [-23,23]) {
    b(c,x-4,-2,8,2,ink);b(c,x-2,-23,4,22,'#78674e');b(c,x-1,-22,2,20,brass);b(c,x-3,-24,6,3,gleam);
  }
  b(c,-23,-19,46,4,'#73444a');b(c,-23,-19,46,1,'#ae7573');
}
function keyRack(c) {
  p(c,mahogany[1],[[-14,0],[-14,-18],[-10,-24],[10,-24],[14,-18],[14,0]]);
  b(c,-11,-19,22,16,mahogany[3]);b(c,-11,-20,22,2,mahogany[4]);
  for(const [x,y] of [[-7,-15],[0,-13],[7,-16]]) {
    b(c,x-2,y,5,3,brass);b(c,x,y+3,2,7,brass);b(c,x+1,y+8,3,2,gleam);
  }
}

const props=[
  {id:'marble-teller-desk',w:98,h:39,x:-7,y:-4,paint:counter,solid:{width:96,depth:18}},
  {id:'bronze-teller-grille',w:86,h:55,x:-7,y:-38,paint:grille,surface:'marble-teller-desk'},
  {id:'ledger-stand',w:26,h:24,x:-31,y:-29,paint:ledger,surface:'marble-teller-desk'},
  {id:'precision-balance',w:34,h:25,x:8,y:-30,paint:scales,surface:'marble-teller-desk'},
  {id:'velvet-counting-tray',w:30,h:12,x:27,y:-25,paint:tray,surface:'marble-teller-desk'},
  {id:'galleon-stacks',w:36,h:13,x:25,y:-26,paint:galleons,surface:'marble-teller-desk'},
  {id:'deposit-drawer-wall',w:63,h:63,x:-67,y:-63,paint:drawers,solid:{width:62,depth:13}},
  {id:'round-vault-door',w:56,h:63,x:47,y:-65,paint:vault,solid:{width:54,depth:12}},
  {id:'coin-trolley',w:47,h:35,x:-78,y:56,paint:trolley,solid:{width:34,depth:13}},
  {id:'bank-quill-and-ink',w:24,h:25,x:-46,y:-27,paint:quill,surface:'marble-teller-desk'},
  {id:'banker-chair',w:24,h:33,x:-63,y:-39,paint:chair,solid:{width:18,depth:11}},
  {id:'pendulum-clock',w:21,h:50,x:5,y:-66,paint:clock,solid:{width:18,depth:8}},
  {id:'velvet-queue-rail',w:54,h:25,x:71,y:56,paint:rail,solid:{width:50,depth:4}},
  {id:'vault-key-board',w:30,h:25,x:82,y:-44,paint:keyRack},
];

export default {props, keeper:{x:-8,y:-31}};
