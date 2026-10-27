import { ITEMS } from "./items.mjs";
import { gearPalette, gearPixels } from './gear-art.mjs';
import {bansheeHood,bansheeCuirass} from './banshee-gear-art.mjs';
import {drawSuccubusHorns} from './succubus-attachments.mjs';
import {detailedProcedural,materialIndex} from './humanoid-hd.mjs';
// Procedural pixel assets follow joint anchors and preserve eight-facing silhouettes.
export function wearableDetails(c, p, gear, look, d, time, cosmetics = {}) {
  if(detailedProcedural(c,p.chest,pen=>wearableDetails(pen,p,gear,look,d,time,cosmetics),materialIndex(gear.chest||gear.pants)))return;
  const back = d >= 3 && d <= 5,
    side = d === 2 || d === 6;
  const rect = (x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const chest = p.chest,
    head = p.head;
  if(ITEMS[gear.chest]?.bansheeGear)bansheeCuirass(c,p,d,gearPalette(gear.chest,cosmetics.dye),look?.skin||'#85b9cd');
  else if (gear.chest) {
    // Decoration follows the torso instead of stamping a second torso above it.
    const bottom = p.pelvis;
    const material=gearPalette(gear.chest,cosmetics.dye),style=ITEMS[gear.chest]?.style;
    const tint = material.base;
    const steps = Math.max(1, Math.ceil(Math.hypot(bottom.x-chest.x,bottom.y-chest.y)));
    for(let n=0;n<=steps;n++) {
      const t=n/steps,x=chest.x+(bottom.x-chest.x)*t,y=chest.y+(bottom.y-chest.y)*t;
      rect(x-3,y,7,1,material.dark);
      rect(x-2,y,4,1,t>.8?material.leather:tint);
      if(t<.8) {
        rect(x-3,y,1,1,back?material.dark:material.light);
        if(!side)rect(x+2,y,1,1,material.dark);
        if(!back)rect(x,y,1,1,material.dark);
        if(style==='plate'&&n%3===0)rect(x-2,y,5,1,material.light);
        if((style==='robe'||style==='coat')&&!side)rect(x+2,y,1,1,material.trim);
        if(style==='shirt'&&n===1)rect(x-2,y,4,1,material.light);
      }
    }
    rect(bottom.x-1,bottom.y-1,2,1,material.trim);
    if(ITEMS[gear.chest]?.warlockGear){
      // Split cloth panels follow the hips and knees instead of one square stamp.
      for(const leg of ['L','R']){
        const hip=p['hip'+leg],knee=p['knee'+leg],hemY=bottom.y+(knee.y-bottom.y)*.85+2;
        const rows=Math.max(1,Math.ceil(hemY-bottom.y));
        for(let n=0;n<=rows;n++){const t=n/rows,x=hip.x+(knee.x-hip.x)*t,y=bottom.y+n,w=side?3:4;
          rect(x-w/2-1,y,w+2,1,material.ink);rect(x-w/2,y,w,1,leg==='L'?material.base:material.dark);
          rect(x-w/2,y,1,1,material.light);if(n===rows)rect(x-w/2,y,w,1,'#baa780');
        }
      }
      if(!back){rect(chest.x-1,chest.y+2,3,4,'#baa780');rect(chest.x,chest.y+3,1,2,'#d8cfaa');}
    }
    if (ITEMS[gear.chest]?.style === "safari" && !back) {
      const y = (chest.y + bottom.y) / 2;
      rect(chest.x - 3, y, 2, 2, material.dark);
      rect(chest.x - 3, y, 2, 1, material.light);
      if (!side) {rect(chest.x + 1, y, 2, 2, material.dark);rect(chest.x + 1, y, 2, 1, material.light);}
    }
  }
  if (gear.pants)
    for (const side of ["L", "R"]) {
      const k = p["knee" + side];
      const material=gearPalette(gear.pants,cosmetics.dye),style=ITEMS[gear.pants]?.style;
      rect(k.x-1,k.y-1,3,2,material.dark);
      rect(k.x-1,k.y-1,2,1,material.light);
      if(style==='plated'||style==='scales') {rect(k.x-1,k.y+1,3,1,material.light);rect(k.x,k.y,1,1,material.shine);}
      if(style==='striped')rect(k.x-2,k.y-2,1,5,material.light);
      if(style==='safari') {rect(k.x-2,k.y-3,4,2,material.dark);rect(k.x-2,k.y-3,4,1,material.light);}
    }
  if (look?.face === "freckles" && !back) {
    rect(head.x - 3, head.y, 1, 1, "#985e42");
    rect(head.x + 2, head.y, 1, 1, "#985e42");
  }
  if (look?.face === "scar" && !back)
    rect(head.x + 2, head.y - 2, 1, 4, "#ad6e5b");
  if (look?.face === "beard" && !back) {
    rect(head.x - 2, head.y + 2, 5, 2, look.hairColor || "#593923");
    rect(head.x - 1, head.y + 4, 3, 1, look.hairColor || "#593923");
  }
}
export function directionalHelmet(c, id, h, d, cosmetics = {}) {
  const def=ITEMS[id];
  if(!def) return false;
  if(detailedProcedural(c,h,pen=>directionalHelmet(pen,id,h,d,cosmetics),materialIndex(id,'metal')))return true;
  const p=gearPalette(id,cosmetics.dye),r=gearPixels(c,h);
  const back=d>=3&&d<=5,side=d===2||d===6;
  const front=d===0?0:d<4?-3:3;
  const style=def.style||'brim';
  if(style==='succubus_horns'){drawSuccubusHorns(c,h,d,def.hornsPalette);return true;}
  if(def.bansheeGear){bansheeHood(c,h,d,p);return true;}
  if(def.warlockGear){
    // Pointed cloth cowl, open face, layered hem; rear view has no floating eyes.
    r(-1,-11,3,1,p.ink);r(-3,-10,7,1,p.ink);r(-5,-9,11,2,p.ink);
    r(-6,-7,13,6,p.ink);r(-4,-9,9,2,p.base);r(-5,-7,11,4,p.base);
    r(-3,-9,3,1,p.light);r(-5,-6,2,2,p.light);r(4,-7,2,4,p.dark);
    if(back){r(-5,-2,11,6,p.ink);r(-4,-2,9,5,p.base);r(-3,-2,2,4,p.light);r(2,-2,2,4,p.dark);}
    else{const near=side?(d===2?3:-5):-5;r(near,-3,3,7,p.ink);r(near+1,-3,1,6,p.base);
      if(!side){r(3,-3,3,7,p.ink);r(4,-3,1,6,p.light);}
      r(-3,-3,side?4:7,2,p.dark);r(side?(d===2?-2:2):-2,-2,1,1,'#91d9bc');if(!side)r(2,-2,1,1,'#91d9bc');
    }
    r(-5,4,11,1,p.ink);r(-4,3,9,1,p.base);r(front,-8,1,2,'#baa780');return true;
  }
  if(style==='halo') {
    const y=-12,w=side?5:7;
    r(-w+2,y,w*2-3,1,'#fff9d8');r(-w,y+1,2,3,'#ffe8a0');r(w-1,y+1,2,3,'#d5ae59');
    r(-w+1,y+4,w*2-1,1,'#ffe8a0');r(-w+2,y+4,w*2-3,1,'#fff9d8');
    return true;
  }
  if(style==='circlet'||style==='crown') {
    r(-6,-4,13,3,p.ink);r(-5,-4,11,1,p.light);r(-5,-3,11,1,p.base);
    if(style==='crown') for(const x of [-5,-1,3]) {
      r(x,-8,3,5,p.ink);r(x+1,-7,1,4,p.light);r(x,-5,3,1,p.base);
    }
    if(!back) {r(front-1,-5,3,4,p.dark);r(front,-5,1,3,p.shine);}
    return true;
  }
  // A stepped dome, with its seam and highlight following the viewing angle.
  r(-4,-9,9,1,p.ink);r(-6,-8,13,5,p.ink);
  r(-5,-7,11,4,p.base);r(-3,-8,7,1,p.light);
  r(-5,-6,2,2,p.light);r(4,-6,2,3,p.dark);
  r(-6,-3,13,2,p.ink);r(-5,-3,11,1,p.dark);
  if(style==='brim'||style==='safari'||style==='cap') {
    const w=style==='cap'?6:8;
    r(-w,-2,w*2+1,2,p.ink);r(-w+1,-2,w*2-1,1,p.light);
    r(-4,-4,9,1,p.leather);
    if(style==='safari') {r(front,-8,1,4,p.shine);r(front-1,-4,3,1,p.trim);}
    return true;
  }
  if(back) {
    r(-5,-2,11,5,p.ink);r(-4,-2,9,4,p.base);r(-3,-2,2,3,p.light);r(2,-2,2,4,p.dark);
  } else if(style==='hood'||style==='helmet'||style==='fullhelm'||style==='horned') {
    const cheek=side?(d===2?3:-5):-5;
    r(cheek,-2,3,6,p.ink);r(cheek+1,-2,1,5,p.base);
    if(!side) {r(3,-2,3,6,p.ink);r(4,-2,1,5,p.light);}
    if(style==='fullhelm') {
      r(-4,-1,9,4,p.dark);r(-3,0,7,1,p.ink);r(front,1,1,2,p.light);
      r(-3,3,7,1,p.light);
    }
  }
  if(style==='hood') {r(-5,3,11,2,p.ink);r(-4,3,9,1,p.base);}
  if(style==='horned') {
    // Horns turn with the skull: one silhouette in profile, two in front/rear.
    const horns=side?[{x:d===2?2:-3,sign:d===2?1:-1,far:false}]:
      [{x:-5,sign:-1,far:d===1||d===3},{x:5,sign:1,far:d===5||d===7}];
    for(const {x,sign,far} of horns){
      const reach=far?2:3,rise=far?4:5;
      r(x-1,-7,3,3,p.ink);r(x,-7,1,2,p.trim);
      for(let n=0;n<rise;n++){
        const bend=Math.min(reach,Math.floor(n/2)),xx=x+sign*bend;
        r(xx-1,-8-n,n===rise-1?2:3,1,p.ink);
        r(xx,-8-n,1,1,far?p.dark:n<3?p.trim:p.shine);
      }
    }
    r(front,-8,1,4,p.light);
  }
  if(style==='mask'&&!back) {
    r(-5,-2,11,6,p.ink);r(-4,-2,9,5,p.base);r(-4,-2,2,4,p.light);
    r(-3,-1,2,1,p.ink);if(!side)r(2,-1,2,1,p.ink);
    r(front,0,1,3,p.trim);r(-2,3,5,1,p.dark);
  }
  if(!back&&def.rarity!=='common') {r(front,-6,2,2,p.dark);r(front,-6,1,1,p.shine);}
  return true;
}
