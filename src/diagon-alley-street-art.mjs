import {block as b, shape as p} from './diagon-shop-brush.mjs';
import {frontageLamp} from './diagon-shop-frontages.mjs';
import {drawPixelChatText,pixelChatTextWidth} from './pixel-chat-font.mjs';

const span=168, left=7740, width=520;
const segments=new Map();
const shades=['#7b7c6e','#858372','#8d8b7c','#93907d','#777b6e'];
const lantern={icon:'hoop',trim:['#3c443c','#776547','#b4a374']};

function pavers(c,style){
  b(c,0,0,width,span,'#666c5e');
  for(let row=0;row<12;row++){
    for(let col=-1;col<27;col++){
      const x=col*20+(row%2?10:0),y=row*14;
      const v=(row*19+(col+1)*13+row*(col+style)*3+style*11)%29;
      p(c,shades[Math.abs(v)%shades.length],[[x+1,y+3],[x+4,y+1],[x+17,y+1],
        [x+19,y+4],[x+19,y+10],[x+16,y+13],[x+3,y+13],[x+1,y+10]]);
      if(v%6===0)b(c,x+4,y+2,8,1,'#aaa491');
    }
  }
  for(const x of [0,width-9]){
    b(c,x,0,9,span,'#565e52');b(c,x+1,0,6,span,'#8a8872');b(c,x+1,0,2,span,'#a8a38a');
    for(let y=13;y<span;y+=16)b(c,x+1,y,6,2,'#64695a');
  }
}

export function drawAlleyPaving(c,alley,range) {
  const start=Math.max(0,Math.floor((range.top-alley.top)/span));
  const end=Math.min(Math.ceil((alley.bottom-alley.top)/span),Math.ceil((range.bottom-alley.top)/span));
  c.save();
  c.beginPath();c.rect(left,alley.top,width,alley.bottom-alley.top);c.clip();
  for(let index=start;index<end;index++){
    const variant=index%4,y=alley.top+index*span;
    let surface=segments.get(variant);
    if(!surface&&typeof document!=='undefined'){
      surface=document.createElement('canvas');surface.width=width;surface.height=span;
      pavers(surface.getContext('2d'),variant);segments.set(variant,surface);
    }
    if(surface)c.drawImage(surface,left,y);
    else{c.save();c.translate(left,y);pavers(c,variant);c.restore();}
  }
  c.restore();
}

export function streetLamp(c,x,y) {
  p(c,'#362e2f42',[[x-7,y-2],[x+6,y-3],[x+12,y+7],[x-4,y+6]]);
  p(c,'#edbc7a20',[[x-19,y-8],[x-12,y-14],[x+11,y-14],[x+19,y-7],[x+16,y+5],[x-17,y+5]]);
  b(c,x-3,y-44,6,42,'#3f4940');b(c,x-2,y-41,1,38,'#82826d');
  b(c,x-6,y-4,12,4,'#4c564b');b(c,x-5,y-4,8,1,'#a9a488');
  c.save();c.translate(x,y-41);frontageLamp(c,lantern);c.restore();
}

export function drawAlleyFountain(c,time) {
  const x=8000,y=4163;
  c.save();c.translate(x,y);
  p(c,'#46524d',[[-51,-17],[-40,-24],[39,-24],[51,-16],[51,12],[40,22],[-40,22],[-51,12]]);
  p(c,'#a5a492',[[-47,-16],[-37,-22],[36,-22],[47,-15],[47,10],[38,17],[-38,17],[-47,11]]);
  p(c,'#567975',[[-42,-14],[-35,-18],[34,-18],[42,-13],[42,9],[35,13],[-35,13],[-42,8]]);
  b(c,-35,-17,68,2,'#abc5ae');b(c,-33,10,66,1,'#7b9c8a');
  b(c,-6,-34,12,39,'#969987');b(c,-5,-33,4,34,'#b8b7a1');
  p(c,'#b6b49c',[[-17,-34],[-12,-40],[13,-40],[16,-34],[10,-29],[-11,-29]]);
  b(c,-11,-38,23,2,'#d3d4b6');
  for(let i=0;i<5;i++){
    const t=(time*.72+i/5)%1,dx=Math.round(t*12)*(i%2?1:-1),dy=Math.round(t*t*28);
    b(c,dx,-32+dy,2,4,'#a6cab8');b(c,dx,-31+dy,1,2,'#d0dbc2');
  }
  c.restore();
}

export function paintAlleyHeadstone(c,x,y){
  p(c,'#535b53',[[x-64,y],[x-64,y-19],[x-49,y-28],[x+49,y-28],[x+64,y-19],[x+64,y]]);
  p(c,'#8e9381',[[x-61,y-2],[x-61,y-18],[x-48,y-25],[x+48,y-25],[x+61,y-18],[x+61,y-2]]);
  const name='DIAGON ALLEY';
  drawPixelChatText(c,name,x-pixelChatTextWidth(name)/2,y-15,'#eee0b9');
}
