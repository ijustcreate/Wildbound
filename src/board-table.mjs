import {raisedSurfaceBlocked} from './terrain-support.mjs';
import {BOARD_TABLE} from './board-table-geometry.mjs';
import {wildHomesteadBoardTable} from './wild-homestead-layout.mjs';
// Two 32px floor squares wide, one deep; shared by physics and rendering.
export {BOARD_TABLE};
export const hasBoardTable=g=>!!g&&g.generatedEnvironment!=='lobby';
export const boardTableDepth=(b=BOARD_TABLE)=>b.y+b.h/2;
const contains=(b,x,y)=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
const nativeTable=g=>g?.trainTest?wildHomesteadBoardTable(g.trainTest.design):BOARD_TABLE;
// Height decides which side of the tabletop an overlapping actor occupies.
// Do not use projected screen Y: it moves backwards as the actor jumps up.
export function boardActorDepth(g,a,depth=a.y){
 const b=g?.eventTestBoard&&contains(g.eventTestBoard,a.x,a.y)?g.eventTestBoard:nativeTable(g);
 const support=boardTableSupport(g,a.x,a.y);
 if(b&&support>0&&(a.groundHeight||0)+(a.jumpHeight||0)>=support){
  return Math.max(depth,boardTableDepth(b)+.01+(depth-b.y)*.0001);
 }
 return depth;
}
export function boardTableSupport(g,x,y){
 if(!hasBoardTable(g))return 0;
 const b=nativeTable(g);
 return Math.max(b&&contains(b,x,y)?b.surfaceHeight:0,g.eventTestBoard&&contains(g.eventTestBoard,x,y)?g.eventTestBoard.surfaceHeight:0);
}
export function boardTableBlocked(g,x,y,r,elevation,from=null){
 const b=nativeTable(g),t=g?.eventTestBoard;
 return hasBoardTable(g)&&(!!b&&elevation<b.surfaceHeight&&raisedSurfaceBlocked(b,x,y,r,from)||!!t&&elevation<t.surfaceHeight&&raisedSurfaceBlocked(t,x,y,r,from));
}
