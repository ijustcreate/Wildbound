import {boundlessTerrainAt} from './boundless-world.mjs';
import {graveyardHash} from './graveyard-world.mjs';
import {drawPumpkinCrop} from './pumpkin-art.mjs';

// All scenery, textures and creatures are native integer Canvas pixels.
const pixel=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const line=(c,x1,y1,x2,y2,color,width=2)=> {
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(x2-x1),Math.abs(y2-y1))/2));
  for(let n=0;n<=steps;n++)pixel(c,x1+(x2-x1)*n/steps,y1+(y2-y1)*n/steps,width,width,color);
};
const visibleRect=(r,b)=>r.x+r.w>=b.sx*32 && r.x<=b.ex*32 && r.y+r.h>=b.sy*32 && r.y<=b.ey*32;
const palettes={grass:['#354b43','#3d5549','#465e4d','#50654f'],mud:['#3a3938','#45443d','#504c42','#5b574a'],
  path:['#5b5b55','#64645c','#707069','#7b7a70']};
function drawPlot(c,plot,seed) {
  const {x,y,w,h}=plot;
  pixel(c,x-2,y-1,w+4,h+3,'#293730');pixel(c,x,y,w,h,'#716e5c');
  pixel(c,x+3,y+3,w-6,h-6,'#44403a');pixel(c,x+6,y+5,w-12,h-10,'#51493e');
  for(let n=0;n<18;n++) {
    const px=x+5+Math.floor(graveyardHash(seed,n+x,y)*34),py=y+5+Math.floor(graveyardHash(seed,n+y,x)*56);
    pixel(c,px,py,2+n%3,1,n%3?'#625747':'#343630');
  }
  for(let n=0;n<h;n+=12) {
    pixel(c,x,y+n,3,8,'#96917b');pixel(c,x+w-3,y+n+3,3,7,'#858573');
    if(n%24===0){pixel(c,x-2,y+n+5,5,3,'#405b43');pixel(c,x+w-3,y+n,5,2,'#657650');}
  }
  pixel(c,x+3,y+h-3,w-6,3,'#a4a08a');pixel(c,x+7,y+h-2,12,1,'#c0b59a');
  if(plot.broken) {
    pixel(c,x+11,y+30,24,12,'#2b2928');pixel(c,x+8,y+38,29,6,'#3a322d');
    for(let n=0;n<7;n++)pixel(c,x+7+n*4,y+1+(n%3)*3,5,4,n%2?'#919889':'#616e66');
  } else if(plot.variant===2) {
    // Sunken coffin outline remains physically joined to its headstone.
    pixel(c,x+11,y+8,22,44,'#5e584c');pixel(c,x+14,y+11,16,38,'#686153');
    pixel(c,x+20,y+15,3,22,'#a2977c');pixel(c,x+15,y+22,13,3,'#a2977c');
  } else {
    for(let n=0;n<4;n++)pixel(c,x+9+n*7,y+20+(n%2)*15,3,4,n%2?'#586850':'#707552');
  }
}

/** bounds are exclusive tile indices, tile32; no document/Image dependency. */
export function drawGraveyardGround(c,g,bounds) {
  if(!g?.graveyard||g.generatedEnvironment!=='graveyard'||!bounds)return false;
  const endless=g.mapMode==='boundless';
  const b={sx:endless?Math.floor(bounds.sx):Math.max(0,Math.floor(bounds.sx)),sy:endless?Math.floor(bounds.sy):Math.max(0,Math.floor(bounds.sy)),
    ex:endless?Math.ceil(bounds.ex):Math.min(50,Math.ceil(bounds.ex)),ey:endless?Math.ceil(bounds.ey):Math.min(50,Math.ceil(bounds.ey))};
  if(!Object.values(b).every(Number.isFinite)||b.ex<=b.sx||b.ey<=b.sy)return false;
  c.save();c.beginPath();c.rect(b.sx*32,b.sy*32,(b.ex-b.sx)*32,(b.ey-b.sy)*32);c.clip();
  const seed=g.graveyard.seed;
  for(let ty=b.sy;ty<b.ey;ty++)for(let tx=b.sx;tx<b.ex;tx++) {
    const x=tx*32,y=ty*32;
    if(g.phase==='won'||g.mapMode!=='boundless'&&Number.isFinite(g.bloom)&&g.bloom<3&&Math.hypot(x+16-800,y+16-800)>g.bloom*430) {
      pixel(c,x,y,32,32,'#888a8e');continue;
    }
    const kind=endless?boundlessTerrainAt(g,tx,ty):g.terrain?.[ty*50+tx] || 'grass',colors=palettes[kind] || palettes.grass;
    const tone=Math.sin(x*.011)+Math.cos(y*.008)+Math.sin((x+y)*.018);
    pixel(c,x,y,32,32,colors[Math.max(0,Math.min(3,Math.floor((tone+3)*.65)))]);
    for(let n=0;n<12;n++) {
      const r=graveyardHash(seed,tx*17+n,ty*23),px=x+Math.floor(r*28),py=y+Math.floor(graveyardHash(seed,ty*13+n,tx)*29);
      if(kind==='path') {
        pixel(c,px,py,3+n%4,1,n%3?'#929084':'#464d48');
        if(n%4===0)pixel(c,px+1,py-1,2,1,'#acaa95');
      } else {
        pixel(c,px,py,3+n%3,2,n%3?colors[n%4]:'#617254');
        if(n%4===0){pixel(c,px+1,py-3,1,4,'#81906b');pixel(c,px-1,py-1,4,1,'#69825e');}
        if(n===3)pixel(c,px,py,3,1,'#9d8060');
      }
    }
    if(graveyardHash(seed,tx,ty)>.84) {
      pixel(c,x+12,y+23,3,2,'#887a60');pixel(c,x+13,y+22,1,1,'#b59b72');
    }
  }
  // Plots are floor art, not tall sprites or blockers. The marker is at their head.
  for(const plot of g.graveyard.plots || []) {
    if(!visibleRect(plot,b)||g.mapMode!=='boundless'&&Number.isFinite(g.bloom)&&g.bloom<3&&Math.hypot(plot.stoneX-800,plot.stoneY-800)>g.bloom*430||g.phase==='won')continue;
    drawPlot(c,plot,seed);
  }
  c.restore();return true;
}

function ivy(c,x,y,height,seed) {
  for(let n=0;n<height;n+=6) {
    const side=n%12?-1:1;
    pixel(c,x+side,y-n,2,7,'#304b3c');pixel(c,x+side*3,y-n-2,5,3,'#4d6950');
    pixel(c,x+side*3,y-n-2,2,1,graveyardHash(seed,n,x)>.5?'#81936a':'#657e58');
  }
}
function candle(c,x,y,time,phase=0) {
  pixel(c,x-3,y,8,2,'#303730');pixel(c,x,y-9,3,10,'#c7bd98');pixel(c,x,y-9,1,7,'#ece1b8');
  pixel(c,x+1,y-11,1,2,'#5b4835');const flick=Math.sin(time*9+phase)>0?1:0;
  pixel(c,x,y-15-flick,3,4+flick,'#d89550');pixel(c,x+1,y-15,1,3,'#ffe9a4');
}
function stone(c,p,time) {
  const tilt=p.tilt || 0,w=30,h=34,variant=p.variant || 0;
  pixel(c,-18,0,36,5,'#25342f');pixel(c,-17,-3,34,5,'#6b756b');
  if(variant===1) {
    pixel(c,-6+tilt,-43,12,40,'#56675f');pixel(c,-18+tilt,-32,36,10,'#56675f');
    pixel(c,-3+tilt,-41,7,37,'#89978a');pixel(c,-16+tilt,-30,30,5,'#89978a');pixel(c,-1+tilt,-40,2,24,'#b2b8a0');
  } else {
    pixel(c,-w/2+tilt,-h,w,h-2,'#53645d');pixel(c,-w/2+2+tilt,-h+2,w-5,h-4,'#879489');
    const cap=variant===3?6:3;
    pixel(c,-11+tilt,-h-cap,22,cap,'#849387');pixel(c,-7+tilt,-h-cap-2,14,2,'#a7b09c');
    pixel(c,-w/2+3+tilt,-h+2,2,h-6,'#b3baa4');pixel(c,10+tilt,-h+3,3,h-6,'#6d8074');
    // Weathered engraving; deliberately unreadable small lettering, no vector text.
    pixel(c,-6+tilt,-h+8,12,2,'#485d55');pixel(c,-8+tilt,-h+13,16,1,'#617167');
    for(let n=0;n<4;n++)pixel(c,-6+n*4+tilt,-h+18,2,1,'#4e625a');
    if(variant===2){pixel(c,tilt,-31,2,8,'#c1c2a8');pixel(c,-3+tilt,-28,8,2,'#c1c2a8');}
    pixel(c,7+tilt,-h,4,3,'#53645d');pixel(c,8+tilt,-h+3,1,8,'#52645b');pixel(c,6+tilt,-h+11,3,1,'#52645b');
  }
  ivy(c,-11,-2,Math.floor(12+(p.moss || 0)*20),p.x);
  for(let n=0;n<4;n++)pixel(c,-13+n*8,-3-(n%2)*2,6,2,n%2?'#72855f':'#435e46');
  if(p.hp<p.maxHp){line(c,2,-28,-3,-13,'#35433c',1);line(c,-3,-13,4,-5,'#35433c',1);}
  if(p.hp<p.maxHp && time-(p.hitAt || 0)<3) {
    pixel(c,-16,9,32,4,'#23342d');pixel(c,-15,10,30*Math.max(0,p.hp/p.maxHp),2,'#abb58c');
  }
}
function fence(c,p) {
  if(p.orientation==='vertical') {
    pixel(c,-3,-47,5,64,'#202d2d');pixel(c,-1,-47,1,64,'#839189');
    for(let y=-14;y<=16;y+=8){pixel(c,2,y-32,2,29,'#344441');pixel(c,2,y-35,2,3,'#a4aa92');}
    pixel(c,2,-32,2,33,'#62726a');pixel(c,2,-15,2,33,'#384a44');
  } else {
    pixel(c,-16,-35,32,3,'#263735');pixel(c,-16,-16,32,3,'#263735');pixel(c,-16,-35,32,1,'#87968a');
    for(let x=-16;x<=16;x+=8) {
      pixel(c,x,-42,3,42,'#243330');pixel(c,x+1,-41,1,39,'#74877a');
      pixel(c,x,-46,3,4,'#aab09a');pixel(c,x+1,-48,1,2,'#c0c4aa');
    }
  }
  if(Math.round(p.x+p.y)%3===0)ivy(c,-10,0,23,p.x);
}
function gate(c,time,p) {
  if(p.small){
    const vertical=p.orientation==='vertical';
    for(const side of [-1,1]){
      const x=vertical?0:side*36,y=vertical?side*36:0;
      pixel(c,x-5,y-30,10,32,'#53625a');pixel(c,x-3,y-29,6,29,'#859283');
      pixel(c,x-7,y-34,14,5,'#b0b29a');pixel(c,x-1,y-27,2,24,'#c1c3a7');
      // Folded leaves sit outside the walkable aperture, not across it.
      if(vertical){pixel(c,x+4,y-22,22,3,'#75857a');pixel(c,x+4,y-9,22,2,'#75857a');for(let n=4;n<26;n+=6)pixel(c,x+n,y-26,2,25,'#344941');}
      else{pixel(c,x-2,y+5,3,22,'#344941');pixel(c,x-1,y+5,1,22,'#91a28b');}
    }
    return;
  }
  for(const side of [-1,1]) {
    const x=side*101;
    pixel(c,x-8,-54,16,57,'#53625a');pixel(c,x-6,-52,12,51,'#859283');
    pixel(c,x-11,-58,22,6,'#b0b29a');pixel(c,x-9,-59,18,2,'#d3c8a5');
    pixel(c,x-2,-48,4,22,'#576c61');ivy(c,x+4,0,28,x);
    // Leaves are folded away from the opening, along the two post footprints.
    pixel(c,x-2,8,4,47,'#2b3b37');pixel(c,x,8,1,46,'#8d9c89');
    for(let y=12;y<54;y+=8){pixel(c,x-3,y-24,6,3,'#899783');pixel(c,x-2,y-21,4,18,'#354840');}
    candle(c,x-1,-59,time,side);
  }
}
function mausoleum(c,p,time) {
  const w=p.width || 128,h=p.height || 120;
  pixel(c,-w/2-6,-5,w+12,9,'#243630');pixel(c,-w/2,-h+24,w,h-24,'#5d6d65');
  pixel(c,-w/2+4,-h+27,w-8,h-31,'#859287');
  for(let y=-h+32;y<-9;y+=13) {
    pixel(c,-w/2+4,y,w-8,1,'#596c60');
    for(let x=-w/2+9+(y%2)*10;x<w/2-5;x+=25)pixel(c,x,y,1,13,'#697b6b');
  }
  for(let n=0;n<7;n++)pixel(c,-w/2-5+n*6,-h+22-n*4,w+10-n*12,5,n%2?'#67786b':'#9ca68e');
  pixel(c,-w/2-5,-h+22,w+10,5,'#b0b49c');pixel(c,-8,-h-12,16,4,'#728477');
  pixel(c,-2,-h-23,4,17,'#a1ad96');pixel(c,-7,-h-18,14,3,'#a1ad96');
  for(const x of [-w/2+9,w/2-21]) {
    pixel(c,x,-h+28,12,h-35,'#b4b79e');pixel(c,x+3,-h+32,3,h-42,'#d0c9aa');
    pixel(c,x-2,-h+26,16,6,'#a2ad97');pixel(c,x-2,-12,16,7,'#687b69');
  }
  pixel(c,-24,-69,48,63,'#394e46');pixel(c,-20,-65,40,59,'#182a29');
  pixel(c,-16,-74,32,9,'#52695c');pixel(c,-10,-77,20,3,'#a3ad92');
  if(p.doorOpen) {
    pixel(c,-19,-64,3,58,'#657b65');pixel(c,17,-64,3,58,'#657b65');
    pixel(c,-13,-10,26,4,'#aa986e');pixel(c,-9,-8,18,2,'#d1bc85');
  } else {
    for(let x=-15;x<=15;x+=6){pixel(c,x,-63,2,53,'#586b60');pixel(c,x,-63,1,53,'#879680');}
    pixel(c,-18,-45,36,3,'#6c7b67');pixel(c,-18,-23,36,3,'#6c7b67');
  }
  pixel(c,-31,-5,62,5,'#a6a58b');pixel(c,-38,0,76,5,'#707e6d');
  ivy(c,-w/2+6,-7,70,p.x);ivy(c,w/2-5,-3,42,p.y);
  candle(c,-35,-5,time,p.x);candle(c,33,-5,time,p.y);
}
function tree(c,p,forest=false) {
  const h=p.size || 120,v=((p.variant||0)%5+5)%5,type=p.treeType||'oak';
  pixel(c,-18,-2,37,6,'#23332d');
  // Five distinct, seeded silhouettes make the cemetery canopy read as
  // individual trees at gameplay zoom, while the root/contact footprint stays put.
  const midX=[-3,-12,4,1,-5][v],midY=[-.35,-.28,-.43,-.38,-.32][v];
  const crownX=[8,-14,3,0,-7][v],crownY=[-.70,-.64,-.72,-.66,-.73][v];
  line(c,-7,0,midX,h*midY,'#28322f',10);
  line(c,midX,h*midY,crownX,h*crownY,'#28322f',8);
  if(v===2){
    line(c,crownX,h*crownY,-h*.12,-h*.88,'#28322f',5);
    line(c,-h*.12,-h*.88,-h*.22,-h,'#28322f',3);
    line(c,crownX,h*crownY,h*.23,-h*.87,'#28322f',4);
  } else if(v===3) {
    line(c,crownX,h*crownY,-h*.30,-h*.83,'#28322f',4);
    line(c,-h*.30,-h*.83,-h*.34,-h*.63,'#465044',2);
    line(c,crownX,h*crownY,h*.31,-h*.88,'#28322f',4);
    line(c,h*.31,-h*.88,h*.38,-h*.68,'#465044',2);
  } else {
    line(c,crownX,h*crownY,v===1?h*.27:-h*.22,-h*.98,'#28322f',4);
    line(c,crownX,h*crownY,v===1?-h*.30:h*.25,-h*.88,'#28322f',4);
  }
  line(c,-5,0,-1,-h*.4,'#586052',3);line(c,midX,h*midY,crownX+3,h*(crownY-.06),'#6c7060',2);
  for(const side of [-1,1])line(c,-3,0,side*(18+v%3*3),3,'#465447',3);
  const branches=v===1?[[.48,-.49,.10,-.77,6],[.70,-.64,.42,-.73,3],[.31,-.52,.20,-.90,3]]:
    v===4?[[-.35,-.47,-.76,-.65,5],[.23,-.62,.62,-.77,4],[-.76,-.65,-.82,-.82,2],[.62,-.77,.76,-.93,2]]:
    [[-.44,-.47,-.72,-.70,5],[.39,-.51,.69,-.69,5],[-.72,-.70,-.84,-.88,3],[.69,-.69,.84,-.89,3]];
  for(const [y,x1,y1,x2,w] of branches){
    const originX=midX+(crownX-midX)*((-.45-y)/Math.max(.1,Math.abs(crownY-midY)));
    line(c,originX,h*y,x1*h,y1*h,'#2b3530',w);
    if(v===3){line(c,x1*h,y1*h,x2*h,(y1+.14)*h,'#465044',Math.max(1,w-2));}
    else {line(c,x1*h,y1*h,x2*h,y1*h-.1*h,'#465044',Math.max(1,w-2));line(c,x2*h,y1*h-.1*h,x2*h*1.08,y1*h-.2*h,'#465044',2);}
  }
  ivy(c,-6,-1,26,p.x);
  if(forest) {
    const palette={oak:['#263c33','#36503d','#52664a'],birch:['#394a3e','#58644c','#8c956d'],pine:['#203a34','#2b5140','#426b4b'],deadwood:['#26302d','#3d493c','#596050'],willow:['#294337','#3c5a42','#62714d']}[type]||['#263c33','#2b4438','#36503d'];
    const count=type==='deadwood'?4:type==='birch'?11:type==='pine'?13:type==='willow'?12:16;
    for(let n=0;n<count;n++) {
      let x,y,w,hh;
      if(type==='pine'){
        const tier=n%4,side=Math.floor(n/4)-1;
        x=side*h*(.10+tier*.045);y=-h*(.38+tier*.15);w=h*(.26-tier*.035);hh=8+tier%3*3;
      } else if(type==='birch'){
        x=(graveyardHash(p.x,n,p.y)-.5)*h*.40;y=-h*(.45+graveyardHash(p.y,n,p.x)*.49);w=12+n%3*4;hh=8+n%2*3;
      } else if(type==='willow'){
        const side=n%2?1:-1,branch=Math.floor(n/2);
        x=side*h*(.18+branch%3*.055);y=-h*(.63+branch%4*.075);w=14+n%3*3;hh=13+n%4*4;
      } else {
        x=-h*.36+graveyardHash(p.x,n,p.y)*h*.72;y=-h+graveyardHash(p.y,n,p.x)*h*.56;w=18+n%4*3;hh=8+n%3*3;
      }
      pixel(c,x,y,w,hh,palette[n%palette.length]);
      if(type!=='deadwood')pixel(c,x+3,y,Math.max(3,w*.42),2,palette[(n+1)%palette.length]);
    }
    if(type==='willow')for(const side of [-1,1])for(let n=0;n<3;n++)line(c,side*h*(.24+n*.09),-h*.65,side*h*(.27+n*.09),-h*(.36+n*.025),'#294337',2);
  } else if(v===2){pixel(c,1,-h*.6,4,7,'#182a26');pixel(c,-1,-h*.59,2,2,'#838676');}
}

function leaflessStump(c) {
  for(const side of [-1,1]) {
    line(c,side*3,-5,side*18,3,'#28322f',4);
    line(c,side*4,-3,side*15,2,'#586052',2);
  }
  pixel(c,-7,-11,14,12,'#28322f');pixel(c,-5,-10,10,10,'#586052');
  pixel(c,-4,-10,2,8,'#87907b');pixel(c,-7,-13,14,4,'#9b9e80');
  pixel(c,-5,-12,10,2,'#c7bd95');pixel(c,-3,-12,6,1,'#76775f');
  pixel(c,-1,-12,2,2,'#5c6756');ivy(c,-5,1,8,3);
}

function leaflessTree(c,p,forest=false) {
  if(p.fallen || p.depleted&&!p.falling){leaflessStump(c);return;}
  if(!p.falling){tree(c,p,forest);return;}
  // Match tickEnvironment's 1.1s fall / 1.5s cleanup, pivoting at a fixed cut.
  // Roots and stump stay outside the upper-trunk transform throughout the fall.
  leaflessStump(c);
  const cutY=-12,progress=Math.max(0,Math.min(1,p.falling/1.1));
  const angle=(p.fallDirection || 1)*Math.PI/2*(.08*progress+.92*progress**2.2);
  const h=p.size || 120;
  c.save();c.translate(0,cutY);c.rotate(angle);c.translate(0,-cutY);
  c.globalAlpha*=Math.max(0,Math.min(1,(1.5-p.falling)/.25));
  c.beginPath();c.rect(-h,-h-16,h*2,h+16+cutY);c.clip();
  tree(c,p,forest);c.restore();
}

export function drawGraveyardProp(c,p,time=0,g) {
  if(!p?.graveyard||!['gravestone','cemetery_fence','cemetery_gate','grave_fence','grave_gate','mausoleum','leafless_tree','grave_forest_tree','grave_candles','pumpkin_crop'].includes(p.kind))return false;
  if(p.depleted && !['leafless_tree','grave_forest_tree'].includes(p.kind))return true;
  c.save();c.translate(Math.round(p.x),Math.round(p.rootY ?? p.y));
  if(p.kind==='gravestone')stone(c,p,time);
  else if(p.kind==='cemetery_fence'||p.kind==='grave_fence')fence(c,p);
  else if(p.kind==='cemetery_gate'||p.kind==='grave_gate')gate(c,time,p);
  else if(p.kind==='pumpkin_crop')drawPumpkinCrop(c,{...p,x:0,y:0});
  else if(p.kind==='mausoleum')mausoleum(c,p,time);
  else if(p.kind==='leafless_tree')leaflessTree(c,p);
  else if(p.kind==='grave_forest_tree')leaflessTree(c,p,true);
  else {candle(c,-5,0,time,p.x);if(p.variant)candle(c,4,-2,time,p.y);pixel(c,-10,2,19,3,'#4e5d43');}
  if(p.kind==='pumpkin_crop'&&!p.picked&&(g?.players||[]).some(a=>!a.room&&!a.ui&&a.hp>0&&Math.hypot(a.x-p.x,a.y+14-p.rootY)<48)){
    c.fillStyle='#f4dfa7';c.font='bold 7px sans-serif';c.textAlign='center';c.fillText('INTERACT · PICK PUMPKIN',0,-34);
  }
  c.restore();return true;
}

export function drawGraveyardCritter(c,a,time=0) {
  if(!['grave_moth','crypt_beetle','graveyard_cat'].includes(a?.kind))return false;
  c.save();c.translate(Math.round(a.x),Math.round(a.y));
  const phase=time+(a.phase || 0),stride=Math.sin(phase*12)>0?1:-1;
  if(a.kind==='grave_moth') {
    const bob=Math.round(Math.sin(phase*2)*2),flap=Math.sin(phase*15)>0?4:1;
    pixel(c,-4,2,9,2,'#223d3155');
    for(const side of [-1,1]) {
      const x=side<0?-flap-3:2;
      pixel(c,x,-14+bob,flap+2,5,'#776d82');pixel(c,x,-13+bob,flap+1,3,'#c5b9c8');
      pixel(c,x,-8+bob,flap,3,'#a797b1');pixel(c,x+1,-12+bob,1,1,'#efe7ce');
    }
    pixel(c,-1,-14+bob,3,9,'#615768');pixel(c,0,-15+bob,1,2,'#ece2b8');
    pixel(c,-3,-16+bob,1,2,'#c0baa5');pixel(c,2,-16+bob,1,2,'#c0baa5');
  } else if(a.kind==='crypt_beetle') {
    pixel(c,-5,2,11,2,'#22372c55');
    for(let n=0;n<3;n++){pixel(c,-7,-3+n*3+stride,3,1,'#809782');pixel(c,5,-3+n*3-stride,3,1,'#809782');}
    pixel(c,-5,-5,10,8,'#253f3d');pixel(c,-4,-5,8,6,'#486f66');pixel(c,-3,-4,6,2,'#8da78a');
    pixel(c,0,-4,1,6,'#243a38');pixel(c,-3,-8,6,3,'#334c46');pixel(c,-3,-8,1,1,'#ddd0a3');pixel(c,2,-8,1,1,'#ddd0a3');
    pixel(c,-4,-10,1,2,'#6d8270');pixel(c,3,-10,1,2,'#6d8270');
  } else {
    if(a.faceX<0)c.scale(-1,1);
    pixel(c,-13,1,28,4,'#203b3055');
    if(a.idle==='run') {
      const leap=Math.sin(phase*22)>0?2:0,reach=leap?3:-2;
      pixel(c,-13,-13-leap,23,10,'#565f5d');pixel(c,-10,-14-leap,17,5,'#8d9286');
      pixel(c,-11-reach,-5-leap,4,8,'#b5b3a2');pixel(c,5+reach,-5-leap,4,8,'#b5b3a2');
      pixel(c,7,-19-leap,11,10,'#656e67');pixel(c,8,-23-leap,3,5,'#8f988c');pixel(c,14,-22-leap,3,4,'#8f988c');
      pixel(c,14,-16-leap,2,2,'#d2d795');pixel(c,15,-16-leap,1,2,'#2b3b36');pixel(c,18,-12-leap,2,1,'#c39d93');
      line(c,-12,-9-leap,-20,-14-leap,'#848d81',3);line(c,-20,-14-leap,-24,-13-leap,'#b3b5a5',2);
    } else if(a.idle==='sleep') {
      pixel(c,-10,-7,20,9,'#53595b');pixel(c,-8,-9,14,4,'#797c79');pixel(c,5,-5,8,6,'#afb0a0');
      pixel(c,7,-3,4,1,'#444b4a');pixel(c,-13,-2,12,3,'#9b9d92');
    } else {
      const walk=a.moving?stride:0;
      pixel(c,-9,-13,17,15,'#565f5d');pixel(c,-7,-14,12,8,'#8d9286');
      pixel(c,-9,-4,4,7+walk,'#b5b3a2');pixel(c,4,-4,4,7-walk,'#b5b3a2');
      pixel(c,2,-22,12,12,'#656e67');pixel(c,3,-26,4,6,'#8f988c');pixel(c,10,-25,4,6,'#8f988c');
      pixel(c,4,-24,2,3,'#c8ae9e');pixel(c,11,-23,2,3,'#c8ae9e');pixel(c,4,-17,2,2,'#d2d795');pixel(c,11,-17,2,2,'#d2d795');
      pixel(c,5,-17,1,2,'#2b3b36');pixel(c,11,-17,1,2,'#2b3b36');pixel(c,8,-13,2,1,'#c39d93');
      line(c,-9,-4,-17,-8+Math.sin(phase)*2,'#848d81',3);line(c,-17,-8,-17,-13,'#b3b5a5',2);
    }
  }
  c.restore();return true;
}

/** Callback receives (ctx, shiftedActor, time, size) in WORLD coordinates.
 * Return true even at elapsed=0, so the normal renderer never draws a second body.
 * Main must skip AI while graveEmergence exists. Clipping never mutates the actor.
 */
export function drawGraveEmergence(c,e,time=0,size=64,drawActorCallback) {
  const s=e?.graveEmergence,o=s?.origin;
  if(!s||!o||!Number.isFinite(s.elapsed)||!Number.isFinite(s.duration)||s.duration<=0||!Number.isFinite(o.x)||!Number.isFinite(o.y))return false;
  const progress=Math.max(0,Math.min(1,s.elapsed/s.duration));
  const height=Number.isFinite(size)?Math.max(24,Math.min(160,size)):64,groundY=o.groundY ?? o.y+14;
  c.save();
  pixel(c,o.x-22,groundY-3,44,8,'#252c27');pixel(c,o.x-17,groundY-4,34,4,'#302a27');
  // The world-space clip is the ground surface, hiding the lower buried body.
  c.save();c.beginPath();c.rect(o.x-height,groundY-height-14,height*2,height+14);c.clip();
  const lift=(1-progress)*height;
  if(progress>0) {
    if(typeof drawActorCallback==='function')drawActorCallback(c,{...e,x:o.x,y:o.y+lift},time,size);
    else {
      c.save();c.translate(Math.round(o.x),Math.round(groundY+lift));
      const skeleton=e.kind==='skeleton',bone=skeleton?'#c7c8ad':'#7e9177',shade=skeleton?'#778c7a':'#4f6657';
      // Crawling arms become visible first, then shoulders, torso and hips rise.
      pixel(c,-7,-height+4,14,13,shade);pixel(c,-6,-height+3,12,10,bone);
      pixel(c,-4,-height+7,3,3,'#243731');pixel(c,2,-height+7,3,3,'#243731');
      pixel(c,-2,-height+12,5,2,skeleton?'#596d61':'#393c39');
      pixel(c,-8,-height+19,16,22,skeleton?'#9caa91':'#5d6263');
      if(skeleton)for(let n=0;n<4;n++)pixel(c,-7,-height+21+n*4,14,2,bone);
      const reach=4+Math.round((1-progress)*9),crawl=Math.round(Math.sin(time*9)*2);
      for(const side of [-1,1]) {
        line(c,side*8,-height+21,side*(14+reach),-height+29+crawl,bone,4);
        line(c,side*(14+reach),-height+29+crawl,side*21,-height+18,bone,3);
        pixel(c,side*21-2,-height+20,5,4,bone);
      }
      pixel(c,-6,-height+41,5,20,shade);pixel(c,2,-height+41,5,20,shade);
      c.restore();
    }
  }
  c.restore();
  // Foreground dirt overlaps wrists/hips at the clip edge, plus bounded square dust.
  for(let n=0;n<12;n++) {
    const phase=(time*2+n*.173)%1,x=o.x-23+n*4;
    pixel(c,x,groundY-1+(n%3),5,2,n%2?'#73634b':'#4a4235');
    if(progress>0&&progress<1)pixel(c,x+Math.sin(n)*3,groundY-2-phase*(7+n%5),2,2,n%2?'#a08a62':'#6c5943');
  }
  c.restore();return true;
}
