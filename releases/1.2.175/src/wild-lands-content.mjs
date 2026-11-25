import {HOLLOW_ROOM} from './wild-mountain-layout.mjs';
import {give,ITEMS} from './items.mjs';
import {emitGameplayFx} from './gameplay-fx.mjs';
import {WILD_SLIME_HOLLOW} from './wild-slime-hollow-site.mjs';
import {MOONVEIL_CIRCLE} from './wild-runic-sanctuary-site.mjs';
import {WILD_COASTAL_SITES} from './wild-coastal-sites.mjs';

export const VEIL_GLAIVE_CHEST=Object.freeze({
 id:'veil-glaive-chest',name:'Veilkeeper’s Chest',x:8816,y:5370,kind:'glaive-chest',room:'shadow',item:'glaive',qty:1,reach:70
});

export const WILD_LANDS_SITES=[
 {id:'jade-court',name:'Jade Courtyard',x:3300,y:2900,kind:'ruins',item:'potion',qty:2},
 {id:'fern-glade',name:'Fern Glade',x:6500,y:3650,kind:'camp',item:'fruit',qty:4},
 {id:'frost-cache',name:'Frozen Explorer Cache',x:8100,y:5200,kind:'stones',item:'potion',qty:2},
 {id:'cemetery-cache',name:'Forgotten Burial Ground',x:3700,y:6350,kind:'graves',item:'arrow',qty:12},
 {id:'bayou-camp',name:'Reedwatch Camp',x:13200,y:2400,kind:'boardwalk',item:'fruit',qty:4},
 {id:'east-lookout',name:'Eastwood Lookout',x:13700,y:5100,kind:'camp',item:'arrow',qty:12},
 WILD_SLIME_HOLLOW,
 MOONVEIL_CIRCLE,
 {id:'hearth',name:'The Old Homestead',x:8580,y:7456,kind:'garden',item:'potion',qty:2},
 {id:'driftwood',name:'Driftwood Cove',x:11300,y:8550,kind:'camp',item:'fruit',qty:4},
 {id:'grotto',name:'Crystal Grotto',x:8000,y:4450,kind:'crystals',room:'caverns',item:'potion',qty:2},
 {id:'reliquary',name:'Veil Reliquary',x:8000,y:4450,kind:'stones',room:'shadow',item:'potion',qty:2},
 VEIL_GLAIVE_CHEST,
 {id:'greywake-summit',name:'Greywake Summit',x:17900,y:6500,kind:'lookout',item:'potion',qty:3},
 ...WILD_COASTAL_SITES,
 {id:'hollow-cache',name:'Smuggler’s Cache',x:8570,y:5500,kind:'wreck-cache',room:HOLLOW_ROOM,item:'stamina_potion',qty:3},
];
function state(t){return t.wildExploration??={discovered:new Set(),opened:new Set(),nextCheck:0};}
export const wildSiteVisible=(d,site)=>(d.activeRoom||null)===(site.room||null);
export function nearbyWildSite(g,p){const t=g.trainTest;if(!t?.design.wildLands||p.trainRide||t.design.activeRoom==='diagon')return null;return WILD_LANDS_SITES.find(s=>s.item&&wildSiteVisible(t.design,s)&&(s!==VEIL_GLAIVE_CHEST||p.hp>0&&!p.room&&!p.swimming&&!p.broomMount)&&Math.hypot(p.x-s.x,p.y-s.y)<(s.reach??125))||null;}
export function tickWildLandsContent(g){
 const t=g.trainTest;if(!t?.design.wildLands||t.wildLandsOverview)return;const data=state(t);if(t.time<data.nextCheck)return;data.nextCheck=t.time+.25;
 for(const s of WILD_LANDS_SITES){if(!wildSiteVisible(t.design,s)||data.discovered.has(s.id)||!g.players.some(p=>p.hp>0&&!p.trainRide&&Math.hypot(p.x-s.x,p.y-s.y)<420))continue;
  data.discovered.add(s.id);t.notice='Discovered '+s.name+' · '+data.discovered.size+'/'+WILD_LANDS_SITES.length+' places explored';t.noticeUntil=t.time+4;
 }
}
export function interactWildLandsSite(g,p){
 const s=nearbyWildSite(g,p);if(!s)return false;const t=g.trainTest,data=state(t);
 if(data.opened.has(s.id)){t.notice=s.name+' · supplies already collected';t.noticeUntil=t.time+3;return true;}
 if(s===VEIL_GLAIVE_CHEST){
  if(!ITEMS[s.item])return false;
  if(!give(p.inventory,s.item,s.qty)){
   t.notice='Make room in your backpack for the Glaive.';t.noticeUntil=t.time+4;return true;
  }
  data.opened.add(s.id);data.discovered.add(s.id);
  emitGameplayFx(g,'chest',{x:s.x,y:s.y});
  t.notice='You found the Glaive.';t.noticeUntil=t.time+4;
  g.onSound?.('chestOpen',s);g.persist?.();return true;
 }
 data.opened.add(s.id);data.discovered.add(s.id);g.dropLoot(s.x,s.y+55,s.item,s.qty,s.name+' supplies',false);
 if(s.kind==='camp'||s.kind==='garden')for(const q of g.players)if(Math.hypot(q.x-s.x,q.y-s.y)<250)q.hp=Math.min(q.maxHp||100,q.hp+25);
 t.notice=s.name+' · supplies recovered'+(['camp','garden'].includes(s.kind)?' and a moment of rest':'');t.noticeUntil=t.time+4;g.onSound?.('loot',p);return true;
}
