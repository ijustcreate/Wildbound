import {playerPose,projectPoint,facingIndex} from './player-motion.mjs';
import {PLAYER_RENDER_SIZE,creatureRenderSize} from './render-settings.mjs';
export function heldChickenVisual(player,chicken,time){
 const pose=playerPose(player,time),d=facingIndex(player.faceX,player.faceY);
 const grip=projectPoint(pose.handL.map((v,i)=>(v+pose.handR[i])/2),d);
 // Support the lower body at the raised palms, with its feet dangling beside them.
 const belly=projectPoint([0,0,2],d),scale=PLAYER_RENDER_SIZE/48,birdScale=creatureRenderSize('chicken')/48;
 return {...chicken,x:player.x+grip.x*scale-belly.x*birdScale,
  y:player.y-(player.jumpHeight||0)-(player.groundHeight||0)+grip.y*scale-belly.y*birdScale,
  faceX:player.faceX,faceY:player.faceY,jumpHeight:0,groundHeight:0,room:null,moving:false,state:'carried',
  carriedFlap:player.jumpHeight>0};
}
