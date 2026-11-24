import {railwayStations,stationPoint} from './railway-station.mjs';
import {give,take,clearSlot} from './items.mjs';
import {STATION_OWL_CAGE_PERCH_HEIGHT} from './station-building.mjs';
export {claimEmporiumOwl as summonEmporiumOwl} from './owl-companions.mjs';
import {waterAt} from './environment.mjs';
import {wildLandsSurfaceAt} from './wild-lands-world.mjs';
export function stationOwlCages(g){const t=g.trainTest;if(!t||t.design.activeRoom)return [];return railwayStations(t.design).flatMap(w=>w.station.props.filter(p=>p.kind==='owl_crate').map(p=>({...stationPoint(w,p),id:p.id})));}
const state=p=>p.npcQuests?.snowy_owl;
const setState=(p,s)=>{p.npcQuests??={};p.npcQuests.snowy_owl=s;};
function owlActor(p,{flying=false}={}){
 return {id:'owl-'+p.id,owner:p.id,x:p.x-22,y:p.y+22,owlHeight:flying?12:0,
  owlPhase:flying?'takeoff':'perch',owlPhaseTime:0,callLift:flying?.24:0,hp:30,kind:'snowy_owl',
  faceX:p.faceX||0,faceY:p.faceY||1};
}
function waterBelow(g,x,y){
 const design=g.trainTest?.design;
 const surface=design?.wildLands&&!design.activeRoom?wildLandsSurfaceAt(design,x,y):waterAt(g,x,y);
 return surface==='water'||surface==='shallow'||surface==='floodbridge';
}
export function owlPrompt(g,p){if(p.room||p.trainRide||p.hp<=0)return '';const cage=stationOwlCages(g).find(c=>!g.trainTest.openOwlCages?.has(c.id)&&Math.hypot(c.x-p.x,c.y-p.y)<70);return cage?'OPEN OWL CAGE':'';}
export function openOwlCage(g,p){if(!owlPrompt(g,p))return false;if(state(p)?.active){g.message('Your snowy owl is already following you.');return true;}const c=stationOwlCages(g).find(c=>!g.trainTest.openOwlCages?.has(c.id)&&Math.hypot(c.x-p.x,c.y-p.y)<70);(g.trainTest.openOwlCages??=new Set()).add(c.id);g.trainTest.distantStations?.clear();setState(p,{active:true,name:'Snowy Owl',origin:c.id});g.stationOwls??=[];g.stationOwls.push({id:'owl-'+p.id,owner:p.id,x:c.x,y:c.y,owlHeight:STATION_OWL_CAGE_PERCH_HEIGHT,owlPhase:'takeoff',owlPhaseTime:0,hp:30,kind:'snowy_owl',faceX:0,faceY:1});g.message('The snowy owl spreads its wings. You have a new friend.');g.persist?.();return true;}
export function tickStationOwls(g,dt){dt=Math.max(0,Math.min(.05,dt));
 const companionOwners=g.players.filter(p=>state(p)?.active);
 const previous=g.stationOwls||[];g.stationOwls=[];
 for(const [i,p]of companionOwners.entries()){
 const a=previous.find(a=>a.owner===p.id&&!a.owlVariant)||owlActor(p,{flying:waterBelow(g,p.x-22,p.y+22)});
 g.stationOwls.push(a);
 a.visualSeed=i+1;a.hidden=!!p.room;a.room=p.room;a.owlPhaseTime+=dt;
 const offset=26;
 let tx=p.x-offset,ty=p.y+22;
 const wetTarget=waterBelow(g,tx,ty);
 if(wetTarget&&!waterBelow(g,p.x,p.y)){
  const dry=[[offset,22],[-offset,-22],[offset,-22],[0,0]].find(([x,y])=>!waterBelow(g,p.x+x,p.y+y));
  if(dry){tx=p.x+dry[0];ty=p.y+dry[1];}
 }
 let d=Math.hypot(tx-a.x,ty-a.y);if(d>800){a.x=tx;a.y=ty;a.owlHeight=24;a.owlPhase='fly';a.owlPhaseTime=0;d=0;}
 a.callLift=Math.max(0,(a.callLift||0)-dt);
 const overWater=waterBelow(g,a.x,a.y)||(wetTarget&&waterBelow(g,tx,ty));
 const flying=d>48||!!p.trainRide||p.moving||p.broomMount||a.callLift>0||
  overWater;
 const phase=(next)=>{if(a.owlPhase!==next){a.owlPhase=next;a.owlPhaseTime=0;}};
 if(flying){phase(a.owlHeight<10?'takeoff':'fly');a.owlHeight=Math.min(34,a.owlHeight+dt*70);const n=Math.min(d,dt*(165+Math.min(d,200)));if(d>1){const dx=(tx-a.x)/d,dy=(ty-a.y)/d;const previous=Math.atan2(a.faceY??1,a.faceX||0),target=Math.atan2(dy,dx),turn=Math.atan2(Math.sin(target-previous),Math.cos(target-previous)),heading=previous+turn*Math.min(1,dt*14);a.faceX=Math.cos(heading);a.faceY=Math.sin(heading);a.x+=dx*n;a.y+=dy*n;}a.moving=true;
 }else{a.moving=false;if(a.owlHeight>0){phase('landing');a.owlHeight=Math.max(0,a.owlHeight-dt*45);}else phase('perch');}
 }
}
function recordDelta(g,p,type,n){if(!g.trainTest)return;const r=((g.trainTest.owlDeltas??={})[p.id]??={});r[type]=(r[type]||0)+n;}
export function catchStationOwl(g,p){if(p.room||p.hp<=0||![p.equipment?.hand1,p.equipment?.hand2].includes('critter_net'))return false;const a=g.stationOwls?.find(a=>a.owner===p.id&&!a.owlVariant&&!a.hidden&&Math.hypot(a.x-p.x,a.y-p.y)<52);if(!a)return false;const copy=structuredClone(p.inventory);if(!take(copy,'critter_cage')){g.message('A snowy owl needs an empty travel cage.');return true;}if(!give(copy,'caught_snowy_owl',1,32,{captureContainer:'critter_cage'})){g.message('Make room for the owl’s cage first.');return true;}p.inventory=copy;setState(p,{...state(p),active:false});g.stationOwls=g.stationOwls.filter(b=>b!==a);recordDelta(g,p,'critter_cage',-1);recordDelta(g,p,'caught_snowy_owl',1);g.message('Snowy owl caught safely. Use its cage to release your pet again.');g.persist?.();return true;}
export function releaseStationOwl(g,p,index){const item=p.inventory[index];if(item?.type!=='caught_snowy_owl')return false;if(p.room||p.trainRide){if(p.ui)p.ui.notice='Release your owl outdoors.';return true;}if(state(p)?.active){if(p.ui)p.ui.notice='Your snowy owl is already following.';return true;}const copy=structuredClone(p.inventory);if(--copy[index].qty===0)clearSlot(copy,index);if(!give(copy,'critter_cage',1)){if(p.ui)p.ui.notice='Make room for the empty cage.';return true;}p.inventory=copy;setState(p,{...state(p),active:true,name:'Snowy Owl'});recordDelta(g,p,'caught_snowy_owl',-1);recordDelta(g,p,'critter_cage',1);if(p.ui)p.ui.notice='Your snowy owl is following you again.';g.persist?.();return true;}
export function transferStationOwls(g,t){let changed=false;for(const original of t.returnPlayers){const p=g.players.find(p=>p.id===original.id);if(!p)continue;
 if(state(p)){original.npcQuests??={};original.npcQuests.snowy_owl=structuredClone(state(p));changed=true;}for(const [type,n]of Object.entries(t.owlDeltas?.[p.id]||{})){if(n<0)for(let i=0;i<-n;i++)take(original.inventory,type);else if(n>0){original.npcQuests??={};const q=original.npcQuests.train_students??={received:{},pending:[]};q.pending??=[];if(!give(original.inventory,type,n))q.pending.push({type,qty:n});}}}return changed;}
