const layers = new WeakMap();
const captures = new WeakMap(), editing = new WeakSet();
export function captureLayers(model) { editing.add(model); }
export function releaseLayers(model) { editing.delete(model); }
export function boneSprites(model, direction, bone) { return (captures.get(model)?.[direction] || []).filter(p=>p.bones?.includes(bone)); }
export function renderLayers(model, direction) {
  return layers.get(model)?.[direction] || [];
}
export function paintLayers(queue, model, direction, context, joints) {
  const order = model.renderOrder?.[direction] || [];
  const sorted = queue.map((part,i)=>({...part,id:part.id || `Layer ${i+1}`})).sort((a,b)=>a.depth-b.depth);
  const defaultOrder = sorted.map(p=>p.id);
  const all = [...new Set([...order.filter(id=>defaultOrder.includes(id)), ...defaultOrder])];
  const views=layers.get(model)||{}; views[direction]=all; layers.set(model,views);
  if (order.length) sorted.sort((a,b)=>all.indexOf(a.id)-all.indexOf(b.id));
  const captured=[];
  sorted.forEach(part=>{
    const anchor=joints?.[part.bone];
    const sprite=model.boneSprites?.[part.id]?.[direction];
    const paint=()=>{
      if(sprite && context && anchor) {
        sprite.pixels.forEach((index,i)=>{const color=sprite.palette[index];if(!index || color==='transparent')return;context.fillStyle=color;context.fillRect(Math.round(anchor.x)+sprite.x+i%sprite.width,Math.round(anchor.y)+sprite.y+Math.floor(i/sprite.width),1,1);});
      } else (part.fn || part.draw)();
    };
    if(editing.has(model) && context && anchor) {
      const pixels=new Map(), fill=context.fillRect;
      context.fillRect=function(x,y,w,h){for(let yy=Math.floor(y);yy<y+h;yy++)for(let xx=Math.floor(x);xx<x+w;xx++)pixels.set(xx+','+yy,this.fillStyle);return fill.call(this,x,y,w,h);};
      try {paint();} finally {context.fillRect=fill;}
      const points=[...pixels.keys()].map(k=>k.split(',').map(Number));
      const x=points.length?Math.min(...points.map(p=>p[0])):Math.round(anchor.x)-8, y=points.length?Math.min(...points.map(p=>p[1])):Math.round(anchor.y)-8;
      const width=points.length?Math.max(...points.map(p=>p[0]))-x+1:16,height=points.length?Math.max(...points.map(p=>p[1]))-y+1:16;
      const palette=['transparent',...new Set(pixels.values())];
      captured.push({id:part.id,bone:part.bone,bones:part.bones||[part.bone],sprite:{width,height,x:x-Math.round(anchor.x),y:y-Math.round(anchor.y),palette,pixels:Array.from({length:width*height},(_,i)=>Math.max(0,palette.indexOf(pixels.get((x+i%width)+','+(y+Math.floor(i/width))))))}});
    } else paint();
  });
  if(captured.length){const views=captures.get(model)||{};views[direction]=captured;captures.set(model,views);}
}
