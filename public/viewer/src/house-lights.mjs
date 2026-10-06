export const isHouseLight=f=>['lamp','ceiling_light'].includes(f.kind);
export function houseLightOn(g,f){const t=((g.sky?.elapsed||0)%480+480)%480;return f.lightMode==='on'||f.lightMode!=='off'&&t>=280&&t<460;}
export function houseLightSources(g){return (g.house?.furniture||[]).filter(f=>isHouseLight(f)&&houseLightOn(g,f)).map(f=>({x:f.x+f.w/2,y:f.y+f.h/2,radius:Math.max(40,Math.min(400,Number(f.lightRadius)||160)),intensity:.95,color:'#ffd58a'}));}
export function toggleHouseLight(g,p){
 const f=(g.house?.furniture||[]).filter(isHouseLight).find(f=>Math.hypot(p.x-f.x-f.w/2,p.y-f.y-f.h/2)<65);if(!f)return false;
 f.lightMode=houseLightOn(g,f)?'off':'on';g.message('House light '+(f.lightMode==='off'?'off':'on')+'.');g.persist();return true;
}
export function drawHouseLights(c,g){
 for(const f of g.house?.furniture||[]){if(!isHouseLight(f))continue;const x=f.x+f.w/2,y=f.y+f.h/2,on=houseLightOn(g,f);c.save();c.fillStyle=on?'#ffe8a6':'#6a6956';c.fillRect(x-5,y-12,10,8);if(g.players.some(p=>!p.room&&Math.hypot(p.x-x,p.y-y)<65)){c.font='9px sans-serif';c.textAlign='center';c.fillStyle='#ebdfaf';c.fillText('Interact · light '+(on?'off':'on'),x,y-22);}c.restore();}
}
