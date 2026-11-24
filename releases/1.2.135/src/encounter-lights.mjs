import {encounterRole} from './expedition-trials.mjs';
import {encounterCampfires} from './encounter-layout-data.mjs';

const palette=Object.freeze({
 anaconda:'#94d96a',banshee_queen:'#a8c9ff',dragon:'#ff8a4d',
 grim_reaper:'#88c8ee',skeleton_boss:'#c2a2ff',necromancer:'#bd8aff',
 succubus:'#ff8abb',beholder:'#d28aff',krampus:'#ff7658',
 gorilla:'#e6bd72',dreadmane_lion:'#e6bd72',hunter:'#d3a56f',
});
const validColor=value=>typeof value==='string'&&/^#[\da-f]{6}$/i.test(value);

// A few graveyard bosses carry small, colored lights that reach actors and the
// cemetery fog. They follow active encounters and vanish with the boss.
export function encounterLightSources(game,room=null){
 if(!room&&game?.generatedEnvironment==='forest')return encounterCampfires(game).map(fire=>({
  x:fire.x,y:fire.y,height:20,radius:150,intensity:.91,color:'#ffad4c',owner:`camp:${fire.id}`,
 }));
 if(room||game?.generatedEnvironment!=='graveyard'||!(game.eventTime>0))return [];
 const bosses=(game.enemies||[]).filter(e=>e.hp>0&&!e.wildlife&&!e.room&&encounterRole(e)==='boss');
 const party=game.players||[];
 bosses.sort((a,b)=>Math.min(...party.map(p=>Math.hypot(a.x-p.x,a.y-p.y)),Infinity)-Math.min(...party.map(p=>Math.hypot(b.x-p.x,b.y-p.y)),Infinity));
 return bosses.slice(0,2).map((boss,index)=>({
  x:boss.x,y:boss.y-(boss.height||24)*.35,height:boss.lightHeight||38,
  radius:boss.lightRadius||156,
  intensity:.58+Math.sin((game.time||0)*4+(boss.id||index))*0.035,
  color:validColor(boss.encounterLightColor)?boss.encounterLightColor:palette[boss.kind]||'#93b9ff',
  owner:`encounter-boss:${boss.id??boss.kind}:${index}`,
  encounterAura:true,
 }));
}
