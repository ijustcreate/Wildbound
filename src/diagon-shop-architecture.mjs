import {drawHouseFloor} from './house-architecture-art.mjs';
import {drawInteriorFace,drawInteriorCutawayEdge,paintInteriorMaterial} from './interior-materials.mjs';
import {drawPixelChatText, pixelChatTextWidth} from './pixel-chat-font.mjs';
import {block as b, shape as p, line as l} from './diagon-shop-brush.mjs';
import {OLLIVANDERS_LAYOUT as layout} from './diagon-wand-shop-layout.mjs';
import {drawOllivandersApron} from './diagon-wand-shop.mjs';
import {
  SHOP_FRONTAGES, frontageRoof, frontageBay, frontageSign, frontageLamp,
  frontageEntry, frontageSill,
} from './diagon-shop-frontages.mjs';

const {halfWidth:W,halfDepth:D,entranceHalf:E,wall:EDGE}=layout;
const shellBounds={x:-153,y:-143,w:306,h:237};
const groundBounds={x:-160,y:-92,w:320,h:203};
const layers=new Map();

const features=[
  ['roof','roofName',248,198,(c,f)=>{c.translate(0,-54);frontageRoof(c,f);}],
  ['window','bayName',60,44,frontageBay],
  ['door','doorName',24,62,frontageEntry],
  ['sign','signName',42,27,frontageSign],
  ['sconce','lampName',16,22,frontageLamp],
  ['threshold','floorName',36,24,frontageSill],
];
const floorPlans=new Map();
const taskLights={
  flourish:[[-82,44,23,18]],malkins:[[-63,65,22,15]],quidditch:[[-80,23,24,15]],
  apothecary:[[76,-40,29,16],[-74,-9,24,16]],eeylops:[[78,47,24,17]],
  floreans:[[-63,47,22,17]],gringotts:[[-10,-25,37,22]],
};

export function shopArchitectureAssets(shop) {
  const f=SHOP_FRONTAGES[shop.id];
  return features.map(([id,key,w,h])=>({id, label:f[key], w,h}));
}

export function paintShopArchitectureAsset(c,shop,id) {
  const item=features.find(([key])=>key===id);
  if(!item)return false;
  c.save();
  item[4](c,SHOP_FRONTAGES[shop.id]);
  c.restore();
  return true;
}

function tile(c,kind,x,y,w,h,f) {
  b(c,x,y,w,h,f.wall[0]);
  b(c,x+2,y+2,w-4,h-4,f.wall[1]);
  if(kind==='timber') {
    b(c,x+2,y+2,w-4,3,f.wall[3]);b(c,x+2,y+h-6,w-4,3,f.wall[0]);
    for(let z=22;z<w-8;z+=37)b(c,x+z,y+5,2,h-11,f.wall[2]);
  } else {
    for(let row=2;row<h-4;row+=10){
      for(let col=2+(row%20===2?0:12);col<w-4;col+=26){
        const bw=Math.min(23,w-col-2);
        b(c,x+col,y+row,bw,Math.min(8,h-row-2),f.wall[(col+row)%3?2:1]);
        if((col+row)%4===0)b(c,x+col+1,y+row,bw-3,1,f.wall[3]);
      }
    }
  }
}

function many(c,xs,y,paint) {
  for(const x of xs){
    c.save();c.translate(x,y);paint(c);c.restore();
  }
}

function upright(c,x,y,h,f,wide=false) {
  const w=wide?14:7;
  const [edge,body,light]=wide?[f.wall[0],f.wall[2],f.wall[3]]:f.trim;
  b(c,x-w/2,y,w,h,edge);b(c,x-w/2+1,y+2,w-2,h-5,body);
  b(c,x-w/2+2,y+4,wide?3:1,h-9,light);
  b(c,x-w/2-2,y,w+4,4,light);b(c,x-w/2-2,y+h-5,w+4,5,edge);
  b(c,x-w/2-1,y+h-6,w+2,1,body);
}

function doorway(c,side,f,open) {
  const x=W*side;
  // Far post and the short near jamb mark the full opening on the ground.
  c.save();c.translate(x,-E+5);c.scale(side,1);frontageEntry(c,f);c.restore();
  const rise=open?13:25;
  upright(c,x,E+1-rise,rise,f,f.profile==='pediment');
  l(c,f.trim[0],x,-62,x+side*26,-62,3);
  l(c,f.trim[2],x+side*21,-61,x+side*21,-56);
  many(c,[x+side*18],-32,pen=>frontageSign(pen,f));
}

function paintShell(c,shop,side,f,open) {
  const wide=f.profile==='pediment';
  if(open) {
    const [shade,mid,body,lit]=f.wall;
    const material=wide||f.profile==='coping'?'masonry':'plaster';
    drawInteriorFace(c,{x:-W,y:-D+3,w:W*2,height:52,material,
      palette:[shade,mid,body,lit,lit,shade],trim:f.trim});
    paintInteriorMaterial(c,{x:-W+5,y:-D-17,w:W*2-10,h:12},'panel',
      [f.trim[0],f.trim[1],f.trim[1],f.trim[1],f.trim[2],f.trim[0]]);
    b(c,-W,-D-18,W*2,2,f.trim[2]);
    b(c,-W,-D-5,W*2,2,f.trim[0]);
    for(const x of [-W+3,-30,32,W-3])upright(c,x,-D-44,44,f,wide);
    // Put high glazing nearest the entry, beyond the tall stock shelving.
    c.save();c.translate(side*85,-D-11);c.scale(.65,.9);frontageBay(c,f);c.restore();
    many(c,[-88*side],-D-31,pen=>frontageLamp(pen,f));
    const outer=side===1?-W:W-EDGE;
    const inner=side===1?W-EDGE:-W;
    const innerSide=side===1?'east':'west';
    const outerSide=side===1?'west':'east';
    drawInteriorCutawayEdge(c,{x:outer,y:-D,w:EDGE,h:D*2},{side:outerSide,trim:f.trim});
    drawInteriorCutawayEdge(c,{x:inner,y:-D,w:EDGE,h:D-E},{side:innerSide,trim:f.trim});
    drawInteriorCutawayEdge(c,{x:inner,y:E,w:EDGE,h:D-E},{side:innerSide,trim:f.trim});
    drawInteriorCutawayEdge(c,{x:-W,y:D-EDGE,w:W*2,h:EDGE},{trim:f.trim});
  }else {
    tile(c,wide?'stone':f.surface==='wood'?'timber':'stone',-W,25,W*2,57,f);
    b(c,-W,75,W*2,7,f.wall[0]);
    b(c,-W+3,75,W*2-6,3,f.wall[2]);
    for(const x of [-W+4,-36,36,W-4])upright(c,x,30,49,f,wide);
    many(c,[-66,66],74,pen=>frontageBay(pen,f));
    frontageRoof(c,f);
    const nameWidth=pixelChatTextWidth(f.name), y=f.profile==='awning'?52:47;
    b(c,-nameWidth/2-8,y-2,nameWidth+16,14,f.trim[0]);
    b(c,-nameWidth/2-6,y-1,nameWidth+12,11,f.trim[1]);
    b(c,-nameWidth/2-5,y,nameWidth+10,1,f.trim[2]);
    drawPixelChatText(c,f.name,-nameWidth/2,y+2,f.mark);
    many(c,[0],79,pen=>frontageLamp(pen,f));
  }
  doorway(c,side,f,open);
}

function pool(c,x,y,rx,ry) {
  for(const [factor,color] of [[1,'#e6b57917'],[.68,'#ffd89c15'],[.36,'#ffe1a620']]){
    const w=Math.round(rx*factor),h=Math.round(ry*factor);
    p(c,color,[[x-w,y-h*.45],[x-w*.62,y-h],[x+w*.55,y-h],[x+w,y-h*.4],
      [x+w,y+h*.45],[x+w*.62,y+h],[x-w*.55,y+h],[x-w,y+h*.45]]);
  }
}

function runner(c,f) {
  const [edge,body,thread]=f.runner;
  const wide=f.profile==='pediment',w=wide?116:94;
  const x=-w/2,y=wide?19:34;
  p(c,edge,[[x,y+3],[x+4,y],[x+w-4,y],[x+w,y+3],[x+w,y+22],[x+w-4,y+25],[x+3,y+25],[x,y+22]]);
  b(c,x+3,y+3,w-6,19,body);
  b(c,x+6,y+5,w-12,1,thread);b(c,x+6,y+19,w-12,1,thread);
  for(let px=x+12;px<x+w-10;px+=16){
    if(f.profile==='awning'){
      b(c,px,y+10,4,4,thread);b(c,px+1,y+9,2,6,thread);
    }else p(c,thread,[[px-3,y+12],[px,y+10],[px+3,y+12],[px,y+14]]);
  }
}

function paintGround(c,shop,side,f,open,props) {
  p(c,'#26312f52',[[-113,-77],[109,-79],[122,-62],[125,90],[115,103],[-111,103],[-122,91]]);
  if(open){
    if(!floorPlans.has(f.surface))floorPlans.set(f.surface,{floors:[{x:0,y:0,w:W*2,h:D*2,material:f.surface}]});
    c.save();c.translate(-W,-D);drawHouseFloor(c,floorPlans.get(f.surface));c.restore();
    b(c,-W+3,-D+2,W*2-6,D*2-4,f.surface==='wood'?'#46332829':'#8d775a35');
    b(c,-W+5,-D+4,W*2-10,9,'#2632354a');
    runner(c,f);
    pool(c,side*84,-54,35,24);pool(c,-side*80,-50,27,24);pool(c,side*88,7,25,27);
    for(const [x,y,rx,ry] of taskLights[shop.id])pool(c,x*side,y,rx,ry);
    for(const {x,y,solid} of props){
      if(!solid)continue;
      const mid=x*side,hw=solid.width/2;
      p(c,'#302a2935',[[mid-hw,y-solid.depth+4],[mid+hw,y-solid.depth+4],
        [mid+hw+4,y+2],[mid+hw+2,y+5],[mid-hw+2,y+5],[mid-hw-1,y+2]]);
      b(c,mid-hw+2,y-1,solid.width-3,3,'#3326224a');
    }
  }
  many(c,[side*(W+6)],0,pen=>frontageSill(pen,f));
  many(c,[side*(W+6)],E-1,pen=>frontageSill(pen,f));
  if(!open){pool(c,-63,D+5,29,11);pool(c,63,D+5,29,11);pool(c,side*(W+17),4,23,21);}
}

function cached(c,shop,key,bounds,paint) {
  const cacheKey=shop.id+':'+key;
  let sprite=layers.get(cacheKey);
  if(!sprite&&typeof document!=='undefined'){
    sprite=document.createElement('canvas');sprite.width=bounds.w;sprite.height=bounds.h;
    const pen=sprite.getContext('2d');pen.translate(-bounds.x,-bounds.y);paint(pen);
    layers.set(cacheKey,sprite);
  }
  c.save();c.translate(Math.round(shop.x),Math.round(shop.y));c.imageSmoothingEnabled=false;
  if(sprite)c.drawImage(sprite,bounds.x,bounds.y);
  else paint(c);
  c.restore();
}

export function groundShop(c,shop,side,open,props) {
  // The approved broken stone approach is reused. Reflect only its plan so
  // every threshold opens toward the avenue.
  c.save();c.translate(shop.x,shop.y);c.scale(side,1);
  drawOllivandersApron(c,{x:0,y:0});c.restore();
  const f=SHOP_FRONTAGES[shop.id];
  cached(c,shop,open?'floor':'foundation',groundBounds,pen=>paintGround(pen,shop,side,f,open,props));
}

export function drawShopShell(c,shop,side,open) {
  cached(c,shop,open?'cutaway':'exterior',shellBounds,pen=>paintShell(pen,shop,side,SHOP_FRONTAGES[shop.id],open));
}

export function shopArchitectureRasterCount() {return layers.size;}
