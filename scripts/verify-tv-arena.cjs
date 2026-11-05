const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_APP_ROOT||root,out=path.join(root,'test-output/tv-arena',process.env.ARENA_STAGE||'source');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:900,webPreferences:{backgroundThrottling:false}}),errors=[];win.webContents.setAudioMuted(true);
 win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const integrated=window.verifyTvWildboundFlow();await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
   const raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;await new Promise(raf);
   const {TvWildbound,TV_BOARD_X,TV_WILDBOUND_WIDTH}=await import('./src/tv-wildbound.mjs'),{Animator}=await import('./src/animation.mjs');
   const {ARENA_SUBJECTS}=await import('./src/tv-arena-creatures.mjs'),{directionVector}=await import('./src/player-motion.mjs');
   const {RigStudio}=await import('./src/player-studio.mjs'),{captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
   const {Game}=await import('./src/core.mjs'),{LobbyState,PlayableLobby}=await import('./src/playable-lobby.mjs'),{LobbyTelevision}=await import('./src/lobby-tv.mjs');
   const g=new Game(),hero=g.addPlayer('keyboard','Lumen'),state=new LobbyState(),television=new LobbyTelevision(7);state.sync(g.players);Object.assign(state.members.get(hero.id),{spawned:true,panel:null,x:785,y:165});television.join(hero.id);television.completed=true;
   const lobby=Object.create(PlayableLobby.prototype);Object.assign(lobby,{getGame:()=>g,state,television,practice:{stepPractice(){}},sync(){},draw(){},panels:{replaceChildren(){}},area:{querySelector:()=>({textContent:''})},root:{querySelector:()=>({textContent:''})}});lobby.update(.016,{});
   const m=lobby.tvWildbound;m.intro=3;const p=m.players.get(hero.id),a=new Animator(),images={'integrated-tv':integrated.png},checks=[];
   const check=(name,test)=>{checks.push({name,passed:!!test});if(!test)throw Error(name);};
   check('real TV completion enters isolated arena',m instanceof TvWildbound&&g.phase==='lobby'&&hero.progress===0);
   check('actual app TV route transfers two players',integrated.players===2&&integrated.phase==='lobby');
   const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=810;const c=canvas.getContext('2d');
   const snap=(name,camera)=>{m.camera=camera;m.draw(c,canvas.width,canvas.height,a);images[name]=canvas.toDataURL();};
   snap('center-calm',TV_BOARD_X-480);Object.assign(p,{x:TV_BOARD_X,y:437,face:1});m.step(.016,{[hero.id]:{attack:true}});check('board strike queues six enemies',m.waveQueue.length===6&&m.enemies.length===0);snap('board-roll',m.camera);
   for(let i=0;i<115;i++)m.step(.05,{});check('both chosen enemy types emerge from alcoves',new Set(m.enemies.map(e=>e.kind)).size===2&&m.enemies.length===6);snap('center-wave',TV_BOARD_X-480);snap('west-route',0);snap('east-route',TV_WILDBOUND_WIDTH-960);
   canvas.width=2880;canvas.height=540;m.camera=960;m.draw(c,2880,540,a);images['full-arena']=canvas.toDataURL();canvas.width=1440;canvas.height=810;
   m.enemies=[];const t=m.tubes[0];Object.assign(p,{x:t.x,y:t.y,grounded:true,vx:0,vy:0,tubeCooldown:0,lootHeld:false});m.rollView=null;m.step(.05,{[hero.id]:{loot:true}});check('interact begins tube travel',!!p.tubeTransit);for(let i=0;i<17;i++)m.step(.05,{});const target=m.tubes.find(s=>s.id===t.pair);check('tube arrives on paired upper lip without depth motion',p.x===target.x&&Math.abs(p.y-target.y)<1&&p.grounded);snap('tube-arrival',0);
   Object.assign(p,{x:TV_BOARD_X,y:437,vx:0,vy:0,grounded:true,lootHeld:false});m.step(.05,{[hero.id]:{up:true,down:true}});check('up/down cannot move actor into depth',p.x===TV_BOARD_X&&p.y===437);
   for(const [label,start,end]of [['floor-to-bridge',437,317],['bridge-to-crown',317,197]]){
    Object.assign(p,{x:TV_BOARD_X,y:start,grounded:true,vy:0,jumpHeld:false});let highest=start;
    for(let i=0;i<84;i++){m.step(1/60,{[hero.id]:{jump:true}});highest=Math.min(highest,p.y);}
    check(label+' real input passes the overhead platform and lands',highest<end&&p.y===end&&p.grounded);snap(label,TV_BOARD_X-480);
    m.step(1/60,{});
   }
   Object.assign(p,{x:TV_BOARD_X,y:197,grounded:true,vy:0,jumpHeld:false});let topHead=999,lowestFoot=197,groundBottom=0;
   for(let i=0;i<84;i++){
    m.step(1/60,{[hero.id]:{jump:true}});m.draw(c,1440,810,a);
    topHead=Math.min(topHead,p.y+m.verticalOffset-58);
    groundBottom=Math.max(groundBottom,437+m.verticalOffset);
    if(p.y<lowestFoot){lowestFoot=p.y;images['upper-jump-headroom']=canvas.toDataURL();}
   }
   check('upper jump keeps the full player below the header',topHead>=56);
   check('upper jump keeps the ground lane on screen',groundBottom<=510);
   Object.assign(p,{x:800,y:149,grounded:true,vy:0,jumpHeld:false});let tubeHead=999,tubePeak=149;
   for(let i=0;i<84;i++){
    m.step(1/60,{[hero.id]:{jump:true}});m.draw(c,1440,810,a);tubeHead=Math.min(tubeHead,p.y+m.verticalOffset-58);
    if(p.y<tubePeak){tubePeak=p.y;images['upper-tube-jump-headroom']=canvas.toDataURL();}
   }
   check('jumping off the highest tube keeps the player visible',tubeHead>=56);
   check('highest tube jump lands back on its lip',p.y===149&&p.grounded);
   for(const [label,x,dir]of [['west-ascent',380,1],['east-ascent',2500,-1],['west-arena-ascent',1130,-1],['east-arena-ascent',1750,1]]){
    Object.assign(p,{x,y:317,grounded:true,vy:0,jumpHeld:false});
    for(let i=0;i<84;i++)m.step(1/60,{[hero.id]:{jump:true,right:dir===1,left:dir===-1}});
    check(label+' climbs with normal walking input',p.y===197&&p.grounded);snap(label,Math.max(0,Math.min(1920,p.x-480)));
   }
   const turtle=m.spawnAt({x:1400,y:437,face:1},'mossback');turtle.emerging=0;turtle.speed=0;Object.assign(p,{x:1400,y:398,vy:180,grounded:false,invulnerable:0});m.step(.03,{});check('Mossback stomp retracts and bounces',turtle.shell&&p.vy<0);Object.assign(p,{x:1365,y:437,vy:0,grounded:true,face:1});m.attack(p);check('strike launches retracted shell',turtle.shellSpeed===300);
   canvas.width=640;canvas.height=360;snap('small-window',TV_BOARD_X-480);canvas.width=1440;canvas.height=810;
   // Native assembled views and every animation action, including the bent/fallen pose.
   canvas.width=1280;canvas.height=560;c.fillStyle='#203632';c.fillRect(0,0,1280,560);c.textAlign='left';c.font='18px monospace';
   for(const [row,kind]of ['bramblecap','mossback'].entries()){
    c.fillStyle='#ead9a8';c.fillText(kind.toUpperCase()+' · DRAFT NATIVE RIG',20,30+row*260);
    for(let d=0;d<8;d++){const [faceX,faceY]=directionVector(d),x=80+d*155,y=150+row*260;a.draw(c,{kind,sprite:kind,x,y,faceX,faceY,animationAction:'walk',playerFrame:3,hp:2},0,96);a.draw(c,{kind,sprite:kind,x,y:y+56,faceX,faceY,animationAction:'walk',playerFrame:3,hp:2},0,48);c.fillText(String(d),x-4,y+82);}
   }images['eight-directions']=canvas.toDataURL();
   canvas.width=1400;canvas.height=620;c.fillStyle='#203632';c.fillRect(0,0,1400,620);
   for(const [row,kind]of ['bramblecap','mossback'].entries())for(const [col,action]of Object.keys(ARENA_SUBJECTS[kind].data.clips).entries()){
    const x=56+col*106,y=125+row*290;c.fillStyle='#ead9a8';c.font='11px monospace';c.fillText(action,x-30,y+45);a.draw(c,{kind,sprite:kind,x,y,faceX:1,faceY:0,animationAction:action,playerFrame:7,hp:2},0,70);
    for(let f=0;f<4;f++)a.draw(c,{kind,sprite:kind,x:x-30+f*20,y:y+110,faceX:1,faceY:0,animationAction:action,playerFrame:f*4,hp:2},0,30);
   }images['animation-actions']=canvas.toDataURL();
   const host=document.createElement('div');document.body.append(host);const studio=new RigStudio(async()=> 'QA isolated save');studio.setSubject('bramblecap');studio.mount(host);studio.playing=false;
   for(const [kind,s]of Object.entries(ARENA_SUBJECTS)){
    studio.setSubject(kind);studio.mount(host);studio.playing=false;studio.animate(0);
    for(let d=0;d<8;d++){const [faceX,faceY]=directionVector(d);c.resetTransform();c.clearRect(0,0,1400,620);c.save();c.translate(128,128);captureLayers(s.data);try{s.draw(c,{faceX,faceY,animationAction:'idle',playerFrame:0},0);}finally{releaseLayers(s.data);c.restore();}check(kind+' view '+d+' has capturable editable pixels',capturedLayers(s.data,d).some(p=>p.sprite.pixels.some(Boolean)));}
   }
   canvas.width=1440;canvas.height=810;m.camera=TV_BOARD_X-480;
   for(const kind of ['tv_ruin_tile','tv_travel_tube','tv_board_altar','tv_fern','tv_torch']){
    const s=ARENA_SUBJECTS[kind],original=structuredClone(s.data),edited=structuredClone(s.data);
    m.draw(c,1440,810,a);const before=c.getImageData(0,0,1440,810).data;
    for(const views of Object.values(edited.boneSprites||{}))for(const sprite of Object.values(views))if(sprite?.palette)sprite.palette=sprite.palette.map((color,i)=>i?'#ff00ff':color);
    s.replace(edited);m.draw(c,1440,810,a);const after=c.getImageData(0,0,1440,810).data;let changed=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])changed++;
    s.replace(original);check(kind+' saved pixel edits appear in the real arena',changed>5);
   }
   studio.livePreview?.dispose();studio.resizeObserver?.disconnect();host.remove();m.finish();canvas.width=1440;canvas.height=810;snap('victory',m.camera);check('party chest remains available',m.victoryRewards.length>0);
   return {checks,images,wave:m.wave,subjects:Object.keys(ARENA_SUBJECTS)};
  })().catch(e=>({error:e.stack}))`);
  if(result.error)throw Error(result.error);
  for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
  fs.writeFileSync(path.join(out,'integrated-ui.png'),(await win.webContents.capturePage()).toPNG());
  if(fs.existsSync(path.join(out,'failure.txt')))fs.unlinkSync(path.join(out,'failure.txt'));
  result.errors=errors;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));win.destroy();app.exit(errors.length?1:0);
 }catch(e){fs.writeFileSync(path.join(out,'failure.txt'),String(e.stack||e));console.error(e);win.destroy();app.exit(1);}
});
