import {paintLayers} from './render-order.mjs';
import {facingIndex} from './player-motion.mjs';
import {pixelPolygon} from './pixel-shapes.mjs';
const C={ink:'#101f20',deep:'#1b3030',stone:'#314747',shade:'#253a3b',lit:'#52645b',moss:'#537634',grass:'#83a942',tip:'#c1ce6b',gold:'#c18c42',cream:'#f7df9a',wood:'#705037'};
const rect=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
export function ruinTile(c,x,y){
  rect(c,C.ink,x,y,32,28);rect(c,C.stone,x+1,y+4,30,22);
  rect(c,C.lit,x+2,y+5,13,2);rect(c,C.shade,x+2,y+13,28,2);rect(c,C.ink,x+15,y+4,2,10);rect(c,C.ink,x+7,y+15,2,11);rect(c,C.ink,x+24,y+15,2,11);
  rect(c,C.lit,x+10,y+16,12,2);rect(c,C.shade,x+2,y+23,27,3);
  rect(c,C.moss,x,y,32,6);rect(c,C.grass,x+1,y,30,3);rect(c,C.tip,x+2,y,12,1);
  rect(c,C.moss,x+4,y+5,4,5);rect(c,C.moss,x+22,y+5,3,8);rect(c,C.grass,x+22,y+4,2,4);
}
export function fern(c,x,y,scale=1){
 c.save();c.translate(x,y);c.scale(scale,scale);
 for(const [dx,dy]of[[-17,-13],[-11,-21],[0,-27],[10,-20],[17,-12]]){
  c.fillStyle=C.ink;c.beginPath();c.moveTo(-3,0);c.lineTo(dx-3,dy);c.lineTo(dx+3,dy-3);c.lineTo(4,0);c.fill();
  rect(c,C.moss,dx,dy,4,5);for(let j=1;j<4;j++){const a=j/4;rect(c,j%2?C.grass:C.moss,dx*a-5,dy*a,10,3);}
 }c.restore();
}
export function torch(c,x,y,time){
 rect(c,C.ink,x-5,y,10,22);rect(c,C.wood,x-2,y,4,20);rect(c,C.gold,x-6,y+2,12,3);
 const f=Math.floor(time*8)%3;rect(c,'#965631',x-5,y-12,10,14);rect(c,'#e79b36',x-4,y-12-f,8,12+f);rect(c,'#ffd46d',x-2,y-17+f,4,16-f);rect(c,'#fff3b0',x-1,y-8,3,8);
 c.save();c.globalAlpha=.06;c.fillStyle='#ffdb7c';c.beginPath();c.arc(x,y-6,35+f,0,Math.PI*2);c.fill();c.restore();
}
function tubePixels(c){
 rect(c,C.ink,-25,-48,50,48);rect(c,'#245b43',-21,-43,42,42);rect(c,'#3e8050',-18,-42,31,40);rect(c,'#6da45b',-15,-40,6,36);rect(c,'#183d33',13,-41,7,40);
 rect(c,C.ink,-28,-51,56,12);rect(c,C.gold,-26,-49,52,8);rect(c,'#f1cd72',-24,-49,38,2);rect(c,'#73512f',-26,-42,52,2);rect(c,'#17322b',-20,-49,40,3);
 rect(c,C.ink,-8,-33,16,20);rect(c,C.gold,-6,-31,12,16);rect(c,'#163e31',-4,-29,8,12);
 rect(c,C.moss,-25,-3,12,3);rect(c,C.grass,-24,-5,5,3);rect(c,C.moss,16,-4,12,4);
}
function boardPixels(c){
 for(const x of[-70,58]){rect(c,C.ink,x,-47,15,47);rect(c,C.stone,x+2,-44,11,42);rect(c,C.lit,x+2,-42,8,3);rect(c,C.moss,x,-4,17,4);}
 rect(c,C.ink,-96,-89,192,48);rect(c,'#a6743c',-93,-86,186,42);rect(c,'#d7b66f',-91,-85,182,3);rect(c,'#59432b',-88,-80,176,31);rect(c,'#38583b',-84,-78,168,27);
 // Readable cream winding path, with amber spaces and a die in its center.
 for(let i=0;i<24;i++){const x=-77+i*6,y=-66+Math.round(Math.sin(i*.56)*8);rect(c,i%4===0?C.gold:C.cream,x,y,5,5);}
 rect(c,'#af793b',-13,-80,26,27);rect(c,C.cream,-10,-78,20,20);for(const [x,y]of[[-6,-74],[4,-74],[-1,-69],[-6,-64],[4,-64]])rect(c,'#54432c',x,y,3,3);
 for(const x of[-91,83]){rect(c,'#bc8f4d',x,-84,7,37);rect(c,'#efd28a',x+1,-83,3,3);}
 fern(c,-78,-41,.5);fern(c,75,-42,.4);
}
// Props are registered in the same Rig Studio pixel editor as creatures.
function makeProp(type,name,paint){
 const data={version:1,type,name,palette:{...C},shape:{},joints:{root:{parent:'',position:[0,0,0]}},visibility:{root:Array(8).fill(true)},clips:{idle:{length:2,fps:1,loop:true,keys:[{frame:0,joints:{root:[0,0,0]}},{frame:1,joints:{root:[0,0,0]}}]}}};
 const draw=(c,a,t,m=data)=>{const d=a.direction??facingIndex(a.faceX??0,a.faceY??1),p={root:{x:0,y:0,depth:0}};paintLayers([{id:name,bone:'root',bones:['root'],depth:0,fn:()=>paint(c)}],m,d,c,p);return p;};
 const baseline=structuredClone(data);
 return {name,data,defaults:()=>structuredClone(baseline),replace:m=>{if(m?.type!==type||!m.joints?.root||!m.clips?.idle)throw Error('Invalid arena prop');const copy=structuredClone(m);for(const k of Object.keys(data))delete data[k];Object.assign(data,copy);},draw,sprite:type,selected:'root',palette:Object.keys(C),tracks:['root'],clip:'idle',scale:4};
}
export const ARENA_PROP_SUBJECTS={tv_ruin_tile:makeProp('tv_ruin_tile','Arena / mossy masonry',c=>ruinTile(c,-16,-28)),tv_travel_tube:makeProp('tv_travel_tube','Arena / linked travel tube',tubePixels),tv_board_altar:makeProp('tv_board_altar','Arena / central board altar',boardPixels),tv_fern:makeProp('tv_fern','Arena / fern',c=>fern(c,0,0)),tv_torch:makeProp('tv_torch','Arena / torch',c=>torch(c,0,-16,0))};
const propCache=new Map();
const propBounds={tv_ruin_tile:[-16,-28,32,28],tv_travel_tube:[-28,-51,56,51],tv_board_altar:[-96,-89,192,89],tv_fern:[-24,-30,48,30],tv_torch:[-12,-36,24,38]};
function prop(c,kind,x,y){
 const subject=ARENA_PROP_SUBJECTS[kind],model=subject.data;let entry=propCache.get(kind);
 if(!entry||entry.pixels!==model.boneSprites||entry.palette!==model.palette){
  let [ox,oy,w,h]=propBounds[kind];
  for(const views of Object.values(model.boneSprites||{})){const sp=views[0];if(!sp)continue;const right=Math.max(ox+w,sp.x+sp.width),bottom=Math.max(oy+h,sp.y+sp.height);ox=Math.min(ox,sp.x);oy=Math.min(oy,sp.y);w=right-ox;h=bottom-oy;}
  const surface=document.createElement('canvas');surface.width=w;surface.height=h;const cc=surface.getContext('2d');cc.translate(-ox,-oy);subject.draw(cc,{},0);
  entry={pixels:model.boneSprites,palette:model.palette,surface,ox,oy};propCache.set(kind,entry);
 }
 c.imageSmoothingEnabled=false;c.drawImage(entry.surface,Math.round(x)+entry.ox,Math.round(y)+entry.oy);
}
function editedFern(c,x,y,scale){c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);prop(c,'tv_fern',0,0);c.restore();}
function editedTorch(c,x,y,time){
 prop(c,'tv_torch',x,y+16);const f=Math.floor(time*8)%3;rect(c,'#ffd46d',x-1,y-17+f,3,4);
 c.save();c.globalAlpha=.04;c.fillStyle='#ffdb7c';c.beginPath();c.arc(x,y-6,34+f,0,Math.PI*2);c.fill();c.restore();
}
export function drawArenaBoard(c,x,progress,time){
 prop(c,'tv_board_altar',x,437);c.textAlign='center';c.fillStyle=C.cream;c.font='bold 11px Georgia';c.fillText(progress>=48?'INTERACT · CALL WILDBOUND':'STRIKE THE LIVING BOARD',x,486);
 c.fillStyle=C.ink;c.fillRect(x-87,443,174,9);c.fillStyle=C.gold;c.fillRect(x-85,445,170*Math.min(1,progress/48),5);
}
export function drawArenaArchitecture(c,mode,left,right){
 // Dark boundary towers and a moss-lined vault frame the bounded play space.
 for(const x of[0,2852])for(let y=57;y<465;y+=28)prop(c,'tv_ruin_tile',x+16,y+28);
 for(const [start,end]of[[0,600],[2280,2880]])for(let x=Math.max(start,Math.floor(left/32)*32);x<Math.min(end,right+32);x+=32){prop(c,'tv_ruin_tile',x+16,84);if(x%96===0){rect(c,C.moss,x+19,84,3,27);for(let j=0;j<4;j++)rect(c,C.grass,x+17+(j%2)*3,86+j*6,5,3);}}
 for(let x=Math.max(0,Math.floor(left/32)*32);x<Math.min(2880,right+32);x+=32){
  prop(c,'tv_ruin_tile',x+16,465);for(let y=465;y<510;y+=24){rect(c,C.deep,x,y,32,24);rect(c,C.shade,x+1,y+1,29,2);rect(c,C.ink,x+(y%48?16:3),y,2,24);}
 }
 for(const s of mode.platforms)if(s.x+s.w>left-30&&s.x<right+30){
  c.save();c.beginPath();c.rect(s.x,s.y,s.w,s.h);c.clip();
  if(s.style==='bridge'){rect(c,C.ink,s.x,s.y,s.w,24);for(let x=s.x;x<s.x+s.w;x+=12){rect(c,C.wood,x+1,s.y+1,10,13);rect(c,C.gold,x+1,s.y+1,9,2);}rect(c,'#382c26',s.x,s.y+15,s.w,5);}
  else for(let x=s.x;x<s.x+s.w;x+=32)prop(c,'tv_ruin_tile',x+16,s.y+28);
  c.restore();
  if(s.w>180){for(const x of[s.x+12,s.x+s.w-24]){rect(c,C.ink,x,s.y+28,12,22);rect(c,C.shade,x+2,s.y+28,8,21);}editedFern(c,s.x+25,s.y,.45);}
  if(s.style!=='bridge'&&s.x%3===0){c.fillStyle=C.moss;for(let i=0;i<7;i++)c.fillRect(s.x+18+(i%2)*3,s.y+28+i*4,2,5);}
 }
 for(const t of mode.tubes)if(t.x>left-60&&t.x<right+60){
  prop(c,'tv_travel_tube',t.x,t.y+48);c.fillStyle=C.cream;c.textAlign='center';c.font='bold 10px monospace';c.fillText(t.rune,t.x,t.y+27);
  if([...mode.players.values()].some(p=>Math.abs(p.x-t.x)<62&&Math.min(Math.abs(p.y-t.y),Math.abs(p.y-t.y-48))<18)){c.fillStyle='#112c27ed';c.fillRect(t.x-65,t.y-22,130,15);c.fillStyle=C.cream;c.font='9px monospace';c.fillText('INTERACT · TUBE '+t.rune,t.x,t.y-11);}
 }
 for(const s of mode.enemySpawns)if(s.x>left-70&&s.x<right+70){
  rect(c,C.ink,s.x-27,s.y-65,54,65);rect(c,C.stone,s.x-24,s.y-61,48,61);rect(c,'#101d24',s.x-17,s.y-49,34,49);rect(c,C.shade,s.x-21,s.y-58,42,8);rect(c,'#896c4e',s.x-18,s.y-3,36,3);
  if(mode.waveQueue.some(q=>q.spawnId===s.id)){c.save();c.globalAlpha=.5+Math.sin(mode.time*8)*.25;rect(c,'#c8a45d',s.x-16,s.y-47,32,46);c.restore();}
 }
 for(const s of mode.playerSpawns)if(s.x>left-50&&s.x<right+50){rect(c,C.ink,s.x-22,s.y-3,44,5);rect(c,'#61aaa1',s.x-20,s.y-3,40,2);c.fillStyle='#a2c9ab';c.textAlign='center';c.font='8px monospace';c.fillText('✦',s.x,s.y-7);}
 for(const [x,y]of[[83,277],[302,198],[611,340],[898,192],[1208,190],[1672,190],[1980,192],[2265,340],[2578,198],[2795,277]])if(x>left-60&&x<right+60)editedTorch(c,x,y,mode.time);
 for(let x=Math.floor(left/133)*133;x<right;x+=133)if(x>35&&x<2840)editedFern(c,x,437,.5+(x%3)*.12);
 for(const p of mode.pickups)if(!p.collected&&p.x>left-20&&p.x<right+20){const bob=Math.round(Math.sin(mode.time*3+p.id)*2);rect(c,C.ink,p.x-4,p.y-9+bob,9,13);rect(c,C.gold,p.x-3,p.y-8+bob,7,11);rect(c,C.cream,p.x-1,p.y-7+bob,2,8);}
}
const backdrops=[];
function forestLayer(layer){
 if(backdrops[layer])return backdrops[layer];
 const surface=document.createElement('canvas');surface.width=1260;surface.height=440;const c=surface.getContext('2d');
 const poly=(pts,color)=>pixelPolygon(c,pts.map(([x,y])=>({x,y})),color);
 const colors=[['#668e7c','#739d86'],['#3f6b60','#4a7867'],['#294f49','#315b50']][layer];
 for(let i=-1;i<5;i++){
  const x=i*315+70,shift=((i+3)*37)%63,w=layer*5;
  // One tapering trunk and broad attached branches, with a quiet lit edge.
  poly([[x-28-w,437],[x-12,315],[x-22,190],[x-3,95+shift],[x+22,85+shift],[x+10,210],[x+22,330],[x+45+w,437]],colors[0]);
  poly([[x-14,239],[x-66,187],[x-103,105+shift],[x-89,98+shift],[x-49,169],[x+7,201]],colors[0]);
  poly([[x+5,190],[x+61,154],[x+107,85+shift],[x+120,87+shift],[x+80,170],[x+11,226]],colors[0]);
  poly([[x-7,315],[x-14,193],[x+2,118+shift],[x+6,120+shift],[x-5,218],[x+3,337],[x+19,437],[x+8,437]],colors[1]);
  for(let j=0;j<3;j++){
   const cx=x-90+j*90,cy=76+shift+Math.abs(j-1)*13;
   poly([[cx-66,cy+22],[cx-72,cy+4],[cx-57,cy-7],[cx-52,cy-27],[cx-25,cy-30],[cx-9,cy-42],[cx+22,cy-36],[cx+39,cy-25],[cx+59,cy-20],[cx+69,cy+3],[cx+56,cy+24],[cx+25,cy+28],[cx+8,cy+37],[cx-20,cy+32]],colors[0]);
   poly([[cx-54,cy-8],[cx-48,cy-25],[cx-24,cy-28],[cx-8,cy-38],[cx+20,cy-33],[cx+34,cy-23],[cx+8,cy-16],[cx-4,cy-3],[cx-28,cy+1]],colors[1]);
  }
  if(layer===0){rect(c,'#90b5a0',x+170,240,14,164);rect(c,'#bbd0ae',x+173,245,4,145);rect(c,'#7da795',x+160,401,35,4);}
  if(layer===1){rect(c,'#527e6c',x+140,210,150,12);for(const px of[x+149,x+268]){rect(c,'#476c60',px,222,15,212);rect(c,'#608672',px-3,222,21,6);rect(c,'#2d574f',px+6,235,5,197);}}
 }
 return backdrops[layer]=surface;
}
export function drawArenaBackdrop(c,camera,left,width,time){
 rect(c,'#739b88',left,55,width,382);rect(c,'#5e897b',left,185,width,252);rect(c,'#365f58',left,330,width,210);
 c.imageSmoothingEnabled=false;
 for(let layer=0;layer<3;layer++){
  const scroll=Math.floor(camera*[.08,.20,.39][layer]);
  for(let i=Math.floor((left+scroll)/1260);i<(left+width+scroll)/1260;i++)c.drawImage(forestLayer(layer),i*1260-scroll,0);
 }
 c.save();c.globalAlpha=.06;c.fillStyle='#f6e5a2';for(let i=0;i<3;i++){const x=left+170+i*390-(camera*.1%140);c.beginPath();c.moveTo(x,56);c.lineTo(x+32,56);c.lineTo(x+180,437);c.lineTo(x+65,437);c.fill();}c.restore();
 for(let i=0;i<14;i++){const x=left+((i*197+Math.sin(time*.15+i)*32-camera*.3)%(width+80)+width+80)%(width+80);const y=100+(i*67)%310;rect(c,'#c2cf83',x,y+Math.sin(time+i)*4,2,2);}
}
