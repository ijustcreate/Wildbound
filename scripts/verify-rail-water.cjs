const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const stage=process.env.WILDBOUND_WATER_STAGE||'source';
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-rail-water-')));
app.commandLine.appendSwitch('enable-unsafe-swiftshader');
const deadline=setTimeout(()=>app.exit(2),100000);

async function verify(){
 await window.wildboundBoot.ready;
 const raf=requestAnimationFrame;
 requestAnimationFrame=()=>0;
 await new Promise(raf);
 window.Worker=undefined;
 const load=name=>import('./src/'+name+'.mjs');
 const [{Game},{Assets},{Renderer},{enterWildLands},{trainCars,sampleTrainRoute},{wildLandsSurfaceAt},
  {drawWaterSurface,waterShaderStatus},{tickStationOwls}]=await Promise.all([
  'core','assets','render','wild-lands','train-track','wild-lands-world','water-surface','station-owls',
 ].map(load));
 const tests=[],images={},assert=(condition,label)=>{if(!condition)throw Error(label);tests.push(label);};
 const assets=new Assets();
 await assets.load();
 const g=new Game(()=>.41);
 g.addPlayer('keyboard','River review');
 g.start();
 g.spriteLibrary=assets.library;
 g.persist=()=>{};
 assert(enterWildLands(g).ok,'Wild Lands loads through its native entry');
 const p=g.players[0];
 const t=g.trainTest;
 t.streamDisabled=true;t.preparing=false;t.noticeUntil=0;g.time=12;t.time=12;
 g.enemies=[];g.effects=[];g.sky.elapsed=100;
 const canvas=document.createElement('canvas');
 canvas.style.cssText='width:1024px;height:680px;position:fixed;inset:0';
 document.body.append(canvas);
 const r=new Renderer(canvas,assets);
 const render=(x,y,zoom=1.25)=>{
  r.trainScene=null;r.cameraOverride={x,y,zoom};r.draw(g,.02,{sealCapture:true});
  return r.ctx.getImageData(0,0,canvas.width,canvas.height).data;
 };
 const difference=(a,b)=>{
  let n=0;
  for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>12)n++;
  return n;
 };
 t.distance=12220;t.speed=96;
 const engine=trainCars(t)[0],viewY=engine.y+10;
 Object.assign(p,{x:engine.x-80,y:engine.y+205,swimming:false});
 const reflected=render(engine.x,viewY);
 const water=r.waterInteractions;
 const reflectionStats=structuredClone(water.stats);
 images['rail-reflected']=canvas.toDataURL();
 assert(reflectionStats.mode==='webgl'&&reflectionStats.kinds.train>=1&&reflectionStats.kinds.bridge>=3,
  'Native rail frame includes the train and wet rail bridge in the water shader');
 const original=water.draw;
 water.draw=function(c,g,owner,w,h){return original.call(this,c,g,owner,w,h);};
 water.frame=-1;
 const plain=render(engine.x,viewY);
 const visibleDifference=difference(reflected,plain);
 images['rail-without-donors']=canvas.toDataURL();
 assert(visibleDifference>450,'The reflections change visible river pixels after bridge and train layering');
 water.draw=original;water.frame=-1;
 t.distance+=46;g.time+=.25;t.time+=.25;
 const moved=render(engine.x,viewY);
 assert(trainCars(t)[0].x!==engine.x&&difference(reflected,moved)>visibleDifference,'Native train and reflection update across a moving rail frame');
 images['rail-reflected-moving']=canvas.toDataURL();
 const dry=sampleTrainRoute(t.route,6200);
 t.distance=6200;g.time+=.1;water.frame=-1;render(dry.x,dry.y,1.35);
 assert(!water.stats.kinds?.train&&!water.stats.kinds?.bridge,'Dry rails omit train and bridge donors');

 const swatch=document.createElement('canvas');
 swatch.width=400;swatch.height=360;
 const pen=swatch.getContext('2d');
 pen.translate(-1400,-1420);
 drawWaterSurface(pen,g,1400,1420,400,360,{shallow:false,shoreRipples:false});
 const pixels=pen.getImageData(0,0,400,360).data;
 const measure=(at,vertical)=>{
  let total=0;const size=vertical?360:400;
  for(let i=8;i<size-8;i++){
   const end=(vertical?i*400+at:at*400+i)*4;
   const before=end-(vertical?4:1600);
   for(let band=0;band<3;band++)total+=Math.abs(pixels[end+band]-pixels[before+band]);
  }
  return total/((size-16)*3);
 };
 const verticalSeam=measure(200,true),horizontalSeam=measure(180,false);
 const ordinary=(vertical)=>{
  const changes=Array.from({length:43},(_,i)=>measure(12+i*8,vertical)).sort((a,b)=>a-b);
  return changes[Math.floor(changes.length*.95)];
 };
 const verticalThreshold=ordinary(true),horizontalThreshold=ordinary(false);
 const allFilled=pixels.filter((_,i)=>i%4===3).every(alpha=>alpha===255);
 assert(waterShaderStatus()==='webgl'&&allFilled&&verticalSeam<=verticalThreshold&&horizontalSeam<=horizontalThreshold,
  `Both shader repeat boundaries remain fully opaque and color-continuous (${waterShaderStatus()}, ${allFilled}, ${verticalSeam}, ${horizontalSeam})`);
 images['water-both-wraps']=swatch.toDataURL();
 Object.assign(p,{x:1600,y:9400,swimming:true,moving:false,npcQuests:{snowy_owl:{active:true}},hp:100});
 for(let i=0;i<60;i++)tickStationOwls(g,.05);
 const owl=g.stationOwls[0];
 assert(wildLandsSurfaceAt(t.design,owl.x,owl.y)==='water'&&owl.owlPhase==='fly'&&owl.owlHeight===34,
  'The native companion stays airborne above the ocean');
 g.time+=.1;render(1600,9400,1.29);
 images['ocean-owl']=canvas.toDataURL();
 Object.assign(p,{x:1900,y:5000,swimming:false,moving:false});
 for(let i=0;i<60;i++)tickStationOwls(g,.05);
 assert(owl.owlPhase==='perch'&&owl.owlHeight===0,'The companion can land again on solid ground');
 return {tests,images,reflectionStats,visibleDifference,verticalSeam,horizontalSeam,verticalThreshold,horizontalThreshold};
}

app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,width:1060,height:725,webPreferences:{backgroundThrottling:false}});
 window.webContents.setAudioMuted(true);
 const errors=[];
 window.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await window.loadFile(path.join(base,'index.html'));
  const result=await window.webContents.executeJavaScript(`(${verify.toString()})()`);
  const out=path.join(root,'test-output','rail-water',stage);
  fs.mkdirSync(out,{recursive:true});
  for(const [name,url] of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
  delete result.images;
  const report={...result,errors,muted:window.webContents.isAudioMuted(),base};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  if(errors.length||!report.muted)throw Error('Renderer errors or missing mute');
 }catch(error){console.error(error,errors);process.exitCode=1;}
 finally{clearTimeout(deadline);window.destroy();app.exit(process.exitCode||0);}
});
