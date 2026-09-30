// A tiny, self-contained platform game rendered into the lobby's television.
// World coordinates are pixels; terrain is generated from a repeatable sequence.
const W=256,H=144,GROUND=120,TILE=16;
const palette=['#e84a45','#4a86d4'];
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

export class LobbyTelevision {
  constructor(){this.players=new Map();this.enemies=new Map();this.broken=new Set();this.camera=0;this.time=0;this.started=false;this.score=0;this.screen=null;}
  join(id){
    if(this.players.has(id))return true;
    if(this.players.size>=2)return false;
    this.started=true;
    this.players.set(id,{x:this.camera+28+this.players.size*18,y:GROUND-18,w:12,h:16,vx:0,vy:0,grounded:false,alive:true,respawn:0,jumpHeld:false,slot:this.players.size});
    return true;
  }
  leave(id){this.players.delete(id);}
  reset(){this.players.clear();this.enemies.clear();this.broken.clear();this.camera=0;this.time=0;this.started=false;this.score=0;}
  terrain(column){
    if(column<12)return 'ground';
    const phase=column%28;
    if(phase===13||phase===14||phase===15)return null;
    return 'ground';
  }
  blocks(start,end){
    const result=[];
    for(let c=Math.floor(start/TILE)-1;c<=Math.ceil(end/TILE)+1;c++){
      if(c<0)continue;
      const base=c*TILE;
      if(this.terrain(c))result.push({x:base,y:GROUND,w:TILE,h:H-GROUND,kind:'ground',key:`g${c}`});
      if(c>5){
        const phase=c%28;
        if([5,6,7,20,21].includes(phase)&&!this.broken.has(c))result.push({x:base,y:72,w:TILE,h:TILE,kind:'brick',key:c});
        if(phase===22||phase===23)result.push({x:base,y:GROUND-(phase===22?32:48),w:TILE,h:phase===22?32:48,kind:'pipe',key:`p${c}`});
      }
    }
    return result;
  }
  spawnEnemies(){
    const first=Math.max(0,Math.floor(this.camera/(TILE*28))-1),last=Math.floor((this.camera+W+80)/(TILE*28))+1;
    for(let section=first;section<=last;section++)for(const offset of [10,25]){
      const key=`${section}:${offset}`;
      if(!this.enemies.has(key))this.enemies.set(key,{x:(section*28+offset)*TILE,y:GROUND-12,w:13,h:12,vx:-21,vy:0,alive:true});
    }
  }
  step(dt,commands={}){
    if(!this.players.size)return;
    dt=Math.min(Math.max(dt,0),.05);this.time+=dt;this.spawnEnemies();
    for(const [id,p] of this.players){
      if(!p.alive){p.respawn-=dt;if(p.respawn<=0){Object.assign(p,{x:this.camera+24,y:GROUND-30,vx:0,vy:0,alive:true,grounded:false});}continue;}
      const input=commands[id]||{},direction=(input.right?1:0)-(input.left?1:0);
      p.vx=direction*(input.run?105:72);
      if(input.jump&&!p.jumpHeld&&p.grounded){p.vy=-188;p.grounded=false;}
      p.jumpHeld=!!input.jump;
      this.move(p,dt,true);
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
        else this.die(p);
      }
    }
    const leader=Math.max(...[...this.players.values()].filter(p=>p.alive).map(p=>p.x),this.camera+64);
    this.camera=Math.max(this.camera,leader-75);
    for(const p of this.players.values())if(p.alive&&p.x<this.camera-24){p.x=this.camera+18;p.y=GROUND-30;p.vy=0;}
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
      if(p.vy>=0&&oldBottom<=b.y+3){p.y=b.y-p.h;p.vy=0;p.grounded=true;}
      else if(p.vy<0&&oldTop>=b.y+b.h-3){p.y=b.y+b.h;p.vy=0;if(breakBlocks&&b.kind==='brick'){this.broken.add(b.key);this.score+=25;}}
    }
  }
  die(p){if(!p.alive)return;p.alive=false;p.respawn=1.1;p.vx=0;p.vy=0;}
  draw(c,x,y,w,h){
    if(!this.screen){this.screen=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(W,H):Object.assign(document.createElement('canvas'),{width:W,height:H});}
    const g=this.screen.getContext('2d');g.imageSmoothingEnabled=false;
    g.fillStyle='#71baf4';g.fillRect(0,0,W,H);
    g.fillStyle='#f6f4d3';g.fillRect(205,18,19,19);
    g.fillStyle='#edf6f0';for(const cx of [34,161,314]){const px=((cx-this.camera*.2)%(W+110)+W+110)%(W+110)-32;g.fillRect(px,26,30,6);g.fillRect(px+7,20,18,7);}
    g.fillStyle='#73b75e';for(let i=0;i<7;i++){const px=i*65-(this.camera*.35)%65;g.beginPath();g.arc(px+20,GROUND,27,Math.PI,0);g.fill();}
    for(const b of this.blocks(this.camera,this.camera+W)){
      const sx=Math.round(b.x-this.camera);if(b.kind==='ground'){g.fillStyle='#51a756';g.fillRect(sx,b.y,TILE,4);g.fillStyle='#98613b';g.fillRect(sx,b.y+4,TILE,H-b.y-4);g.fillStyle='#b77d4d';g.fillRect(sx+2,b.y+9,3,3);}
      else if(b.kind==='brick'){g.fillStyle='#bd713f';g.fillRect(sx,b.y,TILE,TILE);g.fillStyle='#e5a75c';g.fillRect(sx+1,b.y+1,14,2);g.fillRect(sx+7,b.y+8,2,7);g.fillStyle='#754025';g.fillRect(sx,b.y+7,16,2);}
      else {g.fillStyle='#207944';g.fillRect(sx,b.y,TILE,b.h);g.fillStyle='#4dc568';g.fillRect(sx-2,b.y,TILE+4,6);g.fillStyle='#164e32';g.fillRect(sx+12,b.y+6,3,b.h-6);}
    }
    for(const e of this.enemies.values())if(e.alive&&e.x>this.camera-16&&e.x<this.camera+W){const sx=Math.round(e.x-this.camera);g.fillStyle='#744525';g.fillRect(sx,e.y+4,13,8);g.fillStyle='#9d6438';g.fillRect(sx+2,e.y,9,7);g.fillStyle='#fff';g.fillRect(sx+3,e.y+5,2,2);g.fillRect(sx+8,e.y+5,2,2);}
    for(const p of this.players.values())if(p.alive){const sx=Math.round(p.x-this.camera),sy=Math.round(p.y);g.fillStyle='#312f55';g.fillRect(sx+2,sy+11,4,5);g.fillRect(sx+7,sy+11,4,5);g.fillStyle=palette[p.slot];g.fillRect(sx+1,sy+5,10,7);g.fillRect(sx+2,sy,9,4);g.fillStyle='#ffd3a0';g.fillRect(sx+5,sy+4,6,4);}
    g.fillStyle='#152f49';g.fillRect(0,0,W,13);g.fillStyle='#fff7df';g.font='bold 8px monospace';g.fillText(`SCORE ${String(this.score).padStart(6,'0')}`,6,9);g.fillText('∞  WORLD 1',165,9);
    if(!this.players.size){g.fillStyle='#10263bbd';g.fillRect(27,40,202,61);g.fillStyle='#fff3c9';g.textAlign='center';g.font='bold 13px monospace';g.fillText(this.started?'PAUSED':'JUNGLE JUMP',128,63);g.font='8px monospace';g.fillText('PRESS A TO PLAY',128,81);g.textAlign='left';}
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
