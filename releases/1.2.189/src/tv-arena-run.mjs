// TV-only expedition rules. Equipment is read live; supplies and blessings stay in this run.
import {ITEMS,itemKind} from './items.mjs';
import {ARENA_FLOOR,ARENA_WIDTH,moveArenaBody} from './tv-arena-level.mjs';
import {updateTvCrouch,canTvPlayerStand} from './tv-crouch.mjs';
import {arenaRosterTheme,moveTvRosterEnemy} from './tv-arena-roster.mjs';

export const ENCOUNTERS=Object.freeze({
  skirmish:{name:'Rootfoot uprising',goal:'Defeat every creature',color:'#eab978'},
  treasure:{name:'Sunseed pursuit',goal:'Collect all five marked sunseeds, then clear the guards',color:'#f5d778'},
  hazard:{name:'Thornstorm',goal:'Uproot the glowing Briar Hearts or strike them to stop their thorns',color:'#c8a1e8'},
  champion:{name:'Shellkeeper trial',goal:'Defeat the champion and its guards',color:'#ed997a'},
});
export const BLESSINGS=Object.freeze({
  airStep:{name:'Windstep',text:'One extra air dodge per rank'},
  ricochet:{name:'Briar ricochet',text:'Arrows and darts bounce once per rank'},
  sporeward:{name:'Spore ward',text:'Immune to spores; rank II also blocks thorns'},
  shellheart:{name:'Shell breaker',text:'Faster shells; rank II pierces champions'},
  quiver:{name:'Deep quiver',text:'Carry two more arrows and darts per rank'},
  supplies:{name:'Hearth renewal',text:'Restore hearts and refill arena supplies'},
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function initArenaRun(m){
  m.thornRoots=[];m.roundState='idle';m.encounter=null;m.roundsCleared=0;m.roundObjects=[];m.hazards=[];m.tubeWarnings=[];m.supplyDrops=[];m.runTime=0;
  m.message='Attack or Interact at the center board. Every roll advances toward space 48.';
  for(const p of m.players.values()){
    p.blessings={};p.arenaAmmo=4;p.thorns=3;p.charges=3;p.airDodges=0;p.coyote=.1;p.jumpBuffer=0;p.guard=0;
  }
}
export function arenaLoadout(m,p){
  const owner=m.owners.get(p.id)||p.hero,eq=owner.equipment||{};
  // The main hand determines the attack; an offhand cannot silently override it.
  const id=eq.hand1||eq.hand2,weapon=ITEMS[id]||{},kind=id?itemKind(id):'';
  const armor=Object.entries(eq).filter(([slot])=>!slot.startsWith('hand')).reduce((n,[,id])=>n+(ITEMS[id]?.armor||0),0);
  const role=p.arenaKit|| (weapon.boomerang||kind==='boomerang'?'returning':kind==='rifle'?'rifle':kind==='bow'?'bow':weapon.magic?'spell':kind==='spear'||/spear|pike|lance/.test(id||'')?'spear':'melee');
  return {owner,id,weapon,role,armor,heavy:armor>=8,damage:clamp(Math.ceil((weapon.damage||18)/25),1,3)};
}
export function cycleArenaKit(m,p){
  const kits=['','spear','bow','returning','spell'];p.arenaKit=kits[(kits.indexOf(p.arenaKit||'')+1)%kits.length];
  m.message=(p.hero.name||'Explorer')+' · '+(p.arenaKit||'equipped weapon')+' readied. Up + Attack changes kit between rounds.';
}
export const ammoCapacity=p=>4+(p.blessings.quiver||0)*2;
export function refillArenaPlayer(p,full=false){
  const cap=ammoCapacity(p);p.arenaAmmo=Math.min(cap,p.arenaAmmo+(full?cap:2));p.thorns=Math.min(cap,p.thorns+(full?cap:1));p.charges=Math.min(3,p.charges+(full?3:1));
  if(full)p.hp=3;
}
export function previewEncounters(m){
  // A visible six-face table stays fixed until the next completed round.
  const advanced=Math.max(m.roundsCleared,(m.rollsTaken||0))>=2;
  return ['skirmish','skirmish','treasure','treasure','hazard',advanced?'champion':'skirmish'];
}
export function startEncounter(m,roll,playerId){
  if(m.won||m.roundState==='blessing')return false;
  const kind=previewEncounters(m)[roll-1];
  m.roundState='active';m.encounter={kind,playerId,elapsed:0,pendingProgress:roll,credited:true,hazardClock:0,theme:arenaRosterTheme(m.roundsCleared).name};
  m.rollsTaken=(m.rollsTaken||0)+1;m.roundObjects=[];m.hazards=[];m.thornRoots=[];m.progress=Math.min(48,m.progress+roll);m.queueWave(kind);
  if(kind==='hazard')m.thornRoots=[{id:'west-briar',x:1180,y:317,hp:2,clock:.7},{id:'east-briar',x:1700,y:317,hp:2,clock:1.5}];
  if(kind==='treasure')for(const [i,[x,y]]of [[680,173],[1200,293],[1440,173],[1680,293],[2200,173]].entries())m.roundObjects.push({id:i,x,y,collected:false});
  m.message=ENCOUNTERS[kind].name+' · '+ENCOUNTERS[kind].goal;return true;
}
export function blessingOffers(p,round){
  const owned=Object.keys(p.blessings),pool=Object.keys(BLESSINGS).filter(k=>k!=='supplies'&&(p.blessings[k]||0)<2&&(owned.length<3||owned.includes(k)));
  if(!pool.length)return ['supplies'];
  const offset=round%pool.length;return [...pool.slice(offset),...pool.slice(0,offset)].slice(0,2).concat('supplies');
}
function finishEncounter(m){
  m.roundsCleared++;m.pendingBlessing=true;m.roundState='idle';m.encounter=null;m.roundObjects=[];m.hazards=[];m.thornRoots=[];
  for(const p of m.players.values())refillArenaPlayer(p);
  m.message='Creatures cleared! Hit the board to roll again. Up + Interact at the board: optional blessing.';
}
export function openArenaBlessings(m){
  if(!m.pendingBlessing||m.roundState!=='idle')return false;m.pendingBlessing=false;
  m.roundState='blessing';m.roundObjects=[];m.hazards=[];
  // Clear hostile remnants before opening the safe choice screen. Recoverable shots remain.
  m.projectiles=m.projectiles.filter(s=>s.friendly);m.blessingAge=0;
  for(const p of m.players.values()){p.blessingChoice={offers:blessingOffers(p,m.roundsCleared),index:0,done:false,release:false};p.vx=p.vy=0;refillArenaPlayer(p);}
  m.message='Choose a blessing - Left/Right selects, Attack / Interact / Jump confirms.';return true;
}
export function tickBlessings(m,dt,commands){
  m.blessingAge+=dt;
  for(const p of m.players.values()){
    const input=commands[p.id]||{},choice=p.blessingChoice;if(!choice)continue;
    if((p.unavailable||m.owners.get(p.id)?.lobbyDisconnected)&&!choice.done){refillArenaPlayer(p,true);choice.done=true;}
    const confirm=!!(input.attack||input.loot||input.jump),dir=(input.right?1:0)-(input.left?1:0);
    if(!confirm)choice.release=true;
    if(!choice.done&&!input.paused&&!m.owners.get(p.id)?.ui){
      if(dir&&dir!==choice.heldDirection)choice.index=(choice.index+dir+choice.offers.length)%choice.offers.length;
      if(choice.release&&confirm&&!choice.confirmHeld&&m.blessingAge>.2){
        const key=choice.offers[choice.index];
        if(key==='supplies')refillArenaPlayer(p,true);
        else if((p.blessings[key]||0)<2&&(p.blessings[key]||Object.keys(p.blessings).length<3)){p.blessings[key]=(p.blessings[key]||0)+1;refillArenaPlayer(p);}
        choice.done=true;
      }
    }
    choice.heldDirection=dir;choice.confirmHeld=confirm;
    p.jumpHeld=!!input.jump;p.attackHeld=!!input.attack;p.lootHeld=!!input.loot;p.dashHeld=!!input.dash;p.jumpBuffer=0;
  }
  if([...m.players.values()].every(p=>p.blessingChoice?.done)){
    m.roundState='idle';m.encounter=null;for(const p of m.players.values())p.blessingChoice=null;
    m.message='Blessing bound - hit the center board to roll forward.';
  }
}
export function tickArenaRun(m,dt,commands){
  m.runTime+=dt;
  for(const w of m.tubeWarnings)w.life-=dt;m.tubeWarnings=m.tubeWarnings.filter(w=>w.life>0);
  for(const drop of m.supplyDrops){
    drop.life-=dt;
    for(const p of m.players.values())if(!p.menuPaused&&!p.tubeTransit&&drop.life>0&&Math.abs(p.x-drop.x)<27&&Math.abs(p.y-24-drop.y)<42){
      if(drop.kind==='arrow'&&p.arenaAmmo<ammoCapacity(p)){p.arenaAmmo++;drop.life=0;}
      if(drop.kind==='thorn'&&p.thorns<ammoCapacity(p)){p.thorns++;drop.life=0;}
      if(drop.kind==='charge'&&p.charges<3){p.charges++;drop.life=0;}
    }
  }
  m.supplyDrops=m.supplyDrops.filter(d=>d.life>0).slice(-80);
  if(m.roundState!=='active')return;
  const encounter=m.encounter;encounter.elapsed+=dt;
  for(const seed of m.roundObjects)for(const p of m.players.values())if(!seed.collected&&!p.menuPaused&&!p.tubeTransit&&Math.abs(p.x-seed.x)<25&&Math.abs(p.y-24-seed.y)<40){seed.collected=true;m.sunseeds++;}
  for(const root of m.thornRoots||[])if(root.hp>0){
    root.clock-=dt;
    if(root.clock<=0){root.clock=3.2;for(const dx of [-82,0,82])m.hazards.push({source:root.id,x:root.x+dx,y:root.y,width:64,age:0,life:2});}
  }
  for(const h of m.hazards){
    h.age+=dt;
    if(h.age>=1.25&&h.age<1.65)for(const p of m.players.values())if(!p.menuPaused&&!p.tubeTransit&&(p.blessings.sporeward||0)<2&&Math.abs(p.x-h.x)<h.width/2&&p.y<=h.y+6&&p.y>h.y-48)m.hurt(p);
  }
  m.hazards=m.hazards.filter(h=>h.age<h.life);
  if(!m.waveQueue.length&&!m.enemies.some(e=>e.alive)&&m.roundObjects.every(s=>s.collected)&&!(m.thornRoots||[]).some(r=>r.hp>0))finishEncounter(m);
}
export function damageBriarHeart(m,root,damage=1){
 if(root.hp<=0)return false;root.hp=Math.max(0,root.hp-damage);root.flash=.2;
 if(!root.hp){m.hazards=m.hazards.filter(h=>h.source!==root.id);dropArenaSupply(m,root.x,root.y-24,'charge');m.message='Briar Heart uprooted · its thorn lanes are gone.';}return true;
}
export function uprootNearbyBriar(m,p){
 const root=(m.thornRoots||[]).find(r=>r.hp>0&&Math.abs(r.x-p.x)<58&&Math.abs(r.y-p.y)<50);
 return root?damageBriarHeart(m,root,root.hp):false;
}
export function dropArenaSupply(m,x,y,kind='arrow'){
  if(m.supplyDrops.length<80)m.supplyDrops.push({x,y,kind,life:40});
}
export function kickShell(m,e,p){
  const power=p.blessings.shellheart||0;e.shellSpeed=(Math.sign(e.x-p.x)||p.face)*(300+power*65);e.face=Math.sign(e.shellSpeed);e.kicker=p.id;e.kickGrace=.3;e.shellPower=power;
}
export function burstSpores(m,e,p){
  for(const [vx,vy]of [[-240,-130],[0,-230],[240,-130]])m.projectiles.push({friendly:true,kind:'spore',owner:p.id,x:e.x,y:e.y-e.h,vx,vy,life:.95,damage:1,color:'#bdcf82',hitIds:[]});
}
export function transportArenaShot(m,shot,oldX,oldY,dt){
  shot.tubeCooldown=Math.max(0,(shot.tubeCooldown||0)-dt);
  if(shot.tubeCooldown>0)return false;
  const source=m.tubes.find(t=>{
    const crossesX=Math.min(oldX,shot.x)<=t.x+t.w/2&&Math.max(oldX,shot.x)>=t.x-t.w/2;
    const crossesY=Math.min(oldY,shot.y)<=t.y+t.h&&Math.max(oldY,shot.y)>=t.y;
    return crossesX&&crossesY;
  });
  const target=source&&m.tubes.find(t=>t.id===source.pair);if(!target)return false;
  shot.tubeTransit={target,time:.18};shot.tubeCooldown=.7;
  m.tubeWarnings.push({x:target.x,y:target.y,life:.65,kind:'shot'});return true;
}
export function arenaAttack(m,p){
  const {owner,weapon,role,damage}=arenaLoadout(m,p),aim=p.aim||{x:p.face,y:0};
  const shoot=(kind,speed,life,color)=>{const shot={friendly:true,kind,owner:p.id,x:p.x+aim.x*22,y:p.y-(p.bodyHeight||58)*.53+aim.y*16,vx:aim.x*speed,vy:aim.y*speed,life,damage,color,bounces:p.blessings.ricochet||0,hitIds:[]};m.projectiles.push(shot);return shot;};
  if(p.attackCooldown>0)return false;
  p.attackCooldown=role==='rifle'?.85:role==='spear'?.38:.24;
  if(role==='rifle'){
    if(!p.arenaAmmo){m.message='Rifle empty · collect glowing ammo or use Down + Attack for a thorn dart.';return false;}
    p.arenaAmmo--;
    const shot=shoot('rifle',720,1,'#ffe3a4');
    shot.bounces=0;
    p.rifleFlash=.10;
    return true;
  }
  if(role==='bow'){
    if(!p.arenaAmmo){m.message='Empty quiver · retrieve glowing arrows or use Down + Attack for thorn darts.';return false;}
    p.arenaAmmo--;shoot('arrow',560,1.8,weapon.artColor||'#f0d49b');return true;
  }
  if(role==='returning'){
    if(m.projectiles.some(s=>s.owner===p.id&&s.kind==='returning'))return false;
    const shot=shoot('returning',weapon.speed||380,2.2,weapon.artColor||'#ebce87');shot.age=0;return true;
  }
  if(role==='spell'){
    if(!p.charges){m.message='No spell charges · defeat creatures or choose Hearth renewal.';return false;}
    p.charges--;
    if(!p.arenaKit&&weapon.healing){p.hp=Math.min(3,p.hp+1);m.message='One spell charge restores a heart.';return true;}
    shoot('magic',350,2.2,weapon.artColor||'#9bcfff');return true;
  }
  const reach=role==='spear'?105:Math.min(72,Math.max(36,(weapon.reach||45)*.7));
  let hit=false;
  for(const root of m.thornRoots||[])if(root.hp>0){const dx=root.x-p.x,dy=root.y-22-(p.y-(p.bodyHeight||58)*.5);if(dx*aim.x+dy*aim.y>=-8&&dx*aim.x+dy*aim.y<reach+22&&Math.abs(dx*aim.y-dy*aim.x)<36){damageBriarHeart(m,root,damage);hit=true;}}
  for(const e of m.enemies)if(e.alive&&(e.emerging||0)<=0){
    const dx=e.x-p.x,dy=e.y-e.h/2-(p.y-(p.bodyHeight||58)*.5),along=dx*aim.x+dy*aim.y,across=Math.abs(dx*aim.y-dy*aim.x);
    if(along>=-8&&along<reach+e.w/2&&across<e.h/2+(role==='spear'?14:24)){
      if(e.shell)kickShell(m,e,p);
      else if(e.kind==='mossback'&&!e.champion){e.shell=true;e.shellTimer=8;e.shellSpeed=0;e.h=23;e.retractTime=.3;}
      else m.damageEnemy(e,damage);hit=true;
    }
  }
  if(hit)m.message=role==='spear'?'Spear lane struck!':'Strike landed!';return hit;
}
export function throwArenaThorn(m,p){
  if(p.attackCooldown>0)return false;
  if(!p.thorns){m.message='No thorn darts · gather creature supplies.';return false;}
  p.thorns--;p.attackCooldown=.3;
  m.projectiles.push({friendly:true,kind:'thorn',owner:p.id,x:p.x+p.face*22,y:p.y-(p.bodyHeight||58)*.5,vx:p.face*480,vy:0,life:1.4,damage:1,color:'#a2ce7b',bounces:p.blessings.ricochet||0,hitIds:[]});return true;
}
export function tickArenaMovement(m,p,input,dt){
  const direction=(input.right?1:0)-(input.left?1:0),vertical=(input.down?1:0)-(input.up?1:0),loadout=arenaLoadout(m,p);
  if(direction)p.face=direction;
  const length=Math.hypot(direction,vertical);p.aim=length?{x:direction/length,y:vertical/length}:{x:p.face,y:0};
  p.attackCooldown=Math.max(0,(p.attackCooldown||0)-dt);p.guard=Math.max(0,(p.guard||0)-dt);
  p.coyote=p.grounded?.1:Math.max(0,(p.coyote||0)-dt);if(p.grounded)p.airDodges=0;
  p.jumpBuffer=Math.max(0,(p.jumpBuffer||0)-dt);if(input.jump&&!p.jumpHeld)p.jumpBuffer=.13;
  p.dashCooldown=Math.max(0,p.dashCooldown-dt);
  const airLimit=1+(p.blessings.airStep||0),freshDash=input.dash&&!p.dashHeld;
  if(freshDash&&p.dashCooldown<=0&&(p.grounded||p.airDodges<airLimit)){
    p.dashTime=.16;p.dashCooldown=.72;p.dashDirection=direction||p.face;
    const l=length||1;p.dodgeVector=length?{x:direction/l,y:vertical/l}:{x:p.face,y:0};
    p.invulnerable=Math.max(p.invulnerable,.19);if(!p.grounded)p.airDodges++;
  }
  p.dashing=p.dashTime>0;
  updateTvCrouch(p,input,m.solids,dt);
  p.vx=p.dashing?(p.dodgeVector?.x??p.dashDirection)*430:direction*(input.run?230:180)*(loadout.heavy?.93:1);
  if(p.crouching&&!p.dashing)p.vx*=.5;
  if(p.dashing)p.vy=(p.dodgeVector?.y||0)*430-1250*dt;
  else if(input.down&&!p.grounded&&p.vy>=0)p.vy=Math.max(p.vy,420);
  if(p.jumpBuffer>0&&p.coyote>0){
    if(input.down&&p.y<ARENA_FLOOR&&m.platforms.some(s=>Math.abs(s.y-p.y)<2&&p.x>=s.x&&p.x<=s.x+s.w)){
      p.dropThrough=.22;p.y+=3;p.vy=90;
    }else if(p.crouching&&!canTvPlayerStand(p,m.solids)){p.jumpBuffer=0;p.jumpHeld=!!input.jump;p.dashHeld=!!input.dash;p.dashTime=Math.max(0,p.dashTime-dt);return;}
    else p.vy=-620;
    p.grounded=false;p.coyote=0;p.jumpBuffer=0;
    if(!p.dropThrough){p.crouching=false;p.bodyHeight=58;}
  }
  // Preserve full-height held jumps, but release cuts upward speed for precise hops.
  if(!input.jump&&p.jumpHeld&&p.vy< -290&&!p.dashing)p.vy=-290;
  p.dashTime=Math.max(0,p.dashTime-dt);p.dashHeld=!!input.dash;p.jumpHeld=!!input.jump;
  p.dropThrough=Math.max(0,(p.dropThrough||0)-dt);
}
export function moveArenaEnemy(m,e,dt){
  e.tubeCooldown=Math.max(0,(e.tubeCooldown||0)-dt);
  if(e.shellTransit){
    e.shellTransit.time-=dt;e.vx=e.vy=0;
    if(e.shellTransit.time<=0){const t=e.shellTransit.target;e.x=t.x+Math.sign(e.shellSpeed)*(t.w/2+e.w/2+4);e.y=t.y;e.shellTransit=null;e.tubeCooldown=.8;}
    return false;
  }
  if(e.shellSpeed&&!e.tubeCooldown){
    const t=m.tubes.find(t=>Math.abs(e.x-t.x)<t.w/2+e.w/2+Math.abs(e.shellSpeed)*dt+4&&Math.min(Math.abs(e.y-t.y),Math.abs(e.y-(t.y+t.h)))<16);
    const target=t&&m.tubes.find(s=>s.id===t.pair);
    if(target){e.shellTransit={target,time:.3};m.tubeWarnings.push({x:target.x,y:target.y,life:.8,kind:'shell'});return false;}
  }
  const targets=[...m.players.values()].filter(p=>!p.menuPaused&&!p.tubeTransit);
  const target=targets.sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
  const rosterMove=moveTvRosterEnemy(m,e,dt,target);if(rosterMove!==null)return rosterMove;
  if(e.kind==='bramblecap'&&target&&Math.abs(target.x-e.x)<420&&Math.abs(target.y-e.y)<85)e.face=Math.sign(target.x-e.x)||e.face;
  if(e.kind==='thornwing'){
    if(target){
      e.cooldown=Math.max(0,(e.cooldown||0)-dt);
      if(!e.swoop&&e.cooldown<=0&&Math.abs(e.x-target.x)<380){e.swoop={time:0,x:target.x,y:target.y-25};e.attackTime=.5;e.cooldown=3.4;}
      if(e.swoop){e.swoop.time+=dt;if(e.swoop.time>.55){const dx=e.swoop.x-e.x,dy=e.swoop.y-e.y,l=Math.hypot(dx,dy)||1;e.x+=dx/l*180*dt;e.y+=dy/l*180*dt;}if(e.swoop.time>1.45)e.swoop=null;}
      else{e.x+=clamp(target.x-e.x,-85,85)*dt;e.y+=(clamp(target.y-112-e.y,-65,65)+Math.cos(m.time*4+e.phase)*14)*dt;}
      e.face=Math.sign(target.x-e.x)||e.face;
    }
    e.x=clamp(e.x,42,ARENA_WIDTH-42);e.y=clamp(e.y,100,ARENA_FLOOR-10);return false;
  }
  if((e.kind==='sporecap'||e.champion)&&target){
    e.cooldown=Math.max(0,(e.cooldown||0)-dt);
    if(!e.cast&&e.cooldown<=0&&Math.abs(target.x-e.x)<540){
      const dx=target.x-e.x,dy=target.y-28-(e.y-e.h/2),l=Math.hypot(dx,dy)||1;
      e.cast={time:0,dx:dx/l,dy:dy/l};e.cooldown=e.champion?2.2:3.5;
    }
    if(e.cast){
      e.cast.time+=dt;e.attackTime=.2;e.vx=0;
      if(e.cast.time>=.85){
        const {dx,dy}=e.cast;m.projectiles.push({friendly:false,kind:'spore',x:e.x,y:e.y-e.h/2,vx:dx*210,vy:dy*210,life:2.5,damage:1,color:'#c89cdd'});e.cast=null;
      }
    }
  }
  return moveArenaBody(e,dt,m.solids,ARENA_WIDTH,{half:e.w/2,height:e.h});
}
export function tickArenaProjectiles(m,dt){
  for(const shot of m.projectiles){
    if(shot.tubeTransit){
      shot.tubeTransit.time-=dt;
      if(shot.tubeTransit.time<=0){const t=shot.tubeTransit.target;shot.x=t.x+(Math.sign(shot.vx)||1)*(t.w/2+12);shot.y=t.y+20;shot.tubeTransit=null;}
      continue;
    }
    const oldX=shot.x,oldY=shot.y;shot.age=(shot.age||0)+dt;
    if(shot.kind==='returning'&&shot.age>.48){
      const p=m.players.get(shot.owner);if(p){const dx=p.x-shot.x,dy=p.y-28-shot.y,l=Math.hypot(dx,dy)||1;shot.vx=dx/l*480;shot.vy=dy/l*480;if(l<24){shot.life=0;shot.caught=true;}}
    }
    if(shot.kind==='spore'&&shot.friendly)shot.vy+=450*dt;
    shot.x+=shot.vx*dt;shot.y+=(shot.vy||0)*dt;shot.life-=dt;
    const transported=transportArenaShot(m,shot,oldX,oldY,dt);
    if(transported)continue;
    // Real surfaces stop shots. A downward shot can land on a one-way ledge.
    const surface=!transported&&m.solids.find(s=>{
      if(s.style==='tube')return false;
      return shot.x>=s.x&&shot.x<=s.x+s.w&&((!s.oneWay&&shot.y>=s.y&&shot.y<=s.y+s.h)||(shot.vy>0&&oldY<=s.y&&shot.y>=s.y));
    });
    const wall=shot.x<32||shot.x>ARENA_WIDTH-32||shot.y<70||shot.y>ARENA_FLOOR;
    if((surface||wall)&&shot.life>0&&shot.kind!=='returning'){
      if(shot.friendly&&shot.bounces>0){
        shot.bounces--;if(surface||shot.y<70||shot.y>ARENA_FLOOR){shot.vy=-shot.vy;shot.y=surface?surface.y-2:clamp(shot.y,72,ARENA_FLOOR-2);}else{shot.vx=-shot.vx;shot.x=clamp(shot.x,34,ARENA_WIDTH-34);}
      }else shot.life=0;
    }
    if(shot.friendly){
      for(const root of m.thornRoots||[])if(root.hp>0&&shot.life>0&&!shot.hitIds?.includes(root.id)&&Math.abs(root.x-shot.x)<25&&shot.y>root.y-48&&shot.y<root.y+4){damageBriarHeart(m,root,shot.damage||1);(shot.hitIds??=[]).push(root.id);if(!['returning','spore'].includes(shot.kind))shot.life=0;}
      for(const e of m.enemies)if(e.alive&&(e.emerging||0)<=0&&shot.life>0&&!shot.hitIds?.includes(e.id)&&Math.abs(e.x-shot.x)<e.w/2+8&&shot.y>=e.y-e.h-7&&shot.y<=e.y+5){
        m.damageEnemy(e,shot.damage||1);(shot.hitIds??=[]).push(e.id);
        if(shot.kind!=='returning'&&shot.kind!=='spore')shot.life=0;
      }
    }else for(const p of m.players.values())if(!p.menuPaused&&!p.tubeTransit&&shot.life>0&&!(shot.kind==='spore'&&p.blessings.sporeward)&&Math.abs(p.x-shot.x)<17&&shot.y>=p.y-(p.bodyHeight||58)-3&&shot.y<=p.y+3){m.hurt(p);shot.life=0;shot.hitPlayer=true;}
    if(shot.life<=0&&!shot.recovered&&shot.friendly&&['arrow','thorn'].includes(shot.kind)){
      dropArenaSupply(m,clamp(shot.x,36,ARENA_WIDTH-36),clamp(shot.y,85,ARENA_FLOOR-20),shot.kind);shot.recovered=true;
    }
    if(shot.life<=0&&!shot.recovered&&shot.kind==='enemy-arrow'&&!shot.hitPlayer){dropArenaSupply(m,clamp(shot.x,36,ARENA_WIDTH-36),clamp(shot.y,85,ARENA_FLOOR-20),'arrow');shot.recovered=true;}
  }
  // Do not cull off-camera missiles: remote co-op players and linked tubes need them.
  m.projectiles=m.projectiles.filter(s=>s.life>0).slice(-128);
}
