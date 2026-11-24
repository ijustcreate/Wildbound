// Original Canvas adaptation of 2D advected ground fog with layered depth.
// Solver/reference notes: docs/history/2026-11-22-shadow-fluid-fog.md.
const CELL=16,INNER=48,BORDER=2,N=INNER+BORDER*2,SPAN=CELL*INNER,MAX_FIELDS=8,STEP=1/30;
const states=new WeakMap(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
function noise(x,y,seed){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=hash(ix+seed,iy),b=hash(ix+seed+1,iy),d=hash(ix+seed,iy+1),e=hash(ix+seed+1,iy+1);return (a+(b-a)*u)*(1-v)+(d+(e-d)*u)*v;}
function density(x,y,time,seed){
 const warp=noise(x/240+time*.012,y/240-time*.008,seed+14)*1.8;
 const n=noise(x/105+warp-time*.026,y/105+warp+time*.017,seed)*.7+noise(x/43-time*.023,y/43+time*.01,seed+9)*.3;
 return clamp((n-.3)*2.8,.035,.98);
}
function sample(a,x,y){x=clamp(x,0,N-1.001);y=clamp(y,0,N-1.001);const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,i=iy*N+ix;return (a[i]*(1-fx)+a[i+1]*fx)*(1-fy)+(a[i+N]*(1-fx)+a[i+N+1]*fx)*fy;}
function createField(px,py,scale,time,seed){
 const f={px,py,scale,cell:CELL*scale,x:px*SPAN*scale-BORDER*CELL*scale,y:py*SPAN*scale-BORDER*CELL*scale,revision:0,textureRevision:-1};
 for(const key of ['d','u','v','nextD','nextU','nextV','pressure','nextP','div'])f[key]=new Float32Array(N*N);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++)f.d[y*N+x]=density(f.x+x*f.cell,f.y+y*f.cell,time,seed);
 return f;
}
function impulse(f,x,y,dx,dy,radius,strength,ring=false){
 const gx=(x-f.x)/f.cell,gy=(y-f.y)/f.cell,r=radius/f.cell;
 for(let cy=Math.max(1,Math.floor(gy-r-1));cy<=Math.min(N-2,Math.ceil(gy+r+1));cy++)for(let cx=Math.max(1,Math.floor(gx-r-1));cx<=Math.min(N-2,Math.ceil(gx+r+1));cx++){
  const ox=cx-gx,oy=cy-gy,dist=Math.hypot(ox,oy);if(dist>r)continue;
  const i=cy*N+cx,t=1-dist/r,fall=t*t,inv=1/(dist||1);
  // Remove a trail core; push its displaced mist to the sides, with a curl.
  f.d[i]*=1-clamp(strength*fall,0,.94);
  f.u[i]=clamp(f.u[i]+dx*fall*.07+ox*inv*strength*t*2.5-oy*strength*fall*.6,-12,12);
  f.v[i]=clamp(f.v[i]+dy*fall*.07+oy*inv*strength*t*2.5+ox*strength*fall*.6,-12,12);
  if(ring&&dist>r*.6)f.d[i]=Math.min(1,f.d[i]+strength*.2*t);
 }
}
function vortex(f,x,y,radius,spin,power){
 const gx=(x-f.x)/f.cell,gy=(y-f.y)/f.cell,r=radius/f.cell;
 for(let cy=Math.max(1,Math.floor(gy-r));cy<=Math.min(N-2,Math.ceil(gy+r));cy++)for(let cx=Math.max(1,Math.floor(gx-r));cx<=Math.min(N-2,Math.ceil(gx+r));cx++){
  const ox=cx-gx,oy=cy-gy,d=Math.hypot(ox,oy)/r;if(d>=1)continue;
  const i=cy*N+cx,roll=Math.sin(d*Math.PI)*power*spin;
  f.u[i]=clamp(f.u[i]-oy/r*roll,-12,12);f.v[i]=clamp(f.v[i]+ox/r*roll,-12,12);
  // A little displaced mist gathers into the rolling edge of each wake.
  f.d[i]=clamp(f.d[i]+Math.sin(d*Math.PI)*power*.012,0,1);
 }
}
function tick(f,time,seed){
 const {d,u,v,nextD,nextU,nextV,div,pressure}=f;
 // Semi-Lagrangian backtracing keeps large impulses bounded. A small
 // pressure projection removes divergence; background curl keeps idle fog alive.
 for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){
  const i=y*N+x,wx=f.x+x*f.cell,wy=f.y+y*f.cell,bx=x-u[i]*STEP,by=y-v[i]*STEP;
  nextU[i]=sample(u,bx,by)*.99+Math.sin(wy*.009+time*.18)*.02;
  nextV[i]=sample(v,bx,by)*.99+Math.cos(wx*.008-time*.14)*.018;
 }
 pressure.fill(0);f.nextP.fill(0);
 for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){const i=y*N+x;div[i]=-.5*(nextU[i+1]-nextU[i-1]+nextV[i+N]-nextV[i-N]);}
 for(let iteration=0;iteration<5;iteration++){
  for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){const i=y*N+x;f.nextP[i]=(div[i]+f.pressure[i-1]+f.pressure[i+1]+f.pressure[i-N]+f.pressure[i+N])*.25;}
  [f.pressure,f.nextP]=[f.nextP,f.pressure];
 }
 for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){
  const i=y*N+x;u[i]=clamp(nextU[i]-.5*(f.pressure[i+1]-f.pressure[i-1]),-12,12);v[i]=clamp(nextV[i]-.5*(f.pressure[i+N]-f.pressure[i-N]),-12,12);
  const target=density(f.x+x*f.cell,f.y+y*f.cell,time,seed),edge=x<2||y<2||x>N-3||y>N-3;
  nextD[i]=edge?target:clamp(sample(d,x-u[i]*STEP,y-v[i]*STEP)*.993+target*.007,0,1);
 }
 [f.d,f.nextD]=[nextD,d];f.revision++;
}
function stateFor(g){
 let s=states.get(g);if(!s||s.seed!==(g.seed||0)){s={seed:g.seed||0,time:g.time||0,accumulator:0,fields:new Map(),actors:new Map(),rolls:[],steps:0,wakes:0,swirls:0,landings:0,attacks:0};states.set(g,s);}return s;
}
function actors(g){return [...(g.players||[]),...(g.enemies||[]).slice(0,16)].filter(p=>p.hp>0&&!p.room&&!p.vehicleId&&Number.isFinite(p.x)&&Number.isFinite(p.y));}
function advance(g,s){
 const time=g.time||0,dt=time-s.time;if(dt<=0){if(dt<0){s.fields.clear();s.actors.clear();s.rolls=[];s.time=time;}return;}
 const moving=[];
 for(const p of actors(g)){
  const prev=s.actors.get(p),height=(p.jumpHeight||0)+(p.groundHeight||0),attack=(p.attack||0)>0;
  if(prev&&dt<.25){const dx=p.x-prev.x,dy=p.y-prev.y,distance=Math.hypot(dx,dy);if(distance<100)moving.push({p,prev,dx,dy,distance,height,landing:prev.jumpHeight>0&&!(p.jumpHeight>0)&&height<5,attack:attack&&(!prev.attack||p.attack>prev.attackTime+.03)});}
  s.actors.set(p,{x:p.x,y:p.y,height,jumpHeight:p.jumpHeight||0,attack,attackTime:p.attack||0});
 }
 const live=new Set(actors(g));for(const p of s.actors.keys())if(!live.has(p))s.actors.delete(p);
 // Rendering twice for split-screen must not advance time or inject twice.
 s.accumulator=Math.min(.1,s.accumulator+dt);const steps=Math.min(3,Math.floor((s.accumulator+1e-8)/STEP));s.accumulator-=steps*STEP;
 for(const f of s.fields.values()){
  for(const m of moving){const {p,prev,dx,dy,distance,height}=m;
   if(p.x<f.x-100||p.y<f.y-100||p.x>f.x+N*f.cell+100||p.y>f.y+N*f.cell+100)continue;
   if(height<5&&distance>.3){
    const speed=distance/dt,run=clamp((speed-80)/180,0,1),slices=Math.max(1,Math.ceil(distance/10));
    for(let i=1;i<=slices;i++)impulse(f,prev.x+dx*i/slices,prev.y+dy*i/slices,dx/dt,dy/dt,30+run*15,clamp(distance/10,.15,1));
    if(run>0){const fx=dx/distance,fy=dy/distance,power=(2+run*5)*Math.min(1,dt*30);for(const side of [-1,1])vortex(f,p.x-fx*22-fy*side*29,p.y-fy*22+fx*side*29,64+run*18,side,power);}
   }
   if(m.landing)impulse(f,p.x,p.y,0,0,82,1.3,true);
   if(m.attack){const fx=p.faceX||0,fy=p.faceY||0;impulse(f,p.x+fx*40,p.y+fy*40,fx*200,fy*200,65,1.1,true);}
  }
  for(let i=0;i<steps;i++)tick(f,time,s.seed);
 }
 s.rolls=s.rolls.filter(r=>time-r.birth<2.8);
 for(const m of moving){if(m.distance>.3&&m.height<5){s.wakes++;if(m.distance/dt>80){s.swirls++;if(Math.floor(time*6)!==Math.floor(s.time*6))for(const side of [-1,1]){const fx=m.dx/m.distance,fy=m.dy/m.distance;s.rolls.push({x:m.p.x-fx*15-fy*side*22,y:m.p.y-fy*15+fx*side*22,dx:fx,dy:fy,spin:side,birth:time});}}}if(m.landing)s.landings++;if(m.attack)s.attacks++;}
 if(s.rolls.length>64)s.rolls.splice(0,s.rolls.length-64);
 s.steps+=steps;s.time=time;
}
function fieldsFor(g,bounds){
 const s=stateFor(g);advance(g,s);
 const left=bounds.sx*32,top=bounds.sy*32,right=(bounds.ex+1)*32,bottom=(bounds.ey+1)*32;
 let scale=1;while((Math.floor(right/(SPAN*scale))-Math.floor(left/(SPAN*scale))+1)*(Math.floor(bottom/(SPAN*scale))-Math.floor(top/(SPAN*scale))+1)>MAX_FIELDS)scale*=2;
 const result=[];
 for(let py=Math.floor(top/(SPAN*scale));py<=Math.floor(bottom/(SPAN*scale));py++)for(let px=Math.floor(left/(SPAN*scale));px<=Math.floor(right/(SPAN*scale));px++){
  const key=px+':'+py+':'+scale;let f=s.fields.get(key);
  if(!f){f=createField(px,py,scale,g.time||0,s.seed);s.fields.set(key,f);}
  else{s.fields.delete(key);s.fields.set(key,f);}result.push(f);
 }
 while(s.fields.size>MAX_FIELDS)s.fields.delete(s.fields.keys().next().value);
 return result;
}
function texture(f){
 if(!f.canvas){f.canvas=document.createElement('canvas');f.canvas.width=f.canvas.height=N;f.ctx=f.canvas.getContext('2d');f.image=f.ctx.createImageData(N,N);}
 if(f.textureRevision!==f.revision){
  const pixels=f.image.data;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
   const i=y*N+x,k=i*4,normal=(f.d[i]-f.d[Math.min(N*N-1,i+N)])*120,body=clamp((f.d[i]-.08)*1.35,0,1);
   pixels[k]=clamp(149+normal+body*20,112,210);pixels[k+1]=clamp(151+normal+body*22,115,216);pixels[k+2]=clamp(177+normal+body*23,145,236);pixels[k+3]=Math.round(body*195);
  }
  f.ctx.putImageData(f.image,0,0);f.textureRevision=f.revision;
 }return f.canvas;
}
// Bounded, round cloud sculptures. The fluid field controls their density;
// eight curl phases turn the lit rim inward instead of sliding flat streaks.
const cloudStamps=new Map(),frontBuffers=new WeakMap();
function rollingCloud(phase=0,variant=0){
 const key=phase+':'+variant;if(cloudStamps.has(key))return cloudStamps.get(key);
 const canvas=document.createElement('canvas');canvas.width=96;canvas.height=72;const c=canvas.getContext('2d'),im=c.createImageData(96,72);
 const curve=[];for(let i=0;i<90;i++){const t=i/89,a=t*Math.PI*3.2+phase*Math.PI/4,r=2+t*23;curve.push([49+Math.cos(a)*r,35+Math.sin(a)*r*.82]);}
 for(let y=0;y<72;y++)for(let x=0;x<96;x++){
  let edge=-1;for(const [cx,cy,rx,ry]of [[23,44,22,18],[38,30,24,25],[62,33,23,24],[74,45,20,18]])edge=Math.max(edge,1-((x-cx)/rx)**2-((y-cy)/ry)**2);
  if(edge<=0)continue;
  let distance=99;for(const [cx,cy]of curve)distance=Math.min(distance,Math.hypot(x-cx,y-cy));
  const ridge=Math.max(0,1-distance/3.5),shade=Math.floor((1-y/72)*4)/4,eye=Math.max(0,1-Math.hypot((x-49)/11,(y-35)/9));
  const light=shade*30+ridge*32-eye*22,i=(y*96+x)*4;
  im.data[i]=152+light+variant*3;im.data[i+1]=145+light;im.data[i+2]=181+light;im.data[i+3]=Math.round(Math.min(1,edge*7)*238);
 }c.putImageData(im,0,0);cloudStamps.set(key,canvas);return canvas;
}
export function drawShadowGroundFog(c,g,bounds={sx:0,sy:0,ex:50,ey:50},layer='front'){
 if(g.generatedEnvironment!=='shadow')return 0;
 const {sx=0,sy=0,ex=50,ey=50}=bounds;if(![sx,sy,ex,ey].every(Number.isFinite)||ex<sx||ey<sy)return 0;
 const fields=fieldsFor(g,{sx,sy,ex,ey}),time=g.time||0,left=sx*32,top=sy*32,right=(ex+1)*32,bottom=(ey+1)*32;
 // Composite the low foreground separately so nearby banks cannot veil faces.
 const target=c;let buffer,scale=1;
 if(layer==='front'&&c.canvas){
  buffer=frontBuffers.get(c.canvas);if(!buffer){buffer=document.createElement('canvas');frontBuffers.set(c.canvas,buffer);}
  scale=Math.min(1,1024/(right-left),768/(bottom-top));const w=Math.ceil((right-left)*scale),h=Math.ceil((bottom-top)*scale);
  if(buffer.width!==w||buffer.height!==h){buffer.width=w;buffer.height=h;}
  c=buffer.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);c.scale(scale,scale);c.translate(-left,-top);
 }
 let draws=0;const phase=(n)=>((Math.floor(time*5)+n)%8+8)%8;
 const puff=(x,y,w,h,alpha,n)=>{if(draws>=192||x<left-w||x>right+w||y<top-h||y>bottom+h)return;c.globalAlpha=clamp(alpha,0,1);c.drawImage(rollingCloud(phase(n),n%2),x-w/2,y-h*.68,w,h);draws++;};
 c.save();c.beginPath();c.rect(left,top,right-left,bottom-top);c.clip();c.imageSmoothingEnabled=false;
 if(layer==='base'){
  // World anchored, overlapping scalloped banks; no screen-sized translucent sheet.
  let spacing=90;while((right-left+spacing*2)*(bottom-top+spacing*2)/(spacing*spacing)>160)spacing*=1.4;
  for(let gy=Math.floor(top/spacing)-1;gy<=Math.ceil(bottom/spacing);gy++)for(let gx=Math.floor(left/spacing)-1;gx<=Math.ceil(right/spacing);gx++){
   const seed=hash(gx,gy),x=(gx+.5)*spacing+(seed-.5)*28+Math.sin(time*.3+gy)*7,y=(gy+.5)*spacing+(hash(gy,gx)-.5)*26;
   const d=sampleShadowGroundFog(g,x,y)??.2;
   // Root/foot gaps let each bank flow around the subject, rather than across it.
   let gap=1;for(const p of actors(g))gap=Math.min(gap,clamp(Math.hypot((x-p.x)/50,(y-p.y)/35),.08,1));
   puff(x,y,spacing*1.65,spacing*1.12,clamp((d-.05)*1.15,.02,.84)*gap,Math.floor(seed*7));
  }
 }else{
  // Local low curls cross the roots and shins only. Upper bodies stay clear.
  const roots=[...(g.scenery||[]).filter(p=>p.realm&&!p.distant&&!p.depleted&&!p.fallen&&p.size>=45).slice(0,300),...actors(g)];
  for(const p of roots){const y=p.rootY??(p.realm?p.y+p.size*.19:p.y),x=p.x;if(x<left-80||x>right+80||y<top-50||y>bottom+50)continue;
   const d=sampleShadowGroundFog(g,x,y)??.3,n=Math.floor(hash(x,y)*7),a=time*.65+n;
   for(const side of [-1,1])puff(x+side*(19+Math.sin(a)*5),y+13+Math.cos(a)*4,65,45,clamp(d*.8,.13,.6),n+(side>0?2:0));
  }
  for(const roll of stateFor(g).rolls){
   const age=time-roll.birth,angle=age*4.4*roll.spin,r=15+age*14,along=(Math.cos(angle)-1)*r,across=Math.sin(angle)*r*.7;
   const x=roll.x-roll.dx*age*12+roll.dx*along-roll.dy*across,y=roll.y-roll.dy*age*12+roll.dy*along+roll.dx*across;
   puff(x,y,70+age*20,54+age*12,.94*(1-age/2.8)*Math.min(1,age*10),roll.spin>0?0:4);
  }
 }
 if(buffer){
  c.globalCompositeOperation='destination-out';c.globalAlpha=1;
  for(const p of actors(g)){
   const y=p.y-(p.jumpHeight||0);c.save();c.translate(p.x,y-42);c.scale(1,1.2);
   const clear=c.createRadialGradient(0,0,15,0,0,30);clear.addColorStop(0,'#000000');clear.addColorStop(1,'#00000000');c.fillStyle=clear;c.fillRect(-30,-30,60,60);c.restore();
  }
 }
 c.restore();if(buffer){target.save();target.imageSmoothingEnabled=false;target.drawImage(buffer,left,top,right-left,bottom-top);target.restore();}
 const state=stateFor(g);state[layer+'CloudDraws']=draws;return fields.length*(layer==='base'?2:1);
}
export function shadowFogDiagnostics(g){const s=states.get(g);return s?{fields:s.fields.size,maxFields:MAX_FIELDS,steps:s.steps,wakes:s.wakes,swirls:s.swirls,billows:s.rolls.length,maxBillows:64,landings:s.landings,attacks:s.attacks,cellsPerField:N*N,baseCloudDraws:s.baseCloudDraws||0,frontCloudDraws:s.frontCloudDraws||0,maxCloudDraws:192,cloudStamps:cloudStamps.size}:null;}
export function sampleShadowFogVelocity(g,x,y){const s=states.get(g);if(!s)return null;for(const f of s.fields.values())if(x>=f.px*SPAN*f.scale&&x<(f.px+1)*SPAN*f.scale&&y>=f.py*SPAN*f.scale&&y<(f.py+1)*SPAN*f.scale)return {x:sample(f.u,(x-f.x)/f.cell,(y-f.y)/f.cell),y:sample(f.v,(x-f.x)/f.cell,(y-f.y)/f.cell)};return null;}
export function sampleShadowGroundFog(g,x,y){const s=states.get(g);if(!s)return null;for(const f of s.fields.values())if(x>=f.px*SPAN*f.scale&&x<(f.px+1)*SPAN*f.scale&&y>=f.py*SPAN*f.scale&&y<(f.py+1)*SPAN*f.scale)return sample(f.d,(x-f.x)/f.cell,(y-f.y)/f.cell);return null;}
