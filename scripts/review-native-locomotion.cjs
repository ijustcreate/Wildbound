const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/sword-native-locomotion');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1100,height:800,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});try{
 await w.loadFile(path.join(base,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');w.showInactive();
 await w.webContents.executeJavaScript('window.qaRequestFrame=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;new Promise(window.qaRequestFrame)');
 const result=await w.webContents.executeJavaScript(`(async()=>{
  const {drawPlayer,playerMotion,playerPose,directionVector}=await import('./src/player-motion.mjs'),{DEFAULT_APPEARANCE}=await import('./src/appearance.mjs'),{Animator}=await import('./src/animation.mjs'),{capeRows}=await import('./src/cape-motion.mjs');
  const m=playerMotion,original=JSON.stringify(m),canvas=document.createElement('canvas');canvas.width=1280;canvas.height=1040;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#19312c';c.fillRect(0,0,1280,1040);
  const gear={head:'leather_hood',cape:'cape',hand1:'sword',feet:'boots'},look={...DEFAULT_APPEARANCE,hair:'undercut',hairColor:'#50323f',shirt:'#886938',pants:'#43645b'};
  const checks=[];if(m.locomotionRevision!==2)throw Error('Current native locomotion was not loaded');
  for(const [row,action]of ['idle','walk','run','jump_air','jump_fall','slash'].entries())for(let d=0;d<8;d++){
   const [faceX,faceY]=directionVector(d),x=80+d*160,y=150+row*145,actor={appearance:look,equipment:gear,faceX,faceY,animationAction:action,playerFrame:action==='idle'?0:m.clips[action].length*.4,hp:100};
   c.fillStyle='#638275';c.fillRect(x-55,y+3,110,1);c.save();c.translate(x-45,y);drawPlayer(c,actor,0,m);c.restore();c.save();c.translate(x+10,y);c.scale(2.5,2.5);drawPlayer(c,actor,0,m);c.restore();
  }
  c.fillStyle='#f1dca9';c.font='18px sans-serif';c.fillText('Current native rig / S SW W NW N NE E SE / idle, walk, run, air, fall, slash',15,26);
  const images={directions:canvas.toDataURL()};
  for(const action of ['walk','run']){
   c.fillStyle='#19312c';c.fillRect(0,0,1280,1040);
   for(let d=0;d<8;d++)for(let i=0;i<8;i++){
    const [faceX,faceY]=directionVector(d),x=80+i*160,y=120+d*125;
    c.fillStyle='#638275';c.fillRect(x-60,y+2,120,1);c.save();c.translate(x,y);c.scale(2.5,2.5);drawPlayer(c,{appearance:look,equipment:gear,faceX,faceY,animationAction:action,playerFrame:i/8*m.clips[action].length,hp:100},i/8,m);c.restore();
   }images['cycle-'+action]=canvas.toDataURL();
  }
  const video=document.createElement('canvas');video.width=960;video.height=460;const pen=video.getContext('2d'),animator=new Animator(),a={id:9101,sprite:'player',x:180,y:310,faceX:1,faceY:0,hp:100,equipment:gear,appearance:look,inventory:[],step:0,moving:false};
  video.style.cssText='position:fixed;inset:0;width:960px;height:460px;z-index:999999';document.body.append(video);
  const stream=video.captureStream(30),recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:2000000}),chunks=[];recorder.ondataavailable=e=>chunks.push(e.data);recorder.start();
  await new Promise(resolve=>{const start=performance.now();let last=0;function frame(now){const t=(now-start)/1000,dt=Math.min(.05,t-last);last=t;pen.fillStyle='#6e775c';pen.fillRect(0,0,960,460);pen.strokeStyle='#536249';for(let x=0;x<960;x+=48){pen.beginPath();pen.moveTo(x,0);pen.lineTo(x,460);pen.stroke();}for(let y=0;y<460;y+=48){pen.beginPath();pen.moveTo(0,y);pen.lineTo(960,y);pen.stroke();}
   a.moving=t>.5&&t<3.5;const speed=t<2?55:-120;a.walking=t<2;a.faceX=speed>0?1:-1;a.faceY=0;if(a.moving){a.x+=speed*dt;a.step+=Math.abs(speed*dt)*.13;}pen.save();pen.translate(160,0);pen.scale(2,2);animator.draw(pen,{...a,x:a.x/2,y:180},t,48);pen.restore();if(t<4.3)window.qaRequestFrame(frame);else resolve();}window.qaRequestFrame(frame);});
  const finished=new Promise(resolve=>recorder.onstop=resolve);recorder.stop();await finished;stream.getTracks().forEach(t=>t.stop());const bytes=new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer());let raw='';for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));
  if(JSON.stringify(m)!==original)throw Error('Rendering changed editable rig');checks.push('Editable rig unchanged by rendering','Current native locomotion revision loaded','Eight views across six actions','Complete walk/run cycle sheets','Actual Animator start/walk/run/turn/stop capture');
  return {images,video:btoa(raw),checks};})()`);
 for(const [name,url]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));fs.writeFileSync(path.join(out,'locomotion.webm'),Buffer.from(result.video,'base64'));delete result.images;delete result.video;result.errors=errors;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));app.exit(errors.length?1:0);
}catch(e){console.error(e);app.exit(1);}});
