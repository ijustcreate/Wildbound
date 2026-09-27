const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output/gear-wolves-profile'));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1440,height:1050,webPreferences:{offscreen:true}});try{
 await w.loadFile(path.join(root,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await w.webContents.executeJavaScript(`(async()=>{
  const {RigStudio}=await import('./src/player-studio.mjs'),{drawWolf}=await import('./src/wolf-motion.mjs'),{directionVector}=await import('./src/player-motion.mjs'),{ITEMS}=await import('./src/items.mjs');
  document.body.innerHTML='<div id="qa" style="height:740px;overflow:auto"></div><canvas id="wolves" width="1400" height="260"></canvas>';
  const studio=new RigStudio(()=>{});studio.gearSlot='chest';studio.previewEquipment={chest:Object.keys(ITEMS).find(k=>ITEMS[k].name==='Hunter coat')||'armor'};studio.mount(document.querySelector('#qa'));
  if(!document.querySelector('[data-slot="chest"] .ps-gear-icon'))throw Error('Missing gear texture');
  const canvas=document.querySelector('#wolves'),c=canvas.getContext('2d');c.fillStyle='#283a42';c.fillRect(0,0,1400,260);c.imageSmoothingEnabled=false;
  for(let i=0;i<8;i++){c.save();c.translate(85+i*170,150);c.scale(3,3);const [faceX,faceY]=directionVector(i);drawWolf(c,{faceX,faceY,moving:true,playerFrame:2,alpha:i===0},0);c.restore();c.fillStyle='#ffffff';c.font='16px sans-serif';c.fillText(['Alpha S','SW','W','NW','N','NE','E','SE'][i],55+i*170,230);}
  const ac=new AudioContext();for(const name of ['howl','snarl','yelp','whimper']){const b=await fetch('assets/sfx/wolf/'+name+'.wav').then(r=>r.arrayBuffer());const decoded=await ac.decodeAudioData(b);if(decoded.duration<.3)throw Error('Bad sound');}await ac.close();
  return 'Gear slot icon, studio rendering, eight wolf directions and four audio assets verified';
 })()`);console.log(result);fs.writeFileSync(path.join(root,'test-output/gear-wolves.png'),(await w.webContents.capturePage()).toPNG());app.exit(0);
 }catch(e){console.error(e);app.exit(1);}});
