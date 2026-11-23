import {tickCryptPit,cryptPitAt} from './crypt-pits.mjs';
import {Game} from './core.mjs';
import {initAdventure} from './adventure.mjs';
import {wellTunnelBlocked} from './old-well.mjs';
import {CRYPT_BOSS_KIND,CRYPT_REWARDS,upgradeMausoleumGhosts} from './mausoleum-crypt.mjs';

const worlds=new WeakMap();
// JSON state stays in the portal. Only the regular Game runtime is ephemeral.
export function upgradeCryptWorld(state,players=[]){
 if(!state||state.worldVersion>=1)return false;
 upgradeMausoleumGhosts(state);
 const factor=32/(state.tile||16),scale=a=>{if(!a)return;for(const key of ['x','y','radius'])if(Number.isFinite(a[key]))a[key]*=factor;};
 for(const a of [state.exit,state.arrival,state.chest,state.coffin,...state.candles||[],...state.enemies||[],...state.bolts||[],...state.drops||[],...state.hazards||[],...state.decorations||[],...state.gates||[]])scale(a);
 for(const p of players){p.roomX*=factor;p.roomY*=factor;}
 state.tile=32;state.worldVersion=1;state.worldRuntime||={};return true;
}

export function tickCryptWorld(parent,door,players,inputs,dt){
 const s=door.well;upgradeCryptWorld(s,players);let world=worlds.get(door);
 if(!world){
  world=new Game(()=>parent.random(),{deferWorld:true});initAdventure(world);
  Object.assign(world,{phase:'play',openingBoard:false,environment:'crypt',generatedEnvironment:'crypt',interiorWorld:true,mapMode:'boundless',terrain:Array(2500).fill('stone'),scenery:[],house:{walls:[],doors:[],furniture:[],pools:[],rooms:[],trees:[]},spriteLibrary:parent.spriteLibrary,seed:s.seed,bloom:3});
  world.blocked=(x,y,radius=8,flying,water,doors,offset,elevation,projectile,from)=>wellTunnelBlocked(s,x,y,radius)||(from&&!world.players.includes(from)&&!flying&&cryptPitAt(s,x,y));
  world.projectileBlocked=(x,y,radius=1)=>wellTunnelBlocked(s,x,y,radius);
  world.canHitBoard=()=>false;world.hitTable=()=>false;world.portal=()=>false;
  const normalLoot=world.enemyLoot.bind(world);
  world.enemyLoot=e=>{
   if(!e.cryptBoss){
    normalLoot(e);
    if(!e.dropsGiven){e.dropsGiven=true;world.dropLoot(e.x,e.y,['skeleton','zombie'].includes(e.kind)?'bone_shard':e.kind==='spider'?'relic_dust':'magic_essence',1,'Crypt remains',true);}
    return;
   }
   if(s.coffin.rewardsDropped)return;
   s.coffin.defeated=true;s.coffin.rewardsDropped=true;s.hazards=[];
   for(const [i,type]of CRYPT_REWARDS.entries())world.dropLoot(e.x+(i?12:-12),e.y+8,type,1,'Coffin Warden',true);
   world.message('The Coffin Warden falls. Its shield and flame sword remain.');
  };
  worlds.set(door,world);
 }
 const runtime=s.worldRuntime||={};
 for(const key of ['arrows','spells','traps','effects','xpOrbs','baits','pickups','healingOverTime'])world[key]=runtime[key]||=[];
 world.loot=s.drops;world.enemies=s.enemies.filter(e=>(e.hp>0||e.defeated&&(e.deathTimer||0)<3.5)&&!(e.kind===CRYPT_BOSS_KIND&&['dormant','rising'].includes(e.state)));
 world.players=players;world.time=parent.time;world.difficulty=parent.difficulty;world.pvp=parent.pvp;
 let dirty=false;const sounds=[],messages=[];
 world.persist=()=>{dirty=true;};world.onSound=(...args)=>sounds.push(args);world.message=text=>messages.push(text);
 const originals=players.map(p=>({p,x:p.x,y:p.y,room:p.room,input:p.previousInput,consume:p.consumeInput}));
 const commands={};
 for(const {p}of originals){
  for(const stack of p.healingOverTime||[])if(stack.room===door.id)stack.room=null;
  p.x=p.roomX;p.y=p.roomY;p.room=null;p.consumeInput=!!p.ui;p.nativeCryptActive=false;
  const input=inputs[p.device]||{};
  commands[p.device]={...input,...(p.cryptPitFall?{x:0,y:0,attack:false,jump:false,dodge:false,block:false,loot:false}:{}),inventory:false,portal:false,interact:false,use:false,close:false,controlCycle:false};
 }
 const boss=s.enemies.find(e=>e.kind===CRYPT_BOSS_KIND);
 for(const e of world.enemies){e.room=null;if(e===boss){e.kind='skeleton';e.cryptBoss=true;e.equipment||={hand1:'crypt_flame_sword',hand2:'coffin_lid_shield'};}}
 try{world.update(dt,commands);for(const p of players)tickCryptPit(world,s,p,dt);}
 finally{
  if(boss){boss.kind=CRYPT_BOSS_KIND;boss.room=door.id;}
  for(const {p,x,y,room,input,consume}of originals){p.roomX=p.x;p.roomY=p.y;p.roomMoving=!!p.moving;p.roomStep=p.step;p.x=x;p.y=y;p.room=room;p.previousInput=input;p.consumeInput=consume;p.nativeCryptActive=true;for(const stack of p.healingOverTime||[])if(stack.room==null)stack.room=door.id;}
  for(const key of ['arrows','spells','traps','effects','xpOrbs','baits','pickups','healingOverTime'])runtime[key]=world[key];s.drops=world.loot;
 }
 for(const [name,actor]of sounds)parent.onSound?.(name,actor?{...actor,room:door.id}:actor);
 for(const message of messages)parent.message?.(message);
 if(dirty)parent.persist?.();
 return world;
}
