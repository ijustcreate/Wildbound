const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),output=path.join(root,'test-output/bouncer-wowhead-motion-transfer');
fs.mkdirSync(output,{recursive:true});app.disableHardwareAcceleration();app.commandLine.appendSwitch('mute-audio');app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-bouncer-motion-')));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1300,height:820,webPreferences:{offscreen:true,backgroundThrottling:false}});win.webContents.setAudioMuted(true);const errors=[];
 win.webContents.on('console-message',(_e,level,msg)=>{if(level>=3)errors.push(msg)});
 try{
  await win.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
  await win.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,r)=>setTimeout(()=>r(Error('boot timeout')),30000))])`);
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const {CREATURE_PACK}=await import('./src/creature-packs/wildlife.mjs');
   const {BOUNCER_WOW_MOTION}=await import('./src/bouncer-wow-motion-data.mjs');
   const subject=CREATURE_PACK.subjects.jumping_spider,model=subject.defaults();Object.assign(model.clips,structuredClone(BOUNCER_WOW_MOTION.clips));
   const dirs=['S','SW','W','NW','N','NE','E','SE'],vectors=[[0,-1],[-Math.SQRT1_2,-Math.SQRT1_2],[-1,0],[-Math.SQRT1_2,Math.SQRT1_2],[0,1],[Math.SQRT1_2,Math.SQRT1_2],[1,0],[Math.SQRT1_2,-Math.SQRT1_2]],phases=[0,.25,.5,.75],clips=[['idle','STAND · NPC 222532 ID 0'],['walk','WALK · NPC 222532 ID 4'],['run','RUN · NPC 222532 ID 5']],sheets={};
   for(const[action,label]of clips){const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=530;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#f1e4c8';c.font='bold 17px system-ui';c.fillText('BOUNCER · '+label+' · EIGHT-FACING EDITABLE RIG REVIEW',14,24);c.fillStyle='#b4c8ba';c.font='12px system-ui';c.fillText('Candidate exact donor clips · muted Electron capture · four phases · original Wildbound art',14,43);for(let d=0;d<8;d++){c.fillStyle='#d9cba9';c.font='bold 12px system-ui';c.textAlign='center';c.fillText(dirs[d],115+d*145,62)}const clip=model.clips[action];for(let p=0;p<4;p++){const y=72+p*111,frame=Math.round(phases[p]*Math.max(0,clip.length-1));c.textAlign='left';c.fillStyle='#9bc9aa';c.font='bold 10px system-ui';c.fillText(Math.round(phases[p]*100)+'%',8,y+43);for(let d=0;d<8;d++){c.save();c.translate(115+d*145,y+72);c.scale(2.1,2.1);const[vx,vy]=vectors[d],actor={id:'bouncer-'+action+'-'+p+'-'+d,kind:'jumping_spider',sprite:'jumping_spider',x:0,y:0,faceX:vx,faceY:vy,state:action,animationAction:action,playerFrame:frame,moving:action!=='idle',walking:action==='walk',speed:action==='run'?120:45,locomotionSpeed:action==='run'?120:45,step:frame*14,equipment:{}};subject.draw(c,actor,0,model);c.restore()}c.strokeStyle='#254438';c.beginPath();c.moveTo(90,y+106);c.lineTo(1272,y+106);c.stroke()}sheets[action]=canvas.toDataURL('image/png').split(',')[1]}
   return{sheets,lengths:Object.fromEntries(clips.map(([n])=>[n,model.clips[n].length])),source:BOUNCER_WOW_MOTION.provenance};
  })()`);
  if(errors.length)throw Error(errors.join('\n'));
  for(const[action,bytes]of Object.entries(result.sheets))fs.writeFileSync(path.join(output,`${action}-eight-facings.png`),Buffer.from(bytes,'base64'));
  fs.writeFileSync(path.join(output,'capture.json'),JSON.stringify({donor:result.source,renderer:'muted Electron; native CREATURE_PACK subject.draw',audioMuted:true,facings:['S','SW','W','NW','N','NE','E','SE'],phases:[0,.25,.5,.75],clipLengths:result.lengths,errors},null,2));
  console.log(JSON.stringify({output,renderer:'muted Electron',audioMuted:true,facings:8,phases:4,errors:errors.length},null,2));
 }catch(error){console.error(error.stack||error);process.exitCode=1}finally{win.destroy();app.quit()}
});
