const layers = new WeakMap();
const captures = new WeakMap(), editing = new WeakSet();
export function captureLayers(model) { editing.add(model); }
export function releaseLayers(model) { editing.delete(model); }
export function capturedLayers(model,direction) { return captures.get(model)?.[direction] || []; }
export function boneSprites(model, direction, bone) { return (captures.get(model)?.[direction] || []).filter(p=>p.bones?.includes(bone)); }
export function renderLayers(model, direction) {
  return layers.get(model)?.[direction] || [];
}
function inferredBones(id, joints) {
  const name = String(id || "").toLowerCase();
  const has = (...names) => names.filter((n) => joints?.[n]);
  const left = /\b(?:l|left)\b/.test(name), right = /\b(?:r|right)\b/.test(name);
  if (name.includes("tail")) return has("tailTip", "tailMid", "tailBase", "pelvis");
  if (name.includes("wing")) return has("wingTipL", "wingTipR", "wingRootL", "wingRootR", "chest");
  if (name.includes("front") || name.includes("shoulder")) {
    return left && !right ? has("frontPawL", "elbowL", "shoulderL") : has("frontPawR", "elbowR", "shoulderR");
  }
  if (name.includes("rear") || name.includes("hip") || name.includes("foot")) {
    return left && !right ? has("rearPawL", "hockL", "kneeL", "hipL") : has("rearPawR", "hockR", "kneeR", "hipR");
  }
  if (name.includes("hand") || name.includes("arm") || name.includes("bow")) return has("handL", "handR", "wristL", "wristR", "chest");
  if (name.includes("head") || name.includes("face") || name.includes("mane")) return has("head", "neck");
  if (name.includes("body") || name.includes("pelvis") || name.includes("chest")) return has("pelvis", "chest", "neck");
  return Object.keys(joints || {}).slice(0, 1);
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
    const bones = part.bones?.length ? part.bones : inferredBones(part.id, joints);
    const bone = part.bone || bones[0];
    const anchor=joints?.[bone];
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
      captured.push({id:part.id,bone,bones,sprite:{width,height,x:x-Math.round(anchor.x),y:y-Math.round(anchor.y),palette,pixels:Array.from({length:width*height},(_,i)=>Math.max(0,palette.indexOf(pixels.get((x+i%width)+','+(y+Math.floor(i/width))))))}});
    } else paint();
  });
  if(captured.length){const views=captures.get(model)||{};views[direction]=captured;captures.set(model,views);}
}
