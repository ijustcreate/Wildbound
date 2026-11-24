// The top of the sand, waterline and outer shelf are authored in world pixels.
// The broad apron at the middle connects the cave mouth to the west beach.
const coast=[
 [15030,7310,7442,7505],[15120,7310,7466,7540],[15296,7416,7592,7674],
 [15500,7584,7764,7852],[15766,7793,7945,8020],[16030,7970,8140,8220],
 [16350,8050,8254,8335],[16680,8112,8419,8509],[16970,8171,8436,8512],
 [17340,8216,8435,8515],[17740,8128,8315,8391],[18130,7987,8196,8280],
 [18410,7709,7932,7991],[18630,7516,7559,7648],[18660,7490,7490,7490],
];
export const GREYWAKE_SHORE_BOUNDS={left:15030,top:7294,right:18660,bottom:8532};

function coastAt(x){
 const index=coast.findIndex(point=>point[0]>x);
 const a=coast[index-1],b=coast[index],u=(x-a[0])/(b[0]-a[0]);
 const ripple=7*Math.sin(x*.051)+5*Math.sin(x*.119)+3*Math.sin(x*.213);
 const taper=Math.min(1,(GREYWAKE_SHORE_BOUNDS.right-x)/40);
 return [
  a[1]+(b[1]-a[1])*u+Math.round(ripple*.72*taper),
  a[2]+(b[2]-a[2])*u+Math.round(ripple*taper),
  a[3]+(b[3]-a[3])*u+Math.round(ripple*1.1*taper),
 ];
}

export function greywakeShoreAt(x,y){
 const b=GREYWAKE_SHORE_BOUNDS;
 if(x<b.left||x>=b.right||y<b.top||y>=b.bottom)return null;
 const [cliff,water,reef]=coastAt(x);
 if(y<cliff||y>=reef)return null;
 return y<water?'sand':'shallow';
}

const dry=['#bfa476','#c3a879','#c9ad7c','#cfb483','#d3b889'];
const damp=['#a18d68','#a9926d','#af986f','#b59d73'];
const tileSize=512,rasterScale=2,tiles=new Map();

function sandGrain(x,y){
 let n=Math.imul(x,374761393)^Math.imul(y,668265263);
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967296;
}

function sandNoise(x,y){
 const col=Math.floor(x),row=Math.floor(y),dx=x-col,dy=y-row;
 const u=dx*dx*(3-2*dx),v=dy*dy*(3-2*dy);
 const a=sandGrain(col,row),b=sandGrain(col+1,row),c=sandGrain(col,row+1),d=sandGrain(col+1,row+1);
 return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
}

function buildShoreTile(left,top){
 const size=tileSize/rasterScale;
 const tile=typeof OffscreenCanvas==='function'?new OffscreenCanvas(size,size):document.createElement('canvas');
 tile.width=tile.height=size;
 const c=tile.getContext('2d');
 let filled=false;
 for(let col=0;col<size;col++){
  const x=left+col*rasterScale+rasterScale/2;
  if(x<GREYWAKE_SHORE_BOUNDS.left||x>=GREYWAKE_SHORE_BOUNDS.right)continue;
  const [cliff,water]=coastAt(x);
  const begin=Math.max(0,Math.ceil((cliff-top-rasterScale/2)/rasterScale));
  const end=Math.min(size,Math.ceil((water-top-rasterScale/2)/rasterScale));
  if(end<=begin)continue;
  filled=true;
  for(let row=begin;row<end;){
   const y=top+row*rasterScale+rasterScale/2;
   const dune=sandNoise(x*.015,y*.026)*.67+sandNoise((x+100)*.037,y*.055)*.33;
   const wash=Math.sin(x*.049)*4+Math.sin(x*.17)*2;
   const band=water-y<24+wash?damp:dry;
   const tone=Math.round(dune*(band.length-1));
   const count=y>water-36||y<cliff+14?1:Math.min(3-(top/rasterScale+row)%3,end-row);
   c.fillStyle=y<cliff+8?'#877b60':band[tone];
   c.fillRect(col,row,1,count);
   row+=count;
  }
 }
 if(!filled)return null;
 for(let y=top+4;y<top+tileSize;y+=8)for(let x=left+4;x<left+tileSize;x+=8){
  const n=sandGrain(x,y);
  if(n>.12||greywakeShoreAt(x,y)!=='sand'||greywakeShoreAt(x+3,y)!=='sand')continue;
  c.fillStyle=n<.017?'#e7cc9e':n<.05?'#9c815e66':'#b6986d74';
  c.fillRect((x-left)/rasterScale,(y-top)/rasterScale,n<.017?2:1,1);
 }
 return tile;
}

export function drawGreywakeShore(c,bounds){
 const b=GREYWAKE_SHORE_BOUNDS,left=Math.max(b.left,bounds.left),top=Math.max(b.top,bounds.top);
 const right=Math.min(b.right,bounds.right),bottom=Math.min(b.bottom,bounds.bottom);
 if(left>=right||top>=bottom)return;
 c.save();c.imageSmoothingEnabled=false;
 for(let y=Math.floor(top/tileSize)*tileSize;y<bottom;y+=tileSize)for(let x=Math.floor(left/tileSize)*tileSize;x<right;x+=tileSize){
  const key=x+y*32;
  if(!tiles.has(key))tiles.set(key,buildShoreTile(x,y));
  const tile=tiles.get(key);
  if(tile)c.drawImage(tile,x,y,tileSize,tileSize);
 }
 c.restore();
}

export function drawGreywakeShoreMap(c){
 c.beginPath();
 for(const [i,[x,y]] of coast.entries())if(i)c.lineTo(x,y);else c.moveTo(x,y);
 for(let i=coast.length-1;i>=0;i--)c.lineTo(coast[i][0],coast[i][2]);
 c.closePath();c.fillStyle='#baa071';c.fill();
}
