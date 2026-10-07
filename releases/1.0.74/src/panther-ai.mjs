import { creatureCue } from './sound-bank.mjs';

const MAX_ENERGY = 100;
const COST = { swipe: 18, bite: 25, swoop: 48 };
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function pantherBranch(game, actor) {
  return (game.scenery || []).filter(tree =>
    ['tree', 'snow_tree'].includes(tree.kind) && tree.treeType !== 'pine' &&
    !tree.fallen && !tree.falling && !tree.depleted && tree.size >= 100 &&
    distance(actor, {x:tree.x, y:tree.rootY ?? tree.y + tree.size * .35}) < 115
  ).sort((a,b) => distance(actor,{x:a.x,y:a.rootY??a.y+a.size*.35}) - distance(actor,{x:b.x,y:b.rootY??b.y+b.size*.35}))[0] || null;
}

function setAction(e, action, duration, state = action) {
  e.state = state;
  e.animationAction = action;
  e.timer = duration;
  e.motionDuration = duration;
  e.poseTime = 0;
  e.moving = false;
}

function clearAction(e) {
  e.animationAction = null;
  e.poseTime = null;
  e.motionDuration = null;
}

function strike(game, e, target, kind) {
  if (!target || target.hp <= 0) return;
  const range = kind === 'swoop' ? 39 : kind === 'bite' ? 32 : 53;
  const d = distance(e, target);
  if (d > range) return;
  const dot = ((target.x-e.x)*e.faceX+(target.y-e.y)*e.faceY)/(d||1);
  if (dot < (kind === 'swipe' ? .15 : .35)) return;
  game.hurt(target, kind === 'bite' ? Math.round(e.damage*1.2) : e.damage, e);
}

export function tickPanther(game, e, target, dt, stats = {}) {
  const energyMax=stats.energyMax||MAX_ENERGY, energyRegen=stats.energyRegen||16;
  e.pantherEnergyMax=energyMax;
  e.pantherEnergy = clamp((e.pantherEnergy ?? energyMax) + dt * (e.state === 'lie' || e.state === 'branch_rest' ? stats.restEnergyRegen||22 : energyRegen), 0, energyMax);
  e.pantherDecision = Math.max(0, (e.pantherDecision || 0) - dt);
  e.cooldown = Math.max(0, e.cooldown);
  const d = target ? distance(e,target) : Infinity;
  const face = () => {if (!target) return; e.faceX=(target.x-e.x)/(d||1);e.faceY=(target.y-e.y)/(d||1);};
  const tree = e.pantherTreeId == null ? null : (game.scenery||[]).find(t=>(t.id ?? t.x+':'+t.y)===e.pantherTreeId);
  if (e.state === 'snared') { e.timer-=dt; if(e.timer<=0)e.hp=0; clearAction(e); return true; }
  const trap = (game.traps||[]).find(t=>t.life>0 && distance(t,e)<30);
  if (trap && trap.variant !== 'slow') {trap.life=0;setAction(e,'recover',trap.variant==='interrupt'?1.5:2,'snared');game.onSound('trap');return true;}
  if (e.state === 'climb') {
    if (!tree || tree.fallen || tree.falling || d < 180) {e.state='descend';e.timer=.38;e.motionDuration=.38;}
    else {e.timer-=dt;e.poseTime=clamp(1-e.timer/e.motionDuration,0,1);e.groundHeight=Math.min(e.pantherBranchHeight,e.pantherBranchHeight*e.poseTime);if(e.timer<=0){setAction(e,'branch_lie',2.8,'branch_rest');e.groundHeight=e.pantherBranchHeight;}return true;}
  }
  if (e.state === 'branch_rest') {
    if (!tree || tree.fallen || tree.falling || d < 210) {e.state='descend';e.timer=.38;e.motionDuration=.38;e.animationAction='climb';}
    else {e.timer-=dt;e.poseTime=null;if(e.timer<=0)setAction(e,'branch_lie',2.8,'branch_rest');return true;}
  }
  if (e.state === 'descend') {
    e.timer-=dt;e.poseTime=clamp(e.timer/e.motionDuration,0,1);e.groundHeight=Math.max(0,e.pantherBranchHeight*e.poseTime);
    if(e.timer<=0){e.groundHeight=0;e.pantherTreeId=null;setAction(e,'crouch',.25,'recover');}
    return true;
  }
  if (['windup','swoop','swipe','bite','recover'].includes(e.state)) {
    e.timer-=dt;
    e.poseTime=clamp(1-e.timer/e.motionDuration,0,1);
    if(e.state==='swoop') {
      const speed=340,oldX=e.x,oldY=e.y;game.moveActor(e,e.dx*speed*dt,e.dy*speed*dt);
      e.moving=true;
      if (!e.pantherHit && target?.hp>0) {
        const vx=e.x-oldX,vy=e.y-oldY,t=clamp(((target.x-oldX)*vx+(target.y-oldY)*vy)/(vx*vx+vy*vy||1),0,1);
        if(Math.hypot(target.x-(oldX+vx*t),target.y-(oldY+vy*t))<39){game.hurt(target,e.damage,e);e.pantherHit=true;}
      }
    }
    if(e.timer<=0) {
      if(e.state==='windup') {setAction(e,'swoop',.30,'swoop');e.pantherHit=false;game.onSound(creatureCue('panther','swoop'),e);}
      else if(e.state==='swipe'||e.state==='bite'||e.state==='swoop') {setAction(e,'recover',.28,'recover');e.pantherDecision=.3;}
      else {e.state='hunt';clearAction(e);}
    }
    return true;
  }
  if (d > 310 || !target) {
    if (e.state !== 'sit' && e.state !== 'lie' && e.state !== 'prowl') {setAction(e,'sit',1.8,'sit');return true;}
    if (e.state === 'sit') {e.timer-=dt;e.poseTime=clamp(1-e.timer/e.motionDuration,0,1);if(e.timer<=0)setAction(e,'lie',3.2,'lie');return true;}
    if (e.state === 'lie') {
      e.timer-=dt;e.poseTime=null;
      if(e.timer>0)return true;
      const branch=pantherBranch(game,e);
      if(branch){e.pantherTreeId=branch.id ?? branch.x+':'+branch.y;e.pantherBranchHeight=Math.min(72,branch.size*.5);e.pantherPerchX=branch.x+(e.orbit||1)*branch.size*.2;e.pantherPerchY=branch.rootY??branch.y+branch.size*.35;e.state='prowl';clearAction(e);}
      else setAction(e,'sit',2.4,'sit');
      return true;
    }
    if (e.state==='prowl' && tree) {
      const dx=e.pantherPerchX-e.x,dy=e.pantherPerchY-e.y,dist=Math.hypot(dx,dy);
      if(dist<17){setAction(e,'climb',.7,'climb');e.groundHeight=0;return true;}
      game.moveActor(e,dx/(dist||1)*e.speed*.55*dt,dy/(dist||1)*e.speed*.55*dt);
      e.moving=true;e.animationAction='prowl';e.poseTime=null;return true;
    }
    e.state='lie';setAction(e,'lie',3,'lie');return true;
  }
  if (['sit','lie','prowl'].includes(e.state)) {e.state='hunt';clearAction(e);}
  face();
  if(d<175 && e.cooldown<=0 && e.pantherDecision<=0) {
    if(d>75 && e.pantherEnergy>=(stats.swoopEnergy||COST.swoop)) {
      e.pantherEnergy-=stats.swoopEnergy||COST.swoop;e.cooldown=.32;e.dx=e.faceX;e.dy=e.faceY;setAction(e,'crouch',.42,'windup');game.onSound(creatureCue('panther','windup'),e);return true;
    }
    if(d<40 && e.pantherEnergy>=(stats.biteEnergy||COST.bite) && e.pantherDecision<=0) {
      e.pantherEnergy-=stats.biteEnergy||COST.bite;e.cooldown=.45;setAction(e,'bite',.32,'bite');strike(game,e,target,'bite');game.onSound(creatureCue('panther','bite'),e);return true;
    }
    if(d<53 && e.pantherEnergy>=(stats.swipeEnergy||COST.swipe)) {
      e.pantherEnergy-=stats.swipeEnergy||COST.swipe;e.cooldown=.33;e.pantherSwipeSide=e.pantherSwipeSide==='L'?'R':'L';setAction(e,e.pantherSwipeSide==='L'?'swipe_left':'swipe_right',.34,'swipe');strike(game,e,target,'swipe');game.onSound(creatureCue('panther','swipe'),e);return true;
    }
  }
  if(d>36) {
    const radial=d<82?-.3:d>135?.72:0;
    const orbit=e.orbit||1;
    const vx=e.faceX*radial-e.faceY*orbit*.8,vy=e.faceY*radial+e.faceX*orbit*.8;
    const len=Math.hypot(vx,vy)||1;
    game.moveActor(e,vx/len*e.speed*.8*dt,vy/len*e.speed*.8*dt);
    e.moving=true;e.animationAction='prowl';e.poseTime=null;
  } else {e.moving=false;e.animationAction='crouch';e.poseTime=null;}
  return true;
}
