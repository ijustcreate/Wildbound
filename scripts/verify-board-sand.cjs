const {app,BrowserWindow}=require('electron');const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'sand-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false});await win.loadFile(path.join(root,'index.html'));
const png=await win.webContents.executeJavaScript(`(async()=>{
 const {Renderer}=await import('./src/render.mjs');const {drawSinking}=await import('./src/quicksand.mjs');const {drawPlayer}=await import('./src/player-motion.mjs');const {drawBreath}=await import('./src/swim-render.mjs');
 const cv=document.createElement('canvas');cv.width=960;cv.height=480;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#b79761';c.fillRect(0,0,960,480);
 c.save();c.translate(200,160);c.scale(3,3);c.translate(-800,-800);c.strokeStyle='#977945';for(let x=736;x<=864;x+=32){c.strokeRect(x,736,32,160);c.strokeRect(736,x,160,32);}Renderer.prototype.board.call({age:0},c,{players:[],current:null,roll:null,event:null});c.save();c.translate(800,784);drawPlayer(c,{hp:100,faceX:0,faceY:1,equipment:{}},0);c.restore();c.restore();
 for(let i=0;i<4;i++){c.save();c.translate(130+i*235,410);c.scale(2.5,2.5);const a={hp:100,x:0,y:0,faceX:0,faceY:1,sink:[0,18,32,48][i],equipment:{},breath:12,breathVisible:i===3?1:0};drawSinking(c,a,p=>{c.save();c.translate(p.x,p.y);drawPlayer(c,p,0);c.restore();});drawBreath(c,a);c.restore();c.fillStyle='#312b20';c.font='14px sans-serif';c.fillText(['Surface','Waist deep','Almost under','Fully submerged · AIR'][i],65+i*235,460);}
 return cv.toDataURL('image/png').split(',')[1];})()`);
fs.writeFileSync(path.join(out,'board-sand.png'),Buffer.from(png,'base64'));console.log('Board tabletop and four clipped quicksand depths rendered');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
