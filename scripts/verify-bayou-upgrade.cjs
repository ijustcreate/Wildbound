const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/bayou-upgrade',process.env.BAYOU_STAGE||'after');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:820,webPreferences:{backgroundThrottling:false}}),errors=[];win.webContents.setAudioMuted(true);
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await win.loadFile(path.join(process.env.WILDBOUND_APP_ROOT||root,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;await new Promise(raf);
   const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs');
   const {enterWildLands}=await import('./src/wild-lands.mjs');
   const {nativeWildProps}=await import('./src/wild-native-biomes.mjs');
   const {WILD_LANDS_GATES,WILD_LANDS_EXIT}=await import('./src/wild-lands-world.mjs');
   const {tickTrainTest,trainPrompt}=await import('./src/train-test.mjs');
   const assets=new Assets();await assets.load();const canvas=document.createElement('canvas');canvas.style.cssText='width:1280px;height:800px';document.body.append(canvas);
   const r=new Renderer(canvas,assets),g=new Game(()=>.5,{deferWorld:true});g.seed=75;g.environment='swamp';const p=g.addPlayer('keyboard','Bayou review');g.start();g.openingBoard=false;g.bloom=3;g.time=30;g.weather=null;g.spriteLibrary=assets.library;g.explored=new Set();for(let y=0;y<50;y++)for(let x=0;x<50;x++)g.explored.add(x+','+y);
   const images={},checks=[],capture=(label,x,y,zoom=1.2,night=false)=>{Object.assign(p,{x,y:label.startsWith('shrine')?y+85:y,hp:100});g.sky.elapsed=night?320:100;r.camera={x,y,zoom};r.draw(g,0);images[label]=canvas.toDataURL();};
   capture('arrival',800,800);capture('channel',1160,670);capture('outer-islands',520,430);capture('night',1160,670,1.2,true);capture('overview',800,800,.72);
   const landmark=g.scenery.find(s=>s.kind==='bayou_shrine');if(landmark){capture('shrine',landmark.x,landmark.rootY-30,1.1);capture('shrine-night',landmark.x,landmark.rootY-30,1.1,true);}
   const bridge=g.terrain.findIndex(t=>t==='bridge');if(bridge>=0)capture('crossing',bridge%50*32+16,Math.floor(bridge/50)*32+16,1.2);
   const sampleTime=g.time;capture('motion-a',1160,670);g.time=sampleTime+1.1;capture('motion-b',1160,670);checks.push({name:'rendered live bayou views',passed:true});
   checks.push({name:'tree variants',passed:g.scenery.filter(s=>s.treeVariantSeed!==undefined).length>5});
   checks.push({name:'landmarks',passed:g.scenery.some(s=>s.kind==='bayou_shrine')});
   for(const s of g.scenery.filter(s=>s.kind.startsWith('bayou_')&&s.kind!=='bayou_lily'))checks.push({name:'finite landmark '+s.kind,passed:Number.isFinite(s.x+s.rootY)});
   const check=(name,passed)=>{if(!passed)throw Error(name);checks.push({name,passed:true});};
   Object.assign(p,{x:landmark.x,y:landmark.rootY+36,swimming:false});
   g.moveActor(p,0,-55);
   check('Classic movement reaches the shrine apron and stops at the stone foundation',p.y>=landmark.rootY+7&&p.y<landmark.rootY+18);
   Object.assign(p,{x:landmark.x,y:landmark.rootY-4});
   g.moveActor(p,0,32);
   check('Classic players saved inside the former decorative shrine can back out',p.y>landmark.rootY+10);

   const wild=new Game(()=>.5,{deferWorld:true});
   wild.seed=75;wild.addPlayer('keyboard','Bayou review');wild.start();
   check('Enter the Wild Lands using the normal gameplay entry point',enterWildLands(wild,{persistent:true}).ok);
   wild.spriteLibrary=assets.library;wild.sky.elapsed=100;
   const t=wild.trainTest,explorer=wild.players[0];
   t.streamDisabled=true;t.preparing=false;t.noticeUntil=0;
   const shrine=nativeWildProps(t,{left:11600,top:200,right:12600,bottom:1250}).find(s=>s.kind==='bayou_shrine');
   check('The same shrine appears in the Wild Lands Bayou',shrine);
   Object.assign(explorer,{x:shrine.x,y:shrine.rootY+45,faceY:-1});
   const wildFrame=(name,x,y,zoom=1.35)=>{
    r.cameraOverride={x,y,zoom};r.camera={x,y,zoom};r.draw(wild,0);images[name]=canvas.toDataURL();
   };
   wildFrame('wild-shrine',shrine.x,shrine.rootY-36);
   tickTrainTest(wild,.03,{keyboard:{interact:true}});
   check('The altar has no cave interaction',!t.design.activeRoom&&!/ENTER CAVERNS/.test(trainPrompt(wild,explorer)));
   for(let i=0;i<24;i++)tickTrainTest(wild,.025,{keyboard:{y:-1}});
   check('Wild Lands movement reaches the shrine steps and stops at the art footprint',explorer.y>=shrine.rootY+7&&explorer.y<shrine.rootY+18);
   wildFrame('wild-shrine-threshold',shrine.x,shrine.rootY-36);
   wild.sky.elapsed=320;
   wildFrame('wild-shrine-night',shrine.x,shrine.rootY-36);
   Object.assign(explorer,{x:shrine.x,y:shrine.rootY-4});
   for(let i=0;i<14;i++)tickTrainTest(wild,.025,{keyboard:{y:1}});
   check('Wild Lands players saved inside the former shrine can walk out',explorer.y>shrine.rootY+10);

   const gate=WILD_LANDS_GATES.find(s=>s.id==='caverns');
   Object.assign(explorer,{x:gate.x,y:gate.y+180,faceY:-1});wild.sky.elapsed=100;
   check('The cave prompt begins at the gate approach',!trainPrompt(wild,explorer).includes('ENTER CAVERNS'));
   for(let i=0;i<18;i++)tickTrainTest(wild,.025,{keyboard:{y:-1}});
   check('The normal Interact prompt appears within reach of the cavern gate',trainPrompt(wild,explorer)==='E · ENTER CAVERNS');
   wildFrame('wild-cavern-gate',gate.x,gate.y-32,1);
   tickTrainTest(wild,.03,{keyboard:{interact:true}});
   check('The normal Interact input opens the Wild Lands Caverns',t.design.activeRoom==='caverns'&&explorer.x===8000&&explorer.y===5450);
   for(let i=0;i<20;i++)tickTrainTest(wild,.025,{keyboard:{y:1}});
   check('The interior exit becomes interactable from the approach',explorer.y>WILD_LANDS_EXIT.y-130&&trainPrompt(wild,explorer)==='E · RETURN TO THE WILD LANDS');
   tickTrainTest(wild,.03,{keyboard:{interact:true}});
   check('The cave exit returns the player to a walkable exterior approach',!t.design.activeRoom&&explorer.y===gate.y+180&&!wild.blocked(explorer.x,explorer.y));
   return {images,checks,scenery:g.scenery.length,trees:g.scenery.filter(s=>['old_cypress','mangrove'].includes(s.kind)).length};
  })().catch(error=>({error:error.stack||String(error)}))`);
  if(result.error)throw Error(result.error);
  for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
  const {PNG}=require('pngjs'),a=PNG.sync.read(fs.readFileSync(path.join(out,'motion-a.png'))),b=PNG.sync.read(fs.readFileSync(path.join(out,'motion-b.png')));let changed=0;for(let i=0;i<a.data.length;i+=4)if(a.data[i]!==b.data[i]||a.data[i+1]!==b.data[i+1]||a.data[i+2]!==b.data[i+2])changed++;result.checks.push({name:'live animation changes pixels',passed:changed>100,changedPixels:changed});
  result.errors=errors;result.failed=result.checks.filter(c=>!c.passed).length+errors.length;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));win.destroy();app.exit(process.env.BAYOU_STAGE==='before'?0:result.failed?1:0);
 }catch(e){console.error(e);win.destroy();app.exit(1);}
});
