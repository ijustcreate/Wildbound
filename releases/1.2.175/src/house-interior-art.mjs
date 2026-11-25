import {drawMountedClock,houseClockMount} from './wall-clock.mjs';
import {WALL_SECTION_SIZE} from './structure-destruction.mjs';
import {drawInteriorFace,drawInteriorCutawayEdge,paintInteriorMaterial} from './interior-materials.mjs';

const trim=['#55453b','#8a6c50','#b79b71'];
const templeTrim=['#404d41','#697761','#a0a082'];
const stone=['#424f42','#66725b','#7a876b','#93a180','#b4b08a','#596b56'];
const lim=768*1024;
const faces=new Map();
let facePixels=0;

export function drawTempleWallFinish(c,b){
  paintInteriorMaterial(c,b,'masonry',stone);
  c.fillStyle='#aab38f';
  c.fillRect(b.x+1,b.y+1,Math.max(1,b.w-2),1);
  c.fillStyle='#506452';
  c.fillRect(b.x+1,b.y+b.h-2,Math.max(1,b.w-2),1);
}

const inside=(f,x,y)=>x>=f.x&&x<f.x+f.w&&y>=f.y&&y<f.y+f.h;
const validPlayer=(p,f)=>!p.room&&p.hp>0&&inside(f,p.x,p.y);

function glass(c,w,height,sunken,t){
  const width=Math.max(0,w-8),x=4,y=-height+5,h=height-14;
  if(width<5||h<5)return;
  c.fillStyle=t[0];c.fillRect(x-2,y-1,width+4,h+4);
  c.fillStyle=t[2];c.fillRect(x-1,y,width+2,h+2);
  c.fillStyle=sunken?'#485d52':'#90aaa2';c.fillRect(x+1,y+1,width-2,h);
  c.fillStyle=sunken?'#66766a':'#bdd2bc';c.fillRect(x+2,y+2,Math.max(2,width*.32),h-2);
  c.fillStyle=t[0];c.fillRect(Math.floor(w/2),y+1,2,h);c.fillRect(x,y+Math.floor(h*.57),width,1);
  c.fillStyle=t[1];c.fillRect(x-2,y+h+1,width+4,3);
  c.fillStyle=t[2];c.fillRect(x-1,y+h+1,width+2,1);
}

function paintFace(c,w,height,kind,temple,sunken) {
  const t=temple?templeTrim:trim;
  if(kind==='window'){
    drawInteriorFace(c,{x:0,y:0,w,height,material:temple?'masonry':'plaster',palette:temple?stone:undefined,trim:t});
    glass(c,w,height,sunken,t);
    return;
  }
  drawInteriorFace(c,{x:0,y:0,w,height,material:temple?'masonry':'plaster',palette:temple?stone:undefined,trim:t});
  for(let x=4;x<w-5;x+=72){
    c.fillStyle=t[0];c.fillRect(x,-height+3,4,height-4);
    c.fillStyle=t[1];c.fillRect(x+1,-height+4,2,height-6);
    c.fillStyle=t[2];c.fillRect(x+1,-height+4,1,height-9);
  }
}

function face(c,x,y,w,height,kind,temple,sunken){
  const key=[w,height,kind,temple,sunken].join('/');
  if(typeof document==='undefined'){
    c.save();c.translate(x,y);paintFace(c,w,height,kind,temple,sunken);c.restore();return;
  }
  let surface=faces.get(key);
  if(!surface){
    const width=Math.ceil(w),fullHeight=height+3,pixels=width*fullHeight;
    if(pixels>lim){
      c.save();c.translate(x,y);paintFace(c,w,height,kind,temple,sunken);c.restore();return;
    }
    while(facePixels+pixels>lim&&faces.size){
      const first=faces.keys().next().value,old=faces.get(first);
      facePixels-=old.width*old.height;faces.delete(first);
    }
    surface=document.createElement('canvas');surface.width=width;surface.height=fullHeight;
    const pen=surface.getContext('2d');pen.translate(0,height);
    paintFace(pen,w,height,kind,temple,sunken);
    faces.set(key,surface);facePixels+=pixels;
  }else{
    faces.delete(key);faces.set(key,surface);
  }
  c.drawImage(surface,Math.round(x),Math.round(y-height));
}

function liveSpans(b,horizontal,positive){
  const length=horizontal?b.w:b.h;
  if(!b.sectionDamage)return [[0,length]];
  // Only the cell row bordering the playfield can support this face.
  const n=Math.ceil(length/WALL_SECTION_SIZE),cols=Math.ceil(b.w/WALL_SECTION_SIZE);
  const spans=[];
  for(let i=0;i<n;i++){
    const cell=horizontal?(positive?Math.ceil(b.h/WALL_SECTION_SIZE)-1:0)*cols+i:
      i*cols+(positive?cols-1:0);
    if(b.sectionDamage[cell]?.broken)continue;
    const start=i*WALL_SECTION_SIZE,end=Math.min(length,start+WALL_SECTION_SIZE);
    if(spans.at(-1)?.[1]===start)spans.at(-1)[1]=end;
    else spans.push([start,end]);
  }
  return spans;
}

function roomEdges(b,rooms,horizontal){
  const x=b.x+b.w/2,y=b.y+b.h/2;
  const probes=horizontal?[[x,b.y-2],[x,b.y+b.h+2]]:[[b.x-2,y],[b.x+b.w+2,y]];
  const hits=probes.map(([x,y])=>rooms.some(f=>inside(f,x,y)));
  const onRoom=rooms.some(f=>b.x+b.w>f.x&&b.x<f.x+f.w&&b.y+b.h>f.y&&b.y<f.y+f.h);
  return hits.some(Boolean)||onRoom?hits:null;
}

export function drawHouseInteriorWalls(c,house,players=[],visible=()=>true,{always=false,clockPass='all'}={}){
  if(!house?.floors?.length)return;
  const rooms=always?house.floors:house.floors.filter(f=>players.some(p=>validPlayer(p,f)));
  if(!rooms.length)return;
  const clocks=new Map();
  for(const clock of clockPass==='none'?[]:house.furniture||[]){
    if(clock.kind!=='wall_clock'||clock.destroyed)continue;
    const mount=houseClockMount(house,clock);
    if(!mount)continue;
    if(!clocks.has(mount.wall))clocks.set(mount.wall,[]);
    clocks.get(mount.wall).push({x:mount.x,clock});
  }
  c.save();c.imageSmoothingEnabled=false;
  for(const b of house.walls||[]){
    if(clockPass==='mounted'&&!clocks.has(b))continue;
    if(b.destroyed||b.kind==='fence'||b.w<2||b.h<2)continue;
    if(!visible({x:b.x+b.w/2,y:b.y+b.h/2},Math.max(b.w,b.h)+52))continue;
    const horizontal=b.w>=b.h,edges=roomEdges(b,rooms,horizontal);
    if(!edges)continue;
    const temple=!!house.temple;
    const north=horizontal&&edges[1];
    const spans=liveSpans(b,horizontal,edges[1]);
    for(const [start,end] of spans){
      const length=end-start;
      if(north){
        if(b.kind==='window'&&b.broken&&!b.sectionDamage)continue;
        face(c,b.x+start,b.y+3,length,edges[0]?22:32,b.kind,temple,!!b.broken);
      }else if(horizontal){
        drawInteriorCutawayEdge(c,{x:b.x+start,y:b.y,w:length,h:b.h},{trim:temple?templeTrim:trim,height:5});
      }else{
        const side=edges[1]?'west':'east';
        drawInteriorCutawayEdge(c,{x:b.x,y:b.y+start,w:b.w,h:length},{side,trim:temple?templeTrim:trim,height:5});
      }
    }
    if(north)for(const {x,clock}of clocks.get(b)||[]){
      if(!spans.some(([start,end])=>x>=b.x+start&&x<b.x+end))continue;
      const sharedWall=edges[0],size=Math.min(clock.w,clock.h,sharedWall?14:16);
      drawMountedClock(c,x,b.y+3-(sharedWall?10:17),size);
    }
  }
  c.restore();
}
