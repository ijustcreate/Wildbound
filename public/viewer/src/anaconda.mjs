import {anacondaBody,anacondaContact,updateAnacondaBody,ANACONDA_CLEARANCE} from './anaconda-body.mjs';
import {nearbyScenery} from './performance.mjs';
import {navigateEnemy,clearShot,flies} from './navigation.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const ANACONDA_EVENT={name:'The emerald river coils',kind:'anaconda',environment:'forest',count:1,hp:380,speed:46,damage:26,weight:4,
  verse:'Around the roots, an emerald river.\nThe forest floor begins to slither.',tip:'Jump over the long body. Sidestep the red bite warning, then strike its head or coils.'};

function treeRoute(g,e,target,dt){
  e.anacondaTreeCooldown=Math.max(0,(e.anacondaTreeCooldown||0)-dt);
  let route=e.anacondaTree;
  if(route){
    const tree=nearbyScenery(g.scenery,route.x,route.y,40).find(t=>(t.id??t.x+':'+t.y)===route.key);
    route.time+=dt;
    if(!tree||tree.fallen||tree.falling||tree.depleted||route.time>4.5||route.time>1.5&&distance(e,target)<130){e.anacondaTree=null;e.anacondaTreeCooldown=2;route=null;}
  }
  if(!route&&!e.anacondaTreeCooldown){
    let best=null,bestDistance=Infinity;
    for(const tree of nearbyScenery(g.scenery,e.x,e.y,160)){
      if(!['tree','snow_tree'].includes(tree.kind)||tree.fallen||tree.falling||tree.depleted)continue;
      const center={x:tree.x,y:tree.rootY??tree.y+tree.size*.35},radius=Math.max(40,tree.size*.22+25),d=distance(e,center);
      if(d>radius+65||d<radius-22||d>=bestDistance)continue;
      const tx=target.x-e.x,ty=target.y-e.y,t=clamp(((center.x-e.x)*tx+(center.y-e.y)*ty)/(tx*tx+ty*ty||1),0,1);
      if(Math.hypot(center.x-e.x-tx*t,center.y-e.y-ty*t)>radius+12)continue;
      best={...center,radius,key:tree.id??tree.x+':'+tree.y,time:0,direction:e.orbit||1};bestDistance=d;
    }
    if(best)e.anacondaTree=route=best;
  }
  if(!route)return null;
  const d=distance(e,route)||1,nx=(e.x-route.x)/d,ny=(e.y-route.y)/d,radial=clamp((route.radius-d)/20,-.9,.9);
  return {x:-ny*route.direction+nx*radial,y:nx*route.direction+ny*radial};
}

function strike(g,e,targets,old){
  e.anacondaBiteHits ||= [];
  const dx=e.x-old.x,dy=e.y-old.y;
  for(const p of targets){
    if(e.anacondaBiteHits.includes(p.id)||Math.max(p.jumpHeight||0,p.groundHeight||0,p.roostHeight||0)>=28)continue;
    const t=clamp(((p.x-old.x)*dx+(p.y-old.y)*dy)/(dx*dx+dy*dy||1),0,1);
    if(Math.hypot(p.x-old.x-dx*t,p.y-old.y-dy*t)>29||!clearShot(g,{x:old.x+dx*t,y:old.y+dy*t},p,.5))continue;
    e.anacondaBiteHits.push(p.id);g.hurt(p,e.damage,e);
  }
}

function bodyContact(g,e,targets){
  e.anacondaContacts=(e.anacondaContacts||[]).filter(t=>t.until>g.time).slice(-16);
  for(const p of targets){
    if(flies(p)||Math.max(p.jumpHeight||0,p.groundHeight||0)>=ANACONDA_CLEARANCE||distance(e,p)<32||e.anacondaContacts.some(t=>t.id===p.id))continue;
    if(anacondaContact(e,p,7).penetration<=0)continue;
    if(e.anacondaContacts.length>=16)e.anacondaContacts.shift();
    e.anacondaContacts.push({id:p.id,until:g.time+.9});const amount=Math.max(0,Math.round(e.damage*.25));if(amount)g.hurt(p,amount,e);
  }
}

// Core handles death, freezing, perception, allies and the once-only loot path.
export function tickAnaconda(g,e,targets,dt,stats={},behaviors={}){
  if(e.hp<=0||e.frozen>0||e.faction==='ally')return;
  anacondaBody(e,g);e.moving=false;
  if(e.state==='snared'){e.timer-=dt;if(e.timer<=0)e.hp=0;return;}
  const trap=(g.traps||[]).find(t=>t.life>0&&t.variant!=='slow'&&anacondaContact(e,t,12).penetration>0);
  if(trap){trap.life=0;e.state='snared';e.timer=2;e.anacondaTree=null;g.onSound('trap',e);return;}
  const target=targets.reduce((best,p)=>!best||distance(e,p)<distance(e,best)?p:best,null);
  if(!target)return;
  if(behaviors.melee===false&&['windup','bite'].includes(e.state)){e.state='hunt';e.attack=0;}
  if(e.state==='windup'){
    e.timer-=dt;
    if(e.timer<=0){e.state='bite';e.timer=(stats.dashDistance??116)/Math.max(1,stats.dashSpeed??240);e.attack=e.timer;e.anacondaBiteHits=[];g.onSound('attack',e);}
  }else if(e.state==='bite'){
    const old={x:e.x,y:e.y},step=Math.min(dt,Math.max(0,e.timer))*(stats.dashSpeed??240);
    const travelled=g.moveActor(e,e.dx*step,e.dy*step);
    strike(g,e,targets,old);e.timer-=dt;
    if(e.timer<=0||travelled<step*.2){e.state='recover';e.timer=stats.recovery??1.1;e.cooldown=stats.dashCooldown??2.5;}
  }else if(e.state==='recover'){
    e.timer-=dt;if(e.timer<=0)e.state='hunt';
  }else{
    e.state='hunt';
    const d=distance(e,target),dx=(target.x-e.x)/(d||1),dy=(target.y-e.y)/(d||1);
    if(behaviors.melee!==false&&e.cooldown<=0&&d<(stats.attackRange??145)&&clearShot(g,e,target)){
      e.state='windup';e.timer=stats.windup??.9;e.dx=dx;e.dy=dy;e.faceX=dx;e.faceY=dy;e.anacondaTree=null;
    }else if(behaviors.hunt!==false&&d>36&&(stats.detection==null||d<stats.detection)){
      if(g.house&&!clearShot(g,e,target))navigateEnemy(g,e,target,dt);
      else{
        const route=treeRoute(g,e,target,dt),sway=Math.sin(anacondaBody(e).distance/24+(e.id||0))*.48;
        const vx=route?.x??dx-dy*sway,vy=route?.y??dy+dx*sway;
        const desired=Math.atan2(vy,vx),heading=e.anacondaHeading??Math.atan2(e.faceY||0,e.faceX||1);
        const delta=Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading));
        e.anacondaHeading=heading+clamp(delta,-dt*3,dt*3);e.faceX=Math.cos(e.anacondaHeading);e.faceY=Math.sin(e.anacondaHeading);
        const step=(e.speed??46)*dt,travel=g.moveActor(e,e.faceX*step,e.faceY*step);
        if(travel<step*.2){const turn=(e.orbit||1)*1.1;e.anacondaHeading+=turn;g.moveActor(e,Math.cos(e.anacondaHeading)*step,Math.sin(e.anacondaHeading)*step);}
      }
    }
  }
  updateAnacondaBody(g,e);if(behaviors.melee!==false)bodyContact(g,e,targets);
}
