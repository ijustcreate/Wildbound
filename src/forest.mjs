// Layered, deterministic pixel vegetation. No bitmap dependencies or per-frame random spawning.
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
export const TREE_TYPES=['oak','birch','pine'];
export function palmStructure(p){const seed=p.seed??hash(p.x,p.y)*1000;return {seed,lean:(hash(seed,11)-.5)*19,height:45+hash(seed,12)*10,spread:.85+hash(seed,13)*.3};}
export function drawPalmTrunk(c,p){
 const s=palmStructure(p);
 for(let i=0;i<18;i++){const t=i/17,x=s.lean*t*t,y=-s.height*t,w=7-t*3;
  rect(c,x-w/2-1,y,w+2,5,'#493d2c');rect(c,x-w/2,y,w,4,'#94734c');rect(c,x-w/2,y,2,3,'#c7a171');
  if(i%2===0)line(c,x-w/2,y+3,x+w/2,y+2,1,'#665139');
 }
 line(c,-3,-3,-8,1,3,'#796043');line(c,3,-3,8,1,3,'#796043');
}
export function drawPalmFronds(c,p,time){
 const s=palmStructure(p),cx=s.lean,cy=-s.height;
 for(let i=0;i<9;i++){
  const angle=-Math.PI+.22+i*(Math.PI*2-.44)/9,len=(24+hash(i,s.seed)*13)*s.spread;
  const dx=Math.cos(angle)*len,dy=Math.sin(angle)*len*.52;
  const sway=Math.sin(time*1.4+s.seed+i*.7)*1.4;
  const point=t=>[cx+dx*t+sway*t*t,cy+dy*t-13*Math.sin(t*Math.PI)+10*t*t];
  let previous=point(0);
  for(let n=1;n<=12;n++){const t=n/12,[x,y]=point(t),w=8*Math.sin(Math.PI*t)*(.75+hash(i,n)*.25);
   line(c,previous[0],previous[1],x,y,2,'#244c38');
   const nx=-dy/len,ny=dx/len;
   line(c,x,y,x+nx*w-dx*.06,y+ny*w+4*t,2,i%3===0?'#3b6840':'#568449');
   line(c,x,y,x-nx*w-dx*.06,y-ny*w+4*t,2,'#35623d');
   line(c,previous[0],previous[1]-1,x,y-1,1,i%2?'#83a85b':'#a0b968');previous=[x,y];
  }
 }
 crown(c,cx,cy,5,4,'#476839',s.seed);
 for(let i=0;i<Math.min(3,p.coconuts??Math.floor(hash(s.seed,17)*4));i++){rect(c,cx-5+i*4,cy+2+i%2*3,5,5,'#503d2b');rect(c,cx-4+i*4,cy+2+i%2*3,2,2,'#b28a50');}
}
export const forestSettings={season:'auto',oak:'deciduous',birch:'deciduous',pine:'evergreen'};
try{const saved=JSON.parse(globalThis.localStorage?.getItem('wildbound-forest')||'{}');for(const k of Object.keys(forestSettings))if((k==='season'?['auto','summer','autumn','winter']:['evergreen','deciduous']).includes(saved[k]))forestSettings[k]=saved[k];}catch{}
export const saveForestSettings=()=>globalThis.localStorage?.setItem('wildbound-forest',JSON.stringify(forestSettings));
export const treeType=p=>TREE_TYPES.includes(p.treeType)?p.treeType:p.kind==='snow_tree'?'pine':TREE_TYPES[Math.floor(hash(p.x,p.y)*3)];
export const treeBase=p=>({x:p.x,y:Number.isFinite(p.rootY)?p.rootY:p.y+p.size*.35});
export function treeSeason(p,g={}){return p.season|| (forestSettings.season==='auto'?(g.generatedEnvironment==='ice'||p.kind==='snow_tree'?'winter':'summer'):forestSettings.season);}
export const leafHabit=p=>p.leafHabit||forestSettings[treeType(p)];
export function treeStructure(p){const seed=p.seed??hash(p.x,p.y)*1000;return {height:.88+hash(seed,2)*.24,width:.85+hash(seed,3)*.3,lean:(hash(seed,4)-.5)*.16,branchSpread:.8+hash(seed,5)*.4,seed};}
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
function line(c,x,y,xx,yy,width,color){const n=Math.ceil(Math.hypot(xx-x,yy-y));for(let i=0;i<=n;i++)rect(c,x+(xx-x)*i/(n||1)-width/2,y+(yy-y)*i/(n||1),width,width,color);}
function crown(c,x,y,rx,ry,color,seed){for(let row=-ry;row<=ry;row+=2){const half=Math.sqrt(Math.max(0,1-row*row/(ry*ry)))*rx;rect(c,x-half,y+row,half*2+hash(row,seed)*3,2,color);}}
export function drawTreeTrunk(c,p){
 const birch=treeType(p)==='birch',bark=birch?'#c9cbb3':'#655044';
 line(c,0,-43,-1,-3,birch?7:11,'#343b35');line(c,-1,-40,-2,-2,birch?5:7,bark);
 line(c,-2,-33,-3,-3,2,birch?'#ebebcf':'#987652');
 for(const [x,y] of [[-13,2],[13,2],[-8,-4],[7,-3]]){line(c,0,-10,x,y,4,'#3c4036');line(c,-1,-7,x,y,2,bark);}
 for(let i=0;i<7;i++)rect(c,birch?(i%2?-3:0):1,-5-i*5,birch?4:2,1,birch?'#4f5650':'#403a32');
}
export function drawTreeBranches(c,p){
 const shape=treeStructure(p),pine=treeType(p)==='pine',birch=treeType(p)==='birch';
 const ends=pine?[[-19,-30],[20,-32],[-14,-43],[13,-47],[-6,-58],[6,-60]]:[[-22,-43],[19,-47],[-12,-59],[10,-64]];
 ends.forEach(([xx,yy],i)=>{const x=xx*shape.branchSpread,y=yy+hash(xx,shape.seed)*5,baseY=-19-i*4,mx=x*.55,my=y+8;
 line(c,0,baseY,mx,my,4,'#3d4036');line(c,mx,my,x,y,3,'#3d4036');
 line(c,-1,baseY,mx-1,my,2,birch?'#bfc3af':'#83674b');line(c,mx-1,my,x,y,1,birch?'#d3d5bf':'#967755');
 if(!pine){const sign=x<0?-1:1;for(let j=0;j<3;j++){const t=.35+j*.24,bx=mx+(x-mx)*t,by=my+(y-my)*t;
 const tx=bx+sign*(4+hash(i,j+shape.seed)*5),ty=by-5-hash(j,i)*5;
 line(c,bx,by,tx,ty,1,birch?'#c5c9b7':'#665a47');line(c,tx,ty,tx-sign*2,ty-4,1,'#575547');}}
 });
}
export function drawTreeFoliage(c,p,time,g){
 const type=treeType(p),season=treeSeason(p,g);if(season==='winter'&&leafHabit(p)==='deciduous')return;
 const autumn=season==='autumn'&&leafHabit(p)==='deciduous',colors=autumn?['#65483e','#996047','#c88c49','#e0b564']:type==='pine'?['#173e37','#28584a','#41755a','#7b9870']:['#203f32','#365c3b','#5e8047','#9aab63'];
 const seed=hash(p.x,p.y),sway=Math.sin(time*1.3+seed*6)*.8;
 const clusters=type==='pine'?[[0,-64,10,10],[0,-53,16,11],[0,-41,22,12],[0,-29,25,11]]:type==='birch'?[[-9,-42,14,15],[10,-51,15,16],[-4,-63,14,14]]:[[-18,-37,17,14],[16,-41,18,15],[-11,-54,20,16],[12,-57,18,15],[0,-66,16,12]];
 clusters.forEach(([cx,cy,rx,ry],i)=>{
  const x=cx*treeStructure(p).branchSpread+(hash(i,seed)-.5)*4,y=cy+(hash(seed,i)-.5)*4;
  crown(c,x+sway,y,rx,ry,colors[0],i+seed);crown(c,x-1+sway,y-3,rx-2,ry-3,colors[1],i+seed);
  crown(c,x-4+sway,y-6,rx*.65,ry*.55,colors[2],i+seed);
  for(let n=0;n<34;n++){const lx=(hash(n+i*41,seed)-.5)*rx*1.7,ly=(hash(seed,n+i*17)-.5)*ry*1.5;if(lx*lx/(rx*rx)+ly*ly/(ry*ry)>.8)continue;rect(c,x+lx+sway,y+ly,2+hash(n,seed)*3,2,colors[n%6===0?3:n%2?1:2]);}
  if(season==='winter')crown(c,x-2,y-7,rx*.7,3,'#dceae4',seed+i);
 });
}
export function drawForestTree(c,p,time,g={}){
 const b=treeBase(p),s=p.size/64;c.save();c.translate(Math.round(b.x),Math.round(b.y));c.scale(s,s);
 if(p.fallen){drawStump(c,p);c.restore();return;}
 // Roots stay grounded while the upper tree falls around the same root pivot.
 if(p.falling){drawStump(c,p);c.rotate((p.fallDirection||1)*Math.min(1,p.falling/1.1)*Math.PI/2);c.globalAlpha*=Math.max(0,1-Math.max(0,p.falling-1)*2);}
 const shape=treeStructure(p);c.transform(shape.width,0,shape.lean,shape.height,0,0);
 drawTreeTrunk(c,p);drawTreeBranches(c,p);drawTreeFoliage(c,p,time,g);c.restore();
}
function drawStump(c,p){rect(c,-7,-6,14,7,'#514333');rect(c,-6,-6,12,3,'#b79463');rect(c,-3,-5,6,1,'#72593e');line(c,-4,-1,-11,2,3,'#65503a');line(c,4,-1,10,2,3,'#65503a');}
export function waterBodyAt(g,x,y){
 if((g.house?.pools||[]).some(p=>x>=p.x&&y>=p.y&&x<p.x+p.w&&y<p.y+p.h))return 'pool';
 if(x<0||y<0||x>=1600||y>=1600)return null;
 const t=g.terrain?.[Math.floor(y/32)*50+Math.floor(x/32)];return ['water','shallow'].includes(t)&&!g.house?.pools?'natural':null;
}
const cache=new WeakMap();
export function forestDecor(g){
 const signature=[g.seed,g.generatedEnvironment,JSON.stringify(g.house?.pools||[]),JSON.stringify(forestSettings),g.scenery?.length].join('|');let data=cache.get(g);
 if(data?.signature===signature&&data.terrain===g.terrain)return data;
 data={signature,terrain:g.terrain,leaves:[],banks:[]};
 for(const p of g.scenery||[])if(['tree','snow_tree'].includes(p.kind)&&leafHabit(p)==='deciduous'){
 const b=treeBase(p);for(let i=0;i<16;i++)data.leaves.push({x:b.x+(hash(i,p.x)-.5)*p.size,y:b.y+(hash(p.y,i)-.5)*p.size*.5,dx:0,dy:0,vx:0,vy:0,seed:i+Math.floor(p.x),tree:p});}
 if((g.generatedEnvironment||g.environment)==='forest')for(let y=1;y<49;y++)for(let x=1;x<49;x++){
 const px=x*32+16,py=y*32+16;if(waterBodyAt(g,px,py)!=='natural')continue;
 const shore=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>g.terrain[(y+dy)*50+x+dx]==='grass');
 if(shore&&hash(x+g.seed,y)>.28)data.banks.push({kind:'reeds',x:px-8,y:py+6,seed:x+y});
 if(hash(x,y+(g.seed||0))>.77)data.banks.push({kind:'lily',x:px+5,y:py,seed:x+y});
 }
 cache.set(g,data);return data;
}
export function tickForest(g,dt){
 if((g.generatedEnvironment||g.environment)==='forest')for(const p of g.scenery||[])if(p.procedural&&p.kind==='fern'&&hash(p.x,p.y)>.55)p.kind='bush';
 const data=forestDecor(g),players=(g.players||[]).filter(p=>p.hp>0&&!p.room&&p.moving&&!(p.jumpHeight>0));
 for(const leaf of data.leaves){for(const p of players){const dx=leaf.x+leaf.dx-p.x,dy=leaf.y+leaf.dy-p.y,d=Math.hypot(dx,dy);if(d<18){leaf.vx+=(dx/(d||1)*65+(p.faceX||0)*15)*dt;leaf.vy+=(dy/(d||1)*50+(p.faceY||0)*15)*dt;}}
 leaf.vx*=Math.exp(-dt*3);leaf.vy*=Math.exp(-dt*3);leaf.dx=Math.max(-35,Math.min(35,leaf.dx+leaf.vx*dt));leaf.dy=Math.max(-25,Math.min(25,leaf.dy+leaf.vy*dt));}
 for(const b of g.scenery||[])if(b.kind==='bush'){const near=players.some(p=>Math.hypot(p.x-b.x,p.y-(b.y+b.size*.19))<b.size*.55);b.rustle=near?1:Math.max(0,(b.rustle||0)-dt*2.5);}
}
export function drawForestGround(c,g,visible=()=>true){
 const data=forestDecor(g);c.save();
 for(const p of g.scenery||[])if(['tree','snow_tree','palm'].includes(p.kind)&&visible(p)){
 const b=p.kind==='palm'?{x:p.x,y:p.rootY??p.y+p.size*.19}:treeBase(p);c.fillStyle=p.fallen?'#102b224d':'#0b25234f';c.beginPath();c.ellipse(b.x+5,b.y+3,p.size*(p.fallen?.13:.34),p.size*(p.fallen?.05:.12),0,0,Math.PI*2);c.fill();}
 for(const l of data.leaves)if(visible(l)&&waterBodyAt(g,l.x,l.y)!=='pool'){
 const season=treeSeason(l.tree,g);if(season==='winter')continue;rect(c,l.x+l.dx,l.y+l.dy,3,1.5,season==='autumn'?['#a97442','#c79c51','#785742'][l.seed%3]:['#7e8448','#687643','#a18c53'][l.seed%3]);}
 for(const p of data.banks)if(visible(p)&&waterBodyAt(g,p.x,p.y)==='natural'){
 if(p.kind==='lily'){const bob=Math.sin(g.time*1.5+p.seed)*.6;c.fillStyle='#173f3b';c.beginPath();c.ellipse(p.x,p.y+1,7,3,0,0,Math.PI*2);c.fill();c.fillStyle='#558b50';c.beginPath();c.moveTo(p.x,p.y+bob);c.arc(p.x,p.y+bob,6,.25,Math.PI*1.95);c.closePath();c.fill();rect(c,p.x-3,p.y-2+bob,4,1,'#9ebc6b');if(p.seed%4===0){rect(c,p.x+2,p.y-4,3,3,'#eee2c4');rect(c,p.x+3,p.y-3,1,1,'#deb16b');}}
 else for(let i=0;i<6;i++){const x=p.x+i*3,y=p.y+hash(i,p.seed)*5,sway=Math.sin(g.time*2+p.seed+i)*1.5;line(c,x,y,x+sway,y-10-hash(i,p.seed)*9,1,i%2?'#799653':'#416b46');if(i%2)rect(c,x+sway,y-18,2,5,'#887248');}
 }
 c.restore();
}
export function drawFallingLeaves(c,g,visible=()=>true){
 for(const p of g.scenery||[])if(p.kind==='tree'&&!p.fallen&&!p.falling&&leafHabit(p)==='deciduous'&&treeSeason(p,g)!=='winter'&&visible(p)){
 const b=treeBase(p);for(let i=0;i<2;i++){const u=((g.time||0)*.09+hash(i+p.x,p.y))%1;if(u>.8)continue;const x=b.x+Math.sin(u*8+i)*12+(i-.5)*p.size*.3,y=b.y-p.size*.7+u*p.size*.88;rect(c,x,y,Math.sin(u*20)>0?3:1,2,treeSeason(p,g)==='autumn'?'#c29451':'#839854');}}
}
export function drawBush(c,p,time){const s=p.size/40,b=p.y+p.size*.19;c.save();c.translate(p.x,b);c.scale(s,s);c.fillStyle='#17392e66';c.beginPath();c.ellipse(0,1,17,5,0,0,Math.PI*2);c.fill();const sway=Math.sin(time*24+p.x)*(p.rustle||0)*3;for(let i=0;i<3;i++){crown(c,(i-1)*10+sway,-8-(i===1?5:0),11,9,'#274f35',i);crown(c,(i-1)*10-2+sway,-12-(i===1?5:0),8,5,'#5e8247',i);for(let j=0;j<5;j++)rect(c,(i-1)*10-7+j*3+sway,-13+hash(j,i)*7,2,2,'#92a65b');}c.restore();}
