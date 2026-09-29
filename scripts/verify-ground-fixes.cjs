const {app,BrowserWindow}=require('electron');const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'ground-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false});await win.loadFile(path.join(root,'index.html'));
 const png=await win.webContents.executeJavaScript(`(async()=>{
 const {Assets}=await import('./src/assets.mjs');const {Animator}=await import('./src/animation.mjs');const {rigSubject}=await import('./src/rig-subjects.mjs');const {drawCorpse}=await import('./src/corpse-pose.mjs');const {drawEmbeddedArrow}=await import('./src/embedded-arrow.mjs');
 const assets=new Assets();await assets.load();const animator=new Animator(assets);const cv=document.createElement('canvas');cv.width=1000;cv.height=540;const c=cv.getContext('2d');c.fillStyle='#43534a';c.fillRect(0,0,1000,540);c.imageSmoothingEnabled=false;
 for(let i=0;i<6;i++){const kind=['lion','tiger','skeleton','wolf','monkey','bat'][i];c.save();c.translate((i%3)*330+150,Math.floor(i/3)*170+100);c.scale(2.4,2.4);const a={kind,hp:0,faceX:.7,faceY:.7,deathTimer:.6,jumpHeight:20};
 c.fillStyle='#203327';c.beginPath();c.ellipse(0,0,25,4,0,0,Math.PI*2);c.fill();drawCorpse(c,a,rigSubject(kind)?.data,{x:0,y:0},48,(actor,time,size)=>animator.draw(c,actor,time,size));c.restore();c.fillStyle='#fff';c.font='16px sans-serif';c.fillText(kind,(i%3)*330+110,Math.floor(i/3)*170+145);}
 c.save();c.translate(50,440);c.scale(3,3);for(let i=0;i<8;i++)drawEmbeddedArrow(c,{x:i*38,y:0,angle:i*Math.PI/4,embedDepth:7});c.restore();c.fillStyle='#fff';c.fillText('Embedded arrows: tip at ground, fletching above',50,495);
 return cv.toDataURL('image/png').split(',')[1];})()`);
 fs.writeFileSync(path.join(out,'ground-fixes.png'),Buffer.from(png,'base64'));console.log('Rendered six corpse types and eight arrow headings.');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
