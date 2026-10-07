// Seeded, allocation-free ember trails stay in the torch's animated local space.
export function drawTorchFlame(c,x,y,time,seed=0){
  c.save();c.translate(x,y);
  const pulse=1+Math.sin(time*13+seed)*.12;
  const glow=c.createRadialGradient(0,-1,0,0,-1,7);glow.addColorStop(0,'#ffad5555');glow.addColorStop(1,'#ff7b1800');c.fillStyle=glow;c.fillRect(-7,-8,14,14);
  for(let i=0;i<12;i++){
    const age=(time*(.8+i%3*.11)+i*.618+seed*.13)%1;
    const x=Math.sin(i*7.7+age*4)*(.5+age*1.8),y=-age*8;
    c.globalAlpha=(1-age)*(i<7?.85:.55);c.fillStyle=age<.3?'#fff0a4':age<.65?'#ffb342':'#f16c2f';
    const size=(i<7?1.7: .7)*(1-age*.65)*pulse;c.fillRect(x-size/2,y-size/2,size,size);
  }
  c.globalAlpha=.95;c.fillStyle='#fff3b2';c.fillRect(-.6,-1,1.2,1.7);c.restore();
}
