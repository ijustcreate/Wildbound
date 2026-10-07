import { ITEMS, itemKind } from './items.mjs';
import {bansheeShoulder,bansheeGearIcon} from './banshee-gear-art.mjs';
import {detailedProcedural,materialIndex} from './humanoid-hd.mjs';

// Shared material ramps for world sprites, fitted equipment and inventory art.
export function mixGearColor(color, target, amount) {
  const channels = hex => hex.slice(1).match(/../g).map(v => parseInt(v, 16));
  const b = channels(target);
  return '#' + channels(color).map((v, i) => Math.round(v + (b[i] - v) * amount).toString(16).padStart(2, '0')).join('');
}
const ramps = new Map();
export function gearPalette(id, dye) {
  const def = ITEMS[id] || {};
  const base = dye || def.artColor || '#997d50';
  const key = `${id}:${base}`;
  if (ramps.has(key)) return ramps.get(key);
  const result = { ink:'#302b2b', dark:mixGearColor(base,'#302b2b',.48), base,
    light:mixGearColor(base,'#f7e7c0',.42), shine:'#f4e4bc', trim:'#b18a51', leather:'#624735' };
  if(def.bansheeGear)Object.assign(result,{ink:'#24232e',dark:mixGearColor(base,'#202532',.5),light:mixGearColor(base,'#b7d2de',.34),shine:'#d0e8ed',trim:'#90aab9',leather:'#473344'});
  if (ramps.size >= 512) ramps.clear();
  ramps.set(key, result);
  return result;
}
export function gearPixels(c, anchor) {
  return (x,y,w,h,color) => {
    c.fillStyle=color;
    c.fillRect(Math.round(anchor.x)+x,Math.round(anchor.y)+y,w,h);
  };
}

// Rotate pixel coverage about the ankle, following the projected shin. Inverse
// sampling keeps the silhouette solid (forward-splatting pixels leaves holes).
export function bootFrame(ankle, knee) {
  const dx=knee.x-ankle.x,dy=ankle.y-knee.y,length=Math.hypot(dx,dy);
  return length<.01?{cos:1,sin:0}:{cos:dy/length,sin:dx/length};
}
export function withBootPose(c, ankle, knee, paint, customSprite=false) {
  const {cos,sin}=bootFrame(ankle,knee),fill=c.fillRect;
  // Real canvas transforms compose with authored wearable offsets/rotations.
  if((customSprite||c.__humanoidDetail)&&c.save&&c.restore&&c.translate&&c.rotate){
    c.save();c.translate(ankle.x,ankle.y);c.rotate(Math.atan2(sin,cos));c.translate(-ankle.x,-ankle.y);
    try{return paint();}finally{c.restore();}
  }
  // Procedural boots stay on the pixel grid instead of blurring at each angle.
  const ax=Math.round(ankle.x),ay=Math.round(ankle.y);
  c.fillRect=function(x,y,w,h){
    if(Math.abs(sin)<1e-8&&cos>0)return fill.call(this,x,y,w,h);
    const corners=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([px,py])=>[ax+(px-ax)*cos-(py-ay)*sin,ay+(px-ax)*sin+(py-ay)*cos]);
    const x0=Math.floor(Math.min(...corners.map(p=>p[0]))),x1=Math.ceil(Math.max(...corners.map(p=>p[0])));
    const y0=Math.floor(Math.min(...corners.map(p=>p[1]))),y1=Math.ceil(Math.max(...corners.map(p=>p[1])));
    for(let yy=y0;yy<y1;yy++)for(let xx=x0;xx<x1;xx++){
      const dx=xx+.5-ax,dy=yy+.5-ay,sx=ax+dx*cos+dy*sin,sy=ay-dx*sin+dy*cos;
      if(sx>=x&&sx<x+w&&sy>=y&&sy<y+h)fill.call(this,xx,yy,1,1);
    }
  };
  try{return paint();}finally{c.fillRect=fill;}
}

// Deliberately authored at character resolution: never resize inventory pairs.
export function fittedGear(c, id, anchor, direction, side, dye) {
  if(detailedProcedural(c,anchor,pen=>fittedGear(pen,id,anchor,direction,side,dye),materialIndex(id,'leather')))return;
  const def=ITEMS[id], kind=itemKind(id), p=gearPalette(id,dye);
  if(def?.humanoidWings){
    // Only the fitted harness clasp goes on the shoulder joint. The actual
    // wing belongs to the separate back-mounted articulated layer.
    const r=gearPixels(c,anchor);r(-2,-2,5,4,p.ink);r(-1,-1,3,2,'#b29363');r(-1,-1,2,1,'#eed9a2');r(0,0,1,1,p.dark);return;
  }
  const r=gearPixels(c,anchor), profile=direction===2||direction===6;
  const rear=direction>=3&&direction<=5;
  if(kind==='gloves') {
    // The joint is the wrist: keep the silhouette compact so the glove does
    // not swallow the sleeve or read as a second arm.
    const thumb=side==='L'?-1:1;
    r(-2,-2,5,6,p.ink);r(-1,-1,3,4,p.base);
    r(-1,-2,3,1,p.light);r(-1,2,3,2,p.dark);
    r(-2,3,5,2,p.leather);r(-1,3,3,1,p.trim);
    r(thumb<0?-2:1,0,2,2,p.dark);r(thumb<0?-2:2,0,1,1,p.light);
    r(-1,0,2,1,p.light);r(0,2,1,1,p.trim);
    if(def.style==='wraps') {r(-1,-1,3,1,p.light);r(-1,1,3,1,p.light);}
    if(def.style==='gauntlets'||def.style==='sun') {r(-1,-1,3,1,p.light);r(-1,1,3,1,p.shine);}
    if(def.style==='spiked'||id==='gloves') {r(-2,-4,1,2,p.shine);r(1,-4,1,2,p.light);}
    if(def.style==='safari') r(-1,-1,3,1,p.trim);
  } else if(kind==='boots') {
    // The foot joint is the ankle. Keep the sole one pixel below it and put
    // the toe on the visible side for profile views.
    const toe=profile?(direction===2?-2:2):side==='L'?-1:1;
    const height=def.style==='tall'?7:5;
    r(-3,-height,6,height+2,p.ink);r(-2,-height+1,4,height-1,p.dark);
    r(-3+toe,-1,6,4,p.ink);r(-2+toe,-1,4,3,p.base);
    r(-1,-height+1,3,height-1,p.base);r(-1,-height+1,3,1,p.light);
    r(-3+toe,2,6,1,p.leather);r(-2+toe,1,4,1,p.trim);
    if(!rear) {r(-1,-3,2,1,p.trim);r(-1,-1,2,1,p.light);}
    r(-2,-height+1,1,Math.max(1,height-3),p.light);
    if(!rear&&def.style!=='sandals')r(1,-2,1,1,p.shine);
    if(def.style==='sandals') {r(-1,-4,3,4,'#b98e62');r(-1,-3,3,1,p.dark);r(-1,-1,3,1,p.base);}
    if(def.style==='flame') {r(1,-3,1,3,'#f2b66c');r(0,-2,1,2,p.shine);}
    if(def.style==='moon') r(0,-3,1,2,p.shine);
  } else if(kind==='shoulder_armor') {
    if(def.bansheeGear){bansheeShoulder(c,anchor,direction,side,p);return;}
    const w=profile?4:5;
    r(-2,-2,w,1,p.ink);r(-3,-1,w+2,3,p.ink);r(-2,2,w,1,p.ink);
    r(-2,-1,w,2,p.base);r(-2,-1,w-1,1,p.light);r(-1,1,w-1,1,p.dark);
    r(-1,-1,1,1,p.shine);
    if(def.style==='leaf') {r(1,0,2,2,p.dark);r(1,0,1,1,p.light);}
    if(def.style==='moon'||def.style==='sun') r(0,0,1,2,p.shine);
    if(def.style==='safari') {r(-2,0,w,1,p.trim);r(0,-1,1,1,p.shine);}
    if(def.warlockGear){r(-2,-3,2,2,'#d3c9a4');r(1,-3,2,2,'#a69a7b');r(-2,1,w,1,'#6e5978');}
  }
}

export function fittedShield(c,id,hand,d,blocking,dye) {
  if(detailedProcedural(c,hand,pen=>fittedShield(pen,id,hand,d,blocking,dye),materialIndex(id,'metal')))return;
  const p=gearPalette(id,dye),style=ITEMS[id]?.style;
  const r=gearPixels(c,hand), profile=d===2||d===6, rear=d>=3&&d<=5;
  const width=profile?1:(d%2?3:style==='tower'?5:4);
  const height=style==='tower'?7:6;
  for(let y=-height;y<=height;y++) {
    const taper=style==='round'?Math.floor(Math.abs(y)*Math.abs(y)/15):Math.max(0,Math.floor((y-1)/2));
    const half=Math.max(1,width-taper);
    r(-half,y,half*2+1,1,p.ink);
    if(half>1) {
      r(-half+1,y,half*2-1,1,rear?p.leather:p.dark);
      r(-half+1,y,Math.max(1,half-1),1,rear?p.dark:p.base);
      if(!rear)r(-half+1,y,1,1,p.light);
    } else r(0,y,1,1,p.dark);
  }
  if(profile){r(0,-height+1,1,height*2-1,p.light);return;}
  if(rear){
    r(-width+1,-3,width*2-1,1,p.dark);r(-width+1,3,width*2-1,1,p.dark);
    r(-1,-2,3,5,p.ink);r(0,-1,1,3,p.trim);return;
  }
  r(-width+1,-height+2,1,height,blocking?p.shine:p.light);
  if(!style||style==='wood') {
    r(0,-height+2,1,height*2-3,p.dark);
    r(-width+1,-3,width*2-1,1,p.trim);r(-width+1,3,width*2-1,1,p.trim);
  } else r(0,-height+2,1,height*2-3,p.trim);
  r(-1,-1,3,3,p.ink);r(-1,-1,2,2,p.light);r(-1,-1,1,1,p.shine);
  for(const y of [-height+3,height-3]) {r(-width+1,y,1,1,p.shine);r(width-1,y,1,1,p.trim);}
  if(style==='tower') {r(-2,3,5,1,p.trim);r(-2,-4,5,1,p.trim);}
}

// Inventory silhouettes use the same materials as the worn pieces, with room
// for seams and fastenings that would be subpixel on a moving character.
export function paintGearIcon(c,id) {
  const def=ITEMS[id];if(!def?.slot)return false;
  const kind=itemKind(id),style=def.style,p=gearPalette(id),r=gearPixels(c,{x:0,y:0});
  if(def.bansheeGear&&bansheeGearIcon(c,kind,p))return true;
  if(!['hat','armor','pants','gloves','boots','shoulder_armor','cape','shield','wand'].includes(kind))return false;
  if(kind==='hat') {
    if(style==='halo') {
      r(5,6,14,2,'#a27b35');r(3,8,3,6,'#a27b35');r(18,8,3,6,'#a27b35');r(5,14,14,2,'#a27b35');
      r(6,5,12,2,p.base);r(4,7,3,6,p.base);r(17,7,3,6,p.base);r(6,13,12,2,p.base);
      r(7,5,9,1,'#fff9d8');r(4,8,1,4,'#fff9d8');r(7,13,9,1,'#fff9d8');
      r(2,3,1,3,p.base);r(1,4,3,1,p.base);r(21,17,1,3,p.base);r(20,18,3,1,p.base);
    } else if(style==='circlet'||style==='crown') {
      r(4,12,16,4,p.dark);r(5,12,14,1,p.light);r(5,14,14,1,p.base);
      if(style==='crown')for(const x of [5,10,16]) {r(x,6,3,7,p.base);r(x,6,1,6,p.light);}
      r(10,10,4,6,p.dark);r(11,11,2,4,p.base);r(11,11,1,2,p.shine);
    } else {
      r(7,4,10,2,p.light);r(5,6,14,8,p.base);r(5,7,3,5,p.light);r(16,6,3,8,p.dark);
      r(5,13,14,2,p.leather);
      if(!style||style==='cap'||style==='safari') {
        r(2,15,20,3,p.base);r(3,15,18,1,p.light);
        if(style==='safari') {r(11,4,2,9,p.light);r(10,13,4,2,p.trim);}
      } else {
        r(5,14,3,6,p.base);r(16,14,3,6,p.dark);
        if(style==='hood') {r(6,19,12,2,p.base);r(7,7,10,6,p.dark);}
        if(style==='fullhelm'||style==='mask') {
          r(8,14,8,5,p.base);r(8,14,8,2,p.dark);r(11,15,2,5,p.light);
          if(style==='mask') {r(7,15,3,1,p.shine);r(14,15,3,1,p.shine);}
        }
        if(style==='horned')for(const x of [2,19]) {r(x,3,2,8,p.shine);r(x,10,3,2,p.trim);}
      }
    }
  } else if(kind==='armor') {
    r(5,4,5,5,p.base);r(14,4,5,5,p.base);r(7,7,10,14,p.base);
    r(7,8,2,12,p.light);r(15,7,2,14,p.dark);r(11,8,2,13,p.dark);
    r(6,4,3,2,p.light);r(15,4,3,2,p.light);r(8,18,8,2,p.leather);r(11,18,2,2,p.trim);
    if(style==='coat'||style==='robe') {r(5,18,5,4,p.base);r(14,18,5,4,p.dark);r(6,20,3,1,p.trim);r(15,20,3,1,p.trim);}
    if(style==='plate') {r(3,5,5,4,p.light);r(16,5,5,4,p.base);for(const y of [10,14])r(8,y,8,1,p.light);}
    if(style==='safari')for(const x of [7,13]) {r(x,10,4,5,p.dark);r(x,10,4,1,p.light);r(x+1,12,1,1,p.trim);}
    if(style==='shirt') {r(7,5,3,3,p.shine);r(14,5,3,3,p.shine);}
  } else if(kind==='pants') {
    r(5,4,14,5,p.base);r(5,9,5,12,p.base);r(14,9,5,12,p.dark);
    r(6,10,1,10,p.light);r(14,10,2,10,p.base);r(5,4,14,2,p.leather);r(11,4,3,2,p.trim);
    r(6,9,3,1,p.dark);r(15,9,3,1,p.dark);
    if(style==='scales'||style==='plated')for(const y of [11,14,17])for(const x of [6,15]) {r(x,y,3,1,p.light);r(x+1,y+1,2,1,p.dark);}
    if(style==='striped') {r(8,7,1,14,p.light);r(17,7,1,14,p.light);}
    if(style==='safari') {r(4,10,5,4,p.dark);r(15,10,5,4,p.dark);r(4,10,5,1,p.light);r(15,10,5,1,p.light);}
  } else if(kind==='gloves') {
    for(const x of [2,13]) {
      r(x+1,7,6,13,p.dark);r(x+2,8,4,9,p.base);r(x+2,8,1,8,p.light);
      r(x+7,12,2,5,p.base);r(x+1,18,7,3,p.leather);r(x+1,18,7,1,p.light);
      r(x+3,10,1,5,p.dark);r(x+5,10,1,4,p.dark);r(x+3,19,2,1,p.trim);
      if(style==='wraps')for(const y of [10,13,16])r(x+2,y,5,1,p.light);
      if(style==='spiked'||id==='gloves') {r(x+1,4,1,4,p.shine);r(x+5,3,1,5,p.light);}
      if(style==='gauntlets'||style==='sun') {r(x+2,10,4,1,p.light);r(x+2,14,4,1,p.light);r(x+3,11,2,2,p.shine);}
      if(style==='safari')r(x+2,17,4,1,p.trim);
    }
  } else if(kind==='boots') {
    for(const x of [2,13]) {
      const top=style==='tall'?3:6;
      r(x+1,top,6,14-top,p.dark);r(x+2,top+1,3,13-top,p.base);
      r(x+1,14,8,7,p.base);r(x+6,15,3,5,p.dark);r(x,20,10,2,p.leather);
      r(x+1,top,6,1,p.light);r(x+2,16,4,1,p.light);
      for(const y of [10,13])r(x+2,y,3,1,p.trim);
      r(x+1,18,5,1,p.light);r(x+6,18,2,1,p.dark);r(x+4,11,1,1,p.shine);
      if(style==='sandals') {r(x+1,7,6,11,'#b58c68');r(x+1,10,6,2,p.dark);r(x+1,15,6,2,p.base);}
      if(style==='flame') {r(x+5,14,2,5,'#eea051');r(x+5,16,1,3,p.shine);}
      if(style==='moon') {r(x+2,7,3,4,p.light);r(x+3,7,2,3,p.base);}
    }
  } else if(kind==='shoulder_armor') {
    for(const x of [2,13]) {
      r(x+2,5,5,2,p.light);r(x+1,7,7,6,p.base);r(x+1,13,8,5,p.dark);
      r(x+2,7,2,6,p.light);r(x+2,16,6,1,p.trim);
      if(style==='leaf') {r(x+3,9,1,6,p.dark);r(x+4,9,2,1,p.light);}
      if(style==='moon'||style==='sun') {r(x+4,9,2,4,p.shine);r(x+3,10,4,1,p.light);}
      if(style==='safari') {r(x+1,11,7,2,p.trim);r(x+4,8,1,1,p.shine);}
    }
  } else if(kind==='cape') {
    if(['tattered','short','pointed'].includes(style)){
      const length=style==='tattered'?18:9;
      for(let y=0;y<length;y++){
        const half=style==='pointed'?Math.max(1,Math.round(5*(1-y/length))):Math.round(4+y/length*3);
        for(let x=-half;x<half;x++){
          const cut=style==='tattered'?[0,2,1,4,0,2,1][((x+7)%7+7)%7]:0;
          if(y>=length-cut)continue;
          r(12+x,4+y,1,1,y===length-cut-1?p.trim:x<-2?p.light:x>2?p.dark:p.base);
        }
      }
      r(8,4,8,1,p.trim);r(11,4,2,2,p.shine);
    }else{
    r(8,4,8,4,p.base);r(6,8,12,7,p.base);r(4,15,16,6,p.base);
    r(7,8,2,12,p.light);r(14,8,2,12,p.dark);r(5,20,14,1,p.trim);
    r(8,4,8,1,p.trim);r(11,4,2,2,p.shine);
    if(style==='leaf') {r(10,11,3,1,p.light);r(11,10,1,4,p.light);}
    if(style==='night') {r(11,10,3,5,p.light);r(12,9,3,4,p.base);}
    if(style==='gold') {r(10,11,4,4,p.trim);r(11,12,2,2,p.shine);}
    }
  } else if(kind==='shield') {
    for(let y=4;y<=21;y++) {
      const half=style==='tower'?7:style==='round'?Math.max(2,Math.floor(Math.sqrt(Math.max(0,81-(y-12)**2)))):Math.max(2,7-Math.max(0,y-12));
      r(12-half,y,half*2,1,p.dark);r(13-half,y,half*2-2,1,p.base);
    }
    r(7,6,1,10,p.light);r(11,5,2,14,p.trim);r(9,10,6,5,p.dark);r(10,11,4,3,p.light);r(10,11,2,1,p.shine);
  } else if(kind==='wand') {
    for(let i=0;i<13;i++) {r(6+Math.floor(i*.6),21-i,2,1,p.leather);r(6+Math.floor(i*.6),21-i,1,1,p.light);}
    r(12,3,7,7,p.dark);r(13,4,5,5,p.base);r(13,4,2,3,p.light);r(13,4,1,1,p.shine);r(11,10,8,2,p.trim);
    if(style==='flame') {r(14,1,2,4,'#ffb957');r(11,4,2,3,'#ff8b42');r(16,5,2,3,p.shine);}
    if(style==='star'||style==='sun') {r(9,5,3,2,p.light);r(19,5,3,2,p.light);r(14,0,2,3,p.light);}
    if(style==='crystal') {r(14,1,2,3,p.light);r(14,6,1,3,p.shine);}
    if(id==='cinder_wand') {r(9,3,2,2,'#ffd894');r(10,1,1,1,'#ff7840');}
  }
  // Tiny maker's marks preserve identity between otherwise similar variants.
  if(def.variant)for(let bit=0;bit<6;bit++)if(def.variant&(1<<bit))r(10+bit%3,12+Math.floor(bit/3),1,1,p.shine);
  return true;
}
