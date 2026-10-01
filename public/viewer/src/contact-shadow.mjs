import {supportHeight} from './jumping.mjs';
export function actorContact(game,actor,size,rigged=true){
 const height=Math.max(0,(actor.groundHeight||0)+(actor.jumpHeight||0));
 const candidate=supportHeight(game,actor,rigged?1:14);
 const surface=actor.groundHeight>0?actor.groundHeight:candidate<=height?candidate:0;
 const separation=Math.max(0,height-surface),spread=Math.min(1,separation/60);
 return {x:actor.x,y:actor.y-surface+(rigged?1:14),surface,separation,
   rx:size*(.25+spread*.09),ry:size*(.105+spread*.055),alpha:.42-spread*.22};
}
