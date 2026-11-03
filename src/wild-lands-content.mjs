export const WILD_LANDS_SITES=[
 {id:'jade-court',name:'Jade Courtyard',x:3300,y:2900,kind:'ruins',item:'potion',qty:2},
 {id:'fern-glade',name:'Fern Glade',x:6500,y:3650,kind:'camp',item:'fruit',qty:4},
 {id:'frost-cache',name:'Frozen Explorer Cache',x:8100,y:5200,kind:'stones',item:'potion',qty:2},
 {id:'cemetery-cache',name:'Forgotten Burial Ground',x:3700,y:6350,kind:'graves',item:'arrow',qty:12},
 {id:'bayou-camp',name:'Reedwatch Camp',x:13200,y:2400,kind:'boardwalk',item:'fruit',qty:4},
 {id:'east-lookout',name:'Eastwood Lookout',x:13700,y:5100,kind:'camp',item:'arrow',qty:12},
 {id:'hearth',name:'The Old Homestead',x:8200,y:7300,kind:'garden',item:'potion',qty:2},
 {id:'driftwood',name:'Driftwood Cove',x:11300,y:8550,kind:'camp',item:'fruit',qty:4},
 {id:'grotto',name:'Crystal Grotto',x:8000,y:4450,kind:'crystals',room:'caverns',item:'potion',qty:2},
 {id:'reliquary',name:'Veil Reliquary',x:8000,y:4450,kind:'stones',room:'shadow',item:'potion',qty:2}
];
function state(t){return t.wildExploration??={discovered:new Set(),opened:new Set(),nextCheck:0};}
export const wildSiteVisible=(d,site)=>(d.activeRoom||null)===(site.room||null);
export function nearbyWildSite(g,p){const t=g.trainTest;if(!t?.design.wildLands||p.trainRide)return null;return WILD_LANDS_SITES.find(s=>wildSiteVisible(t.design,s)&&Math.hypot(p.x-s.x,p.y-s.y)<125)||null;}
export function tickWildLandsContent(g){
 const t=g.trainTest;if(!t?.design.wildLands||t.wildLandsOverview)return;const data=state(t);if(t.time<data.nextCheck)return;data.nextCheck=t.time+.25;
 for(const s of WILD_LANDS_SITES){if(!wildSiteVisible(t.design,s)||data.discovered.has(s.id)||!g.players.some(p=>p.hp>0&&!p.trainRide&&Math.hypot(p.x-s.x,p.y-s.y)<420))continue;
  data.discovered.add(s.id);t.notice='Discovered '+s.name+' · '+data.discovered.size+'/'+WILD_LANDS_SITES.length+' places explored';t.noticeUntil=t.time+4;
 }
}
export function interactWildLandsSite(g,p){
 const s=nearbyWildSite(g,p);if(!s)return false;const t=g.trainTest,data=state(t);
 if(data.opened.has(s.id)){t.notice=s.name+' · supplies already collected';t.noticeUntil=t.time+3;return true;}
 data.opened.add(s.id);data.discovered.add(s.id);g.dropLoot(s.x,s.y+55,s.item,s.qty,s.name+' supplies',false);
 if(s.kind==='camp'||s.kind==='garden')for(const q of g.players)if(Math.hypot(q.x-s.x,q.y-s.y)<250)q.hp=Math.min(q.maxHp||100,q.hp+25);
 t.notice=s.name+' · supplies recovered'+(['camp','garden'].includes(s.kind)?' and a moment of rest':'');t.noticeUntil=t.time+4;g.onSound?.('loot',p);return true;
}
