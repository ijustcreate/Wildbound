import {meadowAllowed} from './pixel-meadow.mjs';
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
export function drawShadowPropContacts(c,g,{sx,sy,ex,ey}){
 if(g.generatedEnvironment!=='shadow')return 0;let count=0;c.save();
 for(const p of g.scenery||[]){const y=p.rootY??p.y+p.size*.19;if(p.distant||p.depleted||p.falling||p.x<sx*32-60||p.x>(ex+1)*32+60||y<sy*32-20||y>(ey+1)*32+30||!meadowAllowed(g,p.x,y+5))continue;
  const width=Math.min(40,p.size*.28);c.globalAlpha=.78;
  for(let i=0;i<9;i++){const h=hash(p.x+i,y),x=p.x+(i/8-.5)*width*2,root=y+2+h*5;if(!meadowAllowed(g,x,root))continue;const height=4+h*8,sway=Math.sin((g.time||0)*1.2+x*.01)*2;c.fillStyle=i%3?'#64506f':'#887195';c.beginPath();c.moveTo(Math.round(x-1),Math.round(root));c.lineTo(Math.round(x+sway),Math.round(root-height));c.lineTo(Math.round(x+2),Math.round(root));c.closePath();c.fill();}
  count++;
 }c.restore();return count;
}
export function drawShadowLevelTint(c,g,{sx,sy,ex,ey}){
 if(g.generatedEnvironment!=='shadow')return false;
 c.save();c.globalCompositeOperation='multiply';c.globalAlpha=.17;c.fillStyle='#b5a0cf';c.fillRect(sx*32,sy*32,(ex-sx+1)*32,(ey-sy+1)*32);
 c.globalCompositeOperation='source-over';c.globalAlpha=.025;c.fillStyle='#735386';c.fillRect(sx*32,sy*32,(ex-sx+1)*32,(ey-sy+1)*32);c.restore();return true;
}
