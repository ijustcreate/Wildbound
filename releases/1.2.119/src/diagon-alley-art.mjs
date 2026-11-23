import {assembleOllivanders,drawOllivandersSubject} from './diagon-wand-shop.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {ALLEY,ALLEY_SHOPS,alleyGate,alleyPrompt,holdingWand} from './diagon-alley.mjs';
import {drawPortal} from './portal-art.mjs';
import {drawSnowyOwl} from './snowy-owl-art.mjs';
import {assembleAlleyShop} from './diagon-shop-scenes.mjs';
import {drawAlleyPaving, streetLamp, drawAlleyFountain, paintAlleyHeadstone} from './diagon-alley-street-art.mjs';
import {drawPortalFlash} from './portal-transition.mjs';
import {shape} from './diagon-shop-brush.mjs';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function text(c,t,x,y,size=14,color='#eee0b4'){c.font=`${size}px Georgia`;c.textAlign='center';c.fillStyle=color;c.fillText(t,x,y);c.textAlign='start';}
export function drawAlleyGate(c,g){const a=alleyGate(g);if(!a)return;const t=g.trainTest,open=t.alleyOpened,progress=open?Math.min(1,(t.time-t.alleyOpenedAt)/.65):0;
 c.save();c.translate(Math.round(a.x),Math.round(a.y));
 shape(c,'#33423966',[[-92,-3],[-72,-18],[78,-15],[102,-3],[98,18],[72,29],[-81,24],[-96,13]]);
 shape(c,'#41483e',[[-90,6],[-90,-75],[-73,-94],[73,-94],[90,-75],[90,6],[80,10],[-80,10]]);
 rect(c,-83,-76,166,78,'#68695a');rect(c,-75,-86,150,10,'#a4a088');
 for(const x of [-80,62]){
  rect(c,x,-77,18,73,'#858572');
  for(let y=-72;y<-7;y+=15){
   rect(c,x+2,y,14,11,'#92907a');rect(c,x+2,y,12,2,'#b2ad92');
   rect(c,x+12,y+3,4,8,'#6b715f');
  }
  rect(c,x-4,-79,26,5,'#b4af93');rect(c,x-3,-7,25,7,'#555f50');
 }
 const stones=['#8b7864','#998573','#aa9278','#817363'];
 for(let row=0;row<7;row++)for(let col=0;col<8;col++){
  const side=col<4?-1:1,dx=side*progress*(30+(3-Math.abs(col-3.5))*10);
  const x=-62+col*16+dx,y=-84+row*12+progress*Math.abs(col-3.5)*-4;
  const tint=(col*3+row*5)%stones.length;
  shape(c,stones[tint],[[x,y+2],[x+2,y],[x+13,y],[x+15,y+2],[x+15,y+10],[x+1,y+10]]);
  if(tint!==3)rect(c,x+2,y+1,10,1,'#ba9e80');
 }
 rect(c,-72,2,144,5,'#96927a');rect(c,-74,7,148,3,'#646c57');
 shape(c,'#637454',[[-85,-70],[-78,-76],[-62,-75],[-57,-71],[-62,-67],[-72,-68],[-79,-63]]);
 shape(c,'#7c875e',[[62,4],[68,-1],[81,-3],[86,1],[83,7],[72,8]]);
 c.restore();
 if(progress>.7)drawPortal(c,{x:a.x,y:a.y-12,color:'#e8c46b',forestTravel:true},t.time,'DIAGON ALLEY');
 if(!open&&g.players.some(p=>holdingWand(p)&&Math.hypot(p.x-a.x,p.y-a.y)<180)){for(let i=0;i<6;i++){const f=(t.time*.6+i/6)%1;rect(c,a.x-50+i*18,a.y-20-f*50,2,2,'#f1d48c');}}
 text(c,open?'Diagon Alley':'An ordinary brick wall?',a.x,a.y+54,11);
}
export function drawDiagonAlley(renderer,g,w,h){const c=renderer.ctx,t=g.trainTest,cam=renderer.camera;
 const halfWidth=w/(2*cam.zoom),halfHeight=h/(2*cam.zoom);
 const visible=(x,y,padX,padY)=>Math.abs(x-cam.x)<halfWidth+padX&&Math.abs(y-cam.y)<halfHeight+padY;
 const shops=ALLEY_SHOPS.filter(s=>visible(s.x,s.y,250,350));
 rect(c,cam.x-halfWidth,cam.y-halfHeight,w/cam.zoom+2,h/cam.zoom+2,'#394942');
 rect(c,ALLEY.left,ALLEY.top,ALLEY.right-ALLEY.left,ALLEY.bottom-ALLEY.top,'#686b61');
 drawAlleyPaving(c,ALLEY,{top:cam.y-halfHeight,bottom:cam.y+halfHeight});
 if(visible(8000,4150,90,80))drawAlleyFountain(c,g.time);
 if(visible(8000,4040,90,80))paintAlleyHeadstone(c,8000,4082);
 const objects=[];
 for(const s of shops){
  if(s.id==='ollivanders')assembleOllivanders(c,s,g,objects);
  else assembleAlleyShop(c,s,g,objects);
 }
 for(const y of [4350,4730,5110,5490]){
  for(const side of [-1,1]){
   const x=8000+side*196;
   if(visible(x,y,32,70))objects.push({depth:y,paint:()=>streetLamp(c,x,y)});
  }
 }
 for(const p of [...g.players,...(t.alleyVisitors||[])])if(visible(p.x,p.y,80,100))objects.push({depth:p.y,player:p});
 for(const a of g.stationOwls||[])if(!a.hidden&&visible(a.x,a.y,80,100))objects.push({depth:a.y,owl:a});
 for(const a of objects.sort((a,b)=>a.depth-b.depth)){
  if(a.paint)a.paint();
  if(a.shopAsset)drawOllivandersSubject(c,a);
  if(a.player)renderer.animator.draw(c,{...a.player,y:a.player.y-(a.player.jumpHeight||0)},g.time,PLAYER_RENDER_SIZE);
  if(a.owl)drawSnowyOwl(c,a.owl,g.time);
 }
 drawPortal(c,{x:8000,y:5660,color:'#e8c46b',forestTravel:true},g.time,'RETURN');text(c,'Return to Jungle Ruins station',8000,5725,12);
 c.restore();
 const nearWorkshop=g.players.some(p=>shops.some(s=>Math.hypot(p.x-s.x,p.y-s.y)<188));
 if(!nearWorkshop){
  rect(c,16,16,244,46,'#152b2ce8');c.font='17px Georgia';c.fillStyle='#edddb2';c.fillText('Diagon Alley',27,36);
  c.font='10px system-ui';c.fillText('Walk into a shop · Interact to browse',27,51);
 }
 for(const p of g.players){const prompt=alleyPrompt(g,p);if(prompt){c.textAlign='center';c.font='bold 13px system-ui';c.fillStyle='#e8d49a';c.fillText((p.device==='keyboard'?'E':'Interact')+' · '+prompt,w/2,h-30);c.textAlign='start';break;}}
 if(t.noticeUntil>t.time){c.font='13px system-ui';c.fillStyle='#f1e4bf';c.fillText(t.notice,22,h-55);}drawPortalFlash(c,g,w,h);
}
