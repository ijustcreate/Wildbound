// Saved, seeded perch visitors. Rendering never changes state or consumes RNG.
export function ensureChestCritter(chest,environment){
  chest.biome||=environment;
  if(chest.critter!==undefined||!['forest','temple','jungle'].includes(chest.biome))return;
  chest.critter={kind:chest.biome==='forest'?'sparrow':'butterfly',phase:chest.opened?'gone':'perched',x:chest.x+5,y:chest.y-20,time:0};
}
export function tickChestCritters(g,dt){
  for(const chest of g.supplyChests||[]){
    ensureChestCritter(chest,g.generatedEnvironment);const a=chest.critter;if(!a||a.phase==='gone')continue;
    const nearby=g.players.filter(p=>!p.room&&p.hp>0&&Math.hypot(p.x-chest.x,p.y-chest.y)<90).sort((p,q)=>Math.hypot(p.x-chest.x,p.y-chest.y)-Math.hypot(q.x-chest.x,q.y-chest.y))[0];
    if(a.phase==='perched'&&(chest.opened||nearby)){
      const dx=chest.x-(nearby?.x??chest.x-1),dy=chest.y-(nearby?.y??chest.y+1),length=Math.hypot(dx,dy)||1;
      Object.assign(a,{phase:'fleeing',time:0,vx:(length===1&&dx===0?1:dx/length)*95,vy:dy/length*65-35});
    }
    if(a.phase==='fleeing'){a.time+=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;if(a.time>=3.5)a.phase='gone';}
  }
}
export function drawChestCritter(c,chest,time){
  const a=chest.critter;if(!a||a.phase==='gone')return;
  c.save();c.translate(Math.round(a.x),Math.round(a.y));
  const flap=Math.floor(time*(a.phase==='fleeing'?18:3))%2;
  if(a.phase==='fleeing')c.globalAlpha=Math.min(1,(3.5-a.time)/.6);
  if(a.kind==='butterfly'){
    c.fillStyle='#3c4530';c.fillRect(-1,-6,2,7);c.fillStyle='#dca44f';c.fillRect(flap?-3:-6,-7,flap?2:5,5);c.fillRect(2,-7,flap?2:5,5);c.fillStyle='#f0d68c';c.fillRect(flap?-3:-5,-7,2,2);c.fillRect(2,-7,2,2);
  }else{
    c.fillStyle='#3b3229';c.fillRect(-4,-6,8,6);c.fillRect(2,-9,5,5);c.fillRect(-6,-4,3,3);
    c.fillStyle='#a38760';c.fillRect(-3,-5,6,4);c.fillStyle='#dbc89b';c.fillRect(1,-4,3,3);c.fillStyle='#e8bf5d';c.fillRect(7,-7,2,2);
    c.fillStyle='#172823';c.fillRect(5,-8,1,1);c.fillStyle='#786044';c.fillRect(-3,flap&&a.phase==='fleeing'?-11:-5,5,flap&&a.phase==='fleeing'?7:3);
  }c.restore();
}
