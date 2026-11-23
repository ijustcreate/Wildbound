// Rejected study: retained for design history, not the production renderer.
import {pixelPolygon,pixelLine} from './pixel-shapes.mjs';
// Native editable production sample. Every entry is a distinct silhouette.
export const OLLIVANDERS_ASSETS=[
 ['crooked_gable',430,245],['amber_bay_window',94,125],['carved_door',63,108],['wand_sign',88,88],['wand_box_cabinet',112,144],['rolling_ladder',42,128],['sorting_counter',178,76],['velvet_case',78,35],['wood_samples',51,63],['measuring_tape',42,19],['brass_scales',52,53],['counter_bell',27,21],['quill_ink',33,40],['ledger',48,27],['travel_trunk',65,44],['ladder_stool',35,37],['stained_glass_lamp',58,65],['iron_sconce',31,49],['cobble_threshold',83,25],['potted_fern',65,60]
].map(([id,w,h])=>({id:'ollivanders:'+id,kind:id,w,h,shop:'ollivanders'}));
const ink='#302a2c',wood='#79503a',shade='#49302e',woodLight='#b48a57',gold='#c4a16a',cream='#ead7a9';
function brushes(c){return {r(x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));},p(points,color){pixelPolygon(c,points.map(([x,y])=>({x,y})),color);},line(a,b,color,width=1){pixelLine(c,{x:a[0],y:a[1]},{x:b[0],y:b[1]},color,width);}};}
function arch(b,x,y,w,h,color){const a=w/2; b.p([[x-a,y],[x-a,y-h+a],[x-a+3,y-h+a-9],[x-a+11,y-h+a-19],[x-8,y-h+2],[x+8,y-h+2],[x+a-11,y-h+a-19],[x+a-3,y-h+a-9],[x+a,y-h+a],[x+a,y]],color);}
function box(b,x,y,w,h){b.p([[x,y-h],[x+7,y-h-5],[x+w+7,y-h-5],[x+w,y-h]],'#ba9360');b.p([[x+w,y-h],[x+w+7,y-h-5],[x+w+7,y-5],[x+w,y]],'#4e3630');b.r(x,y-h,w,h,wood);b.r(x+2,y-h+2,w-4,3,'#b68c57');b.r(x+2,y-4,w-4,3,shade);}
function brass(b,x,y,w,h){b.r(x,y,w,h,'#755b3e');b.r(x+1,y,w-2,Math.max(1,h-2),gold);b.r(x+2,y,Math.max(1,w-5),1,'#eed6a0');}
function pot(b,x,y,w=24,h=22){b.p([[x-w/2-2,y-h],[x+w/2+2,y-h],[x+w/2-2,y-3],[x+w/2-6,y],[x-w/2+6,y],[x-w/2+2,y-3]],ink);b.p([[x-w/2,y-h+3],[x+w/2,y-h+3],[x+w/2-4,y-3],[x-w/2+5,y-3]],'#865738');b.r(x-w/2-2,y-h,w+4,4,'#b38a52');b.r(x-w/2+3,y-h+5,3,h-11,'#c0975c');}
function paintAsset(c,id){const b=brushes(c),{r,p,line}=b;
 switch(id){
 case 'crooked_gable':{
  // Bowed silhouette and layered eaves follow the generated wand-shop study.
  p([[-201,0],[-205,-116],[-190,-131],[-184,-151],[-107,-177],[-96,-215],[-72,-240],[10,-218],[74,-166],[181,-130],[201,-111],[201,0]],ink);
  p([[-194,-4],[-197,-110],[-180,-124],[-174,-144],[-103,-165],[-91,-209],[-73,-229],[9,-207],[73,-155],[181,-122],[194,-104],[194,-4]],'#85606b');
  p([[-190,-8],[-190,-102],[-174,-113],[-168,-137],[-94,-156],[-81,-207],[-69,-219],[8,-194],[65,-145],[177,-111],[185,-91],[185,-8]],'#ac8580');
  p([[-182,-12],[-185,-89],[-155,-101],[-163,-128],[-91,-143],[-85,-183],[-62,-202],[7,-178],[54,-132],[166,-99],[175,-77],[176,-12]],'#aa7c76');
  for(const [x,y,w]of [[-174,-46,25],[-128,-110,19],[153,-30,17],[-70,-168,14],[55,-103,28],[130,-86,16]]){r(x,y,w,4,'#c09b89');r(x+4,y+4,w-8,3,'#b28b7e');}
  // Timber is connected around openings, with a few worn broad light planes.
  for(const x of [-186,-117,42,182]){r(x,-111,10,112,shade);r(x+2,-106,3,103,'#9a7150');}r(-190,-18,381,14,'#543932');r(-187,-17,375,3,'#b48b5d');
  p([[-218,-114],[-196,-136],[-112,-163],[-99,-211],[-75,-243],[-24,-220],[52,-175],[98,-155],[190,-133],[218,-103],[177,-112],[90,-139],[44,-159],[-34,-204],[-73,-225],[-86,-205],[-101,-151],[-184,-124]],'#393940');
  p([[-204,-121],[-110,-158],[-96,-205],[-73,-234],[-28,-212],[52,-168],[99,-148],[191,-125],[204,-112],[91,-139],[44,-159],[-33,-202],[-73,-222],[-88,-200],[-101,-151]],'#5b5662');
  for(let row=0;row<4;row++)for(let col=0;col<11;col++){const x=-176+col*34+(row%2?10:0),y=-121-row*9-Math.max(0,80-Math.abs(x+65))*.5;if(x>160)continue;r(x,y,24,3,(row+col)%3?'#79707a':'#8b7e83');r(x+3,y+3,19,1,'#45424c');}
  // Moss follows sheltered eaves in broad leafy clusters, not surface noise.
  for(const [x,y]of [[-158,-133],[-121,-147],[-91,-190],[-58,-217],[47,-164],[123,-133]]){p([[x-8,y],[x-3,y-4],[x+7,y-5],[x+14,y-1],[x+10,y+5],[x-4,y+4]],'#596b45');r(x-2,y-3,10,3,'#8a965c');}
  // A small crooked dormer and a weathered chimney resolve the roof silhouette.
  box(b,121,-139,27,63);r(125,-194,18,46,'#9b7160');r(121,-204,33,6,'#c39b7b');r(125,-190,17,3,'#684b47');r(125,-173,17,3,'#684b47');
  r(-85,-181,36,43,'#3c3032');r(-80,-177,26,32,'#c99951');r(-79,-176,10,29,'#f0bf6e');r(-69,-179,3,35,'#5e4431');r(-81,-162,28,3,'#7a573a');
  break;}
 case 'amber_bay_window':{
  p([[-43,0],[-46,-100],[-39,-115],[-23,-122],[24,-122],[41,-113],[46,-100],[44,0]],ink);
  p([[-37,-8],[-40,-96],[-32,-107],[-20,-112],[21,-112],[35,-104],[39,-94],[36,-8]],'#b08448');
  p([[-35,-9],[-36,-94],[-28,-102],[-12,-107],[16,-107],[31,-99],[35,-92],[32,-9]],'#d9ab62');
  p([[14,-106],[31,-99],[35,-92],[32,-9],[16,-7]],'#b17d3f');r(-25,-91,29,75,'#efc77b');r(-23,-87,9,66,'#ffe1a0');
  for(const x of [-35,-17,5,31]){r(x,-103,4,98,shade);r(x+1,-101,1,95,'#bc9560');}for(const y of [-83,-55,-26]){r(-38,y,74,4,shade);r(-36,y,70,1,'#d1ad70');}
  for(let i=0;i<6;i++){r(-26+i*9,-44,3,17,['#674533','#815b39','#443934'][i%3]);r(-26+i*9,-46,3,3,gold);}
  p([[-47,-5],[-35,-11],[35,-11],[47,-5],[44,1],[-44,1]],'#55392e');r(-43,-6,85,3,'#caa16a');r(-44,-114,86,5,'#674532');r(-35,-119,67,3,'#d3ac74');break;}
 case 'carved_door':{
  arch(b,0,0,61,107,ink);arch(b,0,-3,51,98,'#8d6140');arch(b,0,-6,41,87,'#49352f');
  for(let x=-17;x<=15;x+=8){r(x,-61,6,53,'#80543a');r(x,-57,1,45,'#b48b57');}
  arch(b,0,-63,35,33,'#354444');for(let x=-13;x<=12;x+=8){line([x,-68],[x+12,-86],'#bf9c65');line([x,-86],[x+12,-68],'#bf9c65');}
  r(-20,-65,40,5,'#be945c');r(-20,-15,40,4,'#4d332c');brass(b,13,-42,5,10);r(15,-40,1,4,'#533e30');break;}
 case 'wand_sign':{
  r(-39,-83,5,52,'#343735');r(-37,-82,2,44,'#7d7a62');line([-35,-80],[34,-80],'#3c3b33',3);line([-27,-76],[3,-63],'#77775d',2);
  line([-18,-80],[-18,-58],'#493e31',2);line([28,-80],[28,-58],'#493e31',2);
  p([[-35,-41],[-29,-53],[-14,-59],[25,-59],[40,-48],[42,-21],[32,-8],[-22,-8],[-36,-19]],ink);
  p([[-31,-39],[-25,-49],[-12,-54],[23,-54],[36,-46],[37,-24],[28,-13],[-20,-13],[-31,-22]],gold);
  p([[-28,-38],[-22,-46],[-11,-51],[21,-51],[32,-43],[34,-26],[25,-17],[-17,-17],[-28,-24]],'#3c3737');line([-14,-29],[22,-39],'#e3c88b',3);line([22,-49],[22,-29],'#efdeb0');line([12,-39],[32,-39],'#efdeb0');r(20,-41,4,4,'#fff0bf');break;}
 case 'wand_box_cabinet':{
  box(b,-52,0,104,139);r(-47,-133,94,124,'#382d2d');
  for(let row=0;row<9;row++)for(let col=0;col<4;col++){const x=-44+col*23,y=-129+row*13;r(x,y,21,11,['#855b3c','#775240','#9f7650','#74515a'][(row+col)%4]);r(x+2,y+1,17,2,'#bd9868');r(x+9,y+5,5,2,'#e0c28b');r(x+9,y+7,5,1,'#533c30');}r(-55,-142,112,6,'#6c4734');r(-53,-142,108,2,'#cbab76');r(-52,-6,104,6,'#4d342b');break;}
 case 'rolling_ladder':{
  for(const x of [-16,12]){p([[x,-3],[x+10,-125],[x+15,-125],[x+5,-3]],shade);line([x+3,-6],[x+13,-122],'#c3a16d',3);}for(let i=0;i<9;i++){const y=-13-i*12,x=(y+13)*-.08;r(-14+x,y,30,4,'#9f794d');r(-13+x,y,28,1,'#dfc18a');}r(-19,-4,9,4,'#3c3c37');r(12,-4,9,4,'#3c3c37');break;}
 case 'sorting_counter':{
  box(b,-84,0,168,42);r(-87,-45,176,7,'#c09b68');r(-85,-45,171,2,'#e6c18b');for(const x of [-75,-20,35]){r(x,-33,46,25,'#5b3c30');r(x+3,-30,40,19,'#89623e');r(x+3,-30,40,2,'#bc925b');r(x+4,-15,37,2,'#66432e');}r(-83,-8,166,6,'#493229');break;}
 case 'velvet_case':{
  p([[-37,-3],[-37,-16],[-28,-27],[35,-27],[39,-15],[32,0]],ink);p([[-34,-15],[-27,-24],[32,-24],[35,-16]],'#793d50');r(-34,-14,70,10,'#b18e53');r(-30,-13,62,7,'#642e46');line([-25,-10],[26,-10],'#cda66a',2);r(24,-11,5,3,'#efe0aa');r(-3,-5,9,4,'#d4b474');break;}
 case 'wood_samples':{
  box(b,-24,0,48,8);for(let i=0;i<5;i++){const x=-18+i*9;line([x,-7],[x-2,-42-i%3*6],['#895333','#b38d5a','#564035','#8c714b','#6d4952'][i],3);r(x-4,-45-i%3*6,4,6,woodLight);}break;}
 case 'measuring_tape':{
  p([[-20,-5],[-16,-13],[-4,-18],[13,-17],[21,-10],[17,-2],[-6,0]],'#8e714a');p([[-17,-6],[-13,-11],[-3,-15],[12,-14],[17,-9],[13,-5],[-5,-3]],cream);for(let i=0;i<6;i++)r(-13+i*5,-10+i%2*3,1,4,'#806542');p([[-3,-6],[18,-6],[21,-2],[2,1]],'#d9bf88');break;}
 case 'brass_scales':{
  p([[-19,0],[-15,-5],[-5,-8],[5,-8],[17,-4],[22,0]],'#745b3b');r(-15,-3,31,2,gold);brass(b,-2,-45,5,39);line([-22,-40],[22,-43],gold,3);r(-4,-50,8,7,cream);for(const side of [-1,1]){const x=side*20,y=side>0?-41:-38;line([x,y],[x-8,y+22],gold);line([x,y],[x+8,y+22],gold);p([[x-11,y+22],[x-7,y+28],[x+7,y+28],[x+11,y+22]],'#c1a062');r(x-8,y+22,16,2,'#f0d497');}break;}
 case 'counter_bell':{
  r(-13,-4,27,4,shade);p([[-11,-5],[-10,-12],[-5,-17],[6,-17],[11,-12],[12,-5]],'#a27d43');r(-5,-15,8,4,'#ecd295');r(-11,-6,22,2,gold);r(-2,-20,5,4,cream);break;}
 case 'quill_ink':{
  p([[-14,0],[-16,-12],[-12,-17],[-3,-17],[2,-11],[1,0]],ink);r(-13,-12,11,10,'#3e4555');r(-12,-11,3,6,'#82909b');r(-13,-18,12,4,'#b79b6c');line([-6,-16],[19,-38],'#cbbca0');p([[-1,-23],[2,-31],[13,-39],[23,-40],[19,-33],[8,-24]],'#e7d9bc');line([2,-26],[19,-37],'#af9d86');break;}
 case 'ledger':{
  p([[-24,-3],[-22,-22],[-4,-25],[1,-21],[21,-23],[24,-4],[1,0]],shade);p([[-20,-5],[-19,-20],[-4,-22],[0,-19],[18,-20],[20,-6],[1,-3]],cream);line([0,-19],[1,-3],'#ac8d62');for(let i=0;i<4;i++){r(-15,-17+i*3,10,1,'#9d886b');r(5,-16+i*3,10,1,'#9d886b');}r(-6,-2,3,6,'#a35451');break;}
 case 'travel_trunk':{
  box(b,-29,-1,57,35);p([[-29,-35],[-24,-42],[22,-42],[29,-35]],'#ad8050');for(const x of [-20,15]){r(x,-39,4,37,gold);r(x+1,-39,1,34,'#e6c78c');}r(-8,-25,17,7,shade);r(-6,-27,13,3,gold);r(-4,-24,9,3,wood);r(-3,-13,8,7,'#c7a15e');r(-2,-11,5,3,'#edcf8e');break;}
 case 'ladder_stool':{
  for(const x of [-12,9]){r(x,-19,4,19,shade);r(x+1,-17,2,16,'#bc945a');}box(b,-17,-18,32,8);r(-10,-9,23,3,'#a58051');break;}
 case 'stained_glass_lamp':{
  line([0,-63],[0,-42],'#61533e',2);p([[-28,-17],[-25,-26],[-17,-34],[-6,-40],[7,-40],[20,-32],[27,-22],[29,-17]],shade);p([[-25,-19],[-22,-26],[-14,-32],[-4,-37],[6,-37],[17,-30],[24,-23],[25,-19]],'#dca65d');for(const [x,y]of [[-15,-29],[-4,-34],[9,-31],[16,-24],[-9,-22],[3,-24]]){p([[x-5,y],[x,y-4],[x+5,y],[x+2,y+5],[x-3,y+5]],'#ae727d');}r(-28,-18,57,4,'#d4b17a');r(-9,-14,18,3,'#efd299');break;}
 case 'iron_sconce':{
  r(-13,-37,6,29,'#4c4a3f');line([-10,-35],[11,-32],'#5f5a48',3);line([11,-32],[11,-26],'#5f5a48',2);p([[2,-25],[7,-30],[16,-30],[21,-24],[20,-6],[2,-6]],shade);r(5,-24,12,14,'#d8a452');r(6,-23,6,11,'#ffe1a0');r(5,-10,13,3,gold);r(3,-28,17,3,gold);break;}
 case 'cobble_threshold':{
  p([[-41,0],[-41,-9],[-30,-20],[34,-20],[43,-8],[41,0]],'#524a43');for(const [x,y,w]of [[-37,-11,24],[-9,-12,25],[19,-10,21],[-29,-20,22],[-4,-20,26]]){p([[x,y],[x+3,y-3],[x+w,y-3],[x+w+2,y+4],[x+w-3,y+8],[x,y+7]],'#a29a84');r(x+3,y-2,w-5,2,'#c9bea0');}break;}
 case 'potted_fern':{
  pot(b,0,0,32,25);for(const [i,side]of [-1,1,-1,1,0,-1,1].entries()){const x=side*(12+i*2),y=-40-i%3*8;line([0,-23],[x,y],'#5e793c',2);for(let j=0;j<4;j++){const xx=x*j/4,yy=-24+(y+24)*j/4;p([[xx,yy],[xx-7-j,yy-5],[xx-8-j,yy-9],[xx-1,yy-4]],j%2?'#789448':'#4c713d');p([[xx,yy],[xx+7+j,yy-4],[xx+9+j,yy-7],[xx+2,yy-2]],'#91a353');}}break;}
 }
}
const images=new Map();
export function drawOllivandersAsset(c,id,x,y,scale=1){const def=OLLIVANDERS_ASSETS.find(a=>a.id===id||a.kind===id);if(!def)return false;const key=def.id;let image=images.get(key);if(!image&&typeof document!=='undefined'){image=document.createElement('canvas');image.width=def.w+24;image.height=def.h+28;const b=image.getContext('2d');b.translate(Math.floor(image.width/2),def.h+12);paintAsset(b,def.kind);if(images.size>=32)images.delete(images.keys().next().value);images.set(key,image);}c.save();c.translate(Math.round(x),Math.round(y));c.imageSmoothingEnabled=false;if(image)c.drawImage(image,Math.round(-image.width*scale/2),Math.round(-(def.h+12)*scale),Math.round(image.width*scale),Math.round(image.height*scale));else{c.scale(scale,scale);paintAsset(c,def.kind);}c.restore();return true;}
