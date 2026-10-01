const hash=n=>{const x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x);};
const sprites=new Map();
export const FERN_SIZE=32;
export function tickFern(p,players,dt){
  let tx=0,ty=0;
  for(const actor of players){
    if(!actor.moving||actor.room||actor.hp<=0||actor.jumpHeight>6)continue;
    const dx=p.x-actor.x,dy=p.y-actor.y;
    if(dx*dx+dy*dy<225){const d=Math.hypot(dx,dy),strength=(1-d/15)*4;tx+=(dx/(d||1)+(actor.faceX||0)*.35)*strength;ty+=(dy/(d||1)+(actor.faceY||0)*.35)*strength;}
  }
  if(!tx&&!ty&&Math.abs(p.fernX||0)+Math.abs(p.fernY||0)+Math.abs(p.fernVX||0)+Math.abs(p.fernVY||0)<.01){
    p.fernX=p.fernY=p.fernVX=p.fernVY=0;return;
  }
  // Damped spring lets the fronds return naturally after the player passes.
  p.fernVX=((p.fernVX||0)+(tx-(p.fernX||0))*65*dt)*Math.exp(-dt*8);
  p.fernVY=((p.fernVY||0)+(ty-(p.fernY||0))*65*dt)*Math.exp(-dt*8);
  p.fernX=Math.max(-13,Math.min(13,(p.fernX||0)+p.fernVX*dt));
  p.fernY=Math.max(-10,Math.min(10,(p.fernY||0)+p.fernVY*dt));
}
export function drawJungleFern(c,p,time=0){
  // Eight shared, half-size silhouettes: no leaf geometry in the frame loop.
  const variant=Math.abs(Math.floor(p.seed||0))%8;
  let sprite=sprites.get(variant);
  if(!sprite){
    if(typeof document==='undefined')return;
    sprite=document.createElement('canvas');sprite.width=sprite.height=FERN_SIZE;
    const context=sprite.getContext('2d');context.translate(16,20);context.scale(.5,.5);
    paintFern(context,{x:0,y:0,seed:variant*137});sprites.set(variant,sprite);
  }
  const bend=(p.fernX||0)+Math.sin(time*1.7+(p.seed||0))*.4;
  c.save();c.imageSmoothingEnabled=false;
  c.translate(Math.round(p.x),Math.round(p.y));
  c.transform(1,0,-bend/20,1-(p.fernY||0)/40,0,0);
  c.drawImage(sprite,-16,-20);c.restore();
}
function paintFern(c,p,time=0){
  const pixel=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
  const seed=p.seed||0;
  for(let i=0;i<7;i++){
    const angle=i*Math.PI*2/7+hash(seed)*.7,length=17+hash(seed+i)*11;
    const dx=Math.cos(angle)*length,dy=Math.sin(angle)*length*.48;
    const sway=Math.sin(time*1.7+seed+i*.6)*1.2;
    for(let n=1;n<=9;n++){
      const t=n/9,x=p.x+dx*t+(sway+(p.fernX||0))*t*t;
      const y=p.y+dy*t-10*Math.sin(t*Math.PI)+(p.fernY||0)*t*t;
      const width=Math.sin(t*Math.PI)*5;
      pixel(x,y,2,2,'#28513b');
      for(const side of [-1,1]){
        const nx=-Math.sin(angle)*side,ny=Math.cos(angle)*side*.55;
        for(let k=1;k<=width;k+=1.5)pixel(x+nx*k-dx*.035,y+ny*k+1,3,2,side<0?'#548c47':'#387442');
      }
      pixel(x,y-1,1,1,i%2?'#9bbb63':'#77a657');
    }
  }
  pixel(p.x-2,p.y-1,4,3,'#486b38');
}
