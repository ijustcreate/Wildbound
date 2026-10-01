import {rigSubject} from './rig-subjects.mjs';
import {poseAt,projectPoint,facingIndex} from './player-motion.mjs';
export function drawHunterPet(c,pet,owner,time,size=43){
 if(!pet||!Number.isFinite(pet.x))return;
 const rig=rigSubject(pet.kind);if(!rig)return;
 c.save();c.strokeStyle=owner.color||'#79c79c';c.lineWidth=1.5;c.beginPath();c.ellipse(pet.x,pet.y+2,size*.34,size*.14,0,0,Math.PI*2);c.stroke();
 const height=(pet.roostHeight||0)+(pet.jumpHeight||0)+(pet.groundHeight||0);
 c.translate(pet.x,pet.y-height);c.scale(size/48,size/48);
 if(pet.hp<=0){c.globalAlpha=.6;c.rotate(Math.PI/2);}
 const actor={...pet,x:0,y:0,animationAction:pet.hp<=0?'idle':pet.animationAction};
 rig.draw(c,actor,time,rig.data);
 const action=actor.animationAction||'idle',pose=poseAt(rig.data,rig.data.clips[action]?action:'idle',time*4);
 const joint=(pose.chest||pose.head).map((v,i)=>v*.7+(pose.neck||pose.head)[i]*.3);
 const neck=projectPoint(joint,facingIndex(pet.faceX,pet.faceY));
 neck.y+=pet.kind==='bat'?0:Math.max(0,pet.faceY||0)*7;
 c.strokeStyle=pet.collar||owner.color;c.lineWidth=1.5;c.beginPath();c.ellipse(neck.x,neck.y,pet.kind==='bat'?3:5,1.3,0,0,Math.PI*2);c.stroke();
 c.restore();
 c.save();c.font='6px sans-serif';c.textAlign='center';c.fillStyle=owner.color||'#daedba';
 c.fillText(pet.hp<=0?`${pet.name} · REVIVE ${Math.ceil(pet.downedRemaining??60)}s`:pet.name,pet.x,pet.y+15);
 if(pet.hp<=0){c.fillStyle='#ffe4a5';c.fillRect(pet.x-12,pet.y+18,24*Math.min(1,(pet.revive||0)/1.6),2);}
 if(pet.heartTime>0){c.font='14px sans-serif';c.fillStyle='#ff9eaf';c.fillText('♥',pet.x,pet.y-height-35);}
 c.restore();
}
