import {drawTorchFlame} from './torch-flame.mjs';
import {visibleSurfaceItems} from './house-surfaces.mjs';
export const isHouseLight=f=>!f.destroyed&&['lamp','ceiling_light'].includes(f.kind);
export function houseLightOn(g,f){const t=((g.sky?.elapsed||0)%480+480)%480;return f.lightMode==='on'||f.lightMode!=='off'&&t>=280&&t<460;}
const templeTorchSpots=g=>{
 if(g.generatedEnvironment!=='temple')return [];
 const walls=g.house?.walls||[],spots=[];
 for(const w of walls){
  if(w.kind==='window'||w.kind==='fence'||Math.max(w.w,w.h)<140)continue;
  const horizontal=w.w>=w.h,length=horizontal?w.w:w.h,count=Math.max(1,Math.floor(length/170));
  for(let i=0;i<count;i++){const t=(i+1)/(count+1);spots.push({id:`${w.x}:${w.y}:${i}`,x:horizontal?w.x+w.w*t:w.x+w.w/2,y:horizontal?w.y+w.h/2:w.y+w.h*t});}
 }
 if(!spots.length)for(const [i,[x,y]]of [[528,520],[1072,520],[528,1060],[1072,1060]].entries())spots.push({id:`fallback:${i}`,x,y});
 return spots;
};
export function templeLightOn(g,t){const current=((g.sky?.elapsed||0)%480+480)%480;return t.lightMode==='on'||t.lightMode!=='off'&&current>=280&&current<460;}
export function templeLightSources(g){return templeTorchSpots(g).filter(t=>templeLightOn(g,t)).map(t=>{
 const wall=(g.house?.walls||[]).find(w=>t.x>=w.x&&t.x<=w.x+w.w&&t.y>=w.y&&t.y<=w.y+w.h);
 // The flame sits on an exposed face, not inside the opaque wall volume.
 const horizontal=wall&&wall.w>=wall.h;
 return {x:t.x+(wall&&!horizontal?wall.w/2+2:0),y:t.y+(wall&&horizontal?wall.h/2+2:0),height:18,radius:190,intensity:.9,color:'#ffc76f'};
});}
export function houseLightSources(g){return [
 ...(g.house?.furniture||[]).filter(f=>isHouseLight(f)&&houseLightOn(g,f)).map(f=>({x:f.x+f.w/2,y:f.y+f.h/2,height:f.lightHeight||(f.kind==='ceiling_light'?70:32),radius:Math.max(40,Math.min(400,Number(f.lightRadius)||200)),intensity:.95,color:f.kind==='ceiling_light'?'#ffe2ad':'#ffd19b',houseFixture:true})),
 ...(g.house?.furniture||[]).filter(f=>!f.destroyed).flatMap(f=>visibleSurfaceItems(g,f).filter(p=>p.kind==='candle'&&p.lit).map(p=>({x:f.x+f.w*(p.u??.5),y:f.y+f.h*(p.v??.5),height:25,radius:105,intensity:.65,color:'#ffbf78',houseFixture:true}))),
 ...templeLightSources(g),
];}
export function toggleHouseLight(g,p){
 const f=(g.house?.furniture||[]).filter(isHouseLight).find(f=>Math.hypot(p.x-f.x-f.w/2,p.y-f.y-f.h/2)<65);if(!f)return false;
 f.lightMode=houseLightOn(g,f)?'off':'on';g.message('House light '+(f.lightMode==='off'?'off':'on')+'.');g.persist();return true;
}
export function toggleTempleLight(g,p){
 const t=templeTorchSpots(g).find(q=>Math.hypot(p.x-q.x,p.y-q.y)<65);if(!t)return false;
 t.lightMode=templeLightOn(g,t)?'off':'on';g.message('Temple torch '+(t.lightMode==='off'?'off':'on')+'.');g.persist();return true;
}
export function toggleWorldLight(g,p){return toggleHouseLight(g,p)||toggleTempleLight(g,p);}
export function drawHouseLights(c,g){
 for(const f of g.house?.furniture||[]){if(!isHouseLight(f))continue;const x=f.x+f.w/2,y=f.y+f.h/2,on=houseLightOn(g,f);c.save();c.fillStyle=on?'#ffe8a6':'#6a6956';c.fillRect(x-5,y-12,10,8);if(g.players.some(p=>!p.room&&Math.hypot(p.x-x,p.y-y)<65)){c.font='9px sans-serif';c.textAlign='center';c.fillStyle='#ebdfaf';c.fillText('Interact · light '+(on?'off':'on'),x,y-22);}c.restore();}
 for(const t of templeTorchSpots(g)){const on=templeLightOn(g,t);c.save();c.fillStyle='#5a4634';c.fillRect(t.x-2,t.y-7,4,8);c.fillStyle=on?'#ffd174':'#6a6956';c.fillRect(t.x-3,t.y-10,6,4);if(on)drawTorchFlame(c,t.x,t.y-11,g.time||0,t.id);const p=(g.players||[]).find(p=>!p.room&&Math.hypot(p.x-t.x,p.y-t.y)<65);if(p){c.font='9px sans-serif';c.textAlign='center';c.fillStyle='#ebdfaf';c.fillText('Interact · torch '+(on?'off':'on'),t.x,t.y-24);}c.restore();}
}
