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
  const metal=/plate|iron|steel|moon|sun|gauntlet|blade|sword|dagger|shield/.test(id+' '+(def.style||''));
  const result = { ink:'#302b2b', dark:mixGearColor(base,'#392b34',metal?.4:.32), base,
    light:mixGearColor(base,'#f7dfb7',metal?.38:.25), shine:'#f4e4bc', trim:'#b18a51', leather:'#624735' };
  if(def.blankExplorer)Object.assign(result,{ink:'#414b4d',dark:'#697476',base:'#858f90',light:'#b1baba',shine:'#b1baba',trim:'#697476',leather:'#697476'});
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
    // Taper from the cuff into a rounded palm, with a small offset thumb.
    // The open outline belongs to the whole glove rather than every band.
    const thumb=side==='L'?-1:1,widths=profile?[1,1,2,1,1]:[1,2,2,2,1];
    widths.forEach((half,i)=>{
      const y=-3+i,outer=half*2+1;
      r(-half,y,outer,1,p.ink);
      r(-half+1,y,Math.max(1,outer-2),1,rear?p.dark:p.base);
      if(i===1&&!rear)r(-half+1,y,Math.max(1,half),1,p.light);
      if(i===3)r(-half+1,y,Math.max(1,outer-2),1,p.dark);
    });
    r(-2,2,5,2,p.ink);r(-1,2,3,1,p.leather);r(-1,3,3,1,p.trim);
    if(!rear){r(thumb<0?-2:1,0,2,2,p.dark);r(thumb<0?-2:2,0,1,1,p.light);}
    if(def.style==='wraps'){r(-1,-2,3,1,p.light);r(-1,0,3,1,p.light);}
    if(def.style==='gauntlets'||def.style==='sun'){r(-1,-2,3,1,p.light);r(-1,0,3,1,p.shine);}
    if(def.style==='arcanist'){r(-1,-2,3,1,'#8fe0d7');r(-1,0,3,1,'#4baeb2');r(0,-3,1,1,'#d9e7bb');}
    if(def.style==='spiked'){r(-2,-4,1,2,p.shine);r(1,-4,1,2,p.light);}
    if(def.style==='safari')r(-1,-2,3,1,p.trim);
  } else if(kind==='boots') {
    // A narrow, fitted shaft widens only where the foot meets the toe.
    const toe=profile?(direction===2?-2:2):side==='L'?-1:1;
    const height=def.style==='tall'||def.style==='safari'?7:5;
    for(let row=0;row<height+2;row++){
      const y=-height+row,foot=row>=height-1,half=foot?3:row===0?1:2,cx=foot?Math.round(toe*.5):0;
      r(cx-half,y,half*2+1,1,p.ink);
      r(cx-half+1,y,Math.max(1,half*2-1),1,rear?p.dark:p.base);
      if(!rear&&row<height-1)r(cx-half+1,y,Math.max(1,half-1),1,row===0?p.light:p.base);
      if(row===height+1)r(cx-half+1,y,half*2-1,1,p.leather);
    }
    r(-2,-height+1,1,Math.max(1,height-3),p.light);
    if(!rear)r(-1,-1,2,1,p.trim);
    if(!rear&&def.style!=='sandals')r(1,-2,1,1,p.shine);
    if(def.style==='sandals') {r(-1,-4,3,4,'#b98e62');r(-1,-3,3,1,p.dark);r(-1,-1,3,1,p.base);}
    if(def.style==='flame') {r(1,-3,1,3,'#f2b66c');r(0,-2,1,2,p.shine);}
    if(def.style==='moon') r(0,-3,1,2,p.shine);
  } else if(kind==='shoulder_armor') {
    if(id==='alan_leaf_mantle'){
      for(const [x,len] of [[-2,3],[0,5],[2,3]]){
        r(x,-2,3,2,'#1f3928');r(x,-1,2,2,x===0?'#729853':'#3f713e');
        for(let y=1;y<len;y++){const inset=Math.floor(y/3);r(x+inset,y,Math.max(1,3-inset),1,'#254e30');r(x+inset+1,y,1,1,y===1?'#83a35c':'#477b41');}
      }
      return;
    }
    if(def.bansheeGear){bansheeShoulder(c,anchor,direction,side,p);return;}
    const widths=profile?[1,2,2,1]:[1,2,3,3,2,1],top=-Math.floor(widths.length/2);
    widths.forEach((half,i)=>{
      const y=top+i;r(-half,y,half*2+1,1,p.ink);
      if(half>1){r(-half+1,y,half*2-1,1,rear?p.dark:p.base);r(-half+1,y,Math.max(1,half-1),1,p.light);}
    });
    if(rear)r(0,-1,1,3,p.leather);
    else r(-1,-1,2,2,p.shine);
    if(def.style==='leaf') {r(1,0,2,2,p.dark);r(1,0,1,1,p.light);}
    if(def.style==='moon'||def.style==='sun') r(0,0,1,2,p.shine);
    if(def.style==='safari') {r(-2,0,profile?4:6,1,p.trim);r(0,-1,1,1,p.shine);}
    if(def.warlockGear){r(-2,-3,2,2,'#d3c9a4');r(1,-3,2,2,'#a69a7b');r(-2,1,profile?4:6,1,'#6e5978');}
  }
}

export function fittedShield(c,id,hand,d,blocking,dye) {
  if(detailedProcedural(c,hand,pen=>fittedShield(pen,id,hand,d,blocking,dye),materialIndex(id,'metal')))return;
  const p=gearPalette(id,dye),style=ITEMS[id]?.style;
  const raw=gearPixels(c,hand),profile=d===2||d===6,rear=d>=3&&d<=5,fit=.86;
  const r=(x,y,w,h,color)=>raw(Math.round(x*fit),Math.round(y*fit),Math.max(1,Math.round(w*fit)),Math.max(1,Math.round(h*fit)),color);
  if(style==='waykeeper'||style==='bastion'){
    const rows=style==='waykeeper'
      ?[2,4,5,6,6,6,6,6,5,4,3,2]
      :[2,4,5,6,7,7,7,7,6,5,4,3,2];
    const top=style==='waykeeper'?-6:-7;
    if(profile){
      r(0,top+1,3,rows.length-2,p.ink);r(1,top+2,1,rows.length-4,p.light);r(-1,top+3,1,rows.length-6,p.dark);
      r(-1,-1,3,3,p.leather);r(0,0,1,1,p.trim);return;
    }
    rows.forEach((half,i)=>r(-half,top+i,half*2+1,1,p.ink));
    rows.forEach((half,i)=>{if(half>1)r(-half+1,top+i,half*2-1,1,rear?p.leather:p.trim);});
    rows.forEach((half,i)=>{if(half>2)r(-half+2,top+i,half*2-3,1,rear?p.dark:p.base);});
    if(rear){
      r(-1,top+2,2,rows.length-4,p.leather);r(-3,top+4,6,1,p.trim);r(-4,top+8,8,1,p.trim);
      r(-1,top+4,2,5,p.dark);r(0,top+5,1,3,p.light);return;
    }
    if(style==='waykeeper'){
      r(-4,top+2,2,6,p.light);r(-2,top+1,2,5,p.light);r(3,top+2,2,5,p.dark);r(2,top+7,2,2,p.dark);
      r(-2,-1,5,1,p.trim);r(-2,0,4,2,p.light);r(-1,0,2,1,p.shine);r(0,2,2,3,p.dark);
    }else{
      r(-5,top+2,3,7,p.light);r(-2,top+1,2,7,p.light);r(3,top+2,2,6,p.dark);r(5,top+2,1,5,p.dark);r(2,top+9,2,2,p.dark);
      r(-3,top+1,6,1,p.trim);r(-2,top+2,4,1,p.shine);
      r(-2,-2,5,2,p.trim);r(-1,0,3,4,p.light);r(0,0,1,4,p.shine);r(-1,4,3,2,p.trim);r(0,6,1,2,p.dark);
    }
    return;
  }
  const roundRows=[2,4,5,6,6,6,5,4,2],kiteRows=[2,4,5,5,5,4,3,2,1],towerRows=[4,5,5,5,5,5,5,4,3,2,1],woodRows=[2,4,5,5,5,4,3,2,1];
  const silhouette=style==='round'?roundRows:style==='kite'?kiteRows:style==='tower'?towerRows:woodRows;
  const height=Math.floor(silhouette.length/2),width=profile?1:Math.max(...silhouette),top=-height;
  for(let row=0;row<silhouette.length;row++) {
    const y=top+row,half=profile?1:silhouette[row];
    r(-half,y,half*2+1,1,p.ink);
    if(half>1) {
      r(-half+1,y,half*2-1,1,rear?p.leather:p.dark);
      const faceWidth=Math.max(1,half*2-2),frontSide=d%2===1;
      r(frontSide?-half+2:-half+1,y,faceWidth,1,rear?p.dark:p.base);
      if(!rear)r(frontSide?-half+2:-half+1,y,Math.max(1,half-1),1,p.light);
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
    r(-width+1,-2,width*2-1,1,p.trim);r(-1,-1,3,3,p.ink);r(-1,-1,2,2,p.light);r(-1,-1,1,1,p.shine);
  } else if(style==='round') {
    r(-1,-1,3,3,p.ink);r(-1,-1,2,2,p.light);r(-1,-1,1,1,p.shine);
    r(-width+2,0,1,2,p.light);r(width-2,1,1,2,p.dark);
  } else if(style==='kite') {
    r(-3,-height+2,6,1,p.trim);r(-2,-height+3,4,1,p.light);
    r(-1,-1,3,3,p.ink);r(-1,-1,2,2,p.light);r(-1,-1,1,1,p.shine);
    r(-1,height-2,2,2,p.trim);
  } else {
    r(-width+1,-height+2,1,height-1,p.light);r(width-1,-height+2,1,height-1,p.dark);
    r(-2,2,5,1,p.trim);r(-1,-1,3,3,p.ink);r(-1,-1,2,2,p.light);r(-1,-1,1,1,p.shine);
  }
  for(const y of [-height+3,height-3]) {if(silhouette[Math.max(0,Math.min(silhouette.length-1,y-top))]>2){r(-width+1,y,1,1,p.shine);r(width-1,y,1,1,p.trim);}}
  if(style==='waykeeper'){r(-2,-3,5,1,'#c3d29a');r(-1,-2,1,3,'#9bc28a');r(0,-1,2,2,'#d4dfaa');r(1,0,1,2,'#78a57d');}
  if(style==='bastion'){r(-2,-4,5,2,'#465968');r(-1,-3,3,1,'#a3b5b0');r(-1,-1,3,4,'#a88b55');r(0,-1,1,3,'#e1c676');}
}

// Inventory silhouettes use the same materials as the worn pieces, with room
// for seams and fastenings that would be subpixel on a moving character.
export function paintGearIcon(c,id) {
  const def=ITEMS[id];if(!def?.slot)return false;
  const kind=itemKind(id),style=def.style,p=gearPalette(id),r=gearPixels(c,{x:0,y:0});
  if(def.bansheeGear&&bansheeGearIcon(c,kind,p))return true;
  if(!['hat','armor','pants','gloves','boots','shoulder_armor','cape','shield','wand','quiver','charm'].includes(kind))return false;
  if(kind==='hat') {
    if(style==='turtle'){
      for(const [y,half] of [[8,2],[9,4],[10,5],[11,6],[12,7],[13,7]]){
        r(12-half-1,y,half*2+3,1,'#192c21');
        r(12-half,y,half*2+1,1,y<10?'#52794a':'#3c633d');
      }
      r(5,14,15,1,'#213b28');
      r(12,8,1,6,'#6b8d55');r(12,7,1,1,'#79945c');
      r(11,14,3,1,'#52794a');
      return true;
    }
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
        if(style==='safari') {r(10,2,4,2,p.ink);r(11,0,2,3,p.base);r(11,0,1,2,p.light);r(11,4,2,9,p.light);r(10,13,4,2,p.trim);}
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
    if(style==='arcanist'){r(11,8,2,10,'#29495c');r(11,8,1,8,'#6cc6be');r(10,10,4,2,'#b7cf9b');r(11,11,2,2,'#ebdfaa');}
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
      if(style==='arcanist'){r(x+2,10,4,1,'#91e1d6');r(x+2,14,4,1,'#4caeb0');r(x+3,11,2,2,p.shine);}
      if(style==='arcanist'){r(x+2,10,4,1,'#91e1d6');r(x+2,14,4,1,'#4caeb0');r(x+3,11,2,2,p.shine);}
    }
  } else if(kind==='boots') {
    for(const x of [2,13]) {
      const top=style==='tall'||style==='safari'?3:6;
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
    if(style==='wilderness'){
      for(const x of [2,13])for(const [offset,len] of [[0,8],[3,11],[6,7]]){r(x+offset,5,3,len,'#28432c');r(x+offset+1,6,2,len-2,offset===3?'#5e8a43':'#3d6a39');r(x+offset+1,7,1,3,'#91ac65');}
      return true;
    }
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
    if(style==='safari'){r(10,9,4,9,def.lining||'#792d32');r(10,9,1,8,p.light);r(13,9,1,8,p.dark);}
    if(style==='leaf') {r(10,11,3,1,p.light);r(11,10,1,4,p.light);}
    if(style==='night') {r(11,10,3,5,p.light);r(12,9,3,4,p.base);}
    if(style==='gold') {r(10,11,4,4,p.trim);r(11,12,2,2,p.shine);}
    }
  } else if(kind==='shield') {
    if(style==='waykeeper') {
      const rows=[[10,13],[8,15],[6,17],[5,18],[4,19],[3,20],[3,20],[3,20],[3,20],[3,20],[3,20],[4,19],[5,18],[6,17],[8,15],[10,13]];
      rows.forEach(([l,rr],i)=>r(l,i+3,rr-l+1,1,p.ink));
      rows.forEach(([l,rr],i)=>{if(rr-l>3)r(l+1,i+3,rr-l-1,1,p.trim);});
      rows.forEach(([l,rr],i)=>{if(rr-l>5)r(l+2,i+3,rr-l-3,1,p.base);});
      r(6,7,3,7,p.light);r(7,14,4,3,p.light);r(9,7,6,2,p.base);r(14,8,3,7,p.dark);r(11,8,1,2,p.shine);
      r(10,9,4,1,p.trim);r(9,10,6,4,p.dark);r(10,10,4,3,p.trim);r(10,10,2,1,p.shine);r(11,12,2,1,p.leather);
      r(7,8,1,1,p.shine);r(16,8,1,1,p.leather);r(7,16,1,1,p.trim);r(16,16,1,1,p.dark);
    } else if(style==='bastion') {
      const rows=[[10,13],[8,15],[6,17],[4,19],[3,20],[2,21],[2,21],[2,21],[2,21],[3,20],[3,20],[4,19],[5,18],[6,17],[7,16],[8,15],[9,14],[10,13],[11,12]];
      rows.forEach(([l,rr],i)=>r(l,i+2,rr-l+1,1,p.ink));
      rows.forEach(([l,rr],i)=>{if(rr-l>3)r(l+1,i+2,rr-l-1,1,p.light);});
      rows.forEach(([l,rr],i)=>{if(rr-l>5)r(l+2,i+2,rr-l-3,1,p.dark);});
      r(5,7,4,9,p.base);r(6,7,2,8,p.light);r(16,8,2,6,p.dark);r(15,14,2,3,p.dark);
      r(9,6,8,2,p.ink);r(10,6,5,1,p.shine);r(10,8,4,1,p.trim);r(9,9,6,2,p.leather);
      r(10,11,4,6,p.trim);r(11,11,2,5,p.shine);r(11,16,3,2,p.leather);r(12,17,1,2,p.ink);
      r(5,8,1,1,p.shine);r(18,8,1,1,p.trim);r(8,18,1,1,p.light);r(15,18,1,1,p.dark);
    } else {
      for(let y=4;y<=21;y++) {
        const half=style==='tower'?7:style==='round'?Math.max(2,Math.floor(Math.sqrt(Math.max(0,81-(y-12)**2)))):Math.max(2,7-Math.max(0,y-12));
        r(12-half,y,half*2,1,p.ink);r(13-half,y,half*2-2,1,p.base);
      }
      r(7,6,1,10,p.light);r(11,5,2,14,p.trim);r(9,10,6,5,p.dark);r(10,11,4,3,p.light);r(10,11,2,1,p.shine);
    }
  } else if(kind==='wand') {
    for(let i=0;i<13;i++) {r(6+Math.floor(i*.6),21-i,2,1,p.leather);r(6+Math.floor(i*.6),21-i,1,1,p.light);}
    r(12,3,7,7,p.dark);r(13,4,5,5,p.base);r(13,4,2,3,p.light);r(13,4,1,1,p.shine);r(11,10,8,2,p.trim);
    if(style==='flame') {r(14,1,2,4,'#ffb957');r(11,4,2,3,'#ff8b42');r(16,5,2,3,p.shine);}
    if(style==='star'||style==='sun') {r(9,5,3,2,p.light);r(19,5,3,2,p.light);r(14,0,2,3,p.light);}
    if(style==='crystal') {r(14,1,2,3,p.light);r(14,6,1,3,p.shine);}
    if(style==='mender'){r(9,3,9,2,'#397968');r(11,2,5,2,'#a6dec4');r(13,1,2,6,'#eff6cf');r(11,3,6,2,'#eff6cf');r(10,8,5,2,'#a6dec4');}
    if(style==='groveheart'){r(9,4,4,3,'#347752');r(17,4,4,3,'#347752');r(11,5,3,5,'#7fcb77');r(16,5,3,5,'#aadf83');r(13,4,4,6,'#d2e8a0');r(14,5,2,3,'#f3f4c8');}
    if(id==='cinder_wand') {r(9,3,2,2,'#ffd894');r(10,1,1,1,'#ff7840');}
  } else if(kind==='charm') {
    r(6,4,12,2,p.trim);r(7,6,1,4,p.trim);r(16,6,1,4,p.trim);r(10,8,4,2,p.trim);
    r(9,10,6,2,p.ink);r(8,12,8,4,p.dark);r(9,12,6,4,p.base);r(10,13,4,2,p.light);r(11,13,2,2,p.shine);r(10,16,4,2,p.trim);
    if(style==='bogglass'){r(10,10,4,2,'#c5e4c1');r(9,12,6,2,'#65c2a7');r(11,14,2,2,'#317966');r(8,11,1,4,'#a5b77b');r(15,11,1,4,'#a5b77b');}
  } else if(kind==='quiver') {
    r(6,5,12,15,p.ink);r(8,4,8,13,p.dark);r(9,5,6,11,p.base);r(9,5,2,10,p.light);r(9,16,7,2,p.trim);
    for(const [x,h]of [[9,8],[12,11],[15,9]]){r(x,3,1,h,'#ead7aa');r(x-1,3,3,2,'#c8a164');}
    if(style==='dunewind'){r(10,7,5,2,'#e8c275');r(11,8,3,1,'#fff0b4');r(9,12,7,1,'#775438');}
  }
  // Tiny maker's marks preserve identity between otherwise similar variants.
  if(def.variant)for(let bit=0;bit<6;bit++)if(def.variant&(1<<bit))r(10+bit%3,12+Math.floor(bit/3),1,1,p.shine);
  return true;
}
