import {block as b,shape as p,line as l,casework} from './diagon-shop-brush.mjs';

// Hand-set oak, aged brass and green gallery glass share an upper-left light.
const oak=['#29242b','#413039','#5e4448','#87635b','#b88d73'];
const blackwood=['#27252e','#3a3743','#534c5a','#716071','#a17d81'];
const brass=['#4a3b3b','#77604b','#9e8059','#c1a26d','#e3c380'];
const jade=['#293c3a','#3d6252','#5f8a70','#8eb598','#c3d6a8'];
const age=['#4a3d3b','#796657','#a38d71','#c5b38c','#dcd2a2'];
const binds=[['#423549','#776273','#a1818e'],['#393943','#5c7166','#879077'],
 ['#493733','#86594f','#a68266'],['#393847','#615e78','#878396']];

function oldBook(c,x,y,width,height,spine){
 const colors=binds[spine%binds.length];
 p(c,colors[0],[[x,y+3],[x+3,y],[x+width,y],[x+width+1,y+height],[x,y+height]]);
 b(c,x+1,y+3,width-3,height-3,colors[1]);b(c,x+2,y+3,1,height-4,colors[2]);
 b(c,x+width-3,y+2,2,height-2,age[2]);b(c,x+width-2,y+2,1,height-3,age[3]);
 b(c,x+2,y+4,width-4,1,brass[2]);b(c,x+2,y+height-3,width-4,1,colors[0]);
}

function horizontalBook(c,x,y,width,spine){
 const colors=binds[spine%binds.length];
 p(c,colors[0],[[x,y+2],[x+3,y],[x+width-3,y],[x+width,y+2],[x+width-1,y+8],[x,y+8]]);
 b(c,x+2,y+2,width-4,1,colors[2]);b(c,x+2,y+3,width-6,3,age[2]);
 b(c,x+4,y+4,width-8,1,age[3]);b(c,x+1,y+6,width-2,1,colors[1]);
}

function cabinet(c){
 p(c,oak[0],[[-24,-58],[-17,-66],[-9,-68],[10,-68],[18,-64],[24,-57],
  [24,-4],[20,0],[-20,0],[-24,-4]]);
 p(c,oak[1],[[-21,-56],[-16,-63],[-8,-66],[10,-66],[16,-61],[21,-56],[21,-4],[-21,-4]]);
 p(c,oak[3],[[-22,-57],[-17,-62],[-9,-66],[10,-66],[16,-62],[20,-56],[11,-61],[-9,-63],[-17,-58]]);
 b(c,-20,-53,40,36,oak[0]);b(c,-18,-51,35,33,'#302a34');
 for(const [level,y] of [-43,-30].entries()){
  for(let i=0;i<4;i++){
   const x=-16+i*8,height=8+(i*5+level)%8;
   oldBook(c,x,y-height,6,height,i+level);
  }
  b(c,-19,y+1,36,2,oak[3]);
 }
 b(c,-18,-53,2,35,oak[3]);b(c,17,-54,2,36,oak[2]);b(c,-1,-53,2,35,oak[2]);
 p(c,'#bbbaa046',[[-17,-49],[-9,-53],[-4,-53],[-16,-25]]);
 p(c,'#97aca43c',[[4,-51],[10,-53],[16,-53],[5,-33]]);
 b(c,-5,-34,2,4,brass[4]);b(c,3,-34,2,4,brass[2]);
 for(const side of [-1,1]){
  b(c,side>0?2:-19,-16,17,12,oak[2]);b(c,side>0?2:-19,-16,17,1,oak[3]);
  b(c,side*9-2,-11,5,2,brass[3]);
 }
 b(c,-21,-5,41,3,oak[3]);
}

function cotteredShelves(c){
 casework(c,-23,0,46,57,7,blackwood);b(c,-19,-47,38,38,blackwood[0]);
 for(const [j,y] of [-34,-18].entries()){
  for(let i=0;i<5;i++){
   const h=8+(i*7+j)%9;oldBook(c,-18+i*7,y-h,5+i%2,h,i+j);
  }
  b(c,-20,y+1,40,3,blackwood[3]);b(c,-18,y+1,34,1,blackwood[4]);
 }
 for(let i=0;i<24;i++){
  const x=-19+i*1.65,y=-44+i*.88;
  b(c,x,y,4,2,brass[0]);if(i%2===0)b(c,x+1,y,2,1,brass[3]);
 }
 b(c,1,-26,8,9,brass[0]);b(c,2,-24,6,6,brass[3]);b(c,4,-23,2,4,brass[1]);
 b(c,-21,-7,42,3,blackwood[3]);
}

function mirror(c,time=0){
 const outer=[[-16,-20],[-22,-35],[-21,-57],[-14,-70],[-5,-74],[10,-73],[20,-62],[21,-43],[15,-26],[5,-20]];
 p(c,oak[0],outer);p(c,brass[1],[[-16,-24],[-19,-37],[-17,-59],[-11,-69],[-4,-71],[8,-70],
  [16,-62],[18,-44],[13,-29],[3,-23]]);
 p(c,'#273d43',[[-13,-29],[-16,-38],[-13,-58],[-9,-66],[-2,-68],[8,-67],[13,-60],[15,-44],[10,-31],[3,-27]]);
 l(c,brass[3],-14,-57,-11,-66,2);l(c,brass[4],-7,-68,2,-70);l(c,brass[2],17,-44,11,-29,2);
 const phase=Math.sin(time*1.2);
 p(c,'#496265',[[-12,-49],[-5,-58],[3,-65],[9,-63],[3,-56],[-4,-51],[-9,-43]]);
 p(c,phase>.12?'#597977':'#3d5c61',[[4,-59],[11,-57],[14,-49],[9,-43],[2,-41],[1,-49]]);
 l(c,'#96afa0',-10,-53,-2,-61);b(c,10,-52,2,3,'#7a9890');
 b(c,-4,-26,8,20,oak[0]);b(c,-3,-24,4,18,brass[2]);
 p(c,oak[0],[[-15,-3],[-8,-9],[7,-9],[15,-3],[12,0],[-12,0]]);
 b(c,-10,-5,21,2,brass[2]);
}

function relicHand(c){
 p(c,age[0],[[-6,0],[-6,-7],[-10,-13],[-11,-19],[-8,-22],[-6,-19],[-6,-27],[-3,-29],
  [-1,-25],[0,-31],[3,-31],[4,-25],[6,-29],[9,-27],[8,-21],[11,-22],[12,-19],[8,-12],[6,-7],[5,0]]);
 p(c,age[1],[[-4,-2],[-5,-9],[-8,-14],[-8,-19],[-5,-16],[-4,-25],[-2,-25],[-1,-18],
  [1,-28],[2,-28],[3,-17],[6,-25],[7,-25],[6,-16],[10,-19],[10,-17],[6,-13],[4,-8],[4,-2]]);
 l(c,age[2],-4,-14,-2,-8,2);l(c,age[3],1,-23,1,-17);l(c,age[2],5,-16,3,-11);
 b(c,-3,-7,7,2,brass[3]);b(c,0,-6,2,1,brass[4]);
}

function handCase(c){
 casework(c,-17,0,34,25,5,oak);
 p(c,jade[0],[[-15,-23],[-16,-52],[-11,-60],[10,-60],[16,-53],[16,-23]]);
 p(c,'#405851',[[-12,-25],[-13,-51],[-9,-57],[9,-57],[13,-52],[13,-25]]);
 c.save();c.translate(0,-25);relicHand(c);c.restore();
 p(c,'#a7c1a03c',[[-12,-45],[-8,-55],[-4,-55],[-12,-35]]);l(c,jade[2],11,-53,11,-30);
 b(c,-16,-25,32,3,brass[2]);b(c,-13,-25,24,1,brass[4]);b(c,-14,-56,28,2,brass[2]);
}

function bellJar(c,time=0){
 p(c,jade[0],[[-12,-1],[-13,-14],[-10,-23],[-6,-26],[7,-26],[11,-21],[13,-11],[12,-1]]);
 p(c,'#466157',[[-10,-3],[-11,-13],[-9,-21],[-4,-24],[5,-24],[10,-20],[10,-4]]);
 p(c,'#7e8c73',[[-7,-5],[-6,-9],[-2,-13],[0,-17],[5,-17],[7,-14],[6,-9],[3,-6],[-1,-7],[-4,-4]]);
 b(c,2,-14,3,2,'#2d453d');b(c,-6,-9,2,2,'#4e6455');l(c,'#a9bea3',-8,-18,-9,-7);
 const orbit=(Math.floor(time*4.5))%6;
 b(c,orbit-4,-18+orbit%3,2,1,'#bdd5a7');b(c,-12,-2,24,2,brass[2]);
}

function balance(c){
 p(c,brass[0],[[-14,-2],[-9,-6],[9,-6],[14,-2],[11,0],[-11,0]]);
 b(c,-1,-26,3,21,brass[2]);b(c,-1,-24,1,16,brass[4]);
 l(c,brass[1],-13,-20,12,-22,3);l(c,brass[3],-13,-21,12,-23);
 for(const [x,y] of [[-11,-14],[11,-16]]){
  l(c,brass[2],x,y-7,x-5,y);l(c,brass[2],x,y-7,x+5,y);
  p(c,brass[2],[[x-7,y],[x+7,y],[x+3,y+4],[x-4,y+4]]);b(c,x-5,y,10,1,brass[4]);
 }
 b(c,0,-25,2,2,brass[4]);
}

function chainedLedger(c){
 p(c,oak[0],[[-17,-3],[-14,-13],[-7,-14],[0,-11],[7,-15],[14,-14],[17,-5],[11,-1],[0,-4],[-9,-1]]);
 p(c,age[2],[[-15,-4],[-12,-12],[-7,-13],[-1,-10],[-1,-4],[-8,-6]]);
 p(c,age[3],[[0,-10],[7,-14],[12,-13],[15,-5],[8,-6],[1,-3]]);
 for(const [x,y,w] of [[-11,-10,6],[-10,-8,5],[4,-10,6],[4,-8,7]])b(c,x,y,w,1,age[1]);
 for(let i=0;i<8;i++)b(c,-13+3*i,-8+Math.floor(i/3),2,2,i%2?brass[2]:brass[0]);
 b(c,3,-7,4,3,brass[3]);
}

function nightLamp(c,time,height=31){
 const level=Math.floor(time*6+height)%8,top=-height;
 b(c,-7,-3,14,3,oak[0]);b(c,-5,-5,10,2,brass[2]);
 b(c,-2,top+12,4,height-16,brass[1]);b(c,-2,top+13,1,height-18,brass[3]);
 p(c,brass[0],[[-10,top+2],[-5,top-3],[6,top-3],[10,top+2],[9,top+14],[6,top+17],[-6,top+17],[-9,top+14]]);
 p(c,jade[1],[[-7,top+3],[-5,top+1],[5,top+1],[8,top+3],[7,top+13],[-7,top+13]]);
 b(c,-4,top+4,8,8,level<2?jade[2]:jade[3]);b(c,-2,top+5,3,5,jade[4]);
 b(c,-1,top+1,2,14,brass[1]);b(c,-6,top+2,1,11,brass[3]);b(c,-7,top+14,14,2,brass[2]);
}

function openCoffer(c){
 p(c,oak[0],[[-19,-11],[-16,-31],[-13,-36],[14,-36],[17,-33],[19,-13],[15,-10],[-15,-9]]);
 p(c,blackwood[1],[[-17,-13],[-14,-32],[-11,-34],[12,-34],[15,-31],[17,-14]]);
 p(c,blackwood[2],[[-12,-15],[-9,-31],[7,-31],[11,-27],[13,-15]]);b(c,-12,-32,25,1,brass[3]);
 p(c,age[1],[[-11,-14],[-3,-22],[4,-20],[8,-14],[0,-11]]);p(c,age[3],[[-8,-15],[-4,-21],[2,-19],[5,-15]]);
 casework(c,-20,0,40,16,5,oak);b(c,-14,-12,27,2,blackwood[0]);b(c,-3,-9,6,5,brass[3]);
 b(c,-1,-8,2,3,brass[0]);b(c,-17,-8,3,7,brass[2]);b(c,14,-8,3,7,brass[2]);
}

function atticClock(c,time=0){
 p(c,blackwood[0],[[-14,-3],[-14,-51],[-9,-58],[7,-59],[14,-52],[14,-3],[11,0],[-10,0]]);
 p(c,blackwood[1],[[-11,-4],[-11,-50],[-7,-55],[6,-56],[11,-51],[11,-4]]);
 b(c,-11,-31,22,2,blackwood[3]);b(c,-10,-18,20,14,blackwood[0]);
 p(c,age[2],[[-8,-43],[-7,-48],[-3,-51],[4,-51],[8,-46],[8,-41],[4,-37],[-3,-37],[-7,-40]]);
 b(c,-4,-49,7,1,age[3]);l(c,brass[0],0,-44,0,-48,2);l(c,brass[0],0,-44,4,-42);
 b(c,-7,-16,13,10,'#3d4e52');const swing=Math.sin(time*2.45)*3;
 l(c,brass[3],0,-16,swing,-9);b(c,swing-2,-10,4,3,brass[3]);b(c,-11,-4,23,2,blackwood[3]);
}

const prop=(id,label,x,y,w,h,paint,extra={})=>({id,label,x,y,w,h,paint,...extra});
const solid=(width,depth)=>({width,depth});
const counter='borgin-counter',table='borgin-manuscript-table';

export default {keeper:{x:-9,y:-36},props:[
 prop(counter,'polished blackwood counter',-10,-5,96,35,c=>{
  casework(c,-48,0,96,32,13,blackwood);b(c,-42,-17,84,2,brass[2]);
  for(const x of [-39,-11,17]){b(c,x,-14,21,9,blackwood[1]);b(c,x+2,-12,17,2,blackwood[3]);b(c,x+7,-10,7,2,brass[3]);}
 },{solid:solid(96,12)}),
 prop('borgin-cabinet','locked glass book cabinet',-74,-56,49,70,cabinet,{solid:solid(43,12)}),
 prop('borgin-chained-lexicons','chained lexicons',-20,-58,48,61,cotteredShelves,{solid:solid(44,12)}),
 prop('borgin-hand-reliquary','relic hand in a green glass case',35,-56,36,62,handCase,{solid:solid(34,12)}),
 prop('borgin-uneasy-mirror','uneasy silver mirror',82,-54,45,77,mirror,{solid:solid(28,9),animated:true}),
 prop('borgin-counter-lantern','witch-glass counter lantern',23,-5,22,66,(c,time)=>{c.translate(0,-30);nightLamp(c,time,29);},{surface:counter,animated:true}),
 prop('borgin-brass-balance','antique brass balance',-44,-5,39,59,c=>{c.translate(0,-30);balance(c);},{surface:counter}),
 prop('borgin-blue-ledger','chained provenance ledger',-15,-5,35,48,c=>{c.translate(0,-30);chainedLedger(c);},{surface:counter}),
 prop('borgin-bell-jar','smoky bell jar',2,-5,28,58,(c,time)=>{c.translate(0,-30);bellJar(c,time);},{surface:counter,animated:true}),
 prop('borgin-open-coffer','open coffer with sealed scroll',-78,53,42,39,openCoffer,{solid:solid(39,12)}),
 prop(table,'engraved manuscript table',-24,55,43,31,c=>{
  casework(c,-20,0,40,26,10,oak);b(c,-14,-15,28,2,brass[2]);b(c,-16,-7,4,7,oak[0]);b(c,12,-7,4,7,oak[0]);
 },{solid:solid(39,10)}),
 prop('borgin-dark-book-stack','dark bindings and folded manuscripts',-24,55,33,58,c=>{
  c.translate(0,-25);horizontalBook(c,-15,-9,29,2);horizontalBook(c,-10,-15,25,0);horizontalBook(c,-13,-20,22,3);
  p(c,age[3],[[1,-22],[11,-24],[15,-19],[7,-17]]);b(c,8,-22,3,1,age[1]);
 },{surface:table}),
 prop('borgin-floor-lantern','green witch-glass floor lamp',33,54,24,57,(c,time)=>nightLamp(c,time,49),{solid:solid(14,8),animated:true}),
 prop('borgin-attic-clock','restless attic clock',83,54,30,62,atticClock,{solid:solid(26,10),animated:true}),
]};
