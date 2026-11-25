import {drawHouseFloor} from './house-architecture-art.mjs';
import {drawInteriorFace,drawInteriorCutawayEdge,paintInteriorMaterial} from './interior-materials.mjs';
import {houseRoofGeometry} from './house-roof.mjs';
import {drawPixelChatText, pixelChatTextWidth} from './pixel-chat-font.mjs';
import {pixelLine, pixelPolygon} from './pixel-shapes.mjs';
import {OLLIVANDERS_FURNITURE, OLLIVANDERS_LAYOUT} from './diagon-wand-shop-layout.mjs';

const {halfWidth, halfDepth, entranceHalf, wall} = OLLIVANDERS_LAYOUT;
const ink = '#303531';
const wood = '#694c3b';
const walnut = '#493833';
const oak = '#936a49';
const stone = ['#736f61','#868374','#929080','#a3a08a'];
const roofSlate = ['#334b4c','#45605c','#566e65','#687e6e','#839280'];
const localLayers = new Map();
const nativeFloor={floors:[{x:0,y:0,w:halfWidth*2,h:halfDepth*2,material:'wood'}]};

function block(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function shape(c, color, points) {
  pixelPolygon(c, points.map(([x,y]) => ({x,y})), color);
}

function edge(c, color, x, y, endX, endY, width = 1) {
  pixelLine(c, {x,y}, {x:endX,y:endY}, color, width);
}

// Staggered courses share the muted grey-green range of the forest's ruins.
function masonry(c, x, y, w, h, pale = false) {
  block(c, x, y, w, h, '#565949');
  for (let row = 0; row * 9 < h; row++) {
    const py = y + row * 9;
    const height = Math.min(8, y + h - py);
    for (let col = -1; col * 23 < w; col++) {
      const start = x + col * 23 + (row % 2) * 11;
      const px = Math.max(x,start);
      const width = Math.min(x+w,start+22)-px;
      if (width < 1) continue;
      const i = ((col * 7 + row * 5) % 4 + 4) % 4;
      block(c, px, py, width, height, stone[pale ? Math.min(3,i+1) : i]);
      if ((row + col) % 3 === 0 && width > 6) {
        block(c, px + 2, py, width - 5, 1, '#b3ab8a');
        if (height > 4) block(c, px + width - 5, py + height - 2, 5, 2, '#6e705d');
      }
    }
  }
}

function upright(c, x, y, h) {
  block(c,x-4,y,8,h,walnut);
  block(c,x-3,y,5,h-3,oak);
  block(c,x-3,y,2,h-6,'#b08860');
  block(c,x-5,y+h-5,10,5,'#3d3b35');
}

function amberBay(c) {
  shape(c,ink,[[-28,-7],[-28,-31],[-22,-39],[-15,-43],[15,-43],[24,-38],[28,-31],[28,-7],[22,-1],[-23,-1]]);
  shape(c,wood,[[-26,-8],[-26,-30],[-21,-37],[-14,-41],[14,-41],[22,-37],[26,-30],[26,-8],[20,-3],[-21,-3]]);
  shape(c,'#47373b',[[-26,-29],[-17,-32],[-17,-8],[-26,-9]]);
  shape(c,'#533e3d',[[18,-33],[25,-30],[25,-9],[18,-5]]);
  block(c,-17,-32,35,24,'#3e3339');
  block(c,-15,-30,31,19,'#b77b4f');
  shape(c,'#e5b56e',[[-15,-30],[16,-30],[16,-18],[8,-16],[-15,-18]]);
  shape(c,'#f6d394',[[-15,-29],[-2,-29],[-7,-22],[-15,-20]]);
  block(c,-2,-31,3,22,'#6f5142');
  block(c,-16,-22,33,2,'#8b6247');
  block(c,-24,-28,5,17,'#cca166');
  block(c,20,-27,4,15,'#996b4e');
  block(c,-21,-35,38,3,'#bc9161');
  block(c,-15,-39,27,2,'#d4ab74');
  block(c,-22,-10,44,4,'#bb905b');
  block(c,-24,-6,46,4,'#725241');
  // One angled wand rests behind the center glass, visible against the warm pane.
  edge(c,'#5e4337',3,-15,13,-20,1);
  block(c,12,-20,2,1,'#ecd29a');
}

function carvedDoor(c) {
  // The right edge is the hinge plane. World placement puts the open passage at x +108.
  shape(c,ink,[[-17,0],[-17,-41],[-13,-48],[-7,-53],[7,-53],[13,-48],[17,-41],[17,0]]);
  shape(c,oak,[[-15,-1],[-15,-41],[-11,-47],[-6,-50],[6,-50],[11,-47],[15,-41],[15,-1]]);
  shape(c,'#2c3330',[[-11,-1],[-11,-41],[-8,-46],[-4,-48],[5,-48],[9,-45],[11,-40],[11,-1]]);
  shape(c,'#635044',[[2,-48],[9,-45],[11,-40],[11,-1],[2,-7]]);
  block(c,4,-36,5,15,'#8c684b');
  block(c,4,-18,5,8,'#806249');
  block(c,4,-26,3,2,'#d8b576');
  edge(c,'#c19b69',-14,-41,-14,-4);
  edge(c,'#be9c70',-13,-42,-8,-48);
  block(c,-7,-51,11,2,'#c6a178');
}

function wandSign(c) {
  block(c,-15,-35,31,3,'#3d4239');
  block(c,-13,-35,24,1,'#8c8c6c');
  block(c,-9,-32,2,7,'#4f5043');
  block(c,8,-32,2,7,'#4f5043');
  shape(c,ink,[[-15,-22],[-11,-27],[12,-27],[16,-22],[16,-6],[11,-2],[-11,-2],[-15,-6]]);
  shape(c,'#857051',[[-13,-21],[-10,-25],[11,-25],[14,-21],[14,-7],[10,-4],[-10,-4],[-13,-7]]);
  shape(c,'#4e4951',[[-11,-20],[-8,-23],[9,-23],[12,-20],[12,-8],[9,-6],[-9,-6],[-11,-9]]);
  edge(c,'#d5ac6b',-8,-9,6,-19,2);
  block(c,7,-21,1,5,'#e0c182');
  block(c,5,-19,5,1,'#e0c182');
}

function wallSconce(c) {
  block(c,-8,-19,5,17,'#393a31');
  block(c,-7,-18,2,14,'#777259');
  block(c,-5,-7,10,4,'#4e4a38');
  shape(c,'#383932',[[-4,-10],[-5,-20],[-1,-25],[5,-25],[10,-20],[9,-10],[6,-7],[-2,-7]]);
  block(c,-2,-19,9,9,'#bc8249');
  block(c,-1,-18,6,7,'#ead097');
  block(c,1,-16,3,5,'#ffe4a7');
  block(c,-3,-21,11,2,'#9f865a');
  block(c,-2,-10,12,2,'#a58b5b');
}

function threshold(c) {
  shape(c,'#3d4740',[[-20,-24],[13,-24],[20,-20],[20,-4],[15,1],[-22,1],[-24,-3],[-24,-19]]);
  shape(c,'#8a8d78',[[-21,-22],[13,-22],[18,-19],[18,-6],[14,-3],[-21,-3],[-22,-6],[-22,-18]]);
  block(c,-22,-20,37,3,'#aba889');
  block(c,-22,-12,40,2,'#5f685b');
  block(c,-9,-19,2,7,'#646b5d');
  block(c,8,-10,2,7,'#646b5d');
  block(c,-18,-15,9,2,'#a4a38b');
  block(c,1,-7,6,1,'#b6af93');
  block(c,-19,-3,33,3,'#596658');
}

function tilePlane(c, points, base, shade, glint) {
  shape(c,base,points);
  // Sparse long breaks keep the roof reading as one material at the far camera.
  const y0 = Math.ceil(Math.min(...points.map(p=>p[1])) / 8) * 8;
  const y1 = Math.max(...points.map(p=>p[1]));
  for (let y = y0; y < y1; y += 8) {
    const intersections = [];
    for (let i=0;i<points.length;i++) {
      const [ax,ay] = points[i];
      const [bx,by] = points[(i+1)%points.length];
      if ((ay<=y && by>y) || (by<=y && ay>y)) intersections.push(ax+(bx-ax)*(y-ay)/(by-ay));
    }
    if (intersections.length !== 2) continue;
    const start = Math.ceil(Math.min(...intersections))+5;
    const end = Math.floor(Math.max(...intersections))-4;
    for (let x = start - ((y/8)&1)*9, n=0; x+10<end; x+=21,n++) {
      if (x < start) continue;
      block(c,x,y,16+(n%3),1,shade);
      if ((n+Math.floor(y/8)) % 4 === 0) block(c,x+1,y-1,9,1,glint);
    }
  }
}

function roofVerge(c,x,y,width,colors) {
  const [shadow,body,light]=colors;
  for (const [i,span] of [[0,31],[33,22],[58,17],[77,28],[106,39],[148,15],[166,49]]) {
    const length=Math.min(span,width-i);
    if (length<1) continue;
    block(c,x+i,y,length,3,body);
    block(c,x+i+1,y,length-1,1,light);
    block(c,x+i,y+3,length+1,1,shadow);
  }
}

function crookedGable(c) {
  // Derive overhead planes from the house footprint. The lifted eave and
  // slightly bent ridge turn the donor into a narrower slate shop roof.
  const geometry = houseRoofGeometry({x:-halfWidth+6,y:-halfDepth+6,w:halfWidth*2-12,h:halfDepth*2-12});
  const [nw,ne,se,sw] = geometry.perimeter.map(([x,y])=>[x,y-22]);
  const westCorner=[nw[0]+11,nw[1]-3], westUpper=[nw[0],nw[1]+7];
  const eastCorner=[ne[0]-9,ne[1]+2], eastUpper=[ne[0],ne[1]+10];
  const eastLower=[se[0],se[1]-10], eastEave=[se[0]-8,se[1]+4];
  const westEave=[sw[0]+6,sw[1]+1];
  const [a,b] = geometry.ridge.map(([x,y],i)=>[x-(i?14:29),y-22]);
  const outline=[westCorner,a,eastCorner,eastUpper,eastLower,eastEave,westEave,[sw[0],sw[1]-9],westUpper];
  shape(c,ink,outline);
  tilePlane(c,[[westCorner[0],westCorner[1]+2],a,eastCorner],roofSlate[1],roofSlate[0],roofSlate[2]);
  tilePlane(c,[[westUpper[0]+2,westUpper[1]],westCorner,a,b,[westEave[0],westEave[1]-3],[sw[0]+2,sw[1]-10]],roofSlate[3],roofSlate[2],roofSlate[4]);
  tilePlane(c,[a,eastCorner,[eastUpper[0]-2,eastUpper[1]],[eastLower[0]-2,eastLower[1]],eastEave,b],roofSlate[1],roofSlate[0],roofSlate[2]);
  tilePlane(c,[[westEave[0],westEave[1]-3],b,eastEave,[eastEave[0]-1,eastEave[1]-3]],roofSlate[2],roofSlate[1],roofSlate[3]);
  edge(c,roofSlate[4],a[0],a[1],b[0],b[1],3);
  edge(c,'#9b9f84',westCorner[0],westCorner[1]+1,a[0]-2,a[1],1);
  edge(c,'#354a45',b[0],b[1]+2,eastEave[0]-2,eastEave[1]-3,2);
  roofVerge(c,westEave[0],sw[1]-1,eastEave[0]-westEave[0],['#34443b','#607264','#82917a']);

  // Moss follows the joins and shaded edges in a few broad, uneven clusters.
  shape(c,'#6b7c62',[[-108,19],[-100,19],[-96,25],[-83,25],[-78,29],[-64,29],[-67,37],[-94,38],[-103,33],[-109,30]]);
  shape(c,'#869270',[[-108,24],[-100,24],[-96,28],[-84,28],[-83,31],[-99,31],[-105,29]]);
  shape(c,'#4d6858',[[81,13],[89,12],[92,16],[105,16],[112,19],[112,27],[97,25],[93,22],[81,22]]);
  shape(c,'#59715c',[[90,17],[104,17],[109,20],[106,22],[97,21],[94,19]]);

  // Masonry stack, flashing, and the bent timber gable interrupt the roof mass.
  block(c,-70,-75,33,6,'#364941');
  block(c,-67,-112,25,40,'#4d5145');
  masonry(c,-65,-110,18,34,true);
  block(c,-47,-109,4,36,'#625f50');
  shape(c,'#8d8b71',[[-72,-111],[-68,-117],[-39,-117],[-37,-111]]);
  block(c,-71,-112,34,4,'#393e36');
  block(c,-67,-115,23,2,'#505349');
  block(c,-67,-116,18,1,'#aba080');

  const y = sw[1];
  shape(c,ink,[[-60,y+6],[-53,y-1],[-15,y-48],[-7,y-49],[10,y-34],[38,y-4],[48,y+6]]);
  shape(c,'#9b795d',[[-54,y+6],[-13,y-42],[-7,y-44],[38,y+6]]);
  shape(c,'#796253',[[-7,y-44],[38,y+6],[-2,y+6],[-2,y-29]]);
  edge(c,'#b9a27f',-55,y+2,-15,y-46,3);
  edge(c,'#62776a',-11,y-46,44,y+2,4);
  block(c,-57,y+4,103,4,walnut);
  block(c,-15,y-30,18,25,ink);
  block(c,-13,y-28,14,18,'#a97551');
  block(c,-12,y-27,6,8,'#e2bc84');
  block(c,-7,y-28,2,18,wood);
  block(c,-14,y-18,16,2,wood);
  block(c,-17,y-9,23,3,'#b0875d');
}

const architecturalPainters = {crooked_gable:crookedGable, amber_bay_window:amberBay,
  carved_door:carvedDoor, wand_sign:wandSign, iron_sconce:wallSconce, cobble_threshold:threshold};

export const OLLIVANDERS_ARCHITECTURE_ASSETS = Object.freeze([
  ['crooked_gable',232,191], ['amber_bay_window',56,43], ['carved_door',34,53],
  ['wand_sign',32,35], ['iron_sconce',18,25], ['cobble_threshold',44,25],
].map(([kind,w,h])=>Object.freeze({id:`ollivanders:${kind}`,kind,w,h})));

export function drawOllivandersArchitecturalAsset(c,id,x,y,scale=1) {
  const kind = id.replace(/^ollivanders:/,'');
  if (!Object.hasOwn(architecturalPainters,kind)) return false;
  c.save();
  c.translate(Math.round(x),Math.round(y));
  c.scale(scale,scale);
  if (kind==='crooked_gable') c.translate(0,-50); // Bottom-center anchor for the isolated asset.
  architecturalPainters[kind](c);
  c.restore();
  return true;
}

function signboard(c,y) {
  shape(c,ink,[[-46,y-6],[-41,y-9],[42,y-9],[47,y-5],[47,y+5],[42,y+8],[-41,y+8],[-46,y+5]]);
  block(c,-43,y-5,87,11,'#514850');
  block(c,-41,y-7,83,1,'#af936a');
  block(c,-41,y+5,83,1,'#766348');
  const shopName = 'OLLIVANDERS';
  const x = -Math.floor(pixelChatTextWidth(shopName)/2);
  drawPixelChatText(c,shopName,x,y-4,'#e4c08a');
  for (const dx of [-39,38]) block(c,dx,y-1,2,2,'#be9d69');
}

function doorway(c,opened) {
  // From this camera the east-facing opening is foreshortened in screen X.
  c.save();
  c.translate(halfWidth+1,-entranceHalf+7);
  c.scale(.56,1);
  carvedDoor(c);
  c.restore();
  if (!opened) {
    block(c,halfWidth-6,-33,12,21,'#3b4238');
    block(c,halfWidth-4,-31,6,20,'#524b3c');
    shape(c,ink,[[halfWidth-12,-79],[halfWidth+2,-83],[halfWidth+18,-75],[halfWidth+23,-61],[halfWidth-13,-61]]);
    shape(c,'#586b60',[[halfWidth-10,-78],[halfWidth+2,-81],[halfWidth+17,-73],[halfWidth+21,-63],[halfWidth-12,-63]]);
    edge(c,'#91a184',halfWidth-10,-77,halfWidth+2,-81,2);
    block(c,halfWidth-12,-64,32,2,'#768574');
  }
  upright(c,halfWidth,-entranceHalf-37,36);
  upright(c,halfWidth,entranceHalf-27,28);
  c.save();
  c.translate(halfWidth+16,-entranceHalf-13);
  wandSign(c);
  c.restore();
}

function exterior(c) {
  const width=halfWidth*2;
  // Street-facing south elevation and dark foot; windows retain a human scale.
  block(c,-halfWidth,28,width,halfDepth-28,ink);
  masonry(c,-halfWidth+2,31,width-4,halfDepth-34);
  block(c,-halfWidth+3,49,width-6,22,'#766359');
  block(c,-halfWidth+3,73,width-6,4,'#575e50');
  block(c,-halfWidth,77,width,5,'#39443c');
  for(const x of [-halfWidth+5,0,halfWidth-5]) upright(c,x,34,47);
  for(const x of [-65,65]) {
    c.save();
    c.translate(x,76);
    amberBay(c);
    c.restore();
  }
  crookedGable(c);
  signboard(c,53);
  c.save();
  c.translate(1,86);
  wallSconce(c);
  c.restore();
  doorway(c,false);
}

function cutaway(c) {
  const trim=[walnut,wood,'#bb986a'];
  drawInteriorFace(c,{x:-halfWidth,y:-halfDepth+3,w:halfWidth*2,height:55,material:'masonry',
    palette:['#656458','#817d67','#918d76','#a19c81','#b4ae91','#746f5f'],trim});
  paintInteriorMaterial(c,{x:-halfWidth+2,y:-halfDepth-17,w:halfWidth*2-4,h:13},'panel');
  block(c,-halfWidth,-halfDepth-18,halfWidth*2,2,trim[2]);
  block(c,-halfWidth,-halfDepth-5,halfWidth*2,2,trim[0]);
  for (const x of [-halfWidth+3,-28,34,halfWidth-3]) upright(c,x,-halfDepth-46,50);
  c.save();
  c.translate(90,-halfDepth-12);
  c.scale(.65,.8);
  amberBay(c);
  c.restore();
  c.save();
  c.translate(-98,-halfDepth-29);
  wallSconce(c);
  c.restore();
  drawInteriorCutawayEdge(c,{x:-halfWidth,y:-halfDepth,w:wall,h:halfDepth*2},{side:'west',trim});
  drawInteriorCutawayEdge(c,{x:halfWidth-wall,y:-halfDepth,w:wall,h:halfDepth-entranceHalf},{side:'east',trim});
  drawInteriorCutawayEdge(c,{x:halfWidth-wall,y:entranceHalf,w:wall,h:halfDepth-entranceHalf},{side:'east',trim});
  drawInteriorCutawayEdge(c,{x:-halfWidth,y:halfDepth-wall,w:halfWidth*2,h:wall},{trim});
  block(c,-halfWidth,halfDepth-1,halfWidth*2,2,'#514d3d');
  doorway(c,true);
}

function pool(c,x,y,radiusX,radiusY) {
  // Broad transparent clusters illuminate boards without bleaching their grain.
  for (const [scale,color] of [[1,'#edb57b12'],[.68,'#ffd69715'],[.38,'#ffe4ad20']]) {
    const w=Math.round(radiusX*scale), h=Math.round(radiusY*scale);
    shape(c,color,[[x-w,y-h*.44],[x-w*.62,y-h],[x+w*.55,y-h],[x+w,y-h*.4],
      [x+w,y+h*.44],[x+w*.62,y+h],[x-w*.55,y+h],[x-w,y+h*.4]]);
  }
}

function floorRunner(c) {
  // A long, worn textile guides the customer from the entry to the counter.
  shape(c,'#4e3a3b80',[[-48,31],[52,31],[54,49],[52,56],[-49,55],[-52,50]]);
  shape(c,'#655652',[[-48,29],[52,29],[53,51],[-50,51]]);
  block(c,-46,30,96,20,'#77645a');
  block(c,-43,33,90,14,'#665556');
  block(c,-42,34,89,1,'#ab8a68');
  block(c,-42,45,89,1,'#9b7b62');
  for (const x of [-38,-16,6,28]) {
    shape(c,'#947760',[[x,40],[x+5,37],[x+10,40],[x+5,43]]);
  }
  for (const x of [-48,50]) block(c,x,35,1,11,'#a38b6b');
}

function paintGround(c,opened) {
  // Ambient occlusion below the shop and a longer cast plane toward the lower right.
  shape(c,'#24333135',[[-111,-83],[106,-83],[124,-60],[124,88],[103,98],[-94,98],[-112,82]]);
  shape(c,'#26362d62',[[-111,-83],[108,-83],[114,-72],[114,83],[104,89],[-108,89],[-111,84]]);
  if (!opened) {
    block(c,-halfWidth,-halfDepth,halfWidth*2,halfDepth*2,'#595f52');
    masonry(c,-halfWidth,halfDepth-3,halfWidth*2,8);
  }
  if (opened) {
    c.save();
    c.translate(-halfWidth,-halfDepth);
    drawHouseFloor(c,nativeFloor);
    c.restore();
    block(c,-halfWidth+wall,-halfDepth+3,halfWidth*2-wall*2,halfDepth*2-5,'#56413a35');
    block(c,-halfWidth+wall,-halfDepth+3,halfWidth*2-wall*2,7,'#382f2c57');
    block(c,-halfWidth+wall,-halfDepth+10,halfWidth*2-wall*2,6,'#382f2c26');
    floorRunner(c);
  }
  drawOllivandersArchitecturalAsset(c,'cobble_threshold',halfWidth+8,entranceHalf-2,1);
  // The sill runs along Y across the east-side opening; the upper half is a matching course.
  drawOllivandersArchitecturalAsset(c,'cobble_threshold',halfWidth+8,0,1);
  paintAmbient(c,opened);
  if (opened) {
    for (const {x,y,width,depth} of OLLIVANDERS_FURNITURE) {
      const left = x-Math.floor(width/2), right = x+Math.ceil(width/2);
      shape(c,'#352d2b35',[
        [left,y-depth+5],[right+2,y-depth+5],[right+6,y+1],
        [right+4,y+5],[left+3,y+5],[left-1,y+2],
      ]);
      block(c,left+2,y-1,width-3,3,'#382b294a');
    }
  }
}

function paintAmbient(c,opened) {
  if (opened) {
    c.save();
    c.beginPath();
    c.rect(-halfWidth+wall,-halfDepth+3,halfWidth*2-wall*2,halfDepth*2-6);
    c.clip();
    pool(c,89,-59,30,24); // Upper bay window warms the nearby floor.
    pool(c,-80,-59,24,17); // Sconce.
    pool(c,-67,-9,25,18); // Stained-glass task lamp.
    pool(c,94,8,28,26); // Setback entry.
    c.restore();
  } else {
    pool(c,-52,halfDepth+9,30,10);
    pool(c,52,halfDepth+9,30,10);
    pool(c,halfWidth+17,5,28,24);
  }
}

function drawStaticLayer(c,s,key,bounds,paint) {
  let canvas=localLayers.get(key);
  const {left,top,width,height}=bounds;
  if (!canvas && typeof document!=='undefined') {
    canvas=document.createElement('canvas');
    canvas.width=width;
    canvas.height=height;
    const pen=canvas.getContext('2d');
    pen.translate(-left,-top);
    paint(pen);
    localLayers.set(key,canvas);
  }
  c.save();
  c.translate(Math.round(s.x),Math.round(s.y));
  c.imageSmoothingEnabled=false;
  if (canvas) c.drawImage(canvas,left,top);
  else paint(c);
  c.restore();
}

const groundBounds={left:-halfWidth-17,top:-halfDepth-3,width:halfWidth*2+66,height:halfDepth*2+28};
const shellBounds={left:-halfWidth-14,top:-halfDepth-86,width:halfWidth*2+65,height:halfDepth*2+95};

export function drawOllivandersGround(c,s,opened) {
  drawStaticLayer(c,s,opened?'floor':'foundation',groundBounds,pen=>paintGround(pen,opened));
}

export function drawOllivandersArchitecture(c,s,opened) {
  drawStaticLayer(c,s,opened?'inside':'outside',shellBounds,opened?cutaway:exterior);
}
