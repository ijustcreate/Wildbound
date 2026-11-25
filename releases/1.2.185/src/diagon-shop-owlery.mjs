import {block, shape, line, casework} from './diagon-shop-brush.mjs';
import {drawCagedSnowyOwl, drawOwlCage, drawSnowyOwl} from './snowy-owl-art.mjs';

// Eeylops. Honey timber and quiet blue-green upholstery at Ollivanders scale.
// Keep the tall cage silhouettes and turning roost branch more visible than
// their small fittings. Native snowy owl pixels supply the lightest accents.
const timber = ['#332e27', '#524239', '#7e6244', '#a68556', '#c9a877'];
const teal = ['#283a34', '#3e5347', '#556957', '#6e8469', '#a4a881'];
const brass = ['#4a4030', '#79613e', '#a68a52', '#c8a967', '#ead29a'];
const straw = ['#4f462d', '#776342', '#9b8050', '#be9f61', '#dec284'];
const limestone = ['#37483e', '#516354', '#778471', '#a0a78b', '#c8c7a9'];

function tallAviary(c) {
  shape(c,timber[0],[[-27,-54],[-23,-61],[-15,-65],[16,-65],[23,-61],[27,-54],
    [27,-4],[24,0],[-24,0],[-27,-4]]);
  shape(c,teal[2],[[-24,-53],[-20,-60],[-13,-63],[15,-63],[21,-60],
    [24,-54],[24,-8],[-24,-8]]);
  shape(c,'#2f4237',[[-20,-52],[-17,-57],[-12,-59],[12,-59],[17,-57],
    [21,-52],[21,-11],[-20,-11]]);
  shape(c,teal[1],[[1,-58],[12,-58],[18,-52],[20,-42],[19,-11],[10,-11],[12,-34],[8,-52]]);
  for (const x of [-16,-9,-2,5,12,18]) {
    block(c,x,-52,2,37,teal[2]);
    block(c,x,-51,1,34,teal[3]);
  }
  line(c,timber[1],-18,-23,17,-29,4);
  line(c,timber[3],-17,-24,17,-30,1);
  line(c,timber[2],4,-28,0,-39,2);
  shape(c,teal[4],[[-24,-54],[-20,-60],[-12,-63],[2,-63],[2,-61],[-12,-61],
    [-19,-57],[-22,-51],[-22,-12],[-24,-12]]);
  block(c,21,-51,3,39,teal[1]);
  block(c,-22,-14,44,3,timber[3]);
  block(c,-23,-11,46,8,timber[2]);
  block(c,-21,-11,44,2,timber[4]);
  block(c,5,-9,15,5,timber[1]);
  block(c,-3,-9,7,3,brass[2]);
  block(c,-1,-8,3,1,brass[4]);
  block(c,-24,-4,5,4,timber[0]);
  block(c,19,-4,5,4,timber[0]);
  block(c,-5,-35,7,4,brass[0]);
  block(c,-3,-35,4,2,brass[3]);
  block(c,-1,-35,1,2,brass[4]);
}

function brassCage(c, time, variant='hedwig') {
  // The station cage and the emporium stock share the same native owl.
  // A low blue-green display plinth distinguishes the emporium from the platform.
  shape(c,teal[0],[[-24,-8],[-19,-14],[20,-14],[24,-9],[22,-2],[19,0],[-21,0]]);
  shape(c,teal[2],[[-22,-8],[-18,-12],[19,-12],[21,-8],[19,-4],[-20,-4]]);
  block(c,-19,-8,37,1,teal[4]);
  block(c,-17,-3,33,1,teal[3]);
  c.save();
  c.translate(-2,-14);
  c.scale(.81,.81);
  drawOwlCage(c,{x:0,y:0},false,'back');
  drawCagedSnowyOwl(c,{x:0,y:0,owlVariant:variant},time);
  drawOwlCage(c,{x:0,y:0});
  c.restore();
}

function wallCage(c) {
  // The shallow shelf and crooked top peg identify a wall-hung cage.
  block(c,-2,-45,4,9,timber[0]);
  block(c,-3,-44,9,2,timber[4]);
  shape(c,brass[0],[[-13,-33],[-9,-37],[-5,-39],[7,-39],[12,-36],
    [14,-30],[14,-9],[10,-6],[-13,-7]]);
  shape(c,teal[0],[[-10,-31],[-7,-36],[5,-37],[9,-33],
    [11,-28],[11,-11],[-10,-11]]);
  for (const x of [-8,-3,3,8]) block(c,x,-30,1,18,brass[2]);
  line(c,timber[3],-9,-20,8,-21,2);
  shape(c,brass[3],[[-13,-31],[-10,-35],[-6,-38],[5,-38],[10,-36],[12,-32],
    [10,-32],[7,-35],[-6,-36],[-9,-33],[-11,-29],[-11,-12],[-13,-12]]);
  block(c,11,-28,2,17,brass[1]);
  block(c,-12,-11,24,3,brass[2]);
  block(c,-11,-11,20,1,brass[4]);
  block(c,5,-25,4,4,brass[3]);
  block(c,6,-24,1,2,brass[0]);
  shape(c,timber[1],[[-16,-8],[-13,-11],[13,-11],[16,-7],[13,-4],[-15,-4]]);
  block(c,-14,-8,28,2,timber[3]);
  line(c,timber[2],-11,-4,-7,0,2);
  line(c,timber[2],9,-4,10,0,2);
}

function birchRoost(c, time) {
  shape(c,teal[0],[[-14,-5],[-8,-10],[8,-10],[14,-5],[11,-1],[-11,-1]]);
  shape(c,teal[3],[[-12,-5],[-7,-9],[7,-9],[11,-6],[7,-3],[-9,-3]]);
  // Stepped taper with a real fork rather than a flat T-shaped perch.
  shape(c,timber[0],[[-5,-4],[-5,-16],[-3,-29],[-10,-35],[-19,-36],[-21,-40],
    [-17,-44],[-14,-44],[-10,-38],[-5,-36],[-2,-34],[1,-41],[8,-47],
    [10,-47],[11,-44],[8,-41],[15,-43],[20,-43],[22,-40],[19,-37],
    [11,-39],[5,-35],[3,-29],[4,-19],[2,-12],[5,-5]]);
  shape(c,timber[3],[[-3,-7],[-2,-17],[-1,-28],[-3,-33],[-9,-37],[-15,-37],
    [-18,-40],[-16,-42],[-13,-40],[-9,-38],[-4,-37],[0,-33],[3,-39],
    [8,-44],[8,-41],[5,-37],[9,-39],[16,-41],[20,-40],[16,-38],
    [9,-38],[3,-34],[1,-28],[2,-19],[0,-12],[2,-7]]);
  block(c,-4,-16,7,2,timber[1]);
  block(c,-2,-22,4,2,timber[4]);
  block(c,-2,-32,4,1,timber[4]);
  block(c,-17,-40,4,2,timber[4]);
  block(c,12,-41,7,1,timber[4]);
  drawSnowyOwl(c,{x:9,y:-41,faceX:-.7,faceY:1,owlPhase:'perch',hp:1,visualSeed:17,owlVariant:'archimedes'},time,35);
}

function seedBin(c) {
  shape(c,timber[0],[[-16,-18],[-12,-23],[11,-23],[16,-19],[15,-4],[11,0],
    [-12,0],[-15,-4]]);
  shape(c,timber[2],[[-14,-17],[-11,-20],[10,-20],[14,-16],[12,-5],
    [9,-2],[-11,-2],[-13,-5]]);
  block(c,-11,-16,5,12,timber[3]);
  block(c,7,-15,5,11,timber[1]);
  block(c,-13,-13,26,2,teal[1]);
  block(c,-12,-12,21,1,teal[3]);
  block(c,-12,-7,23,2,teal[1]);
  block(c,-10,-7,18,1,teal[2]);
  shape(c,straw[3],[[-13,-18],[-9,-22],[9,-22],[13,-18],[9,-15],[-10,-15]]);
  block(c,-9,-19,19,2,straw[4]);
  for (const [x,y] of [[-7,-20],[-3,-19],[3,-21],[6,-18]]) {
    block(c,x,y,2,1,straw[1]);
  }
  block(c,-5,-10,10,5,'#b9a883');
  block(c,-2,-8,4,1,timber[1]);
}

function feedBowl(c) {
  shape(c,teal[0],[[-9,-6],[-6,-10],[7,-10],[9,-7],[8,-3],[5,0],[-6,0],[-8,-2]]);
  shape(c,teal[2],[[-7,-6],[7,-6],[6,-3],[4,-1],[-4,-1],[-6,-3]]);
  block(c,-6,-3,8,1,teal[3]);
  shape(c,teal[4],[[-8,-7],[-5,-9],[6,-9],[8,-7],[5,-5],[-6,-5]]);
  block(c,-5,-8,10,2,straw[2]);
  block(c,-4,-8,3,1,straw[4]);
  block(c,1,-7,2,1,straw[4]);
}

function waterBath(c) {
  shape(c,limestone[0],[[-20,-9],[-15,-13],[-8,-15],[9,-15],[16,-13],[20,-8],[18,-4],
    [13,-1],[8,0],[-11,0],[-17,-3]]);
  shape(c,limestone[2],[[-18,-8],[-14,-11],[-8,-13],[8,-13],[15,-11],
    [18,-8],[13,-4],[8,-3],[-11,-3],[-16,-5]]);
  shape(c,limestone[4],[[-16,-9],[-13,-11],[-9,-12],[6,-12],[10,-11],
    [3,-10],[-9,-10],[-14,-8]]);
  shape(c,'#446658',[[-13,-8],[-9,-10],[8,-10],[12,-9],[15,-7],[9,-5],[-10,-5]]);
  shape(c,'#6f8c79',[[-11,-8],[-8,-9],[4,-9],[8,-8],[2,-7],[-8,-7]]);
  block(c,-7,-8,5,1,'#b0bea0');
  block(c,5,-7,4,1,'#91ab97');
  block(c,-13,-3,20,1,limestone[3]);
  block(c,-13,-2,9,1,limestone[2]);
  block(c,11,-3,5,1,'#667b52');
}

function wovenNest(c) {
  shape(c,straw[0],[[-14,-8],[-12,-12],[-7,-14],[5,-14],[12,-12],[15,-8],
    [12,-4],[8,-1],[-8,0],[-12,-3]]);
  shape(c,straw[2],[[-12,-8],[-9,-11],[-6,-12],[5,-12],[11,-10],[13,-8],
    [9,-4],[4,-3],[-8,-4]]);
  shape(c,straw[1],[[-9,-9],[-5,-11],[5,-11],[9,-9],[7,-7],[-7,-7]]);
  shape(c,'#baae85',[[0,-9],[2,-13],[5,-14],[7,-13],[8,-10],[6,-8],[2,-8]]);
  block(c,2,-12,3,2,'#e9deae');
  shape(c,'#dad0a2',[[-6,-10],[-5,-13],[-2,-14],[0,-13],[1,-10],[-1,-8],[-5,-8]]);
  block(c,-5,-13,2,2,'#eee4ba');
  block(c,-12,-8,4,1,straw[4]);
  block(c,-8,-6,5,1,straw[3]);
  block(c,3,-5,7,1,straw[3]);
  block(c,-7,-3,11,1,straw[4]);
  block(c,-4,-2,11,1,straw[3]);
}

function featherBundle(c) {
  shape(c,timber[0],[[-10,-3],[-8,-8],[7,-8],[11,-5],[9,-1],[-8,0]]);
  block(c,-8,-4,17,2,timber[3]);
  shape(c,'#aab2a1',[[-2,-5],[-7,-12],[-7,-16],[-4,-20],[-2,-17],
    [-1,-13],[2,-10],[3,-17],[6,-22],[8,-22],[8,-18],[6,-14],
    [9,-16],[11,-14],[10,-11],[7,-8],[2,-5]]);
  shape(c,'#e5dec0',[[-5,-15],[-4,-18],[-3,-15],[-2,-10],[-1,-8],[-4,-10]]);
  shape(c,'#f0e6c9',[[4,-14],[5,-18],[7,-21],[8,-21],[6,-16],[4,-12],[2,-10]]);
  block(c,-2,-8,6,2,brass[3]);
  block(c,-1,-8,2,1,brass[4]);
}

function travelBasket(c) {
  shape(c,straw[0],[[-17,-15],[-13,-21],[-5,-24],[-5,-28],[4,-28],[8,-25],
    [8,-23],[14,-21],[17,-16],[16,-7],[13,-2],[8,0],[-10,0],[-14,-4]]);
  shape(c,straw[2],[[-15,-15],[-12,-20],[-6,-22],[8,-22],[13,-20],[15,-17],
    [13,-9],[9,-7],[-13,-8]]);
  line(c,straw[4],-11,-20,-6,-22,1);
  block(c,-7,-18,12,2,teal[0]);
  block(c,-6,-18,2,1,teal[1]);
  block(c,-2,-18,2,1,teal[1]);
  block(c,2,-18,2,1,teal[1]);
  shape(c,straw[2],[[-15,-9],[14,-9],[11,-3],[8,-1],[-9,-1],[-13,-4]]);
  block(c,-14,-10,28,2,straw[4]);
  block(c,-12,-5,20,1,straw[3]);
  block(c,-5,-27,9,2,straw[4]);
  block(c,-5,-10,4,4,brass[0]);
  block(c,-4,-10,2,2,brass[3]);
  block(c,7,-8,2,5,straw[1]);
  block(c,-9,-6,1,3,straw[1]);
}

function netRack(c) {
  // Narrow display with stepped oval mouths, crossed mesh, and capped feet.
  shape(c,timber[0],[[-11,-52],[-9,-55],[10,-55],[12,-52],[11,-3],[13,-2],
    [13,0],[-13,0],[-13,-2],[-11,-3]]);
  block(c,-8,-52,16,48,teal[1]);
  block(c,-10,-52,3,49,timber[2]);
  block(c,-9,-52,1,45,timber[4]);
  block(c,8,-51,2,48,timber[2]);
  block(c,-8,-45,16,3,timber[3]);
  line(c,straw[1],-4,-12,-3,-34,2);
  line(c,straw[4],-5,-13,-4,-34,1);
  shape(c,straw[1],[[-8,-38],[-7,-44],[-4,-47],[-1,-46],[1,-42],[0,-37],
    [-3,-34],[-6,-35]]);
  shape(c,teal[0],[[-6,-39],[-5,-44],[-3,-45],[-1,-42],[-2,-38],[-4,-37]]);
  line(c,straw[3],-5,-43,-2,-39,1);
  block(c,-6,-42,5,1,straw[3]);
  line(c,straw[4],4,-11,5,-28,1);
  shape(c,straw[2],[[0,-33],[1,-39],[4,-41],[7,-41],[10,-38],[10,-35],
    [7,-29],[3,-29]]);
  shape(c,teal[0],[[2,-34],[3,-38],[5,-39],[7,-39],[8,-37],[7,-34],[6,-31],[4,-31]]);
  line(c,straw[2],4,-37,7,-34,1);
  line(c,straw[3],6,-38,3,-35,1);
  block(c,-10,-9,20,3,timber[2]);
  block(c,-9,-9,17,1,timber[4]);
}

function bellCounter(c) {
  casework(c,-40,0,80,32,9,timber);
  shape(c,teal[1],[[-36,-17],[-31,-15],[29,-15],[35,-17],[35,-5],
    [28,-3],[-31,-3],[-36,-5]]);
  shape(c,teal[2],[[-33,-14],[-29,-12],[28,-12],[32,-14],[32,-6],
    [27,-5],[-31,-5],[-33,-7]]);
  block(c,-31,-12,26,1,teal[3]);
  block(c,15,-12,14,1,teal[3]);
  shape(c,brass[1],[[-6,-11],[-5,-14],[-1,-13],[3,-14],[5,-11],
    [4,-7],[2,-5],[-3,-5],[-5,-7]]);
  block(c,-4,-11,3,2,brass[4]);
  block(c,1,-11,2,2,brass[4]);
  block(c,-3,-11,1,1,teal[0]);
  block(c,1,-11,1,1,teal[0]);
  block(c,-1,-9,1,2,brass[3]);
  shape(c,brass[0],[[22,-20],[22,-22],[24,-26],[27,-26],[29,-23],[30,-20]]);
  block(c,23,-22,6,2,brass[2]);
  block(c,24,-24,2,2,brass[4]);
  block(c,25,-27,2,1,brass[4]);
  block(c,22,-20,8,1,brass[3]);
}

function cageLamp(c) {
  shape(c,teal[0],[[-8,-3],[-5,-5],[-2,-6],[-2,-31],[2,-31],[2,-6],
    [6,-5],[8,-3],[6,0],[-7,0]]);
  block(c,-1,-30,1,25,brass[2]);
  block(c,-6,-3,11,1,brass[3]);
  shape(c,brass[0],[[-8,-31],[-8,-42],[-4,-46],[0,-47],[4,-46],[8,-42],
    [8,-31],[6,-28],[-7,-28]]);
  shape(c,'#a7814b',[[-6,-40],[-3,-44],[3,-44],[6,-40],[6,-32],[-6,-32]]);
  block(c,-4,-40,8,8,'#dfb37a');
  block(c,-3,-39,4,6,'#f6d9a4');
  block(c,-2,-38,2,4,'#fff0c6');
  block(c,3,-40,1,9,brass[1]);
  block(c,-6,-33,12,2,brass[3]);
  block(c,-5,-43,10,1,brass[4]);
}

function deliveryCrate(c) {
  casework(c,-18,0,36,24,6,timber);
  block(c,-15,-16,30,12,timber[1]);
  block(c,-13,-15,26,4,timber[2]);
  block(c,-13,-9,26,4,timber[2]);
  block(c,-13,-15,24,1,timber[3]);
  block(c,-13,-9,24,1,timber[3]);
  block(c,-15,-16,3,12,teal[2]);
  block(c,11,-16,3,12,teal[1]);
  block(c,-15,-15,1,10,teal[3]);
  block(c,-6,-13,12,6,'#c5b38a');
  shape(c,'#625b42',[[-4,-12],[-2,-12],[0,-10],[2,-12],[4,-12],[2,-9],[-2,-9]]);
}

export default {
  keeper:{x:-10,y:-37},
  props:[
    {id:'tall_aviary',label:'Teal timber aviary',w:55,h:65,x:-74,y:-58,solid:{width:50,depth:14},animated:true,paint:(c,time)=>{
      tallAviary(c);
      drawSnowyOwl(c,{x:-1,y:-25,faceX:1,faceY:1,owlPhase:'perch',hp:1,visualSeed:10,owlVariant:'pigwidgeon'},time,32);
    }},
    {id:'brass_floor_cage',label:'Brass cage with snowy owl',w:49,h:62,x:-19,y:-52,solid:{width:42,depth:16},animated:true,paint:brassCage},
    {id:'wall_cage',label:'Wall hung cage',w:33,h:45,x:27,y:-62,paint:wallCage},
    {id:'birch_roost',label:'Forked birch roost',w:47,h:64,x:72,y:-46,solid:{width:25,depth:13},animated:true,paint:birchRoost},
    {id:'net_rack',label:'Catcher net rack',w:27,h:56,x:-82,y:-16,solid:{width:22,depth:9},paint:netRack},
    {id:'bell_counter',label:'Owl crest bell counter',w:80,h:32,x:-11,y:-4,solid:{width:76,depth:16},paint:bellCounter},
    {id:'feather_bundle',label:'Quill feather bundle',w:23,h:22,x:-33,y:-26,surface:'bell_counter',paint:featherBundle},
    {id:'feed_bowl',label:'Seed tasting bowl',w:19,h:10,x:-1,y:-25,surface:'bell_counter',paint:feedBowl},
    {id:'seed_bin',label:'Banded seed bin',w:33,h:24,x:-78,y:34,solid:{width:29,depth:13},paint:seedBin},
    {id:'delivery_crate',label:'Wing stamped delivery crate',w:36,h:24,x:-76,y:68,solid:{width:33,depth:13},paint:deliveryCrate},
    {id:'travel_basket',label:'Woven traveling basket',w:35,h:28,x:-33,y:67,solid:{width:30,depth:11},paint:travelBasket},
    {id:'woven_nest',label:'Straw nest with two eggs',w:30,h:15,x:13,y:64,solid:{width:25,depth:10},paint:wovenNest},
    {id:'cage_lamp',label:'Honey glass cage lamp',w:17,h:48,x:78,y:42,solid:{width:13,depth:9},paint:cageLamp},
    {id:'water_bath',label:'Limestone water bath',w:41,h:15,x:72,y:67,solid:{width:35,depth:12},paint:waterBath},
  ],
};
