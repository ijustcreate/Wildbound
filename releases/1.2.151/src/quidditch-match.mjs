import {PITCH_FLIGHT_MAX,PITCH_FLIGHT_MIN,QUIDDITCH_HOOPS,QUIDDITCH_PITCH,QUIDDITCH_TEAMS,QUIDDITCH_TRUNK,SNITCH_POINTS} from './quidditch-layout.mjs';

const TEAMS=Object.keys(QUIDDITCH_TEAMS),PITCH=QUIDDITCH_PITCH;
const TEAM_SIZE=3,MATCH_HEIGHT=38,GRAVITY=130,THROW_SPEED=390;
const TRUNK_REACH=60,RETURN_REACH=66,QUAFFLE_REACH=29,SNITCH_REACH=35;
const STEAL_REACH=36,STEAL_HEIGHT=22,STEAL_LOCK=.7,SWAT_REACH=37;
const ROLES=['chaser','keeper','seeker'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const position=(x,y,z)=>({x,y,z,vx:0,vy:0,vz:0});
const idOf=p=>String(p.id);
const opposite=team=>team==='gold'?'violet':'gold';
const alive=p=>p&&p.hp>0&&!p.room&&!p.trainRide&&!p.pirateRide&&!p.swimming;
const height=p=>p.jumpHeight??p.z??0;
const flying=p=>alive(p)&&!!p.broomMount&&height(p)>=PITCH_FLIGHT_MIN-2;
const carrierPoint=p=>({x:p.x+(p.faceX||0)*8,y:p.y+(p.faceY||0)*8,z:height(p)+9});
const near=(a,b,r)=>distance(a,b)<=r;

function random(match){
 match.random=(Math.imul(match.random,1664525)+1013904223)>>>0;
 return match.random/4294967296;
}

function quaffleAt(x,y,z){return {...position(x,y,z),holderId:null,throwTeam:null,ignoreId:null,ignoreUntil:0,resetAt:0};}
function snitchAt(){return {...position(QUIDDITCH_TRUNK.x,QUIDDITCH_TRUNK.y,22),holderId:null,availableAt:3,turnAt:0,target:null};}

export function quidditchTeam(match,player){
 const team=match.teamAssignments[idOf(player)]??player.team;
 return TEAMS.includes(team)?team:null;
}

function assignPlayers(match,players){
 const counts={gold:0,violet:0};
 for(const p of players){const team=quidditchTeam(match,p);if(team)counts[team]++;}
 for(const p of players){
  if(quidditchTeam(match,p))continue;
  const team=counts.gold<=counts.violet?'gold':'violet';
  Object.defineProperty(match.teamAssignments,idOf(p),{value:team,writable:true,enumerable:true,configurable:true});
  counts[team]++;
 }
 return counts;
}

export function createQuidditchMatch({teamAssignments={},players=[],seed=1}={}){
 const randomSeed=Number(seed)>>>0;
 const match={phase:'waiting',round:1,time:0,seed:randomSeed,random:randomSeed,scores:{gold:0,violet:0},winner:null,
  teamAssignments:{...teamAssignments},ai:[],quaffle:quaffleAt(QUIDDITCH_TRUNK.x,QUIDDITCH_TRUNK.y,0),snitch:snitchAt(),
  bludgers:[],stagger:{},events:[],nextEvent:1,result:null};
 assignPlayers(match,players);
 return match;
}

function record(match,type,detail={}){
 match.events.push({id:match.nextEvent++,type,at:match.time,...detail});
 if(match.events.length>24)match.events.shift();
}

function open(match){
 match.phase='playing';
 match.ballsStowed=false;
 const {x,y}=QUIDDITCH_TRUNK;
 match.quaffle={...quaffleAt(x,y-2,25),vy:-16,vz:83};
 Object.assign(match.snitch,{x:x-4,y:y-5,z:24,vx:-118,vy:-84,vz:101,turnAt:.86,
  target:{x:x-168,y:y-130,z:93}});
 match.bludgers=[-1,1].map((side,i)=>({id:'bludger-'+i,...position(x+side*5,y+3,21),
  vx:side*164,vy:side*45,vz:105,cooldown:1.1+i*.3,launchUntil:.42,
  launchTarget:{x:x+side*134,y:y+side*72,z:72+i*9}}));
 record(match,'open',QUIDDITCH_TRUNK);
}

function stowBalls(match){
 const {x,y}=QUIDDITCH_TRUNK;
 match.quaffle=quaffleAt(x,y,0);
 match.snitch={...snitchAt(),z:0};
 match.bludgers=[0,1].map(i=>({id:'bludger-'+i,...position(x,y,0),cooldown:0,launchUntil:0}));
 match.stagger={};
 match.ballsStowed=true;
}

export function resetQuidditchMatch(match){
 const {teamAssignments,round,seed,nextEvent}=match;
 const next=createQuidditchMatch({teamAssignments,seed:seed+round});
 Object.assign(match,next,{round:round+1,seed,nextEvent});
 stowBalls(match);
}

function handIn(match,player,team){
 const snitch=match.snitch;
 if(snitch.holderId!==idOf(player)||!near(player,QUIDDITCH_TEAMS[team].home,RETURN_REACH))return false;
 match.scores[team]+=SNITCH_POINTS;match.phase='finished';
 match.winner=match.scores.gold===match.scores.violet?'tie':match.scores.gold>match.scores.violet?'gold':'violet';
 match.result={winner:match.winner,scores:{...match.scores},snitchTeam:team,playerId:idOf(player),time:match.time};
 stowBalls(match);
 record(match,'finish',{team,winner:match.winner,playerId:idOf(player),points:SNITCH_POINTS,...QUIDDITCH_TEAMS[team].home});
 return true;
}

function dropQuaffle(match,player,vx=0,vy=0,vz=27){
 const ball=match.quaffle,id=ball.holderId;
 if(player)Object.assign(ball,carrierPoint(player));
 Object.assign(ball,{holderId:null,throwTeam:null,ignoreId:id,ignoreUntil:match.time+.48,vx,vy,vz});
}

function canCatchQuaffle(match,p,r=QUAFFLE_REACH){
 const b=match.quaffle;
 return flying(p)&&b.holderId===null&&b.resetAt<=match.time&&match.snitch.holderId!==idOf(p)&&
  !(match.stagger[idOf(p)]>match.time)&&!(b.ignoreId===idOf(p)&&b.ignoreUntil>match.time)&&near(p,b,r)&&
  (Math.abs(height(p)+3-b.z)<=26||b.z<=5&&height(p)<=54);
}

function canCatchSnitch(match,p,r=SNITCH_REACH){
 const b=match.snitch;
 return flying(p)&&b.holderId===null&&match.time>=b.availableAt&&!(match.stagger[idOf(p)]>match.time)&&near(p,b,r)&&Math.abs(height(p)+3-b.z)<24;
}

function stealTarget(match,ball,p,team,players){
 const {holderId,stealUntil}=ball,id=idOf(p);
 if(!holderId||holderId===id||stealUntil>match.time||!flying(p)||match.stagger[id]>match.time||match.snitch.holderId===id)return null;
 const carrier=players.find(q=>idOf(q)===holderId)||match.ai.find(q=>idOf(q)===holderId);
 if(!flying(carrier)||quidditchTeam(match,carrier)!==opposite(team)||!near(p,carrier,STEAL_REACH)||
    Math.abs(height(p)-height(carrier))>STEAL_HEIGHT)return null;
 return carrier;
}

function swatTarget(match,p){
 if(!flying(p)||match.stagger[idOf(p)]>match.time)return null;
 return match.bludgers.find(ball=>!(ball.swatUntil>match.time)&&near(p,ball,SWAT_REACH)&&Math.abs(height(p)+5-ball.z)<=24)||null;
}

function swatBludger(match,p,ball,aim){
 const aiming=Math.hypot(aim.aimX||0,aim.aimY||0)>.1;
 const x=aiming?aim.aimX||0:p.faceX||-QUIDDITCH_TEAMS[quidditchTeam(match,p)].side;
 const y=aiming?aim.aimY||0:p.faceY||0,length=Math.hypot(x,y)||1;
 Object.assign(ball,{vx:x/length*325,vy:y/length*325,vz:48,swatUntil:match.time+.42,cooldown:match.time+.6});
 record(match,'bludger-swatted',{playerId:idOf(p),x:ball.x,y:ball.y,z:ball.z});
}

function takeQuaffle(match,p,team){
 const b=match.quaffle;
 Object.assign(b,carrierPoint(p),{holderId:idOf(p),throwTeam:null,vx:0,vy:0,vz:0});
 record(match,'quaffle-caught',{team,playerId:idOf(p),x:b.x,y:b.y,z:b.z});
}

function takeSnitch(match,p,team,carrier=null){
 const id=idOf(p),b=match.snitch;
 if(match.quaffle.holderId===id)dropQuaffle(match,p);
 Object.assign(b,carrierPoint(p),{holderId:id,vx:0,vy:0,vz:0});
 const detail={team,playerId:id,x:b.x,y:b.y,z:b.z};
 if(carrier){
  b.stealUntil=match.time+STEAL_LOCK;
  record(match,'snitch-stolen',{...detail,fromId:idOf(carrier)});
 }else record(match,'snitch-caught',detail);
}

function stealSnitch(match,p,team,players){
 const carrier=stealTarget(match,match.snitch,p,team,players);
 if(!carrier)return false;
 takeSnitch(match,p,team,carrier);
 return true;
}

function knockQuaffleLoose(match,p,team,players,aim){
 const carrier=stealTarget(match,match.quaffle,p,team,players);
 if(!carrier)return false;
 let x=carrier.x-p.x,y=carrier.y-p.y;
 if(Math.hypot(x,y)<1){
  const aiming=Math.hypot(aim.aimX||0,aim.aimY||0)>.1;
  x=aiming?aim.aimX||0:p.faceX||-QUIDDITCH_TEAMS[team].side;
  y=aiming?aim.aimY||0:p.faceY||0;
 }
 const length=Math.hypot(x,y);
 dropQuaffle(match,carrier,x/length*145,y/length*145,44);
 const {x:bx,y:by,z}=match.quaffle;
 record(match,'quaffle-knocked-loose',{team,playerId:idOf(p),fromId:idOf(carrier),x:bx,y:by,z});
 return true;
}

function aimAtHoop(team,position,x,y){
 const hoops=QUIDDITCH_HOOPS.filter(h=>h.team!==team&&h.x!==position.x&&distance(h,position)<430);
 let best=null,bestCost=Infinity;
 for(const h of hoops){
  const dx=h.x-position.x,dy=h.y-position.y,span=Math.hypot(dx,dy),agreement=(dx*x+dy*y)/span;
  if(agreement<.89||dx*QUIDDITCH_TEAMS[team].side>=0)continue;
  const cost=(1-agreement)*280+Math.abs(h.z-position.z)*.14;
  if(cost<bestCost){best=h;bestCost=cost;}
 }
 return best;
}

function throwQuaffle(match,p,team,{aimX,aimY,aimZ}={}){
 if(!flying(p)||match.quaffle.holderId!==idOf(p)||match.stagger[idOf(p)]>match.time)return false;
 let x=Number(aimX)||0,y=Number(aimY)||0;
 if(Math.hypot(x,y)<.1){x=p.faceX||0;y=p.faceY||0;}
 const length=Math.hypot(x,y);
 if(length<.1){x=-QUIDDITCH_TEAMS[team].side;y=0;}else{x/=length;y/=length;}
 const b=match.quaffle,pivot=carrierPoint({...p,faceX:x,faceY:y});
 const hoop=Number.isFinite(aimZ)?null:aimAtHoop(team,pivot,x,y);
 const span=hoop?distance(hoop,pivot):0,duration=Math.max(.17,span/THROW_SPEED);
 const vx=hoop?(hoop.x-pivot.x)/duration:x*THROW_SPEED;
 const vy=hoop?(hoop.y-pivot.y)/duration:y*THROW_SPEED;
 const vz=hoop?(hoop.z-pivot.z)/duration+GRAVITY*duration/2:38+clamp(Number(aimZ)||0,-1,1)*94;
 Object.assign(b,pivot,{holderId:null,throwTeam:team,ignoreId:idOf(p),ignoreUntil:match.time+.48,vx,vy,vz});
 record(match,'throw',{team,playerId:idOf(p),x:b.x,y:b.y,z:b.z});
 return true;
}

export function quidditchAction(match,player,action='interact',aim={},players=[]){
 if(!alive(player))return false;
 const team=quidditchTeam(match,player);
 if(!team)return false;
 if(match.phase==='waiting'){
  if((action==='open'||action==='interact')&&near(player,QUIDDITCH_TRUNK,TRUNK_REACH)){open(match);return true;}
  return false;
 }
 if(match.phase==='finished'){
  if((action!=='interact'&&action!=='rematch')||!near(player,QUIDDITCH_TRUNK,TRUNK_REACH))return false;
  resetQuidditchMatch(match);
  open(match);return true;
 }
 if(action==='throw')return throwQuaffle(match,player,team,aim);
 if(action==='check')return knockQuaffleLoose(match,player,team,players,aim);
 if(action==='steal-snitch')return stealSnitch(match,player,team,players);
 if(action==='ball'){
  if(canCatchSnitch(match,player)){takeSnitch(match,player,team);return true;}
  if(stealSnitch(match,player,team,players))return true;
  if(match.quaffle.holderId===idOf(player))return throwQuaffle(match,player,team,aim);
  if(canCatchQuaffle(match,player)){takeQuaffle(match,player,team);return true;}
  const carrier=stealTarget(match,match.quaffle,player,team,players);
  if(carrier){
   takeQuaffle(match,player,team);
   match.quaffle.stealUntil=match.time+STEAL_LOCK;
   record(match,'quaffle-stolen',{team,playerId:idOf(player),fromId:idOf(carrier),...carrierPoint(player)});
   return true;
  }
  const ball=swatTarget(match,player);
  if(ball){swatBludger(match,player,ball,aim);return true;}
  return false;
 }
 if(action==='open'||action==='rematch')return false;
 if(action==='turn-in'||action==='interact')if(handIn(match,player,team))return true;
 if(action!=='catch')return false;
 if(canCatchSnitch(match,player)){takeSnitch(match,player,team);return true;}
 if(canCatchQuaffle(match,player)){takeQuaffle(match,player,team);return true;}
 return false;
}

export function quidditchPrompt(match,player,players=[]){
 if(!alive(player))return '';
 const team=quidditchTeam(match,player);
 if(!team)return '';
 if(match.phase==='waiting')return near(player,QUIDDITCH_TRUNK,TRUNK_REACH)?'OPEN BALL TRUNK':'';
 if(match.phase==='finished')return near(player,QUIDDITCH_TRUNK,TRUNK_REACH)?'START REMATCH':'';
 if(match.snitch.holderId===idOf(player))return near(player,QUIDDITCH_TEAMS[team].home,RETURN_REACH)?'TURN IN SNITCH':'RETURN TO '+team.toUpperCase()+' STAND';
 if(canCatchSnitch(match,player))return 'CATCH SNITCH';
 if(stealTarget(match,match.snitch,player,team,players))return 'STEAL SNITCH';
 if(match.quaffle.holderId===idOf(player))return 'THROW QUAFFLE';
 if(canCatchQuaffle(match,player))return 'CATCH QUAFFLE';
 if(stealTarget(match,match.quaffle,player,team,players))return 'STEAL QUAFFLE';
 return swatTarget(match,player)?'SWAT BLUDGER':'';
}

export function quidditchCheckPrompt(match,player,players=[]){
 if(match.phase!=='playing'||!flying(player))return '';
 const team=quidditchTeam(match,player);
 return team&&stealTarget(match,match.quaffle,player,team,players)?'KNOCK QUAFFLE LOOSE':'';
}

function fillSides(match,humans){
 const counts=assignPlayers(match,humans),previous=new Map(match.ai.map(p=>[p.id,p]));
 match.ai=[];
 for(const team of TEAMS){
  const {spawn,side,name}=QUIDDITCH_TEAMS[team],max=Math.max(0,TEAM_SIZE-counts[team]);
  for(let i=0;i<max;i++){
   const id='quidditch-ai-'+team+'-'+i,role=ROLES[i];
   const p=previous.get(id)||{id,name:name+' '+role,team,role,quidditchAI:true,hp:1,x:spawn.x+side*i*33,y:spawn.y+(i-1)*103,
    z:MATCH_HEIGHT,jumpHeight:MATCH_HEIGHT,faceX:-side,faceY:0,step:0,moving:false,
    broomMount:{item:{type:'flying_broom'}},animationAction:'broom_ride',nextAction:0};
   match.ai.push(p);
  }
 }
}

function boundBall(ball,pad=35){
 if(ball.x<PITCH.left+pad||ball.x>PITCH.right-pad){ball.vx*=-.65;ball.x=clamp(ball.x,PITCH.left+pad,PITCH.right-pad);}
 if(ball.y<PITCH.top+pad||ball.y>PITCH.bottom-pad){ball.vy*=-.65;ball.y=clamp(ball.y,PITCH.top+pad,PITCH.bottom-pad);}
}

function approach(ball,target,speed,turn,dt){
 const dx=target.x-ball.x,dy=target.y-ball.y,dz=(target.z??ball.z)-ball.z,span=Math.hypot(dx,dy)||1;
 const amount=1-Math.exp(-dt*turn),pace=Math.min(speed,span/dt);
 ball.vx+=(dx/span*pace-ball.vx)*amount;ball.vy+=(dy/span*pace-ball.vy)*amount;
 ball.vz+=(clamp(dz*4,-125,125)-ball.vz)*amount;
 ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.z=clamp(ball.z+ball.vz*dt,28,PITCH_FLIGHT_MAX+10);
 boundBall(ball);
}

function moveRider(p,target,dt,speed){
 const dx=target.x-p.x,dy=target.y-p.y,span=Math.hypot(dx,dy),move=Math.min(span,speed*dt);
 p.moving=move>.25;
 if(p.moving){p.faceX=dx/span;p.faceY=dy/span;p.step+=move*.1;}
 if(span){p.x=clamp(p.x+dx/span*move,PITCH.left+40,PITCH.right-40);p.y=clamp(p.y+dy/span*move,PITCH.top+40,PITCH.bottom-40);}
 p.z=clamp(p.z+clamp((target.z??MATCH_HEIGHT)-p.z,-100*dt,100*dt),PITCH_FLIGHT_MIN,PITCH_FLIGHT_MAX);
 p.jumpHeight=p.z;
}

function aiMove(match,p,players,dt){
 const team=p.team,{side,home}=QUIDDITCH_TEAMS[team],b=match.quaffle,s=match.snitch;
 const ownQuaffle=players.find(q=>idOf(q)===b.holderId&&quidditchTeam(match,q)===team);
 let target=b,speed=178;
 if(s.holderId===p.id){target=home;speed=199;}
 else if(b.holderId===p.id){
  const hoop=QUIDDITCH_HOOPS.filter(h=>h.team!==team).sort((a,b)=>distance(a,p)-distance(b,p))[0];
  if(distance(p,hoop)<360&&p.nextAction<=match.time){
   if(throwQuaffle(match,p,team,{aimX:hoop.x-p.x,aimY:hoop.y-p.y}))p.nextAction=match.time+1;
  }
  target={x:hoop.x+side*205,y:hoop.y,z:hoop.z-8};speed=188;
 }else if(p.role==='seeker'&&match.time>14&&s.holderId===null){
  target={x:s.x+s.vx*.26,y:s.y+s.vy*.26,z:s.z};speed=205;
 }else if(p.role==='keeper'){
  const hoop=QUIDDITCH_HOOPS.find(h=>h.team===team&&h.y===PITCH.cy);
  target={x:hoop.x-side*105,y:clamp(b.y,hoop.y-166,hoop.y+166),z:clamp(b.z,39,95)};
  if(!ownQuaffle&&distance(p,b)<150)target=b;
 }else if(ownQuaffle){
  target={x:ownQuaffle.x-side*148,y:ownQuaffle.y+(p.role==='seeker'?103:-103),z:height(ownQuaffle)};
 }
 moveRider(p,target,dt,match.stagger[p.id]>match.time?speed*.48:speed);
 if(s.holderId===p.id)handIn(match,p,team);
}

function stepQuaffle(match,players,dt){
 const b=match.quaffle;
 if(b.holderId!==null){
  const carrier=players.find(p=>idOf(p)===b.holderId);
  if(flying(carrier)){Object.assign(b,carrierPoint(carrier));return;}
  dropQuaffle(match,carrier);
 }
 if(b.resetAt>match.time)return;
 const before={x:b.x,y:b.y,z:b.z};
 b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt-GRAVITY*dt*dt/2;b.vz-=GRAVITY*dt;
 if(b.throwTeam&&b.x!==before.x&&b.vx*QUIDDITCH_TEAMS[b.throwTeam].side<0){
  for(const h of QUIDDITCH_HOOPS){
   if(h.team===b.throwTeam)continue;
   const fraction=(h.x-before.x)/(b.x-before.x);
   if(fraction<=0||fraction>1)continue;
   const y=before.y+(b.y-before.y)*fraction,z=before.z+(b.z-before.z)*fraction;
   if(Math.hypot(y-h.y,z-h.z)<=h.radius-6){
    const team=b.throwTeam;
    match.scores[team]++;
    record(match,'goal',{team,points:1,x:h.x,y:h.y,z:h.z});
    match.quaffle={...quaffleAt(PITCH.cx,PITCH.cy,36),resetAt:match.time+.9};
    return;
   }
  }
 }
 if(b.z<=3){
  b.z=3;b.throwTeam=null;
  b.vz=b.vz<-39?-b.vz*.29:0;
  const friction=Math.exp(-dt*4.8);b.vx*=friction;b.vy*=friction;
 }
 boundBall(b);
}

function stepSnitch(match,players,dt){
 const b=match.snitch;
 if(b.holderId!==null){
  const rider=players.find(p=>idOf(p)===b.holderId);
  if(alive(rider)){Object.assign(b,carrierPoint(rider));return;}
  b.holderId=null;b.availableAt=match.time+.7;b.turnAt=0;
 }
 if(match.time>=b.turnAt||!b.target||near(b,b.target,44)){
  const angle=random(match)*Math.PI*2,d=210+random(match)*235;
  b.target={x:clamp(b.x+Math.cos(angle)*d,PITCH.left+95,PITCH.right-95),
   y:clamp(b.y+Math.sin(angle)*d,PITCH.top+95,PITCH.bottom-95),z:38+random(match)*82};
  b.turnAt=match.time+.57+random(match)*.76;
 }
 approach(b,b.target,265,7,dt);
}

function stepBludgers(match,players,dt){
 const targets=players.filter(flying);
 for(const bludger of match.bludgers){
  if(bludger.swatUntil>match.time){
   bludger.x+=bludger.vx*dt;bludger.y+=bludger.vy*dt;bludger.z=clamp(bludger.z+bludger.vz*dt,28,PITCH_FLIGHT_MAX+10);
   boundBall(bludger);continue;
  }
  if(match.time<bludger.launchUntil){approach(bludger,bludger.launchTarget,242,6,dt);continue;}
  let target=null,nearest=Infinity;
  for(const p of targets){
   const d=distance(p,bludger)*(match.quaffle.holderId===idOf(p)?.69:1);
   if(d<nearest){nearest=d;target=p;}
  }
  if(!target)continue;
  approach(bludger,{x:target.x,y:target.y,z:height(target)+8},220,4.4,dt);
  if(bludger.cooldown>match.time)continue;
  const victim=targets.find(p=>near(p,bludger,22)&&Math.abs(height(p)+7-bludger.z)<18&&!(match.stagger[idOf(p)]>match.time));
  if(!victim)continue;
  const id=idOf(victim);
  match.stagger[id]=match.time+.64;bludger.cooldown=match.time+1.7;
  if(match.quaffle.holderId===id)dropQuaffle(match,victim,bludger.vx*.62,bludger.vy*.62,44);
  bludger.vx*=-1;bludger.vy*=-1;
  record(match,'stagger',{playerId:id,x:bludger.x,y:bludger.y,z:bludger.z});
 }
}

function autoCatch(match,players){
 const byDistance=(a,b,ball)=>distance(a,ball)-distance(b,ball)||idOf(a).localeCompare(idOf(b));
 const hunter=players.filter(p=>p.quidditchAI&&p.role==='seeker'&&match.time>=14&&canCatchSnitch(match,p,19))
  .sort((a,b)=>byDistance(a,b,match.snitch))[0];
 if(hunter)takeSnitch(match,hunter,quidditchTeam(match,hunter));
 const catcher=players.filter(p=>p.quidditchAI&&canCatchQuaffle(match,p,20)).sort((a,b)=>byDistance(a,b,match.quaffle))[0];
 if(catcher){takeQuaffle(match,catcher,quidditchTeam(match,catcher));catcher.nextAction=match.time+.6;}
}

function landTeams(match,dt){
 for(const p of match.ai){
  if(p.landed)continue;
  const {home,side}=QUIDDITCH_TEAMS[p.team],slot=ROLES.indexOf(p.role)+1;
  const landing={x:home.x-side*(100+slot*41),y:home.y+66+slot*24,z:Math.max(PITCH_FLIGHT_MIN,height(p))};
  if(distance(p,landing)>2){moveRider(p,landing,dt,194);continue;}
  p.moving=false;
  p.z=p.jumpHeight=Math.max(0,height(p)-dt*105);
  if(p.jumpHeight===0){
   p.broomMount=null;p.animationAction=null;p.landed=true;p.movementGait='idle';
   p.faceX=-side;p.faceY=0;
  }
 }
}

export function advanceQuidditchMatch(match,dt,players=[]){
 const humans=players.filter(alive);
 const elapsed=clamp(Number(dt)||0,0,.25);
 if(match.phase!=='playing'){
  assignPlayers(match,humans);
  if(match.phase==='finished'){
   if(!match.ballsStowed)stowBalls(match);
   if(elapsed)landTeams(match,elapsed);
  }
  return;
 }
 if(!elapsed)return;
 fillSides(match,humans);
 const all=[...humans,...match.ai],frames=Math.ceil(elapsed/.028),step=elapsed/frames;
 for(let i=0;i<frames&&match.phase==='playing';i++){
  match.time+=step;
  for(const [id,end] of Object.entries(match.stagger))if(end<=match.time)delete match.stagger[id];
  for(const p of match.ai)if(match.phase==='playing')aiMove(match,p,all,step);
  if(match.phase!=='playing')break;
  stepQuaffle(match,all,step);stepSnitch(match,all,step);stepBludgers(match,all,step);autoCatch(match,all);
 }
}
