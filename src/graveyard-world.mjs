// Self-contained generation: do not import world.mjs (which routes biomes here).
// Coordinates are world pixels; rootY and graveyardFootprint are on the ground.
export const GRAVEYARD_TILE = 32;
const regionalCollisionCache=new WeakMap();
export const GRAVEYARD_SCENERY_LIMIT = 320;
export const GRAVE_BREAK_SPAWN_CHANCE = 0.20;
export const GRAVE_EMERGENCE_SECONDS = 2.4;
export const GRAVEYARD_SAFE_AREA = Object.freeze({x:700,y:700,w:200,h:178});
export const GRAVEYARD_BOUNDS = Object.freeze({x:352,y:288,w:896,h:928});
export const GRAVEYARD_GATE = Object.freeze({x:704,y:1216,w:192});
export const CEMETERY_SMALL_GATES = Object.freeze([
  {id:'west',x:352,y:864,orientation:'vertical'},
  {id:'east',x:1248,y:864,orientation:'vertical'},
  {id:'north',x:944,y:288,orientation:'horizontal'},
]);
const gateGap=p=>CEMETERY_SMALL_GATES.some(g=>g.orientation===p.orientation&&
  (g.orientation==='vertical'?p.x===g.x&&Math.abs(p.y-g.y)<32:p.y===g.y&&Math.abs(p.x-g.x)<32));
// Only grave-break spawns are authored here; the parent owns cemetery eventfilter.
export const GRAVE_BREAK_ENEMY_KINDS = Object.freeze(['skeleton','zombie','ghost']);
export const graveyardHash = (seed, x = 0, y = 0) => {
  let n = (Number.isFinite(seed) ? seed : 0) | 0;
  n = Math.imul(n ^ ((x * 1009) | 0), 0x45d9f3b);
  n = Math.imul(n ^ ((y * 9176) | 0), 0x45d9f3b);
  n ^= n >>> 16;
  n = Math.imul(n, 0x7feb352d);
  n ^= n >>> 15;
  return (n >>> 0) / 4294967296;
};
const inside = (r,x,y,pad=0) => x>=r.x-pad && x<=r.x+r.w+pad && y>=r.y-pad && y<=r.y+r.h+pad;
const rectHit = (r,x,y,radius) => Math.hypot(x-Math.max(r.x,Math.min(x,r.x+r.w)),y-Math.max(r.y,Math.min(y,r.y+r.h))) <= radius;
const active = g => g?.generatedEnvironment === 'graveyard' && !!g.graveyard;
const pointSegment = (x,y,a,b) => {
  const dx=b.x-a.x,dy=b.y-a.y;
  const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy || 1)));
  return Math.hypot(x-a.x-dx*t,y-a.y-dy*t);
};
export function graveyardTrailDistance(graveyard,x,y) {
  const trail=graveyard?.trail || [];
  let distance=Infinity;
  for(let i=1;i<trail.length;i++)distance=Math.min(distance,pointSegment(x,y,trail[i-1],trail[i]));
  return distance;
}

export function graveyardWorld(seed=0) {
  seed=Number.isFinite(seed)?seed:0;
  const terrain=Array(2500).fill('grass'),scenery=[];
  const graveyard={version:1,featuresVersion:3,seed,bounds:{...GRAVEYARD_BOUNDS},safeArea:{...GRAVEYARD_SAFE_AREA},
    board:{x:800,y:800},gate:{...GRAVEYARD_GATE,open:true},plots:[],mausoleums:[],
    trail:[{x:800,y:880},{x:800,y:1264},{x:972,y:1344},{x:1024,y:1440},{x:904,y:1520},{x:904,y:1600}],
    trailWidth:96,breakEnemyKinds:[...GRAVE_BREAK_ENEMY_KINDS],breakCount:0};
  const prop=(kind,x,y,size,extra={}) => {
    const p={id:'graveyard:'+scenery.length,kind,x,y,rootY:y,size,procedural:true,graveyard:true,...extra};
    scenery.push(p);return p;
  };
  for(let ty=0;ty<50;ty++)for(let tx=0;tx<50;tx++) {
    const x=tx*32+16,y=ty*32+16,n=graveyardHash(seed,tx,ty);
    terrain[ty*50+tx]=inside(graveyard.bounds,x,y)?n<.18?'mud':'grass':n<.26?'mud':'grass';
    if(graveyardTrailDistance(graveyard,x,y)<graveyard.trailWidth/2 ||
      Math.abs(x-800)<48 && y>=384 && y<=700 || Math.abs(y-848)<32 && x>400 && x<1200)terrain[ty*50+tx]='path';
    if(inside(graveyard.safeArea,x,y,16))terrain[ty*50+tx]='path';
  }
  // Panels meet without cracks. The south fence has a real, permanently open gap.
  for(const y of [288,1216])for(let x=352;x<1248;x+=32) {
    if(y===1216 && x>=704 && x<896)continue;
    if(gateGap({x:x+16,y,orientation:'horizontal'}))continue;
    prop('cemetery_fence',x+16,y,48,{orientation:'horizontal',width:32,
      graveyardFootprint:{x,y:y-4,w:32,h:8}});
  }
  for(const x of [352,1248])for(let y=288;y<1216;y+=32){
    if(gateGap({x,y:y+16,orientation:'vertical'}))continue;
    prop('cemetery_fence',x,y+16,48,{orientation:'vertical',width:32,graveyardFootprint:{x:x-4,y,w:8,h:32}});
  }
  for(const gate of CEMETERY_SMALL_GATES){
    const vertical=gate.orientation==='vertical';
    prop('cemetery_gate',gate.x,gate.y,80,{small:true,gateId:gate.id,orientation:gate.orientation,open:true,
      blockers:[-1,1].map(side=>vertical?{x:gate.x-5,y:gate.y+side*36-5,w:10,h:10}:{x:gate.x+side*36-5,y:gate.y-5,w:10,h:10})});
  }
  prop('cemetery_gate',800,1216,212,{open:true,blockers:[
    {x:694,y:1206,w:10,h:24},{x:896,y:1206,w:10,h:24},
    {x:694,y:1230,w:8,h:46},{x:898,y:1230,w:8,h:46}]});
  const mausoleumSites=graveyardHash(seed,17,5)<.5?[[496,386],[1104,386]]:[[496,386],[800,386],[1104,386]];
  for(const [x,y] of mausoleumSites) {
    // The facade/cornice overhangs its nominal 128px body by 6px on both
    // sides. Keep the feet-plane solid footprint aligned to the visible stone.
    const p=prop('mausoleum',x,y,136,{width:128,depth:64,height:120,variant:graveyard.mausoleums.length,
      graveyardFootprint:{x:x-70,y:y-64,w:140,h:64}});
    graveyard.mausoleums.push({id:p.id,x,y,w:140,h:64});
  }
  for(const y of [448,568,688,936,1056])for(const x of [448,552,656,944,1048,1152]) {
    const n=graveyardHash(seed,x,y),plot={id:'grave-plot:'+graveyard.plots.length,x:x-22,y:y+2,w:44,h:68,
      stoneX:x,stoneY:y,variant:Math.floor(n*4),moss:graveyardHash(seed,y,x),broken:false};
    graveyard.plots.push(plot);
    const stone=prop('gravestone',x,y,44,{plotId:plot.id,variant:plot.variant,tilt:Math.floor(n*5)-2,
      hp:48,maxHp:48,maxHarvest:48,harvest:0,moss:plot.moss,
      graveyardFootprint:{x:x-16,y:y-8,w:32,h:12}});
    plot.stoneId=stone.id;
    if(n>.55)prop('grave_candles',x+27,y+22,18,{variant:Math.floor(n*3)});
  }
  for(const [x,y,size] of [[400,808,126],[1200,820,138],[405,1142,118],[1200,1146,136],[616,396,100],[976,398,112]])
    prop('leafless_tree',x,y,size,{variant:Math.floor(graveyardHash(seed,x,y)*3),
      graveyardFootprint:{x:x-10,y:y-7,w:20,h:14}});
  // Two walkable pumpkin beds, below the final grave row and off the main path.
  for(const [patch,x0] of [[0,520],[1,1040]])for(let row=0;row<2;row++)for(let col=0;col<3;col++)
    prop('pumpkin_crop',x0+col*40,1148+row*32,30,{patch,variant:col+row,picked:false});
  // A dense outer canopy with an uninterrupted 96px walking lane through it.
  for(let row=0;row<19;row++)for(let col=0;col<19 && scenery.length<GRAVEYARD_SCENERY_LIMIT;col++) {
    const x=48+col*84+(graveyardHash(seed,col,row)-.5)*28;
    const y=64+row*82+(graveyardHash(seed,row+59,col)-.5)*22;
    const gateApron=x>=GRAVEYARD_GATE.x-20 && x<=GRAVEYARD_GATE.x+GRAVEYARD_GATE.w+20 && y>=1160 && y<=1320;
    if(inside(graveyard.bounds,x,y,72)||graveyardTrailDistance(graveyard,x,y)<90||gateApron)continue;
    const size=100+Math.floor(graveyardHash(seed,col+79,row)*52);
    prop('grave_forest_tree',Math.round(x),Math.round(y),size,{variant:Math.floor(graveyardHash(seed,col+31,row+17)*5),treeType:['oak','birch','pine','deadwood','willow'][Math.floor(graveyardHash(seed,col+7,row+3)*5)],
      graveyardFootprint:{x:Math.round(x)-11,y:Math.round(y)-8,w:22,h:16}});
  }
  return {terrain,scenery,graveyard,house:null,webs:[],forestLandscape:null,graveyardVersion:1};
}

/** Input is the ground/feet plane, NOT the actor's drawing origin. */
export function graveyardBlocked(g,x,y,radius=8,flying=false,elevation=0,actor=null) {
  if(flying||!Number.isFinite(x)||!Number.isFinite(y))return false;
  const cemetery=active(g);
    let candidates=g.scenery||[];
    if(!cemetery){
      let cached=regionalCollisionCache.get(candidates);
      if(!cached||cached.length!==candidates.length){cached={length:candidates.length,props:candidates.filter(p=>p.graveyard&&p.boundlessRegion)};regionalCollisionCache.set(candidates,cached);}
      candidates=cached.props;if(!candidates.length)return false;
    }
  radius=Number.isFinite(radius)?Math.max(0,radius):8;
    return candidates.some(p=>{
    if(!p.graveyard||p.depleted||p.falling||!cemetery&&!p.boundlessRegion||g.phase==='won'&&p.kind!=='mausoleum')return false;
    if(actor?.wingHover&&elevation>=32&&['cemetery_fence','cemetery_gate'].includes(p.kind))return false;
    // Leave a clean approach to every mausoleum doorway. The structure still
    // blocks its walls, but the player can stand at the threshold and use the
    // interaction before or after the event opens the gate.
    if(p.kind==='mausoleum'){
        if(!Number.isFinite(p.x)||!Number.isFinite(p.rootY??p.y))return !!p.graveyardFootprint&&rectHit(p.graveyardFootprint,x,y,radius);
      const base=p.rootY??p.y,width=(p.width||128)+12,depth=p.depth||64;
        if(p.doorOpen&&Math.abs(x-p.x)+radius<20&&y-radius>=base-18)return false;
      return rectHit({x:p.x-width/2,y:base-depth,w:width,h:depth+5},x,y,radius);
    }
    return (p.graveyardFootprint && rectHit(p.graveyardFootprint,x,y,radius) ||
      (p.blockers || []).some(r=>rectHit(r,x,y,radius)));
  });
}

// Add only the new props/apertures to older expeditions, preserving opened crypts,
// broken graves, collected items, and all existing scenery IDs.
export function upgradeCemeteryFeatures(g){
  if(!active(g)||(g.graveyard.featuresVersion||0)>=3||g.phase==='won')return false;
  const previous=g.graveyard.featuresVersion||0;
  const fresh=graveyardWorld(g.graveyard.seed??g.seed);
  if(previous<2){
    g.scenery=(g.scenery||[]).filter(p=>p.kind!=='cemetery_fence'||!gateGap(p));
    for(const p of fresh.scenery.filter(p=>p.small&&p.kind==='cemetery_gate'||p.kind==='pumpkin_crop'))
      if(!g.scenery.some(old=>old.kind===p.kind&&old.x===p.x&&old.y===p.y))g.scenery.push({...p,id:'cemetery-extra:'+p.kind+':'+p.x+':'+p.y});
  }
  for(const p of g.scenery||[])if(p.kind==='mausoleum'&&p.graveyard){
    const depth=p.depth||64,width=p.width||128;
    p.graveyardFootprint={x:p.x-(width+12)/2,y:(p.rootY??p.y)-depth,w:width+12,h:depth};
    const record=(g.graveyard.mausoleums||[]).find(m=>m.id===p.id||m.x===p.x&&m.y===p.y);
    if(record){record.w=width+12;record.h=depth;}
  }
  g.graveyard.featuresVersion=3;return true;
}

function emerge(g,stone,plot,roll,disturber) {
  const kind=GRAVE_BREAK_ENEMY_KINDS[Math.min(2,Math.floor(roll/GRAVE_BREAK_SPAWN_CHANCE*3))];
  const id=Number.isInteger(g.nextId)?g.nextId++:'grave-undead:'+stone.id;
  const x=plot.x+plot.w/2,y=plot.y+Math.round(plot.h*.65)-14;
  const hp=kind==='ghost'?76:kind==='zombie'?80:55;
  const e={id,kind,skin:kind,x,y,hp,maxHp:hp,speed:kind==='zombie'?32:kind==='ghost'?54:52,damage:kind==='ghost'?12:14,
    state:'emerging',timer:1,cooldown:1,flash:0,step:0,dx:0,dy:0,attackX:0,attackY:0,
    attack:0,moving:false,faceX:0,faceY:1,temperament:'patient',orbit:1,tacticTime:2,
    group:'grave:'+plot.id,ambientGraveSpawn:true,eventBound:false,equipment:{},
    graveEmergence:{elapsed:0,duration:GRAVE_EMERGENCE_SECONDS,origin:{x,y,groundY:y+14,plotId:plot.id}}};
  if(kind==='zombie')e.zombieVariant=['shambler','one_arm','broken_jaw'][Math.floor(graveyardHash(g.seed,x,y)*3)];
  if(disturber){e.aggro=true;e.zombieLastSeen={id:disturber.id,x:disturber.x,y:disturber.y,remaining:6};}
  g.configureCreature?.(e,false);
  e.state='emerging';e.moving=false;
  (g.enemies ||= []).push(e);
  plot.emergedKind=kind;
}

/** Call before normal harvest. One nearest facing stone, one roll ONLY on break. */
export function harvestGravestone(g,p,damage,range=64) {
  if(!active(g)||g.phase!=='play'||g.paused||!p||p.room||p.ui||p.hp<=0 ||
    !Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(damage)||damage<=0||!Number.isFinite(range)||range<=0)return false;
  const fx=Number.isFinite(p.faceX)?p.faceX:0,fy=Number.isFinite(p.faceY)?p.faceY:1,f=Math.hypot(fx,fy)||1;
  const hit=(g.scenery || []).filter(s=>s.kind==='gravestone'&&s.graveyard&&!s.depleted&&s.hp>0)
    .map(s=>({s,dx:s.x-p.x,dy:s.rootY-(p.y+14)}))
    .filter(h=>Math.hypot(h.dx,h.dy)<=range &&
      (!Math.hypot(h.dx,h.dy)||(h.dx*fx+h.dy*fy)/Math.hypot(h.dx,h.dy)/f>=Math.SQRT1_2))
    .sort((a,b)=>Math.hypot(a.dx,a.dy)-Math.hypot(b.dx,b.dy))[0];
  if(!hit)return false;
  const stone=hit.s,plot=g.graveyard.plots.find(p=>p.id===stone.plotId);
  if(!plot)return false;
  stone.hp=Math.max(0,stone.hp-damage);stone.harvest=stone.maxHp-stone.hp;stone.hitAt=g.time || 0;
  p.gatherAction='mine';p.gatherTime=.55;g.onSound?.('mine',p);
  if(stone.hp===0) {
    stone.depleted=true;plot.broken=true;g.graveyard.breakCount=(g.graveyard.breakCount || 0)+1;
    // No quota, shared roll, compensating spawns, or retries. Every stone is independent.
    const roll=typeof g.random==='function'?g.random():graveyardHash(g.graveyard.seed,stone.x,stone.rootY+173);
    stone.breakRoll=roll;
    if(roll>=0 && roll<GRAVE_BREAK_SPAWN_CHANCE)emerge(g,stone,plot,roll,p);
  }
  return true;
}

/** Parent skips normal enemy AI while e.graveEmergence exists. Seconds, no catch-up. */
export function tickGraveyard(g,dt) {
  upgradeCemeteryFeatures(g);
  if(!active(g)||g.phase!=='play'||g.paused||!Number.isFinite(dt)||dt<=0)return false;
  let changed=false;
  for(const e of g.enemies || []) {
    const s=e.graveEmergence;if(!s)continue;
    if(e.hp<=0){delete e.graveEmergence;changed=true;continue;}
    s.elapsed=Math.min(s.duration,s.elapsed+Math.min(dt,1));
    e.x=s.origin.x;e.y=s.origin.y;e.moving=false;e.attack=0;e.state='emerging';
    if(s.elapsed>=s.duration){
      const disturber=(g.players||[]).find(p=>p.id===e.zombieLastSeen?.id&&p.hp>0&&!p.room&&Math.hypot(p.x-e.x,p.y-e.y)<360);
      if(disturber)e.zombieLastSeen={id:disturber.id,x:disturber.x,y:disturber.y,remaining:6};
      delete e.graveEmergence;e.state='hunt';e.cooldown=Math.max(e.cooldown || 0,.6);changed=true;
    }
  }
  return changed;
}
