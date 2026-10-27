const DEFAULT_SIZE=512;

// Local lights use finite 3-D volumes, unlike a sun height field's top-only
// silhouette. A crown has a bottom, so a low lantern can shine beneath it.
export function lightVolumeInterval(source,point,volume){
 const a=[source.x,source.y,source.height??30],b=[point.x,point.y,point.z??0];
 const center=[volume.x,volume.y,(volume.minZ+volume.maxZ)/2];
 const radii=[Math.max(.1,volume.rx),Math.max(.1,volume.ry),Math.max(.1,(volume.maxZ-volume.minZ)/2)];
 let lo=.001,hi=.999;
 if(volume.shape==='box'){
  for(let k=0;k<3;k++){const d=b[k]-a[k],mn=center[k]-radii[k],mx=center[k]+radii[k];
   if(Math.abs(d)<1e-8){if(a[k]<mn||a[k]>mx)return null;continue;}
   let t0=(mn-a[k])/d,t1=(mx-a[k])/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>=hi)return null;
  }
 }else{
  // Trunks/solid shrubs are upright cylinders; crowns/rocks are ellipsoids.
  const cylinder=volume.shape==='cylinder',axes=cylinder?2:3;
  let aa=0,bb=0,cc=-1;
  for(let k=0;k<axes;k++){const o=(a[k]-center[k])/radii[k],d=(b[k]-a[k])/radii[k];aa+=d*d;bb+=2*o*d;cc+=o*o;}
  if(aa<1e-12){if(cc>0)return null;}else{const disc=bb*bb-4*aa*cc;if(disc<=0)return null;const root=Math.sqrt(disc);lo=Math.max(lo,(-bb-root)/(2*aa));hi=Math.min(hi,(-bb+root)/(2*aa));}
  if(cylinder){const dz=b[2]-a[2];if(Math.abs(dz)<1e-8){if(a[2]<volume.minZ||a[2]>volume.maxZ)return null;}else{let t0=(volume.minZ-a[2])/dz,t1=(volume.maxZ-a[2])/dz;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);}}
 }
 return lo<hi?[lo,hi]:null;
}
export function pointLightVisibility(field,source,point,ignoreOwner=null){
 if(!field)return 1;
 const volumes=field.near?field.near(source):field.volumes||[],low=Math.min(source.height??30,point.z??0),high=Math.max(source.height??30,point.z??0);
 let transmission=1;
 for(const v of volumes){
  if(ignoreOwner!==null&&v.owner===ignoreOwner||source.owner!==undefined&&source.owner===v.owner||v.minZ>high||v.maxZ<low)continue;
  if(Math.max(source.x,point.x)<v.x-v.rx||Math.min(source.x,point.x)>v.x+v.rx||Math.max(source.y,point.y)<v.y-v.ry||Math.min(source.y,point.y)>v.y+v.ry)continue;
  if(lightVolumeInterval(source,point,v)){transmission*=1-(v.opacity??1);if(transmission<.01)return 0;}
 }
 return transmission;
}
const clamp=(v,min=0,max=255)=>Math.max(min,Math.min(max,Math.round(v)));
const footprint=(x,y,shape)=>{
 const name=String(shape||'').toLowerCase();
 if(name==='box')return Math.abs(x)<=1&&Math.abs(y)<=1?1:0;
 if(name==='actor'||name==='humanoid')return Math.hypot(x/.72,y)>1?0:1-Math.hypot(x/.72,y);
 if(name==='quadruped'||/crocodile|elephant|lion|tiger|wolf|boar|rhino|zebra|dragon/.test(name))return Math.max(0,1-Math.hypot(x/1.18,y/.58));
 if(name==='bird'||/bat|crow|raven|wasp|bee|tsetse/.test(name))return Math.max(0,1-Math.hypot(x/1.35,y/.52));
 if(name==='golem')return Math.max(0,1-Math.max(Math.abs(x),Math.abs(y))**1.7);
 if(name==='tree'||/tree|palm|pine|cedar/.test(name)){const trunk=Math.max(0,1-Math.hypot(x/.24,y/.42));const crown=Math.max(0,1-Math.hypot(x/1.02,(y+.18)/.82));return Math.max(trunk,crown);}
 if(name==='rock'||/rock|boulder|stone|ruin/.test(name))return Math.max(0,1-Math.hypot(x/(.82+.12*y),y/.82));
 if(name==='bush'||/bush|shrub/.test(name))return Math.max(0,1-Math.hypot(x/1.12,y/.72));
 if(/fern|flower|grass/.test(name))return Math.max(0,1-Math.hypot(x/.58,y/1.12));
 return Math.max(0,1-Math.hypot(x,y));
};

/** Height-map bundle used by both the runtime compositor and the World editor.
 * All three planes are row-major grayscale data encoded as base64 for compact,
 * human-portable scene JSON. Ground is the stable terrain baseline; detail is
 * the visible/front caster layer; back fills geometry hidden by the front. */
export function emptyShadowMaps(width=DEFAULT_SIZE,height=DEFAULT_SIZE){
 const blank=encodeHeightPlane(new Uint8Array(width*height));
 return {version:1,width,height,ground:blank,detail:blank,back:blank,cellSize:1600/width,raySteps:48,bias:3,darkness:.36,lightAzimuth:225,lightElevation:38};
}
export function encodeHeightPlane(values){
 // RLE triples (value, uint16 run length) keep large, mostly-empty authoring
 // planes compact in localStorage. Split runs at uint16 max for portability.
 const packed=[];for(let i=0;i<values.length;){const value=values[i];let run=1;while(i+run<values.length&&values[i+run]===value&&run<65535)run++;packed.push(value,run&255,run>>>8);i+=run;}
 const bytes=Uint8Array.from(packed);let encoded;
 if(typeof Buffer!=='undefined')encoded=Buffer.from(bytes).toString('base64');
 else {let raw='';for(let i=0;i<bytes.length;i+=0x8000)raw+=String.fromCharCode(...bytes.subarray(i,Math.min(bytes.length,i+0x8000)));encoded=btoa(raw);}
 return `rle:${encoded}`;
}
export function decodeHeightPlane(encoded,size){
 try{
  const decode64=value=>{if(typeof Buffer!=='undefined')return Uint8Array.from(Buffer.from(value,'base64'));const raw=atob(value);return Uint8Array.from(raw,c=>c.charCodeAt(0));};
  if(typeof encoded==='string'&&encoded.startsWith('rle:')){const bytes=decode64(encoded.slice(4)),out=new Uint8Array(size);let offset=0;if(bytes.length%3)return out;for(let i=0;i<bytes.length;i+=3){const run=bytes[i+1]|(bytes[i+2]<<8);if(!run||offset+run>size)return new Uint8Array(size);out.fill(bytes[i],offset,offset+run);offset+=run;}return offset===size?out:new Uint8Array(size);}
  const bytes=decode64(encoded||'');return bytes.length===size?bytes:new Uint8Array(size);
 }catch{return new Uint8Array(size);}
}
export function validShadowMaps(m){
 if(!m||m.version!==1||!Number.isInteger(m.width)||!Number.isInteger(m.height)||m.width<8||m.height<8||m.width>1024||m.height>1024)return false;
 const size=m.width*m.height;
 return ['ground','detail','back'].every(k=>{if(typeof m[k]!=='string')return false;const decoded=decodeHeightPlane(m[k],size);if(m[k].startsWith('rle:'))return encodeHeightPlane(decoded)===m[k];return m[k].length===Math.ceil(size/3)*4&&/^[A-Za-z0-9+/]*={0,2}$/.test(m[k])&&encodeLegacyPlane(decoded)===m[k];})
  &&Number.isFinite(m.cellSize)&&m.cellSize>0&&Number.isFinite(m.raySteps)&&m.raySteps>=1&&m.raySteps<=150
  &&Number.isFinite(m.bias)&&m.bias>=0&&m.bias<=64&&Number.isFinite(m.darkness)&&m.darkness>=0&&m.darkness<=.8
  &&Number.isFinite(m.lightAzimuth)&&Number.isFinite(m.lightElevation)&&m.lightElevation>=5&&m.lightElevation<=85;
}
function encodeLegacyPlane(values){if(typeof Buffer!=='undefined')return Buffer.from(values).toString('base64');let raw='';for(let i=0;i<values.length;i+=0x8000)raw+=String.fromCharCode(...values.subarray(i,Math.min(values.length,i+0x8000)));return btoa(raw);}
export function shadowMapPlanes(m){const size=m.width*m.height;return {ground:decodeHeightPlane(m.ground,size),detail:decodeHeightPlane(m.detail,size),back:decodeHeightPlane(m.back,size)};}

/** Upgrade old, coarse authored assets while preserving their world-space bounds. */
export function resampleShadowMaps(m,width=DEFAULT_SIZE,height=DEFAULT_SIZE){
 if(!validShadowMaps(m))return emptyShadowMaps(width,height);
 if(m.width===width&&m.height===height)return m;
 const old=shadowMapPlanes(m),out={...m,width,height,cellSize:1600/width};
 for(const key of ['ground','detail','back']){const src=old[key],dst=new Uint8Array(width*height);for(let y=0;y<height;y++){const fy=y*(m.height-1)/Math.max(1,height-1),y0=Math.floor(fy),y1=Math.min(m.height-1,y0+1),ty=fy-y0;for(let x=0;x<width;x++){const fx=x*(m.width-1)/Math.max(1,width-1),x0=Math.floor(fx),x1=Math.min(m.width-1,x0+1),tx=fx-x0,a=src[y0*m.width+x0]*(1-tx)+src[y0*m.width+x1]*tx,b=src[y1*m.width+x0]*(1-tx)+src[y1*m.width+x1]*tx;dst[y*width+x]=clamp(a*(1-ty)+b*ty);}}out[key]=encodeHeightPlane(dst);}
 return out;
}

/** Height-field ray march. The destination is shadowed if any shared caster
 * layer intersects the sun ray; stable ground height is intentionally
 * separate from fine caster detail to prevent stair/terrain shimmer. */
export function rayMarchShadow(m,planes,x,y,{dx,dy,elevation=Math.PI/4,bias=m.bias??3,steps=m.raySteps??48,soft=false}={}){
 const ix=Math.floor(x),iy=Math.floor(y),w=m.width,h=m.height;
 if(ix<0||iy<0||ix>=w||iy>=h)return 0;
 const at=iy*w+ix,base=planes.ground[at],rise=Math.tan(elevation)*m.cellSize;
 for(let n=1;n<=steps;n++){
  const sx=Math.round(ix+dx*n),sy=Math.round(iy+dy*n);
  if(sx<0||sy<0||sx>=w||sy>=h)break;
  // Base elevation is sampled independently at each ray step; detail and the
  // supplemental back plane are relative caster height above that stable base.
  const i=sy*w+sx,top=planes.ground[i]+Math.max(planes.detail[i],planes.back[i]);
  if(top>base+bias+n*rise){
   if(!soft)return 1;
   return Math.max(.2,Math.min(1,(top-(base+bias+n*rise))/64));
  }
 }
 return 0;
}
export function buildShadowMask(m,{azimuth=m.lightAzimuth,elevation=m.lightElevation,steps=m.raySteps,bias=m.bias,darkness=m.darkness,soft=false,planes=shadowMapPlanes(m),mask=new Uint8Array(m.width*m.height),bounds={sx:0,sy:0,ex:m.width,ey:m.height}}={}){
 const angle=azimuth*Math.PI/180;
 // The ray travels from a receiver toward the light; this avoids a second
 // raster pass and treats overlapping objects as one shared height source.
 const dx=Math.cos(angle),dy=Math.sin(angle),elev=Math.max(.01,elevation*Math.PI/180);
 for(let y=Math.max(0,bounds.sy);y<Math.min(m.height,bounds.ey);y++)for(let x=Math.max(0,bounds.sx);x<Math.min(m.width,bounds.ex);x++){const strength=rayMarchShadow(m,planes,x,y,{dx,dy,elevation:elev,bias,steps,soft});mask[y*m.width+x]=strength?clamp(darkness*255*strength):0;}
 return mask;
}
const staticShadowFields=new WeakMap();
const softShadowTaps=[[0,0,1],[-1,0,.32],[1,0,.32],[0,-1,.32],[0,1,.32]];
function stampCasters(planes,m,casters,lights,originX,originY){
 const cell=m.cellSize;
  for(const source of casters){if(!Number.isFinite(source.x+source.y))continue;
   const jump=Math.max(0,source.shadowLift||0),jumpRatio=Math.min(1,jump/48),angle=(lights.azimuth*Math.PI)/180;
   const scale=1-jumpRatio*.16;
   const cx=(source.x-originX)/cell,cy=(source.y-originY)/cell;
   const px=cx-Math.cos(angle)*jump*.42/cell,py=cy-Math.sin(angle)*jump*.42/cell;
   const rx=Math.max(1,Math.ceil((source.radiusX||source.radius||16)*scale/cell)),ry=Math.max(1,Math.ceil((source.radiusY||source.radius||12)*scale/cell));
   const height=clamp((source.shadowHeight||source.height||56)*(1-jumpRatio*.28)),shape=source.shadowShape||source.kind;
   for(let y=Math.floor(py-ry);y<=Math.ceil(py+ry);y++)for(let x=Math.floor(px-rx);x<=Math.ceil(px+rx);x++)if(x>=0&&y>=0&&x<m.width&&y<m.height){const d=footprint((x-px)/rx,(y-py)/ry,shape);if(d>.08){const i=y*m.width+x;planes.detail[i]=Math.max(planes.detail[i],clamp(height*d));}}
  }
}
export function makeShadowCanvas(m,{azimuth,elevation,steps,bias,darkness,casters=[],originX=0,originY=0,budgetMs=Infinity,canvas:reuseCanvas,softActors=false}={}){
 const canvas=reuseCanvas||(typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(m.width,m.height):globalThis.document?.createElement('canvas'));
 if(!canvas)return null;if(canvas.width!==m.width||canvas.height!==m.height){canvas.width=m.width;canvas.height=m.height;}
 const c=canvas.getContext('2d');if(!c)return null;
 const lights={azimuth:Math.round((azimuth??m.lightAzimuth)/4)*4,elevation:Math.round((elevation??m.lightElevation)/3)*3,steps:Math.min(24,steps??m.raySteps),bias:bias??m.bias,darkness:Math.round((darkness??m.darkness)*100)/100,soft:true};
 const fixed=casters.filter(p=>!p.shadowDynamic),moving=casters.filter(p=>p.shadowDynamic);
 const key=JSON.stringify([originX,originY,lights,m.width,m.height,m.cellSize,m.ground,m.detail,m.back,fixed.map(p=>[p.x,p.y,p.shadowHeight,p.height,p.shadowShape,p.kind,p.radiusX,p.radiusY,p.radius,p.shadowLift])]);
 let base=staticShadowFields.get(m);
 if(!base||base.key!==key){
  if(!base?.pending||base.pending.key!==key){
   const planes=shadowMapPlanes(m);stampCasters(planes,m,fixed,lights,originX,originY);
   base??={key:null,planes,mask:new Uint8Array(m.width*m.height),lights};
   base.pending={key,planes,mask:new Uint8Array(m.width*m.height),row:0,lights};
  }
  const pending=base.pending,deadline=performance.now()+budgetMs;
  do{
   buildShadowMask(m,{...pending.lights,planes:pending.planes,mask:pending.mask,bounds:{sx:0,sy:pending.row,ex:m.width,ey:Math.min(m.height,pending.row+4)}});pending.row+=4;
  }while(pending.row<m.height&&performance.now()<deadline);
  if(pending.row>=m.height)Object.assign(base,{key,planes:pending.planes,mask:pending.mask,lights:pending.lights,pending:null});
  staticShadowFields.set(m,base);
 }
 Object.assign(lights,base.lights);
 let mask=base.mask;
 if(moving.length&&!softActors){
  if(base.dynamicDetail?.length!==base.planes.detail.length)base.dynamicDetail=new Uint8Array(base.planes.detail.length);
  base.dynamicDetail.set(base.planes.detail);
  if(base.dynamicMask?.length!==base.mask.length)base.dynamicMask=new Uint8Array(base.mask.length);
  base.dynamicMask.set(base.mask);
  const planes={ground:base.planes.ground,back:base.planes.back,detail:base.dynamicDetail};
  stampCasters(planes,m,moving,lights,originX,originY);mask=base.dynamicMask;
  const angle=lights.azimuth*Math.PI/180,reach=lights.steps+3,dx=Math.cos(angle)*reach,dy=Math.sin(angle)*reach,dirty=new Map();
  for(const p of moving){
   const lift=p.shadowLift||0,cx=(p.x-originX-Math.cos(angle)*lift*.42)/m.cellSize,cy=(p.y-originY-Math.sin(angle)*lift*.42)/m.cellSize;
   const rx=Math.ceil((p.radiusX||p.radius||16)/m.cellSize)+3,ry=Math.ceil((p.radiusY||p.radius||12)/m.cellSize)+3;
   const bounds={sx:Math.floor(cx-rx-Math.max(0,dx)),sy:Math.floor(cy-ry-Math.max(0,dy)),ex:Math.ceil(cx+rx-Math.min(0,dx)),ey:Math.ceil(cy+ry-Math.min(0,dy))};
   if(moving.length===1)buildShadowMask(m,{...lights,planes,mask,bounds});
   else for(let y=Math.max(0,Math.floor(bounds.sy/8));y<Math.min(Math.ceil(m.height/8),Math.ceil(bounds.ey/8));y++)for(let x=Math.max(0,Math.floor(bounds.sx/8));x<Math.min(Math.ceil(m.width/8),Math.ceil(bounds.ex/8));x++)dirty.set(y*Math.ceil(m.width/8)+x,{sx:x*8,sy:y*8,ex:Math.min(m.width,(x+1)*8),ey:Math.min(m.height,(y+1)*8)});
  }
  for(const bounds of dirty.values())buildShadowMask(m,{...lights,planes,mask,bounds});
 }
 if(moving.length&&softActors){
  // Moving silhouettes are soft swept footprints. Static scenery keeps the
  // height-field ray march; actors share its max-opacity mask, so overlapping
  // shadows never darken twice. Work scales with actor footprint, not receivers
  // multiplied by every ray step for every actor.
  if(base.dynamicMask?.length!==base.mask.length)base.dynamicMask=new Uint8Array(base.mask.length);
  base.dynamicMask.set(base.mask);mask=base.dynamicMask;
  const angle=lights.azimuth*Math.PI/180,dx=-Math.cos(angle),dy=-Math.sin(angle),slope=Math.max(.1,Math.tan(lights.elevation*Math.PI/180));
  for(const p of moving){
   const lift=Math.max(0,p.shadowLift||0),ratio=Math.min(1,lift/48),scale=1-ratio*.16;
   const cx=(p.x-originX+dx*lift*.42)/m.cellSize,cy=(p.y-originY+dy*lift*.42)/m.cellSize;
   const rx=Math.max(1,(p.radiusX||p.radius||16)*scale/m.cellSize),ry=Math.max(1,(p.radiusY||p.radius||12)*scale/m.cellSize);
   const height=(p.shadowHeight||p.height||56)*(1-ratio*.28);
   for(let y=-Math.ceil(ry);y<=Math.ceil(ry);y++)for(let x=-Math.ceil(rx);x<=Math.ceil(rx);x++){
    const strength=footprint(x/rx,y/ry,p.shadowShape||p.kind);if(strength<.08)continue;
    const reach=Math.min(lights.steps,p.shadowShape==='actor'?6:8,height*strength/m.cellSize/slope),alpha=clamp(lights.darkness*255*(.25+strength*.35)*(1-ratio*.28));
    for(let t=0;t<=reach;t++){
     const px=Math.round(cx+x+dx*t),py=Math.round(cy+y+dy*t);
     for(const [ox,oy,weight]of softShadowTaps){
      const sx=px+ox,sy=py+oy;if(sx<0||sy<0||sx>=m.width||sy>=m.height)continue;
      const i=sy*m.width+sx;mask[i]=Math.max(mask[i],Math.round(alpha*weight));
     }
    }
   }
  }
 }
 let pixels=shadowPixelBuffers.get(canvas);if(!pixels||pixels.width!==m.width||pixels.height!==m.height){pixels=c.createImageData(m.width,m.height);shadowPixelBuffers.set(canvas,pixels);}
 for(let i=0;i<mask.length;i++)pixels.data[i*4+3]=mask[i];
 c.putImageData(pixels,0,0);return canvas;
}

/** Procedural starting asset from the authored scene's prop footprints. Artists
 * can then paint any of the three planes in the editor. */
export function generateSceneShadowMaps(scene,width=DEFAULT_SIZE,height=DEFAULT_SIZE){
 const m=emptyShadowMaps(width,height),p=shadowMapPlanes(m),size=scene.props||[];
 const set=(plane,x,y,value)=>{if(x>=0&&y>=0&&x<width&&y<height){const i=y*width+x;plane[i]=Math.max(plane[i],clamp(value));}};
 for(const prop of size){
  const cx=(scene.x||800)/(1600/width)+(prop.dx||0)/(1600/width),cy=(scene.y||800)/(1600/height)+(prop.dy||0)/(1600/height);
  const rw=Math.max(2,(prop.width||prop.size||64)/(1600/width)*.5),rh=Math.max(2,(prop.depth||prop.size||64)/(1600/height)*.5);
  const heightValue=clamp((prop.height||({tree:120,forest_ruin:54,rock:35,bush:22,fern:20,flower:10}[prop.kind]||24))*1.7);
  for(let y=Math.floor(cy-rh);y<=Math.ceil(cy+rh);y++)for(let x=Math.floor(cx-rw);x<=Math.ceil(cx+rw);x++){
   const d=Math.max(0,1-Math.hypot((x-cx)/rw,(y-cy)/rh));
   if(d>.08){set(p.detail,x,y,heightValue*d);if(y<cy-rh*.35)set(p.back,x,y,heightValue*d*.86);}
  }
 }
 m.detail=encodeHeightPlane(p.detail);m.back=encodeHeightPlane(p.back);m.ground=encodeHeightPlane(p.ground);return m;
}

export function paintShadowMap(m,plane,points,{radius=2,value=255}={}){
 if(!['ground','detail','back'].includes(plane))throw Error(`Unknown height plane: ${plane}`);
 const planes=shadowMapPlanes(m),data=planes[plane];
 for(const point of points){const cx=Math.round(point.x),cy=Math.round(point.y),r=Math.max(1,Math.round(radius));
  for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++)if(x>=0&&y>=0&&x<m.width&&y<m.height&&((x-cx)**2+(y-cy)**2)<=r*r){const i=y*m.width+x;data[i]=value===0?0:Math.max(data[i],clamp(value));}
 }
 return {...m,[plane]:encodeHeightPlane(data)};
}

const canvasCache=new WeakMap();
const shadowPixelBuffers=new WeakMap();
const validatedMaps=new WeakMap();
function validRuntimeMaps(m){
 if(!m||typeof m!=='object')return false;
 const previous=validatedMaps.get(m),values=Object.values(m);
 if(previous&&values.length===previous.values.length&&values.every((value,i)=>value===previous.values[i]))return previous.valid;
 const valid=validShadowMaps(m);validatedMaps.set(m,{values,valid});return valid;
}
export function drawRealtimeWorldShadows(ctx,scene,worldX,worldY,options={}){
 const maps=scene?.shadowMaps;if(!validRuntimeMaps(maps))return false;
 // Dynamic casters must follow movement at pixel precision. Coarse buckets
 // make a hero's shadow visibly trail behind while the actor is walking.
 // Keep the sun angle quantized below, since that changes independently from
 // actor motion and is the expensive part of the cache churn.
 const casterStep=Math.max(.25,(maps.cellSize||12.5)/12);
 const casterKey=(options.casters||[]).map(c=>`${Math.round((c.x-worldX)/casterStep)},${Math.round((c.y-worldY)/casterStep)},${Math.round(c.shadowHeight||c.height||56)},${c.shadowShape||c.kind||''},${c.radiusX||c.radius||16},${c.radiusY||c.radius||12},${c.shadowLift||0}`).sort().join(';');
 const key=`${!!options.softActors}:${Math.round((options.azimuth??maps.lightAzimuth)/4)}:${Math.round((options.elevation??maps.lightElevation)/3)}:${Math.min(24,options.steps??maps.raySteps)}:${options.bias??maps.bias}:${maps.detail.length}:${maps.back.length}:${casterKey}`;
 const validation=validatedMaps.get(maps);
 let entry=canvasCache.get(maps);if(!entry||entry.key!==key||entry.validation!==validation||entry.pending){entry={key,validation,canvas:makeShadowCanvas(maps,{...options,darkness:1,canvas:entry?.canvas,originX:worldX,originY:worldY})};entry.pending=!!staticShadowFields.get(maps)?.pending;canvasCache.set(maps,entry);}
 if(!entry.canvas)return false;
 ctx.save();ctx.globalAlpha=options.darkness??maps.darkness;ctx.imageSmoothingEnabled=true;ctx.drawImage(entry.canvas,worldX,worldY,1600,1600);ctx.restore();return true;
}

/** Smooth clockwise sun azimuth across daytime; darkness still suppresses cast shadows. */
export function runtimeSun(g,baseAzimuth=225,baseElevation=38){
 const elapsed=((g.sky?.elapsed||0)%480+480)%480;
 const t=elapsed/480,angle=t*Math.PI*2;
 return {azimuth:(baseAzimuth+t*360)%360,elevation:Math.max(5,Math.min(85,baseElevation+26*Math.sin(angle-Math.PI/2)))};
}

