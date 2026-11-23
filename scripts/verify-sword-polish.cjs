const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const stage=process.env.SWORD_POLISH_STAGE||'source',out=path.join(root,'test-output/sword-polish',stage);
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-sword-polish-')));
app.commandLine.appendSwitch('mute-audio');app.disableHardwareAcceleration();
const authored=path.join(root,'authored/rigs.json'),rigHash=()=>crypto.createHash('sha256').update(fs.readFileSync(authored)).digest('hex'),beforeRig=rigHash();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1200,height:820,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);
 const errors=[],checks=[],failedRequests=[];w.webContents.session.webRequest.onErrorOccurred(d=>failedRequests.push({url:d.url,error:d.error,resourceType:d.resourceType}));w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});w.webContents.on('render-process-gone',(_e,details)=>errors.push(JSON.stringify(details)));
 try{
  await w.loadFile(path.join(base,'index.html'));
  await w.webContents.executeJavaScript('Promise.race([wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error("Boot timeout")),60000))])');
  const boot=await w.webContents.executeJavaScript('({error:wildboundBoot.error,finished:wildboundBoot.finished})');if(boot.error||!boot.finished)throw Error('Game boot failed: '+JSON.stringify({boot,failedRequests}));
  const result=await w.webContents.executeJavaScript(`(async()=>{
   window.requestAnimationFrame=()=>0;
   const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs');
   const {directionVector,playerPose,playerMotion}=await import('./src/player-motion.mjs'),{paintSwordCharge,swordChargeReach}=await import('./src/sword-feel.mjs');
   const {drawSwordCombatEffect}=await import('./src/sword-charge-art.mjs');
   const checks=window.swordPolishLastChecks=[],images=window.swordPolishLastImages={},ok=(v,m)=>{checks.push({name:m,passed:!!v});if(!v)throw Error(m);};
   const g=new Game(()=>.5),p=g.addPlayer('keyboard','Sword specialist');g.start();
   Object.assign(g,{openingBoard:false,house:null,weather:null,event:null,scenery:[]});g.terrain.fill('grass');g.enemies=[];g.persist=()=>{};g.onSound=()=>{};g.time=20;g.sky.elapsed=100;
   Object.assign(p,{x:620,y:650,faceX:1,faceY:0,equipment:{hand1:'sword',hand2:'shield'},invincible:true});
   const assets=new Assets();await assets.load();g.spriteLibrary=assets.library;
   const canvas=document.createElement('canvas');canvas.style.cssText='display:block;width:1180px;height:760px';const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#152b2d;overflow:hidden';host.append(canvas);document.body.append(host);document.body.style.margin='0';document.body.style.overflow='hidden';const renderer=new Renderer(canvas,assets);renderer.setDynamicShadows(false);
   const seen=new WeakSet(),events=[],states=[];
   const tick=(i={},n=1)=>{for(let k=0;k<n;k++){g.update(.02,{keyboard:i});for(const fx of g.effects)if(fx.swordPolish&&!seen.has(fx)){seen.add(fx);events.push({...fx});}}};
   const hold={attack:true,holdPosition:true,aimX:1};
   const make=(width,height,color)=>{const a=document.createElement('canvas');a.width=width;a.height=height;const c=a.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle=color;c.fillRect(0,0,width,height);return [a,c];};
   const snapshot=(label)=>states.push({label,actor:structuredClone(p),time:g.time,effects:structuredClone(g.effects.filter(f=>f.swordPolish))});
   const world=name=>{renderer.camera={x:710,y:635,zoom:1.8};renderer.draw(g,0);images[name]=canvas.toDataURL();};
   tick(hold,5);snapshot('01 · Draw / 0.10 s');const early=swordChargeReach(p.charge);ok(p.x===620,'early charge anchors the player');
   tick(hold,23);snapshot('02 · Gathering / 0.56 s');
   tick(hold,32);snapshot('03 · Ready / 1.20 s');world('world-full-charge');ok(p.charge===1.2&&p.swordChargePreview.length>early,'full-charge lane reaches its cap');
   ok(events.filter(f=>f.swordPolish==='ready').length===1,'one readiness burst at the full-charge threshold');
   const full=structuredClone(p);
   tick(hold,25);ok(events.filter(f=>f.swordPolish==='ready').length===1,'holding readiness never retriggers the burst');
   g.enemies=[{id:901,kind:'skeleton',x:715,y:650,hp:1000,maxHp:1000,speed:0,damage:0,frozen:0,state:'hunt',cooldown:99}];
   tick({holdPosition:true},1);snapshot('04 · Release / anticipation');ok(!!p.swordDash,'release starts the same charged attack');
   tick({holdPosition:true},7);snapshot('05 · Dash / active blade');world('world-dash');
   tick({holdPosition:true},7);snapshot('06 · Contact / braking');world('world-contact');
   tick({holdPosition:true},4);snapshot('07 · Follow-through');tick({holdPosition:true},12);snapshot('08 · Recovery / settled');
   ok(g.enemies[0].hp<1000,'the actual release damages its lane target');ok(!p.swordDash,'the dash reaches its bounded end');ok(events.some(e=>e.swordPolish==='release')&&events.some(e=>e.swordPolish==='trail')&&events.some(e=>e.swordPolish==='brake'),'release, travel and braking feedback are emitted');
   const [phases,pc]=make(1400,1120,'#152b2d');
   for(let i=0;i<states.length;i++){
    const s=states[i],col=i%2,row=Math.floor(i/2),x=col*700,y=row*280;pc.save();pc.beginPath();pc.rect(x,y,700,280);pc.clip();pc.fillStyle=row%2?'#bead86':'#344d3d';pc.fillRect(x+1,y+1,698,278);pc.fillStyle=row%2?'#393329':'#e7dbc4';pc.font='17px sans-serif';pc.fillText(s.label,x+20,y+28);
    pc.save();pc.translate(x+75,y+210);pc.scale(2.6,2.6);pc.translate(-s.actor.x,-s.actor.y);paintSwordCharge(pc,s.actor,s.time);for(const fx of s.effects)drawSwordCombatEffect(pc,fx);renderer.animator.draw(pc,s.actor,s.time,43);pc.restore();
    // A native-size inset prevents nearest-neighbor enlargement from hiding small-scale issues.
    pc.fillStyle=row%2?'#393329':'#e7dbc4';pc.font='11px sans-serif';pc.fillText('1× world scale',x+570,y+155);pc.save();pc.translate(x+605-s.actor.x,y+218-s.actor.y);renderer.animator.draw(pc,s.actor,s.time,43);pc.restore();pc.restore();
   }
   images['phase-review']=phases.toDataURL();
   const [views,vc]=make(1280,720,'#203a37');
   for(let d=0;d<8;d++){
    const [faceX,faceY]=directionVector(d),actor={...full,id:4000+d,faceX,faceY,locomotionVisualDirection:undefined,locomotionTransition:null,locomotionTurning:null},x=d%4*320,y=Math.floor(d/4)*360;vc.fillStyle=d%2?'#3c5547':'#30483e';vc.fillRect(x+1,y+1,318,358);vc.fillStyle='#e7dbc4';vc.font='16px sans-serif';vc.fillText(['South','Southwest','West','Northwest','North','Northeast','East','Southeast'][d],x+18,y+28);
    vc.save();vc.translate(x+140,y+225);vc.scale(3.8,3.8);vc.translate(-actor.x,-actor.y);renderer.animator.draw(vc,actor,g.time,43);vc.restore();
    vc.save();vc.translate(x+275-actor.x,y+285-actor.y);renderer.animator.draw(vc,actor,g.time,43);vc.restore();
    const pose=playerPose(actor,g.time,playerMotion);ok(Object.values(pose).every(q=>q.every(Number.isFinite)),'finite fitted charge pose in direction '+d);
    let error=0;for(const chain of Object.values(playerMotion.ik||{}))if(chain?.enabled!==false)for(const [a,b]of [[chain.root,chain.mid],[chain.mid,chain.end]])if(pose[a]&&pose[b]){const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));error=Math.max(error,Math.abs(distance(pose[a],pose[b])-distance(playerMotion.joints[a].position,playerMotion.joints[b].position)));}
    ok(error<.05,'charge preserves fitted limb lengths in direction '+d);
   }
   images['eight-directions']=views.toDataURL();
   const flowFrames=[];
   for(const t of [100,100.14]){
    const [a,c]=make(280,250,'#203a37'),actor={...full,id:6000,x:0,y:0,locomotionVisualDirection:undefined,locomotionTransition:null,locomotionTurning:null};
    c.save();c.translate(165,215);c.scale(4,4);renderer.animator.draw(c,actor,t,43);c.restore();flowFrames.push(a);
   }
   const one=flowFrames[0].getContext('2d').getImageData(0,50,155,130).data,two=flowFrames[1].getContext('2d').getImageData(0,50,155,130).data;
   ok(one.some((v,i)=>v!==two[i]),'held blade region animates through the real Animator instead of freezing in idle cache');
   const [flow,fc]=make(560,275,'#203a37');fc.drawImage(flowFrames[0],0,25);fc.drawImage(flowFrames[1],280,25);fc.fillStyle='#e7dbc4';fc.font='15px sans-serif';fc.fillText('Held blade: time 0.00',15,22);fc.fillText('Held blade: time +0.14 s',295,22);images['blade-flow']=flow.toDataURL();
   const [contrast,cc]=make(1300,580,'#152b2d');
   for(let i=0;i<4;i++){
    const bright=i>=2,x=(i%2)*650,y=Math.floor(i/2)*290,actor={...full,id:5000+i,x:620,y:650,charge:i%2?1.2:.55,faceX:1,faceY:0,locomotionVisualDirection:undefined,locomotionTransition:null,locomotionTurning:null,swordPolish:{...full.swordPolish,power:(i%2?1.2:.55)/1.2},swordChargeReadyTime:i%2?full.swordChargeReadyTime:undefined,swordChargePreview:{length:swordChargeReach(i%2?1.2:.55),requested:swordChargeReach(i%2?1.2:.55),blocked:false}};cc.fillStyle=bright?'#caba92':'#23392c';cc.fillRect(x+1,y+1,648,288);cc.fillStyle=bright?'#393329':'#e7dbc4';cc.font='16px sans-serif';cc.fillText((bright?'Bright sand':'Dark grass')+' · '+(i%2?'ready':'gathering'),x+20,y+28);cc.save();cc.translate(x+75,y+205);cc.scale(2.5,2.5);cc.translate(-actor.x,-actor.y);paintSwordCharge(cc,actor,g.time);renderer.animator.draw(cc,actor,g.time,43);cc.restore();
   }
   images['contrast-review']=contrast.toDataURL();
   const originalBlocked=g.blocked.bind(g);g.blocked=(x,y,radius=0,...rest)=>x+radius>=710||originalBlocked(x,y,radius,...rest);Object.assign(p,{x:620,y:650,attack:0,charge:0,previousInput:{},swordChargeAim:false});g.enemies=[];tick(hold,62);ok(p.swordChargePreview.blocked&&p.swordChargePreview.length<180,'actual preview clips to a blocked endpoint');world('world-blocked');
   const [blocked,bc]=make(800,320,'#344d3d');bc.fillStyle='#e7dbc4';bc.font='18px sans-serif';bc.fillText('Obstruction stops the reachable preview',22,30);bc.save();bc.translate(85,245);bc.scale(3,3);bc.translate(-p.x,-p.y);paintSwordCharge(bc,p,g.time);renderer.animator.draw(bc,p,g.time,43);bc.restore();images['blocked-review']=blocked.toDataURL();g.blocked=originalBlocked;
   const q=g.addPlayer('pad:0','Second explorer');Object.assign(q,{x:750,y:745,faceX:-1,faceY:0,equipment:{hand1:'sword'},hp:100,charge:1.2,swordChargeAim:true,swordChargePreview:{length:180,requested:180,blocked:false}});Object.assign(p,{faceX:1,faceY:0});world('two-player-world');
   window.swordPolishRunRider=async()=>{const firstCheck=checks.length,priorImages=new Set(Object.keys(images));
   // The charge cue belongs on the carriage floor, not beneath the train body.
   const {enterTrainTest,leaveTrainTest}=await import('./src/train-test.mjs'),{trainCars,trainWorld}=await import('./src/train-track.mjs'),{trainInterior,defaultTrainDesign}=await import('./src/train-design.mjs'),{swordFloorLift}=await import('./src/sword-charge-state.mjs');
   window.Worker=undefined;const riderDesign=defaultTrainDesign();riderDesign.nativeForest=false;riderDesign.scenery=[];ok(enterTrainTest(g,riderDesign).ok,'charged rider enters the actual railway scene');g.players=g.players.slice(0,1);const rider=g.players[0],t=g.trainTest;
   t.route={points:[{x:1600,y:1800,z:0,s:0},{x:5600,y:1800,z:0,s:4000}],length:4000,id:'sword-review-straight'};t.routeSegments=[{at:-Infinity,route:t.route,offset:0}];t.otherRoutes=[];t.distance=1800;t.preparing=false;t.time=6;t.speed=0;t.throttle=0;t.engine=false;g.enemies=[];
   let car=trainCars(t)[3];rider.trainRide={car:3,x:0,y:0};Object.assign(rider,trainWorld(car,0,0),{equipment:{hand1:'sword'},charge:0,attack:0,previousInput:{},swordChargeAim:false,faceX:1,faceY:0});t.previous=new Map();
   tick(hold,61);ok(rider.swordChargePreview.blocked&&rider.swordChargePreview.length<180,'rider preview clips to the actual end wall');ok(swordFloorLift(rider)>=20,'rider uses the raised carriage floor plane');
   renderer.trainScene=null;const paintRider=()=>{car=trainCars(t)[rider.trainRide.car];if(!renderer.trainScene)renderer.draw(g,0);renderer.camera={x:car.x,y:car.y-20,zoom:1.5};renderer.draw(g,0);};paintRider();images['train-rider-wall']=canvas.toDataURL();
   const scale=2*renderer.camera.zoom,middle={x:rider.x+rider.faceX*rider.swordChargePreview.length*.55,y:rider.y-swordFloorLift(rider)+rider.faceY*rider.swordChargePreview.length*.55};
   const center={x:Math.round(canvas.width/2+(middle.x-renderer.camera.x)*scale),y:Math.round(canvas.height/2+(middle.y-renderer.camera.y)*scale)},box={x:Math.max(0,Math.round(canvas.width/2+(rider.x+30-renderer.camera.x)*scale)),y:Math.max(0,Math.round(canvas.height/2+(rider.y-swordFloorLift(rider)-18-renderer.camera.y)*scale)),w:Math.max(1,Math.round((rider.swordChargePreview.length-20)*scale)),h:Math.round(36*scale)};box.w=Math.min(box.w,canvas.width-box.x);box.h=Math.min(box.h,canvas.height-box.y);const before=canvas.getContext('2d').getImageData(box.x,box.y,box.w,box.h).data;
   const power=rider.charge;rider.charge=0;rider.swordChargeAim=false;paintRider();images['train-rider-without-lane']=canvas.toDataURL();const after=canvas.getContext('2d').getImageData(box.x,box.y,box.w,box.h).data;let changed=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])changed++;
   ok(changed>4,'actual rendered lane pixels are visible above the carriage floor (changed='+changed+',length='+rider.swordChargePreview.length+',lift='+swordFloorLift(rider)+',center='+JSON.stringify(center)+')');rider.charge=power;rider.swordChargeAim=true;
   const oldX=rider.x;t.engine=true;t.throttle=.3;t.speed=40;tick(hold,8);ok(rider.x>oldX+2&&Math.abs(rider.swordChargePreview.x-rider.x)<3,'held rider and preview follow the moving carriage');
   const readyFx=g.effects.find(f=>f.swordPolish==='ready'&&f.owner===rider.id);if(readyFx){
    const sample=document.createElement('canvas');sample.width=120;sample.height=60;const pen=sample.getContext('2d');
    drawSwordCombatEffect(pen,{...readyFx,x:60,y:30});
    ok(!pen.getImageData(0,0,120,60).data.some((v,i)=>i%4===3&&v),'readiness adds no extra ground decal');
   }
   paintRider();images['train-rider-moving']=canvas.toDataURL();
   t.speed=0;t.engine=false;t.throttle=0;car=trainCars(t)[2];const table=trainInterior(t.design,car).find(o=>o.kind==='table');rider.trainRide={car:2,x:table.x,y:15};Object.assign(rider,trainWorld(car,table.x,15),{charge:0,attack:0,previousInput:{},swordChargeAim:false,faceX:0,faceY:-1});t.previous=new Map();
   tick({attack:true,holdPosition:true,aimY:-1},61);ok(rider.swordChargePreview.blocked&&rider.swordChargePreview.length<60,'compartment preview clips at the real tabletop collision');delete t.studentSpeech;paintRider();images['train-rider-table']=canvas.toDataURL();
   leaveTrainTest(g);renderer.trainScene=null;return {checks:checks.slice(firstCheck),images:Object.fromEntries(Object.entries(images).filter(([name])=>!priorImages.has(name)))};};
   window.swordPolishReview={g,p,q,renderer,canvas,checks};
   return {checks,images,events:events.map(({swordPolish,power,duration})=>({kind:swordPolish,power,duration})),phases:states.map(s=>({label:s.label,x:s.actor.x,y:s.actor.y,charge:s.actor.charge,attack:s.actor.attack,phase:s.actor.swordPolish?.phase}))};
  })()`);
  checks.push(...result.checks);for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
  w.setContentSize(660,740);
  const narrow=await w.webContents.executeJavaScript(`(()=>{const {g,p,q,renderer,canvas}=swordPolishReview;canvas.style.width='100vw';canvas.style.height='100vh';renderer.camera={x:680,y:685,zoom:.8};renderer.draw(g,0);return {width:canvas.width,height:canvas.height,overflow:document.documentElement.scrollWidth>innerWidth+1,image:canvas.toDataURL()};})()`);
  fs.writeFileSync(path.join(out,'two-player-narrow.png'),Buffer.from(narrow.image.split(',')[1],'base64'));delete narrow.image;checks.push({name:'two-player small window stays within viewport',passed:!narrow.overflow});
  w.setContentSize(1200,820);
  const rider=await w.webContents.executeJavaScript(`(async()=>{const {canvas}=swordPolishReview;canvas.style.width='1180px';canvas.style.height='760px';return await swordPolishRunRider();})()`);checks.push(...rider.checks);
  for(const [name,data]of Object.entries(rider.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  const afterRig=rigHash();checks.push({name:'shared authored rigs unchanged',passed:beforeRig===afterRig});
  const report={...result,checks,stage,appPath:base,narrow,rigBefore:beforeRig,rigAfter:afterRig,errors,failedRequests,failed:checks.filter(c=>!c.passed).length+errors.length};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({stage,checks:checks.length,failed:report.failed,errors,out}));w.destroy();app.exit(report.failed?1:0);
 }catch(error){try{checks.push(...await w.webContents.executeJavaScript('window.swordPolishLastChecks||[]'));const images=await w.webContents.executeJavaScript('window.swordPolishLastImages||{}');for(const [name,data]of Object.entries(images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));}catch{}const report={stage,appPath:base,checks,failed:1,error:String(error),stack:error.stack,errors,failedRequests};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));try{fs.writeFileSync(path.join(out,'failure.png'),(await w.webContents.capturePage()).toPNG());}catch{}console.error(error);w.destroy();app.exit(1);}
});
