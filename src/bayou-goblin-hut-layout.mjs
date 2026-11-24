import {raisedSurfaceBlocked} from './terrain-support.mjs';

export const BAYOU_GOBLIN_HUT=Object.freeze({x:13194,y:2094,w:152,h:104,cx:13270,front:2198,doorHalf:25});
const {x,y,w,h,cx,front,doorHalf}=BAYOU_GOBLIN_HUT;
export const BAYOU_GOBLIN_HUT_WALLS=Object.freeze([
 {x,y,w,h:12},
 {x,y:y+12,w:10,h:h-12},
 {x:x+w-10,y:y+12,w:10,h:h-12},
 {x:x+10,y:front-13,w:cx-doorHalf-x-10,h:13},
 {x:cx+doorHalf,y:front-13,w:x+w-10-cx-doorHalf,h:13},
]);
export const BAYOU_GOBLIN_HUT_BENCH=Object.freeze({x:x+19,y:y+27,w:24,h:56});
export const isBayouHutSurface=d=>d?.wildLands&&!d.activeRoom;
export function inBayouGoblinHut(px,py,pad=0){
 return px>x-pad&&px<x+w+pad&&py>y-pad&&py<front+pad;
}
export function bayouGoblinHutBlocked(d,px,py,r,elevation,from,projectile,flying){
 if(!isBayouHutSurface(d)||!inBayouGoblinHut(px,py,r+1))return false;
 if(elevation<74&&BAYOU_GOBLIN_HUT_WALLS.some(b=>raisedSurfaceBlocked(b,px,py,r,from)))return true;
 return !flying&&elevation<18&&raisedSurfaceBlocked(BAYOU_GOBLIN_HUT_BENCH,px,py,r,from)&&(projectile||!from?.broomMount);
}
