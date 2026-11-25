import {block as b,shape as p,line as l} from './diagon-shop-brush.mjs';
import {drawCampfire} from './campfire-art.mjs';
import {merlockCampGround} from './wild-merlock-camps.mjs';
import {effectiveMerlockCamps} from './live-edit-spawns.mjs';

const palettes=[
 ['#384443','#58695a','#7f8d6e','#a0a481'],
 ['#423d3d','#6e5447','#916c52','#b5936c'],
 ['#293f45','#496567','#6b8580','#9aaca0']
];
const checked=new WeakMap();

export function visibleMerlockCamps(g,visible){
 const t=g.trainTest,d=t?.design;
 if(!d?.wildLands||d.activeRoom||t.wildLandsOverview)return [];
 const source=effectiveMerlockCamps(g),previous=checked.get(d);
 const camps=previous?.source===source?previous.camps:source.filter(camp=>merlockCampGround(d,camp));
 if(previous?.source!==source)checked.set(d,{source,camps});
 return camps.filter(camp=>visible(camp,112));
}

function mat(c,x,y,tone){
 p(c,'#4a463382',[[x-15,y-6],[x-5,y-10],[x+16,y-5],[x+15,y+4],[x-10,y+8],[x-17,y+4]]);
 p(c,tone[1],[[x-14,y-5],[x-5,y-9],[x+14,y-4],[x+14,y+3],[x-10,y+6],[x-15,y+3]]);
 for(let row=0;row<4;row++)l(c,row%2?tone[2]:tone[0],x-12+row,y-4+row*2,x+12,y-2+row);
 for(const dx of [-12,-6,0,6])b(c,x+dx,y+5-Math.abs(dx)*.09,2,2,'#b4a784');
}

export function drawMerlockCampGround(c,camp){
 const {x,y,variant,seed}=camp,tone=palettes[variant];
 p(c,'#74634136',[[x-73,y+14],[x-55,y-42],[x-26,y-58],[x+21,y-59],[x+67,y-34],
  [x+77,y+14],[x+45,y+55],[x+10,y+70],[x-38,y+62],[x-64,y+33]]);
 for(let i=0;i<17;i++){
  const angle=(i+seed)*2.4,rx=35+(i*23)%45,ry=20+(i*17)%43;
  const px=x+Math.cos(angle)*rx,py=y+Math.sin(angle)*ry;
  b(c,px,py,i%3===0?4:2,1,i%4===0?'#d6bf88':'#826f4c88');
 }
 mat(c,x-33,y+22,tone);mat(c,x+36,y+19,palettes[(variant+1)%3]);
}

export function merlockCampSubjects(camps){
 return camps.flatMap(camp=>[
  {merlockCamp:camp,fixture:'lean-to',depth:camp.y-35},
  {merlockCamp:camp,fixture:'hearth',depth:camp.y+4},
  {merlockCamp:camp,fixture:'fish-line',depth:camp.y+49}
 ]);
}

export function drawMerlockCampFixture(c,{merlockCamp:camp,fixture},time){
 const {x,y,seed,variant}=camp,tone=palettes[variant];
 if(fixture==='hearth'){
  c.save();c.translate(x,y);c.scale(.49,.49);drawCampfire(c,0,0,time,seed);c.restore();return;
 }
 if(fixture==='fish-line'){
  const left=x+(variant===1?-38:32),ground=y+49;
  p(c,'#51493966',[[left-19,ground],[left+19,ground-1],[left+23,ground+4],[left-14,ground+5]]);
  for(const px of [left-17,left+17]){
   b(c,px-1,ground-24,4,25,'#553d36');b(c,px,ground-21,1,20,'#a88155');
  }
  l(c,'#a58b62',left-17,ground-20,left+17,ground-19);
  for(const dx of [-10,0,10]){
   b(c,left+dx,ground-20,1,5,'#776a58');
   p(c,'#516b6b',[[left+dx-1,ground-16],[left+dx+3,ground-13],[left+dx+2,ground-8],
    [left+dx-2,ground-9],[left+dx-3,ground-13]]);
   b(c,left+dx-1,ground-14,2,3,'#a3b1a0');b(c,left+dx,ground-9,2,2,'#6c8679');
  }
  return;
 }
 const left=x+(variant===1?18:-15),ground=y-38;
 p(c,'#4a483677',[[left-26,ground-2],[left+10,ground-3],[left+28,ground+4],[left+16,ground+8],
  [left-21,ground+5]]);
 p(c,tone[0],[[left-23,ground],[left-10,ground-23],[left+13,ground-25],[left+23,ground-1]]);
 p(c,tone[1],[[left-20,ground-3],[left-9,ground-23],[left+13,ground-25],[left+20,ground-5],
  [left+12,ground-7],[left+4,ground-5],[left-7,ground-7]]);
 p(c,tone[2],[[left-19,ground-4],[left-8,ground-21],[left+12,ground-24],[left+14,ground-20],
  [left+2,ground-17],[left-7,ground-18]]);
 l(c,tone[3],left-9,ground-23,left+13,ground-25);
 l(c,'#4e3e35',left+13,ground-24,left+20,ground+2,2);
 l(c,'#a98d62',left-9,ground-22,left-23,ground+2,2);
 b(c,left-24,ground+2,5,2,'#6e5540');b(c,left+18,ground+2,5,2,'#6e5540');
}
