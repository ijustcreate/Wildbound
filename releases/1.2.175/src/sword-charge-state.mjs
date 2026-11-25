
const clamp=v=>Math.max(0,Math.min(1,v));
export const swordChargeReach=charge=>32+148*clamp(charge/1.2);
export const swordChargeWidth=30;
export const swordFloorLift=p=>p.trainRide?(p.trainVisualLift||20):(p.trainGround||p.groundHeight||0);
const invalid=p=>p.hp<=0||p.ui||p.room||p.consumeInput||p.stun||p.frozen||p.sleeping||p.swimming||p.dashTime||p.heldChickenId;

// This is local cosmetic state. Each event and ghost has a short lifetime and a hard budget.
export function emitSwordPolish(g,p,kind,options={}){
 const effects=g.effects??=[];
 const owned=effects.filter(f=>f.swordPolish&&f.owner===p.id).length,total=effects.filter(f=>f.swordPolish).length;
 if(kind==='trail'&&(owned>=12||total>=64))return false;
 if(owned>=18||total>=72){
  const index=effects.findIndex(f=>f.swordPolish==='trail'&&(owned<18||f.owner===p.id));
  if(index<0)return false;effects.splice(index,1);
 }
 const duration=options.duration??({ready:.38,release:.23,trail:.24,brake:.32,impact:.24,cancel:.18}[kind]||.24);
 effects.push({swordPolish:kind,owner:p.id,x:p.x,y:p.y-swordFloorLift(p),angle:Math.atan2(p.faceY||0,p.faceX||1),power:clamp(p.swordReleasePower??p.charge/1.2),life:duration,duration,...(p.trainRide?{trainCar:p.trainRide.car,trainX:p.trainRide.x,trainY:p.trainRide.y}:{}),...options});
 return true;
}

export function clearSwordPolish(p){
 delete p.swordPolish;delete p.swordChargePreview;delete p.swordChargeReadyTime;
 delete p.swordReleasePower;delete p.swordAfterimages;
}

export function traceSwordCharge(g,p,charge=p.charge){
 const requested=swordChargeReach(charge),n=Math.hypot(p.faceX,p.faceY)||1,dx=(p.faceX||0)/n,dy=(p.faceY||0)/n;
 // Only the native player can charge: its navigation collider is radius 8, foot offset 0.
 const elevation=(p.groundHeight||0)+(p.jumpHeight||0),radius=8,offset=0;
 let length=0;
 for(let at=3;length<requested;at+=3){
  const next=Math.min(at,requested),x=p.x+dx*next,y=p.y+dy*next;
  if(g.mapMode!=='boundless'&&!g.trainTest&&(x<24||y<24||x>1576||y>1576))break;
  if(g.blocked?.(x,y,radius,false,true,false,offset,elevation,false,p))break;
  length=next;
 }
 return {length,requested,blocked:length<requested-1e-6,x:p.x,y:p.y,dx,dy,time:g.time||0};
}

export function updateSwordChargePolish(g,p,dt){
 if(p.swordChargeAim&&p.charge>0&&!invalid(p)){
  const previous=p.swordPolish;
  if(previous?.phase!=='charge')p.swordPolish={phase:'charge',age:0,power:0,angle:Math.atan2(p.faceY,p.faceX),hand1:p.equipment?.hand1,hand2:p.equipment?.hand2};
  const state=p.swordPolish;state.power=clamp(p.charge/1.2);state.angle=Math.atan2(p.faceY,p.faceX);
  const preview=p.swordChargePreview,dx=p.faceX||0,dy=p.faceY||0;
  if(!preview||Math.abs(preview.requested-swordChargeReach(p.charge))>2||Math.hypot(p.x-preview.x,p.y-preview.y)>.5||Math.hypot(dx-preview.dx,dy-preview.dy)>.015||(g.time||0)-preview.time>=.075)p.swordChargePreview=traceSwordCharge(g,p);
  if(p.charge>=1.2&&p.swordChargeReadyTime==null){p.swordChargeReadyTime=g.time||0;emitSwordPolish(g,p,'ready',{power:1});}
 }else if(p.swordPolish?.phase==='charge'){
  if(p.charge>0||!p.attack)emitSwordPolish(g,p,'cancel',{power:p.swordPolish.power});
  clearSwordPolish(p);
 }
}

export function startSwordRelease(g,p,charge){
 const preview=traceSwordCharge(g,p,charge),power=clamp(charge/1.2);
 p.swordReleasePower=power;p.swordAfterimages=[];
 p.swordPolish={phase:'release',age:0,power,dustColor:({ice:'#bfd5d9',desert:'#c7ab7c',swamp:'#8a9c84',graveyard:'#93968e',house:'#aca18a'})[g.generatedEnvironment]||'#a4a080',angle:Math.atan2(p.faceY,p.faceX),hand1:p.equipment?.hand1,hand2:p.equipment?.hand2};
 delete p.swordChargePreview;delete p.swordChargeReadyTime;
 emitSwordPolish(g,p,'release',{power});
 return preview;
}

export function tickSwordPolish(g,p,dt){
 const state=p.swordPolish;
 if(p.swordAfterimages)p.swordAfterimages=p.swordAfterimages.map(a=>({...a,age:a.age+dt})).filter(a=>a.age<a.duration).slice(-4);
 if(!state)return;
 if(invalid(p)||state.hand1!==p.equipment?.hand1||state.hand2!==p.equipment?.hand2){
  if(!p.room)emitSwordPolish(g,p,'cancel',{power:state.power});
  clearSwordPolish(p);p.swordChargeAim=false;p.charge=0;
  delete p.swordDash;delete p.swordStrike;delete p.swordFacing;return;
 }
 state.age+=dt;
 if(state.phase!=='charge'&&!p.attack){clearSwordPolish(p);}
}

export function swordDashWake(g,p,dash,from){
 const distance=Math.hypot(p.x-from.x,p.y-from.y);
 dash.wakeDistance=(dash.wakeDistance||0)+distance;
 if(dash.wakeDistance>=14){
  dash.wakeDistance%=14;
  emitSwordPolish(g,p,'trail',{duration:.18,dustColor:p.swordPolish?.dustColor,x:from.x,y:from.y-(p.trainVisualLift||p.groundHeight||0),length:9+dash.power*9,power:dash.power});
 }
 dash.ghostDistance=(dash.ghostDistance||0)+distance;
 if(dash.power>.15&&dash.ghostDistance>=24){
  dash.ghostDistance%=24;
  (p.swordAfterimages??=[]).push({x:from.x,y:from.y,age:0,duration:.14+.06*dash.power,faceX:dash.x,faceY:dash.y,attack:p.attack,attackDuration:p.attackDuration,attackClip:p.attackClip,power:dash.power});
  if(p.swordAfterimages.length>4)p.swordAfterimages.shift();
 }
}

export function finishSwordRelease(g,p,blocked=false){
 const state=p.swordPolish;
 if(state&&state.phase!=='recover'){
  emitSwordPolish(g,p,'brake',{power:state.power,blocked,dustColor:state.dustColor});state.phase='recover';state.age=0;
 }
}

export function swordChargedImpact(g,p,e,point){
 const dash=p.swordDash;if(!dash)return false;
 emitSwordPolish(g,p,'impact',{x:point?.x??e.x,y:(point?.y??e.y)-16-(e.jumpHeight||0)-(e.groundHeight||0),angle:Math.atan2(dash.y,dash.x),power:dash.power});
 // One local pause per charged strike, so a crowd cannot repeatedly stall the dash.
 if(!dash.hitStop){p.swordHitPause=Math.max(p.swordHitPause||0,.025+.02*dash.power);dash.hitStop=true;}
 e.swordHitPause=Math.max(e.swordHitPause||0,.045+.025*dash.power);
 return true;
}

export function paintSwordAfterimages(c,p,time,size,draw,lift=0){
 if(p.hp<=0||p.ui||p.room||!p.swordAfterimages?.length)return;
 for(const [index,ghost]of p.swordAfterimages.entries()){
  const alpha=Math.max(0,1-ghost.age/ghost.duration)*(.10+.10*ghost.power);
  if(alpha<=0)continue;
  c.save();c.globalAlpha*=alpha;c.filter='sepia(.6) hue-rotate(105deg) saturate(.7)';
  draw(c,{...p,...ghost,id:'sword-echo:'+p.id+':'+index,y:ghost.y-lift,charge:0,swordChargeAim:false,animationAction:undefined,playerFrame:undefined,locomotionTransition:null,locomotionTurning:null,swordReleasePower:ghost.power,swordPolish:{phase:'dash',power:ghost.power},dashTime:0,blocking:false},Math.max(0,time-ghost.age),size);
  c.restore();
 }
}
