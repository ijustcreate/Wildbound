import {gearPalette} from './gear-art.mjs';
import {detailedTorso} from './humanoid-hd.mjs';

// Skin the torso in its own frame so a bent or fallen body keeps its volume.
export function drawHeroTorso(c,p,d,color,skin,back){
  if(detailedTorso(c,p,d,color,skin,back))return;
  const top=p.chest,bottom=p.pelvis,dx=bottom.x-top.x,dy=bottom.y-top.y;
  const length=Math.max(3,Math.hypot(dx,dy));
  const width=d===2||d===6?5:d%2?5.8:6.4,mat=gearPalette(null,color);
  withPixelRotation(c,top,-Math.atan2(dx,dy),()=>{
  for(let y=-2;y<=Math.ceil(length)+1;y++){
    const t=Math.max(0,Math.min(1,y/length));
    const half=y<0?width-1.5:width-(width-3.5)*t;
    for(let x=Math.ceil(-half);x<=Math.floor(half);x++){
      let shade=x===Math.ceil(-half)||x===Math.floor(half)||y===Math.ceil(length)+1?mat.ink:
        x>half-2?mat.dark:x<-half+2?mat.light:mat.base;
      if(!back&&Math.abs(x)<=1&&y<length-2)shade=y<2?skin:y<length*.55?'#d1bd88':mat.dark;
      if(!back&&Math.abs(x)>=3&&Math.abs(x)<=4&&y>=3&&y<=5)shade=y===3?mat.trim:mat.dark;
      if(!back&&y===0&&Math.abs(x)>=2&&Math.abs(x)<=4)shade=mat.light;
      // A one-pixel neckline separates exposed skin from the tunic in every facing.
      const collarHalf=d===2||d===6?1:2;
      if(back&&y===-1&&Math.abs(x)<=collarHalf)shade=mat.ink;
      if(!back&&((y>=-1&&y<=0&&Math.abs(x)===collarHalf)||(y===1&&Math.abs(x)<collarHalf)))shade=mat.ink;
      if(y>=length-1&&Math.abs(x)<half-1)shade=!back&&Math.abs(x)<1?mat.trim:mat.leather;
      c.fillStyle=shade;c.fillRect(Math.round(top.x+x),Math.round(top.y+y),1,1);
    }
  }
  });
}

// Rotate completed pixel coverage, rather than antialiasing every tiny rectangle.
export function withPixelRotation(c,anchor,angle,paint){
  if(Math.abs(angle)<.035)return paint();
  if(c.__humanoidDetail&&c.drawImage){
    c.save();c.translate(anchor.x,anchor.y);c.rotate(angle);c.translate(-anchor.x,-anchor.y);
    try{return paint();}finally{c.restore();}
  }
  const original=c.fillRect,pixels=new Map();
  c.fillRect=function(x,y,w,h){
    for(let yy=Math.round(y);yy<y+h;yy++)for(let xx=Math.round(x);xx<x+w;xx++)pixels.set(`${xx},${yy}`,this.fillStyle);
  };
  try{paint();}finally{c.fillRect=original;}
  if(!pixels.size)return;
  const cos=Math.cos(angle),sin=Math.sin(angle),points=[...pixels.keys()].map(k=>k.split(',').map(Number));
  const rotated=points.map(([x,y])=>[anchor.x+(x-anchor.x)*cos-(y-anchor.y)*sin,anchor.y+(x-anchor.x)*sin+(y-anchor.y)*cos]);
  const x0=Math.floor(Math.min(...rotated.map(p=>p[0])))-1,x1=Math.ceil(Math.max(...rotated.map(p=>p[0])))+1;
  const y0=Math.floor(Math.min(...rotated.map(p=>p[1])))-1,y1=Math.ceil(Math.max(...rotated.map(p=>p[1])))+1;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const dx=x-anchor.x,dy=y-anchor.y;
    const color=pixels.get(`${Math.round(anchor.x+dx*cos+dy*sin)},${Math.round(anchor.y-dx*sin+dy*cos)}`);
    if(color){c.fillStyle=color;original.call(c,x,y,1,1);}
  }
}

export function unrotateFace(points,angle){
  const h=points.head,cos=Math.cos(angle),sin=Math.sin(angle),out={...points};
  for(const name of ['eyeL','eyeR','earL','earR','nose','mouth']){
    const q=points[name],dx=q.x-h.x,dy=q.y-h.y;
    out[name]={...q,x:h.x+dx*cos+dy*sin,y:h.y-dx*sin+dy*cos};
  }
  return out;
}
