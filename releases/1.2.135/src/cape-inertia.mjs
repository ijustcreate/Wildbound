// Render-only motion history. Never persisted on actors or fed back into physics.
// One sample per simulation time, independent of camera/shadow render count.
export class CapeInertia {
 constructor(){this.samples=new Map();}
 sample(actor,time){
  if(actor.id==null||!Number.isFinite(actor.x)||!Number.isFinite(actor.y))return undefined;
  const key=(actor.kind||'player')+':'+actor.id,previous=this.samples.get(key),dt=previous?time-previous.time:0;
  if(previous&&dt===0)return previous.motion;
  // Dash afterimages render a slightly older timestamp: they must not rewind
  // the live cloth history. A real world-clock reset still starts fresh.
  if(previous&&dt<0&&dt>-.25)return previous.motion;
  const moved=previous?Math.hypot(actor.x-previous.x,actor.y-previous.y):0;
  let motion={vx:0,vy:0,phase:time*3.5};
  if(previous&&dt>0&&dt<=.25&&moved<Math.max(80,dt*900)){
   const blend=1-Math.exp(-dt*9);
   const vx=previous.motion.vx+((actor.x-previous.x)/dt-previous.motion.vx)*blend,vy=previous.motion.vy+((actor.y-previous.y)/dt-previous.motion.vy)*blend;
   motion={vx,vy,phase:previous.motion.phase+dt*(3.5+Math.min(1,Math.hypot(vx,vy)/133)*6.5)};
  }
  if(this.samples.size>=256&&!this.samples.has(key))this.samples.delete(this.samples.keys().next().value);
  this.samples.set(key,{x:actor.x,y:actor.y,time,motion});return motion;
 }
}
