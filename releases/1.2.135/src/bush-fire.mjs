import {nearbyScenery} from './performance.mjs';

const BURN_SECONDS=1.45,SMOKE_SECONDS=2.8;

export function igniteBushAt(g,x,y,radius=0){
 let nearest=null,best=Infinity;
 for(const prop of nearbyScenery(g.scenery||[],x,y,40+radius)){
  if((prop.kind!=='bush'&&!prop.forestAsset?.startsWith('forest_round_shrub_'))||prop.depleted||prop.destroyed||Number.isFinite(prop.bushBurnAt))continue;
  const size=prop.size||40,root=prop.rootY??prop.y+size*.19;
  const dx=(x-prop.x)/(size*.33+radius),dy=(y-root+size*.12)/(size*.26+radius);
  const distance=dx*dx+dy*dy;
  if(distance<=1&&distance<best){nearest=prop;best=distance;}
 }
 if(!nearest)return false;
 nearest.bushBurnAt=g.time||0;
 g.persist?.();
 return true;
}

export function drawBushFire(c,prop,time,paint){
 if(!Number.isFinite(prop.bushBurnAt))return false;
 const age=Math.max(0,time-prop.bushBurnAt),size=prop.size||40;
 const x=prop.x,y=prop.rootY??prop.y+size*.19,scale=Math.max(.55,Math.min(1.5,size/40));
 const seed=Math.floor(x*4+y*7),random=i=>{const n=Math.sin(seed*.017+i*12.37)*15731.743;return n-Math.floor(n);};
 const fill=(dx,dy,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x+dx*scale),Math.round(y+dy*scale),Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale)));};
 for(let row=-6;row<=6;row+=2){
  const width=17-Math.abs(row)*1.25+Math.floor(random(row+15)*3);
  fill(-width,row,width*2,2,row%4===0?'#3d3c2d':'#414a32');
 }
 for(let i=0;i<11;i++){
  const dx=(random(i)-.5)*32,dy=(random(i+17)-.5)*13;
  fill(dx,dy,2+i%2,1,i%3===0?'#80704b':'#615038');
 }
 for(const [dx,dy] of [[-6,-4],[1,-5],[7,-2]]){fill(dx,dy,2,5,'#45382c');fill(dx,dy,1,2,'#6e5536');}
 if(age<BURN_SECONDS){
  const burn=age/BURN_SECONDS;
  c.save();c.globalAlpha*=1-burn;paint();c.restore();
  const strength=(1-burn)*(Math.min(1,age*18));
  for(let i=0;i<3;i++){
   const rise=Math.max(1,Math.round((9+5*Math.sin(time*19+i+seed))*strength)),dx=(i-1)*6;
   fill(dx-2,-rise,4,rise,'#a54f32');fill(dx-1,-rise+2,2,Math.max(1,rise-2),'#ffc268');
   if(rise>4)fill(dx,-rise-2,1,2,'#ffe39a');
  }
 }
 if(age<SMOKE_SECONDS){
  c.save();const alpha=c.globalAlpha;
  for(let i=0;i<4;i++){
   const progress=(age-i*.14)/1.9;
   if(progress<0||progress>=1)continue;
   c.globalAlpha=alpha*.32*Math.min(1,progress*8)*(1-progress);
   fill(Math.sin(i+progress*3)*4+progress*7,-5-progress*25,3+progress*5,2+progress*3,'#8b9183');
  }
  c.restore();
 }
 return true;
}
