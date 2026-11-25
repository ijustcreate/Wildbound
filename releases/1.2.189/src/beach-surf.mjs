import {beachSandColor,drawBeachSandFlecks} from './beach-sand.mjs';

const fieldStep=4, pixel=2, padding=136;
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=t=>t*t*(3-2*t);
const mix=(a,b,t)=>a+(b-a)*t;
const blend=(a,b,t)=>a.map((channel,i)=>mix(channel,b[i],t));
const wetKind=kind=>kind==='water'?2:kind==='shallow'?1:0;
// Phase sampling keeps the animated raster cheap even when several chunks
// share the view. The phase step is smaller than a visible alpha change.
const phaseSize=4096,phaseScale=phaseSize/(Math.PI*2);
const phaseTable=Float32Array.from({length:phaseSize},(_,i)=>Math.sin(i/phaseScale));
const wave=phase=>phaseTable[((phase*phaseScale)|0)&(phaseSize-1)];
const rgbCache=new Map();
function rgb(hex){
  let result=rgbCache.get(hex);
  if(!result){const n=parseInt(hex.slice(1),16);result=[n>>16,(n>>8)&255,n&255];rgbCache.set(hex,result);}
  return result;
}

function canvas(size){
  const image=document.createElement('canvas');
  image.width=image.height=size;
  return image;
}

// Reconstruct a rounded visual edge from the four nearest gameplay tiles.
// Absolute sample coordinates and a halo make adjacent chunks agree on it.
function shorelineField(x0,y0,size,kindAt,nativeCoast){
  const originX=x0-padding,originY=y0-padding;
  const side=(size+padding*2)/fieldStep+1;
  const tx0=Math.floor((originX-16)/32),ty0=Math.floor((originY-16)/32);
  const cols=Math.ceil((x0+size+padding-16)/32)-tx0+2;
  const rows=Math.ceil((y0+size+padding-16)/32)-ty0+2;
  const tiles=Array.from({length:rows*cols},(_,i)=>kindAt(
    (tx0+i%cols)*32+16,(ty0+Math.floor(i/cols))*32+16));
  const water=tiles.map(wetKind), sample=new Float32Array(side*side);
  const nativeTiles=nativeCoast&&tiles.map((_,i)=>{
    const x=(tx0+i%cols)*32+16,y=(ty0+Math.floor(i/cols))*32+16;
    const bank=nativeCoast(x);
    return Number.isFinite(bank)&&(water[i]>0)===(y<bank);
  });
  const nativeBanks=nativeCoast&&Array.from({length:side},(_,x)=>nativeCoast(originX+x*fieldStep));
  const depth=new Float32Array(sample.length),wet=new Uint8Array(sample.length);
  const distance=new Float32Array(sample.length);
  const maxDistance=padding-fieldStep*2;
  for(let y=0;y<side;y++)for(let x=0;x<side;x++){
    const wx=originX+x*fieldStep,wy=originY+y*fieldStep;
    const tx=(wx-16)/32-tx0,ty=(wy-16)/32-ty0;
    const fx=tx%1,fy=ty%1,k=Math.floor(ty)*cols+Math.floor(tx),i=y*side+x;
    const a=water[k],b=water[k+1],c=water[k+cols],d=water[k+cols+1];
    const wetness=mix(mix(+!!a,+!!b,fx),mix(+!!c,+!!d,fx),fy);
    const scallop=(Math.sin(wx*.109+wy*.043)+Math.sin(wy*.153-wx*.058)*.6)*.046;
    const bank=nativeBanks?.[x];
    const natural=Number.isFinite(bank)&&Math.abs(wy-bank)<84&&
      nativeTiles[k]&&nativeTiles[k+1]&&nativeTiles[k+cols]&&nativeTiles[k+cols+1];
    const naturalShape=Math.sin(wx*.038)*4.3+Math.sin(wx*.089+1.4)*2.7;
    sample[i]=natural?(wy-bank+naturalShape)/32+scallop:.5-wetness+scallop;
    wet[i]=sample[i]<0?1:0;
    depth[i]=mix(mix(a===2?1:0,b===2?1:0,fx),mix(c===2?1:0,d===2?1:0,fx),fy);
    distance[i]=maxDistance;
  }
  function seedEdge(a,b){
    if(wet[a]===wet[b])return;
    const fromA=fieldStep*Math.abs(sample[a]/(sample[a]-sample[b]));
    distance[a]=Math.min(distance[a],fromA);
    distance[b]=Math.min(distance[b],fieldStep-fromA);
  }
  for(let y=0;y<side;y++)for(let x=0;x<side;x++){
    const i=y*side+x;
    if(x+1<side)seedEdge(i,i+1);
    if(y+1<side)seedEdge(i,i+side);
  }
  const diagonal=fieldStep*Math.SQRT2;
  for(let y=0;y<side;y++)for(let x=0;x<side;x++){
    const i=y*side+x;
    if(x)distance[i]=Math.min(distance[i],distance[i-1]+fieldStep);
    if(y)distance[i]=Math.min(distance[i],distance[i-side]+fieldStep,
      x?distance[i-side-1]+diagonal:maxDistance,x+1<side?distance[i-side+1]+diagonal:maxDistance);
  }
  for(let y=side-1;y>=0;y--)for(let x=side-1;x>=0;x--){
    const i=y*side+x;
    if(x+1<side)distance[i]=Math.min(distance[i],distance[i+1]+fieldStep);
    if(y+1<side)distance[i]=Math.min(distance[i],distance[i+side]+fieldStep,
      x?distance[i+side-1]+diagonal:maxDistance,x+1<side?distance[i+side+1]+diagonal:maxDistance);
  }
  for(let i=0;i<distance.length;i++)if(wet[i])distance[i]*=-1;

  const at=(field,x,y)=>{
    const gx=(x-originX)/fieldStep,gy=(y-originY)/fieldStep;
    const fx=gx%1,fy=gy%1,i=Math.floor(gy)*side+Math.floor(gx);
    return mix(mix(field[i],field[i+1],fx),mix(field[i+side],field[i+side+1],fx),fy);
  };
  return {
    distanceAt:(x,y)=>at(distance,x,y),
    depthAt:(x,y)=>at(depth,x,y),
    landAt:(x,y)=>tiles[(Math.floor(y/32)-ty0)*cols+Math.floor(x/32)-tx0],
  };
}

export function createBeachSurfChunk(x0,y0,size,kindAt,seed=0,nativeCoast){
  const field=shorelineField(x0,y0,size,kindAt,nativeCoast),resolution=size/pixel;
  const material=canvas(resolution),context=material.getContext('2d');
  const image=context.createImageData(resolution,resolution);
  const oceanDepth=new Float32Array(resolution*resolution);
  const coastDistance=new Float32Array(oceanDepth.length);
  const texture=new Float32Array(oceanDepth.length);
  let hasSurface=false;
  for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
    const wx=x0+x*pixel+1,wy=y0+y*pixel+1,i=y*resolution+x;
    const distance=field.distanceAt(wx,wy),kind=field.landAt(wx,wy);
    const sand=rgb(beachSandColor(wx,wy,seed)), ochre=[192,151,101];
    const grain=Math.sin(wx*.091+wy*.12)*Math.cos(wy*.067-wx*.022);
    const sea=Math.cos(wx*.016+wy*.023)+Math.sin(wy*.031-wx*.012);
    const depth=clamp(-distance/90)*.66+field.depthAt(wx,wy)*.34;
    hasSurface||=distance<=26;
    coastDistance[i]=distance;
    oceanDepth[i]=depth;
    texture[i]=grain;
    let color;
    if(distance<0){
      const clear=blend(sand,[130,177,156],.23+smooth(clamp(depth/.62))*.69);
      const tinted=blend(clear,[56+sea*5,121+sea*6,133+sea*6],smooth(clamp((depth-.36)/.64)));
      color=blend(tinted,ochre,.15*(1-clamp(-distance/12)));
    }else if(kind==='grass'){
      color=blend([71,107,69],[115,137,75],clamp(.48+sea*.13+grain*.13));
    }else{
      color=blend(ochre,sand,.26+smooth(clamp(distance/27))*.74);
    }
    image.data.set(color,i*4);
    image.data[i*4+3]=255;
  }
  context.putImageData(image,0,0);
  const ground=canvas(size),groundContext=ground.getContext('2d');
  groundContext.imageSmoothingEnabled=false;
  groundContext.drawImage(material,0,0,size,size);
  drawBeachSandFlecks(groundContext,x0,y0,(x,y)=>field.distanceAt(x,y)>26&&field.landAt(x,y)!=='grass',seed);
  if(!hasSurface)return {x0,y0,ground};
  const surface=canvas(resolution),pen=surface.getContext('2d');
  return {x0,y0,ground,surface,pen,frame:pen.createImageData(resolution,resolution),coastDistance,oceanDepth,texture};
}

export function paintBeachSurfChunk(chunk,time){
  const stamp=Math.floor(time*18);
  if(chunk.stamp===stamp)return;
  chunk.stamp=stamp;
  const t=stamp/18,{x0,y0,pen,frame,coastDistance,oceanDepth,texture}=chunk;
  const {width,data}=frame;
  for(let y=0;y<width;y++)for(let x=0;x<width;x++){
    const i=y*width+x,offset=i*4,distance=coastDistance[i];
    if(distance>26)continue;
    const wx=x0+x*pixel+1,wy=y0+y*pixel+1,depth=oceanDepth[i],grain=texture[i];
    let light=0;
    if(depth<.99&&distance<0){
      // Intersect moving light ridges so the sand stays visible between glints.
      const a=wave(wx*.164+wy*.092+wave(wy*.142-t*.74)*1.27+t*1.03);
      const b=wave(wy*.175-wx*.08+wave(wx*.176+t*.62)*1.3-t*.86);
      const weave=Math.max(a*.72+b*.28,a*.26+b*.74);
      light=clamp((weave-.53)*2.1)*(1-depth)*(.32+grain*.11);
    }
    if(distance<0){
      const shine=wave(wx*.036+t*.64+wave(wy*.036)*2);
      if(shine>.60&&wave(wy*.57+wave(wx*.028-t*.52)*1.65+t*.52)>.95){
        light=Math.max(light,(shine-.60)*(.39+depth*.19));
      }
    }
    let foam=0;
    if(distance>-115){
      const phase=t*.91+wave(wx*.013+wy*.008)*.30+wave(wy*.018-wx*.009+Math.PI/2)*.24;
      const swell=(1+wave(phase))*.5;
      const curl=wave(wx*.095+wy*.058+phase)*2.3+wave(wy*.171-wx*.070-phase)*1.3;
      const front=-11+27*smooth(swell)+curl;
      const fromFront=front-distance;
      const pulse=.53+wave(wx*.317+wy*.381+phase*1.2)*.24+grain*.22;
      if(fromFront>=-1&&fromFront<3.7){
        const breakup=swell>.35?clamp(.59+pulse):clamp(pulse*1.7);
        foam=(.72+swell*.23)*breakup*clamp((fromFront+1.5)/2);
      }else if(fromFront>=3.7&&fromFront<20){
        const spread=4+12*swell;
        foam=clamp(1-(fromFront-3.7)/spread)*clamp((pulse+.35)*1.25)*(.31+swell*.59);
      }
      // Successive offshore ripples break apart before the next wash arrives.
      const wake=front-33-17*(1-swell)+wave(wx*.051-wy*.023-phase)*3;
      const outer=wake-32+wave(wy*.046+wx*.026+phase)*4;
      const ripple=Math.max(0,1-Math.abs(distance-wake)/2.6)*.25+
        Math.max(0,1-Math.abs(distance-outer)/2.3)*.19;
      foam=Math.max(foam,ripple*clamp(pulse*1.8));
      if(distance>0&&distance>front&&distance<front+9){
        const damp=(1-(distance-front)/9)*.22*swell;
        data[offset]=158;data[offset+1]=116;data[offset+2]=72;
        data[offset+3]=damp*255;
        continue;
      }
    }
    if(foam>light){data[offset]=255;data[offset+1]=247;data[offset+2]=211;}
    else if(light){data[offset]=mix(236,181,depth);data[offset+1]=mix(240,229,depth);data[offset+2]=mix(192,214,depth);}
    data[offset+3]=Math.max(foam,light)*255;
  }
  pen.putImageData(frame,0,0);
}
