import {vegetationWind,vegetationWindStrength} from './vegetation-motion.mjs';
// Native pixel silhouettes inspired by the supplied woodland prop sheet.
// IDs are stable editor/save identifiers; labels describe the actual prop.
export const FOREST_PROP_ASSETS=Object.freeze({
 forest_limestone_boulder:{name:'Limestone boulder',family:'stone',scale:1},
 forest_limestone_rock:{name:'Limestone rock',family:'stone',scale:.72},
 forest_limestone_stone:{name:'Limestone stone',family:'stone',scale:.48},
 forest_limestone_pebble:{name:'Limestone pebble',family:'stone',scale:.26},
 forest_round_shrub_large:{name:'Rounded woodland shrub · large',family:'shrub',scale:1},
 forest_round_shrub_medium:{name:'Rounded woodland shrub · medium',family:'shrub',scale:.76},
 forest_round_shrub_small:{name:'Rounded woodland shrub · small',family:'shrub',scale:.54},
 forest_round_shrub_dwarf:{name:'Rounded woodland shrub · dwarf',family:'shrub',scale:.35},
 forest_moss_rock_cluster:{name:'Mossy rock cluster',family:'moss',scale:1},
 forest_moss_rock_pair:{name:'Mossy rock pair',family:'moss',scale:.74},
 forest_moss_rock_scatter:{name:'Mossy stone scatter',family:'moss',scale:.46},
 forest_porcini_trio:{name:'Porcini mushroom trio',family:'porcini',count:3,scale:1},
 forest_porcini_pair:{name:'Porcini mushroom pair',family:'porcini',count:2,scale:1},
 forest_porcini_single:{name:'Porcini mushroom',family:'porcini',count:1,scale:.9},
 forest_fly_agaric_patch:{name:'Fly agaric mushroom patch',family:'agaric',count:3,scale:1},
 forest_fly_agaric_pair:{name:'Fly agaric mushroom pair',family:'agaric',count:2,scale:1},
 forest_fly_agaric_single:{name:'Fly agaric mushroom',family:'agaric',count:1,scale:.9},
 forest_woodland_daisy:{name:'Woodland daisy clump',family:'flower',scale:1},
 forest_cattail_tuft:{name:'Cattail reed tuft',family:'cattail',scale:1},
 forest_meadow_tuft:{name:'Broad meadow tuft',family:'tuft',scale:1},
});
const hash=(x,y=0)=>{const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);};
const sprites=new Map();
export function forestAssetFor(p){
 if(FOREST_PROP_ASSETS[p.forestAsset])return p.forestAsset;
 if(!p.procedural)return null;
 if(p.kind==='rock')return hash(p.x,p.y)>.55?'forest_moss_rock_cluster':p.size>55?'forest_limestone_boulder':'forest_limestone_rock';
 if(p.kind==='bush')return p.size>45?'forest_round_shrub_large':'forest_round_shrub_medium';
 return null;
}
export const SHADOW_FOREST_COLORS=Object.freeze({
 '#274e35':'#29233e','#47733b':'#4b3b65','#649343':'#71608c','#7ea74b':'#a095ba',
 '#365b35':'#40334f','#5f7f43':'#776283','#365535':'#40334f','#719050':'#776283',
 '#555b4e':'#302b41','#a3987d':'#675a76','#777c60':'#51475f','#e3d7b3':'#a69ab3','#a9ac7c':'#8b7e9b','#c5b99a':'#867994','#8c9469':'#6f637f','#7b7b65':'#453b54',
 '#d3c69a':'#b8a2c4','#8c8865':'#756181','#7e3b2d':'#352b49','#5c4030':'#352b49','#bd5139':'#75608c','#8a5b3b':'#75608c','#e1d6ac':'#b9a6ce','#a9794a':'#a28db8',
 '#45693a':'#5b486c','#e0d9b0':'#9b83ae','#b4a454':'#c1accf','#5e8545':'#79658f','#3f683b':'#493957','#62844b':'#79658f','#72503a':'#55405f','#a1784b':'#8f759b'
});
export function paintForestAsset(c,id,variant=0,style={}){
 const a=FOREST_PROP_ASSETS[id];c.save();c.translate(32,55);
 const colorFor=color=>style.shadow?(SHADOW_FOREST_COLORS[color]||color):color;
 const r=(x,y,w,h,color)=>{c.fillStyle=colorFor(color);c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
 const poly=(points,color)=>{
  c.fillStyle=colorFor(color);
  for(let y=Math.floor(Math.min(...points.map(p=>p[1])));y<Math.ceil(Math.max(...points.map(p=>p[1])));y++){
   const xs=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]<=y+.5&&b[1]>y+.5)||(b[1]<=y+.5&&a[1]>y+.5))xs.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));}
   xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)c.fillRect(Math.round(xs[i]),y,Math.max(1,Math.round(xs[i+1])-Math.round(xs[i])),1);
  }
 };
 const blob=(x,y,rx,ry,color)=>{for(let row=-ry;row<ry;row+=2){const w=Math.floor(Math.sqrt(Math.max(0,1-row*row/(ry*ry)))*rx/2)*2;r(x-w,y+row,w*2,2,color);}};
 const root=(x,y)=>{r(x-2,y-3,3,5,'#365b35');r(x+2,y-5,2,6,'#5f7f43');};
 const rock=(x,y,s,light=true)=>{
  const outline=[[x-15*s,y],[x-19*s,y-17*s],[x-16*s,y-35*s],[x-4*s,y-45*s],[x+10*s,y-42*s],[x+18*s,y-30*s],[x+17*s,y-10*s],[x+10*s,y+1]];
  poly(outline,'#555b4e');poly(outline.map(([px,py])=>[x+(px-x)*.88,y-2+(py-y)*.94]),light?'#a3987d':'#777c60');
  poly([[x-15*s,y-32*s],[x-4*s,y-42*s],[x+9*s,y-38*s],[x+12*s,y-27*s],[x+2*s,y-20*s],[x-13*s,y-24*s]],light?'#e3d7b3':'#a9ac7c');
  poly([[x-12*s,y-22*s],[x+1*s,y-18*s],[x+2*s,y-5*s],[x-10*s,y-7*s]],light?'#c5b99a':'#8c9469');
  // Two fractures explain the whole stone, rather than tracing every facet.
  poly([[x-2*s,y-40*s],[x+1*s,y-29*s],[x-4*s,y-20*s],[x-2*s,y-31*s]],'#7b7b65');
  root(x-14*s,y);root(x+12*s,y+1);
 };
 if(a.family==='stone')rock(0,0,1);
 if(a.family==='moss'){
  rock(-12,0,.48,false);rock(8,-1,.60,false);rock(0,3,.38,false);
  blob(-8,-5,12,4,'#365535');blob(-6,-7,7,3,'#719050');root(-20,2);root(17,1);
 }
 if(a.family==='shrub'&&style.shadow){
  // Same woodland brush and four broad planes, opened into a thorny crescent.
  poly([[-23,0],[-17,-14],[-21,-27],[-26,-30],[-19,-30],[-12,-21],[-6,-18],[3,-25],[12,-36],[18,-37],[15,-32],[10,-22],[18,-16],[24,-23],[23,-14],[17,-7],[19,0]],'#274e35');
  for(const [x,y,rx,ry]of [[-13,-14,12,13],[3,-18,13,13],[16,-11,10,10]]){
   blob(x,y,rx,ry,'#274e35');blob(x-1,y-2,rx*.86,ry*.8,'#47733b');blob(x-3,y-5,rx*.6,ry*.43,'#649343');
  }
  poly([[-10,-16],[-16,-25],[-14,-32],[-10,-34],[-8,-31],[-11,-29],[-10,-24],[-5,-19]],'#47733b');
  poly([[5,-18],[8,-28],[13,-33],[18,-32],[20,-27],[17,-25],[17,-29],[13,-29],[10,-23]],'#649343');r(-15,-19,4,2,'#7ea74b');r(13,-13,3,2,'#7ea74b');
 }else if(a.family==='shrub'){
  blob(0,-16,22,20,'#274e35');blob(-1,-19,19,17,'#47733b');
  blob(-5,-23,13,12,'#649343');blob(-8,-27,7,6,'#7ea74b');
  // A few stepped silhouette teeth; no individual bright leaf speckles.
  r(-17,-30,5,5,'#47733b');r(12,-29,5,6,'#47733b');r(-4,-39,6,4,'#47733b');
 }
 if(a.family==='porcini'||a.family==='agaric'){
  const red=a.family==='agaric',points=a.count===1?[[0,0,1]]:a.count===2?[[-7,0,1],[8,3,.7]]:[[-10,1,.85],[3,-5,1.1],[13,4,.65]];
  for(const [x,y,s]of points){root(x-3,y+2);r(x-2*s,y-12*s,4*s,13*s,'#d3c69a');r(x+1*s,y-10*s,2*s,10*s,'#8c8865');
   if(style.shadow){
    poly([[x-11*s,y-12*s],[x-10*s,y-17*s],[x-3*s,y-24*s],[x+3*s,y-23*s],[x+9*s,y-18*s],[x+12*s,y-10*s],[x+6*s,y-12*s],[x,y-13*s],[x-7*s,y-10*s]],'#5c4030');
    blob(x-1*s,y-18*s,8*s,5*s,'#8a5b3b');r(x-5*s,y-21*s,6*s,2*s,'#a9794a');r(x-8*s,y-12*s,4*s,2*s,'#e1d6ac');continue;
   }
   blob(x,y-14*s,10*s,6*s,red?'#7e3b2d':'#5c4030');blob(x-1*s,y-16*s,8*s,5*s,red?'#bd5139':'#8a5b3b');
   if(red){r(x-5*s,y-19*s,3*s,2*s,'#e1d6ac');r(x+3*s,y-16*s,3*s,2*s,'#e1d6ac');}else r(x-5*s,y-20*s,6*s,2*s,'#a9794a');
  }
 }
 if(a.family==='flower'&&style.shadow){
  for(const [x,y,side]of [[-7,0,-1],[6,-3,1]]){
   root(x,y);poly([[x,y],[x-1,y-19],[x+side*4,y-28],[x+side*10,y-29],[x+side*13,y-24],[x+side*11,y-22],[x+side*8,y-25],[x+side*5,y-24],[x+2,y-17],[x+2,y]],'#45693a');
   const bx=x+side*11,by=y-21;poly([[bx-4,by-3],[bx+3,by-4],[bx+6,by+4],[bx+3,by+3],[bx+1,by+6],[bx-2,by+3],[bx-5,by+5]],'#47733b');r(bx-2,by-2,4,5,'#e0d9b0');r(bx,by+3,2,2,'#b4a454');
   poly([[x,y-4],[x-10,y-10],[x-12,y-16],[x-6,y-14],[x+1,y-7],[x+7,y-16],[x+12,y-17],[x+9,y-9],[x+2,y-3]],'#649343');
  }
 }else if(a.family==='flower'){
  for(const [x,y]of [[-7,0],[5,-3]]){root(x,y);r(x,y-10,2,10,'#45693a');for(const [dx,dy]of [[-3,0],[3,0],[0,-3],[0,3]])r(x+dx,y-12+dy,4,3,'#e0d9b0');r(x,y-12,3,3,'#b4a454');}
 }
 if(a.family==='tuft'&&style.shadow){
  for(const [dx,h]of [[-17,18],[-9,29],[1,35],[11,27],[18,16]]){
   poly([[0,1],[dx*.4-4,-h*.4],[dx-3,-h+6],[dx,-h],[dx+3,-h+6],[dx*.5+4,-h*.5],[2,0]],'#3f683b');poly([[0,-2],[dx*.45-1,-h*.45],[dx-1,-h+5],[dx+1,-h+7],[dx*.5+2,-h*.5]],'#5e8545');
   const x=dx,y=-h;poly([[x-2,y+6],[x-4,y],[x-1,y-5],[x+4,y-6],[x+7,y-2],[x+5,y+2],[x+2,y+2],[x+4,y-1],[x+2,y-2],[x,y],[x+1,y+5]],'#5e8545');
  }
 }else if(a.family==='cattail'||a.family==='tuft'){
  for(let i=0;i<5;i++){const x=(i-2)*6,h=12+hash(i,variant)*17;for(let n=0;n<h;n+=3)r(x*n/h,-n,3,4,i%2?'#5e8545':'#3f683b');}
  if(a.family==='cattail')for(const x of [-7,7]){r(x,-30,2,27,'#62844b');r(x-1,-31,4,10,'#72503a');r(x,-33,2,5,'#a1784b');}
 }
 c.restore();
}
export function drawForestAsset(c,p,time=0,g={}){
 const id=forestAssetFor(p);if(!id)return false;
 const a=FOREST_PROP_ASSETS[id],variant=Math.floor(hash(p.x,p.y)*4),key=id+':'+variant+':'+(p.realmPalette||'forest');
 let sprite=sprites.get(key);if(!sprite){
  if(typeof document==='undefined')return false;
  sprite=document.createElement('canvas');sprite.width=sprite.height=64;paintForestAsset(sprite.getContext('2d'),id,variant,{shadow:p.realmPalette==='shadow'});
  if(a.scale!==1){const base=sprite;sprite=document.createElement('canvas');sprite.width=sprite.height=64;const pen=sprite.getContext('2d');pen.imageSmoothingEnabled=false;pen.drawImage(base,32-Math.round(32*a.scale),55-Math.round(55*a.scale),Math.round(64*a.scale),Math.round(64*a.scale));}
  if(sprites.size>=160)sprites.delete(sprites.keys().next().value);sprites.set(key,sprite);
 }
 const root=p.rootY??p.y+(p.size||48)*.19,scale=(p.size||64)/64;
 c.save();c.imageSmoothingEnabled=false;c.translate(Math.round(p.x),Math.round(root));
 if(['shrub','tuft','cattail','flower'].includes(a.family))c.transform(1,0,vegetationWind(p.x,root,time,vegetationWindStrength(g))*.025+(p.plantBend||0),1,0,0);
 c.scale(scale,scale);c.drawImage(sprite,-32,-55);c.restore();return true;
}
export function* forestUnderstoryTask(seed,cx,cy,allowed){
 const props=[],ids=['forest_porcini_trio','forest_porcini_pair','forest_porcini_single','forest_fly_agaric_pair','forest_fly_agaric_single','forest_woodland_daisy','forest_meadow_tuft','forest_limestone_pebble','forest_moss_rock_scatter'];
 for(let y=80;y<1530;y+=96){yield;for(let x=80;x<1530;x+=96){
  const wx=cx*1600+x+(hash(x+seed,y+cy)-.5)*50,wy=cy*1600+y+(hash(y+seed,x+cx)-.5)*50;
  const roll=hash(wx+seed,wy);if(roll>.27||!allowed(wx,wy))continue;
  const id=ids[Math.floor(hash(wy,wx+seed)*ids.length)];
  props.push({id:`understory:${cx}:${cy}:${x}:${y}`,kind:'forest_understory',forestAsset:id,x:wx,y:wy,rootY:wy,size:42+hash(wx,wy+3)*12,procedural:true});
 }}
 return props;
}
export function createForestUnderstory(seed,cx,cy,allowed){const task=forestUnderstoryTask(seed,cx,cy,allowed);let next;do{next=task.next();}while(!next.done);return next.value;}
