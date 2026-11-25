import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';

const granite=['#222f38','#34454f','#465964','#63767d','#85968e'];
const copper=['#463d37','#65503f','#8c6c48','#b48a57','#d5ab6b'];
const verdigris=['#2a4a49','#3a6460','#598476','#80a38a'];
const glass=['#1c384e','#244a64','#376485','#5589a6','#86afbc'];
const stone=[[-64,-13],[48,-13],[73,-27],[72,-49],[57,-59],[-42,-59],[-72,-43],[-76,-24]];
const landmarkRasters=new Map();

function painter(c){
 const point=([x,y])=>({x,y});
 return {
  poly:(color,...points)=>pixelPolygon(c,points.map(point),color),
  line:(color,width,start,end)=>pixelLine(c,point(start),point(end),color,width),
  rect:(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);},
 };
}

function beacon(c,lit){
 const {poly,line,rect}=painter(c);
 poly('#1c31327a',[-111,-3],[-87,-22],[64,-25],[110,-11],[119,1],[76,10],[-87,13]);
 poly(granite[0],...stone);
 poly(granite[2],[-72,-42],[-42,-58],[56,-58],[70,-48],[48,-37],[-65,-37]);
 poly(granite[3],[-74,-41],[47,-40],[47,-24],[-65,-24]);
 poly(granite[1],[49,-41],[71,-50],[71,-28],[49,-15]);
 for(const [x,w,top] of [[-55,20,-41],[-31,19,-41],[-8,30,-41],[27,15,-41]]){
  rect(granite[0],x,top+6,w,2);
  rect(granite[4],x+2,top,w-4,2);
 }
 // The front stair treads lie flat at the edge of the octagonal plinth.
 poly(granite[0],[-37,-23],[-31,-39],[20,-39],[31,-23],[38,-6],[-42,-6]);
 poly(granite[2],[-31,-36],[22,-36],[26,-28],[-35,-28]);
 poly(granite[3],[-35,-27],[26,-27],[32,-20],[-38,-20]);
 poly(granite[2],[-38,-18],[32,-18],[37,-10],[-41,-10]);
 line(granite[4],2,[-38,-19],[32,-19]);
 line(granite[3],2,[-41,-9],[37,-9]);

 poly(granite[0],[-68,-49],[-66,-122],[-40,-151],[34,-156],[65,-135],[67,-73],[51,-51],[-20,-45]);
 poly(granite[2],[-63,-57],[-61,-120],[-39,-144],[-23,-131],[-21,-49]);
 poly(granite[3],[-30,-141],[26,-146],[40,-128],[42,-57],[-22,-51]);
 poly(granite[1],[39,-132],[61,-138],[61,-79],[46,-60],[40,-63]);
 poly(granite[4],[-60,-117],[-47,-132],[-34,-127],[-38,-122],[-49,-123],[-57,-114]);

 // A deeply recessed instrument door and two narrower side windows establish scale.
 poly(copper[0],[-21,-54],[-22,-109],[-12,-123],[10,-125],[26,-109],[28,-55]);
 poly(granite[0],[-16,-55],[-17,-107],[-8,-118],[9,-118],[21,-107],[23,-55]);
 poly(verdigris[0],[-12,-56],[-13,-106],[-5,-113],[8,-113],[17,-104],[19,-56]);
 rect(verdigris[1],-10,-98,3,40);
 rect(copper[3],11,-78,4,3);
 poly(glass[0],[-8,-103],[1,-111],[12,-104],[2,-96]);
 poly(lit?glass[4]:glass[2],[-5,-103],[2,-108],[9,-104],[2,-100]);
 for(const [x,y] of [[-48,-108],[48,-110]]){
  poly(granite[0],[x-7,y+2],[x-2,y-7],[x+5,y-9],[x+8,y-3],[x+8,y+17],[x-7,y+21]);
  poly(lit?glass[3]:glass[1],[x-4,y+2],[x,y-4],[x+5,y-5],[x+5,y+12],[x-4,y+16]);
  line(granite[4],1,[x-6,y+22],[x+7,y+18]);
 }
 for(const [x,y,w] of [[-61,-75,15],[-59,-78,19],[-54,-63,10],[-39,-84,12],[30,-89,7],[48,-74,9],[50,-77,9],[29,-68,9]]){
  rect(granite[1],x,y,w,2);
  rect(granite[4],x+1,y+2,Math.max(3,w-5),1);
 }

 // Copper straps wrap the glass lantern room. The light is a recognizable lens.
 poly(copper[0],[-74,-131],[-78,-143],[-57,-176],[-35,-196],[1,-210],[32,-199],[62,-180],[73,-154],[73,-136],[56,-123],[22,-116],[-36,-116]);
 poly(glass[0],[-73,-143],[-54,-175],[-36,-193],[-36,-134],[-54,-127]);
 poly(lit?glass[3]:glass[2],[-51,-172],[-35,-191],[-16,-202],[-25,-145],[-37,-132],[-52,-140]);
 poly(lit?glass[4]:glass[3],[-15,-202],[0,-207],[24,-197],[26,-145],[-11,-135],[-23,-145]);
 poly(lit?glass[2]:glass[1],[24,-197],[47,-186],[58,-173],[63,-146],[47,-132],[26,-145]);
 poly(glass[0],[54,-181],[64,-174],[71,-153],[66,-140],[63,-146]);
 poly(lit?'#89c6d0':'#49788c',[-17,-170],[-5,-189],[10,-193],[24,-180],[28,-163],[16,-148],[-5,-148]);
 poly(lit?'#d3f0d6':'#7f9fa3',[-6,-171],[2,-184],[10,-185],[19,-177],[21,-164],[12,-155],[1,-157]);
 poly(lit?'#fff0b2':'#bbac80',[1,-172],[9,-179],[16,-172],[10,-162]);
 line(copper[1],4,[-36,-194],[-38,-130]);line(copper[3],2,[-36,-193],[-38,-132]);
 line(copper[1],4,[-1,-207],[-12,-137]);line(copper[4],2,[-1,-205],[-13,-138]);
 line(copper[1],4,[27,-198],[29,-138]);line(copper[2],2,[27,-198],[30,-136]);
 line(verdigris[0],4,[54,-184],[58,-135]);line(verdigris[2],2,[53,-181],[58,-138]);
 poly(copper[1],[-77,-142],[-56,-132],[-36,-134],[-13,-125],[27,-131],[53,-136],[74,-148],[74,-136],[57,-123],[22,-116],[-36,-116],[-73,-130]);
 line(copper[4],2,[-73,-140],[-37,-131]);line(copper[3],2,[-35,-131],[-13,-123]);
 line(copper[2],2,[-12,-123],[29,-130]);line(verdigris[2],2,[31,-131],[55,-135]);
 for(const [x,y] of [[-59,-132],[-42,-129],[-24,-125],[-4,-121],[18,-124],[40,-129],[58,-136]])rect(copper[4],x,y,2,2);
 poly(copper[0],[-20,-199],[-14,-212],[-7,-218],[7,-218],[15,-212],[26,-198]);
 poly(verdigris[1],[-14,-205],[-10,-212],[-5,-215],[6,-215],[12,-208],[16,-204],[-5,-201]);
 line(copper[4],2,[-9,-211],[7,-214]);
 rect(copper[0],-2,-233,5,19);rect(copper[3],-2,-231,2,13);
 poly(copper[3],[-7,-234],[0,-242],[7,-234],[0,-230]);
 rect(copper[4],-1,-238,2,5);
}

function camp(c){
 const {poly,line,rect}=painter(c);
 poly('#263e3370',[-102,-6],[-74,-24],[41,-28],[102,-11],[94,3],[32,10],[-88,9]);
 poly('#403f36',[-66,-10],[-64,-22],[-35,-42],[26,-43],[38,-25],[29,-10]);
 poly('#746950',[-65,-23],[-35,-42],[24,-43],[36,-26],[28,-22],[-63,-20]);
 poly('#252f38',[-73,-21],[-42,-76],[-12,-84],[28,-63],[37,-24],[26,-12],[-48,-13]);
 poly('#395767',[-70,-23],[-43,-74],[-14,-81],[-22,-56],[-38,-47],[-48,-17]);
 poly('#547684',[-68,-25],[-43,-72],[-16,-78],[-22,-61],[-54,-43]);
 poly('#4c7274',[-15,-79],[26,-61],[32,-30],[20,-27],[-8,-60]);
 poly('#355854',[-8,-60],[20,-27],[31,-30],[27,-16],[-19,-16]);
 poly('#28363a',[-46,-17],[-25,-59],[-14,-76],[-5,-58],[17,-18]);
 poly('#362e29',[-38,-18],[-24,-51],[-14,-65],[-5,-50],[7,-18]);
 poly('#826d4a',[-26,-25],[-17,-42],[-12,-46],[-6,-36],[-3,-23]);
 line('#bda67c',2,[-46,-19],[-14,-80]);line('#9b8963',2,[-14,-80],[20,-19]);
 line('#b4a181',1,[-43,-73],[-17,-78]);line('#304b52',2,[-68,-24],[-42,-69]);
 line('#8f8267',1,[-42,-69],[-82,-16]);line('#8f8267',1,[23,-57],[46,-16]);
 rect('#4c412f',-84,-19,4,9);rect('#4c412f',45,-19,3,8);
 rect('#9e8763',-84,-20,4,3);rect('#9e8763',45,-20,3,3);

 // A low field bench holds the rolled survey chart, divided sample tray and lantern.
 poly('#443e31',[26,-41],[58,-43],[68,-34],[67,-26],[26,-25]);
 poly('#948052',[25,-42],[56,-45],[67,-36],[61,-32],[26,-33]);
 rect('#553d2e',29,-29,5,14);rect('#594733',59,-29,5,13);
 rect('#9d7c53',29,-28,2,10);rect('#ad8d61',59,-28,2,8);
 rect('#c9b88d',31,-41,18,5);rect('#edd2a1',32,-42,14,2);
 rect('#5c7970',44,-41,2,4);rect('#5b6052',50,-41,11,4);
 rect('#a69069',52,-41,2,2);rect('#b4a57c',56,-39,3,2);
 poly('#312c2a',[57,-44],[58,-52],[66,-52],[68,-44]);
 rect('#e2b76c',60,-50,5,5);rect('#fae1a0',60,-50,2,4);
 rect('#685547',58,-54,8,2);
 for(const [x,y,w] of [[-92,-9,11],[-78,-6,7],[69,-6,13],[82,-10,10],[95,-8,6]]){
  poly('#58665d',[x,y],[x+2,y-5],[x+w-3,y-6],[x+w,y-2],[x+w-2,y+1]);
  line('#8b9076',1,[x+3,y-5],[x+w-3,y-5]);
 }
 rect('#3b382e',68,-73,4,59);rect('#887354',68,-71,2,48);
 rect('#b79762',66,-74,8,3);rect('#574334',66,-35,8,3);
}

function stamp(c,x,y,name,draw){
 let art=landmarkRasters.get(name);
 if(!art){
  const width=248,height=name==='camp'?100:260;
  const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  const pen=canvas.getContext('2d');pen.translate(width/2,height-13);draw(pen);
  art={canvas,dx:width/2,dy:height-13};landmarkRasters.set(name,art);
 }
 c.save();c.imageSmoothingEnabled=false;c.drawImage(art.canvas,Math.round(x)-art.dx,Math.round(y)-art.dy);c.restore();
}

export function paintTideglassBeacon(c,x,y,lit,time=0){
 stamp(c,x,y,lit?'beacon-lit':'beacon',pen=>beacon(pen,lit));
 if(!lit)return;
 c.save();c.translate(Math.round(x),Math.round(y));
 const {rect}=painter(c);
 const phase=Math.floor(time*8);
 for(let i=0;i<8;i++){
  const angle=(phase+i*7)*.19,dx=Math.round(Math.cos(angle)*(26+i*5)),dy=-181+Math.round(Math.sin(angle)*(12+i*3));
  if((phase+i)%6>2)continue;
  rect(i%2?'#afe2cf':'#f2df9d',dx,dy,i%3===0?2:1,2);
 }
 if(phase%10<4){rect('#fdf7c7',8,-180,2,12);rect('#fdf7c7',4,-176,10,2);}
 c.restore();
}

export function paintTideglassCamp(c,x,y,time=0){
 stamp(c,x,y,'camp',camp);
 c.save();c.translate(Math.round(x),Math.round(y));
 const {poly,line}=painter(c),sway=Math.round(Math.sin(time*2.6)*3);
 poly('#7f493e',[72,-70],[91,-70+sway],[95,-66+sway],[89,-63+sway],[94,-59+sway],[72,-61]);
 poly('#b16a4a',[72,-70],[90,-69+sway],[92,-67+sway],[82,-67],[72,-65]);
 line('#d39464',1,[73,-69],[91,-69+sway]);
 c.restore();
}
