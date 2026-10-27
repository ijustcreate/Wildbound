// Original native pixel drawing; draft/reference only. Run: node draw-lily-pad.cjs
// Edit the silhouette row spans, notch, cluster polygons or palette below.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const W = 32, H = 32, SCALE = 12;
const palette = ['#314a35', '#4c6640', '#70864a', '#9aab62'];
// Deliberately stepped oval, row 8 through 24 inclusive.
const spans = [[12,20],[9,23],[7,25],[6,26],[5,27],[4,28],[4,28],
  [3,28],[3,28],[3,28],[4,28],[4,27],[5,26],[6,25],[8,23],[10,21],[13,18]];
// An open wedge is the leaf's identifying detail, not a dark painted seam.
const notch = [[18,16],[29,12],[29,16]];
const highlight = [[7,12],[12,10],[19,10],[21,11],[17,13],[13,13],[9,15],[6,15]];
const shadow = [[4,19],[10,20],[18,21],[25,19],[28,18],[27,23],[20,25],[9,25]];
function inside(x,y,poly) {
  let hit = false;
  for (let i=0,j=poly.length-1;i<poly.length;j=i++) {
    const [a,b]=poly[i], [c,d]=poly[j];
    if ((b>y)!==(d>y) && x < (c-a)*(y-b)/(d-b)+a) hit=!hit;
  }
  return hit;
}
const mask = Array.from({length:H},()=>Array(W).fill(false));
spans.forEach(([a,b],row)=>{for(let x=a;x<=b;x++) mask[row+8][x]=!inside(x+.5,row+8.5,notch);});
const at=(x,y)=>!!mask[y]?.[x];
const pixels=Buffer.alloc(W*H*4);
for(let y=0;y<H;y++) for(let x=0;x<W;x++) {
  if(!at(x,y)) continue;
  let p=2;
  if(inside(x+.5,y+.5,shadow)) p=1;
  if(inside(x+.5,y+.5,highlight)) p=3;
  const edge=!at(x-1,y)||!at(x+1,y)||!at(x,y-1)||!at(x,y+1);
  // Stronger lower/right contour; upper lit edge stays softer.
  if(edge) p=(y>=17 || !at(x+1,y))?0:1;
  const rgb=palette[p].slice(1).match(/../g).map(h=>parseInt(h,16));
  pixels.set([...rgb,255],(y*W+x)*4);
}
function crc32(b) {
  let c=0xffffffff;
  for(const v of b) {c^=v;for(let k=0;k<8;k++) c=(c>>>1)^((c&1)?0xedb88320:0);}
  return (c^0xffffffff)>>>0;
}
function chunk(name,data) {
  const type=Buffer.from(name), len=Buffer.alloc(4), crc=Buffer.alloc(4);
  len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([type,data])));
  return Buffer.concat([len,type,data,crc]);
}
function png(w,h,rgba) {
  const hdr=Buffer.alloc(13);hdr.writeUInt32BE(w);hdr.writeUInt32BE(h,4);hdr[8]=8;hdr[9]=6;
  const rows=Buffer.alloc((w*4+1)*h);
  for(let y=0;y<h;y++) rgba.copy(rows,y*(w*4+1)+1,y*w*4,(y+1)*w*4);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',hdr),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
const enlarged=Buffer.alloc(W*H*SCALE*SCALE*4);
for(let y=0;y<H*SCALE;y++) for(let x=0;x<W*SCALE;x++) {
  const source=(Math.floor(y/SCALE)*W+Math.floor(x/SCALE))*4;
  pixels.copy(enlarged,(y*W*SCALE+x)*4,source,source+4);
}
const spriteFile=path.join(__dirname,'lily-pad-32.png');
const previewFile=path.join(__dirname,'lily-pad-preview-12x.png');
fs.writeFileSync(spriteFile,png(W,H,pixels));
fs.writeFileSync(previewFile,png(W*SCALE,H*SCALE,enlarged));
// Decode the actual saved PNGs, check chunk CRCs and exact RGBA round trips.
function verify(file,w,h,expected) {
  const data=fs.readFileSync(file), compressed=[];let offset=8;
  assert.equal(data.readUInt32BE(16),w);assert.equal(data.readUInt32BE(20),h);
  assert.equal(data[24],8);assert.equal(data[25],6);
  while(offset<data.length) {
    const n=data.readUInt32BE(offset),type=data.toString('ascii',offset+4,offset+8);
    assert.equal(crc32(data.subarray(offset+4,offset+8+n)),data.readUInt32BE(offset+8+n));
    if(type==='IDAT') compressed.push(data.subarray(offset+8,offset+8+n));
    offset+=12+n;
  }
  const rows=zlib.inflateSync(Buffer.concat(compressed)),decoded=Buffer.alloc(w*h*4);
  for(let y=0;y<h;y++) {assert.equal(rows[y*(w*4+1)],0);rows.copy(decoded,y*w*4,y*(w*4+1)+1,(y+1)*(w*4+1));}
  assert.deepEqual(decoded,expected);
}
verify(spriteFile,W,H,pixels);verify(previewFile,W*SCALE,H*SCALE,enlarged);
const counts={transparent:0,opaque:0,partialAlpha:0}, used=new Map();
let left=W,top=H,right=-1,bottom=-1;
for(let y=0;y<H;y++) for(let x=0;x<W;x++) {
  const i=(y*W+x)*4,a=pixels[i+3];
  if(!a) counts.transparent++;
  else if(a===255) {counts.opaque++;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
    const hex='#'+pixels.subarray(i,i+3).toString('hex');used.set(hex,(used.get(hex)||0)+1);
  } else counts.partialAlpha++;
}
const seen=new Set(), queue=[[left,15]];
while(queue.length) {const [x,y]=queue.pop(),key=y*W+x;if(!at(x,y)||seen.has(key))continue;seen.add(key);queue.push([x-1,y],[x+1,y],[x,y-1],[x,y+1]);}
assert.equal(counts.partialAlpha,0);assert.equal(used.size,4);assert.equal(seen.size,counts.opaque);
const evidence=JSON.parse(fs.readFileSync(path.join(__dirname,'..','evidence.json'),'utf8'));
const selected=[evidence.evidence[0],evidence.evidence[1]].map(({threadId,timestampUTC,userQuote,status,reference,interpretation})=>({threadId,timestampUTC,userQuote,status,reference,interpretation}));
const metadata={
  status:'draft-unapproved',purpose:'One original reference-only lily-pad study; no game integration.',
  artist:{name:'Wildbound Artist',role:'Pixel Artist',personaId:'b0edbefc-4705-4bd9-80dd-917a8777ddc4',injectedAuditMemoriesObserved:4},
  method:'Hand-authored native JS row silhouette and broad pixel clusters; no generative image tool.',
  contract:{canvas:[W,H],scale:'One source pixel per logical pixel; no antialiasing.',silhouette:'Flattened oval leaf with one open right-hand wedge.',light:'upper left',palette,pivot:[16,17],views:'Single static top/oblique reference view; eight-view set and rig attachment out of scope.',detail:'Notch only; no flower, texture, repeated primitive outlines or fine vein network.'},
  references:selected,
  borrowed:'Muted olive palette, broad flat clusters, restrained silhouette from retained approved swamp image. Earlier lily-pad praise is evidence of preference, not approval of this new sprite.',
  artifacts:{source:'draw-lily-pad.cjs',sprite:path.basename(spriteFile),preview:path.basename(previewFile),previewScale:SCALE,previewSampling:'nearest-neighbor'},
  checks:{spriteDimensions:[W,H],previewDimensions:[W*SCALE,H*SCALE],format:'PNG 8-bit RGBA',alphaCounts:counts,opaquePalette:Object.fromEntries(used),opaqueBounds:{left,top,right,bottom},connectedOpaquePixels:seen.size,crcAndDiskRoundTrip:'passed',previewExactReplication:'passed'},
  limitations:['New draft has no user aesthetic approval.','Existing lily art and original vegetation review were recovered separately; see comparison-provenance.json. This standalone draft is not an integrated replacement.','No runtime, lighting, water-scale, rig, animation or Electron integration verification of this draft.'],
  scope:'Only this lily-pad-test directory is written. No gameplay, authored rigs, saves, builds, commit or push.',
  visualReview:{status:'self-reviewed; user approval pending',observations:['One connected stepped leaf silhouette and broad flat clusters.','Narrowed the initial overlarge bite to a shallow right-hand wedge.','Four restrained olive greens; no texture, dithering or interior primitive outlines.'],acceptance:'Technical validity and self-review do not confer user aesthetic approval.'}
};
fs.writeFileSync(path.join(__dirname,'qa-status.json'),JSON.stringify(metadata,null,2)+'\n');
console.log(JSON.stringify(metadata.checks,null,2));
