import {spellTransition} from './portal-transition.mjs';
import {inDiagon,switchAlleyLayer} from './diagon-alley.mjs';
import {inDiagonArena} from './diagon-arena-layout.mjs';
import {leaveDiagonArena} from './diagon-arena.mjs';
import {nativeWildTile,nearbyNativeBayouShrine} from './wild-native-biomes.mjs';
import {WILD_LANDS_SITES} from './wild-lands-content.mjs';
import {EAST_WILDS_WIDTH,HOLLOW_ROOM,HOLLOW_GATE,HOLLOW_EXIT,HOLLOW_ARRIVAL,hollowSurface,mountainLand,mountainSurface,mountainTerrainBlocked} from './wild-mountain-layout.mjs';
import {greywakeShoreAt} from './wild-mountain-shore.mjs';
import {sketchBiome,sketchGround,sketchSurface,sketchSurfaceAt} from './wild-lands-geography.mjs';
import {WILDS_OVERLOOK,inOverlookGround} from './overlook-maze-layout.mjs';
import {clearPirateRide} from './pirate-ship.mjs';
import {QUIDDITCH_ROOM} from './quidditch-layout.mjs';
import {inQuidditch,leaveQuidditchPitch} from './quidditch-scene.mjs';
import {wildHomesteadAt,wildHomesteadPoolAt} from './wild-homestead-layout.mjs';
import {gardenPondContains} from './diagon-garden-layout.mjs';
import {TIDEGLASS_BLOCKERS,tideglassGround,tideglassSurface} from './tideglass-layout.mjs';
// The user's landscape sketch, expressed in world coordinates (Classic is 1600²).
export const WILD_LANDS_WIDTH=EAST_WILDS_WIDTH,WILD_LANDS_HEIGHT=9600;
export const WILD_LANDS_STOPS=[
 {id:'jungle',name:'Jungle Ruins',x:3000,y:1850},
 {id:'ice',name:'Frostmere',x:8200,y:4300},
 {id:'swamp',name:'Bayou',x:13200,y:1850},
 {id:'east',name:'East Forest',x:14000,y:4900},
 {id:'beach',name:'South Beach',x:12800,y:7800},
 {id:'house',name:'Homestead',x:8000,y:7800},
 {id:'graveyard',name:'Cemetery',x:3300,y:7800},
 {id:'west',name:'West Beach',x:1900,y:4400}
];
export const WILD_LANDS_GATES=[{id:'caverns',name:'Caverns',x:3900,y:6600},{id:'shadow',name:'Shadow Realm',x:14600,y:8500},HOLLOW_GATE];
export const WILD_LANDS_EXIT={x:8000,y:5600};
export const wildHash=(x,y)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
export const wildLandsBiome=sketchBiome;
export function wildLandsSurface(d,x,y){
 if(d.activeRoom==='diagon')return gardenPondContains(x,y)?'water':'grass';
 if(d.activeRoom===QUIDDITCH_ROOM)return 'grass';
 if(d.activeRoom===HOLLOW_ROOM){const surface=hollowSurface(x,y);return surface==='void'?'water':surface;}
 if(d.activeRoom)return x>6500&&x<9500&&y>3900&&y<5900?'grass':'water';
 if(wildHomesteadPoolAt(d,x,y))return 'water';
 if(d.wildStops?.some(s=>Math.abs(x-s.x)<580&&y>s.y-390&&y<s.y+100))return 'grass';
 const mountain=mountainSurface(x,y);
 return mountain==='grass'?mountain:tideglassSurface(x,y)||mountain||sketchSurface(x,y);
}
export function wildLandsSurfaceAt(d,x,y){
 if(d.activeRoom==='diagon')return gardenPondContains(x,y)?'water':'grass';
 if(d.activeRoom===QUIDDITCH_ROOM)return 'grass';
 if(d.activeRoom===HOLLOW_ROOM){const surface=hollowSurface(x,y);return surface==='void'?'water':surface;}
 if(d.activeRoom)return x>6500&&x<9500&&y>3900&&y<5900?'grass':'water';
 if(wildHomesteadPoolAt(d,x,y))return 'water';
 if(d.wildStops?.some(s=>Math.abs(x-s.x)<580&&y>s.y-390&&y<s.y+100))return 'grass';
 const mountain=mountainSurface(x,y);
 return mountain==='grass'?mountain:tideglassSurface(x,y)||mountain||sketchSurfaceAt(x,y);
}
export function wildLandsGround(d,x,y){
 if(d.activeRoom)return d.activeRoom==='shadow'?'shadow':'caverns';
 if(greywakeShoreAt(x,y)==='sand')return 'beach';
 if(mountainLand(x,y))return 'mountain';
 if(d.wildLands&&(inOverlookGround(WILDS_OVERLOOK,x,y)||wildHomesteadAt(d,x,y)))return 'house';
 return tideglassGround(x,y)||sketchGround(x,y);
}
export function wildLandsTravel(g,id){
 const t=g.trainTest;if(!t?.design.wildLands)return {ok:false,message:'Enter The Wild Lands first.'};
 const stop=(t.design.wildStops||WILD_LANDS_STOPS).find(s=>s.id===id)||WILD_LANDS_GATES.find(s=>s.id===id)||WILD_LANDS_SITES.find(s=>s.id===id&&!s.room);
 if(!stop)return {ok:false,message:'Unknown destination.'};
 if(inQuidditch(g)&&!leaveQuidditchPitch(g))return {ok:false,message:'Return to Diagon Alley through the Portkey first.'};
 if(inDiagonArena(g)&&!leaveDiagonArena(g))return {ok:false,message:'Return to Diagon Alley through the vault stairs first.'};
 if(inDiagon(g))switchAlleyLayer(g,null);
 else switchWildLandsLayer(g,null);
 t.wildLandsOverview=false;
 for(const [i,p]of g.players.entries()){
  clearPirateRide(p);
  delete p.mountainDescent;
  delete p.trainRide;Object.assign(p,{x:stop.x+i*35,y:stop.y-120,swimming:false,underBridge:false,trainDeck:false,trainGround:0,jumpHeight:0,jumpVelocity:0,ui:null});
 }
 spellTransition(g);return {ok:true,message:'Arrived at '+stop.name+(stop.id==='jungle'?' · an enchanted brick wall waits beside the station.':'.')};
}
function nearbyWildGate(g,p){
 const t=g.trainTest,d=t?.design;
 if(!d?.wildLands||p.trainRide||p.pirateRide||inDiagon(g))return null;
 if(d.activeRoom){
  const exit=d.activeRoom===HOLLOW_ROOM?HOLLOW_EXIT:WILD_LANDS_EXIT;
  if(d.activeRoom===HOLLOW_ROOM&&g.players.some(q=>q.pirateRide))return null;
  return t.wildLandsReturn&&Math.hypot(p.x-exit.x,p.y-exit.y)<=(exit===HOLLOW_EXIT?84:130)?exit:null;
 }
 if(g.players.some(q=>q.trainRide||q.pirateRide))return null;
 const gate=WILD_LANDS_GATES.find(s=>Math.hypot(s.x-p.x,s.y-p.y)<(s===HOLLOW_GATE?105:150));
 if(gate||p.swimming||p.underBridge)return gate??null;
 const shrine=nearbyNativeBayouShrine(t,p.x,p.y);
 return shrine&&{id:'caverns',name:'Bayou Caverns',entrance:shrine.id,x:p.x,y:p.y};
}
export function wildLandsGatePrompt(g,p){
 const gate=nearbyWildGate(g,p);
 return gate===HOLLOW_EXIT?'LEAVE SMUGGLERS’ HOLLOW':gate===WILD_LANDS_EXIT?'RETURN TO THE WILD LANDS':gate?'ENTER '+gate.name.toUpperCase():'';
}
const roomActors=['enemies','loot','pickups','baits','spells','arrows','traps','effects','xpOrbs','ghosts','villageFollowers','boomerangs','rifleShots'];
function currentActors(g){return Object.fromEntries(roomActors.map(key=>[key,g[key]||[]]));}
function crossHollow(g,t,entering){
 const saved=entering?'hollowSurfaceActors':'hollowActors',incoming=entering?'hollowActors':'hollowSurfaceActors';
 t[saved]=currentActors(g);
 Object.assign(g,t[incoming]||Object.fromEntries(roomActors.map(key=>[key,[]])));
 delete t[incoming];
}
function crossBiomeRoom(g,t,room,entering){
 const layers=t.wildBiomeRoomActors??={};
 const outside='surface',saved=entering?outside:room,incoming=entering?room:outside;
 // Old saves may already be inside a chamber with no saved surface layer.
 if(!entering&&!layers[incoming])return;
 layers[saved]=currentActors(g);
 Object.assign(g,layers[incoming]||Object.fromEntries(roomActors.map(key=>[key,[]])));
 delete layers[incoming];
}
export function switchWildLandsLayer(g,room){
 const t=g.trainTest,previous=t.design.activeRoom||null;
 if(previous===(room||null))return;
 if(previous===HOLLOW_ROOM)crossHollow(g,t,false);
 else if(previous==='caverns'||previous==='shadow')crossBiomeRoom(g,t,previous,false);
 if(room===HOLLOW_ROOM)crossHollow(g,t,true);
 else if(room==='caverns'||room==='shadow')crossBiomeRoom(g,t,room,true);
 t.design.activeRoom=room||undefined;
}
export function wildLandsInteract(g,p){
 const gate=nearbyWildGate(g,p);
 if(!gate)return false;
 const t=g.trainTest;
 if(gate===WILD_LANDS_EXIT||gate===HOLLOW_EXIT){
  const outside=t.wildLandsReturn;
  switchWildLandsLayer(g,null);spellTransition(g);
  for(const [i,q]of g.players.entries()){
   const entry=outside.entryPoints?.find(point=>point.id===q.id);
   const position=entry??(outside.entrance?{x:outside.x+i*19,y:outside.y}:{
    x:outside.x+(gate===HOLLOW_EXIT?i*19:i*35),y:outside.y+(gate===HOLLOW_EXIT?-25:180),
   });
   Object.assign(q,{x:position.x,y:position.y,swimming:false,trainGround:0});
  }
  g.persist?.();
  return true;
 }
 t.wildLandsReturn=gate.entrance?{...gate,entryPoints:g.players.map(({id,x,y})=>({id,x,y}))}:gate;
 const hollow=gate===HOLLOW_GATE,arrival=hollow?HOLLOW_ARRIVAL:{x:8000,y:5450};
 switchWildLandsLayer(g,gate.id);spellTransition(g);
 for(const [i,q]of g.players.entries())Object.assign(q,{x:arrival.x+i*(hollow?19:35),y:arrival.y,swimming:false,underBridge:false,trainGround:0,jumpHeight:0});
 g.persist?.();
 return true;
}

export function wildLandsBlocked(d,x,y,t=null,radius=0){
 if(!d.activeRoom&&x>15520&&x<17200&&TIDEGLASS_BLOCKERS.some(s=>((x-s.x)/(s.rx+radius))**2+((y-s.y)/(s.ry+radius))**2<1))return true;
 if(d.activeRoom===HOLLOW_ROOM||!d.activeRoom)return mountainTerrainBlocked(d,x,y,radius);
 return x<6530||x>9470||y<3930||y>5870||!!(t&&nativeWildTile(t,x,y)?.endsWith('_void'));
}
