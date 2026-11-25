const x = 18568, y = 8872;
const local = (dx, dy) => Object.freeze({x: x + dx, y: y + dy});

export const SKULL_ROCK = Object.freeze({
 id: 'skull-rock', name: 'Skull Rock', kind: 'coastal-landmark', x, y,
 approach: local(-216, 144), grotto: local(11, -12),
});

export const SKULL_ROCK_BOUNDS = Object.freeze({left:x-419,top:y-389,right:x+389,bottom:y+325});

const beach = [
 [-291,-92],[-280,-157],[-205,-209],[-147,-227],[-96,-250],[-30,-267],[58,-250],[105,-214],
 [170,-195],[205,-158],[266,-144],[307,-88],[307,-26],[286,5],[295,53],[250,99],[223,147],[157,171],
 [122,204],[58,213],[17,242],[-39,239],[-62,216],[-145,210],[-185,182],[-233,151],[-251,107],
 [-293,80],[-325,31],[-337,-22],[-317,-68],
];
const rock = [
 [-185,89],[-211,51],[-229,0],[-207,-73],[-203,-148],[-162,-209],[-88,-232],[-24,-224],
 [48,-228],[125,-186],[182,-164],[212,-102],[222,-33],[214,41],[189,85],[141,115],[90,124],
 [41,111],[-3,124],[-51,118],[-105,129],[-160,117],
];
const grotto = [
 [-73,145],[-69,91],[-60,66],[-52,15],[-39,-15],[-25,-40],[6,-51],[32,-44],
 [50,-23],[59,6],[69,35],[69,65],[62,91],[69,147],
];
const outcrops = [
 {x:-262,y:-58,w:43,h:54},{x:-273,y:34,w:31,h:39},{x:-203,y:-166,w:48,h:72},
 {x:-183,y:61,w:52,h:66},{x:-150,y:93,w:34,h:44},{x:121,y:85,w:46,h:57},
 {x:176,y:101,w:56,h:66},{x:204,y:61,w:52,h:48},{x:256,y:5,w:40,h:57},
 {x:251,y:-70,w:54,h:78},{x:201,y:-118,w:31,h:54},{x:232,y:144,w:31,h:39},
 {x:-113,y:196,w:23,h:19},{x:102,y:194,w:26,h:22},
];
const shoreDepth = 69;

function inside(dx,dy,shape) {
 let hit = false;
 for (let i=0,j=shape.length-1;i<shape.length;j=i++) {
  const [ax,ay]=shape[j], [bx,by]=shape[i];
  if ((ay>dy)!==(by>dy) && dx<ax+(bx-ax)*(dy-ay)/(by-ay)) hit=!hit;
 }
 return hit;
}

function edgeDistance(dx,dy,shape) {
 let distance = Infinity;
 for (let i=0,j=shape.length-1;i<shape.length;j=i++) {
  const [ax,ay]=shape[j], [bx,by]=shape[i], vx=bx-ax,vy=by-ay;
  const offset=Math.max(0,Math.min(1,((dx-ax)*vx+(dy-ay)*vy)/(vx*vx+vy*vy)));
  distance=Math.min(distance,(dx-ax-vx*offset)**2+(dy-ay-vy*offset)**2);
 }
 return Math.sqrt(distance);
}

function shoreMargin(dx,dy) {
 if (dx < -415 || dx > 385 || dy < -345 || dy > 321) return -Infinity;
 const scallops=6*Math.sin(dx*.039+dy*.021)+4*Math.sin(dy*.041-dx*.023)+3*Math.sin(dx*.124+dy*.096);
 return (inside(dx,dy,beach)?1:-1)*edgeDistance(dx,dy,beach)+scallops;
}

export function skullRockIntersects(left,top,right,bottom) {
 const bounds=SKULL_ROCK_BOUNDS;
 return left<bounds.right && top<bounds.bottom && right>bounds.left && bottom>bounds.top;
}

export function skullRockSurface(wx,wy) {
 const margin=shoreMargin(wx-x,wy-y);
 return margin>=0?'grass':margin>-shoreDepth?'shallow':null;
}

export function skullRockGround(wx,wy) {
 return skullRockSurface(wx,wy)==='grass'?'beach':null;
}

export function skullRockShoreDepth(wx,wy) {
 const margin=shoreMargin(wx-x,wy-y);
 return margin<=0 && margin>-shoreDepth ? -margin/shoreDepth : null;
}

export function skullRockBlocked(wx,wy,radius=8) {
 const dx=wx-x,dy=wy-y;
 if (dx < -312-radius || dx > 302+radius || dy < -248-radius || dy > 218+radius) return false;
 if (inside(dx,dy,grotto) && edgeDistance(dx,dy,grotto)>=radius) return false;
 if (inside(dx,dy,rock) || edgeDistance(dx,dy,rock)<radius) return true;
 return outcrops.some(stone=>((dx-stone.x)/(stone.w*.44+radius))**2+((dy-stone.y)/(stone.w*.23+radius))**2<1);
}

const extent={left:-356,top:-371,right:328,bottom:258};
const rasterScale=2;
let groundRaster=null,landmarkRaster=null;

function raster(paint) {
 const width=Math.ceil((extent.right-extent.left)/rasterScale);
 const height=Math.ceil((extent.bottom-extent.top)/rasterScale);
 const image=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):document.createElement('canvas');
 image.width=width;
 image.height=height;
 const c=image.getContext('2d');
 c.scale(1/rasterScale,1/rasterScale);
 c.translate(-extent.left,-extent.top);
 paint(c);
 return image;
}

function drawRaster(c,bounds,make) {
 if (!skullRockIntersects(bounds.left,bounds.top,bounds.right,bounds.bottom)) return;
 const image=make();
 c.save();
 c.imageSmoothingEnabled=false;
 c.drawImage(image,x+extent.left,y+extent.top,image.width*rasterScale,image.height*rasterScale);
 c.restore();
}

function polygon(c,points,color) {
 c.beginPath();
 c.moveTo(...points[0]);
 for (let i=1;i<points.length;i++) c.lineTo(...points[i]);
 c.closePath();
 c.fillStyle=color;
 c.fill();
}

function seam(c,points,color,width) {
 c.beginPath();
 c.moveTo(...points[0]);
 for (let i=1;i<points.length;i++) c.lineTo(...points[i]);
 c.lineWidth=width;
 c.strokeStyle=color;
 c.stroke();
}

function hash(dx,dy) {
 let n=Math.imul(dx|0,1274126177)^Math.imul(dy|0,668265263);
 n=Math.imul(n^(n>>>13),1597334677);
 return ((n^(n>>>16))>>>0)/4294967296;
}

const sand=['#9f8f75','#b59b76','#c6aa83','#cfb590','#d7bf9d','#ddc6a7'];

function ground(c) {
 // Short contour-aligned runs link the shore material to its collision mask.
 for (let dy=-284;dy<=256;dy+=2) {
  let prior=-1,start=extent.left;
  for (let dx=start;dx<=extent.right;dx+=2) {
   const depth=shoreMargin(dx+1,dy+1);
   const grain=1.8*Math.sin(dx*.029+dy*.035)+.8*Math.sin(dx*.101-dy*.087);
   const tone=depth<0?-1:depth<8?0:depth<18?1:Math.max(2,Math.min(5,Math.round(3.5+grain*.45)));
   if (tone===prior) continue;
   if (prior>=0) {
    c.fillStyle=sand[prior];
    c.fillRect(start,dy,dx-start,2);
   }
   start=dx;
   prior=tone;
  }
 }
 for(let dy=-192;dy<243;dy+=8)for(let dx=-331;dx<303;dx+=8) {
  const sample=hash(dx,dy);
  if(sample>.22 || shoreMargin(dx,dy)<13 || inside(dx,dy,rock)) continue;
  c.fillStyle=sample>.105?'#9f856d72':'#ecd4b6a8';
  c.fillRect(dx,dy,sample<.044?6:2,2);
 }
 polygon(c,[[-73,128],[-65,89],[-56,39],[-35,-13],[4,-49],[38,-40],[61,-4],[73,65],[69,125],
  [46,138],[22,144],[-12,139],[-49,146]],'#746957');
 polygon(c,[[-60,116],[-47,65],[-32,53],[-9,49],[12,56],[44,48],[61,66],[60,96],[55,109],
  [43,122],[7,127],[-17,122],[-32,131]],'#928168');
 polygon(c,[[-52,57],[-39,9],[-20,-27],[2,-34],[29,-29],[49,-2],[61,40],[45,29],[33,36],
  [10,29],[-12,34],[-35,25],[-45,38]],'#53574b');
 polygon(c,[[-35,87],[-18,68],[7,67],[19,60],[46,62],[53,75],[41,83],[19,83],[6,95],[-15,93]],'#a18d72');
 for (const [dx,dy,wide] of [[-32,77,18],[11,44,25],[12,113,27],[-27,114,14],[31,88,19],[-14,18,24],[-15,100,14]]) {
  seam(c,[[dx,dy],[dx+wide*.42,dy-3],[dx+wide,dy-3]],'#6f6859',2);
 }
 polygon(c,[[-41,38],[-26,29],[-9,29],[1,31],[6,37],[-9,43],[-25,42],[-36,45]],'#596c63');
 seam(c,[[-31,37],[-22,35],[-11,35],[-4,37]],'#8c9b7e',2);
 for (const [dx,dy] of [[-214,134],[-169,160],[149,156],[214,101],[-270,72],[126,179]]) {
  polygon(c,[[dx-5,dy],[dx+2,dy-4],[dx+8,dy-2],[dx+8,dy+3],[dx,dy+4]],'#f0d6bc');
  seam(c,[[dx+1,dy-1],[dx+5,dy]],'#a58c76',2);
 }
}

const profile=[
 [-207,20],[-223,-24],[-218,-68],[-230,-106],[-222,-155],[-201,-209],[-171,-249],
 [-146,-288],[-104,-316],[-63,-334],[-12,-343],[15,-337],[63,-337],[112,-321],
 [154,-296],[183,-262],[206,-214],[222,-171],[222,-123],[207,-86],[196,-71],
 [206,-38],[185,-3],[173,37],[188,71],[159,103],[119,119],[86,106],[69,76],
 [67,45],[62,18],[48,-14],[31,-40],[7,-48],[-18,-40],[-35,-18],[-49,17],
 [-59,43],[-64,75],[-76,104],[-114,114],[-162,99],[-195,73],
];

function carve(c,shape,rim,recess) {
 polygon(c,shape,rim);
 polygon(c,recess,'#1d2b2d');
}

function drawOutcrop(c,stone,style) {
 const {x,y,w,h}=stone;
 const a=-.52*w,b=.48*w;
 c.save();
 c.translate(x,y);
 polygon(c,[[a+6,3],[b-4,-7],[b+16,2],[b+24,12],[a+4,17],[a-8,11]],'#26372f55');
 polygon(c,[[a,4],[a-2,-h*.30],[-w*.21,-h*.85],[w*.04,-h],[w*.28,-h*.73],[b,-h*.23],[b,5],[w*.15,9]],'#3f504f');
 polygon(c,[[a+2,3],[a+1,-h*.29],[-w*.21,-h*.84],[w*.035,-h+.5],[w*.14,-h*.62],[-w*.02,-h*.21],[-w*.12,7]],style?'#7c8374':'#686f64');
 polygon(c,[[w*.035,-h+.5],[w*.28,-h*.72],[b,-h*.22],[b,4],[w*.14,9],[-w*.12,7],[-w*.02,-h*.21],[w*.14,-h*.62]],'#505e58');
 seam(c,[[a+3,-h*.29],[-w*.29,-h*.73],[w*.035,-h+.5]],style?'#9a9780':'#858676',2);
 if(style)polygon(c,[[-w*.25,-h*.6],[-w*.19,-h*.84],[w*.035,-h+.5],[w*.19,-h*.74],[w*.05,-h*.69],[-w*.06,-h*.72],[-w*.13,-h*.6]],'#61734d');
 c.restore();
}

function moss(c,points,highlights) {
 polygon(c,points,'#536448');
 for (const patch of highlights) polygon(c,patch,'#718459');
}

function landmark(c) {
 const back=outcrops.filter(stone=>stone.y<37), front=outcrops.filter(stone=>stone.y>=37);
 for(const [i,stone] of back.entries()) drawOutcrop(c,stone,i%2===0);
 polygon(c,[[-209,37],[-137,33],[-78,65],[-57,115],[-86,146],[-161,143],[-238,101],[-249,74]],'#26382f56');
 polygon(c,[[72,59],[180,49],[225,63],[235,95],[211,128],[139,153],[74,134],[62,105]],'#26382f66');
 polygon(c,profile,'#3a4a49');
 // Broad side and front planes keep the silhouette legible behind the player.
 polygon(c,[[-172,-245],[-144,-285],[-102,-314],[-59,-333],[-12,-341],[16,-335],[64,-335],[113,-318],[157,-292],
  [183,-259],[206,-214],[220,-171],[221,-126],[205,-88],[194,-70],[203,-39],[184,-5],[170,37],[185,71],
  [158,102],[122,116],[86,104],[70,75],[67,43],[63,18],[48,-14],[29,-37],[4,-43],[-19,-33],[-42,-4],
  [-53,28],[-69,64],[-82,95],[-116,105],[-160,93],[-190,69],[-206,20],[-220,-25],[-217,-68],[-228,-107],[-221,-154],[-201,-207]],'#69736a');
 polygon(c,[[44,-332],[98,-322],[151,-300],[181,-259],[207,-213],[220,-171],[220,-126],[202,-88],[186,-65],
  [201,-36],[182,-5],[169,34],[186,69],[151,102],[120,115],[86,104],[71,78],[66,56],[65,25],[59,-16],
  [94,-42],[118,-77],[127,-120],[117,-181],[97,-231],[76,-262]],'#485954');
 polygon(c,[[-222,-106],[-216,-151],[-199,-204],[-174,-245],[-144,-285],[-101,-311],[-61,-331],[-12,-339],[19,-333],
  [49,-315],[79,-282],[93,-251],[102,-210],[85,-179],[66,-147],[34,-132],[-1,-119],[-32,-118],
  [-66,-88],[-101,-73],[-148,-66],[-180,-83],[-211,-90]],'#858879');
 polygon(c,[[-213,-154],[-197,-206],[-173,-244],[-144,-283],[-104,-309],[-61,-328],[-11,-336],[22,-330],[42,-315],
  [19,-309],[-19,-311],[-65,-301],[-101,-277],[-114,-251],[-145,-237],[-155,-212],[-185,-201],[-190,-179]],'#a2a085');
 polygon(c,[[-217,-94],[-186,-91],[-150,-72],[-111,-72],[-81,-89],[-68,-107],[-63,-103],[-67,-70],
  [-88,-41],[-114,-14],[-118,18],[-139,46],[-176,57],[-196,38],[-203,13],[-218,-20]],'#778173');
 polygon(c,[[47,-127],[72,-151],[87,-179],[102,-210],[119,-184],[129,-152],[124,-119],[113,-86],[95,-56],
  [70,-36],[54,-32],[33,-55],[31,-80]],'#737c6f');
 polygon(c,[[-199,-51],[-171,-43],[-140,-40],[-114,-31],[-87,-14],[-66,-32],[-42,-62],[-20,-66],[1,-57],[21,-37],
  [39,-37],[58,-52],[75,-57],[87,-42],[64,-18],[48,-13],[33,-38],[9,-48],[-23,-37],[-40,-10],
  [-54,22],[-62,43],[-75,75],[-94,87],[-131,95],[-160,83],[-187,63],[-200,28],[-201,-4]],'#93917d');

 carve(c,[[-183,-168],[-168,-185],[-143,-197],[-105,-201],[-76,-189],[-63,-165],[-69,-136],[-90,-116],
  [-128,-111],[-157,-119],[-176,-138]],
  '#556456', [[-175,-161],[-162,-180],[-138,-192],[-105,-194],[-79,-183],[-70,-163],[-77,-143],
  [-95,-127],[-129,-123],[-158,-129],[-170,-141]]);
 carve(c,[[-41,-169],[-20,-195],[8,-206],[43,-208],[71,-196],[83,-174],[76,-148],[56,-125],[23,-113],[-7,-120],[-30,-137]],
  '#525e54', [[-33,-166],[-15,-189],[10,-199],[42,-201],[65,-193],[74,-172],[67,-151],[52,-135],
  [22,-125],[-6,-129],[-24,-143]]);
 polygon(c,[[-63,-181],[-67,-155],[-78,-121],[-58,-110],[-44,-132],[-29,-149],[-40,-180]],'#a2a08a');
 carve(c,[[-59,-121],[-44,-134],[-33,-131],[-20,-117],[-8,-91],[-26,-83],[-51,-85],[-67,-95]],
  '#5a685d', [[-57,-113],[-44,-129],[-34,-127],[-22,-115],[-15,-96],[-33,-91],[-54,-92],[-61,-99]]);
 seam(c,[[-174,-123],[-148,-113],[-123,-113],[-101,-118]],'#aa9e83',4);
 seam(c,[[-24,-129],[-9,-121],[23,-115],[52,-125]],'#a69d82',4);

 // The shadowed arch is raised above the floor silhouette used by the collision mask.
 polygon(c,[[-65,73],[-59,31],[-54,-4],[-44,-40],[-20,-62],[13,-69],[39,-51],[52,-31],[58,-4],[62,28],
  [69,68],[58,55],[51,22],[39,-7],[24,-21],[3,-28],[-23,-18],[-41,5],[-52,37]],'#313e3b');
 polygon(c,[[-56,46],[-51,11],[-46,-34],[-22,-55],[11,-61],[33,-45],[47,-23],[54,13],[49,4],[39,-11],[20,-25],
  [0,-34],[-24,-25],[-40,-7],[-48,17]],'#223231');
 polygon(c,[[-65,-47],[-54,-67],[-37,-74],[-15,-68],[-4,-61],[-9,-48],[-23,-41],[-42,-37],[-54,-23]],'#a1967f');
 polygon(c,[[-21,-68],[-5,-74],[14,-69],[23,-56],[15,-48],[-4,-48]],'#b0a389');
 polygon(c,[[15,-68],[34,-67],[49,-55],[54,-38],[49,-33],[33,-47],[21,-46]],'#a5977f');
 polygon(c,[[48,-59],[68,-66],[81,-55],[69,-34],[56,-26],[50,-36]],'#7c8070');
 seam(c,[[-63,-52],[-51,-64],[-39,-68],[-24,-65]],'#bcad8f',3);
 seam(c,[[78,-53],[61,-38],[54,-23],[60,-1]],'#536155',3);
 seam(c,[[-146,16],[-136,36],[-147,62],[-130,88]],'#5e6c61',4);

 seam(c,[[-123,-305],[-125,-278],[-149,-257],[-166,-220],[-192,-203]],'#767c6b',5);
 seam(c,[[-186,-225],[-164,-226],[-150,-232],[-131,-230],[-117,-244],[-100,-247]],'#71786a',3);
 seam(c,[[-103,-249],[-118,-236],[-128,-236],[-135,-225]],'#91917c',2);
 seam(c,[[37,-313],[31,-286],[46,-261],[49,-241],[34,-221]],'#6c7467',4);
 seam(c,[[10,-294],[22,-284],[31,-286]],'#69756a',3);
 seam(c,[[93,-277],[104,-259],[117,-258],[128,-251],[151,-250]],'#68746a',4);
 seam(c,[[151,-269],[163,-235],[151,-207],[161,-171],[149,-147],[154,-105]],'#344743',5);
 seam(c,[[169,-201],[179,-175],[171,-145],[184,-122],[179,-91]],'#607067',3);
 seam(c,[[193,-68],[178,-49],[163,-39],[151,-16],[130,-2]],'#364744',4);
 seam(c,[[-176,-78],[-151,-65],[-121,-66],[-104,-57]],'#596a5e',4);
 seam(c,[[-190,-47],[-176,-40],[-166,-40],[-155,-34]],'#a09d86',3);
 moss(c,[[-193,-206],[-177,-225],[-165,-249],[-139,-273],[-103,-298],[-74,-300],[-80,-286],[-109,-272],
  [-120,-257],[-141,-249],[-152,-231],[-176,-225]],
  [[[-168,-244],[-139,-270],[-109,-291],[-76,-296],[-95,-281],[-113,-278],[-128,-262],[-151,-251]]]);
 moss(c,[[-49,-330],[-13,-345],[7,-341],[29,-338],[64,-337],[93,-328],[117,-314],[110,-303],
  [80,-303],[57,-313],[26,-312],[11,-322],[-19,-318],[-36,-322]],
  [[[-31,-330],[-15,-342],[7,-337],[29,-334],[65,-333],[82,-327],[61,-325],[37,-327],[16,-326],[1,-330]]]);
 moss(c,[[-179,-42],[-157,-50],[-130,-40],[-108,-19],[-122,-4],[-144,-7],[-161,-17],[-171,-16]],
  [[[-173,-42],[-156,-46],[-132,-39],[-118,-25],[-136,-24],[-145,-33],[-162,-32]]]);
 moss(c,[[111,-258],[140,-248],[160,-234],[166,-210],[157,-199],[148,-220],[128,-223],[123,-234],[106,-238]],
  [[[113,-249],[134,-246],[154,-232],[146,-227],[125,-232],[120,-242]]]);

 for(let dy=-325;dy<113;dy+=9)for(let dx=-215;dx<212;dx+=10) {
  const n=hash(dx+718,dy);
  if(n>.21 || !inside(dx,dy,profile) || inside(dx,dy,grotto) || dy>-210&&dy<-82&&dx>-189&&dx<88)continue;
  c.fillStyle=n>.1?'#c0b69926':'#30433e5e';
  c.fillRect(dx,dy,n>.1?4:6,2);
 }
 for(const [i,stone] of front.entries()) drawOutcrop(c,stone,i%3!==0);
}

export function drawSkullRockGround(c,bounds) {
 drawRaster(c,bounds,()=>groundRaster??=raster(ground));
}

export function drawSkullRockLandmark(c,bounds) {
 drawRaster(c,bounds,()=>landmarkRaster??=raster(landmark));
}

export function drawSkullRockMap(c) {
 c.save();
 c.translate(x,y);
 polygon(c,beach,'#c4ad80');
 polygon(c,rock,'#6b796d');
 polygon(c,[[-145,-108],[-141,-167],[-102,-208],[-34,-225],[40,-222],[115,-192],
  [151,-133],[140,-48],[111,-5],[87,53],[55,72],[38,49],[-44,50],[-68,72],[-107,57],[-133,21]],'#97a18e');
 polygon(c,[[-108,-121],[-63,-129],[-49,-90],[-81,-72],[-112,-83]],'#334b48');
 polygon(c,[[13,-126],[62,-128],[81,-98],[55,-75],[17,-89]],'#334b48');
 polygon(c,[[-38,-62],[-23,-86],[-10,-63],[-18,-50]],'#52615a');
 polygon(c,[[-31,-34],[-11,-61],[22,-64],[42,-40],[54,28],[-45,29]],'#384a46');
 c.restore();
}
