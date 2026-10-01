import {drawBiomeSprite} from './biome-sprites.mjs';
import {drawTorchFlame} from './torch-flame.mjs';
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
const poly=(c,points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
export const BIOME_ART_FEATURES={ice:['wind-carved snow','glacial fissures','crystal facets','snow sparkle','reactive frost grass'],desert:['continuous dune bands','sandstone strata','oasis reeds','windborne sand','flowering cacti'],temple:['jade stone mosaic','carved pillars','gold inlay','braziers','ritual motes'],house:['timber parquet','layered upholstery','window light','candle embers','floating dust']};
export function drawBiomeTile(c,g,kind,x,y){
  const env=g.generatedEnvironment,r=hash(x+(g.seed||0),y);
  if(env==='desert'&&kind==='sand'){
    const palettes=['#b99059','#c69d61','#d3ad6c','#dfbc7b','#e8ca8b'];
    for(let yy=0;yy<32;yy+=4){const phase=(y+yy)*.032+Math.sin(x*.007)*2+Math.sin(x*.025)*.35,n=(Math.sin(phase)+1)*.5;rect(c,x,y+yy,32.5,4.5,palettes[Math.min(4,Math.floor(n*5))]);}
    for(let i=0;i<3;i++)rect(c,x+hash(x,i)*28,y+hash(y,i)*28,2,1,i%2?'#f0d69b':'#b08b56');return true;
  }
  if(env==='ice'&&['snow','ice'].includes(kind)){
    if(kind==='snow'){
      const n=(Math.sin(x*.013)+Math.cos(y*.017)+2)/4;rect(c,x,y,32.5,32.5,['#bacfdc','#c9dce5','#d8e8ec','#e7f0ef'][Math.min(3,Math.floor(n*4))]);
      for(let i=0;i<3;i++){const yy=y+i*10+Math.sin(x*.025+i)*3;rect(c,x+3,yy,15+r*10,1,i===1?'#a6c4d03d':'#f6ffff66');}
    }else{
      for(let yy=0;yy<32;yy+=4)for(let xx=0;xx<32;xx+=4){const n=(Math.sin((x+xx)*.021+(y+yy)*.009)+Math.sin((y+yy)*.027)+2)/4;rect(c,x+xx,y+yy,4.5,4.5,['#6598b2','#6da1ba','#77acc2','#82b6c9','#90c1d0'][Math.min(4,Math.floor(n*5))]);}
      if(r>.72)poly(c,[[x+3,y+6],[x+26,y+2],[x+20,y+12],[x+5,y+18]],'#d1f6f51a');
      if(r>.78){c.strokeStyle='#d7fbfa88';c.lineWidth=.7;c.beginPath();c.moveTo(x,y+16);c.lineTo(x+12,y+10);c.lineTo(x+19,y+17);c.lineTo(x+32,y+16);c.moveTo(x+19,y+17);c.lineTo(x+24,y+25);c.stroke();}
      rect(c,x+4+r*20,y+4+r*15,2,1,'#e8ffff');
    }return true;
  }
  if(env==='temple'&&kind==='temple_stone'){
    rect(c,x,y,32,32,'#354b42');rect(c,x+1,y+1,30,30,['#637363','#6c7c68','#788771','#819078'][Math.floor(r*4)]);
    rect(c,x+2,y+2,28,2,'#acb899');rect(c,x+29,y+4,2,26,'#42584a');
    if((x/32+y/32)%4===0){poly(c,[[x+16,y+7],[x+25,y+16],[x+16,y+25],[x+7,y+16]],'#486e5c');poly(c,[[x+16,y+11],[x+21,y+16],[x+16,y+21],[x+11,y+16]],'#8fa784');}
    if(r>.74){rect(c,x+2,y+25,9,4,'#47734b');rect(c,x+4,y+23,4,2,'#7f985b');}return true;
  }
  if(env==='house'&&kind==='wood'){
    rect(c,x,y,32,32,'#3b2b28');for(let i=0;i<4;i++){const px=x+i*8;rect(c,px+1,y,7,31,['#886443','#98724d','#a27b54','#79593f'][(i+Math.floor(r*4))%4]);rect(c,px+2,y+2,1,28,'#c09b693b');rect(c,px+4,y+8+r*10,2,9,'#48362744');}return true;
  }
  return false;
}
export function drawBiomeProp(c,p,time,g){
  if(g.generatedEnvironment!=='desert'||!['rock','cactus','dune'].includes(p.kind)||p.depleted||p.falling)return false;
  if(drawBiomeSprite(c,p.kind==='rock'?'sandstone':p.kind,p.x,p.y+p.size*.19,p.size,p.kind==='cactus'?p.size*1.2:p.size))return true;
  c.save();c.translate(p.x,p.y+p.size*.19);c.scale(p.size/64,p.size/64);
  c.fillStyle='#684d373a';c.beginPath();c.ellipse(5,4,30,8,0,0,Math.PI*2);c.fill();
  if(p.kind==='rock'){
    poly(c,[[-29,0],[-25,-25],[-15,-42],[15,-39],[28,-17],[26,0]],'#ac7950');
    poly(c,[[-25,-25],[-15,-42],[15,-39],[22,-29],[-3,-24]],'#e3b878');poly(c,[[-3,-24],[22,-29],[28,-17],[26,0],[1,-2]],'#855839');
    for(let i=0;i<4;i++){rect(c,-23+i,-25+i*6,22,2,i%2?'#c3915d':'#80583d');rect(c,3,-20+i*5,19,1,'#bf8d5855');}
    rect(c,-22,-6,13,5,'#d7aa70');
  }else if(p.kind==='cactus'){
    for(const [x,y,w,h]of [[-7,-48,14,48],[-22,-33,8,22],[-19,-17,16,7],[15,-40,8,24],[4,-22,16,7]]){rect(c,x,y,w,h,'#3e7250');rect(c,x+2,y+1,3,h-2,'#8ea55e');rect(c,x+w-2,y+3,2,h-3,'#294f3b');for(let n=5;n<h;n+=8)rect(c,x+5,y+n,1,2,'#e2d38c');}
    rect(c,-5,-52,10,4,'#d17d69');rect(c,-2,-54,4,3,'#efba87');
  }else{for(let i=0;i<5;i++){const w=30-i*5;poly(c,[[-w,-i*3],[5,-12-i*2],[w,-i*2],[w+5,3],[-w-3,3]],i%2?'#dcb77a':'#cda46c');}}
  c.restore();return true;
}
export function drawBiomeAccents(c,g,visible){
  const env=g.generatedEnvironment;if(!BIOME_ART_FEATURES[env])return;
  const t=g.time||0;c.save();
  // Ground-level foliage reacts locally; it cannot hide a route or add collision.
  for(const p of g.scenery||[]){if(!visible(p)||p.depleted)continue;const r=hash(p.x,p.y);if(r<.48)continue;
    const x=p.x+p.size*.3,y=p.y+p.size*.25,near=(g.players||[]).find(a=>!a.room&&a.hp>0&&a.moving&&Math.hypot(a.x-x,a.y-y)<26);
    const bend=near?(x-near.x)*.25:Math.sin(t*1.2+r*8)*1.2;
    for(let i=-2;i<=2;i++){const h=5+hash(i,p.x)*8;c.strokeStyle=env==='ice'?'#739fad':env==='desert'?'#a5985c':'#69884d';c.lineWidth=1;c.beginPath();c.moveTo(x+i*3,y);c.lineTo(x+i*4+bend,y-h);c.stroke();if(env==='ice')rect(c,x+i*4+bend-1,y-h,3,2,'#efffff');}
  }
  if(env==='temple'&&g.house){
    for(const w of g.house.walls){if(!visible({x:w.x,y:w.y},300))continue;
      if(w.w===40&&w.h===40){
        rect(c,w.x-4,w.y+2,48,40,'#293e35');rect(c,w.x-3,w.y-10,46,12,'#b5b88d');rect(c,w.x+3,w.y-5,34,6,'#d0cba0');
        for(let n=0;n<4;n++){rect(c,w.x+5+n*8,w.y+4,3,27,'#91a07b');rect(c,w.x+8+n*8,w.y+4,2,27,'#405f48');}
        rect(c,w.x-4,w.y+34,48,6,'#9b9f70');drawBiomeSprite(c,'pillar',w.x+20,w.y+40,48,86);
      }else if(w.w>w.h){for(let x=w.x+12;x<w.x+w.w-10;x+=36){poly(c,[[x,w.y+4],[x+7,w.y+11],[x,w.y+18],[x-7,w.y+11]],'#a9a16a');rect(c,x-2,w.y+8,4,5,'#315e50');}}
    }
    for(const [x,y]of [[528,520],[1072,520],[528,1060],[1072,1060]]){
      drawBiomeSprite(c,'brazier',x,y+16,30,47);const glow=c.createRadialGradient(x,y,1,x,y,45);glow.addColorStop(0,'#f5bb5933');glow.addColorStop(1,'#f5bb5900');c.fillStyle=glow;c.fillRect(x-45,y-45,90,90);drawTorchFlame(c,x,y-13,t,x);
    }
  }
  if(env==='temple')for(const [x,y]of [[536,640],[1064,640],[536,920],[1064,920]])drawBiomeSprite(c,'guardian',x,y+16,36,45);
  if(env==='house'&&g.house){
    for(const w of g.house.walls.filter(w=>w.kind==='window'&&!w.broken)){if(!visible({x:w.x,y:w.y}))continue;
      poly(c,[[w.x+2,w.y+w.h],[w.x+w.w-2,w.y+w.h],[w.x+w.w+42,w.y+w.h+85],[w.x+20,w.y+w.h+85]],'#b2d7cd18');
      rect(c,w.x-3,w.y-4,w.w+6,4,'#8b6748');rect(c,w.x-4,w.y,4,w.h,'#693f45');rect(c,w.x+w.w,w.y,4,w.h,'#693f45');
    }
    for(const f of g.house.furniture||[]){if(!['table','desk','counter'].includes(f.kind)||!visible(f))continue;const x=f.x+f.w*.7,y=f.y+f.h*.3;
      rect(c,x-3,y,6,2,'#a8945e');rect(c,x-1,y-7,2,7,'#e6d6a1');drawTorchFlame(c,x,y-8,t,x);
    }
  }
  c.restore();
}
export function drawBiomeAir(c,g,visible){
  const env=g.generatedEnvironment;if(!BIOME_ART_FEATURES[env])return;c.save();const t=g.time||0;
  for(let i=0;i<120;i++){
    const speed=env==='desert'?18:env==='ice'?7:1.5,x=(hash(i,7)*1600+t*speed)%1600,y=(hash(i,13)*1600+t*(env==='ice'?12:2))%1600;
    if(!visible({x,y})||Math.hypot(x-800,y-800)>g.bloom*430)continue;
    c.globalAlpha=.12+hash(i,4)*.25;c.fillStyle=env==='ice'?'#f3ffff':env==='desert'?'#f2d49c':env==='temple'?'#85e5b8':'#e7c88d';
    c.fillRect(x+Math.sin(t+i)*2,y,env==='desert'?4:1.5,1);
  }c.restore();
}
