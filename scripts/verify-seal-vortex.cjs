const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const label=process.env.WILDBOUND_SEAL_LABEL||'current';
if(process.env.WILDBOUND_SEAL_GPU!=='1')app.disableHardwareAcceleration();
app.setPath('userData',path.join(root,'test-output/seal-vortex-profile-'+label));
const timeout=setTimeout(()=>{console.error('Sealing QA timed out');app.exit(1);},180000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{offscreen:true}});
 const run=source=>w.webContents.executeJavaScript(`(async()=>{${source}})()`);
 try{
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await run('await window.wildboundBoot.ready;window.sealRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(window.sealRAF);');console.log('Loaded sealing QA: '+label);
  await run(`
   const [{Game},{Renderer},{Assets},{rules}]=await Promise.all([import('./src/core.mjs'),import('./src/render.mjs'),import('./src/assets.mjs'),import('./src/definitions.mjs')]);
   const assets=new Assets();await assets.load();
   const g=new Game(()=>.42),p=g.addPlayer('keyboard','Ember'),q=g.addPlayer('pad:1','Astral');g.start();g.openingBoard=false;g.bloom=3;g.event=null;g.reveal=null;
   Object.assign(p,{x:770,y:830,progress:48});Object.assign(q,{x:840,y:835});g.spawnEvent(0);g.reveal=null;
   const canvas=document.createElement('canvas');canvas.style='width:1280px;height:720px;position:fixed;left:0;top:0;z-index:99999';document.body.append(canvas);
   const r=new Renderer(canvas,assets);r.camera={x:800,y:800,zoom:.48};r.draw(g,0);
   if(${JSON.stringify(process.env.WILDBOUND_SEAL_BACKEND==='canvas')}){const {SealVortex}=await import('./src/seal-vortex.mjs');r.sealVortex=new SealVortex({backend:'canvas'});}
   window.sealQA={g,p,q,r,rules,canvas,originalScenery:g.scenery.slice()};
  `);
  const report=await run(`
   const {g,p,r,rules,originalScenery,canvas}=window.sealQA,scenarios=[],steps=${Number(process.env.WILDBOUND_SEAL_STEPS)||24};
   const savedHeroes=JSON.stringify(g.players);
   for(const multiple of [1,8]){
    g.phase='play';g.sealTime=0;g.scenery=multiple===1?originalScenery:originalScenery.flatMap((d,i)=>Array.from({length:multiple},(_,j)=>({...d,id:'large-'+i+'-'+j,x:d.x+j*.1,y:d.y+j*.1})));
    r.camera={x:800,y:800,zoom:.48};p.sealHold=1;r.draw(g,0);g.beginSeal(p);
    const flush=()=>canvas.getContext('2d').getImageData(0,0,1,1); // QA-only: force raster completion, never used by the game.
    flush();if(r.sealReady)r.sealReady.canvas.getContext('2d').getImageData(0,0,1,1);
    const t0=performance.now();r.draw(g,0);const entrySubmitMs=performance.now()-t0;flush();const entryMs=performance.now()-t0;
    const captures=r.sealVortex?.stats.captures,uploads=r.sealVortex?.stats.textureUploads;
    const costs=[],submitCosts=[],frames=[];
    for(let i=0;i<steps;i++){
     g.sealTime=rules.sealDuration*(.03+i*.9/(steps-1));g.time=g.sealTime;
     const t=performance.now();r.draw(g,0);submitCosts.push(performance.now()-t);flush();costs.push(performance.now()-t);
     if(multiple===1&&[Math.round(steps*.1),Math.round(steps*.34),Math.round(steps*.67),steps-2].includes(i))frames.push({progress:g.sealTime/rules.sealDuration,png:canvas.toDataURL()});
    }
    costs.sort((a,b)=>a-b);
    submitCosts.sort((a,b)=>a-b);
    if(r.sealVortex&&(r.sealVortex.stats.captures!==captures||r.sealVortex.stats.textureUploads!==uploads))throw Error('Repeated finale capture/texture upload');
    scenarios.push({scenery:g.scenery.length,entryMs,entrySubmitMs,p50Ms:costs[Math.floor(steps*.5)],p95Ms:costs[Math.floor(steps*.95)],maxMs:costs.at(-1),submitP50Ms:submitCosts[Math.floor(steps*.5)],backend:r.sealVortex?.backend||'legacy',stats:r.sealVortex?{...r.sealVortex.stats}:undefined,frames});
   }
   g.scenery=originalScenery;g.phase='play';r.draw(g,0);g.beginSeal(p);r.draw(g,0);
   const intervals=[],drawCosts=[];let previous;
   const cadenceSteps=${Number(process.env.WILDBOUND_SEAL_CADENCE)||90};
   for(let i=0;i<cadenceSteps;i++){
    const stamp=await new Promise(window.sealRAF);if(previous!==undefined)intervals.push(stamp-previous);previous=stamp;
    g.sealTime=rules.sealDuration*i/cadenceSteps;const start=performance.now();r.draw(g,1/60);drawCosts.push(performance.now()-start);
   }
   intervals.sort((a,b)=>a-b);drawCosts.sort((a,b)=>a-b);
   const cadence={rafP50Ms:intervals[Math.floor(intervals.length*.5)],rafP95Ms:intervals[Math.floor(intervals.length*.95)],drawP50Ms:drawCosts[Math.floor(drawCosts.length*.5)],drawP95Ms:drawCosts[Math.floor(drawCosts.length*.95)]};
   // sealHold is intentionally used to prepare a finish frame, otherwise all
   // equipment/storage/player coordinates must be untouched by the renderer.
   const heroes=JSON.parse(savedHeroes);heroes[0].sealHold=1;if(JSON.stringify(g.players)!==JSON.stringify(heroes))throw Error('Finale renderer mutated heroes');
   let behavior;
   if(r.sealVortex){
    for(const [width,height]of [[600,430],[1920,1080]]){
     canvas.style.width=width+'px';canvas.style.height=height+'px';g.sealTime=rules.sealDuration*.5;r.draw(g,0);
     if(r.sealVortex.snapshot.width>960||r.sealVortex.snapshot.height>540||r.sealFrame.width>960||r.sealFrame.height>540)throw Error('Unbounded finale surface after resize');
    }
    const extension=r.sealVortex.gpu?.gl.getExtension('WEBGL_lose_context');
    if(extension){extension.loseContext();await new Promise(done=>setTimeout(done,80));g.sealTime=rules.sealDuration*.55;r.draw(g,0);if(r.sealVortex.backend!=='canvas')throw Error('Context loss did not fall back');}
    for(let i=0;i<80;i++)g.update(.05);
    if(g.phase!=='won'||!g.victoryRewards?.length)throw Error('Finale did not award victory');
    const treasure=JSON.stringify(g.victoryRewards);g.completeVictory();if(JSON.stringify(g.victoryRewards)!==treasure)throw Error('Double reward');r.draw(g,0);
    if(r.sealVortex.snapshot||r.sealFrame||r.sealAnchors)throw Error('Finale buffers not released');
    behavior='One capture/upload per seal; no hero mutation; 600x430/1920x1080 bounded surfaces; '+(extension?'real WebGL context-loss fallback; ':'')+'victory/reward idempotency and buffer release';
   }
   return {mode:${JSON.stringify(process.env.WILDBOUND_SEAL_GPU==='1'?'hardware-enabled':'software')},viewport:[1280,720],cadence,behavior,scenarios};
  `);
  const dir=path.join(root,'test-output');fs.mkdirSync(dir,{recursive:true});
  for(const [i,s]of report.scenarios.entries())for(const f of s.frames){fs.writeFileSync(path.join(dir,`seal-${label}-${i}-${Math.round(f.progress*100)}.png`),Buffer.from(f.png.split(',')[1],'base64'));delete f.png;}
  fs.writeFileSync(path.join(dir,`seal-${label}-report.json`),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  clearTimeout(timeout);app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
