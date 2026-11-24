import {block as b,shape as p,line as l} from './diagon-shop-brush.mjs';
import {LOCKSMITH_SHOP} from './diagon-locksmith.mjs';
import {BELLGLASS_CRYSTAL_BALL,BELLGLASS_MAGIC_MUSHROOM} from './divination-content.mjs';

export const MERIDIAN_ARENA_ENTRANCE=Object.freeze({x:7490,y:3661,id:'meridian-hall'});
export const GARDEN_SHOPS=Object.freeze([
 {id:'bellglass',name:'Bellglass Conservatory',owner:'Iona Bellglass',subtitle:'Garden tinctures and glassware',x:7238,y:3680,
  district:'garden',frontEntrance:true,color:'#596b50',stock:[['potion',12],['alley_moonmint_tonic',16],['empty_jar',4],BELLGLASS_CRYSTAL_BALL,BELLGLASS_MAGIC_MUSHROOM],
  line:'The moonmint came in at dawn. The mushrooms are rather giggly company.'},
 {id:'meridian-hall',name:'Meridian Hall',owner:'Celia Orrery',subtitle:'Charts, lanterns and wayfinding',x:7490,y:3680,
  district:'garden',frontEntrance:true,color:'#57546b',stock:[['lantern',18],['alley_lodestone_brooch',48],['floo_powder',10]],
  line:'The charts are for sale. The broken mirror has been here longer than I have.'},
 LOCKSMITH_SHOP,
]);

function pot(c,x,y,bloom){
 for(const [dx,rise] of [[-6,8],[-2,15],[2,12],[6,9]]){
  l(c,'#355747',x,y-8,x+dx,y-8-rise,2);
  p(c,dx<0?'#5e8b55':'#91b66b',[[x+dx-5,y-8-rise],[x+dx-2,y-11-rise],[x+dx+5,y-8-rise],[x+dx+2,y-6-rise]]);
  if(bloom){b(c,x+dx-2,y-12-rise,5,3,bloom);b(c,x+dx-1,y-14-rise,2,2,'#dbc5b9');}
 }
 p(c,'#5b3c35',[[x-9,y-9],[x+9,y-9],[x+6,y],[x-6,y]]);
 p(c,'#9c6548',[[x-8,y-7],[x+7,y-7],[x+5,y-2],[x-5,y-2]]);
 b(c,x-10,y-10,20,3,'#ba855a');b(c,x-9,y-10,11,1,'#dfa879');
}
function bench(c,w,glass=false){
 b(c,-w/2+4,-23,5,23,'#352c28');b(c,w/2-9,-23,5,23,'#352c28');
 b(c,-w/2+5,-17,w-11,4,'#69503b');b(c,-w/2+2,-8,w-4,3,'#69503b');
 p(c,'#352c28',[[ -w/2,-27],[w/2-5,-27],[w/2,-22],[w/2,-15],[-w/2,-15]]);
 b(c,-w/2+1,-24,w-3,6,glass?'#63878a':'#9a724d');
 b(c,-w/2+1,-25,w-4,2,glass?'#b8c9b6':'#c19360');b(c,-w/2+4,-16,w-9,1,'#c19360');
}
function bottles(c,x,y){
 for(const [dx,w,h,col] of [[-10,7,13,'#68918a'],[-2,7,8,'#a889a0'],[7,9,14,'#93a777']]){
  b(c,x+dx,y-h,w,h,'#364c50');b(c,x+dx+1,y-h+5,w-2,h-5,col);
  b(c,x+dx+2,y-h-2,w-4,3,'#917452');b(c,x+dx+1,y-h+2,1,5,'#c4ccc4');
 }
}
function bellglassCounter(c){bench(c,64);bottles(c,-21,-26);b(c,3,-30,21,4,'#53483b');b(c,6,-31,15,3,'#c09e71');}
function greenhouseRack(c){
 b(c,-37,-71,74,64,'#314b50');b(c,-34,-70,67,59,'#667f80');
 p(c,'#91aaa4',[[-33,-68],[29,-68],[28,-56],[-33,-30]]);
 for(const x of [-35,-13,11,33]){b(c,x,-69,3,57,'#b58d65');b(c,x+1,-66,1,54,'#d0b18b');}
 b(c,-35,-49,71,3,'#917452');b(c,-36,-30,73,4,'#917452');
 pot(c,-23,-30,'#ad7c98');pot(c,1,-29);pot(c,22,-30,'#bd8d58');b(c,-36,-12,72,6,'#9a724d');
}
function herbTable(c){bench(c,46,true);pot(c,-13,-25,'#aa789e');pot(c,9,-24);bottles(c,2,-7);}
function tallHerbs(c){pot(c,-13,0,'#bd9161');pot(c,6,-3);pot(c,13,-13,'#b0839c');}

function chartCounter(c){
 bench(c,58);p(c,'#d5bc8e',[[-24,-27],[-17,-33],[10,-31],[14,-26],[7,-22],[-19,-23]]);
 l(c,'#967f66',-12,-28,1,-25,1);l(c,'#877259',-9,-26,7,-28,1);
 b(c,17,-31,8,7,'#474d53');b(c,18,-32,6,2,'#c49d66');
}
function chartShelf(c){
 b(c,-25,-52,50,50,'#352c28');b(c,-22,-50,44,42,'#69503b');
 for(const y of [-38,-24,-10]){
  b(c,-21,y-10,41,11,'#42393b');
  for(let x=-17;x<17;x+=9){b(c,x,y-7,7,6,x%3?'#967464':'#6b7d87');b(c,x+1,y-7,4,2,'#d6b58a');}
  b(c,-22,y,44,3,'#9a724d');b(c,-21,y,42,1,'#c19360');
 }
}
function sightingTable(c){
 bench(c,47);b(c,-3,-36,6,11,'#917452');b(c,-9,-42,25,5,'#252f3e');
 l(c,'#c49d66',-17,-36,15,-54,6);l(c,'#e2c38a',-16,-38,14,-55,2);
 b(c,14,-57,8,9,'#3b4b64');b(c,17,-56,5,6,'#7badaa');
}
function meridianMirror(c){
 b(c,-31,-62,62,59,'#252f3e');b(c,-28,-59,56,55,'#917452');
 b(c,-25,-55,50,43,'#53656b');b(c,-23,-53,46,39,'#8f9d94');
 p(c,'#bec9bc',[[-22,-52],[-6,-51],[13,-23],[22,-17],[19,-14],[3,-21],[-14,-47]]);
 p(c,'#748b89',[[-20,-27],[-11,-29],[10,-19],[7,-15],[-19,-16]]);
 for(const [x,y] of [[-18,-42],[7,-51],[22,-39],[14,-16],[-4,-18],[-22,-23]])l(c,'#42545d',-1,-34,x,y,1);
 l(c,'#e3d8ac',-3,-36,1,-32,1);b(c,-1,-34,2,2,'#edddb5');
 b(c,-27,-11,54,3,'#9a724d');b(c,-22,-8,44,3,'#3b4b64');
 b(c,-4,-11,8,4,'#51433a');b(c,-2,-10,4,1,'#e2c38a');
}

export const bellglassRoom={keeper:{x:-59,y:-28},props:[
 {id:'bellglass-glass-rack',x:-54,y:-45,w:76,h:75,paint:greenhouseRack,solid:{width:66,depth:19}},
 {id:'bellglass-remedy-counter',x:-57,y:0,w:67,h:49,paint:bellglassCounter,solid:{width:64,depth:26}},
 {id:'bellglass-planting-table-a',x:62,y:-40,w:50,h:58,paint:herbTable,solid:{width:46,depth:26}},
 {id:'bellglass-planting-table-b',x:62,y:13,w:50,h:58,paint:herbTable,solid:{width:46,depth:26}},
 {id:'bellglass-bloom-pots',x:70,y:53,w:46,h:46,paint:tallHerbs,solid:{width:31,depth:15}},
]};
export const meridianRoom={keeper:{x:-61,y:-29},props:[
 {id:'meridian-chart-cabinet',x:0,y:-39,w:63,h:63,paint:meridianMirror,solid:{width:54,depth:12}},
 {id:'meridian-chart-shelf',x:-69,y:-49,w:53,h:55,paint:chartShelf,solid:{width:50,depth:15}},
 {id:'meridian-map-counter',x:-59,y:0,w:62,h:37,paint:chartCounter,solid:{width:58,depth:25}},
 {id:'meridian-sighting-table',x:67,y:-22,w:55,h:59,paint:sightingTable,solid:{width:47,depth:22}},
 {id:'meridian-travel-shelf',x:76,y:42,w:53,h:55,paint:chartShelf,solid:{width:50,depth:14}},
]};
