// A separate native pixel prop, used both on the floor and between rig hands.
export function drawLobbyController(c,x,y,slot=0,width=24,height=12){
  x=Math.round(x-width/2);y=Math.round(y-height/2);
  c.fillStyle='#30382f';c.fillRect(x-1,y,width+2,height);
  c.fillStyle='#d9d1b5';c.fillRect(x,y,width,height);c.fillRect(x+3,y-2,width-6,height+4);
  c.fillStyle='#f0e5c9';c.fillRect(x+3,y-2,width-6,2);
  c.fillStyle='#464b40';c.fillRect(x+3,y+height/2-1,6,2);c.fillRect(x+5,y+height/2-3,2,6);
  c.fillStyle=slot?'#557ca2':'#b35549';c.fillRect(x+width-8,y+2,3,3);c.fillRect(x+width-5,y+5,3,3);
}
