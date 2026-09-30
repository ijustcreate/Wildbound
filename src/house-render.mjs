import {drawBiomeSprite} from './biome-sprites.mjs';
export function drawWindow(c,w){
 const {x,y,w:width,h}=w;c.fillStyle='#364951';c.fillRect(x,y,width,h);
 c.strokeStyle='#c0b68f';c.lineWidth=3;c.strokeRect(x+1,y+1,width-2,h-2);
 if(!w.broken){c.fillStyle='#80c4d2';c.fillRect(x+4,y+4,width-8,h-8);c.strokeStyle='#dbf7ec';c.lineWidth=2;c.beginPath();c.moveTo(x+5,y+h-5);c.lineTo(x+width-5,y+5);c.stroke();}
 else {c.fillStyle='#b3e0df';for(let i=0;i<4;i++){const px=x+4+(width-8)*i/4,py=y+4;c.beginPath();c.moveTo(px,py);c.lineTo(px+4,py);c.lineTo(px+2,py+5);c.fill();}}
}
export function drawFurniture(c,f){
 const {x,y,w,h,kind}=f;if(['bookcase','sofa','desk'].includes(kind)&&drawBiomeSprite(c,kind,x+w/2,y+h,w,h+12))return;c.save();c.translate(x,y);
 c.fillStyle='#0005';if(kind!=='rug')c.fillRect(3,5,w,h);
 c.fillStyle=({sofa:'#49766d',bed:'#577b91',rug:'#934e43',plant:'#38764b',sink:'#aabec0',stove:'#41454d',mailbox:'#567e84'}[kind]||'#895f3c');c.fillRect(0,0,w,h);
 c.strokeStyle=kind==='rug'?'#d5ac74':'#d6bc8270';c.lineWidth=2;c.strokeRect(3,3,w-6,h-6);
 if(kind==='bed'){c.fillStyle='#f0e7cf';c.fillRect(7,7,w-14,24);c.fillStyle='#9cb4b5';c.fillRect(6,40,w-12,5);}
 if(kind==='sofa'){c.fillStyle='#89a28a';c.fillRect(4,4,9,h-8);for(let i=18;i<h;i+=32)c.fillRect(15,i,w-20,2);}
 if(kind==='bookcase'){for(let j=6;j<h-10;j+=22){for(let i=6;i<w-7;i+=7){c.fillStyle=['#d6b874','#8e5143','#617d71'][Math.floor(i/7)%3];c.fillRect(i,j,5,16);}c.fillStyle='#d3a973';c.fillRect(2,j+17,w-4,3);}}
 if(kind==='bookcase'){for(let j=6;j<h-10;j+=22)for(let i=6;i<w-7;i+=7){c.fillStyle='#e5ce9355';c.fillRect(i+1,j+2,1,12);c.fillStyle='#e4bd74';c.fillRect(i,j+3,5,1);c.fillRect(i,j+12,5,1);}c.fillStyle='#3f2f26';c.fillRect(1,1,4,h-2);c.fillRect(w-5,1,4,h-2);}
 if(kind==='sofa'){for(const yy of [8,h-26]){c.fillStyle='#203f3b';c.fillRect(w*.35+2,yy+2,w*.4,18);c.fillStyle='#b8b68c';c.fillRect(w*.35,yy,w*.4,18);c.fillStyle='#e2d5a6';c.fillRect(w*.35+2,yy+2,w*.4-4,2);c.fillStyle='#817c60';c.fillRect(w*.35+5,yy+8,3,3);}}
 if(kind==='desk'){c.fillStyle='#453b2c';c.fillRect(w*.2+2,h*.3+2,w*.45,h*.4);c.fillStyle='#d4c797';c.fillRect(w*.2,h*.3,w*.45,h*.4);c.fillStyle='#8b886a';for(let n=0;n<3;n++)c.fillRect(w*.24,h*.36+n*4,w*.3-n*2,1);c.fillStyle='#294c45';c.fillRect(w*.74,h*.4,6,7);c.fillStyle='#dfd4a4';c.fillRect(w*.74+3,h*.4-7,2,10);}
 if(kind==='stove'){c.fillStyle='#151e25';for(const px of [12,w-12])for(const py of [9,h-9]){c.beginPath();c.arc(px,py,5,0,Math.PI*2);c.fill();}}
 if(kind==='sink'){c.fillStyle='#455e68';c.fillRect(8,6,w-16,h-12);c.fillStyle='#e4ddc4';c.fillRect(w/2-2,0,4,12);}
 if(kind==='plant'){c.fillStyle='#a27548';c.fillRect(w*.3,h*.65,w*.4,h*.35);c.fillStyle='#6d9d54';for(const dx of [-6,6]){c.beginPath();c.ellipse(w/2+dx,h/2,9,12,dx/10,0,7);c.fill();}}
 if(kind==='mailbox'){c.fillStyle='#bca782';c.fillRect(w/2-3,h,6,16);c.fillStyle='#d66748';c.fillRect(w-3,0,3,18);c.fillRect(w,0,9,7);}

 // Bevels, upholstery and inlaid patterns share the same footprint as collision.
 if(kind==='rug'){c.strokeStyle='#d6b678';c.lineWidth=1;c.strokeRect(7,7,w-14,h-14);for(let yy=15;yy<h-10;yy+=16)for(let xx=15;xx<w-10;xx+=16){c.fillStyle='#bc8260';c.beginPath();c.moveTo(xx,yy-4);c.lineTo(xx+4,yy);c.lineTo(xx,yy+4);c.lineTo(xx-4,yy);c.fill();}}
 else if(kind!=='plant'){
 c.fillStyle='#f6d9a026';c.fillRect(2,1,w-4,3);c.fillStyle='#241f2877';c.fillRect(w-4,4,3,h-5);c.fillRect(3,h-4,w-6,3);
 if(['table','desk','counter','bench','chair'].includes(kind)){for(let yy=9;yy<h-4;yy+=9){c.fillStyle='#35271e44';c.fillRect(5,yy,w-10,1);c.fillStyle='#dcb78544';c.fillRect(6,yy+1,w-12,1);}for(const xx of [5,w-7])for(const yy of [5,h-7]){c.fillStyle='#d5bc83';c.fillRect(xx,yy,2,2);}}
 if(['sofa','bed'].includes(kind)){c.strokeStyle='#d5d9b755';c.lineWidth=1;c.strokeRect(8,8,w-16,h-16);for(let yy=18;yy<h-12;yy+=17){c.fillStyle='#183a4344';c.fillRect(w/2-1,yy,2,2);}}
 }
 c.restore();
}
