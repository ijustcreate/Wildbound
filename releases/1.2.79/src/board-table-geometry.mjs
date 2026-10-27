// Data-only shared geometry: world generation must not initialize through
// terrain-support -> environment rendering -> world generation again.
export const BOARD_TABLE=Object.freeze({x:768,y:784,w:64,h:32,surfaceHeight:16});

export function boardTableLegs(b=BOARD_TABLE){
 const h=Math.max(1,b.surfaceHeight-3),legs=[];
 for(const x of [b.x+5.5,b.x+b.w-5.5])for(const y of [b.y+3,b.y+b.h-1])legs.push({x,y,rx:2.5,ry:2,minZ:0,maxZ:h,shape:'box'});
 return legs;
}
export function boardLightVolumes(b=BOARD_TABLE){
 const owner=`board:${b.x}:${b.y}`;
 return [{owner,x:b.x+b.w/2,y:b.y+b.h/2,rx:b.w/2,ry:b.h/2,minZ:b.surfaceHeight-3,maxZ:b.surfaceHeight,shape:'box',opacity:1},
  ...boardTableLegs(b).map(leg=>({...leg,owner,opacity:1}))];
}
