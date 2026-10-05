// A self-contained, side-view Wildbound expedition reached through the lobby TV.
// Board progress/physics stay isolated; collected items go to the owning hero.
import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {drawForestTree,drawBush} from './forest.mjs';
import {drawBoard} from './board.mjs';
import {drawDie} from './render.mjs';
import {drawItem} from './item-art.mjs';
import {give} from './items.mjs';
export const TV_WILDBOUND_WIDTH=4800;
export const TV_WILDBOUND_GOAL=48;
const VIEW_W=960,VIEW_H=540,FLOOR=437;
export const TV_BOARD_X=TV_WILDBOUND_WIDTH/2;
const BOARDS=[TV_BOARD_X];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const ENEMY_LAYOUT=[
  ['goomba',520],['skeleton',760],['bat',975],['lion',1130],
  ['goomba',1430],['archer',1730],['tiger',1900],['bat',2170],
  ['skeleton_unarmed',2600],['lion',2780],['goomba',3040],['bat',3290],
  ['archer',3520],['tiger',3830],['skeleton',4120],['goomba',4380],
];
const stats=kind=>kind==='goomba'?{w:28,h:25,speed:38,hp:1}:kind==='bat'?{w:48,h:36,speed:78,hp:1}:['lion','tiger'].includes(kind)?{w:68,h:42,speed:85,hp:2}:{w:37,h:52,speed:52,hp:2};

export class TvWildbound {
  constructor(party=[],seed=1){
    this.seed=seed>>>0;this.time=0;this.intro=0;this.camera=0;this.progress=0;this.lastRoll=0;this.rollFlash=0;this.boardCooldown=0;this.message='Hit a board to roll. Cross the jungle in 2D.';this.won=false;this.projectiles=[];
    this.owners=new Map(party.map(p=>[p.id,p]));this.loot=[];this.spawnTimer=8;this.rollView=null;
    this.message='A vast woodland. Hit the central board to roll; explore either direction.';
    this.players=new Map(party.map((hero,i)=>[hero.id,{id:hero.id,hero:{...hero,appearance:{...DEFAULT_APPEARANCE,...hero.appearance}},x:TV_BOARD_X-100+i*45,y:FLOOR,vx:0,vy:0,face:1,grounded:true,jumpHeld:false,attackHeld:false,attackTime:0,invulnerable:2,hp:3,step:0,checkpoint:TV_BOARD_X-100}]));
    this.camera=TV_BOARD_X-VIEW_W/2;
    this.enemies=ENEMY_LAYOUT.filter(([kind])=>kind!=='goomba').map(([kind,x],i)=>({kind,home:x,x,y:kind==='bat'?FLOOR-115:FLOOR,face:i%2?-1:1,phase:i*1.7,alive:true,hit:0,cooldown:i*.15,...stats(kind)}));
    for(let i=0;i<8;i++)this.spawnGoomba();
    this.blocks=Array.from({length:20},(_,i)=>({x:180+i*225,y:330,used:false,bump:0}));
  }
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  spawnGoomba(){if(this.enemies.filter(e=>e.alive&&e.kind==='goomba').length>=12)return;let x=80+this.random()*(TV_WILDBOUND_WIDTH-160);if([...this.players.values()].some(p=>Math.abs(p.x-x)<140))return;this.enemies.push({kind:'goomba',home:x,x,y:FLOOR,face:this.random()<.5?-1:1,phase:this.random()*10,alive:true,hit:0,cooldown:0,...stats('goomba')});}
  get ready(){return this.intro>=2.8;}
  roll(){
    this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;
    this.lastRoll=1+this.seed%6;this.progress=Math.min(TV_WILDBOUND_GOAL,this.progress+this.lastRoll);
    this.rollFlash=1.5;this.boardCooldown=.75;
    this.rollView={elapsed:0,dice:[this.lastRoll],total:this.lastRoll,startProgress:this.progress-this.lastRoll,tossSeed:this.random(),playerId:[...this.players.keys()][0]};
    this.message=this.progress===TV_WILDBOUND_GOAL?'The final space glows. Reach the far gate!':`The board rolls ${this.lastRoll}. Space ${this.progress} of ${TV_WILDBOUND_GOAL}.`;
  }
  hurt(p){
    if(p.invulnerable>0)return;
    p.hp--;p.invulnerable=1.5;p.vy=-270;
    if(p.hp<=0){p.hp=3;p.x=p.checkpoint;p.y=FLOOR;p.vy=0;p.invulnerable=2;this.message=`${p.hero.name||'Explorer'} returns to the last board.`;}
  }
  step(dt,commands={}){
    dt=clamp(dt,0,.05);this.time+=dt;
    if(!this.ready){this.intro=Math.min(2.8,this.intro+dt);return;}
    if(this.won)return;
    if(this.rollView){this.rollView.elapsed+=dt;if(this.rollView.elapsed>=3.5)this.rollView=null;return;}
    this.spawnTimer-=dt;if(this.spawnTimer<=0){this.spawnGoomba();this.spawnTimer=6+this.random()*8;}
    this.boardCooldown=Math.max(0,this.boardCooldown-dt);this.rollFlash=Math.max(0,this.rollFlash-dt);
    for(const p of this.players.values()){
      const input=commands[p.id]||{};
      const direction=(input.right?1:0)-(input.left?1:0);
      p.vx=direction*(input.run?220:170);
      if(direction)p.face=direction;
      if(input.jump&&!p.jumpHeld&&p.grounded){p.vy=-520;p.grounded=false;}
      p.jumpHeld=!!input.jump;
      if(input.attack&&!p.attackHeld){
        p.attackTime=.28;
        const board=BOARDS.find(x=>Math.abs(p.x-x)<92&&Math.abs(p.y-FLOOR)<74);
        if(board!==undefined&&!this.boardCooldown){this.roll();p.checkpoint=board;}
        else for(const e of this.enemies)if(e.alive&&Math.abs(e.x-p.x)<85&&Math.abs(e.y-p.y)<80&&Math.sign(e.x-p.x)===p.face){e.hp--;e.hit=.25;if(e.hp<=0)e.alive=false;}
      }
      p.attackHeld=!!input.attack;p.attackTime=Math.max(0,p.attackTime-dt);p.invulnerable=Math.max(0,p.invulnerable-dt);
      const before=p.x;p.x=clamp(p.x+p.vx*dt,18,TV_WILDBOUND_WIDTH-20);p.step+=Math.abs(p.x-before)*.14;
      const oldHead=p.y-58;p.vy=Math.min(800,p.vy+1250*dt);p.y+=p.vy*dt;
      for(const block of this.blocks)if(!block.used&&p.vy<0&&Math.abs(p.x-block.x)<29&&oldHead>=block.y+28&&p.y-58<=block.y+28){block.used=true;block.bump=.25;p.vy=80;this.loot.push({x:block.x,y:block.y-18,vy:-145,age:0,type:'unknown_mushroom'});this.message='A strange purple mushroom! Collect it — its purpose is unknown.';}
      if(p.y>=FLOOR){p.y=FLOOR;p.vy=0;p.grounded=true;}
      if(p.x>=TV_WILDBOUND_WIDTH-95){if(this.progress>=TV_WILDBOUND_GOAL){this.won=true;this.message='The 2D board is sealed. The party survived!';}else{p.x=TV_WILDBOUND_WIDTH-96;this.message='The gate needs all 30 board spaces. Hit a board to roll.';}}
    }
    for(const e of this.enemies)if(e.alive){
      e.hit=Math.max(0,e.hit-dt);
      e.cooldown=Math.max(0,e.cooldown-dt);
      const target=[...this.players.values()].sort((a,b)=>Math.abs(a.x-e.x)-Math.abs(b.x-e.x))[0];
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
      for(const p of this.players.values())if(Math.abs(p.x-e.x)<(e.w+28)/2&&Math.abs(p.y-e.y)<e.h/2+23){
        if(e.kind==='goomba'&&p.vy>50&&p.y<e.y-9){e.alive=false;p.vy=-320;p.grounded=false;this.message='Goomba stomp!';}
        else this.hurt(p);
      }
    }
    for(const shot of this.projectiles){
      shot.x+=shot.vx*dt;shot.life-=dt;
      for(const p of this.players.values())if(shot.life>0&&Math.abs(p.x-shot.x)<17&&Math.abs(p.y-24-shot.y)<25){this.hurt(p);shot.life=0;}
    }
    this.projectiles=this.projectiles.filter(shot=>shot.life>0&&shot.x>this.camera-100&&shot.x<this.camera+VIEW_W+100);
    for(const b of this.blocks)b.bump=Math.max(0,b.bump-dt);
    for(const item of this.loot){item.age+=dt;item.vy+=800*dt;item.y=Math.min(FLOOR-10,item.y+item.vy*dt);for(const p of this.players.values())if(!item.collected&&item.age>.5&&Math.abs(item.x-p.x)<30&&Math.abs(item.y-(p.y-20))<45){const owner=this.owners.get(p.id);if(owner?.inventory&&give(owner.inventory,item.type)){item.collected=true;this.onLoot?.(owner);this.message='Strange mushroom collected · purple quality · unknown use.';}else this.message='Backpack full. The mushroom will wait here.';}}
    this.loot=this.loot.filter(item=>!item.collected);
    const active=[...this.players.values()];
    if(active.length){const lead=Math.max(...active.map(p=>p.x)),tail=Math.min(...active.map(p=>p.x));this.camera=clamp(Math.min(lead-350,tail-60),0,TV_WILDBOUND_WIDTH-VIEW_W);for(const p of active)p.x=clamp(p.x,this.camera+20,this.camera+VIEW_W-24);}
  }
  draw(c,width,height,animator){
    c.save();c.fillStyle='#101d23';c.fillRect(0,0,width,height);
    const scale=Math.min(width/VIEW_W,height/VIEW_H);c.translate((width-VIEW_W*scale)/2,(height-VIEW_H*scale)/2);c.scale(scale,scale);
    this.drawLandscape(c);
    c.save();c.translate(-this.camera,0);
    // A long, visible board path spans the entire panoramic level.
    c.fillStyle='#253f37';c.fillRect(this.camera,431,VIEW_W,109);
    const first=Math.max(0,Math.floor(this.camera/150)-1),last=Math.min(31,Math.ceil((this.camera+VIEW_W)/150));
    for(let i=first;i<=last;i++){const x=36+i*150;c.fillStyle='#344834';c.fillRect(x,445,132,18);c.fillStyle='#3e4d36';for(let n=0;n<12;n++){c.fillRect(x+n*11,460+(n*17+i*7)%35,5,3);c.fillStyle=n%2?'#516144':'#374d36';}c.fillStyle='#617a48';c.fillRect(x+18,434,11,3);c.fillRect(x+55,433,6,2);}
    c.fillStyle='#447c48';c.fillRect(this.camera,425,VIEW_W,15);c.fillStyle='#86ad67';c.fillRect(this.camera,422,VIEW_W,5);
    for(const block of this.blocks)if(block.x>this.camera-40&&block.x<this.camera+VIEW_W+40){const y=block.y-Math.sin(block.bump/.25*Math.PI)*5;c.fillStyle=block.used?'#5b5142':'#b18a43';c.fillRect(block.x-16,y,32,28);c.fillStyle=block.used?'#74664f':'#e8ca72';c.fillRect(block.x-14,y+2,28,23);c.fillStyle='#59452c';c.fillRect(block.x-12,y+23,24,3);c.font='bold 22px monospace';c.textAlign='center';c.fillText(block.used?'·':'?',block.x,y+22);}
    for(const item of this.loot)if(item.x>this.camera-40&&item.x<this.camera+VIEW_W+40){drawItem(c,item.type,item.x,item.y,32);c.fillStyle='#c58bfa';c.font='10px system-ui';c.textAlign='center';c.fillText('Strange mushroom',item.x,item.y-22);}
    for(const x of BOARDS)if(x>this.camera-110&&x<this.camera+VIEW_W+110)this.drawBoard(c,x);
    for(const e of this.enemies)if(e.alive&&e.x>this.camera-100&&e.x<this.camera+VIEW_W+100){
      if(e.kind==='goomba')this.drawGoomba(c,e);
      else animator.draw(c,{kind:e.kind,sprite:e.kind,x:e.x,y:e.y,faceX:e.face,faceY:0,moving:true,step:this.time*e.speed*.14,hit:e.hit,aggro:true,attack:0},this.time,e.kind==='bat'?58:['lion','tiger'].includes(e.kind)?75:62);
    }
    for(const shot of this.projectiles){c.fillStyle='#e9d6a0';c.fillRect(shot.x-7,shot.y-2,14,3);c.fillStyle='#6f4933';c.fillRect(shot.x+(shot.vx>0?7:-9),shot.y-4,3,7);}
    for(const p of this.players.values()){
      c.save();c.globalAlpha=(p.invulnerable>0&&Math.floor(this.time*12)%2)?0.55:1;
      animator.draw(c,{...p.hero,kind:'player',x:p.x,y:p.y,faceX:p.face,faceY:0,moving:Math.abs(p.vx)>1,step:p.step,attack:p.attackTime,animationAction:p.attackTime>0?'slash':undefined},this.time,71);
      c.fillStyle='#fff3d1';c.textAlign='center';c.font='bold 13px system-ui';c.fillText(p.hero.name||'Explorer',p.x,p.y-67);
      for(let i=0;i<p.hp;i++){c.fillStyle='#e05e62';c.fillText('♥',p.x-16+i*16,p.y-81);}
      c.restore();
    }
    c.fillStyle=this.progress>=TV_WILDBOUND_GOAL?'#e6c66f':'#557e75';c.fillRect(TV_WILDBOUND_WIDTH-98,285,16,138);c.fillRect(TV_WILDBOUND_WIDTH-160,282,95,16);c.fillRect(TV_WILDBOUND_WIDTH-160,282,16,141);
    c.fillStyle='#f9e7b5';c.font='bold 15px Georgia';c.fillText('EXIT',TV_WILDBOUND_WIDTH-111,269);
    c.restore();
    c.fillStyle='#102c2ce8';c.fillRect(0,0,VIEW_W,56);c.fillStyle='#f5e8c0';c.textAlign='left';c.font='bold 24px Georgia';c.fillText('WILDBOUND · TV WORLD',22,34);c.font='bold 17px system-ui';c.fillText(`BOARD ${this.progress}/${TV_WILDBOUND_GOAL}`,700,34);
    c.fillStyle='#102c2ce8';c.fillRect(0,510,VIEW_W,30);c.fillStyle='#e5d5a9';c.font='15px system-ui';c.fillText(this.message,20,530);
    if(this.rollFlash>0){c.fillStyle='#f4dc96';c.textAlign='center';c.font='bold 55px Georgia';c.fillText(`+${this.lastRoll}`,VIEW_W/2,153);}
    if(!this.ready)this.drawIntro(c);
    if(this.rollView){c.fillStyle='#081913ef';c.fillRect(0,0,VIEW_W,VIEW_H);c.save();c.translate(VIEW_W/2,VIEW_H/2);c.scale(2.6,2.6);const players=[...this.players.values()].map(p=>({...p.hero,boardProgress:this.progress}));drawBoard(c,{players,roll:this.rollView,current:players[0]?.id},this.rollView.elapsed,{drawDie});c.restore();c.fillStyle='#f6e4b3';c.textAlign='center';c.font='18px Georgia';c.fillText('THE LIVING BOARD',VIEW_W/2,65);}
    if(this.won){c.fillStyle='#092522d9';c.fillRect(120,165,720,196);c.strokeStyle='#d4b46b';c.lineWidth=4;c.strokeRect(120,165,720,196);c.fillStyle='#f6e5b4';c.textAlign='center';c.font='bold 38px Georgia';c.fillText('THE BOARD IS SEALED',480,232);c.font='20px system-ui';c.fillText('You survived the 2D Wildbound world.',480,276);c.fillText('Press E / interact to return to the lobby.',480,315);}
    c.restore();
  }
  drawLandscape(c){
    c.imageSmoothingEnabled=false;
    c.fillStyle='#8cafaa';c.fillRect(0,0,VIEW_W,VIEW_H);
    for(let y=70;y<425;y+=16){c.fillStyle=y<180?'#95bcb1':y<260?'#86aba0':'#78998a';c.fillRect(0,y,VIEW_W,16);}
    c.fillStyle='#dacb8d';c.fillRect(733,90,54,6);c.fillRect(722,96,76,42);c.fillRect(732,138,56,8);
    this.landscapeLayers ||= [0,1,2].map(layer=>{
      const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=440;const ctx=canvas.getContext('2d');
      const count=layer===2?6:12,spacing=1200/count;
      for(let i=0;i<count;i++){const x=i*spacing+((i*37+this.seed)%45),size=layer===0?115:layer===1?180:230,base=layer===0?350:layer===1?400:420;
        drawForestTree(ctx,{kind:'tree',procedural:true,x,y:base-size*.35,size,seed:this.seed+i*31+layer*97,treeType:i%3===0?'pine':i%3===1?'birch':'oak'},0,{});
        if(layer===2)drawBush(ctx,{x:x+40,y:402,size:70},0);
      }
      if(layer<2){ctx.globalCompositeOperation='source-atop';ctx.fillStyle=layer===0?'#9db7aaa8':'#719b8688';ctx.fillRect(0,0,1200,440);}return canvas;
    });
    for(let layer=0;layer<3;layer++){const scroll=Math.floor(this.camera*[.12,.32,.65][layer]),offset=scroll%1200;c.drawImage(this.landscapeLayers[layer],-offset,0);c.drawImage(this.landscapeLayers[layer],1200-offset,0);}
  }
  drawIntro(c){
    const t=this.intro,fade=t<.5?1:clamp((2.8-t)/1.2,0,1);
    c.fillStyle=`rgba(4,13,15,${.93*fade})`;c.fillRect(0,0,VIEW_W,VIEW_H);
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
    c.fillStyle='#fbecd0';c.font='bold 14px Georgia';c.textAlign='center';c.fillText('HIT TO ROLL',x,338);
    c.fillStyle='#354f43';c.fillRect(x-16,366,32,24);c.fillStyle='#eed9a6';c.fillText('✦',x,384);
  }
  drawGoomba(c,e){
    const x=e.x,y=e.y,bob=Math.floor(this.time*7)%2;c.fillStyle='#4b2f28';c.fillRect(x-13,y-3,10,5);c.fillRect(x+3,y-3+bob,10,5);c.fillStyle='#ad7143';c.fillRect(x-14,y-22,28,18);c.fillRect(x-9,y-27,18,7);c.fillStyle='#f6e4b8';c.fillRect(x-9,y-18,7,8);c.fillRect(x+2,y-18,7,8);c.fillStyle='#252726';c.fillRect(x-5,y-16,2,4);c.fillRect(x+5,y-16,2,4);
  }
}
