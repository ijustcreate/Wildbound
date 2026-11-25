import {paintForestAsset} from './forest-props.mjs';
import {houseRoofGeometry} from './house-roof.mjs';
import {drawPixelChatText, pixelChatTextWidth} from './pixel-chat-font.mjs';
import {pixelLine, pixelPolygon} from './pixel-shapes.mjs';
import {stationEntrance} from './station-building.mjs';
import {drawInteriorCutawayEdge, drawInteriorFace, paintInteriorMaterial} from './interior-materials.mjs';

const theme = (id, profile, roof, wall, wood, paving, fabric, plant, ornament) =>
  Object.freeze({id, profile, roof, wall, wood, paving, fabric, plant, ornament});

// Ramps go from dark recess to lit edge. The upper-left light and aperture
// sizes follow the wand shop even when roofs and local building materials change.
const designs = Object.freeze({
  jungle: theme('jungle','hip',
    ['#283e38','#40584f','#5a7061','#73836a','#9b9a75'],
    ['#464d3e','#676c53','#818267','#a7a087'],
    ['#42382d','#624833','#8e6444','#c19969'],
    ['#434f43','#616958','#79816d','#9a9a7c'],
    ['#394c40','#577257','#839569'],'forest_moss_rock_pair','ruin'),
  ice: theme('ice','ridge',
    ['#283143','#41516a','#52647d','#788b9d','#c5d4d5'],
    ['#4e555b','#696f75','#94999b','#b3bdba'],
    ['#42382e','#6c4d3a','#9a704b','#c0936c'],
    ['#4c5962','#72838d','#9bafb5','#c1cbcf'],
    ['#4c4440','#9e5e48','#b38164'],'forest_limestone_rock','snow'),
  swamp: theme('swamp','shed',
    ['#303b32','#4b5340','#6e7551','#8b8b60','#ad9f6e'],
    ['#444438','#655944','#88735a','#b09871'],
    ['#38332b','#574632','#795b3d','#ab8152'],
    ['#484437','#655a45','#837659','#a79872'],
    ['#3b4f42','#557762','#6d9878'],'forest_cattail_tuft','stilt'),
  east: theme('east','cross',
    ['#2e3838','#3c5852','#526e59','#77856b','#a2a483'],
    ['#4a4836','#766e50','#a59874','#d0bd98'],
    ['#3f3127','#685036','#976f47','#c89762'],
    ['#404e3e','#626e58','#89916e','#a4ad8d'],
    ['#404a37','#65744e','#95a478'],'forest_round_shrub_small','leaf'),
  beach: theme('beach','gable',
    ['#48342c','#754638','#a16d51','#c28f68','#d5a276'],
    ['#68634e','#969273','#c7b68f','#e1cca7'],
    ['#463c2f','#6e5b44','#ad8e62','#d8b789'],
    ['#706958','#96937c','#b0ad91','#c6bd9f'],
    ['#3f5251','#618b87','#8eb4a5'],'forest_limestone_pebble','sun'),
  house: theme('house','cross',
    ['#493638','#784e44','#9a6b58','#bd8b70','#d3a586'],
    ['#63564a','#8e795e','#bba27b','#ddc79a'],
    ['#4e362c','#775038','#ac764d','#d4a36b'],
    ['#505348','#747766','#9b997c','#b7ac8f'],
    ['#51413f','#84554c','#af7966'],'forest_woodland_daisy','shield'),
  graveyard: theme('graveyard','steep',
    ['#292f37','#404756','#57596a','#716d7a','#928a8e'],
    ['#45494a','#666663','#86827a','#a49b8b'],
    ['#373331','#544439','#836c52','#ae8e65'],
    ['#494c4b','#626766','#7f8176','#a19d8b'],
    ['#473b49','#66516a','#8d7590'],'forest_limestone_stone','arch'),
  west: theme('west','hip',
    ['#344851','#476371','#5c7b84','#749a9f','#a1b8b7'],
    ['#5d6052','#87836b','#b0a88a','#d5c7a3'],
    ['#494437','#726249','#9f865d','#cbb288'],
    ['#5f6758','#828c75','#9da68a','#bec1a4'],
    ['#434e5b','#62798a','#8ca3a7'],'forest_meadow_tuft','wave'),
  lakewood: theme('lakewood','gable',
    ['#283e42','#436059','#58746b','#7b8d73','#a4ad83'],
    ['#4a4c3c','#656c53','#929578','#b5b396'],
    ['#42382b','#69523b','#9d7952','#c7a475'],
    ['#455144','#677765','#879177','#a6a687'],
    ['#414d3a','#637955','#8b9a6e'],'forest_round_shrub_small','wave'),
});
const names = Object.freeze({
  'jungle ruins':'jungle', frostmere:'ice', bayou:'swamp', 'east forest':'east',
  'south beach':'beach', homestead:'house', cemetery:'graveyard', 'west beach':'west',
});

export function stationVisualTheme(s) {
  return designs[s.visualId || names[s.name?.toLowerCase()]] || designs.lakewood;
}

function fill(c,x,y,w,h,color) {
  if (w <= 0 || h <= 0) return;
  c.fillStyle=color;
  c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));
}
function shape(c,points,color) {
  pixelPolygon(c,points.map(([x,y])=>({x,y})),color);
}
function line(c,x,y,xe,ye,color,width=1) {
  pixelLine(c,{x,y},{x:xe,y:ye},color,width);
}
function path(c,points) {
  c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.closePath();
}
function layout(s) {
  return {left:Math.round(s.x-s.w/2),right:Math.round(s.x+s.w/2),
    top:Math.round(s.y-s.h/2),bottom:Math.round(s.y+s.h/2),entry:stationEntrance(s)};
}
const stationLayers = new WeakMap();
function rasterLayer(c,s,key,box,painter) {
  if (typeof document==='undefined' || box.w*box.h>420000) {
    painter(c);
    return;
  }
  let layers=stationLayers.get(s);
  if (!layers) stationLayers.set(s,layers=new Map());
  const signature=[s.x,s.y,s.w,s.h,s.doorSide,s.visualId,s.name,box.x,box.y,box.w,box.h].join('|');
  let saved=layers.get(key);
  if (!saved || saved.signature!==signature) {
    const canvas=document.createElement('canvas');
    canvas.width=box.w;
    canvas.height=box.h;
    const pen=canvas.getContext('2d');
    pen.imageSmoothingEnabled=false;
    pen.translate(-box.x,-box.y);
    painter(pen);
    saved={canvas,signature};
    layers.set(key,saved);
  }
  c.save();
  c.imageSmoothingEnabled=false;
  c.drawImage(saved.canvas,box.x,box.y);
  c.restore();
}

function steppedPool(c,x,y,rx,ry,strength=1) {
  for (const [scale,alpha] of [[1,.05],[.76,.08],[.48,.12]]) {
    const w=rx*scale,h=ry*scale;
    shape(c,[[x-w,y],[x-w*.68,y-h*.74],[x-w*.26,y-h],[x+w*.36,y-h],
      [x+w*.73,y-h*.64],[x+w,y+1],[x+w*.63,y+h*.77],[x+w*.18,y+h],
      [x-w*.43,y+h*.9],[x-w*.83,y+h*.54]],'rgba(252,190,108,'+alpha*strength+')');
  }
}

function pavers(c,outline,box,colors,kind='stone') {
  shape(c,outline,colors[0]);
  c.save();
  path(c,outline);
  c.clip();
  const brick=kind==='timber';
  const rows=brick?10:14,cols=brick?35:22;
  for(let row=0;row*rows<box.h;row++) {
    const y=box.y+row*rows;
    for(let col=-1;col*cols<box.w;col++) {
      const x=box.x+col*cols+(row%2)*Math.floor(cols/2);
      const k=((row*19+col*7+row*col*3)%11+11)%11;
      const w=cols-1,h=rows-1;
      shape(c,[[x,y+3],[x+3,y],[x+w-2,y],[x+w,y+2],[x+w,y+h-2],
        [x+w-3,y+h],[x+2,y+h],[x,y+h-2]],colors[k<4?1:2]);
      if(k%3===0) fill(c,x+3,y+1,w-7,1,colors[3]);
      if(k===2) fill(c,x+w-7,y+h-3,5,2,colors[0]);
    }
  }
  c.restore();
}

function approach(s,entry) {
  if (s.platformLanding) return s.platformLanding;
  // Older authored Lakewood layouts still lead to their existing landing.
  return {x:s.x,y:s.platformY};
}

function plantAt(c,x,y,id,variant,scale=.74) {
  c.save();
  c.translate(Math.round(x),Math.round(y));
  c.scale(scale,scale);
  c.translate(-32,-55);
  paintForestAsset(c,id,variant);
  c.restore();
}

function paintForecourt(c,s,t) {
  const {left,right,top,bottom,entry}=layout(s);
  const end=approach(s,entry);
  const timber=t.id==='swamp';
  const pathInk=t.paving;
  const apron=[[left-27,top-8],[left-18,top-20],[left+27,top-29],
    [right-56,top-26],[right-13,top-19],[right+22,top-10],[right+30,top+12],
    [right+28,bottom+36],[right+6,bottom+53],[right-42,bottom+53],
    [left+42,bottom+51],[left-16,bottom+44],[left-30,bottom+24]];
  pavers(c,apron,{x:left-31,y:top-29,w:s.w+64,h:s.h+84},pathInk,timber?'timber':'stone');

  const dx=end.x-entry.x,dy=end.y-entry.y,len=Math.hypot(dx,dy)||1;
  const ax=dy/len*29,ay=-dx/len*29;
  const route=[[entry.x+ax,entry.y+ay],[end.x+ax,end.y+ay],[end.x-ax,end.y-ay],[entry.x-ax,entry.y-ay]];
  pavers(c,route,{x:Math.floor(Math.min(entry.x,end.x)-30),y:Math.floor(Math.min(entry.y,end.y)-30),
    w:Math.ceil(Math.abs(dx)+60),h:Math.ceil(Math.abs(dy)+60)},pathInk,timber?'timber':'stone');

  // Low vegetation stays outside the avenue and uses the forest's own contours.
  const pockets=[[left-22,top+22,0,.63],[right+18,top+21,1,.62],
    [left+46,bottom+42,2,.72],[right-37,bottom+45,3,.68]];
  for(const [x,y,v,scale] of pockets) {
    const px=x-entry.x,py=y-entry.y;
    const k=Math.max(0,Math.min(1,(px*dx+py*dy)/(len*len)));
    if(Math.hypot(px-k*dx,py-k*dy)<58) continue;
    shape(c,[[x-19,y-5],[x-12,y-13],[x+7,y-15],[x+19,y-9],[x+21,y+1],
      [x+11,y+6],[x-12,y+4]],t.id==='ice'?'#a7bbc1':'#4d6046');
    fill(c,x-16,y-2,14,5,'#2b3e344a');
    plantAt(c,x,y,t.plant,v,scale);
    if (t.id==='jungle'||t.id==='east') plantAt(c,x+14,y+2,'forest_meadow_tuft',v,.5);
  }

  const shade='#29352b4d';
  shape(c,[[left-3,bottom-3],[right-2,bottom-3],[right+19,bottom+8],
    [right+15,bottom+16],[left+17,bottom+14]],shade);
  fill(c,left,bottom-1,s.w,4,'#29342c77');
  if(timber) {
    for(const x of [left+12,left+84,right-84,right-12]) {
      fill(c,x-6,bottom-4,12,15,t.wood[0]);
      fill(c,x-5,bottom-4,7,13,t.wood[2]);
      fill(c,x-5,bottom-5,8,2,t.wood[3]);
    }
  }
}
export function drawStationForecourt(c,s) {
  const {left,right,top,bottom,entry}=layout(s),end=approach(s,entry),t=stationVisualTheme(s);
  const x=Math.floor(Math.min(left-45,end.x-32)),y=Math.floor(Math.min(top-46,end.y-32));
  const box={x,y,w:Math.ceil(Math.max(right+46,end.x+32)-x),
    h:Math.ceil(Math.max(bottom+67,end.y+32)-y)};
  rasterLayer(c,s,'court',box,pen=>paintForecourt(pen,s,t));
}

function paintRoofPlane(c,points,color,s,t,index) {
  shape(c,points,color);
  c.save();
  path(c,points);
  c.clip();
  const {left,right,top,bottom}=layout(s);
  const slim=t.id==='swamp';
  const rowHeight=slim?7:9;
  for(let row=0,y=top-93;y<bottom-30;y+=rowHeight,row++) {
    fill(c,left-28,y,s.w+56,1,index===0?t.roof[0]+'62':t.roof[0]+'81');
    const start=left-25+(row%2)*10;
    for(let n=0,x=start;x<right+18;x+=slim?28:20,n++) {
      if((n+row*3+index*2)%7===0) {
        fill(c,x+1,y+1,Math.min(12,right+20-x),2,t.roof[4]+'50');
      }
      if((n+row)%3!==1) fill(c,x,y+2,1,rowHeight-3,t.roof[0]+'66');
    }
  }
  c.restore();
}

function roofPlanes(s,t) {
  const {left,right,top,bottom}=layout(s);
  // The native house roof supplies the wall projection and overhang. A railway
  // hall develops that footprint as a long ridge or a low single-slope roof.
  const geometry=houseRoofGeometry({x:left,y:top,w:s.w,h:s.h});
  const [nw,ne,se,sw]=geometry.perimeter.map(([x,y],i)=>[x,y-(i<2?25:42)]);
  const mid=(nw[1]+sw[1])/2;
  const cutoff=t.profile==='steep'?29:t.profile==='ridge'?19:9;
  const x1=left+cutoff-7,x2=right-cutoff+7;
  const rise=t.profile==='steep'?27:t.profile==='ridge'?18:11;
  const a=[x1,mid-rise],b=[x2,mid-rise];
  if(t.profile==='hip'){
    a[0]=left+Math.min(72,s.w*.18);
    b[0]=right-Math.min(72,s.w*.18);
    return {outline:[nw,ne,se,sw],planes:[[nw,ne,b,a],[nw,a,sw],[ne,se,b],[a,b,se,sw]],ridge:[a,b]};
  }
  if(t.profile==='shed'){
    const t0=[nw[0]+3,nw[1]+10],t1=[ne[0]-3,ne[1]-3];
    return {outline:[t0,t1,se,sw],planes:[[t0,t1,se,sw]],ridge:[t0,t1]};
  }
  const corners=[[nw[0]+4,nw[1]+6],[ne[0]-4,ne[1]+6],se,sw];
  return {outline:corners,planes:[[corners[0],corners[1],b,a],[corners[0],a,sw],
    [corners[1],se,b],[a,b,se,sw]],ridge:[a,b]};
}

function trim(c,x,y,w,t,dim=false) {
  fill(c,x,y,w,6,t.wood[0]);
  fill(c,x+1,y+1,w-2,2,dim?t.wood[2]:t.wood[3]);
  fill(c,x+3,y+4,w-6,2,t.wood[1]);
}

function cap(c,x,y,t) {
  const dark=t.wall[0],base=t.wall[1],light=t.wall[3];
  shape(c,[[x-10,y+27],[x-10,y+1],[x-8,y-7],[x+9,y-7],
    [x+15,y-2],[x+14,y+25],[x+9,y+30],[x-7,y+31]],dark);
  fill(c,x-8,y+1,15,27,t.wall[2]);
  fill(c,x+7,y+1,6,26,base);
  for(const h of [7,14,21]) {
    fill(c,x-8,y+h,15,1,base);
    fill(c,x-8+(h%2)*7,y+h-6,1,6,base);
  }
  fill(c,x-12,y-6,28,6,dark);
  fill(c,x-11,y-8,23,5,light);
  fill(c,x-8,y-7,16,3,t.roof[0]);
}

function gable(c,x,y,w,h,t,glass=true) {
  const l=x-w/2,r=x+w/2;
  shape(c,[[l-3,y+3],[l-3,y],[x,y-h-3],[r+3,y],[r+3,y+3]],t.wood[0]);
  shape(c,[[l,y],[x,y-h],[r,y]],t.wood[2]);
  shape(c,[[x,y-h],[r,y],[x+7,y],[x+2,y-h+6]],t.wood[1]);
  line(c,l,y,x,y-h,t.wood[3],2);
  line(c,x,y-h,r,y,t.wood[0],2);
  if(glass) {
    fill(c,x-6,y-13,12,11,t.wood[0]);
    fill(c,x-4,y-11,8,7,'#bb915d');
    fill(c,x-3,y-11,2,4,'#edbf7d');
    fill(c,x,y-11,1,7,t.wood[1]);
  }
}

function crest(c,x,y,t) {
  shape(c,[[x-10,y-6],[x-7,y-10],[x+7,y-10],[x+10,y-6],
    [x+9,y+5],[x,y+9],[x-9,y+5]],t.roof[0]);
  shape(c,[[x-7,y-6],[x-5,y-8],[x+5,y-8],[x+7,y-6],
    [x+6,y+4],[x,y+6],[x-6,y+4]],t.wood[2]);
  const accent='#e0c795';
  const symbols={
    ruin:[[-4,2,-4,-4],[-4,-4,3,-4],[3,-4,3,2],[-5,2,5,2]],
    snow:[[0,-5,0,4],[-4,-2,4,2],[-4,2,4,-2]],
    stilt:[[-5,-1,5,-1],[-4,2,4,2],[-3,-4,-3,4],[3,-4,3,4]],
    leaf:[[-4,4,4,-5],[-3,2,-4,-2],[-1,0,4,0]],
    sun:[[-3,0,3,0],[0,-4,0,4],[-4,-3,3,3],[-3,3,4,-3]],
    shield:[[-3,-4,3,-4],[-3,-4,-3,1],[3,-4,3,1],[-3,1,0,4],[0,4,3,1]],
    arch:[[-4,3,-4,-1],[-4,-1,0,-5],[0,-5,4,-1],[4,-1,4,3]],
    wave:[[-5,0,-2,-2],[-2,-2,2,1],[2,1,5,-1],[-4,3,4,3]],
  };
  for(const [a,b,d,e] of symbols[t.ornament]) line(c,x+a,y+b,x+d,y+e,accent);
}

function nameboard(c,s,t,y) {
  const title=(s.name||'Lakewood').toUpperCase();
  const textWidth=pixelChatTextWidth(title);
  const scale=textWidth*2+25<=s.w-64?2:1;
  const w=Math.min(s.w-50,textWidth*scale+38),x=s.x-w/2;
  shape(c,[[x+4,y],[x+w-4,y],[x+w,y+4],[x+w,y+20],[x+w-4,y+23],
    [x+4,y+23],[x,y+20],[x,y+4]],t.roof[0]);
  fill(c,x+5,y+2,w-10,2,t.wood[3]);
  fill(c,x+5,y+20,w-10,1,t.wood[2]);
  c.save();
  c.translate(Math.round(s.x-textWidth*scale/2),Math.round(y+(23-7*scale)/2));
  c.scale(scale,scale);
  drawPixelChatText(c,title,0,0,'#eddbac');
  c.restore();
}

function paintRoof(c,s,t) {
  const {left,right,top,bottom}=layout(s);
  const geometry=roofPlanes(s,t);
  const palette=t.profile==='shed'?[t.roof[2]]:[t.roof[1],t.roof[3],t.roof[1],t.roof[2]];
  shape(c,geometry.outline.map(([x,y])=>[x,y+4]),t.roof[0]);
  geometry.planes.forEach((plane,i)=>paintRoofPlane(c,plane,palette[i],s,t,i));
  const [a,b]=geometry.ridge;
  line(c,a[0],a[1]+2,b[0],b[1]+2,t.roof[0],3);
  line(c,a[0],a[1],b[0],b[1],t.roof[3],2);
  if(t.ornament==='snow'){
    for(const [x,w,y] of [[left+15,87,top-51],[right-126,102,top-50],[s.x-36,58,top-54]]) {
      shape(c,[[x,y-2],[x+w-3,y-2],[x+w,y+3],[x+w-20,y+5],[x+w*.45,y+2],[x+5,y+6]],'#b7c8cc');
      fill(c,x+4,y-2,w-19,2,'#d0dbd8');
    }
  } else if(t.ornament==='ruin'||t.ornament==='leaf'){
    for (const [x,y,w] of [[left+13,bottom-66,59],[right-69,bottom-65,48]]) {
      shape(c,[[x,y+6],[x+7,y],[x+w*.45,y+2],[x+w-5,y+8],[x+w,y+12],[x+3,y+12]],'#5d6e4b');
      fill(c,x+9,y+2,w*.37,3,'#76805a');
    }
  }
  cap(c,t.id==='ice'?left+60:right-69,top-65,t);
  if(t.profile==='cross'){
    for(const x of [s.x-s.w*.2,s.x+s.w*.2]) gable(c,x,bottom-51,77,40,t);
  } else if(t.profile==='steep'){
    gable(c,s.x,bottom-51,116,55,t);
  } else if(t.profile!=='shed') {
    gable(c,s.x,bottom-51,t.id==='jungle'?94:108,33,t);
  }
  trim(c,left-14,bottom-54,s.w+28,t);
}

export function stationEntranceLights(s) {
  const {left,right,bottom,entry}=layout(s);
  const themes=stationVisualTheme(s);
  const pins=[{x:left+48,y:bottom-1},{x:right-48,y:bottom-1}];
  // The physical center of the two doorway lamps is outside the collision lane.
  if(entry.side!=='south'){
    const sign=entry.nx||entry.ny;
    pins.push({x:entry.x+(entry.nx?sign*3:48),y:entry.y+(entry.ny?sign*3:48)});
    pins.push({x:entry.x+(entry.nx?sign*3:-48),y:entry.y+(entry.ny?sign*3:-48)});
  }
  return pins.map((p,i)=>({...p,r:themes.id==='graveyard'?62:70,raise:i<2?19:22}));
}

function wallLantern(c,x,y,t) {
  const ink='#343b31';
  line(c,x-7,y-26,x+5,y-26,t.wood[0],2);
  shape(c,[[x-7,y-18],[x-5,y-24],[x+4,y-24],[x+7,y-20],
    [x+6,y-11],[x+8,y-9],[x-8,y-9],[x-6,y-11]],ink);
  fill(c,x-4,y-21,8,9,'#cf9c5c');
  fill(c,x-3,y-20,4,6,'#efc47d');
  fill(c,x-2,y-19,2,4,'#ffe8a8');
  fill(c,x+3,y-21,1,10,'#8b6a4a');
  fill(c,x-6,y-23,11,1,'#aa9463');
}

function threshold(c,s,t) {
  const {entry}=layout(s);
  const horizontal=entry.ny!==0;
  const x=entry.x-(horizontal?37:8),y=entry.y-(horizontal?8:37);
  const w=horizontal?74:16,h=horizontal?16:74;
  fill(c,x-1,y+2,w+2,h+2,t.wall[0]);
  fill(c,x,y,w,h,t.wall[2]);
  fill(c,x+2,y+1,w-4,2,t.wall[3]);
  fill(c,x+2,y+h-4,w-3,2,t.wall[1]);
  for(const i of [21,48]) fill(c,x+(horizontal?i:2),y+(horizontal?2:i),horizontal?1:w-4,horizontal?h-4:1,t.wall[1]);
}

function doorFrame(c,s,t) {
  const {entry}=layout(s);
  const x=entry.x,y=entry.y;
  if(entry.ny!==0) {
    for(const at of [-40,40]) {
      fill(c,x+at-5,y-46,10,48,t.wood[0]);
      fill(c,x+at-4,y-43,5,42,t.wood[2]);
      fill(c,x+at-4,y-43,1,38,t.wood[3]);
    }
    shape(c,[[x-48,y-44],[x-38,y-54],[x+38,y-54],[x+48,y-44],
      [x+46,y-38],[x-46,y-38]],t.wood[0]);
    trim(c,x-45,y-46,90,t);
    crest(c,x,y-62,t);
  } else {
    const side=entry.nx;
    // The side-facing lintel is foreshortened; the world-space sill is full length.
    shape(c,[[x-side*12,y-52],[x+side*22,y-47],[x+side*22,y-41],
      [x-side*12,y-45]],t.wood[0]);
    line(c,x-side*10,y-51,x+side*19,y-46,t.wood[3],2);
    for(const at of [-37,37]) {
      fill(c,x-4,y+at-41,9,43,t.wood[0]);
      fill(c,x-3,y+at-39,5,37,t.wood[2]);
      fill(c,x-2,y+at-38,1,34,t.wood[3]);
    }
    crest(c,x+side*17,y-46,t);
  }
}

function brickFace(c,x,y,w,h,t) {
  fill(c,x,y,w,h,t.wall[1]);
  for(let row=0;row*9<h;row++) {
    const yy=y+row*9;
    for(let col=-1;col*26<w;col++) {
      const a=x+col*26+(row%2)*13;
      const start=Math.max(a,x),end=Math.min(a+25,x+w);
      const k=((row+col*2)%4+4)%4;
      fill(c,start,yy,end-start,Math.min(8,y+h-yy),t.wall[k===3?1:2]);
      if((col+row)%3===0) fill(c,start+1,yy,Math.max(0,end-start-3),1,t.wall[3]);
    }
  }
}

function litBay(c,x,y,w,h,t,broken=false) {
  shape(c,[[x,y],[x+4,y-5],[x+w-4,y-5],[x+w,y],[x+w,y+h],[x,y+h]],t.wood[0]);
  if(!broken) {
    fill(c,x+3,y,w-6,h-3,'#b98c5c');
    fill(c,x+4,y+1,w-8,Math.ceil(h*.43),'#e1b879');
    shape(c,[[x+5,y],[x+w*.45,y],[x+10,y+h-5],[x+5,y+h-5]],'#eed29e');
    fill(c,x+Math.floor(w*.5),y,2,h-3,t.wood[1]);
    fill(c,x+3,y+Math.floor(h*.56),w-6,2,t.wood[1]);
  } else {
    fill(c,x+3,y,w-6,h-3,'#48514a');
  }
  fill(c,x-2,y+h-1,w+4,3,t.wood[3]);
  fill(c,x-1,y+h+2,w+2,3,t.wood[1]);
}

function wallStrip(c,asset,t,front) {
  const {x,y,w,h}=asset;
  // Body sits directly above the original, destructible floor-level base.
  const height=front?56:29,base=y+h;
  const yr=base-height;
  if(w<=h) {
    fill(c,x,yr,w,h+height-4,t.wall[0]);
    fill(c,x+2,yr+2,w-4,h+height-8,t.wall[1]);
    fill(c,x+2,yr+2,2,h+height-8,t.wall[3]+'aa');
    return;
  }
  fill(c,x,yr,w,height,t.wall[0]);
  brickFace(c,x+1,yr+1,w-2,height-5,t);
  fill(c,x,base-5,w,3,t.wood[1]);
  fill(c,x,base-2,w,2,t.wall[0]);
  if(asset.kind==='window') litBay(c,x+2,yr+(front?7:1),w-4,18,t,asset.broken);
  else for(let xx=x+3;xx<x+w-2;xx+=Math.max(46,w-6)) {
    fill(c,xx,yr+1,5,height-2,t.wood[0]);
    fill(c,xx+1,yr+1,2,height-4,t.wood[3]);
  }
}

function insideWallStrip(c,asset,t) {
  const {x,y,w,h}=asset,base=y+h;
  const height=44,top=base-height;
  const [edge,shade,body,light]=t.wall;
  const [ink,woodShade,woodBody,woodLight]=t.wood;
  const material=t.id==='jungle'||t.id==='graveyard'?'masonry':
    t.id==='swamp'||t.id==='house'?'panel':'plaster';
  const palette=material==='panel'?[ink,woodShade,woodBody,t.wall[2],woodLight,woodShade]:
    [edge,shade,body,light,light,shade];
  drawInteriorFace(c,{x,y:base,w,height,material,palette,trim:[ink,woodBody,woodLight]});
  // A narrow wainscot below the glass gives each panel a lit rail, a recessed
  // center and a dark meeting point with the floor. Keep it on the existing wall.
  if(w>=8){
    fill(c,x+1,base-15,w-2,12,woodShade);
    fill(c,x+2,base-14,w-4,1,woodLight);
    for(let x0=x+4;x0<x+w-5;x0+=28){
      const length=Math.min(23,x+w-3-x0);
      if(length<5)break;
      fill(c,x0,base-11,length,6,ink);
      fill(c,x0+1,base-10,length-2,4,woodBody);
      fill(c,x0+2,base-10,length-4,1,woodLight+'98');
    }
    fill(c,x+1,base-3,w-2,2,woodBody);
  }
  if(asset.kind==='window'&&w>=14){
    litBay(c,x+3,base-35,w-6,16,t,asset.broken);
  }else if(w>=25){
    fill(c,x+4,top+2,3,27,woodShade);
    fill(c,x+4,top+3,1,25,woodLight+'a8');
  }
}

function faces(c,s,house,t,inside) {
  if(!house) return;
  const {top,bottom}=layout(s);
  for(const b of house.walls) {
    if(b.destroyed||b.sectionDamage) continue;
    const back=b.id?.includes(':north-') || b.y<top+5&&b.h<b.w;
    const front=b.id?.includes(':south-') || b.y>=bottom-19&&b.h<=b.w;
    if(inside&&back)insideWallStrip(c,b,t);
    else if(!inside&&front)wallStrip(c,b,t,true);
  }
}
function freshRect(s,padding) {
  const {left,right,top,bottom}=layout(s),[x,y,xd,yd]=padding;
  return {x:left-x,y:top-y,w:(right-left)+x+xd,h:(bottom-top)+y+yd};
}
function facesIntact(house) {
  return house && house.walls.every(b=>!b.destroyed&&!b.broken&&!b.sectionDamage);
}

export function drawStationBackwall(c,s,house) {
  const t=stationVisualTheme(s);
  if(!facesIntact(house)) {
    faces(c,s,house,t,true);
    return;
  }
  rasterLayer(c,s,'interior-wall',freshRect(s,[4,44,4,0]),pen=>faces(pen,s,house,t,true));
}

export function drawStationBuilding(c,s,inside,house=null) {
  if(inside) return;
  const t=stationVisualTheme(s);
  const bounds=freshRect(s,[32,87,32,20]);
  const faceIsIntact=facesIntact(house);
  if(!faceIsIntact) faces(c,s,house,t,false);
  rasterLayer(c,s,faceIsIntact?'closed':'roof',bounds,pen=>{
    // Keep foundations and doors part of the scene, so their movement and
    // interaction points stay aligned when the far roof cuts away.
    const {bottom,entry}=layout(s);
    if(faceIsIntact) faces(pen,s,house,t,false);
    if(entry.side==='north') doorFrame(pen,s,t);
    const lamps=stationEntranceLights(s);
    if(entry.side==='north') for(const lamp of lamps.slice(2)) wallLantern(pen,lamp.x,lamp.y,t);
    paintRoof(pen,s,t);
    if(entry.side!=='north') doorFrame(pen,s,t);
    for(const lamp of entry.side==='north'?lamps.slice(0,2):lamps) wallLantern(pen,lamp.x,lamp.y,t);
    nameboard(pen,s,t,bottom-(entry.side==='south'?51:46));
  });
}

function runner(c,s,t) {
  const {entry}=layout(s);
  const horizontal=entry.nx!==0;
  const cx=horizontal?s.x:entry.x;
  const cy=horizontal?entry.y:s.y;
  const w=horizontal?s.w-60:48,h=horizontal?44:s.h-48;
  const x=cx-w/2,y=cy-h/2;
  const [dark,base,light]=t.fabric;
  shape(c,[[x+2,y],[x+w-2,y],[x+w,y+3],[x+w,y+h-2],[x+w-3,y+h],
    [x+3,y+h],[x,y+h-2],[x,y+3]],dark);
  paintInteriorMaterial(c,{x:x+3,y:y+2,w:w-6,h:h-4},'carpet',[dark,base,base,light,light,dark]);
  fill(c,x+6,y+5,w-12,1,light);
  fill(c,x+6,y+h-6,w-12,1,light);
  fill(c,x+6,y+5,1,h-10,light);
  fill(c,x+w-7,y+5,1,h-10,light);
  for(let k=0;k<(horizontal?w-30:h-24);k+=24) {
    const xx=horizontal?x+15+k:cx;
    const yy=horizontal?cy:y+12+k;
    shape(c,[[xx-5,yy],[xx,yy-3],[xx+5,yy],[xx,yy+3]],light);
  }
}

export function drawStationFloorDetails(c,s) {
  const t=stationVisualTheme(s);
  rasterLayer(c,s,'floor-details',freshRect(s,[36,14,36,36]),pen=>{
    runner(pen,s,t);
    threshold(pen,s,t);
    const {entry,left,right,top,bottom}=layout(s);
    steppedPool(pen,entry.x+entry.nx*16,entry.y+entry.ny*16,34,19,.7);
    for(const x of [left+55,right-55]) steppedPool(pen,x,top+25,45,18,.65);
    for(const x of [left+48,right-48]) steppedPool(pen,x,bottom+19,30,17,.7);
  });
}

export function drawStationLightPool(c,l,night) {
  // Pools strengthen at night without casting a blurred circle over the roof.
  steppedPool(c,l.x,l.y+4,Math.min(38,l.r*.54),Math.min(23,l.r*.28),night?1.6:.38);
  if(l.raise) steppedPool(c,l.glass?.x??l.x+1,l.glass?.y??l.y-l.raise,11,9,night?1.8:.32);
}

function support(c,f,t) {
  const {x,y,w,h}=f;
  shape(c,[[x+2,y+h-3],[x+w-2,y+h-3],[x+w+5,y+h+3],
    [x+w-3,y+h+7],[x+2,y+h+7],[x-1,y+h+3]],'#282f285c');
  fill(c,x+4,y+h-6,5,7,t.wood[0]);
  fill(c,x+w-9,y+h-6,5,7,t.wood[0]);
}

function seating(c,f,t) {
  const {x,y,w,h}=f;
  const [woodDark,woodBody,woodLit]=t.wood;
  const [recess,cloth,stitch]=t.fabric;
  support(c,f,t);
  if(w>h) {
    shape(c,[[x,y+2],[x+4,y-5],[x+w-5,y-5],[x+w,y+1],
      [x+w,y+h-5],[x+w-5,y+h-2],[x+4,y+h-2],[x,y+h-6]],woodDark);
    fill(c,x+4,y-3,w-9,12,woodBody);
    fill(c,x+6,y-2,w-13,1,t.wood[3]);
    fill(c,x+6,y+9,w-13,h-14,recess);
    fill(c,x+8,y+10,w-17,h-17,cloth);
    fill(c,x+11,y+11,w-23,1,stitch);
    fill(c,x+2,y+7,5,h-12,woodLit);
    fill(c,x+w-7,y+7,5,h-12,woodBody);
    fill(c,x+5,y+h-5,w-10,2,woodLit);
    for(let a=25;a<w-12;a+=32) fill(c,x+a,y-1,1,7,woodDark);
    return;
  }
  shape(c,[[x,y+6],[x+4,y],[x+w-5,y],[x+w,y+4],[x+w,y+h-6],
    [x+w-4,y+h-2],[x+3,y+h-2],[x,y+h-5]],woodDark);
  fill(c,x+3,y+4,w-6,h-9,recess);
  fill(c,x+8,y+6,w-13,h-13,cloth);
  fill(c,x+9,y+8,2,h-17,stitch);
  fill(c,x+2,y+4,7,h-10,woodBody);
  fill(c,x+3,y+5,2,h-15,woodLit);
  for(const at of [6,h-9]) {
    fill(c,x+6,y+at,w-12,5,woodBody);
    fill(c,x+7,y+at,w-14,1,woodLit);
  }
  fill(c,x+8,y+Math.floor(h/2),w-13,1,recess);
}

function tabletop(c,f,t,isDesk) {
  const {x,y,w,h}=f;
  support(c,f,t);
  const top=y-(isDesk?10:6),face=y+h-(isDesk?13:10);
  shape(c,[[x,y+h-4],[x,top+6],[x+6,top],[x+w-6,top],[x+w,top+6],
    [x+w,y+h-4],[x+w-4,y+h-1],[x+4,y+h-1]],t.wood[0]);
  const edge=face-2;
  shape(c,[[x+2,edge],[x+2,top+6],[x+7,top+2],[x+w-7,top+2],
    [x+w-3,top+6],[x+w-3,edge]],t.wood[2]);
  fill(c,x+7,top+3,w-16,2,t.wood[3]);
  fill(c,x+3,edge-2,w-7,2,t.wood[3]);
  fill(c,x+4,face,w-8,h-(face-y)-3,t.wood[1]);
  if(isDesk) {
    fill(c,x+7,face+2,w-15,Math.min(6,y+h-face-4),t.wood[2]);
    for(const a of [x+12,x+w-16]) fill(c,a,face+4,5,2,t.wood[3]);
    // Tucked dispatch ledger and the ticket bell share the actual desk plane.
    fill(c,x+13,top+9,21,10,'#5e483b');
    fill(c,x+14,top+8,18,8,'#dfc698');
    fill(c,x+22,top+9,1,6,'#9d865e');
    fill(c,x+16,top+11,4,1,'#ab8e66');
    fill(c,x+25,top+12,4,1,'#ab8e66');
    const bell=x+w-19;
    fill(c,bell-5,top+15,10,2,'#524a34');
    shape(c,[[bell-4,top+15],[bell-3,top+11],[bell,top+8],[bell+3,top+11],
      [bell+4,top+15]],'#c4a15e');
    fill(c,bell-2,top+11,3,2,'#ecd295');
  } else {
    const cx=x+w/2;
    fill(c,cx-9,top+12,19,9,t.fabric[0]);
    fill(c,cx-7,top+10,14,8,'#e9d5a8');
    fill(c,cx-5,top+12,9,1,'#818170');
    fill(c,cx-5,top+15,7,1,'#a28c62');
  }
}

function dispatchCubby(c,f,t) {
  const {x,y,w,h}=f,top=y-25,base=y+h;
  support(c,f,t);
  shape(c,[[x,top+3],[x+4,top],[x+w-3,top],[x+w,top+3],[x+w,base-2],
    [x+w-4,base],[x+4,base],[x,base-3]],t.wood[0]);
  fill(c,x+3,top+1,w-7,3,t.wood[3]);
  fill(c,x+4,top+5,w-8,base-top-9,t.wood[1]);
  const paints=[t.fabric[1],'#9e7c53','#948473','#686b73'];
  for(let row=0;row<3;row++) {
    const off=top+7+row*12;
    fill(c,x+6,off+10,w-12,2,t.wood[3]);
    for(let col=0;col<4;col++) {
      const dx=x+8+col*12+(row%2);
      const m=(row*3+col)%paints.length;
      fill(c,dx,off+3,11,6,paints[m]);
      fill(c,dx+3,off+5,5,1,'#c8b68e');
    }
  }
}

export function drawStationFurniture(c,f,s) {
  const t=stationVisualTheme(s);
  if(f.kind==='bench'||f.kind==='sofa'){
    seating(c,f,t);
    return true;
  }
  if(f.kind==='table'||f.kind==='counter'){
    tabletop(c,f,t,f.kind==='counter');
    return true;
  }
  if(f.kind==='bookcase'){
    dispatchCubby(c,f,t);
    return true;
  }
  if(f.kind==='plant'){
    const x=f.x+f.w/2,y=f.y+f.h;
    plantAt(c,x,y-8,'forest_meadow_tuft',Math.abs(Math.round(f.x))%7,.65);
    shape(c,[[x-11,y-12],[x+11,y-12],[x+9,y-2],[x+5,y+1],
      [x-5,y+1],[x-9,y-3]],t.wood[0]);
    shape(c,[[x-9,y-10],[x+8,y-10],[x+6,y-2],[x-6,y-2]],'#997453');
    fill(c,x-9,y-12,17,2,'#b18d62');
    fill(c,x-6,y-9,2,6,'#c2966b');
    return true;
  }
  return false;
}

const pointAt=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
function slab(c,a,b,lo,hi,col) {
  const corners=[pointAt(a.near,a.far,lo),pointAt(b.near,b.far,lo),
    pointAt(b.near,b.far,hi),pointAt(a.near,a.far,hi)];
  pixelPolygon(c,corners,col);
  return corners;
}
const platformArtCache=new WeakMap();
function paintDeck(c,samples,t,start,end) {
  const paving=t.paving;
  for(let n=start;n<end;n++) {
    const a=samples[n],b=samples[n+1];
    // The deck edge follows the same sampled rail normals used for walking.
    shape(c,[[a.far.x,a.far.y],[b.far.x,b.far.y],[b.far.x+2,b.far.y+8],
      [a.far.x+2,a.far.y+8]],paving[0]);
    slab(c,a,b,0,1,paving[1]);
    for(let col=0;col<4;col++) {
      const lo=.13+col*.205,hi=lo+.183;
      const offset=(col%2?.05:.03);
      const corners=slab(c,{near:pointAt(a.near,b.near,offset),far:pointAt(a.far,b.far,offset)},
        {near:pointAt(a.near,b.near,1-offset),far:pointAt(a.far,b.far,1-offset)},lo,hi,
        (n*13+col*7)%9<3?paving[1]:paving[2]);
      if((n+col*3)%4===0) {
        const v=pointAt(corners[0],corners[1],.22),w=pointAt(corners[0],corners[1],.74);
        line(c,v.x,v.y,w.x,w.y,paving[3]+'88');
      }
    }
    slab(c,a,b,.025,.083,paving[3]);
    slab(c,a,b,.083,.111,paving[0]);
    slab(c,a,b,.973,1,paving[0]);
    if(n%3===0){
      const p=pointAt(a.near,a.far,.097);
      fill(c,p.x-1,p.y-1,3,3,'#e9d7a2');
    }
  }
}
export function drawStationPlatform(c,s,samples,bounds=null) {
  if(samples.length<2) return;
  const t=stationVisualTheme(s);
  if(typeof document==='undefined') {
    paintDeck(c,samples,t,0,samples.length-1);
    return;
  }
  let saved=platformArtCache.get(samples);
  if(!saved||saved.theme!==t.id){
    const tiles=[];
    for(let start=0;start<samples.length-1;start+=8){
      const end=Math.min(samples.length-1,start+8);
      const points=samples.slice(start,end+1).flatMap(row=>[row.near,row.far]);
      const x=Math.floor(Math.min(...points.map(p=>p.x)))-4,y=Math.floor(Math.min(...points.map(p=>p.y)))-4;
      const w=Math.ceil(Math.max(...points.map(p=>p.x)))-x+8,h=Math.ceil(Math.max(...points.map(p=>p.y)))-y+12;
      if(w*h>320000) {
        tiles.push({start,end,x,y,w,h});
        continue;
      }
      const canvas=document.createElement('canvas');
      canvas.width=w;
      canvas.height=h;
      const pen=canvas.getContext('2d');
      pen.translate(-x,-y);
      paintDeck(pen,samples,t,start,end);
      tiles.push({canvas,x,y,w,h});
    }
    saved={theme:t.id,tiles};
    platformArtCache.set(samples,saved);
  }
  c.save();
  c.imageSmoothingEnabled=false;
  for(const tile of saved.tiles){
    if(bounds&&(tile.x>bounds.right||tile.y>bounds.bottom||tile.x+tile.w<bounds.left||tile.y+tile.h<bounds.top)) continue;
    if(tile.canvas) c.drawImage(tile.canvas,tile.x,tile.y);
    else paintDeck(c,samples,t,tile.start,tile.end);
  }
  c.restore();
}

function stationWallLining(c,b,t) {
  const side=b.id?.match(/:(north|south|west|east)-[\d.]+$/)?.[1];
  if(!side||side==='north')return;
  const {x,y,w,h}=b,[ink,,body,light]=t.wood;
  // Use only the room-facing edge of the existing base. The bulk of the sill
  // remains stone, and the inner lip never becomes a tall foreground sprite.
  if(side==='south'){
    drawInteriorCutawayEdge(c,{x:x+1,y:y+1,w:w-2,h:h-2},{side,trim:[ink,body,light],height:5});
  }else{
    const west=side==='west',width=Math.min(5,w-2);
    drawInteriorCutawayEdge(c,{x:west?x+w-width-1:x+1,y:y+1,w:width,h:h-2},
      {side,trim:[ink,body,light],height:width});
  }
}

export function drawStationWallBase(c,b,s,inside=false) {
  const {x,y,w,h}=b,t=stationVisualTheme(s),horizontal=w>=h;
  fill(c,x+2,y+5,w,h,'#2e39334f');
  fill(c,x,y,w,h,t.wood[0]);
  fill(c,x+1,y+1,w-2,h-3,t.wall[2]);
  if(b.kind==='window'){
    // From the playfield the sill stays low. The tall pane is painted on
    // the facade above it and does not turn into a second cyan window.
    fill(c,x+2,y+3,w-4,h-6,t.wood[1]);
    fill(c,x+3,y+4,w-6,h-8,b.broken?'#47544a':'#a48962');
    if(b.broken){
      for(const d of [5,11,19]) {
        const dx=horizontal?x+d:x+3,dy=horizontal?y+4:y+d;
        if(dx+4<x+w&&dy+4<y+h)shape(c,[[dx,dy],[dx+4,dy],[dx+1,dy+4]],'#82998e');
      }
    }
    fill(c,x+2,y+2,w-4,2,t.wood[3]);
    fill(c,x+2,y+h-4,w-4,2,t.wood[2]);
    if(inside)stationWallLining(c,b,t);
    return;
  }
  fill(c,x+2,y+2,w-4,2,t.wall[3]);
  const length=horizontal?w:h;
  for(let at=12;at<length-6;at+=27){
    fill(c,x+(horizontal?at:1),y+(horizontal?4:at),horizontal?1:w-2,
      horizontal?h-7:1,t.wall[1]);
  }
  fill(c,x+1,y+h-3,w-2,2,t.wall[1]);
  for(const end of [0,Math.max(0,length-4)]) {
    const px=x+(horizontal?end:0),py=y+(horizontal?0:end);
    fill(c,px,py,horizontal?4:w,horizontal?h:4,t.wood[1]);
    fill(c,px+1,py+1,horizontal?1:w-2,horizontal?h-3:1,t.wood[3]);
  }
  if(inside)stationWallLining(c,b,t);
}
