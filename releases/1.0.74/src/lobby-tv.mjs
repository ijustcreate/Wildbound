// A tiny, self-contained platform game rendered into the lobby's television.
// World coordinates are pixels; terrain is generated from a repeatable sequence.
import {TV_SCENES,TV_CAVERN_SCENES,TV_SECTION_TILES,TV_SCENES_PER_LEVEL,tvSceneIndex} from './lobby-tv-levels.mjs';
const W=256,H=144,GROUND=120,TILE=16;
const COURSE_END=TV_SCENES_PER_LEVEL*TV_SECTION_TILES*TILE;
const FLAG_X=COURSE_END+17*TILE,CASTLE_X=COURSE_END+23*TILE;
const palette=['#e84a45','#4a86d4'];
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

export class LobbyTelevision {
  constructor(seed=Math.floor(Math.random()*0xffffffff)){this.seed=seed;this.players=new Map();this.enemies=new Map();this.broken=new Set();this.released=new Set();this.particles=[];this.camera=0;this.time=0;this.started=false;this.completed=false;this.score=0;this.coins=0;this.collected=new Set();this.area='overworld';this.level=1;this.flagged=new Set();this.finishTimer=0;this.stageNotice=0;this.pipeCooldown=0;this.screen=null;}
  scene(section){return (this.level===1?TV_SCENES:TV_CAVERN_SCENES)[tvSceneIndex(section,this.seed)];}
  join(id){
    if(this.players.has(id))return true;
    if(this.players.size>=2)return false;
    this.started=true;
    const slot=[0,1].find(n=>![...this.players.values()].some(p=>p.slot===n));
    const p={x:0,y:0,w:12,h:16,vx:0,vy:0,grounded:false,alive:true,respawn:0,jumpHeld:false,jumps:0,powered:false,invulnerable:1,slot};
    this.spawnPlayer(p);this.players.set(id,p);
    return true;
  }
  leave(id){this.players.delete(id);}
  reset(){this.players.clear();this.enemies.clear();this.broken.clear();this.released.clear();this.collected.clear();this.particles=[];this.camera=0;this.time=0;this.started=false;this.completed=false;this.score=0;this.coins=0;this.area='overworld';this.level=1;this.flagged.clear();this.finishTimer=0;this.stageNotice=0;this.returnState=null;this.pipeCooldown=0;}
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
    const result=[];
    if(this.area==='underground'){
      for(let x=0;x<W;x+=TILE)result.push({x,y:GROUND,w:TILE,h:24,kind:'ground',key:'u'+x});
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
        const brick=scene.bricks.find(b=>b[0]===phase),pipe=scene.pipes.find(b=>b[0]===phase);
        if(brick&&!this.broken.has(c))result.push({x:base,y:brick[1],w:TILE,h:TILE,kind:'brick',key:c});
        if(phase===scene.mushroom)result.push({x:base,y:88,w:TILE,h:TILE,kind:'question',key:`question:${Math.floor(c/TV_SECTION_TILES)}`,section:Math.floor(c/TV_SECTION_TILES)});
        if(pipe)result.push({x:base,y:GROUND-pipe[1],w:TILE,h:pipe[1],kind:'pipe',key:`p${c}`,entrance:true});
      }
    }
    return result;
  }
  spawnEnemies(){
    if(this.area==='underground')return;
    const first=Math.max(0,Math.floor(this.camera/(TILE*28))-1),last=Math.floor((this.camera+W+80)/(TILE*28))+1;
    for(let section=first;section<=Math.min(last,TV_SCENES_PER_LEVEL-1);section++)for(const offset of this.scene(section).enemies){
      const key=`${section}:${offset}`;
      if(!this.enemies.has(key))this.enemies.set(key,{x:(section*28+offset)*TILE,y:GROUND-12,w:13,h:12,vx:-21,vy:0,alive:true});
    }
  }
  pickups(){
    if(this.area==='underground')return Array.from({length:24},(_,i)=>({x:52+(i%8)*20,y:[30,52,100][Math.floor(i/8)],w:7,h:10,kind:'coin',key:`room:${this.returnState.pipe.key}:${i}`})).filter(p=>!this.collected.has(p.key));
    const result=[],first=Math.max(0,Math.floor(this.camera/448)),last=Math.floor((this.camera+W)/448);
    for(let s=first;s<=Math.min(last,TV_SCENES_PER_LEVEL-1);s++){
      const scene=this.scene(s),base=s*448;
      for(const [i,[column,y]] of [...scene.bricks.map(([c,y])=>[c,y-18]),[4,100],[5,100],[25,100],[26,100]].entries())result.push({x:base+column*16+4,y,w:7,h:10,kind:'coin',key:`coin:${s}:${i}`});
      if(this.released.has(s))result.push({x:base+scene.mushroom*16+2,y:74,w:12,h:14,kind:'mushroom',key:`mushroom:${s}`});
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
    this.level=this.level===1?2:1;this.area='overworld';this.camera=0;this.enemies.clear();this.broken.clear();this.released.clear();this.collected.clear();this.particles=[];this.flagged.clear();this.finishTimer=0;this.stageNotice=2.4;this.pipeCooldown=0;
    for(const p of this.players.values())this.spawnPlayer(p);
  }
  step(dt,commands={}){
    if(!this.players.size||this.completed)return;
    dt=Math.min(Math.max(dt,0),.05);this.time+=dt;this.pipeCooldown=Math.max(0,this.pipeCooldown-dt);this.stageNotice=Math.max(0,this.stageNotice-dt);
    for(const part of this.particles){part.x+=part.vx*dt;part.y+=part.vy*dt;part.vy+=210*dt;part.life-=dt;}
    this.particles=this.particles.filter(part=>part.life>0);
    if(this.finishTimer>0){this.finishTimer-=dt;if(this.finishTimer<=0){this.nextLevel();return;}}
    this.spawnEnemies();
    for(const [id,p] of this.players){
      if(!p.alive){p.respawn-=dt;if(p.respawn<=0)this.spawnPlayer(p);continue;}
      p.invulnerable=Math.max(0,p.invulnerable-dt);
      const input=commands[id]||{},direction=(input.right?1:0)-(input.left?1:0);
      p.vx=this.flagged.has(id)?Math.min(80,Math.max(0,(CASTLE_X-p.x)*2)):direction*(input.run?105:72);
      if(input.jump&&!p.jumpHeld&&(p.grounded||p.jumps<2)){p.jumps=p.grounded?1:p.jumps+1;p.vy=-188;p.grounded=false;}
      p.jumpHeld=!!input.jump||!!input.joinHeld;
      this.move(p,dt,true);
      p.x=Math.max(this.camera,Math.min(Math.min(this.camera+W,COURSE_END+TV_SECTION_TILES*TILE)-p.w,p.x));
      if(this.area==='overworld'&&!this.flagged.has(id)&&p.x+p.w>=FLAG_X&&p.y+p.h<=GROUND-12){this.flagged.add(id);if(!this.finishTimer)this.finishTimer=6;this.score+=500;}
      for(const item of this.pickups())if(overlap(p,item)){this.collected.add(item.key);if(item.kind==='coin'){this.coins++;this.score+=10;}else{if(!p.powered){p.x--;p.y-=4;p.w=14;p.h=20;}p.powered=true;p.invulnerable=1;this.score+=50;}}
      if(!this.pipeCooldown&&p.grounded&&(input.down||(this.area==='underground'&&input.up))){
        const pipe=this.blocks(p.x,p.x+p.w).find(b=>b.entrance&&p.x+p.w/2>=b.x&&p.x+p.w/2<=b.x+b.w&&Math.abs(p.y+p.h-b.y)<2);
        if(pipe){if(this.area==='underground')this.usePipe();else this.enterPipe(pipe);return;}
      }
      if(p.y>H+24)this.die(p);
    }
    for(const enemy of this.enemies.values())if(enemy.alive){
      enemy.vy=Math.min(230,enemy.vy+460*dt);
      const oldX=enemy.x;enemy.x+=enemy.vx*dt;
      if(this.blocks(enemy.x,enemy.x+enemy.w).some(b=>b.kind==='pipe'&&overlap(enemy,b))){enemy.x=oldX;enemy.vx*=-1;}
      const oldBottom=enemy.y+enemy.h;enemy.y+=enemy.vy*dt;
      for(const b of this.blocks(enemy.x,enemy.x+enemy.w))if(overlap(enemy,b)&&oldBottom<=b.y+3&&enemy.vy>=0){enemy.y=b.y-enemy.h;enemy.vy=0;break;}
      if(enemy.y>H+20)enemy.alive=false;
      for(const p of this.players.values())if(p.alive&&overlap(p,enemy)){
        if(p.vy>15&&p.y+p.h-enemy.y<10){enemy.alive=false;p.vy=-125;this.score+=100;}
        else if(!p.invulnerable){if(p.powered){p.powered=false;p.x++;p.y+=4;p.w=12;p.h=16;p.invulnerable=1.5;p.vy=-90;}else this.die(p);}
      }
    }
    const alive=[...this.players.values()].filter(p=>p.alive);
    if(this.area==='overworld'&&alive.length){const leader=Math.max(...alive.map(p=>p.x)),back=alive.reduce((a,b)=>a.x<b.x?a:b);const follow=this.flagged.size?Math.max(...[...this.players].filter(([id])=>this.flagged.has(id)).map(([,p])=>p.x))-145:Math.min(leader-100,back.x-24);if(this.flagged.size||alive.length===1||back.vx>0)this.camera=Math.min(COURSE_END+TV_SECTION_TILES*TILE-W,Math.max(this.camera,follow));}
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
  die(p){if(!p.alive)return;p.alive=false;p.powered=false;p.w=12;p.h=16;p.respawn=1.1;p.vx=0;p.vy=0;}
  draw(c,x,y,w,h){
    if(!this.screen){this.screen=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(W,H):Object.assign(document.createElement('canvas'),{width:W,height:H});}
    const g=this.screen.getContext('2d');g.imageSmoothingEnabled=false;
    const cavern=this.level===2||this.area==='underground';
    const sky=g.createLinearGradient(0,12,0,H);sky.addColorStop(0,cavern?'#101b43':'#4c9ee9');sky.addColorStop(1,cavern?'#4c81b2':'#b8e8e8');g.fillStyle=sky;g.fillRect(0,0,W,H);
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
    }else{
      g.fillStyle='#24335e';for(let i=-1;i<20;i++){const px=i*20-(this.camera*.2)%20;g.fillRect(px,13,16,7+(i%3)*4);g.fillRect(px+4,24,8,5);}
      g.fillStyle='#38618b';for(let i=-2;i<11;i++){const px=i*37-(this.camera*.28)%37;g.beginPath();g.moveTo(px,H);g.lineTo(px+8,87+(i%3)*10);g.lineTo(px+18,105);g.lineTo(px+31,79+(i%4)*7);g.lineTo(px+40,H);g.fill();}
      g.fillStyle='#83c6df';for(let i=0;i<7;i++){const px=i*46-(this.camera*.4)%46;g.fillRect(px+15,108,3,16);g.fillRect(px+17,116,5,8);}
    }
    for(const b of this.blocks(this.camera,this.camera+W)){
      const sx=Math.round(b.x-this.camera);if(b.kind==='ground'){g.fillStyle=cavern?'#5291b0':'#51a756';g.fillRect(sx,b.y,TILE,4);g.fillStyle=cavern?'#314d75':'#98613b';g.fillRect(sx,b.y+4,TILE,H-b.y-4);g.fillStyle=cavern?'#7fc2d9':'#b77d4d';g.fillRect(sx+2,b.y+9,3,3);}
      else if(b.kind==='hill'){g.fillStyle=cavern?'#315b91':'#55984b';g.fillRect(sx,b.y,b.w,b.h);g.fillStyle=cavern?'#80bede':'#a2cf77';g.fillRect(sx,b.y,b.w,4);g.fillStyle=cavern?'#203b63':'#3f763a';g.fillRect(sx+3,b.y+9,3,3);}
      else if(b.kind==='brick'){g.fillStyle=cavern?'#406aaa':'#bd713f';g.fillRect(sx,b.y,TILE,TILE);g.fillStyle=cavern?'#83bde2':'#e5a75c';g.fillRect(sx+1,b.y+1,14,2);g.fillRect(sx+7,b.y+8,2,7);g.fillStyle=cavern?'#263f74':'#754025';g.fillRect(sx,b.y+7,16,2);}
      else if(b.kind==='question'){const used=this.released.has(b.section);g.fillStyle=used?'#6c6254':'#ab6925';g.fillRect(sx,b.y,TILE,TILE);g.fillStyle=used?'#8b806b':'#f4bc4e';g.fillRect(sx+1,b.y+1,14,2);g.fillRect(sx+1,b.y+1,2,14);g.fillStyle=used?'#413a34':'#55331d';g.fillRect(sx+13,b.y+3,2,11);g.fillRect(sx+3,b.y+13,11,2);if(!used){g.fillStyle='#fff0ad';g.fillRect(sx+5,b.y+4,6,2);g.fillRect(sx+9,b.y+6,2,3);g.fillRect(sx+6,b.y+8,4,2);g.fillRect(sx+6,b.y+11,3,2);}}
      else {g.fillStyle=cavern?'#315e9d':'#207944';g.fillRect(sx,b.y,b.w,b.h);g.fillStyle=cavern?'#7cb8e0':'#4dc568';g.fillRect(sx-2,b.y,b.w+4,6);g.fillStyle=cavern?'#183762':'#164e32';g.fillRect(sx+b.w-4,b.y+6,3,b.h-6);g.fillStyle='#e4f9ba';g.fillRect(sx+b.w/2-1,b.y+8,2,6);g.fillRect(sx+b.w/2-3,b.y+11,6,2);}
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
      else{g.fillStyle='#f1d9a3';g.fillRect(sx+3,sy+7,7,7);g.fillStyle='#d84646';g.fillRect(sx,sy+3,12,6);g.fillRect(sx+2,sy,8,5);g.fillStyle='#fff3ce';g.fillRect(sx+2,sy+3,3,3);g.fillRect(sx+8,sy+4,3,3);g.fillStyle='#302737';g.fillRect(sx+5,sy+10,1,2);g.fillRect(sx+8,sy+10,1,2);}
    }
    for(const e of this.enemies.values())if(e.alive&&e.x>this.camera-16&&e.x<this.camera+W){const sx=Math.round(e.x-this.camera),sy=Math.round(e.y),stride=Math.floor(this.time*7)%2;g.fillStyle='#442b23';g.fillRect(sx-stride,sy+10,5,3);g.fillRect(sx+8+stride,sy+10,5,3);g.fillStyle='#ad6938';g.fillRect(sx,sy+3,13,7);g.fillRect(sx+3,sy,7,5);g.fillStyle='#fff2cf';g.fillRect(sx+2,sy+4,3,4);g.fillRect(sx+8,sy+4,3,4);g.fillStyle='#241d23';g.fillRect(sx+4,sy+5,1,3);g.fillRect(sx+8,sy+5,1,3);g.fillRect(sx+2,sy+3,4,1);g.fillRect(sx+7,sy+3,4,1);}
    for(const [id,p] of this.players)if(p.alive&&!(this.flagged.has(id)&&p.x>=CASTLE_X-9)&&!(p.invulnerable>0&&Math.floor(this.time*12)%2)){const sx=Math.round(p.x-this.camera),sy=Math.round(p.y),extra=p.h-16;g.fillStyle='#312f55';g.fillRect(sx+2,sy+11+extra,4,5);g.fillRect(sx+7+extra/2,sy+11+extra,4,5);g.fillStyle=palette[p.slot];g.fillRect(sx+1,sy+5,p.w-2,7+extra);g.fillRect(sx+2,sy,p.w-3,4);g.fillStyle='#ffd3a0';g.fillRect(sx+5,sy+4,6,4);}
    g.fillStyle='#152f49';g.fillRect(0,0,W,15);g.fillStyle='#fff7df';g.font='bold 10px monospace';g.fillText(`SCORE ${String(this.score).padStart(6,'0')}`,5,11);g.fillStyle='#ffdd65';g.fillText(`COINS ${this.coins}`,100,11);g.fillStyle='#fff7df';g.fillText(this.area==='underground'?'BONUS':`LV 1-${this.level}`,183,11);
    if(this.finishTimer>0){g.fillStyle='#142942cb';g.fillRect(63,18,130,17);g.fillStyle='#fff3c9';g.font='bold 10px monospace';g.fillText(`FLAG! ${Math.ceil(this.finishTimer)}s`,87,30);}
    if(this.stageNotice>0){g.fillStyle='#112440df';g.fillRect(32,45,192,54);g.fillStyle='#fff3d4';g.textAlign='center';g.font='bold 21px monospace';g.fillText(`LEVEL 1-${this.level}`,128,78);g.textAlign='left';}
    if(!this.players.size){g.fillStyle='#10263bbd';g.fillRect(27,40,202,61);g.fillStyle='#fff3c9';g.textAlign='center';g.font='bold 13px monospace';g.fillText(this.started?'PAUSED':'JUNGLE JUMP',128,63);g.font='8px monospace';g.fillText('INTERACT TO PLAY',128,81);g.textAlign='left';}
    c.save();c.imageSmoothingEnabled=false;c.drawImage(this.screen,x,y,w,h);c.restore();
  }
}

export function drawLobbyTelevision(c,tv,o){
  const x=o.x,y=o.y;
  c.fillStyle='#30363b';c.beginPath();c.ellipse(x,y+31,88,15,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#252b2b';c.lineWidth=3;
  for(const side of [-1,1]){c.beginPath();c.moveTo(x+side*10,y+27);c.bezierCurveTo(x+side*32,y+57,x+side*55,y+39,x+side*64,y+51);c.stroke();}
  c.fillStyle='#543a30';c.fillRect(x-76,y-64,152,86);c.fillStyle='#b28a5b';c.fillRect(x-73,y-61,146,78);
  c.fillStyle='#282d30';c.fillRect(x-66,y-54,120,68);
  if(tv.started)tv.draw(c,x-62,y-50,112,60);
  else {c.fillStyle='#142638';c.fillRect(x-62,y-50,112,60);c.fillStyle='#456b6c';c.fillRect(x-58,y-45,104,2);c.fillRect(x-58,y+1,104,2);}
  c.fillStyle='#352e28';c.fillRect(x+57,y-45,10,42);c.fillStyle='#d9b96f';c.fillRect(x+60,y-38,4,4);c.fillRect(x+60,y-28,4,4);
  c.fillStyle='#655242';c.fillRect(x-24,y+20,48,12);c.fillStyle='#b3a795';c.fillRect(x-21,y+19,42,9);c.fillStyle='#473e36';c.fillRect(x-16,y+22,11,3);c.fillRect(x+13,y+22,4,3);
  for(const side of [-1,1]){const cx=x+side*64,cy=y+50;c.fillStyle='#dad2bb';c.fillRect(cx-14,cy-5,28,10);c.fillRect(cx-10,cy-8,20,16);c.fillStyle='#4d4a44';c.fillRect(cx-8,cy-2,8,3);c.fillRect(cx-6,cy-5,3,9);c.fillStyle='#a85250';c.fillRect(cx+5,cy-3,4,4);c.fillRect(cx+9,cy,3,3);}
}
