import {bridgeAt} from './terrain-support.mjs';
export function drawBridges(c,g,aboveSwimmers=false){
  for(let ty=0;ty<50;ty++)for(let tx=0;tx<50;tx++){
    const x=tx*32,y=ty*32;if(!bridgeAt(g,x,y))continue;
    const hidden=g.players.some(p=>!p.room&&p.underBridge&&p.x>=x-12&&p.x<x+44&&p.y>=y-12&&p.y<y+44);
    if(hidden!==aboveSwimmers)continue;
    c.save();c.globalAlpha=hidden?.28:1;c.fillStyle='#342e24';c.fillRect(x,y-8,32,28);c.fillStyle='#9d8053';c.fillRect(x,y-10,32,27);
    c.fillStyle='#594731';for(let n=0;n<32;n+=6)c.fillRect(x+n,y-10,1,27);
    c.fillStyle='#c2a779';c.fillRect(x,y-10,32,2);c.fillStyle='#594731';c.fillRect(x,y+15,32,3);c.restore();
  }
}
