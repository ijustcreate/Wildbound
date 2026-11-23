import {drawWitchHat} from './broom-art.mjs';
import {drawCarverCrown} from './bone-carver-art.mjs';
// Skull-local pixel drawings. Union construction shapes before shading and
// outlining the whole item; never outline each primitive. Five view plans plus
// verified symmetric opposite views. Light stays upper-left as the object turns.
export const HEADWEAR_ART_REVISION=7;
const cache=new Map();
const supported=new Set(['brim','safari','cap','circlet','crown','helmet','fullhelm','horned','hood','mask','santa','pumpkin','keeper','turtle','reaper','warlock','ghost','imp','succubus','banshee','halo']);
export function hoodOpening(d){
 const view=Math.min(d,8-d),flip=d>4?-1:1;
 if(view>=3)return [];
 const points=view===2?[[-7,-4],[-3,-5],[0,-3],[0,2],[-3,4],[-6,3],[-7,0]]:view===1?[[-6,-4],[-3,-6],[0,-5],[2,-3],[2,2],[-1,4],[-5,3],[-6,0]]:[[-5,-3],[-4,-5],[-2,-5],[0,-4],[2,-5],[4,-4],[5,-2],[4,2],[2,4],[-2,4],[-5,2]];
 return points.map(([x,y])=>[x*flip,y]);
}
export function headwearStyle(id,def){return ({reaper_hood:'reaper',keeper_crown:'keeper',imp_horns:'imp',succubus_horns:'succubus',warlock_hood:'warlock'})[id]||def.style||'brim';}
// Behind the face, not over its forehead: short/bald hair must not leave a
// transparent slit between the skull and the inside of the cowl.
export function drawHoodLining(c,h,d,color){
 const points=hoodOpening(d);if(!points.length)return;
 c.fillStyle=color;
 for(let y=-6;y<5;y++){
  const xs=[];for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length];
   if((a[1]<=y+.5&&b[1]>y+.5)||(b[1]<=y+.5&&a[1]>y+.5))xs.push(a[0]+(b[0]-a[0])*(y+.5-a[1])/(b[1]-a[1]));
  }
  xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)for(let x=Math.ceil(xs[i]-.5);x<xs[i+1]-.5;x++)c.fillRect(Math.round(h.x)+x,Math.round(h.y)+y,1,1);
 }
}
export function drawResolvedHeadwear(c,h,d,style,p,id=''){
 if(style==='witch')return drawWitchHat(c,h,d);if(style==='carver')return drawCarverCrown(c,h,d);
 if(!supported.has(style))return false;
 const key=JSON.stringify([HEADWEAR_ART_REVISION,d,style,p,id]);let pixels=cache.get(key);
 if(!pixels){pixels=buildView(d,style,p,id);if(cache.size>=256)cache.delete(cache.keys().next().value);cache.set(key,pixels);}
 const ax=Math.round(h.x),ay=Math.round(h.y);
 for(const [x,y,color]of pixels){c.fillStyle=color;c.fillRect(ax+x,ay+y,1,1);}return true;
}
function buildView(d,style,p,id){
 const view=Math.min(d,8-d),flip=d>4?-1:1,back=view>=3,side=view===2,diag=view===1||view===3;
 const mass=new Set(),details=new Map(),xy=(x,y)=>`${Math.round(x*flip)},${Math.round(y)}`;
 const poly=(vertices,set=mass,color)=>{
  const points=vertices.map(([x,y])=>[x*flip,y]);
  for(let y=Math.floor(Math.min(...points.map(v=>v[1])));y<Math.ceil(Math.max(...points.map(v=>v[1])));y++){
   const xs=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]<=y+.5&&b[1]>y+.5)||(b[1]<=y+.5&&a[1]>y+.5))xs.push(a[0]+(b[0]-a[0])*(y+.5-a[1])/(b[1]-a[1]));}
   xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)for(let x=Math.ceil(xs[i]-.5);x<xs[i+1]-.5;x++)set instanceof Set?set.add(`${x},${y}`):set.set(`${x},${y}`,color);
  }
 };
 const rect=(x,y,w,h,color)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)details.set(xy(xx,yy),color);};
 const cut=vertices=>{const hole=new Set();poly(vertices,hole);for(const k of hole)mass.delete(k);};
 const mark=(vertices,color)=>poly(vertices,details,color);
 // Authored curves are rasterized into the same native editable pixels. A few
 // deliberate curve controls replace squared-off profiles, not surface noise.
 const curve=(a,b,c,n=8)=>Array.from({length:n+1},(_,i)=>{const t=i/n,u=1-t;return [u*u*a[0]+2*u*t*b[0]+t*t*c[0],u*u*a[1]+2*u*t*b[1]+t*t*c[1]];});
 const ribbon=(path,width,color,shape=true)=>{
  const vertices=[...path.map(([x,y])=>[x,y-width/2]),...path.toReversed().map(([x,y])=>[x,y+width/2])];
  if(shape)poly(vertices);if(color)mark(vertices,color);
 };
 const cap=[
  [[-6,-4],[-6,-7],[-4,-10],[2,-10],[5,-8],[6,-4]],
  [[-6,-4],[-6,-7],[-3,-10],[2,-10],[5,-8],[6,-3]],
  [[-5,-4],[-5,-8],[-2,-10],[2,-10],[5,-8],[5,-3]],
  [[-6,-3],[-6,-7],[-3,-10],[2,-10],[5,-8],[6,-3]],
  [[-6,-3],[-6,-8],[-3,-10],[3,-10],[6,-8],[6,-3]]
 ][view];
 const hood=['hood','warlock','ghost','reaper','banshee'].includes(style),metal=['helmet','fullhelm','horned'].includes(style);
 // Near/far horn roots deliberately change positions and overlap in profile.
 // They must not remain pinned to the screen-left/right edge during a turn.
 const horns=(kind)=>{
  // Succubus horns emerge through the brow, not above the hair's crown.
  // The far root moves up/in as the forehead turns away from the camera.
  const roots=(kind==='succubus'?
   [ [[-4,-3,-1],[4,-3,1]], [[-4,-4,-1],[2,-2,1]], [[-2,-4,-1],[-4,-2,-1]], [[-4,-3,-1],[2,-5,1]], [[-4,-4,-1],[4,-4,1]] ]:
   [ [[-5,-7,-1],[5,-7,1]], [[-5,-8,-1],[2,-6,1]], [[-3,-8,-1],[0,-6,-1]], [[-5,-6,-1],[2,-8,1]], [[-5,-7,-1],[5,-7,1]] ])[view];
  for(const [i,[x,y,s]]of roots.entries()){
   const rise=kind==='imp'?3:5,reach=kind==='horned'?3:2;
   const farScale=kind==='succubus'&&side&&i===0?.65:1;
   const map=points=>points.map(([u,v])=>[x+s*u*farScale,y+v*farScale]);
   const shape=map([[-1,1],[1.5,.5],[reach+1,-1],[reach+1,-rise],[reach,-rise+1],[reach-1,-2],[0,-1],[-1,-1]]);
   poly(shape);mark(shape,kind==='horned'?'#c7b58c':p.base);
   mark(map([[0,0],[reach,-1],[reach,-rise+1],[reach-1,-2],[0,-1]]),i===0&&diag?p.dark:kind==='horned'?p.shine:p.light);
  }
 };
 let highlight=p.light,base=p.base,shadow=p.dark,ink=p.ink;
 if(style==='ghost'){ink='#54786e';base='#b8d9c4';shadow='#82ad9e';highlight='#e1efce';}
 if(style==='reaper'){ink='#161921';base='#363b47';shadow='#252933';highlight='#58616c';}
 if(style==='halo'){ink='#aa793b';base='#edbd62';shadow='#d79443';highlight='#fff0b7';}
 if(['brim','cap','safari'].includes(style)){
  poly(cap);
  if(style==='safari')poly([[-5,-5],[-5,-8],[-2,-11],[2,-11],[5,-8],[6,-4]]);
  if(style==='cap'){
   // Soft baseball crown and forward bill, not a fedora brim all around.
   mass.clear();poly([[-5,-3],...curve([-6,-4],[-6,-11],[0,-11]),...curve([0,-11],[5,-11],[6,-4]),[5,-3]]);
   const bills=[
    [...curve([-6,-3],[0,-6],[6,-3]),...curve([6,-3],[0,-1],[-6,-3])],
    [[-8,-3],...curve([-8,-3],[-3,-6],[3,-4]),...curve([3,-4],[-2,-1],[-8,-2])],
    [[-8,-3],[-4,-5],[0,-4],[-1,-2],[-8,-2]],
    [[-5,-3],[-3,-4],[4,-4],[5,-3],[2,-2],[-4,-2]],
    [...curve([-5,-4],[0,-2],[5,-4]),[5,-2],...curve([5,-2],[0,0],[-5,-2])]
   ];poly(bills[view]);
   ribbon(curve([-5,-4],[0,back?-1:-6],[5,-4]),1,p.dark,false);
  }else poly([[-8,-5],[7,-5],[9,-3],[7,-2],[-7,-2],[-9,-3]]);
  if(style!=='cap')rect(-5,-5,10,1,p.leather);
  if(style==='safari'&&!back)rect(side?-5:diag?-3:0,-6,1,2,p.trim);
  if(id==='marlow_hat')poly([[-5,-9],[-4,-11],[3,-11],[5,-9],[5,-5],[-5,-5]]);
 }else if(hood){
  const cowls=[
   [...curve([-7,2],[-8,-10],[-1,-11]),...curve([-1,-11],[7,-11],[7,1]),[6,4],[2,6],[-3,6],[-6,4]],
   [...curve([-6,2],[-8,-10],[-1,-11]),...curve([-1,-11],[6,-11],[7,-3]),[6,3],[3,6],[-3,6],[-6,3]],
   [[-6,3],[-7,-2],...curve([-7,-2],[-7,-11],[0,-11]),...curve([0,-11],[6,-10],[7,-5]),[5,-3],[6,3],[3,6],[-1,6]],
   [...curve([-6,1],[-8,-11],[0,-11]),...curve([0,-11],[6,-11],[7,-4]),[5,-2],[6,2],[2,6],[-3,5]],
   [...curve([-6,0],[-8,-11],[0,-11]),...curve([0,-11],[8,-11],[6,0]),[5,3],[0,7],[-5,3]]
  ];poly(cowls[view]);
  if(['warlock','reaper','banshee'].includes(style))poly([[-5,-8],[-2,-12],[1,-10],[5,-8]]);
  if(!back){
   const opening=hoodOpening(view);
   cut(opening);
   if(style==='ghost'){
    mark(opening,'#101a1c');
   }
   if(style==='reaper'){
    mark(opening,'#20242b');
    mark(side?[[-5,-4],[-1,-4],[0,0],[-2,3],[-4,2]]:[[-3,-4],[2,-4],[3,-2],[2,1],[1,3],[-2,3],[-4,0],[-4,-2]],'#d9d2b5');
    rect(side?-4:diag?-3:-3,-2,2,2,ink);if(!side)rect(diag?0:1,-2,2,2,ink);rect(side?-3:-1,1,1,1,ink);
   }
   if(style==='warlock'){rect(side?-4:diag?-3:-2,-2,1,1,'#a8dbc2');if(!side)rect(diag?0:2,-2,1,1,'#a8dbc2');}
  }
  if(back)mark([[-3,-4],[0,-1],[3,-4],[3,-2],[0,1],[-3,-2]],p.dark);
  if(style==='warlock'){
   // Three cloth points rotate with the skull; the rear is not a front crown.
   const points=[ [[-5,-7],[-1,-9],[4,-7]], [[-5,-8],[-1,-8],[4,-6]], [[-4,-9],[0,-7],[3,-5]], [[-3,-9],[1,-7],[4,-5]], [[-4,-7],[0,-8],[4,-7]] ][view];
   for(const [x,y]of points){poly([[x-1,y+2],[x-1,y-2],[x,y-4],[x+2,y+1]]);mark([[x,y+1],[x,y-2],[x+1,y]],p.light);}
  }
 }else if(metal){
  // Domed forehead and swept near-side guard, not a rectangular bucket.
  poly([...curve([-6,-3],[-7,-10],[0,-10]),...curve([0,-10],[6,-10],[6,-3])]);
  if(back)poly([[-6,-5],[6,-5],[5,1],[3,4],[-3,4],[-5,1]]);
  else{
   poly([[3,-5],[6,-5],[6,1],[4,4],[2,3],[3,0]]);
   if(!side)poly([[-6,-5],[-4,-5],[-3,2],[-5,3],[-6,2]]);
   const brow=side?curve([-6,-4],[-2,-7],[4,-4]):diag?curve([-6,-4],[-3,-7],[3,-4]):curve([-6,-4],[0,-7],[6,-4]);
   ribbon(brow,2,p.light,false);
   if(style==='fullhelm'){
    poly([[-5,-4],[5,-4],[5,2],[1,5],[-4,3],[-6,0]]);
    rect(side?-5:diag?-5:-4,-2,side?4:diag?6:8,1,ink);
    // A real split/nasal guard under the visor, rather than a pale blank slab.
    mark([[side?-4:diag?-3:-1,-1],[side?-2:diag?-1:1,-1],[side?-2:diag?-1:1,3],[side?-4:diag?-3:-1,3]],p.dark);
    rect(side?-3:diag?-2:0,-1,1,4,p.light);
   }
  }
  if(style==='horned'){
   horns('horned');
  }
 }else if(['circlet','crown','keeper'].includes(style)){
  const bands=[ [[-6,-6],[-3,-5],[3,-5],[6,-6],[6,-3],[2,-2],[-3,-2],[-6,-3]], [[-6,-6],[-2,-5],[5,-6],[6,-4],[-2,-2],[-6,-3]], [[-5,-7],[4,-5],[5,-3],[-5,-5]], [[-6,-5],[4,-7],[6,-6],[6,-4],[-5,-3]], [[-6,-6],[-3,-5],[3,-5],[6,-6],[6,-3],[-6,-3]] ];
  if(style==='keeper')poly(bands[view]);
  else{
   const paths=[curve([-6,-5],[0,-4],[6,-5]),curve([-6,-5],[-1,-3],[6,-6]),curve([-5,-4],[0,-5],[5,-7]),curve([-6,-6],[-1,-1],[6,-5]),curve([-6,-5],[0,0],[6,-5])];
   ribbon(paths[view],3,p.base);ribbon(paths[view].map(([x,y])=>[x,y-.5]),1,p.light,false);
  }
  if(style!=='circlet')for(const [x,top]of side?[[2,-9],[-4,-11]]:[[-5,-9],[0,-11],[5,-9]])poly([[x-1,-4],[x-1,top],[x,top-1],[x+2,top+2],[x+1,-3]]);
  if(!back)rect(side?-4:diag?-3:0,-5,1,2,style==='keeper'?'#aad58b':p.shine);
  if(style==='keeper'){mark([[-5,-8],[-7,-11],[-3,-10],[-2,-6]],'#719655');if(!side)mark([[3,-7],[5,-11],[7,-10],[5,-6]],'#a1b770');}
 }else if(['mask','pumpkin','turtle'].includes(style)){
  if(style==='pumpkin'){
   poly([[-6,-6],[-4,-9],[-1,-8],[1,-9],[4,-8],[6,-6],[7,-2],[6,1],[3,4],[-3,4],[-6,1],[-7,-2]]);poly([[-1,-9],[-1,-12],[1,-12],[2,-9]]);
   mark([[-1,-11],[0,-11],[1,-9],[-1,-9]],'#5b733d');
   // Two curved rib shadows, triangular carved eyes and a notched grin.
   ribbon(curve([-4,-8],[-7,-3],[-4,2]),1.5,p.dark,false);ribbon(curve([4,-7],[6,-3],[4,2]),1.5,p.dark,false);
   if(!back){
    const cx=side?-5:diag?-2:0,sx=side?.35:diag?.8:1,face=points=>points.map(([x,y])=>[cx+x*sx,y]);
    mark(face([[-4,-1],[-2,-4],[0,-1]]),ink);if(!side)mark(face([[1,-1],[3,-4],[5,-1]]),ink);
    mark(face([[-4,0],[-2,1],[0,0],[2,1],[4,0],[3,3],[1,2],[-1,3],[-3,2]]),ink);
    mark(face([[-3,1],[-1,2],[0,1],[2,2],[3,1],[2,3],[0,2],[-1,3]]),'#ffdc71');
   }
  }else if(style==='turtle'){
   poly([[-7,-3],[-6,-7],[-3,-10],[3,-10],[6,-7],[7,-3],[5,-2],[-6,-2]]);
   const lips=[curve([-7,-2],[0,-7],[7,-2]),curve([-7,-3],[-2,0],[6,-5]),curve([-6,-3],[0,0],[5,-6]),curve([-6,-4],[0,0],[6,-4]),curve([-6,-4],[0,4],[6,-4])];
   ribbon(lips[view],2,p.light);
   mark([[-3,-9],[1,-9],[2,-6],[-1,-4],[-4,-6]],p.light);mark([[2,-8],[5,-6],[5,-4],[2,-5]],p.dark);
  }else{
   poly(cap);
   // The mask is a separate curved face plate, edge-on in profile. At the rear
   // only the fastening/near edge is visible, never a second face on the hair.
   const plates=[
    [[-6,-4],[-3,-5],[3,-5],[6,-4],[5,1],[2,4],[0,5],[-3,3],[-5,1]],
    [[-6,-4],[-2,-5],[2,-4],[2,1],[-1,4],[-3,4],[-6,1]],
    [[-6,-4],[-4,-5],[-3,-2],[-4,3],[-6,4],[-7,0]],
    [[-6,-4],[-5,-4],[-5,2],[-6,3],[-7,0]],
    []
   ];if(plates[view].length)poly(plates[view]);
   if(!back){rect(side?-6:diag?-5:-4,-2,side?1:2,1,ink);if(!side)rect(diag?-1:2,-2,2,1,ink);rect(side?-5:diag?-3:0,-1,1,3,p.trim);}
   else if(!diag){rect(-6,-2,1,2,p.trim);rect(5,-2,1,2,p.trim);}
  }
 }else if(style==='santa'){
  const tips=[[0,-8],[5,-6],[7,-6],[5,-4],[0,-2]], [tx,ty]=tips[view];
  poly([...curve([-6,-3],[-6,-11],[0,-11]),...curve([0,-11],[5,-11],[6,-4]),[6,-3]]);
  if(view!==0){poly([...curve([-1,-10],[tx+2,-12],[tx+1,ty]),[tx-1,ty],...curve([tx-1,ty],[tx,-8],[-3,-7])]);}
  const cuff=curve([-6,-4],[0,back?-1:-6],[6,-4]);ribbon(cuff,3,'#eee2c7');
  if(view!==0){poly([[tx-2,ty-1],[tx,ty-2],[tx+2,ty-1],[tx+2,ty+1],[tx,ty+2],[tx-2,ty+1]]);mark([[tx-1,ty-1],[tx+1,ty-1],[tx+1,ty+1],[tx-1,ty+1]],'#f8eddb');}
 }else if(style==='imp'||style==='succubus'){
  horns(style);
 }else if(style==='halo'){
  poly([[-6,-12],[5,-12],[7,-11],[7,-9],[5,-8],[-6,-8],[-8,-9],[-8,-11]]);cut([[-5,-11],[4,-11],[6,-10],[4,-9],[-5,-9],[-7,-10]]);
 }
 // Fit the upper cowl before shading/outline. Never stack all crown pixels
 // onto a single scanline: that flattened the hood and its pointed tips.
 if(hood){
  const fitted=k=>{const [x,y]=k.split(',').map(Number);return `${x},${y< -5?-5+Math.round((y+5)*.75):y}`;};
  const shape=[...mass].map(fitted),marks=[...details].map(([k,v])=>[fitted(k),v]);
  mass.clear();details.clear();for(const k of shape)mass.add(k);for(const [k,v]of marks)details.set(k,v);
 }
 const result=new Map();
 const luminous=['halo','imp','succubus','horned','crown','keeper','circlet'].includes(style);
 for(const k of mass){const [x,y]=k.split(',').map(Number),edge=[[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>!mass.has(`${x+dx},${y+dy}`));
  const hornEdge=['horned','imp','succubus'].includes(style);
  const litEdge=luminous&&y<(style==='circlet'?-3:-7)&&(!mass.has(`${x},${y-1}`)||hornEdge&&!mass.has(`${x-1},${y}`))&&(x<3||hornEdge);
  result.set(k,litEdge?highlight:edge?ink:x>2||y>2?shadow:y<-6&&x<2?highlight:base);
 }
 for(const [k,color]of details)if(mass.has(k)||style==='reaper'||style==='ghost'){
  const [x,y]=k.split(',').map(Number),edge=mass.has(k)&&[[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>!mass.has(`${x+dx},${y+dy}`));if(!edge)result.set(k,color);
 }
 return [...result].map(([k,color])=>[...k.split(',').map(Number),color]);
}
