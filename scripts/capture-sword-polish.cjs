const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const out=path.join(root,'test-output/sword-polish/motion');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-sword-motion-')));app.commandLine.appendSwitch('mute-audio');app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:740,height:460,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);
 const errors=[],requests=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});w.webContents.session.webRequest.onErrorOccurred(d=>requests.push({url:d.url,error:d.error}));
 try{
  await w.loadFile(path.join(base,'index.html'));
  await w.webContents.executeJavaScript('Promise.race([wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error("Boot timeout")),30000))])');
  const boot=await w.webContents.executeJavaScript('({error:wildboundBoot.error,finished:wildboundBoot.finished})');if(boot.error||!boot.finished)throw Error(JSON.stringify(boot));
  const result=await w.webContents.executeJavaScript(`(async()=>{
   window.requestAnimationFrame=()=>0;
   const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs');
   const g=new Game(()=>.5),p=g.addPlayer('keyboard','');g.start();Object.assign(g,{openingBoard:false,house:null,weather:null,event:null,scenery:[],loot:[],portals:[],ghosts:[],villageFollowers:[]});g.terrain.fill('grass');g.persist=()=>{};g.onSound=()=>{};g.time=20;g.sky.elapsed=100;
   g.forestLandscape={seed:42,routes:[],landmarks:[],cover:[],routeField:new Float32Array(10000).fill(200),paving:{cells:Array(576).fill(0)}};
   g.playground={key:g.seed+':'+(g.generatedEnvironment||g.environment),version:1,props:[],apples:[],frogs:[],coins:[],serial:0};
   Object.assign(p,{x:400,y:400,faceX:1,faceY:0,equipment:{hand1:'sword',hand2:'shield'},invincible:true});
   g.enemies=[{id:9901,kind:'skeleton',x:530,y:397,hp:1000,maxHp:1000,speed:0,damage:0,state:'hunt',cooldown:99}];
   const assets=new Assets();await assets.load();g.spriteLibrary=assets.library;
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#1d342b;overflow:hidden';const scene=document.createElement('canvas');scene.style.cssText='display:block;width:720px;height:600px';host.append(scene);const canvas=document.createElement('canvas');canvas.width=720;canvas.height=420;document.body.append(host);document.body.style.margin='0';document.body.style.overflow='hidden';
   const r=new Renderer(scene,assets);r.setDynamicShadows(false);r.minimap=()=>{};
   const camera={x:485,y:415,zoom:1.25};const render=()=>{r.camera={...camera};r.draw(g,0);const c=canvas.getContext('2d');c.clearRect(0,0,720,420);c.drawImage(scene,0,0,720,420,0,0,720,420);};for(let i=0;i<4;i++)render();
   let recorder=null,stream=null,mime=null,recorded=null,chunks=[];
   if(typeof MediaRecorder!=='undefined'&&canvas.captureStream){
    mime=['video/webm;codecs=vp8','video/webm;codecs=vp9','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
    if(mime){stream=canvas.captureStream(0);recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1800000});recorded=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=resolve;recorder.onerror=e=>reject(Error(e.error?.message||'MediaRecorder error'));});recorder.start(200);}
   }
   const frames=[],states=[],seen=new WeakSet(),events=[],started=performance.now();let maxCharge=0;
   for(let frame=0;frame<42;frame++){
    const began=performance.now(),charging=frame<24,input=charging?{attack:true,holdPosition:true,aimX:1}:{holdPosition:true,aimX:1};g.update(.05,{keyboard:input});maxCharge=Math.max(maxCharge,p.charge||0);render();
    const c=canvas.getContext('2d');c.save();c.setTransform(1,0,0,1,0,0);c.fillStyle='#f5e6c4';c.font='14px sans-serif';c.textAlign='left';c.textBaseline='alphabetic';c.fillText(frame<24?'CHARGE  ·  '+Math.min(100,Math.round(p.charge/1.2*100))+'%':p.swordDash?'DASH & SWIPE':p.attack>0?'FOLLOW-THROUGH':'RECOVERY',18,26);c.restore();
    frames.push(canvas.toDataURL('image/png'));states.push({frame,time:g.time,x:p.x,charge:p.charge,attack:p.attack,phase:p.swordPolish?.phase});
    for(const fx of g.effects)if(fx.swordPolish&&!seen.has(fx)){seen.add(fx);events.push(fx.swordPolish);}
    stream?.getVideoTracks()[0]?.requestFrame?.();await new Promise(resolve=>setTimeout(resolve,Math.max(1,50-(performance.now()-began))));
   }
   const wallDurationMs=performance.now()-started;let video=null;
   if(recorder){recorder.stop();await recorded;const bytes=new Uint8Array(await new Blob(chunks,{type:mime}).arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));video=btoa(binary);stream.getTracks().forEach(t=>t.stop());}
   if(maxCharge<1.2||!events.includes('release')||!events.includes('brake')||!events.includes('impact'))throw Error('Capture missed a required phase: '+JSON.stringify({maxCharge,events}));
   return {frames,states,events,video,mime,width:canvas.width,height:canvas.height,frameRate:20,simulationDuration:42*.05,wallDurationMs,maxCharge,endpoint:p.x,targetHp:g.enemies[0].hp};
  })()`);
  for(let i=0;i<result.frames.length;i++)fs.writeFileSync(path.join(out,'frame-'+String(i).padStart(4,'0')+'.png'),Buffer.from(result.frames[i].split(',')[1],'base64'));
  delete result.frames;if(result.video)fs.writeFileSync(path.join(out,'sword-charge-dash.webm'),Buffer.from(result.video,'base64'));delete result.video;
  let gif=null;
  try{
   const encode=require('node:child_process').spawnSync('python',['-c',
    'from pathlib import Path\nfrom PIL import Image\nimport sys\np=Path(sys.argv[1])\nframes=[Image.open(f).convert("RGB") for f in sorted(p.glob("frame-*.png"))]\nmaster=Image.new("RGB",(720,420*7))\nfor row,i in enumerate([0,10,23,27,30,34,41]):master.paste(frames[i],(0,row*420))\npalette=master.quantize(colors=256)\nquantized=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]\nquantized[0].save(p/"sword-charge-dash.gif",save_all=True,append_images=quantized[1:],duration=50,loop=0,optimize=False,disposal=2)\n',out],{encoding:'utf8',timeout:30000});
   if(encode.status===0)gif={file:'sword-charge-dash.gif',frameRate:20,loop:true,encoder:'preinstalled Pillow',palette:'shared 256-color palette; no dithering'};
  }catch{}
  const report={...result,gif,appPath:base,errors,failedRequests:requests,failed:errors.length};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({frames:result.states.length,mime:result.mime,width:result.width,height:result.height,simulationDuration:result.simulationDuration,wallDurationMs:result.wallDurationMs,gif,failed:report.failed,out}));w.destroy();app.exit(report.failed?1:0);
 }catch(error){fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({failed:1,error:String(error),stack:error.stack,errors,failedRequests:requests},null,2));console.error(error);w.destroy();app.exit(1);}
});
