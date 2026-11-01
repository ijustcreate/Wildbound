// The user's landscape sketch, expressed in world coordinates (Classic is 1600²).
export const WILD_LANDS_WIDTH=16000,WILD_LANDS_HEIGHT=9600;
export const WILD_LANDS_STOPS=[
 {id:'jungle',name:'Jungle Ruins',x:3000,y:1850},
 {id:'ice',name:'Frostmere',x:8200,y:3200},
 {id:'swamp',name:'Bayou',x:13200,y:1850},
 {id:'east',name:'East Forest',x:14000,y:4900},
 {id:'beach',name:'South Beach',x:12800,y:7800},
 {id:'house',name:'Homestead',x:8000,y:7800},
 {id:'graveyard',name:'Cemetery',x:3300,y:7800},
 {id:'west',name:'West Beach',x:1900,y:4400}
];
export const WILD_LANDS_GATES=[{id:'caverns',name:'Caverns',x:3900,y:6600},{id:'shadow',name:'Shadow Realm',x:14600,y:8500}];
export const wildHash=(x,y)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
export function wildLandsBiome(x,y){
 if(x<5600&&y<3200)return 'jungle';
 if(x>10300&&y<3400)return 'swamp';
 if(((x-8200)/2100)**2+((y-4700)/1700)**2<1)return 'ice';
 if(x>1750&&x<5300&&y>4500&&y<8200)return 'graveyard';
 if(x>6500&&x<10000&&y>6800&&y<8600)return 'house';
 return 'forest';
}
export function wildLandsSurface(d,x,y){
 if(d.activeRoom)return x>6500&&x<9500&&y>3900&&y<5900?'grass':'water';
 const u=x/d.width,v=y/d.height;
 const island=((u-.50)/.485)**4+((v-.49)/.47)**4;
 const southeast=((u-.92)/.065)**2+((v-.89)/.075)**2;
 if(island>1&&southeast>1)return island<1.10?'shallow':'water';
 if(d.wildStops?.some(s=>Math.abs(x-s.x)<290&&y>s.y-260&&y<s.y+80))return 'grass';
 const river=10600+Math.sin(y/1250)*570;
 if(Math.abs(x-river)<140&&y>100)return 'water';
 if(Math.abs(x-river)<185&&y>100)return 'shallow';
 if(wildLandsBiome(x,y)==='swamp'){
  const channel=Math.abs(Math.sin(x/540)+Math.cos(y/390));
  if(channel<.16)return 'water';if(channel<.25)return 'shallow';
 }
 return 'grass';
}
export function wildLandsGround(d,x,y){
 if(d.activeRoom)return d.activeRoom==='shadow'?'shadow':'caverns';
 if(x<2350||x>14650||y>8400||y<850||(x>11500&&y>6500))return 'beach';
 return wildLandsBiome(x,y);
}
export function wildLandsTravel(g,id){
 const t=g.trainTest;if(!t?.design.wildLands)return {ok:false,message:'Enter The Wild Lands first.'};
 const stop=(t.design.wildStops||WILD_LANDS_STOPS).find(s=>s.id===id)||WILD_LANDS_GATES.find(s=>s.id===id);
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

export function wildLandsBlocked(d,x,y){
 if(d.activeRoom)return x<6530||x>9470||y<3930||y>5870;
 return Math.abs(x-8200)<128&&y>6940&&y<7110;
}
