const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename,'--mute-audio'],{cwd:root,env,encoding:'utf8',timeout:180000});process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');process.exit(result.status??1);}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output/train-depth',process.env.WILDBOUND_VERIFY_APP?'packaged':'source');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'isolated-profile'));app.commandLine.appendSwitch('mute-audio');const deadline=setTimeout(()=>app.exit(1),170000);
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}}),errors=[];win.webContents.setAudioMuted(true);win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});try{
 await win.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));await win.webContents.executeJavaScript('wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
 window.requestAnimationFrame=()=>0;window.Worker=undefined;
 const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs');
 const {enterTrainTest,trainPrompt}=await import('./src/train-test.mjs'),{trainCars,trainWorld}=await import('./src/train-track.mjs');
 const {defaultTrainDesign,trainInterior}=await import('./src/train-design.mjs'),{trainStudents}=await import('./src/train-students.mjs');
 const checks=[],images={},ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};const assets=new Assets();await assets.load();
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=650;document.body.replaceChildren(canvas);const renderer=new Renderer(canvas,assets);
 const sheet=()=>{const a=document.createElement('canvas');a.width=1600;a.height=800;const c=a.getContext('2d');c.fillStyle='#263b38';c.fillRect(0,0,a.width,a.height);return [a,c];};
 const [grounded,gc]=sheet(),[tops,tc]=sheet();
 for(let view=0;view<8;view++){
  const g=new Game(()=>.5);g.addPlayer('keyboard','TRAIN VISITOR');g.start();g.openingBoard=false;g.onSound=()=>{};g.persist=()=>{};g.spriteLibrary=assets.library;
  const design=defaultTrainDesign();design.nativeForest=false;design.scenery=[];ok(enterTrainTest(g,design).ok,'railway view '+view);
  const t=g.trainTest,p=g.players[0],a=view*Math.PI/4,ca=Math.cos(a),sa=Math.sin(a);t.route={points:[{x:2000-ca*10000,y:2000-sa*10000,z:0,s:0},{x:2000+ca*10000,y:2000+sa*10000,z:0,s:20000}],length:20000,id:'qa-straight'};t.routeSegments=[{at:-Infinity,route:t.route,offset:0}];t.otherRoutes=[];t.distance=10437;t.preparing=false;t.time=6;t.roof.compartments=0;g.enemies=[];
  const c=trainCars(t)[2],table=trainInterior(design,c).find(o=>o.kind==='table');t.cocoaTaken.add(c.id+':'+table.id);
  p.trainRide={car:c.index,x:table.x,y:12};Object.assign(p,trainWorld(c,p.trainRide.x,p.trainRide.y));
  const seen=[];for(let i=0;i<6;i++){seen.push(trainPrompt(g,p));g.update(.02,{keyboard:{interact:true}});g.update(.02,{keyboard:{}});if(p.ui?.trainStudentGift){g.update(.02,{keyboard:{interact:true}});g.update(.02,{keyboard:{}});}}
  ok(['HARRY POTTER','HERMIONE GRANGER','RON WEASLEY'].every(n=>seen.some(s=>s.includes(n))),'all overlapping students reachable from aisle '+view);
  ok(Object.keys(p.npcQuests.train_students.received).length===3,'one gift from each student '+view);
  delete t.studentSpeech;t.time=6;renderer.draw(g,0);gc.drawImage(canvas,250,110,400,400,view%4*400,Math.floor(view/4)*400,400,400);gc.fillStyle='#ffe4aa';gc.font='14px sans-serif';gc.fillText('Walking / passengers · '+view,view%4*400+10,Math.floor(view/4)*400+24);
  p.trainRide={car:c.index,x:table.x,y:table.y+table.h/2+9};Object.assign(p,trainWorld(c,p.trainRide.x,p.trainRide.y));Object.assign(p,{jumpHeight:0,groundHeight:0,jumpVelocity:0,jumpMoveInitialized:false});t.previous=new Map();
  for(let i=0;i<30&&p.trainRide.y>table.y+9;i++)g.update(.02,{keyboard:{x:sa,y:-ca,jump:true}});
  for(let i=0;i<80;i++)g.update(.02,{keyboard:{}});
  ok(p.groundHeight===14&&p.jumpHeight===0,'real jump lands on tabletop '+view);
  renderer.trainScene=null;delete t.studentSpeech;t.time=6;renderer.draw(g,0);tc.drawImage(canvas,250,110,400,400,view%4*400,Math.floor(view/4)*400,400,400);tc.fillStyle='#ffe4aa';tc.font='14px sans-serif';tc.fillText('Standing on table · '+view,view%4*400+10,Math.floor(view/4)*400+24);
  g.update(.02,{keyboard:{jump:true}});ok(p.jumpHeight>14,'jumps again from tabletop '+view);
 }
 images['grounded-eight-views']=grounded.toDataURL();images['tabletop-eight-views']=tops.toDataURL();return {checks,images};
 })()`);
 for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
 if(errors.length)throw Error(errors.join('\n'));const report={passed:result.checks.length,failed:0,...result,muted:win.webContents.isAudioMuted(),errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));clearTimeout(deadline);app.exit(0);
 }catch(e){console.error(e.stack,errors);clearTimeout(deadline);app.exit(1);}});
