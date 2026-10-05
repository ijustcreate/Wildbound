export function renderLOD(zoom) { return zoom < .55 ? 2 : zoom < 1 ? 1 : 0; }
// Bounded RAM cache, not an entire-world bitmap. Interactive state stays live.
export class DecorationCache {
  constructor(limit = 24 * 1024 * 1024) { this.limit=limit;this.bytes=0;this.entries=new Map(); }
  draw(ctx,prop,tier,paint) {
    if(!tier || prop.falling || prop.burning || prop.harvest || !['tree','snow_tree','palm','bush','rock','fern'].includes(prop.kind))return paint(ctx);
    const key=prop.id??`${prop.kind}:${prop.x}:${prop.y}`;
    const signature=[tier,prop.kind,prop.size,prop.x,prop.y,prop.rootY,prop.fallen,prop.seed,prop.variant,prop.treeType,prop.season,prop.leafHabit].join(':');
    let entry=this.entries.get(key);
    if(entry?.signature!==signature){if(entry){this.bytes-=entry.bytes;this.entries.delete(key);}entry=null;}
    if(!entry){
      const radius=Math.max(48,(prop.size||64)*2.5),scale=tier===1?.65:.3;
      const pixels=Math.min(512,Math.ceil(radius*2*scale));
      const canvas=document.createElement('canvas');canvas.width=canvas.height=pixels;
      const c=canvas.getContext('2d');c.scale(pixels/(radius*2),pixels/(radius*2));c.translate(radius-prop.x,radius-prop.y);
      paint(c);entry={canvas,radius,signature,bytes:pixels*pixels*4};
      while(this.bytes+entry.bytes>this.limit&&this.entries.size){const oldest=this.entries.keys().next().value;this.bytes-=this.entries.get(oldest).bytes;this.entries.delete(oldest);}
      this.bytes+=entry.bytes;
    }else this.entries.delete(key);
    this.entries.set(key,entry);ctx.drawImage(entry.canvas,prop.x-entry.radius,prop.y-entry.radius,entry.radius*2,entry.radius*2);return true;
  }
}
export class ActorPoseCache {
  constructor(){this.entries=new Map();}
  draw(ctx,actor,tier,time,size,paint){
    if(!tier||actor.isPlayer||actor.attack>0||actor.flash>0||actor.jumpHeight>0||actor.sink>0)return paint(ctx,actor,time);
    const key=actor.id??actor,frame=Math.floor(time*(tier===1?12:5)),signature=[frame,tier,size,actor.kind,actor.sprite,actor.faceX,actor.faceY,actor.moving,actor.state].join(':');
    let e=this.entries.get(key);
    if(e?.signature!==signature){const pixels=tier===1?128:64,canvas=e?.canvas||document.createElement('canvas');canvas.width=canvas.height=pixels;const c=canvas.getContext('2d'),radius=size*1.6;c.scale(pixels/(radius*2),pixels/(radius*2));c.translate(radius,radius);paint(c,{...actor,x:0,y:0},frame/(tier===1?12:5));e={signature,canvas,radius};}
    this.entries.delete(key);if(this.entries.size>=128)this.entries.delete(this.entries.keys().next().value);this.entries.set(key,e);ctx.drawImage(e.canvas,actor.x-e.radius,actor.y-e.radius,e.radius*2,e.radius*2);
  }
}
