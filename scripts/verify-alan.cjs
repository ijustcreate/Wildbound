const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.env.WILDBOUND_QA_ROOT||path.join(__dirname,'..')),out=path.join(__dirname,'../test-output/alan');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.commandLine.appendSwitch('mute-audio');app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1200,height:900}),errors=[];w.webContents.setAudioMuted(true);
 w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadFile(path.join(root,'index.html'));
  const result=await w.webContents.executeJavaScript(`(async()=>{
   await window.wildboundBoot.ready;
   const [{Assets},{Animator},{Game},{rigSubject},{ALAN_EQUIPMENT,setProgress},{alanRollResolved,alanActor,tickAlan},{openNpcDialogue,npcDialogueView,npcDialogueAction},{createHouseWorld,travelHouseWorlds},{waterAt}]=await Promise.all([
    import('./src/assets.mjs'),import('./src/animation.mjs'),import('./src/core.mjs'),import('./src/rig-subjects.mjs'),import('./src/items.mjs'),import('./src/alan-ally.mjs'),import('./src/npc-quests.mjs'),import('./src/house-worlds.mjs'),import('./src/environment.mjs')]);
   const assets=new Assets();await assets.load();const animator=new Animator(assets),subject=rigSubject('alan');
   if(subject.data.joints.chest.parent!=='spine'||!subject.data.joints.toeL)throw Error('Alan is not on Captain rig');
   const sheet=document.createElement('canvas');sheet.width=1600;sheet.height=920;
   const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#263331';c.fillRect(0,0,1600,920);
   c.fillStyle='#dfd3a6';c.font='25px sans-serif';c.fillText('Alan · Wilderness Man · Captain rig',24,32);
   const actions=['idle','walk','slash','hurt','death'];let frames=0;
   for(const [row,action]of actions.entries())for(let d=0;d<8;d++){
    const a=d*Math.PI/4,clip=subject.data.clips[action],actor={kind:'alan',sprite:'alan',x:d*200+100,y:row*178+157,hp:action==='death'?0:180,maxHp:180,faceX:Math.sin(a),faceY:Math.cos(a),moving:action==='walk',equipment:{...ALAN_EQUIPMENT},animationAction:action,playerFrame:Math.floor(clip.length*.6)};
    animator.draw(c,actor,1,130);c.fillStyle='#bed0b4';c.font='12px sans-serif';c.fillText(action+' / '+d,d*200+20,row*178+172);
    for(let f=0;f<clip.length;f++){const scratch=document.createElement('canvas');scratch.width=scratch.height=160;const q=scratch.getContext('2d');q.translate(80,88);subject.draw(q,{...actor,playerFrame:f},f/clip.fps,subject.data);frames++;}
   }
   window.__alanSheet=sheet;
   const hero=document.createElement('canvas');hero.width=1480;hero.height=570;const hc=hero.getContext('2d');hc.imageSmoothingEnabled=false;
   hc.fillStyle='#263331';hc.fillRect(0,0,hero.width,hero.height);hc.fillStyle='#dfd3a6';hc.font='30px sans-serif';hc.fillText('Alan · turtle-shell helmet',32,42);
   for(const [i,d]of [0,2,4].entries()){
    const a=d*Math.PI/4,actor={kind:'alan',sprite:'alan',x:180+i*370,y:460,hp:180,maxHp:180,faceX:Math.sin(a),faceY:Math.cos(a),equipment:{...ALAN_EQUIPMENT},animationAction:'idle',playerFrame:4};
    animator.draw(hc,actor,1,235);hc.fillStyle='#bed0b4';hc.font='18px sans-serif';hc.fillText(['Front shell','Shell profile','Rear shell'][i],65+i*370,535);
   }
   animator.draw(hc,{kind:'player',sprite:'player',x:1290,y:460,hp:100,maxHp:100,faceX:0,faceY:1,equipment:{...ALAN_EQUIPMENT},appearance:{skin:'#c78956',shirt:'#b79357',pants:'#9c7140',shoes:'#493523',hair:'long',hairColor:'#49301e',face:'alan',build:'standard'},animationAction:'idle',playerFrame:4},1,235);
   hc.fillStyle='#bed0b4';hc.font='18px sans-serif';hc.fillText('Normal player baseline',1170,535);
   window.__alanHero=hero;
   const g=new Game(()=>.3);g.addPlayer('keyboard','Scout');g.start();g.openingBoard=false;g.phase='play';g.houseWorldsEnabled=true;g.generatedEnvironment='forest';g.environment='forest';
   g.spawnEvent=()=>true;const p=g.players[0];
   g.roll={playerId:p.id,total:2,resolved:false};g.resolveRoll();
   if(alanActor(g))throw Error('Alan appeared before the second roll');
   g.roll={playerId:p.id,total:3,resolved:false};g.resolveRoll();
   const alan=alanActor(g);if(!alan||!g.log.some(x=>String(x).includes('Alan')))throw Error('Alan entrance failed');
   if(alanRollResolved(g)||g.enemies.filter(e=>e.kind==='alan').length!==1)throw Error('Alan appeared more than once');
   p.x=alan.x+20;p.y=alan.y;
   if(!openNpcDialogue(g,p)||p.ui.npcId!=='alan'||!npcDialogueView(g,p).text.includes('trapped'))throw Error('Alan dialogue failed');
   npcDialogueAction(g,p,'alan:follow');if(alan.allyOwner!==p.id||alan.allyMode!=='follow')throw Error('Follow choice failed');
   npcDialogueAction(g,p,'alan:patrol');if(alan.allyMode!=='patrol'||alan.allyOwner!=null)throw Error('Patrol choice failed');
   npcDialogueAction(g,p,'close');
   const monster={id:g.nextId++,kind:'skeleton',x:alan.x+36,y:alan.y,hp:40,maxHp:40,faction:'enemy',damage:1};g.enemies.push(monster);alan.cooldown=0;tickAlan(g,alan,.1);
   if(monster.hp>=40)throw Error('Alan did not strike nearby monster');
   alan.allyMode='follow';alan.allyOwner=p.id;
   g.houseWorlds.worlds.house=createHouseWorld(Game,{destination:'house',seed:g.seed+911,nextId:g.nextId}).state;
   if(!travelHouseWorlds(g,5)||alanActor(g)!==alan||g.generatedEnvironment!=='house')throw Error('Following Alan did not travel with player');
   alan.allyMode='patrol';alan.allyOwner=null;g.houseWorlds.bag=['forest'];
   if(!travelHouseWorlds(g,5)||g.generatedEnvironment!=='forest'||alanActor(g))throw Error('Patrolling Alan left his board');
   const b=new Game(()=>.3);b.addPlayer('keyboard','Set wearer');b.start();b.openingBoard=false;b.phase='play';
   const wearer=b.players[0];wearer.x=390;wearer.y=400;wearer.faceX=1;wearer.faceY=0;wearer.equipment={...ALAN_EQUIPMENT};wearer.hp=50;wearer.maxHp=100;
   if(waterAt(b,wearer.x,wearer.y)==='water')wearer.jumpHeight=1;
   b.projectileBlocked=()=>false;b.blocked=()=>false;
   const foe={id:b.nextId++,kind:'skeleton',x:415,y:400,hp:160,maxHp:160,faceX:-1,faceY:0,state:'hunt',faction:'enemy'};b.enemies=[foe];
   if(!setProgress(wearer,'alan').complete)throw Error('Jumanji set did not complete');
   const attacked=b.attack(wearer,0);if(!(foe.jumanjiVines>0)||!(foe.frozen>0)||wearer.hp!==58||wearer.jumanjiVineCooldown!==12)throw Error('Jumanji full-set strike failed '+JSON.stringify({attacked,hp:wearer.hp,foeHp:foe.hp,vines:foe.jumanjiVines,frozen:foe.frozen,cooldown:wearer.jumanjiVineCooldown,complete:setProgress(wearer,'alan').complete,phase:b.phase,room:wearer.room,attack:wearer.attack,weapon:wearer.equipment.hand1}));
   wearer.attack=0;foe.frozen=0;foe.jumanjiVines=0;b.attack(wearer,0);
   if(foe.jumanjiVines>0||wearer.hp!==58)throw Error('Jumanji full-set cooldown failed');
   wearer.equipment.head=null;wearer.attack=0;wearer.jumanjiVineCooldown=0;b.attack(wearer,0);
   if(foe.jumanjiVines>0||setProgress(wearer,'alan').complete)throw Error('Incomplete Jumanji set still triggered');
   return {frames,rig:subject.data.type,entrance:true,dialogue:true,follow:true,patrol:true,travel:true,jumanjiSet:true,combatDamage:40-monster.hp};
  })()`);
  const bytes=await w.webContents.executeJavaScript(`(async()=>Array.from(new Uint8Array(await new Promise(r=>window.__alanSheet.toBlob(async b=>r(await b.arrayBuffer()))))))()`);
  fs.writeFileSync(path.join(out,'assembled.png'),Buffer.from(bytes));
  const heroBytes=await w.webContents.executeJavaScript(`(async()=>Array.from(new Uint8Array(await new Promise(r=>window.__alanHero.toBlob(async b=>r(await b.arrayBuffer()))))))()`);
  fs.writeFileSync(path.join(out,'hero.png'),Buffer.from(heroBytes));
  const report={...result,rendererErrors:errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));if(errors.length)throw Error(errors.join('; '));console.log(JSON.stringify(report));
 }catch(error){console.error(error.stack||error);process.exitCode=1;}finally{w.destroy();app.exit(process.exitCode||0);}
});
