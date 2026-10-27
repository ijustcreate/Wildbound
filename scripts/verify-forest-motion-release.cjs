const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,label=process.env.WILDBOUND_PERF_LABEL||'candidate',out=path.join(root,'test-output/forest-motion-release',label);fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1440,height:960,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);if(e.message.startsWith('QA '))console.log(e.message);});try{
 await w.loadFile(path.join(base,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');w.showInactive();
 // Stop the harness page's unrelated lobby loop. Only the measured Game below
 // may consume frames; otherwise two complete scenes compete for the same GPU.
 await w.webContents.executeJavaScript('window.qaRequestFrame=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;new Promise(window.qaRequestFrame)');
 await w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Profiler.enable');await w.webContents.debugger.sendCommand('Profiler.start');
 const data=await w.webContents.executeJavaScript(`(async()=>{
  const {Game,EVENTS}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs'),{Assets}=await import('./src/assets.mjs'),{updateBoundlessWorld}=await import('./src/boundless-world.mjs'),{strikeTallGrass}=await import('./src/tall-grass.mjs'),{saveSession,restoreSession}=await import('./src/session.mjs');
  const assets=new Assets();await assets.load();const c=document.createElement('canvas');c.style.cssText='position:fixed;inset:0;width:1440px;height:900px';document.body.append(c);const r=new Renderer(c,assets);r.setDynamicShadows(true);
  const g=new Game(()=>.5,{deferWorld:true});g.seed=42;g.mapMode='boundless';g.environment='forest';const p=g.addPlayer('keyboard','Forest QA');g.onSound=()=>{};g.persist=()=>{};g.start();g.openingBoard=false;g.bloom=3;g.weather=null;g.time=20;g.boundlessSpawnTimer=99999;g.spriteLibrary=assets.library;p.invincible=true;
  const stats=a=>({mean:a.reduce((s,v)=>s+v,0)/a.length,p95:[...a].sort((a,b)=>a-b)[Math.ceil(a.length*.95)-1],max:Math.max(...a)}),scenarios=[],images={},checks=[],streaming=[];
  function settle(x,y){p.x=x;p.y=y;for(let n=0;n<120;n++){const t=performance.now();updateBoundlessWorld(g,1/60);streaming.push(performance.now()-t);if(n>12&&g.boundlessLoadedChunks.length>=8)break;}g.explored=new Set();for(let ty=Math.floor(y/32)-30;ty<Math.floor(y/32)+30;ty++)for(let tx=Math.floor(x/32)-30;tx<Math.floor(x/32)+30;tx++)g.explored.add(tx+','+ty);}
  for(const [name,x,y,roam,wildlife]of [['clearing',810,890,false,false],['outer-roam',2400,800,true,false],['negative-roam',-800,800,true,false],['stampede',810,890,true,true]]){
   settle(x,y);
   if(wildlife){const event=EVENTS.findIndex(e=>e.name==='Twenty thunders');g.spawnEvent(event,{test:true,force:true});g.eventTime=999;}
   const updates=[],draws=[],totals=[],intervals=[],gpu=[];let previous=0,queries=[],timer=null,gl=null,disjoint=false;
   for(let i=0;i<115;i++){
    await new Promise(resolve=>window.qaRequestFrame(resolve));const now=performance.now();if(i>=35&&previous)intervals.push(now-previous);previous=now;
    const begin=performance.now();g.update(1/60,{keyboard:{x:roam?(i%80<40?1:-1):0,y:0}});const after=performance.now();
    r.camera={x,y,zoom:1.05};r.draw(g,0);const end=performance.now();
    if(i>=35){updates.push(after-begin);draws.push(end-after);totals.push(end-begin);}
    if(i===34&&r.grassField?.gl){
     gl=r.grassField.gl;timer=gl.getExtension('EXT_disjoint_timer_query_webgl2');
     if(timer){const original=gl.drawArraysInstanced.bind(gl);let calls=0;gl.drawArraysInstanced=(...args)=>{if(++calls%20)return original(...args);const q=gl.createQuery();gl.beginQuery(timer.TIME_ELAPSED_EXT,q);original(...args);gl.endQuery(timer.TIME_ELAPSED_EXT);queries.push(q);};}
    }
    if(timer){disjoint||=gl.getParameter(timer.GPU_DISJOINT_EXT);queries=queries.filter(q=>{if(!gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE))return true;gpu.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);return false;});}
   }
   scenarios.push({name,updateMs:stats(updates),renderMs:stats(draws),totalCpuMs:stats(totals),frameIntervalMs:stats(intervals),grassGpuBatchMs:gpu.length&&!disjoint?stats(gpu):null,grassInstances:r.grassField?.instances,grassCache:r.grassField?.chunks?.size??null,scenery:g.scenery.length,enemies:g.enemies.length});
   console.log('QA '+name+' '+JSON.stringify(scenarios.at(-1)));images[name]=c.toDataURL();
   if(timer){for(const q of queries)gl.deleteQuery(q);delete gl.drawArraysInstanced;}
  }
  // A real seam crossing drives incremental streaming alongside moving actors.
  settle(1585,800);const seam=[],seamRender=[],seamTotal=[];
  for(let i=0;i<60;i++){
   const t=performance.now();g.update(1/60,{keyboard:{x:1,y:0}});const after=performance.now();
   r.camera={x:p.x,y:p.y,zoom:1.05};r.draw(g,0);const end=performance.now();
   seam.push(after-t);seamRender.push(end-after);seamTotal.push(end-t);await new Promise(resolve=>setTimeout(resolve,0));
  }checks.push('Positive seam update and moving-camera render completed');
  const patch=g.scenery.find(v=>v.kind==='tall_grass'&&!v.cut);let geometryUploadsOnCut=null;
  if(patch){p.x=patch.x-25;p.y=(patch.rootY??patch.y)-14;p.faceX=1;p.faceY=0;p.equipment.hand1='sword';r.camera={x:p.x,y:p.y,zoom:1.05};r.draw(g,0);const gl=r.grassField.gl,upload=gl.bufferData.bind(gl);let uploads=0;gl.bufferData=(...a)=>{uploads++;return upload(...a);};strikeTallGrass(g,p,90,{blade:true});r.draw(g,0);geometryUploadsOnCut=uploads;delete gl.bufferData;checks.push('Grass cut exercised');}
  const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));if(restored.mapMode!=='boundless'||restored.generatedEnvironment!=='forest')throw Error('Save lost forest destination');checks.push('Forest session round trip');
  const gl=r.grassField.gl,ext=gl.getExtension('WEBGL_debug_renderer_info');if(gl.getError())throw Error('WebGL error');
  return {scenarios,streamingMs:stats(streaming),seamUpdateMs:stats(seam),seamRenderMs:stats(seamRender),seamTotalMs:stats(seamTotal),geometryUploadsOnCut,checks,images,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,size:[c.width,c.height],dpr:devicePixelRatio};})()`);
 const profile=await w.webContents.debugger.sendCommand('Profiler.stop');fs.writeFileSync(path.join(out,'cpu-profile.json'),JSON.stringify(profile.profile));for(const [name,url]of Object.entries(data.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));delete data.images;data.errors=errors;data.base=base;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(data,null,2));console.log(JSON.stringify(data));app.exit(errors.length?1:0);
}catch(e){console.error(e);app.exit(1);}});
