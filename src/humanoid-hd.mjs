// Generated artwork is shared by the world, creator, lobby and inventory.
// Pose/appearance IDs and authored wearable overrides remain owned by the rig.
import {ITEMS, itemKind} from './items.mjs';

export const HUMANOID_DETAIL_SCALE = 2;
export const HAIR_ATLAS_ROWS = {
  a: ['crop','bob','long','ponytail','mohawk','curls'],
  b: ['sidepart','undercut','pixie','waves','afro','braids'],
  c: ['locs','topknot','twinbraids','sideponytail','shag','spikes'],
};
// Image generation does not guarantee evenly spaced rows. These measured bands
// keep a long braid or tall mohawk out of its neighbour's source rectangle.
const bands = {
  a: [[15,220],[230,425],[430,715],[716,1004],[1004,1238],[1240,1520]],
  b: [[18,230],[235,444],[448,655],[660,880],[885,1112],[1118,1520]],
  c: [[18,244],[245,475],[476,740],[741,992],[992,1212],[1213,1460]],
};
const sheets = new Map(), cells = new Map(), tinted = new Map(), details = new Map();
const rearBands=[[[16,237],[238,512],[512,724],[725,998],[999,1245],[1246,1536]],[[20,237],[238,493],[494,728],[729,980],[981,1238],[1239,1510]],[[5,272],[273,512],[513,725],[726,1012],[1013,1262],[1263,1510]]];
let loading, revision = 0;
const rgb = value => /^#[0-9a-f]{6}$/i.test(value || '') ? value.slice(1).match(/../g).map(v=>parseInt(v,16)) : [110,95,75];
const clamp = value => Math.max(0,Math.min(255,Math.round(value)));
function canvas(width,height){const out=document.createElement('canvas');out.width=width;out.height=height;return out;}
function keep(cache,key,value,limit){if(cache.size>=limit)cache.delete(cache.keys().next().value);cache.set(key,value);return value;}
export function humanoidArtStatus(){return {ready:sheets.size===6,loaded:[...sheets.keys()],revision,tints:tinted.size,details:details.size};}
export function loadHumanoidArt(){
  if(loading)return loading;
  if(typeof Image==='undefined'||typeof document==='undefined')return Promise.resolve(false);
  loading=Promise.all(['heads','hair-a','hair-b','hair-c','hair-rear','materials'].map(name=>new Promise(resolve=>{
    const image=new Image();
    image.onload=()=>{sheets.set(name,image);revision++;cells.clear();tinted.clear();details.clear();resolve(true);};
    image.onerror=()=>resolve(false);
    image.src=new URL('../assets/humanoid-hd/'+name+'.png',import.meta.url).href;
  }))).then(results=>results.every(Boolean));
  return loading;
}
export function humanoidArtAvailable(c){return !!(c?.drawImage&&sheets.has('heads')&&sheets.has('materials'));}
export function withDetailedHeadScale(c,h,enabled,paint){
  if(!enabled||!humanoidArtAvailable(c)||c.__legacyHumanoid)return paint();
  c.save();c.translate(h.x,h.y+3);c.scale(1.25,1.25);c.translate(-h.x,-h.y-3);
  try{return paint();}finally{c.restore();}
}

function cell(name,index){
  const key=name+':'+index;if(cells.has(key))return cells.get(key);
  const source=sheets.get(name);if(!source)return null;
  const columns=name==='hair-rear'?3:4,column=index%columns,row=Math.floor(index/columns),cw=source.naturalWidth/columns;
  const band=name==='hair-rear'?rearBands[column][row]:name.startsWith('hair-')?bands[name.at(-1)][row]:[row*source.naturalHeight/(name==='heads'?2:4),(row+1)*source.naturalHeight/(name==='heads'?2:4)];
  const raw=canvas(Math.ceil(cw),Math.ceil(band[1]-band[0])),ctx=raw.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(source,column*cw,band[0],cw,band[1]-band[0],0,0,raw.width,raw.height);
  let box=[0,0,raw.width,raw.height];
  if(name!=='materials'){
    const {data}=ctx.getImageData(0,0,raw.width,raw.height);let x0=raw.width,y0=raw.height,x1=0,y1=0;
    for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++)if(data[(y*raw.width+x)*4+3]>80){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
    if(x1>=x0&&y1>=y0)box=[x0,y0,x1-x0+1,y1-y0+1];
  }
  // Retain enough source pixels for closeups; nearest sampling keeps authored
  // square clusters. All derived canvases keep the source alpha channel.
  const width=name==='materials'?64:name==='heads'?52:32,height=Math.max(1,Math.round(width*box[3]/box[2]));
  const result=canvas(width,height),pen=result.getContext('2d');pen.imageSmoothingEnabled=false;pen.drawImage(raw,...box,0,0,width,height);
  return keep(cells,key,result,128);
}
function colored(name,index,color){
  const key=name+':'+index+':'+color;if(tinted.has(key))return tinted.get(key);
  const source=cell(name,index);if(!source)return null;
  const out=canvas(source.width,source.height),c=out.getContext('2d',{willReadFrequently:true});c.drawImage(source,0,0);
  const image=c.getImageData(0,0,out.width,out.height),target=rgb(color),head=name==='heads';
  for(let i=0;i<image.data.length;i+=4){
    const r=image.data[i],g=image.data[i+1],b=image.data[i+2];if(!image.data[i+3])continue;
    if(head){
      // Warm skin pixels only: preserve the ivory sclera, green irises and ink.
      if(r<g*1.12||r<b*1.18||r<65)continue;
      const l=Math.round((r+g+b)/3/18)*18,relative=(l-151)*.85;
      for(let n=0;n<3;n++)image.data[i+n]=clamp(target[n]+relative*(relative>0?.72:1));
    }else{
      if(r>g*1.15&&g>b*1.2)continue; // Gold braid/ponytail ties.
      const l=Math.round((r+g+b)/3/14)*14;
      for(let n=0;n<3;n++)image.data[i+n]=clamp(l<25?target[n]*.20:target[n]*.72+(l-65)*1.25+12);
    }
  }
  c.putImageData(image,0,0);return keep(tinted,key,out,192);
}
export function headView(direction,closed=false){
  const d=((direction%8)+8)%8;
  const index=[0,1,2,3,4,3,2,1][d];
  return {index:closed&&index<3?index+5:index,mirror:d>4};
}
function sprite(c,image,x,y,width,height,mirror=false){
  c.save();c.imageSmoothingEnabled=false;c.translate(x,y);if(mirror)c.scale(-1,1);
  c.drawImage(image,-width/2,0,width,height);c.restore();
}
function eyeAsset(view,side,closed,eyeColor){
  const index=closed?view+5:view,key='eye:'+index+':'+side+':'+eyeColor;
  if(tinted.has(key))return tinted.get(key);
  const source=cell('heads',index);if(!source)return null;
  const box=view===0?(side==='L'?[.12,.37,.31,.36]:[.57,.37,.31,.36]):view===1?(side==='L'?[.01,.38,.20,.36]:[.30,.37,.33,.36]):[.04,.36,.37,.39];
  const out=canvas(Math.ceil(source.width*box[2]),Math.ceil(source.height*box[3])),pen=out.getContext('2d');pen.imageSmoothingEnabled=false;
  pen.drawImage(source,box[0]*source.width,box[1]*source.height,box[2]*source.width,box[3]*source.height,0,0,out.width,out.height);
  const pixels=pen.getImageData(0,0,out.width,out.height),target=eyeColor?rgb(eyeColor):null;
  for(let i=0;i<pixels.data.length;i+=4){
    const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
    // Material mask removes source skin. Eyebrow, lash, iris and sclera pixels
    // remain independent transparent sprites attached to the existing eye joint.
    if(r>100&&r>g*1.1&&r>b*1.15)pixels.data[i+3]=0;
    else if(target&&g>r*1.02&&g>b*1.2)for(let n=0;n<3;n++)pixels.data[i+n]=clamp(target[n]*(r+g+b)/240);
  }
  pen.putImageData(pixels,0,0);return keep(tinted,key,out,192);
}
export function drawDetailedHead(c,points,d,skin,look,visible,foreground){
  if(!humanoidArtAvailable(c)||c.__legacyHumanoid)return false;
  const h=points.head;
  const back=d>=3&&d<=5,profile=d===2||d===6,turn=d===0||d===4?0:d<4?-1:1;
  const skinRGB=rgb(skin),shade=(delta)=>'#'+skinRGB.map(n=>clamp(n+delta).toString(16).padStart(2,'0')).join('');
  const rect=(x,y,w,height,color)=>{c.fillStyle=color;c.fillRect(h.x+x,h.y+y,w,height);};
  if(!foreground){
    for(let y=-6;y<=4;y+=.5){
      const t=(y+1.2)/5.7,half=Math.sqrt(Math.max(0,1-t*t))*(profile?5:5.5);
      const left=Math.ceil(-half*2)/2,right=Math.floor(half*2)/2;
      for(let x=left;x<=right;x+=.5){
        const edge=x===left||x===right||y===4||y===-6;
        rect(x,y,.5,.5,edge?'#302b2b':shade(x<-2?18:x<1?0:x<3?-16:-30));
      }
    }
    return true;
  }
  // Each visible facial component stays attached to its existing editable joint.
  // The generated portrait is a style reference, not a baked replacement face.
  if(look?.face!=='elf')for(const [name,side]of [['earL',-1],['earR',1]])if(visible(name)){
    const q=points[name],angle=d*Math.PI/4;
    const dx=q.x-h.x-side*4*Math.cos(angle),dy=q.y-h.y-side*2*Math.sin(angle);
    const earX=[side*5.1,3.8,1.6,-4.4,-side*5.1,4.4,-1.6,-3.8][d]+dx;
    if(back&&['bob','long','waves','curls','locs','afro','shag'].includes(look?.hair))continue;
    rect(earX-.65,dy-.5,1.6,2.4,'#302b2b');rect(earX-.3,dy-.2,.95,1.8,shade(5));rect(earX+.1,dy+.3,.5,.7,shade(-26));
  }
  if(!back){
    for(const name of ['eyeL','eyeR'])if(visible(name)){
      const q=points[name],far=(d===1&&name==='eyeL')||(d===7&&name==='eyeR');
      const x=q.x-h.x+(profile?turn*.5:0),y=q.y-h.y-(d===1&&name==='eyeR'||d===7&&name==='eyeL'?.8:0);
      const feature=eyeAsset(profile?2:d===0?0:1,far?'L':d===0?(name==='eyeL'?'L':'R'):'R',!!look?.eyesClosed,look?.eyeColor);
      sprite(c,feature,h.x+x,h.y+y-2.65,far?2.05:profile?2.85:3.2,3.5,d>4);
    }
    if(visible('nose')){
      const q=points.nose,x=q.x-h.x,y=q.y-h.y+(profile?.7:.2);
      rect(x-.25,y,.6,.8,shade(16));rect(x-.25,y+.7,.8,.4,shade(-25));
      if(profile){rect(x+turn*.6,y+.25,.6,.6,skin);rect(x+turn*.6,y+.85,.5,.3,shade(-25));}
    }
    if(visible('mouth')){
      const q=points.mouth,x=q.x-h.x,y=q.y-h.y+(profile?.9:.4);
      rect(x-(profile?.3:.75),Math.min(3.6,y),profile?.75:1.5,.5,'#895443');
      rect(x-.4,Math.min(4,y+.5),.9,.25,shade(22));
    }
  }
  if(look?.face==='elf')for(const side of [-1,1]){
    if(profile&&side===turn)continue;
    const x=profile?-turn*2.7:side*4.7,y=profile?.4:0;
    for(let i=0;i<12;i++){
      const xx=x+side*i*.25,yy=y-i*.13,height=2.2-i*.15;
      rect(xx,yy,.3,height,'#49352f');rect(xx,yy+.3,.3,Math.max(.1,height-.65),shade(i>5?12:-8));
    }
    rect(x-.15,y+.6,.3,.5,shade(-32));
  }
  if(back)return true;
  const face=look?.face,cheeks=profile?[turn*3]:[-3.4,2.5];
  if(face==='freckles')for(const x of cheeks)for(const [dx,dy]of [[0,0],[.8,.25],[.4,.8]])rect(x+dx,1+dy,.28,.28,shade(-55));
  if(face==='scar')for(let i=0;i<7;i++){rect((profile?turn*2.5:2.8)+i*.12,-.5+i*.45,.28,.52,shade(-30));rect((profile?turn*2.5:2.8)+i*.12+.27,-.5+i*.45,.16,.45,shade(23));}
  if(face==='warpaint')for(const x of cheeks){rect(x-.3,1.1,1.7,.42,'#3b617b');rect(x,1.9,1.3,.32,'#75939c');}
  if(['beard','goatee','stubble'].includes(face)){
    const hair=rgb(look.hairColor),color='#'+hair.map(n=>clamp(n*.75).toString(16).padStart(2,'0')).join('');
    for(let y=2.8;y<5.1;y+=.25)for(let x=-3.5;x<3.5;x+=.25){
      const width=3.4-(y-2.8)*1.0;
      if(Math.abs(x)>width||(y<3.6&&Math.abs(x)<1.1)||(face==='goatee'&&Math.abs(x)>1.1))continue;
      if(face==='stubble'&&((Math.round(x*4)+Math.round(y*4)*3)%5!==0))continue;
      rect(x+(profile?turn:0),y,.25,.3,color);
    }
  }
  return true;
}

const hairFit={crop:[13.7,12.5,-8],bob:[14,13.4,-8],long:[15.3,20,-8.6],ponytail:[14.4,18,-10.5],mohawk:[12.4,17.6,-12.6],curls:[15.3,16.6,-8.5],sidepart:[13.8,13.4,-8.8],undercut:[13.5,13.5,-9],pixie:[13.5,12.7,-8.3],waves:[15,16.9,-8.8],afro:[18,16,-10.3],braids:[14.7,23,-8.7],locs:[14.8,15.5,-8.6],topknot:[13.7,15.7,-11.5],twinbraids:[15,19,-8.7],sideponytail:[15.8,18.4,-9.5],shag:[15.2,14.5,-8.6],spikes:[16.5,16,-11.3]};
export function drawDetailedHair(c,h,look,d,frame=0,action='idle'){
  if(!humanoidArtAvailable(c)||c.__legacyHumanoid)return false;
  const style=look?.hair;if(!style||style==='none')return true;
  const group=Object.keys(HAIR_ATLAS_ROWS).find(key=>HAIR_ATLAS_ROWS[key].includes(style));if(!group)return false;
  const column=d===0?0:d===1||d===7?1:d===2||d===6?2:3;
  const rear=d===3||d===5;
  const image=colored(rear?'hair-rear':'hair-'+group,rear?Object.values(HAIR_ATLAS_ROWS).flat().indexOf(style):HAIR_ATLAS_ROWS[group].indexOf(style)*4+column,look.hairColor||'#593923');if(!image)return false;
  const [width,height,top]=hairFit[style],moving=!['idle','sleep','death'].includes(action);
  const sway=moving&&['long','ponytail','braids','twinbraids','sideponytail','locs','waves'].includes(style)?Math.sin(frame*.7)*.55:0;
  c.save();c.translate(h.x,h.y+top);
  // Shear only the lower locks; the crown stays attached to the skull.
  if(c.transform)c.transform(1,0,sway/height,1,0,0);
  sprite(c,image,0,0,width,height,d>4);c.restore();return true;
}

export function materialIndex(id,fallback='cloth'){
  const def=ITEMS[id]||{},text=(id||'')+' '+(def.style||'');
  if(/scales/.test(text))return 5;if(/chain/.test(text))return 4;if(/leaf/.test(text))return 8;
  if(/ice|frost/.test(text))return 9;if(/moon|arcane|warlock/.test(text))return 10;
  if(/gold|sun|bronze/.test(text))return 11;if(/wrap/.test(text))return 13;
  if(/plate|gauntlet|iron|steel|metal/.test(text))return 2;
  if(/quilt|padded/.test(text))return 6;if(/robe|cape|cloak/.test(text))return 3;
  if(/leather|boot|glove|safari|scout/.test(text))return 1;
  return {cloth:0,skin:12,metal:2,leather:1,wood:7}[fallback]??0;
}
const samples=new Map();
function materialSample(index){
  if(samples.has(index))return samples.get(index);const source=cell('materials',index);if(!source)return null;
  const data=source.getContext('2d').getImageData(0,0,source.width,source.height);
  let mean=0;for(let i=0;i<data.data.length;i+=4)mean+=data.data[i];mean/=source.width*source.height;
  const value={data:data.data,width:data.width,height:data.height,mean};samples.set(index,value);return value;
}
// Preserve every equipment silhouette, motif and color while adding generated
// fabric/metal detail and quarter-pixel edge highlights to its actual raster.
export function detailRaster(source,material=0,scale=4){
  const out=canvas(source.width*scale,source.height*scale),c=out.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=false;c.drawImage(source,0,0,out.width,out.height);
  const image=c.getImageData(0,0,out.width,out.height),original=new Uint8ClampedArray(image.data),m=materialSample(material);
  const at=(x,y)=>x<0||y<0||x>=out.width||y>=out.height?-1:(y*out.width+x)*4;
  for(let y=0;y<out.height;y++)for(let x=0;x<out.width;x++){
    const i=at(x,y);if(!original[i+3])continue;
    const l=(original[i]+original[i+1]+original[i+2])/3;if(l<43)continue;
    const left=at(x-1,y),up=at(x,y-1),right=at(x+1,y),down=at(x,y+1);
    const different=j=>j<0||!original[j+3]||Math.abs(original[i]-original[j])+Math.abs(original[i+1]-original[j+1])+Math.abs(original[i+2]-original[j+2])>70;
    const bevel=(different(up)||different(left)?13:0)-(different(down)||different(right)?10:0);
    const mx=Math.floor(x/out.width*(m?.width||1)),my=Math.floor(y/out.height*(m?.height||1));
    const texture=m?(m.data[(my*m.width+mx)*4]-m.mean)*.22:0;
    for(let n=0;n<3;n++)image.data[i+n]=clamp(original[i+n]+bevel+texture);
  }
  c.putImageData(image,0,0);return out;
}
export function detailedProcedural(c,anchor,paint,material=0){
  if(!humanoidArtAvailable(c)||c.__legacyHumanoid)return false;
  const commands=[],ax=Math.round(anchor.x),ay=Math.round(anchor.y);
  const recorder={fillStyle:'#302b2b',fillRect(x,y,w,h){if(w>0&&h>0)commands.push([x-ax,y-ay,w,h,this.fillStyle]);}};
  paint(recorder);if(!commands.length)return true;
  const key=material+':'+JSON.stringify(commands);let entry=details.get(key);
  if(!entry){
    const x=Math.floor(Math.min(...commands.map(q=>q[0])))-1,y=Math.floor(Math.min(...commands.map(q=>q[1])))-1;
    const w=Math.ceil(Math.max(...commands.map(q=>q[0]+q[2])))-x+1,h=Math.ceil(Math.max(...commands.map(q=>q[1]+q[3])))-y+1;
    // Bounds are authored-rig dependent; unusual custom geometry stays native.
    if(w>96||h>96)return false;
    const base=canvas(w,h),pen=base.getContext('2d');for(const [xx,yy,ww,hh,color] of commands){pen.fillStyle=color;pen.fillRect(xx-x,yy-y,ww,hh);}
    entry=keep(details,key,{image:detailRaster(base,material),x,y,w,h},256);
  }
  c.save();c.imageSmoothingEnabled=false;c.drawImage(entry.image,ax+entry.x,ay+entry.y,entry.w,entry.h);c.restore();return true;
}

// A denser capsule raster rounds the silhouette itself, rather than enlarging
// the old circles. Quantized length and bounded caches also work while animating.
export function detailedLimb(c,a,b,width,color){
  if(!c.__humanoidDetail||!humanoidArtAvailable(c)||width<2.3)return false;
  const length=Math.hypot(b.x-a.x,b.y-a.y),len=Math.round(length*4)/4;
  if(len>96)return false;
  const material=c.__humanoidMaterials?.get(color)??0,key='limb:'+len+':'+width+':'+color+':'+material;
  let entry=details.get(key);
  if(!entry){
    const w=Math.ceil((width+1)*4),h=Math.ceil((len+width+1)*4),out=canvas(w,h),pen=out.getContext('2d'),image=pen.createImageData(w,h),base=rgb(color),m=materialSample(material),radius=width/2;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const xx=(x+.5)/4-(width+1)/2,yy=(y+.5)/4-radius-.5,dy=yy<0?yy:yy>len?yy-len:0;
      if(xx*xx+dy*dy>radius*radius)continue;
      const i=(y*w+x)*4,light=base.reduce((a,b)=>a+b)/3;
      const shade=light<43?0:-xx/radius*8+(m&&material!==12?(m.data[(Math.floor(y/h*m.height)*m.width+Math.floor(x/w*m.width))*4]-m.mean)*.18:0);
      for(let n=0;n<3;n++)image.data[i+n]=clamp(base[n]+shade);image.data[i+3]=255;
    }
    pen.putImageData(image,0,0);entry=keep(details,key,{image:out},256);
  }
  c.save();c.imageSmoothingEnabled=false;c.translate(a.x,a.y);c.rotate(-Math.atan2(b.x-a.x,b.y-a.y));c.drawImage(entry.image,-(width+1)/2,-width/2-.5,entry.image.width/4,entry.image.height/4);c.restore();return true;
}

export function detailedTorso(c,p,d,color,skin,back){
  if(!humanoidArtAvailable(c)||c.__legacyHumanoid)return false;
  const dx=p.pelvis.x-p.chest.x,dy=p.pelvis.y-p.chest.y,len=Math.max(3,Math.round(Math.hypot(dx,dy)*4)/4);
  const width=d===2||d===6?5:d%2?5.8:6.4,material=c.__humanoidMaterials?.get(color)??0;
  const key=['torso',len,width,color,skin,back,material].join(':');let entry=details.get(key);
  if(!entry){
    const out=canvas(60,Math.ceil((len+5)*4)),pen=out.getContext('2d'),base=rgb(color),m=materialSample(material),ink='#302b2b';
    const r=(x,y,w,h,fill)=>{pen.fillStyle=fill;pen.fillRect(Math.round((x+7.5)*4),Math.round((y+2.5)*4),Math.max(1,Math.round(w*4)),Math.max(1,Math.round(h*4)));};
    for(let y=-2;y<len+1.25;y+=.25){
      const t=Math.max(0,Math.min(1,y/len)),half=y<0?width-1.3+(y+2)*.55:width-(width-3.75)*(t*.65+t*t*.35);
      for(let x=-width;x<=width;x+=.25){
        if(Math.abs(x)>half)continue;
        const edge=Math.abs(x)>half-.5||y>len+.5;
        const tx=Math.min(m?.width-1||0,Math.floor((x+width)/(width*2)*(m?.width||1))),ty=Math.floor((y+2)/(len+4)*(m?.height||1));
        const v=-x/width*15+(m?(m.data[(ty*m.width+tx)*4]-m.mean)*.2:0);
        r(x,y,.25,.25,edge?ink:'#'+base.map(n=>clamp(n+v).toString(16).padStart(2,'0')).join(''));
      }
    }
    if(!back){
      // Small V neckline, turned collar, subtle center stitching and pocket.
      for(let y=-1.75;y<1.5;y+=.25){const half=Math.max(.2,1.6-(y+1.75)*.42);r(-half,y,half*2,.25,skin);}
      for(const side of [-1,1])for(let n=0;n<8;n++)r(side*(1.75-n*.16)-.2,-1.5+n*.3,.65,.35,n<4?'#ddccaa':'#bca87e');
      r(-.2,2,.35,Math.max(1,len-3),'#4e4438');
      for(const y of [2.5,4.75,7])if(y<len-1){r(.2,y,.45,.45,'#c5a268');r(.2,y,.2,.2,'#f4df9f');}
      r(-4.4,3,2.1,.35,'#b7a57c');r(-4.2,3.4,.25,2,'#514b38');r(-2.4,3.4,.25,2,'#514b38');r(-4.2,5.2,2,.25,'#514b38');
    }else{r(-3,-.5,6,.3,'#4b4d3b');r(.8,1,.3,Math.max(1,len-2),'#555a44');}
    r(-3.4,len-.7,6.8,1.2,'#57412f');r(-3.2,len-.7,6.4,.25,'#987045');
    if(!back){r(-.8,len-.8,1.8,1.4,'#c19b59');r(-.45,len-.5,1.1,.7,'#483b2c');}
    entry=keep(details,key,{image:out},256);
  }
  c.save();c.imageSmoothingEnabled=false;c.translate(p.chest.x,p.chest.y);c.rotate(-Math.atan2(dx,dy));c.drawImage(entry.image,-7.5,-2.5,15,entry.image.height/4);c.restore();return true;
}

// Render connected skin/fabric around the existing joint chain in one pass.
// This removes the dark circles at elbows/knees caused by overlapping capsules.
export function detailedChain(c,points,widths,color,material=0){
  if(!c.__humanoidDetail||!humanoidArtAvailable(c)||c.__legacyHumanoid)return false;
  const origin=points[0],local=points.map(q=>[Math.round((q.x-origin.x)*4)/4,Math.round((q.y-origin.y)*4)/4]);
  const key=JSON.stringify(['chain',local,widths,color,material]);let entry=details.get(key);
  if(!entry){
    const pad=Math.max(...widths)/2+1,x0=Math.floor(Math.min(...local.map(q=>q[0]))-pad),y0=Math.floor(Math.min(...local.map(q=>q[1]))-pad);
    const w=Math.ceil(Math.max(...local.map(q=>q[0]))+pad-x0),h=Math.ceil(Math.max(...local.map(q=>q[1]))+pad-y0);
    if(w>96||h>96)return false;
    const out=canvas(w*4,h*4),pen=out.getContext('2d'),image=pen.createImageData(w*4,h*4),base=rgb(color),m=materialSample(material);
    const segments=local.slice(1).map((q,i)=>({a:local[i],dx:q[0]-local[i][0],dy:q[1]-local[i][1],index:i}));
    for(let y=0;y<out.height;y++)for(let x=0;x<out.width;x++){
      const xx=x0+(x+.5)/4,yy=y0+(y+.5)/4;let edge=-Infinity,normal=0;
      for(const s of segments){
        const sq=s.dx*s.dx+s.dy*s.dy,t=Math.max(0,Math.min(1,((xx-s.a[0])*s.dx+(yy-s.a[1])*s.dy)/(sq||1)));
        const rx=xx-s.a[0]-s.dx*t,ry=yy-s.a[1]-s.dy*t,radius=(widths[s.index]+(widths[s.index+1]-widths[s.index])*t)/2;
        const inside=radius-Math.hypot(rx,ry);
        if(inside>edge){edge=inside;normal=(rx*s.dy-ry*s.dx)/(Math.sqrt(sq)||1)/radius;}
      }
      if(edge<0)continue;const i=(y*out.width+x)*4;
      const texture=material===12?0:m?(m.data[(Math.floor(y/out.height*m.height)*m.width+Math.floor(x/out.width*m.width))*4]-m.mean)*.11:0;
      const shift=(normal<-.55?22:normal<-.12?8:normal<.4?-4:-27)+Math.round(texture/8)*8;
      const first=segments[0],beforeStart=(xx-first.a[0])*first.dx+(yy-first.a[1])*first.dy<0;
      if(beforeStart)continue;
      for(let n=0;n<3;n++)image.data[i+n]=edge<.4?[48,43,43][n]:clamp(base[n]+shift);image.data[i+3]=255;
    }
    pen.putImageData(image,0,0);entry=keep(details,key,{image:out,x:x0,y:y0,w,h},256);
  }
  c.save();c.imageSmoothingEnabled=false;c.drawImage(entry.image,origin.x+entry.x,origin.y+entry.y,entry.w,entry.h);c.restore();return true;
}
export function detailedArm(c,shoulder,elbow,hand,shirt,skin,chestId){
  if(!detailedChain(c,[shoulder,elbow,hand],[4.4,3.8,3.4],skin,12))return false;
  const sleeveEnd={x:shoulder.x+(elbow.x-shoulder.x)*.45,y:shoulder.y+(elbow.y-shoulder.y)*.45};
  detailedChain(c,[shoulder,sleeveEnd],[5.1,4.5],shirt,materialIndex(chestId));
  const base=rgb(skin),dark='#'+base.map(n=>clamp(n-30).toString(16).padStart(2,'0')).join('');
  c.fillStyle=dark;c.fillRect(hand.x+.3,hand.y-.2,.3,1.1);c.fillRect(hand.x-.3,hand.y+.3,.3,.8);
  return true;
}
