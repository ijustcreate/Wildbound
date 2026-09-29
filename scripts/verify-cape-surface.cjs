const {app,BrowserWindow}=require('electron');const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'cloth-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false});await win.loadFile(path.join(root,'index.html'));
 const png=await win.webContents.executeJavaScript(`(async()=>{
 const {drawPlayer,defaultPlayerMotion,directionVector}=await import('./src/player-motion.mjs');
 const {actorContact}=await import('./src/contact-shadow.mjs');const {drawFurniture}=await import('./src/house-render.mjs');
 const cv=document.createElement('canvas');cv.width=960;cv.height=620;const c=cv.getContext('2d');c.fillStyle='#343b3e';c.fillRect(0,0,960,620);c.imageSmoothingEnabled=false;
 for(let row=0;row<2;row++)for(let i=0;i<4;i++){
  const tile=document.createElement('canvas');tile.width=96;tile.height=96;const t=tile.getContext('2d');t.translate(48,64);const [faceX,faceY]=directionVector(row?2:4);
  drawPlayer(t,{faceX,faceY,moving:true,equipment:{cape:'cape'},animationAction:'run',playerFrame:0},i*.15,defaultPlayerMotion());
  c.drawImage(tile,i*240-24,row*180-30,288,288);c.fillStyle='#eee';c.font='13px sans-serif';c.fillText('Run cape · '+(i*.15).toFixed(2)+'s',i*240+40,row*180+165);
 }
 for(let i=0;i<3;i++){
  c.save();c.translate(i*320+70,420);c.scale(2,2);
  const bed={kind:'bed',x:10,y:0,w:80,h:70,surfaceHeight:12};drawFurniture(c,bed);
  const a={x:50,y:40,faceX:0,faceY:1,equipment:{},groundHeight:i===1?12:0,jumpHeight:i===2?32:0};
  const contact=actorContact({house:{furniture:[bed]}},a,43);c.fillStyle='rgba(9,28,22,'+contact.alpha+')';c.beginPath();c.ellipse(contact.x,contact.y,contact.rx,contact.ry,0,0,Math.PI*2);c.fill();
  c.save();c.translate(a.x,a.y-a.groundHeight-a.jumpHeight);c.scale(43/48,43/48);drawPlayer(c,a,0,defaultPlayerMotion());c.restore();c.restore();
  c.fillStyle='#eee';c.font='14px sans-serif';c.fillText(['Floor height (comparison)','Standing on bed','Jumping above bed'][i],i*320+60,600);
 }
 return cv.toDataURL('image/png').split(',')[1];})()`);
 fs.writeFileSync(path.join(out,'cape-and-contact.png'),Buffer.from(png,'base64'));console.log('Rendered cape phases and surface contacts');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
