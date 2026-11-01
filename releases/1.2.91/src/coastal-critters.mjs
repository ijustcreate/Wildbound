import {waterAt} from './environment.mjs';
import {footprintHit,terrainHash} from './world.mjs';
import {nearbyScenery} from './performance.mjs';
import {beachShore} from './beach-world.mjs';

export function coastalHabitat(g,kind,x,y){
  if(x<40||x>1560||y<40||y>1560)return false;
  const surface=waterAt(g,x,y);
  if(kind==='fish'){
    if(surface!=='water'||![[8,0],[-8,0],[0,8],[0,-8]].every(([dx,dy])=>waterAt(g,x+dx,y+dy)==='water'))return false;
  }else if(g.generatedEnvironment==='beach'){
    if(!['sand','shallow'].includes(surface)||Math.abs(y-beachShore(x,g.seed))>115)return false;
  }else if(['water','quicksand'].includes(surface))return false;
  return !nearbyScenery(g.scenery||[],x,y,12).some(p=>!p.depleted&&!p.falling&&footprintHit(p,g.spriteLibrary?.[p.kind],x,y,4));
}
export function seedCoastalCritters(g,limit=18){
  const sites={crab:[],fish:[]},animals=[];
  for(let ty=1;ty<20;ty++)for(let tx=1;tx<49;tx++){
    const x=tx*32+16,y=ty*32+16;
    for(const kind of ['crab','fish'])if(coastalHabitat(g,kind,x,y))sites[kind].push({x,y});
  }
  for(const [kind,n] of [['crab',10],['fish',8]]){
    const available=sites[kind];if(!available.length)continue;
    const offset=Math.floor(terrainHash(g.seed,kind==='crab'?23:37)*available.length);
    for(let i=0;i<n&&animals.length<limit;i++){
      const start=(offset+Math.floor(i*available.length/n))%available.length;
      const spot=Array.from({length:available.length},(_,j)=>available[(start+j)%available.length]).find(s=>!animals.some(a=>Math.hypot(a.x-s.x,a.y-s.y)<42));
      if(!spot)continue;
      animals.push({...spot,id:animals.length,kind,homeX:spot.x,homeY:spot.y,phase:terrainHash(g.seed+i,83)*6.28,faceX:i%2?1:-1,variant:i%3});
    }
  }
  return animals;
}
export function tickCoastalCritter(g,a,dt,time,target){
  const threat=(g.players||[]).filter(p=>p.hp>0&&!p.room).map(p=>({p,d:Math.hypot(p.x-a.x,p.y+14-a.y)})).filter(v=>v.d<75).sort((x,y)=>x.d-y.d)[0];
  const t=time+a.phase;
  let dx=(target?.x??a.homeX)+Math.sin(t*.65)*36-a.x,dy=(target?.y??a.homeY)+Math.cos(t*.45)*18-a.y;
  if(threat&&!target){dx=a.x-threat.p.x;dy=a.y-(threat.p.y+14);}
  const length=Math.hypot(dx,dy)||1,step=Math.min(length,dt*(a.kind==='fish'?threat?42:23:threat?32:13));
  a.moving=false;
  for(const [mx,my] of [[dx/length*step,dy/length*step],[dx/length*step,0],[0,dy/length*step]]){
    const x=a.x+mx,y=a.y+my;
    if(Math.abs(mx)+Math.abs(my)<.001||!coastalHabitat(g,a.kind,x,y))continue;
    a.x=x;a.y=y;a.faceX=mx||a.faceX;a.moving=true;break;
  }
}
export function nearbyFishWater(g,p){
  const spots=[];
  for(let dy=-64;dy<=64;dy+=16)for(let dx=-64;dx<=64;dx+=16){const x=p.x+dx,y=p.y+14+dy;if(Math.hypot(dx,dy)<=64&&coastalHabitat(g,'fish',x,y))spots.push({x,y,d:Math.hypot(dx,dy)});}
  return spots.sort((a,b)=>a.d-b.d)[0];
}
export function drawCoastalCritter(c,a,time){
  c.save();c.translate(Math.round(a.x),Math.round(a.y));
  const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const phase=time*(a.moving?15:3)+(a.phase||0),stride=Math.sin(phase)>0?1:-1;
  if(a.kind==='fish'){
    if(a.faceX<0)c.scale(-1,1);
    c.globalAlpha=.82;const colors=[['#368baf','#8bd7e6'],['#ce8559','#f8ca86'],['#5c95ac','#a0e1d6']],colorset=colors[a.variant||0];
    r(-9,2,17,2,'#072c4244');r(-6,-3,11,6,'#1b526c');r(-5,-2,9,4,colorset[0]);r(-3,-2,6,2,colorset[1]);
    r(-10,-3+stride,3,6,colorset[0]);r(-7,-1,2,2,colorset[1]);r(-1,-5,3,2,'#e0d292');r(-2,3,3,2,'#e0d292');
    r(3,-1,2,2,'#173444');r(3,-1,1,1,'#fff3c2');r(-1,-1,1,3,'#31748c');
  }else{
    r(-7,2,14,3,'#203d3a44');const colors=['#d77748','#ce9663','#c55948'],color=colors[a.variant||0];
    for(const side of [-1,1])for(let i=0;i<3;i++){const y=-1+i*2,step=i%2?stride:-stride;r(side<0?-8:-1,y,9,1,'#783e35');r(side<0?-9:7,y+step,2,2,color);}
    r(-6,-3,12,6,'#7c4132');r(-5,-3,10,5,color);r(-3,-3,6,2,'#f4ba75');
    r(-9,-7+stride,3,5,color);r(7,-7-stride,3,5,color);r(-11,-8+stride,4,2,'#f4b47c');r(8,-8-stride,4,2,'#f4b47c');
    r(-4,-6,2,3,'#a4553f');r(2,-6,2,3,'#a4553f');r(-4,-7,2,2,'#f7dfa2');r(2,-7,2,2,'#f7dfa2');r(-3,-7,1,1,'#243937');r(2,-7,1,1,'#243937');
  }
  c.restore();
}
