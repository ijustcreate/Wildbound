const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','headwear-capes');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false});win.webContents.setAudioMuted(true);await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
  const {playerMotion,drawPlayer,directionVector,playerPose,projectPoint}=await import('./src/player-motion.mjs');
  const {ITEMS}=await import('./src/items.mjs');
  const {DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');
  const {captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
  const {Animator}=await import('./src/animation.mjs');
  const hats=Object.keys(ITEMS).filter(id=>ITEMS[id].slot==='head'),capes=Object.keys(ITEMS).filter(id=>ITEMS[id].slot==='cape');
  const errors=[],sheets=[];let renders=0,maxTilt=0;
  for(const action of ['walk','run'])for(let f=0;f<playerMotion.clips[action].length;f+=.5)for(let d=0;d<8;d++){
   const p=playerPose({hp:100,equipment:{},animationAction:action,playerFrame:f},0,playerMotion),a=projectPoint(p.head,d),b=projectPoint(p.chest,d);maxTilt=Math.max(maxTilt,Math.abs(Math.atan2(a.x-b.x,b.y-a.y))*180/Math.PI);
  }
  if(playerMotion.headBalanceRevision!==1||maxTilt>7)errors.push({problem:'Default locomotion still dips the head',maxTilt,revision:playerMotion.headBalanceRevision});
  const look={...DEFAULT_APPEARANCE,shirt:'#3e756c',pants:'#38455e'};
  for(let start=0;start<hats.length;start+=5){
   const batch=hats.slice(start,start+5),canvas=document.createElement('canvas');canvas.width=1120;canvas.height=batch.length*185+55;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#172e2b';c.fillRect(0,0,1120,canvas.height);c.fillStyle='#e8d8af';c.font='bold 20px sans-serif';c.fillText('WILDBOUND / HEADWEAR TURNAROUNDS + RUNNING FIT',20,30);
   batch.forEach((id,i)=>{const y=65+i*185;c.fillStyle='#d0c29f';c.font='14px sans-serif';c.fillText(ITEMS[id].name+' / '+id,20,y);
    for(let d=0;d<8;d++){const [faceX,faceY]=directionVector(d),actor={faceX,faceY,hp:100,appearance:look,inventory:[],equipment:{head:id,cape:'cape'}};
     for(const [action,x,scale]of [['idle',65+d*138,3],['run',111+d*138,1]]){c.save();c.translate(x,y+145);c.scale(scale,scale);drawPlayer(c,{...actor,animationAction:action,playerFrame:2,moving:action==='run'},.2,playerMotion);c.restore();renders++;}
    }
   });sheets.push({name:'headwear-'+start/5,png:canvas.toDataURL().split(',')[1]});
  }
  const canvas=document.createElement('canvas');canvas.width=1120;canvas.height=1050;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#172e2b';c.fillRect(0,0,1120,1050);c.fillStyle='#e8d8af';c.font='bold 20px sans-serif';c.fillText('CAPE MOTION / IDLE · WALK · RUN · RISE · FALL',20,30);
  const states=[{label:'Idle',animationAction:'idle'},{label:'Walk / gentle lift',animationAction:'walk',moving:true,walking:true},{label:'Run / trailing hem',animationAction:'run',moving:true},{label:'Jump / ascending drag',animationAction:'jump_air',moving:true,jumpHeight:30,jumpVelocity:100},{label:'Jump / falling lag',animationAction:'jump_air',moving:true,jumpHeight:30,jumpVelocity:-140}];
  states.forEach((state,i)=>{const y=72+i*190;c.fillStyle='#d0c29f';c.font='14px sans-serif';c.fillText(state.label,20,y);for(let d=0;d<8;d++){const [faceX,faceY]=directionVector(d);c.save();c.translate(72+d*138,y+145);c.scale(3,3);drawPlayer(c,{...state,hp:100,faceX,faceY,appearance:look,inventory:[],equipment:{head:'hat',cape:'cape'},playerFrame:2},.35,playerMotion);c.restore();}});
  sheets.push({name:'cape-states',png:canvas.toDataURL().split(',')[1]});
  // All equipment still renders through all frames of movement/jump/attack.
  const pen=document.createElement('canvas').getContext('2d');pen.canvas.width=pen.canvas.height=256;pen.translate(100,140);
  for(const id of [...hats,...capes])for(let d=0;d<8;d++)for(const action of ['idle','walk','run','jump_air','slash','death'])for(const f of [0,(playerMotion.clips[action].length-1)/2,playerMotion.clips[action].length-1]){
   const [faceX,faceY]=directionVector(d);drawPlayer(pen,{hp:100,faceX,faceY,appearance:look,inventory:[],equipment:{[ITEMS[id].slot]:id},animationAction:action,playerFrame:f,moving:['walk','run'].includes(action)},.2,playerMotion);renders++;
  }
  captureLayers(playerMotion);drawPlayer(pen,{hp:100,faceX:0,faceY:1,appearance:look,inventory:[],equipment:{head:'hat',cape:'cape'}},.2,playerMotion);releaseLayers(playerMotion);
  const layers=capturedLayers(playerMotion,0);for(const id of ['Cape','Head and headwear'])if(!layers.some(p=>p.id===id&&p.sprite.pixels.some(Boolean)))errors.push({problem:'Missing editable layer',id});
  const animator=new Animator(),moving={id:921,kind:'player',x:100,y:100,hp:100,faceX:0,faceY:1,moving:true,equipment:{cape:'cape'},appearance:look,inventory:[]};
  for(let n=0;n<=30;n++){moving.x=100+n*133/60;animator.draw(pen,moving,n/60,48);}
  const driven=animator.capeInertia.samples.get('player:921').motion.vx;
  moving.moving=false;for(let n=31;n<=90;n++)animator.draw(pen,moving,n/60,48);
  const settled=animator.capeInertia.samples.get('player:921').motion.vx;
  if(driven<120||settled>1)errors.push({problem:'Runtime cape failed to follow and settle',driven,settled});
  return {sheets,report:{hats:hats.length,capes:capes.length,renders,maxTilt,headBalanceRevision:playerMotion.headBalanceRevision,capeVelocity:{driven,settled},errors}};
 })()`);
 for(const sheet of result.sheets)fs.writeFileSync(path.join(out,sheet.name+'.png'),Buffer.from(sheet.png,'base64'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result.report,null,2));console.log(JSON.stringify(result.report));app.exit(result.report.errors.length?1:0);
}).catch(e=>{console.error(e);app.exit(1);});
