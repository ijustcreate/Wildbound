// Stateless cloth approximation: pinned shoulders, delayed travelling folds,
// and a trailing/lifting hem. Deterministic when scrubbing or rendering replays.
export function capeRows(top,bottom,actor,time,style='',shoulders,options={}){
 const moving=actor.moving||['run','walk','dash'].includes(actor.animationAction);
 const speed=actor.capeMotion?Math.hypot(actor.capeMotion.vx,actor.capeMotion.vy):null;
 const drive=speed!==null?Math.min(1.35,speed/160):actor.dashTime>0||actor.animationAction==='dash'?1.35:moving?(actor.walking||actor.animationAction==='walk'?.4:.85):0;
 const motion=.5;
 const airborne=Math.min(1,(actor.jumpHeight||0)/30);
 const descent=Math.min(1,Math.max(0,-(actor.jumpVelocity||0))/190)*airborne;
 const ascent=Math.min(1,Math.max(0,actor.jumpVelocity||0)/125)*airborne;
 let drag=[0,-1];
 if(speed>.5&&Number.isFinite(options.direction)){
  const angle=options.direction*Math.PI/4,c=Math.cos(angle),s=Math.sin(angle),vx=-actor.capeMotion.vx,vy=-actor.capeMotion.vy*2;
  const x=vx*c+vy*s,y=-vx*s+vy*c,length=Math.hypot(x,y)||1;drag=[x/length,y/length];
 }
 // Keep every trailing cape above the feet. Long cloth styles used to extend
 // below the character's boots when equipped, especially during movement.
 const length=Math.max(.25,Math.min(1,options.length??(style==='spectral'?.76:style==='tattered'?.72:style==='wilderness'?.68:['short','pointed'].includes(style)?.5:.68)));
 const hems=style==='spectral'?[.82,1,.67,.9]:style==='tattered'?[1,.62,.86,1]:style==='wilderness'?[.78,1,.66,.9]:null;
 return Array.from({length:25},(_,i)=>{
  const t=i/24,free=Math.sin(t*Math.PI/2),phase=(actor.capeMotion?.phase??time*(3.5+Math.min(1,drive)*6.5))-t*5;
  const wave=Math.sin(phase)+.35*Math.sin(phase*1.8+.7);
  const sway=free*wave*(.8+drive*2)*motion;
  const fallLag=free*free*descent;
  const trail=free*free*(drive*6*motion+airborne*3+wave*(.4+drive*.6)*motion)*length+fallLag*1.5*length;
  const z=top[2]+(Math.max(3,bottom[2]-11)-top[2])*t*length+free*(drive*6*motion+airborne*5+Math.sin(phase+.8)*(1+drive*2)*motion)*length+fallLag*6*length-free*free*ascent*7*length;
  const x=top[0]+(bottom[0]-top[0])*t+sway+drag[0]*trail*.6,y=top[1]-3+(bottom[1]-top[1]-1)*t+drag[1]*trail;
  const width=style==='pointed'?Math.max(.15,4*(1-t)):style==='safari'?5+5*t:4+2*t;
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
