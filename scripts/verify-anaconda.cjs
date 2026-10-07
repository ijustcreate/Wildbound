const path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');
const base=process.env.WILDBOUND_VERIFY_APP||root;
// Launch only this verifier's Electron child; never attach to/stop a user game.
if(!process.versions.electron){
  const {spawnSync}=require('node:child_process'),env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
  const child=spawnSync(path.join(root,'test-output/electron-41.10.7/electron.exe'),[__filename],{cwd:root,env,encoding:'utf8',timeout:120000});
  if(child.stdout)process.stdout.write(child.stdout);if(child.stderr)process.stderr.write(child.stderr);if(child.error)console.error(child.error);
  process.exit(child.status??1);
}
const {app,BrowserWindow}=require('electron'),label=Date.now()+'-'+process.pid;
const out=path.join(root,'test-output','anaconda-qa-'+label);fs.mkdirSync(out,{recursive:true});
app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'profile'));
const timeout=setTimeout(()=>{console.error('Anaconda QA timed out');app.exit(1);},90000);
app.whenReady().then(async()=>{
  const w=new BrowserWindow({show:false,width:1200,height:720,useContentSize:true,webPreferences:{offscreen:true}});
  const errors=[];w.webContents.on('console-message',event=>{if(event.level==='error'&&/Error|Exception/.test(event.message))errors.push(event.message);});
  const run=source=>w.webContents.executeJavaScript('(async()=>{'+source+'})()');
  try{
    await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
    await run('await window.wildboundBoot.ready; window.anacondaRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(window.anacondaRAF);');
    await run(`
      const [{Game,EVENTS},{Renderer},{Assets},body,art,ai,{creatures}]=await Promise.all([
        import('./src/core.mjs'),import('./src/render.mjs'),import('./src/assets.mjs'),import('./src/anaconda-body.mjs'),import('./src/anaconda-art.mjs'),import('./src/anaconda.mjs'),import('./src/definitions.mjs')]);
      const assets=new Assets();await assets.load();const g=new Game(()=>.42),p=g.addPlayer('keyboard','Anaconda QA');g.start();
      Object.assign(g,{phase:'play',openingBoard:false,bloom:3,event:null,reveal:null,forestLandscape:null});g.terrain.fill('grass');
      g.scenery=[{kind:'tree',id:700,procedural:true,x:700,y:720,size:80,rootY:748,seed:42,treeType:'broadleaf'}];
      g.livingEcosystem.vines=[];g.spawnEvent(EVENTS.findIndex(e=>e.kind==='anaconda'));g.reveal=null;g.eventTime=0;
      const e=g.enemies.find(e=>e.kind==='anaconda');Object.assign(e,{x:646,y:748,faceX:1,faceY:0,cooldown:999,orbit:1});body.initializeAnaconda(e,g);
      Object.assign(p,{x:940,y:748,hp:999,maxHp:999});for(let i=0;i<90;i++){g.time+=.05;ai.tickAnaconda(g,e,[p],.05,creatures.anaconda.stats);}
      const canvas=document.createElement('canvas');canvas.style='position:fixed;left:0;top:0;width:1200px;height:720px;z-index:99999';document.body.append(canvas);
      const r=new Renderer(canvas,assets);r.camera={x:720,y:730,zoom:1.6};r.draw(g,0);
      window.anacondaQA={g,p,e,r,canvas,assets,body,art,ai,creatures};
    `);
    const report=await run(`
      const {g,p,e,r,canvas,body,art,ai,creatures}=window.anacondaQA,checks=[],pictures={};
      const assert=(condition,message)=>{if(!condition)throw Error(message);checks.push(message);};
      assert(e.anacondaBody.segments.length===40&&e.anacondaBody.trail.length<=160,'One enemy owns 40 floor sections and <=160 trail points');
      const queued=r.actorQueue.filter(a=>a.isAnacondaSegment),integrated=queued.length>0;
      assert(r.actorQueue.some(a=>a.kind==='anaconda'||a.isAnacondaSegment),'Real Renderer queues/draws anaconda');
      pictures.world=canvas.toDataURL();
      // Compare actual Canvas pixels with/without the enemy, not a mocked context.
      const first=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;g.enemies=[];r.draw(g,0);
      const second=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let changed=0;
      for(let i=0;i<first.length;i+=4)if(first[i]!==second[i]||first[i+1]!==second[i+1]||first[i+2]!==second[i+2])changed++;
      assert(changed>250,'Actual renderer pixels include the giant snake');g.enemies=[e];
      const atlas=document.createElement('canvas');atlas.width=1024;atlas.height=660;const c=atlas.getContext('2d');c.fillStyle='#182f27';c.fillRect(0,0,atlas.width,atlas.height);
      const states=['hunt','windup','bite','ally','frozen','death'],hashes=new Set();
      for(let row=0;row<states.length;row++)for(let direction=0;direction<8;direction++){
        const a={kind:'anaconda',id:row*8+direction,x:direction*128+64,y:row*110+63,faceX:Math.cos(direction*Math.PI/4),faceY:Math.sin(direction*Math.PI/4),hp:380,state:states[row]};
        if(states[row]==='ally')a.faction='ally';if(states[row]==='frozen')a.frozen=1;if(states[row]==='death'){a.hp=0;a.deathTimer=1.7;}
        body.initializeAnaconda(a);art.drawAnacondaShadow(c,a,0);art.drawAnacondaSegment(c,a,0,row);c.font='10px monospace';c.fillStyle='#e3d8ad';c.fillText(states[row]+' '+direction,direction*128+12,row*110+103);
      }
      pictures.heads=atlas.toDataURL();
      // Stress genuine raster cache with changing directions/radii/status, fixed cap.
      for(let i=0;i<220;i++){e.faceX=Math.cos(i*.4);e.faceY=Math.sin(i*.4);e.state=i%3===0?'windup':'hunt';art.drawAnaconda(c,e,i);}
      assert(art.anacondaArtCacheSize()<=128,'Real raster art cache remains bounded at 128 entries');
      const before=JSON.stringify(e.anacondaBody);e.frozen=1;const timer=e.timer;g.update(.05,{});
      assert(JSON.stringify(e.anacondaBody)===before&&e.timer===timer,'Actual game freeze holds body geometry and attack timer');
      e.frozen=0;e.state='hunt';const coil=e.anacondaBody.segments[20];Object.assign(p,{x:coil.x,y:coil.y+40,jumpHeight:0});
      g.moveActor(p,0,-80);assert(p.y>coil.y+12,'Grounded player stops at the body');
      Object.assign(p,{x:coil.x,y:coil.y+40,jumpHeight:20});g.moveActor(p,0,-80);assert(p.y<coil.y-20,'Airborne clearance crosses the body');
      Object.assign(p,{x:coil.x,y:coil.y,jumpHeight:20});r.camera={x:coil.x,y:coil.y,zoom:2};r.draw(g,0);pictures.jump=canvas.toDataURL();
      // Real Animator route uses native floor-space pixels and must not mutate geometry.
      const sample=document.createElement('canvas');sample.width=1000;sample.height=800;const sc=sample.getContext('2d');
      const bodyBefore=JSON.stringify(e.anacondaBody);r.animator.draw(sc,e,0);const still=sample.toDataURL();sc.clearRect(0,0,1000,800);r.animator.draw(sc,e,50);
      assert(sample.toDataURL()===still&&JSON.stringify(e.anacondaBody)===bodyBefore,'Stopped snake does not swim in place or mutate during rendering');
      if(integrated){
        Object.assign(e,{x:1000,y:500,state:'hunt',hp:380,faceX:1,faceY:0});body.initializeAnaconda(e,g);const tail=e.anacondaBody.segments[32];Object.assign(p,{x:tail.x,y:tail.y+50,jumpHeight:0});r.camera={x:tail.x,y:tail.y,zoom:3};r.draw(g,0);
        assert(r.actorQueue.some(a=>a.isAnacondaSegment&&a.anacondaIndex>20),'Body sections remain visible with head outside party sight');
        assert(r.actorQueue.filter(a=>a.isAnacondaSegment).every(a=>a.drawDepth===a.y),'Every section sorts at its own ground y');pictures.tail=canvas.toDataURL();
      }
      return {checks,renderedPixelDifference:changed,rendererIntegrated:integrated,cacheEntries:art.anacondaArtCacheSize(),segments:40,trailLimit:160,
        limitation:integrated?'No physical controller or FPS claims.':'Parent renderer queue hook pending: generic ActorPoseCache/whole-head culling must be bypassed for anaconda. Head projectile behavior works; body projectile hook requires parent adventure integration.',pictures};
    `);
    for(const [name,data]of Object.entries(report.pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete report.pictures;
    fs.writeFileSync(path.join(out,'webcontents.png'),(await w.webContents.capturePage()).toPNG());report.rendererErrors=errors;
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,output:out},null,2));
    if(errors.length)throw Error('Renderer exceptions: '+errors.join('; '));clearTimeout(timeout);app.exit(0);
  }catch(error){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:error.stack,rendererErrors:errors},null,2));console.error(error);console.log('Anaconda QA output: '+out);clearTimeout(timeout);app.exit(1);}
});
