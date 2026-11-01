import {supportHeight} from './jumping.mjs';
export function actorContact(game,actor,size,rigged=true){
 if(actor.kind==='bee_hive'){const hanging=actor.hp>0&&(actor.hiveLift||0)>0;return {x:actor.x,y:actor.y+1,surface:0,separation:hanging?actor.hiveLift:0,rx:size*(hanging?.42:.35),ry:size*(hanging?.13:.105),alpha:hanging?.25:.44};}
 if(['bee','tsetse'].includes(actor.kind))return {x:actor.x,y:actor.y+1,surface:0,separation:actor.kind==='tsetse'?16:8,rx:size*.26,ry:size*.1,alpha:.24};
 const height=Math.max(0,(actor.groundHeight||0)+(actor.jumpHeight||0));
 const candidate=supportHeight(game,actor,rigged?1:14);
 const surface=actor.groundHeight>0?actor.groundHeight:candidate<=height?candidate:0;
 const flight=actor.hp>0?(actor.kind==='imp'?(actor.impFlightHeight??20):actor.kind==='succubus'?(actor.succubusFlightHeight||0):0):0;
 const separation=Math.max(0,height-surface)+flight,spread=Math.min(1,separation/60);
 if(actor.kind==='imp')size*=.7;
 return {x:actor.x,y:actor.y-surface+(rigged?1:14),surface,separation,
   rx:size*(.25+spread*.09),ry:size*(.105+spread*.055),alpha:.42-spread*.22};
}
