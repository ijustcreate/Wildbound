const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output/character-creator-profile'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{offscreen:true}});
 w.webContents.setAudioMuted(true);
 const run=async source=>{const result=await w.webContents.executeJavaScript('(async()=>{try{return await ('+source+');}catch(e){return {verificationError:e.stack};}})()');if(result?.verificationError)throw Error(result.verificationError);return result;};
 try{
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await run('window.wildboundBoot.ready');console.log(await run('window.verifyCharacterCreator()'));
  fs.mkdirSync(path.join(root,'test-output'),{recursive:true});
  await new Promise(r=>setTimeout(r,250));
  fs.writeFileSync(path.join(root,'test-output/creator-hair-ui.png'),(await w.webContents.capturePage()).toPNG());
  for(const [width,height] of [[1280,850],[780,600],[600,430]]){
   w.setContentSize(width,height);await new Promise(r=>setTimeout(r,300));
   console.log(await run(`(()=>{const p=window.creatorVerification.b,box=p.querySelector('.creation-detail-popup'),carousel=box.querySelector('.creation-style-carousel'),canvas=box.querySelector('canvas'),r=box.getBoundingClientRect(),compact=innerHeight<500;if(!compact&&(carousel.clientHeight<26||canvas.clientHeight<70))throw Error('Picker collapsed');if(carousel.scrollWidth>carousel.clientWidth+1||box.scrollWidth>box.clientWidth+1)throw Error('Picker horizontal overflow');if(!compact)for(const b of box.querySelectorAll(':scope>button,.creation-preview-views button,.creation-style-carousel button')){const a=b.getBoundingClientRect();if(a.top<r.top||a.bottom>r.bottom)throw Error('Picker fixed controls clipped');}return {viewport:[innerWidth,innerHeight],popup:[r.width,r.height],carousel:[carousel.clientWidth,carousel.clientHeight],hair:19,scroll:box.scrollHeight-box.clientHeight};})()`));
  }
  w.setContentSize(1280,850);await new Promise(r=>setTimeout(r,200));
  const sheet=await run(`(async()=>{const {drawCreationPreview}=await import('./src/creation-preview.mjs'),{HAIR_STYLES,FACE_STYLES,DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');const a=document.createElement('canvas');a.width=1000;a.height=980;const c=a.getContext('2d');c.fillStyle='#122a23';c.fillRect(0,0,a.width,a.height);const cells=[...Object.keys(HAIR_STYLES).map(hair=>({hair,mode:'hair',name:HAIR_STYLES[hair]})),...Object.keys(FACE_STYLES).map(face=>({hair:'none',face,mode:'face',name:FACE_STYLES[face]}))];cells.forEach((look,i)=>{const x=i%5*200,y=Math.floor(i/5)*160;c.save();c.translate(x,y);drawCreationPreview(c,{...DEFAULT_APPEARANCE,...look},{width:200,height:138,mode:look.mode,time:0});c.fillStyle='#f4e6b5';c.font='14px system-ui';c.fillText(look.name,10,156);c.restore();});return a.toDataURL();})()`);
  fs.writeFileSync(path.join(root,'test-output/creator-hair-face-sheet.png'),Buffer.from(sheet.split(',')[1],'base64'));
  await run(`(()=>{const b=window.creatorVerification.b;b.creationNavigate({back:true});b.querySelector('.creation-name button').click();return true;})()`);await new Promise(r=>setTimeout(r,250));fs.writeFileSync(path.join(root,'test-output/creator-keyboard-ui.png'),(await w.webContents.capturePage()).toPNG());
  app.exit(0);
 }catch(e){console.error(e);try{console.log(await w.webContents.executeJavaScript(`(()=>{const p=window.creatorVerification?.b,box=p?.querySelector('.creation-detail-popup'),grid=box?.querySelector('.creation-option-grid');return {viewport:[innerWidth,innerHeight],popup:box&&[box.clientWidth,box.scrollWidth],grid:grid&&[grid.clientWidth,grid.scrollWidth],children:box&&[...box.children].map(e=>({tag:e.tagName,cls:e.className,width:e.clientWidth,scroll:e.scrollWidth}))};})()`));fs.writeFileSync(path.join(root,'test-output/creator-error.png'),(await w.webContents.capturePage()).toPNG());}catch{}app.exit(1);}
});
