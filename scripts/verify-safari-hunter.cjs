const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.env.WILDBOUND_QA_ROOT||path.join(__dirname,'..')),out=path.join(__dirname,'../test-output/safari-hunter');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.commandLine.appendSwitch('mute-audio');app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000}),errors=[];w.webContents.setAudioMuted(true);w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadFile(path.join(root,'index.html'));
  const result=await w.webContents.executeJavaScript(`(async()=>{
   window.__hunterStage='boot';await window.wildboundBoot.ready;
   const [{Assets},{Animator},{Game,EVENTS},{rigSubject},{paintItem},{playerPose}]=await Promise.all([import('./src/assets.mjs'),import('./src/animation.mjs'),import('./src/core.mjs'),import('./src/rig-subjects.mjs'),import('./src/item-art.mjs'),import('./src/player-motion.mjs')]);
   window.__hunterStage='assets';const assets=new Assets();await assets.load();const animator=new Animator(assets),subject=rigSubject('safari_hunter'),sheet=document.createElement('canvas');sheet.width=2048;sheet.height=1740;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#29353a';c.fillRect(0,0,sheet.width,sheet.height);c.font='30px sans-serif';c.fillStyle='#ead9b4';c.fillText('Safari Hunter · Oathless Captain rig · eight directions',32,40);if(subject.data.joints.chest.parent!=='spine'||!subject.data.joints.toeL)throw Error('Hunter is not using the Oathless Captain skeleton');
   const actions=['hunter_rifle_idle','hunter_rifle_walk','hunter_kneel_aim','hunter_shoot','hunter_reload','hunter_retreat','death'];let frames=0;
   for(const [row,action]of actions.entries())for(let d=0;d<8;d++){
    window.__hunterStage=action+'/'+d;
    const a=d*Math.PI/4,clip=subject.data.clips[action],actor={kind:'hunter',sprite:'safari_hunter',x:d*256+128,y:row*220+185,hp:action==='death'?0:100,maxHp:100,deathTimer:.5,faceX:Math.sin(a),faceY:Math.cos(a),moving:action==='hunter_rifle_walk',equipment:{head:'safari_hat',shoulders:'safari_shoulders',chest:'safari_vest',cape:'safari_cape',gloves:'safari_gloves',pants:'safari_pants',feet:'safari_boots',hand1:'rifle',hand2:'occupied'},animationAction:action,playerFrame:action==='death'?clip.length-1:Math.floor(clip.length*.6),night:{phase:action==='hunter_kneel_aim'?'aim':action==='hunter_shoot'?'fire':action==='hunter_reload'?'recover':action==='hunter_retreat'?'dash':'idle',timer:.3,fire:.08}};
    animator.draw(c,actor,1,148);c.font='16px sans-serif';c.fillStyle='#b9c8c8';c.fillText(action+' / '+d,d*256+10,row*220+208);
    for(let f=0;f<clip.length;f++){const scratch=document.createElement('canvas');scratch.width=scratch.height=160;const q=scratch.getContext('2d');q.translate(80,88);subject.draw(q,{...actor,playerFrame:f},f/clip.fps,subject.data);frames++;}
   }
   window.__hunterStage='icons';for(const [i,id]of ['safari_hat','safari_shoulders','safari_vest','safari_cape','safari_gloves','safari_pants','safari_boots','rifle'].entries()){c.save();c.translate(30+i*220,1660);c.scale(5,5);paintItem(c,id);c.restore();}
   window.__hunterStage='event';
   const g=new Game(()=>.3);g.addPlayer('keyboard','Scout');g.start();g.openingBoard=false;const index=EVENTS.findIndex(e=>e.kind==='hunter');g.spawnEvent(index);const hunter=g.enemies.find(e=>e.kind==='hunter');
   if(hunter?.sprite!=='safari_hunter'||hunter.equipment?.cape!=='safari_cape')throw Error('Spawned encounter did not use Safari humanoid outfit');
   const hero=document.createElement('canvas');hero.width=1380;hero.height=570;const hc=hero.getContext('2d');hc.imageSmoothingEnabled=false;hc.fillStyle='#29353a';hc.fillRect(0,0,hero.width,hero.height);hc.fillStyle='#ead9b4';hc.font='26px sans-serif';hc.fillText('Safari Hunter · Oathless Captain rig',34,46);
   for(const [i,[direction,action,label]]of [[0,'hunter_rifle_idle','Two-hand rifle ready'],[4,'hunter_rifle_idle','Black cape back'],[2,'hunter_kneel_aim','Kneel and aim']].entries()){
    const a=direction*Math.PI/4,clip=subject.data.clips[action],actor={kind:'hunter',sprite:'safari_hunter',x:230+i*460,y:430,hp:100,maxHp:100,faceX:Math.sin(a),faceY:Math.cos(a),equipment:{head:'safari_hat',shoulders:'safari_shoulders',chest:'safari_vest',cape:'safari_cape',gloves:'safari_gloves',pants:'safari_pants',feet:'safari_boots',hand1:'rifle',hand2:'occupied'},animationAction:action,playerFrame:Math.floor(clip.length*.6),night:{phase:action==='hunter_kneel_aim'?'aim':'idle',timer:.3,fire:.08}};
    animator.draw(hc,actor,1,280);hc.fillStyle='#b9c8c8';hc.font='20px sans-serif';hc.fillText(label,70+i*460,532);
   }
   window.__hunterPreview=sheet;
   window.__hunterHero=hero;
   window.__hunterStage='diagnostic';const diagnostic={};for(const action of ['hunter_rifle_idle','guard','hunter_kneel_aim','hunter_shoot']){const clip=subject.data.clips[action],actor={kind:'hunter',sprite:'safari_hunter',x:0,y:0,hp:100,maxHp:100,equipment:{hand1:'rifle'},animationAction:action,playerFrame:Math.floor(clip.length*.6)};const p=playerPose(actor,1,subject.data);diagnostic[action]={pelvis:p.pelvis,head:p.head,handR:p.handR,handL:p.handL,footL:p.footL,footR:p.footR};}
   return {frames,subject:subject.data.type,captainRig:true,clips:['hunter_rifle_idle','hunter_rifle_walk','hunter_kneel_aim','hunter_shoot','hunter_reload','hunter_retreat'].every(x=>!!subject.data.clips[x]),event:true,sprite:hunter.sprite,cape:hunter.equipment.cape,rigLabel:subject.name,diagnostic};
  })()`);
  const png=await w.webContents.executeJavaScript(`(async()=>Array.from(new Uint8Array(await new Promise(r=>window.__hunterPreview.toBlob(async b=>r(await b.arrayBuffer()))))))()`);
  fs.writeFileSync(path.join(out,'assembled.png'),Buffer.from(png));
  const heroPng=await w.webContents.executeJavaScript(`(async()=>Array.from(new Uint8Array(await new Promise(r=>window.__hunterHero.toBlob(async b=>r(await b.arrayBuffer()))))))()`);
  fs.writeFileSync(path.join(out,'hero.png'),Buffer.from(heroPng));
  const report={...result,rendererErrors:errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));if(errors.length)throw Error('Renderer errors: '+errors.join('; '));console.log(JSON.stringify(report));
 }catch(error){const stage=await w.webContents.executeJavaScript('window.__hunterStage').catch(()=>null);console.error(stage,error.stack||error);process.exitCode=1;}finally{w.destroy();app.quit();}
});
