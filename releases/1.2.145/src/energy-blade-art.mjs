import {pixelPolygon} from './pixel-shapes.mjs';

function stroke(c,a,b,color,width){
 c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
}

export function drawEnergyBlade(c,hand,tip,color,active){
 const dx=tip.x-hand.x,dy=tip.y-hand.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
 const lower={x:hand.x-ux*4,y:hand.y-uy*4},emitter={x:hand.x+ux*3,y:hand.y+uy*3};
 c.save();c.lineCap='round';
 const opacity=c.globalAlpha;
 if(active){
  c.globalAlpha=opacity*.19;stroke(c,emitter,tip,color,7);
  c.globalAlpha=opacity*.48;stroke(c,emitter,tip,color,4.4);
  c.globalAlpha=opacity;stroke(c,emitter,tip,color,2.65);stroke(c,emitter,tip,'#efffec',1.25);
 }
 stroke(c,lower,emitter,'#2c3332',3);stroke(c,lower,emitter,'#a19777',1.2);
 stroke(c,{x:emitter.x-uy*1.1,y:emitter.y+ux*1.1},{x:emitter.x+uy*1.1,y:emitter.y-ux*1.1},'#d7c18b',1.35);
 c.restore();
}

export function drawEnergySwing(c,points,color){
 c.save();c.lineCap='round';
 const opacity=c.globalAlpha;
 for(let i=1;i<points.length;i++){
  const {hand,tip}=points[i],old=points[i-1],age=i/points.length;
  const inner={x:hand.x*.5+tip.x*.5,y:hand.y*.5+tip.y*.5};
  const older={x:old.hand.x*.5+old.tip.x*.5,y:old.hand.y*.5+old.tip.y*.5};
  c.globalAlpha=opacity*(.12+age*.31);
  c.fillStyle=color;c.beginPath();c.moveTo(older.x,older.y);c.lineTo(old.tip.x,old.tip.y);c.lineTo(tip.x,tip.y);c.lineTo(inner.x,inner.y);c.closePath();c.fill();
  c.globalAlpha=opacity*age*.66;stroke(c,old.tip,tip,color,1.65);
 }
 c.restore();
}

export function drawEnergyMotionTail(c,fx){
 const age=Math.max(0,Math.min(1,fx.life/fx.duration)),{from,to,color}=fx;
 c.save();c.lineCap='round';c.globalAlpha=age*.22;stroke(c,from,to,color,4.3);
 c.globalAlpha=age*.65;stroke(c,from,to,color,1.45);
 c.globalAlpha=age*.38;stroke(c,{x:(from.x+to.x)/2,y:(from.y+to.y)/2},to,'#efffec',.8);
 c.restore();
}

export function drawEnergyScorch(c,mark,time,scale=1){
 const {x,y,angle,expires}=mark,age=time-mark.born;
 c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);if(scale!==1)c.scale(scale,scale);
 c.globalAlpha=Math.min(.72,(expires-time)/8);
 pixelPolygon(c,[{x:-13,y:1},{x:-7,y:-2},{x:0,y:-2},{x:7,y:-1},{x:12,y:1},{x:5,y:3},{x:-5,y:3}],'#262523');
 c.fillStyle='#614533';c.fillRect(-8,0,15,1);c.fillRect(-3,-1,8,1);
 if(age<1.6){
  c.globalAlpha*=1-age/1.6;c.fillStyle='#f08a49';c.fillRect(-5,0,3,1);c.fillRect(3,1,4,1);
  c.fillStyle='#eec571';c.fillRect(4,1,1,1);
 }
 c.restore();
}
