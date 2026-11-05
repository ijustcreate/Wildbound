import {nearbyScenery} from './performance.mjs';
import {BOARD_TABLE,boardLightVolumes} from './board-table-geometry.mjs';
import {realmAsset} from './realm-layout.mjs';
import {pointLightVisibility} from './realtime-shadows.mjs';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const lightOwner=p=>p.lightOwner??(p.id!==undefined?`prop:${p.id}`:`prop:${p.kind}:${p.x}:${p.y}`);
const geometryCache=new WeakMap();
const geometryFields=['id','kind','size','x','y','rootY','width','depth','height','lightHeight','lightOpacity','lightBlocker','fallen','falling','depleted','destroyed'];
export function propLightGeometry(p){
 if(p.lightGeometry)return p.lightGeometry;
 let slot=geometryCache.get(p);
 if(!slot||geometryFields.some((n,i)=>p[n]!==slot.values[i])){slot={values:geometryFields.map(n=>p[n]),geometry:buildPropLightGeometry(p)};geometryCache.set(p,slot);}
 return slot.geometry;
}
function buildPropLightGeometry(p){
 if(p.lightGeometry)return p.lightGeometry;
 const size=p.size||64,kind=String(p.kind||'').toLowerCase();
 const type=realmAsset(kind)?.type,tree=type==='tree'||/tree|palm|pine|cedar/.test(kind),bush=/bush|shrub|hedge/.test(kind);
 const rootY=Number.isFinite(p.rootY)?p.rootY:p.y+size*(tree&&kind!=='palm'?.35:.19),owner=lightOwner(p);
 const height=Math.max(2,p.lightHeight||p.height||size*(tree?1.05:bush?.65:.42));
 const rx=Math.max(3,(p.width||size)*.44),ry=Math.max(3,(p.depth||size*.4)*.5);
 const base={owner,x:p.x,y:rootY,rx,ry,minZ:0,maxZ:height,opacity:p.lightOpacity??1};
 if(p.depleted||p.destroyed||p.lightBlocker===false)return {owner,x:p.x,y:rootY,height,rx,ry,tree,volumes:[]};
 let volumes=[];
 if(tree){
  const trunk={...base,rx:Math.max(3,size*.065),ry:Math.max(3,size*.06),maxZ:p.fallen||p.falling?size*.1:height*.82,shape:'cylinder'};
  volumes=[trunk];
  if(!p.fallen&&!p.falling&&!/leafless|dead/.test(kind))volumes.push({...base,y:rootY-size*.035,rx:size*(kind==='palm'?.57:.47),ry:size*.3,minZ:height*.48,maxZ:height,shape:'ellipsoid',opacity:.96});
 }else if(type==='arch'){
  volumes=[-.35,.35].map(dx=>({...base,x:p.x+size*dx,rx:size*.08,ry:size*.06,maxZ:size*.65,shape:'cylinder'}));
 }else if(['rock','mineral','crystal','log'].includes(type)||p.lightBlocker===true||/rock|boulder|stone|ruin|pillar|spire|cactus|log|stump|cache|chest|grave|tomb|sarcoph|crate|barrel/.test(kind)||bush){
  volumes=[{...base,shape:bush?'cylinder':/ruin|pillar|crate|cache|chest|tomb/.test(kind)?'box':'ellipsoid'}];
 }
 return {owner,x:p.x,y:rootY,height,rx,ry,tree,bush,volumes};
}

// One height-aware caster field per rendered frame, shared by floor, props and
// actors. No environment-specific whitelist; old saves gain it without migration.
const fields=new WeakMap();
export function worldLightField(game,sources,room=null){
 if(!sources.length)return null;
 const previous=fields.get(game),actorsForFrame=[...(game.players||[]),...(game.enemies||[]),...(game.followers||[])],
  sourceFrame=sources.map(s=>[Math.round(s.x/8),Math.round(s.y/8),Math.round((s.height||30)/4),s.radius,s.owner].join(',')).join(';'),
  actorFrame=actorsForFrame.map(a=>[a.id,Math.round(a.x/4),Math.round(a.y/4),a.hp>0,a.room].join(',')).join(';'),
  frameKey=`${game.time||0}:${room||''}:${sourceFrame}:${actorFrame}`;
 // Character art asks for the same occlusion field many times in one render.
 // Reuse that frame's field before rebuilding a signature over every prop.
 if(game.time>0&&previous?.frameKey===frameKey&&previous.scenery===game.scenery&&previous.house===game.house&&previous.supplyChests===game.supplyChests)return previous.field;
 const nearbyProps=game.mapMode==='boundless'?[...new Set(sources.flatMap(s=>nearbyScenery(game.scenery||[],s.x,s.y,(s.radius||280)+160)))]:game.scenery||[];
 const revision=nearbyProps.map(p=>[p.id,p.kind,p.size,p.width,p.depth,p.height,p.lightHeight,p.lightOpacity,p.lightBlocker,p.x,p.y,p.rootY,p.fallen,p.falling,p.depleted,p.destroyed,p.chipped].join(',')).join(';');
 const chestRevision=(game.supplyChests||[]).map(p=>[p.id,p.x,p.y,p.opened].join(',')).join(';');
 const tableRevision=JSON.stringify([game.phase,game.openingBoard,game.eventTestBoard])+chestRevision;
 const houseRevision=tableRevision+[...(game.house?.walls||[]),...(game.house?.doors||[]),...(game.house?.furniture||[])].map(p=>[p.id,p.kind,p.x,p.y,p.w,p.h,p.height,p.surfaceHeight,p.open,p.destroyed,p.broken,JSON.stringify(p.sectionDamage||{})].join(',')).join(';');
 const actors=[...(game.players||[]),...(game.enemies||[]),...(game.followers||[])];
 const actorRevision=actors.map(a=>[a.id,a.height,Math.round(a.x),Math.round(a.y),Math.round((a.jumpHeight||0)+(a.groundHeight||0)),a.hp>0,a.room,a.swimming].join(',')).join(';');
 const key=`${room||''}:${revision}:${houseRevision}:${actorRevision}:${sources.map(s=>[Math.round(s.x),Math.round(s.y),Math.round(s.height||30),s.radius,s.owner].join(',')).join(';')}`;
 if(previous?.key===key&&previous.scenery===game.scenery&&previous.house===game.house&&previous.supplyChests===game.supplyChests)return previous.field;
 const volumes=[];
 const relevant=v=>sources.some(s=>Math.hypot(s.x-v.x,s.y-v.y)<(s.radius||280)+Math.max(v.rx,v.ry));
 const add=v=>{if(relevant(v))volumes.push(v);};
 if(!room){
  if(game.phase==='play'&&!game.openingBoard)for(const b of [BOARD_TABLE,game.eventTestBoard].filter(Boolean))for(const volume of boardLightVolumes(b))add(volume);
  for(const p of nearbyProps)for(const v of propLightGeometry(p).volumes)add(v);
  for(const p of game.supplyChests||[])if(!p.opened)for(const v of propLightGeometry({...p,kind:'supply_chest',size:48,lightHeight:30}).volumes)add(v);
  for(const f of [...(game.house?.walls||[]),...(game.house?.doors||[]),...(game.house?.furniture||[])]){
   if(f.destroyed||f.broken||f.open||['rug','plant','lamp','ceiling_light'].includes(f.kind))continue;
   const box={owner:lightOwner(f),x:f.x+f.w/2,y:f.y+f.h/2,rx:f.w/2,ry:f.h/2,minZ:0,maxZ:f.height||f.surfaceHeight||(/table|bed|sofa|chair/.test(f.kind)?24:64),shape:'box',opacity:f.kind==='window'?.3:1};
   if(f.sectionDamage){const columns=Math.ceil(f.w/40);for(let y=0;y<f.h;y+=40)for(let x=0;x<f.w;x+=40){const n=Math.floor(y/40)*columns+Math.floor(x/40);if(f.sectionDamage[n]?.broken)continue;const w=Math.min(40,f.w-x),h=Math.min(40,f.h-y);add({...box,x:f.x+x+w/2,y:f.y+y+h/2,rx:w/2,ry:h/2});}}
   else add(box);
  }
  for(const a of actors){
   if(a.hp<=0||a.room||a.ghost||a.spiritGhost||a.swimming)continue;
   const lift=(a.jumpHeight||0)+(a.groundHeight||0);
   add({owner:`actor:${a.id}`,x:a.x,y:a.y,rx:7,ry:5,minZ:lift,maxZ:lift+(a.height||34),shape:'cylinder',opacity:.92});
  }
 }
 const hashKey=value=>{let hash=2166136261;for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),16777619);return hash>>>0;};
 const candidates=new WeakMap(),field={volumes,revision:hashKey(key),staticRevision:hashKey(`${room||''}:${revision}:${houseRevision}`),near(source){let list=candidates.get(source);if(!list){list=volumes.filter(v=>Math.hypot(source.x-v.x,source.y-v.y)<(source.radius||280)+Math.max(v.rx,v.ry));candidates.set(source,list);}return list;}};
 fields.set(game,{key,frameKey,scenery:game.scenery,house:game.house,supplyChests:game.supplyChests,field});return field;
}
export function localLightStrength(field,source,point,owner=null){
 const distance=Math.hypot(point.x-source.x,point.y-source.y,(point.z??0)-(source.height??30));
 const attenuation=clamp(1-distance/Math.max(1,source.radius||1))**1.45;
 return attenuation*(source.intensity??1)*pointLightVisibility(field,source,point,owner);
}
const colorRGB=color=>/^#[\da-f]{6}$/i.test(color||'')?color.slice(1).match(/../g).map(n=>parseInt(n,16)):[255,199,111];

export class WorldLightRenderer{
 constructor(){this.props=new Map();this.pending=new Map();this.frameIndex=0;this.bytes=0;this.limit=24*1024*1024;}
 drawGround(ctx,frame,visible=()=>true){
  if(!frame?.sources.length)return;
  for(const source of frame.sources){
   const radius=Math.min(500,source.radius||1);if(!visible(source,radius))continue;
   // Bounded low-resolution light buffer, composited below scenery. Soft source
   // sampling yields a narrow penumbra, not a second dark shadow overlay.
   const cells=Math.ceil(radius/4),width=cells*2,step=radius/cells;
   const slot=source.owner||`${source.x}:${source.y}`;
   this.groundSlots??=new Map();let entry=this.groundSlots.get(slot);
   const casters=frame.field.near(source);
   const movingCasters=casters.filter(v=>String(v.owner).startsWith('actor:')&&v.owner!==source.owner).map(v=>[v.owner,Math.round(v.x/4),Math.round(v.y/4),Math.round(v.minZ/4),Math.round(v.maxZ/4)].join(',')).join(';');
   const signature=[Math.round(source.x/8),Math.round(source.y/8),Math.round((source.height||30)/4),source.color,source.intensity,radius,frame.field.staticRevision??frame.field.revision,movingCasters].join(':');
   if(!entry||entry.signature!==signature){
    const canvas=entry?.canvas||document.createElement('canvas');if(canvas.width!==width||canvas.height!==width)canvas.width=canvas.height=width;
    const c=canvas.getContext('2d'),rgb=colorRGB(source.color),falloff=c.createRadialGradient(cells,cells,0,cells,cells,cells);
    const heightFalloff=clamp(1-(source.height??30)/radius),alpha=(source.intensity??1)*.38*heightFalloff;
    for(const [stop,level]of [[0,1],[.35,.55],[.7,.16],[1,0]])falloff.addColorStop(stop,`rgba(${rgb.join(',')},${alpha*level})`);
    c.clearRect(0,0,width,width);c.fillStyle=falloff;c.fillRect(0,0,width,width);
    c.save();c.translate(cells,cells);c.scale(1/step,1/step);c.translate(-source.x,-source.y);c.globalCompositeOperation='destination-out';c.fillStyle='#000';
    for(const volume of casters){
     if(source.owner!==undefined&&volume.owner===source.owner)continue;
     const polygon=groundShadowPolygon(source,volume,radius);if(!polygon.length)continue;
     c.globalAlpha=volume.opacity??1;c.beginPath();polygon.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();
    }
    c.restore();const bytes=width*width*4;this.groundBytes=(this.groundBytes||0)+bytes-(entry?.bytes||0);entry={signature,canvas,bytes};this.groundSlots.set(slot,entry);
   }
   ctx.save();ctx.globalCompositeOperation='screen';ctx.imageSmoothingEnabled=true;
   ctx.drawImage(entry.canvas,source.x-radius,source.y-radius,radius*2,radius*2);ctx.restore();
   this.groundSlots.delete(slot);this.groundSlots.set(slot,entry);
  }
  // Small crystal pools should not evict one another every frame: bound bytes,
  // not merely light count. Reuse textures without resetting their backing store.
  while(this.groundSlots?.size>256||this.groundBytes>8*1024*1024){const key=this.groundSlots.keys().next().value;this.groundBytes-=this.groundSlots.get(key).bytes;this.groundSlots.delete(key);}
 }
 drawProp(ctx,prop,paint,frame){
  if(!frame?.sources.length||prop.falling||prop.burning)return paint(ctx);
  const geometry=propLightGeometry(prop);
  const power=s=>Math.max(0,1-Math.hypot(s.x-geometry.x,s.y-geometry.y)/((s.radius||1)+geometry.height))*(s.intensity??1);
  const lights=frame.sources.filter(s=>power(s)>0).sort((a,b)=>power(b)-power(a)).slice(0,2);
  if(!lights.length||!geometry.volumes.length)return paint(ctx);
  const owner=geometry.owner,clock=/tree|palm|bush|shrub|mangrove|cypress/.test(prop.kind)?Math.floor(frame.time*8):0;
  const signature=[prop.kind,prop.lightMaterial,prop.size,prop.width,prop.height,prop.depth,prop.x,prop.y,prop.rootY,prop.fallen,prop.depleted,prop.chipped,prop.treeType,prop.treeVariantSeed,prop.season,prop.seed,prop.harvest,prop.surfaceArtKey,JSON.stringify(prop.sectionDamage||{})].join(':');
  if(this.frame!==frame||this.frameTime!==frame.time){
   this.frame=frame;this.frameTime=frame.time;this.frameIndex++;this.propUpdates=0;this.propUpdateMs=0;
   // Offscreen/evicted work cannot hold up the visible FIFO.
   for(const [key,seen]of this.pending)if(seen<this.frameIndex-1)this.pending.delete(key);
  }
  let entry=this.props.get(owner);
  if(entry?.signature!==signature){if(entry)this.bytes-=entry.bytes;entry=null;this.props.delete(owner);}
  if(!entry){
   const radius=Math.max(40,(prop.size||64)*1.4,(prop.width||0)+(prop.height||0)),bounds=prop.lightBounds||{x:prop.x-radius,y:prop.y-radius,width:radius*2,height:radius*2};
   const scale=Math.min(1,384/Math.max(bounds.width,bounds.height));
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(bounds.width*scale);canvas.height=Math.ceil(bounds.height*scale);
   const original=document.createElement('canvas');original.width=canvas.width;original.height=canvas.height;
   entry={signature,canvas,original,bounds,scale,baseClock:clock,bytes:canvas.width*canvas.height*8};
   repaintProp(entry,paint);canvas.getContext('2d').drawImage(original,0,0);this.bytes+=entry.bytes;
   while(this.bytes>this.limit&&this.props.size){const key=this.props.keys().next().value;this.bytes-=this.props.get(key).bytes;this.props.delete(key);}
  }
  // Subpixel movement/flicker and an unrelated actor must not invalidate every
  // tree. Geometry edits still invalidate immediately. Stagger foliage recapture
  // and lighting work; retain the previous lit image while an update is pending.
  const lightKey=[...lights.flatMap(s=>[Math.round(s.x/8),Math.round(s.y/8),Math.round((s.height||30)/4),s.radius,s.color,Math.round((s.intensity??1)*20)]),frame.field.staticRevision??frame.field.revision,Math.floor(frame.time*4)].join(':');
  const needsUpdate=entry.lightKey!==lightKey||entry.baseClock!==clock;
  if(needsUpdate)this.pending.set(owner,this.frameIndex);
  if(needsUpdate&&this.pending.keys().next().value===owner&&this.propUpdates<6&&this.propUpdateMs<2){
   const begin=performance.now();
   if(entry.baseClock!==clock){repaintProp(entry,paint);entry.baseClock=clock;}
   shadePropPixels(entry,geometry,prop,frame,lights);entry.lightKey=lightKey;
   this.pending.delete(owner);
   this.propUpdates++;this.propUpdateMs+=performance.now()-begin;
  }
  this.props.delete(owner);this.props.set(owner,entry);
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(entry.canvas,entry.bounds.x,entry.bounds.y,entry.canvas.width/entry.scale,entry.canvas.height/entry.scale);ctx.restore();return true;
 }
 drawStructure(ctx,f,paint,frame){
  if(f.destroyed||f.broken||f.open)return paint(ctx);
  const owner=lightOwner(f),height=f.height||f.surfaceHeight||(/table|bed|sofa|chair/.test(f.kind)?24:64),x=f.x+f.w/2,y=f.y+f.h;
  const geometry={owner,x,y,height,rx:Math.max(4,f.w/2),ry:Math.max(4,f.h/2),volumes:[{}]};
  return this.drawProp(ctx,{...f,kind:'structure',lightMaterial:f.kind,x,y,rootY:y,size:Math.max(f.w,f.h+height),lightOwner:owner,lightGeometry:geometry,
   lightBounds:{x:f.x-12,y:f.y-height-16,width:f.w+24,height:f.h+height+32}},paint,frame);
 }
}

let lightMaskSurface=null,rimSurface=null,tintGrid=null,visibilityGrid=null;
function repaintProp(entry,paint){
 const c=entry.original.getContext('2d'),{scale,bounds}=entry;
 c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,entry.original.width,entry.original.height);
 c.save();c.scale(scale,scale);c.translate(-bounds.x,-bounds.y);paint(c);c.restore();
}
function shadePropPixels(entry,g,prop,frame,lights){
 const {original,canvas,scale,bounds}=entry,w=canvas.width,h=canvas.height;
 const c=canvas.getContext('2d');c.clearRect(0,0,w,h);c.drawImage(original,0,0);
 lightMaskSurface??=document.createElement('canvas');rimSurface??=document.createElement('canvas');
 for(const surface of [lightMaskSurface,rimSurface])if(surface.width!==w||surface.height!==h){surface.width=w;surface.height=h;}
 const mask=lightMaskSurface.getContext('2d'),rim=rimSurface.getContext('2d');
 tintGrid??=document.createElement('canvas');visibilityGrid??=document.createElement('canvas');
 for(const grid of [tintGrid,visibilityGrid])if(grid.width!==6||grid.height!==8){grid.width=6;grid.height=8;}
 const tint=tintGrid.getContext('2d'),visibility=visibilityGrid.getContext('2d');
 // At most 48 geometric samples per light, independent of sprite resolution.
 // No GPU readbacks, occupied-pixel scans or CPU copies of sprite RGBA arrays.
 const span=Math.max(g.rx*1.25,(prop.size||64)*.6),top=g.y-g.height*1.12,bottom=g.y+g.ry;
 const cellW=span*2/6,cellH=(bottom-top)/8;
 const blocks=[];
 for(let row=0;row<8;row++)for(let col=0;col<6;col++){
  const wx=g.x-span+(col+.5)*cellW,screenY=top+(row+.5)*cellH,z=clamp(g.y-screenY,0,g.height);
  const x=(wx-cellW/2-bounds.x)*scale,y=(screenY-cellH/2-bounds.y)*scale;
  const nx=clamp((wx-g.x)/g.rx,-1,1),ny=Math.sqrt(Math.max(0,1-nx*nx))*.7,nz=clamp((z/g.height-.55)*.7,-.25,.6);
  blocks.push({x,y,col,row,wx,z,nx,ny,nz});
 }
 c.save();c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-atop';
 for(const s of lights){
  const rgb=colorRGB(s.color);mask.clearRect(0,0,w,h);tint.clearRect(0,0,6,8);visibility.clearRect(0,0,6,8);
  for(const b of blocks){
   const amount=localLightStrength(frame.field,s,{x:b.wx,y:g.y,z:b.z},g.owner);if(amount<.005)continue;
   const lx=s.x-b.wx,ly=s.y-g.y,lz=(s.height??30)-b.z,len=Math.hypot(lx,ly,lz)||1,diffuse=Math.max(0,(b.nx*lx+b.ny*ly+b.nz*lz)/len);
   tint.fillStyle=`rgba(${rgb.join(',')},${Math.min(.3,amount*diffuse*.32)})`;tint.fillRect(b.col,b.row,1,1);
   visibility.fillStyle=`rgba(${rgb.join(',')},${Math.min(.72,amount*1.05)})`;visibility.fillRect(b.col,b.row,1,1);
  }
  // Interpolate lighting, NOT sprite pixels: smooth falloff/penumbrae while
  // original alpha keeps the pixel-art silhouette and its one-pixel rim sharp.
  const left=(g.x-span-bounds.x)*scale,upper=(top-bounds.y)*scale;
  c.imageSmoothingEnabled=mask.imageSmoothingEnabled=true;
  c.drawImage(tintGrid,left,upper,cellW*6*scale,cellH*8*scale);
  mask.drawImage(visibilityGrid,left,upper,cellW*6*scale,cellH*8*scale);
  const dx=s.x-g.x,dy=s.y-(s.height??30)-(g.y-g.height*.5),length=Math.hypot(dx,dy)||1,edge=Math.max(1,scale*1.5);
  rim.clearRect(0,0,w,h);rim.globalCompositeOperation='source-over';rim.drawImage(original,0,0);
  // Subtract the alpha shifted away from the emitter: only the inside edge
  // facing it survives. The visibility mask then removes obstructed rim light.
  rim.globalCompositeOperation='destination-out';rim.drawImage(original,-dx/length*edge,-dy/length*edge);
  rim.globalCompositeOperation='source-in';rim.drawImage(lightMaskSurface,0,0);
  c.drawImage(rimSurface,0,0);
 }
 c.restore();
}

// Finite point-light extrusion, shared volume heights determine whether the ray
// passes below a crown, over a shrub, or casts a long trunk shadow. Rasterizing
// these convex masks avoids ray-tracing every ground pixel on every step.
export function groundShadowPolygon(source,v,radius=source.radius||280){
 const z=Math.max(1,source.height??30);if(v.minZ>=z||v.maxZ<=0||v.owner===source.owner&&source.owner!==undefined)return [];
 const ring=[];
 if(v.shape==='box'){for(const [x,y]of [[-1,-1],[1,-1],[1,1],[-1,1]])ring.push([v.x+x*v.rx,v.y+y*v.ry]);}
 else for(let i=0;i<12;i++){const a=i*Math.PI/6;ring.push([v.x+Math.cos(a)*v.rx,v.y+Math.sin(a)*v.ry]);}
 const points=[];
 const baseScale=z/Math.max(.1,z-Math.max(0,v.minZ));
 const topScale=v.maxZ>=z?Infinity:z/Math.max(.1,z-v.maxZ);
 for(const [x,y]of ring){const dx=x-source.x,dy=y-source.y,len=Math.hypot(dx,dy)||1,maxScale=(radius*2+Math.hypot(source.x-v.x,source.y-v.y))/len;
  for(const amount of [Math.min(baseScale,maxScale),Math.min(topScale,maxScale)])points.push([source.x+dx*amount,source.y+dy*amount]);
 }
 points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),lower=[],upper=[];
 for(const p of points){while(lower.length>=2&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
 for(let i=points.length-1;i>=0;i--){const p=points[i];while(upper.length>=2&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
 lower.pop();upper.pop();return lower.concat(upper);
}
