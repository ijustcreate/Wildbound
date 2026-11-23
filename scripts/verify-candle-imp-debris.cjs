const path=require('node:path'),fs=require('node:fs'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const child=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename,'--mute-audio'],{cwd:root,env,encoding:'utf8',timeout:120000});process.stdout.write(child.stdout||'');process.stderr.write(child.stderr||'');process.exit(child.status??1);}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output/candle-imp-debris',process.env.WILDBOUND_VERIFY_APP?'packaged':'source');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'isolated-profile'));app.commandLine.appendSwitch('mute-audio');const deadline=setTimeout(()=>app.exit(1),110000);
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}}),errors=[];w.webContents.setAudioMuted(true);w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
try{await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));await w.webContents.executeJavaScript('wildboundBoot.ready');const result=await w.webContents.executeJavaScript(`(async()=>{
 window.requestAnimationFrame=()=>0;
 const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs'),{generateWorld}=await import('./src/world.mjs');
 const {tickImp,initializeImp}=await import('./src/imps.mjs'),{clearShot}=await import('./src/navigation.mjs');
 const {damageStructureProjectile,tickDestruction,destructionStats,airborneDestruction,drawDestruction}=await import('./src/structure-destruction.mjs');
 const {drawBiomeAccents}=await import('./src/biome-art.mjs');
 const checks=[],images={},ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const assets=new Assets();await assets.load();const g=new Game(()=>.5),p=g.addPlayer('keyboard','QA');g.start();Object.assign(g,generateWorld(42,'house'),{seed:42,environment:'house',generatedEnvironment:'house',phase:'play',openingBoard:false,bloom:3,event:null,weather:null,enemies:[]});g.persist=()=>{};g.onSound=()=>{};
 const canvas=document.createElement('canvas');canvas.style.cssText='width:1280px;height:850px';document.body.append(canvas);const r=new Renderer(canvas,assets);r.dynamicShadows=false;
 // Exercise the real movement and collision through a closed house entrance.
 Object.assign(p,{x:640,y:600});const e={id:g.nextId++,kind:'imp',x:640,y:420,hp:60,speed:70,damage:14,cooldown:100,state:'hunt',faction:'hostile'};initializeImp(e);g.enemies=[e];
 for(let i=0;i<240;i++){g.time+=.05;tickImp(g,e,[p],.05);}
 ok(clearShot(g,e,p)&&g.house.doors.some(d=>d.open),'imp finds and opens the house entrance');
 for(const startX of [560,400]){g.house={walls:[{x:600,y:480,w:16,h:240}],doors:[],furniture:[],floors:[],pools:[]};Object.assign(p,{x:680,y:600});Object.assign(e,{x:startX,y:600});
 for(let i=0;i<240;i++){g.time+=.05;tickImp(g,e,[p],.05);}ok(clearShot(g,e,p)&&Math.hypot(e.x-p.x,e.y-p.y)<=230,'imp detours around thin wall from '+startX);}
 Object.assign(g,generateWorld(42,'house'),{enemies:[],event:null,weather:null});
 const desk=g.house.furniture.find(f=>f.kind==='desk');Object.assign(p,{x:desk.x+30,y:desk.y+80});r.camera={x:desk.x+desk.w/2,y:desk.y+desk.h/2,zoom:5};r.draw(g,0);images.candles=canvas.toDataURL();
 const probe=document.createElement('canvas');probe.width=100;probe.height=100;const pc=probe.getContext('2d');drawBiomeAccents(pc,{generatedEnvironment:'house',house:{walls:[],furniture:[{kind:'desk',x:0,y:40,w:50,h:20}]},time:1},()=>true);
 const data=pc.getImageData(0,0,100,100).data;let flamePixels=0;for(let i=0;i<data.length;i+=4)if(data[i]===233&&data[i+1]===163&&data[i+2]===72&&data[i+3])flamePixels++;
 ok(flamePixels>0&&flamePixels<=18,'house accent candle has a tiny native flame');
 const car=g.house.vehicles[0];ok(!!car,'house includes actual car');car.x=760;car.y=820;Object.assign(p,{x:700,y:850});
 const wall={x:740,y:800,w:40,h:16};g.house.walls.push(wall);damageStructureProjectile(g,{x:760,y:808,size:4,structureCharge:1,damage:200,vx:260,vy:0});
 ok(!(g.effects||[]).some(f=>f.gameplayFx==='debris'),'breaking does not allocate a duplicate imported explosion');
 tickDestruction(g,.15);const pieces=airborneDestruction(g);ok(pieces.length>0&&pieces.every(p=>p.size<=2&&p.z<20),'airborne pieces stay small and close to impact');
 ok(new Set(pieces.map(p=>Math.round(p.y))).size>2,'fragments spread in ground depth independently from height');
 r.camera={x:760,y:800,zoom:3};r.draw(g,0);images.carAirborne=canvas.toDataURL();
 const queue=r.actorQueue,carIndex=queue.findIndex(a=>a.isHouseVehicle),fragments=queue.filter(a=>a.isDestructionFragment);
 ok(carIndex>=0&&fragments.length>0&&fragments.every(a=>a.drawDepth===a.particle.y),'airborne fragments share car depth sorting by ground contact');
 ok(queue.slice(0,carIndex).some(a=>a.isDestructionFragment),'car paints over fragments behind it');
 for(let i=0;i<10;i++)tickDestruction(g,.05);r.draw(g,0);images.carSettled=canvas.toDataURL();ok(airborneDestruction(g).length===0,'settled fragments leave actor pass and render only on ground');
 const stats=destructionStats(g);ok(stats.particleLimit===64&&stats.particles<=64,'native fragment budget is capped at 64');
 // Compare the actual car image with/without settled fragments under its center.
 const before=r.ctx.getImageData(0,0,canvas.width,canvas.height);wall.debris=[];tickDestruction(g,2);r.draw(g,0);const after=r.ctx.getImageData(0,0,canvas.width,canvas.height);
 const sx=Math.round((760-r.camera.x)*r.camera.zoom+canvas.width/2),sy=Math.round((808-r.camera.y)*r.camera.zoom+canvas.height/2);let changed=0;
 for(let y=sy-5;y<=sy+5;y++)for(let x=sx-5;x<=sx+5;x++){const i=(y*canvas.width+x)*4;for(let k=0;k<4;k++)if(before.data[i+k]!==after.data[i+k]){changed++;break;}}
 ok(changed===0,'settled debris cannot paint over car center pixels');
 const {pixelFxSurface}=await import('./src/pixelfx-runtime.mjs'),{effects}=await import('./src/particles.mjs');
 const splash=pixelFxSurface(effects['jump-splash'],0,1);ok(!!splash&&splash.getContext('2d').getImageData(0,0,splash.width,splash.height).data.some((v,i)=>i%4===3&&v>0),'jump splash has visible impact pixels at age zero');
 g.house={walls:[],doors:[],furniture:[],floors:[],vehicles:[],pools:[{x:500,y:600,w:400,h:320}]};g.scenery=[{kind:'tree',x:540,y:575,size:80}];g.terrain.fill('grass');g.effects=[];
 Object.assign(p,{x:680,y:735,swimming:true,moving:true,faceX:1,faceY:0,diveDepth:0,hp:100});g.enemies=[{id:99,kind:'imp',x:740,y:580,hp:60,speed:70,faceX:0,faceY:1,impFlightHeight:20}];
 r.camera={x:700,y:740,zoom:2};g.time=30;r.draw(g,0);images.waterWake=canvas.toDataURL();
 ok(r.waterInteractions.stats.mode==='webgl','water interaction shader compiles and runs in Electron');ok(r.waterInteractions.stats.swimmers===1,'swimmer drives the surface shader');ok(r.waterInteractions.stats.donors>=2,'native actors and environment feed rippled reflection texture '+JSON.stringify(r.waterInteractions.stats));
 const source=r.waterInteractions.source,reflectionPixels=source.getContext('2d').getImageData(0,0,source.width,source.height).data;ok(reflectionPixels.some((v,i)=>i%4===3&&v>0),'reflection atlas contains real native artwork');
 g.time+=.3;p.faceX=0;p.faceY=-1;r.draw(g,0);images.waterTurn=canvas.toDataURL();
 p.moving=false;g.time+=.3;r.draw(g,0);images.waterIdle=canvas.toDataURL();ok(r.waterInteractions.stats.pixels<=512*384&&r.waterInteractions.stats.donors<=48,'reflection and wake surface has fixed pixel and donor budgets');
 const {EVENTS}=await import('./src/core.mjs'),{webRasterStats}=await import('./src/spider-web-art.mjs'),{spiderFrame}=await import('./src/spider-motion.mjs'),{beastMotions}=await import('./src/beast-motion.mjs');
 Object.assign(g,generateWorld(91,'desert'),{seed:91,enemies:[],event:null,weather:null});g.effects=[];Object.assign(p,{x:800,y:800,swimming:false,invuln:1000,hp:10000,maxHp:10000});
 g.spawnEvent(EVENTS.findIndex(e=>e.name==='Velvet feet in the sand'));const web=g.webs[0];Object.assign(p,{x:web.x+30,y:web.y});r.camera={x:web.x,y:web.y,zoom:2};
 const timings=[];for(let i=0;i<1500;i++){p.invuln=100;const start=performance.now();g.update(1/60,{keyboard:{x:Math.floor(i/90)%2?1:-1,y:Math.floor(i/180)%2?.2:-.2}});if(i%3===0){r.draw(g,0);timings.push(performance.now()-start);}}
 images.spiderWeb=canvas.toDataURL();ok(g.phase==='play'&&Number.isFinite(p.x)&&g.enemies.some(e=>e.kind==='tarantula'),'actual sand-spider encounter stays responsive while crossing a web');
 ok(webRasterStats().entries<=12&&r.animator.spiderFrames?.size<=128,'web artwork and native spider rasters stay bounded');
 const model=beastMotions.tarantula;ok(spiderFrame({hp:110,moving:true,speed:48,step:.13*18},0,model)===model.clips.walk.length,'tarantula takes one visible gait cycle per 18 world units');
 ok(g.enemies.some(e=>e.kind==='baby_spider'),'web crossing remains responsive through egg hatching');
 timings.sort((a,b)=>a-b);return {checks,images,stats,water:r.waterInteractions.stats,webFrameMs:{median:timings[Math.floor(timings.length*.5)],p95:timings[Math.floor(timings.length*.95)],max:timings.at(-1)}};})()`);
for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));if(errors.length)throw Error(errors.join('\n'));const report={passed:result.checks.length,checks:result.checks,failed:0,errors,muted:w.webContents.isAudioMuted(),stats:result.stats,water:result.water,webFrameMs:result.webFrameMs};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));clearTimeout(deadline);app.exit(0);
}catch(e){console.error(e.stack,errors);clearTimeout(deadline);app.exit(1);}});
