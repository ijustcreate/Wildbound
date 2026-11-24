const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');

const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const output=path.join(root,'test-output','garden-props',base===root?'source':'packaged');
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-garden-props-')));
app.commandLine.appendSwitch('mute-audio');
const deadline=setTimeout(()=>app.exit(1),90000);

app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});
 win.webContents.setAudioMuted(true);
 const errors=[];
 win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await win.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   window.requestAnimationFrame=()=>0;
   window.Worker=undefined;
   const {Game}=await import('./src/core.mjs');
   const {Renderer}=await import('./src/render.mjs');
   const {enterWildLands}=await import('./src/wild-lands.mjs');
   const {alleyGate,alleyBlocked,ALLEY_PATHS}=await import('./src/diagon-alley.mjs');
   const {GARDEN_PATHS}=await import('./src/diagon-garden-layout.mjs');
   const {GARDEN_PROPS,ALLEY_BORDER_PROPS,prepareAlleyGardenProps,alleyGardenPropArtStats,
    alleyGardenPropBlocked,paintAlleyGardenProp}=await import('./src/diagon-garden-props.mjs');
   const checks=[],pictures={},verify=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
   verify(GARDEN_PROPS.length===13&&new Set(GARDEN_PROPS.map(prop=>prop.id)).size===13,'Thirteen distinct fixtures in the garden');
   const assets=wildboundPolishTest.assets,game=new Game(()=>.5),hero=game.addPlayer('keyboard','Garden decorator');
   game.start();game.openingBoard=false;game.spriteLibrary=assets.library;game.persist=()=>{};game.onSound=()=>{};
   verify(enterWildLands(game,{persistent:true}).ok,'Entered the Wilds through gameplay');
   function press(){game.update(.05,{keyboard:{}});game.update(.05,{keyboard:{interact:true}});}
   game.trainTest.preparing=false;
   const gate=alleyGate(game);
   Object.assign(hero,{x:gate.x,y:gate.y+55});hero.equipment.hand1='starter_wand';press();
   for(let i=0;i<16;i++)game.update(.05,{keyboard:{}});
   press();
   verify(game.trainTest.design.activeRoom==='diagon','Operated the existing Diagon Alley gate');
   prepareAlleyGardenProps();
   const stats=alleyGardenPropArtStats();
   verify(stats.recipeCount===18&&stats.animatedCount===10,'Native atlas contains eighteen recipes and ten animation loops');
   verify(stats.rasterPixels>0&&stats.rasterPixels*4<720000,'The atlas stays under 720,000 RGBA bytes');
   const walkable=(x,y)=>ALLEY_PATHS.some(area=>x>area.x&&x<area.x+area.w&&y>area.y&&y<area.y+area.h);
   verify(ALLEY_BORDER_PROPS.filter(prop=>prop.district==='diagon').length===12&&ALLEY_BORDER_PROPS.filter(prop=>prop.district==='nocturne').length===9,
    'New plants and fixtures are distributed along both Alleys');
   for(const prop of [...GARDEN_PROPS,...ALLEY_BORDER_PROPS]){
    verify(walkable(prop.x,prop.y)&&alleyGardenPropBlocked(prop.x,prop.y,0)&&alleyBlocked(game,prop.x,prop.y,0),
     prop.district+' '+prop.id+' has a visible ground anchor and solid base');
   }
   for(const [index,route] of GARDEN_PATHS.entries()){
    let open=true;
    for(let i=1;i<route.points.length;i++){
     const [ax,ay]=route.points[i-1],[bx,by]=route.points[i],steps=Math.ceil(Math.hypot(bx-ax,by-ay)/3);
     for(let j=0;j<=steps;j++){
      const x=ax+(bx-ax)*j/steps,y=ay+(by-ay)*j/steps;
      if(alleyGardenPropBlocked(x,y,7))open=false;
     }
    }
    verify(open,'Garden route '+(index+1)+' has a clear centerline at player radius');
   }
   const canvas=document.createElement('canvas');canvas.style.cssText='width:1200px;height:800px';document.body.append(canvas);
   const renderer=new Renderer(canvas,assets);renderer.dynamicShadows=false;game.trainTest.noticeUntil=0;
   function capture(name,x,y){Object.assign(hero,{x,y});renderer.trainScene=null;renderer.draw(game,.016);pictures[name]=canvas.toDataURL();}
   capture('north-study',7340,3890);capture('garden-approach',7560,4005);capture('southern-garden',7315,4190);
   capture('chime-and-birdbath',7247,3990);capture('armillary-garden',7500,3895);
   capture('avenue-planting',7995,4825);capture('nocturne-planting',9060,5050);
   const stamp=document.createElement('canvas');stamp.width=64;stamp.height=60;const pen=stamp.getContext('2d');
   function silhouette(prop,time){
    pen.clearRect(0,0,64,60);paintAlleyGardenProp(pen,{...prop,x:32,y:54,phase:0},time);
    const data=pen.getImageData(0,0,64,60).data;
    let shaded=0,key=0;
    for(let i=0;i<data.length;i+=4){if(data[i+3])shaded++;key=(Math.imul(key,33)^data[i]^data[i+1]<<8^data[i+2]<<16^data[i+3]<<24)>>>0;}
    return {shaded,key};
   }
   const periods={armillary:640,chimes:840,lectern:1940,coldFrame:1320,birdbath:1060,skep:1040,foxglove:1080,aurelia:1100,terrarium:1120,tea:1180};
   const board=document.createElement('canvas');board.width=1040;board.height=640;
   const ctx=board.getContext('2d');ctx.fillStyle='#475849';ctx.fillRect(0,0,board.width,board.height);
   ctx.imageSmoothingEnabled=false;
   const species=ALLEY_BORDER_PROPS.filter((prop,i,all)=>!GARDEN_PROPS.some(garden=>garden.id===prop.id)&&all.findIndex(other=>other.id===prop.id)===i);
   for(const [i,prop] of [...GARDEN_PROPS,...species].entries()){
    const first=silhouette(prop,.005),cycle=periods[prop.id];
    verify(first.shaded>75,prop.id+' reads at native pixel size');
    if(cycle){
     const alternate=prop.id==='lectern'?1.7:cycle*.00066;
     verify(first.key!==silhouette(prop,alternate).key&&first.key===silhouette(prop,cycle*.001+.005).key,
      prop.id+' changes frames and loops to its opening pose');
    }
    silhouette(prop,prop.id==='lectern'?1.65:.39);
    const x=16+i%6*171,y=16+Math.floor(i/6)*204;
    ctx.fillStyle='#3b4c41';ctx.fillRect(x,y,161,194);
    ctx.drawImage(stamp,x+16,y+3,128,120);
    ctx.fillStyle='#e5dfc3';ctx.font='14px Georgia';ctx.textAlign='center';ctx.fillText(prop.id,x+80,y+155);
   }
   verify(JSON.stringify(stats)===JSON.stringify(alleyGardenPropArtStats()),'Revisiting placements keeps one bounded atlas');
   pictures['prop-review']=board.toDataURL();
   return {checks,pictures,stats};
  })()`);
  for(const [name,png] of Object.entries(result.pictures))fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(png.split(',')[1],'base64'));
  const report={checks:result.checks,stats:result.stats,errors,muted:win.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.checks.length,...report.stats,errors,muted:report.muted}));
  clearTimeout(deadline);app.exit(errors.length||!report.muted?1:0);
 }catch(error){console.error(error.stack,errors);clearTimeout(deadline);app.exit(1);}
});
