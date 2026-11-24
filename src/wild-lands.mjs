import {readTrainDesign} from './train-design.mjs';
import {enterTrainTest,trainWorldBlocked} from './train-test.mjs';
import {nearestTrainTrack} from './train-track.mjs';
import {WILD_LANDS_STOPS,WILD_LANDS_WIDTH,WILD_LANDS_HEIGHT} from './wild-lands-world.mjs';
import {WILD_HOMESTEAD} from './overlook-maze-layout.mjs';
import {syncStationAssets} from './railway-station.mjs';
import {wildHomestead} from './wild-homestead-layout.mjs';

function startAtHomestead(g){
 const t=g.trainTest,home=wildHomestead(t.design),points=[];
 syncStationAssets(g);
 for(const floor of home.floors){
  for(let y=floor.y+17;y<floor.y+floor.h-17;y+=24)for(let x=floor.x+17;x<floor.x+floor.w-17;x+=24)points.push({x,y});
 }
 const {x,y}=WILD_HOMESTEAD;
 points.sort((a,b)=>(a.x-x)**2+(a.y-y)**2-((b.x-x)**2+(b.y-y)**2));
 const open=[];
 for(const point of points){
  if(open.every(other=>Math.hypot(other.x-point.x,other.y-point.y)>=22)&&!trainWorldBlocked(g,point.x,point.y,10))open.push(point);
  if(open.length===g.players.length)break;
 }
 const fallback=open[0]||WILD_HOMESTEAD;
 for(const [i,p] of g.players.entries()){
  const at=open[i]||fallback;
  Object.assign(p,at,{faceX:0,faceY:1});
  if(p.controlPetPosition)Object.assign(p.controlPetPosition,at);
  for(const pet of [p.hunterPet,p.ritualPet,...(g.enemies||[]).filter(ally=>ally.allyOwner===p.id),...(g.ghosts||[]).filter(ghost=>ghost.pet===p.id)].filter(Boolean)){
   const nearby=open.find(point=>point!==at&&Math.hypot(point.x-at.x,point.y-at.y)<50)||at;
   Object.assign(pet,nearby);
  }
 }
 t.homeStart=true;
 g.time=0;g.sky={elapsed:0,days:0,phase:'day'};g.noises=[];
}

export function wildLandsDesign(){
 const d=readTrainDesign();
 Object.assign(d,{name:'The Wild Lands',wildLands:true,width:WILD_LANDS_WIDTH,height:WILD_LANDS_HEIGHT,nativeForest:false,scenery:[],station:null,maxSpeed:240,spawnDistance:5600});
 const points=[[1900,2850],[1900,2150],[2600,1850],[5000,1850],[6000,2400],[6900,4000],[7800,4400],[9000,4300],[10200,2900],[11000,1850],[13300,1850],[14000,2500],[14000,4700],[14000,6900],[13300,7800],[11000,7800],[8000,7800],[5000,7800],[2600,7800],[1900,7100],[1900,4800]];
 d.nodes=points.map(([x,y],i)=>({id:'wild-'+i,x,y,z:0}));d.routes=[{id:'wild-loop',name:'Wild Lands circuit',nodes:d.nodes.map(n=>n.id)}];d.activeRoute='wild-loop';
 return d;
}
export function enterWildLands(g,{persistent=false,homeStart=false}={}){
 if(g.trainTest)return {ok:false,message:'Return from the current dev world before entering The Wild Lands.'};
 const result=enterTrainTest(g,wildLandsDesign(),{persistent});
 if(result.ok){
  const t=g.trainTest;
  t.design.wildStops=WILD_LANDS_STOPS.map(s=>{const q=nearestTrainTrack(t.route,s.x,s.y);return {...s,x:q.x,y:q.y,a:q.a};});
  if(homeStart)startAtHomestead(g);
  t.notice=homeStart?'Welcome to the Homestead. The Wild Lands are yours to explore.':persistent?'Welcome to The Wild Lands. Jump aboard the train or explore on foot.':'Welcome to The Wild Lands. Jump aboard the train, explore on foot, or use Dev → Wild Lands destinations.';
  t.noticeUntil=12;
 }
 return result;
}
