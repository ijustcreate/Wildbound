const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'held-art-')));
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});
 await win.loadFile(path.join(root,'index.html'));
 const data=await win.webContents.executeJavaScript(`(async()=>{
  const {drawPlayer,defaultPlayerMotion,directionVector,poseAt}=await import('./src/player-motion.mjs');
  const {ITEMS}=await import('./src/items.mjs');
  const model=defaultPlayerMotion(),cvs=document.createElement('canvas');cvs.width=1152;cvs.height=680;
  const c=cvs.getContext('2d');c.fillStyle='#343b3e';c.fillRect(0,0,cvs.width,cvs.height);c.imageSmoothingEnabled=false;
  const boots=${process.argv.includes('--boots')};
  const sets=boots?Array.from({length:4},()=>({feet:'boots'})):[{hand1:'wand',hand2:'shield'},{hand1:'sword',hand2:'iron_shield'},{hand1:'bow'},{hand1:'rifle'}];
  const relics=Object.keys(ITEMS).filter(id=>ITEMS[id].relic).slice(0,2).map(type=>({type}));
  for(let row=0;row<4;row++)for(let d=0;d<8;d++){
   const tile=document.createElement('canvas');tile.width=96;tile.height=96;const t=tile.getContext('2d');t.translate(48,64);
   const direction=boots?[0,2,4,6][row]:d,frame=boots?d:0;
   const [faceX,faceY]=directionVector(direction),action=boots?'run':'idle';
   drawPlayer(t,{faceX,faceY,equipment:sets[row],inventory:relics,animationAction:action,playerFrame:frame},0,model,poseAt(model,action,frame));
   c.drawImage(tile,d*144-72,row*170-50,288,288);
   c.fillStyle='#dce7db';c.font='12px sans-serif';c.fillText(boots?['S','W','N','E'][row]+' · run '+frame:sets[row].hand1+' · '+['S','SW','W','NW','N','NE','E','SE'][d],d*144+12,row*170+160);
  }
  return cvs.toDataURL('image/png').split(',')[1];
 })()`);
 fs.writeFileSync(path.join(out,process.argv.includes('--boots')?'boot-running-frames.png':'held-equipment-eight-directions.png'),Buffer.from(data,'base64'));
 console.log('Rendered 32 held-equipment views');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
