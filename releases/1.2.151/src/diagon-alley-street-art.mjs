import {block as b, shape as p} from './diagon-shop-brush.mjs';
import {frontageBay,frontageRoof,SHOP_FRONTAGES} from './diagon-shop-frontages.mjs';
import {drawPixelChatText,pixelChatTextWidth} from './pixel-chat-font.mjs';
import {DIAGON_PAVER_LANE} from './alley-street-layout.mjs';
export {streetLamp,DIAGON_STREET_LAMPS,NOCTURNE_WALL_CANDLES,drawNocturneWallCandles} from './diagon-street-lights.mjs';

const span=168,{x:left,w:width}=DIAGON_PAVER_LANE;
const sidewalkWidth=136;
const segments=new Map();
const roadPalettes={
  bank:{bed:'#6a6d66',stones:['#818278','#898980','#9b9a8d','#a4a292','#777e77'],light:'#bcb5a1'},
  shops:{bed:'#69685b',stones:['#7e7e6c','#878172','#8b8377','#97907c','#76796b'],light:'#b4aa92'},
  arch:{bed:'#61685c',stones:['#737b70','#7c8173','#898777','#93917c','#6e796d'],light:'#a6ab93'},
};
const sidewalkShades=['#79776a','#817d6f','#8a8273','#746f64'];
const themes={
  stationery:{...SHOP_FRONTAGES.flourish,
    roof:['#423c51','#544c68','#6b607a','#948491'],wall:['#574c47','#827262','#a8947e','#c3af92']},
  pottery:{...SHOP_FRONTAGES.apothecary,
    roof:['#4c4140','#6f5149','#8f6658','#b18570'],wall:['#615348','#857461','#ab9279','#cab399'],glass:'#a7977f'},
  clockmaker:{...SHOP_FRONTAGES.quidditch,
    roof:['#37444a','#4c5b64','#586d72','#839294'],wall:['#4d5750','#66766a','#859486','#a5b1a1'],glass:'#9ca99d'},
  weaver:{...SHOP_FRONTAGES.malkins,
    roof:['#443b3c','#6f5752','#84645c','#ab8270'],wall:['#50444a','#756467','#9a8580','#b4a095'],glass:'#9ca89c'},
  'garden-glazier':{...SHOP_FRONTAGES.bellglass,
    roof:['#354749','#4b6060','#607a76','#94aaa0'],wall:['#484a40','#636a55','#87917a','#afad8d'],glass:'#9cb6aa'},
  'garden-spindle':{...SHOP_FRONTAGES.eeylops,
    roof:['#443a4b','#58495c','#735c6e','#a6838e'],wall:['#555047','#746a57','#9a876d','#b8a68b'],glass:'#adb59f'},
  'night-weaver':{...SHOP_FRONTAGES['nocturne-curios'],
    roof:['#342f40','#473a50','#584764','#765b76'],wall:['#393644','#494454','#66596b','#82717d'],glass:'#7c9b8e'},
  undertaker:{...SHOP_FRONTAGES['borgin-burkes'],
    roof:['#292d3a','#3c4453','#505465','#6a6d75'],wall:['#33383f','#4b5058','#61686b','#7b8280'],glass:'#708f87'},
  'tallow-workshop':{...SHOP_FRONTAGES.nightglass,
    roof:['#30303d','#414553','#575667','#747587'],wall:['#373e43','#4d5457','#68706a','#848881'],
    trim:['#36343a','#55605c','#879584'],glass:'#839989',lampTint:['#506c67','#7c9c85','#b6bf99']},
};
const frontageRasters=new Map();

function pavingStone(c,x,y,w,h,grain,palette){
  const corner=2+grain%3,side=1+Math.floor(grain/3)%3;
  p(c,palette.stones[grain%palette.stones.length],[
    [x+1,y+corner],[x+corner+1,y+1],[x+w-side-1,y+1],[x+w-1,y+side+1],
    [x+w-1,y+h-corner],[x+w-corner-1,y+h-1],[x+side+1,y+h-1],[x+1,y+h-side-1],
  ]);
  if(grain%5===0)b(c,x+corner+2,y+2,Math.min(w-8,11),1,palette.light);
  if(grain%11===0){
    b(c,x+w-7,y+h-4,5,2,palette.bed);
    b(c,x+w-4,y+h-5,3,1,palette.bed);
  }
}
function pavers(c,style,palette){
  b(c,0,0,width,span,palette.bed);
  const heights=[13,16,12,15,13,14,16,12,15,13,14,15];
  const widths=[18,22,26,19,24,15,29,21];
  let y=0;
  for(let row=0;row<heights.length;row++){
    const h=heights[(row+style)%heights.length];
    let x=-(row*11+style*3)%21;
    for(let col=0;x<width;col++){
      const w=widths[(col+row*3+style)%widths.length];
      const grain=(row*19+(col+1)*13+row*(col+style)*3+style*11)%29;
      pavingStone(c,x,y,w,h,grain,palette);
      x+=w;
    }
    y+=h;
  }
  for(const x of [0,width-9]){
    b(c,x,0,9,span,'#565e52');b(c,x+1,0,6,span,'#8a8872');b(c,x+1,0,2,span,'#a8a38a');
    for(let y=13;y<span;y+=16)b(c,x+1,y,6,2,'#64695a');
  }
}

function sidewalk(c,w,variant){
  c.save();c.beginPath();c.rect(0,0,w,span);c.clip();
  b(c,0,0,w,span,'#656256');
  for(let row=0;row<span/24;row++){
    const y=row*24;
    for(let x=-(row%2)*17;x<w;x+=34){
      const tone=Math.abs(x*5+row*9+variant*13+Math.floor(x/34)*row*7)%19;
      p(c,sidewalkShades[tone%sidewalkShades.length],[[x+1,y+2],[x+5,y+1],[x+31,y+1],
        [x+33,y+4],[x+33,y+20],[x+29,y+23],[x+3,y+23],[x+1,y+20]]);
      if(tone%4===0)b(c,x+8,y+3,13,1,'#918977');
      if(tone%7===0)b(c,x+23,y+19,6,1,'#696a58');
    }
  }
  c.restore();
}

function streetDrain(c,x,y){
  b(c,x-8,y-6,16,13,'#54584e');
  b(c,x-7,y-5,14,11,'#837f6c');
  b(c,x-5,y-3,10,7,'#474c46');
  for(let i=-4;i<5;i+=2)b(c,x+i,y-3,1,7,'#727367');
  b(c,x-7,y-5,14,1,'#a29c84');
}

export function drawAlleyPaving(c,alley,range) {
  const origin=alley.top-span,streetWidth=alley.right-alley.left,east=left+width;
  const start=Math.max(0,Math.floor((range.top-origin)/span));
  const end=Math.min(Math.ceil((alley.bottom+span-origin)/span),Math.ceil((range.bottom-origin)/span));
  c.save();
  c.beginPath();c.rect(alley.left,origin,streetWidth,alley.bottom+span-origin);c.clip();
  for(let index=start;index<end;index++){
    const y=origin+index*span,{variant,district}=pavingVariant(index,y),surface=pavingRaster(variant,district);
    if(surface){
      if(range.left<east&&range.right>left)c.drawImage(surface,sidewalkWidth,0,width,span,left,y,width,span);
      for(const [start,end,source] of [[alley.left,left,0],[east,alley.right,sidewalkWidth+width]]){
        const visibleStart=Math.max(start,range.left),visibleEnd=Math.min(end,range.right);
        for(let x=start+Math.floor((visibleStart-start)/sidewalkWidth)*sidewalkWidth;x<visibleEnd;x+=sidewalkWidth){
          const count=Math.min(sidewalkWidth,end-x);
          c.drawImage(surface,source,0,count,span,x,y,count,span);
        }
      }
    }else{
      c.save();c.translate(alley.left,y);sidewalk(c,left-alley.left,variant);
      c.translate(left-alley.left,0);pavers(c,variant,roadPalettes[district]);
      c.translate(width,0);sidewalk(c,alley.right-east,variant+2);c.restore();
    }
  }
  for(const edge of [alley.top,alley.bottom]){
    const y=edge-7;
    b(c,alley.left,y,streetWidth,14,'#53554a');
    for(let x=alley.left;x<alley.right;x+=38){
      b(c,x,y+2,36,9,'#8c8b78');b(c,x,y+2,36,2,'#aeab93');
    }
  }
  for(const y of [4270,4515,4680,4895,5060,5275,5440,5655]){
    if(y<range.top-10||y>range.bottom+10)continue;
    streetDrain(c,left+24,y);streetDrain(c,east-24,y+13);
  }
  c.restore();
}

function pavingVariant(index,y){
 return {variant:(index*5+Math.floor(index/4))%7,district:y<4030?'bank':y>=5300?'arch':'shops'};
}

function pavingRaster(variant,district){
  const key=district+':'+variant;
  let surface=segments.get(key);
  if(!surface&&typeof document!=='undefined'){
    surface=document.createElement('canvas');surface.width=width+sidewalkWidth*2;surface.height=span;
    const pen=surface.getContext('2d');sidewalk(pen,sidewalkWidth,variant);
    pen.translate(sidewalkWidth,0);pavers(pen,variant,roadPalettes[district]);
    pen.translate(width,0);sidewalk(pen,sidewalkWidth,variant+2);
    segments.set(key,surface);
  }
  return surface;
}

export function prepareAlleyPavingAt(alley,y){
 const origin=alley.top-span,index=Math.max(0,Math.floor((y-origin)/span)),slice=origin+index*span;
 const {variant,district}=pavingVariant(index,slice);
 pavingRaster(variant,district);
}

export function alleyStreetCacheStats(){
 const pixels=entries=>[...entries.values()].reduce((sum,c)=>sum+c.width*c.height,0);
 return {streetRasters:segments.size,streetPixels:pixels(segments),facadeRasters:frontageRasters.size};
}

export function drawClosedFrontageGround(c,{x,y,halfWidth,halfDepth}){
  p(c,'#393a344d',[[x-halfWidth-17,y-halfDepth+5],[x+halfWidth+13,y-halfDepth+6],
    [x+halfWidth+21,y+halfDepth+10],[x+halfWidth-10,y+halfDepth+23],
    [x-halfWidth+1,y+halfDepth+20],[x-halfWidth-16,y+halfDepth+7]]);
  b(c,x-halfWidth,y+halfDepth-4,halfWidth*2,12,'#625c4e');
  b(c,x-halfWidth+3,y+halfDepth+1,halfWidth*2-6,4,'#a09a83');
}

function paintClosedFrontage(c,f){
  const [edge,shadow,wall,light]=f.wall;
  b(c,-108,23,216,62,edge);
  b(c,-105,25,210,55,shadow);
  for(let y=32;y<76;y+=10)for(let x=-103+(y%20?0:9);x<100;x+=26){
    b(c,x,y,Math.min(23,104-x),8,wall);
    if((y+x)%5===0)b(c,x+2,y,Math.min(14,102-x),1,light);
  }
  for(const x of [-66,66]){
    c.save();c.translate(x,79);frontageBay(c,f);c.restore();
    b(c,x-28,79,56,4,f.trim[0]);b(c,x-27,79,54,1,f.trim[2]);
  }
  b(c,-17,39,34,45,f.trim[0]);
  b(c,-14,42,28,40,f.trim[1]);
  b(c,-11,44,22,16,f.glass);
  b(c,-1,44,2,16,f.trim[0]);b(c,-11,52,22,2,f.trim[0]);
  b(c,7,65,4,3,f.mark);b(c,-20,81,40,3,light);
  frontageRoof(c,f);
}

export function drawClosedFrontage(c,frontage){
  const {x,y,theme,halfWidth=98,halfDepth=78}=frontage;
  c.save();c.translate(x,y+halfDepth-78);c.scale(halfWidth/98,1);c.imageSmoothingEnabled=false;
  let sprite=frontageRasters.get(theme);
  if(!sprite&&typeof document!=='undefined'){
    sprite=document.createElement('canvas');sprite.width=248;sprite.height=230;
    const pen=sprite.getContext('2d');pen.translate(124,141);
    paintClosedFrontage(pen,themes[theme]);frontageRasters.set(theme,sprite);
  }
  if(sprite)c.drawImage(sprite,-108,-127,216,207);
  else{c.scale(.87,.9);paintClosedFrontage(c,themes[theme]);}
  c.restore();
}

const nocturnePalette={bed:'#333641',stones:['#40424d','#4d4b55','#565362','#5b5868','#474653'],light:'#706b7d'};
const nocturnePavers=new Map();
const nocturneWidths=[24,32,19,27,34,22];
const nocturneStrip=632;
function paintNocturnePavers(c,variant){
 b(c,0,0,nocturneStrip,84,nocturnePalette.bed);
 const heights=[11,16,13,17,12,15],stones=nocturneWidths.length*4;
 let y=0;
 for(let row=0;row<heights.length;row++){
  const h=heights[(row+variant)%heights.length];
  let x=-(row*13+variant*7)%24;
  for(let stone=0;x<nocturneStrip;stone++){
   const col=stone%stones,w=nocturneWidths[(col+row+variant)%nocturneWidths.length];
   const grain=(row*11+(col+1)*7+row*col*13+variant*9)%27;
   pavingStone(c,x,y,w,h,grain,nocturnePalette);
   x+=w;
  }
  y+=h;
 }
}
export function drawNocturnePaving(c,routes,bounds){
 const visible=routes.filter(box=>box.x+box.w>Math.max(8460,bounds.left)&&box.x<bounds.right&&box.y+box.h>bounds.top&&box.y<bounds.bottom);
 if(!visible.length)return;
 c.save();c.beginPath();
 for(const box of visible){
  const start=Math.max(box.x,8460);
  if(start<box.x+box.w)c.rect(start,box.y,box.x+box.w-start,box.h);
 }
 c.clip();
 for(let y=Math.floor(bounds.top/84)*84;y<bounds.bottom;y+=84){
  const variant=(y/84*17)%5;
  let stamp=nocturnePavers.get(variant);
  if(!stamp){
   stamp=document.createElement('canvas');stamp.width=nocturneStrip;stamp.height=84;
   paintNocturnePavers(stamp.getContext('2d'),variant);nocturnePavers.set(variant,stamp);
  }
  for(let x=Math.floor(Math.max(8460,bounds.left)/nocturneStrip)*nocturneStrip;x<bounds.right;x+=nocturneStrip)c.drawImage(stamp,x,y);
 }
 c.restore();
}

export function drawAlleyFountain(c,time) {
  const wet=[[-41,-13],[-34,-18],[34,-18],[41,-13],[41,5],[33,10],[-33,10],[-41,5]];
  c.save();c.translate(8000,4163);
  p(c,'#303d395d',[[-52,-8],[-42,-17],[42,-16],[58,-7],[57,13],[47,23],[-42,24],[-53,17]]);
  p(c,'#49554f',[[-51,-15],[-40,-24],[39,-24],[51,-15],[51,12],[40,22],[-40,22],[-51,12]]);
  p(c,'#777b6f',[[-48,5],[-37,11],[38,11],[48,5],[47,13],[39,20],[-39,20],[-48,12]]);
  b(c,-38,17,77,2,'#919388');b(c,-39,20,79,2,'#565e55');
  for(const x of [-40,-27,-11,6,23,39]){
    b(c,x,10,2,7,'#5f665d');b(c,x+2,12,2,5,'#a0a095');
  }
  p(c,'#a1a392',[[-50,-15],[-39,-24],[39,-24],[50,-15],[50,7],[39,16],[-39,16],[-50,7]]);
  p(c,'#c4c6ac',[[-49,-15],[-39,-23],[37,-23],[46,-17],[46,-15],[38,-19],[-37,-20],[-46,-13]]);
  p(c,'#687f77',[[-45,-13],[-36,-20],[37,-20],[45,-14],[45,6],[36,13],[-36,13],[-45,6]]);
  p(c,'#3d696c',wet);
  c.save();c.beginPath();c.moveTo(...wet[0]);for(const point of wet.slice(1))c.lineTo(...point);c.closePath();c.clip();
  for(let y=-19;y<=10;y+=3){
    const wave=Math.sin(time*2.1+y*.65);
    b(c,-43,y,87,3,wave>.42?'#4a8483':wave<-.55?'#376f76':'#437b7e');
    for(let i=0;i<5;i++){
      const phase=(time*.32+i/5+(y+20)*.019)%1;
      const x=-42+phase*84,width=4+i%4+Math.round((1+wave)*3);
      b(c,x,y,Math.min(width,43-x),1,wave>.4?'#77a99c':'#54928f');
    }
  }
  for(const [side,x,y] of [[-1,-26,-1],[1,27,2]])for(let i=0;i<3;i++){
    const pulse=(time*.95+i/3+side*.09+1)%1,radius=3+pulse*17;
    c.save();c.globalAlpha=(1-pulse)*.8;
    for(const [dx,dy,width] of [[-.86,-.27,.42],[.31,-.27,.43],[-.65,.31,1.3]])
      b(c,x+dx*radius,y+dy*radius,Math.max(1,radius*width),1,'#bce1cf');
    c.restore();
  }
  c.restore();
  b(c,-33,11,66,2,'#a9b5a5');b(c,-35,14,68,1,'#c1c2aa');

  p(c,'#426664',[[-14,0],[-9,-9],[8,-9],[15,-1],[12,5],[-12,5]]);
  p(c,'#646f61',[[-11,-2],[-7,-10],[7,-10],[11,-2],[8,2],[-8,2]]);
  b(c,-8,-4,16,2,'#a8a996');b(c,-7,-42,14,35,'#838b7d');b(c,-5,-42,4,34,'#c1bd9e');
  b(c,4,-42,3,33,'#647466');b(c,-3,-39,2,27,'#a6ab95');b(c,-8,-12,16,3,'#a9a995');
  p(c,'#62786e',[[-20,-42],[-12,-47],[12,-47],[20,-42],[17,-36],[9,-31],[-9,-31],[-16,-36]]);
  p(c,'#a2b3a4',[[-18,-42],[-11,-46],[11,-46],[17,-43],[15,-40],[-14,-39]]);
  p(c,'#508c88',[[-14,-42],[-10,-44],[10,-44],[14,-42],[11,-40],[-11,-40]]);
  b(c,-17,-39,34,2,'#cacbb0');b(c,-11,-34,22,1,'#9fa995');
  b(c,-3,-47,6,5,'#667f75');b(c,-2,-47,3,5,'#abbda7');
  for(const side of [-1,1]){
    for(let i=0;i<=15;i++){
      const phase=i/15,x=side*(15+phase*11),y=-39+phase*phase*36;
      b(c,x,y,2,3,'#82beb988');
      if((i+Math.floor(time*23))%5<3)b(c,x,y+1,1,2,'#cef1db');
    }
    for(let i=0;i<6;i++){
      const age=(time*1.37+i/6+side*.12+1)%1;
      const splashX=side*(26+age*(4+i%3*3)),splashY=1+side*2-age*(1-age)*(29+i*3);
      c.save();c.globalAlpha=1-age;b(c,splashX,splashY,i%3===0?2:1,2,'#daf3d9');c.restore();
    }
  }
  for(let i=0;i<9;i++){
    const age=(time*1.27+i/9)%1,reach=age*age*((i%3)+1)*3,sign=i%2?1:-1;
    const y=-45-age*(1-age)*(73+i%3*8);
    b(c,sign*reach,y,i%4===0?2:1,i%3===0?3:2,i%2?'#c8ebd4':'#90c5b9');
  }
  c.restore();
}

export function paintAlleyHeadstone(c,x,y){
  p(c,'#535b53',[[x-64,y],[x-64,y-19],[x-49,y-28],[x+49,y-28],[x+64,y-19],[x+64,y]]);
  p(c,'#8e9381',[[x-61,y-2],[x-61,y-18],[x-48,y-25],[x+48,y-25],[x+61,y-18],[x+61,y-2]]);
  const name='DIAGON ALLEY';
  drawPixelChatText(c,name,x-pixelChatTextWidth(name)/2,y-15,'#eee0b9');
}
