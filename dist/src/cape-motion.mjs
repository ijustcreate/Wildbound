// Stateless cloth approximation: pinned shoulders, delayed travelling folds,
// and a trailing/lifting hem. Deterministic when scrubbing or rendering replays.
export function capeRows(top,bottom,actor,time,style='',shoulders){
 const moving=actor.moving||['run','walk','dash'].includes(actor.animationAction);
 const drive=actor.dashTime>0||actor.animationAction==='dash'?2.5:moving?1:0;
  const motion=0.6;
 const airborne=Math.min(1,(actor.jumpHeight||0)/30);
 const descent=Math.min(1,Math.max(0,-(actor.jumpVelocity||0))/190)*airborne;
 const length=style==='tattered'?1.35:['short','pointed'].includes(style)?.5:1;
 const hems=style==='tattered'?[1,.62,.86,1]:null;
 return Array.from({length:25},(_,i)=>{
  const t=i/24,free=Math.sin(t*Math.PI/2),phase=time*(drive?10:3.5)-t*5;
  const wave=Math.sin(phase)+.35*Math.sin(phase*1.8+.7);
  const sway=free*wave*(.8+drive*2)*motion;
  const fallLag=free*free*descent;
  const trail=free*(drive*7*motion+airborne*5+wave*(.7+drive*1.2)*motion)*length+fallLag*2.5*length;
  const z=top[2]+(Math.max(3,bottom[2]-11)-top[2])*t*length+free*(drive*5*motion+airborne*7+Math.sin(phase+.8)*(1+drive*3)*motion)*length+fallLag*6*length;
  const x=top[0]+(bottom[0]-top[0])*t+sway,y=top[1]-3+(bottom[1]-top[1]-1)*t-trail;
  const width=style==='pointed'?Math.max(.15,4*(1-t)):4+2*t;
  const left=[x-width,y,z+free*Math.sin(phase+.5)*(.4+drive)],right=[x+width,y,z-free*Math.sin(phase+.5)*(.4+drive)];
  if(shoulders)for(const [edge,pin,sign] of [[left,shoulders.left,-1],[right,shoulders.right,1]]){
    const rest=[top[0]+sign*4,top[1]-3,top[2]];
    const anchor=[pin[0],pin[1]-3,pin[2]];
    for(let k=0;k<3;k++)edge[k]+=(anchor[k]-rest[k])*(1-t);
  }
  const point=u=>left.map((v,k)=>v+(right[k]-v)*u);
  const segments=hems?hems.flatMap((h,j)=>t<=h?[{left:point(j/hems.length),right:point((j+1)/hems.length),hem:t+1/24>h}]:[]):[{left,right,hem:i===24}];
  return {left,right,segments,fold:wave};
 });
}
