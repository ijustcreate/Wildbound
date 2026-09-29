// Two 32px floor squares wide, one deep; shared by physics and rendering.
export const BOARD_TABLE=Object.freeze({x:768,y:784,w:64,h:32,surfaceHeight:16});
export const hasBoardTable=g=>!!g&&g.generatedEnvironment!=='lobby';
export function boardTableSupport(g,x,y){
 const b=BOARD_TABLE;return hasBoardTable(g)&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h?b.surfaceHeight:0;
}
export function boardTableBlocked(g,x,y,r,elevation){
 const b=BOARD_TABLE;return hasBoardTable(g)&&elevation<b.surfaceHeight&&Math.hypot(x-Math.max(b.x,Math.min(x,b.x+b.w)),y-Math.max(b.y,Math.min(y,b.y+b.h)))<r;
}
