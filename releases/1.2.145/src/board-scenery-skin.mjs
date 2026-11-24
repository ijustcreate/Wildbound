// Preserve the calibrated playable foreground while a skin changes its scenery.
import {boardImagePoint} from './board-layout.mjs';
import {drawBoardBackground} from './board-background.mjs';
const clips=new WeakMap();
function foregroundPath(path,trail){
  // Protect the stone centers, not a wide band of the old forest scenery.
  const route=trail.slice(0,48),radius=8;
  for(const [i,b]of route.entries()){
    path.moveTo(b.x+radius,b.y);path.arc(b.x,b.y,radius,0,Math.PI*2);path.closePath();
    if(!i)continue;const a=route[i-1],length=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/length*radius,ny=(b.x-a.x)/length*radius;
    path.moveTo(a.x+nx,a.y+ny);path.lineTo(a.x-nx,a.y-ny);path.lineTo(b.x-nx,b.y-ny);path.lineTo(b.x+nx,b.y+ny);path.closePath();
  }
  // Original well rim and frame are foreground too, including the title.
  for(const [i,p]of [[701,362],[825,362],[929,453],[929,566],[826,658],[701,658],[601,567],[601,453]].entries()){
    const v=boardImagePoint(p);i?path.lineTo(v.x,v.y):path.moveTo(v.x,v.y);
  }path.closePath();
  path.rect(-140,-96,280,13);path.rect(-140,83,280,13);path.rect(-140,-96,15,192);path.rect(125,-96,15,192);
}
export function drawPreservedBoardForeground(c,image,brightness,trail){
  c.save();
  if(typeof Path2D==='function'){
    let path=clips.get(trail);if(!path){path=new Path2D();foregroundPath(path,trail);clips.set(trail,path);}c.clip(path);
  }else{c.beginPath();foregroundPath(c,trail);c.clip();}
  drawBoardBackground(c,image,brightness);c.restore();
}
