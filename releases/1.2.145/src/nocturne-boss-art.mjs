import {PLAYER_RENDER_SIZE} from './render-settings.mjs';

export const NOCTURNE_LORD_SIZE=PLAYER_RENDER_SIZE+5;
const ashColors=['#1a2428','#364549','#617a72','#a5b9a2','#cee5c2','#79e29a'];
const fraction=(value)=>Math.max(0,Math.min(1,value));
function seed(id,index,salt){
 let n=Math.imul(id+index*73,0x7feb352d)^Math.imul(salt+index,0x846ca68b);
 n=Math.imul(n^(n>>>16),0x45d9f3b);
 return ((n^(n>>>16))>>>0)/4294967296;
}

export function paintNocturneDissolve(c,animator,actor,pose,time,age,lord){
 const duration=lord?2.6:1.3;
 if(age<0||age>=duration)return;
 const {x,y,id}=pose,progress=age/duration;
 const size=lord?NOCTURNE_LORD_SIZE:PLAYER_RENDER_SIZE;
 const lift=Math.sin(progress*Math.PI*.72)*(lord?16:7);
 c.save();
 const silhouette=fraction(1-progress*1.8);
 if(actor&&silhouette>0){
  const divide=y-size*1.33+size*1.33*(1-silhouette)-lift;
  c.save();c.globalAlpha*=.25+silhouette*.68;
  c.beginPath();
  for(let col=-5;col<5;col++){
   const top=divide+Math.round((seed(id,col,7)-.5)*10);
   c.rect(x+col*5,top,5,y+9-top);
  }
  c.clip();
  animator.draw(c,{...actor,x,y:y-lift,hp:1,hit:0,moving:false,animationAction:'hurt'},time,size);
  c.restore();
 }
 if(progress<.52){
  c.globalAlpha=(1-progress/.52)*.48;
  c.fillStyle='#81eca5';
  const radius=9+progress*59;
  c.beginPath();c.ellipse(x,y+2,radius,radius*.24,0,0,Math.PI*2);c.fill();
 }
 for(let i=0;i<(lord?70:32);i++){
  const local=fraction((progress-seed(id,i,4)*.54)*2);
  if(local<=0||local>=1)continue;
  const from=seed(id,i,3)-.5,side=seed(id,i,9)-.48;
  const startY=y-size*(1.23-seed(id,i,4)*1.87);
  const px=x+from*(24+local*59)+Math.sin(local*8+i)*local*8+side*local*28;
  const py=startY-local*(31+seed(id,i,5)*51)-lift;
  const tint=Math.floor(seed(id,i,10)*ashColors.length);
  const width=local>.45?1:2+Math.floor(seed(id,i,6)*3);
  c.globalAlpha=(1-local)*(.56+.36*seed(id,i,12));c.fillStyle=ashColors[tint];
  c.fillRect(Math.round(px),Math.round(py),width,width===1?1:2);
 }
 c.restore();
}

export function drawNocturneBossSpeech(c,actor,text,bounds){
 c.save();c.font='600 11px system-ui';c.textAlign='center';
 const lines=[];
 let line='';
 for(const word of text.split(/\s+/)){
  const next=line?line+' '+word:word;
  if(line&&c.measureText(next).width>Math.min(204,bounds.right-bounds.left-32)){lines.push(line);line=word;}
  else line=next;
 }
 if(line)lines.push(line);
 const width=Math.ceil(Math.max(...lines.map(line=>c.measureText(line).width)))+18;
 const height=lines.length*13+10,idealY=actor.y-69-height;
 const below=idealY<bounds.top+52&&actor.y+16+height<bounds.bottom-12;
 const x=Math.round(Math.max(bounds.left+8,Math.min(bounds.right-width-8,actor.x-width/2)));
 const y=Math.round(Math.max(bounds.top+8,below?actor.y+16:idealY));
 c.fillStyle='#151f25f2';c.fillRect(x,y,width,height);
 c.strokeStyle='#778c7b';c.strokeRect(x+.5,y+.5,width-1,height-1);
 const notch=Math.max(x+6,Math.min(x+width-6,actor.x));
 c.fillStyle='#b4d3b0';c.fillRect(Math.round(notch)-2,below?y-3:y+height,4,3);
 c.fillStyle='#e2e6cb';
 for(const [i,line] of lines.entries())c.fillText(line,x+width/2,y+13+i*13);
 c.restore();
}
