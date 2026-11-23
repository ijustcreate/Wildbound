import {pixelChatTextWidth,drawPixelChatText} from './pixel-chat-font.mjs';
export const CHAT_THEMES=Object.freeze({paper:{ink:'#ece7db',edge:'#142027',fill:'#263641',shade:'#1d2b34',name:'#c5ab77'},night:{ink:'#f3efdf',edge:'#171925',fill:'#2e3045',shade:'#252738',name:'#e7c370'}});
export const PIXEL_CHAT_STYLES=Object.freeze(['round','box','thought','soft','shout','burst']);
export const PIXEL_CHAT_TAILS=Object.freeze(['bottom-left','bottom-right','top-left','top-right']);
export function chatLines(text,measure,maxWidth){
 const lines=[];let line='';
 for(const word of String(text).split(/\s+/).filter(Boolean)){
  if(measure(word)>maxWidth){if(line){lines.push(line);line='';}let part='';for(const ch of word){if(part&&measure(part+ch)>maxWidth){lines.push(part);part='';}part+=ch;}line=part;continue;}
  const next=line?line+' '+word:word;if(line&&measure(next)>maxWidth){lines.push(line);line=word;}else line=next;
 }if(line)lines.push(line);return lines.length?lines:[''];
}
export function chatLayout(c,{text,name='',anchorX,anchorY,width,height,maxWidth=136,margin=6,topInset=margin,bottomInset=margin,maxLines=3,page=0,style='round',lineHeight=9,nameHeight=10,verticalPadding=14,avoid=[],preferSide=false,previous,measure=s=>c.measureText(s).width}){
 const padding=style==='round'?32:20,usable=Math.max(32,Math.min(maxWidth,width-margin*2)),inner=Math.max(16,usable-padding),allLines=chatLines(text,measure,inner),limit=Math.max(1,Math.floor(maxLines)),pages=Math.ceil(allLines.length/limit),pageIndex=Math.max(0,Math.floor(page))%pages,lines=allLines.slice(pageIndex*limit,(pageIndex+1)*limit),bodyWidth=Math.min(usable,Math.max(48,Math.ceil(Math.max(measure(name),...allLines.map(measure)))+padding)),bodyHeight=verticalPadding+Math.min(limit,allLines.length)*lineHeight+(name?nameHeight:0);
 const canAbove=anchorY-bodyHeight-8>=topInset,idealX=canAbove?anchorX-bodyWidth/2:anchorX+bodyWidth+12<=width-margin?anchorX+12:anchorX-bodyWidth-12;
 const initial={x:idealX,y:canAbove?anchorY-bodyHeight-8:anchorY+10,side:canAbove?'top':'bottom'},candidates=[];
 if(previous?.w===bodyWidth&&previous?.h===bodyHeight)candidates.push({x:anchorX+previous.dx,y:anchorY+previous.dy,side:previous.side,retained:true});
 if(!preferSide)candidates.push(initial);
 for(const gap of [14,38,62,86])for(const shift of [0,-bodyHeight/2-12,bodyHeight/2+12,-bodyHeight/2-36,bodyHeight/2+36])for(const side of ['right','left'])candidates.push({x:side==='right'?anchorX+gap:anchorX-bodyWidth-gap,y:anchorY-bodyHeight/2+shift,side});
 for(const gap of [12,36,60])candidates.push({x:anchorX-bodyWidth/2,y:anchorY-bodyHeight-gap,side:'top'},{x:anchorX-bodyWidth/2,y:anchorY+gap,side:'bottom'});
 let best=null;for(const [rank,q]of candidates.entries()){
  const x=Math.round(Math.max(margin,Math.min(width-margin-bodyWidth,q.x))),y=Math.round(Math.max(topInset,Math.min(height-bottomInset-bodyHeight,q.y)));
  const side=anchorX<x?'right':anchorX>x+bodyWidth?'left':anchorY>=y+bodyHeight/2?'top':'bottom';
  const overlap=avoid.reduce((sum,r)=>sum+Math.max(0,Math.min(x+bodyWidth,r.x+r.w)-Math.max(x,r.x))*Math.max(0,Math.min(y+bodyHeight,r.y+r.h)-Math.max(y,r.y))*(r.weight??1),0),distance=Math.hypot(Math.max(x-anchorX,0,anchorX-x-bodyWidth),Math.max(y-anchorY,0,anchorY-y-bodyHeight)),score=overlap*1000+distance*.1+rank*.2+(q.retained?-10:0)+(preferSide&&['top','bottom'].includes(side)?40:0)+(!avoid.length&&!preferSide&&rank>0&&!q.retained?20:0);
  if(!best||score<best.score)best={x,y,side,score,overlap};
 }
 const {x,y,side}=best,above=anchorY>=y+bodyHeight/2;
 return {x,y,w:bodyWidth,h:bodyHeight,lines,pages,page:pageIndex,above,side,anchorX,anchorY,overlap:best.overlap,tail:Math.round(Math.max(x+10,Math.min(x+bodyWidth-11,anchorX))),lean:Math.sign(anchorX-(x+bodyWidth/2))||1};
}
const masks=new Map();
export function chatSilhouette(w,h,style='round'){
 const key=w+':'+h+':'+style;let saved=masks.get(key);if(saved)return saved;
 const data=new Uint8Array(w*h),radius=style==='box'?3:Math.min(style==='soft'?12:18,Math.floor(h*.45),Math.floor(w*.3));
 const spikes=[0,2,4,2,0,1,3,1];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const edge=Math.min(y,h-1-y),inset=edge<radius?Math.round(radius-Math.sqrt(Math.max(0,radius*radius-(radius-edge-.5)**2))):0;
  if(style==='round'){if(((x+.5-w/2)/(w/2))**2+((y+.5-h/2)/(h/2))**2>1)continue;}
  else if(style==='thought'){const inside=(cx,cy,rx,ry)=>((x+.5-cx*w)/(rx*w))**2+((y+.5-cy*h)/(ry*h))**2<=1;if(!(x>w*.2&&x<w*.8&&y>h*.3&&y<h*.7)&&![[.22,.37,.22,.34],[.43,.25,.23,.25],[.65,.33,.22,.30],[.8,.5,.2,.32],[.65,.75,.23,.25],[.35,.76,.25,.24],[.17,.6,.17,.32]].some(q=>inside(...q)))continue;}
  else if(x<inset||x>=w-inset)continue;
  if(['shout','burst'].includes(style)){const scale=style==='burst'?1.5:1,period=style==='burst'?4:2;if(y<spikes[Math.floor(x/period)%8]*scale||h-1-y<spikes[Math.floor((x+4)/period)%8]*scale||x<spikes[Math.floor(y/period)%8]*scale||w-1-x<spikes[Math.floor((y+4)/period)%8]*scale)continue;}
  data[y*w+x]=1;
 }
 if(['shout','burst'].includes(style)){
  const seen=new Uint8Array(w*h),queue=[Math.floor(h/2)*w+Math.floor(w/2)];seen[queue[0]]=1;
  for(let i=0;i<queue.length;i++){const at=queue[i],x=at%w;for(const next of [x?at-1:-1,x<w-1?at+1:-1,at-w,at+w])if(next>=0&&next<data.length&&data[next]&&!seen[next]){seen[next]=1;queue.push(next);}}
  for(let i=0;i<data.length;i++)if(!seen[i])data[i]=0;
 }
 const spans=[];for(let y=0;y<h;y++){let start=0,color=-1;for(let x=0;x<=w;x++){const index=y*w+x,on=x<w&&data[index],next=!on?-1:x===0||y===0||x===w-1||y===h-1||!data[index-1]||!data[index+1]||!data[index-w]||!data[index+w]?0:!data[index+w*2]&&y>h/2?2:1;if(next!==color){if(color>=0)spans.push([start,y,x-start,color]);start=x;color=next;}}}
 if(masks.size>=96)masks.delete(masks.keys().next().value);masks.set(key,spans);return spans;
}
export function drawPixelChatFrame(c,b,{theme='paper',style='round',tail}={}){
 const p=CHAT_THEMES[theme]||CHAT_THEMES.paper,colors=[p.edge,p.fill,p.shade];
 const spans=chatSilhouette(b.w,b.h,style);for(const [x,y,w,color]of spans){c.fillStyle=colors[color];c.fillRect(b.x+x,b.y+y,w,1);}
 if(!tail&&['left','right'].includes(b.side)){
  const left=b.side==='right',row=Math.round(Math.max(10,Math.min(b.h-11,(b.anchorY??b.y+b.h/2)-b.y))),cells=spans.filter(([,y])=>y===row),edge=left?Math.min(...cells.map(([x])=>x))+1:Math.max(...cells.map(([x,,w])=>x+w))-2,base=b.x+edge,at=b.y+row;
  if(style==='thought'){for(const [i,size]of [5,3,1].entries())chatDot(c,Math.round(base+(left?-1:1)*(5+i*5)-(left?size:0)),at-Math.floor(size/2),size,p);return;}
  for(let step=0;step<6;step++){const x=base+(left?-step:step),h=11-step*2;c.fillStyle=p.edge;c.fillRect(x,at-Math.floor(h/2),1,h);if(step<5){c.fillStyle=p.fill;c.fillRect(x,at-Math.floor(h/2)+1,1,h-2);}}return;
 }
 const upper=tail?tail.startsWith('top'):!b.above,lean=tail?(tail.endsWith('left')?-1:1):b.lean,at=tail?b.x+(lean<0?Math.min(20,b.w/3):b.w-Math.min(20,b.w/3)):Math.max(b.x+20,Math.min(b.x+b.w-21,b.tail));
 const column=Math.round(at-b.x),rows=spans.filter(([x,,w])=>column>=x&&column<x+w).map(([,y])=>y),base=b.y+(upper?Math.min(...rows)+1:Math.max(...rows)-1);
 if(style==='thought'){
  for(const [i,size]of [5,3,1].entries())chatDot(c,Math.round(at+lean*(i*4+2)),upper?base-5-i*4:base+3+i*4,size,p);return;
 }
 for(let row=0;row<6;row++){const y=upper?base-row:base+row,width=11-row*2,center=at+Math.round(lean*row*.5);c.fillStyle=p.edge;c.fillRect(center-Math.floor(width/2),y,width,1);if(row<5){c.fillStyle=p.fill;c.fillRect(center-Math.floor(width/2)+1,y,width-2,1);}}
}
function chatDot(c,x,y,size,p){c.fillStyle=p.edge;if(size===1)c.fillRect(x,y,1,1);else{c.fillRect(x+1,y,size-2,size);c.fillRect(x,y+1,size,size-2);}if(size>2){c.fillStyle=p.fill;c.fillRect(x+1,y+1,size-2,size-2);}}
export function drawPixelChat(c,options){
 c.save();c.font='12px Georgia, serif';c.textBaseline='top';
 const measure=text=>c.measureText(text).width,available=options.height-(options.topInset??6)-(options.bottomInset??6),nameHeight=options.name?17:0;
 const maxLines=Math.max(1,Math.min(options.maxLines??3,Math.floor((available-22-nameHeight)/14)));
 const b=chatLayout(c,{...options,maxWidth:Math.min(220,Math.round((options.maxWidth||136)*1.45)),maxLines,lineHeight:14,nameHeight:17,verticalPadding:22,measure}),p=CHAT_THEMES[options.theme]||CHAT_THEMES.paper;
 c.save();c.globalAlpha*=.18;drawPixelChatFrame(c,{...b,x:b.x+2,y:b.y+3,anchorX:b.anchorX+2,anchorY:b.anchorY+3,tail:b.tail+2},{...options,theme:'night'});c.restore();
 drawPixelChatFrame(c,b,options);
 // Warm parchment, a restrained inset glint and a readable named-speaker plaque.
 c.fillStyle=options.theme==='night'?'#697386':'#536675';c.fillRect(b.x+10,b.y+3,Math.max(1,b.w-20),1);
 let y=b.y+9;
 if(options.name){c.font='bold 11px Georgia, serif';const width=Math.min(b.w-18,Math.ceil(c.measureText(options.name).width)+14),x=(options.style||'round')==='round'?Math.round(b.x+(b.w-width)/2):b.x+8;
  c.fillStyle=options.theme==='night'?'#344251':'#344752';c.fillRect(x,y-3,width,15);c.fillStyle='#9d8d70';c.fillRect(x+1,y-3,width-2,1);c.fillStyle='#f8ebca';c.fillText(options.name,x+7,y-1);y+=17;
 }
 c.font='12px Georgia, serif';c.fillStyle=p.ink;
 b.lines.forEach((line,i)=>{const x=(options.style||'round')==='round'?Math.round(b.x+(b.w-measure(line))/2):b.x+11;c.fillText(line,x,y+i*14);});
 if(b.pages>1){for(let i=0;i<b.pages;i++){c.fillStyle=i===b.page?p.name:p.shade;c.fillRect(Math.round(b.x+b.w/2-b.pages*3+i*6),b.y+b.h-6,i===b.page?4:2,2);}}
 c.restore();return b;
}
