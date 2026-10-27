// A corpse is projected onto the floor, never rotated in screen space.
// Side-on animals and the settled front-view humanoid pose have horizontal silhouettes.
export function corpsePose(actor,model){
 const humanoid=!!(model?.joints?.handL&&model?.joints?.footL);
 const clip=model?.clips?.death||model?.clips?.wilt;
 return {...actor,x:0,y:0,faceX:humanoid?0:actor.faceX<0?-1:1,faceY:humanoid?1:0,
  animationAction:clip?(model.clips.death?'death':'wilt'):'idle',playerFrame:clip?clip.length-1:0,
  poseTime:1,deathTime:1,animationProgress:1,moving:false,step:0,
  jumpHeight:0,groundHeight:0,jumpVelocity:0,landTime:0,attack:0,charge:0,hit:0,flash:0,dashTime:0};
}
export function drawCorpse(ctx,actor,model,contact,size,draw){
 const fade=Math.max(0,Math.min(1,((actor.deathTimer||0)-1.15)/2.1));
 ctx.save();ctx.globalAlpha*=1-fade;
 ctx.translate(contact.x,contact.y);ctx.scale(1.08,.38);
 draw(corpsePose(actor,model),0,size);ctx.restore();
}
