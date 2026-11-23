import {block, shape, line, casework} from './diagon-shop-brush.mjs';

// Slugg & Jiggers. Drawn at the approved Ollivanders pixel scale.
// Staggered cabinets frame a copper still and a round, iron cauldron.
// Upper-left light favors copper and bottle shoulders; lower faces stay quiet.
// The green enamel counter and corked samples identify the shop from the doorway.
const oak = ['#302b28', '#504038', '#765744', '#9a7351', '#c19a67'];
const enamel = ['#273733', '#304740', '#486151', '#638070', '#92a58a'];
const iron = ['#252d2c', '#36423e', '#4c5951', '#69766a', '#9a9d7f'];
const copper = ['#4a332e', '#69433b', '#945a43', '#c68456', '#ecc18a'];
const brass = ['#4f4632', '#726043', '#a08650', '#c6a767', '#edd199'];
const stone = ['#3c423a', '#586053', '#808476', '#a2a18c', '#c7c1a6'];
const wicker = ['#4a3c2d', '#705436', '#997345', '#bd9458', '#dcb577'];
const glass = {
  green: ['#243d36', '#31564a', '#477661', '#6e9c73', '#c3ce9d'],
  violet: ['#383348', '#554860', '#77647d', '#9d889d', '#d1b1ba'],
  amber: ['#4b3b2e', '#775338', '#a57b4b', '#caa468', '#ecd19b'],
  blue: ['#2b3c40', '#3d545d', '#597878', '#7d9d90', '#c2ccac'],
};

function bottle(c, x, y, w, h, color, squared) {
  const left = x - Math.floor(w / 2);
  const right = left + w;
  const shoulder = y - h + 6;
  const [ink, shade, body, light, glint] = color;
  shape(c, ink, [[left,y-1],[left,shoulder+2],[left+2,shoulder-1],[x-2,y-h+3],
    [x-2,y-h+1],[x+2,y-h+1],[x+2,y-h+3],[right-2,shoulder-1],
    [right,shoulder+2],[right,y-1],[right-2,y],[left+2,y]]);
  shape(c, body, [[left+1,y-2],[left+1,shoulder+2],[left+3,shoulder],
    [x-1,shoulder-2],[x+1,shoulder-2],[right-2,shoulder+2],[right-2,y-2]]);
  block(c,left+2,shoulder+2,1,Math.max(2,y-shoulder-5),light);
  block(c,right-3,shoulder+4,1,Math.max(1,y-shoulder-6),shade);
  block(c,x-2,y-h,4,2,oak[3]);
  block(c,x-2,y-h,2,1,oak[4]);
  if (squared) {
    block(c,left+2,y-7,w-3,4,'#b5ad83');
    block(c,left+3,y-6,w-6,1,shade);
  } else {
    block(c,left+2,shoulder+3,2,1,glint);
  }
}

function bottleRack(c) {
  shape(c, oak[0], [[-25,-58],[-19,-65],[19,-65],[25,-59],[25,-3],
    [22,0],[-22,0],[-25,-3]]);
  block(c,-22,-59,44,56,oak[1]);
  block(c,-18,-56,36,47,'#2e3730');
  block(c,-21,-56,3,52,oak[2]);
  block(c,18,-56,3,52,oak[2]);
  block(c,-24,-60,48,3,oak[3]);
  block(c,-19,-62,33,2,oak[4]);
  block(c,-17,-56,34,1,'#627362');
  const rows = [
    [[-13,9,13,glass.green],[-3,8,18,glass.amber],[6,8,15,glass.green],[14,6,10,glass.violet]],
    [[-13,8,10,glass.violet],[-4,7,12,glass.blue],[5,10,13,glass.green],[15,6,9,glass.amber]],
    [[-13,8,10,glass.amber],[-4,9,11,glass.green],[6,9,9,glass.blue],[15,6,11,glass.violet]],
  ];
  for (const [index,row] of rows.entries()) {
    const y = -38 + 14 * index;
    for (const [x,w,h,color] of row) bottle(c,x,y,w,h,color,false);
    block(c,-18,y,36,3,oak[2]);
    block(c,-17,y,32,1,oak[3]);
  }
  block(c,-20,-7,40,4,oak[2]);
  block(c,-20,-7,33,1,oak[3]);
}

function drawers(c) {
  casework(c,-22,0,44,38,5,oak);
  // The wide tray at the top is a working surface. Two brass label rows below.
  block(c,-19,-26,36,21,'#46372f');
  for (const y of [-24,-18,-12]) {
    for (const x of [-17,-5,7]) {
      block(c,x,y,10,5,oak[2]);
      block(c,x,y,8,1,oak[3]);
      block(c,x+3,y+2,4,2,brass[1]);
      block(c,x+4,y+2,2,1,brass[4]);
    }
  }
  block(c,-20,-4,40,2,oak[3]);
}

function copperStill(c) {
  // Distinct raised vat, shoulder-neck junction, and open negative spaces in the spiral.
  casework(c,-20,0,40,15,4,oak);
  line(c,copper[0],-9,-41,-9,-52,4);
  line(c,copper[0],-9,-52,-4,-57,4);
  line(c,copper[0],-4,-57,9,-57,4);
  line(c,copper[0],9,-57,16,-54,4);
  line(c,copper[3],-10,-42,-10,-51,1);
  line(c,copper[3],-10,-51,-4,-58,1);
  line(c,copper[4],-4,-58,7,-58,1);
  line(c,copper[2],7,-58,16,-55,2);
  for (let turn = 0; turn < 4; turn++) {
    const y = -52 + 6 * turn;
    shape(c,copper[0],[[10,y],[18,y],[21,y+2],[20,y+5],[11,y+6],[7,y+4],[7,y+2]]);
    block(c,11,y+1,7,2,copper[3]);
    block(c,10,y+3,9,1,'#4b4438');
    block(c,13,y+4,6,1,copper[2]);
    block(c,9,y+2,2,1,copper[4]);
  }
  block(c,14,-30,3,10,copper[1]);
  block(c,14,-28,1,7,copper[3]);
  shape(c,copper[0],[[-10,-47],[-5,-47],[-4,-42],[-1,-39],[2,-33],[2,-28],
    [-1,-23],[-7,-20],[-15,-21],[-19,-26],[-20,-33],[-18,-38],[-13,-42],[-12,-47]]);
  shape(c,copper[2],[[-11,-44],[-6,-44],[-7,-41],[-3,-37],[0,-32],[-2,-26],
    [-6,-23],[-13,-23],[-17,-28],[-17,-34],[-15,-38],[-11,-41]]);
  shape(c,copper[3],[[-13,-38],[-10,-39],[-7,-36],[-9,-31],[-15,-30],[-16,-32],[-15,-36]]);
  block(c,-13,-36,4,2,copper[4]);
  block(c,-13,-35,2,2,copper[4]);
  block(c,-10,-46,3,2,copper[4]);
  block(c,-16,-27,12,2,copper[1]);
  block(c,-16,-25,8,1,copper[3]);
  block(c,-15,-21,3,4,copper[0]);
  block(c,-4,-22,3,5,copper[1]);
  shape(c,copper[0],[[8,-20],[11,-23],[18,-23],[21,-20],[21,-14],[19,-12],[10,-12],[8,-14]]);
  block(c,10,-20,9,6,copper[2]);
  block(c,11,-19,2,4,copper[4]);
}

function castStove(c) {
  shape(c,iron[0],[[-15,-17],[-11,-23],[11,-23],[16,-17],[16,-5],[12,-2],
    [10,0],[7,0],[7,-2],[-7,-2],[-8,0],[-12,0],[-12,-3],[-15,-5]]);
  shape(c,iron[2],[[-12,-16],[-10,-21],[9,-21],[13,-17],[13,-13],[-12,-13]]);
  block(c,-11,-17,20,1,iron[3]);
  block(c,-12,-12,22,8,iron[2]);
  block(c,-8,-12,14,8,iron[0]);
  block(c,-6,-11,10,5,'#a95539');
  block(c,-5,-9,7,3,'#e89953');
  block(c,-4,-8,3,2,'#f3c277');
  for (const x of [-5,-1,3]) block(c,x,-11,1,6,iron[1]);
  block(c,-11,-4,23,1,iron[3]);
}

function cauldron(c, time) {
  shape(c,iron[0],[[-17,-19],[-13,-24],[13,-24],[17,-19],[16,-9],
    [11,-4],[9,-4],[9,0],[6,0],[5,-4],[-6,-4],[-8,0],[-11,0],[-11,-5],
    [-15,-8],[-17,-12]]);
  shape(c,iron[2],[[-14,-17],[-9,-15],[11,-16],[14,-18],[13,-10],
    [9,-6],[-8,-6],[-12,-10]]);
  shape(c,iron[3],[[-13,-16],[-8,-14],[-8,-9],[-10,-9],[-12,-11]]);
  shape(c,iron[1],[[6,-16],[14,-18],[13,-10],[9,-6],[2,-6],[8,-10]]);
  block(c,-18,-18,4,3,iron[2]);
  block(c,15,-18,3,4,iron[2]);
  shape(c,iron[3],[[-15,-21],[-11,-24],[11,-24],[16,-21],[12,-17],[-12,-17]]);
  shape(c,'#4f6942',[[-12,-21],[-8,-23],[9,-23],[13,-21],[9,-19],[-11,-19]]);
  block(c,-8,-21,14,1,'#a3b673');
  block(c,-4,-22,6,1,'#c6cc85');
  for (const [i,x] of [-6,1,8].entries()) {
    const phase = ((time || 0) * .63 + i * .37) % 1;
    const y = -25 - Math.floor(phase * 15);
    block(c,x+(y%2),y,2,2,phase > .6 ? '#84946c' : '#bbcc80');
    if (phase < .45) block(c,x+(y%2),y,1,1,'#d9dfa0');
  }
}

function herbRail(c) {
  c.save();
  c.translate(0,-16);
  block(c,-22,-29,44,3,oak[0]);
  block(c,-19,-29,37,1,oak[3]);
  const sprigs = [['#536744','#93a166'],['#6b536e','#aa879d'],['#8a7950','#c3a879']];
  for (const [i,x] of [-14,0,14].entries()) {
    const [shade,lit] = sprigs[i];
    block(c,x-1,-26,2,6,oak[4]);
    shape(c,shade,[[x-2,-20],[x+2,-20],[x+6,-13],[x+4,-10],[x+5,-6],
      [x+2,-4],[x+1,-1],[x-2,-4],[x-4,-3],[x-5,-9],[x-6,-12]]);
    line(c,lit,x-1,-19,x-2,-6,1);
    line(c,lit,x-2,-12,x-5,-10,1);
    line(c,lit,x-2,-14,x+2,-10,1);
    block(c,x+1,-9,2,2,lit);
  }
  c.restore();
}

function rootBasket(c) {
  shape(c,wicker[0],[[-15,-12],[-11,-18],[11,-18],[15,-12],[12,-3],
    [7,0],[-8,0],[-12,-3]]);
  shape(c,wicker[2],[[-13,-12],[13,-12],[11,-4],[7,-1],[-7,-1],[-11,-4]]);
  shape(c,wicker[1],[[5,-12],[13,-12],[11,-4],[7,-1],[3,-1]]);
  block(c,-12,-9,22,1,wicker[3]);
  block(c,-10,-5,19,1,wicker[3]);
  block(c,-9,-3,11,1,wicker[4]);
  block(c,-13,-13,26,3,wicker[4]);
  block(c,-10,-16,20,3,wicker[0]);
  const roots = [[-8,-14,-12,-23,5],[-4,-13,-6,-23,5],[2,-14,5,-25,6],[8,-14,11,-21,5]];
  for (const [x,y,end,top,width] of roots) {
    line(c,'#634831',x,y,end,top,width);
    line(c,'#ad8b5b',x-1,y-1,end-1,top,2);
    line(c,'#84633e',x,y-1,x+3,y-5,1);
  }
}

function mushroomTray(c) {
  shape(c,oak[0],[[-17,-7],[-13,-13],[14,-13],[17,-7],[16,-1],[-16,-1]]);
  block(c,-15,-6,30,4,oak[2]);
  block(c,-15,-6,27,1,oak[4]);
  for (const [x,y,size] of [[-9,-9,5],[0,-10,6],[9,-8,5],[-3,-8,4]]) {
    block(c,x-1,y-6,3,6,'#cbbc90');
    shape(c,'#584332',[[x-size,y-6],[x-size+1,y-9],[x-2,y-11],
      [x+2,y-11],[x+size-1,y-9],[x+size,y-6]]);
    shape(c,'#9c6b4c',[[x-size+1,y-7],[x-size+2,y-9],[x+2,y-10],
      [x+size-1,y-8],[x+size-1,y-7]]);
    block(c,x-2,y-9,3,1,'#c49663');
  }
}

function mandrake(c) {
  // One stepped pair of leaves and a root face establish a living silhouette.
  shape(c,'#374631',[[0,-18],[-8,-24],[-16,-25],[-16,-29],[-11,-33],[-7,-33],
    [-3,-29],[-4,-36],[-1,-40],[4,-39],[7,-34],[5,-27],[11,-30],[16,-29],
    [18,-25],[14,-22],[8,-24],[5,-21],[2,-15]]);
  shape(c,'#608052',[[-15,-28],[-10,-32],[-7,-31],[-2,-25],[-7,-26],[-12,-28]]);
  shape(c,'#8e9d5b',[[-3,-35],[-1,-39],[3,-38],[5,-34],[3,-27],[0,-28]]);
  shape(c,'#789454',[[7,-26],[12,-29],[16,-28],[17,-25],[11,-26],[7,-23]]);
  line(c,'#b1b96c',-1,-36,1,-28,1);
  shape(c,'#5c4536',[[-8,-17],[-8,-23],[-5,-26],[3,-26],[7,-23],[8,-16],[4,-12],[-5,-13]]);
  shape(c,'#a9875b',[[-6,-17],[-6,-22],[-3,-24],[2,-24],[5,-22],[5,-15],[-3,-14]]);
  block(c,-4,-21,1,2,'#493933');
  block(c,2,-21,1,2,'#493933');
  block(c,-2,-18,3,1,'#644836');
  shape(c,'#53382f',[[-13,-15],[12,-15],[12,-10],[9,-2],[7,0],[-8,0],[-10,-3]]);
  shape(c,'#a1674d',[[-11,-12],[10,-12],[8,-4],[5,-1],[-7,-2],[-9,-5]]);
  block(c,-11,-14,22,3,'#c28758');
  block(c,-8,-13,12,1,'#e3a571');
  line(c,'#bc7953',-8,-10,-6,-4,2);
  line(c,'#82503f',7,-10,5,-4,2);
}

function salesCounter(c) {
  casework(c,-43,0,86,32,10,enamel);
  shape(c,stone[0],[[-43,-21],[-39,-33],[38,-33],[43,-23],[41,-19],[-41,-19]]);
  shape(c,stone[2],[[-41,-22],[-38,-32],[37,-32],[41,-23],[39,-21],[-39,-21]]);
  block(c,-35,-31,48,1,stone[3]);
  block(c,-29,-28,9,1,stone[3]);
  block(c,12,-24,14,1,stone[1]);
  block(c,-40,-21,80,2,stone[3]);
  block(c,-35,-21,29,1,stone[4]);
  for (const x of [-37,-13,11]) {
    block(c,x,-15,19,10,enamel[1]);
    block(c,x+2,-14,15,7,enamel[2]);
    block(c,x+2,-14,13,1,enamel[3]);
  }
  // Small gold potion mark joins the façade's mortar motif.
  shape(c,brass[1],[[26,-14],[28,-15],[33,-15],[34,-14],[33,-11],[36,-8],
    [35,-5],[26,-5],[25,-8],[28,-11]]);
  block(c,29,-13,3,1,brass[4]);
  block(c,28,-8,5,2,brass[3]);
  block(c,-38,-3,72,1,enamel[3]);
}

function mortar(c) {
  line(c,stone[0],1,-10,8,-19,5);
  line(c,stone[2],0,-11,7,-20,3);
  line(c,stone[4],0,-12,7,-21,1);
  shape(c,stone[0],[[-11,-9],[-9,-13],[8,-13],[11,-10],[10,-4],[6,0],[-7,0],[-10,-4]]);
  shape(c,stone[2],[[-9,-8],[9,-8],[7,-3],[5,-1],[-6,-1],[-8,-3]]);
  shape(c,stone[1],[[2,-9],[9,-8],[7,-3],[5,-1],[0,-1],[4,-4]]);
  block(c,-9,-11,18,3,stone[3]);
  block(c,-7,-11,9,1,stone[4]);
  block(c,-6,-10,10,1,'#454f3c');
  block(c,-4,-7,4,2,stone[3]);
}

function sampleJars(c) {
  block(c,-14,-3,28,3,oak[0]);
  block(c,-13,-3,26,1,oak[4]);
  bottle(c,-9,-3,8,13,glass.green,true);
  bottle(c,0,-3,8,17,glass.violet,true);
  bottle(c,9,-3,8,11,glass.amber,true);
}

function balance(c) {
  const ink = brass[0];
  block(c,-7,-3,14,3,ink);
  block(c,-6,-3,11,1,brass[3]);
  block(c,-2,-20,4,17,brass[2]);
  block(c,-1,-20,1,15,brass[4]);
  shape(c,brass[1],[[-13,-18],[-7,-18],[0,-21],[6,-18],[12,-18],[12,-16],
    [6,-16],[0,-19],[-6,-16],[-13,-16]]);
  block(c,-12,-18,5,1,brass[3]);
  block(c,-1,-21,2,1,brass[4]);
  for (const x of [-10,10]) {
    line(c,brass[2],x,-16,x-4,-8,1);
    line(c,brass[2],x,-16,x+4,-8,1);
    shape(c,ink,[[x-5,-9],[x+5,-9],[x+4,-6],[x+1,-4],[x-2,-4],[x-4,-6]]);
    block(c,x-4,-9,8,1,brass[3]);
    block(c,x-3,-7,5,1,brass[2]);
  }
}

function violetLamp(c) {
  shape(c,iron[0],[[-8,-3],[-4,-5],[-2,-6],[-2,-31],[2,-31],[2,-6],
    [4,-5],[8,-3],[7,0],[-7,0]]);
  block(c,-1,-28,1,23,brass[2]);
  block(c,-5,-3,8,1,brass[3]);
  shape(c,copper[0],[[-8,-29],[-9,-35],[-8,-40],[-5,-43],[-2,-44],[-2,-47],
    [2,-47],[2,-44],[6,-43],[9,-39],[9,-31],[6,-28],[-6,-28]]);
  shape(c,'#7f526f',[[-7,-34],[-6,-39],[-3,-42],[3,-42],[6,-38],[7,-33],[4,-30],[-4,-30]]);
  shape(c,'#be8399',[[-5,-34],[-4,-39],[-2,-41],[1,-41],[3,-38],[4,-34],[2,-31],[-3,-31]]);
  block(c,-2,-39,2,5,'#edd0bc');
  block(c,-2,-38,1,4,'#fff0ce');
  block(c,-6,-43,10,2,copper[3]);
  block(c,-6,-30,11,2,copper[3]);
}

export default {
  props: [
    {id:'bottle_rack',label:'Bottle wall rack',w:51,h:65,x:-75,y:-58,solid:{width:47,depth:14},paint:bottleRack},
    {id:'ingredient_drawers',label:'Ingredient drawers',w:44,h:38,x:-24,y:-58,solid:{width:41,depth:14},paint:drawers},
    {id:'copper_still',label:'Copper distillation coil',w:45,h:59,x:28,y:-57,solid:{width:39,depth:14},paint:copperStill},
    {id:'violet_lamp',label:'Violet glass lamp',w:20,h:47,x:76,y:-49,solid:{width:12,depth:8},paint:violetLamp},
    {id:'herb_rail',label:'Hanging herbs',w:45,h:45,x:-24,y:-80,paint:herbRail},
    {id:'cast_stove',label:'Small cast stove',w:32,h:23,x:-76,y:-18,solid:{width:29,depth:16},paint:castStove},
    {id:'brew_cauldron',label:'Bubbling cauldron',w:37,h:43,x:-76,y:-34,surface:'cast_stove',animated:true,paint:cauldron},
    {id:'sales_counter',label:'Green enamel sales counter',w:87,h:33,x:-5,y:-4,solid:{width:81,depth:17},paint:salesCounter},
    {id:'sample_jars',label:'Sample jars',w:28,h:20,x:-32,y:-28,surface:'sales_counter',paint:sampleJars},
    {id:'stone_mortar',label:'Stone mortar and pestle',w:23,h:22,x:-4,y:-29,surface:'sales_counter',paint:mortar},
    {id:'brass_balance',label:'Brass balance',w:31,h:21,x:23,y:-28,surface:'sales_counter',paint:balance},
    {id:'root_basket',label:'Root basket',w:32,h:28,x:-72,y:64,solid:{width:27,depth:12},paint:rootBasket},
    {id:'mushroom_tray',label:'Mushroom tray',w:35,h:25,x:-33,y:66,solid:{width:31,depth:11},paint:mushroomTray},
    {id:'mandrake_pot',label:'Mandrake pot',w:36,h:40,x:80,y:65,solid:{width:24,depth:13},paint:mandrake},
  ],
};
