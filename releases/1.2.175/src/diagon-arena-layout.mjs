export const DIAGON_ARENA_ROOM='diagon-arena';
export const ARENA_BOUNDS={x:7410,y:4389,w:974,h:731};
export const ARENA_RING={x:7556,y:4558,w:440,h:298};
export const ARENA_RING_GATE={x:7996,y:4707,top:4681,bottom:4733};
export const ARENA_RING_VERTICES=[
 {x:7644,y:4558},{x:7908,y:4558},{x:7996,y:4618},{x:7996,y:4796},
 {x:7908,y:4856},{x:7644,y:4856},{x:7556,y:4796},{x:7556,y:4618},
];
const perimeter=ARENA_RING_VERTICES.map((a,i)=>({a,b:ARENA_RING_VERTICES[(i+1)%ARENA_RING_VERTICES.length]}));
export const ARENA_FENCE_EDGES=perimeter.flatMap(({a,b})=>a.x===ARENA_RING_GATE.x&&b.x===a.x
 ?[{a,b:{x:a.x,y:ARENA_RING_GATE.top}},{a:{x:a.x,y:ARENA_RING_GATE.bottom},b}]
 :[{a,b}]);
export const ARENA_FENCE_RADIUS=2.5;
export const ARENA_SEATING=[
 {id:'north',x:7776,y:4507,w:212,h:24,seats:7,axis:'x',face:0},
 {id:'south',x:7776,y:4926,w:212,h:24,seats:7,axis:'x',face:4},
 {id:'west',x:7468,y:4711,w:36,h:128,seats:4,axis:'y',face:6},
];
export const ARENA_RACK={x:8075,y:4527,w:62,h:15};
export const ARENA_TORCHES=[[7624,4545],[7930,4545],[7542,4688],[7542,4762],[8010,4666],[8010,4749],[7625,4874],[7919,4874]];
export const ARENA_ARRIVAL={x:8032,y:5016,faceX:0,faceY:-1};
export const ARENA_STAIRS={x:8032,y:5087};
export const ARENA_BAR={x:8192,y:4660};
export const ARENA_BAR_SERVICE={x:8192,y:4703};
export const ARENA_COUNTER={x:8108,y:4670,w:168,h:17};
export const ARENA_ENTRANCES={
 'meridian-hall':{x:7490,y:3661,arrival:{x:7490,y:3705,faceX:0,faceY:1}},
};
export const ARENA_FURNITURE=[
 {kind:'post',x:7580,y:4547,w:20,h:22},
 {kind:'post',x:8019,y:4547,w:20,h:22},
 {kind:'post',x:7580,y:4900,w:20,h:22},
 {kind:'post',x:8341,y:4900,w:20,h:22},
 {kind:'table',x:8080,y:4810,w:59,h:35},
 {kind:'table',x:8232,y:4810,w:59,h:35},
 {kind:'table',x:8176,y:4927,w:59,h:35},
];
const obstacles=[ARENA_COUNTER,{...ARENA_RACK,x:ARENA_RACK.x-ARENA_RACK.w/2,y:ARENA_RACK.y-5},
 ...ARENA_FURNITURE,...ARENA_SEATING.map(({x,y,w,h})=>({x:x-w/2,y:y-h/2,w,h}))];

export const inDiagonArena=g=>g.trainTest?.design.activeRoom===DIAGON_ARENA_ROOM;
export const onArenaRing=({x,y})=>perimeter.every(({a,b})=>(b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x)>0);
export function arenaFighter(g,p){
 return Boolean(inDiagonArena(g)&&p?.arenaVisit&&p.arenaVisit===g.trainTest.arena?.visit&&p.hp>0&&!p.room&&onArenaRing(p));
}

export function arenaShotPermit(p){
 return p.arenaVisit&&onArenaRing(p)?{arenaVisit:p.arenaVisit}:{};
}

export function arenaPlayerSource(g,source){
 if(!source)return null;
 return (g.players||[]).find(p=>p===source||source.owner!=null&&p.id===source.owner)||null;
}

export function arenaCanFight(g,source,target){
 const attacker=arenaPlayerSource(g,source);
 return attacker!==target&&arenaFighter(g,attacker)&&arenaFighter(g,target)&&
  (source===attacker||source.arenaVisit===attacker.arenaVisit&&onArenaRing(source));
}

export function diagonArenaBlocked(x,y,radius=7){
 const b=ARENA_BOUNDS;
 if(x-radius<b.x||y-radius<b.y||x+radius>b.x+b.w||y+radius>b.y+b.h)return true;
 if(obstacles.some(o=>{
  const dx=x-Math.max(o.x,Math.min(x,o.x+o.w)),dy=y-Math.max(o.y,Math.min(y,o.y+o.h));
  return dx*dx+dy*dy<radius*radius;
 }))return true;
 const torchReach=radius+6;
 if(ARENA_TORCHES.some(([tx,ty])=>(tx-x)**2+(ty-y)**2<torchReach*torchReach))return true;
 const reach=radius+ARENA_FENCE_RADIUS;
 if(x<ARENA_RING.x-reach||x>ARENA_RING.x+ARENA_RING.w+reach||y<ARENA_RING.y-reach||y>ARENA_RING.y+ARENA_RING.h+reach)return false;
 return ARENA_FENCE_EDGES.some(({a,b})=>{
  const ex=b.x-a.x,ey=b.y-a.y;
  const t=Math.max(0,Math.min(1,((x-a.x)*ex+(y-a.y)*ey)/(ex*ex+ey*ey)));
  const dx=x-a.x-ex*t,dy=y-a.y-ey*t;
  return dx*dx+dy*dy<=reach*reach;
 });
}
