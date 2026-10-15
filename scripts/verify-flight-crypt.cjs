const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'flight-crypt-profile-')));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true}}),errors=[];
 win.webContents.setAudioMuted(true);
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  const files=['src/player-motion.mjs','src/humanoid-clips.mjs','src/hero-generation.mjs','src/succubus-attachments.mjs','src/core.mjs','src/navigation.mjs','src/expansion.mjs','src/graveyard-world.mjs','src/zombies.mjs','src/hunter-pets.mjs','src/companion-locomotion.mjs','src/old-well.mjs','src/mausoleum-crypt.mjs','src/underground-view.mjs','src/underground-audio.mjs','src/audio.mjs','src/hero-ui.mjs','src/style.css','src/render-settings.mjs','src/render.mjs','authored/rigs.json'];
  if(base!==root)for(const file of files)if(!fs.readFileSync(path.join(root,file)).equals(fs.readFileSync(path.join(base,file))))throw Error('Package mismatch: '+file);
  await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const {Game}=await import('./src/core.mjs'),{HeroUI}=await import('./src/hero-ui.mjs'),{Animator}=await import('./src/animation.mjs');
   const {playerMotion,drawPlayer,directionVector,playerPose}=await import('./src/player-motion.mjs');
   const {restoreHunterPet,tickHunterPets}=await import('./src/hunter-pets.mjs');
   const {drawHunterPet}=await import('./src/hunter-pet-render.mjs');
   const {rigSubject}=await import('./src/rig-subjects.mjs');
   const {spawnMausoleumEvent}=await import('./src/mausoleum-crypt.mjs');
   const {enterOldWell,oldWellRoomStep}=await import('./src/old-well.mjs');
   const {createUndergroundReverb}=await import('./src/underground-audio.mjs');
   const {GameAudio}=await import('./src/audio.mjs');
   const {DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');
   const assert=(c,m)=>{if(!c)throw Error(m);},before=JSON.stringify(playerMotion);
   const sheet=document.createElement('canvas');sheet.width=1600;sheet.height=1630;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#182b28';c.fillRect(0,0,sheet.width,sheet.height);
   let poses=0;const labels=['Wing hover / relaxed legs','Lion / following walk','Wolf / following trot','Panther / following walk','Tiger / following walk','Bat / flight'];
   for(let row=0;row<6;row++)for(let d=0;d<8;d++){
    if(d===0){c.fillStyle='#eddbad';c.font='18px sans-serif';c.fillText(labels[row],20,28+row*270);}
    const [faceX,faceY]=directionVector(d);c.save();c.translate(100+d*200,205+row*270);c.scale(4,4);
    if(row===0){const a={hp:100,wingHover:true,jumpHeight:42,equipment:{shoulders:'succubus_wings'},appearance:DEFAULT_APPEARANCE,faceX,faceY};for(let f=0;f<8;f++){const p=playerPose({...a,playerFrame:f},0);for(const side of ['L','R'])assert(p['foot'+side][2]<p.pelvis[2]-8,'Hover feet tucked up');poses++;}drawPlayer(c,a,1);}
    else{const kind=['lion','wolf','panther','tiger','bat'][row-1],pet=restoreHunterPet({kind});Object.assign(pet,{x:0,y:0,moving:true,locomotionSpeed:145,step:d*.7+2,faceX,faceY,name:kind});drawHunterPet(c,pet,{color:'#a0bfa0'},1,43);poses++;}
    c.restore();
   }
   assert(JSON.stringify(playerMotion)===before,'Drawing mutated the player rig');
   const gait=document.createElement('canvas');gait.width=gait.height=384;const pen=gait.getContext('2d',{willReadFrequently:true});let gaitSamples=0;
   for(const kind of ['lion','wolf','panther','tiger','bat'])for(let d=0;d<8;d++){
    const hashes=new Set(),[faceX,faceY]=directionVector(d);
    for(let f=0;f<8;f++){
     pen.clearRect(0,0,384,384);pen.save();pen.translate(192,240);pen.scale(4,4);
     const pet=restoreHunterPet({kind});Object.assign(pet,{x:0,y:0,moving:true,locomotionSpeed:145,step:f*.13*70/8,faceX,faceY});drawHunterPet(pen,pet,{color:'#a0bfa0'},f/8,43);pen.restore();
     let hash=2166136261;for(const byte of pen.getImageData(0,0,384,384).data)hash=Math.imul(hash^byte,16777619);hashes.add(hash);gaitSamples++;
    }
    assert(hashes.size>=3,'Pet gait is frozen: '+[kind,d]);
   }
   const g=new Game(()=>.15),p=g.addPlayer('keyboard','Crypt explorer');g.environment='graveyard';g.start();g.openingBoard=false;
   const portal=spawnMausoleumEvent(g);p.x=portal.x;p.y=portal.y+50;assert(enterOldWell(g,p,portal),'Could not enter crypt');
   p.equipment.hand2='lantern';p.roomX=portal.well.exit.x+36;p.roomY=portal.well.exit.y+65;portal.well.enemies=[];
   const root=document.createElement('div');root.style.cssText='position:fixed;inset:0;z-index:99999;background:#152421';document.body.append(root);
   const animator=new Animator(),realDraw=animator.draw.bind(animator),sizes=[];animator.draw=(c,a,t,size)=>{if(a.id===p.id)sizes.push(size);return realDraw(c,a,t,size);};
   const renderer={animator,camera:{zoom:2.6}},ui=new HeroUI(root),windows=[];
   for(const [width,height]of [[1280,850],[900,600],[600,420]]){
    root.style.width=width+'px';root.style.height=height+'px';ui.draw(g,renderer);ui.draw(g,renderer);
    const panel=root.querySelector('.hero-panel'),canvas=panel.querySelector('.room-view'),box=panel.getBoundingClientRect(),view=canvas.getBoundingClientRect();
    assert(box.width<=width&&box.height<=height,'Underground panel does not fit '+[width,height]);assert(view.width>250&&view.height>130,'Underground viewport collapsed');
    // A logical canvas pixel spans two CSS pixels at the same camera zoom.
    const density=2*Math.min(2,devicePixelRatio||1);assert(Math.abs(canvas.width/density-view.width/2)<2,'World scale convention changed');
    windows.push({width,height,panel:[box.width,box.height],view:[view.width,view.height]});
   }
   assert(sizes.length&&sizes.every(n=>n===43),'Underground uses a miniature player');
   const origin={x:p.roomX,y:p.roomY};oldWellRoomStep(g,p,{x:1},.05);assert(p.roomMoving&&p.roomStep>0&&p.roomX>origin.x,'Underground walking stalled');
   root.style.width='1280px';root.style.height='850px';ui.draw(g,renderer);ui.draw(g,renderer);
   const hover=document.createElement('canvas');hover.width=1600;hover.height=270;hover.getContext('2d').drawImage(sheet,0,0);const crypt=root.querySelector('.room-view').toDataURL();
   g.locked=false;const q=g.addPlayer('pad:0','Co-op crypt explorer');q.x=portal.x;q.y=portal.y+50;assert(enterOldWell(g,q,portal),'Co-op crypt entry failed');ui.draw(g,renderer);ui.draw(g,renderer);
   const panels=[...root.querySelectorAll('.hero-panel')].map(n=>n.getBoundingClientRect());assert(panels.length===2&&panels[0].right<=panels[1].left,'Co-op underground panels overlap');q.room=null;ui.draw(g,renderer);ui.draw(g,renderer);
   // Render an impulse through the real Web Audio graph and measure its tail.
   const offline=new OfflineAudioContext(1,22050,22050),buffer=offline.createBuffer(1,22,22050);buffer.getChannelData(0)[0]=1;
   const source=offline.createBufferSource();source.buffer=buffer;source.connect(offline.destination);source.connect(createUndergroundReverb(offline,offline.destination).input);source.start();
   const rendered=await offline.startRendering(),samples=rendered.getChannelData(0);let tailEnergy=0;for(let i=1000;i<8000;i++)tailEnergy+=samples[i]*samples[i];
   assert(tailEnergy>1e-5&&tailEnergy<.15,'Underground reflections absent or too loud');
   const audio=new GameAudio();audio.ctx=new AudioContext();audio.unlocked=true;audio.buses={sfx:audio.ctx.createGain(),ui:audio.ctx.createGain()};audio.buses.sfx.connect(audio.ctx.destination);audio.buses.ui.connect(audio.ctx.destination);audio.game=g;audio.listeners=[p];audio.buffer=async()=>buffer;
   const cue={files:['fixture'],gain:.1,cooldown:0,maxDuration:.001,spatial:false};
   await audio.play({...cue,bus:'ui'},p);assert(!audio.undergroundFx,'UI received reverb');await audio.play(cue,{x:0,y:0});assert(!audio.undergroundFx,'Surface received reverb');await audio.play(cue,p);assert(audio.undergroundFx,'Crypt SFX did not receive reverb');await audio.ctx.close();
   return {sheet:sheet.toDataURL(),hover:hover.toDataURL(),crypt,report:{poses,gaitSamples,windows,coopPanels:true,playerSize:43,rigUnchanged:true,tailEnergy,uiAndSurfaceDry:true,cryptSfxWet:true}};
  })()`);
  for(const [key,name]of [['sheet','flight-companion-eight-directions'],['hover','wing-hover-eight-directions'],['crypt','mausoleum-expanded']])fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(result[key].split(',')[1],'base64'));
  fs.writeFileSync(path.join(out,'flight-crypt-report.json'),JSON.stringify({...result.report,packaged:base!==root,byteMatchedFiles:base!==root?files.length:0,rendererErrors:errors},null,2));
  fs.writeFileSync(path.join(out,'mausoleum-panel.png'),(await win.webContents.capturePage()).toPNG());
  if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify(result.report));app.exit(0);
 }catch(e){console.error(e.stack);app.exit(1);}
});
