// Hand-authored side-view course. Feet coordinates and collision share this data.
export const ARENA_WIDTH=2880, ARENA_FLOOR=437, ARENA_BOARD_X=1440;
export const ARENA_JUMP_SPEED=620;
export const ARENA_ENEMIES=Object.freeze(['bramblecap','mossback']);
export function createArenaLevel(){
  const platforms=[];
  const ledge=(x,y,w,h=22,style='stone')=>platforms.push({x,y,w,h,style,oneWay:true});
  // Two broad tiers, 120 units apart: 98 clear units below each stone ledge.
  // Suspended platforms catch descending feet and allow a jump from below.
  ledge(160,317,240);ledge(445,197,625);
  ledge(2480,317,240);ledge(1810,197,625);
  ledge(1100,317,190);ledge(1290,317,300,24,'bridge');ledge(1590,317,190);
  ledge(1340,197,200);
  const tubes=[
    {id:'a-low',pair:'a-high',rune:'A',x:430,y:389,w:48,h:48},
    {id:'a-high',pair:'a-low',rune:'A',x:800,y:149,w:48,h:48},
    {id:'b-low',pair:'b-high',rune:'B',x:2450,y:389,w:48,h:48},
    {id:'b-high',pair:'b-low',rune:'B',x:2080,y:149,w:48,h:48},
    {id:'c-west',pair:'c-east',rune:'C',x:970,y:149,w:48,h:48},
    {id:'c-east',pair:'c-west',rune:'C',x:1910,y:149,w:48,h:48},
  ];
  const playerSpawns=[{id:'hearth',x:1320,y:437,label:'BOARD HEARTH'},{id:'west',x:55,y:437,label:'WEST GATE'},{id:'east',x:2575,y:437,label:'EAST GATE'},{id:'crown',x:1440,y:197,label:'CROWN'}];
  const enemySpawns=[{id:'west-root',x:265,y:437,face:1},{id:'west-canopy',x:535,y:197,face:-1},{id:'west-bridge',x:1130,y:317,face:1},{id:'east-root',x:2615,y:437,face:-1},{id:'east-canopy',x:2345,y:197,face:1},{id:'east-bridge',x:1750,y:317,face:-1}];
  const blocks=[[240,221],[545,101],[850,101],[1180,221],[1310,221],[1570,221],[1700,221],[2030,101],[2335,101],[2640,221],[1000,341],[1880,341]].map(([x,y])=>({x,y,used:false,bump:0}));
  const pickups=[[210,296],[350,296],[500,176],[650,176],[750,176],[900,176],[1140,296],[1260,296],[1310,296],[1440,176],[1570,296],[1620,296],[1740,296],[1980,176],[2130,176],[2260,176],[2620,296]].map(([x,y],id)=>({id,x,y,collected:false}));
  return {platforms,tubes,playerSpawns,enemySpawns,blocks,pickups};
}
export function arenaSolids(mode){return [...mode.platforms,...mode.tubes.map(t=>({x:t.x-t.w/2,y:t.y,w:t.w,h:t.h,style:'tube'}))];}

// Suspended ledges are one-way; tubes and ordinary solids retain full collision.
export function moveArenaBody(body,dt,solids,width=ARENA_WIDTH,{half=12,height=58}={}){
  const oldX=body.x,oldY=body.y;
  body.x=Math.max(half+20,Math.min(width-half-20,body.x+body.vx*dt));
  let blocked=false;
  for(const s of solids)if(!s.oneWay&&oldY>s.y+.5&&oldY-height<s.y+s.h-.5&&body.x+half>s.x&&body.x-half<s.x+s.w){
    if(oldX+half<=s.x+.5&&body.vx>0){body.x=s.x-half;blocked=true;}
    else if(oldX-half>=s.x+s.w-.5&&body.vx<0){body.x=s.x+s.w+half;blocked=true;}
  }
  body.vy=Math.min(800,(body.vy||0)+1250*dt);body.y+=body.vy*dt;body.grounded=false;
  for(const s of solids)if(body.x+half>s.x+.5&&body.x-half<s.x+s.w-.5){
    if(body.vy>=0&&oldY<=s.y+.5&&body.y>=s.y){body.y=s.y;body.vy=0;body.grounded=true;}
    else if(!s.oneWay&&body.vy<0&&oldY-height>=s.y+s.h-.5&&body.y-height<=s.y+s.h){body.y=s.y+s.h+height;body.vy=20;}
  }
  if(body.y>=ARENA_FLOOR){body.y=ARENA_FLOOR;body.vy=0;body.grounded=true;}
  return blocked||body.x===half+20||body.x===width-half-20;
}
