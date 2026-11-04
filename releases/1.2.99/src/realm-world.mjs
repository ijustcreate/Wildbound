import {REALMS,realmAsset} from './realm-layout.mjs';
export * from './realm-layout.mjs';
import {boundlessGeneratedTile} from './boundless-generation.mjs';
export function realmVoidBlocked(g,x,y,r=8){
 if(!REALMS.includes(g.generatedEnvironment)||g.phase==='won')return false;
 for(const [dx,dy]of [[0,0],[r,0],[-r,0],[0,r],[0,-r]]){const tx=Math.floor((x+dx)/32),ty=Math.floor((y+dy)/32);if(g.mapMode!=='boundless'&&(tx<0||ty<0||tx>=50||ty>=50))return true;if(['cave_void','shadow_void'].includes(realmTerrainAt(g,tx,ty)))return true;}
 return false;
}
export function realmFootprint(p){
 if(!p.realm||p.falling||p.depleted&&!p.fallen)return null;
 const type=realmAsset(p.kind)?.type,s=p.size/64,y=p.rootY??p.y+p.size*.19;
 if(p.fallen)return {x:p.x-7*s,y:y-5*s,w:14*s,h:7*s,height:6*s};
 if(Number.isFinite(p.collisionWidth)&&Number.isFinite(p.collisionDepth))return p.collisionWidth>0&&p.collisionDepth>0?{x:p.x-p.collisionWidth/2,y:y-p.collisionDepth,w:p.collisionWidth,h:p.collisionDepth,height:p.surfaceHeight??999}:null;
 if(type==='tree')return {x:p.x-6*s,y:y-9*s,w:12*s,h:12*s,height:999};
 if(type==='rock'||type==='log')return {x:p.x-17*s,y:y-12*s,w:34*s,h:13*s,height:12*s};
 if(type==='crystal'||type==='mineral')return {x:p.x-12*s,y:y-9*s,w:24*s,h:12*s,height:999};
 return null;
}
export function realmSafeSpawn(g,actor){
 if(!REALMS.includes(g.generatedEnvironment)||!g.blocked(actor.x,actor.y,16))return actor;
 let best=null,distance=Infinity;
 const ox=g.mapMode==='boundless'?Math.floor(actor.x/1600)*50:0,oy=g.mapMode==='boundless'?Math.floor(actor.y/1600)*50:0;
 for(let ty=oy+2;ty<oy+48;ty++)for(let tx=ox+2;tx<ox+48;tx++){
  const x=tx*32+16,y=ty*32+16,d=Math.hypot(x-actor.x,y-actor.y);
  if(d>=distance||Math.hypot(x-800,y-800)<260||g.blocked(x,y,16))continue;
  best={x,y};distance=d;
 }
 return best;
}
export function tickRealmHazards(g,dt){
 if(g.generatedEnvironment!=='caverns'||g.phase!=='play'||g.paused)return;
 for(const p of g.scenery.filter(p=>p.kind==='ceiling_stalactite')){
  if(p.hazardState==='spent')continue;
  const players=(g.players||[]).filter(a=>a.hp>0&&!a.room&&!a.ghost&&!a.spiritGhost);
  if(!p.hazardState||p.hazardState==='idle'){if(!players.some(a=>Math.hypot(a.x-p.x,a.y-p.rootY)<42))continue;p.hazardState='warning';p.hazardTime=0;g.onSound?.('mine',p);}
  p.hazardTime=(p.hazardTime||0)+Math.min(dt,.1);
  if(p.hazardTime>=(p.warning||1.6)+.35){p.hazardState='spent';for(const a of players)if(Math.hypot(a.x-p.x,a.y-p.rootY)<24)g.hurt?.(a,p.damage||5,{x:p.x,y:p.rootY,kind:'falling_stone'});g.persist?.();}
 }
}

export function realmTerrainAt(g,tx,ty){const outside=tx<0||ty<0||tx>=50||ty>=50;return outside?(g.mapMode==='boundless'?boundlessGeneratedTile(g,tx,ty):undefined):g.terrain?.[ty*50+tx];}
// Region state is plain saved data; context adapters are ephemeral and never saved.
export function realmContexts(g){
 const states=[g.realmState,...(g.mapMode==='boundless'?(g.boundlessLoadedChunks||[]).map(e=>e.realmState):[])].filter(Boolean);
 return states.map(state=>{if(state===g.realmState)return g;const ctx=Object.create(g);ctx.realmState=state;Object.defineProperty(ctx,'reveal',{get:()=>g.reveal,set:value=>{g.reveal=value;}});for(const method of ['blocked','hurt','persist','dropLoot','message','onSound'])if(typeof g[method]==='function')ctx[method]=g[method].bind(g);return ctx;});
}
export function realmEventContext(g){
 if(g.mapMode!=='boundless')return g;
 const p=g.players?.find(p=>p.hp>0&&!p.room);if(!p)return g;
 const key=Math.floor(p.x/1600)+','+Math.floor(p.y/1600);
 return realmContexts(g).find(ctx=>(ctx.realmState.key||'0,0')===key)||g;
}
