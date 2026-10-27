import {gearPixels} from './gear-art.mjs';

// Keeper reference: dead branches, layered teal cloth, red binding, parchment
// story tags and amber keepsakes. Geometry stays native to the humanoid rig.
const TEAL='#087b79', LIGHT='#39b6ad', DARK='#163f43', WOOD='#493e49';
const LEATHER='#392d31', RED='#9f4439', GOLD='#e8ab43', PAPER='#dddac0', INK='#aa443b';
export const KEEPER_GEAR=['keeper_crown','keeper_robes','keeper_sash','keeper_staff','keeper_blade','keeper_band'];
// Two antlers attached at the left/right temples; their tines share those stems.
export const KEEPER_ANTLER_SIDES=Object.freeze([-1,1]);

function stroke(r,x0,y0,x1,y1,color,width=1) {
  const steps=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);
  for(let i=0;i<=steps;i++)r(Math.round(x0+(x1-x0)*i/steps),Math.round(y0+(y1-y0)*i/steps),width,width,color);
}
function tag(r,x,y,h=6) {
  r(x-1,y-1,4,h+2,RED);r(x,y,2,h,PAPER);
  for(let n=1;n<h-1;n+=2)r(x,y+n,1,1,INK);
}
function crown(r,profile=false,rear=false) {
  const branch=(a,b,c,d)=>stroke(r,a,b,c,d,WOOD,2);
  // Open brow circlet: the actor's own face and expression remain visible.
  stroke(r,-5,-5,5,-5,LEATHER,2);
  stroke(r,-4,-5,4,-5,TEAL);
  for(const side of KEEPER_ANTLER_SIDES){
    // Compact curved branches match the user's orange silhouette sketch.
    // An inward tine breaks up each stem without adding a third antler.
    branch(side*4,-6,side*5,-7);
    branch(side*5,-7,side*6,-9);
    branch(side*6,-9,side*7,-11);
    branch(side*7,-11,side*7,-12);
    stroke(r,side*7,-12,side*6,-13,WOOD);
    stroke(r,side*6,-13,side*5,-13,WOOD);
    stroke(r,side*5,-8,side*3,-10,WOOD);
    stroke(r,side*3,-10,side*3,-12,WOOD);
    stroke(r,side*3,-12,side*5,-11,WOOD);
    stroke(r,side*5,-7,side*5,-9,'#8d7c84');
    stroke(r,side*6,-10,side*6,-12,'#8d7c84');
  }
  for(const [x,y,color] of [[-8,-11,TEAL],[8,-11,GOLD]]) {
    if(profile&&x<0)continue;
    stroke(r,x,y,x,y+3,LEATHER);r(x-1,y+3,3,3,LEATHER);r(x,y+4,1,1,color);
  }
  if(!rear)r(-2,-6,1,1,GOLD);
}

export function paintKeeperItem(c,id) {
  if(!KEEPER_GEAR.includes(id))return false;
  const r=gearPixels(c,{x:0,y:0});
  if(id==='keeper_crown') {
    crown((x,y,w,h,color)=>r(x+12,y+22,w,h,color));
  } else if(id==='keeper_robes') {
    // A wrapped high collar above a long, divided garment, not a safari jacket.
    r(7,2,10,3,LEATHER);r(6,5,12,3,TEAL);r(7,5,10,1,LIGHT);r(6,7,12,1,RED);
    for(let y=8;y<22;y++) {
      const edge=Math.max(2,6-Math.floor((y-8)/3));
      r(edge,y,24-edge*2,1,LEATHER);r(edge+1,y,22-edge*2,1,TEAL);
      r(edge+1,y,1,1,LIGHT);r(20-edge,y,2,1,DARK);
    }
    r(11,9,2,13,DARK);r(3,20,3,2,RED);r(18,20,3,2,RED);
    tag(r,5,14);tag(r,17,14);r(9,8,1,6,GOLD);r(14,8,1,6,GOLD);
    for(const x of [8,11,14])r(x,6,1,1,PAPER);
  } else if(id==='keeper_sash') {
    r(4,3,16,5,LEATHER);r(4,3,16,1,RED);r(12,4,3,3,GOLD);
    for(const x of [5,14]){r(x,8,5,14,DARK);r(x,8,2,14,TEAL);r(x,13,5,3,LEATHER);r(x,13,5,1,RED);tag(r,x+1,9,5);}
  } else if(id==='keeper_staff') {
    stroke(r,16,21,9,3,WOOD,3);stroke(r,16,21,9,3,'#857380');
    stroke(r,10,9,17,5,WOOD,2);stroke(r,17,5,18,2,WOOD);
    stroke(r,8,10,4,8,WOOD,2);r(8,1,4,4,LEATHER);r(9,2,2,2,GOLD);
    for(const [x,y,color]of [[5,10,PAPER],[8,13,'#82d4df'],[4,16,'#b99adb']]){stroke(r,x,y,x,y+3,LEATHER);r(x-1,y+3,3,2,color);}
  } else if(id==='keeper_blade') {
    r(11,2,3,19,LEATHER);r(11,10,3,11,'#a5e4ed');r(11,10,1,10,'#edfcf8');r(13,11,1,10,'#61b2c2');
    stroke(r,6,8,18,8,WOOD,2);r(11,2,3,3,GOLD);r(12,3,1,1,'#40cbe6');r(12,6,1,3,RED);
  } else if(id==='keeper_band') {
    // A visible chain and hanging gemstone pendant, not a finger-sized band.
    stroke(r,4,2,8,9,LEATHER,2);stroke(r,19,2,15,9,LEATHER,2);
    stroke(r,5,2,9,9,GOLD);stroke(r,18,2,14,9,GOLD);
    r(10,8,4,3,WOOD);r(11,8,2,2,GOLD);
    for(let y=11;y<22;y++){
      const edge=Math.abs(y-16);r(7+Math.floor(edge*.6),y,10-Math.floor(edge*.6)*2,1,WOOD);
      if(y>12&&y<20)r(9,y,6,1,'#40cbe6');
    }
    r(10,13,3,5,'#b5f5fa');r(10,13,1,2,'#efffff');r(12,18,2,2,'#2296ae');
  }
  return true;
}

export function keeperHeadgear(c,id,anchor,d) {
  if(id!=='keeper_crown')return false;
  const r=gearPixels(c,anchor),profile=d===2||d===6;
  crown(profile?(x,y,w,h,color)=>r(Math.round(x*.55),y,w,h,color):r,profile,d>=3&&d<=5);
  return true;
}

// Details render inside existing joint layers and respect wearable overrides.
export function keeperGearDetails(c,id,p,d,dye=null) {
  if(!KEEPER_GEAR.includes(id))return;
  const anchor=p.anchor||p.chest,r=gearPixels(c,anchor);
  const rear=d>=3&&d<=5,profile=d===2||d===6;
  if(id==='keeper_robes') {
    const bottom=p.pelvis,steps=Math.max(1,Math.ceil(Math.hypot(bottom.x-anchor.x,bottom.y-anchor.y)));
    for(let n=0;n<=steps;n++){
      const t=n/steps,rr=gearPixels(c,{x:anchor.x+(bottom.x-anchor.x)*t,y:anchor.y+(bottom.y-anchor.y)*t});
      rr(-3,0,1,1,RED);rr(profile?1:3,0,1,1,RED);
      if(!rear){rr(0,0,1,1,DARK);if(t>.75)rr(-3,0,7,1,LEATHER);}
    }
    r(-4,-2,9,2,dye||TEAL);r(-4,0,9,1,RED);
    for(const x of [-3,0,3])r(x,-1,1,1,PAPER);
    if(!rear){r(-1,2,2,2,GOLD);r(2,3,2,2,GOLD);}
    for(const side of ['L','R']){
      const knee=p['knee'+side]||bottom,foot=p['foot'+side]||knee;
      const end={x:knee.x+(foot.x-knee.x)*.65,y:knee.y+(foot.y-knee.y)*.65},sign=side==='L'?-1:1;
      const count=Math.max(1,Math.ceil(Math.hypot(end.x-bottom.x,end.y-bottom.y)));
      for(let n=0;n<=count;n++){
        const t=n/count,rr=gearPixels(c,{x:bottom.x+(end.x-bottom.x)*t+sign*3,y:bottom.y+(end.y-bottom.y)*t});
        rr(-2,0,5,1,LEATHER);rr(-1,0,3,1,dye||TEAL);rr(sign<0?-2:2,0,1,1,RED);
        if(t>.55&&t<.9){rr(0,0,1,1,n%3===0?INK:PAPER);rr(1,0,1,1,RED);}
      }
    }
  } else if(id==='keeper_sash') {
    const belt=gearPixels(c,p.pelvis||anchor);belt(-4,-2,9,3,LEATHER);belt(-4,-2,9,1,RED);
    if(!rear){belt(profile?0:1,-2,2,3,GOLD);belt(profile?0:1,-1,1,1,LEATHER);}
    for(const x of profile?[0]:[-3,0,3])tag(belt,x,2,5);
  }
}

export function keeperStaff(c,id,hand,tip) {
  if(id!=='keeper_staff')return false;
  const r=gearPixels(c,{x:0,y:0}),dx=tip.x-hand.x,dy=tip.y-hand.y;
  stroke(r,Math.round(hand.x-dx*.3),Math.round(hand.y-dy*.3),Math.round(tip.x),Math.round(tip.y),WOOD,3);
  stroke(r,Math.round(hand.x-dx*.3),Math.round(hand.y-dy*.3),Math.round(tip.x),Math.round(tip.y),'#857380');
  const local=gearPixels(c,tip);local(-2,-3,5,5,LEATHER);local(-1,-2,3,3,GOLD);local(0,-2,1,1,PAPER);
  stroke(local,0,5,5,2,WOOD,2);stroke(local,5,2,6,-2,WOOD);
  stroke(local,0,9,-5,6,WOOD,2);
  for(const [x,y,color]of [[-5,7,PAPER],[-2,10,'#82d4df'],[3,5,'#b99adb']]){stroke(local,x,y,x,y+6,LEATHER);local(x-1,y+6,3,2,color);}
  return true;
}

export function keeperBlade(c,id,hand,tip) {
  if(id!=='keeper_blade')return false;
  const r=gearPixels(c,{x:0,y:0}),dx=tip.x-hand.x,dy=tip.y-hand.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
  const at=(t,across=0)=>[Math.round(hand.x+dx*t-uy*across),Math.round(hand.y+dy*t+ux*across)];
  const line=(a,b,color,w=1)=>stroke(r,...a,...b,color,w);
  line(at(0),at(1),LEATHER,3);line(at(.2),at(1),'#a5e4ed',2);line(at(.2,-1),at(1,-1),'#edfcf8');
  line(at(.13,-4),at(.13,4),WOOD,2);line(at(-.25),at(.12),LEATHER,2);
  const pommel=at(-.28);r(pommel[0]-1,pommel[1]-1,3,3,GOLD);r(pommel[0],pommel[1],1,1,'#40cbe6');
  return true;
}

export function keeperBand(c,id,anchor,d) {
  if(id!=='keeper_band')return false;
  const r=gearPixels(c,anchor),rear=d>=3&&d<=5;
  if(rear){r(-3,0,7,1,LEATHER);return true;}
  const profile=d===2||d===6,center=profile?(d===2?-1:1):0;
  stroke(r,profile?center-1:-3,0,center,4,GOLD);
  if(!profile)stroke(r,3,0,center,4,GOLD);
  r(center-1,4,3,1,WOOD);r(center-2,5,5,4,WOOD);r(center-1,6,3,2,'#40cbe6');r(center-1,6,1,1,'#efffff');r(center,9,1,1,WOOD);
  return true;
}
