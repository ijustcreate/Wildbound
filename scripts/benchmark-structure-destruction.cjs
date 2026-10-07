const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output','structure-destruction');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'benchmark-profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,webPreferences:{offscreen:true}});
 try{
  await w.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
  const report=await w.webContents.executeJavaScript(`(async()=>{
   await window.wildboundBoot.ready;window.requestAnimationFrame=()=>0;
   const [{Game},d,{drawExpansion},{drawTemple}]=await Promise.all([import('./src/core.mjs'),import('./src/structure-destruction.mjs'),import('./src/expansion.mjs'),import('./src/temple.mjs')]);
   const result=[];
   for(const environment of ['house','temple']){
    const g=new Game(()=>.3);g.environment=environment;g.addPlayer('keyboard');g.start();g.openingBoard=false;
    const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=900;const c=canvas.getContext('2d');
    const measure=()=>{const times=[];for(let n=0;n<132;n++){const t=performance.now();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,1280,900);c.setTransform(.52,0,0,.52,224,34);
     drawExpansion(c,g);drawTemple(c,g);d.drawDestruction(c,g);c.getImageData(0,0,1,1);if(n>11)times.push(performance.now()-t);}
     times.sort((a,b)=>a-b);return {meanMs:times.reduce((a,b)=>a+b,0)/times.length,p95Ms:times[Math.floor(times.length*.95)]};};
    const intact=measure();
    for(let n=0;n<20;n++){const from={x:250,y:480+n*32};d.stampedeDestruction(g,{kind:'rhino',x:1200,y:from.y},from);}
    const brokenWithMaxDebris=measure();result.push({environment,intact,brokenWithMaxDebris,...d.destructionStats(g)});
   }
   return {softwareRendering:true,wholeMapZoom:.52,framesPerCase:120,cases:result};
  })()`);
  fs.writeFileSync(path.join(out,'render-overhead.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
