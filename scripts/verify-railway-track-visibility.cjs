const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),appDirectory=process.env.WILDBOUND_VERIFY_APP||root;
const out=path.join(root,'test-output','railway-track-visibility');
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-track-qa-')));
app.commandLine.appendSwitch('mute-audio');

app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,width:900,height:650,webPreferences:{backgroundThrottling:false}});
 window.webContents.setAudioMuted(true);
 const rendererErrors=[];
 window.webContents.on('console-message',event=>{if(event.level==='error')rendererErrors.push(event.message);});
 try{
  await window.loadFile(path.join(appDirectory,'index.html'));
  const checks=await window.webContents.executeJavaScript(`(async()=>{
   const {drawRailwayTrack}=await import('./src/train-world-art.mjs');
   const {buildTrainRoute,sampleTrainRoute,railwayWater}=await import('./src/train-track.mjs');
   const {defaultTrainDesign}=await import('./src/train-design.mjs');
   const {wildLandsDesign}=await import('./src/wild-lands.mjs');
   const {railwayBridgeState,resetRailwayBridges}=await import('./src/train-bridges.mjs');
   const {railwayStream,stopRailwayStream,streamImage}=await import('./src/railway-stream.mjs');
   const checks=[],workerJobs=[];
   const assert=(label,value)=>{if(!value)throw Error(label);checks.push(label);};
   const NativeWorker=window.Worker;
   window.Worker=class {
    postMessage(job){workerJobs.push(job.kind);}
    terminate(){}
   };
   function draw(runtime,route,q,overview=false){
    const width=450,height=340,left=Math.round(q.x-width/2),top=Math.round(q.y-height/2);
    const canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const context=canvas.getContext('2d');
    context.translate(-left,-top);
    drawRailwayTrack(context,runtime.design,route,{left,top,right:left+width,bottom:top+height},overview,runtime);
    const pixels=context.getImageData(0,0,width,height).data;
    let painted=0;
    for(let index=3;index<pixels.length;index+=4)if(pixels[index])painted++;
    return {pixels,painted};
   }
   const same=(a,b)=>a.pixels.every((value,index)=>value===b.pixels[index]);
   try{
    for(const [name,design] of [['Woodland Railway',defaultTrainDesign()],['Wild Lands',wildLandsDesign()]]){
     const route=buildTrainRoute(design),runtime={design,route};
     for(const fraction of [.05,.21,.48,.76,.93]){
      const point=sampleTrainRoute(route,route.length*fraction);
      const immediate=draw(runtime,route,point);
      assert(name+' paints on the first frame at '+fraction,immediate.painted>1000);
      assert(name+' paints the same cached pixels at '+fraction,same(immediate,draw(runtime,route,point)));
     }
     const bridgePoints=[];
     for(let distance=24;distance<route.length;distance+=48){
      const point=sampleTrainRoute(route,distance);
      if(railwayWater(design,point.x,point.y))bridgePoints.push(point);
     }
     const point=bridgePoints[Math.floor(bridgePoints.length/2)];
     const intact=draw(runtime,route,point);
     const state=railwayBridgeState(design);
     state.broken.add(route.id+':'+Math.floor(point.s/48));state.revision++;
     assert(name+' shows bridge damage on the first frame',draw(runtime,route,point).painted<intact.painted);
     resetRailwayBridges(design);
     assert(name+' shows bridge repair on the first frame',same(intact,draw(runtime,route,point)));
     assert(name+' overview shows the railway',draw(runtime,route,point,true).painted>1000);
    }
    const design=defaultTrainDesign();
    design.routes.push({...design.routes[0],id:'branch',name:'Branch',nodes:design.routes[0].nodes.slice().reverse()});
    const route=buildTrainRoute(design),branch=buildTrainRoute(design,'branch');
    assert('Secondary branch paints on the first frame',draw({design,route,otherRoutes:[branch]},branch,sampleTrainRoute(branch,500)).painted>1000);
    assert('Track rendering sends no requests to the terrain worker',workerJobs.length===0);
   }finally{
    window.Worker=NativeWorker;
   }
   const design=defaultTrainDesign(),runtime={design,route:buildTrainRoute(design)};
   const stream=railwayStream(runtime),key='forest:1:1:800';
   try{
    streamImage(runtime,'forest',key,{x:1600,y:1600,span:1600,size:800},180);
    const deadline=performance.now()+30000;
    while(!stream.failed&&!stream.ready.has(key)&&performance.now()<deadline)await new Promise(resolve=>setTimeout(resolve,50));
    assert('Terrain worker draws the forest floor before an explicit region request',stream.ready.has(key)&&!stream.failed);
   }finally{
    stopRailwayStream(runtime);
   }
   return checks;
  })()`);
  if(rendererErrors.length)throw Error(rendererErrors.join('\n'));
  const report={checks,rendererErrors};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  app.exit(0);
 }catch(error){
  console.error(error.stack);
  app.exit(1);
 }
});
