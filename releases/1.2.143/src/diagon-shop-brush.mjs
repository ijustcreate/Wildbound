import {pixelLine, pixelPolygon} from './pixel-shapes.mjs';

export function block(c,x,y,w,h,color) {
  c.fillStyle=color;
  c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
}

export function shape(c,color,points) {
  pixelPolygon(c,points.map(([x,y])=>({x,y})),color);
}

export function line(c,color,x1,y1,x2,y2,width=1) {
  pixelLine(c,{x:x1,y:y1},{x:x2,y:y2},color,width);
}

export function casework(c,x,y,w,h,topDepth,ramp) {
  const [edge,shadow,body,lit,shine]=ramp;
  const top=y-h;
  shape(c,edge,[[x+4,top],[x+w-4,top],[x+w,top+topDepth],[x+w,y-3],
    [x+w-3,y],[x+3,y],[x,y-3],[x,top+topDepth]]);
  block(c,x+2,top+topDepth,w-4,h-topDepth-2,body);
  block(c,x+w-7,top+topDepth,5,h-topDepth-2,shadow);
  shape(c,lit,[[x+5,top+1],[x+w-5,top+1],[x+w-2,top+topDepth-1],[x+2,top+topDepth-1]]);
  block(c,x+6,top+2,w-13,1,shine);
  block(c,x+2,top+topDepth,w-4,2,shadow);
}
