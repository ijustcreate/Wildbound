import {ellipse,limb} from './player-motion.mjs';
import {pixelPolygon} from './pixel-shapes.mjs';

const skin={ink:'#313b2a',shade:'#52613a',base:'#738653',light:'#a3b378',ear:'#847653',earShade:'#625743',crease:'#44513a'};
const outfits={
 banker:{ink:'#282b36',shade:'#383d51',cloth:'#50586d',light:'#748096',linen:'#d6c4a1',accent:'#855449',metal:'#bca46a',pants:'#424956',boots:'#393334'},
 bartender:{ink:'#39342e',shade:'#675146',cloth:'#936e52',light:'#bfa57a',linen:'#bcac80',accent:'#86714b',metal:'#b89a57',pants:'#555345',boots:'#4c4036'},
};
export const goblinOutfit=role=>outfits[role]||outfits.banker;
const poly=(c,color,points)=>pixelPolygon(c,points.map(([x,y])=>({x,y})),color);
const rect=(c,color,x,y,w,h=1)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};

function ear(c,x,y,side){
 c.save();c.translate(x,y);c.scale(side,1);
 poly(c,skin.ink,[[0,1],[3,-3],[9,-6],[10,-5],[8,-1],[6,2],[3,3],[0,4]]);
 poly(c,skin.base,[[1,1],[4,-2],[9,-5],[7,-1],[5,1],[2,3]]);
 poly(c,skin.ear,[[3,0],[8,-3],[6,0],[4,2],[2,2]]);
 rect(c,skin.earShade,2,1,3,1);rect(c,skin.light,6,-3,2,1);
 c.restore();
}

export function drawGoblinHead(c,h,d,role){
 const rear=d>=3&&d<=5,front=d===0,back=d===4,profile=d===2||d===6,banker=role!=='bartender';
 c.save();c.translate(Math.round(h.x),Math.round(h.y));
 if(d>4)c.scale(-1,1);
 // The ears root in the temples, behind the near cheek as the head turns.
 if(front||back){ear(c,-5,-2,-1);ear(c,5,-2,1);}
 else{if(!profile)ear(c,-4,-2,-1);ear(c,4,-2,1);}
 const left=profile?-5:-6,right=profile?5:6;
 poly(c,skin.ink,[[left,-4],[-4,-7],[0,-8],[4,-7],[right,-4],[right,2],[4,5],[1,7],[-3,6],[left,3]]);
 poly(c,skin.base,[[left+1,-4],[-3,-6],[0,-7],[4,-6],[right-1,-3],[right-1,2],[3,5],[0,6],[-3,5],[left+1,2]]);
 poly(c,skin.shade,[[-2,3],[2,3],[5,1],[5,3],[2,6],[-1,6],[-4,4]]);
 if(rear){
  poly(c,skin.shade,[[-5,-3],[-4,-5],[1,-7],[4,-5],[5,-2],[4,2],[1,5],[-2,4],[-4,2]]);
  rect(c,skin.base,-3,-5,6,2);rect(c,skin.crease,-2,3,5,1);
 }else{
  rect(c,skin.light,-4,-5,5,2);rect(c,skin.light,-4,-2,2,1);
  if(front){
   rect(c,skin.crease,-4,-2,3);rect(c,skin.crease,1,-2,3);
   rect(c,'#ddd5b0',-4,-1,3);rect(c,'#ddd5b0',1,-1,3);
   rect(c,skin.ink,-3,-1,1);rect(c,skin.ink,2,-1,1);
   poly(c,skin.shade,[[-1,-1],[1,-1],[2,2],[0,3],[-2,2]]);rect(c,skin.light,-1,0,2,2);
   rect(c,skin.crease,-2,4,4);rect(c,skin.light,-1,5,2);
  }else{
   rect(c,skin.crease,-4,-2,4);rect(c,'#ddd5b0',-4,-1,3);rect(c,skin.ink,-4,-1,1);
   if(!profile){rect(c,skin.crease,2,-2,2);rect(c,'#c7c298',2,-1,1);}
   poly(c,skin.ink,[[-4,-1],[-6,0],[-8,2],[-7,3],[-3,3],[-2,1]]);
   poly(c,skin.light,[[-4,0],[-5,0],[-7,2],[-4,2],[-3,1]]);
   rect(c,skin.crease,-4,4,3);rect(c,skin.light,-3,5,2);
  }
 }
 if(banker){
  const hair=rear?'#777b67':'#a6a591',dark='#505744';
  poly(c,dark,[[-5,-4],[-4,-6],[-1,-8],[2,-8],[5,-6],[6,-4],[3,-3],[3,-6],[0,-5],[-3,-4]]);
  rect(c,hair,-3,-6,4);rect(c,hair,1,-7,2);
  if(!rear){rect(c,'#b8a77e',front?-4:-5,1,front?3:2);if(front)rect(c,'#b8a77e',2,1,3);}
 }else{
  rect(c,skin.light,-2,-6,4);rect(c,skin.shade,4,-5,1,2);
  if(!front&&!back){rect(c,'#574730',7,-1,2,3);rect(c,'#c39053',7,0,1,2);}
  if(!rear&&front){rect(c,skin.earShade,-3,5,1);rect(c,skin.earShade,2,5,1);}
 }
 c.restore();
}

export function drawGoblinTorso(c,p,d,role,cloth,width=1){
 const front=d===0||d===1||d===7,back=d>=3&&d<=5,profile=d===2||d===6;
 const x=p.chest.x,y=p.chest.y,px=p.pelvis.x,py=p.pelvis.y;
 const breadth=(profile?4.2:front?6:5.4)*width,waist=(profile?3.2:4.6)*width;
 limb(c,p.neck,p.chest,3.5,skin.shade);
 limb(c,p.neck,p.chest,2,skin.base);
 poly(c,cloth.ink,[[x-breadth,y-1],[x-2,y-3],[x+2,y-3],[x+breadth,y-1],[px+waist,py],[px-waist,py]]);
 poly(c,cloth.cloth,[[x-breadth+1,y-1],[x-2,y-2],[x+2,y-2],[x+breadth-1,y],[px+waist-1,py-1],[px-waist+1,py-1]]);
 poly(c,cloth.shade,[[x+breadth-2,y],[x+breadth-1,y+1],[px+waist-1,py-1],[px+1,py-1]]);
 if(role==='bartender'){
  if(back){
   limb(c,{x:x-3,y},{x:px+2,y:py-2},1,cloth.linen);
   limb(c,{x:x+3,y},{x:px-2,y:py-2},1,cloth.linen);
  }else{
   const bias=d===0?0:d<4?-1:1;
   poly(c,cloth.linen,[[x+bias-2,y],[x+bias+2,y],[px+waist-1,py+2],[px-waist+1,py+2]]);
   limb(c,{x:x+bias-2,y:y+1},{x:px-waist+2,y:py+1},1,cloth.accent);
   rect(c,cloth.accent,px+bias-1,py-3,2,2);rect(c,'#d4bd91',px+bias-1,py-3,2);
  }
  limb(c,{x:px-waist,y:py-1},{x:px+waist,y:py-1},1,cloth.shade);
 }else if(!back){
  const bias=d===0?0:d<4?-1:1;
  poly(c,cloth.linen,[[x+bias-3,y-2],[x+bias+2,y-2],[x+bias,y+4]]);
  rect(c,cloth.accent,x+bias,y-1,1,3);
  limb(c,{x:x+bias,y:y+3},{x:px+bias,y:py-1},1,cloth.ink);
  rect(c,cloth.metal,px+bias+1,py-3,1);rect(c,cloth.metal,px+bias+1,py-1,1);
 }else limb(c,{x,y},{x:px,y:py-2},1,cloth.light);
}

export function drawGoblinArm(c,shoulder,elbow,hand,role,cloth){
 const cuff={x:elbow.x+(hand.x-elbow.x)*.37,y:elbow.y+(hand.y-elbow.y)*.37};
 limb(c,shoulder,elbow,5,cloth.ink);limb(c,shoulder,elbow,3.4,cloth.cloth);
 limb(c,elbow,hand,4.2,skin.ink);limb(c,elbow,hand,2.7,skin.base);
 limb(c,elbow,cuff,3.4,role==='bartender'?cloth.linen:cloth.cloth);
}

export function drawGoblinHand(c,hand,side,d){
 const thumb=side==='L'?1:-1;
 ellipse(c,hand.x,hand.y+1,2.9,3.2,skin.ink);
 ellipse(c,hand.x-.25,hand.y+.8,2.2,2.6,skin.base);
 rect(c,skin.light,hand.x-1,hand.y-1,2,2);
 rect(c,skin.shade,hand.x-.5,hand.y+2,2);
 if(d<=2||d>=6){rect(c,skin.base,hand.x+thumb*2,hand.y,1,2);rect(c,skin.crease,hand.x+thumb,hand.y+2,1);}
}
