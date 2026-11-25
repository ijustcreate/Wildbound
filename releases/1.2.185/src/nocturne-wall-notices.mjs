import siriusSpec from '../assets/pixel-recipes/nocturne-sirius-black.pixel.json' with {type:'json'};
import {compilePixelRecipe} from './pixel-recipe.mjs';
import {drawPixelRecipe} from './pixel-recipe-canvas.mjs';
import {block as b,shape as p,line as l} from './diagon-shop-brush.mjs';
import {NOCTURNE_CONNECTOR_WALL as wall} from './diagon-wayfinding.mjs';

const sirius=compilePixelRecipe(siriusSpec);
const sepia='#5a473b', ink='#453039', brass='#bd9a61', cream='#dac8a0';
const alphabet={
 A:[2,5,7,5,5],B:[6,5,6,5,6],C:[3,4,4,4,3],D:[6,5,5,5,6],E:[7,4,6,4,7],F:[7,4,6,4,4],
 G:[3,4,5,5,3],H:[5,5,7,5,5],I:[7,2,2,2,7],J:[1,1,1,5,2],K:[5,5,6,5,5],L:[4,4,4,4,7],
 M:[5,7,7,5,5],N:[5,7,7,7,5],O:[2,5,5,5,2],P:[6,5,6,4,4],Q:[2,5,5,7,3],R:[6,5,6,5,5],
 S:[3,4,2,1,6],T:[7,2,2,2,2],U:[5,5,5,5,7],V:[5,5,5,5,2],W:[5,5,7,7,5],X:[5,5,2,5,5],
 Y:[5,5,2,2,2],Z:[7,1,2,4,7],
};

function title(c,label,x,y,color=sepia){
 const start=x-Math.floor((4*label.length-1)/2);
 for(let i=0;i<label.length;i++){
  const glyph=alphabet[label[i]];
  if(!glyph)continue;
  for(let yBit=0;yBit<5;yBit++)for(let xBit=0;xBit<3;xBit++){
   if(glyph[yBit]&(4>>xBit))b(c,start+4*i+xBit,y+yBit,1,1,color);
  }
 }
}

function paper(c,x,y,w,h,tones,torn=0){
 const [edge,body,high]=tones;
 const points=[[x+1,y],[x+w-3,y],[x+w-1,y+2],[x+w-1,y+h-3],[x+w-3,y+h-1],
  [x+Math.floor(w/2),y+h-1-torn],[x+2,y+h-1],[x,y+h-4],[x,y+2]];
 p(c,'#2e2d30a0',points.map(([px,py])=>[px+1,py+2]));
 p(c,edge,points);
 b(c,x+1,y+2,w-3,h-5,body);b(c,x+2,y+1,w-5,1,high);
 b(c,x+1,y+2,1,h-7,high);
 if(torn)b(c,x+2,y+h-4,torn+2,1,high);
 b(c,x+Math.floor(w/2),y,1,2,'#6c6155');
}
const parchment=['#91714f','#cab38c','#ead3a4'];
const sand=['#887556','#b9a786','#dbc49c'];
const gray=['#586568','#9ca8a0','#c2c5af'];
const mauve=['#745967','#ab8c9c','#c7a9b2'];
const green=['#55644f','#93a287','#c2c7a2'];
const blue=['#536879','#8da1ab','#b1c2c6'];

function typeLines(c,x,y,width,count,color='#75685b'){
 for(let row=0;row<count;row++){
  const w=width-(row*3+width)%5;
  b(c,x,y+row*2,w,1,color);
  if(w>9)b(c,x+4+(2*row)%3,y+row*2,1,1,'#b3927460');
 }
}
function wax(c,x,y){
 p(c,'#6b393d',[[x-3,y-1],[x-1,y-3],[x+2,y-3],[x+3,y-1],[x+3,y+2],[x,y+3],[x-3,y+2]]);
 b(c,x-2,y-1,4,2,'#a55954');b(c,x-1,y-2,2,1,'#be7967');b(c,x,y,1,1,'#783b44');
}

function wanted(c){
 paper(c,0,0,53,28,parchment,1);
 title(c,'WANTED',26,2,'#7b3e3e');
 b(c,3,9,46,1,'#9b805f');b(c,19,8,16,13,'#866f60');
 typeLines(c,4,12,12,4,'#8a7461');typeLines(c,36,12,11,4,'#8a7461');
 title(c,'SIRIUS BLACK',26,22,'#47383a');
 b(c,3,8,1,1,brass);b(c,48,8,1,1,brass);
}
function lostOwl(c){
 paper(c,2,3,17,18,blue);
 paper(c,10,0,24,22,parchment,2);
 title(c,'OWL',21,2);
 p(c,'#684e42',[[17,17],[16,9],[19,11],[22,9],[26,11],[26,17],[23,19],[19,19]]);
 b(c,17,12,8,3,'#9a7958');b(c,18,13,2,2,cream);b(c,23,13,2,2,cream);b(c,21,14,2,2,'#d2a75a');
 for(const x of [13,18,23,28])b(c,x,21,3,3,'#b49469');
 l(c,'#d9dbca',4,15,9,7);l(c,'#738781',4,13,8,9);
}
function closedAlley(c){
 p(c,'#392f33',[[0,2],[2,0],[24,0],[26,2],[26,16],[24,18],[1,18],[0,16]]);
 b(c,1,2,24,14,'#724c48');b(c,2,2,22,1,'#9e6b58');b(c,2,15,22,1,'#4b3b43');
 title(c,'KEEP',13,4,cream);title(c,'OUT',13,10,'#c8a686');
 b(c,2,8,1,2,brass);b(c,23,8,1,2,brass);
}
function potionNotes(c){
 paper(c,0,5,15,17,green,1);typeLines(c,2,8,11,5);
 paper(c,27,4,16,19,mauve,1);typeLines(c,32,7,9,5);
 paper(c,13,0,21,21,parchment);
 p(c,'#45535a',[[21,8],[25,8],[25,12],[28,15],[28,18],[26,19],[20,19],[18,17],[18,14],[21,11]]);
 b(c,21,5,4,3,'#795946');b(c,20,15,7,2,'#92a56c');b(c,20,14,1,2,'#bac49a');
 l(c,'#79536b',34,18,40,10);b(c,35,14,5,2,'#dfabb7');
}
function duelBill(c){
 paper(c,0,0,35,24,mauve,1);
 title(c,'DUEL',17,2,ink);
 p(c,'#564657',[[2,9],[32,9],[32,20],[30,22],[4,22],[2,20]]);
 for(const [x,direction] of [[8,1],[26,-1]]){
  b(c,x-1,11,3,3,cream);b(c,x-2,14,4,6,'#be9798');
  l(c,cream,x,15,x+4*direction,13);l(c,'#e3c389',x+4*direction,13,x+7*direction,12);
 }
 b(c,16,11,3,1,'#f2ddb5');b(c,17,10,1,3,'#f2ddb5');
}
function spellSnippets(c){
 paper(c,0,6,15,14,gray,2);l(c,'#4c5961',2,16,9,10);b(c,8,11,3,3,'#776d86');
 paper(c,34,4,15,20,blue,2);typeLines(c,37,8,10,5,'#516772');
 paper(c,11,0,26,21,parchment,1);
 title(c,'HEX',24,2,ink);
 l(c,'#775167',17,16,27,8,2);b(c,25,9,4,1,'#b8798b');b(c,27,8,1,4,'#b8798b');
 typeLines(c,14,17,19,2);
 b(c,5,8,4,1,'#bbac76');b(c,38,19,4,1,'#c3a46f');
}
function courier(c){
 paper(c,2,1,33,17,sand,1);
 title(c,'POST',18,3);typeLines(c,5,11,12,3);
 p(c,'#e1cda2',[[20,10],[34,10],[34,20],[20,20]]);
 l(c,'#9b7959',21,11,27,15);l(c,'#9b7959',27,15,33,11);wax(c,27,15);
}
function flooMap(c){
 paper(c,0,0,38,23,green,1);
 title(c,'FLOO',19,2,'#455648');
 l(c,'#465d50',4,18,13,12,2);l(c,'#465d50',13,12,19,16,2);l(c,'#465d50',19,16,31,11,2);
 for(const [x,y] of [[4,18],[13,12],[19,16],[31,11]]){b(c,x-1,y-1,3,3,'#5e7952');b(c,x,y,1,1,'#d9d4a4');}
 b(c,27,18,7,1,'#677660');b(c,27,20,4,1,'#677660');
}
function oddities(c){
 paper(c,0,0,31,18,sand,2);title(c,'ODD',15,2);
 b(c,2,9,26,6,'#846a66');
 for(const x of [6,14,22]){b(c,x,9,3,5,'#aa8a79');b(c,x+1,9,1,3,'#d0b193');}
}
function cauldronTag(c){
 p(c,'#383943',[[1,5],[5,0],[17,0],[21,5],[20,18],[1,18]]);
 b(c,3,5,16,11,'#546262');b(c,4,5,14,1,'#7a8b7e');
 p(c,'#272c32',[[5,9],[17,9],[16,14],[14,16],[8,16],[6,14]]);
 b(c,5,9,12,1,'#b0ac7a');b(c,7,8,8,1,'#879465');b(c,10,3,2,1,brass);
}
function cemeteryNotice(c){
 paper(c,1,0,43,24,gray,2);
 title(c,'GRAVES',22,2,'#444c50');
 p(c,'#586062',[[4,20],[4,12],[9,8],[14,12],[14,20]]);
 b(c,7,13,4,1,'#c8c5ad');b(c,8,12,2,5,'#c8c5ad');
 typeLines(c,16,10,24,5,'#656c68');wax(c,36,18);
}
function rooms(c){
 paper(c,2,4,29,16,blue);typeLines(c,5,8,20,5);
 paper(c,28,6,17,16,green);typeLines(c,36,10,6,5);
 paper(c,10,0,29,20,parchment,1);
 title(c,'ROOMS',24,2);
 b(c,14,10,2,7,'#91754a');b(c,13,10,4,2,'#bc9d62');b(c,15,15,3,1,'#91754a');
 typeLines(c,21,10,15,4);
}
function relicAdvert(c){
 paper(c,0,0,43,25,['#5a4c55','#776472','#9d8088'],2);
 title(c,'RELICS',21,2,'#dad1b4');
 p(c,'#4b424f',[[5,9],[37,9],[37,20],[5,20]]);
 p(c,'#bc9871',[[17,14],[21,10],[25,14],[21,19]]);b(c,21,12,1,4,'#edc590');
 b(c,6,13,7,1,'#9c8076');b(c,28,13,7,1,'#9c8076');
 b(c,8,16,5,1,'#9c8076');b(c,28,16,5,1,'#9c8076');
}

export const NOCTURNE_WALL_NOTICES=[
 ['owl-search',12,27,34,25,lostOwl],['keep-out',49,23,26,19,closedAlley],
 ['potion-requests',100,26,44,25,potionNotes],['duel-bill',169,27,35,25,duelBill],
 ['spell-snippets',234,26,49,25,spellSnippets],['owl-post',319,26,36,22,courier],
 ['oddities-quote',376,24,31,20,oddities],['cauldron-plaque',421,22,22,20,cauldronTag],
 ['floo-map',468,25,38,24,flooMap],['sirius-black-wanted',529,29,53,29,wanted],
 ['cemetery-notice',613,27,45,25,cemeteryNotice],['room-lets',681,25,46,24,rooms],
 ['relic-advert',759,28,43,26,relicAdvert],
].map(([id,offset,lift,w,h,paint])=>({id,x:wall.start+offset,y:wall.baseY-lift,w,h,paint}));

const rasters=new WeakMap();
function drawNotice(c,notice,elapsedMs){
 let sprite=rasters.get(notice);
 if(!sprite){
  sprite=document.createElement('canvas');
  sprite.width=notice.w+3;sprite.height=notice.h+3;
  notice.paint(sprite.getContext('2d'));
  rasters.set(notice,sprite);
 }
 c.drawImage(sprite,notice.x,notice.y);
 if(notice.paint===wanted)drawPixelRecipe(c,sirius,elapsedMs,notice.x+20,notice.y+8);
}

export function queueNocturneWallNotices(c,visible,objects,elapsedMs=0){
 for(const notice of NOCTURNE_WALL_NOTICES){
  if(visible(notice.x+notice.w/2,notice.y+notice.h/2,notice.w/2+3,notice.h/2+3)){
   objects.push({depth:wall.baseY+.04,paint:()=>drawNotice(c,notice,elapsedMs)});
  }
 }
}
