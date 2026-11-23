const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_APP_ROOT||root,out=path.join(root,'test-output/tv-polish',process.env.ARENA_STAGE||'source');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();app.commandLine.appendSwitch('mute-audio');
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1440,height:900,webPreferences:{backgroundThrottling:false}}),errors=[];win.webContents.setAudioMuted(true);win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});try{
 await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
 const raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;await new Promise(raf);
 const {TvWildbound}=await import('./src/tv-wildbound.mjs'),{Animator}=await import('./src/animation.mjs'),{loadTvParallax,tvParallaxStatus}=await import('./src/tv-arena-parallax.mjs');
 const {TV_NEW_ENEMIES,TV_ENEMY_THEMES,tvEnemyAnimation,tvEnemyPoseTime}=await import('./src/tv-arena-roster.mjs'),{ARENA_SUBJECTS}=await import('./src/tv-arena-creatures.mjs'),{poseAt,directionVector}=await import('./src/player-motion.mjs');
 const {loadTvJourneyArt,tvBoardPresentation}=await import('./src/tv-journey-board.mjs');
 const {startEncounter}=await import('./src/tv-arena-run.mjs');
 const {drawTvEnemyActor}=await import('./src/tv-arena-roster-art.mjs');
 const {Game}=await import('./src/core.mjs'),{PlayableLobby,LobbyState}=await import('./src/playable-lobby.mjs'),{LobbyPractice}=await import('./src/lobby-practice.mjs');
 const checks=[],images={},bounds={},check=(name,value)=>{checks.push({name,passed:!!value});if(!value)throw Error(name);};
 check('entrance illustration loads',await loadTvJourneyArt());await loadTvParallax();check('all four generated parallax layers load',tvParallaxStatus().ready&&tvParallaxStatus().layers===4&&!tvParallaxStatus().error);check('parallax cache is bounded on the shared pixel grid',tvParallaxStatus().pixels<=524288);
 const skinImage=new Image();skinImage.src=new URL('./assets/tv-arena/board-mossroot-v1.png',location.href).href;await skinImage.decode();check('Mossroot board scenery asset loads',skinImage.naturalWidth>1000);
 const {drawBoardScene,boardArtBiome}=await import('./src/board-art.mjs'),{TRAIL,boardPoint}=await import('./src/board.mjs'),{DEFAULT_BOARD_SETTINGS}=await import('./src/board-settings.mjs');
 const boardPixels=(environment)=>{const surface=document.createElement('canvas');surface.width=840;surface.height=576;const pen=surface.getContext('2d');pen.imageSmoothingEnabled=false;pen.translate(420,288);pen.scale(3,3);drawBoardScene(pen,{environment,players:[]},0,{settings:{...DEFAULT_BOARD_SETTINGS,particles:80,glow:0}},TRAIL,boardPoint);return {surface,data:pen.getImageData(0,0,840,576).data};};
 const original=boardPixels('forest'),skinned=boardPixels('tv-arena');let sceneryChanges=0;
 for(let i=0;i<original.data.length;i+=4)if(original.data[i]!==skinned.data[i]||original.data[i+1]!==skinned.data[i+1]||original.data[i+2]!==skinned.data[i+2])sceneryChanges++;
 check('Mossroot scenery visibly differs from the forest board',sceneryChanges>15000);
 for(const [index,p]of TRAIL.entries()){let same=true,diff=null;const cx=Math.round(420+p.x*3),cy=Math.round(288+p.y*3);for(let y=cy-4;y<=cy+4;y++)for(let x=cx-4;x<=cx+4;x++){const offset=(y*840+x)*4;for(let k=0;k<4;k++)if(Math.abs(original.data[offset+k]-skinned.data[offset+k])>2){same=false;diff??={x,y,k,a:original.data[offset+k],b:skinned.data[offset+k]};}}check('native board space '+index+' retains its original foreground (2-channel raster tolerance)'+(diff?' '+JSON.stringify(diff):''),same);}
 images['board-skin-forest-reference']=original.surface.toDataURL();images['board-skin-mossroot']=skinned.surface.toDataURL();
 const compare=document.createElement('canvas');compare.width=1680;compare.height=610;const cp=compare.getContext('2d');cp.fillStyle='#102d2b';cp.fillRect(0,0,1680,610);cp.drawImage(original.surface,0,34);cp.drawImage(skinned.surface,840,34);cp.fillStyle='#efd9a0';cp.font='16px system-ui';cp.fillText('Forest reference - same original foreground',18,23);cp.fillText('Mossroot 2D - new scenery',858,23);images['board-skin-comparison']=compare.toDataURL();
 check('ordinary forest boards still select forest',boardArtBiome({environment:'forest'})==='forest');
 const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=810;const c=canvas.getContext('2d'),animator=new Animator();
 const hero={id:'one',name:'Lumen',equipment:{hand1:'sword'},inventory:[]},m=new TvWildbound([hero],42);m.intro=3;const p=m.players.get('one');p.invulnerable=100;
 const snap=(name,camera=m.camera)=>{m.camera=camera;m.draw(c,canvas.width,canvas.height,animator);images[name]=canvas.toDataURL();},tick=(n,input={})=>{for(let i=0;i<n;i++)m.step(1/60,{one:input});};
 for(const [name,camera]of [['west',0],['center',960],['east',1920]])snap('arena-'+name,camera);
 canvas.width=2880;canvas.height=540;snap('arena-panorama',960);canvas.width=1440;canvas.height=810;
 const scratch=document.createElement('canvas');scratch.width=256;scratch.height=192;const sc=scratch.getContext('2d');
 const alphaBounds=()=>{const d=sc.getImageData(0,0,256,192).data;let minX=256,minY=192,maxX=-1,maxY=-1,n=0;for(let y=0;y<192;y++)for(let x=0;x<256;x++)if(d[(y*256+x)*4+3]>32){n++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}return {x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1,foot:maxY-150,pixels:n};};
 canvas.width=1440;canvas.height=760;c.fillStyle='#173a34';c.fillRect(0,0,1440,760);
 for(const [row,kind]of ['bramblecap','mossback'].entries()){
  check(kind+' uses the revised editable artwork',ARENA_SUBJECTS[kind].data.artGeneration===2);
  for(let d=0;d<8;d++){const [faceX,faceY]=directionVector(d),x=85+d*178,y=160+row*330;animator.draw(c,{kind,sprite:kind,x,y,faceX,faceY,animationAction:'walk',playerFrame:4,hp:2},0,90);animator.draw(c,{kind,sprite:kind,x,y:y+82,faceX,faceY,animationAction:'walk',playerFrame:4,hp:2},0,48);c.fillStyle='#e9d9ae';c.font='13px monospace';c.fillText(String(d),x-4,y+115);
   sc.clearRect(0,0,256,192);animator.draw(sc,{kind,sprite:kind,x:128,y:150,faceX,faceY,animationAction:'walk',playerFrame:4,hp:2},0,48);const visible=alphaBounds();check(kind+' direction '+d+' has readable assembled art',visible.pixels>80&&visible.w>15&&visible.h>15);
   if(d===0)for(const [action,clip]of Object.entries(ARENA_SUBJECTS[kind].data.clips)){const pose=poseAt(ARENA_SUBJECTS[kind].data,action,7);check(kind+' '+action+' remains finite',Object.values(pose).every(v=>v.every(Number.isFinite)));}
  }
 }images['native-eight-directions']=canvas.toDataURL();
 canvas.width=1440;canvas.height=720;c.fillStyle='#173a34';c.fillRect(0,0,1440,720);
 for(const [row,kind]of ['bramblecap','mossback'].entries())for(const [col,action]of ['idle','walk','run','attack','hurt','death','retract','shell','slide','wake'].entries()){
  const x=68+col*141,y=130+row*330;c.fillStyle='#e9d9ae';c.font='11px monospace';c.fillText(action,x-28,y+43);
  for(let f=0;f<4;f++)animator.draw(c,{kind,sprite:kind,x:x-45+f*30,y:y+112,faceX:1,faceY:0,animationAction:action,playerFrame:f*4,hp:2},0,36);
  animator.draw(c,{kind,sprite:kind,x,y,faceX:1,faceY:0,animationAction:action,playerFrame:6,hp:2},0,64);
 }images['native-animation-actions']=canvas.toDataURL();
 // The sprout extends above the 23px shell core; the closed rim must still meet its feet plane.
 for(const action of ['shell','slide']){sc.clearRect(0,0,256,192);animator.draw(sc,{kind:'mossback',sprite:'mossback',x:128,y:150,faceX:1,faceY:0,animationAction:action,playerFrame:6,hp:2},0,48);const b=alphaBounds();if(!(b.h<=30&&Math.abs(b.foot)<=4))throw Error('Mossback '+action+' registration: '+JSON.stringify(b));check('Mossback '+action+' stays compact and planted',true);}
 canvas.width=1600;canvas.height=620;c.fillStyle='#173a34';c.fillRect(0,0,1600,620);
 for(const [index,[kind,def]]of Object.entries(TV_NEW_ENEMIES).entries()){
  const sim=new TvWildbound([{id:'target',equipment:{},inventory:[]}],71);sim.intro=3;const target=sim.players.get('target');target.invulnerable=100;target.x=1480;
  const e=sim.spawnAt({x:1200,y:437,face:1},kind);e.emerging=0;let moved=false,finite=true;
  for(let i=0;i<360;i++){const x=e.x,y=e.y;sim.step(1/60,{});moved ||= Math.hypot(e.x-x,e.y-y)>.01;finite &&= [e.x,e.y,e.vx,e.vy].every(Number.isFinite);}check(kind+' physics finite across 360 frames',finite);
  check(kind+' performs its side-view behavior',(moved||kind==='archer'&&e.ammo<6)&&e.x>=20&&e.x<=2860&&e.y<=437);
  for(const sign of [-1,1]){
   sc.clearRect(0,0,256,192);const actor={...e,x:128,y:150,faceX:sign,faceY:0,sprite:kind,impFlightHeight:0,animationAction:tvEnemyAnimation(e),poseTime:tvEnemyPoseTime(e)};drawTvEnemyActor(sc,animator,actor,2,def.size);const b=alphaBounds();bounds[kind+':'+sign]=b;
   check(kind+' facing '+sign+' has visible native art',b.pixels>30&&b.w>7&&b.h>7);check(kind+' facing '+sign+' fits the side-view sprite surface',b.x>1&&b.y>1&&b.x+b.w<254&&b.y+b.h<190);check(kind+' facing '+sign+' visual base matches collider feet',Math.abs(b.foot)<=5);
   const col=index%5,row=Math.floor(index/5),x=col*320+(sign<0?10:165),y=row*310;c.imageSmoothingEnabled=false;c.drawImage(scratch,b.x-3,b.y-3,b.w+6,b.h+6,x,y+82,(b.w+6)*2,(b.h+6)*2);c.drawImage(scratch,b.x-3,b.y-3,b.w+6,b.h+6,x+20,y+218,b.w+6,b.h+6);
  }
  const col=index%5,row=Math.floor(index/5),x=col*320,y=row*310;c.fillStyle='#f0dfb3';c.font='16px monospace';c.fillText(def.name,x+12,y+32);c.font='12px monospace';c.fillText(def.role,x+12,y+55);
  sim.damageEnemy(e,100);check(kind+' can be defeated in the TV combat loop',!e.alive);check(kind+' leaves bounded recoverable supplies',sim.supplyDrops.length<=80);
 }images['expanded-roster-side-views']=canvas.toDataURL();
 canvas.width=1440;canvas.height=810;
 for(const [index,theme]of TV_ENEMY_THEMES.entries()){
  const arena=new TvWildbound([hero],42);arena.intro=3;arena.roundsCleared=2+index;arena.players.get('one').invulnerable=100;arena.players.get('one').x=1440;startEncounter(arena,1,'one');arena.waveQueue=[];
  for(const [i,kind]of theme.roster.entries()){const e=arena.spawnAt({x:1150+i*170,y:i%2?317:437,face:i<2?1:-1},kind);e.emerging=0;}
  for(let i=0;i<150;i++)arena.step(1/60,{});arena.camera=960;arena.draw(c,1440,810,animator);images['theme-'+theme.name.toLowerCase().replaceAll(' ','-')]=canvas.toDataURL();check(theme.name+' renders and runs in the real arena',arena.enemies.filter(e=>e.alive).length>=3);
 }
 canvas.width=1440;canvas.height=810;Object.assign(p,{x:1440,y:437,grounded:true});tick(18,{down:true,right:true});check('real input enters crouched walk',p.crouching&&p.bodyHeight===34&&Math.abs(p.vx)===90);snap('crouched-walk',960);
 const renderPlayer=(crouched)=>{sc.clearRect(0,0,256,192);animator.draw(sc,{...hero,kind:'player',x:128,y:150,faceX:1,faceY:0,moving:false,tvCrouch:crouched?1:0,animationAction:'idle'},0,71);return alphaBounds();};
 const stand=renderPlayer(false),duck=renderPlayer(true);check('rendered crouch lowers the head without scaling the whole character',duck.h<stand.h-8&&Math.abs(duck.foot-stand.foot)<5);
 Object.assign(p,{x:1440,y:197,grounded:true,vy:0,jumpHeld:false});tick(90,{down:true,jump:true});check('Down Jump drops from crown onto the bridge',p.y===317&&p.grounded);snap('drop-to-bridge',960);tick(2,{});tick(90,{down:true,jump:true});check('fresh Down Jump drops from bridge to ground',p.y===437&&p.grounded);snap('drop-to-ground',960);
 m.projectiles=[{friendly:false,kind:'enemy-arrow',x:p.x,y:p.y-40,vx:0,vy:0,life:1}];p.invulnerable=0;const hp=p.hp;m.step(.016,{one:{down:true}});check('crouched collider ducks a head-height missile',p.hp===hp);
 const initial=tvParallaxStatus().pixels;for(let i=0;i<120;i++){m.camera=i*29-200;m.draw(sc,256,192,animator);}check('scrolling never grows the background cache',tvParallaxStatus().pixels===initial&&tvParallaxStatus().layers===4);
 for(const device of ['keyboard','pad:0']){
  const g=new Game(),hero=g.addPlayer(device,'Input check'),state=new LobbyState();state.sync(g.players);Object.assign(state.members.get(hero.id),{spawned:true,panel:null});const mode=new TvWildbound(g.players,42);mode.intro=3;const actor=mode.players.get(hero.id),lobby=Object.create(PlayableLobby.prototype);Object.assign(lobby,{getGame:()=>g,state,tvWildbound:mode,practice:new LobbyPractice(),sync(){},draw(){}});
  lobby.update(.016,{[device]:{tvDown:true,tvRight:true}});check(device+' routes Down into a crouched walk',actor.crouching&&actor.bodyHeight===34&&actor.vx===90);lobby.update(.016,{});Object.assign(actor,{x:1440,y:197,vy:0,grounded:true,jumpHeld:false});lobby.update(.016,{[device]:{tvDown:true,tvA:true}});check(device+' routes Down Jump into platform drop-through',actor.dropThrough>0&&actor.y>197);
 }
 m.intro=1.4;m.draw(c,1440,810,animator);images['game-is-real-entrance']=canvas.toDataURL();m.intro=3;
 const actual=new Game(),actualHero=actual.addPlayer('keyboard','Board input'),actualState=new LobbyState();actualState.sync(actual.players);Object.assign(actualState.members.get(actualHero.id),{spawned:true,panel:null});const actualMode=new TvWildbound(actual.players,42);actualMode.intro=3;const actualActor=actualMode.players.get(actualHero.id);Object.assign(actualActor,{x:1440,invulnerable:100});const actualLobby=Object.create(PlayableLobby.prototype);Object.assign(actualLobby,{getGame:()=>actual,state:actualState,tvWildbound:actualMode,practice:new LobbyPractice(),sync(){},draw(){}});
 actualLobby.update(.016,{keyboard:{tvX:true}});check('real lobby keyboard strike advances the board',actualMode.progress===actualMode.lastRoll&&actualMode.wave===1);
 for(let i=0;i<115;i++)actualLobby.update(1/60,{});actualLobby.update(.016,{keyboard:{tvX:true}});check('real lobby keyboard can roll again with queued creatures',actualMode.wave===2);
 const loop=new TvWildbound([hero],42);loop.intro=3;const runner=loop.players.get('one');runner.invulnerable=100;
 for(const [x,dir] of [[460,'left'],[2420,'right']]){
  Object.assign(runner,{x,y:197,vy:0,grounded:true,jumpHeld:false});loop.step(1/60,{one:{jump:true,[dir]:true}});for(let i=0;i<40;i++)loop.step(1/60,{one:{jump:true,[dir]:true}});for(let i=0;i<60;i++)loop.step(1/60,{});
  check('highest platform '+x+' catches a real jump',runner.y===116&&runner.grounded&&runner.bodyHeight===58);loop.camera=x-480;loop.draw(c,1440,810,animator);images['playable-crown-'+x]=canvas.toDataURL();
  loop.step(1/60,{one:{down:true,jump:true}});for(let i=0;i<100;i++)loop.step(1/60,{});check('highest platform '+x+' supports drop-through',runner.y>116);
 }
 Object.assign(runner,{x:1440,y:437,grounded:true,vy:0,jumpHeld:false,attackHeld:false});loop.step(.016,{one:{attack:true}});const credited=loop.progress;
 check('first strike immediately advances live board',credited===loop.lastRoll&&credited>0);
 const view=loop.rollView,age=view.elapsed;view.elapsed=.4;check('native board holds pawns while dice tumble',tvBoardPresentation(loop).players.every(p=>p.boardProgress===view.startProgress));loop.draw(c,1440,810,animator);images['standard-board-dice']=canvas.toDataURL();
 view.elapsed=1.1;loop.draw(c,1440,810,animator);images['standard-board-moving']=canvas.toDataURL();view.elapsed=1.7;const presented=tvBoardPresentation(loop);check('native board pawns finish at the credited space',presented.players.every(p=>p.boardProgress===loop.progress)&&presented.roll.resolved);check('TV uses its own Mossroot scenery skin',presented.environment==='tv-arena');loop.draw(c,1440,810,animator);images['standard-board-landed']=canvas.toDataURL();view.elapsed=age;
 for(let i=0;i<120;i++)loop.step(1/60,{one:{attack:true}});check('holding attack cannot repeat rolls',loop.wave===1);
 loop.step(.016,{});loop.step(.016,{one:{attack:true}});check('second strike works with active creatures',loop.wave===2&&loop.progress>credited);
 for(let i=0;i<115;i++)loop.step(1/60,{});loop.draw(c,1440,810,animator);images['new-arena-interface']=canvas.toDataURL();
 const roots=new TvWildbound([hero],42);roots.intro=3;startEncounter(roots,5,'one');for(let i=0;i<100;i++)roots.step(1/60,{});roots.camera=960;roots.draw(c,1440,810,animator);images['briar-hearts']=canvas.toDataURL();
 const root=roots.thornRoots[0],rp=roots.players.get('one');Object.assign(rp,{x:root.x,y:root.y,grounded:true,lootHeld:false});roots.step(.016,{one:{loot:true}});check('Interact uproots the visible thorn source',root.hp===0&&!roots.hazards.some(h=>h.source===root.id));
 let rolls=2;while(!loop.won&&rolls<49){for(let i=0;i<115;i++)loop.step(1/60,{});Object.assign(runner,{x:1440,y:437,grounded:true,vy:0,attackHeld:false,invulnerable:100});loop.step(.016,{one:{attack:true}});rolls++;}
 for(let i=0;i<115;i++)loop.step(1/60,{});check('repeated board strikes reach victory without clearing waves',loop.won&&loop.progress===48&&loop.enemies.some(e=>e.alive));check('creature population remains capped across the whole run',loop.enemies.filter(e=>e.alive).length<=24&&loop.waveQueue.length<=24);
 loop.draw(c,1440,810,animator);images['board-finish']=canvas.toDataURL();
 return {checks,images,bounds,parallax:tvParallaxStatus()};})().catch(e=>({error:e.stack}))`);
 if(result.error)throw Error(result.error);for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;result.errors=errors;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));if(fs.existsSync(path.join(out,'failure.txt')))fs.renameSync(path.join(out,'failure.txt'),path.join(out,'failure-'+Date.now()+'.previous.txt'));console.log(JSON.stringify({checks:result.checks.length,errors,bounds:result.bounds}));win.destroy();app.exit(errors.length?1:0);
 }catch(e){fs.writeFileSync(path.join(out,'failure.txt'),String(e.stack||e)+'\n'+JSON.stringify(errors));console.error(e,errors);win.destroy();app.exit(1);}});
