export function drawJumanjiVines(c,actor,time){
 if(!(actor.jumanjiVines>0))return;
 c.save();c.imageSmoothingEnabled=false;
 const x=Math.round(actor.x),y=Math.round(actor.y),sway=Math.round(Math.sin(time*8+actor.id)*2);
 const rect=(dx,dy,w,h,color)=>{c.fillStyle=color;c.fillRect(x+dx,y+dy,w,h);};
 for(const [side,height]of [[-1,30],[1,25]]){
  const root=side*13,top=root+side*sway;
  for(let n=0;n<height;n++){const t=n/height,xx=Math.round(root+(top-root)*t-side*Math.sin(t*Math.PI)*5);
   rect(xx,-n-2,2,3,n%5===0?'#7aaf58':'#315e32');
   if(n>5&&n%7===0){rect(xx+side*2,-n-2,4,2,'#285c31');rect(xx+side*4,-n-3,3,1,'#94bb62');}
  }
 }
 for(const [dx,dy]of [[-17,-1],[-8,-4],[5,-2],[15,-3]]){rect(dx,dy,5,2,'#244b2c');rect(dx+1,dy-1,3,1,'#80ab56');}
 c.restore();
}
