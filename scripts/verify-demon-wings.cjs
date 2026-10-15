const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'demon-wings-profile-')));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{offscreen:true}}),errors=[];win.webContents.setAudioMuted(true);
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  const files=['src/items.mjs','src/succubus-attachments.mjs','src/succubus-motion.mjs','src/imp-motion.mjs','src/player-motion.mjs','src/alan-gear-art.mjs','authored/rigs.json'];
  if(base!==root)for(const file of files)if(!fs.readFileSync(path.join(root,file)).equals(fs.readFileSync(path.join(base,file))))throw Error('Package mismatch: '+file);
  await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const {drawPlayer,playerMotion,directionVector}=await import('./src/player-motion.mjs');
   const {drawSuccubus,succubusMotion}=await import('./src/succubus-motion.mjs');
   const {drawImp,impMotion}=await import('./src/imp-motion.mjs');
   const {ITEMS}=await import('./src/items.mjs');
   const {DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');
   const {attachmentPose}=await import('./src/succubus-attachments.mjs');
   const {captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
   const assert=(a,m)=>{if(!a)throw Error(m);};
   assert(ITEMS.imp_wings.wingShape===ITEMS.succubus_wings.wingShape,'Imp uses a different membrane outline');
   const models=[playerMotion,succubusMotion,impMotion],before=JSON.stringify(models);
   const playerWings=attachmentPose(Object.fromEntries(Object.entries(playerMotion.joints).map(([n,j])=>[n,j.position])),{wingHover:true},0,playerMotion);
   for(const m of [succubusMotion,impMotion])for(const side of ['L','R']){
    const r=m.joints['wingRoot'+side].position,mid=m.joints['wingMid'+side].position,tip=m.joints['wingTip'+side].position;
    assert(mid[1]<r[1]&&tip[1]<mid[1],'Wing profile loses its backward sweep');
    assert(mid[1]-r[1]===playerWings['wingMid'+side][1]-playerWings['wingRoot'+side][1],'Player and demon sweep differ');
   }
   const sheet=document.createElement('canvas');sheet.width=1440;sheet.height=960;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#182b28';c.fillRect(0,0,1440,960);
   const rows=[['Player / hover and horns',drawPlayer,playerMotion,{wingHover:true,jumpHeight:42,equipment:{head:'succubus_horns',shoulders:'succubus_wings'},playerFrame:0}],['Succubus / idle',drawSuccubus,succubusMotion,{animationAction:'idle',playerFrame:0}],['Succubus / flying',drawSuccubus,succubusMotion,{animationAction:'fly',playerFrame:0}],['Fire imp / flying',drawImp,impMotion,{animationAction:'fly',playerFrame:0}]];
   rows.forEach(([label,draw,m,a],row)=>{
    c.fillStyle='#e8d5a8';c.font='18px sans-serif';c.fillText(label,16,row*240+24);
    for(let d=0;d<8;d++){
     const [faceX,faceY]=directionVector(d),actor={...a,hp:100,faceX,faceY};
     c.save();c.translate(90+d*180,row*240+187);c.scale(3.2,3.2);draw(c,actor,0,m);c.restore();
     c.save();c.translate(90+d*180,row*240+235);draw(c,actor,0,m);c.restore();
    }
   });
   const heads=document.createElement('canvas');heads.width=1280;heads.height=400;const hc=heads.getContext('2d');hc.imageSmoothingEnabled=false;hc.fillStyle='#243932';hc.fillRect(0,0,1280,400);
   for(let row=0;row<2;row++){
    hc.fillStyle='#eddbad';hc.font='18px sans-serif';hc.fillText(row?'Only horns added / hair stays visible':'Same hair / no horns',16,row*200+22);
    for(let d=0;d<8;d++){
     const [faceX,faceY]=directionVector(d);hc.save();hc.beginPath();hc.rect(d*160,row*200+28,160,172);hc.clip();hc.translate(d*160+80,row*200+296);hc.scale(6,6);
     drawSuccubus(hc,{hp:100,faceX,faceY,animationAction:'idle',playerFrame:0,equipment:{head:row?'succubus_horns':null}},0,succubusMotion);hc.restore();
    }
   }
   const scratch=document.createElement('canvas');scratch.width=scratch.height=256;const pen=scratch.getContext('2d');let frames=0;
   const hairCoverage=[];
   for(let d=0;d<8;d++){
    const [faceX,faceY]=directionVector(d),counts=[],crowns=[];
    for(const head of [null,'succubus_horns']){
     pen.clearRect(0,0,256,256);pen.save();pen.translate(128,210);pen.scale(3,3);drawPlayer(pen,{hp:100,faceX,faceY,animationAction:'idle',playerFrame:0,equipment:{head},appearance:{...DEFAULT_APPEARANCE,hair:'long',hairColor:'#00ff00',shirt:'#663333'}},0,playerMotion);pen.restore();
     const pixels=pen.getImageData(0,0,256,256).data;let green=0,crown=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+1]>pixels[i]*2&&pixels[i+1]>pixels[i+2]*2&&pixels[i+3]>0){green++;const x=(i/4)%256;if(x>=125&&x<=130)crown++;}counts.push(green);crowns.push(crown);
    }
    assert(counts[0]>0&&counts[1]>0,'Hair is absent: facing '+d);
    if(d===0||d===4)assert(crowns[0]>0&&crowns[1]===crowns[0],'Horns clipped the center of the hair crown: '+d+' counts '+crowns);
    hairCoverage.push(counts[1]/counts[0]);
   }
   for(const [draw,m,actions]of [[drawSuccubus,succubusMotion,['idle','walk','fly','whip','kiss','death']],[drawImp,impMotion,['idle','fly','lob','hurt','death']]])for(const action of actions)for(let d=0;d<8;d++)for(let f=0;f<m.clips[action].length;f++){
    const [faceX,faceY]=directionVector(d);pen.clearRect(0,0,256,256);pen.save();pen.translate(128,210);pen.scale(3,3);draw(pen,{hp:100,faceX,faceY,animationAction:action,playerFrame:f},f/12,m);pen.restore();frames++;
   }
   assert(JSON.stringify(models)===before,'Drawing mutated editable rigs');
   const custom=structuredClone(succubusMotion);custom.joints.wingTipL.position[1]-=4;custom.clips.fly.keys[0].joints.wingTipL[2]+=2;
   const authored=JSON.stringify(custom);drawSuccubus(pen,{hp:100,faceX:1,faceY:0,animationAction:'fly',playerFrame:0},0,custom);assert(JSON.stringify(custom)===authored,'Custom wing geometry changed');
   for(const [draw,m]of [[drawSuccubus,succubusMotion],[drawImp,impMotion]]){
    captureLayers(m);draw(pen,{hp:100,faceX:1,faceY:0,animationAction:'fly',playerFrame:0},0,m);releaseLayers(m);
    const wings=capturedLayers(m,6).filter(p=>p.id==='Wing L'||p.id==='Wing R');assert(wings.length===2&&wings.every(p=>p.sprite?.pixels?.some(Boolean)),'Studio cannot capture the profile wings');
   }
   return {sheet:sheet.toDataURL(),heads:heads.toDataURL(),frames,rigsUnchanged:true,customWingsPreserved:true,studioCapture:true,hairCoverage};
  })()`);
  fs.writeFileSync(path.join(out,'demon-wings-eight-directions.png'),Buffer.from(result.sheet.split(',')[1],'base64'));
  fs.writeFileSync(path.join(out,'succubus-horns-hair-closeup.png'),Buffer.from(result.heads.split(',')[1],'base64'));
  const report={frames:result.frames,rigsUnchanged:result.rigsUnchanged,customWingsPreserved:result.customWingsPreserved,studioCapture:result.studioCapture,hairCoverage:result.hairCoverage,packaged:base!==root,byteMatchedFiles:base!==root?files.length:0,rendererErrors:errors};
  fs.writeFileSync(path.join(out,'demon-wings-report.json'),JSON.stringify(report,null,2));if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify(report));app.exit(0);
 }catch(e){console.error(e.stack);app.exit(1);}
});
