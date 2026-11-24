import {
 QUIDDITCH_PITCH,QUIDDITCH_TEAMS,QUIDDITCH_HOOPS,QUIDDITCH_TRUNK,QUIDDITCH_RETURN,QUIDDITCH_RACK,QUIDDITCH_SCOREBOARD,
} from './quidditch-layout.mjs';
import {drawPitchSpectator} from './quidditch-spectators.mjs';
import {compilePixelRecipe} from './pixel-recipe.mjs';
import {drawPixelRecipe} from './pixel-recipe-canvas.mjs';
import {drawPixelChatText,pixelChatTextWidth} from './pixel-chat-font.mjs';
import {block as b,shape as p,line} from './diagon-shop-brush.mjs';
import closedTrunk from '../assets/pixel-recipes/quidditch/match-trunk-closed.pixel.json' with {type:'json'};
import openTrunk from '../assets/pixel-recipes/quidditch/match-trunk-open.pixel.json' with {type:'json'};
import whistle from '../assets/pixel-recipes/quidditch/brass-whistle-portkey.pixel.json' with {type:'json'};
import quaffle from '../assets/pixel-recipes/quidditch/quaffle.pixel.json' with {type:'json'};
import bludger from '../assets/pixel-recipes/quidditch/bludger.pixel.json' with {type:'json'};
import snitch from '../assets/pixel-recipes/quidditch/golden-snitch.pixel.json' with {type:'json'};

const sprites=Object.fromEntries(Object.entries({closedTrunk,openTrunk,whistle,quaffle,bludger,snitch})
 .map(([id,recipe])=>[id,compilePixelRecipe(recipe)]));
const {left,right,top,bottom,cx,cy}=QUIDDITCH_PITCH;
const teamEntries=Object.entries(QUIDDITCH_TEAMS);
const outline='#534338',deep='#332d28',oak='#826344',sun='#bd9a68',ivory='#e5d6aa';
const arenaEdge=[[-722,-553],[-422,-583],[422,-583],[722,-553],[857,-436],[919,-228],[919,224],
 [857,437],[722,541],[422,573],[-422,573],[-722,541],[-857,437],[-919,224],[-919,-228],[-857,-436]];
const zoneBounds={left:left-208,right:right+208,top:top-188,bottom:bottom+152};
const woodRails=[{y:top+67,width:1800},{y:bottom-9,width:1986}];
const bleachers=teamEntries.flatMap(([team,info])=>[338,644,875].map((offset,i)=>({team,
 x:cx+info.side*offset,y:top+2,width:[242,234,210][i],index:i,
}))).concat(teamEntries.map(([team,info])=>({team,x:cx+info.side*660,y:bottom+65,width:282,index:3,south:true})));
let groundImage,groundWarmScheduled=false;
const canopyImages=[];
const turfImages=[];
const turfSize=96;

function noise(x,y){
 let n=Math.imul(x,0x45d9f3b)^Math.imul(y,0x27d4eb2d);
 n=Math.imul(n^(n>>>16),0x45d9f3b);
 return (n^(n>>>16))>>>0;
}

function outlinePoints(scale){return arenaEdge.map(([x,y])=>[cx+x*scale,cy+y*scale]);}

function makeSurface(width,height){
 if(typeof OffscreenCanvas==='function')return new OffscreenCanvas(width,height);
 return typeof document!=='undefined'?Object.assign(document.createElement('canvas'),{width,height}):null;
}

function paintCanopy(c,variant){
 const foliage=[['#315146','#3a5a48','#42634d'],['#2c4a41','#355745','#41604b'],
  ['#395744','#446148','#4c6b4b'],['#2f5047','#375c4d','#477263']][variant%4];
 const shift=variant%3*4-4,r=21+variant%6;
 p(c,'#1e3430',[[-r-3,6],[-r+2,-9],[-15,-21],[shift,-25],[15,-19],[r,-9],[r+4,12],
  [r-4,21],[6,24],[-19,21],[-r+1,16]]);
 p(c,foliage[0],[[-r,2],[-r+5,-11],[-15,-18],[shift,-24],[13,-19],[r-2,-12],[r+2,3],
  [r-1,14],[12,20],[-7,21],[-18,16],[-r+1,13]]);
 p(c,foliage[1],[[-r+2,-1],[-r+7,-12],[-12,-18],[0,-23],[11,-19],[19,-13],[21,-6],
  [12,-4],[8,4],[-5,8],[-14,4],[-21,4]]);
 p(c,foliage[2],[[-r+7,-5],[-r+10,-12],[-11,-17],[shift+5,-19],[shift+9,-16],
  [-2,-12],[-8,-12],[-10,-7],[-18,-6]]);
 p(c,foliage[1],[[-17,10],[-7,7],[-2,9],[7,8],[12,11],[4,15],[-6,17],[-13,14]]);
 for(let i=0;i<12;i++){
  const n=noise(variant,i+7);
  b(c,-17+n%34,-16+(n>>>5)%30,2+n%5,1,foliage[n%3]);
 }
}

function groundEllipse(c,x,y,rx,ry,color){
 for(let dy=-ry;dy<=ry;dy++){
  const run=Math.floor(rx*Math.sqrt(1-(dy/ry)**2));
  b(c,x-run,y+dy,run*2+1,1,color);
 }
}

function chalkEllipse(c,x,y,rx,ry,color,width=2){
 for(let dy=-ry;dy<=ry;dy++){
  const outside=Math.floor(rx*Math.sqrt(1-(dy/ry)**2));
  const within=Math.abs(dy)<ry-width?Math.floor((rx-width)*Math.sqrt(1-(dy/(ry-width))**2)):0;
  if(within>0){b(c,x-outside,y+dy,outside-within+1,1,color);b(c,x+within,y+dy,outside-within+1,1,color);}
  else b(c,x-outside,y+dy,outside*2+1,1,color);
 }
}

function paintForestEdge(c){
 b(c,zoneBounds.left,zoneBounds.top,zoneBounds.right-zoneBounds.left,zoneBounds.bottom-zoneBounds.top,'#253b37');
 for(let y=zoneBounds.top+16;y<zoneBounds.bottom+45;y+=49)for(let x=zoneBounds.left+14;x<zoneBounds.right+36;x+=45){
  if(x>left+20&&x<right-20&&y>top+18&&y<bottom-18)continue;
  const tone=noise(x,y),variant=tone%12,dx=tone%33-15,dy=(tone>>>7)%37-18;
  let image=canopyImages[variant];
  if(!image&&(image=makeSurface(64,58))){
   const pen=image.getContext('2d');pen.translate(32,29);paintCanopy(pen,variant);canopyImages[variant]=image;
  }
  if(image)c.drawImage(image,x+dx-32,y+dy-29);
  else{c.save();c.translate(x+dx,y+dy);paintCanopy(c,variant);c.restore();}
 }
}

function turfTile(c,lane,variant){
 const [base,dark,grass,light]=lane?['#577956','#4c704e','#607e56','#6d895b']:
  ['#4e7150','#45694a','#587951','#637f54'];
 b(c,0,0,turfSize,turfSize,base);
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  const n=noise(variant*41+col,row+lane*19),x=col*12+(n%7),y=row*12+((n>>>7)%6);
  if(n%4===0)b(c,x-2,y+3,8+n%7,2,dark);
  if(n%3===0)b(c,x,y+1,7,2,grass);
  for(let strand=0;strand<2+n%3;strand++){
   const dx=(n>>>(strand+4))%8,dy=(n>>>(strand+8))%6,w=1+((n>>>strand)&1);
   b(c,x+dx,y+dy,w,2,grass);if(n%5===0)b(c,x+dx,y+dy-1,1,1,light);
  }
 }
}

function paintTurf(c){
 p(c,'#405343',outlinePoints(1.075));p(c,'#526450',outlinePoints(1.045));
 p(c,'#76755b',outlinePoints(1.024));p(c,'#628063',outlinePoints(1.012));
 const turf=outlinePoints(1);
 c.save();c.beginPath();c.moveTo(...turf[0]);for(const point of turf.slice(1))c.lineTo(...point);c.closePath();c.clip();
 for(let y=top,row=0;y<bottom;y+=turfSize,row++)for(let x=left,col=0;x<right;x+=turfSize,col++){
  const lane=col%2,variant=noise(col,row)%8,id=lane*8+variant;
  let image=turfImages[id];
  if(!image&&(image=makeSurface(turfSize,turfSize))){turfTile(image.getContext('2d'),lane,variant);turfImages[id]=image;}
  if(image)c.drawImage(image,x,y);
  else{c.save();c.translate(x,y);turfTile(c,lane,variant);c.restore();}
 }
 c.restore();
 for(let i=0;i<turf.length;i++){
  const [x,y]=turf[i],[nx,ny]=turf[(i+1)%turf.length],distance=Math.hypot(nx-x,ny-y);
  for(let offset=3;offset<distance;offset+=9){
   const n=noise(i,offset),f=offset/distance;
   if(n%5===0)b(c,x+(nx-x)*f+n%5,y+(ny-y)*f-2,n%4+2,2,'#938568');
  }
 }
}

function paintMarkings(c){
 const white='#c4caaa',soft='#8da484',shadow='#506e51';
 line(c,shadow,cx+2,cy-556,cx+2,cy+553,3);line(c,white,cx,cy-555,cx,cy+553,2);
 chalkEllipse(c,cx,cy,191,137,soft,2);chalkEllipse(c,cx,cy,180,126,white,2);
 chalkEllipse(c,cx,cy,65,46,'#a1b294',2);
 for(const [team,{side,home}] of teamEntries){
  const goalX=QUIDDITCH_HOOPS.find(hoop=>hoop.team===team).x;
  const boxX=cx+side*558,end=cx+side*871;
  const pale=team==='gold'?'#cbbe90':'#c0b5d3';
  line(c,soft,boxX,cy-300,end,cy-249,2);line(c,soft,boxX,cy+300,end,cy+249,2);
  line(c,white,end,cy-249,end,cy+249,2);line(c,white,boxX,cy-300,boxX,cy-145,2);
  line(c,white,boxX,cy+145,boxX,cy+300,2);chalkEllipse(c,boxX,cy,97,145,white,2);
  for(const {x,y} of QUIDDITCH_HOOPS.filter(hoop=>hoop.team===team)){
   groundEllipse(c,x,y,23,15,team==='gold'?'#737e55':'#637566');chalkEllipse(c,x,y,29,19,pale,2);
   for(const dx of [-36,36])b(c,x+dx-2,y-1,5,2,pale);
  }
  for(let y=cy-360;y<=cy+360;y+=27){b(c,goalX+side*96,y,10,2,soft);b(c,goalX+side*96,y,5,1,pale);}
  const {x,y}=home;
  p(c,'#4c6652',[[x-91,y-2],[x-69,y-41],[x+69,y-41],[x+91,y-2],[x+65,y+38],[x-65,y+38]]);
  p(c,team==='gold'?'#807d5d':'#717686',[[x-83,y-3],[x-62,y-34],[x+62,y-34],[x+83,y-3],[x+60,y+31],[x-60,y+31]]);
  p(c,team==='gold'?'#96845d':'#848095',[[x-73,y-2],[x-58,y-26],[x+58,y-26],[x+73,y-2],[x+53,y+25],[x-53,y+25]]);
  for(const dx of [-65,65])for(let f=0;f<3;f++)b(c,x+dx-3,y-15+f*13,6,1,pale);
 }
}

function paintArrival(c){
 const y=QUIDDITCH_RETURN.y;
 p(c,'#5c6b56',[[cx-124,y-98],[cx-77,y-126],[cx+74,y-126],[cx+123,y-98],[cx+113,bottom],[cx-116,bottom]]);
 p(c,'#817f67',[[cx-113,y-92],[cx-64,y-116],[cx+67,y-116],[cx+112,y-89],[cx+105,bottom],[cx-106,bottom]]);
 c.save();c.beginPath();c.moveTo(cx-113,y-92);c.lineTo(cx-64,y-116);c.lineTo(cx+67,y-116);c.lineTo(cx+112,y-89);
 c.lineTo(cx+105,bottom);c.lineTo(cx-106,bottom);c.closePath();c.clip();
 const tones=['#777967','#89836c','#918970','#7e7d67','#9b9176'];
 for(let py=y-116,row=0;py<bottom;py+=15,row++)for(let px=cx-125-row%2*12;px<cx+126;px+=24){
  const n=noise(px,py);
  p(c,tones[n%tones.length],[[px+1,py+3],[px+5,py],[px+22,py+1],[px+23,py+4],
   [px+23,py+13],[px+2,py+14],[px,py+11]]);
  if(n%3===0)b(c,px+5,py+3,9,1,'#aca080');
 }
 c.restore();
 chalkEllipse(c,cx,y,57,34,'#c3ac84',2);chalkEllipse(c,cx,y,48,27,'#74795d',2);
}

function paintGround(c){paintForestEdge(c);paintTurf(c);paintMarkings(c);paintArrival(c);}

function prepareGround(){
 if(!groundImage){
  const w=zoneBounds.right-zoneBounds.left,h=zoneBounds.bottom-zoneBounds.top;
  groundImage=makeSurface(w,h);
  if(groundImage){const pen=groundImage.getContext('2d');pen.translate(-zoneBounds.left,-zoneBounds.top);paintGround(pen);}
 }
}

export function warmQuidditchGround(){
 if(groundImage||groundWarmScheduled||typeof requestIdleCallback!=='function')return;
 groundWarmScheduled=true;
 requestIdleCallback(()=>{groundWarmScheduled=false;prepareGround();});
}

export function drawQuidditchGround(c,bounds=zoneBounds){
 b(c,bounds.left-2,bounds.top-2,bounds.right-bounds.left+4,bounds.bottom-bounds.top+4,'#253b37');
 prepareGround();
 if(groundImage)c.drawImage(groundImage,zoneBounds.left,zoneBounds.top);
 else paintGround(c);
}

function deck(c,x,y,w){
 p(c,deep,[[x-w/2-8,y+2],[x-w/2,y-71],[x+w/2,y-71],[x+w/2+10,y+3],[x+w/2-5,y+22],[x-w/2-4,y+22]]);
 for(let row=0;row<3;row++){
  const yy=y-13-row*23,inset=row*4;
  b(c,x-w/2+inset,yy,w-inset*2,12,row%2?'#7c654e':'#947652');
  b(c,x-w/2+inset+1,yy+1,w-inset*2-2,2,sun);
  for(let px=x-w/2+inset+9;px<x+w/2-inset-4;px+=24)b(c,px,yy+3,1,8,outline);
 }
 for(const dx of [-w/2+11,-w/6,w/6,w/2-11]){
  b(c,x+dx-4,y-14,9,35,outline);b(c,x+dx-2,y-14,3,32,oak);b(c,x+dx-4,y+16,10,5,'#b4a38a');
 }
 b(c,x-w/2-2,y-5,w+4,7,outline);b(c,x-w/2,y-4,w,2,sun);
}

function bleacher(c,fixture,time,crowd,visible){
 const {x,y,width:w,team,index}=fixture,{color,dark}=QUIDDITCH_TEAMS[team];
 p(c,'#152c29a0',[[x-w/2-18,y+2],[x-w/2+8,y-24],[x+w/2+18,y-14],[x+w/2+30,y+17],
  [x+w/2-3,y+32],[x-w/2-11,y+21]]);
 deck(c,x,y,w);
 for(const dx of [-w/2+7,w/2-7]){
  b(c,x+dx-4,y-147,7,157,deep);b(c,x+dx-2,y-143,3,151,oak);
  b(c,x+dx-4,y-107,9,4,sun);b(c,x+dx-4,y-54,9,4,sun);
 }
 const directions=[];
 let reaction;
 if(crowd)crowd.stats.stands++;
 for(let row=2;row>=0;row--)for(let seat=0;seat<Math.floor((w-20)/24);seat++){
  const n=noise(index*71+row*31+(team==='gold'?47:109),seat),xx=x-w/2+16+24*seat+(row%2)*6,yy=y-7-row*23;
  if(n%7===0||!visible(xx,yy,9,30))continue;
  const side=xx<x?0:1;
  directions[side]??=crowd?.watch(fixture,side,time)??(fixture.south?4:0);
  if(reaction===undefined)reaction=crowd?.reaction(fixture)??null;
  const age=reaction?crowd.match.time-reaction.at:0;
  const delay=.07+(n%7)*.06,cheer=!!reaction&&(n+reaction.id)%5<2&&age>=delay&&age<delay+.55;
  drawPitchSpectator(c,xx,yy-(cheer?2:0),directions[side],n%6,team,cheer);
  if(crowd){crowd.stats.spectators++;if(cheer)crowd.stats.cheering++;}
 }
 const awning=[[x-w/2-8,y-104],[x-w/2+17,y-151],[x+w/2-16,y-151],[x+w/2+8,y-104],
  [x+w/2+5,y-94],[x-w/2-6,y-94]];
 p(c,deep,awning);p(c,dark,[[x-w/2-4,y-105],[x-w/2+19,y-148],[x+w/2-19,y-148],[x+w/2+4,y-105]]);
 for(let i=0;i<7;i++){
  const topX=x-w/2+22+i*(w-44)/7,bottomX=x-w/2+2+i*(w-4)/7;
  if(i%2===0)p(c,color,[[topX,y-146],[topX+(w-44)/7-1,y-146],
   [bottomX+(w-4)/7-2,y-106],[bottomX,y-106]]);
  b(c,bottomX,y-104,(w-4)/7-1,8,i%2?dark:color);
  b(c,bottomX+2,y-96,(w-4)/7-5,2,deep);
 }
 b(c,x-w/2+22,y-149,w-44,2,ivory);b(c,x-w/2-2,y-106,w+4,2,sun);
 const flap=(Math.floor(time*6)+index)%4;
 b(c,x-1,y-177,3,27,outline);b(c,x,y-177,1,24,sun);
 p(c,dark,[[x+1,y-176],[x+30,y-176+flap],[x+22,y-169],[x+29,y-162+flap],[x+1,y-163]]);
 p(c,color,[[x+2,y-175],[x+27,y-174+flap],[x+20,y-169],[x+25,y-164+flap],[x+2,y-164]]);
}

function fence(c,x,y,to){
 b(c,x,y-1,to-x,4,'#3d5a4599');b(c,x,y-14,to-x,3,outline);b(c,x,y-13,to-x,1,sun);
 b(c,x,y-6,to-x,3,outline);b(c,x,y-5,to-x,1,oak);
 for(let xx=x;xx<to;xx+=47){b(c,xx-3,y-18,6,21,outline);b(c,xx-2,y-18,2,19,sun);b(c,xx-3,y-18,6,2,ivory);}
}

function leagueText(c,text,x,y,color,scale=1){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
 drawPixelChatText(c,text,-pixelChatTextWidth(text)/2,0,color);c.restore();
}

function scoreboardFixture(c,match){
 const {x,y}=QUIDDITCH_SCOREBOARD;
 for(const dx of [-66,66]){b(c,x+dx-5,y-102,10,112,outline);b(c,x+dx-3,y-100,3,104,sun);b(c,x+dx-7,y+5,14,7,'#9c8f73');}
 p(c,deep,[[x-88,y-94],[x-72,y-111],[x+72,y-111],[x+88,y-94],[x+88,y-26],[x+78,y-18],[x-78,y-18],[x-88,y-26]]);
 p(c,oak,[[x-84,y-93],[x-70,y-107],[x+69,y-107],[x+84,y-93],[x+84,y-27],[x+76,y-22],[x-76,y-22],[x-84,y-27]]);
 b(c,x-72,y-96,144,65,'#233d3d');b(c,x-71,y-95,141,1,'#d5b477');b(c,x-1,y-93,2,58,'#837154');
 b(c,x-57,y-110,114,2,ivory);
 for(const [name,{color,side}] of teamEntries){
  leagueText(c,name.toUpperCase(),x+side*36,y-88,color);leagueText(c,String(match?.scores?.[name]??0),x+side*36,y-70,'#fff0c9',3);
 }
}

function goalRing(c,hoop,front,time){
 const {x,y,z,radius}=hoop,cy=y-z,rx=Math.round(radius*.65),ry=Math.round(radius),band=5;
 for(let dy=front?0:-ry;dy<=(front?ry:-1);dy++){
  const bound=Math.floor(rx*Math.sqrt(1-(dy/ry)**2));
  const hole=Math.abs(dy)<ry-band?Math.floor((rx-band)*Math.sqrt(1-(dy/(ry-band))**2)):0;
  for(let dx=-bound;dx<=bound;dx++){
   if(Math.abs(dx)<hole)continue;
   const edge=Math.abs(dx)===bound||Math.abs(dx)===hole;
   const color=edge?'#73563c':dy<-ry*.31||dx<-rx*.55?'#e6bf74':front?'#ae8048':'#c79958';
   b(c,x+dx,cy+dy,1,1,color);
  }
 }
 if(front&&Math.floor(time*3+hoop.y/50)%6<2){b(c,x-rx+4,cy+6,2,4,'#f5d797');b(c,x-rx+3,cy+7,4,2,'#f5d797');}
}

function goalBack(c,hoop,time){
 const {x,y,z,radius,team}=hoop,{color,dark}=QUIDDITCH_TEAMS[team],end=y-z+radius-3;
 groundEllipse(c,x+18,y+3,28,9,'#4c695674');
 p(c,deep,[[x-11,y-6],[x+10,y-6],[x+15,y+1],[x+9,y+5],[x-10,y+5],[x-14,y+1]]);
 b(c,x-5,end,11,y-end+2,outline);b(c,x-3,end,4,y-end,'#ad8353');b(c,x-3,end,1,y-end,'#d7b275');
 b(c,x-8,y-11,17,3,'#d8ae72');b(c,x-8,y-7,17,3,dark);
 p(c,dark,[[x-4,end+10],[x+28,end+10],[x+28,end+25],[x+14,end+21],[x-4,end+25]]);
 p(c,color,[[x-2,end+11],[x+26,end+11],[x+26,end+23],[x+14,end+19],[x-2,end+23]]);
 b(c,x+8,end+13,2,7,ivory);
 goalRing(c,hoop,false,time);
}

function stand(c,x,y,team,match,time){
 const {color,dark}=QUIDDITCH_TEAMS[team];
 groundEllipse(c,x+7,y+5,33,10,'#293e386e');
 p(c,outline,[[x-20,y-5],[x-15,y-12],[x+15,y-12],[x+20,y-5],[x+17,y+4],[x-17,y+4]]);
 b(c,x-12,y-47,24,46,deep);b(c,x-10,y-44,17,42,oak);b(c,x-9,y-44,3,40,sun);b(c,x+4,y-42,6,38,'#614c42');
 b(c,x-13,y-12,26,4,sun);p(c,outline,[[x-21,y-48],[x-14,y-66],[x+14,y-66],[x+21,y-48],[x+17,y-42],[x-16,y-42]]);
 p(c,color,[[x-18,y-49],[x-12,y-62],[x+12,y-62],[x+17,y-49]]);b(c,x-15,y-47,30,4,dark);
 p(c,deep,[[x-12,y-53],[x-7,y-60],[x+7,y-60],[x+12,y-53],[x+7,y-50],[x-7,y-50]]);b(c,x-5,y-58,10,2,ivory);
 b(c,x-15,y-38,30,12,dark);leagueText(c,team.toUpperCase(),x,y-36,ivory);
 if(match?.snitch?.holderId!=null){
  for(let i=0;i<5;i++){
   const age=(time*1.05+i*.21)%1;
   b(c,x+Math.sin(age*9+i)*15,y-53-age*23,2,2,age<.45?color:ivory);
  }
 }
}

function pitchRack(c,{x,y}){
 groundEllipse(c,x+4,y+4,32,8,'#344b3c82');
 for(const dx of [-25,24]){b(c,x+dx-3,y-32,7,33,deep);b(c,x+dx-1,y-30,2,30,sun);}
 b(c,x-29,y-14,57,7,outline);b(c,x-27,y-13,54,2,sun);
 for(const [i,dx] of [-16,0,17].entries()){
  const tip=x+dx+9,y0=y-46-i*3;
  line(c,outline,x+dx-4,y-10,tip,y0,3);line(c,sun,x+dx-4,y-11,tip,y0,1);
  p(c,deep,[[x+dx-8,y-13],[x+dx-1,y-12],[x+dx+2,y+2],[x+dx-9,y+3],[x+dx-12,y+1]]);
  line(c,'#c19454',x+dx-8,y-11,x+dx-10,y+1,2);b(c,x+dx-7,y-12,9,2,'#e0ba76');
 }
}

export function drawQuidditchPortkey(c,x,y,time,{outbound=false,live=true}={}){
 drawPixelRecipe(c,sprites.whistle,time*1000,Math.round(x),Math.round(y));
 if(!live)return;
 const tones=outbound?['#e3a95d','#fff0b1']:['#c5ace9','#f1dbff'];
 for(let i=0;i<8;i++){
  const progress=(time*.85+i/8)%1,dx=Math.sin(i*2.2+progress*5)*(7+progress*22);
  c.save();c.globalAlpha=1-progress;b(c,x+dx,y-21-progress*30,i%4===0?3:2,i%4===0?3:2,tones[i%2]);c.restore();
 }
}

function trunk(c,time,open){
 const {x,y}=QUIDDITCH_TRUNK;
 groundEllipse(c,x+7,y+5,44,15,'#3b5b466e');
 drawPixelRecipe(c,open?sprites.openTrunk:sprites.closedTrunk,time*1000,Math.round(x),Math.round(y));
 if(!open){const glint=Math.floor(time*6)%18;if(glint<3)b(c,x+glint-1,y-20,2,2,ivory);}
}

function recentEffects(c,match,time,visible){
 if(!match)return;
 for(const event of match.events||[]){
  const age=match.time-event.at;
  if(age<0||age>=.68)continue;
  const launch=event.type==='open';
  if(!launch&&event.type!=='goal'&&event.type!=='snitch-caught'&&event.type!=='stagger'&&event.type!=='finish')continue;
  const x=event.x??QUIDDITCH_TRUNK.x,y=(event.y??QUIDDITCH_TRUNK.y)-(event.z||0),color=QUIDDITCH_TEAMS[event.team]?.color||'#e9d49b';
  if(!visible(x,y,79,79))continue;
  c.save();c.globalAlpha=1-age/.68;
  for(let i=0;i<12;i++){
   const direction=i*Math.PI/6,radius=8+age*(launch?134:94),dx=Math.cos(direction)*radius,dy=Math.sin(direction)*radius*.68;
   b(c,x+dx,y+dy-age*22,i%3===0?3:2,2,i%2?color:'#fbefd4');
  }
  c.restore();
 }
}

export function queueQuidditchPitch(c,match,time,visible,objects,crowd=null,viewBounds=null){
 const add=(x,y,padX,padY,paint,depth=y)=>{if(visible(x,y,padX,padY))objects.push({depth,paint});};
 for(const fixture of bleachers){
  const {x,y,width}=fixture,pad=width/2+32;
  if(viewBounds&&(x-pad>viewBounds.right||x+pad<viewBounds.left||y-181>viewBounds.bottom||y+33<viewBounds.top))continue;
  add(x,y,pad,181,()=>bleacher(c,fixture,time,crowd,visible));
 }
 for(const {y,width} of woodRails)for(const side of [-1,1]){
  const start=side<0?cx-width/2:cx+103,end=side<0?cx-103:cx+width/2;
  if(visible((start+end)/2,y,(end-start)/2+7,24))objects.push({depth:y,paint:()=>fence(c,start,y,end)});
 }
 add(QUIDDITCH_SCOREBOARD.x,QUIDDITCH_SCOREBOARD.y,91,118,()=>scoreboardFixture(c,match));
 for(const hoop of QUIDDITCH_HOOPS){
  const {x,y,z,radius}=hoop;
  add(x,y,54,z+radius+22,()=>goalBack(c,hoop,time),y-5);
  add(x,y,54,z+radius+22,()=>goalRing(c,hoop,true,time),y+6);
 }
 for(const [team,{home:{x,y}}] of teamEntries)add(x,y,56,90,()=>stand(c,x,y,team,match,time));
 add(QUIDDITCH_TRUNK.x,QUIDDITCH_TRUNK.y,50,70,()=>trunk(c,time,!!match&&match.phase!=='waiting'));
 add(QUIDDITCH_RACK.x,QUIDDITCH_RACK.y,39,63,()=>pitchRack(c,QUIDDITCH_RACK));
 add(QUIDDITCH_RETURN.x,QUIDDITCH_RETURN.y,45,72,()=>drawQuidditchPortkey(c,QUIDDITCH_RETURN.x,QUIDDITCH_RETURN.y,time));
 objects.push({depth:bottom-3,paint:()=>recentEffects(c,match,time,visible)});
}

export function drawQuidditchBallShadow(c,kind,ball){
 if(!ball)return;
 const radius=kind==='snitch'?5:8;
 groundEllipse(c,ball.x,(ball.y||0)+1,radius,3,(ball.z||0)>46?'#34554042':'#2d483a80');
}

export function drawQuidditchBall(c,kind,ball,time){
 if(!ball||!sprites[kind])return;
 const x=Math.round(ball.x),y=Math.round(ball.y-(ball.z||0));
 if(kind==='snitch'){
  const flap=6+Math.floor((1+Math.sin(time*27))*5);
  for(const side of [-1,1]){
   p(c,'#ab9475',[[x+side*3,y-1],[x+side*9,y-6],[x+side*(16+flap*.38),y-flap],
    [x+side*(15+flap*.38),y-3],[x+side*7,y+2]]);
   p(c,'#f1dfab',[[x+side*4,y-2],[x+side*9,y-6],[x+side*(14+flap*.38),y-flap+1],
    [x+side*(14+flap*.38),y-4],[x+side*8,y]]);
  }
  const phase=(time*.8)%1;b(c,x+9+phase*9,y-4-phase*8,2,2,'#f9df97');
 }else if(kind==='bludger'){
  const speed=Math.hypot(ball.vx||0,ball.vy||0)||1;
  for(let i=1;i<=3;i++){
   c.save();c.globalAlpha=.55-i*.13;
   b(c,x-(ball.vx||0)/speed*i*6,y-(ball.vy||0)/speed*i*6,6-i,2,'#eeab7c');c.restore();
  }
 }
 drawPixelRecipe(c,sprites[kind],time*1000,x,y);
}

export function drawQuidditchScoreboard(c,match,width,height){
 const w=Math.min(224,width-18),x=Math.round((width-w)/2),y=8;
 if(w<96||height<75)return;
 const phase=match?.phase||'waiting',purple=QUIDDITCH_TEAMS.violet.color,gold=QUIDDITCH_TEAMS.gold.color;
 const split=x+w/2;
 p(c,'#172528ec',[[x,y+5],[x+5,y],[x+w-5,y],[x+w,y+5],[x+w,y+34],[x+w-5,y+39],[x+5,y+39],[x,y+34]]);
 b(c,x+5,y+1,w-10,2,'#c4aa76');b(c,x+5,y+36,w-10,1,'#897356');
 b(c,split-1,y+8,2,24,'#616568');
 for(const [team,{side,color}] of teamEntries){
  const at=split+side*w/4;
  leagueText(c,team.toUpperCase(),at,y+6,color);
  leagueText(c,String(match?.scores?.[team]??0),at,y+17,'#fff0cb',2);
 }
 let banner='',ink='#e3d7bb';
 if(phase==='finished'){
  banner=match.winner==='tie'?'MATCH DRAWN':match.winner?`${match.winner.toUpperCase()} WINS`:'MATCH ENDED';
  ink=match.winner==='gold'?gold:match.winner==='violet'?purple:ink;
 }else if(match?.snitch?.holderId!=null)banner='RETURN THE SNITCH';
 if(banner){
  b(c,x+8,y+39,w-16,14,'#172528ec');b(c,x+10,y+52,w-20,1,'#897356');
  leagueText(c,banner,split,y+42,ink);
 }
}
