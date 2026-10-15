const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'recovered-controls-')));
const deadline=setTimeout(()=>app.exit(1),60000);
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true}});win.webContents.setAudioMuted(true);
 const errors=[];win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const checks=await win.webContents.executeJavaScript(`(async()=>{
   const [{Game,EVENTS},{befriendCreature},{controlledFollower,cycleFollowerControl},{saveSession,restoreSession},{HeroUI}]=await Promise.all([import('./src/core.mjs'),import('./src/friendly-creatures.mjs'),import('./src/follower-control.mjs'),import('./src/session.mjs'),import('./src/hero-ui.mjs')]);
   const checks=[],assert=(ok,name)=>{if(!ok)throw Error(name);checks.push(name);};
   const g=new Game(()=>.5),p=g.addPlayer('keyboard','Recovery tester');g.environment='forest';g.start();g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');g.house=null;g.enemies=[];g.portals=[];g.blocked=()=>false;
   p.x=600;p.y=600;p.equipment.hand1='sword';p.inventory=[{type:'potion',qty:2}];
   g.spawnEvent(EVENTS.findIndex(e=>e.kind==='oathless_captain'));const f=g.enemies.find(e=>e.kind==='oathless_captain');
   assert(!!f,'Recovered Captain event spawns');befriendCreature(f,p.id);Object.assign(f,{x:640,y:600,cooldown:0,frozen:0});
   g.update(.02,{keyboard:{controlCycle:true}});assert(controlledFollower(g,p)===f,'Real control-cycle input selects charmed creature');
   assert(p.inventory!==p.controlMainLoadout.inventory&&p.equipment!==p.controlMainLoadout.equipment,'Creature has independent inventory and gear');
   p.inventory.push({type:'arrow',qty:3});const x=f.x;for(let i=0;i<15;i++)g.update(.02,{keyboard:{x:1}});
   assert(f.x>x&&p.controlPetPosition.x<f.x,'Movement controls creature while hero follows');
   g.update(.02,{keyboard:{jump:true}});g.update(.02,{});assert(f.jumpHeight>0,'Controlled creature uses jump physics');
   Object.assign(f,{jumpHeight:0,jumpVelocity:0,groundHeight:0,cooldown:0});Object.assign(p,{jumpHeight:0,jumpVelocity:0,groundHeight:0,faceX:1,faceY:0});
   const target={id:99999,kind:'lion',faction:'enemy',hp:1000,maxHp:1000,x:f.x+25,y:f.y,speed:0,damage:0,state:'idle',timer:0,cooldown:99};g.enemies.push(target);
   g.attack(p);assert(f.controlledAttack?.nativeAction==='slash','Real attack chooses native Captain animation');
   for(let i=0;i<24;i++)g.update(.02,{});assert(target.hp<1000,'Native creature attack damages enemy');
   const r=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),rp=r.players[0];assert(rp.inventory===controlledFollower(r,rp).inventory,'Reopened creature bag remains bound');
   cycleFollowerControl(r,rp);assert(rp.inventory[0].type==='potion'&&rp.equipment.hand1==='sword','Returning control preserves hero loadout');
   const sheet=getComputedStyle(document.documentElement);const frame=[...document.styleSheets].some(s=>{try{return [...s.cssRules].some(rule=>rule.cssText.includes('npc-dialogue-frame-9slice.png'));}catch{return false;}});
   assert(frame,'Recovered nine-slice dialogue frame is installed');
   return checks;
  })()`);
  if(errors.length)throw Error(errors.join('\n'));
  const report={packaged:base!==root,audioMuted:win.webContents.isAudioMuted(),checks,errors};fs.writeFileSync(path.join(out,'recovered-controls.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));clearTimeout(deadline);app.exit(0);
 }catch(e){console.error(e.stack,errors);clearTimeout(deadline);app.exit(1);}
});
