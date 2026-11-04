// A self-contained, side-view Wildbound expedition reached through the lobby TV.
// Board progress/physics stay isolated; collected items go to the owning hero.
import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {ARENA_WIDTH,ARENA_FLOOR,ARENA_BOARD_X,ARENA_ENEMIES,createArenaLevel,arenaSolids,moveArenaBody} from './tv-arena-level.mjs';
import {drawArenaArchitecture,drawArenaBackdrop,drawArenaBoard} from './tv-arena-art.mjs';
import {drawBoard} from './board.mjs';
import {drawDie} from './render.mjs';
import {drawItem} from './item-art.mjs';
import {ITEMS,give,itemKind,take} from './items.mjs';
import {drawQuestionBlock,blockBreakParticles,tickBlockParticles,drawBlockParticles} from './tv-block-art.mjs';
import {victoryRewards,drawVictoryChest} from './victory-chest.mjs';
export const TV_WILDBOUND_WIDTH=ARENA_WIDTH;
export const TV_WILDBOUND_GOAL=48;
const VIEW_W=960,VIEW_H=540,FLOOR=ARENA_FLOOR;
export const TV_BOARD_X=ARENA_BOARD_X;
const BOARDS=[TV_BOARD_X];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const TV_WILDBOUND_SCENE_WIDTH=360;
export const TV_WILDBOUND_SCENE_TEMPLATES=Object.freeze(['West Gate','Rootwell Ascent','Canopy Crossing','Board Hearth','Living Arena','Crown Passage','Mossback Gallery','East Gate'].map(name=>Object.freeze({name})));
const stats=kind=>kind==='mossback'?{w:34,h:32,speed:45,hp:2}:kind==='bramblecap'?{w:36,h:34,speed:54,hp:1}:kind==='goomba'?{w:28,h:25,speed:38,hp:1}:{w:37,h:52,speed:52,hp:2};

export class TvWildbound {
  constructor(party=[],seed=1){
    this.seed=seed>>>0;this.landscapeSeed=this.seed;this.time=0;this.intro=0;this.camera=0;this.progress=0;this.lastRoll=0;this.rollFlash=0;this.boardCooldown=0;this.message='Hit a board to roll. Cross the jungle in 2D.';this.won=false;this.projectiles=[];this.blockParticles=[];this.viewportWidth=VIEW_W;
    this.owners=new Map(party.map(p=>[p.id,p]));this.loot=[];this.spawnTimer=8;this.rollView=null;
    this.victoryRewards=[];this.victoryChestOpened=false;this.victoryChestArt=null;this.requestLobbyReturn=false;
    this.message='Mossroot Coliseum · strike the center board to awaken the ruins.';
    this.scenes=TV_WILDBOUND_SCENE_TEMPLATES.map((s,index)=>({...s,start:index*TV_WILDBOUND_SCENE_WIDTH,index}));
    Object.assign(this,createArenaLevel());this.solids=arenaSolids(this);this.enemyRoster=[...ARENA_ENEMIES];
    this.wave=0;this.waveQueue=[];this.defeated=0;this.sunseeds=0;this.enemySerial=0;
    this.players=new Map(party.map((hero,i)=>{const spawn=this.playerSpawns[0];return [hero.id,{id:hero.id,hero:{...hero,appearance:{...DEFAULT_APPEARANCE,...hero.appearance}},x:spawn.x+(i%4)*64,y:spawn.y,vx:0,vy:0,face:1,grounded:true,jumpHeld:false,attackHeld:false,dashHeld:false,dashTime:0,dashCooldown:0,dashDirection:1,attackTime:0,invulnerable:2,hp:3,step:0,checkpoint:spawn.x,checkpointY:spawn.y,tubeCooldown:0}];}));
    this.camera=TV_BOARD_X-VIEW_W/2;this.enemies=[];
  }
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  queueWave(){
    this.wave++;const capacity=Math.max(0,24-this.enemies.filter(e=>e.alive).length-this.waveQueue.length);
    const count=Math.min(capacity,6+Math.floor(this.wave/3)*2);
    for(let i=0;i<count;i++){
      const spawn=this.enemySpawns[(i+this.wave-1)%this.enemySpawns.length];
      this.waveQueue.push({spawnId:spawn.id,kind:(i+this.wave)%3===0?'mossback':'bramblecap',delay:.8+Math.floor(i/6)*1.1+(i%6)*.12});
    }
  }
  spawnAt(spawn,kind){
    if(!spawn||!this.enemyRoster.includes(kind)||this.enemies.filter(e=>e.alive).length>=24)return null;
    const e={id:++this.enemySerial,kind,home:spawn.x,x:spawn.x,y:spawn.y,vx:0,vy:0,face:spawn.face,phase:this.random()*6,alive:true,hit:0,cooldown:0,emerging:.65,age:0,shell:false,shellSpeed:0,...stats(kind)};
    this.enemies.push(e);return e;
  }
  defeat(e){if(!e.alive)return;e.alive=false;e.deathAge=0;this.defeated++;this.blockParticles.push(...blockBreakParticles(e.x,e.y-e.h/2,()=>this.random()).slice(0,6));if(this.blockParticles.length>128)this.blockParticles.splice(0,this.blockParticles.length-128);}
  damageEnemy(e,damage=1){if(!e.alive||e.emerging>0)return;e.hp-=damage;e.hit=.25;if(e.hp<=0)this.defeat(e);}
  tryTube(p){
    if(!p.grounded||p.tubeCooldown>0)return false;
    const source=this.tubes.find(t=>Math.abs(p.x-t.x)<49&&Math.min(Math.abs(p.y-t.y),Math.abs(p.y-(t.y+t.h)))<12);
    const target=source&&this.tubes.find(t=>t.id===source.pair);if(!target)return false;
    p.tubeTransit={time:0,source,target};p.vx=p.vy=0;p.tubeCooldown=1.5;p.invulnerable=Math.max(p.invulnerable,1.7);
    this.message=`Tube ${source.rune} · follow the roots to the linked opening.`;return true;
  }
  sceneAt(x){return this.scenes[Math.max(0,Math.min(this.scenes.length-1,Math.floor(x/TV_WILDBOUND_SCENE_WIDTH)))];}
  get ready(){return this.intro>=2.8;}
  finish(caller=null){
    if(this.won)return;
    this.won=true;
    this.victoryRewards=victoryRewards([...this.owners.values()],()=>this.random());
    this.message=caller?`${caller.hero.name||'Explorer'} calls WILDBOUND! Victory treasure awaits at the chest.`:'Victory treasure awaits! Interact to open the chest before returning to the lobby.';
    const extra=(this.viewportWidth-VIEW_W)/2;
    this.camera=TV_WILDBOUND_WIDTH-VIEW_W-extra;
  }
  roll(playerId=[...this.players.keys()][0]){
    this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;
    this.lastRoll=1+this.seed%6;this.progress=Math.min(TV_WILDBOUND_GOAL,this.progress+this.lastRoll);
    this.rollFlash=1.5;this.boardCooldown=.75;this.queueWave();
    this.rollView={elapsed:0,dice:[this.lastRoll],total:this.lastRoll,startProgress:this.progress-this.lastRoll,tossSeed:this.random(),playerId};
    this.message=this.progress===TV_WILDBOUND_GOAL?'The final space glows. Interact at the center board to call WILDBOUND, or continue to the far gate.':`The board rolls ${this.lastRoll}. Space ${this.progress} of ${TV_WILDBOUND_GOAL}.`;
  }
  hurt(p){
    if(p.invulnerable>0)return;
    p.hp--;p.invulnerable=1.5;p.vy=-270;
    if(p.hp<=0){p.hp=3;p.x=p.checkpoint;p.y=p.checkpointY??FLOOR;p.vy=0;p.invulnerable=2;this.message=`${p.hero.name||'Explorer'} returns to the last hearth.`;}
  }
  dropItem(playerId,type,qty=1,metadata={}){
    const p=this.players.get(playerId);if(!p)return;
    this.loot.push({...structuredClone(metadata),type,qty,x:p.x+p.face*40,y:p.y-20,vy:-100,age:0,manualPickup:true});
    this.message='Item dropped in the TV world. Interact nearby to pick it up.';
  }
  attack(p){
    const owner=this.owners.get(p.id),equipment=owner?.equipment||p.hero.equipment||{};
    const slot=['hand1','hand2'].find(s=>equipment[s]&&(itemKind(equipment[s])==='bow'||ITEMS[equipment[s]]?.magic));
    const weaponId=slot&&equipment[slot],weapon=ITEMS[weaponId],kind=weaponId?itemKind(weaponId):null;
    if(kind==='bow'){
      if(!owner?.inventory||!take(owner.inventory,'arrow',1)){this.message='Out of arrows. Collect arrows or switch weapons.';return false;}
      this.projectiles.push({friendly:true,kind:'arrow',owner:p.id,x:p.x+p.face*20,y:p.y-31,vx:p.face*460,vy:0,life:1.8,damage:Math.max(1,Math.ceil((weapon?.damage||18)/25)),color:weapon?.artColor||weapon?.color||'#e7d6a0'});
      this.message='Arrow loosed!';return true;
    }
    if(weapon?.magic){
      const cost=weapon.manaCost||0,maxMana=owner?.maxMana||100;
      owner.mana??=maxMana;
      if(owner.mana<cost){this.message='Not enough mana to cast.';return false;}
      owner.mana-=cost;
      if(weapon.healing){owner.hp=Math.min(owner.maxHp||100,(owner.hp||0)+(weapon.healingAmount||18));this.message='A restorative spell mends the explorer.';return true;}
      this.projectiles.push({friendly:true,kind:'magic',owner:p.id,x:p.x+p.face*20,y:p.y-27,vx:p.face*330,vy:0,life:2.2,damage:Math.max(1,Math.ceil((weapon.damage||18)/25)),color:weapon.artColor||weapon.color||'#9bcfff',spellType:weapon.spellType});
      this.message='A spell streaks through the woodland.';return true;
    }
    let hit=false;
    for(const e of this.enemies)if(e.alive&&Math.abs(e.x-p.x)<e.w/2+30&&Math.abs((e.y-e.h/2)-(p.y-28))<e.h/2+30&&Math.sign(e.x-p.x)===p.face){
      if(e.shell){e.shellSpeed=p.face*300;e.face=p.face;e.kicker=p.id;e.kickGrace=.25;}else this.damageEnemy(e);hit=true;
    }
    if(hit)this.message='Strike landed!';
    return hit;
  }
  step(dt,commands={}){
    dt=clamp(dt,0,.05);this.time+=dt;
    if(!this.ready){this.intro=Math.min(2.8,this.intro+dt);return;}
    if(this.won)return;
    if(this.rollView){
      for(const p of this.players.values()){p.attackHeld=!!commands[p.id]?.attack;p.jumpHeld=!!commands[p.id]?.jump;p.dashHeld=!!commands[p.id]?.dash;p.lootHeld=!!commands[p.id]?.loot;p.attackTime=0;}
      this.rollView.elapsed+=dt;if(this.rollView.elapsed>=3.5)this.rollView=null;return;
    }
    tickBlockParticles(this.blockParticles,dt);
    for(const pending of this.waveQueue)pending.delay-=dt;
    for(const pending of this.waveQueue.filter(q=>q.delay<=0)){
      const spawn=this.enemySpawns.find(s=>s.id===pending.spawnId);
      if([...this.players.values()].some(p=>Math.abs(p.x-spawn.x)<100&&Math.abs(p.y-spawn.y)<75)){pending.delay=.35;continue;}
      this.spawnAt(spawn,pending.kind);pending.done=true;
    }
    this.waveQueue=this.waveQueue.filter(q=>!q.done);
    this.boardCooldown=Math.max(0,this.boardCooldown-dt);this.rollFlash=Math.max(0,this.rollFlash-dt);
    for(const p of this.players.values()){
      const input=commands[p.id]||{};
      p.menuPaused=!!input.paused||!!this.owners.get(p.id)?.ui;
      if(p.menuPaused){p.vx=0;p.attackTime=0;p.attackHeld=!!input.attack;p.jumpHeld=!!input.jump;p.dashHeld=!!input.dash;p.lootHeld=!!input.loot;continue;}
      p.tubeCooldown=Math.max(0,(p.tubeCooldown||0)-dt);
      if(p.tubeTransit){
        const transit=p.tubeTransit;transit.time+=dt;
        if(transit.time>=.35&&!transit.arrived){p.x=transit.target.x;p.y=transit.target.y;p.previousY=p.y;transit.arrived=true;this.camera=clamp(p.x-VIEW_W/2,0,TV_WILDBOUND_WIDTH-VIEW_W);}
        p.invulnerable=Math.max(p.invulnerable,1);p.attackHeld=!!input.attack;p.jumpHeld=!!input.jump;p.lootHeld=!!input.loot;
        if(transit.time>=.75){p.tubeTransit=null;p.grounded=true;}continue;
      }
      const callWildbound=!!input.loot&&!p.lootHeld;p.lootHeld=!!input.loot;
      if(callWildbound&&this.tryTube(p))continue;
      if(callWildbound){const hearth=this.playerSpawns.find(s=>Math.abs(s.x-p.x)<42&&Math.abs(s.y-p.y)<12);if(hearth){p.checkpoint=hearth.x;p.checkpointY=hearth.y;this.message=hearth.label+' · respawn attuned.';}}
      if(callWildbound&&this.progress>=TV_WILDBOUND_GOAL&&p.grounded&&Math.abs(p.y-FLOOR)<10&&Math.abs(p.x-TV_BOARD_X)<100){this.finish(p);break;}
      const owner=this.owners.get(p.id);
      if(owner){const maxMana=owner.maxMana||100;owner.mana=Math.min(maxMana,(owner.mana??maxMana)+dt*8);}
      const direction=(input.right?1:0)-(input.left?1:0);
      if(direction)p.face=direction;
      p.dashCooldown=Math.max(0,p.dashCooldown-dt);
      if(input.dash&&!p.dashHeld&&p.dashCooldown<=0){p.dashTime=.18;p.dashCooldown=.72;p.dashDirection=direction||p.face;}
      p.vx=p.dashTime>0?p.dashDirection*430:direction*(input.run?220:170);
      p.dashTime=Math.max(0,p.dashTime-dt);p.dashHeld=!!input.dash;
      if(input.jump&&!p.jumpHeld&&p.grounded){p.vy=-520;p.grounded=false;}
      p.jumpHeld=!!input.jump;
      if(input.attack&&!p.attackHeld){
        p.attackTime=.28;
        const board=BOARDS.find(x=>Math.abs(p.x-x)<72&&p.grounded&&Math.abs(p.y-FLOOR)<10&&(Math.abs(p.x-x)<12||Math.sign(x-p.x)===p.face));
        if(board!==undefined&&!this.boardCooldown){this.roll(p.id);p.checkpoint=board-110;p.checkpointY=FLOOR;}
        else this.attack(p);
      }
      p.attackHeld=!!input.attack;p.attackTime=Math.max(0,p.attackTime-dt);p.invulnerable=Math.max(0,p.invulnerable-dt);
      const before=p.x,beforeY=p.y,oldHead=p.y-58;p.previousY=beforeY;
      moveArenaBody(p,dt,this.solids);p.step+=Math.abs(p.x-before)*.14;
      for(const block of this.blocks)if(Math.abs(p.x-block.x)<29){
        if(p.vy<0&&oldHead>=block.y+32&&p.y-58<=block.y+32){
          p.y=block.y+32+58;block.bump=.25;p.vy=80;
          if(!block.used){block.used=true;this.loot.push({x:block.x,y:block.y-18,vy:-145,age:0,type:'unknown_mushroom',floor:block.y});this.blockParticles.push(...blockBreakParticles(block.x,block.y,()=>this.random()));if(this.blockParticles.length>128)this.blockParticles.splice(0,this.blockParticles.length-128);this.message='A strange purple mushroom! Collect it — its purpose is unknown.';}
        }else if(p.vy>=0&&beforeY<=block.y&&p.y>=block.y){p.y=block.y;p.vy=0;p.grounded=true;}
      }
      for(const seed of this.pickups)if(!seed.collected&&Math.abs(seed.x-p.x)<23&&Math.abs(seed.y-(p.y-24))<32){seed.collected=true;this.sunseeds++;if(this.sunseeds%5===0)p.hp=Math.min(3,p.hp+1);}
      if(p.x>=TV_WILDBOUND_WIDTH-95){if(this.progress>=TV_WILDBOUND_GOAL){this.finish();break;}else{p.x=TV_WILDBOUND_WIDTH-96;this.message='The gate needs all 48 board spaces. Hit the central board to roll.';}}
    }
    if(this.won)return; // Victory is safe: no final-frame enemy damage or loot loss.
    for(const e of this.enemies)if(e.alive){
      e.hit=Math.max(0,e.hit-dt);e.age=(e.age||0)+dt;e.kickGrace=Math.max(0,(e.kickGrace||0)-dt);
      e.retractTime=Math.max(0,(e.retractTime||0)-dt);e.wakeTime=Math.max(0,(e.wakeTime||0)-dt);e.attackTime=Math.max(0,(e.attackTime||0)-dt);
      if(e.emerging>0){e.emerging=Math.max(0,e.emerging-dt);continue;}
      if(e.shell&&!e.shellSpeed){e.shellTimer-=dt;if(e.shellTimer<=0){e.shell=false;e.h=32;e.hp=2;e.wakeTime=.35;}}
      e.vx=e.wakeTime>0?0:e.shell?e.shellSpeed:e.face*e.speed;
      const oldX=e.x,blocked=moveArenaBody(e,dt,this.solids,TV_WILDBOUND_WIDTH,{half:e.w/2,height:e.h});
      // Turn before walking off an upper ledge; a kicked shell may fall to a lower route.
      const support=e.y>=FLOOR||this.solids.some(s=>Math.abs(e.y-s.y)<2&&e.x+e.face*(e.w/2+5)>=s.x&&e.x+e.face*(e.w/2+5)<=s.x+s.w);
      if(blocked||(!support&&e.grounded&&!e.shellSpeed)){e.face*=-1;if(e.shellSpeed)e.shellSpeed*=-1;else e.x=oldX;}
      if(e.shellSpeed)for(const other of this.enemies)if(other!==e&&other.alive&&other.emerging<=0&&Math.abs(e.x-other.x)<(e.w+other.w)/2&&Math.abs(e.y-other.y)<30){this.defeat(other);}
      for(const p of this.players.values())if(!p.menuPaused&&!p.tubeTransit){
        const horizontallyOver=p.x+10>e.x-e.w/2&&p.x-10<e.x+e.w/2,enemyTop=e.y-e.h;
        const stomping=horizontallyOver&&p.vy>0&&p.previousY<=enemyTop+8&&p.y>=enemyTop-2;
        if(stomping){
          if(e.kind==='mossback'){
            e.shell=true;e.shellTimer=8;e.shellSpeed=0;e.h=23;e.kickGrace=.25;e.retractTime=.3;this.message='Mossback retracted · strike or bump the shell to send it sliding.';
          }else{this.defeat(e);this.message='Bramblecap stomped!';}
          p.y=enemyTop;p.vy=-330;p.grounded=false;break;
        }else if(horizontallyOver&&p.y>enemyTop+5&&p.y-54<e.y){
          if(e.shell&&!e.shellSpeed){e.shellSpeed=(Math.sign(e.x-p.x)||p.face)*300;e.face=Math.sign(e.shellSpeed);e.kicker=p.id;e.kickGrace=.25;}
          else if(!(e.kickGrace>0&&e.kicker===p.id)){if(p.invulnerable<=0)e.attackTime=.28;this.hurt(p);}
        }
      }
    }
    this.enemies=this.enemies.filter(e=>e.alive||(e.deathAge=(e.deathAge||0)+dt)<.4);
    for(const shot of this.projectiles){
      shot.x+=shot.vx*dt;shot.y+=(shot.vy||0)*dt;shot.life-=dt;
      if(shot.friendly){
        for(const e of this.enemies)if(e.alive&&shot.life>0&&Math.abs(e.x-shot.x)<e.w/2+8&&shot.y>=e.y-e.h-7&&shot.y<=e.y+5){this.damageEnemy(e,shot.damage||1);shot.life=0;break;}
      }else for(const p of this.players.values())if(!p.menuPaused&&shot.life>0&&Math.abs(p.x-shot.x)<17&&Math.abs(p.y-24-shot.y)<25){this.hurt(p);shot.life=0;}
    }
    const viewExtra=(this.viewportWidth-VIEW_W)/2;
    this.projectiles=this.projectiles.filter(shot=>shot.life>0&&shot.x>this.camera-viewExtra-100&&shot.x<this.camera+VIEW_W+viewExtra+100);
    for(const b of this.blocks)b.bump=Math.max(0,b.bump-dt);
    for(const item of this.loot){item.age+=dt;item.vy+=800*dt;const oldItemY=item.y;item.y=Math.min(FLOOR-10,item.y+item.vy*dt);for(const surface of this.solids)if(item.vy>0&&item.x>=surface.x&&item.x<=surface.x+surface.w&&oldItemY<=surface.y-10&&item.y>=surface.y-10){item.y=surface.y-10;item.vy=0;}for(const p of this.players.values())if(!p.menuPaused&&(!item.manualPickup||commands[p.id]?.loot)&&!item.collected&&item.age>.5&&Math.abs(item.x-p.x)<30&&Math.abs(item.y-(p.y-20))<45){const owner=this.owners.get(p.id);if(owner?.inventory&&give(owner.inventory,item.type,item.qty||1,32,item)){item.collected=true;this.onLoot?.(owner);this.message=item.type==='unknown_mushroom'?'Strange mushroom collected · purple quality · unknown use.':'Item picked up.';}else this.message='Backpack full. The item will wait here.';}}
    this.loot=this.loot.filter(item=>!item.collected);
    const active=[...this.players.values()];
    if(active.length){const lead=Math.max(...active.map(p=>p.x)),tail=Math.min(...active.map(p=>p.x)),extra=(this.viewportWidth-VIEW_W)/2;this.camera=clamp(Math.min(lead-350,tail-60),extra,TV_WILDBOUND_WIDTH-VIEW_W-extra);}
  }
  draw(c,width,height,animator){
    c.save();c.fillStyle='#101d23';c.fillRect(0,0,width,height);
    const scale=Math.min(width/VIEW_W,height/VIEW_H);c.translate((width-VIEW_W*scale)/2,(height-VIEW_H*scale)/2);c.scale(scale,scale);
    const viewWidth=width/scale,viewLeft=-(viewWidth-VIEW_W)/2,left=this.camera+viewLeft,right=left+viewWidth;
    this.viewportWidth=Math.min(TV_WILDBOUND_WIDTH,viewWidth);
    c.beginPath();c.rect(viewLeft,0,viewWidth,VIEW_H);c.clip();
    this.drawLandscape(c,viewLeft,viewWidth);
    c.save();c.translate(-this.camera,0);
    drawArenaArchitecture(c,this,left,right);
    for(const block of this.blocks)if(block.x>left-40&&block.x<right+40)drawQuestionBlock(c,block,this.time);
    drawBlockParticles(c,this.blockParticles,left,right);
    for(const item of this.loot)if(item.x>left-40&&item.x<right+40){drawItem(c,item.type,item.x,item.y,32);c.fillStyle='#c58bfa';c.font='10px system-ui';c.textAlign='center';c.fillText(item.type==='unknown_mushroom'?'Strange mushroom':'Interact to pick up',item.x,item.y-22);}
    for(const x of BOARDS)if(x>left-110&&x<right+110)this.drawBoard(c,x);
    for(const e of this.enemies)if((e.alive||e.deathAge<.4)&&e.x>left-100&&e.x<right+100){
      const action=!e.alive?'death':e.emerging>0?'emerge':e.retractTime>0?'retract':e.wakeTime>0?'wake':e.shell?(e.shellSpeed?'slide':'shell'):e.hit>0?'hurt':e.attackTime>0?'attack':'walk';
      const poseTime=!e.alive?e.deathAge/.4:e.emerging>0?1-e.emerging/.65:e.retractTime>0?1-e.retractTime/.3:e.wakeTime>0?1-e.wakeTime/.35:e.hit>0?1-e.hit/.25:e.attackTime>0?1-e.attackTime/.28:undefined;
      c.save();if(e.emerging>0){c.beginPath();c.rect(e.x-65,e.y-75,130,78);c.clip();}
      animator.draw(c,{...e,sprite:e.kind,faceX:e.face,faceY:0,moving:!e.shell||!!e.shellSpeed,step:this.time*e.speed*.14,animationAction:action,poseTime},this.time+(e.phase||0),48);c.restore();
    }
    for(const shot of this.projectiles){
      if(shot.kind==='magic'){c.save();c.shadowColor=shot.color;c.shadowBlur=12;c.fillStyle=shot.color;c.beginPath();c.arc(shot.x,shot.y,7,0,Math.PI*2);c.fill();c.restore();}
      else{c.save();c.translate(shot.x,shot.y);c.rotate(shot.vx<0?Math.PI:0);c.fillStyle=shot.color||'#e9d6a0';c.fillRect(-10,-1,19,3);c.beginPath();c.moveTo(10,-4);c.lineTo(16,0);c.lineTo(10,4);c.fill();c.fillStyle='#6f4933';c.fillRect(-10,-3,3,7);c.restore();}
    }
    for(const p of this.players.values()){
      c.save();if(p.tubeTransit){const t=p.tubeTransit.time;c.globalAlpha=t<.35?1-t/.35:(t-.35)/.4;}c.globalAlpha*=(p.invulnerable>0&&Math.floor(this.time*12)%2)?0.55:1;
      const owner=this.owners.get(p.id);
      animator.draw(c,{...p.hero,...owner,appearance:{...DEFAULT_APPEARANCE,...owner?.appearance},kind:'player',x:p.x,y:p.y,faceX:p.face,faceY:0,moving:Math.abs(p.vx)>1,step:p.step,attack:p.attackTime,animationAction:p.attackTime>0?'slash':undefined},this.time,71);
      c.fillStyle='#fff3d1';c.textAlign='center';c.font='bold 13px system-ui';c.fillText(p.hero.name||'Explorer',p.x,p.y-67);
      for(let i=0;i<p.hp;i++){c.fillStyle='#e05e62';c.fillText('♥',p.x-16+i*16,p.y-81);}
      c.restore();
    }
    c.fillStyle=this.progress>=TV_WILDBOUND_GOAL?'#e6c66f':'#557e75';c.fillRect(TV_WILDBOUND_WIDTH-98,285,16,138);c.fillRect(TV_WILDBOUND_WIDTH-160,282,95,16);c.fillRect(TV_WILDBOUND_WIDTH-160,282,16,141);
    c.fillStyle='#f9e7b5';c.font='bold 15px Georgia';c.fillText('EXIT',TV_WILDBOUND_WIDTH-111,269);
    if(this.won){
      const chest=this.victoryChestScene||={};
      Object.assign(chest,{victoryChest:true,players:[...this.owners.values()],time:this.time,victoryRewards:this.victoryRewards,victoryChestOpened:this.victoryChestOpened,controlLabels:{interact:'E / top face'}});
      c.save();c.translate(TV_WILDBOUND_WIDTH-205,FLOOR-15);c.scale(1.6,1.6);c.translate(-800,-919);drawVictoryChest(c,chest);c.restore();
    }
    c.restore();
    c.fillStyle='#102c2ce8';c.fillRect(viewLeft,0,viewWidth,56);c.textAlign='center';c.fillStyle='#f5e8c0';c.font='bold 20px Georgia';c.fillText('MOSSROOT COLISEUM',VIEW_W/2,25,Math.max(200,viewWidth-500));c.fillStyle='#d3c694';c.font='11px system-ui';c.fillText(`BOARD ${this.progress}/${TV_WILDBOUND_GOAL} · ${this.sceneAt(this.camera+VIEW_W/2).name.toUpperCase()}`,VIEW_W/2,45);c.textAlign='left';
    c.fillStyle='#102c2ce8';c.fillRect(viewLeft,510,viewWidth,30);c.fillStyle='#e5d5a9';c.font='15px system-ui';c.font='12px system-ui';c.fillText(this.message,viewLeft+20,530,viewWidth-40);
    this.drawArenaMap(c,viewLeft,viewWidth);
    if(this.rollFlash>0){c.fillStyle='#f4dc96';c.textAlign='center';c.font='bold 55px Georgia';c.fillText(`+${this.lastRoll}`,VIEW_W/2,153);}
    if(!this.ready)this.drawIntro(c,viewLeft,viewWidth);
    if(this.rollView){c.fillStyle='#081913ef';c.fillRect(viewLeft,0,viewWidth,VIEW_H);c.save();c.translate(VIEW_W/2,VIEW_H/2);c.scale(2.6,2.6);const players=[...this.players.values()].map(p=>({...p.hero,boardProgress:this.progress}));drawBoard(c,{players,roll:this.rollView,current:this.rollView.playerId},this.rollView.elapsed,{drawDie});c.restore();c.fillStyle='#f6e4b3';c.textAlign='center';c.font='18px Georgia';c.fillText('THE LIVING BOARD',VIEW_W/2,65);}
    if(this.won){c.fillStyle='#092522e8';c.fillRect(120,165,720,172);c.strokeStyle='#d4b46b';c.lineWidth=3;c.strokeRect(120,165,720,172);c.fillStyle='#f6e5b4';c.textAlign='center';c.font='bold 34px Georgia';c.fillText('THE BOARD IS SEALED',480,218);c.font='20px system-ui';c.fillText(this.victoryRewards.some(Boolean)?'Your party earned a treasure chest!':'Treasure collected · well played!',480,264);c.font='17px system-ui';c.fillText(this.victoryRewards.some(Boolean)?'E / top face: open treasure · I / Back: manage backpack':'E / top face: return to the lobby',480,307);}
    c.restore();
  }
  drawLandscape(c,left=0,width=VIEW_W){c.imageSmoothingEnabled=false;drawArenaBackdrop(c,this.camera,left,width,this.time);}
  drawArenaMap(c,left,width){
    const w=Math.min(280,width*.35),x=VIEW_W/2-w/2,y=65;c.fillStyle='#0f2425dd';c.fillRect(x-7,y-5,w+14,36);
    c.fillStyle='#668875';c.fillRect(x,y+18,w,2);
    for(const tube of this.tubes){c.fillStyle='#6bbb8a';c.fillRect(x+tube.x/TV_WILDBOUND_WIDTH*w,y+tube.y/437*18,3,4);}
    c.fillStyle='#f4d283';c.fillRect(x+w/2-2,y+14,4,6);
    for(const p of this.players.values()){c.fillStyle=p.hero.color||'#b8e6e0';c.fillRect(x+p.x/TV_WILDBOUND_WIDTH*w-2,y+p.y/437*18-3,4,4);}
    c.fillStyle='#e4d5ad';c.textAlign='left';c.font='8px monospace';c.fillText(`WAVE ${this.wave}  ·  ${this.enemies.filter(e=>e.alive).length+this.waveQueue.length} ENEMIES  ·  ${this.sunseeds}/${this.pickups.length} SUNSEEDS`,x-3,y+28);
  }
  drawIntro(c,left=0,width=VIEW_W){
    const t=this.intro,fade=t<.5?1:clamp((2.8-t)/1.2,0,1);
    c.fillStyle=`rgba(4,13,15,${.93*fade})`;c.fillRect(left,0,width,VIEW_H);
    c.save();c.globalAlpha=fade;
    const pull=clamp((t-.45)/2.15,0,1);
    c.save();c.translate(VIEW_W/2,VIEW_H/2);
    for(const [i,p] of [...this.players.values()].entries()){
      const side=i%2?-1:1,x=side*(330*(1-pull)+25*pull),y=78*(1-pull);
      c.save();c.translate(x,y);c.rotate(side*pull*5);c.scale(1-pull*.82,1-pull*.82);
      c.fillStyle=p.hero.color||'#e2bd7d';c.fillRect(-10,-28,20,26);
      c.fillStyle=p.hero.appearance.skin;c.fillRect(-8,-43,16,16);
      c.fillStyle='#e6d5a9';c.fillRect(-11,-2,8,15);c.fillRect(3,-2,8,15);
      c.restore();
    }
    c.restore();
    c.save();c.translate(VIEW_W/2,VIEW_H/2);c.scale(1+t*.32,1+t*.32);
    c.strokeStyle='#d4ab58';c.lineWidth=8;c.strokeRect(-170,-100,340,200);
    c.fillStyle='#1b3e31';c.fillRect(-165,-95,330,190);
    c.textAlign='center';c.fillStyle='#f2d784';c.font='bold 45px Georgia';c.fillText('WILDBOUND',0,-25);
    c.fillStyle='#fff2cf';c.font='bold 18px system-ui';c.fillText('WARNING: THE GAME IS REAL',0,23);
    c.font='15px system-ui';c.fillText('PLAYERS ARE BEING PULLED',0,53);c.fillText('INTO THE TV',0,75);
    c.restore();
    c.restore();
  }
  drawBoard(c,x){drawArenaBoard(c,x,this.progress,this.time);}
}
