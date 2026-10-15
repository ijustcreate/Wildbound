const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),target=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/slime');
fs.mkdirSync(out,{recursive:true});
app.disableHardwareAcceleration();
app.setPath('userData',path.join(out,'isolated-profile'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1450,height:950,webPreferences:{offscreen:true}}),errors=[];
 w.webContents.setAudioMuted(true);
 w.webContents.on('console-message',(_e,level,message)=>{if(level>=3)errors.push(message);});
 try{
  await w.loadFile(path.join(target,'index.html'),{query:{tools:'1'}});
  await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  const report=await w.webContents.executeJavaScript(`(async()=>{
   const {slimeMotion,validateSlimeMotion,drawSlime,SLIME_BIOMES}=await import('./src/slime-motion.mjs');
   const {poseAt,directionVector}=await import('./src/player-motion.mjs');
   const {captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
   const {RIG_SUBJECTS}=await import('./src/rig-subjects.mjs');
   const {Game,CENTER,EVENTS}=await import('./src/core.mjs');
   const {creatures}=await import('./src/definitions.mjs');
   const {saveSession,restoreSession}=await import('./src/session.mjs');
   if(!validateSlimeMotion(slimeMotion)||!RIG_SUBJECTS.slime)throw Error('Authored slime rig did not load');
   if(!creatures.slime||creatures.slime.stats.hp!==46)throw Error('Slime enemy definition missing');
   const clips=Object.keys(slimeMotion.clips),directions=8,canvas=document.createElement('canvas'),cell=112;
   canvas.width=cell*directions;canvas.height=cell*SLIME_BIOMES.length;
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#19342d';c.fillRect(0,0,canvas.width,canvas.height);
   let poseSamples=0;
   for(let row=0;row<SLIME_BIOMES.length;row++)for(let d=0;d<directions;d++){
    const biome=SLIME_BIOMES[row],[faceX,faceY]=directionVector(d),cx=d*cell+cell/2,cy=row*cell+cell/2+4;
    c.fillStyle='#d6dfc4';c.font='9px monospace';c.fillText(biome+' / '+d,d*cell+4,row*cell+11);
    const clip=slimeMotion.clips.run;
    for(let frame=0;frame<clip.length;frame++){const pose=poseAt(slimeMotion,'run',frame);for(const p of Object.values(pose))if(!p.every(Number.isFinite))throw Error('Nonfinite transferred pose');poseSamples++;}
    c.save();c.translate(cx,cy);drawSlime(c,{kind:'slime',slimeBiome:biome,faceX,faceY,moving:true,step:d*2,hp:46},d*.1,slimeMotion);c.restore();
   }
   for(let row=0;row<SLIME_BIOMES.length;row++)for(let col=0;col<clips.length;col++){
    const name=clips[col],clip=slimeMotion.clips[name];
    for(let frame=0;frame<clip.length;frame++){const pose=poseAt(slimeMotion,name,frame);for(const p of Object.values(pose))if(!p.every(Number.isFinite))throw Error('Invalid '+name+' frame');poseSamples++;}
   }
   captureLayers(slimeMotion);drawSlime(c,{kind:'slime',slimeBiome:'forest',faceX:0,faceY:1,hp:46},0,slimeMotion);releaseLayers(slimeMotion);
   const parts=capturedLayers(slimeMotion,0);for(const id of ['Slime body','Slime gel body','Slime eyes','Location marks and slime droplets'])if(!parts.find(p=>p.id===id)?.sprite?.pixels?.some(Boolean))throw Error('Missing editable part '+id);
   const sessionChecks=[];
   for(const biome of SLIME_BIOMES){
    const eventIndex=EVENTS.findIndex(e=>e.kind==='slime'&&e.environment===biome);if(eventIndex<0)throw Error('No '+biome+' slime event');
    const g=new Game(()=>.5,{deferWorld:true});g.environment=biome;g.generatedEnvironment=null;g.addPlayer('keyboard','QA Hero');g.start();g.openingBoard=false;g.spawnEvent(eventIndex,{test:true});
    const enemies=g.enemies.filter(e=>e.kind==='slime');if(enemies.length!==3||enemies.some(e=>e.slimeBiome!==biome))throw Error('Wrong '+biome+' slime spawn variant');
    if(new Set(enemies.map(e=>e.slimeVariant)).size!==3)throw Error('Slime pack lacks individual visual variation');
    const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));if(restored.enemies.filter(e=>e.kind==='slime').some(e=>e.slimeBiome!==biome))throw Error('Slime location marks did not survive save');
    sessionChecks.push({biome,event:EVENTS[eventIndex].name,count:enemies.length,variant:enemies[0].slimeBiome});
   }
   const png=canvas.toDataURL('image/png').split(',')[1];
   const animCanvas=document.createElement('canvas'),animCell=128;animCanvas.width=animCell*clips.length;animCanvas.height=animCell*SLIME_BIOMES.length;
   const ac=animCanvas.getContext('2d');ac.imageSmoothingEnabled=false;ac.fillStyle='#19342d';ac.fillRect(0,0,animCanvas.width,animCanvas.height);
   for(let row=0;row<SLIME_BIOMES.length;row++)for(let col=0;col<clips.length;col++){
    const biome=SLIME_BIOMES[row],name=clips[col],clip=slimeMotion.clips[name],cx=col*animCell+animCell/2,cy=row*animCell+animCell/2+3;
    ac.fillStyle='#d6dfc4';ac.font='9px monospace';ac.fillText(biome+' / '+name,col*animCell+4,row*animCell+11);
    const actor={kind:'slime',slimeBiome:biome,faceX:0,faceY:1,hp:name==='death'?0:46,animationAction:name,poseTime:.55,deathTimer:.9,moving:name==='walk'||name==='run'};
    ac.save();ac.translate(cx,cy);drawSlime(ac,actor,clip.length*.55,slimeMotion);ac.restore();
   }
   const animPng=animCanvas.toDataURL('image/png').split(',')[1];
   const studioButton=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Rig studio');
   if(!studioButton)throw Error('Game Rig Studio button missing; boot='+window.wildboundBoot.error+'; buttons='+[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean).join('|'));
   studioButton.click();
   const picker=document.querySelector('.ps-subject');if(!picker)throw Error('Rig Studio did not open');picker.value='slime';picker.dispatchEvent(new Event('change'));
   if(picker.value!=='slime'||!document.querySelector('.designer-dialog[open]'))throw Error('Slime subject failed in Rig Studio');
   return {image:png,animationImage:animPng,clips:clips.map(name=>({name,source:slimeMotion.provenance.clips[name]})),jointCount:Object.keys(slimeMotion.joints).length,poseSamples,editableParts:parts.map(p=>p.id),locations:sessionChecks,studio:'slime subject opens',valid:validateSlimeMotion(slimeMotion)};
  })()`);
  fs.writeFileSync(path.join(out,'directions.png'),Buffer.from(report.image,'base64'));fs.writeFileSync(path.join(out,'animations.png'),Buffer.from(report.animationImage,'base64'));delete report.image;delete report.animationImage;
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({...report,errors},null,2)+'\n');
  console.log(JSON.stringify(report));app.exit(0);
 }catch(error){console.error(error.stack||error);app.exit(1);}
});
