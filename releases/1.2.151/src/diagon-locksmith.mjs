import {block as b,shape as p} from './diagon-shop-brush.mjs';
import {WRONG_TURN_KEY_OFFER} from './wrong-turn-key.mjs';

export const LOCKSMITH_SHOP=Object.freeze({
 id:'wrong-turn',name:'Wrong Turn Door & Key',owner:'Tamsin Hinge',subtitle:'Salvaged doors and improbable keys',
 x:6984,y:3912,district:'garden',frontEntrance:true,color:'#65465c',
 stock:[['car_key',6],WRONG_TURN_KEY_OFFER,['alley_copperweave_gloves',25],['floo_powder',10]],
 line:'The keys are numbered. The doors refuse to cooperate.',
});

export const LOCKSMITH_LOOK={hair:'waves',hairColor:'#ac8272',skin:'#ae7c60',pants:'#47434c'};
export const LOCKSMITH_DOOR_ROW={x:21,y:-44,halfWidth:50};
export const LOCKSMITH_DOORS=[
 {id:'plum',name:'Plum door',offset:-32,w:30,h:57},
 {id:'green',name:'Green door',offset:0,w:32,h:69},
 {id:'oak',name:'Oak door',offset:32,w:30,h:52},
];

const dark='#392e32',brass='#a98050',light='#d0ac72',burnish='#edca86';
const doorRamps=[['#45363f','#69515c','#9b7079'],['#344c4b','#56756a','#8a9d82'],['#504337','#79614a','#ab8b65']];

function lockPlate(c,x,y,side=1){
 p(c,dark,[[x-4,y-7],[x+4,y-7],[x+6,y-3],[x+5,y+5],[x+2,y+7],[x-4,y+6],[x-6,y+3],[x-6,y-4]]);
 b(c,x-4,y-5,9,10,brass);b(c,x-4,y-5,7,2,light);b(c,x-3,y-2,6,3,dark);
 b(c,x-1,y,2,4,dark);b(c,x+side*7-2,y-1,5,3,light);b(c,x+side*7-2,y-1,3,1,burnish);
}

function salvagedDoor(c,x,bottom,w,h,index){
 const y=bottom-h,[edge,body,lit]=doorRamps[index],right=x+w;
 p(c,dark,[[x,bottom],[x,y+9],[x+5,y+2],[x+w-6,y],[right,y+6],[right,bottom]]);
 p(c,edge,[[x+2,bottom-2],[x+2,y+10],[x+6,y+4],[right-7,y+2],[right-2,y+7],[right-2,bottom-2]]);
 b(c,x+5,y+12,w-10,h-17,body);b(c,x+5,y+11,w-10,2,lit);
 for(const v of [y+17,bottom-18]){
  b(c,x+8,v,w-16,12,edge);b(c,x+10,v+2,w-20,8,body);b(c,x+9,v+11,w-18,1,lit);
 }
 for(const v of [y+17,bottom-18]){b(c,x-1,v,5,3,brass);b(c,x,v,4,1,light);}
 b(c,x+5,y+15,1,h-19,lit);b(c,x+4,bottom-6,w-8,2,lit);
 lockPlate(c,right-7,bottom-26,index===2?-1:1);
}

function openDoor(c,door,index){
 const left=door.offset-door.w/2,bottom=-2,top=bottom-door.h,right=left+door.w;
 const [edge,body,lit]=doorRamps[index];
 p(c,dark,[[left,bottom],[left,top+9],[left+5,top+2],[right-6,top],[right,top+6],[right,bottom]]);
 p(c,'#212e39',[[left+3,bottom],[left+3,top+11],[left+7,top+5],[right-7,top+3],[right-3,top+8],[right-3,bottom]]);
 b(c,left+2,top+11,2,door.h-13,lit);b(c,right-4,top+8,2,door.h-9,body);
 p(c,'#354753',[[left+5,bottom-1],[left+9,bottom-7],[right-6,bottom-7],[right-3,bottom-1]]);
 p(c,edge,[[left+1,top+12],[left+8,top+16],[left+8,bottom-4],[left+1,bottom]]);
 b(c,left+1,top+15,3,door.h-18,body);b(c,left+6,bottom-22,3,3,brass);
 b(c,left+9,bottom-3,door.w-15,1,'#80afb2');b(c,left+10,bottom-2,door.w-17,1,'#354753');
 for(const [dx,dy,tint]of [[-5,-13,'#729fa4'],[5,-22,'#556d78'],[1,-34,'#435765']])b(c,door.offset+dx,bottom+dy,1,1,tint);
}

function doorDisplay(c,time,g){
 p(c,'#493b39',[[-47,-7],[41,-7],[49,2],[-50,2]]);
 b(c,-48,-5,96,4,'#82654e');b(c,-47,-6,90,1,'#b88c5e');
 for(const [index,door]of LOCKSMITH_DOORS.entries()){
  if(g?.trainTest?.wrongTurnDoors?.[door.id])openDoor(c,door,index);
  else salvagedDoor(c,door.offset-door.w/2,-2,door.w,door.h,index);
 }
}

function key(c,x,y,size=0){
 const w=6+size;
 p(c,brass,[[x-3,y],[x-2,y-3],[x+2,y-3],[x+4,y-1],[x+3,y+3],[x-2,y+3]]);
 b(c,x-1,y-1,3,2,dark);b(c,x-3,y,1,2,light);b(c,x+3,y,w,2,light);
 b(c,x+w,y+1,2,3,brass);b(c,x+w-4,y+1,2,2,brass);
}

function keyCabinet(c){
 b(c,-22,-43,44,42,dark);b(c,-20,-42,40,37,'#705547');b(c,-18,-39,36,29,'#4b403c');
 b(c,-19,-42,38,2,'#ae865e');b(c,-18,-26,36,1,'#8f674e');
 for(const [x,y,size]of [[-13,-33,1],[3,-35,3],[-11,-20,3],[4,-19,0]])key(c,x,y,size);
 b(c,-20,-9,40,7,'#8d684d');b(c,-16,-8,32,1,'#bf9464');b(c,-3,-6,6,2,brass);
}

function locksmithCounter(c){
 b(c,-28,-26,56,25,dark);b(c,-26,-24,52,21,'#6c5040');
 b(c,-23,-14,46,10,'#946c4e');b(c,-21,-12,42,2,'#ad855e');b(c,-18,-7,36,1,'#b8885a');
 p(c,'#876047',[[-28,-16],[-30,-24],[-25,-31],[26,-31],[31,-25],[29,-16]]);
 p(c,'#ae8056',[[-28,-24],[-24,-29],[24,-29],[28,-25],[24,-21],[-26,-21]]);
 b(c,-25,-21,52,2,'#ca9d6b');b(c,-23,-17,50,1,'#493b38');
 p(c,'#4d5550',[[-20,-25],[-17,-31],[-4,-31],[-1,-24],[-6,-21],[-22,-21]]);
 key(c,-13,-27,1);key(c,9,-26,3);b(c,24,-16,2,9,brass);b(c,-25,-16,2,9,brass);
}

function salvageCrate(c){
 p(c,dark,[[-18,0],[-20,-20],[-13,-27],[13,-27],[19,-21],[17,0]]);
 p(c,'#5a483b',[[-17,-21],[-12,-25],[12,-25],[17,-21],[12,-17],[-13,-17]]);
 b(c,-16,-17,32,14,'#8c684b');b(c,-15,-16,29,2,'#b58a5f');b(c,-15,-10,29,1,'#71513e');
 lockPlate(c,2,-11,-1);b(c,-12,-3,25,1,'#ba8d61');
}

function latchRack(c){
 b(c,-12,-33,24,32,'#494044');b(c,-10,-31,20,28,'#715951');
 b(c,-9,-31,18,1,'#ad865e');
 lockPlate(c,0,-22);lockPlate(c,0,-8,-1);
}

export const LOCKSMITH_ROOM={keeper:{x:-55,y:-28},props:[
 {id:'wrong-turn-salvaged-doors',x:LOCKSMITH_DOOR_ROW.x,y:LOCKSMITH_DOOR_ROW.y,w:102,h:74,paint:doorDisplay,
  rasterVariant:g=>LOCKSMITH_DOORS.reduce((mask,door,i)=>mask|(g?.trainTest?.wrongTurnDoors?.[door.id]?1<<i:0),0)},
 {id:'wrong-turn-key-cabinet',x:-73,y:-50,w:45,h:44,paint:keyCabinet,solid:{width:44,depth:15}},
 {id:'wrong-turn-counter',x:-56,y:1,w:64,h:34,paint:locksmithCounter,solid:{width:58,depth:23}},
 {id:'wrong-turn-salvage-crate',x:72,y:24,w:43,h:32,paint:salvageCrate,solid:{width:33,depth:16}},
 {id:'wrong-turn-latch-rack',x:83,y:-39,w:27,h:35,paint:latchRack,solid:{width:25,depth:8}},
]};
