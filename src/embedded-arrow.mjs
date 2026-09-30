export function embeddedArrowGeometry(a){
 const depth=Math.max(5,Math.min(30,a.embedDepth||7));
 return {x:a.x,y:a.y,tailX:a.x-Math.cos((a.angle||0)+(a.angleJitter||0))*7,tailY:a.y-Math.max(11,23-depth*.3)};
}
export function drawEmbeddedArrow(c,a){
 if(a.surfaceEmbedded){drawLodgedArrow(c,a);return;}
 const p=embeddedArrowGeometry(a);c.save();
 c.fillStyle='#07100d88';c.beginPath();c.ellipse(p.x,p.y+1,3,1.5,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#ba9763';c.lineWidth=1.5;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.tailX,p.tailY);c.stroke();
 c.strokeStyle='#f0e7cd';c.lineWidth=2;c.beginPath();c.moveTo(p.tailX-2,p.tailY-1);c.lineTo(p.tailX+2,p.tailY+3);c.stroke();
 // The metal tip is buried, with only a small dirt collar visible.
 c.fillStyle='#594e32';c.fillRect(Math.round(p.x)-2,Math.round(p.y),4,1);c.restore();
}

// Tip at the contact point, exposed shaft trailing the direction of travel.
export function drawLodgedArrow(c,a){
 const depth=Math.max(5,Math.min(30,a.embedDepth||7));
 const length=Math.max(10,27-depth*.45);
 c.save();c.translate(a.x,a.y-(a.z||0));
 c.rotate((a.angle??Math.atan2(a.vy||0,a.vx||0))+(a.angleJitter||0));
 c.fillStyle='#ba9763';c.fillRect(-length,-1,length,2);
 c.fillStyle='#f0e7cd';c.fillRect(-length,-3,5,6);
 c.fillStyle='#594e32';c.fillRect(-1,-2,2,4);c.restore();
}
