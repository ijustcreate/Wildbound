import {creatures} from './definitions.mjs';
import {spawnMerchant} from './traveling-merchant.mjs';
import {advanceWorld,visitRegion,simulationTier,hash,REGION_SIZE,WORLD_RATE,recordWorldEvent} from './world-simulation.mjs';
const runtime=new WeakMap();
const regionKey=e=>`${Math.floor(e.x/REGION_SIZE)},${Math.floor(e.y/REGION_SIZE)}`;
const clone=v=>structuredClone(v);
export function noteLocalAnimalRemoved(g,e){
  if(!g.localWorld||!e.localEcology||e.worldRecorded)return;
  e.worldRecorded=true;const region=visitRegion(g.localWorld,...regionKey(e).split(',').map(Number));
  const role=e.ecologyRole==='predator'?'predators':'prey';region[role]=Math.max(0,region[role]-1);
  recordWorldEvent(g.localWorld,'animal-removed',{x:region.x,y:region.y,kind:e.kind,actor:e.id});
}
export function tickLocalWorld(g,dt) {
  const s=g.localWorld;
  if(!s||!['play','won'].includes(g.phase))return;
  advanceWorld(s,dt*WORLD_RATE);
  let r=runtime.get(g);
  if(!r||r.state!==s){r={state:s,age:5};runtime.set(g,r);}
  r.age+=dt;if(r.age<2)return;r.age=0;
  s.dormantActors||={};
  for(const p of g.players.filter(p=>p.hp>0&&!p.room))visitRegion(s,Math.floor(p.x/REGION_SIZE),Math.floor(p.y/REGION_SIZE));
  // Persist existing animals before unloading. Tamed companions always stay live.
  for(const e of g.enemies){
    if(!e.localEcology||e.friendly||e.owner!=null)continue;
    const region=visitRegion(s,...regionKey(e).split(',').map(Number));
    if(simulationTier(region,g.players)!=='active'){
      const list=s.dormantActors[regionKey(e)]||=[];
      if(e.hp>0)list.push(clone(e));e.worldSleeping=true;
    }
  }
  g.enemies=g.enemies.filter(e=>!e.worldSleeping);
  for(const [key,region] of Object.entries(s.regions)){
    region.tier=simulationTier(region,g.players);
    if(region.tier!=='active')continue;
    const dormant=s.dormantActors[key]||[];
    g.enemies.push(...dormant.map(e=>{delete e.worldSleeping;return e;}));delete s.dormantActors[key];
    const living=g.enemies.filter(e=>e.localEcology&&regionKey(e)===key&&e.hp>0);
    for(const e of g.enemies.filter(e=>e.localEcology&&regionKey(e)===key&&e.hp<=0&&!e.worldRecorded)){
      noteLocalAnimalRemoved(g,e);
    }
    for(const role of ['prey','predator']){
      const target=Math.min(role==='prey'?10:3,Math.floor(region[role==='prey'?'prey':'predators'])+(role==='predator'&&region.rare?1:0));
      const present=living.filter(e=>e.ecologyRole===role).length;
      // Births and migrations appear outside the player's immediate view; one per update.
      if(present<target&&g.enemies.filter(e=>e.localEcology&&e.hp>0).length<64){
        const choices=s.pack[role==='prey'?'prey':'predators'];
        const serial=region.spawnSerial=(region.spawnSerial||0)+1;
        const kind=choices[Math.floor(hash(s.seed,key,serial,role)*choices.length)];
        const cfg=creatures[kind];if(!cfg)continue;
        for(let n=0;n<20;n++){
          const x=(region.x+hash(s.seed,key,serial,n,'x'))*REGION_SIZE,y=(region.y+hash(s.seed,key,serial,n,'y'))*REGION_SIZE;
          if(Math.hypot(x-800,y-800)<620||g.players.some(p=>Math.hypot(x-p.x,y-p.y)<260)||g.blocked(x,y,18,false,false,false,0))continue;
          const e={id:g.nextId++,kind,skin:kind,x,y,homeX:x,homeY:y,hp:cfg.stats.hp,maxHp:cfg.stats.hp,speed:cfg.stats.speed,damage:cfg.stats.damage,localEcology:true,ecologyRole:role,wildlife:role==='prey',group:'local-ecosystem',state:role==='prey'?'graze':'hunt',timer:0,cooldown:1,flash:0,frozen:0,step:0,faceX:1,faceY:0,attackX:0,attackY:0,dx:0,dy:0,moving:false};
          if(role==='predator'&&region.rare&&!living.some(a=>a.rareLocal)){e.rareLocal=true;e.maxHp=e.hp=Math.round(e.hp*1.5);g.message('A rare '+kind.replaceAll('_',' ')+' has appeared in this region.');}
          g.configureCreature(e,false);g.enemies.push(e);break;
        }
      }
    }
    // Local predator/prey encounters affect actual actors as well as summaries.
    // Do not remove prey beside an explorer or award the player hunt loot/XP.
    for(const predator of living.filter(e=>e.ecologyRole==='predator'&&!e.friendly&&e.owner==null)){
      predator.ecologyHuntAt??=s.seconds+600;
      if(s.seconds<predator.ecologyHuntAt)continue;
      const prey=living.filter(e=>e.ecologyRole==='prey'&&e.hp>0&&Math.hypot(e.x-predator.x,e.y-predator.y)<90&&!g.players.some(p=>Math.hypot(p.x-e.x,p.y-e.y)<120)).sort((a,b)=>Math.hypot(a.x-predator.x,a.y-predator.y)-Math.hypot(b.x-predator.x,b.y-predator.y))[0];
      if(!prey)continue;
      const d=Math.hypot(prey.x-predator.x,prey.y-predator.y)||1;
      if(d>30){g.moveActor(predator,(prey.x-predator.x)/d*16,(prey.y-predator.y)/d*16);continue;}
      noteLocalAnimalRemoved(g,prey);g.enemies=g.enemies.filter(e=>e!==prey);predator.ecologyHuntAt=s.seconds+600;
      recordWorldEvent(s,'predator-hunt',{x:region.x,y:region.y,predator:predator.kind,prey:prey.kind});
    }
    if(region.x===0&&region.y===0){
      // Weather feeds the existing visual/gameplay weather pipeline.
      if(region.weather!=='clear'&&!g.weather)g.weather={type:region.weather==='storm'?'thunderstorm':'monsoon',intensity:1,duration:60,life:60};
      if(region.merchant&&!g.merchant&&g.spawnEvent){
        spawnMerchant(g);
      }
    }
  }
  // Recover harvested plant props after three world days; rocks/graves/buildings never regrow.
  const hour=Math.floor(s.seconds/3600);
  for(const [id,harvest]of Object.entries(s.harvests||{})){
    if(hour-harvest.hour<72)continue;
    const prefix=id.startsWith('boundless:')?id.split(':').slice(0,3).join(':')+':':null;
    const existing=g.scenery.find(p=>p.id===id);
    if(existing){for(const k of Object.keys(existing))delete existing[k];Object.assign(existing,clone(harvest.prop),{localOriginal:clone(harvest.prop)});}
    else if(!prefix||(g.boundlessLoadedChunks||[]).some(c=>prefix===`boundless:${c.key.replace(',',':')}:`))g.scenery.push({...clone(harvest.prop),localOriginal:clone(harvest.prop)});
    if(prefix){const key=id.split(':').slice(1,3).join(','),changes=g.boundlessChunkChanges?.[key];if(changes){changes.removed=changes.removed.filter(v=>v!==id);changes.changed=changes.changed.filter(p=>p.id!==id);}}
    delete s.harvests[id];recordWorldEvent(s,'plant-regrowth',{prop:id});
  }
  for(const prop of g.scenery||[]){
    if(!['tree','snow_tree','leafless_tree','bush','fern','flower','stump'].includes(prop.kind)&&!prop.fallen)continue;
    if(prop.fallen||prop.depleted||prop.kind==='stump'||prop.harvested){
      prop.localHarvestHour??=hour;
      if(hour-prop.localHarvestHour>=72&&prop.localOriginal){
        const original=clone(prop.localOriginal);for(const k of Object.keys(prop))delete prop[k];Object.assign(prop,original,{localOriginal:clone(original)});
        recordWorldEvent(s,'plant-regrowth',{prop:prop.id});
      }
    }
  }
  for(const quest of s.pack.quests||[]){
    const progress=s.quests[quest.id]||={progress:0,completed:false};
    progress.progress=Math.min(quest.target,Object.keys(s.regions).length);
    if(!progress.completed&&progress.progress>=quest.target){progress.completed=true;recordWorldEvent(s,'quest-completed',{quest:quest.id});g.message('World discovery: '+quest.name);}
  }
}
