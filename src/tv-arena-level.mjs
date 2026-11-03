// Hand-authored side-view course. Feet coordinates and collision share this data.
export const ARENA_WIDTH=2880, ARENA_FLOOR=437, ARENA_BOARD_X=1440;
export const ARENA_ENEMIES=Object.freeze(['bramblecap','mossback']);
export function createArenaLevel(){
  const platforms=[];
  const ledge=(x,y,w,h=28,style='stone')=>platforms.push({x,y,w,h,style});
  // Lower routes remain open. Every step rises at most 76 (jump apex is 108).
  for(const [x,y,w,h] of [[80,361,180,30],[220,285,170,30],[325,209,240,32],[520,361,155,30],[650,285,150,30],[790,209,155,30],[950,173,200,32],[1070,361,155,30],[1190,285,150,30]])ledge(x,y,w,h);
  for(const [x,y,w,h] of [[2620,361,180,30],[2490,285,170,30],[2315,209,240,32],[2205,361,155,30],[2080,285,150,30],[1935,209,155,30],[1730,173,200,32],[1655,361,155,30],[1540,285,150,30]])ledge(x,y,w,h);
  ledge(1250,209,130);ledge(1500,209,130);ledge(1380,209,120,24,'bridge');
  ledge(1300,125,280,26);
  const tubes=[
    {id:'a-low',pair:'a-high',rune:'A',x:430,y:389,w:48,h:48},
    {id:'a-high',pair:'a-low',rune:'A',x:430,y:161,w:48,h:48},
    {id:'b-low',pair:'b-high',rune:'B',x:2450,y:389,w:48,h:48},
    {id:'b-high',pair:'b-low',rune:'B',x:2450,y:161,w:48,h:48},
    {id:'c-west',pair:'c-east',rune:'C',x:1020,y:125,w:48,h:48},
    {id:'c-east',pair:'c-west',rune:'C',x:1860,y:125,w:48,h:48},
  ];
  const playerSpawns=[{id:'hearth',x:1320,y:437,label:'BOARD HEARTH'},{id:'west',x:55,y:437,label:'WEST GATE'},{id:'east',x:2575,y:437,label:'EAST GATE'},{id:'crown',x:1440,y:125,label:'CROWN'}];
  const enemySpawns=[{id:'west-root',x:265,y:437,face:1},{id:'west-canopy',x:535,y:209,face:-1},{id:'west-bridge',x:1130,y:361,face:1},{id:'east-root',x:2615,y:437,face:-1},{id:'east-canopy',x:2345,y:209,face:1},{id:'east-bridge',x:1750,y:361,face:-1}];
  const blocks=[[170,265],[610,265],[735,189],[900,113],[1130,265],[1740,265],[1980,113],[2145,189],[2270,265],[2710,265],[1000,341],[1880,341]].map(([x,y])=>({x,y,used:false,bump:0}));
  const pickups=[[150,340],[310,264],[550,188],[715,264],[860,188],[1110,152],[1210,340],[1310,188],[1430,188],[1570,188],[1675,340],[1770,152],[2020,188],[2160,264],[2350,188],[2550,264],[2720,340]].map(([x,y],id)=>({id,x,y,collected:false}));
  return {platforms,tubes,playerSpawns,enemySpawns,blocks,pickups};
}
export function arenaSolids(mode){return [...mode.platforms,...mode.tubes.map(t=>({x:t.x-t.w/2,y:t.y,w:t.w,h:t.h,style:'tube'}))];}

// Axis-separated swept collision, including undersides and sides of masonry.
export function moveArenaBody(body,dt,solids,width=ARENA_WIDTH,{half=12,height=58}={}){
  const oldX=body.x,oldY=body.y;
  body.x=Math.max(half+20,Math.min(width-half-20,body.x+body.vx*dt));
  let blocked=false;
  for(const s of solids)if(oldY>s.y+.5&&oldY-height<s.y+s.h-.5&&body.x+half>s.x&&body.x-half<s.x+s.w){
    if(oldX+half<=s.x+.5&&body.vx>0){body.x=s.x-half;blocked=true;}
    else if(oldX-half>=s.x+s.w-.5&&body.vx<0){body.x=s.x+s.w+half;blocked=true;}
  }
  body.vy=Math.min(800,(body.vy||0)+1250*dt);body.y+=body.vy*dt;body.grounded=false;
  for(const s of solids)if(body.x+half>s.x+.5&&body.x-half<s.x+s.w-.5){
    if(body.vy>=0&&oldY<=s.y+.5&&body.y>=s.y){body.y=s.y;body.vy=0;body.grounded=true;}
    else if(body.vy<0&&oldY-height>=s.y+s.h-.5&&body.y-height<=s.y+s.h){body.y=s.y+s.h+height;body.vy=20;}
  }
  if(body.y>=ARENA_FLOOR){body.y=ARENA_FLOOR;body.vy=0;body.grounded=true;}
  return blocked||body.x===half+20||body.x===width-half-20;
}
