import { Game } from './core.mjs';
import { snapshot } from './rooms.mjs';
import { restoreForestLandscape } from './forest-landscape.mjs';
import { spawnQuestNpc } from './npc-quests.mjs';
import { getNpcQuestConfig } from './npc-quest-data.mjs';

export const REALM_VERSION = 1;
export const CAMP = Object.freeze({ x: 800, y: 1030 });
const copy = value => structuredClone(value);

export function clearRealmSite(g, site, radius = 65) {
  // Authoring a clearing is an explicit world edit, retained by the save.
  g.scenery = g.scenery.filter(p => Math.hypot(p.x-site.x,(p.rootY??p.y)-site.y)>radius);
  for(let y=Math.floor((site.y-radius)/32);y<=Math.floor((site.y+radius)/32);y++)
    for(let x=Math.floor((site.x-radius)/32);x<=Math.floor((site.x+radius)/32);x++)
      if(x>=0&&y>=0&&x<50&&y<50)g.terrain[y*50+x]='path';
}

export function createForestRealm(seed = 73129) {
  const g = new Game(Math.random, { deferWorld: true });
  g.seed=seed;g.environment='forest';g.mapMode='boundless';
  g.addPlayer('bootstrap','Forest preparation');g.start();g.openingBoard=false;
  g.realm={id:'forest-test',name:'Persistent Forest',version:REALM_VERSION,
    revision:0,camp:copy(CAMP),landmarks:[
      {id:'arrival',name:'Arrival Camp · Return Home',kind:'camp',...CAMP},
      {id:'clearing',name:'Keeper’s Clearing',kind:'landmark',x:1060,y:1030},
      {id:'ruin',name:'Overgrown Ruin',kind:'ruin',x:1660,y:1000}],
    territories:[{id:'forest-edge',name:'Forest Edge',kind:'panther',x:1610,y:1000,radius:160,limit:1,respawnSeconds:45,nextSpawn:0}],
    npcConfig:copy(getNpcQuestConfig())};
  clearRealmSite(g,CAMP,95);clearRealmSite(g,{x:1060,y:1030},65);
  const npc=spawnQuestNpc(g);
  if(npc)Object.assign(npc,{x:1060,y:1030,campX:1060,campY:1030,realmResident:true});
  g.players=[];g.enemies=[];g.event=null;g.reveal=null;g.boundlessSpawnTimer=1e9;
  g.message('A forest that remembers. Meet the Keeper east of camp, then follow the trail to the ruin.');
  return wireRealm(g);
}

export function wireRealm(g) {
  g.phase='play';g.openingBoard=false;g.houseWorldsEnabled=false;
  g.pvp=false;g.persist=()=>{};g.onSound=()=>{};g.spriteLibrary={};
  g.boundlessSpawnTimer=1e9;
  return g;
}

export function restoreForestRealm(state) {
  if(!state?.realm||state.realm.version!==REALM_VERSION||state.realm.id!=='forest-test'||state.generatedEnvironment!=='forest')throw Error('Unsupported forest realm save.');
  const g=new Game(Math.random,{deferWorld:true});Object.assign(g,copy(state));
  g.players=[];g.explored=new Set(state.explored||[]);g.boundlessLoadedChunks=[];
  g.forestLandscape=null;restoreForestLandscape(g,state.forestLandscapeVersion);
  return wireRealm(g);
}

export function realmSnapshot(g) { return snapshot(g); }

export function spawnRealmEnemy(g, territory) {
  const occupied=g.enemies.filter(e=>e.realmTerritory===territory.id&&e.hp>0).length;
  if(occupied>=territory.limit)return null;
  let site=null;
  for(let i=0;i<24;i++){
    const a=i*2.4,r=20+i*6,x=territory.x+Math.cos(a)*r,y=territory.y+Math.sin(a)*r;
    if(!g.blocked(x,y,12,false,false,false,0)&&Math.hypot(x-800,y-800)>650&&!g.players.some(p=>Math.hypot(x-p.x,y-p.y)<110)){site={x,y};break;}
  }
  if(!site)return null;
  const e={id:g.nextId++,kind:territory.kind,skin:territory.kind,...site,
    group:'realm:'+territory.id,realmTerritory:territory.id,boundlessThreat:true,
    hp:70,maxHp:70,speed:48,damage:8,state:'hunt',timer:1,cooldown:1,
    flash:0,step:0,faceX:-1,faceY:0,dx:0,dy:0,equipment:{},
    temperament:'patient',orbit:1,tacticTime:2,eventBound:false};
  g.configureCreature(e,false);g.enemies.push(e);return e;
}

export function tickForestRealm(g, dt, inputs) {
  if(!g.players.length)return;
  g.boundlessSpawnTimer=1e9;g.phase='play';
  g.update(dt,inputs);
  for(const p of g.players){
    if(p.hp<=0&&p.deathTime>=3){
      Object.assign(p,{x:CAMP.x,y:CAMP.y,hp:p.maxHp,deathTime:0,invuln:3,ui:null,room:null});
      g.phase='play';g.message(`${p.name} returns to camp.`);
    }
  }
  // Nearby territories renew; empty worlds and distant regions sleep.
  for(const t of g.realm.territories){
    if(!g.players.some(p=>p.hp>0&&Math.hypot(p.x-t.x,p.y-t.y)<1100))continue;
    if(g.enemies.some(e=>e.hp>0&&e.realmTerritory===t.id))t.nextSpawn=g.time+t.respawnSeconds;
    else if(g.time>=t.nextSpawn&&spawnRealmEnemy(g,t))t.nextSpawn=g.time+t.respawnSeconds;
  }
  g.phase='play';
}

export function editRealm(g, edit) {
  if(!edit||!['landmark','npc','territory','spawn','remove'].includes(edit.type))throw Error('Choose a supported creator action.');
  if(edit.type==='remove'){
    if(['arrival','clearing','ruin'].includes(edit.id))throw Error('The initial landmarks cannot be removed.');
    g.realm.landmarks=g.realm.landmarks.filter(p=>p.id!==edit.id);
    g.realm.territories=g.realm.territories.filter(p=>p.id!==edit.id);
    g.questNpcs=g.questNpcs.filter(p=>String(p.id)!==edit.id);
    return;
  }
  const {x,y}=edit;
  if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>100000||Math.abs(y)>100000)throw Error('Use finite world coordinates within ±100000.');
  const name=String(edit.name||'Forest landmark').trim().slice(0,64);
  if(!name)throw Error('Enter a name.');
  const id=edit.id||'authored:'+g.nextId++;
  if(edit.type==='landmark'){
    if(g.realm.landmarks.length>=100&&!g.realm.landmarks.some(p=>p.id===id))throw Error('This test supports 100 landmarks.');
    const existing=g.realm.landmarks.find(p=>p.id===id);
    if(existing?.kind==='camp')throw Error('Arrival camp stays at its safe entry point.');
    const value={id,name,x,y,kind:'landmark'};
    if(existing)Object.assign(existing,value);else g.realm.landmarks.push(value);
  }else if(edit.type==='npc'){
    const npc=g.questNpcs.find(p=>p.realmResident);
    if(!npc)throw Error('The resident NPC is missing.');
    clearRealmSite(g,{x,y},60);Object.assign(npc,{x,y,campX:x,campY:y});
  }else{
    if(!['panther','tiger','lion','spider','boar'].includes(edit.kind))throw Error('Choose a supported forest creature.');
    if(Math.hypot(x-800,y-800)<700)throw Error('Place enemies at least 700 units from the board clearing.');
    const value={id,name,x,y,kind:edit.kind,radius:160,limit:1,respawnSeconds:45,nextSpawn:g.time};
    if(edit.type==='spawn'){
      value.limit=1;const enemy=spawnRealmEnemy(g,{...value,id:'temporary:'+g.nextId++});
      if(!enemy)throw Error('No safe enemy spawn here. Choose open ground farther from players.');return enemy;
    }
    if(g.realm.territories.length>=12&&!g.realm.territories.some(t=>t.id===id))throw Error('This test supports 12 territories.');
    const old=g.realm.territories.find(t=>t.id===id);
    if(old)Object.assign(old,value);else g.realm.territories.push(value);
  }
}

export function drawRealmLandmarks(ctx,g) {
  if(!g.realm)return;
  for(const l of g.realm.landmarks){
    ctx.save();ctx.translate(l.x,l.y);ctx.fillStyle='#0b201a99';
    ctx.beginPath();ctx.ellipse(0,4,29,12,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=l.kind==='camp'?'#69dcb0':'#d5b875';
    ctx.fillRect(-3,-39,6,42);ctx.fillRect(-22,-35,44,18);
    ctx.strokeStyle='#f3dfb0';ctx.strokeRect(-22,-35,44,18);
    ctx.font='bold 10px monospace';ctx.textAlign='center';
    ctx.lineWidth=3;ctx.strokeStyle='#10251e';ctx.strokeText(l.name,0,-46);
    ctx.fillStyle='#ffefc9';ctx.fillText(l.name,0,-46);ctx.restore();
  }
}
