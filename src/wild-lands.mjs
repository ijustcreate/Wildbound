import {readTrainDesign} from './train-design.mjs';
import {enterTrainTest} from './train-test.mjs';
import {nearestTrainTrack} from './train-track.mjs';
import {WILD_LANDS_STOPS,WILD_LANDS_WIDTH,WILD_LANDS_HEIGHT} from './wild-lands-world.mjs';
export function wildLandsDesign(){
 const d=readTrainDesign();
 Object.assign(d,{name:'The Wild Lands',wildLands:true,width:WILD_LANDS_WIDTH,height:WILD_LANDS_HEIGHT,nativeForest:false,scenery:[],station:null,maxSpeed:240,spawnDistance:5600});
 const points=[[1900,2850],[1900,2150],[2600,1850],[5000,1850],[6000,2400],[6900,4000],[7800,4400],[9000,4300],[10200,2900],[11000,1850],[13300,1850],[14000,2500],[14000,4700],[14000,6900],[13300,7800],[11000,7800],[8000,7800],[5000,7800],[2600,7800],[1900,7100],[1900,4800]];
 d.nodes=points.map(([x,y],i)=>({id:'wild-'+i,x,y,z:0}));d.routes=[{id:'wild-loop',name:'Wild Lands circuit',nodes:d.nodes.map(n=>n.id)}];d.activeRoute='wild-loop';
 return d;
}
export function enterWildLands(g){
 if(g.trainTest)return {ok:false,message:'Return from the current dev world before entering The Wild Lands.'};
 const result=enterTrainTest(g,wildLandsDesign());
 if(result.ok){g.trainTest.design.wildStops=WILD_LANDS_STOPS.map(s=>{const q=nearestTrainTrack(g.trainTest.route,s.x,s.y);return {...s,x:q.x,y:q.y,a:q.a};});g.trainTest.notice='Welcome to The Wild Lands. Jump aboard the train, explore on foot, or use Dev → Wild Lands destinations.';g.trainTest.noticeUntil=12;result.message='The Wild Lands is ready. Return from dev world restores your expedition.';}
 return result;
}
