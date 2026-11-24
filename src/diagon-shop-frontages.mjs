import {block as b, shape as p, line as l} from './diagon-shop-brush.mjs';

const ink='#343c39';
const amber=['#5a4b3a','#876547','#b98854','#e5b074','#f4d49e'];

// Each profile defines facade geometry, glazing, lettering and materials.
// Rooftop vertices are local to the same projection as the approved shop.
export const SHOP_FRONTAGES={
  flourish:{
    name:'FLOURISH & BLOTTS', icon:'book', roofName:'bent library roof', bayName:'arched reading bays',
    doorName:'oak double entrance', signName:'open-book trade sign', lampName:'library reading lantern', floorName:'weathered sandstone sill',
    roof:['#344841','#486452','#60765d','#86916c'],
    wall:['#485b4e','#667761','#80917b','#aab098'], trim:['#423b35','#765940','#b99264'],
    mark:'#e0c392', glass:'#b6bc96', runner:['#514243','#774f50','#b19469'],
    profile:'library', bay:'arches', surface:'wood', rank:0,
  },
  malkins:{
    name:'MADAM MALKIN\'S',icon:'shears', roofName:'pleated mansard',bayName:'curtained robe displays',
    doorName:'draped tailoring entrance',signName:'tailor shears plaque',lampName:'rose-glass sconce',floorName:'inlaid cream stone sill',
    roof:['#493c50','#66516a','#846981','#b28c99'],
    wall:['#786650','#b29976','#cdb591','#e9d3a8'],trim:['#543e49','#8b626b','#bf9c8b'],
    mark:'#f0d1a1',glass:'#dcb995',runner:['#563e53','#825d78','#c1a07c'],
    profile:'mansard',bay:'drapery',surface:'wood',rank:1,
  },
  quidditch:{
    name:'QUALITY QUIDDITCH',icon:'hoop',roofName:'tall broomwright gable',bayName:'diamond-paned sport bays',
    doorName:'oxblood plank entrance',signName:'golden scoring hoop',lampName:'pit lantern',floorName:'ribbed stable threshold',
    roof:['#463937','#695048','#8a6557','#ad8570'],
    wall:['#535849','#767765','#a39376','#c0ad87'],trim:['#4e3636','#854e47','#bd7560'],
    mark:'#efc176',glass:'#96b3a9',runner:['#503d38','#885956','#baa275'],
    profile:'gable',bay:'diamonds',surface:'wood',rank:2,
  },
  apothecary:{
    name:'SLUGG & JIGGERS',icon:'flask',roofName:'copper still roof',bayName:'bottle-green greenhouse bays',
    doorName:'oxidized copper arch',signName:'distiller flask plaque',lampName:'smoked violet lamp',floorName:'verdigris paving inlet',
    roof:['#34484a','#466961','#668576','#a1aa83'],
    wall:['#46574f','#607169','#79857a','#a5aa91'],trim:['#453a3a','#815d4f','#b18568'],
    mark:'#d9c695',glass:'#8eaf93',runner:['#394b46','#577563','#a1ab79'],
    profile:'coping',bay:'bottles',surface:'checker',rank:3,
  },
  eeylops:{
    name:'EEYLOPS OWL EMPORIUM',icon:'owl',roofName:'split roost roof',bayName:'aviary-bar bay windows',
    doorName:'latched roost entrance',signName:'ivory owl plaque',lampName:'brass aviary lantern',floorName:'worn hatch threshold',
    roof:['#333f46','#425e66','#5b7780','#88a4a3'],
    wall:['#485153','#647879','#7d8e87','#a9ab95'],trim:['#453c32','#785d43','#af8d62'],
    mark:'#eddebd',glass:'#bfaa7e',runner:['#454536','#69664e','#baab7c'],
    profile:'roost',bay:'aviary',surface:'wood',rank:4,
  },
  floreans:{
    name:'FLOREAN FORTESCUE\'S',icon:'cone',roofName:'striped cafe canopy',bayName:'curved scoop windows',
    doorName:'mint glazed entrance',signName:'strawberry cone trade sign',lampName:'cream enamel sconce',floorName:'tiled flower threshold',
    roof:['#5c4545','#9f6865','#cc8b7a','#e3c5a1'],
    wall:['#67766a','#82988a','#b1b8a0','#d6d0ad'],trim:['#594542','#92625a','#cb9478'],
    mark:'#f2d6ad',glass:'#afd0b8',runner:['#545b53','#798a6f','#e0bc97'],
    profile:'awning',bay:'scoops',surface:'checker',rank:5,
  },
  gringotts:{
    name:'GRINGOTTS',icon:'crest',roofName:'marble pediment roof',bayName:'columned teller windows',
    doorName:'bronze vault entrance',signName:'bank crest and key',lampName:'bronze bank sconce',floorName:'veined marble steps',
    roof:['#515958','#707a7a','#909c96','#bec0aa'],
    wall:['#6c736e','#939c92','#bebfaf','#e6dcc1'],trim:['#494743','#7d6d53','#b5a274'],
    mark:'#f5dc9c',glass:'#a7b5b0',runner:['#493d47','#785461','#b4a077'],
    profile:'pediment',bay:'columns',surface:'cement',rank:6,
  },
  'nocturne-curios':{
    name:'NOCTURNE CURIOS',icon:'crest',roofName:'slate observatory roof',bayName:'plum lattice windows',
    doorName:'charcoal cedar entrance',signName:'brass charm plaque',lampName:'amber display lantern',floorName:'slate threshold',
    roof:['#2b2639','#3e344b','#534361','#82627b'],
    wall:['#38333c','#534652','#75616b','#978078'],trim:['#372d37','#714f55','#b9866d'],
    mark:'#edc893',glass:'#a493a4',runner:['#373044','#5e4c68','#bd987e'],
    profile:'slate',bay:'diamonds',surface:'wood',rank:7,
  },
  nightglass:{
    name:'NIGHTGLASS APOTHECARY',icon:'flask',roofName:'stepped nightglass roof',bayName:'mint glass bottle bays',
    doorName:'brushed copper entrance',signName:'mint flask plaque',lampName:'green glass lantern',floorName:'mica and slate threshold',
    roof:['#26383e','#354b51','#506567','#77958d'],
    wall:['#343e41','#46565a','#638080','#899c8b'],trim:['#3e3536','#6a5551','#b08369'],
    mark:'#ddcf9e',glass:'#98b69d',runner:['#343f47','#4b6770','#a9aa83'],
    profile:'nightglass',bay:'bottles',surface:'checker',rank:8,
  },
  'borgin-burkes':{
    name:'BORGIN & BURKES',icon:'curio-key',roofName:'crooked lead roofs',bayName:'aged glass curio cases',
    doorName:'blackened cedar entrance',signName:'antique key plaque',lampName:'green witch-glass sconce',floorName:'stained slate sill',
    roof:['#29282e','#3a3b43','#4b4c55','#777379'],
    wall:['#333038','#4d4148','#695961','#8e776c'],trim:['#302b32','#605149','#8f795c'],
    mark:'#d9bb87',glass:'#50695e',runner:['#31303a','#57454b','#91745d'],
    lampTint:['#4f6b54','#7eae75','#b8d991'],floorWash:'#30253962',
    profile:'borgin',bay:'curios',surface:'wood',rank:9,
  },
  bellglass:{
    name:'BELLGLASS',icon:'flask',roofName:'copper-ribbed glass roof',bayName:'deep green growing bays',
    doorName:'iron conservatory door',signName:'greenhouse flask plaque',lampName:'yellow greenhouse lamp',floorName:'limestone floor',
    roof:['#304f53','#466f70','#71908a','#a1beb1'],wall:['#485852','#648170','#87a48b','#b8bb92'],
    trim:['#3c4237','#725c46','#c39168'],mark:'#ede0a3',glass:'#9fbfad',runner:['#344c43','#557368','#b4b994'],
    lampTint:['#8f7454','#c6a371','#eed4a1'],profile:'greenhouse',bay:'bottles',surface:'checker',rank:10,
  },
  'meridian-hall':{
    name:'MERIDIAN HALL',icon:'crest',roofName:'lead slate and a copper meridian dome',bayName:'diamond survey windows',
    doorName:'blue oak chart room door',signName:'meridian plaque',lampName:'copper chart light',floorName:'inlaid oak floor',
    roof:['#354457','#50677b','#718695','#a0aca8'],wall:['#484c55','#666870','#8a8582','#c1b198'],
    trim:['#3e434d','#6f5f57','#c3986e'],mark:'#ecd2a4',glass:'#a1a9ad',runner:['#44435b','#626681','#ae9f81'],
    lampTint:['#8d7150','#c5a26b','#efd6a2'],profile:'meridian',bay:'diamonds',surface:'wood',rank:11,
  },
  'wrong-turn':{
    name:'WRONG TURN DOOR & KEY',icon:'curio-key',roofName:'staggered plum-tile roofs',bayName:'brass key display bays',
    doorName:'salvaged door jamb',signName:'cut brass key plaque',lampName:'amber locksmith lamp',floorName:'herringbone limestone sill',
    roof:['#413442','#594458','#73576c','#967281'],wall:['#514845','#706357','#938575','#beaa91'],
    trim:['#453537','#755651','#bb9166'],mark:'#edd2a0',glass:'#9caa90',runner:['#4f444c','#6f5369','#b8a07f'],
    lampTint:['#8d684f','#c49162','#f3d29a'],profile:'locksmith',bay:'locks',surface:'checker',rank:12,
  },
};

const roofShapes={
 library:[[-116,-119],[-91,-131],[73,-127],[112,-116],[116,24],[104,41],[-113,39]],
 mansard:[[-115,-111],[-92,-135],[82,-135],[113,-115],[118,35],[103,43],[-115,43]],
 gable:[[-119,-115],[-88,-126],[68,-136],[115,-112],[116,36],[87,41],[-117,37]],
 coping:[[-117,-105],[-101,-124],[106,-124],[119,-108],[118,32],[103,41],[-116,39]],
 roost:[[-117,-118],[-93,-133],[-11,-123],[49,-137],[115,-115],[116,35],[103,42],[-114,38]],
 awning:[[-113,-108],[-91,-120],[82,-120],[115,-105],[118,32],[106,39],[-115,39]],
 pediment:[[-122,-111],[-101,-128],[103,-128],[122,-111],[122,36],[101,43],[-121,43]],
 slate:[[-116,-101],[-97,-126],[18,-145],[111,-115],[119,32],[100,43],[-115,39]],
 nightglass:[[-117,-99],[-95,-115],[76,-126],[112,-110],[116,35],[102,42],[-115,39]],
 borgin:[[-118,-101],[-94,-119],[34,-140],[112,-116],[118,33],[97,44],[-115,40]],
  greenhouse:[[-118,-107],[-96,-130],[73,-131],[113,-108],[118,34],[103,43],[-116,39]],
  meridian:[[-118,-114],[-87,-127],[76,-131],[112,-111],[117,34],[100,43],[-115,39]],
  locksmith:[[-117,-103],[-97,-124],[61,-136],[112,-110],[118,34],[99,43],[-117,37]],
};
const ridges={
 library:[[-39,-126],[-18,-33]], mansard:[[-62,-131],[-48,-13]],
 gable:[[12,-130],[9,-21]], coping:[[-23,-123],[-15,-17]],
 roost:[[-8,-124],[11,-20]], awning:[[-8,-119],[-4,1]], pediment:[[-9,-126],[-5,-5]],
 slate:[[18,-142],[15,-25]],nightglass:[[-17,-118],[-13,-20]],
 borgin:[[34,-137],[20,-22]],
  greenhouse:[[9,-129],[4,32]],meridian:[[33,-129],[24,10]],
  locksmith:[[57,-131],[31,30]],
};

function wall(c,x,y,w,h,m) {
  b(c,x,y,w,h,m[0]);b(c,x+2,y+2,w-4,h-4,m[1]);
  for(let row=0;row<h-5;row+=10) {
    for(let col=0;col<w-8;col+=25) {
      const bx=x+3+col+(row%20?8:0),bw=Math.min(21,x+w-3-bx);
      if(bw<3)continue;
      b(c,bx,y+3+row,bw,Math.min(8,h-row-5),m[(col+row)%3?2:1]);
      if((col+row)%5===0)b(c,bx+1,y+3+row,bw-3,1,m[3]);
    }
  }
}
function upright(c,x,y,h,trim,width=7) {
  b(c,x,y,width,h,trim[0]);b(c,x+1,y+1,width-2,h-2,trim[1]);b(c,x+1,y+1,1,h-6,trim[2]);
  b(c,x-1,y, width+2,3,trim[2]);b(c,x-1,y+h-3,width+2,3,trim[0]);
}

export function frontageRoof(c,f) {
  const outline=roofShapes[f.profile],r=f.roof,[start,ridge]=ridges[f.profile];
  const topEdge=outline.slice(0,4);
  p(c,ink,outline);
  const inset=outline.map(([x,y])=>[Math.round(x*.974),y<0?y+3:y-3]);
  p(c,r[1],inset);
  p(c,r[0],[start,[topEdge[3][0]-3,topEdge[3][1]+3],[inset[4][0],inset[4][1]],ridge]);
  p(c,r[2],[inset[0],start,ridge,inset.at(-1)]);
  l(c,r[3],start[0],start[1],ridge[0],ridge[1],2);
  c.save();
  c.beginPath();inset.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
  for(let y=-116;y<35;y+=9) {
    for(let x=-115+(y%2?8:0);x<118;x+=24) {
      const odd=(x+y+f.rank)%5;
      b(c,x,y,odd?17:10,1,odd===0?r[3]:x<ridge[0]?r[1]:r[2]);
    }
  }
  c.restore();
  const peaks={library:[-42,1],mansard:[-54,-2,54],gable:[0],coping:[-49],roost:[-54,39],awning:[],pediment:[0],slate:[-37,22],nightglass:[-54,45],borgin:[-53,43],greenhouse:[],meridian:[-66],locksmith:[-38,58]}[f.profile];
  for(const x of peaks) {
    const w=f.profile==='pediment'?78:f.profile==='gable'?53:25;
    const h=f.profile==='gable'?60:f.profile==='pediment'?42:f.profile==='borgin'&&x<0?44:31;
    const apex=x+(f.profile==='borgin'?-6:0);
    p(c,ink,[[x-w,42],[apex,42-h],[x+w,42]]);
    p(c,f.wall[1],[[x-w+5,40],[apex,47-h],[x+w-5,40]]);
    l(c,f.trim[2],x-w+3,41,apex,44-h,2);
    if(f.profile!=='pediment'){
      const tint=f.lampTint||amber.slice(2);
      b(c,x-6,31-h*.35,12,13,ink);b(c,x-4,32-h*.35,8,10,tint[0]);b(c,x-4,32-h*.35,3,4,tint[2]);
    }else{
      b(c,-55,38,110,4,f.wall[3]);p(c,f.wall[2],[[-56,34],[0,8],[56,34]]);
      p(c,f.trim[1],[[0,20],[8,23],[8,29],[0,33],[-8,29],[-8,23]]);
    }
  }
  if(f.profile==='greenhouse'){
    p(c,'#739d9950',[[-110,-99],[-92,-115],[10,-118],[4,29],[-109,31]]);
    for(const x of [-95,-70,-45,-20,7,34,59,84,108])l(c,f.trim[1],x,-110,x*.98,33,2);
    for(const y of [-85,-52,-19,14])l(c,f.trim[1],-110,y,109,y+2,2);
    l(c,'#b4c9b9',-105,-78,-37,-106,2);l(c,'#b4c9b9',-104,-54,-61,-74,1);
    b(c,-109,33,218,5,f.trim[1]);b(c,-107,33,214,1,f.trim[2]);
  }
  if(f.profile==='meridian'){
    p(c,'#413d44',[[15,-57],[16,-75],[22,-88],[36,-99],[51,-104],[67,-99],[79,-88],[86,-74],[87,-57]]);
    p(c,'#52716e',[[18,-58],[20,-74],[27,-88],[41,-98],[52,-101],[64,-96],[76,-86],[82,-73],[84,-58]]);
    l(c,'#a4a486',51,-100,39,-59,2);l(c,'#687d72',51,-100,63,-59,3);
    b(c,16,-58,71,6,'#63594d');b(c,19,-58,65,1,'#b79a70');b(c,49,-112,5,10,'#b88e59');
  }
  if(f.profile==='coping'||f.profile==='library'){
    const x=f.rank===3?47:-55;
    wall(c,x,-99,20,34,f.wall);b(c,x-3,-100,26,5,ink);b(c,x-3,-101,24,2,f.trim[2]);
  }
  if(f.profile==='borgin'){
    wall(c,49,-122,18,31,f.wall);b(c,46,-124,25,5,ink);b(c,46,-125,25,2,f.roof[3]);
    wall(c,72,-109,13,21,f.wall);b(c,70,-111,17,4,ink);b(c,70,-112,17,1,f.roof[3]);
  }
  if(f.profile==='awning'){
    for(let i=0;i<11;i++){
      const x=-110+i*20;
      p(c,i%2?f.roof[2]:f.roof[3],[[x,20],[x+20,20],[x+19,45],[x+15,51],[x+4,51],[x,45]]);
      b(c,x+2,43,16,3,i%2?f.roof[1]:f.wall[3]);
    }
  }
}

export function frontageBay(c,f) {
  const contours={
    arches:[[-25,0],[-25,-27],[-18,-36],[-8,-40],[8,-40],[18,-36],[25,-27],[25,0]],
    drapery:[[-27,0],[-27,-34],[-24,-39],[24,-39],[27,-34],[27,0]],
    diamonds:[[-24,0],[-24,-34],[0,-41],[24,-34],[24,0]],
    bottles:[[-27,0],[-27,-29],[-20,-35],[20,-35],[27,-29],[27,0]],
    aviary:[[-24,0],[-24,-31],[-13,-42],[13,-42],[24,-31],[24,0]],
    scoops:[[-27,-5],[-27,-27],[-20,-35],[20,-35],[27,-27],[27,-5],[21,0],[-21,0]],
    columns:[[-28,0],[-28,-41],[28,-41],[28,0]],
    curios:[[-26,0],[-26,-31],[-17,-38],[-5,-40],[12,-40],[25,-33],[26,0]],
    locks:[[-26,0],[-25,-30],[-17,-38],[16,-38],[25,-31],[26,0]],
  };
  const outline=contours[f.bay];
  p(c,ink,outline);p(c,f.trim[0],outline.map(([x,y])=>[Math.round(x*.92),Math.round(y*.93)-1]));
  p(c,f.glass,outline.map(([x,y])=>[Math.round(x*.8),Math.round(y*.78)-4]));
  c.save();
  c.beginPath();
  outline.map(([x,y])=>[Math.round(x*.8),Math.round(y*.78)-4]).forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.closePath();c.clip();
  p(c,'#f3d19b64',[[-22,-30],[-4,-36],[-5,-9],[-20,-9]]);
  if(f.bay==='drapery'){
    for(const side of [-1,1]){
      p(c,f.trim[1],[[side*21,-33],[side*3,-33],[side*9,-22],[side*17,-14],[side*11,-8],[side*24,-8]]);
      l(c,f.mark,side*20,-16,side*12,-16);
    }
  } else if(f.bay==='diamonds') {
    for(const x of [-24,-8,8,24]) {
      l(c,f.trim[0],x-12,-34,x+12,-8);
      l(c,f.trim[0],x+12,-34,x-12,-8);
    }
  } else if(f.bay==='bottles'||f.bay==='scoops') {
    for(const [i,color] of ['#8c6c7e','#c78b77','#d9bd98','#6c8b72'].entries()){
      const x=(i-2)*9;
      if(f.bay==='bottles'){
        b(c,x,-21+(i%2)*3,3,4,f.trim[0]);b(c,x-1,-18+(i%2)*3,5,9,color);
      }else p(c,color,[[x-3,-9],[x-3,-14],[x,-18],[x+4,-18],[x+6,-15],[x+6,-9]]);
    }
    b(c,-25,-10,50,2,f.trim[0]);
  } else if(f.bay==='locks') {
    b(c,-25,-32,51,2,f.trim[0]);
    for(const [x,y,teeth]of [[-15,-25,7],[-2,-20,8],[13,-25,6]]){
      l(c,f.trim[1],x,-31,x,y-2);
      p(c,f.mark,[[x-4,y-1],[x-2,y-4],[x+2,y-4],[x+4,y-1],[x+2,y+3],[x-2,y+3]]);
      b(c,x-1,y-1,3,2,f.trim[0]);b(c,x-1,y+3,2,teeth,f.trim[2]);
      b(c,x+1,y+teeth,3,2,f.mark);
    }
    b(c,-24,-8,48,2,f.trim[0]);
  } else if(f.bay==='aviary') {
    for(let x=-16;x<=16;x+=6)b(c,x,-36,1,28,f.trim[0]);
    p(c,'#e5d7ad',[[-7,-11],[-7,-16],[-3,-21],[3,-21],[6,-16],[5,-10]]);
    b(c,-4,-17,2,1,ink);b(c,2,-17,2,1,ink);b(c,-9,-9,18,2,f.trim[0]);
  } else if(f.bay==='curios'){
    for(const x of [-16,1,16])b(c,x,-36,2,27,f.trim[0]);
    b(c,-25,-21,49,2,f.trim[0]);
    p(c,'#756b59',[[-18,-10],[-18,-14],[-15,-16],[-11,-14],[-11,-10]]);
    b(c,-8,-16,4,6,'#958373');b(c,-4,-14,3,4,'#3d383a');
    p(c,'#323235',[[6,-10],[8,-20],[11,-22],[14,-19],[14,-10]]);
    b(c,18,-14,5,4,'#9b805f');b(c,-23,-9,45,2,f.trim[0]);
  } else {
    for(const x of [-16,0,16])b(c,x,-37,f.bay==='columns'?4:2,34,f.trim[1]);
    b(c,-27,-21,54,2,f.trim[1]);
  }
  c.restore();
  b(c,-27,-6,54,4,f.trim[1]);b(c,-26,-7,52,1,f.trim[2]);
}

function emblem(c,kind,color) {
  if(kind==='book'){
    p(c,color,[[-11,-8],[-1,-6],[-1,8],[-11,5]]);p(c,color,[[11,-8],[1,-6],[1,8],[11,5]]);
    b(c,-9,-4,5,1,ink);b(c,4,-3,5,1,ink);
  }else if(kind==='shears'){
    l(c,color,-7,7,8,-7,2);l(c,color,7,7,-8,-7,2);
    b(c,-10,5,5,4,color);b(c,6,5,5,4,color);b(c,-8,6,2,2,ink);b(c,7,6,2,2,ink);
  }else if(kind==='hoop'){
    p(c,color,[[-10,-5],[-6,-9],[6,-9],[10,-5],[10,2],[6,6],[-6,6],[-10,2]]);
    p(c,ink,[[-7,-4],[-5,-6],[5,-6],[7,-4],[7,1],[5,3],[-5,3],[-7,1]]);
    b(c,-1,5,3,6,color);
  }else if(kind==='flask'){
    p(c,color,[[-3,-9],[3,-9],[3,-3],[9,4],[7,8],[-7,8],[-9,4],[-3,-3]]);
    b(c,-5,3,10,2,'#678666');b(c,-4,-10,8,2,color);
  }else if(kind==='owl'){
    p(c,color,[[-9,-7],[-4,-8],[5,-8],[9,-7],[10,1],[5,8],[-5,8],[-10,1]]);
    b(c,-6,-4,4,4,ink);b(c,2,-4,4,4,ink);b(c,-1,1,2,3,amber[2]);
  }else if(kind==='cone'){
    p(c,color,[[-6,-1],[6,-1],[0,10]]);
    p(c,'#dc9589',[[-8,-2],[-8,-6],[-4,-10],[4,-10],[8,-5],[8,-2]]);
    b(c,-5,-8,7,2,'#f0b3a1');
  }else if(kind==='curio-key'){
    p(c,color,[[-11,-5],[-8,-9],[-2,-9],[2,-5],[2,0],[-2,4],[-8,4],[-11,0]]);
    b(c,-8,-5,6,5,ink);l(c,color,0,-1,10,7,3);b(c,5,5,3,4,color);b(c,9,6,3,3,color);
  }else{
    p(c,color,[[-10,-7],[10,-7],[8,3],[0,10],[-8,3]]);
    l(c,ink,-5,4,5,-4,2);b(c,2,-6,5,4,ink);b(c,-4,2,3,4,ink);
  }
}

export function frontageSign(c,f) {
  p(c,ink,[[-16,-26],[16,-26],[20,-22],[20,-3],[16,0],[-16,0],[-20,-3],[-20,-22]]);
  p(c,f.trim[2],[[-16,-24],[15,-24],[18,-21],[18,-4],[15,-2],[-15,-2],[-18,-4],[-18,-21]]);
  b(c,-15,-22,30,18,ink);c.save();c.translate(0,-13);emblem(c,f.icon,f.mark);c.restore();
}

export function frontageLamp(c,f) {
  const tint=f.lampTint||(f.icon==='flask'?['#776379','#b496ba','#e2c6dd']:amber.slice(2));
  b(c,-5,-19,10,2,ink);b(c,-2,-20,3,6,f.trim[2]);
  p(c,ink,[[-7,-16],[-3,-20],[4,-20],[7,-16],[7,-3],[4,0],[-4,0],[-7,-3]]);
  b(c,-5,-15,10,11,tint[0]);b(c,-4,-14,7,9,tint[1]);b(c,-3,-13,3,6,tint[2]);
  b(c,-5,-3,10,2,f.trim[1]);b(c,-3,-20,6,2,f.trim[2]);
}

export function frontageEntry(c,f) {
  // The open doorway has two anchored jambs. The center stays empty at feet level.
  b(c,-6,-57,12,57,ink);b(c,-4,-56,7,55,f.trim[1]);b(c,-3,-53,2,49,f.trim[2]);
  b(c,-8,-59,17,4,f.wall[1]);b(c,-8,-60,17,2,f.wall[3]);b(c,-6,-4,13,4,f.wall[0]);
  if(f.bay==='columns') {
    b(c,-9,-54,7,48,f.wall[2]);b(c,-8,-53,2,45,f.wall[3]);
  }else if(f.bay==='drapery'){
    p(c,f.trim[1],[[1,-55],[11,-54],[8,-37],[4,-26],[9,-16],[2,-15]]);
    b(c,3,-28,6,2,f.mark);
  }else if(f.bay==='scoops'){
    b(c,1,-50,4,31,f.glass);b(c,1,-35,6,2,f.trim[2]);
  }else{
    b(c,2,-40,3,22,f.trim[0]);b(c,3,-26,4,3,f.mark);
  }
}

export function frontageSill(c,f) {
  p(c,f.wall[0],[[-10,-23],[11,-23],[17,-18],[17,-4],[11,0],[-12,0],[-17,-4],[-17,-18]]);
  p(c,f.wall[2],[[-11,-21],[11,-21],[15,-17],[15,-5],[11,-3],[-12,-3],[-15,-5],[-15,-17]]);
  for(let y=-20;y<-3;y+=6) {
    b(c,-14,y,28,1,f.wall[3]);b(c,y%2?-3:3,y+2,1,4,f.wall[1]);
  }
  if(f.bay==='scoops'||f.bay==='columns'){
    for(const x of [-8,0,8])p(c,f.trim[2],[[x-2,-12],[x,-14],[x+2,-12],[x,-10]]);
  }
}
