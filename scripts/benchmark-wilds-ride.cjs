const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const stage=process.env.WILDBOUND_RIDE_STAGE||(base===root?'source':'packaged');
const output=path.join(root,'test-output','wilds-ride',stage);
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-ride-')));
app.commandLine.appendSwitch('mute-audio');
const deadline=setTimeout(()=>app.exit(1),220000);

app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1200,height:790,webPreferences:{backgroundThrottling:false}}),errors=[];
 win.webContents.setAudioMuted(true);
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await win.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   window.requestAnimationFrame=()=>0;
   const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs');
   const {enterWildLands}=await import('./src/wild-lands.mjs');
   const {trainCars,trainWorld}=await import('./src/train-track.mjs');
   const {trainInterior}=await import('./src/train-design.mjs');
   const assets=wildboundPolishTest.assets,rows=[];
   const wait=()=>new Promise(resolve=>setTimeout(resolve,0));
   const summarize=values=>{const sorted=values.slice().sort((a,b)=>a-b),n=sorted.length;return {
    median:sorted[Math.floor(n*.5)],p95:sorted[Math.ceil(n*.95)-1],max:sorted.at(-1),mean:values.reduce((sum,v)=>sum+v,0)/n,
   };};
   const metrics=(samples,costs)=>{for(const [name,value]of Object.entries(costs||{}))(samples[name]??=[]).push(value);};
   const collapse=samples=>Object.fromEntries(Object.entries(samples).map(([name,values])=>[name,summarize(values)]));
   for(const scene of [{name:'seating-and-jungle',count:1,car:3},{name:'compartments-and-curves',count:4,car:2,advance:1850}]){
    const g=new Game(()=>.5);for(let i=0;i<scene.count;i++)g.addPlayer(i?'pad:'+i:'keyboard','Rider '+i);
    g.start();g.openingBoard=false;g.spriteLibrary=assets.library;g.persist=()=>{};g.onSound=()=>{};
    if(!enterWildLands(g,{persistent:true}).ok)throw Error('Cannot enter the Wilds');
    g.sky.elapsed=120;
    const t=g.trainTest,canvas=document.createElement('canvas');
    canvas.style.cssText='width:1180px;height:760px';document.body.append(canvas);
    const renderer=new Renderer(canvas,assets);
    const preparationDeadline=performance.now()+9000;
    while(t.preparing&&performance.now()<preparationDeadline){renderer.draw(g,1/60);await wait();}
    if(t.preparing)throw Error('Local Wilds preparation did not release');
    t.distance+=scene.advance||0;
    const car=trainCars(t)[scene.car],seats=trainInterior(t.design,car).filter(o=>o.kind==='seat');
    g.players.forEach((p,i)=>{
     const seat=seats[i*2];p.trainRide={car:car.index,x:seat?.x??i*25,y:seat?.y??0,seat:seat?car.id+':'+seat.id:null,facing:0};
     Object.assign(p,trainWorld(car,p.trainRide.x,p.trainRide.y));
    });
    t.roof[car.id]=0;t.engine=true;t.throttle=.76;t.speed=t.design.maxSpeed*t.throttle;
    g.portalTransition=null;t.noticeUntil=0;renderer.trainScene=null;
    const start=t.distance;
    const first=performance.now();g.update(1/60,{});renderer.draw(g,1/60);const firstMs=performance.now()-first;
    for(let i=0;i<26;i++){g.update(1/60,{});renderer.draw(g,1/60);await wait();}
    const update=[],draw=[],total=[],renderPhases={},updatePhases={};renderer.trainLayerMetrics={};
    let grassFrames=0,groundPending=0,grassHoles=0;
    for(let i=0;i<160;i++){
     const a=performance.now();g.update(1/60,{});const b=performance.now();renderer.draw(g,1/60);const c=performance.now();
     update.push(b-a);draw.push(c-b);total.push(c-a);metrics(renderPhases,t.drawCosts);metrics(updatePhases,t.updateCosts);
     grassFrames+=Number(t.shaderGrass);groundPending+=t.streamCoverage?.groundPending||0;grassHoles+=t.streamCoverage?.grassHoles||0;
     await wait();
    }
    if(g.players.some(p=>!p.trainRide)||t.distance-start<100||t.derailed)throw Error('The riders did not complete a moving ride');
    rows.push({name:scene.name,riders:scene.count,moved:t.distance-start,firstMs,update:summarize(update),draw:summarize(draw),total:summarize(total),
     renderPhases:collapse(renderPhases),updatePhases:collapse(updatePhases),riderMasks:renderer.trainLayerMetrics,grassFrames,groundPending,grassHoles,worker:t.terrainStream?.errors||[],
     grass:renderer.railwayGrass?.stats?.(),picture:canvas.toDataURL()});
   }
   const gl=document.createElement('canvas').getContext('webgl2');
   const gpu=gl?.getExtension('WEBGL_debug_renderer_info');
   return {rows,gpu:gpu?gl.getParameter(gpu.UNMASKED_RENDERER_WEBGL):null};
  })()`);
  for(const row of result.rows){fs.writeFileSync(path.join(output,row.name+'.png'),Buffer.from(row.picture.split(',')[1],'base64'));delete row.picture;}
  const report={...result,stage,muted:win.webContents.isAudioMuted(),errors};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({stage,gpu:report.gpu,errors,rows:report.rows.map(({name,draw,update,total,grassFrames})=>({name,draw,update,total,grassFrames}))}));
  clearTimeout(deadline);app.exit(errors.length||!report.muted?1:0);
 }catch(error){console.error(error.stack,errors);clearTimeout(deadline);app.exit(1);}
});
