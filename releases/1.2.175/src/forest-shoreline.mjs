import {waterAt} from './environment.mjs';
import {forestHash,forestNoise} from './forest-landscape.mjs';
import {riverCorners,riverTileRuns} from './river-edges.mjs';
import {drawWaterSurface} from './water-surface.mjs';

const wet = kind => ['water','shallow','bridge','floodbridge'].includes(kind);
const normals = [[1,0],[-1,0],[0,1],[0,-1]];
const outlineCache = new Map();

function tileOutline(corners,shallow){
  const neighbors = [corners[0].a,corners[1].a,corners[0].b,corners[2].b].map(wet);
  const shape = shallow ? riverTileRuns(corners) : null;
  const key = shape?.key ?? `full:${neighbors.map(Number).join('')}`;
  let outline = outlineCache.get(key);
  if(outline) return outline;

  const mask = new Uint8Array(256);
  if(shape) for(const [x,y,w] of shape.runs) mask.fill(1,y*8+x/2,y*8+(x+w)/2);
  else mask.fill(1);
  outline = [];
  for(const [index,[nx,ny]] of normals.entries()){
    for(let inset=0;inset<16;inset++){
      let start = -1;
      for(let along=0;along<=16;along++){
        const x = nx ? inset : along;
        const y = ny ? inset : along;
        const outside = inset-(nx||ny);
        const neighborWet = outside<0||outside>15 ? neighbors[index] : mask[(y-ny)*16+x-nx];
        const exposed = along<16 && mask[y*16+x] && !neighborWet;
        if(exposed && start<0) start = along;
        if(exposed || start<0) continue;
        // Longer, joined runs keep the cream line continuous across the mask's pixel steps.
        for(let at=start;at<along;at+=2){
          const length = 2*Math.min(2,along-at);
          outline.push([nx ? inset*2+(nx<0?2:0) : at*2,
            ny ? inset*2+(ny<0?2:0) : at*2,nx,ny,length]);
        }
        start = -1;
      }
    }
  }
  outlineCache.set(key,outline);
  return outline;
}

export function forestShoreline(g,x,y,kind){
  if(kind==='bridge') return [];
  const corners = riverCorners((tx,ty)=>waterAt(g,tx*32+16,ty*32+16),x/32,y/32);
  return tileOutline(corners,kind==='shallow').map(([px,py,nx,ny,length])=>forestBankEdge(x+px,y+py,nx,ny,length,g.seed));
}

export function forestBankEdge(x,y,nx,ny,length,seed=0){
  const bank = forestNoise(x/36,y/36,seed);
  const grain = forestHash(x+seed,y);
  const along = nx ? y : x;
  return {x,y,nx,ny,length,depth:3+Math.round(bank*3)+(ny>0?2:0),
    sun:ny>=0,grain,moss:bank>.3&&grain>.19,phase:x*.051+y*.043,
    breakAt:Math.sin(along*.13+(nx?x:y)*.036)+Math.sin(along*.31)*.36};
}

function strip(c,edge,offset,width){
  const {x,y,nx,ny,length} = edge;
  c.fillRect(x+nx*offset-(nx<0?width:0),y+ny*offset-(ny<0?width:0),nx?width:length,ny?width:length);
}

export function drawForestWater(c,g,x,y,kind,width=32,height=32){
  drawWaterSurface(c,g,x,y,width,height,{shallow:false,shoreRipples:false});
  c.fillStyle = kind==='shallow' ? '#a1ab7793' : '#91a07485';
  c.fillRect(x,y,width,height);

  const time = g.time||0;
  c.fillStyle = '#f1ebc969';
  for(let row=Math.floor(y/84)*84;row<y+height;row+=84){
    for(let col=Math.floor((x-16)/96)*96;col<x+width;col+=96){
      const grain=forestHash(col,row);
      const shimmer=Math.sin(time*2+grain*16);
      if(shimmer<.2) continue;
      const py=row+Math.floor(forestHash(row,col)*84);
      const px=col+Math.floor(grain*92+(1-shimmer)*6);
      if(py<y || py+1>y+height) continue;
      const left=Math.max(x,px),right=Math.min(x+width,px+Math.round(3+shimmer*7));
      if(right>left) c.fillRect(left,py,right-left,1);
    }
  }
}

export function drawForestBankBase(c,shore){
  c.fillStyle = '#424d3a73';
  for(const edge of shore) strip(c,edge,edge.depth,4);
  for(const edge of shore){
    c.fillStyle = edge.sun ? '#9a8155' : '#776b4c';
    strip(c,edge,0,edge.depth);
  }
  for(const edge of shore){
    c.fillStyle = edge.moss ? (edge.grain>.6 ? '#92a060' : '#748454') : '#c3ab73';
    strip(c,edge,0,edge.moss ? 2 : 1);
    if(edge.grain>.72){
      c.fillStyle = edge.sun ? '#c5a76f' : '#a18b60';
      strip(c,edge,edge.depth-2,1);
    }
  }
}

export function drawForestBankFlow(c,shore,time){
  if(!shore.length) return;
  c.save();
  const opacity = c.globalAlpha;
  c.fillStyle = '#f8efce';
  for(const edge of shore){
    const pulse = Math.sin(time*2.25-edge.phase);
    const lace = edge.breakAt+pulse*.65;
    if(lace<-.48) continue;
    c.globalAlpha = opacity*(.5+(lace+.48)*.21);
    strip(c,edge,edge.depth+(pulse>.24?1:0),1);
    if(lace>1.18){
      c.globalAlpha = opacity*(.5+.5*pulse)*.31;
      strip(c,edge,edge.depth+4+Math.round((1-pulse)*2),1);
    }
  }
  c.restore();
}

export function drawForestBank(c,g,x,y,kind){
  const shore = forestShoreline(g,x,y,kind);
  drawForestBankBase(c,shore);
  drawForestBankFlow(c,shore,g.time||0);
}
