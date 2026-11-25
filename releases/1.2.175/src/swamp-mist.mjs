import {realmTerrainAt} from './realm-world.mjs';
// Small, cached two-height mist atlas. It uses a handful of soft, advected
// banks rather than full-screen particles or per-pixel CPU simulation.
export const SWAMP_MIST_LIMITS=Object.freeze({width:320,height:180,hz:12,banks:12});
const now=()=>globalThis.performance?.now?.()??Date.now();

export function swampMistActive(g){
 return g?.generatedEnvironment==='swamp'&&g.phase==='play'&&!g.openingBoard&&(g.players||[]).some(p=>!p.room&&p.hp>0);
}

export class SwampMistRenderer{
 constructor(){this.canvas=null;this.active=false;this.frames=0;this.lastAt=-Infinity;}
 initialize(){
  if(this.canvas||typeof document==='undefined')return this.canvas;
  const canvas=document.createElement('canvas');canvas.width=SWAMP_MIST_LIMITS.width;canvas.height=SWAMP_MIST_LIMITS.height*2;
  this.canvas=canvas;this.ctx=canvas.getContext('2d');return this.canvas;
 }
 prepare(g,time,camera=null,viewWidth=0,viewHeight=0){
  this.active=swampMistActive(g);if(!this.active)return false;
  const canvas=this.initialize();if(!canvas||!this.ctx)return false;
  const stamp=now();if(stamp-this.lastAt<1000/SWAMP_MIST_LIMITS.hz)return true;
  const c=this.ctx,w=canvas.width,h=SWAMP_MIST_LIMITS.height,phase=(time||0)*.14;
  c.clearRect(0,0,w,h*2);
  for(let layer=0;layer<2;layer++){
   const yoff=layer*h,upper=layer===1;
   // Stagger the upper wisps and make them thinner so actors remain legible.
   c.save();c.globalCompositeOperation='lighter';
   for(let i=0;i<SWAMP_MIST_LIMITS.banks;i++){
    const seed=i*2.39996323, x=((i*83+Math.sin(phase+seed)*30)% (w+100)+w+100)%(w+100)-50;
    const y=yoff+((i*47+Math.cos(phase*.7+seed)*15)%h+h)%h;
    if(camera){const wx=camera.x+(x/w-.5)*viewWidth/camera.zoom,wy=camera.y+((y-yoff)/h-.5)*viewHeight/camera.zoom;
     if(!['water','shallow'].includes(realmTerrainAt(g,Math.floor(wx/32),Math.floor(wy/32))))continue;
    }
    const rx=30+(i%4)*17,ry=7+(i%3)*4,alpha=(upper?.037:.095)*(i%4===0?1.25:1);
    const grad=c.createRadialGradient(x,y,1,x,y,rx);
    grad.addColorStop(0,`rgba(174,205,169,${alpha})`);
    grad.addColorStop(.48,`rgba(121,168,148,${alpha*.62})`);
    grad.addColorStop(1,'rgba(75,126,117,0)');
    c.fillStyle=grad;c.save();c.translate(x,y);c.scale(1,ry/rx);c.translate(-x,-y);c.fillRect(x-rx,y-rx,rx*2,rx*2);c.restore();
   }
   c.restore();
  }
  this.lastAt=stamp;this.frames++;return true;
 }
 draw(ctx,camera,w,h,upper=false,worldSpace=false){
  if(!this.active||!this.canvas)return false;
  const half=this.canvas.height/2,sy=upper?half:0;
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(worldSpace){
   const left=camera.x-w/(2*camera.zoom),top=camera.y-h/(2*camera.zoom);
   ctx.drawImage(this.canvas,0,sy,this.canvas.width,half,left,top,w/camera.zoom,h/camera.zoom);
  }else ctx.drawImage(this.canvas,0,sy,this.canvas.width,half,0,0,w,h);
  ctx.restore();return true;
 }
}
