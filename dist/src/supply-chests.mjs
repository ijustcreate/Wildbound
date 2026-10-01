import {dropIceRecipe} from './ice-crafting.mjs';
// A small, seeded supply route, selected from ground reachable from the board.
export const LEVEL_SUPPLIES = {
 forest: {item:'fern_pendant',name:'Woodland supplies',color:'#8fb779'},
 desert: {item:'sunstone_pendant',name:'Dune supplies',color:'#d7b568'},
 ice: {item:'snowflake_pendant',name:'Winter supplies',color:'#b5e5ef'},
 house: {item:'hearth_pendant',name:'Homestead supplies',color:'#c99777'},
 temple: {item:'jade_pendant',name:'Temple supplies',color:'#83d4b9'},
};
export function seedSupplyChests(g, force=false) {
 if(!force && Array.isArray(g.supplyChests))return;
 // Older winter caches are replaced by the shared, capped chest system.
 g.scenery=g.scenery.filter(s=>s.kind!=='winter_cache');
 const step=32, seen=new Set(), queue=[], candidates=[];
 const clear=(x,y,doors=false)=>!g.blocked(x,y,12,false,false,doors,g.house?0:14);
 // The four board approaches provide equivalent connected starting points.
 for(const [x,y] of [[800,688],[800,912],[656,800],[944,800]])if(clear(x,y)){queue.push({x,y});seen.add(x+','+y);}
 for(let head=0;head<queue.length;head++){
  const a=queue[head];
  if(Math.hypot(a.x-800,a.y-800)>180 && [0,Math.PI/2,Math.PI,Math.PI*1.5].every(t=>clear(a.x+Math.cos(t)*20,a.y+Math.sin(t)*20)))candidates.push(a);
  for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){
   const x=a.x+dx,y=a.y+dy,key=x+','+y;
   if(x<64||y<64||x>1536||y>1536||seen.has(key))continue;
   seen.add(key);
   if(clear(x,y,true)&&clear(a.x+dx/2,a.y+dy/2,true))queue.push({x,y});
  }
 }
 // Shuffle once at generation, never while rendering or resuming a saved run.
 for(let i=candidates.length-1;i>0;i--){const j=Math.min(i,Math.floor(g.random()*(i+1)));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
 const count=1+Math.min(2,Math.floor(g.random()*3)),theme=LEVEL_SUPPLIES[g.generatedEnvironment]||LEVEL_SUPPLIES.forest;
 g.supplyChests=[];
 for(const a of candidates){
  if(g.supplyChests.some(b=>Math.hypot(a.x-b.x,a.y-b.y)<220))continue;
  g.supplyChests.push({...a,id:'supply:'+g.seed+':'+g.supplyChests.length,opened:false,...theme,potions:1+Math.min(2,Math.floor(g.random()*3)),reward:g.random()<.12?theme.item:null});
  if(g.supplyChests.length>=count)break;
 }
}
export function openSupplyChest(g,p){
 if(p.room||p.hp<=0)return false;
 const chest=(g.supplyChests||[]).filter(c=>!c.opened&&Math.hypot(c.x-p.x,c.y-p.y)<60).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
 if(!chest)return false;
 chest.opened=true;
 g.dropLoot(chest.x+20,chest.y+26,'empty_jar',1,chest.name,true);
 dropIceRecipe(g,p,chest.x,chest.y+25);
 g.dropLoot(chest.x-12,chest.y+20,'potion',chest.potions,chest.name,true);
 if(chest.reward)g.dropLoot(chest.x+15,chest.y+20,chest.reward,1,chest.name,true);
 g.onSound('loot',chest);g.message(chest.name+' opened. Collect the supplies with Interact.');g.persist();return true;
}
export function drawSupplyChest(c,g,a){
 c.save();c.translate(a.x,a.y);c.fillStyle='#0005';c.beginPath();c.ellipse(0,4,24,8,0,0,7);c.fill();
 c.fillStyle='#503c2d';c.fillRect(-20,-20,40,24);c.fillStyle=a.color;c.fillRect(-20,a.opened?-34:-24,40,9);
 c.fillStyle='#a78d54';c.fillRect(-15,-20,4,24);c.fillRect(11,-20,4,24);c.fillStyle=a.opened?'#211d1a':'#ffe29a';c.fillRect(-4,-14,8,8);
 if(!a.opened&&g.players.some(p=>!p.room&&p.hp>0&&Math.hypot(p.x-a.x,p.y-a.y)<70)){
  const text='Open supplies · '+(g.controlLabels?.interact||'E / Y');c.font='9px sans-serif';c.textAlign='center';const w=c.measureText(text).width;c.fillStyle='#102c25ed';c.fillRect(-w/2-5,10,w+10,17);c.fillStyle='#fff0c9';c.fillText(text,0,22);
 }c.restore();
}
