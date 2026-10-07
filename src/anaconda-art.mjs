import {anacondaBody,ANACONDA_SEGMENTS} from './anaconda-body.mjs';
export const ANACONDA_ART_CACHE_LIMIT=128;
const cache=new Map(),PIXEL=2,SIZE=56;
const palette={outline:'#263d2a',dark:'#3c532f',olive:'#657b3d',light:'#8fa550',belly:'#c4b46c',spot:'#25372b',eye:'#f1c66a',mouth:'#552c31',fang:'#e8dfb2'};
export const anacondaArtCacheSize=()=>cache.size;

function bitmap(radius,direction,head,mouth){
  const key=[radius,direction,head,mouth].join(':');
  if(cache.has(key))return cache.get(key);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=SIZE;
  const ctx=canvas.getContext('2d'),angle=direction*Math.PI/4,c=Math.cos(angle),s=Math.sin(angle);
  for(let y=-26;y<=26;y+=PIXEL)for(let x=-26;x<=26;x+=PIXEL){
    const along=x*c+y*s,across=-x*s+y*c;
    const width=head?15:radius,length=head?22:Math.max(radius,8);
    const edge=along*along/(length*length)+across*across/(width*width);
    if(edge>1)continue;
    let color=edge>.77?palette.outline:across>width*.42?palette.belly:across<-width*.25?palette.light:palette.olive;
    if(!head&&edge<.67){
      const spot=Math.abs(along)<4&&Math.abs(across)>3&&Math.abs(across)<8;
      if(spot)color=palette.spot;
      else if((Math.floor(along/4)+Math.floor(across/4))%3===0)color=palette.dark;
    }
    if(head){
      if(along>5&&along<11&&Math.abs(across)>7&&Math.abs(across)<12)color=palette.eye;
      if(along>7&&along<10&&Math.abs(across)>8&&Math.abs(across)<11)color=palette.spot;
      if(along>12&&Math.abs(across)<(mouth?10:5))color=mouth?palette.mouth:palette.dark;
      if(mouth&&along>13&&along<19&&Math.abs(across)>5&&Math.abs(across)<8)color=palette.fang;
      if(along<-3&&Math.abs(across)<5)color=palette.dark;
    }
    ctx.fillStyle=color;ctx.fillRect(x+SIZE/2,y+SIZE/2,PIXEL,PIXEL);
  }
  if(cache.size>=ANACONDA_ART_CACHE_LIMIT)cache.delete(cache.keys().next().value);
  cache.set(key,canvas);return canvas;
}

function alpha(e){return e.hp<=0?Math.max(0,1-(e.deathTimer||0)/3.5):1;}
export function drawAnacondaShadow(ctx,e,index){
  const p=anacondaBody(e).segments[index];if(!p)return;
  ctx.save();ctx.globalAlpha*=alpha(e)*.18;ctx.fillStyle='#152d24';
  const rx=Math.ceil(p.radius),ry=Math.max(2,Math.ceil(p.radius*.42));
  for(let y=-ry;y<=ry;y+=2){const width=Math.ceil(rx*Math.sqrt(Math.max(0,1-y*y/(ry*ry))));if(width)ctx.fillRect(Math.round(p.x-width),Math.round(p.y+y+2),width*2,2);}
  ctx.restore();
}

export function drawAnacondaSegment(ctx,e,index,time=0){
  const points=anacondaBody(e).segments,p=points[index];if(!p)return;
  const next=points[Math.min(index+1,points.length-1)],previous=points[Math.max(0,index-1)];
  const angle=index===0?Math.atan2(e.faceY||0,e.faceX||1):Math.atan2(previous.y-next.y,previous.x-next.x);
  const direction=(Math.round(angle/(Math.PI/4))+8)%8,head=index===0,mouth=head&&['windup','bite'].includes(e.state);
  const rise=e.hp>0&&head?(e.state==='windup'?9:e.state==='bite'?5:2):0;
  ctx.save();ctx.globalAlpha*=alpha(e);ctx.imageSmoothingEnabled=false;
  if(head&&e.hp>0&&e.state==='windup'){
    // Locked floor-space bite lane, 36 small square marks, no particle actors.
    // Draw here as well as the studio route; renderer skips its generic lane.
    const dx=e.dx??e.faceX??1,dy=e.dy??e.faceY??0;ctx.fillStyle='#ef835b';
    for(let d=16;d<=144;d+=8)for(const side of [-1,1])ctx.fillRect(Math.round(p.x+dx*d-dy*24*side)-2,Math.round(p.y+dy*d+dx*24*side)-2,4,4);
    ctx.fillRect(Math.round(p.x+dx*144)-3,Math.round(p.y+dy*144)-3,6,6);
  }
  ctx.drawImage(bitmap(Math.max(2,Math.round(p.radius)),direction,head,mouth),Math.round(p.x-SIZE/2),Math.round(p.y-SIZE/2-rise));
  if(head&&e.hp>0&&e.state==='windup'){
    ctx.fillStyle='#ffcf77';ctx.fillRect(Math.round(p.x-2),Math.round(p.y-32),4,7);ctx.fillRect(Math.round(p.x-2),Math.round(p.y-23),4,3);
  }
  if(e.frozen>0){ctx.fillStyle='#b3e6df';ctx.fillRect(Math.round(p.x-3),Math.round(p.y-3-rise),4,2);}
  if(e.flash>0){ctx.fillStyle='#f7e6ae';ctx.fillRect(Math.round(p.x-3),Math.round(p.y-5-rise),6,2);}
  // A charmed snake's collar is fixed to the head, never to each body section.
  if(head&&e.faction==='ally'){ctx.fillStyle='#db9cc4';ctx.fillRect(Math.round(p.x-7),Math.round(p.y+9-rise),14,3);}
  ctx.restore();
}

// Animator fallback / studio view. World renderer should instead queue the
// sections below, so tree roots and airborne heroes can sort between coils.
export function drawAnaconda(ctx,e,time=0){
  for(let i=ANACONDA_SEGMENTS-1;i>=0;i--)drawAnacondaSegment(ctx,e,i,time);
}
export function* anacondaRenderParts(e){
  const points=anacondaBody(e).segments;
  for(let i=points.length-1;i>=0;i--){const p=points[i];yield {isAnacondaSegment:true,anacondaActor:e,anacondaIndex:i,x:p.x,y:p.y,drawDepth:p.y};}
}
