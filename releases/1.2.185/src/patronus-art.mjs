const SIZE=112, ANCHOR_X=56, ANCHOR_Y=76;
let silhouette, material;

function pixelBuffer() {
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=SIZE;
  const context=canvas.getContext('2d');
  context.imageSmoothingEnabled=false;
  return {canvas,context};
}

export function drawPatronus(c,actor,time,drawAnimal) {
  const alpha=Math.min(1,Math.max(0,(time-actor.summonedAt)*4),Math.max(0,(actor.expiresAt-time)*1.54));
  if (!alpha) return;
  silhouette??=pixelBuffer();
  material??=pixelBuffer();
  const base=silhouette.context,pen=material.context;
  base.clearRect(0,0,SIZE,SIZE);
  drawAnimal(base,{...actor,patronus:false,x:ANCHOR_X,y:ANCHOR_Y});
  pen.clearRect(0,0,SIZE,SIZE);
  // Recolor the finished native pose once so authored highlights and outlines survive.
  pen.filter='grayscale(1) sepia(1) hue-rotate(142deg) saturate(1.9) brightness(1.58)';
  pen.drawImage(silhouette.canvas,0,0);
  pen.filter='none';

  const seed=Number(actor.owner?.id)||0,t=time*2.7+seed*.81;
  const x=Math.round(actor.x-ANCHOR_X),y=Math.round(actor.y-ANCHOR_Y-5-Math.sin(t)*2);
  c.save();
  c.imageSmoothingEnabled=false;
  c.globalAlpha*=alpha;
  const opacity=c.globalAlpha;
  c.globalAlpha=opacity*.13;
  c.globalCompositeOperation='lighter';
  c.drawImage(material.canvas,x-2,y);
  c.drawImage(material.canvas,x+2,y);
  c.drawImage(material.canvas,x,y-2);
  if (actor.moving) c.drawImage(material.canvas,x-Math.round(actor.faceX*7),y-Math.round(actor.faceY*5)+2);
  c.globalCompositeOperation='source-over';
  c.globalAlpha=opacity*.86;
  c.drawImage(material.canvas,x,y);
  // Small pixel glints drift up the silhouette and fade instead of emitting scenery particles.
  for (let i=0;i<9;i++) {
    const age=(time*(.63+.06*(i%3))+i*.281+seed*.031)%1;
    const phase=t*.7+i*2.4;
    const px=Math.round(actor.x+Math.cos(phase)*(12+age*14));
    const py=Math.round(actor.y-6-age*39+Math.sin(phase)*4);
    c.globalAlpha=opacity*Math.sin(Math.PI*age)*(.5+i%3*.16);
    c.fillStyle=i%3?'#8cefff':'#edffff';
    c.fillRect(px,py,1,1);
    if (i%3===0 && age>.35 && age<.56) {
      c.fillRect(px-1,py,3,1);
      c.fillRect(px,py-1,1,3);
    }
  }
  c.restore();
}
