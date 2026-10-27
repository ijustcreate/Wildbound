const ink='#38282c',red='#b63840',shade='#812d35',light='#cf5150',fur='#eee7d1',furShade='#b9beac',gold='#dbb452';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
export function drawSantaHat(c,h,d){
 const back=d>=3&&d<=5,side=d===2||d===6,sign=d<4?-1:1,x=h.x,y=h.y;
 const widths=[1,2,3,4,5,5];
 for(let n=0;n<6;n++){const half=widths[n]*(side?.8:1),offset=(5-n)*.45*(side?sign:1);rect(c,x-half+offset,y-11+n,half*2+1,1,ink);rect(c,x-half+offset+1,y-11+n,Math.max(1,half*2-1),1,n<2?light:red);}
 rect(c,x-5,y-5,11,3,furShade);rect(c,x-5,y-5,10,2,fur);rect(c,x+3,y-11,3,3,furShade);rect(c,x+3,y-12,2,3,fur);
 if(back)rect(c,x+3,y-3,2,1,furShade);return true;
}
export function drawSantaCoat(c,p,d){
 const side=d===2||d===6,back=d>=3&&d<=5,turn=d<4?-1:1;
 const top=p.chest.y-3,bottom=p.pelvis.y+3,height=Math.max(9,bottom-top),cx=(p.chest.x+p.pelvis.x)/2;
 // A single rounded silhouette, not a scaled armor box. Width peaks below
 // the ribs; side views project the belly forward while keeping the back flat.
 for(let row=0;row<height;row++){
  const t=row/height,half=side?7+Math.sin(t*Math.PI)*4:6+Math.sin(t*Math.PI)*6;
  const center=cx+(side?turn*(Math.sin(t*Math.PI)*2):0),left=Math.round(center-half),right=Math.round(center+half);
  rect(c,left,top+row,right-left,1,ink);rect(c,left+1,top+row,right-left-2,1,red);
  rect(c,left+1,top+row,1,1,light);rect(c,right-2,top+row,1,1,shade);
  if(!back&&!side)rect(c,cx-.5,top+row,1,1,furShade);
  if(t>.66&&t<.85)rect(c,left+1,top+row,right-left-2,1,'#302b2d');
  if(row>=height-2)rect(c,left+1,top+row,right-left-2,1,row===height-2?fur:furShade);
 }
 if(!back){const buckle=cx+(side?turn*5:0),y=top+height*.71;rect(c,buckle-2,y,4,3,gold);rect(c,buckle-1,y+1,2,1,'#473831');}
 rect(c,p.chest.x-3,p.chest.y-3,6,2,fur);return true;
}
export function paintChristmasItem(c,id){
 const r=(x,y,w,h,col)=>rect(c,x,y,w,h,col);
 if(id==='santa_letter'){r(3,5,18,14,ink);r(4,6,16,12,'#eedfb7');for(let i=0;i<8;i++){r(4+i,6+i*.5,1,1,'#b2a07a');r(19-i,6+i*.5,1,1,'#b2a07a');}r(15,8,3,3,red);r(10,12,4,3,gold);return true;}
 if(id==='wrapped_present'){r(3,7,18,15,ink);r(4,8,16,13,red);r(4,8,4,12,light);r(10,6,4,15,gold);r(3,11,18,3,gold);r(7,3,5,4,gold);r(13,3,5,4,gold);r(8,4,3,2,red);r(14,4,3,2,red);return true;}
 if(id==='christmas_bell'){r(10,2,4,4,ink);r(11,3,2,3,gold);r(8,6,8,3,ink);r(6,9,12,8,ink);r(4,16,16,4,ink);r(9,7,6,3,gold);r(7,10,10,7,gold);r(5,17,14,2,'#f4d580');r(8,10,2,5,'#f4d580');r(10,20,4,2,gold);r(7,6,3,3,red);return true;}
 if(id==='christmas_chocolate'){r(4,3,16,19,ink);r(5,4,14,17,'#f0d7ac');r(5,9,14,12,'#6b3d2b');for(let y=5;y<13;y+=4)for(let x=6;x<18;x+=4){r(x,y,3,3,'#8e5737');r(x,y,2,1,'#b17a50');}r(5,14,14,6,red);r(9,16,6,2,fur);return true;}
 if(id==='toy_train'){r(3,16,18,3,ink);r(4,11,11,6,'#437d9d');r(14,7,6,10,'#488bae');r(13,6,8,2,ink);r(15,9,3,3,'#bdded9');r(5,8,3,4,ink);r(5,7,3,2,'#688a9a');r(3,13,10,2,'#82bac8');for(const x of[5,11,17]){r(x,17,3,4,ink);r(x+1,18,1,1,gold);}return true;}
 if(id==='santa_hat'){drawSantaHat(c,{x:12,y:16},0);return true;}
 if(id==='santa_coat'){drawSantaCoat(c,{chest:{x:12,y:6},pelvis:{x:12,y:18}},0);return true;}
 return false;
}
export function drawToyTrain(c,toy,time){
 c.save();c.translate(Math.round(toy.x),Math.round(toy.y));
 // Tiny sleepers and two steel rails are legible at actual ground scale.
 for(let i=0;i<20;i++){const a=i*Math.PI/10,x=Math.cos(a)*20,y=Math.sin(a)*10;c.save();c.translate(x,y);c.rotate(Math.atan2(10*Math.cos(a),-20*Math.sin(a)));rect(c,-1,-3,2,6,'#795b3b');c.restore();}
 for(const r of[-1,1]){c.strokeStyle=r<0?'#56666a':'#acb9ac';c.lineWidth=1;c.beginPath();c.ellipse(0,0,20+r*1.5,10+r,0,0,Math.PI*2);c.stroke();}
 const angle=toy.angle||0,x=Math.cos(angle)*20,y=Math.sin(angle)*10,heading=Math.atan2(10*Math.cos(angle),-20*Math.sin(angle));
 c.save();c.translate(x,y);c.rotate(heading);rect(c,-6,-3,12,6,'#25343a');rect(c,-5,-2,10,4,'#448cad');rect(c,-4,-2,3,3,'#a4ced0');rect(c,2,-2,2,4,'#2b4d63');rect(c,4,-2,2,4,'#d0b35f');c.restore();
 if(toy.lapsLeft>0)for(let i=0;i<4;i++){const phase=(time*1.5+i*.25)%1,fade=1-phase;c.globalAlpha=fade*.45;const old=angle-phase*.5;rect(c,Math.cos(old)*20+phase*3,Math.sin(old)*10-5-phase*13,2+Math.floor(phase*2),2+Math.floor(phase*2),'#d0d4c8');}
 c.restore();
}
