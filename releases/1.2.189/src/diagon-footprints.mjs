// Alley boot prints stay in world coordinates and never enter save data.
export const DIAGON_FOOTFALL_DISTANCE=30;
const LIFE=7.5,MAX_MARKS=168,TELEPORT_DISTANCE=80;
const states=new WeakMap();
const directions=Array.from({length:8},(_,direction)=>{
 const angle=direction*Math.PI/4,x=Math.cos(angle),y=Math.sin(angle);
 const rotate=([forward,side])=>[Math.round(forward*x-side*y),Math.round(forward*y+side*x)];
 return {
  sole:[[-3,-1],[-3,0],[-2,-1],[-2,0],[0,-1],[0,0],[0,1],[1,-1],[1,0],[1,1],
   [2,-2],[2,-1],[2,0],[2,1],[3,-1],[3,0]].map(rotate),
  shine:[[0,-2],[1,-2],[3,-2],[-3,1]].map(rotate),
 };
});

const alley=t=>t?.design.activeRoom==='diagon';
const grounded=p=>p.hp>0&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&!p.room&&!p.trainRide&&
 !p.pirateRide&&!p.broomMount&&!p.vehicleId&&!p.wingHover&&!p.swimming&&!p.controlledFollowerId&&
 !p.spiritGhost&&!p.ghost&&!(p.jumpHeight>0)&&!(p.groundHeight>0);

export function tickDiagonFootprints(g){
 const train=g.trainTest;
 if(!alley(train)){
  if(train)states.delete(train);
  return;
 }
 const now=train.time,epoch=g.portalTransition?.serial||0;
 let state=states.get(train);
 if(!state||state.epoch!==epoch||now<state.time){
  const serial=state?.serial||0;
  state={epoch,time:-1,marks:[],walkers:new Map(),serial};states.set(train,state);
 }
 if(state.time===now)return;
 state.time=now;
 const timeLimit=now-LIFE;
 while(state.marks[0]?.time<=timeLimit)state.marks.shift();
 const present=new Set();
 for(const p of g.players){
  present.add(p.id);
  if(!grounded(p)){state.walkers.delete(p.id);continue;}
  let walker=state.walkers.get(p.id);
  if(!walker){state.walkers.set(p.id,{x:p.x,y:p.y,distance:0,side:1,last:null});continue;}
  const dx=p.x-walker.x,dy=p.y-walker.y,distance=Math.hypot(dx,dy);
  if(distance>=TELEPORT_DISTANCE){walker.distance=0;walker.last=null;}
  else if(p.moving&&distance>0){
   const yaw=Math.atan2(dy,dx),direction=(Math.round(yaw/(Math.PI/4))+8)%8;
   for(let step=DIAGON_FOOTFALL_DISTANCE-walker.distance;step<=distance;step+=DIAGON_FOOTFALL_DISTANCE){
    walker.side*=-1;
    const x=walker.x+(dx*step+dy*walker.side*3)/distance;
    const y=walker.y+(dy*step-dx*walker.side*3)/distance;
    const mark={x:Math.round(x),y:Math.round(y),time:now,direction,serial:++state.serial};
    state.marks.push(mark);walker.last=mark;
   }
   walker.distance=(walker.distance+distance)%DIAGON_FOOTFALL_DISTANCE;
  }
  walker.x=p.x;walker.y=p.y;
 }
 for(const id of state.walkers.keys())if(!present.has(id))state.walkers.delete(id);
 if(state.marks.length>MAX_MARKS)state.marks.splice(0,state.marks.length-MAX_MARKS);
}

export function latestDiagonFootfall(g,p){
 const train=g.trainTest;
 return alley(train)?states.get(train)?.walkers.get(p.id)?.last||null:null;
}

export function drawDiagonFootprints(c,g,visible){
 const train=g.trainTest,state=alley(train)?states.get(train):null;
 if(!state?.marks.length)return;
 c.save();
 for(const mark of state.marks){
  const fade=1-(train.time-mark.time)/LIFE;
  if(fade<=0||!visible(mark.x,mark.y,7,7))continue;
  const {sole,shine}=directions[mark.direction];
  c.globalAlpha=fade*.54;c.fillStyle='#282f2b';
  for(const [x,y] of sole)c.fillRect(mark.x+x,mark.y+y,1,1);
  c.globalAlpha=fade*.30;c.fillStyle='#a6b29a';
  for(const [x,y] of shine)c.fillRect(mark.x+x,mark.y+y,1,1);
 }
 c.restore();
}
