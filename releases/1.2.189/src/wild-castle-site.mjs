const x=17840,y=1735;
export const CASTLE_INTERIOR_SIZE={width:960,height:768};
const box=(left,top,right,bottom)=>Object.freeze({left,top,right,bottom});
const castle=box(17560,1500,18120,1940);
const island=box(17495,1430,18185,2010);
// The grass lip is the water boundary. Clockwise from the northwest inlet.
export const CASTLE_OUTER_BANK=Object.freeze([
 [17362,1356],[17412,1328],[17472,1294],[17522,1290],[17566,1308],
 [17619,1310],[17660,1280],[17719,1264],[17789,1278],[17837,1308],
 [17891,1320],[17945,1302],[18003,1308],[18056,1336],[18112,1326],
 [18166,1342],[18204,1374],[18255,1382],[18283,1410],[18289,1455],
 [18329,1499],[18346,1554],[18331,1605],[18290,1639],[18277,1691],
 [18310,1736],[18336,1791],[18331,1854],[18305,1909],[18319,1958],
 [18307,2011],[18261,2050],[18218,2094],[18172,2143],[18111,2168],
 [18057,2163],[18010,2139],[17964,2142],[17920,2129],[17889,2122],
 [17791,2122],[17751,2133],[17705,2152],[17645,2178],[17595,2174],
 [17555,2156],[17521,2122],[17467,2113],[17417,2089],[17392,2054],
 [17347,2034],[17324,1995],[17323,1947],[17367,1904],[17391,1852],
 [17375,1804],[17339,1764],[17305,1716],[17298,1652],[17312,1597],
 [17350,1562],[17372,1518],[17351,1479],[17328,1440],[17329,1393],
].map(point=>Object.freeze(point)));
const bankX=CASTLE_OUTER_BANK.map(p=>p[0]),bankY=CASTLE_OUTER_BANK.map(p=>p[1]);
const moat=box(Math.min(...bankX),Math.min(...bankY),Math.max(...bankX),Math.max(...bankY));
const drawbridge=box(17802,2005,17878,2076);
const bridge=box(17802,2074,17878,2168);
const door=Object.freeze({x,y:castle.bottom,half:25});
const towers=Object.freeze([
 {x:castle.left,y:castle.top},{x:castle.right,y:castle.top},
 {x:castle.left,y:castle.bottom},{x:castle.right,y:castle.bottom},
].map(point=>Object.freeze({...point,r:55})));

export const GREYHAVEN=Object.freeze({
 id:'castle-greyhaven',name:'Castle Greyhaven',x,y,
 castle,island,moat,drawbridge,bridge,door,towers,entry:Object.freeze({x,y:1967}),
 bounds:box(moat.left-32,moat.top-32,moat.right+32,Math.max(moat.bottom+32,bridge.bottom+36)),
});

export function castleSiteIntersects(left,top,right,bottom,pad=0){
 const b=GREYHAVEN.bounds;
 return left<b.right+pad&&right>b.left-pad&&top<b.bottom+pad&&bottom>b.top-pad;
}

export function castleSiteAt(x,y,pad=0){
 return castleSiteIntersects(x,y,x,y,pad);
}

const contains=(b,x,y,pad=0)=>x>=b.left-pad&&x<=b.right+pad&&y>=b.top-pad&&y<=b.bottom+pad;
export function castleChamfer(b,x,y,corner){
 if(!contains(b,x,y))return false;
 return Math.min(x-b.left,b.right-x)+Math.min(y-b.top,b.bottom-y)>=corner;
}

export function castleOuterBankPoint(edgeIndex,t,offset=0){
 const [ax,ay]=CASTLE_OUTER_BANK[edgeIndex];
 const [bx,by]=CASTLE_OUTER_BANK[(edgeIndex+1)%CASTLE_OUTER_BANK.length];
 const dx=bx-ax,dy=by-ay;
 const scale=offset/Math.hypot(dx,dy);
 return {x:ax+dx*t+dy*scale,y:ay+dy*t-dx*scale};
}

const bankBandSize=32;
const bankBands=Array.from({length:Math.ceil((moat.bottom-moat.top)/bankBandSize)},()=>[]);
const bankEdgeBounds=[];
CASTLE_OUTER_BANK.forEach(([ax,ay],i)=>{
 const [bx,by]=CASTLE_OUTER_BANK[(i+1)%CASTLE_OUTER_BANK.length];
 const top=Math.min(ay,by),bottom=Math.max(ay,by);
 bankEdgeBounds.push(box(Math.min(ax,bx),top,Math.max(ax,bx),bottom));
 if(ay===by)return;
 const edge={ax,ay,top,bottom,slope:(bx-ax)/(by-ay)};
 for(let row=Math.floor((top-moat.top)/bankBandSize);row<Math.ceil((bottom-moat.top)/bankBandSize);row++){
  bankBands[row].push(edge);
 }
});

export function castleSurface(x,y){
 if(!contains(moat,x,y))return null;
 if(castleChamfer(island,x,y,48))return 'grass';
 const edges=bankBands[Math.floor((y-moat.top)/bankBandSize)];
 if(!edges)return null;
 let inside=false;
 for(const {ax,ay,top,bottom,slope} of edges){
  if(y>=top&&y<bottom&&x<ax+(y-ay)*slope)inside=!inside;
 }
 return inside?'water':null;
}

// Conservative tile query for water while the streamed mask is pending. A
// crooked inlet can cut through a tile while leaving all four corners dry.
export function castleMoatIntersects(left,top,right,bottom){
 if(right<moat.left||left>moat.right||bottom<moat.top||top>moat.bottom)return false;
 if(castleSurface(left,top)==='water'||castleSurface(right,top)==='water'||
    castleSurface(left,bottom)==='water'||castleSurface(right,bottom)==='water')return true;
 return castleOuterBankIntersects(left,top,right,bottom);
}

export function castleOuterBankIntersects(left,top,right,bottom){
 return bankEdgeBounds.some(edge=>left<=edge.right&&right>=edge.left&&top<=edge.bottom&&bottom>=edge.top);
}

export function castleDeckAt(x,y,raised=false){
 return contains(bridge,x,y)||!raised&&contains(drawbridge,x,y)?10:0;
}

export function castleExteriorBlocked(x,y,radius=0,raised=false,from=null){
 if(!castleSiteAt(x,y,radius))return false;
 if(towers.some(t=>Math.hypot(x-t.x,y-t.y)<t.r+radius))return true;
 if(contains(castle,x,y,radius)){
  const throughDoor=Math.abs(x-door.x)<door.half-radius&&y>=door.y-18;
  return !throughDoor;
 }
 if(raised&&contains(drawbridge,x,y,Math.min(radius,6)))return true;
 if(!from||castleChamfer(island,x,y,48)===castleChamfer(island,from.x,from.y,48))return false;
 return raised||Math.abs(x-door.x)>door.half+6||y<drawbridge.top-12;
}
