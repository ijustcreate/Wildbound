const CLEANUP_START = .75;
const CLEANUP_DURATION = .55;

export function corpseCleanupProgress(actor) {
  if (!actor.corpseCleanup || actor.hp > 0) return null;
  return Math.max(0, ((actor.deathTimer || 0) - CLEANUP_START) / CLEANUP_DURATION);
}

export function corpseOpacity(progress) {
  return Math.max(0, 1 - (progress ?? 0) / .65);
}

// Draw the brief release at the body’s contact point, on the same depth layer.
export function drawCorpseCleanup(ctx, actor, contact, size, drawBody) {
  const progress = corpseCleanupProgress(actor);
  if (!(progress > 0)) {
    drawBody();
    return;
  }
  if (progress >= 1) return;

  const opacity = corpseOpacity(progress);
  const alpha = ctx.globalAlpha;
  ctx.save();
  if (opacity > 0) {
    ctx.globalAlpha = alpha * opacity;
    drawBody();
  }

  const spread = Math.min(23, Math.max(9, size * .3));
  const expansion = 1 - (1 - progress) ** 2;
  const seed = (Number(actor.id) || 0) * .73;
  const colors = ['#fcf5dc', '#dfe6c9', '#a4b6a9'];
  for (let i = 0; i < 14; i++) {
    const angle = seed + i * 2.39996;
    const distance = spread * (.32 + (i % 5) * .12 + expansion * .88);
    const x = Math.round(contact.x + Math.cos(angle) * distance);
    const y = Math.round(contact.y + Math.sin(angle) * distance * .36 - expansion * (4 + i % 6 * 2));
    const pixel = i % 4 === 0 ? 3 : 2;
    ctx.globalAlpha = alpha * Math.min(1, progress * 15) * (1 - progress) ** (1 + (i % 3) * .35);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(x, y, pixel, pixel);
  }
  ctx.restore();
}

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
 const fade=actor.corpseCleanup?0:Math.max(0,Math.min(1,((actor.deathTimer||0)-1.15)/2.1));
 ctx.save();ctx.globalAlpha*=1-fade;
 ctx.translate(contact.x,contact.y);ctx.scale(1.08,.38);
 draw(corpsePose(actor,model),0,size);ctx.restore();
}
