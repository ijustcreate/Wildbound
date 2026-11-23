const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,stage=process.env.PURSUIT_STAGE||'source',out=path.join(root,'test-output/enemy-pursuit',stage);
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-pursuit-')));app.commandLine.appendSwitch('mute-audio');app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1200,height:820,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
try{await w.loadFile(path.join(base,'index.html'));await w.webContents.executeJavaScript('wildboundBoot.ready');const result=await w.webContents.executeJavaScript(`(async()=>{
 window.requestAnimationFrame=()=>0;const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs'),{combatPhase}=await import('./src/enemy-combat-catalog.mjs');
 const {initializeTacticalEnemy}=await import('./src/combat-tactics-state.mjs');
 const assets=new Assets();await assets.load();const canvas=document.createElement('canvas');canvas.style.cssText='width:1180px;height:760px';const reviewHost=document.createElement('div');reviewHost.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#233a31';reviewHost.append(canvas);document.body.append(reviewHost);const renderer=new Renderer(canvas,assets);renderer.setDynamicShadows(false);const checks=[],cases=[],images={};
 const ok=(value,name)=>{checks.push({name,passed:!!value});};
 for(const kind of ['skeleton','archer','watcher','enchanted_book','wolf'])for(const party of [1,2]){
  const g=new Game(()=>.5);for(let i=0;i<party;i++)g.addPlayer(i?'pad:'+i:'keyboard');g.start();Object.assign(g,{time:20,openingBoard:false,scenery:[],house:null,enemies:[],traps:[],weather:null,event:null});g.terrain.fill('grass');g.onSound=()=>{};g.persist=()=>{};g.spriteLibrary=assets.library;
  for(const [i,p]of g.players.entries())Object.assign(p,{x:1000+i*45,y:950,hp:100,invincible:true,equipment:{hand1:'sword'}});
  for(let i=0;i<4;i++){const e={id:900+i,kind,x:560,y:870+i*55,hp:300,maxHp:300,speed:65,damage:7,state:'hunt',cooldown:0,faceX:1,faceY:0,group:9};g.configureCreature(e,false);if(kind==='archer'){e.combatRole='archer';initializeTacticalEnemy(e);}e.cooldown=0;g.enemies.push(e);}
  let maximum=0,overlaps=0;const observed=new Set(),starts=new Set();
  for(let frame=0;frame<540;frame++){
   const input={};for(const p of g.players)input[p.device]={x:frame<100?.5:Math.sin(frame/55)*.45,y:Math.cos(frame/90)*.2};g.update(1/30,input);
   const threats=g.enemies.filter(e=>e.groupTurn?.mode==='attack'&&['windup','active'].includes(combatPhase(e)));maximum=Math.max(maximum,threats.length);
   for(const e of g.enemies)if(e.pursuitTactic)observed.add(e.pursuitTactic.role);
   for(const e of threats){const key=e.id+':'+e.groupTurn.startedAt;if(starts.has(key))continue;starts.add(key);const p=g.players.find(p=>p.id===e.groupTurn.targetId);for(const a of threats){const q=g.players.find(p=>p.id===a.groupTurn.targetId);if(a!==e&&q!==p&&Math.hypot(q.x-p.x,q.y-p.y)<110&&a.groupTurn.startedAt<e.groupTurn.startedAt)overlaps++;}}
   if(frame===90||frame===300){renderer.cameraOverride={x:850,y:950,zoom:.85};Object.assign(renderer.camera,renderer.cameraOverride);renderer.draw(g,0);images[kind+'-'+party+'-'+frame]=canvas.toDataURL();}
  }
  ok(observed.size===4,kind+'/'+party+' keeps four distinct pursuit roles');ok(maximum<=party,kind+'/'+party+' respects offensive turn budget');ok(overlaps===0,kind+'/'+party+' avoids fresh clustered co-op overlaps');ok(starts.size>0,kind+'/'+party+' reaches real telegraphed attacks');
  cases.push({kind,party,roles:[...observed],maximum,starts:starts.size,overlaps,positions:g.enemies.map(e=>({x:e.x,y:e.y,role:e.pursuitTactic}))});
 }
 // Empty archers must render a physical anticipation/contact/recovery rather
 // than drawing a nonexistent arrow. Sample both native animation adapters.
 const {enemyCombatAnimation}=await import('./src/enemy-combat-animation.mjs'),{tacticalHumanoidAnimation}=await import('./src/tactical-motion.mjs'),{rigSubject}=await import('./src/rig-subjects.mjs');
 const model=rigSubject('archer').data,board=document.createElement('canvas');board.width=960;board.height=480;const c=board.getContext('2d');c.imageSmoothingEnabled=false;
 for(let row=0;row<2;row++)for(const [column,phase]of ['windup','active','recover'].entries()){
  const e={id:'bash-'+row+phase,kind:'archer',hp:100,x:0,y:0,faceX:1,faceY:0,state:phase==='active'?'charge':phase,arrowsLeft:0,bowBash:true};const state={phase,duration:.55,remaining:.22,index:0,bowBash:true};if(row){e.combatRole='archer';e.tactics=state;}else e.speciesCombat=state;
  const posed=row?tacticalHumanoidAnimation(e,model):enemyCombatAnimation(e,model);ok(['punch_left','swipe_one'].includes(posed.animationAction),'bash adapter '+row+'/'+phase+' uses physical clip');
  c.fillStyle='#304c40';c.fillRect(column*320,row*240,319,239);c.fillStyle='#d5ad72';c.font='14px sans-serif';c.fillText((row?'Tactical ':'Ordinary ')+phase,column*320+15,row*240+25);c.save();c.translate(column*320+160,row*240+180);c.scale(2,2);renderer.animator.draw(c,posed,20,48);c.restore();
 }images['bow-bash-phases']=board.toDataURL();return {checks,cases,images};
})()`);for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;const report={...result,errors,failed:errors.length+result.checks.filter(c=>!c.passed).length};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({stage,checks:report.checks.length,failed:report.failed,out}));w.destroy();app.exit(report.failed?1:0);
}catch(e){fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({error:String(e),stack:e.stack,errors},null,2));console.error(e);w.destroy();app.exit(1);}});
