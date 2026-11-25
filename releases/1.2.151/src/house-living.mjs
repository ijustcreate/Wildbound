import {unwrapChristmasGift} from './holiday-decor.mjs';
import {interactChicken} from './chicken-carry.mjs';
const distanceTo=(p,f)=>Math.hypot(p.x-Math.max(f.x,Math.min(f.x+f.w,p.x)),p.y-Math.max(f.y,Math.min(f.y+f.h,p.y)));
export function houseLivingTarget(g,p){
 if(p.room||p.ui||p.vehicleId||p.hp<=0)return null;
 const target=(g.house?.furniture||[]).filter(f=>!f.destroyed&&(['stove','sink','bed'].includes(f.kind)||f.kind==='wrapped_gift'&&!f.opened)&&distanceTo(p,f)<44).sort((a,b)=>distanceTo(p,a)-distanceTo(p,b))[0];
 if(!target)return null;
 // A closer doorway keeps priority over adjacent bedroom or kitchen furniture.
 if((g.house?.doors||[]).some(d=>!d.destroyed&&distanceTo(p,d)<distanceTo(p,target)))return null;
 return target;
}
export function interactHouseLiving(g,p){
 const f=houseLivingTarget(g,p);if(!f)return false;
 if(f.kind==='wrapped_gift')return unwrapChristmasGift(g,p,f);
 if(f.kind==='bed'){
  if(p.heldChickenId)interactChicken(g,p);
  if((g.players||[]).some(q=>q!==p&&q.bedRest?.x===f.x&&q.bedRest?.y===f.y)){g.message('This bed is occupied.');return true;}
  const exits=[{x:p.x,y:p.y},{x:f.x-18,y:f.y+f.h*.55},{x:f.x+f.w+18,y:f.y+f.h*.55},{x:f.x+f.w/2,y:f.y+f.h+25}];
  const exit=exits.find(q=>!g.blocked?.(q.x,q.y,8,false,false,false,14));if(!exit)return false;
  p.bedRest={seed:g.seed,x:f.x,y:f.y,w:f.w,h:f.h,exit};p.x=f.x+f.w/2;p.y=f.y+30;p.sleeping=1;p.bedRestAge=0;p.moving=false;p.attack=0;p.charge=0;p.dashTime=0;p.slideX=p.slideY=0;p.faceX=0;p.faceY=1;
  g.message('Resting. Move or jump to wake up.');
 }else{f.applianceOn=!f.applianceOn;g.message((f.kind==='sink'?'Tap':'Stove')+(f.applianceOn?' on.':' off.'));}
 g.persist?.();return true;
}
export function wakeFromBed(p){
 const rest=p.bedRest;if(!rest)return;
 p.x=rest.exit.x;p.y=rest.exit.y;p.sleeping=0;p.groundHeight=0;p.jumpHeight=0;p.jumpVelocity=0;p.jumpHeld=false;delete p.bedRest;delete p.bedRestAge;
}
export function tickHouseLiving(g,dt,inputs={}){
 for(const f of g.house?.furniture||[])if(!f.destroyed&&f.kind==='sink')f.waterLevel=Math.max(0,Math.min(1,(f.waterLevel||0)+(f.applianceOn ? .22 : -.09)*dt));
 for(const p of g.players||[]){if(!p.bedRest)continue;
  if(p.bedRest.seed!==g.seed){delete p.bedRest;delete p.bedRestAge;p.sleeping=0;continue;}
  const i=inputs[p.device]||{},bed=(g.house?.furniture||[]).find(f=>f.kind==='bed'&&!f.destroyed&&f.x===p.bedRest.x&&f.y===p.bedRest.y);
  const waking=Math.hypot(i.x||0,i.y||0)>.15||i.jump||i.attack||i.dodge;
  if(p.bedRest.wakeAfterRelease&&!waking)delete p.bedRest.wakeAfterRelease;
  if(!bed||p.room||p.ui||p.hp<=0||p.hit>0||waking&&!p.bedRest.wakeAfterRelease){wakeFromBed(p);continue;}
  p.sleeping=1;p.bedRestAge=(p.bedRestAge||0)+dt;p.hp=Math.min(p.maxHp||100,p.hp+(p.maxHp||100)*.16*dt);p.moving=false;
 }
}
export function drawHouseAppliances(c,g,showPrompt=true){
 for(const f of g.house?.furniture||[]){if(f.destroyed)continue;const {x,y,w,h}=f,t=g.time||0;
  if(f.kind==='stove'&&f.applianceOn){c.save();for(const [i,px]of [w*.27,w*.73].entries())for(const [j,py]of [h*.05,h*.48].entries()){
   const cx=x+px,cy=y+py,flame=2+Math.floor((Math.sin(t*15+i*3+j*5)+1)*1.4);c.fillStyle='#df7646';c.beginPath();c.ellipse(cx,cy+1,5,2.5,0,0,Math.PI*2);c.fill();
   for(const dx of [-3,0,3]){c.fillStyle='#5a9cbd';c.fillRect(Math.round(cx+dx),Math.round(cy-2),2,3);c.fillStyle='#ffd58a';c.fillRect(Math.round(cx+dx),Math.round(cy-flame),1,flame);}
  }c.restore();}
  if(f.kind==='sink'&&(f.applianceOn||f.waterLevel>0)){c.save();const level=f.waterLevel||0,left=x+6,top=y-4,width=w-12,height=h-13;
   c.globalAlpha=.35+level*.4;c.fillStyle='#4c9dba';c.fillRect(left+1,top+height*(1-level),width-2,Math.max(1,height*level));c.globalAlpha=1;
   if(level>.02){c.fillStyle='#a4d3cd';for(let i=0;i<3;i++){const yy=top+height*(1-level)+2+i*4;c.fillRect(Math.round(left+4+Math.sin(t*3+i)*2),Math.round(yy),Math.max(2,width-10-i*2),1);}}
   if(f.applianceOn){c.fillStyle='#b6e9df';c.fillRect(Math.round(x+w/2+2),y-10,2,Math.round(h*.35+3));c.fillStyle='#77c3d0';c.fillRect(Math.round(x+w/2+3),y-7+Math.floor(t*18)%4,1,6);c.fillStyle='#d8f1e0';c.fillRect(Math.round(x+w/2),Math.round(y+h*.35-1),5,1);}
   c.restore();
  }
 }
 const target=showPrompt&&(g.players||[]).filter(p=>!p.bedRest).map(p=>houseLivingTarget(g,p)).find(Boolean);if(target){const label=target.kind==='wrapped_gift'?'Unwrap gift':target.kind==='bed'?'Sleep':(target.kind==='sink'?'Tap':'Stove')+(target.applianceOn?' off':' on');c.save();c.font='8px sans-serif';c.textAlign='center';c.fillStyle='#f0dfb7';c.fillText('Interact · '+label,target.x+target.w/2,target.y-23);c.restore();}
}
export function drawBedSleeper(c,p,time,animator){
 const b=p.bedRest;if(!b)return false;
 c.save();c.translate(p.x,p.y);c.rotate(-Math.PI/2);animator.draw(c,{...p,x:0,y:0,animationAction:'sleep',jumpHeight:0,groundHeight:0,faceX:0,faceY:1},time,55);c.restore();
 c.save();const rise=Math.sin((p.bedRestAge||0)*2.2)*.5;c.fillStyle='#638680';c.fillRect(b.x+7,b.y+25+rise,b.w-14,b.h-35-rise);c.fillStyle='#91aaa0';c.fillRect(b.x+9,b.y+26+rise,b.w-18,3);c.restore();return true;
}
