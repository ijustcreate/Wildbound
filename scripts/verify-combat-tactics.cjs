const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const stage=process.env.COMBAT_TACTICS_STAGE||'source',out=path.join(root,'test-output/combat-tactics',stage);
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-crossfire-')));
app.commandLine.appendSwitch('mute-audio');app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1200,height:820,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);
 const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 w.webContents.on('render-process-gone',(_e,d)=>errors.push(JSON.stringify(d)));
 try{
  await w.loadFile(path.join(base,'index.html'));
  await w.webContents.executeJavaScript('Promise.race([wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error("Boot timeout")),60000))])');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   if(wildboundBoot.error||!wildboundBoot.finished)throw Error('Boot failed');
   window.requestAnimationFrame=()=>0;
   const {Game,EVENTS}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs');
   const {tacticalPhase}=await import('./src/combat-tactics-state.mjs');
   const g=new Game(()=>.5),p=g.addPlayer('keyboard','Sword specialist');g.start();
   Object.assign(g,{openingBoard:false,scenery:[],house:null,weather:null,event:null,enemies:[]});g.terrain.fill('grass');g.persist=()=>{};g.onSound=()=>{};g.time=20;g.sky.elapsed=100;
   Object.assign(p,{x:620,y:650,faceX:1,faceY:0,equipment:{hand1:'sword',hand2:'shield'},invincible:true});
   const {createGameDebug}=await import('./src/game-debug.mjs'),{ITEMS}=await import('./src/items.mjs');
   createGameDebug({getGame:()=>g,events:EVENTS,items:ITEMS}).open(document.body,p);
   document.querySelector('[data-debug=crossfire-patrol]').click();
   const selected=document.querySelector('[data-debug=event]').value;document.querySelector('.game-debug-console').remove();
   const actors=g.enemies.filter(e=>e.combatRole),shield=actors.find(e=>e.combatRole==='shield'),lion=actors.find(e=>e.combatRole==='charger'),archer=actors.find(e=>e.combatRole==='archer');
   Object.assign(shield,{x:730,y:650});Object.assign(lion,{x:770,y:735});Object.assign(archer,{x:860,y:610});
   for(const e of actors){e.faceX=-1;e.faceY=0;e.cooldown=0;e.spawnReadyAt=0;e.hp=e.maxHp=1000;}
   const checks=[],images={},ok=(v,name)=>{checks.push({name,passed:!!v});if(!v)throw Error(name);};
   ok(EVENTS[Number(selected)]?.name==='Crossfire patrol'&&g.event?.name==='Crossfire patrol','GM console button selects and spawns the actual patrol');
   const assets=new Assets();await assets.load();g.spriteLibrary=assets.library;
   const canvas=document.createElement('canvas'),host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#243e36';canvas.style.cssText='width:1180px;height:760px;display:block';host.append(canvas);document.body.append(host);document.body.style.margin='0';
   const renderer=new Renderer(canvas,assets);renderer.setDynamicShadows(false);
   const world=name=>{renderer.camera={x:735,y:650,zoom:1.65};renderer.draw(g,0);images[name]=canvas.toDataURL();};
   world('mixed-patrol');ok(actors.length===3&&shield.equipment.hand2==='shield','native mixed encounter spawns all three equipped roles');
   const sheet=document.createElement('canvas');sheet.width=1080;sheet.height=690;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#263f38';c.fillRect(0,0,1080,690);
   for(let row=0;row<3;row++)for(let col=0;col<3;col++){
     const e=actors[row];e.faceX=col===0?0:-1;e.faceY=col===0?1:0;const phase=['approach','windup','recover'][col];tacticalPhase(e,phase,phase==='windup'?.7:1);e.tactics.remaining*=.4;e.timer=e.tactics.remaining;
     const x=col*360,y=row*230;c.fillStyle=col%2?'#314d42':'#2b453c';c.fillRect(x+1,y+1,358,228);c.fillStyle='#e7dabb';c.font='15px sans-serif';c.fillText(e.combatRole+' · '+phase,x+18,y+26);
     c.save();c.translate(x+170,y+185);c.scale(3,3);c.translate(-e.x,-e.y);renderer.animator.draw(c,e,g.time,48);c.restore();
   }
   images['role-poses']=sheet.toDataURL();
   for(const e of actors){tacticalPhase(e,'approach',0);e.cooldown=0;}
   const phases=new Set();let arrows=0;
   for(let k=0;k<220;k++){
     g.update(.02,{keyboard:{moveY:k%100<50?1:-1}});
     for(const e of actors)phases.add(e.combatRole+':'+e.tactics.phase);
     arrows=Math.max(arrows,g.arrows.length);
   }
   ok(phases.has('charger:active')&&phases.has('charger:recover'),'live charger rushes and exposes recovery');
   ok(phases.has('archer:windup')&&arrows>0,'live archer draws and fires a real projectile');
   ok(!g.effects.some(e=>e.radius||e.ring||e.telegraph),'tactical enemies emit no ground circles or telegraphs');world('live-fight');
   for(const e of actors)e.frozen=100;
   Object.assign(p,{x:620,y:650,attack:0,charge:0,dodge:0,dashTime:0,previousInput:{},faceX:1,faceY:0});delete p.swordStrike;delete p.swordDash;
   const tick=(i={},n=1)=>{for(let k=0;k<n;k++)g.update(.02,{keyboard:i});};
   g.attack(p);tick({},12);g.playerDashMotion(p,{dodge:true},.02,0,1);ok(p.dashTime>0&&p.attack===0,'native sword recovery cancels into repositioning dodge');
   g.attack(p);tick({},18);ok(p.attackClip==='swipe_two','buffered attack links the second swing after dodge');
   tick({},25);Object.assign(p,{x:620,y:650,previousInput:{},faceX:1,faceY:0});tick({attack:true,holdPosition:true,aimX:1},62);world('clean-charge-lane');
   ok(p.swordChargePreview?.length>0&&p.charge===1.2,'clean charged-sword rectangle remains available');
   const q=g.addPlayer('gamepad-0','Partner');Object.assign(q,{x:680,y:700,invincible:true});
   const {damageEnemy}=await import('./src/enemy-damage.mjs');
   const ordinary={id:g.nextId++,kind:'skeleton_unarmed',x:710,y:650,hp:2000,maxHp:2000,speed:0,damage:1,state:'hunt',timer:0,cooldown:99,tacticTime:99,flash:0,faceX:-1,faceY:0};g.enemies.push(ordinary);
   for(let k=0;k<4;k++)damageEnemy(ordinary,3,'physical',{g,p});
   ok(ordinary.enemyMind.openUntil>g.time&&ordinary.enemyFlinchUntil>g.time,'ordinary enemies expose a brief shared pressure opening');
   const health=ordinary.hp;damageEnemy(ordinary,20,'physical',{g,p});ok(health-ordinary.hp===23,'ordinary opening bonus applies to actual damage');
   g.time+=.2;g.tickCombatActors(.02);ok(ordinary.enemyMind.targetId===p.id,'shared threat targeting prefers the attacker over a closer co-op player');
   const reaction=document.createElement('canvas');reaction.width=480;reaction.height=260;const rc=reaction.getContext('2d');rc.fillStyle='#273f37';rc.fillRect(0,0,480,260);rc.save();rc.translate(240,210);rc.scale(3.5,3.5);rc.translate(-ordinary.x,-ordinary.y);renderer.animator.draw(rc,ordinary,g.time,48);rc.restore();images['ordinary-pressure-opening']=reaction.toDataURL();
   canvas.style.width='100vw';canvas.style.height='100vh';window.crossfireReview={g,renderer,canvas};
   return {checks,images,phases:[...phases]};
  })()`);
  w.setContentSize(660,740);
  const narrow=await w.webContents.executeJavaScript(`(()=>{const {g,renderer,canvas}=crossfireReview;renderer.draw(g,0);return {overflow:document.documentElement.scrollWidth>innerWidth+1,image:canvas.toDataURL()};})()`);
  result.images['two-player-narrow']=narrow.image;result.checks.push({name:'two-player narrow native viewport fits',passed:!narrow.overflow});
  for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
  const motion=await w.webContents.executeJavaScript('('+require('./combat-animation-review.cjs').toString()+')()');result.checks.push(...motion.checks);
  for(const [name,data]of Object.entries(motion.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  fs.writeFileSync(path.join(out,'combat-motion.webm'),Buffer.from(motion.video.split(',')[1],'base64'));
  const report={...result,stage,appPath:base,errors,failed:errors.length+result.checks.filter(c=>!c.passed).length};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({stage,checks:report.checks.length,failed:report.failed,out,errors}));w.destroy();app.exit(report.failed?1:0);
 }catch(error){fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({error:String(error),stack:error.stack,errors},null,2));console.error(error);w.destroy();app.exit(1);}
});
