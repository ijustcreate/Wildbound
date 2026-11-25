import {drawItem} from './item-art.mjs';
export function drawVendingCabinet(c,stock=[],time=0){
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 r(8,8,344,500,'#111e23');r(16,8,328,490,'#31585c');r(16,8,328,7,'#81a69b');r(333,18,11,471,'#203b46');
 r(22,18,308,28,'#132c31');r(26,21,300,3,'#718c80');
 c.font='bold 17px monospace';c.textAlign='center';c.fillStyle='#e6dcad';c.fillText('BETWEEN • MART',176,40);
 r(26,54,277,345,'#0c1b24');r(30,58,269,336,'#162e36');
 for(let row=0;row<4;row++)for(let col=0;col<3;col++){
  const i=row*3+col,x=65+col*92,y=90+row*83;
  r(x-34,y-24,68,68,'#11232b');r(x-34,y+40,68,4,'#5b7b78');r(x-34,y+44,68,3,'#0a1920');
  if(stock[i]?.qty>0)drawItem(c,stock[i].type,x,y,30);
  c.fillStyle='#88a29a';c.font='9px monospace';c.fillText(String.fromCharCode(65+row)+(col+1),x,y+36);
 }
 // Beveled glass, a narrow reflection and a separate payment column.
 r(28,57,3,338,'#719d9c');r(31,59,265,2,'#9bbdb0');
 c.save();c.globalAlpha=.06;c.fillStyle='#b9f3e5';c.beginPath();c.moveTo(36,61);c.lineTo(78,61);c.lineTo(181,391);c.lineTo(143,391);c.fill();c.restore();
 r(310,58,25,226,'#142a30');r(314,64,17,34,'#528d81');r(316,67,13,22,'#a8dcc2');r(317,103,12,3,'#d9b66a');
 for(let i=0;i<9;i++){r(315+i%3*6,120+Math.floor(i/3)*10,4,6,'#718b87');r(315+i%3*6,120+Math.floor(i/3)*10,4,1,'#b7c8ad');}
 r(315,164,16,5,'#0a151e');r(318,178,10,14,'#9b8053');r(322,180,2,10,'#1c2c2d');
 r(26,406,304,10,'#977c50');r(29,407,298,2,'#d2b679');r(30,424,295,66,'#0b1920');r(36,430,283,45,'#10262c');r(36,477,283,6,'#38575b');r(30,490,295,5,'#73938a');
 for(let i=0;i<5;i++)r(310,302+i*9,20,3,'#172c33');
 for(const x of [24,322])r(x,498,13,14,'#101d22');
 const pulse=.65+.35*Math.sin(time*2);c.save();c.globalAlpha=pulse;r(316,206,5,3,'#a8dcc2');c.restore();
}
let roomCanvas;
export function drawRoomVending(c,x,y,time=0){
 if(!roomCanvas){roomCanvas=document.createElement('canvas');roomCanvas.width=360;roomCanvas.height=520;drawVendingCabinet(roomCanvas.getContext('2d'),[{type:'potion',qty:1},{type:'fruit',qty:1},{type:'stamina_potion',qty:1},{type:'arrow',qty:1},{type:'torch',qty:1},{type:'empty_jar',qty:1}]);}
 c.save();c.imageSmoothingEnabled=false;c.fillStyle='#09191766';c.beginPath();c.ellipse(x,y+1,17,5,0,0,Math.PI*2);c.fill();c.drawImage(roomCanvas,x-16,y-44,32,46);c.restore();
}
