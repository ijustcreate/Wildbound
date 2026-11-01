// Shared raised tops, aprons and feet keep house props on one viewing plane.
export function drawRefinedFurniture(c,f){
 const {x,y,w,h,kind}=f;if(!['chair','table','counter','bench','dresser','bed','sink','stove','plant','mailbox'].includes(kind))return false;
 c.save();c.translate(x,y);
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
 const wood={dark:'#3f382d',side:'#705137',base:'#a57b4c',light:'#d3ab70'};
 const feet=()=>{for(const px of [3,w-8]){r(px,h-5,5,10,wood.dark);r(px,h-6,3,8,wood.base);}};
 const top=(color=wood.base)=>{r(0,-6,w,h,wood.dark);r(2,-7,w-4,h-2,color);r(3,-7,w-6,2,wood.light);r(1,h-8,w-2,5,wood.side);};
 if(kind==='chair'){
  feet();r(2,-10,w-4,h*.5,wood.dark);r(4,-9,w-8,5,wood.base);for(const px of [5,w*.5,w-8])r(px,-4,3,h*.4,wood.side);
  r(1,h*.35,w-2,h*.56,wood.dark);r(3,h*.35,w-6,h*.4,'#b09963');r(4,h*.35,w-8,2,'#dcc28c');r(2,h*.8,w-4,3,wood.side);
 }else if(['table','bench'].includes(kind)){
  feet();top();for(let row=6;row<h-12;row+=12){r(3,row,w-6,1,'#8c633d');r(4,row+1,w-8,1,'#c39a60');}r(w*.22,3,w*.25,1,'#e0b77a');
 }else if(['counter','dresser'].includes(kind)){
  r(2,0,w-4,h,wood.dark);r(4,2,w-8,h-3,wood.side);for(let n=0;n<Math.max(1,Math.floor(w/28));n++){const px=5+n*28;r(px,4,24,h-9,wood.base);r(px+3,7,18,h-15,'#967044');r(px+10,8,4,2,'#ddc286');}
  r(0,-7,w,11,wood.dark);r(1,-8,w-2,9,kind==='counter'?'#b9c3ae':wood.base);r(2,-8,w-4,2,kind==='counter'?'#e4e2c5':wood.light);r(4,h-2,w-8,3,'#493e31');
 }else if(kind==='bed'){
  r(1,-9,w-2,h+10,wood.dark);r(3,-8,w-6,12,wood.base);r(5,-7,w-10,3,wood.light);r(5,5,w-10,h-10,'#314e59');r(7,4,w-14,h-15,'#6a9193');
  r(8,7,w-16,22,'#e9dec0');r(11,9,w-22,15,'#f5ebcf');r(7,34,w-14,h-44,'#638680');r(9,35,w-18,3,'#91aaa0');r(7,h-15,w-14,6,'#d1b87f');r(2,h-5,w-4,7,wood.side);feet();
 }else if(kind==='sink'){
  r(0,-7,w,h+6,'#536d6d');r(1,-8,w-2,h,'#b4c5b8');r(4,-5,w-8,h-9,'#688c8d');r(6,-4,w-12,h-13,'#3c5b63');r(7,-3,w-14,2,'#95bab0');r(w/2-2,-12,4,12,'#e4dfbf');r(w/2-1,-13,7,3,'#c4c9b2');
 }else if(kind==='stove'){
  r(0,-7,w,h+8,'#2a3b3b');r(2,-8,w-4,h-1,'#a8b6a8');for(const px of [w*.27,w*.73])for(const py of [h*.05,h*.48]){r(px-5,py-5,10,8,'#344847');r(px-3,py-4,6,5,'#6f8980');r(px-1,py-3,2,3,'#273c3b');}r(3,h-9,w-6,8,'#455d59');for(const px of [w*.25,w*.5,w*.75])r(px,h-7,3,3,'#d9c8a0');
 }else if(kind==='plant'){
  r(w*.3,h*.55,w*.4,h*.4,'#644936');r(w*.28,h*.52,w*.44,4,'#b08452');r(w*.34,h*.58,3,h*.28,'#ccac73');
  for(const [dx,dy]of [[-.2,.2],[.08,.08],[-.1,-.1],[.2,.29]]){r(w*(.43+dx),h*(.3+dy)-8,w*.24,10,'#315b42');r(w*(.43+dx),h*(.3+dy)-9,w*.18,5,'#729351');}r(w*.49,h*.24,2,h*.35,'#587341');
 }else if(kind==='mailbox'){
  r(w*.43,h*.6,5,h*.65,'#68563d');r(w*.43,h*.62,2,h*.6,'#b49b6c');r(0,-6,w,h*.82,'#2b4749');r(2,-7,w-4,h*.72,'#6c9794');r(4,-6,w-8,2,'#adc2af');r(3,h*.37,w-6,2,'#334e4d');r(w-3,-5,3,15,'#9c4937');r(w,-5,8,5,'#d28657');
 }
 c.restore();return true;
}
export function drawFurnitureContact(c,f){
 if(f.destroyed||['rug','plant','ceiling_light'].includes(f.kind))return;
 c.save();c.fillStyle='#152c2a45';
 for(const px of [f.x+2,f.x+f.w-7])c.fillRect(px,f.y+f.h-1,7,3);
 c.fillStyle='#152c2a20';c.fillRect(f.x+5,f.y+f.h-2,Math.max(2,f.w-10),4);c.restore();
}
