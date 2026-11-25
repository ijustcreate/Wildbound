import {bridgeAt} from './terrain-support.mjs';

export const BRIDGE_OVER_SWIMMER_ALPHA=.28;

export function isBelowBridge(player){
  return player.underBridge&&player.hp>0&&!player.room&&!player.vehicleId&&!player.trainRide&&!(player.jumpHeight>0);
}

export function drawBridgeReveal(c,bounds,players,draw){
  const rx=38,ry=34;
  const below=players.map(p=>({x:p.x,y:p.y-14})).filter(p=>p.x+rx>bounds.left&&p.x-rx<bounds.right&&p.y+ry>bounds.top&&p.y-ry<bounds.bottom);
  if(!below.length){draw(bounds);return;}
  const window=p=>{c.moveTo(p.x+rx,p.y);c.ellipse(p.x,p.y,rx,ry,0,0,Math.PI*2);};
  c.save();
  for(const p of below){
    c.beginPath();c.rect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top);
    window(p);c.clip('evenodd');
  }
  draw(bounds);c.restore();
  c.save();c.beginPath();below.forEach(window);c.clip();c.globalAlpha*=BRIDGE_OVER_SWIMMER_ALPHA;
  draw({left:Math.max(bounds.left,Math.min(...below.map(p=>p.x-rx))),top:Math.max(bounds.top,Math.min(...below.map(p=>p.y-ry))),
    right:Math.min(bounds.right,Math.max(...below.map(p=>p.x+rx))),bottom:Math.min(bounds.bottom,Math.max(...below.map(p=>p.y+ry)))});
  c.restore();
}

export function drawBridges(c,g,aboveSwimmers=false,bounds={sx:0,sy:0,ex:50,ey:50}){
  const {sx,sy,ex,ey}=bounds;
  const swimmers=g.players.filter(isBelowBridge);
  for(let ty=sy;ty<ey;ty++)for(let tx=sx;tx<ex;tx++){
    const x=tx*32,y=ty*32;if(!bridgeAt(g,x,y))continue;
    const overSwimmer=swimmers.some(p=>p.x>=x-12&&p.x<x+44&&p.y>=y-12&&p.y<y+44);
    if(overSwimmer!==aboveSwimmers)continue;
    const north=bridgeAt(g,x,y-32),south=bridgeAt(g,x,y+32),west=bridgeAt(g,x-32,y),east=bridgeAt(g,x+32,y);
    c.save();if(overSwimmer)c.globalAlpha*=BRIDGE_OVER_SWIMMER_ALPHA;
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
