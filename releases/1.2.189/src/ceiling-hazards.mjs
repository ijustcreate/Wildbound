const triggerRadius=42,impactRadius=24,fallSeconds=.35;
const distance=(player,spike)=>Math.hypot(player.x-spike.x,player.y-spike.rootY);
export const ceilingHazardTarget=p=>p.hp>0&&!p.room&&!p.ghost&&!p.spiritGhost;

export function tickCeilingHazards(g,hazards,dt,players){
 for(const p of hazards){
  if(p.hazardState==='spent')continue;
  if(!p.hazardState||p.hazardState==='idle'){
   if(!players.some(a=>ceilingHazardTarget(a)&&distance(a,p)<triggerRadius))continue;
   p.hazardState='warning';p.hazardTime=0;g.onSound?.('mine',p);
  }
  p.hazardTime=(p.hazardTime||0)+Math.min(dt,.1);
  if(p.hazardTime<(p.warning||1.6)+fallSeconds)continue;
  p.hazardState='spent';
  for(const a of players)if(ceilingHazardTarget(a)&&distance(a,p)<impactRadius)g.hurt?.(a,p.damage||5,{x:p.x,y:p.rootY,kind:'falling_stone'});
  g.persist?.();
 }
}

export function drawCeilingHazard(c,p,drawFalling,grain){
 if(p.hazardState!=='warning')return;
 const t=p.hazardTime||0,w=p.warning||1.6,progress=Math.min(1,t/w);
 c.fillStyle='#090b16aa';c.beginPath();c.ellipse(p.x,p.rootY,8+progress*15,5+progress*7,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#d7c9a1';c.lineWidth=2;c.stroke();
 for(let i=0;i<9;i++){
  const fall=(t*44+i*9)%60;
  c.fillStyle=i%2?'#c0bba777':'#e3d8adbb';c.fillRect(p.x-16+grain(i,p.x)*32,p.rootY-65+fall,2,3);
 }
 if(t>w)drawFalling(p.x,p.rootY-100+(t-w)/fallSeconds*100);
}
