// A direction aid, not a ballistic prediction. Same projected height as the arrow.
export function drawBowAim(ctx,actor,scale=1){
  if(!actor.bowAiming||actor.hp<=0||actor.swimming||actor.sink>18)return;
  const length=Math.hypot(actor.faceX||0,actor.faceY||0)||1;
  const dx=(actor.faceX||0)/length,dy=(actor.faceY||0)/length;
  const x=actor.x,y=actor.y-(actor.groundHeight||0)-(actor.jumpHeight||0)-18*scale;
  ctx.save();ctx.strokeStyle='#b7f5dc';ctx.globalAlpha=.8;ctx.lineWidth=1.5;
  ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x+dx*14*scale,y+dy*14*scale);
  ctx.lineTo(x+dx*64*scale,y+dy*64*scale);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.arc(x+dx*64*scale,y+dy*64*scale,2,0,Math.PI*2);ctx.stroke();ctx.restore();
}
