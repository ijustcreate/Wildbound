import fs from 'node:fs';
import {Game,EVENTS} from '../src/core.mjs';
import {victoryRewards} from '../src/victory-chest.mjs';
import {ITEMS,sellValue} from '../src/items.mjs';
import {selectEvent,rememberEvent} from '../src/event-director.mjs';
import {eventAvailable} from '../src/night-cycle.mjs';
import {encounterRole} from '../src/expedition-trials.mjs';
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const scenarios=[];
for(const partySize of [1,2,4,6])for(const veteran of [false,true])for(const cleared of [0,4,8,16]){
 const players=Array.from({length:partySize},()=>({level:veteran?12:1,equipment:{hand1:veteran?'moon_bow':'starter_bow'}}));
 let gold=0,gear=0,legends=0,arrows=0;
 for(let seed=1;seed<=100;seed++)for(const item of victoryRewards(players,rng(seed),{score:cleared*1.5,cleared,skipped:16-cleared})){
  gold+=sellValue(item.type)*item.qty;gear+=!!ITEMS[item.type].slot;legends+=ITEMS[item.type].rarity==='legendary';if(item.type==='arrow')arrows+=item.qty;
 }
 scenarios.push({partySize,veteran,cleared,meanSaleValue:gold/100,meanGear:gear/100,meanLegendary:legends/100,meanArrows:arrows/100});
}
const coverage=[];
for(const zone of ['forest','ice','desert','house','temple','graveyard','beach']){
 const g=new Game(rng(101));g.seed=101;g.environment=zone;g.addPlayer('keyboard');g.start();g.openingBoard=false;
 const seen=new Set(),roles={};for(let i=0;i<70;i++){g.players[0].progress=Math.min(48,i*2);const index=selectEvent(g,EVENTS,eventAvailable);if(index===null)break;const e=EVENTS[index];rememberEvent(g,e,index);seen.add(e.name);const role=encounterRole(e);roles[role]=(roles[role]||0)+1;}
 coverage.push({zone,distinctCards:seen.size,roles});
}
const report={method:'100 seeded reward samples per scenario; director draws against actual biome availability. This is a deterministic economy/coverage audit, not human combat playtesting.',starterWeaponSaleTotal:Object.keys(ITEMS).filter(id=>id.startsWith('starter_')&&ITEMS[id].slot).reduce((n,id)=>n+sellValue(id),0),scenarios,coverage};
fs.mkdirSync('test-output/polish',{recursive:true});fs.writeFileSync('test-output/polish/balance.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({scenarios:scenarios.length,seedsPerScenario:100,coverage,starterWeaponSaleTotal:report.starterWeaponSaleTotal},null,2));
