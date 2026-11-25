import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {give} from './items.mjs';
import {trainInterior} from './train-design.mjs';
import {nativeCompartmentAisle} from './train-interior.mjs';
import {trainWorld} from './train-track.mjs';
export const HOGWARTS_CATALOG=[['hogwarts_student_robes',45],['hogwarts_trousers',25],['hogwarts_shoes',25],['hogwarts_cuffs',20],...['yellow','green','red','blue'].map(color=>['hogwarts_scarf_'+color,20])];
export function trainTailor(g,cs){
 const t=g.trainTest,car=cs.find(c=>c.kind==='compartments');if(!t||!car||t.derailed)return null;const objects=trainInterior(t.design,car),tables=objects.filter(o=>o.kind==='table').sort((a,b)=>a.x-b.x),table=tables[1];if(!table)return null;
 const seat=objects.filter(o=>o.kind==='seat').sort((a,b)=>Math.hypot(a.x-table.x,a.y-table.y)-Math.hypot(b.x-table.x,b.y-table.y))[0];if(!seat)return null;
 const local={x:seat.x,y:seat.y},q=trainWorld(car,local.x,local.y),angle=car.a+(seat.facing||0)*Math.PI/2;
 const shop=t.tailor??={name:'Agnes Threadwell',trainTailor:true,stock:HOGWARTS_CATALOG.map(([type,price])=>({item:{type,qty:1},price})),revision:0,greeting:'Hogwarts robes and four house scarves. Everything fitted for the journey.'};Object.assign(shop,{x:q.x,y:q.y,car:car.index,local});
 const actor={id:'train-tailor',sprite:'player',kind:'player',hp:1,name:shop.name,x:q.x,y:q.y-20-q.z,faceX:Math.cos(angle),faceY:Math.sin(angle),animationAction:'train_sit',equipment:{chest:'hogwarts_student_robes',back:'hogwarts_scarf_blue'},appearance:{...DEFAULT_APPEARANCE,hair:'bob',hairColor:'#a7a09b',shirt:'#777080',pants:'#34323d',shoes:'#332d31',skin:'#d6a587'}};
 shop.visual=actor;return {id:'tailor',name:shop.name,car,local,seatId:car.id+':'+seat.id,actor,shop};
}
export function nearbyTrainTailor(g,p,cs){
 const n=trainTailor(g,cs),r=p.trainRide;
 if(!n||!r||r.seat||r.gangway||r.car!==n.car.index)return null;
 const {car,local}=n,design=g.trainTest.design;
 const objects=trainInterior(design,car);
 const table=objects.filter(o=>o.kind==='table').sort((a,b)=>a.x-b.x)[1];
 const partitions=objects.filter(o=>o.kind==='wall'&&o.h>car.width*.4).map(o=>o.x);
 const left=Math.max(-car.length/2,...partitions.filter(x=>x<table.x));
 const right=Math.min(car.length/2,...partitions.filter(x=>x>table.x));
 const roomEdge=(nativeCompartmentAisle(design,car)?.wallY??car.width/2-23)+3;
 return r.x>left+2&&r.x<right-2&&r.y<roomEdge&&Math.hypot(r.x-local.x,r.y-local.y)<38?n:null;
}
export function openTrainTailor(g,p,cs){const n=nearbyTrainTailor(g,p,cs);if(!n)return false;p.ui={shop:'merchant',trainTailor:true,panel:'stock',index:0,page:0,notice:n.shop.greeting};return true;}
export function transferTailorPurchases(g,t){let changed=false;for(const original of t.returnPlayers){const receipt=t.tailorPurchases?.[original.id];if(!receipt)continue;changed=true;original.coins=Math.max(0,(original.coins||0)-receipt.spent);original.npcQuests??={};const state=original.npcQuests.train_students??={received:{},pending:[]};state.pending??=[];for(const item of receipt.items)if(!give(original.inventory,item.type,item.qty))state.pending.push({type:item.type,qty:item.qty});}return changed;}
