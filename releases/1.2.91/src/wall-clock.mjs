// Local computer time, shared by the house and station; never the simulation clock.
export function localClockAngles(date=new Date()){return {hour:((date.getHours()%12)+date.getMinutes()/60)*Math.PI/6,minute:(date.getMinutes()+date.getSeconds()/60)*Math.PI/30,second:date.getSeconds()*Math.PI/30};}
export function drawWallClock(c,x,y,size=30,date=new Date()){
 const r=size/2,a=localClockAngles(date);c.save();c.translate(Math.round(x),Math.round(y));c.fillStyle='#1f302f66';c.beginPath();c.ellipse(2,3,r+2,r+2,0,0,Math.PI*2);c.fill();
 for(const [radius,color]of [[r+2,'#3e4638'],[r,'#b7955d'],[r-2,'#f0dfb8'],[r-4,'#e6d2a3']]){c.fillStyle=color;for(let yy=-radius;yy<=radius;yy++){const w=Math.sqrt(Math.max(0,radius*radius-yy*yy));c.fillRect(Math.round(-w),yy,Math.round(w*2),1);}}
 c.fillStyle='#6b6751';for(let i=0;i<12;i++){const angle=i*Math.PI/6;c.fillRect(Math.round(Math.sin(angle)*(r-5))-1,Math.round(-Math.cos(angle)*(r-5))-1,i%3?1:2,i%3?1:2);}
 const hand=(angle,len,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(0,0);c.lineTo(Math.round(Math.sin(angle)*len),Math.round(-Math.cos(angle)*len));c.stroke();};hand(a.hour,r*.48,'#34453d',2);hand(a.minute,r*.72,'#34453d',1.5);hand(a.second,r*.75,'#a35241',1);c.fillStyle='#c69d5b';c.fillRect(-1,-1,3,3);c.restore();
}
