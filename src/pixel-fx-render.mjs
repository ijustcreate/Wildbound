const textures=new Map(),plans=new WeakMap(),TAU=Math.PI*2;
const chips=['#ffd76b','#89e8d3','#ee93d5','#a8bfff'];
// Each raster is generated once. 256 × 48² RGBA is a hard ~2.25 MiB ceiling.
export function pixelTexture(shape,color){
 const key=shape+color;if(textures.has(key))return textures.get(key);
 if(typeof document==='undefined')return null;
 const base=document.createElement('canvas');base.width=base.height=32;const c=base.getContext('2d');c.fillStyle=color;
 for(let y=0;y<32;y+=2)for(let x=0;x<32;x+=2){const dx=x-15,dy=y-15,r=Math.hypot(dx,dy);let on=false;
  switch(shape){
   case 'spark':on=(Math.abs(dx)<2&&Math.abs(dy)<14)||(Math.abs(dy)<2&&Math.abs(dx)<14)||(Math.abs(Math.abs(dx)-Math.abs(dy))<2&&r<11);break;
   case 'arc':on=r<14&&Math.hypot(dx-6,dy)>=11&&dx<9;break;
   case 'ring':on=r>11&&r<14;break;
   case 'rune':on=r>11&&r<14||(r>5&&r<9&&Math.abs(dx)+Math.abs(dy)<12)||(r<15&&r>9&&(Math.abs(dx)<2||Math.abs(dy)<2));break;
   case 'shard':on=Math.abs(dx)<Math.max(0,5-Math.abs(dy)*.32)&&Math.abs(dy)<15;break;
   case 'smoke':on=Math.hypot(dx+5,dy+2)<9||Math.hypot(dx-5,dy-3)<10||Math.hypot(dx-2,dy-8)<7;break;
   case 'flame':on=dy>0?r<11:Math.abs(dx-Math.sin(dy*.2)*3)<(14+dy)*.7;break;
   case 'heart':on=(dy<0&&(Math.hypot(dx-6,dy+5)<8||Math.hypot(dx+6,dy+5)<8))||(dy>=0&&Math.abs(dx)<12-dy);break;
   case 'plus':on=(Math.abs(dx)<4&&Math.abs(dy)<12)||(Math.abs(dy)<4&&Math.abs(dx)<12);break;
   case 'skull':on=(r<12&&dy<6||Math.abs(dx)<7&&dy>=6&&dy<12)&&!(dy<2&&dy>-6&&Math.abs(dx)>2&&Math.abs(dx)<8)&&!(dy>5&&Math.abs(dx)<2);break;
   case 'cube':on=(Math.abs(dx)>10&&Math.abs(dx)<13&&Math.abs(dy)<13)||(Math.abs(dy)>10&&Math.abs(dy)<13&&Math.abs(dx)<13)||(Math.abs(dx-dy)<2&&r<15);break;
   case 'leaf':on=Math.abs(dx)<6-Math.abs(dy)*.4&&Math.abs(dy)<14;break;
   case 'flake':on=(Math.abs(dx)<2||Math.abs(dy)<2||Math.abs(Math.abs(dx)-Math.abs(dy))<2)&&r<12;break;
   default:on=r<6;
  }
  if(on)c.fillRect(x,y,2,2);
 }
 c.globalCompositeOperation='source-atop';c.fillStyle='#ffffff70';c.fillRect(10,4,3,22);c.fillStyle='#ffffff';if(['spark','flame'].includes(shape))c.fillRect(14,12,4,6);
 const out=document.createElement('canvas');out.width=out.height=48;const o=out.getContext('2d');o.imageSmoothingEnabled=false;o.globalAlpha=.09;o.drawImage(base,2,2,44,44);o.globalAlpha=.15;o.drawImage(base,5,5,38,38);o.globalAlpha=1;o.drawImage(base,8,8);if(textures.size>=256)textures.delete(textures.keys().next().value);textures.set(key,out);return out;
}
export const pixelTextureStats=()=>({textures:textures.size,bytes:textures.size*48*48*4});
export function drawPixelFX(c,e,time,seed,stamp,maxCount){
 if(!Number.isFinite(time)||time<0||time>e.life)return;
 const style=e.fx.slice(6),u=time/e.life,s=e.size/8,r=Math.max(12,e.spread)*s,fade=Math.min(1,u*18)*(1-u),count=Math.min(e.count,maxCount),color=u>.75?e.end:e.start;
 let data=plans.get(e);if(!data||data.length!==e.count*3){data=new Float32Array(e.count*3);for(let i=0;i<e.count;i++){const angle=i*2.399963;data.set([Math.cos(angle),Math.sin(angle),(i*.618033)%1],i*3);}plans.set(e,data);}
 const image=(shape,x,y,w,h=w,angle=0,alpha=fade,tint=color)=>stamp(pixelTexture(shape,tint),x,y,w,h,angle,alpha);
 const ring=(k=1,flat=false)=>image('ring',0,flat?10:0,r*(.4+u*2)*k,r*(.4+u*2)*k*(flat?.3:1),time,fade);
 if(['slash','cross'].includes(style)){image('arc',0,0,r*1.8,r*1.8,-1.4+u*2.8,fade);if(style==='cross')image('arc',0,0,r*1.8,r*1.8,1.4-u*2.8,fade);}
 else if(style==='thrust')image('shard',r*u,0,12*s,r*2.2,Math.PI/2,fade);
 else if(['hit','critical','parry','electric','frost'].includes(style)){image('spark',0,0,(style==='critical'?90:65)*s*(1-u),undefined,time,fade,'#f7ffff');if(style!=='hit')ring(.65);}
 else if(['portal','summon'].includes(style)){image('rune',0,10,r*1.7,r*(style==='summon'?.55:1.7),time,fade);image('ring',0,10,r*1.3,r*(style==='summon'?.4:1.3),-time,fade);}
 else if(['shield','mana','level','water'].includes(style)){ring(1,style==='water');if(style==='shield')image('cube',0,0,55*s,55*s,time,fade);}
 else if(['explosion','flame'].includes(style)){image('flame',0,style==='flame'?-18:0,r*(1-u*.5),r*1.7,0,fade);image('spark',0,0,45*s,45*s,0,fade,'#fff3b5');}
 else if(['coin','charge','collapse'].includes(style)){const size=(style==='coin'?30:50*(.3+u))*s;image('spark',0,0,size,size,time,fade);}
 else if(style==='comet'){image('spark',r*(u-.5),0,36*s,36*s,0,fade,'#ffffff');}
 for(let i=0;i<count;i++){
  const dx=data[i*3],dy=data[i*3+1],a=data[i*3+2],angle=a*TAU+seed*.17;let shape='spark',x=dx*r*u,y=dy*r*u,w=(12+a*12)*s,h=w,rotation=angle+time*2,tint=color;
  if(['slash','cross','thrust','hit','critical','parry'].includes(style)){shape='shard';w=4*s;h=(14+a*18)*s;rotation=Math.atan2(dy,dx)+Math.PI/2;}
  else if(['flame','explosion'].includes(style)){shape=i%3?'flame':'smoke';w=h=(18+a*22)*(1-u*.3)*s;y-=r*u*.8;if(style==='flame'){x=dx*r*.2;y=-r*u*(.4+a);h*=1.4;}tint=i%3?color:'#7d6258';}
  else if(['smoke','dust','poison'].includes(style)){shape=style==='poison'?'ring':'smoke';w=h=(16+a*20)*(1+u*.5)*s;x=dx*r*u;y=style==='dust'?Math.abs(dy)*-10*s:dy*12-r*u*.7;}
  else if(style==='debris'){shape='shard';y+=e.gravity*time*time*.5;}
  else if(style==='leaves'){shape='leaf';y+=e.gravity*time*time*.5;}
  else if(['heal','hearts','mana','level','beacon','souls','summon'].includes(style)){shape=({heal:'plus',hearts:'heart',mana:'shard',level:'spark',beacon:'shard',souls:'smoke',summon:'skull'})[style];x=Math.sin(angle+time*2)*r*.5;y=-(u+a*.35)*r*1.4;rotation=style==='hearts'?dx*.15:angle;w=h=(15+a*10)*s;if(style==='beacon'){w=10*s;h=60*s;rotation=0;}}
  else if(['portal','shield','cubes'].includes(style)){shape=style==='cubes'?'cube':'spark';const turn=angle+time*2;x=Math.cos(turn)*(r*.45+e.orbit)*s;y=Math.sin(turn)*(r*.45+e.orbit)*s;}
  else if(['charge','collapse'].includes(style)){shape=style==='collapse'?'shard':'spark';x=dx*r*(1-u);y=dy*r*(1-u);}
  else if(style==='electric'){shape='shard';w=4*s;h=30*s;rotation=Math.atan2(dy,dx)+Math.PI/2;x=dx*r*u+(i%2?4:-4);}
  else if(style==='frost'){shape='shard';w=7*s;h=25*s;}
  else if(style==='water'){shape='shard';x=dx*r*u;y=10-(25+a*50)*s*Math.sin(u*Math.PI)+e.gravity*time*time*.13;w=10*s;h=16*s;rotation=dx*.6;}
  else if(style==='rain'){shape='shard';const drop=(u+a)%1;x=dx*r*2+drop*25;y=-r+drop*r*2;w=7*s;h=(18+a*10)*s;rotation=-.25;}
  else if(style==='snow'){shape='flake';x=dx*r*2+Math.sin(time*2+a*6)*14;y=-r+((u+a)%1)*r*2;w=h=5*s;}
  else if(style==='confetti'){shape='shard';w=5*s;h=7*s;y+=e.gravity*time*time*.4;tint=chips[i%4];}
  else if(style==='comet'){shape='spark';x=r*(u-.5)-a*r*.7;y=dy*8*s;w=h=(4+a*5)*s;}
  image(shape,x+e.speedX*time,y+e.speedY*time*.2,w,h,rotation,fade*(.5+a*.5),tint);
 }
}
