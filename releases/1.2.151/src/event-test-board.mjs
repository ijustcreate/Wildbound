import {BOARD_TABLE} from './board-table.mjs';
import {isCharmed} from './succubus-charm.mjs';

export function spawnEventTestBoard(game,ownerId){
 const p=game.players.find(p=>String(p.id)===String(ownerId));
 if(!p)return {ok:false,message:'Reopen the dev menu from your explorer.'};
 if(game.phase!=='play'||game.generatedEnvironment==='lobby'||p.room||p.hp<=0||game.roll)
  return {ok:false,message:'Enter the level with a living explorer and finish any board roll first.'};
 // A replacement starts the list again. Its center stays exactly where summoned.
 const b={...BOARD_TABLE,x:p.x-BOARD_TABLE.w/2,y:p.y-BOARD_TABLE.h/2,nextEvent:0};
 game.eventTestBoard=b;
 game.openingBoard=false;
 for(const actor of game.players)if(!actor.room&&actor.x>=b.x&&actor.x<=b.x+b.w&&actor.y>=b.y&&actor.y<=b.y+b.h){
  if(!(actor.jumpHeight>0))actor.groundHeight=Math.max(actor.groundHeight||0,b.surfaceHeight);
  actor.charge=0;delete actor.queuedAttack;
 }
 game.persist();
 return {ok:true,message:'Event test board spawned at '+p.name+'. Hit it once per event, starting at 1. Pawns and turns do not advance.'};
}

export function canHitEventTestBoard(game,p){
 const b=game.eventTestBoard;
 if(!b||game.phase!=='play'||p.hp<=0||p.room||p.ui||isCharmed(p))return false;
 const dx=Math.max(b.x,Math.min(b.x+b.w,p.x))-p.x,dy=Math.max(b.y,Math.min(b.y+b.h,p.y))-p.y;
 const d=Math.hypot(dx,dy);
 return d<=40&&(d<1||(dx*p.faceX+dy*p.faceY)/(d*(Math.hypot(p.faceX,p.faceY)||1))>=Math.cos(Math.PI/4));
}

export function hitEventTestBoard(game,p,events){
 if(!canHitEventTestBoard(game,p)||game.roll||p.attack>0)return false;
 const b=game.eventTestBoard,index=b.nextEvent;
 p.attack=p.attackDuration=.34;p.attackClip='punch';p.charge=0;delete p.queuedAttack;
 if(index>=events.length){game.message('Event test complete — respawn the test board in the dev menu to start again.');return true;}
 // Update before spawning: portal events may save from inside spawnEvent.
 b.nextEvent++;b.lastEventName=events[index].name;
 if(game.spawnEvent(index,{test:true})===false){
  b.nextEvent=index;game.message('Event test '+(index+1)+' needs a clear spawn site. Clear space and hit again to retry.');
 }else game.message('Event test '+(index+1)+' / '+events.length+' · '+events[index].name);
 game.persist();
 return true;
}
