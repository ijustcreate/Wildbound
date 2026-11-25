import {castleFurniture,castleWall,drawCastleFloor} from './wild-castle-interior-art.mjs';

export {CASTLE_INTERIOR_SIZE} from './wild-castle-site.mjs';
const rect=(x,y,w,h,kind)=>({x,y,w,h,kind});
const doorway=(x,start,end,w=10)=>rect(x,start,w,end-start,'threshold');
export const GREYHAVEN_KITCHEN_FIREPLACE=Object.freeze(rect(163,190,51,28,'hearth'));
export const GREYHAVEN_THRONE=Object.freeze({
 ...rect(451,124,58,32,'throne'),id:'greyhaven-throne',label:'Throne',seat:Object.freeze({x:480,y:150}),
 stand:Object.freeze({x:480,y:180}),seatDepth:157,faceX:0,faceY:1,
});
function chair(x,y,faceX,faceY,clearance=24){
 const w=15,h=17,seat={x:x+w/2,y:y+10};
 return {...rect(x,y,w,h,'chair'),id:`chair:${x}:${y}`,label:'Chair',seat,seatDepth:y+h+1,
  stand:{x:seat.x-faceX*clearance,y:seat.y-faceY*clearance},faceX,faceY};
}
const towerCenters=[
 {link:'northwest',x:130,y:130,side:1}, {link:'northeast',x:830,y:130,side:-1},
 {link:'southwest',x:130,y:630,side:1}, {link:'southeast',x:830,y:630,side:-1},
];
const floors=[rect(134,116,692,528,'stone'),rect(406,76,148,82,'stone'),rect(414,625,132,100,'stone'),
 ...towerCenters.map(({x,y})=>({x,y,r:78,kind:'tower'}))];
const perimeter=[
 rect(199,116,207,14,'outer'),rect(554,116,207,14,'outer'),
 rect(406,78,148,14,'outer'),rect(406,90,13,32,'outer'),rect(541,90,13,32,'outer'),
 rect(134,197,15,366,'outer'),rect(811,197,15,366,'outer'),
 rect(199,630,215,14,'outer'),rect(546,630,215,14,'outer'),
 rect(414,644,14,65,'outer'),rect(532,644,14,65,'outer'),
];
const upperEntry=[rect(428,695,104,13,'outer')];
const rampartGaps=(x,y)=>({xSign:x<480?1:-1,ySign:y<380?1:-1});
const towerRim=towerCenters.flatMap(({x,y})=>{
 const {xSign,ySign}=rampartGaps(x,y);
 const walls=[];
 for(let step=0;step<28;step++){
  const a=step*Math.PI/14,dx=Math.cos(a),dy=Math.sin(a);
  if(dx*xSign>.63&&dy*ySign>-.58||dy*ySign>.83&&dx*xSign>-.34)continue;
  walls.push({...rect(Math.round(x+dx*69)-10,Math.round(y+dy*69)-9,20,18,'tower'),towerX:x,towerY:y});
 }
 return walls;
});

function towerStairs(story){
 return towerCenters.flatMap(({x,y,link,side})=>{
  const spawn={x:x+side*41,y:y+(y<380?29:-29)};
  const make=(direction,dy)=>({...rect(x-26,y+dy,52,24,'stairs'),direction,link,spawn});
  return story===1?[make(1,-5)]:story===2?[make(-1,-38),make(1,13)]:[make(-1,-5)];
 });
}

const sharedDecor=[rect(413,135,17,14,'banner'),rect(530,135,17,14,'banner'),
 ...[216,340,507].flatMap(y=>[rect(149,y,7,9,'sconce'),rect(804,y,7,9,'sconce')]),
 rect(251,134,9,8,'sconce'),rect(700,134,9,8,'sconce'),rect(247,614,9,8,'sconce'),rect(704,614,9,8,'sconce')];

const ground={
 zones:[rect(150,174,169,175,'kitchen'),rect(150,360,169,173,'cellar'),rect(644,169,164,366,'banquet')],
 rugs:[rect(429,181,102,405,'lion')],
 doorways:[doorway(319,242,300),doorway(319,401,462),doorway(629,243,315),doorway(629,447,508)],
 walls:[rect(149,174,180,10,'inside'),rect(319,181,10,61,'inside'),rect(319,300,10,101,'inside'),rect(319,462,10,69,'inside'),
  rect(149,349,170,10,'inside'),rect(149,531,180,10,'inside'),
  rect(629,174,182,10,'inside'),rect(629,184,10,59,'inside'),rect(629,315,10,132,'inside'),rect(629,508,10,33,'inside'),rect(629,531,182,10,'inside')],
 furniture:[GREYHAVEN_KITCHEN_FIREPLACE,rect(164,236,42,24,'barrels'),
  rect(213,258,79,40,'prep'),rect(270,199,38,23,'copper'),rect(160,320,91,18,'shelves'),
  rect(158,373,27,130,'barrels'),rect(193,390,52,24,'crates'),rect(252,486,50,25,'crates'),rect(278,378,27,44,'barrels'),
  rect(674,207,110,23,'sideboard'),rect(697,309,38,156,'feast'),
  ...[338,361,384,407].flatMap(y=>[chair(667,y,1,0),chair(747,y,-1,0)]),
  rect(790,297,18,110,'shelves'),rect(656,476,23,21,'plant'),rect(773,484,24,22,'plant'),
  ...[265,477].flatMap(y=>[rect(374,y,24,25,'knight'),rect(562,y,24,25,'knight')]),
  rect(367,380,10,10,'sconce'),rect(580,380,10,10,'sconce'),rect(511,661,15,14,'lever')],
 entrance:{x:480,y:712,spawn:{x:480,y:683}},lever:{x:521,y:654},
};

const atrium=rect(366,258,228,268,'atrium');
const gallery={
 zones:[rect(150,174,169,171,'timber'),rect(150,354,169,176,'timber'),rect(644,169,164,176,'stone'),rect(644,354,164,176,'timber')],
 rugs:[rect(466,567,68,29,'runner'),rect(673,201,104,94,'crest'),rect(660,379,133,120,'runner')],
 voids:[atrium],
 lowerHallRug:ground.rugs[0],
 doorways:[doorway(320,228,290),doorway(320,389,454),doorway(630,235,291),doorway(630,390,450)],
 walls:[rect(149,174,181,10,'inside'),rect(320,182,10,46,'inside'),rect(320,290,10,99,'inside'),rect(320,454,10,87,'inside'),
  rect(149,344,181,10,'inside'),rect(149,531,181,10,'inside'),
  rect(630,174,181,10,'inside'),rect(630,182,10,53,'inside'),rect(630,291,10,99,'inside'),rect(630,450,10,91,'inside'),
  rect(630,344,181,10,'inside'),rect(630,531,181,10,'inside'),
  rect(360,249,240,10,'rail'),rect(360,526,240,10,'rail'),rect(360,258,9,268,'rail'),rect(591,258,9,268,'rail')],
 furniture:[rect(387,153,21,20,'plant'),rect(552,153,21,20,'plant'),
  rect(155,189,18,111,'shelves'),rect(188,187,109,17,'shelves'),rect(196,252,96,42,'dining'),
  ...[203,226,249].flatMap(x=>[chair(x,228,0,1,22),chair(x,301,0,-1,21)]),
  rect(163,374,77,36,'greenBed'),rect(163,461,77,36,'greenBed'),rect(263,373,35,20,'bedsideChest'),rect(270,489,25,23,'bedsideChest'),
  rect(705,226,44,44,'roundTable'),rect(765,192,28,19,'sideboard'),rect(787,247,16,68,'shelves'),
  rect(710,412,77,49,'redBed'),rect(776,489,24,23,'bedsideChest'),rect(653,364,58,17,'shelves')],
};

const solar={
 zones:[rect(344,128,272,282,'solar'),rect(150,300,160,181,'timber'),rect(650,300,160,181,'timber')],
 rugs:[rect(380,191,200,160,'crest'),rect(181,339,108,112,'arcaneRug'),rect(671,342,106,103,'runner')],
 doorways:[doorway(344,308,364,12),doorway(604,308,364,12),doorway(302,361,417,11),doorway(647,361,417,11)],
 walls:[rect(344,161,12,147,'inside'),rect(604,161,12,147,'inside'),
  rect(344,364,12,82,'inside'),rect(604,364,12,82,'inside'),
  rect(344,429,66,13,'inside'),rect(550,429,66,13,'inside'),
  rect(149,294,162,12,'inside'),rect(302,304,11,57,'inside'),rect(302,417,11,67,'inside'),rect(149,475,164,12,'inside'),
  rect(648,294,163,12,'inside'),rect(647,304,11,57,'inside'),rect(647,417,11,67,'inside'),rect(647,475,164,12,'inside')],
 furniture:[GREYHAVEN_THRONE,{...rect(421,116,9,9,'sconce'),blocking:false},{...rect(531,116,9,9,'sconce'),blocking:false},
  rect(362,145,56,22,'shelves'),rect(356,164,18,63,'shelves'),rect(542,145,56,22,'shelves'),rect(586,164,18,63,'shelves'),
  rect(362,383,25,23,'plant'),rect(573,379,25,23,'plant'),rect(405,428,16,15,'post'),rect(539,428,16,15,'post'),
  rect(179,312,104,18,'shelves'),rect(158,347,16,88,'shelves'),rect(210,369,52,52,'orb'),rect(272,435,22,21,'plant'),
  rect(677,313,104,19,'shelves'),rect(790,349,16,85,'shelves'),rect(684,370,85,42,'desk'),
  {...chair(719,428,0,-1),variant:'stool'},rect(669,438,21,19,'plant'),
  rect(414,525,132,47,'dining'),
  ...[421,444,467,490,513].flatMap(x=>[chair(x,505,0,1),chair(x,577,0,-1,22)]),
  rect(296,521,26,24,'plant'),rect(638,520,26,24,'plant')],
 steps:rect(420,410,120,31,'steps'),dais:rect(422,110,116,88,'dais'),
};

const plans=[ground,gallery,solar].map((plan,index)=>{
 const story=index+1;
 const walls=[...perimeter,...towerRim,...(story>1?upperEntry:[]),...plan.walls].map(w=>{
  if(w.kind!=='outer'&&w.kind!=='inside')return w;
  return {...w,profile:w.w<w.h?'side':w.y<200?'rear':'cutaway'};
 });
 return {...plan,story,floors,stairs:towerStairs(story),towerCenters,voids:plan.voids||[],seats:plan.furniture.filter(f=>f.seat),
  walls,
  furniture:[...plan.furniture,...sharedDecor.filter(p=>story!==3||p.kind!=='banner').map(p=>({...p,blocking:false}))]};
});

export function castleInteriorPlan(story){return plans[story-1];}

export function drawCastleInteriorGround(c,story){
 const plan=castleInteriorPlan(story);
 if(!plan)return;
 drawCastleFloor(c,plan);
}

export function castleInteriorSubjects(story,time=0,bridgeRaised=false,flooGreen=false){
 const plan=castleInteriorPlan(story);
 if(!plan)return [];
 return [
  ...plan.walls.map(w=>({depth:w.y+w.h,paint:c=>castleWall(c,w)})),
  ...plan.doorways.flatMap(({x,y,w,h})=>[y-4,y+h].map(edge=>{
   const jamb=rect(x-1,edge,w+2,4,'jamb');
   return {depth:edge+4,paint:c=>castleWall(c,jamb)};
  })),
  ...plan.furniture.map(f=>({depth:f.y+f.h,paint:c=>castleFurniture(c,f,time,bridgeRaised,flooGreen&&f===GREYHAVEN_KITCHEN_FIREPLACE)})),
 ];
}
