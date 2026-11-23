const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_APP_ROOT||root,out=path.join(root,'test-output/tv-arena-run',process.env.ARENA_STAGE||'source');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:900,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);const errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  const result=await win.webContents.executeJavaScript(`(async()=>{
   await window.wildboundBoot.ready;
   const raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;await new Promise(raf);
   const {TvWildbound,TV_BOARD_X}=await import('./src/tv-wildbound.mjs');
   const {loadTvParallax}=await import('./src/tv-arena-parallax.mjs');await loadTvParallax();
   const {Game}=await import('./src/core.mjs'),{Animator}=await import('./src/animation.mjs');
   const {startEncounter,openArenaBlessings,damageBriarHeart,tickArenaRun,tickArenaProjectiles,arenaLoadout,moveArenaEnemy}=await import('./src/tv-arena-run.mjs');
   const {PlayableLobby,LobbyState}=await import('./src/playable-lobby.mjs'),{LobbyPractice}=await import('./src/lobby-practice.mjs');
   const g=new Game(),heroes=[g.addPlayer('keyboard','Lumen'),g.addPlayer('pad:0','Fern')],state=new LobbyState();state.sync(heroes);
   for(const hero of heroes)Object.assign(state.members.get(hero.id),{spawned:true,panel:null});
   const m=new TvWildbound(heroes,42);m.intro=3;const [p,q]=m.players.values(),animator=new Animator();
   const lobby=Object.create(PlayableLobby.prototype);Object.assign(lobby,{getGame:()=>g,state,tvWildbound:m,practice:new LobbyPractice(),sync(){},draw(){}});
   const checks=[],images={},check=(name,value)=>{checks.push({name,passed:!!value});if(!value)throw Error(name);};
   const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=810;const c=canvas.getContext('2d');
   const snap=name=>{m.camera=TV_BOARD_X-480;m.draw(c,canvas.width,canvas.height,animator);images[name]=canvas.toDataURL();};
   const tick=(n,inputs={})=>{for(let i=0;i<n;i++)m.step(1/60,inputs);};
   const reset=()=>{m.progress=0;m.boardCooldown=0;m.thornRoots=[];m.roundState='idle';m.encounter=null;m.waveQueue=[];m.enemies=[];m.rollView=null;m.roundObjects=[];m.hazards=[];m.projectiles=[];m.supplyDrops=[];for(const a of m.players.values())Object.assign(a,{x:TV_BOARD_X+(a===q?80:0),y:437,vx:0,vy:0,grounded:true,jumpHeld:false,attackHeld:false,lootHeld:false,dashHeld:false,attackCooldown:0,invulnerable:3,tubeTransit:null});};
   snap('board-preview');check('three core tiers and playable crowns',new Set([437,...m.platforms.map(s=>s.y)]).size===4);
   lobby.update(.016,{keyboard:{tvUp:true,tvX:true}});check('actual keyboard command changes kit',p.arenaKit==='spear'&&m.wave===0);lobby.update(.016,{});
   lobby.update(.016,{'pad:0':{tvUp:true,tvX:true}});check('controller changes only its own kit',q.arenaKit==='spear'&&p.arenaKit==='spear');lobby.update(.016,{});
   for(const [i,kind]of ['skirmish','treasure','hazard','champion'].entries()){
    reset();m.roundsCleared=2;const roll=[1,3,5,6][i];startEncounter(m,roll,p.id);check(kind+' selected from known die face',m.encounter.kind===kind);
    check(kind+' credits the roll immediately',m.progress===roll);m.message=kind+' trial';tick(150);check(kind+' spawns native creatures',m.enemies.length>=4);
    if(kind==='hazard'){for(const root of m.thornRoots)root.clock=0;m.step(.05,{});check('thornstorm visibly warns before damage',m.hazards.some(h=>h.age<1.25));}
    if(kind==='champion')check('champion has separate health and guards',m.enemies.some(e=>e.champion&&e.hp===10)&&m.enemies.length>1);
    snap('encounter-'+kind);
    // Defeat through the real damage path; treasure also needs its marked objectives.
    m.waveQueue=[];for(const root of m.thornRoots)damageBriarHeart(m,root,100);for(const e of m.enemies){e.emerging=0;m.damageEnemy(e,100);}
    if(kind==='treasure'){
     m.step(.016,{});check('treasure does not clear without marked seeds',m.roundState==='active');
     for(const s of m.roundObjects){Object.assign(p,{x:s.x,y:s.y+24});m.step(.001,{});}
    }else m.step(.016,{});
    check(kind+' clear offers an optional blessing',m.pendingBlessing&&m.roundState==='idle');openArenaBlessings(m);snap('blessings-'+kind);
    for(let f=0;f<20;f++)m.step(.02,{[p.id]:{attack:true},[q.id]:{attack:true}});
    check('held attacks cannot choose '+kind,!p.blessingChoice.done&&!q.blessingChoice.done);
    m.step(.016,{});m.step(.016,{[p.id]:{right:true}});check('focus stays with its explorer '+kind,p.blessingChoice.index===1&&q.blessingChoice.index===0);
    m.step(.016,{[p.id]:{loot:true},[q.id]:{paused:true,loot:true}});check('paused owner cannot accept '+kind,p.blessingChoice.done&&!q.blessingChoice.done);
    m.step(.016,{});m.step(.016,{[q.id]:{loot:true}});check('whole party resumes after choices '+kind,m.roundState==='idle');
   }
   reset();p.arenaKit='bow';p.arenaAmmo=4;Object.assign(p,{x:2750,y:437,face:1});const inventory=JSON.stringify(heroes[0].inventory);m.attack(p);for(let i=0;i<90;i++)tickArenaProjectiles(m,1/60);
   check('missed arrow becomes recoverable',m.supplyDrops.some(s=>s.kind==='arrow'));check('arrow does not spend main inventory',JSON.stringify(heroes[0].inventory)===inventory);
   const drop=m.supplyDrops.find(s=>s.kind==='arrow');Object.assign(p,{x:drop.x,y:drop.y+24});tickArenaRun(m,.016,{});check('arrow is recovered once',p.arenaAmmo===4);tickArenaRun(m,.016,{});check('recovery cannot duplicate ammunition',p.arenaAmmo===4);
   reset();p.arenaKit='spear';Object.assign(p,{x:1440,y:317,grounded:true});tick(84,{[p.id]:{jump:true}});check('real input climbs center tiers',p.y===197&&p.grounded);
   m.step(.016,{});tick(16,{[p.id]:{jump:true,down:true}});check('real input drops through upper ledge',p.y>230);
   reset();Object.assign(p,{x:800,y:149,grounded:true});let minHead=999;for(let i=0;i<90;i++){m.step(1/60,{[p.id]:{jump:true,up:true,dash:i===20}});m.draw(c,1440,810,animator);minHead=Math.min(minHead,p.y+m.verticalOffset-58);}check('high jump and upward dodge stay visible',minHead>=56);
   reset();p.blessings.airStep=2;Object.assign(p,{x:800,y:149,grounded:true,dashCooldown:0});let chainHead=999,chainPeak=149,airUses=0;
   for(let i=0;i<240;i++){m.step(1/60,{[p.id]:{jump:true,up:true,dash:[30,75,120].includes(i)}});m.draw(c,1440,810,animator);chainHead=Math.min(chainHead,p.y+m.verticalOffset-58);airUses=Math.max(airUses,p.airDodges);if(p.y<chainPeak){chainPeak=p.y;images['windstep-high-jump']=canvas.toDataURL();}}
   check('Windstep II full upward dodge chain stays visible',airUses===3&&chainPeak< -200&&chainHead>=56);
   reset();const source=m.tubes[0],target=m.tubes[1];Object.assign(p,{x:source.x,y:source.y,grounded:true});m.step(.016,{[p.id]:{loot:true}});check('tube destination warns before arrival',m.tubeWarnings.some(w=>w.x===target.x));tick(50);check('tube arrival protects explorer',p.x===target.x&&p.invulnerable>0);
   const shell=m.spawnAt({x:source.x-45,y:437,face:1},'mossback');Object.assign(shell,{emerging:0,shell:true,shellSpeed:300});moveArenaEnemy(m,shell,.016);check('rolling shell enters tube with warning',!!shell.shellTransit);for(let i=0;i<24;i++)moveArenaEnemy(m,shell,.016);check('shell exits its linked tube',Math.abs(shell.x-target.x)<150);
   reset();m.roundsCleared=3;startEncounter(m,1,p.id);m.waveQueue=[];tickArenaRun(m,.016,{});openArenaBlessings(m);
   for(const size of [[1440,810],[640,360],[960,720]]){canvas.width=size[0];canvas.height=size[1];snap('blessings-'+size.join('x'));check('choice screen draws at '+size.join('x'),c.getImageData(0,0,1,1).data[3]===255);}
   const four=new TvWildbound([...heroes,{id:'third',name:'Rowan'},{id:'fourth',name:'Ash'}],42);four.intro=3;startEncounter(four,1,p.id);four.waveQueue=[];tickArenaRun(four,.016,{});openArenaBlessings(four);canvas.width=1440;canvas.height=810;four.draw(c,1440,810,animator);images['blessings-four-players']=canvas.toDataURL();check('all four explorers have independent choices',[...four.players.values()].every(a=>a.blessingChoice?.offers.length>=1));
   m.finish();check('native party treasure still opens',m.victoryRewards.length===7);
   return {checks,images};
  })().catch(e=>({error:e.stack}))`);
  if(result.error)throw Error(result.error);
  for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
  result.errors=errors;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));win.destroy();app.exit(errors.length?1:0);
 }catch(e){fs.writeFileSync(path.join(out,'failure.txt'),String(e.stack||e)+'\n'+JSON.stringify(errors));console.error(e,errors);win.destroy();app.exit(1);}
});
