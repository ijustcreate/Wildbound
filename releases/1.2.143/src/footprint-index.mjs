// A short-lived broad phase: callers rebuild after simulation/editor mutations.
// Entries retain native strict rectangle boundaries; large shapes use a bounded
// fallback rather than allocating an unbounded number of grid cells.
export function footprintIndex(props,footprint,padding=0,cellSize=64){
 const cells=new Map(),large=[];let shapes=0;
 for(const p of props){const b=footprint(p);if(!b)continue;const shape={left:b.x-padding,right:b.x+b.w+padding,top:b.y-padding,bottom:b.y+b.h+padding};if(!Number.isFinite(shape.left+shape.right+shape.top+shape.bottom)||shape.right<=shape.left||shape.bottom<=shape.top)continue;shapes++;
  const sx=Math.floor(shape.left/cellSize),ex=Math.floor(shape.right/cellSize),sy=Math.floor(shape.top/cellSize),ey=Math.floor(shape.bottom/cellSize);
  if((ex-sx+1)*(ey-sy+1)>1024){large.push(shape);continue;}
  for(let y=sy;y<=ey;y++)for(let x=sx;x<=ex;x++){const key=x+','+y;let list=cells.get(key);if(!list){list=[];cells.set(key,list);}list.push(shape);}
 }
 const hit=(s,x,y)=>x>s.left&&x<s.right&&y>s.top&&y<s.bottom;
 return {shapes,cells:cells.size,blocked(x,y){return (cells.get(Math.floor(x/cellSize)+','+Math.floor(y/cellSize))||[]).some(s=>hit(s,x,y))||large.some(s=>hit(s,x,y));}};
}
