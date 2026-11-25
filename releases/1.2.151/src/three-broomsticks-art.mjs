import {block as b,shape as p,line as l,casework} from './diagon-shop-brush.mjs';
import {drawPixelChatText,pixelChatTextWidth} from './pixel-chat-font.mjs';
import {drawFlooHearth} from './floo-art.mjs';

const timber=['#352929','#523c34','#79513b','#ad7950','#d8a973'];
const iron=['#273238','#39505a','#607981','#9ab8bd','#d8e7de'];
const stone=['#474043','#615a56','#766965','#8c7b6e'];
const style={
 dark:'#302728',edge:'#42322c',shade:'#65493a',oak:'#896048',light:'#bb885d',gold:'#d7aa67',
 cream:'#ede0b9',amber:'#d9914a',sill:'#dabda0',plaster:'#b39878',
 snow:'#d2e4df',snowShade:'#a8c0c2',roof:'#465f68',upperRoof:'#5c777d'
};
const local=(x,y,points)=>points.map(([u,v])=>[x+u,y+v]);
const rect=(c,x,y,dx,dy,w,h,color)=>b(c,x+dx,y+dy,w,h,color);
const poly=(c,color,x,y,points)=>p(c,color,local(x,y,points));

function label(c,text,x,y,color){
 drawPixelChatText(c,text,x-pixelChatTextWidth(text)/2,y,color);
}

function shingles(c,x,y,points,tint){
 poly(c,'#27383d',x,y,points);
 c.save();c.beginPath();
 for(const [i,[px,py]] of points.entries()){if(i)c.lineTo(x+px,y+py);else c.moveTo(x+px,y+py);}
 c.closePath();c.clip();
 const left=Math.min(...points.map(m=>m[0])),right=Math.max(...points.map(m=>m[0]));
 const top=Math.min(...points.map(m=>m[1])),bottom=Math.max(...points.map(m=>m[1]));
 rect(c,x,y,left,top,right-left,bottom-top,tint);
 for(let row=top+4;row<bottom;row+=8){
  rect(c,x,y,left,row,right-left,2,'#283c486e');
  rect(c,x,y,left,row+2,right-left,1,'#77939880');
  for(let col=left-6+(row%16+16)%16;col<right;col+=16){
   rect(c,x,y,col,row-4,1,4,'#2b414854');
   if((col+row)%5===0)rect(c,x,y,col+3,row+4,6,1,'#8ba7aa55');
  }
 }
 c.restore();
}

export function drawThreeBroomsticksRoof(c,z){
 const x=z.x,y=z.y;
 shingles(c,x,y,[[-130,29],[-130,-90],[-100,-108],[-46,-147],[2,-151],[84,-114],[125,-87],[130,29]],style.roof);
 poly(c,'#66828a64',x,y,[[-126,-86],[-60,-134],[-36,-147],[2,-147],[5,22],[-126,22]]);
 poly(c,style.snowShade,x,y,[[-129,-90],[-100,-108],[-46,-147],[2,-151],[84,-114],[125,-88],[109,-82],[60,-102],[21,-131],[-1,-138],[-38,-136],[-81,-105],[-117,-84]]);
 poly(c,style.snow,x,y,[[-129,-91],[-100,-111],[-47,-149],[2,-152],[84,-115],[125,-90],[117,-84],[67,-107],[39,-122],[16,-137],[-6,-143],[-42,-140],[-83,-111],[-120,-87]]);
 for(const [dx,dy] of [[-88,-48],[83,-61]]){
  const dormerX=x+dx,dormerY=y+dy;
  poly(c,'#352c2b',dormerX,dormerY,[[-18,0],[-18,-16],[-4,-31],[10,-27],[18,-13],[17,0]]);
  poly(c,'#84654e',dormerX,dormerY,[[-15,-1],[-15,-15],[-4,-27],[10,-24],[15,-13],[14,-1]]);
  amberWindow(c,dormerX,dormerY-2,14,16);
  poly(c,'#516971',dormerX,dormerY,[[-20,-15],[-4,-33],[11,-30],[20,-16],[16,-14],[8,-25],[-4,-28],[-16,-12]]);
  poly(c,style.snow,dormerX,dormerY,[[-20,-16],[-4,-33],[11,-30],[20,-16],[17,-15],[9,-27],[-4,-30],[-17,-14]]);
 }
 // The smaller cross-gable makes the doorway recognizable from down the lane.
 shingles(c,x,y,[[-67,29],[-54,-14],[-26,-43],[11,-53],[47,-33],[72,18],[72,29]],'#546b70');
 poly(c,'#b2cace',x,y,[[-60,6],[-54,-14],[-26,-43],[11,-53],[47,-33],[72,20],[64,20],[38,-26],[10,-45],[-21,-36],[-45,-13],[-54,10]]);
 poly(c,style.snow,x,y,[[-59,1],[-54,-14],[-26,-43],[11,-53],[47,-33],[68,14],[65,13],[40,-30],[11,-48],[-24,-39],[-48,-13],[-55,6]]);
 rect(c,x,y,-131,27,262,5,'#2e3d41');rect(c,x,y,-130,27,260,2,'#a3b9bc');
 for(const [u,v] of [[-120,32],[-103,34],[-80,32],[-72,31],[52,34],[78,31],[104,33],[121,34]]){
  rect(c,x,y,u,v,5,1,style.snowShade);rect(c,x,y,u+2,v,1,3,'#baccce');
 }
 // Staggered fieldstone chimney, set behind the gabled frontage.
 poly(c,'#463d3a',x,y,[[-92,-99],[-93,-153],[-70,-153],[-70,-102],[-75,-98]]);
 for(let row=-150;row<-103;row+=6){
  rect(c,x,y,-91,row,18,5,stone[(row+156)%4]);rect(c,x,y,-90+(row%3+3)%3*4,row+1,7,1,'#b0978066');
 }
 rect(c,x,y,-95,-154,27,4,'#8e857b');rect(c,x,y,-96,-157,28,3,style.snow);
}

function amberWindow(c,x,y,w,h){
 const half=w/2;
 poly(c,style.dark,x,y,[[-half-3,0],[-half-3,-h+8],[-half+3,-h+1],[-half+8,-h-2],[half-8,-h-2],
  [half-3,-h+1],[half+3,-h+8],[half+3,0]]);
 poly(c,'#edb773',x,y,[[-half,0],[-half,-h+8],[-half+5,-h+1],[half-5,-h+1],[half,-h+8],[half,0]]);
 rect(c,x,y,-half+3,-h+7,w-7,4,'#ffe4a9');rect(c,x,y,0,-h+2,3,h-2,style.shade);
 rect(c,x,y,-half,-11,w,2,style.shade);
 l(c,'#805e49',x-half+3,y-18,x-4,y-4);l(c,'#805e49',x+5,y-18,x+half-4,y-5);
 rect(c,x,y,-half-4,0,w+8,4,'#a17c62');
 rect(c,x,y,-half-3,0,w+6,1,'#e2ca9e');
}

export function drawThreeBroomsticksFacade(c,z){
 const x=z.x,y=z.y+z.h/2,w=z.w;
 rect(c,x,y,-w/2,-56,w,57,style.edge);
 rect(c,x,y,-w/2+4,-54,w-8,43,style.plaster);
 for(const post of [-114,-83,-43,42,83,113]){
  rect(c,x,y,post,-55,6,54,style.edge);
  rect(c,x,y,post+1,-53,1,39,'#bd906b');
 }
 for(const side of [-1,1]){
  l(c,style.shade,x+side*120,y-52,x+side*91,y-30,5);
  l(c,'#a47e5c',x+side*119,y-52,x+side*92,y-31,1);
  amberWindow(c,x+side*72,y-11,33,26);
  amberWindow(c,x+side*33,y-11,15,22);
 }
 rect(c,x,y,-w/2,-9,w,10,'#605b55');
 for(let i=-118;i<118;i+=14){
  rect(c,x,y,i,-7,13,5,stone[(i+118)%4]);rect(c,x,y,i+1,-7,11,1,'#a19685');
 }
 rect(c,x,y,-26,-42,52,39,style.shade);rect(c,x,y,-25,-41,2,28,style.light);
 rect(c,x,y,23,-42,3,39,style.dark);
 const title='THREE BROOMSTICKS',width=pixelChatTextWidth(title)+17;
 poly(c,'#302b2a',x,y,[[-width/2,-52],[-width/2+4,-66],[width/2-4,-66],[width/2,-62],
  [width/2,-51],[width/2-5,-48],[-width/2+6,-48]]);
 rect(c,x,y,3-width/2,-63,width-6,11,'#6f493c');
 rect(c,x,y,7-width/2,-63,width-14,1,'#c69463');
 label(c,title,x,y-60,'#e4ca94');
 for(const side of [-1,1]){
  const at=x+side*47,top=y-30;
  b(c,at-2,top-9,4,10,style.shade);b(c,at-5,top-2,10,12,style.dark);
  b(c,at-3,top,6,8,'#ecb46a');b(c,at-2,top+1,4,6,'#ffe2a2');
 }
}

export function drawThreeBroomsticksThreshold(c,x,y,open){
 rect(c,x,y,-21,-3,42,7,'#776858');rect(c,x,y,-19,-2,38,3,'#bbab93');
 rect(c,x,y,-21,3,42,2,'#604d41');
 for(const dx of [-20,17]){
  rect(c,x,y,dx,-8,4,10,style.shade);rect(c,x,y,dx+1,-8,1,9,style.light);
 }
 if(!open){
  rect(c,x,y,-16,-11,32,10,style.dark);rect(c,x,y,-15,-9,30,8,style.oak);
  rect(c,x,y,-14,-9,28,2,style.light);rect(c,x,y,8,-6,3,2,style.gold);
 }
}

export function paintThreeBroomsticksFloor(c,z){
 const {x,y,w,h}=z,left=x-w/2,top=y-h/2;
 b(c,left,top,w,h,'#896044');
 for(let row=0;row<h;row+=9){
  b(c,left,top+row,w,1,'#5c4135');
  b(c,left,top+row+1,w,1,'#c3956366');
  for(let col=((row*7)%35)-12;col<w-10;col+=35){
   const from=Math.max(2,col),width=Math.min(w-from-2,33),color=['#957053','#8c6249','#9f7758'][(row+col+70)%3];
   if(width>0)b(c,left+from,top+row+3,width,4,color);
   if(col>=2)b(c,left+col,top+row+2,1,7,'#574137');
  }
 }
 for(const [dx,dy,width,depth,tone] of [[-73,40,82,51,'#754738'],[65,37,91,56,'#536158'],[0,61,46,44,'#7b4c41']]){
  const at=x+dx,root=y+dy,u=width/2,v=depth/2;
  const rug=[[-u+7,-v],[u-7,-v],[u,-v+6],[u,v-5],[u-6,v],[-u+6,v],[-u,v-5],[-u,-v+6]];
  poly(c,'#4b3835',at,root,rug);poly(c,tone,at,root,rug.map(([a,b])=>[a*.91,b*.85]));
  poly(c,'#ac836073',at,root,rug.map(([a,b])=>[a*.72,b*.66]));
  poly(c,tone,at,root,rug.map(([a,b])=>[a*.68,b*.59]));
  for(let k=-u*.68;k<u*.68;k+=12){
   b(c,at+k,root+v-6,3,1,'#d7b580');b(c,at+k+1,root+v-7,1,3,'#d7b580');
  }
 }
 b(c,left,top,w,14,'#59433355');
}

function trophy(c,x,y){
 poly(c,style.dark,x,y,[[-23,-12],[-17,-21],[-7,-25],[7,-25],[18,-20],[23,-11],[20,8],[13,13],[0,17],[-13,13],[-20,8]]);
 poly(c,'#75523a',x,y,[[-20,-11],[-15,-19],[-6,-23],[7,-23],[17,-18],[21,-10],[18,6],[11,11],
  [0,15],[-11,11],[-18,6]]);
 poly(c,'#402d2c',x,y,[[-15,-6],[-18,-20],[-11,-17],[-7,-13],[0,-17],[8,-13],[13,-18],[17,-19],
  [16,-6],[14,-2],[12,8],[6,12],[-5,12],[-12,7],[-14,0]]);
 poly(c,'#735144',x,y,[[-12,-6],[-15,-17],[-10,-14],[-7,-9],[-2,-13],[5,-12],[8,-8],[13,-16],[15,-15],
  [13,-5],[11,-2],[10,6],[6,10],[-5,10],[-10,6]]);
 poly(c,'#99715b',x,y,[[-11,-10],[-7,-10],[-4,-13],[1,-13],[4,-10],[1,-7],[-7,-6]]);
 rect(c,x,y,-11,-3,5,2,'#3d2a2a');rect(c,x,y,6,-3,5,2,'#3d2a2a');
 rect(c,x,y,-8,-2,2,1,'#d4ae70');rect(c,x,y,6,-2,2,1,'#c79763');
 poly(c,'#af805f',x,y,[[-8,4],[-5,2],[5,2],[8,5],[7,9],[4,11],[-4,11],[-7,9]]);
 rect(c,x,y,-5,5,2,2,'#463431');rect(c,x,y,3,5,2,2,'#463431');
 poly(c,'#e8d8ad',x,y,[[-8,9],[-12,6],[-13,3],[-12,9],[-10,12],[-7,12]]);
 poly(c,'#dac59b',x,y,[[8,9],[12,6],[13,3],[12,9],[10,12],[7,12]]);
 rect(c,x,y,-7,14,14,3,'#404547');rect(c,x,y,-5,14,10,1,'#baa176');
}

export function drawThreeBroomsticksWalls(c,z){
 const {x,w,h}=z,y=z.y-h/2,front=z.y+h/2;
 rect(c,x,y,-w/2,-39,w,40,style.edge);
 rect(c,x,y,-w/2+4,-35,w-8,29,'#9a805e');
 for(const post of [-115,-86,-29,11,57,113]){
  rect(c,x,y,post,-37,4,35,style.shade);rect(c,x,y,post+1,-35,1,32,'#c59769');
 }
 rect(c,x,y,-w/2,-11,w,12,style.shade);
 for(let i=-116;i<w/2-5;i+=8){rect(c,x,y,i,-9,2,9,'#bd886157');}
 rect(c,x,y,-w/2,-10,w,2,style.light);
 rect(c,x,y,-w/2,0,5,h,style.edge);rect(c,x,y,w/2-5,0,5,h,style.edge);
 rect(c,x,front,-w/2,-4,w/2-18,4,style.edge);rect(c,x,front,18,-4,w/2-18,4,style.edge);
 trophy(c,x-56,y-9);
 amberWindow(c,x+13,y-4,23,22);
 for(const sign of [-108,41]){
  rect(c,x,y,sign-4,-19,8,10,style.edge);rect(c,x,y,sign-2,-17,4,5,'#e3a761');
  rect(c,x,y,sign-2,-17,2,2,'#ffe1a4');
 }
}

function cask(c,x,y,scale=1,tapped=true){
 c.save();c.translate(x,y);c.scale(scale,scale);
 poly(c,style.dark,0,0,[[-14,-7],[-12,-20],[-6,-26],[8,-26],[16,-21],[20,-12],[18,-4],[11,1],[-8,1]]);
 poly(c,style.oak,0,0,[[-12,-7],[-10,-19],[-5,-24],[8,-24],[14,-19],[17,-12],[16,-5],[10,-1],[-8,-1]]);
 for(const [row,color] of [[-21,style.light],[-17,style.shade],[-13,style.light],[-8,style.shade],[-5,style.shade]])b(c,-8,row,19,1,color);
 for(const dx of [-8,4]){b(c,dx,-23+(dx===4?-1:0),4,21,iron[0]);b(c,dx+1,-22,1,18,iron[2]);}
 poly(c,'#443330',10,-12,[[-4,-10],[2,-10],[7,-6],[9,-1],[8,4],[4,8],[-1,9],[-4,5],[-6,0]]);
 poly(c,'#a87951',11,-12,[[-3,-8],[2,-8],[6,-4],[7,-1],[6,4],[3,7],[-1,7],[-4,3],[-4,-2]]);
 b(c,8,-13,9,1,'#684938');b(c,10,-17,2,10,'#875d42');b(c,5,-2,5,3,style.dark);b(c,14,-2,5,3,style.dark);
 if(tapped){b(c,12,-12,5,2,'#c5945a');b(c,16,-11,2,4,'#d7af72');}
 c.restore();
}

export function drawTavernTankard(c,x,y,empty=false){
 rect(c,x,y,-4,-6,7,7,style.dark);rect(c,x,y,-3,-5,5,5,empty?'#7c8582':'#ba713c');
 rect(c,x,y,-3,-5,1,4,empty?'#b7bdaf':'#d9994d');
 rect(c,x,y,2,-5,3,4,'#918173');rect(c,x,y,2,-4,2,2,style.dark);
 if(!empty){rect(c,x,y,-4,-7,7,2,style.cream);rect(c,x,y,-1,-8,3,1,'#ffe8be');}
 rect(c,x,y,-3,0,5,1,'#675248');
}

function plate(c,x,y,food){
 poly(c,'#526768',x,y,[[-8,0],[-5,-3],[4,-3],[8,-1],[7,2],[2,4],[-5,3]]);
 poly(c,'#c7d1c2',x,y,[[-6,0],[-4,-2],[4,-2],[6,0],[5,2],[-4,2]]);
 if(food==='bread'){
  poly(c,'#965b39',x,y,[[-4,1],[-4,-2],[-2,-4],[2,-4],[4,-1],[3,1]]);
  b(c,x-2,y-3,4,2,'#d6aa6e');b(c,x+1,y-2,2,1,'#f4c780');
 }else{
  b(c,x-1,y-3,5,3,'#a4533e');b(c,x-3,y-2,3,3,'#758a53');b(c,x+1,y-4,2,1,'#d1a15f');
 }
}

function drinksTable(c,x,y,w,h,round){
 const left=x-w/2,ramp=timber;
 poly(c,'#302b2a77',x,y,[[-w/2,1],[-w/2+5,-3],[w/2-5,-3],[w/2+1,0],[w/2-3,5],[-w/2+4,5]]);
 for(const dx of [-w*.3,w*.29]){b(c,x+dx-2,y-12,5,14,ramp[0]);b(c,x+dx-1,y-11,2,11,ramp[2]);}
 poly(c,ramp[0],x,y,[[-w/2,-12],[-w/2+3,-h+4],[-w/3,-h],[w/3,-h],[w/2-3,-h+4],[w/2,-12],[w/2-5,-8],[-w/2+5,-8]]);
 poly(c,ramp[3],x,y,[[-w/2+2,-13],[-w/2+5,-h+4],[-w/3,-h+1],[w/3,-h+1],[w/2-5,-h+4],[w/2-2,-13],[w/2-6,-10],[-w/2+6,-10]]);
 b(c,left+7,y-14,w-14,1,'#c3936b');b(c,left+9,y-11,w-18,1,ramp[4]);
 plate(c,x+(round?-5:3),y-16,round?'stew':'bread');
 drawTavernTankard(c,x+(round?11:-10),y-14);
 if(round){b(c,x+2,y-17,3,1,'#e6dabb');b(c,x+4,y-18,1,3,'#9eac9e');}
}

export function paintThreeBroomsticksProp(c,prop){
 const x=prop.building.x+prop.x,y=prop.building.y+prop.y,{w,h}=prop;
 switch(prop.id){
 case 'oak-bar':
  casework(c,x-w/2,y,w,h,7,timber);
  for(let dx=-45;dx<40;dx+=23){
   rect(c,x,y,dx,-14,20,12,style.edge);rect(c,x,y,dx+1,-13,18,10,style.oak);
   rect(c,x,y,dx+2,-12,16,1,style.light);rect(c,x,y,dx+14,-9,2,3,style.shade);
  }
  rect(c,x,y,-45,-4,89,1,style.gold);rect(c,x,y,-44,-1,87,1,style.dark);
  return true;
 case 'brass-taps':
  rect(c,x,y,-30,-7,68,5,style.dark);rect(c,x,y,-30,-8,68,2,style.light);
  cask(c,x-20,y-7,.64);cask(c,x+5,y-6,.76);cask(c,x+31,y-6,.58,false);
  return true;
 case 'butterbeer-keg':
  cask(c,x+3,y,.86);return true;
 case 'butterbeer-tankards':
  for(let i=0;i<3;i++)drawTavernTankard(c,x-13+i*11,y-10,i===2);
  return true;
 case 'mince-pie-tray':
  plate(c,x+1,y-11,'bread');return true;
 case 'round-tavern-table':
 case 'scuffed-drinks-table':
  drinksTable(c,x,y,w,h,prop.id==='round-tavern-table');return true;
 case 'ceramic-plates':
  b(c,x+14,y-6,2,4,'#e9d5a9');return true;
 case 'stew-cauldron':
  poly(c,style.dark,x,y,[[-11,-12],[-8,-17],[8,-17],[11,-12],[10,-4],[7,0],[-7,0],[-10,-5]]);
  b(c,x-8,y-12,16,9,'#525d55');b(c,x-6,y-13,4,9,'#778376');b(c,x-9,y-13,18,3,'#a5a583');
  b(c,x-6,y-12,12,2,'#8c5c41');b(c,x-3,y-13,4,1,'#e7ad6e');
  return true;
 case 'three-crossed-broomsticks': {
  const doorX=prop.building.x,barY=prop.building.y+53;
  const at=doorX-37;
  rect(c,at,barY,-2,-18,4,15,style.dark);rect(c,at,barY,-1,-17,2,11,style.gold);
  poly(c,style.dark,at,barY,[[-13,-6],[-10,-9],[10,-9],[13,-6],[12,8],[8,12],[-8,12],[-12,8]]);
  poly(c,'#6a483a',at,barY,[[-11,-4],[-9,-7],[9,-7],[11,-4],[10,7],[7,10],[-7,10],[-10,7]]);
  for(const slant of [-8,0,8]){
   l(c,'#c2945c',at+slant,barY-5,at-slant*.45,barY+4,1);
   b(c,at-slant*.45-2,barY+3,4,4,style.gold);b(c,at-slant*.45-2,barY+4,4,1,'#78553e');
  }
  return true;
 }
 default:return false;
 }
}

export function drawThreeBroomsticksHearth(c,x,y,time,green){
 c.save();c.translate(x,y-5);c.scale(1,.56);
 const warmth=c.createRadialGradient(0,0,3,0,0,49+Math.sin(time*6)*2);
 warmth.addColorStop(0,green?'#74e89861':'#feb46e61');warmth.addColorStop(.52,green?'#4ddc812c':'#ed8a482c');
 warmth.addColorStop(1,green?'#4ddc8100':'#ed8a4800');
 c.fillStyle=warmth;c.fillRect(-53,-53,106,106);c.restore();
 poly(c,'#543b31aa',x,y,[[-32,-3],[-17,-7],[18,-7],[32,-3],[30,5],[-29,5]]);
 c.save();c.translate(x,y);drawFlooHearth(c,time,green);c.restore();
 for(const dx of [-21,19]){
  rect(c,x,y,dx,-45,6,2,style.dark);rect(c,x,y,dx+1,-50,4,5,'#d3c6a6');
  rect(c,x,y,dx+2,-52,2,2,green?'#95e5a7':'#f9cb71');
 }
}
