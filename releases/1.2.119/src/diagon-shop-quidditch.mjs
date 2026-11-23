import {block as b, shape as p, line, casework} from './diagon-shop-brush.mjs';
import {drawBroom} from './broom-art.mjs';

// Native orthographic shop view. Oxblood panels and worn green paint remain
// muted around the strong broom silhouette and small gold display case.
const teak = ['#302825','#52382f','#795243','#ac7954','#d4a475'];
const vermilion = ['#3b2a2c','#573339','#784249','#a85c60','#c48677'];
const green = ['#303631','#3f5146','#536d58','#769278','#a8a480'];
const brass = ['#443b32','#735938','#ae844c','#d0a971','#f4d58d'];
const leather = ['#46352e','#79523d','#a97850','#c19469','#deb088'];
const iron = ['#2c3235','#465052','#586664','#7c8880','#a0a08e'];
const define = (id,w,h,x,y,paint,extras={}) => ({id,w,h,x,y,paint,...extras});

function standingRack(c) {
  p(c,teak[0],[[-26,-9],[-24,-58],[-20,-64],[20,-64],[24,-58],[26,-8],[22,-3],[-23,-3]]);
  p(c,green[1],[[-24,-10],[-22,-57],[-19,-62],[19,-62],[22,-58],[24,-10]]);
  b(c,-20,-58,40,44,'#41352e');
  for (const [i,x] of [-15,-6,4,13].entries()) {
    const lean=[-4,3,-2,4][i];
    const heel=-20+i%2;
    line(c,teak[0],x,heel,x+lean,-68+i*3,3);
    line(c,teak[3],x-1,heel-1,x+lean-1,-68+i*3,1);
    p(c,leather[0],[[x-2,heel-2],[x+2,heel-2],[x+5,-11],[x+3,-6],[x-5,-6],[x-6,-10]]);
    p(c,leather[2],[[x-2,heel],[x+1,heel],[x+3,-12],[x+2,-7],[x-4,-7],[x-4,-10]]);
    b(c,x-3,heel-1,6,2,brass[2]);
    line(c,leather[3],x-2,heel+2,x-3,-9);
  }
  b(c,-23,-14,46,4,green[2]);
  b(c,-22,-14,43,1,green[3]);
  b(c,-23,-9,46,7,teak[2]);
  b(c,-21,-8,42,2,teak[3]);
  b(c,-23,-3,5,3,teak[0]);
  b(c,18,-3,5,3,teak[0]);
}

function nimbusDisplay(c) {
  p(c,teak[0],[[-43,-12],[-43,-28],[-39,-33],[37,-33],[43,-28],[43,-12],[39,-8],[-39,-8]]);
  p(c,vermilion[1],[[-41,-12],[-41,-27],[-37,-31],[36,-31],[41,-27],[41,-13],[38,-10],[-38,-10]]);
  p(c,vermilion[2],[[-39,-12],[-38,-27],[-35,-29],[21,-29],[34,-26],[20,-15],[-22,-13]]);
  b(c,-36,-30,71,1,brass[2]);
  b(c,-37,-11,75,1,brass[1]);
  b(c,-26,-17,4,7,brass[2]);
  b(c,26,-17,4,7,brass[2]);
  // Same silhouette as the inventory and riding item, displayed broadside.
  drawBroom(c,{pelvis:{x:-7,y:-22}},2,'nimbus_2000');
  b(c,-10,-9,20,7,teak[0]);
  b(c,-8,-8,16,4,brass[2]);
  b(c,-6,-7,12,1,brass[4]);
  b(c,-4,-5,8,1,brass[1]);
}

function workbench(c) {
  p(c,teak[0],[[-25,-24],[-20,-31],[19,-31],[25,-24],[25,-19],[22,-16],[21,-1],[17,0],[15,-2],[15,-8],[-15,-8],[-15,-1],[-19,0],[-22,-2],[-23,-17],[-25,-19]]);
  p(c,teak[3],[[-23,-25],[-19,-29],[18,-29],[22,-25],[20,-22],[-21,-22]]);
  b(c,-20,-25,37,1,teak[4]);
  b(c,-22,-22,44,5,teak[2]);
  b(c,-20,-17,39,4,teak[1]);
  b(c,-20,-16,4,14,teak[3]);
  b(c,16,-16,4,14,teak[2]);
  b(c,-16,-9,32,3,teak[2]);
  b(c,14,-26,7,7,iron[1]);
  b(c,15,-27,5,2,iron[3]);
  b(c,20,-22,3,2,iron[3]);
}

function toolPanel(c) {
  p(c,teak[0],[[-18,-30],[-15,-34],[15,-34],[18,-31],[18,-5],[15,-1],[-15,-1],[-18,-5]]);
  b(c,-16,-31,32,28,teak[1]);
  b(c,-15,-31,30,3,teak[3]);
  b(c,-14,-27,28,1,teak[2]);
  b(c,-14,-13,28,1,teak[2]);
  line(c,teak[3],-11,-10,-11,-24,2);
  p(c,iron[2],[[-15,-25],[-13,-27],[-7,-27],[-6,-25],[-7,-22],[-14,-22]]);
  line(c,leather[2],-2,-10,2,-24,2);
  p(c,iron[3],[[1,-24],[0,-28],[2,-29],[3,-26],[6,-25],[6,-23],[4,-21]]);
  p(c,iron[2],[[7,-25],[13,-27],[15,-24],[14,-12],[11,-8],[8,-11],[7,-16]]);
  b(c,9,-25,3,2,iron[4]);
  b(c,9,-11,4,3,teak[3]);
}

function bristles(c) {
  for (const [x,y] of [[-8,-1],[3,-5]]) {
    p(c,leather[0],[[x-7,y-5],[x-5,y-9],[x+8,y-13],[x+12,y-10],[x+10,y-3],[x+3,y],[x-6,y]]);
    p(c,leather[2],[[x-6,y-5],[x-4,y-8],[x+8,y-11],[x+10,y-9],[x+9,y-5],[x+3,y-2],[x-5,y-1]]);
    line(c,leather[3],x-5,y-5,x+8,y-10);
    line(c,brass[1],x+3,y-10,x+5,y-4,2);
    b(c,x+2,y-9,3,1,brass[3]);
  }
}

function sportsBall(c,x,y,mode='red') {
  c.save();
  c.translate(x,y);
  const color=mode==='red'?vermilion:iron;
  p(c,color[0],[[-5,-10],[5,-10],[9,-7],[11,-3],[9,2],[5,5],[-5,5],[-9,2],[-11,-3],[-9,-7]]);
  p(c,color[2],[[-5,-9],[4,-9],[8,-7],[9,-3],[8,1],[4,3],[-4,3],[-8,0],[-9,-4]]);
  p(c,color[3],[[-6,-7],[-1,-9],[3,-8],[-1,-6],[-4,-3],[-7,-4]]);
  p(c,color[1],[[2,-6],[6,-6],[8,-3],[5,1],[3,3],[0,3],[2,-1]]);
  if(mode==='red') {
    line(c,color[0],-7,0,4,-6);
    line(c,color[3],-6,0,4,-5);
    b(c,4,-7,3,2,color[1]);
  }
  c.restore();
}

function quaffleLocker(c) {
  p(c,teak[0],[[-22,-33],[-18,-39],[18,-39],[22,-33],[22,-4],[18,0],[-18,0],[-22,-4]]);
  b(c,-20,-33,40,30,vermilion[1]);
  b(c,-17,-32,34,21,'#4c4445');
  sportsBall(c,0,-22);
  p(c,'#87918b',[[-16,-31],[-8,-31],[-15,-18],[-16,-19]]);
  b(c,-20,-37,40,4,teak[2]);
  b(c,-17,-37,33,1,teak[4]);
  b(c,-18,-12,36,3,teak[3]);
  b(c,-14,-5,28,2,vermilion[2]);
  b(c,-5,-8,10,3,brass[2]);
  b(c,-3,-8,6,1,brass[4]);
}

function bludgerCrate(c) {
  p(c,teak[0],[[-22,-14],[-17,-26],[17,-26],[22,-14],[22,-4],[18,0],[-18,0],[-22,-4]]);
  p(c,teak[1],[[-20,-13],[-16,-24],[16,-24],[20,-13],[20,-4],[-20,-4]]);
  sportsBall(c,-7,-11,'iron');
  sportsBall(c,8,-11,'iron');
  p(c,teak[2],[[-21,-13],[21,-13],[20,-3],[-20,-3]]);
  b(c,-21,-13,42,2,teak[3]);
  for(const x of [-13,-5,5,13]) {
    line(c,iron[1],x*0.8,-25,x,-11,2);
    line(c,iron[3],x*0.8-1,-25,x-1,-12,1);
  }
  b(c,-7,-9,14,4,iron[2]);
  b(c,-5,-8,10,1,iron[3]);
}

function snitchDome(c) {
  p(c,teak[0],[[-17,-7],[-17,-15],[-13,-22],[-6,-26],[7,-26],[14,-22],[18,-15],[18,-7],[16,-1],[-16,-1]]);
  p(c,'#596c65',[[-15,-8],[-15,-14],[-10,-22],[-5,-24],[6,-24],[12,-21],[16,-14],[16,-8]]);
  p(c,'#6e8177',[[-14,-12],[-12,-18],[-8,-21],[-3,-22],[-5,-18],[-11,-14]]);
  p(c,'#e3d5ab',[[-14,-15],[-7,-17],[-4,-15],[-2,-12],[-8,-13],[-12,-14],[-8,-10],[-3,-11],[-1,-9],[-5,-8],[-9,-9]]);
  p(c,'#e3d5ab',[[3,-11],[5,-15],[13,-17],[13,-15],[8,-11],[5,-9]]);
  p(c,brass[1],[[-4,-13],[-1,-16],[3,-16],[5,-13],[5,-10],[2,-8],[-2,-8],[-4,-10]]);
  p(c,brass[4],[[-3,-13],[-1,-15],[2,-15],[4,-13],[1,-10],[-3,-10]]);
  b(c,-17,-8,35,6,teak[2]);
  b(c,-16,-8,33,1,teak[4]);
  b(c,-6,-4,12,2,brass[2]);
}

function scoreBoard(c) {
  p(c,teak[0],[[-25,-28],[-19,-34],[19,-34],[25,-28],[25,-4],[22,0],[-22,0],[-25,-4]]);
  p(c,green[1],[[-22,-27],[-18,-31],[18,-31],[22,-27],[22,-4],[-22,-4]]);
  b(c,-19,-25,38,20,'#334442');
  b(c,-2,-23,3,15,teak[2]);
  b(c,-16,-23,10,2,vermilion[3]);
  b(c,6,-23,10,2,'#bab393');
  b(c,-15,-18,9,8,brass[2]);
  b(c,-13,-17,6,2,'#334442');
  b(c,-12,-14,4,2,'#334442');
  b(c,6,-18,10,8,brass[2]);
  b(c,8,-17,6,6,'#334442');
  b(c,-18,-28,35,1,green[3]);
  b(c,-18,-6,37,1,green[3]);
}

function pennants(c) {
  b(c,-29,-29,57,3,teak[2]);
  b(c,-27,-29,53,1,teak[3]);
  for (const [x,deep,shade,light] of [[-25,20,vermilion[2],vermilion[3]],[-7,25,green[2],green[3]],[12,19,'#626681','#8288a1']]) {
    p(c,teak[0],[[x,-27],[x+15,-27],[x+15,-9],[x+7,-27+deep],[x,-10]]);
    p(c,shade,[[x+1,-26],[x+14,-26],[x+14,-10],[x+7,-28+deep],[x+1,-11]]);
    p(c,light,[[x+1,-26],[x+4,-26],[x+5,-17],[x+2,-13]]);
    b(c,x+6,-22,5,2,brass[3]);
    b(c,x+7,-19,3,3,brass[2]);
  }
}

function gloves(c) {
  p(c,teak[0],[[-18,-12],[-14,-19],[14,-19],[18,-13],[17,-8],[13,-7],[12,-1],[9,0],[8,-7],[-8,-7],[-9,0],[-12,-1],[-13,-7],[-17,-8]]);
  b(c,-16,-13,32,5,teak[2]);
  b(c,-14,-14,28,2,teak[3]);
  for (const x of [-8,8]) {
    p(c,leather[0],[[x-6,-15],[x-7,-24],[x-4,-27],[x-2,-26],[x-1,-30],[x+2,-30],[x+3,-26],[x+5,-27],[x+6,-24],[x+5,-14]]);
    p(c,leather[2],[[x-5,-16],[x-6,-23],[x-4,-26],[x-2,-25],[x,-29],[x+2,-29],[x+4,-25],[x+4,-16]]);
    b(c,x-4,-20,6,3,leather[1]);
    b(c,x-5,-17,9,2,leather[3]);
  }
}

function polish(c) {
  p(c,vermilion[1],[[-11,-2],[-9,-8],[2,-12],[11,-8],[9,-1],[1,0]]);
  p(c,vermilion[3],[[-9,-3],[-8,-7],[1,-10],[6,-8],[1,-5]]);
  b(c,2,-12,7,8,iron[1]);
  b(c,3,-11,5,6,iron[3]);
  b(c,3,-14,5,3,brass[1]);
  b(c,3,-14,4,1,brass[4]);
  line(c,leather[3],-8,-3,4,-5,2);
  b(c,-8,-3,5,3,leather[1]);
}

function splitClock(c) {
  p(c,teak[0],[[-13,-13],[-12,-20],[-5,-25],[5,-25],[12,-20],[13,-12],[10,-5],[3,-1],[-5,-1],[-11,-6]]);
  p(c,brass[2],[[-12,-13],[-10,-19],[-4,-23],[4,-23],[10,-19],[11,-13],[9,-6],[3,-3],[-4,-3],[-10,-7]]);
  p(c,'#e6cda1',[[-10,-13],[-8,-18],[-3,-21],[3,-21],[8,-18],[9,-13],[7,-7],[2,-5],[-3,-5],[-8,-8]]);
  for(const [x,y] of [[-1,-20],[6,-14],[-9,-14],[-1,-8]]) b(c,x,y,2,2,teak[2]);
  line(c,teak[0],0,-13,-2,-18);
  line(c,teak[0],0,-13,6,-12);
  b(c,-1,-13,2,2,vermilion[2]);
}

function salesCounter(c) {
  casework(c,-46,0,92,32,8,vermilion);
  p(c,vermilion[1],[[-41,-20],[41,-20],[39,-8],[-39,-8]]);
  for(const x of [-33,0,33]) {
    p(c,vermilion[2],[[x-7,-17],[x+7,-17],[x+9,-13],[x+5,-9],[x-4,-9],[x-8,-12]]);
    b(c,x-6,-17,10,1,vermilion[3]);
  }
  b(c,-42,-23,81,2,teak[1]);
  b(c,-35,-30,58,1,vermilion[4]);
}

export default {
  props: [
    define('standing-broom-rack',52,69,-64,-56,standingRack,{solid:{width:48,depth:14}}),
    define('featured-nimbus',86,34,-1,-58,nimbusDisplay),
    define('broom-workbench',50,31,-78,24,workbench,{solid:{width:46,depth:19}}),
    define('broom-tool-panel',36,34,-84,-7,toolPanel),
    define('replacement-bristles',34,19,-86,2,bristles,{surface:'broom-workbench'}),
    define('quaffle-locker',44,39,69,-52,quaffleLocker,{solid:{width:39,depth:16}}),
    define('caged-bludgers',44,26,-66,65,bludgerCrate,{solid:{width:42,depth:19}}),
    define('golden-snitch-dome',35,26,22,-29,snitchDome,{surface:'quidditch-till'}),
    define('quidditch-scoreboard',50,34,56,-93,scoreBoard),
    define('team-pennants',58,29,-8,-99,pennants),
    define('keeper-gloves-stand',36,30,69,62,gloves,{solid:{width:30,depth:13}}),
    define('polishing-kit',22,14,-69,1,polish,{surface:'broom-workbench'}),
    define('match-clock',26,25,95,-94,splitClock),
    define('quidditch-till',92,32,-7,-5,salesCounter,{solid:{width:92,depth:18}}),
  ],
};
