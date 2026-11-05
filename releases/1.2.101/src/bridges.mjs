import {bridgeAt} from './terrain-support.mjs';
export function drawBridges(c,g,aboveSwimmers=false,bounds={sx:0,sy:0,ex:50,ey:50}){
  const {sx,sy,ex,ey}=bounds;
  for(let ty=sy;ty<ey;ty++)for(let tx=sx;tx<ex;tx++){
    const x=tx*32,y=ty*32;if(!bridgeAt(g,x,y))continue;
    const hidden=g.players.some(p=>!p.room&&p.underBridge&&p.x>=x-12&&p.x<x+44&&p.y>=y-12&&p.y<y+44);
    if(hidden!==aboveSwimmers)continue;
    const north=bridgeAt(g,x,y-32),south=bridgeAt(g,x,y+32),west=bridgeAt(g,x-32,y),east=bridgeAt(g,x+32,y);
    c.save();c.globalAlpha*=hidden?.28:1;
    // Full-height decks meet the next row without the old five-pixel gap.
    c.fillStyle='#59432e';c.fillRect(x,y-10,32,32);
    for(let n=0;n<32;n+=8){
      c.fillStyle=(tx+ty+n/8)%3===0?'#a28a5e':'#8e754e';c.fillRect(x+n+1,y-9,7,31);
      c.fillStyle='#b9a174';c.fillRect(x+n+1,y-9,1,30);
      c.fillStyle='#6c553a';c.fillRect(x+n+3,y+3+(n%3)*3,3,1);
    }
    if(!north){c.fillStyle='#c0a878';c.fillRect(x,y-11,32,3);}
    if(!south){c.fillStyle='#493a2b';c.fillRect(x,y+22,32,4);}
    for(const [edge,side] of [[!west,-1],[!east,1]])if(edge){
      const bx=side<0?x-6:x+32;
      c.fillStyle='#786144';c.fillRect(bx,y-5,6,32);
      c.fillStyle='#ad9568';c.fillRect(bx,y-5,6,2);
    }
    if(!north||!south){c.fillStyle='#4d4434';for(const px of [x+3,x+27])c.fillRect(px,y+(!north?-6:18),2,2);}
    c.restore();
  }
}
