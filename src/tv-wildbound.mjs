// A self-contained, side-view Wildbound expedition reached through the lobby TV.
// Board progress/physics stay isolated; collected items go to the owning hero.
import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {drawForestTree,drawBush} from './forest.mjs';
import {drawBoard} from './board.mjs';
import {drawDie} from './render.mjs';
import {drawItem} from './item-art.mjs';
import {ITEMS,give,itemKind,take} from './items.mjs';
import {drawQuestionBlock,blockBreakParticles,tickBlockParticles,drawBlockParticles} from './tv-block-art.mjs';
import {victoryRewards,drawVictoryChest} from './victory-chest.mjs';
export const TV_WILDBOUND_WIDTH=4800;
export const TV_WILDBOUND_GOAL=48;
const VIEW_W=960,VIEW_H=540,FLOOR=437;
export const TV_BOARD_X=TV_WILDBOUND_WIDTH/2;
const BOARDS=[TV_BOARD_X];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const TV_WILDBOUND_SCENE_WIDTH=600;
export const TV_WILDBOUND_SCENE_TEMPLATES=Object.freeze([
  {name:'Fernwood Trail',tint:'#75bd83',blocks:[[150,330],[370,285]],bushes:[[95,58],[520,76]],enemies:[['goomba',260],['skeleton',485]]},
  {name:'Mossy Causeway',tint:'#8eb28e',blocks:[[105,300],[300,350],[485,275]],bushes:[[210,68],[555,58]],enemies:[['lion',200],['bat',455]]},
  {name:'Canopy Steps',tint:'#7eabb4',blocks:[[180,345],[225,300],[400,320]],bushes:[[75,65],[510,84]],enemies:[['archer',165],['goomba',430]]},
  {name:'Old Rootway',tint:'#b09b72',blocks:[[130,275],[340,330],[435,275]],bushes:[[155,74],[555,64]],enemies:[['tiger',205],['skeleton_unarmed',475]]},
  {name:'Board Clearing',tint:'#c2b878',blocks:[[115,335],[325,285],[500,335]],bushes:[[70,55],[480,70]],enemies:[['bat',155],['goomba',470]]},
  {name:'Mooncap Hollow',tint:'#b6a0c2',blocks:[[165,300],[365,350],[430,300]],bushes:[[105,64],[540,72]],enemies:[['archer',190],['tiger',455]]},
  {name:'Willow Fen',tint:'#70aaa0',blocks:[[95,340],[255,285],[465,330]],bushes:[[185,80],[555,62]],enemies:[['lion',245],['skeleton',495]]},
  {name:'Sunlit Gate',tint:'#d3b37b',blocks:[[140,290],[300,340],[470,285]],bushes:[[85,72],[390,58]],enemies:[['goomba',225],['bat',390],['archer',510]]},
].map(scene=>Object.freeze({...scene,blocks:Object.freeze(scene.blocks.map(Object.freeze)),bushes:Object.freeze(scene.bushes.map(Object.freeze)),enemies:Object.freeze(scene.enemies.map(Object.freeze))})));
function buildScenes(seed){
  const order=TV_WILDBOUND_SCENE_TEMPLATES.slice();let state=(seed>>>0)||1;
  for(let i=order.length-1;i>0;i--){state=(Math.imul(state,1664525)+1013904223)>>>0;const j=state%(i+1);[order[i],order[j]]=[order[j],order[i]];}
  return order.map((template,index)=>({...template,start:index*TV_WILDBOUND_SCENE_WIDTH,index}));
}
const stats=kind=>kind==='goomba'?{w:28,h:25,speed:38,hp:1}:kind==='bat'?{w:48,h:36,speed:78,hp:1}:['lion','tiger'].includes(kind)?{w:68,h:42,speed:85,hp:2}:{w:37,h:52,speed:52,hp:2};

export class TvWildbound {
  constructor(party=[],seed=1){
    this.seed=seed>>>0;this.landscapeSeed=this.seed;this.time=0;this.intro=0;this.camera=0;this.progress=0;this.lastRoll=0;this.rollFlash=0;this.boardCooldown=0;this.message='Hit a board to roll. Cross the jungle in 2D.';this.won=false;this.projectiles=[];this.blockParticles=[];this.viewportWidth=VIEW_W;
    this.owners=new Map(party.map(p=>[p.id,p]));this.loot=[];this.spawnTimer=8;this.rollView=null;
    this.victoryRewards=[];this.victoryChestOpened=false;this.victoryChestArt=null;this.requestLobbyReturn=false;
    this.message='A vast woodland. Hit the central board to roll; explore either direction.';
    this.scenes=buildScenes(this.seed);
    this.players=new Map(party.map((hero,i)=>[hero.id,{id:hero.id,hero:{...hero,appearance:{...DEFAULT_APPEARANCE,...hero.appearance}},x:TV_BOARD_X-100+i*45,y:FLOOR,vx:0,vy:0,face:1,grounded:true,jumpHeld:false,attackHeld:false,dashHeld:false,dashTime:0,dashCooldown:0,dashDirection:1,attackTime:0,invulnerable:2,hp:3,step:0,checkpoint:TV_BOARD_X-100}]));
    this.camera=TV_BOARD_X-VIEW_W/2;
    this.enemies=this.scenes.flatMap(scene=>scene.enemies.map(([kind,offset],i)=>{const x=scene.start+offset;return {kind,home:x,x,y:kind==='bat'?FLOOR-115:FLOOR,face:(scene.index+i)%2?-1:1,phase:scene.index*1.7+i*.9,alive:true,hit:0,cooldown:(scene.index+i)*.08,...stats(kind)};}));
    for(let i=0;i<4;i++)this.spawnGoomba();
    this.blocks=this.scenes.flatMap(scene=>scene.blocks.map(([offset,y])=>({x:scene.start+offset,y,used:false,bump:0,scene:scene.index})));
  }
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  spawnGoomba(){if(this.enemies.filter(e=>e.alive&&e.kind==='goomba').length>=12)return;let x=80+this.random()*(TV_WILDBOUND_WIDTH-160);if([...this.players.values()].some(p=>Math.abs(p.x-x)<140))return;this.enemies.push({kind:'goomba',home:x,x,y:FLOOR,face:this.random()<.5?-1:1,phase:this.random()*10,alive:true,hit:0,cooldown:0,...stats('goomba')});}
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
    this.rollFlash=1.5;this.boardCooldown=.75;
    this.rollView={elapsed:0,dice:[this.lastRoll],total:this.lastRoll,startProgress:this.progress-this.lastRoll,tossSeed:this.random(),playerId};
    this.message=this.progress===TV_WILDBOUND_GOAL?'The final space glows. Interact at the center board to call WILDBOUND, or continue to the far gate.':`The board rolls ${this.lastRoll}. Space ${this.progress} of ${TV_WILDBOUND_GOAL}.`;
  }
  hurt(p){
    if(p.invulnerable>0)return;
    p.hp--;p.invulnerable=1.5;p.vy=-270;
    if(p.hp<=0){p.hp=3;p.x=p.checkpoint;p.y=FLOOR;p.vy=0;p.invulnerable=2;this.message=`${p.hero.name||'Explorer'} returns to the last board.`;}
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
      e.hp--;e.hit=.25;hit=true;if(e.hp<=0)e.alive=false;
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
    this.spawnTimer-=dt;if(this.spawnTimer<=0){this.spawnGoomba();this.spawnTimer=6+this.random()*8;}
    this.boardCooldown=Math.max(0,this.boardCooldown-dt);this.rollFlash=Math.max(0,this.rollFlash-dt);
    for(const p of this.players.values()){
      const input=commands[p.id]||{};
      p.menuPaused=!!input.paused||!!this.owners.get(p.id)?.ui;
      if(p.menuPaused){p.vx=0;p.attackTime=0;p.attackHeld=!!input.attack;p.jumpHeld=!!input.jump;p.dashHeld=!!input.dash;p.lootHeld=!!input.loot;continue;}
      const callWildbound=!!input.loot&&!p.lootHeld;p.lootHeld=!!input.loot;
      if(callWildbound&&this.progress>=TV_WILDBOUND_GOAL&&p.grounded&&Math.abs(p.x-TV_BOARD_X)<100){this.finish(p);break;}
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
        const board=BOARDS.find(x=>Math.abs(p.x-x)<72&&p.grounded&&(Math.abs(p.x-x)<12||Math.sign(x-p.x)===p.face));
        if(board!==undefined&&!this.boardCooldown){this.roll(p.id);p.checkpoint=board;}
        else this.attack(p);
      }
      p.attackHeld=!!input.attack;p.attackTime=Math.max(0,p.attackTime-dt);p.invulnerable=Math.max(0,p.invulnerable-dt);
      const before=p.x;p.x=clamp(p.x+p.vx*dt,18,TV_WILDBOUND_WIDTH-20);p.step+=Math.abs(p.x-before)*.14;
      const beforeY=p.y,oldHead=p.y-58;p.previousY=beforeY;p.vy=Math.min(800,p.vy+1250*dt);p.y+=p.vy*dt;p.grounded=false;
      for(const block of this.blocks)if(Math.abs(p.x-block.x)<29){
        if(p.vy<0&&oldHead>=block.y+32&&p.y-58<=block.y+32){
          p.y=block.y+32+58;block.bump=.25;p.vy=80;
          if(!block.used){block.used=true;this.loot.push({x:block.x,y:block.y-18,vy:-145,age:0,type:'unknown_mushroom'});this.blockParticles.push(...blockBreakParticles(block.x,block.y,()=>this.random()));if(this.blockParticles.length>128)this.blockParticles.splice(0,this.blockParticles.length-128);this.message='A strange purple mushroom! Collect it — its purpose is unknown.';}
        }else if(p.vy>=0&&beforeY<=block.y&&p.y>=block.y){p.y=block.y;p.vy=0;p.grounded=true;}
      }
      if(p.y>=FLOOR){p.y=FLOOR;p.vy=0;p.grounded=true;}
      if(p.x>=TV_WILDBOUND_WIDTH-95){if(this.progress>=TV_WILDBOUND_GOAL){this.finish();break;}else{p.x=TV_WILDBOUND_WIDTH-96;this.message='The gate needs all 48 board spaces. Hit the central board to roll.';}}
    }
    if(this.won)return; // Victory is safe: no final-frame enemy damage or loot loss.
    for(const e of this.enemies)if(e.alive){
      e.hit=Math.max(0,e.hit-dt);
      e.cooldown=Math.max(0,e.cooldown-dt);
      const target=[...this.players.values()].filter(p=>!p.menuPaused).sort((a,b)=>Math.abs(a.x-e.x)-Math.abs(b.x-e.x))[0];
      if(e.kind==='bat'){
        e.x=e.home+Math.sin(this.time*1.9+e.phase)*55;
        e.y=FLOOR-75+Math.sin(this.time*3.4+e.phase)*55;
        e.face=Math.cos(this.time*1.9+e.phase)>0?1:-1;
      }else{
        const hunting=target&&['lion','tiger'].includes(e.kind)&&Math.abs(target.x-e.x)<210;
        if(hunting)e.face=Math.sign(target.x-e.x)||e.face;
        e.x+=e.face*e.speed*(hunting?1.45:1)*dt;
        if(hunting)e.x=clamp(e.x,e.home-150,e.home+150);
        else if(Math.abs(e.x-e.home)>65)e.face*=-1;
        if(e.kind==='archer'&&target&&Math.abs(target.x-e.x)<310&&Math.abs(target.y-e.y)<70&&!e.cooldown){
          e.face=Math.sign(target.x-e.x)||e.face;e.cooldown=2.1;
          this.projectiles.push({x:e.x+e.face*16,y:e.y-27,vx:e.face*240,life:2});
        }
      }
      for(const p of this.players.values())if(!p.menuPaused){
        const horizontallyOver=(p.x+10>e.x-e.w/2&&p.x-10<e.x+e.w/2),enemyTop=e.y-e.h;
        const stomping=horizontallyOver&&p.vy>0&&p.previousY<=enemyTop+8&&p.y>=enemyTop-2;
        if(stomping){
          e.hp=0;e.alive=false;p.y=enemyTop;p.vy=-330;p.grounded=false;this.message=`${p.hero.name||'Explorer'} stomped the ${e.kind.replaceAll('_',' ')}!`;break;
        }else if(horizontallyOver&&Math.abs(p.y-e.y)<e.h/2+23)this.hurt(p);
      }
    }
    for(const shot of this.projectiles){
      shot.x+=shot.vx*dt;shot.y+=(shot.vy||0)*dt;shot.life-=dt;
      if(shot.friendly){
        for(const e of this.enemies)if(e.alive&&shot.life>0&&Math.abs(e.x-shot.x)<e.w/2+8&&shot.y>=e.y-e.h-7&&shot.y<=e.y+5){e.hp-=shot.damage||1;e.hit=.25;if(e.hp<=0)e.alive=false;shot.life=0;break;}
      }else for(const p of this.players.values())if(!p.menuPaused&&shot.life>0&&Math.abs(p.x-shot.x)<17&&Math.abs(p.y-24-shot.y)<25){this.hurt(p);shot.life=0;}
    }
    const viewExtra=(this.viewportWidth-VIEW_W)/2;
    this.projectiles=this.projectiles.filter(shot=>shot.life>0&&shot.x>this.camera-viewExtra-100&&shot.x<this.camera+VIEW_W+viewExtra+100);
    for(const b of this.blocks)b.bump=Math.max(0,b.bump-dt);
    for(const item of this.loot){item.age+=dt;item.vy+=800*dt;item.y=Math.min(FLOOR-10,item.y+item.vy*dt);for(const p of this.players.values())if(!p.menuPaused&&(!item.manualPickup||commands[p.id]?.loot)&&!item.collected&&item.age>.5&&Math.abs(item.x-p.x)<30&&Math.abs(item.y-(p.y-20))<45){const owner=this.owners.get(p.id);if(owner?.inventory&&give(owner.inventory,item.type,item.qty||1,24,item)){item.collected=true;this.onLoot?.(owner);this.message=item.type==='unknown_mushroom'?'Strange mushroom collected · purple quality · unknown use.':'Item picked up.';}else this.message='Backpack full. The item will wait here.';}}
    this.loot=this.loot.filter(item=>!item.collected);
    const active=[...this.players.values()];
    if(active.length){const lead=Math.max(...active.map(p=>p.x)),tail=Math.min(...active.map(p=>p.x)),extra=(this.viewportWidth-VIEW_W)/2;this.camera=clamp(Math.min(lead-350,tail-60),extra,TV_WILDBOUND_WIDTH-VIEW_W-extra);for(const p of active)if(!p.menuPaused)p.x=clamp(p.x,this.camera-extra+20,this.camera+VIEW_W+extra-24);}
  }
  draw(c,width,height,animator){
    c.save();c.fillStyle='#101d23';c.fillRect(0,0,width,height);
    const scale=Math.min(width/VIEW_W,height/VIEW_H);c.translate((width-VIEW_W*scale)/2,(height-VIEW_H*scale)/2);c.scale(scale,scale);
    const viewWidth=width/scale,viewLeft=-(viewWidth-VIEW_W)/2,left=this.camera+viewLeft,right=left+viewWidth;
    this.viewportWidth=Math.min(TV_WILDBOUND_WIDTH,viewWidth);
    c.beginPath();c.rect(viewLeft,0,viewWidth,VIEW_H);c.clip();
    this.drawLandscape(c,viewLeft,viewWidth);
    c.save();c.translate(-this.camera,0);
    // A long, visible board path spans the entire panoramic level.
    c.fillStyle='#253f37';c.fillRect(left,431,viewWidth,109);
    const first=Math.max(0,Math.floor(left/150)-1),last=Math.min(31,Math.ceil(right/150));
    for(let i=first;i<=last;i++){const x=36+i*150;c.fillStyle='#344834';c.fillRect(x,445,132,18);c.fillStyle='#3e4d36';for(let n=0;n<12;n++){c.fillRect(x+n*11,460+(n*17+i*7)%35,5,3);c.fillStyle=n%2?'#516144':'#374d36';}c.fillStyle='#617a48';c.fillRect(x+18,434,11,3);c.fillRect(x+55,433,6,2);}
    c.fillStyle='#447c48';c.fillRect(left,425,viewWidth,15);c.fillStyle='#86ad67';c.fillRect(left,422,viewWidth,5);
    for(const block of this.blocks)if(block.x>left-40&&block.x<right+40)drawQuestionBlock(c,block,this.time);
    drawBlockParticles(c,this.blockParticles,left,right);
    for(const item of this.loot)if(item.x>left-40&&item.x<right+40){drawItem(c,item.type,item.x,item.y,32);c.fillStyle='#c58bfa';c.font='10px system-ui';c.textAlign='center';c.fillText(item.type==='unknown_mushroom'?'Strange mushroom':'Interact to pick up',item.x,item.y-22);}
    for(const x of BOARDS)if(x>left-110&&x<right+110)this.drawBoard(c,x);
    for(const e of this.enemies)if(e.alive&&e.x>left-100&&e.x<right+100){
      if(e.kind==='goomba')this.drawGoomba(c,e);
      else animator.draw(c,{kind:e.kind,sprite:e.kind,x:e.x,y:e.y,faceX:e.face,faceY:0,moving:true,step:this.time*e.speed*.14,hit:e.hit,aggro:true,attack:0},this.time,e.kind==='bat'?58:['lion','tiger'].includes(e.kind)?75:62);
    }
    for(const shot of this.projectiles){
      if(shot.kind==='magic'){c.save();c.shadowColor=shot.color;c.shadowBlur=12;c.fillStyle=shot.color;c.beginPath();c.arc(shot.x,shot.y,7,0,Math.PI*2);c.fill();c.restore();}
      else{c.save();c.translate(shot.x,shot.y);c.rotate(shot.vx<0?Math.PI:0);c.fillStyle=shot.color||'#e9d6a0';c.fillRect(-10,-1,19,3);c.beginPath();c.moveTo(10,-4);c.lineTo(16,0);c.lineTo(10,4);c.fill();c.fillStyle='#6f4933';c.fillRect(-10,-3,3,7);c.restore();}
    }
    for(const p of this.players.values()){
      c.save();c.globalAlpha=(p.invulnerable>0&&Math.floor(this.time*12)%2)?0.55:1;
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
    c.fillStyle='#102c2ce8';c.fillRect(viewLeft,0,viewWidth,56);c.fillStyle='#f5e8c0';c.textAlign='left';c.font='bold 24px Georgia';c.fillText('WILDBOUND · TV WORLD',viewLeft+22,34);c.textAlign='center';c.fillStyle='#d3c694';c.font='10px system-ui';c.fillText(this.sceneAt(this.camera+VIEW_W/2).name.toUpperCase(),viewLeft+VIEW_W/2,49);c.textAlign='left';c.fillStyle='#f5e8c0';c.font='bold 17px system-ui';c.fillText(`BOARD ${this.progress}/${TV_WILDBOUND_GOAL}`,viewLeft+viewWidth-180,34);
    c.fillStyle='#102c2ce8';c.fillRect(viewLeft,510,viewWidth,30);c.fillStyle='#e5d5a9';c.font='15px system-ui';c.fillText(this.message,viewLeft+20,530);
    if(this.rollFlash>0){c.fillStyle='#f4dc96';c.textAlign='center';c.font='bold 55px Georgia';c.fillText(`+${this.lastRoll}`,VIEW_W/2,153);}
    if(!this.ready)this.drawIntro(c,viewLeft,viewWidth);
    if(this.rollView){c.fillStyle='#081913ef';c.fillRect(viewLeft,0,viewWidth,VIEW_H);c.save();c.translate(VIEW_W/2,VIEW_H/2);c.scale(2.6,2.6);const players=[...this.players.values()].map(p=>({...p.hero,boardProgress:this.progress}));drawBoard(c,{players,roll:this.rollView,current:this.rollView.playerId},this.rollView.elapsed,{drawDie});c.restore();c.fillStyle='#f6e4b3';c.textAlign='center';c.font='18px Georgia';c.fillText('THE LIVING BOARD',VIEW_W/2,65);}
    if(this.won){c.fillStyle='#092522e8';c.fillRect(120,165,720,172);c.strokeStyle='#d4b46b';c.lineWidth=3;c.strokeRect(120,165,720,172);c.fillStyle='#f6e5b4';c.textAlign='center';c.font='bold 34px Georgia';c.fillText('THE BOARD IS SEALED',480,218);c.font='20px system-ui';c.fillText(this.victoryRewards.some(Boolean)?'Your party earned a treasure chest!':'Treasure collected · well played!',480,264);c.font='17px system-ui';c.fillText(this.victoryRewards.some(Boolean)?'E / top face: open treasure · I / Back: manage backpack':'E / top face: return to the lobby',480,307);}
    c.restore();
  }
  drawLandscape(c,left=0,width=VIEW_W){
    c.imageSmoothingEnabled=false;
    c.fillStyle='#8cafaa';c.fillRect(left,0,width,VIEW_H);
    for(let y=70;y<425;y+=16){c.fillStyle=y<180?'#95bcb1':y<260?'#86aba0':'#78998a';c.fillRect(left,y,width,16);}
    c.fillStyle='#dacb8d';c.fillRect(733,90,54,6);c.fillRect(722,96,76,42);c.fillRect(732,138,56,8);
    this.landscapeLayers ||= [0,1,2].map(layer=>{
      const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=440;const ctx=canvas.getContext('2d');
      const count=layer===2?6:12,spacing=1200/count;
      for(let i=0;i<count;i++){const x=i*spacing+((i*37+this.landscapeSeed)%45),size=layer===0?115:layer===1?180:230,base=layer===0?350:layer===1?400:420;
        // Wrap every silhouette across both tile edges before caching the layer.
        for(const shift of [-1200,0,1200]){
          drawForestTree(ctx,{kind:'tree',procedural:true,x:x+shift,y:base-size*.35,size,seed:this.landscapeSeed+i*31+layer*97,treeType:i%3===0?'pine':i%3===1?'birch':'oak'},0,{});
          if(layer===2)drawBush(ctx,{x:x+shift+40,y:402,size:70},0);
        }
      }
      if(layer<2){ctx.globalCompositeOperation='source-atop';ctx.fillStyle=layer===0?'#9db7aaa8':'#719b8688';ctx.fillRect(0,0,1200,440);}return canvas;
    });
    for(let layer=0;layer<3;layer++){const scroll=Math.floor(this.camera*[.12,.32,.65][layer]);for(let tile=Math.floor((left+scroll)/1200);tile<Math.ceil((left+width+scroll)/1200);tile++)c.drawImage(this.landscapeLayers[layer],tile*1200-scroll,0);}
    for(const scene of this.scenes){
      const x=left+scene.start-this.camera;if(x>left+width||x+TV_WILDBOUND_SCENE_WIDTH<left)continue;
      c.save();c.globalAlpha=.1;c.fillStyle=scene.tint;c.fillRect(x,70,TV_WILDBOUND_SCENE_WIDTH,350);c.restore();
      for(const [offset,size] of scene.bushes)drawBush(c,{x:x+offset,y:420,size},this.time);
    }
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
    c.textAlign='center';c.fillStyle='#f2d784';c.font='bold 45px Georgia';c.fillText('JUMANJI',0,-25);
    c.fillStyle='#fff2cf';c.font='bold 18px system-ui';c.fillText('WARNING: THE GAME IS REAL',0,23);
    c.font='15px system-ui';c.fillText('PLAYERS ARE BEING PULLED',0,53);c.fillText('INTO THE TV',0,75);
    c.restore();
    c.restore();
  }
  drawBoard(c,x){
    c.fillStyle='#382923';c.fillRect(x-72,372,12,54);c.fillRect(x+60,372,12,54);
    c.fillStyle='#90643f';c.fillRect(x-88,352,176,28);c.fillStyle='#d3b06e';c.fillRect(x-83,347,166,24);
    c.strokeStyle='#54422f';c.lineWidth=3;c.strokeRect(x-83,347,166,24);
    c.save();c.translate(x,358);c.scale(.59,.12);drawBoard(c,{players:[...this.players.values()].map(p=>({...p.hero,boardProgress:this.progress}))},this.time);c.restore();
    c.fillStyle='#fbecd0';c.font='bold 13px Georgia';c.textAlign='center';c.fillText(this.progress>=TV_WILDBOUND_GOAL?'INTERACT: CALL WILDBOUND':'HIT TO ROLL',x,338);
    c.fillStyle='#354f43';c.fillRect(x-16,366,32,24);c.fillStyle='#eed9a6';c.fillText('✦',x,384);
  }
  drawGoomba(c,e){
    const x=e.x,y=e.y,bob=Math.floor(this.time*7)%2;c.fillStyle='#4b2f28';c.fillRect(x-13,y-3,10,5);c.fillRect(x+3,y-3+bob,10,5);c.fillStyle='#ad7143';c.fillRect(x-14,y-22,28,18);c.fillRect(x-9,y-27,18,7);c.fillStyle='#f6e4b8';c.fillRect(x-9,y-18,7,8);c.fillRect(x+2,y-18,7,8);c.fillStyle='#252726';c.fillRect(x-5,y-16,2,4);c.fillRect(x+5,y-16,2,4);
  }
}
