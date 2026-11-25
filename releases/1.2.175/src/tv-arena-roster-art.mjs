import {drawNativeFrog} from './frog-art.mjs';
import {TV_NEW_ENEMIES} from './tv-arena-roster.mjs';
// The ecosystem frog is native pixel artwork, not an Animator rig or an overhead sprite sheet.
export function drawTvEnemyActor(c,animator,actor,time,size=actor.visualSize||48){
 if(actor.kind!=='frog'){const d=TV_NEW_ENEMIES[actor.kind];animator.draw(c,d?{...actor,x:actor.x+(d.centerOffset||0)*(actor.faceX??actor.face??1),y:actor.y-(d.footOffset||0)}:actor,time,size);return;}
 const scale=size/18;c.save();c.translate(Math.round(actor.x),Math.round(actor.y-3*scale));c.scale(scale,scale);c.imageSmoothingEnabled=false;
 drawNativeFrog(c,{...actor,x:0,y:0,hopHeight:0,sideView:true,hop:!actor.grounded,anticipating:!!actor.intent});c.restore();
}
