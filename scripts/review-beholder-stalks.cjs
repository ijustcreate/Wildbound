const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/beholder-stalks');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message)});
 try{
  await w.loadFile(path.join(base,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const {Animator}=await import('./src/animation.mjs'),{rigSubject}=await import('./src/rig-subjects.mjs'),{directionVector,poseAt}=await import('./src/player-motion.mjs');
   const animator=new Animator(),canvas=document.createElement('canvas');canvas.width=1100;canvas.height=650;
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#182d29';c.fillRect(0,0,1100,650);c.fillStyle='#f4dfb7';c.font='bold 23px Georgia';c.fillText('BEHOLDER / CURVED EYESTALK FIT',24,32);
   c.font='15px system-ui';c.fillText('Current authored rig + exact-default migration / native gameplay renderer',24,58);
   const checks=[],assert=(v,m)=>{if(!v)throw Error(m);checks.push(m)};
   const model=rigSubject('beholder').data;assert(model.joints.stalk6&&model.artRevision===2,'Authored beholder upgrades to the seven-stalk rig');
   const actor={id:83,kind:'beholder',hp:100,faceX:0,faceY:1,x:0,y:0,state:'idle'};
   for(const [j,d] of [0,1,2,3,4].entries()){
    const [faceX,faceY]=directionVector(d),a={...actor,faceX,faceY};c.fillStyle='#f4dfb7';c.fillText(['Front','Front diagonal','Profile','Rear diagonal','Rear'][j],25+j*215,94);
    c.save();c.translate(105+j*215,265);c.scale(3,3);animator.draw(c,a,1.1,43);c.restore();
    c.save();c.translate(105+j*215,346);animator.draw(c,a,1.1,43);c.restore();
   }
   c.fillStyle='#f4dfb7';c.fillText('Idle sway / float / attack / hurt / fallen',25,390);
   for(const [j,action] of ['idle','float','attack','hurt','death'].entries()){
    c.save();c.translate(105+j*215,565);c.scale(2.2,2.2);rigSubject('beholder').draw(c,{...actor,animationAction:action,hp:action==='death'?0:100,attack:action==='attack'?.25:0},1.4,model,poseAt(model,action,3));c.restore();
   }
   const scratch=document.createElement('canvas');scratch.width=scratch.height=160;const pen=scratch.getContext('2d');
   for(const kind of ['beholder','lesser_beholder'])for(let d=0;d<8;d++)for(const action of ['idle','float','attack','recover','hurt','death'])for(let frame=0;frame<8;frame++){
    const m=rigSubject(kind).data,before=JSON.stringify(m),pose=poseAt(m,action,frame),[faceX,faceY]=directionVector(d),p=rigSubject(kind).draw(pen,{...actor,kind,faceX,faceY},1.3,m,pose);
    assert(Object.values(p).every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)),'Finite '+kind+' '+d+' '+action);assert(JSON.stringify(m)===before,'No authored mutation '+kind+' '+d+' '+action);
   }
   const rear=document.createElement('canvas');rear.width=1100;rear.height=440;const r=rear.getContext('2d');r.fillStyle='#182d29';r.fillRect(0,0,1100,440);r.fillStyle='#f4dfb7';r.font='20px Georgia';r.fillText('Rear views and outgoing eye rays / current native rig',24,32);
   for(const [j,d]of [2,3,4,5,6].entries()){
    const [faceX,faceY]=directionVector(d);for(const [row,attack]of [false,true].entries()){
     r.save();r.translate(105+j*215,190+row*190);r.scale(2.3,2.3);animator.draw(r,{...actor,faceX,faceY,animationAction:attack?'attack':'idle',attack:attack?.25:0,beholderRayTime:attack?.4:0},1.1,43);r.restore();
    }
   }
   const {drawAxolotl}=await import('./src/axolotl.mjs'),study=document.createElement('canvas');study.width=1100;study.height=460;const s=study.getContext('2d');s.fillStyle='#182d29';s.fillRect(0,0,1100,460);s.fillStyle='#f4dfb7';s.font='22px Georgia';s.fillText('AXOLOTL / user-approved native articulated artwork',24,32);
   for(const [j,d]of [0,1,2,3,4].entries()){
    const [faceX,faceY]=directionVector(d);s.fillStyle='#f4dfb7';s.font='15px Georgia';s.fillText(['Front','Front diagonal','Profile','Rear diagonal','Rear'][j],25+j*215,65);
    s.save();s.translate(105+j*215,180);s.scale(3,3);drawAxolotl(s,{faceX,faceY},1.2,48);s.restore();drawAxolotl(s,{x:105+j*215,y:237,faceX,faceY},1.2,48);
    s.save();s.translate(105+j*215,400);s.scale(2.3,2.3);drawAxolotl(s,{faceX,faceY,moving:true,travelDistance:j*9},1.2,48);s.restore();
   }
   return {png:canvas.toDataURL(),rear:rear.toDataURL(),axolotl:study.toDataURL(),checks};
  })()`);
  fs.writeFileSync(path.join(out,'assembled.png'),Buffer.from(result.png.split(',')[1],'base64'));if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'rear-rays.png'),Buffer.from(result.rear.split(',')[1],'base64'));fs.writeFileSync(path.join(out,'axolotl-draft.png'),Buffer.from(result.axolotl.split(',')[1],'base64'));
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks:result.checks,rendererErrors:errors},null,2));console.log(JSON.stringify({checks:result.checks.length,rendererErrors:errors}));app.exit(0);
 }catch(e){console.error(e,errors);app.exit(1)}
});
