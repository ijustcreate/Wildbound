// A tiny, self-contained platform game rendered into the lobby's television.
// World coordinates are pixels; terrain is generated from a repeatable sequence.
import {TV_SCENES,TV_CAVERN_SCENES,TV_SECTION_TILES,TV_SCENES_PER_LEVEL,tvSceneIndex} from './lobby-tv-levels.mjs';
import {drawLobbyController} from './lobby-controller-art.mjs';
import {drawControllerCable} from './lobby-controller-cable.mjs';
import {lobbyControllerGrip} from './lobby-scene.mjs';
import {LOBBY_TV} from './lobby-geometry.mjs';
const W=256,H=144,GROUND=120,TILE=16;
const COURSE_END=TV_SCENES_PER_LEVEL*TV_SECTION_TILES*TILE;
const FLAG_X=COURSE_END+17*TILE,CASTLE_X=COURSE_END+23*TILE;
const palette=['#e84a45','#4ac66c'];
const FIREBALL_SPEED=155,DASH_SPEED=238,DASH_DURATION=.16,DASH_COOLDOWN=1.8;
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function cavernBricks(g,x,y,w,h){
 g.fillStyle='#062e39';g.fillRect(x,y,w,h);
 for(let row=0;row<h;row+=8)for(let col=-8;col<w;col+=16){const xx=x+col+(row%16?8:0),left=Math.max(x,xx),right=Math.min(x+w,xx+15);if(right<=left)continue;g.fillStyle='#167e8d';g.fillRect(left,y+row,right-left,Math.min(7,h-row));g.fillStyle='#71c4cb';g.fillRect(left,y+row,right-left,1);g.fillStyle='#329daa';g.fillRect(left,y+row,1,Math.min(6,h-row));g.fillStyle='#0b5365';g.fillRect(left,y+row+6,right-left,1);}
}
function drawTvTurtle(g,x,y,stride=0,shellOnly=false){
  g.fillStyle='#182d38';g.fillRect(x+1,y+3,12,8);
  if(shellOnly){g.fillStyle='#d3aa47';g.fillRect(x+1,y+2,12,7);g.fillStyle='#155b43';g.fillRect(x+2,y+1,10,6);g.fillStyle='#42c66c';g.fillRect(x+3,y+2,6,2);g.fillStyle='#d9eb91';g.fillRect(x+6,y+3,2,3);g.fillStyle='#9f7045';g.fillRect(x+2+stride,y+8,4,2);g.fillRect(x+9-stride,y+8,4,2);return;}
  g.fillStyle='#9b4938';g.fillRect(x-1-stride,y+9,5,3);g.fillRect(x+9+stride,y+9,5,3);
  g.fillStyle='#d4ae50';g.fillRect(x+1,y+3,10,8);g.fillStyle='#16533f';g.fillRect(x+2,y+2,9,7);g.fillStyle='#36b45b';g.fillRect(x+3,y+3,6,2);g.fillStyle='#c7e574';g.fillRect(x+5,y+4,3,3);g.fillStyle='#e8ce65';g.fillRect(x+8,y+5,5,4);g.fillStyle='#fff2cf';g.fillRect(x+10,y+5,2,2);g.fillStyle='#25343d';g.fillRect(x+11,y+6,1,2);g.fillStyle='#ec694a';g.fillRect(x+12,y+8,2,1);
}

export class LobbyTelevision {
  constructor(seed=Math.floor(Math.random()*0xffffffff)){this.seed=seed;this.players=new Map();this.enemies=new Map();this.fireballs=[];this.powerups=new Map();this.broken=new Set();this.released=new Set();this.particles=[];this.camera=0;this.time=0;this.started=false;this.completed=false;this.score=0;this.coins=0;this.collected=new Set();this.area='overworld';this.level=1;this.flagged=new Set();this.finishTimer=0;this.stageNotice=0;this.pipeCooldown=0;this.screen=null;this.controllers=[{x:721,y:225,owner:null},{x:849,y:225,owner:null}];}
  scene(section){const key=this.level+':'+this.seed;if(this.sceneCacheKey!==key){this.sceneCacheKey=key;this.sceneCache=new Map();}if(!this.sceneCache.has(section))this.sceneCache.set(section,(this.level===1?TV_SCENES:TV_CAVERN_SCENES)[tvSceneIndex(section,this.seed)]);return this.sceneCache.get(section);}
  join(id,requestedSlot){
    if(this.players.has(id))return true;
    if(this.players.size>=2)return false;
    const slot=requestedSlot===0||requestedSlot===1?requestedSlot:[0,1].find(n=>![...this.players.values()].some(p=>p.slot===n));
    if(slot===undefined||[...this.players.values()].some(p=>p.slot===slot))return false;
    this.started=true;
    const p={x:0,y:0,w:12,h:16,vx:0,vy:0,grounded:false,alive:true,respawn:0,jumpHeld:false,jumps:0,powered:false,fire:false,fireCooldown:0,invulnerable:1,dashCooldown:0,dashTime:0,dashHeld:false,slot};
    this.spawnPlayer(p);this.players.set(id,p);this.controllers[slot].owner=id;
    return true;
  }
  leave(id,ground){const p=this.players.get(id);if(p&&this.controllers){const pad=this.controllers[p.slot];if(ground){pad.x=ground.x;pad.y=ground.y+8;}pad.owner=null;}this.players.delete(id);}
  reset(){for(const pad of this.controllers)pad.owner=null;this.players.clear();this.enemies.clear();this.fireballs=[];this.powerups.clear();this.broken.clear();this.released.clear();this.collected.clear();this.particles=[];this.camera=0;this.time=0;this.started=false;this.completed=false;this.score=0;this.coins=0;this.area='overworld';this.level=1;this.flagged.clear();this.finishTimer=0;this.stageNotice=0;this.returnState=null;this.pipeCooldown=0;}
  spawnPlayer(p){
    const blocks=this.blocks(this.camera+16,this.camera+W-24);
    const floor=blocks.find(b=>b.kind==='ground'&&b.x>=this.camera+20+p.slot*16)||blocks.find(b=>b.kind==='ground');
    const x=floor?.x??this.camera+24;
    const top=Math.min(GROUND,...blocks.filter(b=>x<b.x+b.w&&x+12>b.x).map(b=>b.y));
    Object.assign(p,{x,y:top-p.h,vx:0,vy:0,alive:true,grounded:true,jumps:0,invulnerable:1});
  }
  terrain(column){
    if(this.area==='underground')return 'ground';
    if(column>=TV_SCENES_PER_LEVEL*TV_SECTION_TILES)return 'ground';
    if(column<12)return 'ground';
    return this.scene(Math.floor(column/TV_SECTION_TILES)).gaps.includes(column%TV_SECTION_TILES)?null:'ground';
  }
  blocks(start,end){
    const key=this.level+':'+this.area+':'+this.seed+':'+this.broken.size;
    if(this.blockCacheKey!==key||this.blockTerrain!==this.terrain||this.blockScene!==this.scene){this.blockCacheKey=key;this.blockTerrain=this.terrain;this.blockScene=this.scene;this.blockCache=new Map();}
    const range=Math.floor(start/TILE)+':'+Math.ceil(end/TILE);
    if(!this.blockCache.has(range)){if(this.blockCache.size>=96)this.blockCache.delete(this.blockCache.keys().next().value);this.blockCache.set(range,this.buildBlocks(start,end));}
    return this.blockCache.get(range);
  }
  buildBlocks(start,end){
    const result=[];
    if(this.area==='underground'){
      for(let x=0;x<W;x+=TILE)result.push({x,y:GROUND,w:TILE,h:24,kind:'ground',key:'u'+x});
      for(let x=0;x<W;x+=TILE)result.push({x,y:16,w:TILE,h:16,kind:'ceiling',key:'uc'+x});
      result.push({x:208,y:88,w:32,h:32,kind:'pipe',key:'exit',entrance:true});
      for(const x of [64,80,96,128,144,160])result.push({x,y:80,w:16,h:16,kind:'brick',key:'u-b'+x});
      return result.filter(b=>!this.broken.has(b.key));
    }
    for(let c=Math.floor(start/TILE)-1;c<=Math.ceil(end/TILE)+1;c++){
      if(c<0)continue;
      const base=c*TILE;
      if(this.terrain(c))result.push({x:base,y:GROUND,w:TILE,h:H-GROUND,kind:'ground',key:`g${c}`});
      if(c>=TV_SCENES_PER_LEVEL*TV_SECTION_TILES){
        const phase=c%TV_SECTION_TILES;
        const height=phase>=5&&phase<=11?(phase<=7?16:phase<=9?32:48):0;
        if(height)result.push({x:base,y:GROUND-height,w:TILE,h:height,kind:'hill',key:`hill:${c}`});
        continue;
      }
      if(c>5){
        const phase=c%TV_SECTION_TILES,scene=this.scene(Math.floor(c/TV_SECTION_TILES));
        if(this.level===2){const roof=scene.ceiling?.find(([at])=>at===phase),pillar=scene.pillars?.find(([at])=>at===phase);if(roof)result.push({x:base,y:roof[1],w:TILE,h:roof[2],kind:'ceiling',key:'roof:'+c});if(pillar)result.push({x:base,y:GROUND-pillar[1],w:TILE,h:pillar[1],kind:'hill',key:'pillar:'+c});}
        const brick=scene.bricks.find(b=>b[0]===phase),pipe=scene.pipes.find(b=>b[0]===phase);
        if(brick&&!this.broken.has(c))result.push({x:base,y:brick[1],w:TILE,h:TILE,kind:'brick',key:c});
        if(phase===scene.mushroom)result.push({x:base,y:scene.questionY,w:TILE,h:TILE,kind:'question',key:`question:${Math.floor(c/TV_SECTION_TILES)}`,section:Math.floor(c/TV_SECTION_TILES)});
        if(pipe){const offset=phase,index=scene.pipes.findIndex(([at])=>at===offset),section=Math.floor(c/TV_SECTION_TILES),ordinal=this.scenePipesBefore(section)+index,coinWorld=(ordinal+(this.seed>>>0))%3===0;
          result.push({x:base,y:GROUND-pipe[1],w:TILE,h:pipe[1],kind:'pipe',key:`p${c}`,entrance:true,coinWorld,coinCount:18+((section+index+(this.seed>>>1))%3)*6});}
      }
    }
    return result;
  }
  spawnEnemies(){
    if(this.area==='underground')return;
    const first=Math.max(0,Math.floor(this.camera/(TILE*28))-1),last=Math.floor((this.camera+W+80)/(TILE*28))+1;
    for(let section=first;section<=Math.min(last,TV_SCENES_PER_LEVEL-1);section++)for(const offset of this.scene(section).enemies){
      const key=`${section}:${offset}`;
      if(!this.enemies.has(key))this.enemies.set(key,{x:(section*28+offset)*TILE,y:GROUND-12,w:13,h:12,vx:-21,vy:0,alive:true,kind:this.scene(section).specialEnemies.find(([at])=>at===offset)?.[1]||'goomba'});
    }
    for(let section=first;section<=Math.min(last,TV_SCENES_PER_LEVEL-1);section++)for(const [offset,height] of this.scene(section).pipes){
      // Keep piranha plants sparse and reproducible: one in each group of four
      // pipe positions across the current course, with the seed rotating which.
      const ordinal=this.scenePipesBefore(section)+this.scene(section).pipes.findIndex(([at])=>at===offset);
      if((ordinal+(this.seed>>>0))%4!==0)continue;
      const key=`plant:${section}:${offset}`;
      if(!this.enemies.has(key))this.enemies.set(key,{x:(section*28+offset)*TILE+2,y:GROUND-height-12,w:12,h:12,vx:0,vy:0,alive:true,kind:'piranha',pipeHeight:height,phase:(section*2.1+offset*.17)});
    }
  }
  scenePipesBefore(section){let total=0;for(let s=0;s<section;s++)total+=this.scene(s).pipes.length;return total;}
  pickups(){
    if(this.area==='underground')return Array.from({length:this.returnState.pipe.coinCount||24},(_,i)=>({x:22+(i%10)*22,y:[28,54,82][Math.floor(i/10)],w:7,h:10,kind:'coin',key:`room:${this.returnState.pipe.key}:${i}`})).filter(p=>!this.collected.has(p.key));
    const result=[],first=Math.max(0,Math.floor(this.camera/448)),last=Math.floor((this.camera+W)/448);
    for(let s=first;s<=Math.min(last,TV_SCENES_PER_LEVEL-1);s++){
      const scene=this.scene(s),base=s*448;
      for(const [i,[column,y]] of [...scene.bricks.map(([c,y])=>[c,y-18]),[4,100],[5,100],[25,100],[26,100]].entries())result.push({x:base+column*16+4,y,w:7,h:10,kind:'coin',key:`coin:${s}:${i}`});
      if(this.released.has(s)){
        const key=`powerup:${s}`;
        if(!this.powerups.has(key))this.powerups.set(key,{x:base+scene.mushroom*16+2,y:scene.questionY-14,w:12,h:14,kind:scene.powerup,key,vx:scene.powerup==='mushroom'?22:0,vy:scene.powerup==='mushroom'?-25:0,emerging:.35});
        if(!this.collected.has(key)){const item=this.powerups.get(key);if(!(item.emerging>0))result.push({...item});}
      }
    }
    return result.filter(p=>!this.collected.has(p.key));
  }
  usePipe(){
    if(this.area==='overworld')return;
    const saved=this.returnState;this.area='overworld';this.camera=saved.camera;this.enemies=saved.enemies;
    for(const p of this.players.values())Object.assign(p,{x:saved.pipe.x,y:saved.pipe.y-p.h,vx:0,vy:0,alive:true,grounded:true,jumps:0,invulnerable:1});
    this.returnState=null;this.pipeCooldown=.8;
  }
  enterPipe(pipe){
    this.returnState={camera:this.camera,enemies:this.enemies,pipe};this.area='underground';this.camera=0;this.enemies=new Map();this.pipeCooldown=.8;
    for(const p of this.players.values())Object.assign(p,{x:20+p.slot*16,y:GROUND-p.h,vx:0,vy:0,alive:true,grounded:true,jumps:0,invulnerable:1});
  }
  breakBrick(b){
    if(this.broken.has(b.key))return;
    this.broken.add(b.key);this.score+=25;
    for(let i=0;i<8;i++)this.particles.push({x:b.x+4+(i%3)*4,y:b.y+4+Math.floor(i/3)*4,vx:((i*17)%7-3)*19,vy:-52-(i%4)*17,life:.42+(i%3)*.06});
  }
  nextLevel(){
    if(this.level===2){this.completed=true;this.finishTimer=0;return;}
    this.level=this.level===1?2:1;this.area='overworld';this.camera=0;this.enemies.clear();this.powerups.clear();this.broken.clear();this.released.clear();this.collected.clear();this.particles=[];this.flagged.clear();this.finishTimer=0;this.stageNotice=2.4;this.pipeCooldown=0;
    for(const p of this.players.values())this.spawnPlayer(p);
  }
  step(dt,commands={}){
    if(!this.players.size||this.completed)return;
    dt=Math.min(Math.max(dt,0),.05);this.time+=dt;this.pipeCooldown=Math.max(0,this.pipeCooldown-dt);this.stageNotice=Math.max(0,this.stageNotice-dt);
    for(const part of this.particles){part.x+=part.vx*dt;part.y+=part.vy*dt;part.vy+=210*dt;part.life-=dt;}
    this.particles=this.particles.filter(part=>part.life>0);
    if(this.finishTimer>0){this.finishTimer-=dt;if(this.finishTimer<=0){this.nextLevel();return;}}
    this.spawnEnemies();
    for(const p of this.players.values()){
      p.dashCooldown=Math.max(0,(p.dashCooldown||0)-dt);p.dashTime=Math.max(0,(p.dashTime||0)-dt);p.dashInvulnerable=Math.max(0,(p.dashInvulnerable||0)-dt);
    }
    for(const item of this.powerups.values())if(item.kind==='mushroom'){
      if(item.emerging>0){const rise=Math.min(item.emerging,dt);item.y-=42*rise;item.emerging-=rise;continue;}
      const oldX=item.x,oldY=item.y;item.x+=item.vx*dt;
      const pipe=this.blocks(Math.min(oldX,item.x),Math.max(oldX,item.x)+item.w).find(b=>b.kind==='pipe'&&overlap(item,b));if(pipe){item.x=oldX;item.vx*=-1;}
      item.vy=Math.min(230,item.vy+360*dt);item.y+=item.vy*dt;
      const floor=this.blocks(item.x,item.x+item.w).filter(b=>['ground','hill','pipe','brick'].includes(b.kind)).find(b=>overlap(item,b)&&oldY+item.h<=b.y+4&&item.vy>=0);
      if(floor){item.y=floor.y-item.h;item.vy=0;}
    }
    for(const [id,p] of this.players){
      if(!p.alive){p.respawn-=dt;if(p.respawn<=0)this.spawnPlayer(p);continue;}
      p.invulnerable=Math.max(0,p.invulnerable-dt);
      p.fireCooldown=Math.max(0,(p.fireCooldown||0)-dt);
      const input=commands[id]||{},direction=(input.right?1:0)-(input.left?1:0);
      if(direction)p.face=direction;
      const down=!!input.down,shouldCrouch=!!p.powered&&down;
      if(shouldCrouch!==!!p.crouching){const bottom=p.y+p.h;p.crouching=shouldCrouch;p.w=shouldCrouch?14:(p.powered?14:12);p.h=shouldCrouch?16:(p.powered?20:16);p.y=bottom-p.h;}
      if(input.dash&&!p.dashHeld&&p.dashCooldown<=0){let dx=direction,dy=(input.up?-1:0)+(down?1:0);if(!dx&&!dy)dx=p.face||1;const len=Math.hypot(dx,dy)||1;p.dashX=dx/len;p.dashY=dy/len;p.dashTime=DASH_DURATION;p.dashCooldown=DASH_COOLDOWN;p.dashInvulnerable=DASH_DURATION;p.vy=p.dashY*DASH_SPEED;}
      p.dashHeld=!!input.dash;
      p.vx=this.flagged.has(id)?Math.min(80,Math.max(0,(CASTLE_X-p.x)*2)):p.dashTime>0?p.dashX*DASH_SPEED:direction*(input.run?105:72);
      if(input.jump&&!p.jumpHeld&&(p.grounded||p.jumps<2)){p.jumps=p.grounded?1:p.jumps+1;p.vy=-188;p.grounded=false;}
      p.jumpHeld=!!input.jump||!!input.joinHeld;
      // The left face button is a held fire control, just like the classic
      // Nintendo run/shoot rhythm: holding it repeatedly launches fireballs.
      if(input.attack&&p.fire&&p.fireCooldown<=0){
        this.fireballs.push({x:p.x+(p.face||1)*10,y:p.y+7,vx:(p.face||1)*FIREBALL_SPEED,vy:-35,life:2,owner:id});
        p.fireCooldown=.28;
      }
      if(p.dashTime>0&&Math.abs(p.dashY)>.35)p.vy=p.dashY*DASH_SPEED;
      this.move(p,dt,true);
      p.x=Math.max(this.camera,Math.min(Math.min(this.camera+W,COURSE_END+TV_SECTION_TILES*TILE)-p.w,p.x));
      if(this.area==='overworld'&&!this.flagged.has(id)&&p.x+p.w>=FLAG_X&&p.y+p.h<=GROUND-12){this.flagged.add(id);if(!this.finishTimer)this.finishTimer=6;this.score+=500;}
      for(const item of this.pickups())if(overlap(p,item)){this.collected.add(item.key);if(item.kind==='coin'){this.coins++;this.score+=10;}else{const bottom=p.y+p.h;if(!p.powered){p.x--;p.y-=4;}p.powered=true;p.fire=item.kind==='flower';p.w=p.crouching?14:14;p.h=p.crouching?16:20;if(p.crouching)p.y=bottom-p.h;p.invulnerable=1;this.score+=item.kind==='flower'?100:50;}}
      if(!this.pipeCooldown&&p.grounded&&(input.down||(this.area==='underground'&&input.up))){
        const pipe=this.blocks(p.x,p.x+p.w).find(b=>b.entrance&&p.x+p.w/2>=b.x&&p.x+p.w/2<=b.x+b.w&&Math.abs(p.y+p.h-b.y)<2);
        if(pipe){if(this.area==='underground')this.usePipe();else if(pipe.coinWorld)this.enterPipe(pipe);return;}
      }
      if(p.y>H+24)this.die(p);
    }
    for(const ball of this.fireballs){
      ball.vy=Math.min(230,ball.vy+410*dt);ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.life-=dt;
      if(ball.y>=GROUND-5){ball.y=GROUND-5;ball.vy=-112;ball.bounces=(ball.bounces||0)+1;}
      if(ball.y>H||ball.x<this.camera-20||ball.x>this.camera+W+20||this.blocks(ball.x,ball.x+4).some(b=>(b.kind==='ceiling'||b.kind==='pipe')&&overlap(ball,b))){ball.life=0;continue;}
      for(const enemy of this.enemies.values())if(enemy.alive&&enemy.kind!=='piranha'&&enemy.kind!=='shell'&&overlap(ball,{x:enemy.x,y:enemy.y,w:enemy.w,h:enemy.h})){enemy.alive=false;ball.life=0;this.score+=100;break;}
    }
    this.fireballs=this.fireballs.filter(b=>b.life>0);
    for(const enemy of this.enemies.values())if(enemy.alive){
      if(enemy.kind==='piranha'){
        enemy.y=GROUND-enemy.pipeHeight+2-Math.max(0,Math.sin(this.time*2.8+enemy.phase))*16;
        for(const p of this.players.values())if(p.alive&&overlap(p,enemy)&&!p.invulnerable)this.damagePlayer(p);
        continue;
      }
      if(enemy.kind==='shell'){
        const oldX=enemy.x,speed=enemy.vx;this.move(enemy,dt,false);
        if(Math.abs(enemy.x-(oldX+speed*dt))>.01){enemy.vx=-speed;enemy.face=enemy.vx<0?-1:1;}
        if(enemy.y>H+24){enemy.alive=false;continue;}
        if(enemy.x<this.camera-20||enemy.x>this.camera+W+20){enemy.alive=false;continue;}
        for(const other of this.enemies.values())if(other!==enemy&&other.alive&&other.kind!=='piranha'&&other.kind!=='shell'&&overlap(enemy,other)){other.alive=false;this.score+=100;}
        for(const [id,p] of this.players)if(p.alive&&overlap(p,enemy)&&id!==enemy.kickedBy&&enemy.safeTimer<=0&&!p.invulnerable&&!p.dashInvulnerable)this.damagePlayer(p);
        enemy.safeTimer=Math.max(0,(enemy.safeTimer||0)-dt);continue;
      }
      enemy.vy=Math.min(230,enemy.vy+460*dt);
      const oldX=enemy.x;enemy.x+=enemy.vx*dt;
      if(this.blocks(enemy.x,enemy.x+enemy.w).some(b=>b.kind==='pipe'&&overlap(enemy,b))){enemy.x=oldX;enemy.vx*=-1;}
      const oldBottom=enemy.y+enemy.h;enemy.y+=enemy.vy*dt;
      for(const b of this.blocks(enemy.x,enemy.x+enemy.w))if(overlap(enemy,b)&&oldBottom<=b.y+3&&enemy.vy>=0){enemy.y=b.y-enemy.h;enemy.vy=0;break;}
      if(enemy.y>H+20)enemy.alive=false;
      for(const [id,p] of this.players)if(p.alive&&overlap(p,enemy)){
        if(p.vy>15&&p.y+p.h-enemy.y<10){if(enemy.kind==='turtle'){enemy.kind='shell';enemy.w=14;enemy.h=9;enemy.y+=3;enemy.vx=(p.face||1)*148;enemy.vy=0;enemy.kickedBy=id;enemy.safeTimer=.45;}else enemy.alive=false;p.vy=-125;this.score+=100;}
        else if(!p.invulnerable&&!p.dashInvulnerable)this.damagePlayer(p);
      }
    }
    const alive=[...this.players.values()].filter(p=>p.alive);
    if(this.area==='overworld'&&alive.length){const leader=Math.max(...alive.map(p=>p.x)),back=alive.reduce((a,b)=>a.x<b.x?a:b);const follow=this.flagged.size?Math.max(...[...this.players].filter(([id])=>this.flagged.has(id)).map(([,p])=>p.x))-145:Math.min(leader-100,back.x-24);const target=Math.min(COURSE_END+TV_SECTION_TILES*TILE-W,Math.max(this.camera,follow));if(alive.length===1||this.flagged.size||back.x>this.camera+32)this.camera+=Math.min(180*dt,(target-this.camera)*(1-Math.exp(-dt*12)));}
    for(const [key,e] of this.enemies)if(e.x<this.camera-180)this.enemies.delete(key);
  }
  move(p,dt,breakBlocks){
    const oldX=p.x;p.x=Math.max(0,p.x+p.vx*dt);
    for(const b of this.blocks(Math.min(oldX,p.x),Math.max(oldX,p.x)+p.w))if(overlap(p,b)){
      if(p.vx>0)p.x=b.x-p.w;else if(p.vx<0)p.x=b.x+b.w;
    }
    const oldTop=p.y,oldBottom=p.y+p.h;
    p.vy=Math.min(230,p.vy+460*dt);p.y+=p.vy*dt;p.grounded=false;
    for(const b of this.blocks(p.x,p.x+p.w))if(overlap(p,b)){
      if(p.vy>=0&&oldBottom<=b.y+3){p.y=b.y-p.h;p.vy=0;p.grounded=true;p.jumps=0;}
      else if(p.vy<0&&oldTop>=b.y+b.h-3){p.y=b.y+b.h;p.vy=0;if(breakBlocks&&b.kind==='brick')this.breakBrick(b);else if(b.kind==='question')this.released.add(b.section);}
    }
  }
  damagePlayer(p){if(p.fire){p.fire=false;p.invulnerable=1.5;p.vy=-90;return;}if(p.powered){p.powered=false;p.x++;p.y+=4;p.w=12;p.h=16;p.invulnerable=1.5;p.vy=-90;}else this.die(p);}
  die(p){if(!p.alive)return;p.alive=false;p.powered=false;p.fire=false;p.w=12;p.h=16;p.respawn=1.1;p.vx=0;p.vy=0;}
  draw(c,x,y,w,h){
    if(!this.screen){this.screen=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(W,H):Object.assign(document.createElement('canvas'),{width:W,height:H});}
    const g=this.screen.getContext('2d');g.imageSmoothingEnabled=false;
    const cavern=this.level===2||this.area==='underground';
    g.fillStyle=cavern?'#05080c':'#5c92ed';g.fillRect(0,0,W,H);
    if(!cavern){
      g.fillStyle='#fff2c7';g.fillRect(210,20,18,18);
      const cloudShift=this.camera*.14+this.time*4;
      g.fillStyle='#edf6f0';for(let i=-1;i<5;i++){const px=((i*93-cloudShift)%(W+93)+(W+93))%(W+93)-40,cy=23+(i*11+55)%16;g.fillRect(px,cy+7,39,7);g.fillRect(px+7,cy+2,28,8);g.fillRect(px+14,cy,13,4);}
      // Layer silhouettes reach the bottom edge even where the ground has gaps.
      g.fillStyle='#93c879';g.fillRect(0,H-30,W,30);
      for(const [step,speed,color,height] of [[81,.18,'#93c879',43],[67,.36,'#5db466',32]]){
        g.fillStyle=color;
        for(let i=-2;i<Math.ceil(W/step)+3;i++){
          const px=i*step-(this.camera*speed)%step,top=H-height-(i*17+90)%15;
          g.beginPath();g.moveTo(px-19,H);g.lineTo(px-19,top+18);g.lineTo(px-8,top+18);g.lineTo(px-8,top+8);g.lineTo(px+8,top+8);g.lineTo(px+8,top);g.lineTo(px+26,top);g.lineTo(px+26,top+9);g.lineTo(px+39,top+9);g.lineTo(px+39,H);g.closePath();g.fill();
        }
      }
    }
    for(const b of this.blocks(this.camera,this.camera+W)){
      const sx=Math.round(b.x-this.camera);if(b.kind==='ceiling'){cavernBricks(g,sx,b.y,b.w,b.h);}
      else if(b.kind==='ground'){if(cavern)cavernBricks(g,sx,b.y,TILE,H-b.y);else{g.fillStyle='#51a756';g.fillRect(sx,b.y,TILE,4);g.fillStyle='#98613b';g.fillRect(sx,b.y+4,TILE,H-b.y-4);g.fillStyle='#b77d4d';g.fillRect(sx+2,b.y+9,3,3);}}
      else if(b.kind==='hill'){if(cavern)cavernBricks(g,sx,b.y,b.w,b.h);else{g.fillStyle='#55984b';g.fillRect(sx,b.y,b.w,b.h);g.fillStyle='#a2cf77';g.fillRect(sx,b.y,b.w,4);}}
      else if(b.kind==='brick'){if(cavern)cavernBricks(g,sx,b.y,TILE,TILE);else{g.fillStyle='#bd713f';g.fillRect(sx,b.y,TILE,TILE);g.fillStyle='#e5a75c';g.fillRect(sx+1,b.y+1,14,2);g.fillRect(sx+7,b.y+8,2,7);g.fillStyle='#754025';g.fillRect(sx,b.y+7,16,2);}}
      else if(b.kind==='question'){const used=this.released.has(b.section),reward=this.scene(b.section).powerup;g.fillStyle=used?'#6c6254':'#ab6925';g.fillRect(sx,b.y,TILE,TILE);g.fillStyle=used?'#8b806b':reward==='flower'?'#e64a3b':'#f4bc4e';g.fillRect(sx+1,b.y+1,14,2);g.fillRect(sx+1,b.y+1,2,14);g.fillStyle=used?'#413a34':'#55331d';g.fillRect(sx+13,b.y+3,2,11);g.fillRect(sx+3,b.y+13,11,2);if(!used){g.fillStyle='#fff0ad';g.fillRect(sx+5,b.y+4,6,2);g.fillRect(sx+9,b.y+6,2,3);g.fillRect(sx+6,b.y+8,4,2);g.fillRect(sx+6,b.y+11,3,2);}}
      else {g.fillStyle='#258c2c';g.fillRect(sx,b.y,b.w,b.h);g.fillStyle='#6ee143';g.fillRect(sx-2,b.y,b.w+4,6);g.fillStyle='#185b25';g.fillRect(sx+b.w-4,b.y+6,3,b.h-6);g.fillStyle='#e4f9ba';g.fillRect(sx+b.w/2-1,b.y+8,2,6);g.fillRect(sx+b.w/2-3,b.y+11,6,2);if(b.coinWorld){g.fillStyle='#122c36';g.fillRect(sx+b.w/2-2,b.y+3,4,4);g.fillStyle='#ffd94f';g.fillRect(sx+b.w/2-1,b.y+4,2,2);}}
    }
    if(this.area==='overworld'&&this.camera+W>FLAG_X-24){
      const fx=Math.round(FLAG_X-this.camera),cx=Math.round(CASTLE_X-this.camera);
      g.fillStyle='#eadba9';g.fillRect(fx,36,2,84);g.fillStyle=cavern?'#7bd7f7':'#db4d42';g.fillRect(fx+2,this.flagged.size?104:42,20,11);g.fillStyle='#fff8dd';g.fillRect(fx+8,this.flagged.size?107:45,5,4);
      g.fillStyle=cavern?'#233865':'#7b6558';g.fillRect(cx-23,69,47,51);g.fillRect(cx-18,57,12,14);g.fillRect(cx+7,57,12,14);g.fillRect(cx-6,50,13,22);
      g.fillStyle=cavern?'#90c8e7':'#d0b995';for(const tx of [cx-19,cx-4,cx+11])g.fillRect(tx,66,9,4);
      g.fillStyle=cavern?'#121e40':'#382b31';g.fillRect(cx-5,94,12,26);g.fillStyle='#ffe3a0';g.fillRect(cx-16,79,5,7);g.fillRect(cx+13,79,5,7);
    }
    for(const part of this.particles){const sx=Math.round(part.x-this.camera),sy=Math.round(part.y);g.fillStyle=cavern?'#85bff0':'#e7a46a';g.fillRect(sx,sy,3,3);g.fillStyle=cavern?'#294c80':'#8d4c2e';g.fillRect(sx+1,sy+2,2,2);}
    for(const item of this.pickups()){
      const sx=Math.round(item.x-this.camera),sy=Math.round(item.y);
      if(item.kind==='coin'){g.fillStyle='#b76c16';g.fillRect(sx,sy+2,7,7);g.fillStyle='#ffdb58';g.fillRect(sx+1,sy,5,10);g.fillStyle='#fff3ac';g.fillRect(sx+2,sy+2,1,5);}
      else if(item.kind==='flower'){g.fillStyle='#2f9c50';g.fillRect(sx+5,sy+6,2,8);g.fillStyle='#e94f4b';g.fillRect(sx+2,sy+1,8,6);g.fillStyle='#ffd75b';g.fillRect(sx+5,sy+3,3,3);}
      else{g.fillStyle='#f1d9a3';g.fillRect(sx+3,sy+7,7,7);g.fillStyle='#d84646';g.fillRect(sx,sy+3,12,6);g.fillRect(sx+2,sy,8,5);g.fillStyle='#fff3ce';g.fillRect(sx+2,sy+3,3,3);g.fillRect(sx+8,sy+4,3,3);g.fillStyle='#302737';g.fillRect(sx+5,sy+10,1,2);g.fillRect(sx+8,sy+10,1,2);}
    }
    for(const ball of this.fireballs){const sx=Math.round(ball.x-this.camera),sy=Math.round(ball.y);g.fillStyle='#ffec82';g.fillRect(sx,sy,5,5);g.fillStyle='#e84c32';g.fillRect(sx+1,sy+4,3,2);}
    for(const e of this.enemies.values())if(e.alive&&e.kind!=='shell'&&e.kind!=='turtle'&&e.x>this.camera-16&&e.x<this.camera+W){const sx=Math.round(e.x-this.camera),sy=Math.round(e.y),stride=Math.floor(this.time*7)%2;if(e.kind==='piranha'){g.fillStyle='#2d8b45';g.fillRect(sx+5,sy+7,3,12);g.fillStyle='#d74948';g.fillRect(sx+1,sy+1,11,8);g.fillStyle='#fff0d0';g.fillRect(sx+3,sy+3,2,2);g.fillRect(sx+8,sy+3,2,2);g.fillStyle='#302438';g.fillRect(sx+5,sy+5,2,2);}else if(e.kind==='turtle'){g.fillStyle='#245e3a';g.fillRect(sx-stride,sy+9,5,4);g.fillRect(sx+8+stride,sy+9,5,4);g.fillStyle='#3f9c59';g.fillRect(sx+1,sy+2,11,9);g.fillStyle='#b6d26a';g.fillRect(sx+3,sy+1,7,5);g.fillStyle='#e9d19b';g.fillRect(sx+10,sy+4,4,4);g.fillStyle='#2b3941';g.fillRect(sx+11,sy+5,1,2);}else{g.fillStyle='#442b23';g.fillRect(sx-stride,sy+10,5,3);g.fillRect(sx+8+stride,sy+10,5,3);g.fillStyle='#ad6938';g.fillRect(sx,sy+3,13,7);g.fillRect(sx+3,sy,7,5);g.fillStyle='#fff2cf';g.fillRect(sx+2,sy+4,3,4);g.fillRect(sx+8,sy+4,3,4);g.fillStyle='#241d23';g.fillRect(sx+4,sy+5,1,3);g.fillRect(sx+8,sy+5,1,3);g.fillRect(sx+2,sy+3,4,1);g.fillRect(sx+7,sy+3,4,1);}}
    for(const e of this.enemies.values())if(e.alive&&e.x>this.camera-16&&e.x<this.camera+W){const sx=Math.round(e.x-this.camera),sy=Math.round(e.y),stride=Math.floor(this.time*7)%2;if(e.kind==='turtle')drawTvTurtle(g,sx,sy,stride);else if(e.kind==='shell')drawTvTurtle(g,sx,sy,stride,true);else if(e.kind==='piranha'&&e.y+e.h>=GROUND-e.pipeHeight){const pipeTop=GROUND-e.pipeHeight,px=Math.round(e.x-2-this.camera);g.fillStyle='#258c2c';g.fillRect(px,pipeTop,16,e.pipeHeight);g.fillStyle='#6ee143';g.fillRect(px-2,pipeTop,20,6);if(this.blocks(this.camera,this.camera+W).some(b=>b.kind==='pipe'&&b.coinWorld&&Math.round(b.x-this.camera)===px)){g.fillStyle='#122c36';g.fillRect(px+6,pipeTop+3,4,4);g.fillStyle='#ffd94f';g.fillRect(px+7,pipeTop+4,2,2);}}}
    for(const [id,p] of this.players)if(p.alive&&!(this.flagged.has(id)&&p.x>=CASTLE_X-9)&&!(p.invulnerable>0&&Math.floor(this.time*12)%2)){const sx=Math.round(p.x-this.camera),sy=Math.round(p.y),extra=p.h-16;g.fillStyle='#312f55';g.fillRect(sx+2,sy+11+extra,4,5);g.fillRect(sx+7+extra/2,sy+11+extra,4,5);g.fillStyle=p.fire?'#f0f0e8':palette[p.slot];g.fillRect(sx+1,sy+5,p.w-2,7+extra);g.fillStyle=p.fire?'#e94b3f':palette[p.slot];g.fillRect(sx+2,sy,p.w-3,4);g.fillStyle='#ffd3a0';g.fillRect(sx+5,sy+4,6,4);}
    g.fillStyle='#152f49';g.fillRect(0,0,W,15);g.fillStyle='#fff7df';g.font='bold 10px monospace';g.fillText(`SCORE ${String(this.score).padStart(6,'0')}`,5,11);g.fillStyle='#ffdd65';g.fillText(`COINS ${this.coins}`,100,11);g.fillStyle='#fff7df';g.fillText(this.area==='underground'?'BONUS':`LV 1-${this.level}`,183,11);
    if(this.finishTimer>0){g.fillStyle='#142942cb';g.fillRect(63,18,130,17);g.fillStyle='#fff3c9';g.font='bold 10px monospace';g.fillText(`FLAG! ${Math.ceil(this.finishTimer)}s`,87,30);}
    if(this.stageNotice>0){g.fillStyle='#112440df';g.fillRect(32,45,192,54);g.fillStyle='#fff3d4';g.textAlign='center';g.font='bold 21px monospace';g.fillText(`LEVEL 1-${this.level}`,128,78);g.textAlign='left';}
    if(!this.players.size){g.fillStyle='#10263bbd';g.fillRect(27,40,202,61);g.fillStyle='#fff3c9';g.textAlign='center';g.font='bold 13px monospace';g.fillText(this.started?'PAUSED':'JUNGLE JUMP',128,63);g.font='8px monospace';g.fillText('INTERACT TO PLAY',128,81);g.textAlign='left';}
    c.save();c.imageSmoothingEnabled=false;c.drawImage(this.screen,x,y,w,h);c.restore();
  }
}

export function drawLobbyTelevision(c,tv,o){
  const x=o.x,y=o.y;
  c.save();c.translate(x,y+22);c.scale(LOBBY_TV.scale,LOBBY_TV.scale);c.translate(-x,-y-22);
  c.fillStyle='#17251e55';c.fillRect(x-72,y+19,157,10);
  // Broaden the picture area slightly and raise the cabinet's top cap, while
  // preserving the TV's original uniform pixel scale and floor footprint.
  c.fillStyle='#382a23';c.fillRect(x-80,y-94,160,116);
  c.fillStyle='#b28a5b';c.fillRect(x-76,y-72,152,89);
  c.fillStyle='#d0aa70';c.fillRect(x-77,y-92,154,20);
  c.fillStyle='#e4c48a';c.fillRect(x-78,y-94,156,3);c.fillRect(x-74,y-90,148,2);
  c.fillStyle='#785638';c.fillRect(x+66,y-72,10,89);
  c.fillStyle='#4a372a';c.fillRect(x-73,y+17,149,5);
  c.fillStyle='#282d30';c.fillRect(x-72,y-69,138,85);
  if(tv.started)tv.draw(c,x-67,y-64,128,72);
  else {c.fillStyle='#142638';c.fillRect(x-67,y-64,128,72);c.fillStyle='#456b6c';c.fillRect(x-63,y-59,120,2);c.fillRect(x-63,y+2,120,2);}
  c.fillStyle='#352e28';c.fillRect(x+68,y-57,7,42);c.fillStyle='#d9b96f';c.fillRect(x+70,y-50,3,4);c.fillRect(x+70,y-40,3,4);
  c.restore();
  c.fillStyle='#655242';c.fillRect(x-24,y+23,48,12);c.fillStyle='#b3a795';c.fillRect(x-21,y+21,42,10);
  c.fillStyle='#473e36';c.fillRect(x-16,y+25,11,3);c.fillRect(x+13,y+25,4,3);
  // Two sockets live on the front face of the console, not the TV screen.
  c.fillRect(x-12,y+30,5,3);c.fillRect(x+7,y+30,5,3);
}
export function drawLobbyControllers(c,tv,actors){
  for(const [slot,pad]of tv.controllers.entries()){
    const actor=pad.owner===null?null:actors.find(a=>a.id===pad.owner);
    const grip=actor?lobbyControllerGrip(actor,slot):pad;
    drawControllerCable(c,{x:785+(slot?9:-9),y:198},grip);
    if(!actor){c.fillStyle='#14221c44';c.fillRect(Math.round(pad.x-14),Math.round(pad.y+7),28,4);drawLobbyController(c,pad.x,pad.y,slot);}
  }
}
