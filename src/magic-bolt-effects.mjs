export function finishMagicBolt(g,bolt,hit=false){
 if(bolt.finished)return;bolt.finished=true;
 const duration=hit?.32:.4;
 g.effects.push({magicBolt:true,hit,x:bolt.x,y:bolt.y-16,color:bolt.color||'#ace3ff',life:duration,duration});
}
export function drawMagicBurst(c,fx){
 const t=Math.max(0,Math.min(1,1-fx.life/fx.duration)),count=fx.hit?9:5;
 c.save();c.globalAlpha*=1-t;c.globalCompositeOperation='lighter';
 for(let i=0;i<count;i++){
  const a=i*Math.PI*2/count,reach=(fx.hit?22:9)*t;
  const x=fx.x+Math.cos(a)*reach,y=fx.y+Math.sin(a)*reach-(fx.hit?0:t*9);
  c.strokeStyle=i%3?fx.color:'#fff5d5';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*(fx.hit?4:2)*(1-t),y+Math.sin(a)*3*(1-t));c.stroke();
 }
 c.restore();
}
