const path=require('node:path'),fs=require('node:fs'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const child=require('node:child_process').spawnSync(path.join(root,'test-output/electron-41.10.7/electron.exe'),[__filename,...process.argv.slice(2)],{cwd:root,env,encoding:'utf8',timeout:115000});
 if(child.stdout)process.stdout.write(child.stdout);if(child.stderr)process.stderr.write(child.stderr);if(child.error)console.error(child.error);process.exit(child.status??1);
}
const flag=process.argv.indexOf('--app-path'),target=flag<0?root:path.resolve(process.argv[flag+1]);
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output','event-variety-qa-'+Date.now()+'-'+process.pid);
fs.mkdirSync(out,{recursive:true});app.setAppPath(target);app.setPath('userData',path.join(out,'profile'));app.disableHardwareAcceleration();
app.setVersion(require(path.join(target,'package.json')).version);process.argv.push('--no-live-diagnostics');
const deadline=setTimeout(()=>app.exit(1),105000);require(path.join(target,'main.cjs'));
app.whenReady().then(async()=>{
 try{
  const w=BrowserWindow.getAllWindows()[0],errors=[];
  if(!w)throw Error('Actual desktop entry created no window');
  w.on('show',()=>w.hide());w.hide();w.webContents.setAudioMuted(true);
  w.webContents.on('console-message',event=>{if(event.level==='error'&&/Error|Exception|Uncaught/.test(event.message))errors.push(event.message);});
  if(w.webContents.isLoadingMainFrame()||w.webContents.getURL()==='')await new Promise((resolve,reject)=>{w.webContents.once('did-finish-load',resolve);w.webContents.once('did-fail-load',(_e,code,text)=>reject(Error(code+' '+text)));});
  await w.webContents.executeJavaScript('(async()=>{await window.wildboundBoot.ready;const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);return true;})()');
  const report=await w.webContents.executeJavaScript(`(async()=>{
   const [{Game,EVENTS},{selectEvent,rememberEvent,eventBoss},{eventAvailable},{Assets},{Renderer},{saveSession,restoreSession},{WING_HOVER_HEIGHT},{actorContact},{drawPlayer}]=await Promise.all([import('./src/core.mjs'),import('./src/event-director.mjs'),import('./src/night-cycle.mjs'),import('./src/assets.mjs'),import('./src/render.mjs'),import('./src/session.mjs'),import('./src/wing-flight.mjs'),import('./src/contact-shadow.mjs'),import('./src/player-motion.mjs')]);
   const checks=[],maps=[],pictures={},assert=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
   assert(document.getElementById('loading').classList.contains('done')&&!!document.querySelector('.playable-lobby'),'Actual desktop source entry boots the rendered lobby');
   assert(typeof window.desktop.loadProfiles==='function','Actual desktop save bridge is available in the isolated QA profile');
   const assets=new Assets();await assets.load();
   const view=document.createElement('canvas');view.style='position:fixed;inset:0;width:1280px;height:850px;z-index:99999';document.body.append(view);
   const renderer=new Renderer(view,assets);
   for(const env of ['forest','temple','desert','ice','house','beach']){
    const g=new Game(()=>.37);g.seed=1234;g.environment=env;const p=g.addPlayer('keyboard','Encounter reviewer');g.start();g.openingBoard=false;p.invincible=true;
    g.spriteLibrary=assets.library;g.bloom=3;
    const eligible=EVENTS.filter(e=>(e.weight??10)>0&&eventAvailable(g,e)),names=new Set(),sequence=[];
    let lastBoss=-99;
    for(let i=0;i<eligible.length+25&&names.size<eligible.length;i++){
     const index=selectEvent(g,EVENTS,eventAvailable),event=EVENTS[index];
     assert(index!==null&&eventAvailable(g,event),env+' draw '+i+' respects biome/time/terrain');
     if(eventBoss(event)){assert(i>=3&&i-lastBoss>=3,env+' boss '+event.name+' retains breathing room');lastBoss=i;}
     assert(!g.eventDirector.recent.slice(-3).some(e=>e.name===event.name),env+' draw '+i+' has no immediate three-card repeat');
     rememberEvent(g,event,index);sequence.push(event.name);names.add(event.name);
    }
    assert(names.size===eligible.length,env+' covers every available daytime event, including rare cards');
    const reloaded=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));reloaded.random=()=>.37;
    assert(JSON.stringify(reloaded.eventDirector)===JSON.stringify(g.eventDirector),env+' coverage survives actual JSON save/reload');
    assert(selectEvent(reloaded,EVENTS,eventAvailable)===selectEvent(g,EVENTS,eventAvailable),env+' reload does not reset the next event');
    maps.push({environment:env,available:eligible.length,unique:names.size,draws:sequence.length,sequence});
    // Real roll -> spawn -> renderer, not only an isolated picker calculation.
    g.eventDirector=null;g.encounteredEvents=null;g.enemies=[];g.mystery=null;g.merchant=null;g.weather=null;g.volcanoes=[];
    const live=[];
    for(let n=0;n<8;n++){
     g.enemies=[];g.mystery=null;g.merchant=null;g.weather=null;g.volcanoes=[];
     g.roll={playerId:p.id,total:1,resolved:false};g.resolveRoll();g.roll=null;live.push(g.event.name);
     assert(eventAvailable(g,g.event),env+' actual roll '+n+' spawns an eligible event');
     const lead=g.enemies.find(e=>e.hp>0&&!e.wildlife);
     Object.assign(p,{x:lead?lead.x+45:800,y:lead?lead.y+40:800});
     renderer.camera={x:p.x,y:p.y,zoom:1.35};renderer.draw(g,0);
     if(lead)assert(renderer.actorQueue.some(a=>a.id===lead.id),env+' actual '+g.event.kind+' enemy participates in the visible native depth queue');
     if(n===3||n===7)pictures[env+'-event-'+n]=view.toDataURL();
    }
    assert(new Set(live).size===8,env+' first eight live rolls produce eight different encounters');
    const previous=JSON.stringify(g.eventDirector);g.newExpedition();assert(JSON.stringify(g.eventDirector)===previous,env+' new expedition retains encounter coverage');
    if(env==='forest'){
     g.enemies=[];g.sky.elapsed=320;
     const night=EVENTS.filter(e=>e.times?.includes('night')&&!e.times.includes('day')&&eventAvailable(g,e));
     const seen=new Set();for(let n=0;n<45;n++){const i=selectEvent(g,EVENTS,eventAvailable);rememberEvent(g,EVENTS[i],i);seen.add(EVENTS[i].name);}
     assert(night.every(e=>seen.has(e.name)),'Dusk/night-only enemies join the existing coverage without starvation');
    }
   }
   const flight=new Game(()=>.5),pilot=flight.addPlayer('keyboard','Wing pilot');
   flight.phase='play';flight.openingBoard=false;flight.bloom=3;flight.scenery=[];flight.house=null;flight.terrain.fill('grass');flight.enemies=[];flight.spriteLibrary=assets.library;
   flight.wildFaunaState={signature:flight.generatedEnvironment+':'+flight.seed,seeded:true};
   Object.assign(pilot,{x:400,y:400,invincible:true,equipment:{shoulders:'succubus_wings'},faceX:0,faceY:1});
   flight.update(.05,{keyboard:{jump:true}});assert(pilot.wingHover&&pilot.jumpHeight>0&&pilot.jumpHeight<10,'Actual held Jump begins a smooth equipped-wing takeoff');
   for(let n=0;n<40;n++)flight.update(.05,{keyboard:{jump:true,x:1}});
   assert(pilot.jumpHeight===WING_HOVER_HEIGHT&&pilot.x>400&&pilot.y===400,'Actual player input moves while held Jump sustains a bounded hover');
   renderer.camera={x:pilot.x,y:pilot.y,zoom:2.2};renderer.draw(flight,0);pictures['equipped-wings-live-hover']=view.toDataURL();
   assert(renderer.actorQueue.some(a=>a.isPlayer&&a.wingHover&&a.jumpHeight===WING_HOVER_HEIGHT),'Native world depth queue retains the flying player at its ground anchor');
   const contact=actorContact(flight,pilot,80,true);assert(contact.y===pilot.y+1&&contact.separation===WING_HOVER_HEIGHT,'Rendered wing-hover shadow remains on the ground, below the elevated player');
   const pose1=drawPlayer(renderer.ctx,pilot,flight.time),pose2=drawPlayer(renderer.ctx,pilot,flight.time+.2);
   assert(pose1.wingTipL&&pose1.wingTipR&&!pose1.tailTip&&pose1.wingTipL.y!==pose2.wingTipL.y,'Actual equipped native wings flap during hover without adding a player tail');
   const saved=restoreSession(JSON.parse(JSON.stringify(saveSession(flight))));assert(saved.players[0].wingHover&&saved.players[0].jumpHeight===WING_HOVER_HEIGHT,'Actual JSON save/reload retains equipped wing hover height');
   flight.update(.05,{keyboard:{}});assert(!pilot.wingHover&&pilot.jumpHeight<WING_HOVER_HEIGHT,'Releasing Jump begins descent on the very next live frame');
   for(let n=0;n<30;n++)flight.update(.05,{keyboard:{}});
   assert(pilot.jumpHeight===0,'Actual released wing flight lands normally');
   for(let n=0;n<25;n++)flight.update(.05,{keyboard:{jump:true}});pilot.equipment.shoulders=null;flight.update(.05,{keyboard:{jump:true}});
   assert(!pilot.wingHover&&pilot.jumpHeight<WING_HOVER_HEIGHT,'Unequipping shoulder wings stops hovering even while Jump stays held');
   for(let n=0;n<35;n++)flight.update(.05,{keyboard:{jump:true}});assert(pilot.jumpHeight===0&&!pilot.wingHover,'Without wings a held Jump cannot produce permanent flight or repeated jumps');
   view.remove();return {checks,maps,pictures,roster:EVENTS.length};
  })()`);
  for(const [name,data]of Object.entries(report.pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  if(errors.length)throw Error(errors.join('\n'));
  const result={passed:report.checks.length,failed:0,target,profile:app.getPath('userData'),roster:report.roster,maps:report.maps,checks:report.checks};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({passed:result.passed,failed:0,target,out,maps:result.maps.map(({sequence,...rest})=>rest)},null,2));
  clearTimeout(deadline);app.exit(0);
 }catch(error){console.error(error.stack);fs.writeFileSync(path.join(out,'failure.txt'),error.stack);clearTimeout(deadline);app.exit(1);}
});
