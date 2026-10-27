const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'jump-lighting-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false});win.webContents.setAudioMuted(true);
 await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
  const {Animator}=await import('./src/animation.mjs');
  const {characterLightingFrame}=await import('./src/character-lighting.mjs');
  const rows=[],errors=[],samples=[];
  function render(actor,frame){const canvas=document.createElement('canvas');canvas.width=384;canvas.height=800;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;const a=new Animator();a.lighting=frame;a.draw(c,actor,.12,48);return {canvas,data:c.getImageData(0,0,384,800).data};}
  const frame={ambient:0,sources:[{x:155,y:700,height:140,radius:1000,intensity:1,color:'#ffbb66'}]};
  for(const kind of ['player','villager','oathless_captain','skeleton'])for(const equipment of [{},{hand1:'bow',head:'ranger_hood'}])for(const jumpHeight of [0,20,45,96,160,360]){
   const actor={kind,x:192,y:700,hp:100,faceX:0,faceY:1,inventory:[],equipment,animationAction:'jump_air',playerFrame:2,jumpHeight,groundHeight:0,...(kind==='villager'?{villagerId:'april'}:{})};
   const plain=render(actor,null),lit=render(actor,frame);let pixels=0,mismatch=0,changed=0;
   for(let i=0;i<plain.data.length;i+=4){const a=plain.data[i+3],b=lit.data[i+3];if(a>0)pixels++;if(a!==b)mismatch++;if(a&&[0,1,2].some(n=>plain.data[i+n]!==lit.data[i+n]))changed++;}
   if(!pixels||mismatch)errors.push({kind,jumpHeight,equipment,pixels,mismatch});
   if(!changed)errors.push({kind,jumpHeight,problem:'Local light did not change any sprite colors'});
   rows.push({kind,jumpHeight,equipped:!!equipment.hand1,pixels,mismatch,changed});
   if(kind==='player'&&!equipment.hand1&&[0,45,160,360].includes(jumpHeight))samples.push({jumpHeight,plain:plain.canvas,lit:lit.canvas});
  }
  // An unlit night character must not get a second darkness wash. The world
  // night overlay, not Animator, owns the ambient day/night change.
  const actor={kind:'player',x:192,y:700,hp:100,faceX:0,faceY:1,equipment:{},inventory:[]};
  const a=render(actor,null).data,b=render(actor,{ambient:0,sources:[]}).data;
  if(a.some((v,i)=>v!==b[i]))errors.push({problem:'Ambient darkness was applied twice'});
  // Idle takes the cached-player branch, unlike the explicit jump pose above.
  const cached=new Animator(),cacheCanvas=document.createElement('canvas');cacheCanvas.width=384;cacheCanvas.height=800;const cachePen=cacheCanvas.getContext('2d');
  cached.draw(cachePen,actor,.12,48);const cacheBefore=cachePen.getImageData(0,0,384,800).data;
  cached.lighting=frame;cachePen.clearRect(0,0,384,800);cached.draw(cachePen,actor,.12,48);const cacheLit=cachePen.getImageData(0,0,384,800).data;
  if(!cacheLit.some((v,i)=>i%4!==3&&v!==cacheBefore[i]))errors.push({problem:'Cached idle did not receive local lighting'});
  cached.lighting=null;cachePen.clearRect(0,0,384,800);cached.draw(cachePen,actor,.12,48);const cacheAfter=cachePen.getImageData(0,0,384,800).data;
  if(cacheAfter.some((v,i)=>v!==cacheBefore[i]))errors.push({problem:'Local lighting mutated the unlit idle cache'});
  for(const groundHeight of [45,160,360]){
   const raised={...actor,x:192.25,y:700.25,groundHeight},plain=render(raised,null).data,lit=render(raised,frame).data;
   if(plain.some((v,i)=>i%4===3&&v!==lit[i]))errors.push({problem:'Elevated/fractional actor clipping',groundHeight});
  }
  const carrier={...actor,jumpHeight:160,equipment:{hand1:'torch'}};
  const ownLight=characterLightingFrame({players:[carrier],sky:{elapsed:330},time:0}).sources[0];
  if(ownLight.height!==190)errors.push({problem:'Carried light did not follow jump height',ownLight});
  const sheet=document.createElement('canvas');sheet.width=880;sheet.height=840;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#172c29';c.fillRect(0,0,880,840);c.fillStyle='#e6d7ac';c.font='18px sans-serif';c.fillText('JUMP / UNLIT vs WARM LOCAL LIGHT — SAME PIXEL COVERAGE',18,26);
  samples.forEach(({jumpHeight,plain,lit},i)=>{const x=20+i*215;c.fillStyle='#d7caab';c.font='14px sans-serif';c.fillText('Height '+jumpHeight,x,52);c.drawImage(plain,142,0,100,800,x,60,100,800);c.drawImage(lit,142,0,100,800,x+100,60,100,800);});
  return {report:{cases:rows.length,errors,rows,ambientNotDoubled:true,carriedLightHeight:ownLight.height},png:sheet.toDataURL().split(',')[1]};
 })()`);
 fs.writeFileSync(path.join(out,'jump-lighting-report.json'),JSON.stringify(result.report,null,2));fs.writeFileSync(path.join(out,'jump-lighting.png'),Buffer.from(result.png,'base64'));
 console.log(JSON.stringify({cases:result.report.cases,errors:result.report.errors,ambientNotDoubled:result.report.ambientNotDoubled,carriedLightHeight:result.report.carriedLightHeight}));app.exit(result.report.errors.length?1:0);
}).catch(e=>{console.error(e);app.exit(1);});
