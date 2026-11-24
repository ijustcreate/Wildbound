import {boundlessTerrainAt} from './boundless-world.mjs';
import {nativeWildTile} from './wild-native-biomes.mjs';
import {wildLandsGround,wildLandsSurface} from './wild-lands-world.mjs';
import {wildLandsPathAt} from './wild-lands-geography.mjs';

const meltWorlds=new WeakMap();
const MELT_LIFE=11,MELT_LIMIT=128;

export function snowGroundAt(g,x,y){
 const t=g.trainTest;
 if(t){
  const d=t.design;
  return d.wildLands&&!d.activeRoom&&wildLandsGround(d,x,y)==='ice'&&wildLandsSurface(d,x,y)==='grass'&&
   !wildLandsPathAt(x,y)&&nativeWildTile(t,x,y)==='snow';
 }
 if(g.generatedEnvironment!=='ice')return false;
 const tx=Math.floor(x/32),ty=Math.floor(y/32);
 if(tx>=0&&ty>=0&&tx<50&&ty<50)return g.terrain?.[ty*50+tx]==='snow';
 return g.mapMode==='boundless'&&boundlessTerrainAt(g,tx,ty)==='snow';
}

function meltState(g){
 const key=g.trainTest||g,terrain=g.trainTest?.design||g.terrain;
 let state=meltWorlds.get(key);
 if(state&&(state.terrain!==terrain||g.time<state.time)){meltWorlds.delete(key);state=null;}
 return state;
}

export function meltSnowAt(g,x,y,radius=7){
 if(!snowGroundAt(g,x,y))return false;
 const time=g.time||0;
 let state=meltState(g);
 if(!state){state={terrain:g.trainTest?.design||g.terrain,time,patches:new Map()};meltWorlds.set(g.trainTest||g,state);}
 state.time=time;
 const cellX=Math.floor(x/12),cellY=Math.floor(y/12),key=cellX+':'+cellY;
 const old=state.patches.get(key);
 if(old&&old.radius>=radius&&time-old.time<.28)return true;
 const tx=Math.floor(x/32),ty=Math.floor(y/32),tiles=[];
 for(let yy=ty-1;yy<=ty+1;yy++)for(let xx=tx-1;xx<=tx+1;xx++){
  if(x+radius<xx*32||x-radius>xx*32+32||y+radius<yy*32||y-radius>yy*32+32)continue;
  if(snowGroundAt(g,xx*32+16,yy*32+16))tiles.push([xx*32,yy*32]);
 }
 state.patches.delete(key);
 if(state.patches.size>=MELT_LIMIT)state.patches.delete(state.patches.keys().next().value);
 state.patches.set(key,{x:Math.round(x),y:Math.round(y),time,radius,tiles});
 return true;
}

export function drawSnowMelt(c,g,visible=()=>true){
 const state=meltState(g);
 if(!state||g.trainTest?.design.activeRoom)return;
 for(const patch of state.patches.values()){
  const age=g.time-patch.time;
  if(age<0||age>=MELT_LIFE||!patch.tiles.length||!visible(patch))continue;
  const {x,y,radius,tiles}=patch;
  c.save();c.globalAlpha*=Math.min(1,(MELT_LIFE-age)/3);
  c.beginPath();for(const [tx,ty]of tiles)c.rect(tx,ty,32,32);c.clip();
  for(let dy=-Math.round(radius*.6);dy<=Math.round(radius*.6);dy++){
   const side=Math.floor(Math.sqrt(Math.max(0,1-(dy/(radius*.7))**2))*radius)-(Math.abs(x+y+dy)%3);
   if(side<2)continue;
   c.fillStyle=dy<=0?'#a0bdc6':'#f3f9f5';c.fillRect(x-side-1,y+dy,side*2+2,1);
   c.fillStyle=dy<=0?'#688493':'#7d949f';c.fillRect(x-side+1,y+dy,side*2-2,1);
  }
  c.fillStyle='#adc3c9';c.fillRect(x-Math.round(radius*.44),y-1,Math.round(radius*.65),1);
  c.fillRect(x+1,y+2,Math.max(1,Math.round(radius*.35)),1);
  c.restore();
 }
}
