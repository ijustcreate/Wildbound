const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const p=require('node:child_process').spawnSync(require('electron'),[__filename],{cwd:root,env,windowsHide:true,stdio:'inherit',timeout:240000});process.exit(p.status??1);}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output/cemetery-fog');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const deadline=setTimeout(()=>app.exit(1),225000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false}});w.webContents.setAudioMuted(true);
 const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);
   const [{Game},{Assets},{Renderer},{CemeteryFogRenderer}]=await Promise.all([import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/render.mjs'),import('./src/cemetery-fog.mjs')]);
   const checks=[],pictures={},assert=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
   const assets=new Assets();await assets.load();
   const g=new Game(()=>.5);g.seed=75;g.environment='graveyard';const hero=g.addPlayer('keyboard','Mist QA');g.start();
   g.openingBoard=false;g.bloom=3;g.time=30;g.event=g.reveal=null;g.weather=null;g.spriteLibrary=assets.library;g.sky.elapsed=310;
   g.explored=new Set(Array.from({length:2500},(_,i)=>i));hero.x=850;hero.y=1390;hero.inventory=[{type:'lantern',count:1}];
   const canvas=document.createElement('canvas');canvas.style='position:fixed;inset:0;width:1280px;height:850px';document.body.append(canvas);
   const r=new Renderer(canvas,assets);r.camera={x:900,y:1350,zoom:1.45};r.draw(g,0);
   assert(r.cemeteryFog.status().ready&&!r.cemeteryFog.status().failed,'Native WebGL fog compiled in the actual renderer');
   assert(r.cemeteryFog.status().width<=320&&r.cemeteryFog.status().height<=180,'Both height layers share one bounded low-resolution render target');
   pictures['woodland-path']=canvas.toDataURL();
   hero.x=800;hero.y=940;r.camera={x:800,y:960,zoom:1.55};g.time+=1;r.draw(g,0);pictures['graveyard']=canvas.toDataURL();
   const probe=document.createElement('canvas');probe.width=640;probe.height=400;const ctx=probe.getContext('2d'),fog=new CemeteryFogRenderer(),camera={x:800,y:950,zoom:1};
   const frame={ambient:.2,sources:[{x:740,y:920,height:32,radius:230,intensity:1,color:'#ffb35c',inventoryLight:true,owner:'test'}]};
   const paint=(name,encode=true)=>{ctx.clearRect(0,0,640,400);ctx.fillStyle='#101c28';ctx.fillRect(0,0,640,400);fog.prepare(g,camera,640,400,frame);fog.draw(ctx,camera,640,400);fog.draw(ctx,camera,640,400,true);if(!encode)return;const data=probe.toDataURL();if(name)pictures[name]=data;return data;};
   const a=paint('fog-warm');assert(a===paint(),'Paused simulation leaves fog pixels stable');
   g.time+=3;const b=paint('fog-drift');assert(a!==b,'Mist banks drift over simulation time');
   frame.sources[0].color='#60aaff';g.time+=.1;const blue=paint('fog-blue');assert(blue!==b,'Mist scattering follows source color');
   frame.sources[0].x+=160;g.time+=.1;assert(paint()!==blue,'Scattering follows a moving lantern');
   const samples=[],cpu=[],refresh=[];for(let i=0;i<40;i++){g.time+=1/24+.0001;const t=performance.now();paint(null,false);fog.surface.gl.finish();if(i>=5){samples.push(performance.now()-t);cpu.push(fog.cpuMs);}}
   for(let i=0;i<25;i++){for(const slot of fog.slots)if(slot)slot.at=-Infinity;frame.sources[0].x+=4;g.time+=1/24+.0001;const t=performance.now();paint(null,false);fog.surface.gl.finish();if(i>=5)refresh.push(performance.now()-t);}
   const stats=values=>{values.sort((a,b)=>a-b);return {median:values[Math.floor(values.length/2)],p95:values[Math.floor(values.length*.95)],max:values.at(-1)};};
   const maxCanvas=document.createElement('canvas');maxCanvas.width=1920;maxCanvas.height=1080;const maxCtx=maxCanvas.getContext('2d'),maxSamples=[];
   for(let i=0;i<20;i++){g.time+=1/24+.0001;const t=performance.now();fog.prepare(g,camera,1920,1080,frame);fog.draw(maxCtx,camera,1920,1080);fog.draw(maxCtx,camera,1920,1080,true);fog.surface.gl.finish();if(i>=5)maxSamples.push(performance.now()-t);}
   const syncBaseline=[],syncEffect=[];
   for(let i=0;i<25;i++){
    let t=performance.now();ctx.fillStyle='#101c28';ctx.fillRect(0,0,640,400);ctx.getImageData(0,0,1,1);const baseline=performance.now()-t;
    g.time+=1/24+.0001;t=performance.now();paint(null,false);ctx.getImageData(0,0,1,1);const effect=performance.now()-t;
    if(i>=5){syncBaseline.push(baseline);syncEffect.push(effect);}
   }
   const info=fog.surface.gl.getExtension('WEBGL_debug_renderer_info');
   const timing={shaderFinishAndCanvasSubmissionMs:stats(samples),submitCpuMs:stats(cpu),movingShadowRefreshAndSubmissionMs:stats(refresh),maxSurfaceSubmission1920x1080Ms:stats(maxSamples),synchronizedCanvasBaselineMs:stats(syncBaseline),synchronizedCanvasEffectMs:stats(syncEffect),synchronizedMedianDeltaMs:stats(syncEffect).median-stats(syncBaseline).median,samples:samples.length,renderer:info?fog.surface.gl.getParameter(info.UNMASKED_RENDERER_WEBGL):fog.surface.gl.getParameter(fog.surface.gl.RENDERER),status:fog.status()};
   const prepare=r.cemeteryFog.prepare;
   const pacing=async enabled=>{
    r.cemeteryFog.prepare=enabled?prepare:function(){this.active=false;return false;};
    const cpu=[],interval=[];let last=0;
    for(let i=0;i<65;i++){await new Promise(raf);const now=performance.now();g.time+=1/60;const t=performance.now();r.draw(g,0);if(i>=10){cpu.push(performance.now()-t);interval.push(now-last);}last=now;}
    return {drawCpuMs:stats(cpu),frameIntervalMs:stats(interval),frames:cpu.length};
   };
   timing.nativeRendererWithoutFog=await pacing(false);timing.nativeRendererWithFog=await pacing(true);
   hero.room='crypt';g.time+=1;r.draw(g,0);assert(!r.cemeteryFog.active,'Surface fog disabled while every player is underground');hero.room=null;
   g.generatedEnvironment='forest';assert(!fog.prepare(g,camera,640,400,frame),'Shader skips other biomes');
   return {checks,pictures,timing,status:r.cemeteryFog.status()};
  })()`);
  for(const [name,data]of Object.entries(result.pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  delete result.pictures;result.errors=errors;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(errors.length)throw Error('Renderer errors');clearTimeout(deadline);app.exit(0);
 }catch(e){console.error(e.stack);console.error(JSON.stringify(errors));clearTimeout(deadline);app.exit(1);}
});
