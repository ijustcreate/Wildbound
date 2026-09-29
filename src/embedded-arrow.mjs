export function embeddedArrowGeometry(a){
 const depth=Math.max(5,Math.min(30,a.embedDepth||7));
 return {x:a.x,y:a.y,tailX:a.x-Math.cos((a.angle||0)+(a.angleJitter||0))*7,tailY:a.y-Math.max(11,23-depth*.3)};
}
export function drawEmbeddedArrow(c,a){
 const p=embeddedArrowGeometry(a);c.save();
 c.fillStyle='#07100d88';c.beginPath();c.ellipse(p.x,p.y+1,3,1.5,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#ba9763';c.lineWidth=1.5;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.tailX,p.tailY);c.stroke();
 c.strokeStyle='#f0e7cd';c.lineWidth=2;c.beginPath();c.moveTo(p.tailX-2,p.tailY-1);c.lineTo(p.tailX+2,p.tailY+3);c.stroke();
 // The metal tip is buried, with only a small dirt collar visible.
 c.fillStyle='#594e32';c.fillRect(Math.round(p.x)-2,Math.round(p.y),4,1);c.restore();
}
