import {pixelPolygon} from './pixel-shapes.mjs';

const SIZE=32;
const NORTH=1,EAST=2,SOUTH=4,WEST=8;
const STEPS=[0,6,12,20,26,32];
const wet=kind=>kind==='shadow_void'||kind==='shallow'||kind==='water';
const dry=kind=>kind!=null&&!wet(kind);
const axes=[
  (u,v)=>[u,v],
  (u,v)=>[SIZE-v,u],
  (u,v)=>[SIZE-u,SIZE-v],
  (u,v)=>[v,SIZE-u],
];
const colors={
  foot:'#171b2c',under:'#242738',deep:'#343348',rock:'#414057',plane:'#50516a',
  cap:'#525268',rim:'#6b657e',seam:'#302d43',accent:'#726884',silt:'#50485e',
};

// Everything is sampled on the two-world-unit ground raster. The A and B
// points of each edge agree across neighboring tiles, even when their strata vary.
const NORTH_RIM=[
  [20,24,24,20,22,20], [20,20,24,24,18,20], [20,22,26,22,20,20],
  [20,16,20,24,24,20], [20,22,18,18,24,20], [20,24,22,18,20,20],
];
const SIDE_RIM=[
  [8,10,12,10,8,8], [8,8,12,14,10,8], [8,12,12,8,10,8],
  [8,8,6,10,12,8], [8,10,10,6,8,8], [8,10,14,12,8,8],
];

function styleIndex(tx,ty) {
  let hash=Math.imul(tx,0x1f123bb5)^Math.imul(ty,0x29490d79);
  hash=Math.imul(hash^(hash>>>16),0x45d9f3b);
  return (hash>>>0)%NORTH_RIM.length;
}

function profile(mask,variant) {
  const top=mask&NORTH?(mask&SOUTH?12:20):0;
  const bottom=mask&SOUTH?8:0;
  const left=mask&WEST?8:0;
  const right=mask&EAST?8:0;
  const north=mask&NORTH?NORTH_RIM[variant].map(y=>mask&SOUTH?y-8:y):STEPS.map(()=>0);
  const east=mask&EAST?SIDE_RIM[(variant+2)%6]:STEPS.map(()=>0);
  const south=mask&SOUTH?SIDE_RIM[(variant+4)%6].map(y=>mask&NORTH?Math.min(10,y):y):STEPS.map(()=>0);
  const west=mask&WEST?SIDE_RIM[(variant+1)%6]:STEPS.map(()=>0);
  const coord=(step,a,b)=>Math.round((a+(b-a)*step/SIZE)/2)*2;
  const paths=[
    STEPS.map((step,i)=>[coord(step,left,SIZE-right),north[i]]),
    STEPS.map((step,i)=>[SIZE-east[i],coord(step,top,SIZE-bottom)]),
    STEPS.map((step,i)=>[coord(step,SIZE-right,left),SIZE-south[i]]),
    STEPS.map((step,i)=>[west[i],coord(step,SIZE-bottom,top)]),
  ];
  return {paths,wet:paths.flatMap((points,side)=>stepWetEdge(points,side).slice(0,-1))};
}

const profiles=Array.from({length:16},(_,mask)=>NORTH_RIM.map((_,variant)=>profile(mask,variant)));
export function shadowLedgeMask(tx,ty,at) {
  if(at(tx,ty)!=='shadow_void')return 0;
  return (dry(at(tx,ty-1))?NORTH:0)|(dry(at(tx+1,ty))?EAST:0)|
    (dry(at(tx,ty+1))?SOUTH:0)|(dry(at(tx-1,ty))?WEST:0);
}

export function traceShadowWaterTile(c,tx,ty,at) {
  if(!wet(at(tx,ty)))return false;
  const mask=shadowLedgeMask(tx,ty,at),x=tx*SIZE,y=ty*SIZE;
  if(!mask)c.rect(x,y,SIZE,SIZE);
  else{
    const points=profiles[mask][styleIndex(tx,ty)].wet;
    c.moveTo(x+points[0][0],y+points[0][1]);
    for(let i=1;i<points.length;i++)c.lineTo(x+points[i][0],y+points[i][1]);
    c.closePath();
  }
  return true;
}

function region(c,points,color) {
  pixelPolygon(c,points.map(([x,y])=>({x,y})),color);
}
function snap(value) {return Math.round(value/2)*2;}
function polyAt(c,axis,points,color) {
  region(c,points.map(([u,v])=>axis(u,v)),color);
}

function stepWetEdge(points,side) {
  // Use the same integral pixel steps at half-resolution raster time and
  // full-resolution clip time. Diagonal clips left tiny colored slivers.
  const orient=axes[side],local=points.map(([x,y])=>axes[(4-side)%4](x,y));
  const result=[points[0]];
  function push(u,v) {
    const next=orient(u,v),a=result.at(-2),b=result.at(-1);
    if(a&&(a[0]===b[0]&&b[0]===next[0]||a[1]===b[1]&&b[1]===next[1]))result[result.length-1]=next;
    else if(b[0]!==next[0]||b[1]!==next[1])result.push(next);
  }
  for(let i=1;i<local.length;i++){
    const [start,depth]=local[i-1],[end,edge]=local[i];
    let last=depth;
    for(let u=start+2;u<=end;u+=2){
      const v=snap(depth+(edge-depth)*(u-start)/(end-start));
      push(u,last);if(v!==last)push(u,v);
      last=v;
    }
  }
  return result;
}

function paintFace(c,axis,points,variant,deep) {
  const start=points[0][0],end=points.at(-1)[0];
  const face=(depth,color)=>polyAt(c,axis,[[start,0],[end,0],
    ...points.map(([u,v])=>[u,snap(v*depth)]).reverse()],color);
  face(.87,colors.under);
  face(.64,colors.deep);
  face(.42,colors.rock);
  // Two broken slabs share broad strata, with a diagonal split between them.
  // The lower rock face retains enough unmarked color to read as one volume.
  const split=snap(start+(end-start)*(.32+variant*.065)),foot=deep?16:8;
  polyAt(c,axis,[[start,2],[split-2,2],[split,6],[split-5,foot],[start,foot-4]],
    variant%3===1?colors.rock:colors.plane);
  polyAt(c,axis,[[split,3],[split+4,6],[end,4],[end,foot-3],[split+3,foot-2]],
    variant%3===0?colors.plane:colors.rock);
  polyAt(c,axis,[[split-2,4],[split+1,5],[split-3,foot-1],[split-6,foot+1]],colors.seam);
  if(deep&&variant%3!==1){
    polyAt(c,axis,[[split-5,12],[end,10],[end,12],[split-4,15]],colors.seam);
    polyAt(c,axis,[[split-4,11],[end-3,9],[end-5,11],[split-5,13]],colors.plane);
  }
  polyAt(c,axis,[[start,0],[end,0],[end,2],[split+3,4],[split-4,3],[start,4]],colors.cap);
  if(variant%3!==0)polyAt(c,axis,[[start+2,0],[split+3,0],[split-2,2],[start+3,2]],colors.rim);
}

export function drawShadowLedgeTile(c,tx,ty,at) {
  const mask=shadowLedgeMask(tx,ty,at);
  if(!mask)return false;
  const variant=styleIndex(tx,ty),model=profiles[mask][variant];
  c.save();
  c.translate(tx*SIZE,ty*SIZE);
  // Combine the rectangle and exact water opening in an even-odd clip.
  c.beginPath();
  c.rect(0,0,SIZE,SIZE);
  c.moveTo(model.wet[0][0],model.wet[0][1]);
  for(let i=1;i<model.wet.length;i++)c.lineTo(model.wet[i][0],model.wet[i][1]);
  c.closePath();
  c.clip('evenodd');
  c.fillStyle=colors.foot;
  c.fillRect(0,0,SIZE,SIZE);
  for(let side=0;side<4;side++){
    if(!(mask&(1<<side)))continue;
    const axis=axes[side];
    const unproject=axes[(4-side)%4];
    paintFace(c,axis,model.paths[side].map(([x,y])=>unproject(x,y)),(variant+side)%6,side===0);
  }
  c.restore();
  return true;
}

export function drawShadowBankTile(c,tx,ty,at) {
  if(at(tx,ty)!=='shadow_soil')return;
  const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
  const banks=dirs.map(([dx,dy])=>at(tx+dx,ty+dy));
  if(!banks.some(wet))return;
  const variant=styleIndex(tx,ty);
  c.save();
  c.translate(tx*SIZE,ty*SIZE);
  c.beginPath();
  c.rect(0,0,SIZE,SIZE);
  c.clip();
  for(let side=0;side<4;side++){
    const kind=banks[side];
    if(!wet(kind))continue;
    const axis=axes[side],ledge=kind==='shadow_void';
    const a=(variant*3+side*5)%12+2;
    const tint=ledge?colors.cap:colors.silt;
    // Broken caps and damp footstones sit within the existing shore tile.
    for(let i=0;i<2;i++){
      const u=a+i*12,h=ledge?6:4,w=8+(variant+i)%3*2;
      polyAt(c,axis,[[u,0],[u+w,0],[u+w-2,h-2],[u+2,h],[u-2,h-2]],tint);
      polyAt(c,axis,[[u,0],[u+w-2,0],[u+w-4,2],[u+2,2]],ledge?colors.rim:colors.plane);
    }
    if(ledge&&variant%3===0){
      polyAt(c,axis,[[16,6],[20,8],[24,6],[21,11],[17,10]],colors.seam);
      polyAt(c,axis,[[18,6],[21,6],[20,8],[16,7]],colors.accent);
    }
  }
  c.restore();
}
