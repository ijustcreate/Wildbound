import {drawNativeFrog} from './frog-art.mjs';
import {drawForestTree} from './forest.mjs';
const r=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};

const clay = {
 O: '#412e27', D: '#302821', I: '#704630', S: '#8b4b35',
 B: '#b46947', H: '#ce8956', L: '#e5ac74',
};
function claySpans(rows, top) {
 return rows.flatMap((row, y) => {
  const left = -Math.floor(row.length / 2);
  return [...row.matchAll(/(.)\1*/g)]
   .filter(([cluster]) => cluster[0] !== '.')
   .map(match => {
    const [cluster] = match;
    return [left + match.index, top + y, cluster.length, clay[cluster[0]]];
   });
 });
}

// Near rim below the dark opening, a rounded shoulder and a narrow clay foot.
const intactPot = claySpans([
 'OOOOOOOOOOO',
 'OOHHHHHHHHHHHOO',
 'OHHLLLHHHHHHBBBBBO',
 'OHHLIIIIIIIIIIHHBBBO',
 'OHLIDDDDDDDDDDDIHBBBO',
 'OHIDDDDDDDDDDDDDIHBBO',
 'OHBIDDDDDDDDDDIIHBBBO',
 'OOHBBIIIIIIIIHHBBSSOO',
 'OOHHHHHHHHHHHBBSSOO',
 'OOHHBBBBBBBSSSOO',
 'OOHHHBBBBBBBSSSOO',
 'OOHHHHBBBBBBBBSSSOO',
 'OOHHHHHBBBBBBBBSSSOO',
 'OOHHHHHBBBBBBBBBSSSSOO',
 'OOHHHHHBBBBBBBBBBSSSSOO',
 'OOHHHHHBBBBBBBBBBBSSSSOO',
 'OOHHHHBBBBBBBBBBBBSSSSOO',
 'OOHHHBBBBBBBBBBBBBSSSSOO',
 'OOHHBBBBBBBBBBBBBBSSSSOO',
 'OOHBBBBBBBBBBBBBBSSSSOO',
 'OOHBBBBBBBBBBBBSSSSSOO',
 'OOHBBBBBBBBBBSSSSOO',
 'OOHBBBBBBBBSSSOO',
 'OOHHBBBBBBSSOO',
 'OOBBBBBBBSSOO',
 'OOOOOOOOOOO',
], -25);

// Curved rim fragment, pale fresh edge and two darker pieces of the body.
const smashedPot = claySpans([
 '............OO.............',
 '...........OHO.............',
 '..........OHLBO............',
 '.........OHLBBO............',
 '.........OLBBO.......OO....',
 '...OO....OHBO.......OHO....',
 '..OHBO....OSO......OLBO....',
 '.OHBLBO....OO.....OLBSSO...',
 '.OSHBSSOO........OBBSSSOO..',
 '..OSSSSSSO.......OSSSSOO...',
 '...OOOOOO.........OOOO.....',
], -9);

function apple(c,x,y){
 r(c,x-1,y-5,3,1,'#59362a');r(c,x-3,y-4,6,2,'#71392f');r(c,x-4,y-2,8,4,'#71392f');r(c,x-3,y+2,6,1,'#59362a');
 r(c,x-2,y-4,5,2,'#c24b38');r(c,x-3,y-2,6,3,'#c24b38');r(c,x-2,y+1,4,1,'#a93e34');r(c,x-1,y-3,2,1,'#f0a06a');
 r(c,x,y-7,1,3,'#60452d');r(c,x+1,y-7,3,2,'#66834a');r(c,x+2,y-7,2,1,'#93a45c');
}
function shadow(c,x,y,w){c.fillStyle='#172a2340';c.beginPath();c.ellipse(Math.round(x),Math.round(y+3),w,3,0,0,Math.PI*2);c.fill();}
function tree(c,o,t,g){
 const size=78,s=size/64,seed=Math.abs(Math.floor(o.x*17+o.y*31))%100000;
 drawForestTree(c,{kind:'tree',treeType:'oak',leafHabit:'deciduous',x:0,y:0,rootY:0,size,seed},t,g);
 const fruit=[[-23,-43],[-8,-52],[10,-45],[27,-51],[3,-36]];
 for(let i=0;i<Math.min(o.fruit||0,fruit.length);i++){const [x,y]=fruit[i];apple(c,Math.round(x*s),Math.round(y*s));}
}
export function playgroundActors(g){
 if(g.trainTest||g.interiorWorld)return [];
 const s=g.playground;if(!s)return [];
 return [...s.props.map(o=>({...o,isPlayground:true,drawDepth:o.kind==='apple_tree'?o.y+5:o.kind==='step'||o.kind==='log'?o.y+10:o.y})),...s.apples.map(o=>({...o,kind:'loose_apple',isPlayground:true,drawDepth:o.heldBy?o.y+16:o.y})),...s.frogs.map(o=>({...o,kind:'play_frog',isPlayground:true,drawDepth:o.y})),...s.coins.map(o=>({...o,kind:'play_coin',isPlayground:true,drawDepth:o.y}))];
}
export function drawPlayground(c,o,g){
 c.save();c.translate(Math.round(o.x),Math.round(o.y));
 if(o.kind==='apple_tree'){if((g.players||[]).some(p=>!p.room&&p.hp>0&&Math.abs(p.x-o.x)<34&&p.y<o.y&&p.y>o.y-75))c.globalAlpha*=.4;tree(c,o,g.time||0,g);c.globalAlpha=1;}
 if(o.kind==='pot'){
  shadow(c, 1, -2, o.broken ? 12 : 11);
  const clayArt = o.broken ? smashedPot : intactPot;
  for (const [x, y, width, color] of clayArt) r(c, x, y, width, 1, color);
 }
 if(o.kind==='ball'){
  shadow(c,0,0,8);const y=-Math.round(o.z||0)-8;
  r(c,-5,y-7,10,14,'#3d4136');r(c,-7,y-5,14,10,'#3d4136');r(c,-5,y-5,10,10,'#d9d0ae');r(c,-3,y-6,6,2,'#f0e2bd');
  const phase=Math.floor(o.roll||0)%3;r(c,-3+phase*2,y-3,4,5,'#567461');r(c,phase-5,y+3,3,2,'#8c6e4b');
  if(['water','shallow'].includes(o.water))r(c,-11,2,22,1,'#94c7c2');
 }
 if(o.kind==='step'){
  const h=o.height||10;shadow(c,0,0,17);
  if(o.style==='rock'){r(c,-9,-h-9,18,5,'#555e51');r(c,-13,-h-5,26,h+12,'#555e51');r(c,-15,-h+1,30,h+7,'#555e51');r(c,-8,-h-8,16,4,'#92977b');r(c,-12,-h-4,24,8,'#92977b');r(c,-8,-h-5,13,3,'#b8b69a');r(c,-8,-h+4,20,3,'#747f66');}
  else{r(c,-13,-h-1,26,h+9,'#503d2f');r(c,-10,-h+3,20,h+6,'#825934');r(c,-9,-h-10,18,20,'#503d2f');r(c,-13,-h-7,26,14,'#503d2f');r(c,-15,-h-3,30,7,'#503d2f');r(c,-8,-h-8,16,16,'#c09a61');r(c,-12,-h-5,24,10,'#c09a61');r(c,-7,-h-6,13,3,'#e0bd80');r(c,-7,-h-2,15,6,'#94713f');r(c,-4,-h-1,9,3,'#d1aa70');r(c,7,-h+7,3,h,'#503d2f');}
 }
 if(o.kind==='log'){
  r(c,-35,7,70,1,'#9ac7b166');r(c,-32,-4,64,12,'#443e2d');r(c,-30,-7,60,12,'#805d38');r(c,-25,-6,48,4,'#ad8551');r(c,-19,1,39,2,'#513f2c');r(c,-32,-4,7,10,'#c39a62');r(c,-30,-1,3,5,'#8b643d');r(c,27,-4,6,10,'#b38d57');r(c,10,-7,9,3,'#608049');
 }
 if(o.kind==='bell'){
  shadow(c,0,0,12);r(c,-12,-31,4,33,'#554230');r(c,8,-31,4,33,'#554230');r(c,-12,-32,24,4,'#9a7447');
  const x=Math.round(Math.sin((g.time||0)*24)*(o.cooldown||0)*3);r(c,x-4,-26,8,9,'#826032');r(c,x-6,-20,12,5,o.rung?'#c8a45a':'#e2bc64');r(c,x-1,-15,2,3,'#513a2a');
 }
 if(o.kind==='loose_apple'){if(!o.heldBy)shadow(c,0,0,4);apple(c,0,-Math.round(o.z||0));}
 if(o.kind==='play_frog')drawNativeFrog(c,{...o,x:0,y:0});
 if(o.kind==='play_coin'){r(c,-2,-6,5,6,'#986d33');r(c,-1,-7,3,6,'#e8c86d');r(c,-1,-6,1,3,'#fff0a7');}
 if(['apple_tree','pot','bell','log','ball','loose_apple'].includes(o.kind)&&!o.broken&&!o.heldBy){
  const p=(g.players||[]).find(p=>p.hp>0&&!p.room&&!p.ui&&Math.hypot(p.x-o.x,p.y-o.y)<48);
  if(p){const text={apple_tree:'Interact: shake',pot:'Attack: smash',bell:'Interact: ring',log:'Jump aboard · move to steer',ball:'Walk into it · attack to launch',loose_apple:'Interact: catch'}[o.kind];c.font='7px sans-serif';c.textAlign='center';c.fillStyle='#172a23df';const width=c.measureText(text).width;c.fillRect(-width/2-4,12,width+8,12);c.fillStyle='#f0e2bd';c.fillText(text,0,21);}
 }
 c.restore();
}
