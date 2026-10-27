const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/forest-landscape');
app.setPath('userData',fs.mkdtempSync(path.join(out,'review-')));
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false});win.webContents.setAudioMuted(true);try{
 await win.loadFile(path.join(root,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const data=await win.webContents.executeJavaScript(`(async()=>{
 const {drawGrassProp}=await import('./src/tall-grass.mjs'),{drawJungleFern}=await import('./src/fern-art.mjs'),{forestDecor,drawForestGround}=await import('./src/forest.mjs');
 const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=330;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 c.fillStyle='#182c26';c.fillRect(0,0,1000,330);c.fillStyle='#e5dec0';c.font='20px sans-serif';c.fillText('Forest vegetation — draft in the native renderer',24,32);
 const g={seed:42,generatedEnvironment:'forest',time:2,scenery:[],terrain:Array(2500).fill('water')};const d=forestDecor(g);d.banks=[{kind:'lily',x:0,y:0,seed:4}];
 const drawLily=ctx=>{ctx.save();ctx.translate(-100,-100);d.banks[0].x=d.banks[0].y=100;drawForestGround(ctx,g);ctx.restore();};
 const entries=[['Grass',ctx=>drawGrassProp(ctx,{kind:'tall_grass',x:0,y:0,rootY:0,size:80,tuftSeed:17},2,'forest')],['Fern',ctx=>drawJungleFern(ctx,{x:0,y:0,seed:1},2)],['Lily pad',drawLily]];
 entries.forEach(([label,paint],i)=>{const x=24+i*326;c.fillStyle=i===2?'#285965':'#839063';c.fillRect(x,75,302,224);c.fillStyle='#e5dec0';c.fillText(label,x,62);c.save();c.translate(x+70,135);paint(c);c.restore();c.save();c.translate(x+151,268);c.scale(3,3);paint(c);c.restore();});
 return canvas.toDataURL();})()`);
 fs.writeFileSync(path.join(out,'vegetation-review.png'),Buffer.from(data.split(',')[1],'base64'));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}});
