// Approved compact hero faces and hair, fitted to the existing editable rig.
import {hairDrawing,NATIVE_HAIR_REVISION} from './hero-hair-native.mjs';

const mix=(a,b,t)=>'#'+a.slice(1).match(/../g).map((v,i)=>Math.round(parseInt(v,16)*(1-t)+parseInt(b.slice(1+i*2,3+i*2),16)*t).toString(16).padStart(2,'0')).join('');
const ink='#352b2a';
const rasters=new Map();
export const nativeHeroArtStatus=()=>({revision:NATIVE_HAIR_REVISION,rasters:rasters.size,limit:384});
function pen(c,h,key){
 let tile=rasters.get(key),cached=!!tile;
 if(!tile){tile=document.createElement('canvas');tile.width=64;tile.height=64;}
 const p=tile.getContext('2d');
 const r=(x,y,w,height,color)=>{if(cached)return;p.fillStyle=color;p.fillRect(Math.round((x+16)*2),Math.round((y+16)*2),Math.max(1,Math.round(w*2)),Math.max(1,Math.round(height*2)));};
 r.cached=cached;
 r.flush=()=>{if(!cached){if(rasters.size>=384)rasters.delete(rasters.keys().next().value);rasters.set(key,tile);}c.save();c.imageSmoothingEnabled=false;c.drawImage(tile,h.x-16,h.y-16,32,32);c.restore();return true;};
 return r;
}

export function drawNativeHead(c,p,d,skin,look,visible,front,parts='all'){
 const handles=['eyeL','eyeR','earL','earR','nose','mouth'].map(n=>[visible(n),Math.round((p[n].x-p.head.x)*2),Math.round((p[n].y-p.head.y)*2)]);
 const r=pen(c,p.head,JSON.stringify(['head',NATIVE_HAIR_REVISION,d,skin,look.face,look.eyeColor,look.hairColor,look.hair,look.eyesClosed,look.laughing,front,parts,handles])),profile=d===2||d===6,back=d>=3&&d<=5,turn=d<4?-1:1;
 if(r.cached)return r.flush();
 const shadow=mix(skin,'#83504b',.30),light=mix(skin,'#fff0d0',.20),blush=mix(skin,'#d87d78',.26);
 if(!front){
  // Deliberate half-pixel steps: full cheeks and a short rounded chin.
  const widths=[3,4,4.5,5,5,5,5,5,5,5,5,4.5,4.5,4,3.5,2.5,1.5];
  widths.forEach((half,i)=>{
   const w=half*(profile?.86:1),y=-4.5+i*.5;
   r(-w,y,w*2,.5,ink);r(-w+.5,y,Math.max(.5,w*2-1),.5,skin);
   if(i>2&&i<10){r(-w+.5,y,1,.5,light);r(w-1,y,.5,.5,shadow);}
  });
  return r.flush();
 }
 for(const [name,side]of [['earL',-1],['earR',1]])if(parts!=='face'&&visible(name)){
  const angle=d*Math.PI/4,q=p[name],dx=q.x-p.head.x-side*4*Math.cos(angle),dy=q.y-p.head.y-side*2*Math.sin(angle);
  const x=[side*4.5,3.5,1.5,-4,-side*4.5,4,-1.5,-3.5][d]+dx;
  const covered=['bob','long','curls','waves','afro','locs','shag'].includes(look.hair);
  if(back&&covered&&look.face!=='elf')continue;
  if(look.face==='elf'){
   const sign=x<0?-1:1;
   for(let i=0;i<4;i++){r(x+sign*i*.5,dy-i*.5,.5,2-i*.5,shadow);r(x+sign*i*.5,dy-i*.5,.5,Math.max(.5,1.5-i*.5),skin);}
  }else{r(x-.5,dy+(covered?.5:-.5),1,covered?1:1.5,shadow);r(x-.5,dy+(covered?.5:-.5),.5,1,skin);}
 }
 if(back||parts==='ears')return r.flush();
 for(const name of ['eyeL','eyeR'])if(visible(name)){
  const q=p[name],far=(d===1&&name==='eyeL')||(d===7&&name==='eyeR');
  const diagonal=d===1||d===7;
  const x=q.x-p.head.x,y=q.y-p.head.y-1+(diagonal?(far?.5:-.75):profile?-1:0),w=far?1.5:2.5;
  if(look.eyesClosed){r(x-w/2,y,w,.5,ink);continue;}
  r(x-w/2,y-1,w,.5,ink);r(x-w/2,y-.5,w,2,'#fff1d9');
  r(x+(profile?turn*.25:0)-.5,y-.5,1,1.5,look.eyeColor||'#506c59');
  r(x+(profile?turn*.25:0)-.25,y,.5,1,ink);
  r(x-.5,y-.5,.5,.5,'#fff7e4');
  r(x-w/2,y+1.5,w,.5,blush);
 }
 if(visible('nose')){const q=p.nose;r(q.x-p.head.x-.25,q.y-p.head.y+.5,.5,.5,shadow);}
 if(visible('mouth')){const q=p.mouth;if(look.laughing){r(q.x-p.head.x-1,2,profile?1:2,1.5,ink);r(q.x-p.head.x-.5,3,1,.5,'#b47b74');}else r(q.x-p.head.x-.5,Math.min(2.5,q.y-p.head.y),profile?.5:1,.5,'#925c55');}
 const cheek=profile?[turn*2.5]:[-2.5,2.5];
 if(look.face==='freckles')for(const x of cheek){r(x-.5,1,.5,.5,shadow);r(x+.5,1.5,.5,.5,shadow);}
 if(look.face==='scar'){r(profile?turn*2:2,-.5,.5,1.5,mix(skin,'#9c5455',.5));r(profile?turn*2.5:2.5,1,.5,1,light);}
 if(look.face==='warpaint')for(const x of cheek)r(x-.5,1.5,1.5,.5,'#436880');

 return r.flush();
}

export function drawNativeHair(c,h,look,d,frame=0,action='idle',pass='front'){
 if(!look?.hair||look.hair==='none')return true;
 const drawing=hairDrawing(look.hair,d,frame,action);if(!drawing)return false;
 const sway=['idle','sleep','death'].includes(action)?0:Math.round(Math.sin(frame*.7)*2)/2;
 const r=pen(c,h,JSON.stringify(['hair',NATIVE_HAIR_REVISION,look.hair,look.hairColor,d,pass,sway])),base=look.hairColor||'#593923';
 if(r.cached)return r.flush();
 const colors=[mix(base,'#211e29',.5),mix(base,'#312630',.22),base,mix(base,'#dca773',.33)];
 const back=d>=3&&d<=5;
 const shapes=pass==='rear'?(back?[]:drawing.rear):[...(back?drawing.rear:[]),...drawing.front,...drawing.crown];
 const contains=(points,x,y)=>{let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
 const inside=(x,y)=>shapes.some(points=>contains(points,x,y));
 for(let y=-12;y<15;y+=.5)for(let x=-10;x<10;x+=.5){
  if(!inside(x+.25,y+.25))continue;
  const edge=[[-.5,0],[.5,0],[0,-.5],[0,.5]].some(([dx,dy])=>!inside(x+.25+dx,y+.25+dy));
  // One swept highlight mass and one temple shadow, no strand stripes.
  const crownLight=y>-5.8&&y<-3.6&&x>-3.5&&x<1.5+(y+5)*.8;
  const flow=['bob','long','waves','locs'].includes(look.hair)&&y>-.5&&y<(look.hair==='bob'?3:7)&&x>(back?-3.5:-5)&&x<(back?-1.5:-4);
  const groove=look.hair==='locs'&&back&&y>0&&y<7&&[-2,1,3.5].some(a=>Math.abs(x-a)<.3);
  r(x,y,.5,.5,colors[edge?0:crownLight||flow?3:groove||x>2||y>3?1:2]);
 }
 for(const detail of drawing.details)if(pass==='rear'?!back&&!detail.front:back||detail.front){
  if(detail.type==='tie')r(detail.x-1,detail.y,2,.5,'#bc935c');
  if(detail.type==='braid')for(let n=0;n<3;n++)r(detail.x+(n%2?.0:-.5),detail.y+n*2,1,.5,colors[3]);
 }
 if(look.hair==='topknot'&&pass==='front')r(-1,-6.5,2,.5,'#bc935c');
 return r.flush();
}

