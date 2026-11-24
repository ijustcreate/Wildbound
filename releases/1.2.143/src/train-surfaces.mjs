import {trainInterior} from './train-interior.mjs';

export const TRAIN_TABLE_HEIGHT=14;
export const TRAIN_SEAT_HEIGHT=8;
export function trainSeatBack(o){const a=(o.facing??0)*Math.PI/2,dx=Math.round(Math.cos(a)),dy=Math.round(Math.sin(a));return {x:o.x-dx*o.w*.38,y:o.y-dy*o.h*.38,w:Math.abs(dx)>.5?5:o.w,h:Math.abs(dy)>.5?5:o.h};}
const overlaps=(o,x,y,r=0)=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(y-o.y)<o.h/2+r;
export function trainFurnitureBlocks(o,x,y,height=0,r=7){
 if(o.kind==='lamp')return false;
 if(o.kind==='table')return height<TRAIN_TABLE_HEIGHT-.01&&overlaps(o,x,y,r);
 if(o.kind==='seat')return height<TRAIN_SEAT_HEIGHT-.01&&overlaps(o,x,y,r)||height<19-.01&&overlaps(trainSeatBack(o),x,y,r);
 return overlaps(o,x,y,r);
}
export function trainSupportHeight(g,a){
 const ride=a.trainRide;if(!ride||ride.seat||ride.driving||ride.gangway)return 0;
 const car=g.trainTest.design.cars[ride.car];if(!car)return 0;
 let support=0;
 // A small sole footprint can still contact the lip of a narrow tabletop.
 for(const o of trainInterior(g.trainTest.design,car))if(overlaps(o,ride.x,ride.y,3)){
  if(o.kind==='table')support=Math.max(support,TRAIN_TABLE_HEIGHT);
  if(o.kind==='seat')support=Math.max(support,overlaps(trainSeatBack(o),ride.x,ride.y,3)?19:TRAIN_SEAT_HEIGHT);
 }
 return support;
}
