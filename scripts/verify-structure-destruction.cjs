// Isolated Electron profile: real gameplay, native canvas and whole-map zoom.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output','structure-destruction');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const timer=setTimeout(()=>app.exit(1),120000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:900,useContentSize:true,webPreferences:{offscreen:true}}),errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
  const result=await w.webContents.executeJavaScript(`(async()=>{
   await window.wildboundBoot.ready;window.requestAnimationFrame=()=>0;
   const [{Game},{Renderer},{Assets},d,{tickHazards},{tickEnvironment},{saveSession,restoreSession},{applyChangedHouse},{drawHouseWall}]=await Promise.all([
    import('./src/core.mjs'),import('./src/render.mjs'),import('./src/assets.mjs'),import('./src/structure-destruction.mjs'),import('./src/hazards.mjs'),import('./src/environment.mjs'),import('./src/session.mjs'),import('./src/apply-house.mjs'),import('./src/house-architecture-art.mjs')]);
   const assets=new Assets();await assets.load();const reports=[],pictures={};
   for(const environment of ${process.argv.includes('--raster-only')?"[]":"['house','temple']"}){
    const g=new Game(()=>.3);g.environment=environment;const p=g.addPlayer('keyboard','Destruction QA');g.start();g.openingBoard=false;g.bloom=3;p.invincible=true;
    for(let i=0;i<2500;i++)g.explored.add(i);g.sky={elapsed:180};
    const canvas=document.createElement('canvas');canvas.style='position:fixed;inset:0;width:1280px;height:900px';document.body.append(canvas);
    const r=new Renderer(canvas,assets);r.camera={x:800,y:800,zoom:.52};r.draw(g,0);pictures[environment+'-before']=canvas.toDataURL();
    g.enemies=Array.from({length:20},(_,i)=>({id:1000+i,kind:i%4===0?'elephant':'rhino',stampeding:true,state:'stampede',aggro:false,
      x:240-i%5*48,y:480+Math.floor(i/5)*205,lane:480+Math.floor(i/5)*205,runDirection:1,speed:185,damage:20,hp:130,maxHp:130,step:i*.37,faceX:1,faceY:0}));
    const samples=[],update=[],impactSamples=[];let peak=0;
    for(let frame=0;frame<420;frame++){
     g.time+=1/60;const revision=g.house.destructionRevision||0,start=performance.now();tickHazards(g,1/60);tickEnvironment(g,1/60);update.push(performance.now()-start);
     const draw=performance.now();r.draw(g,0);canvas.getContext('2d').getImageData(0,0,1,1);const elapsed=performance.now()-draw;
     if(frame>8)samples.push(elapsed);if((g.house.destructionRevision||0)!==revision)impactSamples.push(elapsed);
     peak=Math.max(peak,d.destructionStats(g).particles);
     if(frame===260)pictures[environment+'-breached']=canvas.toDataURL();
    }
    const walls=g.house.walls.reduce((n,w)=>n+Object.values(w.sectionDamage||{}).filter(s=>s.broken).length,0);
    if(!walls)throw Error(environment+' stampede did not break walls');
    if(peak>d.DESTRUCTION_PARTICLE_LIMIT)throw Error('Particle cap exceeded');
    const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
    if(JSON.stringify(restored.house.walls)!==JSON.stringify(g.house.walls))throw Error(environment+' damage lost on restore');
    if(environment==='house'&&applyChangedHouse(restored))throw Error('Wall damage mistaken for editor change');
    const summarize=list=>{list.sort((a,b)=>a-b);return {meanMs:list.reduce((a,b)=>a+b,0)/Math.max(1,list.length),p95Ms:list[Math.floor((list.length-1)*.95)]||0,maxMs:list.at(-1)||0};};
    reports.push({environment,zoom:.52,herd:20,frames:420,brokenWallSections:walls,peakParticles:peak,update:summarize(update),render:summarize(samples),impactRender:summarize(impactSamples)});canvas.remove();
   }
   // Count raster work: changing one section may repaint only that section;
   // a second identical frame must perform no wall-art rasterization.
   const b={x:20,y:20,w:320,h:16,kind:'wall'},g={house:{walls:[b],doors:[],furniture:[]},time:0},canvas=document.createElement('canvas');canvas.width=380;canvas.height=110;
   let paints=0;const paint=(c,b)=>{paints++;drawHouseWall(c,b);};const c=canvas.getContext('2d');d.drawBreakable(c,g,b,paint);const initial=c.getImageData(220,22,20,8).data;
   d.damageStructureProjectile(g,{x:40,y:24,vx:260,vy:0,damage:110,structureCharge:1,size:6});c.clearRect(0,0,380,110);d.drawBreakable(c,g,b,paint);
   const after=c.getImageData(220,22,20,8).data;if(initial.some((v,i)=>v!==after[i]))throw Error('Unaffected wall pixels changed');
   d.drawBreakable(c,g,b,paint);if(paints!==1)throw Error('Intact wall art rebuilt after local damage');
   return {reports,pictures,localRasterPatchVerified:true};
  })()`);
  for(const [name,url]of Object.entries(result.pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
  delete result.pictures;result.errors=errors;if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,process.argv.includes('--raster-only')?'local-raster.json':'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
