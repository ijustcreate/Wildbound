import {block as b,shape as p,line as l,casework} from './diagon-shop-brush.mjs';
import {drawPixelChatText,pixelChatTextWidth} from './pixel-chat-font.mjs';
import {HOGSMEADE_BUILDINGS,HOGSMEADE_PROPS,HOGSMEADE_LANE,hogsmeadeDoor,inHogsmeadeBuilding} from './hogsmeade-layout.mjs';
import {HOGSMEADE_NPCS,hogsmeadeDoors} from './hogsmeade.mjs';

const materials={
 oak:['#3a2c24','#5e4330','#855c3d','#ab8253','#dcc18a'],rust:['#402c2b','#694542','#975d4b','#bc7f63','#e9b586'],
 brass:['#40362b','#645438','#998054','#c4a86c','#f2d89b'],amber:['#3f3029','#70503a','#a26d35','#ca9748','#ffe0a0'],
 moss:['#353832','#535747','#747861','#959578','#c2c2a2'],green:['#303a35','#486051','#618766','#8aa472','#c7dda0'],
 plum:['#3c2f3c','#61465d','#82556f','#ac7790','#d8b2bc'],blue:['#29353f','#405769','#5f7f91','#8dadb6','#c7dad7'],
};
const fronts={
 inn:{wall:'#5c463c',plaster:'#a68a69',trim:'#4b342b',roof:['#40555b','#526c6f','#6b8485'],glass:'#e5b76c',floor:'#8e674a'},
 joke:{wall:'#573e54',plaster:'#a37787',trim:'#432f43',roof:['#424051','#585a70','#746d88'],glass:'#d89899',floor:'#8a6970'},
 shack:{wall:'#484843',plaster:'#797364',trim:'#3f3930',roof:['#414648','#565753','#646764'],glass:'#43565a',floor:'#625a4c'},
};
const lit=(g,site)=>g.players.some(a=>a.hp>0&&!a.room&&inHogsmeadeBuilding(site,a.x,a.y,-2));
const visibleSite=(site,bounds)=>site.x+site.w/2+110>bounds.left&&site.x-site.w/2-110<bounds.right&&site.y+site.h/2+100>bounds.top&&site.y-site.h/2-140<bounds.bottom;
const floorCache=new Map(),roofCache=new Map(),propCache=new Map();
const countertopDepth={
 'butterbeer-tankards':-19.9,'mince-pie-tray':-19.8,'ceramic-plates':37.1,
 'nose-biting-teacup-tray':-23.9,'brass-packet-scales':-23.8,
};

function text(c,value,x,y,tone='#efdab5'){
 drawPixelChatText(c,value,x-pixelChatTextWidth(value)/2,y,tone);
}

function paintFloor(c,z,f){
 const x=z.x-z.w/2,y=z.y-z.h/2;
 b(c,x,y,z.w,z.h,f.floor);
 for(let row=0;row<z.h;row+=9){
  b(c,x,y+row,z.w,1,'#42383366');b(c,x,y+row+1,z.w,1,'#ccaa7b42');
  for(let i=16+row%27;i<z.w-2;i+=29){b(c,x+i,y+row+2,1,Math.min(7,z.h-row-1),'#493f3655');b(c,x+i+3,y+row+5,6+(i%7),1,'#dabc8847');}
 }
 if(z.tone!=='shack'){
  const color=z.tone==='inn'?'#694853':'#553c61';
  b(c,z.x-30,z.y+29,60,40,'#4b3941');b(c,z.x-27,z.y+31,54,35,color);
  for(let i=-18;i<=18;i+=12){b(c,z.x+i-2,z.y+48,5,2,'#b99362');b(c,z.x+i,z.y+46,1,6,'#baa16a');}
  b(c,z.x-25,z.y+34,50,1,'#a07c68');b(c,z.x-25,z.y+62,50,1,'#a07c68');
 }else{
  for(let i=0;i<13;i++){const x=z.x-79+(i*37)%152,y=z.y-61+(i*43)%120;b(c,x,y,6+i%7,2,'#35362f66');}
 }
}

function cachedArt(c,cache,site,rect,paint){
 if(typeof document==='undefined'){paint(c);return;}
 let surface=cache.get(site.id);
 if(!surface){
  surface=document.createElement('canvas');surface.width=rect.w;surface.height=rect.h;
  const pen=surface.getContext('2d');pen.translate(-rect.x,-rect.y);paint(pen);cache.set(site.id,surface);
 }
 c.drawImage(surface,rect.x,rect.y);
}

export function drawHogsmeadeGround(c,g,bounds){
 if(!g.trainTest?.design.wildLands||g.trainTest.design.activeRoom)return;
 const {left,right,top,bottom}=HOGSMEADE_LANE;
 if(bounds.right<left-20||bounds.left>right+20||bounds.bottom<3920||bounds.top>bottom+20)return;
 p(c,'#b4cbd0',[[left-8,top+17],[left+40,top-4],[right-11,top+2],[right+3,top+27],[right-17,bottom-6],[left+31,bottom-3]]);
 p(c,'#747d77',[[left+5,top+22],[left+41,top+7],[right-17,top+12],[right-7,top+29],[right-24,bottom-14],[left+34,bottom-11]]);
 for(let y=top+20;y<bottom-14;y+=11)for(let x=left+28+(y%9);x<right-16;x+=21){
  if(x<bounds.left-30||x>bounds.right+30)continue;
  const shade=['#858b83','#929a92','#9da49b','#7e8985'][(x+y)%4];
  p(c,shade,[[x,y+2],[x+2,y],[x+16,y],[x+19,y+2],[x+17,y+8],[x+2,y+8]]);b(c,x+3,y+1,12,1,'#c3c9bf66');
 }
 for(const site of HOGSMEADE_BUILDINGS){
  if(!visibleSite(site,bounds))continue;
  const x=site.x-site.w/2,y=site.y-site.h/2,f=fronts[site.tone],door=hogsmeadeDoor(site);
  p(c,'#73828566',[[x-10,y-3],[x+site.w+10,y-3],[x+site.w+14,door.y+9],[x+site.w-10,door.y+17],[x-5,door.y+12]]);
  const path=Math.max(18,top+31-door.y);
  b(c,door.x-23,door.y-2,46,path,'#adbdba');
  for(let i=3;i<path-1;i+=8){b(c,door.x-20,door.y+i,40,6,'#8f9690');b(c,door.x-17,door.y+i,34,1,'#bfc3b6');}
  if(lit(g,site))cachedArt(c,floorCache,site,{x,y,w:site.w,h:site.h},pen=>paintFloor(pen,site,f));
 }
}

function window(c,x,y,w,h,f,boarded){
 b(c,x-w/2-3,y-h-2,w+6,h+5,f.trim);
 b(c,x-w/2,y-h,w,h,boarded?'#394448':f.glass);
 b(c,x-w/2+1,y-h+2,w-3,2,boarded?'#545e5b':'#ffe1aa');
 b(c,x-1,y-h,3,h,f.trim);b(c,x-w/2,y-h*.5,w,2,f.trim);
 b(c,x-w/2-4,y+1,w+8,3,'#d0d9cb');
 if(boarded){l(c,'#40372d',x-w*.64,y-2,x+w*.57,y-h-2,6);l(c,'#857159',x-w*.6,y-3,x+w*.55,y-h-2,4);l(c,'#78674e',x-w*.6,y-h+2,x+w*.6,y-7,4);}
}

function entrance(c,g,z,f){
 const {x,y,half}=hogsmeadeDoor(z),s=hogsmeadeDoors(g,z),open=s.open||s.broken;
 b(c,x-half-3,y-41,half*2+6,43,f.trim);b(c,x-half,y-38,half*2,39,'#292c30');
 if(!open){
  b(c,x-half+2,y-36,half*2-4,36,z.tone==='shack'?'#695843':f.wall);
  for(let i=-10;i<=12;i+=7){b(c,x+i,y-33,1,31,'#493b31');b(c,x+i+1,y-33,1,29,'#a4806466');}
  b(c,x+8,y-19,4,3,'#e1b879');
 }else if(!s.broken){p(c,f.trim,[[x-half,y],[x-half-17,y-7],[x-half-17,y-40],[x-half,y-37]]);l(c,'#bc9564',x-half-13,y-12,x-half-13,y-37,2);}
 b(c,x-half-3,y+1,half*2+6,3,'#b9b5a2');
 if(z.tone==='shack'&&!s.unboarded){
  const colors=['#6b5947','#928066','#705d46'];
  for(let i=0;i<3;i++){
   const y1=y-32+i*10,y2=y1+4-i*3;
   l(c,'#3b352d',x-half-4,y1,x+half+3,y2,8);l(c,colors[i],x-half-3,y1-1,x+half+2,y2-1,5);
   b(c,x-half+1,y1-2,2,2,'#b0a48f');b(c,x+half-3,y2-1,2,2,'#b4a993');
  }
  if(s.boardDamage)l(c,'#3e362c',x-2,y-25,x+4,y-17,2);
 }
 if(s.broken){for(let i=0;i<6;i++)b(c,x-19+(i*11)%40,y+3+(i*5)%9,4+i%4,2,'#75614b');}
}

function facade(c,g,z,f,interior){
 const x=z.x-z.w/2,y=z.y-z.h/2,front=z.y+z.h/2;
 if(interior){
  b(c,x,y-39,z.w,40,f.wall);b(c,x+4,y-36,z.w-8,29,f.plaster);
  for(let i=10;i<z.w-2;i+=31)b(c,x+i,y-35,3,34,f.trim);
  b(c,x,y-6,z.w,6,f.trim);b(c,x,y,5,z.h,f.trim);b(c,x+z.w-5,y,5,z.h,f.trim);
  b(c,x,front-4,z.w/2-18,4,f.trim);b(c,z.x+18,front-4,z.w/2-18,4,f.trim);
  return;
 }
 b(c,x,front-54,z.w,55,f.wall);b(c,x+4,front-50,z.w-8,41,f.plaster);
 for(let i=9;i<z.w-1;i+=33)b(c,x+i,front-54,5,51,f.trim);
 b(c,x,front-6,z.w,6,f.trim);
 for(const i of [-1,1])window(c,z.x+i*z.w*.286,front-11,z.tone==='inn'?36:29,24,f,z.tone==='shack');
 const label=z.name.toUpperCase(),width=pixelChatTextWidth(label)+14;
 b(c,z.x-width/2,front-65,width,14,f.trim);b(c,z.x-width/2+2,front-63,width-4,10,f.wall);
 text(c,label,z.x,front-61,z.tone==='shack'?'#c7b599':'#f2d7a9');
 entrance(c,g,z,f);
}

function roof(c,z,f){
 const x=z.x,w=z.w/2+10,front=z.y+z.h/2-61,back=z.y-z.h/2-35,peak=z.y-z.h/2-76;
 const sway=z.tone==='shack'?16:0;
 const outline=[[x-w,front],[x-w+2,back],[x+sway,peak],[x+w-2,back+2],[x+w,front+3]];
 p(c,'#27373b',outline);
 p(c,f.roof[0],[[x-w+4,front-3],[x-w+6,back+2],[x+sway,peak+3],[x+w-4,back+4],[x+w-4,front-1]]);
 p(c,f.roof[1],[[x-w+6,back+2],[x+sway,peak+3],[x+14,front-5],[x-w+4,front-3]]);
 c.save();c.beginPath();for(const [i,[u,v]] of outline.entries()){if(i)c.lineTo(u,v);else c.moveTo(u,v);}c.closePath();c.clip();
 for(let row=back-25;row<front;row+=8){b(c,x-w,row,w*2,2,'#293a415f');b(c,x-w,row+2,w*2,1,f.roof[2]);
  for(let col=x-w+(row%17+17)%17;col<x+w;col+=18)b(c,col,row+3,1,5,'#293a4153');}
 p(c,'#cbdee1',[[x-w+5,back+3],[x+sway,peak+3],[x+w-4,back+4],[x+w-16,back+13],[x+19,peak+21],[x-8,peak+17],[x-w+12,back+11]]);
 p(c,'#8eafb7',[[x-w+6,back+10],[x-8,peak+15],[x+19,peak+20],[x+w-15,back+12],[x+26,peak+24],[x-6,peak+20],[x-w+11,back+14]]);
 b(c,x-w,front-6,w*2,4,'#adc5c7');
 c.restore();
 const lean=z.tone==='shack'?4:0,chimney=x-w*.62;
 p(c,'#7f756a',[[chimney-10,back+2],[chimney-10+lean,back-33],[chimney+9+lean,back-33],[chimney+9,back+1]]);
 b(c,chimney-12+lean,back-35,23,5,'#c1ced0');
 for(let i=-27;i<0;i+=7)b(c,chimney-8+lean,back+i,16,1,'#534d48');
}

function propPaint(c,prop){
 const x=prop.x+prop.building.x,y=prop.y+prop.building.y,w=prop.w,h=prop.h,r=materials[prop.palette],left=x-w/2;
 const [edge,shadow,body,lit,shine]=r;
 if(prop.id==='nose-biting-teacup-tray'){
  b(c,left,y-3,w,3,'#3b3740');
  for(const offset of [-7,3]){
   p(c,'#b6c9c5',[[x+offset-4,y-12],[x+offset+4,y-12],[x+offset+3,y-4],[x+offset-3,y-4]]);
   b(c,x+offset+3,y-10,3,4,'#879c9a');b(c,x+offset-3,y-12,7,2,'#373545');
   b(c,x+offset-2,y-10,1,2,'#f1e3bf');b(c,x+offset+1,y-10,1,2,'#f1e3bf');
  }
 }else if(prop.id==='fanged-frisbee-stack'){
  for(let i=0;i<3;i++){
   const at=y-i*4;
   p(c,'#482c32',[[x-11,at-2],[x-5,at-5],[x+6,at-5],[x+11,at-2],[x+7,at+1],[x-7,at+1]]);
   b(c,x-8,at-3,16,2,i===2?'#d58964':'#a05f52');
   for(const dx of [-7,-3,3,7])b(c,x+dx,at,1,2,'#dfc4a0');
  }
 }else if(prop.id==='dungbomb-crates'){
  casework(c,left,y,w,h,6,r);
  for(const offset of [-11,-3,5,11]){
   p(c,'#5d4737',[[x+offset-3,y-18],[x+offset-1,y-24],[x+offset+2,y-24],[x+offset+4,y-19],[x+offset+2,y-17]]);
   b(c,x+offset-1,y-23,2,2,'#a37d5d');
  }
 }else if(prop.id==='wildfire-firework-cabinet'){
  casework(c,left,y,w,h,8,r);b(c,left+5,y-h+9,w-10,h-16,'#463438');
  for(let i=7;i<w-6;i+=8){const color=['#bf6a4f','#b79957','#748e7e'][i%3],top=y-h+7+(i*3)%12;
   p(c,color,[[left+i,top+4],[left+i+3,top],[left+i+5,top+4],[left+i+4,y-8],[left+i+1,y-8]]);
   b(c,left+i+1,top+7,3,2,'#ddbc8b');b(c,left+i+2,y-9,1,5,'#bda27d');
  }
 }else if(prop.id==='frog-spawn-soap-tub'){
  casework(c,left,y,w,h,7,r);
  for(const [u,v] of [[-6,-21],[3,-22],[-1,-17],[7,-18]]){
   b(c,x+u,y+v,5,4,'#a3bd80');b(c,x+u,y+v-1,1,1,'#d7e7b4');b(c,x+u+4,y+v-1,1,1,'#d7e7b4');
  }
 }else if(prop.kind==='brooms'){
  b(c,x-27,y-h-12,54,16,edge);b(c,x-25,y-h-10,50,12,shadow);text(c,'INN',x,y-h-8,shine);
  for(const [i,a] of [-13,0,13].entries()){l(c,shadow,x-a,y-h+3,x+a,y-10,3);l(c,lit,x-a,y-h+3,x+a,y-10,1);p(c,shine,[[x+a-3,y-13],[x+a+3,y-13],[x+a+7,y-4],[x+a-6,y-4]]);b(c,x+a-3,y-10,6,2,body);}
 }else if(prop.kind==='hearth'){
  casework(c,left,y,w,h,5,r);p(c,'#332c29',[[x-13,y],[x-12,y-17],[x-8,y-25],[x+8,y-25],[x+12,y-17],[x+13,y]]);
  p(c,'#e08442',[[x-8,y-3],[x-8,y-10],[x-4,y-8],[x+1,y-20],[x+4,y-10],[x+9,y-14],[x+8,y-3]]);b(c,x-4,y-6,9,3,'#ffd687');
 }else if(prop.kind==='food'||prop.kind==='display'||prop.kind==='bottles'){
  b(c,left,y-3,w,3,edge);
  for(let i=3;i<w-4;i+=6){const rise=prop.kind==='bottles'?8+(i%11)+3:4+(i%5),top=y-rise;
   b(c,left+i,top,5,rise,shadow);b(c,left+i+1,top+1,3,rise-3,body);b(c,left+i+1,top+2,1,Math.max(1,rise-4),shine);
   if(prop.kind==='bottles')b(c,left+i+1,top-2,3,3,lit);else b(c,left+i+4,top+3,2,3,lit);
  }
 }else if(prop.kind==='table'){
  for(const dx of [-w*.33,w*.31]){b(c,x+dx-2,y-11,5,12,edge);b(c,x+dx-1,y-11,2,10,body);}
  p(c,edge,[[left,y-12],[left+3,y-h+4],[x-w*.3,y-h],[x+w*.3,y-h],[left+w-3,y-h+4],[left+w,y-12],[x+w*.29,y-8],[x-w*.29,y-8]]);
  p(c,lit,[[left+3,y-12],[left+5,y-h+5],[x-w*.28,y-h+2],[x+w*.28,y-h+2],[left+w-5,y-h+5],[left+w-3,y-12],[x+w*.27,y-10],[x-w*.27,y-10]]);
  b(c,x-w*.28,y-12,w*.56,1,shine);
 }else if(prop.kind==='bench'){
  b(c,left+3,y-7,4,8,edge);b(c,left+w-8,y-7,4,8,edge);
  b(c,left+3,y-h,w-6,h-4,edge);b(c,left+5,y-h+2,w-10,h-6,body);
  b(c,left+5,y-h+3,w-10,2,shine);
  p(c,lit,[[left+4,y-9],[left+w-4,y-9],[left+w,y-5],[left+w-3,y-3],[left+3,y-3],[left,y-5]]);
  b(c,left+3,y-5,w-6,2,shadow);b(c,left,y-h+3,4,h-5,edge);b(c,left+w-4,y-h+3,4,h-5,edge);
 }else if(prop.id==='butterbeer-keg'){
  p(c,edge,[[x-10,y],[x-13,y-7],[x-12,y-20],[x-7,y-27],[x+7,y-27],[x+12,y-22],[x+13,y-7],[x+9,y]]);
  p(c,body,[[x-9,y-2],[x-11,y-8],[x-10,y-20],[x-6,y-25],[x+6,y-25],[x+10,y-20],[x+10,y-7],[x+8,y-2]]);
  for(const row of [-21,-8]){b(c,x-11,y+row,22,3,edge);b(c,x-10,y+row,14,1,shine);}
  b(c,x-3,y-13,7,3,shine);b(c,x+2,y-11,2,4,shadow);
 }else if(prop.kind==='mirror'||prop.kind==='picture'){
  b(c,left,y-h,w,h,edge);b(c,left+2,y-h+2,w-4,h-4,lit);b(c,left+4,y-h+4,w-8,h-8,body);
  if(prop.kind==='mirror')for(const end of [[-7,-2],[7,-5],[8,-18],[-9,-25]])l(c,shadow,x,y-h*.55,x+end[0],y+end[1],1);
  else{b(c,x-4,y-h*.68,8,10,shine);b(c,x-5,y-h*.41,11,5,shadow);}
 }else if(prop.kind==='scars'||prop.kind==='debris'){
  for(let i=0;i<8;i++){const u=left+2+(i*17)%(w-5),v=y-3-(i*5)%h;l(c,i%2?shadow:lit,u,v,u+3+i%4,v-2,1);}
 }else if(prop.kind==='lamp'){
  b(c,x-2,y-h,4,h,edge);b(c,x-6,y-h+2,12,11,shadow);b(c,x-4,y-h+3,8,8,prop.building.tone==='shack'?body:shine);b(c,x-7,y-3,14,3,body);
 }else if(prop.kind==='fabric'||prop.kind==='rack'){
  b(c,left,y-h,w,3,edge);
  for(let i=3;i<w-4;i+=6){b(c,left+i,y-h+3,4,h-5-i%7,i%3?body:lit);b(c,left+i+1,y-h+4,1,h-9-i%7,shine);}
 }else{
  casework(c,left,y,w,h,Math.max(4,Math.round(h*.28)),r);
  if(['case','cabinet','crate','piano'].includes(prop.kind))for(let i=9;i<w-3;i+=11){b(c,left+i,y-h*.61,1,h*.56,shadow);b(c,left+i+2,y-h*.35,3,2,shine);}
  if(prop.kind==='piano')for(let i=7;i<w-6;i+=3){b(c,left+i,y-11,2,5,shine);if(i%2)b(c,left+i+1,y-13,1,3,edge);}
  if(prop.kind==='bed'){b(c,left+8,y-h+6,w-16,8,shine);b(c,left+5,y-h+16,w-10,19,body);b(c,left+8,y-h+18,w-17,2,lit);}
  if(prop.kind==='cauldron'){b(c,left+4,y-h+3,w-8,5,edge);b(c,left+6,y-h+3,w-12,2,shine);}
 }
}

export function hogsmeadeSubjects(g,visible){
 if(!g.trainTest?.design.wildLands||g.trainTest.design.activeRoom)return [];
 const result=[];
 for(const site of HOGSMEADE_BUILDINGS){
  if(!visible(site,site.w/2+110))continue;
  const inside=lit(g,site),f=fronts[site.tone],door=hogsmeadeDoor(site);
  if(inside){
   result.push({depth:site.y-site.h/2,paint:c=>facade(c,g,site,f,true)});
   result.push({depth:door.y,paint:c=>entrance(c,g,site,f)});
  }else{
   result.push({depth:door.y,paint:c=>{
    const x=site.x-site.w/2-16,y=site.y-site.h/2-82;
    cachedArt(c,roofCache,site,{x,y,w:site.w+32,h:site.h+85},pen=>roof(pen,site,f));
    facade(c,g,site,f,false);
   }});
  }
  for(const prop of HOGSMEADE_PROPS)if(prop.building===site&&(inside?!prop.outside:prop.outside)){
   const width=prop.w+32,height=prop.h+48;
   const rect={x:site.x+prop.x-Math.ceil(width/2),y:site.y+prop.y-height+19,w:width,h:height};
   result.push({depth:site.y+(countertopDepth[prop.id]??prop.y),paint:c=>cachedArt(c,propCache,prop,rect,pen=>propPaint(pen,prop))});
  }
  if(inside)for(const npc of HOGSMEADE_NPCS)if(npc.building===site.id)result.push({depth:npc.y,npc});
 }
 for(const npc of HOGSMEADE_NPCS)if(!npc.building&&visible(npc,75))result.push({depth:npc.y,npc});
 return result.map(o=>({depth:o.depth,hogsmeade:o}));
}
