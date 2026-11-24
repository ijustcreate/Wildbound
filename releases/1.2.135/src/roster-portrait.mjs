import {controlledUnit} from './controlled-unit.mjs';
import {drawPlayer,playerMotionRevision} from './player-motion.mjs';
import {drawAnacondaSegment} from './anaconda-art.mjs';
import {rigSubject} from './rig-subjects.mjs';

// Stable plaques use the real unit renderer, never its live attack/jump pose.
// One cached image per live actor; switching units cannot grow a global atlas.
export class RosterPortraits {
  constructor(animator){this.animator=animator;this.cache=new WeakMap();}
  draw(canvas,game,owner){
    const unit=controlledUnit(game,owner),subject=unit||owner;
    canvas.dataset.subject=unit?'controlled':'hero';
    canvas.dataset.actorId=String(subject.id);
    canvas.setAttribute('aria-label',(unit?`Controlling ${unit.name||unit.kind}`:owner.name)+' portrait');
    const loadout=unit||owner.controlMainLoadout||owner;
    const signature=JSON.stringify([playerMotionRevision,subject.kind,subject.sprite,subject.villagerId,subject.appearance,loadout.equipment,loadout.equipmentSockets,subject.field?.cosmetics]);
    let cached=this.cache.get(subject);
    if(!cached||cached.signature!==signature){
      const image=document.createElement('canvas');image.width=96;image.height=112;
      const c=image.getContext('2d');c.imageSmoothingEnabled=false;
      const actor={...subject,...loadout,x:192,y:240,faceX:0,faceY:1,bowVisualAngle:undefined,bowAimBlend:0,bowAiming:false,animationAction:'idle',state:'idle',moving:false,step:0,playerFrame:0,poseTime:0,animationProgress:0,attack:0,spin:0,charge:0,hit:0,flash:0,jumpHeight:0,groundHeight:0,roostHeight:0,impFlightHeight:0,succubusFlightHeight:0};
      if(!unit){c.translate(48,180);c.scale(5,5);drawPlayer(c,actor,0);}
      else{
        const scratch=this.scratch||=Object.assign(document.createElement('canvas'),{width:384,height:384}),pen=scratch.getContext('2d');
        pen.clearRect(0,0,384,384);pen.imageSmoothingEnabled=false;
        // A 40-segment snake needs a head portrait, not a miniature whole coil.
        let head=null;const rig=rigSubject(unit.sprite||unit.kind);
        pen.save();
        if(unit.ghost||unit.spiritGhost)pen.filter='sepia(.6) hue-rotate(155deg) saturate(1.7)';
        if(unit.kind==='anaconda'){actor.anacondaBody=undefined;drawAnacondaSegment(pen,actor,0,0);}
        else if(rig?.draw){pen.translate(192,240);pen.scale(2,2);const pose=rig.draw(pen,actor,0,rig.data);if(pose?.head&&(rig.data?.joints?.handL||['lion','tiger','panther','white_lion','snow_leopard'].includes(unit.kind)))head={x:192+pose.head.x*2,y:240+pose.head.y*2};}
        else this.animator.draw(pen,actor,0,96);
        pen.restore();
        const pixels=pen.getImageData(0,0,384,384).data;let left=384,top=384,right=-1,bottom=-1;
        for(let y=0;y<384;y++)for(let x=0;x<384;x++)if(pixels[(y*384+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
        // Bust framing keeps a raised tail or broad wings from shrinking the face.
        if(head){left=Math.max(left,Math.floor(head.x-24));right=Math.min(right,Math.ceil(head.x+24));top=Math.max(top,Math.floor(head.y-26));bottom=Math.min(bottom,Math.ceil(head.y+30));}
        if(right>=left){const w=right-left+1,h=bottom-top+1,scale=Math.min(88/w,104/h);c.drawImage(scratch,left,top,w,h,Math.round((96-w*scale)/2),Math.round((112-h*scale)/2),Math.round(w*scale),Math.round(h*scale));}
      }
      this.cache.set(subject,cached={signature,image});
    }
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(cached.image,0,0,canvas.width,canvas.height);
  }
}
