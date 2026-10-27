const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
app.setPath('userData',fs.mkdtempSync(path.join(root,'test-output','native-package-')));
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false});win.webContents.setAudioMuted(true);
 await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
  const {playerMotion,drawPlayer}=await import('./src/player-motion.mjs');
  const {oathlessCaptainMotion}=await import('./src/oathless-captain-motion.mjs');
  const {villagerMotion}=await import('./src/villager-motion.mjs');
  const {captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
  if(playerMotion.nativeHumanoidRevision!==1)throw Error('Packaged native player migration did not load');
  for(const action of Object.keys(playerMotion.clips))for(const model of [oathlessCaptainMotion,villagerMotion])if(!model.clips[action])throw Error('Missing packaged action '+action);
  const c=document.createElement('canvas').getContext('2d');c.canvas.width=c.canvas.height=192;
  captureLayers(playerMotion);try{drawPlayer(c,{faceX:0,faceY:1,hp:100,equipment:{hand1:'critter_net',head:'ranger_hood'},inventory:[]},0,playerMotion);}finally{releaseLayers(playerMotion);}
  const layers=capturedLayers(playerMotion,0);if(!layers.some(l=>l.id==='Body and pelvis'&&l.sprite.pixels.some(Boolean)))throw Error('Native body sprite capture is empty');
  return {nativePlayer:playerMotion.nativeHumanoidRevision,playerActions:Object.keys(playerMotion.clips).length,captainActions:Object.keys(oathlessCaptainMotion.clips).length,villagerActions:Object.keys(villagerMotion.clips).length,capturedLayers:layers.length};
 })()`);
 console.log(JSON.stringify(result));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
