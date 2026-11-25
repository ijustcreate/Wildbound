export const MOONVEIL_CIRCLE=Object.freeze({
 id:'moonveil-circle',name:'Moonveil Circle',kind:'runic-sanctuary',x:12232,y:5192,
 approach:Object.freeze({x:12188,y:5060}),radiusX:110,radiusY:80,
});

const {x,y,radiusX,radiusY}=MOONVEIL_CIRCLE;
export const MOONVEIL_TRAIL=Object.freeze([
 [12237,5013],[12225,5037],[12188,5060],[12178,5092],[12172,5122],[12176,5145],
].map(Object.freeze));
export const MOONVEIL_STONES=Object.freeze([
 [0,-91,64,15],[-111,-24,53,14],[112,-25,58,15],[-68,72,56,15],[69,73,49,13],
].map(([dx,dy,height,halfWidth],index)=>Object.freeze({
 id:MOONVEIL_CIRCLE.id+':stone:'+index,kind:'moonveil_runestone',index,
 x:x+dx,y:y+dy,rootY:y+dy,height,halfWidth,size:height+8,_biome:'forest',procedural:true,
 lightBlocker:false,
})));

export function moonveilCatOutside(px,py,radius=0){
 return ((px-x)/(radiusX-radius))**2+((py-y)/(radiusY-radius))**2>1;
}

export function moonveilSafePoint(px,py){
 return Math.abs(px-x)<265&&Math.abs(py-y)<265&&Math.hypot(px-x,py-y)<265;
}

export function moonveilClearsScenery(prop){
 const dx=prop.x-x,dy=(prop.rootY??prop.y)-y;
 if(Math.abs(dx)>210||Math.abs(dy)>210)return false;
 const extra=prop.kind.includes('tree')?48:prop.kind==='bush'?Math.min(62,(prop.size||64)*.8):18;
 return Math.hypot(dx/(147+extra),dy/(128+extra))<1;
}

export function moonveilStoneBlocked(px,py,radius){
 if(Math.abs(px-x)>145+radius||Math.abs(py-y)>102+radius)return false;
 return MOONVEIL_STONES.some(stone=>{
  const dx=Math.max(0,Math.abs(px-stone.x)-stone.halfWidth);
  const dy=Math.max(0,stone.rootY-10-py,py-stone.rootY);
  return Math.hypot(dx,dy)<radius;
 });
}
