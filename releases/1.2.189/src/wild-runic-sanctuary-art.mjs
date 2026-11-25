import {MOONVEIL_CIRCLE as circle,MOONVEIL_STONES} from './wild-runic-sanctuary-site.mjs';

const GLYPHS=[
 ['....#....','...###...','..#.#.#..','.#..#..#.','....#....','...#.#...','..#...#..','....#....'],
 ['..#...#..','.#.....#.','..#...#..','...###...','....#....','....#....','...#.#...','..#...#..'],
 ['..##.....','.#..#....','.#..#....','..###.#..','....###..','....#..#.','....#..#.','.....##..'],
 ['.#.....#.','..#...#..','...#.#...','....#....','...###...','..#.#.#..','....#....','....#....'],
 ['....#....','...#.#...','..#...#..','...#.#...','....#....','....#..#.','.##.#.#..','...##....'],
];
const SILHOUETTES=[
 [[-.38,.34],[-.58,.57],[-.82,.66],[-.86,.77],[-.98,.76],[-.96,.83],[-.91,.91],[-1,1]],
 [[-.22,.23],[-.53,.42],[-.72,.68],[-.88,.73],[-.85,.83],[-.94,.78],[-.88,.92],[-1,1]],
 [[-.57,.34],[-.78,.58],[-.84,.79],[-.77,.84],[-.86,.85],[-.89,.78],[-1,.87],[-1,1]],
 [[-.38,.08],[-.59,.45],[-.86,.57],[-.92,.72],[-.91,.72],[-.82,.83],[-.92,.84],[-1,1]],
 [[-.24,.33],[-.45,.55],[-.72,.68],[-.85,.83],[-.85,.82],[-.92,.85],[-.89,.92],[-1,1]],
];
const BLUE=[102,190,255],PINK=[245,149,242],VIOLET=[170,81,235],RED=[223,47,47],ORANGE=[255,128,47];
const clamp=n=>Math.min(1,Math.max(0,n));
const mix=(a,b,u)=>a.map((v,i)=>Math.round(v+(b[i]-v)*u));
const color=(rgb,alpha=1)=>`rgba(${rgb.join(',')},${alpha})`;
const hex=rgb=>'#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('');
const pixel=(c,x,y,w,h,ink)=>{c.fillStyle=ink;c.fillRect(Math.round(x),Math.round(y),w,h);};
const rand=(a,b)=>{const n=Math.sin(a*97.193+b*21.571)*43758.5453;return n-Math.floor(n);};

function runeColor(t,stone){
 const cold=mix(BLUE,PINK,.5+Math.sin(t.time*1.73+stone.index*1.19)*.48);
 const death=t.moonveilSanctuary?.death;
 if(!death)return cold;
 const age=t.time-death.at;
 if(age<.68)return mix(cold,VIOLET,clamp(age/.68));
 if(age<1.25)return mix(VIOLET,RED,clamp((age-.68)/.57));
 return mix(RED,ORANGE,clamp((age-1.25)/.55)*(.84+Math.sin(t.time*4+stone.index)*.16));
}

export function moonveilLightSources(t){
 const death=t.moonveilSanctuary?.death,age=death?t.time-death.at:0;
 const changed=age>=1.55?ORANGE:age>=.98?RED:age>=.3?VIOLET:null;
 return MOONVEIL_STONES.map(stone=>({
  x:stone.x,y:stone.y,height:Math.round(stone.height*.54),radius:82,
  intensity:.49,color:hex(changed??(stone.index%2?PINK:BLUE)),owner:'prop:'+stone.id,
 }));
}

function drawStone(c,t,stone){
 const {x,y,height,halfWidth,index}=stone;
 const silhouette=SILHOUETTES[index],top=y-height;
 pixel(c,x-halfWidth-8,y-4,halfWidth*2+12,8,'#304134');
 pixel(c,x-halfWidth-2,y+3,halfWidth*2+7,3,'#3c4c38');
 pixel(c,x-halfWidth-1,y-7,halfWidth*2+2,7,'#45524b');
 for(let row=0;row<height;row+=2){
  const u=row/height,band=Math.min(7,Math.floor(u*8));
  const left=Math.round(silhouette[band][0]*halfWidth),right=Math.round(silhouette[band][1]*halfWidth);
  const face=left+Math.ceil((right-left)*(.68-index*.016)),py=top+row;
  pixel(c,x+left-1,py,right-left+3,2,'#2c3737');
  pixel(c,x+left+1,py,face-left,2,band<2?'#a5aaa0':band<6?'#7a8174':'#647062');
  pixel(c,x+face,py,right-face,2,band<2?'#69776c':'#495952');
  if(band<3||band===4)pixel(c,x+left+1,py,2,2,band<2?'#c3c1aa':'#969e84');
 }
 for(const [dx,down,w,ink] of [
  [-7,.2,7,'#c5c3ab'],[-8,.25,4,'#abb19a'],[4,.32,3,'#52625c'],
  [-10,.38,4,'#a2a88f'],[-10,.63,5,'#59685e'],[6,.73,5,'#66776a'],
  [-7,.82,7,'#4b6052'],[5,.88,6,'#354f42'],[-9,.92,5,'#71845c'],[7,.94,4,'#859265'],
 ]){
  const width=Math.round(w*halfWidth/15);
  pixel(c,x+Math.round(dx*halfWidth/15),top+Math.round(down*height),width,2,ink);
 }
 const rune=runeColor(t,stone),glyph=GLYPHS[index];
 const light=color(rune,.24),bright=color(mix(rune,[255,249,223],.23));
 const originX=x-9,originY=top+Math.round(height*.35);
 for(let j=0;j<glyph.length;j++)for(let i=0;i<glyph[j].length;i++)if(glyph[j][i]==='#'){
  const px=originX+i*2,py=originY+j*2;
  pixel(c,px-2,py-2,6,6,light);
  pixel(c,px-1,py-1,4,4,'#46545c');
 }
 for(let j=0;j<glyph.length;j++)for(let i=0;i<glyph[j].length;i++)if(glyph[j][i]==='#'){
  pixel(c,originX+i*2-1,originY+j*2-1,4,4,light);
  pixel(c,originX+i*2,originY+j*2,2,2,bright);
 }
 const pulse=Math.sin(t.time*3.7+index*1.7);
 pixel(c,originX-2,y-9,2,1,color(rune,.65+pulse*.24));
 pixel(c,originX+14,y-6,2,1,color(rune,.51+pulse*.18));
 for(const [dx,dy,w] of [[-13,2,6],[9,1,6],[4,4,9],[-19,3,4]]){
  pixel(c,x+dx,y+dy,w,2,'#556744');
  pixel(c,x+dx+1,y+dy-2,Math.max(2,w-3),2,'#7a8b56');
 }
}

const clearingTufts=Array.from({length:65},(_,i)=>{
 const a=i*2.3999632297,r=.15+rand(i,71)*.94;
 return {x:Math.round(circle.x+Math.cos(a)*136*r),y:Math.round(circle.y+Math.sin(a)*99*r),
  size:2+Math.floor(rand(i,13)*5),flower:rand(i,21)>.7,light:rand(i,7)>.48};
});
const scorchPalette=['#17171d','#1f1b21','#28242a','#31272e','#393233'];
const cinders=[];
for(let y=-47;y<=47;y+=5)for(let x=-65;x<=65;x+=5){
 const d=Math.hypot(x/58,y/35),n=rand(x,y);
 if(d+n*.37<1.13)cinders.push({x,y,d:d+n*.13,n});
}

export function drawMoonveilGround(c,t,visible){
 if(!t.design.wildLands||t.design.activeRoom||t.wildLandsOverview||!visible(circle,220))return;
 for(const {x,y,size,flower,light} of clearingTufts){
  pixel(c,x-2,y+1,size+4,2,'#3b5638');
  pixel(c,x,y,size,2,light?'#74905a':'#536f45');
  pixel(c,x+2,y-2,2,3,light?'#849864':'#668149');
  if(flower){
   pixel(c,x+3,y-4,2,2,'#bec2b5');
   pixel(c,x+2,y-5,1,1,'#d9b0df');
  }
 }
 const death=t.moonveilSanctuary?.death;
 if(!death)return;
 const age=t.time-death.at,spread=clamp(age/.9)*.92+.18;
 for(const {x,y,d,n} of cinders){
  if(d>spread)continue;
  const tone=Math.min(4,Math.floor(d*3.25+n*1.8));
  pixel(c,death.x+x,death.y+y,d>.75&&n>.74?4:5,d>.75&&n>.83?4:5,scorchPalette[tone]);
  if(age<4&&n>.91&&Math.sin(t.time*3+x)>.24)pixel(c,death.x+x+1,death.y+y,1,1,age<1.25?'#b370dc':'#a75a36');
 }
}

function drawPlume(c,t,death){
 const elapsed=t.time-death.at;
 const alpha=clamp((4.5-elapsed)/1.8)*clamp(elapsed/.45);
 if(alpha<=0)return;
 const shades=[[24,24,36],[37,35,49],[53,48,62],[71,59,81]];
 for(let i=0;i<47;i++){
  const age=(elapsed*(.62+rand(i,3)*.16)+rand(i,71))%1;
  const lift=age*(30+rand(i,33)*50);
  const dx=(rand(i,99)-.5)*(18+age*60)+Math.sin(t.time*2.1+i)*lift*.17;
  const size=2+Math.round((1-age)*(3+rand(i,19)*8));
  const opacity=Math.sin(age*Math.PI)*alpha*.76;
  const x=death.x+dx,y=death.y-lift+rand(i,56)*18-8;
  pixel(c,x,y,size,size-1,color(shades[i%4],opacity));
  if(i%5===0)pixel(c,x+size/2,y-2,2,2,color(elapsed<1.2?VIOLET:ORANGE,opacity*.65));
 }
}

export function moonveilSubjects(t,visible){
 if(!t.design.wildLands||t.design.activeRoom||t.wildLandsOverview||!visible(circle,220))return [];
 const subjects=MOONVEIL_STONES.map(stone=>({moonveil:true,x:stone.x,y:stone.y,depth:stone.rootY,paint:c=>drawStone(c,t,stone)}));
 const death=t.moonveilSanctuary?.death;
 if(death&&t.time-death.at<4.5)subjects.push({moonveil:true,x:death.x,y:death.y,depth:death.y+1,paint:c=>drawPlume(c,t,death)});
 return subjects;
}
