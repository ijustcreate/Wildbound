import {rigSubject} from './rig-subjects.mjs';
import {companionVisualActor} from './companion-locomotion.mjs';
import {drawSnowyOwl} from './snowy-owl-art.mjs';
export function drawHunterPet(c,pet,owner,time,size=43){
 if(!pet||!Number.isFinite(pet.x))return;
 const rig=pet.owlVariant?null:rigSubject(pet.kind);if(!rig&&!pet.owlVariant)return;
 const markerSize=pet.owlVariant==='parrot'?size*.67:size;
 c.save();c.strokeStyle=owner.color||'#79c79c';c.lineWidth=1.5;c.beginPath();c.ellipse(pet.x,pet.y+2,markerSize*.34,markerSize*.14,0,0,Math.PI*2);c.stroke();
 const height=pet.owlVariant?(pet.owlHeight||0):(pet.roostHeight||0)+(pet.jumpHeight||0)+(pet.groundHeight||0);
 if(pet.owlVariant)drawSnowyOwl(c,pet,time,size);
 else{
 c.translate(pet.x,pet.y-height);c.scale(size/48,size/48);
 if(pet.hp<=0){c.globalAlpha=.6;c.rotate(Math.PI/2);}
 const actor=companionVisualActor({...pet,x:0,y:0,animationAction:pet.hp<=0?'idle':pet.animationAction},rig.data);
 const pose=rig.draw(c,actor,time,rig.data);
 // Reuse the exact walking/hurt/bite pose, not a second idle pose sample.
 const chest=pose.chest||pose.head,joint=pose.neck||pose.head;
 const neck={x:chest.x*.7+joint.x*.3,y:chest.y*.7+joint.y*.3};
 neck.y+=pet.kind==='bat'?0:Math.max(0,pet.faceY||0)*7;
 c.strokeStyle=pet.collar||owner.color;c.lineWidth=1.5;c.beginPath();c.ellipse(neck.x,neck.y,pet.kind==='bat'?3:5,1.3,0,0,Math.PI*2);c.stroke();
 }
 c.restore();
 c.save();c.font='6px sans-serif';c.textAlign='center';c.fillStyle=owner.color||'#daedba';
 c.fillText(pet.hp<=0?`${pet.name} · REVIVE ${Math.ceil(pet.downedRemaining??60)}s`:pet.name,pet.x,pet.y+15);
 if(pet.hp<=0){c.fillStyle='#ffe4a5';c.fillRect(pet.x-12,pet.y+18,24*Math.min(1,(pet.revive||0)/1.6),2);}
 if(pet.heartTime>0){c.font='14px sans-serif';c.fillStyle='#ff9eaf';c.fillText('♥',pet.x,pet.y-height-35);}
 c.restore();
}

export function queueHunterOwlPets(c,g,visible,objects){
 for(const owner of g.players){
  const pet=owner.hunterPet;
  if(owner.room||!pet?.owlVariant||pet.controlledBy||!Number.isFinite(pet.x)||!visible(pet.x,pet.y,65,90))continue;
  objects.push({depth:pet.y,paint:()=>drawHunterPet(c,pet,owner,g.time)});
 }
}
