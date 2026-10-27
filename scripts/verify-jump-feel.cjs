const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','jump-1.2.35');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false});win.webContents.setAudioMuted(true);
 await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
 const {playerMotion,playerPose,playerAction,playerFrame,drawPlayer,directionVector}=await import('./src/player-motion.mjs');
 const {startJump,tickJump,releaseJump}=await import('./src/jumping.mjs');
 const {Animator}=await import('./src/animation.mjs');const {BANSHEE_EQUIPMENT}=await import('./src/items.mjs');
 const sheet=document.createElement('canvas');sheet.width=1280;sheet.height=760;const c=sheet.getContext('2d');c.fillStyle='#152b24';c.fillRect(0,0,1280,760);c.imageSmoothingEnabled=false;
 const report=[],errors=[];const animator=new Animator();
 for(const [row,held]of [true,false].entries()){
 const a={hp:100,x:0,y:0,faceX:0,faceY:1,jumpImpulse:230,jumpGravity:1200,jumpHeld:true,equipment:{},inventory:[]};startJump(a);let peak=0,sim=0;
  for(let i=0;i<8;i++){
   const wanted=i*.065;while(sim<wanted){if(!held&&sim>.03)releaseJump(a);tickJump(a,1/120);sim+=1/120;peak=Math.max(peak,a.jumpHeight);}
   const action=playerAction(a),frame=playerFrame(a,900,playerMotion);if(frame!==playerFrame(a,0,playerMotion))errors.push('Clock-dependent jump');
   const x=80+i*160,y=180+row*190;c.strokeStyle='#4d6550';c.beginPath();c.moveTo(x-50,y);c.lineTo(x+50,y);c.stroke();
   c.save();c.translate(x,y-a.jumpHeight*2);c.scale(2,2);drawPlayer(c,a,900,playerMotion);c.restore();c.fillStyle='#efe2b9';c.font='12px system-ui';c.fillText(action+' '+wanted.toFixed(2)+'s',x-60,y+25);
  }report.push({held,peak,nativeJump:playerMotion.nativeJumpRevision});
 }
 const actor={hp:100,kind:'player',x:110,y:190,faceX:0,faceY:1,inventory:[],equipment:BANSHEE_EQUIPMENT};
 for(let d=0;d<8;d++){
  const [faceX,faceY]=directionVector(d),a={...actor,faceX,faceY};const direct=document.createElement('canvas');direct.width=220;direct.height=240;const dc=direct.getContext('2d');dc.translate(110,190);drawPlayer(dc,a,.2,playerMotion);
  const cached=document.createElement('canvas');cached.width=220;cached.height=240;animator.draw(cached.getContext('2d'),a,.2,48);
  const bounds=canvas=>{const g=canvas.getContext('2d'),p=g.getImageData(0,0,canvas.width,canvas.height).data;let top=canvas.height;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(p[(y*canvas.width+x)*4+3])top=Math.min(top,y);return top;};
  const full=bounds(direct),via=bounds(cached);if(Math.abs(full-via)>3)errors.push({direction:d,full,via});
  c.drawImage(cached,45,120,130,100,d*160+15,450,130,100);c.save();c.translate(d*160+80,710);c.scale(3,3);drawPlayer(c,a,.2,playerMotion);c.restore();
 }
 return {report,errors,png:sheet.toDataURL().split(',')[1]};})()`);
 fs.writeFileSync(path.join(out,'jump-and-hood.png'),Buffer.from(result.png,'base64'));delete result.png;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));app.exit(result.errors.length?1:0);
}).catch(e=>{console.error(e);app.exit(1);});
