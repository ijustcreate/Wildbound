const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const output=path.join(root,'test-output','railway-startup-visibility',base===root?'source':'packaged');
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-railway-startup-')));
app.commandLine.appendSwitch('mute-audio');

app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,width:1120,height:750,webPreferences:{backgroundThrottling:false}});
 window.webContents.setAudioMuted(true);
 const errors=[];
 window.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await window.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await window.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await window.webContents.executeJavaScript(`(async()=>{
   window.requestAnimationFrame=()=>0;
   const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs');
   const {enterTrainTest}=await import('./src/train-test.mjs'),{enterWildLands}=await import('./src/wild-lands.mjs');
   const {stopRailwayStream}=await import('./src/railway-stream.mjs');
   const assets=wildboundPolishTest.assets;
   const checks=[],pictures={},frames=[];
   const check=(label,pass)=>{if(!pass)throw Error(label);checks.push(label);};
   const nativeWorker=window.Worker;
   const jobs=[];
   window.Worker=class {
    postMessage(message){jobs.push(message);}
    terminate(){}
   };
   try{
    for(const [name,enter] of [['railway',enterTrainTest],['wilds',enterWildLands]]){
     const game=new Game(()=>.5,{deferWorld:true});
     game.addPlayer('keyboard','Startup probe');
     game.start();
     game.spriteLibrary=assets.library;
     const entered=enter(game);
     check(name+' opens through its native entry',entered.ok);
     const runtime=game.trainTest;
     runtime.noticeUntil=0;
     const canvas=document.createElement('canvas');
     canvas.style.cssText='position:fixed;inset:0;width:960px;height:620px';
     document.body.append(canvas);
     const renderer=new Renderer(canvas,assets);
     const before=performance.now();
     renderer.draw(game,0);
     const cpuMs=performance.now()-before;
     const context=renderer.ctx;
     const width=canvas.width,height=canvas.height;
     const {data}=context.getImageData(width*.1,height*.12,width*.8,height*.65);
     const colors=new Set();
     for(let index=0;index<data.length;index+=64)colors.add(data[index]+','+data[index+1]+','+data[index+2]);
     check(name+' displays native actors and ground in the first frame while the worker is waiting',colors.size>14&&runtime.streamCoverage.groundReady&&runtime.streamCoverage.groundPending>0);
     check(name+' leaves player movement gated until local collision is available',runtime.preparing&&runtime.time===0);
     check(name+' queues local collision before optional detail',jobs.find(job=>job.kind!=='init')?.kind==='region');
     check(name+' skips the grass shader during the cold frame',!renderer.railwayGrass&&!runtime.shaderGrass);
     frames.push({name,cpuMs,colors:colors.size,groundPending:runtime.streamCoverage.groundPending,costs:runtime.drawCosts});
     pictures[name]=canvas.toDataURL();
     stopRailwayStream(runtime);
     canvas.remove();
     jobs.length=0;
    }
   }finally{
    window.Worker=nativeWorker;
   }
   return {checks,pictures,frames};
  })()`);
  for(const [name,image] of Object.entries(result.pictures))fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(image.split(',')[1],'base64'));
  const report={checks:result.checks,frames:result.frames,errors,muted:window.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  app.exit(errors.length||!report.muted?1:0);
 }catch(error){console.error(error.stack,errors);app.exit(1);}
});
