import {HOLLOW_ROOM,hollowSurface} from './wild-mountain-layout.mjs';
import {ceilingHazardTarget,tickCeilingHazards} from './ceiling-hazards.mjs';
import {drawRealmCeilingHazard} from './realm-art.mjs';

const SITES=[[8030,5450],[7760,5357],[7380,5070],[7970,4676],[8840,5335]];
const eligible=p=>ceilingHazardTarget(p)&&!p.pirateRide&&!p.trainRide&&!p.broomMount&&!p.wingHover&&!p.swimming&&!p.spectator&&
 !p.disconnected&&!p.lobbyDisconnected&&!p.unavailable&&hollowSurface(p.x,p.y)==='grass';

export function tickHollowStalactites(g,dt){
 const t=g.trainTest;
 if(t?.design.activeRoom!==HOLLOW_ROOM||g.phase!=='play')return;
 const hazards=t.hollowStalactites??=SITES.map(([x,rootY],index)=>({id:`hollow-stalactite-${index+1}`,x,rootY,y:rootY,
  kind:'ceiling_stalactite',hazardState:'idle',warning:1.6,damage:5,room:null}));
 tickCeilingHazards(g,hazards,dt,g.players.filter(eligible));
}

export function drawHollowStalactites(c,g,visible){
 for(const p of g.trainTest.hollowStalactites||[])if(p.hazardState==='warning'&&visible(p,110))drawRealmCeilingHazard(c,g,p);
}
