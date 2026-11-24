const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const output=path.join(root,'test-output','conductor-destination',process.env.WILDBOUND_CONDUCTOR_STAGE||(base===root?'source':'packaged'));
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-conductor-destination-')));
app.commandLine.appendSwitch('mute-audio');
const deadline=setTimeout(()=>app.exit(1),120000);

app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false,offscreen:true}});
 win.webContents.setAudioMuted(true);
 const errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const js=code=>win.webContents.executeJavaScript(code);
 const screenshot=async name=>{await new Promise(resolve=>setTimeout(resolve,70));fs.writeFileSync(path.join(output,name+'.png'),(await win.webContents.capturePage()).toPNG());};
 try{
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await js('wildboundBoot.ready');
  await js(`(async()=>{
   window.requestAnimationFrame=()=>0;window.Worker=undefined;
   const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs');
   const {enterWildLands}=await import('./src/wild-lands.mjs');
   const {trainConductor}=await import('./src/train-conductor.mjs');
   const {trainRouteStations}=await import('./src/train-autostop.mjs');
   const {trainCars,trainWorld}=await import('./src/train-track.mjs');
   const {trainInterior}=await import('./src/train-design.mjs');
   const {npcDialogueView}=await import('./src/npc-quests.mjs');
   const game=new Game(()=>.5),hero=game.addPlayer('keyboard','Conductor passenger'),friend=game.addPlayer('pad:0','Cab explorer');
   game.start();game.openingBoard=false;
   const api=wildboundPolishTest,assets=api.assets;
   api.game=game;api.show('play');game.spriteLibrary=assets.library;game.persist=()=>{};game.onSound=()=>{};
   const renderer=new Renderer(document.querySelector('#game-canvas'),assets);api.renderer=renderer;
   const checks=[],whistles=[],pass=(condition,label)=>{if(!condition)throw Error(label);checks.push(label);};
   pass(enterWildLands(game,{persistent:true,homeStart:true}).ok,'Starts normal persistent Wild Lands');
   const t=game.trainTest;t.preparing=false;
   const audio=new AudioContext(),createOscillator=audio.createOscillator.bind(audio);
   audio.createOscillator=()=>{
    const oscillator=createOscillator(),set=oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
    oscillator.frequency.setValueAtTime=(value,time)=>{
     if(Math.abs(value-392*.97)<.001)whistles.push({time:t.time,distance:t.distance,speed:t.speed});
     return set(value,time);
    };
    return oscillator;
   };
   game.trainAudio={ctx:audio,enabled:true,unlocked:true,settings:{master:1,sfx:1},buses:{sfx:audio.createGain()},game,
    spatial:()=>({attenuation:1,pan:0})};
   const marks=trainRouteStations(t),station=marks[1];
   t.distance=station.s-460;
   const approach=()=>{
    const conductor=trainConductor(game,trainCars(t)),x=conductor.ride.x,y=conductor.ride.y;
    hero.trainRide={...conductor.ride};Object.assign(hero,trainWorld(conductor.car,x,y));
    Object.assign(friend,{x:hero.x+90,y:hero.y+70});
   };
   const step=(n=1,extra={})=>{for(let i=0;i<n;i++)game.update(.05,{...api.inputFrame(),...extra});};
   const key=(key,code)=>{for(const type of ['keydown','keyup']){document.body.dispatchEvent(new KeyboardEvent(type,{key,code,bubbles:true,cancelable:true}));step();}};
   const paint=()=>{renderer.trainScene=null;renderer.draw(game,.016);api.heroUI.draw(game,renderer);};
   const choose=action=>{
    const index=npcDialogueView(game,hero).choices.findIndex(choice=>choice.action===action);
    const button=api.heroUI.panels.get(hero.id)?.querySelector('[data-action="npc-choice-'+index+'"]');
    if(!button)throw Error('Live dialogue option is missing '+action);
    button.click();paint();
   };
   approach();key('e','KeyE');paint();
   pass(hero.ui?.trainConductor&&api.heroUI.panels.get(hero.id).textContent.includes('Which station?'),'Actual keyboard E opens the conductor portrait and visible Which station? option');
   pass(hero.inventory.filter(item=>item?.type==='golden_train_ticket').length===1,'The original one-time golden ticket is still awarded');
   key('Enter','Enter');paint();
   const displayed=[...api.heroUI.panels.get(hero.id).querySelectorAll('.npc-dialogue-choice strong')].map(node=>node.textContent);
   pass(marks.length===8&&marks.every(mark=>displayed.includes(mark.name)),'The native dialogue lists every active Wild Lands station');
   window.conductorQA={game,hero,friend,t,marks,station,checks,whistles,pass,approach,key,step,paint,choose,audio,trainInterior,trainCars,trainWorld};
  })()`);
  await screenshot('station-menu');
  await js(`(()=>{const q=conductorQA;
   for(let i=0;i<7;i++){q.key('ArrowDown','ArrowDown');q.paint();}
   const panel=wildboundPolishTest.heroUI.panels.get(q.hero.id),selected=panel.querySelector('.npc-dialogue-choice.selected');
   const bounds=panel.querySelector('.npc-dialogue-body').getBoundingClientRect(),row=selected.getBoundingClientRect();
   q.pass(selected.textContent.includes(q.marks[7].name)&&row.bottom<=bounds.bottom+1&&row.top>=bounds.top-1,'Keyboard navigation scrolls the eighth station fully into view');
  })()`);
  await screenshot('station-menu-later-options');
  await js(`(async()=>{const q=conductorQA,{t,station}=q,before=t.distance;
   q.choose('station:'+station.id);
   q.pass(t.throttle===.4&&t.engine&&t.distance===before&&t.speed===0,'Selecting a station from park sets speed setting 2 while preserving the train position');
   let braking=false,cruise=false;
   for(let i=0;i<500&&t.engine;i++){
    const x=t.distance,speed=t.speed;q.step();
    if(t.distance<x||t.distance>station.s||t.speed-speed>t.design.acceleration*.05+.005||speed-t.speed>t.design.brakePower*.05+.005)throw Error('Unexpected displacement or speed change on the approach');
    cruise||=Math.abs(t.speed-t.design.maxSpeed*.4)<.001;braking||=t.speed<speed-.005;
   }
   q.pass(cruise&&braking&&t.distance===station.s&&t.speed===0&&t.lastStationStop.id===station.id,'Actual simulation accelerates, brakes and stops at the chosen platform');
   q.step(80);q.paint();
   q.pass(q.whistles.length===3&&q.whistles.every(w=>w.distance===station.s&&w.speed===0),'Exactly three real whistle events start at the stopped platform');
   q.pass(q.whistles.slice(1).every((w,i)=>w.time-q.whistles[i].time>=1.79&&w.time-q.whistles[i].time<1.86),'The three whistle events are distinctly spaced in simulation time');
  })()`);
  await screenshot('selected-platform-arrival');
  await js(`(()=>{const q=conductorQA,{t,marks,friend}=q,other=marks[3];
   Object.assign(t,{distance:other.s-600,engine:true,speed:130,throttle:.85});
   q.approach();q.key('e','KeyE');q.key('Enter','Enter');q.paint();
   const before={speed:t.speed,distance:t.distance};q.choose('station:'+other.id);
   q.pass(t.conductorDestination.stationId===other.id&&t.throttle===.4&&t.speed===before.speed&&t.distance===before.distance,'A moving train changes its selected destination without teleporting or jumping speed');
   const cab=q.trainCars(t)[0],console=q.trainInterior(t.design,cab).find(item=>item.kind==='console');
   friend.trainRide={car:cab.index,x:console.x,y:console.y};Object.assign(friend,q.trainWorld(cab,console.x,console.y));
   q.step(1,{'pad:0':{interact:true}});q.paint();
   q.pass(t.driver===friend.id&&friend.trainRide.driving&&!t.conductorDestination&&t.engine,'A second player actually takes the live cab controls and cancels the conductor destination');
   q.pass(q.hero.inventory.filter(item=>item?.type==='golden_train_ticket').length===1,'Repeat conductor dialogue cannot duplicate the golden ticket');
  })()`);
  await screenshot('cab-takeover');
  const result=await js('({checks:conductorQA.checks,whistles:conductorQA.whistles})');
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({...result,base,errors,audioMuted:win.webContents.isAudioMuted()},null,2));
  if(errors.length)throw Error(errors.join('\n'));
  clearTimeout(deadline);app.exit(0);
 }catch(error){
  fs.writeFileSync(path.join(output,'error.txt'),String(error.stack||error)+'\n'+errors.join('\n'));
  clearTimeout(deadline);app.exit(1);
 }
});
