import {drawRefinedFurniture,drawFurnitureContact} from './furniture-art.mjs';
import {visibleSurfaceItems,drawSurfaceProp} from './house-surfaces.mjs';
import {drawBiomeSprite} from './biome-sprites.mjs';
export function drawHouseCar(c,v,game){const {x,y,w=96,h=144,heading=0}=v,night=game?.nightCycle?.phase==='night'||game?.night?.phase==='night',blink=v.steer<-.35?'left':v.steer>.35?'right':null;c.save();c.globalAlpha=Math.max(.18,1-(v.sink||0)*.75);c.translate(x,y);c.rotate(heading);c.fillStyle='#132b2a66';c.fillRect(-w*.45,8,w*.9,h*.5);c.fillStyle='#29383d';c.fillRect(-w*.42,-h*.5,w*.84,h);c.fillStyle='#6d8790';c.fillRect(-w*.3,-h*.36,w*.6,h*.25);c.fillStyle='#9fc2bc';c.fillRect(-w*.24,-h*.31,w*.48,h*.14);c.fillStyle='#b7624d';c.fillRect(-w*.33,h*.04,w*.66,h*.25);c.fillStyle='#e0b86b';for(const yy of [-h*.38,h*.29]){c.fillRect(-w*.48,yy,6,16);c.fillRect(w*.42,yy,6,16);}c.fillStyle='#263b42';for(const side of [-1,1]){c.fillRect(side*w*.42,-h*.20,6,28);c.fillRect(side*w*.42,h*.06,6,28);}c.strokeStyle='#e4c985';c.lineWidth=3;c.strokeRect(-w*.42,-h*.5,w*.84,h);for(const side of [-1,1]){c.fillStyle=night?'#fff0a6':'#c9d5bd';c.fillRect(side*w*.27,-h*.48,12,7);c.fillStyle=(v.braking||v.reverse)?'#ff594c':'#8d302f';c.fillRect(side*w*.27,h*.40,12,7);}if(blink&&((game?.time||0)*4%2<1)){c.fillStyle='#ffd36d';c.fillRect(blink==='left'?-w*.48:w*.42,-h*.12,7,7);}if(night){c.globalAlpha=.18;const beam=v.speed<0?Math.PI:0;c.fillStyle='#fff0a6';c.beginPath();c.moveTo(-w*.24,-h*.5);c.lineTo(-w*1.3,-h*1.3);c.lineTo(w*1.3,-h*1.3);c.closePath();c.fill();if(Math.abs(v.speed||0)>20){c.globalAlpha=.12;c.fillRect(-w*.12,-h*.75,w*.24,22);}c.globalAlpha=1;}const seats=v.seats||{};for(const s of Object.values(seats)){if(!s)continue;c.fillStyle='#d8e6af';c.fillRect(-3,-3,6,6);}c.restore();}
export function drawVehicleEffects(c,v){const e=v.effects;if(!e)return;c.save();for(const t of e.tracks||[]){c.globalAlpha=Math.min(.38,t.life/3);c.strokeStyle=t.skid?'#292b29':'#4b453a';c.lineWidth=t.skid?3:2;c.translate(t.x,t.y);c.rotate(t.angle);c.fillRect(-5,-1,10,2);c.setTransform(1,0,0,1,0,0);}for(const s of e.splashes||[]){c.globalAlpha=s.life/.6*.55;c.strokeStyle='#b7e7de';c.lineWidth=2;c.beginPath();c.arc(s.x,s.y,10+(1-s.life/.6)*18,0,Math.PI*2);c.stroke();}c.restore();}
export function drawVehicleWheels(c,v){const w=v.w||96,h=v.h||144,a=v.heading||0,steer=v.wheelAngle||0;c.save();c.translate(v.x,v.y);c.rotate(a);for(const side of [-1,1]){for(const y of [-h*.3,h*.28]){c.save();c.translate(side*w*.5,y);if(y<0)c.rotate(steer);c.fillStyle='#151d20';c.fillRect(-5,-13,10,26);c.fillStyle='#9da6a0';c.fillRect(-2,-8,4,16);c.fillStyle='#303a3c';c.fillRect(-1,-6,2,12);c.restore();}}c.restore();}
export function drawVehicleHood(c,v,game){if(!v.hoodOpen)return;const w=v.w||96,h=v.h||144;c.save();c.translate(v.x,v.y);c.rotate(v.heading||0);c.fillStyle='#1a2524';c.fillRect(-w*.34,-h*.62,w*.68,h*.2);c.fillStyle='#5f7374';c.fillRect(-w*.3,-h*.6,w*.6,h*.16);c.strokeStyle='#d3b36d';c.strokeRect(-w*.3,-h*.6,w*.6,h*.16);c.fillStyle='#202a2b';c.fillRect(-w*.2,-h*.48,w*.4,h*.22);c.fillStyle=v.enginePartInstalled?'#c48a45':'#6d7674';c.fillRect(-w*.12,-h*.45,w*.24,h*.14);if(v.enginePartInstalled){c.fillStyle='#e2bd55';c.fillRect(-w*.04,-h*.47,Math.sin((game?.time||0)*10)*4+8,4);}else{c.fillStyle='#d8d0a0';c.fillRect(-w*.04,-h*.45,8,3);c.fillStyle='#c76b55';c.fillRect(w*.06,-h*.42,8,3);}c.restore();}
export function drawWindow(c,w){
 const {x,y,w:width,h}=w;c.fillStyle='#364951';c.fillRect(x,y,width,h);
 c.fillStyle='#6b5237';c.fillRect(x-1,y-1,width+2,h+2);c.fillStyle='#d1bb87';c.fillRect(x,y,width,h);
 c.strokeStyle='#c0b68f';c.lineWidth=3;c.strokeRect(x+1,y+1,width-2,h-2);
 if(!w.broken){c.fillStyle='#518995';c.fillRect(x+3,y+3,width-6,h-6);c.fillStyle='#9cd0cc';c.fillRect(x+4,y+4,width-8,Math.max(2,(h-8)/2));c.strokeStyle='#dbf7ec';c.lineWidth=2;c.beginPath();c.moveTo(x+5,y+h-5);c.lineTo(x+width-5,y+5);c.stroke();c.fillStyle='#756042';if(width>h)c.fillRect(x+width/2-1,y+2,2,h-4);else c.fillRect(x+2,y+h/2-1,width-4,2);c.fillStyle='#ebd49b';c.fillRect(x+1,y+1,width-2,1);}
 else {c.fillStyle='#b3e0df';for(let i=0;i<4;i++){const px=x+4+(width-8)*i/4,py=y+4;c.beginPath();c.moveTo(px,py);c.lineTo(px+4,py);c.lineTo(px+2,py+5);c.fill();}}
}
function paintFurniture(c,f){
 if(drawRefinedFurniture(c,f))return;
 if(['lamp','ceiling_light'].includes(f.kind)){c.save();const x=f.x+f.w/2,y=f.y+f.h/2;c.fillStyle='#493d2e';c.fillRect(x-6,y+2,12,5);c.fillStyle='#ad8a50';c.fillRect(x-2,y-10,4,16);c.fillStyle='#d5c08c';c.fillRect(x-9,y-15,18,10);c.fillStyle='#eddbab';c.fillRect(x-7,y-14,14,2);c.restore();return;}
 if(f.kind==='garage_button'){c.save();c.fillStyle='#263b38';c.fillRect(f.x,f.y,f.w,f.h);c.fillStyle='#d66a55';c.fillRect(f.x+4,f.y+4,f.w-8,f.h-8);c.fillStyle='#f3d889';c.fillRect(f.x+6,f.y+5,3,3);c.restore();return;}
 if(f.kind==='chest'){c.save();c.fillStyle='#0005';c.fillRect(f.x+3,f.y+5,f.w,f.h);c.fillStyle='#895d38';c.fillRect(f.x,f.y,f.w,f.h);c.fillStyle='#bc8b53';c.fillRect(f.x+3,f.y+3,f.w-6,f.h*.42);c.fillStyle='#d6b36d';c.fillRect(f.x+f.w/2-3,f.y+f.h*.42,6,6);c.strokeStyle='#e2c47d';c.strokeRect(f.x+2,f.y+2,f.w-4,f.h-4);if(f.opened){c.fillStyle='#30251d';c.fillRect(f.x+3,f.y+4,f.w-6,f.h*.22);}c.restore();return;}
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

export function drawFurniture(c,f,g={}){
 drawFurnitureContact(c,f);paintFurniture(c,f);
 for(const item of visibleSurfaceItems(g,f))drawSurfaceProp(c,item,f.x+f.w*(item.u??.5),f.y+f.h*(item.v??.5)-8);
}
