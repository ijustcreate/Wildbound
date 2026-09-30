// Two 32px floor squares wide, one deep; shared by physics and rendering.
export const BOARD_TABLE=Object.freeze({x:768,y:784,w:64,h:32,surfaceHeight:16});
export const hasBoardTable=g=>!!g&&g.generatedEnvironment!=='lobby';
export const boardTableDepth=()=>BOARD_TABLE.y+BOARD_TABLE.h/2;
// Height decides which side of the tabletop an overlapping actor occupies.
// Do not use projected screen Y: it moves backwards as the actor jumps up.
export function boardActorDepth(g,a,depth=a.y){
 const support=boardTableSupport(g,a.x,a.y);
 if(support>0&&(a.groundHeight||0)+(a.jumpHeight||0)>=support){
  return Math.max(depth,boardTableDepth()+.01+(depth-BOARD_TABLE.y)*.0001);
 }
 return depth;
}
export function boardTableSupport(g,x,y){
 const b=BOARD_TABLE;return hasBoardTable(g)&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h?b.surfaceHeight:0;
}
export function boardTableBlocked(g,x,y,r,elevation){
 const b=BOARD_TABLE;return hasBoardTable(g)&&elevation<b.surfaceHeight&&Math.hypot(x-Math.max(b.x,Math.min(x,b.x+b.w)),y-Math.max(b.y,Math.min(y,b.y+b.h)))<r;
}
