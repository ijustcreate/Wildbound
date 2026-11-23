const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,stage=process.env.ENEMY_ROSTER_STAGE||'source',out=path.join(root,'test-output/enemy-roster',stage);
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-enemy-roster-')));app.commandLine.appendSwitch('mute-audio');app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1200,height:820,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadFile(path.join(base,'index.html'));await w.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   if(wildboundBoot.error||!wildboundBoot.finished)throw Error('App boot did not finish: '+wildboundBoot.error);
   window.requestAnimationFrame=()=>0;const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs'),{creatures}=await import('./src/definitions.mjs');
   const {ENEMY_COMBAT_CATALOG,updateEnemyCombatReadability}=await import('./src/enemy-combat-catalog.mjs'),{SPECIES_ATTACKS,speciesPhase}=await import('./src/enemy-species-combat.mjs'),{ELDRITCH_ATTACKS}=await import('./src/eldritch-attack-logic.mjs');
   const {rigSubject}=await import('./src/rig-subjects.mjs'),{directionVector}=await import('./src/player-motion.mjs');
   const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();Object.assign(g,{openingBoard:false,scenery:[],house:null,weather:null,enemies:[],time:20});g.terrain.fill('grass');g.onSound=()=>{};g.persist=()=>{};Object.assign(p,{x:600,y:600,invincible:true,equipment:{hand1:'sword'}});
   const assets=new Assets();await assets.load();g.spriteLibrary=assets.library;const canvas=document.createElement('canvas');canvas.style.cssText='width:1180px;height:760px';const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#233a31';host.append(canvas);document.body.append(host);const renderer=new Renderer(canvas,assets);renderer.setDynamicShadows(false);
   const checks=[],images={},coverage=[],ok=(v,name)=>{checks.push({name,passed:!!v});if(!v)throw Error(name);};
   const kinds=Object.entries(creatures).filter(([kind,cfg])=>cfg.faction==='enemy'&&!kind.startsWith('explorer')).map(([kind])=>kind);ok(kinds.every(kind=>ENEMY_COMBAT_CATALOG[kind]),'every hostile species has an explicit attack and counter profile');
   const beforeRig=JSON.stringify([...new Set(kinds.map(k=>rigSubject(k)?.data).filter(Boolean))].map(m=>m.clips));
   const representative={predator:'panther',rush:'crocodile',serpent:'snake',insect:'bat',plant:'tree_ent',fighter:'skeleton',caster:'necromancer',heavy:'water_elemental',nest:'bee_hive'};
   const families=new Map();for(const kind of kinds){const family=ENEMY_COMBAT_CATALOG[kind].family;if(!families.has(family))families.set(family,[]);families.get(family).push(kind);}
   for(const [family,members]of families){
    const views=document.createElement('canvas');views.width=1600;views.height=720;const vc=views.getContext('2d');vc.imageSmoothingEnabled=false;
    const board=document.createElement('canvas');board.width=1280;board.height=Math.ceil(members.length/4)*245;const c=board.getContext('2d');c.imageSmoothingEnabled=false;
    for(let i=0;i<members.length;i++){
     const kind=members[i],model=rigSubject(kind)?.data,e={id:2000+i,kind,x:0,y:0,hp:200,maxHp:200,speed:50,damage:10,faceX:1,faceY:0,state:'hunt',group:2,cooldown:0,stats:creatures[kind].stats,hatchIn:10};g.configureCreature(e,false);
     const x=i%4*320,y=Math.floor(i/4)*245;c.fillStyle=i%2?'#2c493d':'#263f36';c.fillRect(x+1,y+1,318,243);c.fillStyle='#e8daba';c.font='13px sans-serif';c.fillText(kind,x+12,y+20);c.font='10px sans-serif';c.fillText(ENEMY_COMBAT_CATALOG[kind].attack.slice(0,45),x+12,y+37);
     let nonempty=0;
     for(const phase of ['windup','active','recover'])for(let d=0;d<8;d++){
      const a=structuredClone(e),[dx,dy]=directionVector(d);a.id='roster-'+kind+'-'+phase+'-'+d;a.faceX=dx;a.faceY=dy;a.state=phase==='active'?'charge':phase;a.timer=.3;a.motionDuration=.8;
      if(SPECIES_ATTACKS[kind]){speciesPhase(a,phase,.8);a.speciesCombat.remaining=.32;}
      else if(ELDRITCH_ATTACKS[kind]){a.animationAction=phase==='recover'?'recover':phase==='windup'&&kind==='evil_hand'?'windup':ELDRITCH_ATTACKS[kind].clip;a.poseTime=.6;}
      else {const names=phase==='windup'?['windup','cast','crouch','draw']:phase==='active'?['attack','bite','slash','special','pounce','charge']:['recover','hurt','idle'];const action=names.find(n=>model?.clips?.[n]);if(action){a.animationAction=action;a.playerFrame=(model.clips[action].length-1)*.6;}}
      const sample=document.createElement('canvas');sample.width=sample.height=180;const sc=sample.getContext('2d');sc.translate(90,125);try{renderer.animator.draw(sc,a,20.2,48);}catch(error){throw Error(kind+' / '+phase+' / '+d+': '+error.stack);}if(sc.getImageData(0,0,180,180).data.some((v,k)=>k%4===3&&v>0))nonempty++;
      if(kind===representative[family]){const row=['windup','active','recover'].indexOf(phase),vx=d*200,vy=row*240;vc.fillStyle=(d+row)%2?'#2c493d':'#263f36';vc.fillRect(vx+1,vy+1,198,238);vc.fillStyle='#e8daba';vc.font='12px sans-serif';vc.fillText(kind+' · '+phase+' · '+d,vx+8,vy+22);vc.save();vc.translate(vx+100,vy+190);vc.scale(2,2);renderer.animator.draw(vc,a,20.2,48);vc.restore();}
      if(d===2){const row=['windup','active','recover'].indexOf(phase);c.drawImage(sample,x+row*104+3,y+48,104,104);c.fillStyle='#c6cdb6';c.font='10px sans-serif';c.fillText(phase,x+row*104+12,y+164);}
     }
     coverage.push({kind,family,attack:ENEMY_COMBAT_CATALOG[kind].attack,facings:8,states:3,nonempty});ok(nonempty===24,kind+' renders preparation, attack and recovery in all eight directions');
     c.fillStyle='#bfc7ae';c.font='10px sans-serif';c.fillText('Opening Ã—'+ENEMY_COMBAT_CATALOG[kind].openingMultiplier+' Â· pressure '+ENEMY_COMBAT_CATALOG[kind].pressureWeight,x+12,y+191);
    }
    images['family-'+family]=board.toDataURL();images['eight-views-'+family]=views.toDataURL();
   }
   ok(beforeRig===JSON.stringify([...new Set(kinds.map(k=>rigSubject(k)?.data).filter(Boolean))].map(m=>m.clips)),'animation sampling preserves every editable rig clip');
   const {enterTrainTest}=await import('./src/train-test.mjs'),{defaultTrainDesign}=await import('./src/train-design.mjs'),{drawRailwayTrack}=await import('./src/train-world-art.mjs');
   window.Worker=undefined;const design=defaultTrainDesign();design.nativeForest=false;design.scenery=[];ok(enterTrainTest(g,design).ok,'native railway scene starts in an isolated game');
   const t=g.trainTest;t.route={points:[{x:1600,y:1800,z:0,s:0},{x:5600,y:1800,z:0,s:4000}],length:4000,id:'roster-main'};t.routeSegments=[{at:-Infinity,route:t.route,offset:0}];t.otherRoutes=[{points:[{x:2620,y:600,z:0,s:0},{x:2620,y:4000,z:0,s:3400}],length:3400,id:'roster-crossing'}];t.distance=2200;t.preparing=false;t.time=6;t.speed=0;t.throttle=0;t.engine=false;t.previous=new Map();
   const railPlayer=g.players[0];delete railPlayer.trainRide;Object.assign(railPlayer,{x:2420,y:1900,charge:0,attack:0,swimming:false});
   const enemy={id:777,kind:'boar',x:2500,y:1800,hp:100,maxHp:100,faceX:.768221,faceY:.640184};speciesPhase(enemy,'windup',.7);Object.assign(enemy.speciesCombat,{style:'rush',reach:210,width:50});g.enemies=[enemy];
   const ground=renderer.drawCombatGround.bind(renderer),telegraphs=renderer.drawCombatTelegraphs.bind(renderer);let baseImage,preImage,afterImage,matrix,basePassed=false;
   renderer.drawCombatGround=(game,w,h,options)=>{basePassed=options?.omitTelegraphs===true;ground(game,w,h,options);baseImage=renderer.ctx.getImageData(0,0,renderer.ctx.canvas.width,renderer.ctx.canvas.height);};
   renderer.drawCombatTelegraphs=(game,w,h)=>{preImage=renderer.ctx.getImageData(0,0,renderer.ctx.canvas.width,renderer.ctx.canvas.height);matrix=renderer.ctx.getTransform();telegraphs(game,w,h);afterImage=renderer.ctx.getImageData(0,0,renderer.ctx.canvas.width,renderer.ctx.canvas.height);};
   renderer.cameraOverride={x:2580,y:1840,zoom:1.35};renderer.camera={x:2580,y:1840,zoom:1.35};renderer.draw(g,0);ok(basePassed&&baseImage&&preImage&&afterImage,'railway separates base ground from foreground telegraphs');
   images['rail-debug']=canvas.toDataURL();window.rosterLastImages=images;
   const masks=[{name:'main track',left:2505,right:2540,top:1790,bottom:1815},{name:'crossing branch',left:2600,right:2640,top:1880,bottom:1920}];
   for(const mask of masks){let railPixels=0,painted=0;
    for(let x=mask.left;x<=mask.right;x++)for(let y=mask.top;y<=mask.bottom;y++){
     const px=Math.round(matrix.a*x+matrix.c*y+matrix.e),py=Math.round(matrix.b*x+matrix.d*y+matrix.f);if(px<0||py<0||px>=preImage.width||py>=preImage.height)continue;const at=(py*preImage.width+px)*4;
     const diff=(a,b)=>Math.abs(a[at]-b[at])+Math.abs(a[at+1]-b[at+1])+Math.abs(a[at+2]-b[at+2]);
     if(diff(baseImage.data,preImage.data)>20){railPixels++;if(diff(afterImage.data,preImage.data)>5)painted++;}
    }
    ok(railPixels>4,mask.name+' is painted before warnings ('+railPixels+')');ok(painted>2,'attack footprint remains visible over '+mask.name+' ('+painted+')');
   }
   images['rail-crossing-warning']=canvas.toDataURL();
   g.enemies=[];renderer.cameraOverride={x:2720,y:1800,zoom:1.35};Object.assign(renderer.camera,renderer.cameraOverride);Object.assign(railPlayer,{x:2500,y:1800,trainGround:0,groundHeight:0,faceX:1,faceY:0,equipment:{hand1:'sword'},charge:0,swordChargeAim:false});renderer.draw(g,0);const withoutSword=renderer.ctx.getImageData(0,0,renderer.ctx.canvas.width,renderer.ctx.canvas.height);
   Object.assign(railPlayer,{charge:1.2,swordChargeAim:true,swordChargePreview:{length:180,requested:180,blocked:false}});renderer.draw(g,0);const withSword=renderer.ctx.getImageData(0,0,renderer.ctx.canvas.width,renderer.ctx.canvas.height),sm=matrix;let swordRailPixels=0;
   for(let x=2600;x<=2640;x++)for(let y=1813;y<=1817;y++){const px=Math.round(sm.a*x+sm.c*y+sm.e),py=Math.round(sm.b*x+sm.d*y+sm.f);if(px<0||py<0||px>=withSword.width||py>=withSword.height)continue;const at=(py*withSword.width+px)*4;const delta=Math.abs(withSword.data[at]-withoutSword.data[at])+Math.abs(withSword.data[at+1]-withoutSword.data[at+1])+Math.abs(withSword.data[at+2]-withoutSword.data[at+2]);if(delta>8)swordRailPixels++;}
   const {swordCharging}=await import('./src/sword-feel.mjs');ok(swordRailPixels>3,'charged sword rectangle also remains visible across the rail branch '+JSON.stringify({pixels:swordRailPixels,charging:swordCharging(railPlayer),x:railPlayer.x,y:railPlayer.y,face:[railPlayer.faceX,railPlayer.faceY],ui:railPlayer.ui,room:railPlayer.room,ride:railPlayer.trainRide,hp:railPlayer.hp,swim:railPlayer.swimming,charge:railPlayer.charge,matrix:[sm.a,sm.d,sm.e,sm.f],image:[withSword.width,withSword.height]}));images['sword-preview-over-track']=canvas.toDataURL();
   return {checks,coverage,images};
  })()`);
  for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
  const report={...result,stage,appPath:base,errors,failed:errors.length+result.checks.filter(c=>!c.passed).length};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({stage,checks:report.checks.length,covered:report.coverage.length,failed:report.failed,errors,out}));w.destroy();app.exit(report.failed?1:0);
 }catch(error){try{const saved=await w.webContents.executeJavaScript('window.rosterLastImages||{}');for(const [name,data]of Object.entries(saved))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));}catch{}fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({error:String(error),stack:error.stack,errors},null,2));fs.writeFileSync(path.join(out,'failure.png'),(await w.webContents.capturePage()).toPNG());console.error(error);w.destroy();app.exit(1);}
});
