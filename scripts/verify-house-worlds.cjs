const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const r=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename],{cwd:root,env,windowsHide:true,stdio:'inherit',timeout:300000});process.exit(r.status??1);}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output','wildbound-mode-'+Date.now());fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'profile'));
const deadline=setTimeout(()=>app.exit(1),290000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1200,height:900,useContentSize:true,webPreferences:{backgroundThrottling:false}}),errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error'&&/Error|Exception/.test(e.message))errors.push(e.message);});
 const run=(fn,arg)=>w.webContents.executeJavaScript('('+fn.toString()+')('+JSON.stringify(arg??null)+')');
 try{
  await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));
  await run(async()=>{
   await window.wildboundBoot.ready;const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);document.querySelector('#loading-overlay')?.remove();
   const [{Game},{Assets},{Renderer},{PlayableLobby},travel]=await Promise.all([import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/render.mjs'),import('./src/playable-lobby.mjs'),import('./src/house-worlds.mjs')]);
   const checks=[],assert=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
   const assets=new Assets();await assets.load();const g=new Game(()=>.3),p=g.addPlayer('keyboard','One'),q=g.addPlayer('pad:0','Two');
   const host=document.createElement('div');host.style='position:fixed;inset:0;z-index:5000;background:#20382b';host.innerHTML='<div class="party-heading"><h1></h1></div><p class="party-help"></p><div id="party-status"></div><div id="player-slots"></div>';document.body.append(host);
   const lobby=new PlayableLobby({root:host,game:()=>g,profiles:{},start(){},sound(){}});
   lobby.state.sync([p,q]);for(const a of [p,q])Object.assign(lobby.state.members.get(a.id),{spawned:true,panel:null});
   await Promise.all([lobby.mapArt,lobby.cemeteryArt,lobby.beachArt].map(im=>im.decode()));
   lobby.open(p,'environment');assert(lobby.nodes.get(p.id).querySelector('button').classList.contains('wildbound-mode-choice'),'Wildbound is the first selectable map-menu card');
   lobby.navigate(p,{accept:true},'keyboard');assert(g.houseWorldsEnabled,'Keyboard accepts Wildbound mode');assert(localStorage.getItem('wildbound-mode')==='on','Mode preference persists');
   lobby.open(q,'environment');assert(lobby.nodes.get(q.id).querySelector('button').getAttribute('aria-pressed')==='true','Second player sees mode selection');
   lobby.navigate(q,{accept:true},'keyboard');assert(g.houseWorldsEnabled,'Wrong device cannot change another player panel');
   lobby.navigate(q,{accept:true},'pad:0');assert(g.houseWorldsEnabled,'Choosing selected Wildbound mode does not toggle it off');
   lobby.open(p,'environment');lobby.open(q,'environment');
   const forest=[...lobby.nodes.get(q.id).querySelectorAll('.map-choices button')].find(b=>b.textContent.includes('Forest'));forest.click();
   assert(!g.houseWorldsEnabled,'Selecting Forest leaves Wildbound mode');
   assert(lobby.nodes.get(p.id).querySelector('button').getAttribute('aria-pressed')==='false','Other open menu updates its selection');
   lobby.navigate(p,{accept:true},'keyboard');lobby.open(p,'environment');lobby.close(q);
   assert(!lobby.nodes.get(p.id).querySelector('.wildbound-mode-choice i'),'Wildbound card has no toggle switch');
   window.wildboundQA={g,p,q,assets,host,lobby,travel,Renderer,checks,assert};
  });
  w.setContentSize(1201,901);await new Promise(r=>setTimeout(r,400));fs.writeFileSync(path.join(out,'menu.png'),(await w.webContents.capturePage()).toPNG());
  w.setContentSize(560,540);await new Promise(r=>setTimeout(r,300));w.setContentSize(561,541);await new Promise(r=>setTimeout(r,400));fs.writeFileSync(path.join(out,'menu-small.png'),(await w.webContents.capturePage()).toPNG());w.setContentSize(1200,900);
  await run(async()=>{
   const qa=window.wildboundQA,{g,p,q,host,assets,Renderer,assert}=qa;host.replaceChildren();g.environment='ice';g.start();g.openingBoard=false;g.spriteLibrary=assets.library;g.bloom=3;
   assert(g.generatedEnvironment==='house','Mode overrides map choice and starts at home');g.house.doors[0].open=true;qa.house=g.house;qa.originalScenery=g.scenery;
   const canvas=document.createElement('canvas');canvas.style='width:100%;height:100%';host.append(canvas);qa.canvas=canvas;qa.renderer=new Renderer(canvas,assets);
   p.progress=p.boardProgress=7;q.progress=q.boardProgress=19;q.room='storage';p.hp=67;p.inventory.push({type:'pumpkin',qty:2});g.time=100;qa.timings=[];
  });
  for(const to of ['forest','ice','desert','temple','beach','graveyard']){
   const result=await run(async wanted=>{
    const qa=window.wildboundQA,{g,p,q,travel,assert,renderer,canvas}=qa;
    g.houseWorlds.bag=[wanted];
    const progress=g.players.map(p=>p.progress),start=performance.now();travel.prepareHouseWorldTravel(g,5);
    assert(g.event.kind==='world_travel'&&g.event.destination===wanted,'Travel card selects '+wanted);
    const {warmWorldTravelArt}=await import('./src/wildbound-travel-art.mjs');
    g.roll={resolved:true};renderer.resize();
    for(let n=0;n<180&&!renderer.preparedTravel?.arrive;n++){warmWorldTravelArt(renderer,g);await new Promise(r=>setTimeout(r,16));}
    assert(!!renderer.preparedTravel?.arrive,'Arrival raster warms during the card reveal for '+wanted);
    g.roll=null;travel.beginHouseWorldTravel(g,5);
    const samples=[],updates=[],pictures={};let previous='',frames=0;
    while(g.worldTravel&&performance.now()-start<12000){
     const stage=g.worldTravel.stage,stamp=performance.now();g.update(.05);updates.push(performance.now()-stamp);
     if(g.worldTravel){const before=performance.now();renderer.draw(g,.05);samples.push({stage:g.worldTravel.stage,capture:g.worldTravel.stage!==previous,ms:performance.now()-before});previous=g.worldTravel.stage;
      if(g.worldTravel.elapsed>.65&&!pictures[previous])pictures[previous]=canvas.toDataURL();
     }
     frames++;await new Promise(r=>setTimeout(r,16));
    }
    assert(!g.worldTravel&&g.generatedEnvironment===wanted,'Whole party arrives in '+wanted);
    assert(JSON.stringify(g.players.map(p=>p.progress))===JSON.stringify(progress),'Both pieces retain positions in '+wanted);
    assert(g.players.every(p=>!p.room)&&p.hp===67&&p.inventory.at(-1).type==='pumpkin','Health, inventory and room exit retained in '+wanted);
    assert(samples.filter(s=>s.capture).length===2,'Only two scene captures for '+wanted);
    const steady=samples.filter(s=>!s.capture).map(s=>s.ms).sort((a,b)=>a-b);
    qa.timings.push({to:wanted,elapsedMs:performance.now()-start,frames,updateMaxMs:Math.max(...updates),drawP95Ms:steady[Math.floor(steady.length*.95)],captureMs:samples.filter(s=>s.capture).map(s=>s.ms)});
    travel.prepareHouseWorldTravel(g,8);travel.beginHouseWorldTravel(g,8);
    for(let n=0;n<60&&g.worldTravel;n++){g.update(.05);if(g.worldTravel)renderer.draw(g,.05);}
    assert(g.generatedEnvironment==='house'&&!g.worldTravel,'Eight returns from '+wanted);
    assert(g.house===qa.house&&g.scenery===qa.originalScenery&&g.house.doors[0].open,'Original house references restored after '+wanted);
    assert(g.time===100,'House remained frozen during '+wanted);
    return {pictures,timing:qa.timings.at(-1)};
   },to);
   for(const [stage,data]of Object.entries(result.pictures))fs.writeFileSync(path.join(out,to+'-'+stage+'.png'),Buffer.from(data.split(',')[1],'base64'));
   console.log(JSON.stringify(result.timing));
  }
  const report=await run(async()=>{
   const {g,p,travel,assert,checks,timings,renderer,canvas}=window.wildboundQA;
   g.houseWorlds.bag=['forest'];assert(travel.travelHouseWorlds(g,5),'Cached revisit completes synchronously');
   p.progress=p.boardProgress=48;p.x=800;p.y=850;assert(g.beginSeal(p),'Can call Wildbound away from home');
   g.sealTime=1;renderer.draw(g,.016);
   g.completeVictory();assert(g.generatedEnvironment==='house'&&g.phase==='won'&&g.victoryChest,'Away victory opens home finale and reward chest');
   renderer.draw(g,0);return {passed:checks.length,checks,timings,finale:canvas.toDataURL()};
  });
  fs.writeFileSync(path.join(out,'house-finale.png'),Buffer.from(report.finale.split(',')[1],'base64'));delete report.finale;
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,errors,out},null,2));console.log(JSON.stringify({passed:report.passed,errors,out}));clearTimeout(deadline);app.exit(0);
 }catch(e){console.error(e);console.error(errors);fs.writeFileSync(path.join(out,'failure.txt'),String(e));clearTimeout(deadline);app.exit(1);}
});
