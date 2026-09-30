const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output','forest-landscape');
fs.mkdirSync(out,{recursive:true});
const packaged=process.argv.includes('--packaged');
const appRoot=packaged?path.join(root,'dist',require('../package.json').version,'Wildbound-win32-x64/resources/app.asar'):root;
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
if(process.argv.includes('--software'))app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1440,height:960});
  const errors=[];win.webContents.on('console-message',(_e,level,message)=>{if(level===3)errors.push(message);});
  try{
    await win.loadFile(path.join(appRoot,'index.html'));
    await win.webContents.executeJavaScript('window.wildboundBoot.ready');
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs'),{Assets}=await import('./src/assets.mjs');
      const {generateWorld}=await import('./src/world.mjs');
      const assets=new Assets();await assets.load();
      const g=new Game();g.seed=42;Object.assign(g,generateWorld(42));g.generatedEnvironment=g.environment='forest';
      g.bloom=3;g.phase='preview';g.openingBoard=false;g.time=20;g.enemies=[];g.weather=null;
      const p=g.addPlayer('keyboard','Pip');Object.assign(p,{x:810,y:890});
      const canvas=document.createElement('canvas');canvas.style.cssText='width:1440px;height:960px';document.body.append(canvas);
      const r=new Renderer(canvas,assets);const images={};
      for(const [name,x,y,zoom] of [['overview',800,800,.29],['clearing',800,816,1.05],['shrine',752,368,1.5],['river',350,785,1.35],['grove',620,550,1.4]]){
        r.camera={x,y,zoom};r.draw(g,0);images[name]=canvas.toDataURL();
      }
      r.camera={x:800,y:816,zoom:1.05};
      r.draw(g,0);const before=canvas.toDataURL();g.time+=1;r.draw(g,0);if(before===canvas.toDataURL())throw Error('Forest animation is static');
      const timings=[];for(let i=0;i<60;i++){g.time+=1/60;const start=performance.now();r.draw(g,0);timings.push(performance.now()-start);}
      const floorTimes=[];const originalFloor=r.floor.bind(r);r.floor=(...args)=>{const start=performance.now();originalFloor(...args);floorTimes.push(performance.now()-start);};
      g.phase='play';for(let i=0;i<30;i++){r.camera={x:800,y:816,zoom:1.05};r.draw(g,1/60);}images.gameplay=canvas.toDataURL();g.phase='preview';
      if(![...r.canopyAlpha.values()].some(a=>a<.5))throw Error('Nearby canopy did not fade for the player');
      const desktop=canvas.toDataURL();canvas.style.width='390px';canvas.style.height='844px';r.camera={x:800,y:816,zoom:1};r.draw(g,0);images.mobile=canvas.toDataURL();
      const data=r.ctx.getImageData(0,0,canvas.width,canvas.height).data;const colors=new Set();for(let i=0;i<data.length;i+=16)colors.add(data[i]+','+data[i+1]+','+data[i+2]);
      if(colors.size<50)throw Error('Blank or underdrawn forest');
      return {images,colors:colors.size,floorMeanMs:floorTimes.reduce((a,b)=>a+b)/floorTimes.length,meanMs:timings.reduce((a,b)=>a+b)/timings.length,p95Ms:timings.sort((a,b)=>a-b)[56],trees:g.scenery.filter(p=>p.kind==='tree').length,ruins:g.scenery.filter(p=>p.kind==='forest_ruin').length};
    })()`);
    for(const [name,data] of Object.entries(result.images))fs.writeFileSync(path.join(out,(packaged?'packaged-':'')+name+'.png'),Buffer.from(data.split(',')[1],'base64'));
    delete result.images;if(errors.length)throw Error(errors.join('\n'));
    fs.writeFileSync(path.join(out,(packaged?'packaged-':'')+'results.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify(result));app.exit(0);
  }catch(error){console.error(error);app.exit(1);}
});
