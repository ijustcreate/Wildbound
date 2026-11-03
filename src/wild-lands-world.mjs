import {nativeWildTile} from './wild-native-biomes.mjs';
import {WILD_LANDS_SITES} from './wild-lands-content.mjs';
import {sketchBiome,sketchGround,sketchSurface,sketchSurfaceAt} from './wild-lands-geography.mjs';
// The user's landscape sketch, expressed in world coordinates (Classic is 1600²).
export const WILD_LANDS_WIDTH=16000,WILD_LANDS_HEIGHT=9600;
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
export const WILD_LANDS_GATES=[{id:'caverns',name:'Caverns',x:3900,y:6600},{id:'shadow',name:'Shadow Realm',x:14600,y:8500}];
export const wildHash=(x,y)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
export const wildLandsBiome=sketchBiome;
export function wildLandsSurface(d,x,y){
 if(d.activeRoom)return x>6500&&x<9500&&y>3900&&y<5900?'grass':'water';
 if(d.wildStops?.some(s=>Math.abs(x-s.x)<580&&y>s.y-390&&y<s.y+100))return 'grass';
 return sketchSurface(x,y);
}
export function wildLandsSurfaceAt(d,x,y){
 if(d.activeRoom)return x>6500&&x<9500&&y>3900&&y<5900?'grass':'water';
 if(d.wildStops?.some(s=>Math.abs(x-s.x)<580&&y>s.y-390&&y<s.y+100))return 'grass';
 return sketchSurfaceAt(x,y);
}
export function wildLandsGround(d,x,y){
 if(d.activeRoom)return d.activeRoom==='shadow'?'shadow':'caverns';
 return sketchGround(x,y);
}
export function wildLandsTravel(g,id){
 const t=g.trainTest;if(!t?.design.wildLands)return {ok:false,message:'Enter The Wild Lands first.'};
 const stop=(t.design.wildStops||WILD_LANDS_STOPS).find(s=>s.id===id)||WILD_LANDS_GATES.find(s=>s.id===id)||WILD_LANDS_SITES.find(s=>s.id===id&&!s.room);
 if(!stop)return {ok:false,message:'Unknown destination.'};
 delete t.design.activeRoom;t.wildLandsOverview=false;
 for(const [i,p]of g.players.entries()){
  delete p.trainRide;Object.assign(p,{x:stop.x+i*35,y:stop.y-120,swimming:false,underBridge:false,trainDeck:false,trainGround:0,jumpHeight:0,jumpVelocity:0,ui:null});
 }
 return {ok:true,message:'Arrived at '+stop.name+'.'};
}
export function wildLandsInteract(g,p){
 const t=g.trainTest,d=t.design;if(!d.wildLands||p.trainRide)return false;
 if(d.activeRoom){if(Math.hypot(p.x-8000,p.y-5600)>130)return false;const gate=t.wildLandsReturn;delete d.activeRoom;for(const [i,q]of g.players.entries())Object.assign(q,{x:gate.x+i*35,y:gate.y+180,swimming:false,trainGround:0});return true;}
 const gate=WILD_LANDS_GATES.find(s=>Math.hypot(s.x-p.x,s.y-p.y)<150);if(!gate||g.players.some(q=>q.trainRide))return false;
 t.wildLandsReturn=gate;d.activeRoom=gate.id;
 for(const [i,q]of g.players.entries())Object.assign(q,{x:8000+i*35,y:5450,swimming:false,underBridge:false,trainGround:0,jumpHeight:0});
 return true;
}

export function wildLandsBlocked(d,x,y,t=null){
 if(d.activeRoom)return x<6530||x>9470||y<3930||y>5870||!!(t&&nativeWildTile(t,x,y)?.endsWith('_void'));
 return false;
}
