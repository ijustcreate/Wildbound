import {drawForestBankBase,drawForestBankFlow,drawForestWater,forestBankEdge} from './forest-shoreline.mjs';

const lakeEdges = new WeakMap();
const shoreStep = 6;

function lakeShore(lake){
  const {x,y,rx,ry} = lake;
  const key = `${x}:${y}:${rx}:${ry}`;
  let entry = lakeEdges.get(lake);
  if(entry?.key===key) return entry;

  const points = Math.min(1024,Math.max(48,Math.ceil(Math.PI*(rx+ry)/shoreStep)));
  const outline = [];
  const perimeter = i => [Math.round(x+Math.cos(i*2*Math.PI/points)*rx),Math.round(y+Math.sin(i*2*Math.PI/points)*ry)];
  let [px,py] = perimeter(0);
  for(let i=1;i<=points;i++){
    const [qx,qy] = perimeter(i);
    const dx = qx-px, dy = qy-py;
    if(Math.abs(dy)>Math.abs(dx)) outline.push(forestBankEdge(Math.round((px+qx)/2),Math.min(py,qy),-Math.sign(dy),0,Math.abs(dy),42));
    else if(dx) outline.push(forestBankEdge(Math.min(px,qx),Math.round((py+qy)/2),0,Math.sign(dx),Math.abs(dx),42));
    px=qx;
    py=qy;
  }
  const outer = new Path2D();
  outer.ellipse(x,y,rx,ry,0,0,2*Math.PI);
  outer.closePath();
  entry = {key,outline,outer};
  lakeEdges.set(lake,entry);
  return entry;
}

function drawLake(c,g,lake,bounds){
  if(!lake || lake.rx<=0 || lake.ry<=0) return;
  const {x,y,rx,ry} = lake;
  const left = Math.max(bounds.left,x-rx), right = Math.min(bounds.right,x+rx);
  const top = Math.max(bounds.top,y-ry), bottom = Math.min(bounds.bottom,y+ry);
  if(left>=right || top>=bottom) return;
  const {outline,outer} = lakeShore(lake);
  c.save();
  c.clip(outer);
  drawForestWater(c,g,left,top,'water',right-left,bottom-top);
  c.save();
  c.translate(x,y);
  c.scale(rx,ry);
  const shallows = c.createRadialGradient(0,0,.74,0,0,1);
  shallows.addColorStop(0,'#aab67c00');
  shallows.addColorStop(.5,'#aab67c20');
  shallows.addColorStop(1,'#b4bb8766');
  c.fillStyle = shallows;
  c.fillRect(-1,-1,2,2);
  c.restore();
  const shore = outline.filter(edge=>edge.x>left-18&&edge.x<right+18&&edge.y>top-18&&edge.y<bottom+18);
  drawForestBankBase(c,shore);
  drawForestBankFlow(c,shore,g.time||0);
  c.restore();
}

export function drawRailwayWater(c,g,design,bounds){
  const lake = design.station?.lake;
  drawLake(c,g,lake,bounds);
  const {x,width} = design.river;
  const left = x-width/2, right = x+width/2;
  if(left>=bounds.right || right<=bounds.left) return;

  const top = Math.floor(bounds.top/shoreStep)*shoreStep;
  const height = bounds.bottom-top+shoreStep;
  const shallow = Math.min(width/2,22);
  drawForestWater(c,g,left,top,'water',width,height);
  const shore = [];
  for(const [bank,nx] of [[left,1],[right,-1]]){
    if(bank<bounds.left-22 || bank>bounds.right+22) continue;
    const shallows=c.createLinearGradient(bank,0,bank+nx*shallow,0);
    shallows.addColorStop(0,'#b4bb8766');
    shallows.addColorStop(.5,'#aab67c20');
    shallows.addColorStop(1,'#aab67c00');
    c.fillStyle=shallows;
    c.fillRect(nx>0?bank:bank-shallow,top,shallow,height);
    for(let y=top;y<top+height;y+=shoreStep){
      const px = bank-nx;
      if(lake&&Math.hypot((px-lake.x)/lake.rx,(y+shoreStep/2-lake.y)/lake.ry)<1) continue;
      shore.push(forestBankEdge(Math.round(bank),y,nx,0,shoreStep,42));
    }
  }
  drawForestBankBase(c,shore);
  drawForestBankFlow(c,shore,g.time||0);
}
