const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename,'--mute-audio'],{cwd:root,env,encoding:'utf8',timeout:360000});process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');process.exit(result.status??1);}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output/train-layer-matrix',process.env.WILDBOUND_MATRIX_STAGE||(process.env.WILDBOUND_VERIFY_APP?'packaged':'before'));fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'isolated-profile'));app.commandLine.appendSwitch('mute-audio');const deadline=setTimeout(()=>app.exit(1),350000);
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}}),errors=[];win.webContents.setAudioMuted(true);win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});try{
 await win.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));await win.webContents.executeJavaScript('wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{try{
 window.requestAnimationFrame=()=>0;window.Worker=undefined;
 const {DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');
 const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs');
 const {enterTrainTest}=await import('./src/train-test.mjs'),{trainCars,trainWorld,trainRiderWorld}=await import('./src/train-track.mjs');
 const {defaultTrainDesign,trainInterior,trainSideDoorSpans}=await import('./src/train-design.mjs');
 const assets=new Assets();await assets.load();const checks=[],images={},states=['walk','seated','raised','doors-closed','doors-open','roof-fade','roof-closed'];
 const canvas=document.createElement('canvas');canvas.style.cssText='width:1000px;height:700px';canvas.width=1000;canvas.height=700;document.body.replaceChildren(canvas);const renderer=new Renderer(canvas,assets);renderer.splitChild=true;renderer.ctx.fillText=()=>{};renderer.ctx.strokeText=()=>{};
 const colors=['#38b9ce','#e2b65b','#d5769b','#75ad67'];
 function seatRide(c,o){return {car:c.index,x:o.x,y:o.y,seat:c.id+':'+o.id,facing:(o.facing||0)*Math.PI/2};}
 function cases(c,objects,mode){
  const tables=objects.filter(o=>o.kind==='table'),seats=objects.filter(o=>o.kind==='seat'),doors=objects.filter(o=>o.kind==='door'),L=c.length,W=c.width;
  let positions=c.kind==='engine'?[[-105,-30],[-105,30],[-55,-28],[-55,28]]:c.kind==='tender'?[[-41,-34],[41,-34],[-41,34],[41,34]]:c.kind==='compartments'?tables.map(o=>[o.x,12]):c.kind==='seats'?[[-100,0],[-35,0],[35,0],[100,0]]:[[8,-25],[65,-25],[15,28],[70,28]];
  let out=positions.map(([x,y])=>({ride:{car:c.index,x,y},height:0,ground:0}));
  if(mode==='seated'){
   if(seats.length){const chosen=c.kind==='compartments'?seats.slice(-4):c.kind==='seats'?[seats[2],seats[3],seats[8],seats[9]]:seats;chosen.slice(0,4).forEach((o,i)=>out[i]={ride:seatRide(c,o),height:0,ground:0});}
   else if(c.kind==='engine')out[0].ride.driving=true;
   else out[3].ride={car:c.index,x:-L/2+14,y:0,gangway:{to:c.index+1,direction:-1,progress:.5}};
  }
  if(mode==='raised'){
   if(tables.length){out[0]={ride:{car:c.index,x:tables[0].x,y:tables[0].y},height:0,ground:14};out[1]={ride:{car:c.index,x:(tables[1]||tables[0]).x,y:(tables[1]||tables[0]).y+5},height:28,ground:0};}
   if(c.kind==='seats'){out[0]={ride: {car:c.index,x:seats[2].x,y:seats[2].y+5},height:0,ground:8};out[1]={ride:{car:c.index,x:seats[3].x,y:seats[3].y+8},height:0,ground:19};}
   out[2].height=35;out[3].height=60;
  }
  if(mode.startsWith('doors')){
   out[0]={outside:{x:-L*.2,y:-W/2-16},height:0,ground:0};out[1]={outside:{x:L*.2,y:W/2+16},height:0,ground:0};
   if(doors.length){const o=doors[2]||doors[0];out[2]={ride:{car:c.index,x:o.x,y:o.y-12},height:0,ground:0};out[3]={ride:{car:c.index,x:o.x,y:o.y+12},height:0,ground:0};}
   else {const span=trainSideDoorSpans(c)[0]||{min:-L/2+8,max:-L/2+20},x=(span.min+span.max)/2;out[2]={ride:{car:c.index,x,y:-W/2+12},height:0,ground:0};out[3]={ride:{car:c.index,x,y:W/2-12},height:32,ground:0};}
  }
  return out;
 }
 for(let carIndex=0;carIndex<5;carIndex++){
  const sheets=states.map(()=>{const a=document.createElement('canvas');a.width=1000;a.height=1400;return {canvas:a,c:a.getContext('2d')};});let kind;
  for(let view=0;view<8;view++){
   const g=new Game(()=>.5);for(let i=0;i<4;i++)g.addPlayer(i?'pad:'+i:'keyboard','P'+(i+1));g.start();g.openingBoard=false;g.onSound=()=>{};g.persist=()=>{};g.spriteLibrary=assets.library;
   const design=defaultTrainDesign();design.nativeForest=false;design.scenery=[];if(!enterTrainTest(g,design).ok)throw Error('enter railway');
   const t=g.trainTest,a=view*Math.PI/4,ca=Math.cos(a),sa=Math.sin(a);t.route={points:[{x:2000-ca*10000,y:2000-sa*10000,z:0,s:0},{x:2000+ca*10000,y:2000+sa*10000,z:0,s:20000}],length:20000,id:'matrix'};t.routeSegments=[{at:-Infinity,route:t.route,offset:0}];t.otherRoutes=[];t.distance=11000;t.preparing=false;t.time=6;g.enemies=[];g.weather=null;g.event=null;g.effects=[];g.sky.elapsed=100;t.design.river.x=100000;
   const cs=trainCars(t),car=cs[carIndex],objects=trainInterior(design,car);kind=car.kind;for(const c of cs)t.roof[c.id]=0;
   if(carIndex>=2)t.conductor={car:carIndex,x:0,y:car.kind==='compartments'?37:0,faceX:ca,faceY:sa,step:0,moving:false};
   for(let si=0;si<states.length;si++){
    const mode=states[si],specs=cases(car,objects,mode);t.roof[car.id]=mode==='roof-closed'?1:mode==='roof-fade'?.4:0;t.doors={};for(const o of objects)if(o.kind==='door')t.doors[car.id+':'+o.id]=mode==='doors-open';
    g.players.forEach((p,i)=>{const s=specs[i];Object.assign(p,{room:null,ui:null,hp:100,equipment:{},faceX:ca,faceY:sa,jumpHeight:s.height,groundHeight:s.ground,jumpVelocity:0,attack:0,charge:0,happyUntil:0,chocolateSparkleUntil:0,swordChargeAim:false,animationAction:null,moving:false,swimming:false,trainGround:0,broomMount:null,trainVisualLift:0,appearance:{...DEFAULT_APPEARANCE,...p.appearance,shirt:colors[i],pants:'#3b4257',cape:'none'}});delete p.trainRide;if(s.ride){p.trainRide=s.ride;const q=s.ride.gangway?trainRiderWorld(cs,s.ride):trainWorld(car,s.ride.x,s.ride.y);p.x=q.x;p.y=q.y;}else {const q=trainWorld(car,s.outside.x,s.outside.y);p.x=q.x;p.y=q.y;}});
    renderer.portalActors=null;renderer.portalEpoch=0;g.portalTransition=null;renderer.cameraOverride={x:car.x,y:car.y-52,zoom:.68};renderer.trainScene=t;renderer.camera={...renderer.cameraOverride};renderer.draw(g,0);
    const {c}=sheets[si],x=view%2*500,y=Math.floor(view/2)*350;c.drawImage(canvas,0,0,1000,700,x,y,500,350);c.fillStyle='#101d26';c.fillRect(x,y,500,22);c.fillStyle='#f0dfad';c.font='12px sans-serif';c.fillText(car.kind+' / '+mode+' / '+view+' ('+Math.round(a*180/Math.PI)+' deg)',x+8,y+15);
    checks.push(car.kind+' '+mode+' view '+view);
   }
  }
  for(let i=0;i<states.length;i++)images[kind+'-'+states[i]]=sheets[i].canvas.toDataURL();
 }
 return {checks,images,cars:5,directions:8,states,frames:280};
 }catch(e){throw Error(e.stack)}})()`);
 for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
 if(errors.length)throw Error(errors.join('\n'));const report={passed:result.checks.length,failed:0,...result,muted:win.webContents.isAudioMuted(),errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));clearTimeout(deadline);app.exit(0);
 }catch(e){console.error(e.stack,errors);clearTimeout(deadline);app.exit(1);}});
