import {mirroredShopPoint,shopLocalPosition} from './diagon-shop-rooms.mjs';

const distance=(actor,point)=>Math.hypot(actor.x-point.x,actor.y-point.y);
const customers=['isla','fred','george','maeve','emmett','mira','dara','lee'];
const visits=new WeakMap();
const coneSeconds=42;

function frontage(shop){
 let route=visits.get(shop);
 if(!route){
  const [door,threshold,turn,counter]=[[148,-7],[88,-7],[88,12],[28,12]].map(([x,y])=>mirroredShopPoint(shop,{x,y}));
  route={door,threshold,turn,counter,stock:shop.stock.filter(([type])=>type==='diagon_ice_cream'||type.startsWith('diagon_ice_cream_'))};
  visits.set(shop,route);
 }
 return route;
}

function strollPoints(shop,id){
 const lane=Math.max(0,customers.indexOf(id)),column=lane%4,row=Math.floor(lane/4);
 const x=shop.x+222+column*28,y=shop.y-94+row*70+column*10;
 return [{x,y},{x:x+124,y:y+24},{x:x+100,y:y+140},{x:x+18,y:y+126}];
}

export function fortescueResidentStart(shop,id,blocked){
 return strollPoints(shop,id).find(p=>!blocked(p.x,p.y,7));
}

export const visitingFortescue=actor=>['in','order','out'].includes(actor.fortescueVisit?.stage);

export function clearFortescuePose(actor,time){
 const cone=actor.fortescueCone;
 if(cone?.until<=time){
  if(actor.equipment.hand2===cone.type){
   if(cone.previousHand===undefined)delete actor.equipment.hand2;
   else actor.equipment.hand2=cone.previousHand;
  }
  delete actor.fortescueCone;
 }
 if(!actor.fortescuePose)return;
 delete actor.fortescuePose;
 delete actor.animationAction;
 delete actor.poseTime;
}

function beginExit(actor,plan,segmentClear,blocked){
 actor.fortescueVisit.stage='out';
 actor.path=segmentClear(actor,plan.threshold,blocked)?[plan.threshold,plan.door]:[plan.turn,plan.threshold,plan.door];
}

export function tickFortescueResident(actor,resident,destination,time,dt,blocked,{shop,visitors,routeTo,segmentClear,follow}){
 let visit=actor.fortescueVisit;
 if(destination!=='sweets'&&!visit)return false;
 const plan=frontage(shop);
 if(!plan.stock.length)return false;
 const local=shopLocalPosition(shop,actor.x,actor.y),inShop=local.x>-108&&local.x<=120&&Math.abs(local.y)<70;
 if(destination!=='sweets'){
  if(!inShop){delete actor.fortescueVisit;actor.path=[];return false;}
  if(visit.stage!=='out'||!actor.path.length)beginExit(actor,plan,segmentClear,blocked);
 }
 if(!visit){
  const index=Math.max(0,customers.indexOf(actor.residentId));
  visit=actor.fortescueVisit={stage:'stroll',next:index%4,readyAt:time+index*.8};
  actor.path=[];
 }
 actor.targetPlace='sweets';

 if(visit.stage==='order'){
  if(distance(actor,plan.counter)>2){beginExit(actor,plan,segmentClear,blocked);return true;}
  actor.faceX=0;actor.faceY=-1;
  if(time<visit.payAt){
   actor.fortescuePose=true;actor.animationAction='interact';actor.poseTime=Math.max(0,time-(visit.payAt-.8));
   return true;
  }
  const choices=plan.stock,flavor=Math.max(0,customers.indexOf(actor.residentId))%choices.length;
  const [type,price]=choices[flavor];
  visit.bought=true;
  const previousHand=actor.fortescueCone?actor.fortescueCone.previousHand:actor.equipment.hand2;
  actor.fortescueCone={type,price,boughtAt:time,until:time+coneSeconds,previousHand};
  actor.equipment.hand2=type;
  actor.activity='Gets a scoop for the walk';actor.activityFrom=time;actor.activityUntil=time+3;
  beginExit(actor,plan,segmentClear,blocked);
 }

 if(visit.stage==='stroll'){
  if(!visit.bought&&time>=visit.readyAt&&distance(actor,plan.door)<253&&!visitors.some(other=>other!==actor&&visitingFortescue(other))){
   const approach=routeTo(actor,plan.door,blocked);
   if(approach.length){
    actor.path=[...approach,plan.threshold,plan.turn,plan.counter];visit.stage='in';
   }else visit.readyAt=time+2;
  }
  if(visit.stage==='stroll'&&!actor.path.length){
   const points=strollPoints(shop,actor.residentId);
   actor.path=routeTo(actor,points[visit.next++%points.length],blocked);
  }
 }

 follow(actor,resident.speed,dt,blocked);
 if(actor.path.length)return true;
 if(visit.stage==='in'){
  if(distance(actor,plan.counter)<.3){
   actor.place='sweets';visit.stage='order';visit.payAt=time+.8;
  }else if(inShop)beginExit(actor,plan,segmentClear,blocked);
  else {visit.stage='stroll';visit.readyAt=time+1;}
 }else if(visit.stage==='out'){
  if(inShop)beginExit(actor,plan,segmentClear,blocked);
  else visit.stage='stroll';
 }
 return true;
}
