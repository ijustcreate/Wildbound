export function drawHomesteadBoardPortal(c,portal,time){
 const {table,x,u}=portal,y=table.y+table.h/2-table.surfaceHeight;
 const opacity=Math.sin(Math.PI*Math.min(.95,u+.12));
 c.save();c.globalAlpha=opacity;
 c.fillStyle='#102d34';c.fillRect(x-10,y-3,20,6);c.fillRect(x-6,y-6,12,12);
 for(let i=0;i<36;i++){
  const turn=(time*3.6+i*.45),radius=3+(i%12)*(2.2-u);
  const px=Math.round(x+Math.cos(turn)*radius),py=Math.round(y+Math.sin(turn)*radius*.48-(i%4)*2);
  c.fillStyle=['#e5fff1','#7feec6','#38a5a0','#edcc84'][i%4];
  c.fillRect(px,py,i%5?1:2,i%3?1:2);
 }
 c.restore();
}

export function drawHomesteadSuctionActor(c,renderer,p,portal,time,size){
 const x=portal.actorX,y=portal.actorY,a=portal.scale;
 c.save();c.globalAlpha=Math.max(.03,1-portal.u*.94);c.translate(Math.round(x),Math.round(y));
 c.scale(a,a);c.translate(-Math.round(x),-Math.round(y));
 renderer.animator.draw(c,{...p,x,y,jumpHeight:0,groundHeight:0,moving:false,walking:false,animationAction:null},time,size);
 c.restore();
}
