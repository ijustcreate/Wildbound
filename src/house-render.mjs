export function drawFurniture(c,f){
 const {x,y,w,h,kind}=f;c.save();c.translate(x,y);
 c.fillStyle='#0005';if(kind!=='rug')c.fillRect(3,5,w,h);
 c.fillStyle=({sofa:'#49766d',bed:'#577b91',rug:'#934e43',plant:'#38764b',sink:'#aabec0',stove:'#41454d',mailbox:'#567e84'}[kind]||'#895f3c');c.fillRect(0,0,w,h);
 c.strokeStyle=kind==='rug'?'#d5ac74':'#d6bc8270';c.lineWidth=2;c.strokeRect(3,3,w-6,h-6);
 if(kind==='bed'){c.fillStyle='#f0e7cf';c.fillRect(7,7,w-14,24);c.fillStyle='#9cb4b5';c.fillRect(6,40,w-12,5);}
 if(kind==='sofa'){c.fillStyle='#89a28a';c.fillRect(4,4,9,h-8);for(let i=18;i<h;i+=32)c.fillRect(15,i,w-20,2);}
 if(kind==='bookcase'){for(let j=6;j<h-10;j+=22){for(let i=6;i<w-7;i+=7){c.fillStyle=['#d6b874','#8e5143','#617d71'][Math.floor(i/7)%3];c.fillRect(i,j,5,16);}c.fillStyle='#d3a973';c.fillRect(2,j+17,w-4,3);}}
 if(kind==='stove'){c.fillStyle='#151e25';for(const px of [12,w-12])for(const py of [9,h-9]){c.beginPath();c.arc(px,py,5,0,Math.PI*2);c.fill();}}
 if(kind==='sink'){c.fillStyle='#455e68';c.fillRect(8,6,w-16,h-12);c.fillStyle='#e4ddc4';c.fillRect(w/2-2,0,4,12);}
 if(kind==='plant'){c.fillStyle='#a27548';c.fillRect(w*.3,h*.65,w*.4,h*.35);c.fillStyle='#6d9d54';for(const dx of [-6,6]){c.beginPath();c.ellipse(w/2+dx,h/2,9,12,dx/10,0,7);c.fill();}}
 if(kind==='mailbox'){c.fillStyle='#bca782';c.fillRect(w/2-3,h,6,16);c.fillStyle='#d66748';c.fillRect(w-3,0,3,18);c.fillRect(w,0,9,7);}
 c.restore();
}
