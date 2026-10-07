// Run with local Node: this script launches only its own isolated Electron QA.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),output=path.join(root,'test-output');
if(!process.versions.electron){
 const {spawnSync}=require('node:child_process');fs.mkdirSync(output,{recursive:true});
 const dir=fs.mkdtempSync(path.join(output,'quicksand-qa-'));
 const binary=process.env.WILDBOUND_QUICKSAND_ELECTRON||path.join(output,'electron-41.10.7/electron.exe');
 if(!fs.existsSync(binary))throw Error('QA Electron missing: '+binary);
 for(const mode of ['gpu','canvas']){
  const env={...process.env,WILDBOUND_QUICKSAND_MODE:mode,WILDBOUND_QUICKSAND_OUTPUT:dir};delete env.ELECTRON_RUN_AS_NODE;
  const child=spawnSync(binary,[__filename],{cwd:root,env,windowsHide:true,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
  process.stdout.write(child.stdout||'');process.stderr.write(child.stderr||'');
  if(child.error||child.status!==0){console.error(child.error||'QA failed: '+mode);process.exitCode=1;break;}
 }
 console.log('Quicksand QA artifacts: '+dir);
}else{
 const {app,BrowserWindow}=require('electron');
 const mode=process.env.WILDBOUND_QUICKSAND_MODE||'gpu';
 fs.mkdirSync(output,{recursive:true});const dir=process.env.WILDBOUND_QUICKSAND_OUTPUT||fs.mkdtempSync(path.join(output,'quicksand-qa-'));
 app.setPath('userData',fs.mkdtempSync(path.join(dir,mode+'-profile-')));
 if(mode==='canvas')app.disableHardwareAcceleration();
 app.commandLine.appendSwitch('disable-renderer-backgrounding');app.commandLine.appendSwitch('disable-background-timer-throttling');
 const timer=setTimeout(()=>{console.error('Quicksand QA timeout: '+mode);app.exit(1);},170000);
 app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1000,height:650,useContentSize:true,webPreferences:{offscreen:true}}),errors=[];
  win.webContents.on('render-process-gone',(_,details)=>errors.push(details));
  const run=source=>win.webContents.executeJavaScript('(async()=>{'+source+'})()');
  const screenshot=async name=>{await run('await new Promise(window.quicksandRAF);');const shot=await win.webContents.capturePage();fs.writeFileSync(path.join(dir,mode+'-'+name+'.png'),shot.toPNG());};
  try{
   await win.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'),{query:{tools:'1'}});
   await run('await window.wildboundBoot.ready;window.quicksandRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(window.quicksandRAF);');
   const initial=await run(`
    const [{Game},{Assets},{Renderer},{generateWorld},{QuicksandSurface,buildQuicksandTopology,QUICKSAND_LIMITS}]=await Promise.all([import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/render.mjs'),import('./src/world.mjs'),import('./src/quicksand-surface.mjs')]);
    const assets=new Assets();await assets.load();const g=new Game(()=>.42);Object.assign(g,generateWorld(771,'desert'));
    Object.assign(g,{seed:771,environment:'desert',generatedEnvironment:'desert',phase:'play',openingBoard:false,bloom:3,event:null,reveal:null,time:0});
    g.night={...g.night,phase:'day'};g.weather=null;g.explored=new Set(Array.from({length:2500},(_,i)=>i));
    const topology=buildQuicksandTopology(g.terrain),patch=topology.patches.toSorted((a,b)=>b.tiles-a.tiles)[0];
    const hero=g.addPlayer('keyboard','Quicksand QA'),partner=g.addPlayer('pad:1','Co-op QA');
    Object.assign(hero,{x:patch.x-20,y:patch.y+12,sink:20,hp:100});Object.assign(partner,{x:patch.x+54,y:patch.y+34,sink:0,hp:100});
    const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:999999;image-rendering:pixelated';document.body.append(canvas);
    const r=new Renderer(canvas,assets);if(${JSON.stringify(mode)}==='canvas')r.quicksandSurface=new QuicksandSurface({backend:'canvas'});
    r.camera={x:patch.x,y:patch.y,zoom:1.12};const coldStart=performance.now();r.draw(g,0);const firstWorldSubmitMs=performance.now()-coldStart;
    const state=()=>JSON.stringify({terrain:g.terrain,players:g.players.map(p=>({x:p.x,y:p.y,sink:p.sink,hp:p.hp,breath:p.breath,inventory:p.inventory}))});
    window.quicksandQA={g,r,canvas,patch,state,before:state(),QuicksandSurface,QUICKSAND_LIMITS};
    if(r.quicksandSurface.backend!==${JSON.stringify(mode==='gpu'?'webgl':'canvas')})throw Error('Unexpected quicksand backend: '+r.quicksandSurface.backend);
    return {backend:r.quicksandSurface.backend,patches:topology.patches,firstWorldSubmitMs,stats:{...r.quicksandSurface.stats},viewport:[canvas.width,canvas.height]};
   `);
   await screenshot('world-start');
   await run('const {g,r}=window.quicksandQA;g.time=2.1;r.draw(g,0);');await screenshot('world-swirl');
   const checks=await run(`
    const {g,r,patch,QuicksandSurface,QUICKSAND_LIMITS}=window.quicksandQA,surface=r.quicksandSurface;
    const make=()=>{const c=document.createElement('canvas');c.width=c.height=800;c.getContext('2d').scale(.5,.5);return c;};
    const full=make(),c=full.getContext('2d'),whole={sx:0,sy:0,ex:50,ey:50};
    const render=(canvas,bounds)=>{const pen=canvas.getContext('2d');pen.save();pen.setTransform(1,0,0,1,0,0);pen.clearRect(0,0,800,800);pen.restore();surface.draw(pen,g,bounds);return pen.getImageData(0,0,800,800).data;}; // QA-only pixel readback.
    g.time=0;const first=render(full,whole);g.time=2.1;const second=render(full,whole);
    let changed=0,opaque=0,light=0,totalLight=0,edgeAlpha=new Set();
    for(let i=0;i<second.length;i+=4){if(second[i+3]>0){opaque++;totalLight+=second[i]*.2126+second[i+1]*.7152+second[i+2]*.0722;}if(second[i+3]===255&&(second[i]!==first[i]||second[i+1]!==first[i+1]||second[i+2]!==first[i+2]))changed++;edgeAlpha.add(second[i+3]);}
    if(changed<100)throw Error('Sand does not visibly animate: '+changed);if(edgeAlpha.size<4)throw Error('Missing irregular edge transition: '+[...edgeAlpha]);
    light=totalLight/opaque;if(light<65||light>175)throw Error('Unreadable ochre hazard: '+light);
    const small=make(),tx=Math.floor(patch.x/32),ty=Math.floor(patch.y/32),bounds={sx:Math.max(0,tx-3),sy:Math.max(0,ty-3),ex:Math.min(50,tx+4),ey:Math.min(50,ty+4)};
    const cropped=render(small,bounds);let mismatches=0,compared=0;
    for(let y=bounds.sy*16;y<bounds.ey*16;y++)for(let x=bounds.sx*16;x<bounds.ex*16;x++){
     const i=(y*800+x)*4;for(let channel=0;channel<4;channel++){compared++;if(Math.abs(second[i+channel]-cropped[i+channel])>1)mismatches++;}
    }
    if(mismatches)throw Error('Camera crop changes world-aligned sand: '+mismatches+'/'+compared);
    const builds=surface.stats.topologyBuilds,uploads=surface.stats.textureUploads,masks=surface.stats.maskBuilds,submit=[],raster=[];
    render(full,whole);
    for(let i=0;i<32;i++){
     g.time=3+i*.05;const start=performance.now();surface.draw(c,g,whole);submit.push(performance.now()-start);
     c.getImageData(0,0,1,1);raster.push(performance.now()-start); // Forces QA raster completion, not gameplay FPS.
    }
    if(surface.stats.topologyBuilds!==builds||surface.stats.textureUploads!==uploads||surface.stats.maskBuilds!==masks)throw Error('Animated frames rebuild/upload terrain');
    if(surface.stats.width>QUICKSAND_LIMITS.width||surface.stats.height>QUICKSAND_LIMITS.height)throw Error('Unbounded shader output');
    g.bloom=.1;const hidden=render(full,whole);if(hidden.some(v=>v!==0))throw Error('Quicksand leaks through bloom boundary');
    g.bloom=3;g.phase='won';const won=render(full,whole);if(won.some(v=>v!==0))throw Error('Quicksand remains in won floor');g.phase='play';
    const hiddenBuilds=surface.stats.topologyBuilds;render(full,whole);if(surface.stats.topologyBuilds!==hiddenBuilds+1)throw Error('Won buffers were not released');
    const index=ty*50+tx,old=g.terrain[index];g.terrain[index]=old==='quicksand'?'sand':'quicksand';render(full,whole);if(surface.stats.topologyBuilds!==hiddenBuilds+2)throw Error('In-place topology edit not detected');
    g.terrain[index]=old;render(full,whole);
    submit.sort((a,b)=>a-b);raster.sort((a,b)=>a-b);g.time=2.1;r.camera={x:patch.x,y:patch.y,zoom:1.12};r.draw(g,0);
    if(window.quicksandQA.state()!==window.quicksandQA.before)throw Error('Renderer mutated gameplay state');
    return {animation:{changedOpaquePixels:changed,visiblePixels:opaque,meanLuminance:light,alphaLevels:[...edgeAlpha].sort((a,b)=>a-b)},worldCrop:{mismatches,comparedChannels:compared},steadyFrame:{submitP50Ms:submit[16],submitP95Ms:submit[30],forcedRasterP50Ms:raster[16],forcedRasterP95Ms:raster[30],samples:32,topologyBuilds:builds,uploads,masks},stats:{...surface.stats},gameplayStateUnchanged:true};
   `);
   const context=await run(`
    const {g,r}=window.quicksandQA,surface=r.quicksandSurface,ext=surface.gpu?.gl.getExtension('WEBGL_lose_context');
    if(!ext)return {tested:false,reason:'Canvas backend or extension unavailable'};
    const before=surface.stats.textureUploads;ext.loseContext();await new Promise(done=>setTimeout(done,100));g.time=2.4;r.draw(g,0);
    if(surface.backend!=='canvas'||surface.stats.contextLosses!==1||surface.stats.maskBuilds<1)throw Error('Real context loss did not produce Canvas fallback');
    const pixels=surface.stage.getContext('2d').getImageData(0,0,surface.stage.width,surface.stage.height).data;
    if(!pixels.some(v=>v>0))throw Error('Context-loss fallback is blank');
    window.quicksandQA.restore=ext;window.quicksandQA.uploadsBeforeRestore=before;
    return {tested:true,fallback:surface.backend,nonblank:true,stats:{...surface.stats}};
   `);
   if(context.tested){
    await screenshot('context-loss');
    context.restore=await run(`
     const qa=window.quicksandQA;qa.restore.restoreContext();
     for(let i=0;i<30&&qa.r.quicksandSurface.lost;i++)await new Promise(done=>setTimeout(done,50));
     qa.g.time=2.6;qa.r.draw(qa.g,0);if(qa.r.quicksandSurface.backend!=='webgl')throw Error('Restored GPU context did not recover');
     if(qa.r.quicksandSurface.stats.textureUploads!==qa.uploadsBeforeRestore+1)throw Error('Restore did not re-upload exactly one topology mask');
     return {backend:qa.r.quicksandSurface.backend,uploads:qa.r.quicksandSurface.stats.textureUploads};
    `);
   }
   const viewports=[];
   for(const [width,height]of [[600,430],[1920,1080]]){
    win.setContentSize(width,height);await run('await new Promise(window.quicksandRAF);');
    viewports.push(await run(`
     const {r,g,canvas}=window.quicksandQA;r.camera={x:800,y:800,zoom:.36};g.time=4;r.draw(g,0);
     if(r.quicksandSurface.stats.width>800||r.quicksandSurface.stats.height>800)throw Error('Resize exceeds surface limits');
     return {viewport:[canvas.width,canvas.height],camera:{...r.camera},stats:{...r.quicksandSurface.stats}};
    `));await screenshot('coop-'+width+'x'+height);
   }
   const report={mode,initial,checks,context,viewports,gpuFeatures:app.getGPUFeatureStatus(),rendererErrors:errors,limitations:'Isolated draw submission and forced raster diagnostics; no physical controller or gameplay FPS claims. Canvas has approximate ripples. QA readbacks only.'};
   if(errors.length)throw Error('Renderer process failure: '+JSON.stringify(errors));
   fs.writeFileSync(path.join(dir,mode+'-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error.stack||error);clearTimeout(timer);app.exit(1);}
 });
}
