const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/sword-charge');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-sword-charge-')));app.commandLine.appendSwitch('mute-audio');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1200,height:800,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadFile(path.join(base,'index.html'));await w.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   window.requestAnimationFrame=()=>0;
   const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs'),{drawPlayer,directionVector,playerPose,playerMotion}=await import('./src/player-motion.mjs'),{swordChargeReach}=await import('./src/sword-feel.mjs');
   const checks=[],images={},ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
   const g=new Game(()=>.5),p=g.addPlayer('keyboard','Sword charge');g.start();g.openingBoard=false;g.weather=null;g.event=null;g.scenery=[];g.terrain.fill('grass');g.persist=()=>{};g.onSound=()=>{};
   Object.assign(p,{x:650,y:650,faceX:1,faceY:0,equipment:{hand1:'sword',hand2:'shield'},invincible:true});
   g.enemies=[];const target=(x,y,id)=>({id,kind:'lion',x,y,hp:1000,maxHp:1000,speed:0,damage:0,frozen:100,state:'hunt',cooldown:99,faceX:-1,faceY:0});const a=target(705,650,901),b=target(800,650,902),side=target(740,690,903);g.enemies=[a,b,side];
   const assets=new Assets();await assets.load();const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=800;document.body.append(canvas);const r=new Renderer(canvas,assets);g.spriteLibrary=assets.library;
   const tick=(i,n)=>{for(let k=0;k<n;k++)g.update(.02,{keyboard:i});},paint=name=>{r.camera={x:730,y:635,zoom:2.5};r.draw(g,0);images[name]=canvas.toDataURL();};
   tick({attack:true,block:true,aimX:1},12);paint('partial');ok(p.x===650&&p.blocking===false,'charging sword and shield holds position with exposed blade');const short=swordChargeReach(p.charge);
   tick({attack:true,block:true,aimX:1},55);paint('full');ok(p.charge===1.2&&swordChargeReach(p.charge)>short,'lane grows to full charge cap');
   const sheet=document.createElement('canvas');sheet.width=1120;sheet.height=420;const c=sheet.getContext('2d');c.fillStyle='#344b40';c.fillRect(0,0,sheet.width,sheet.height);
   for(let d=0;d<8;d++)for(let n=0;n<2;n++){const [faceX,faceY]=directionVector(d),actor={...p,faceX,faceY};c.save();c.translate(70+d*140,160+n*180);c.scale(3,3);drawPlayer(c,actor,n*.2,playerMotion);c.restore();const pose=playerPose(actor,n*.2);ok(pose.handR.every(Number.isFinite),'finite held sword pose '+d+' / '+n);}
   images['eight-directions']=sheet.toDataURL();
   tick({block:true,aimX:1},1);ok(!!p.swordDash,'attack release starts dash while aim remains held');tick({block:true},8);paint('dash-swipe');tick({block:true},40);paint('after');
   ok(Math.abs(p.x-830)<.1,'dash ends at telegraphed range');ok(a.hp<1000&&a.hp===b.hp&&side.hp===1000,'lane hits each enemy once and excludes side enemy');ok(!p.swordDash&&p.spin===0,'dash completes without radial spin');
   const {enterTrainTest,leaveTrainTest}=await import('./src/train-test.mjs'),{enterWildLands}=await import('./src/wild-lands.mjs');
   for(const [name,enter]of [['railway',enterTrainTest],['wild-lands',enterWildLands]]){
    ok(enter(g).ok,name+' dev world entered');const hero=g.players[0];hero.equipment={hand1:'sword'};const x=hero.x,y=hero.y;
    tick({attack:true,block:true,aimX:1},62);ok(hero.swordChargeAim&&hero.charge===1.2,name+' sword charge through actual Game.update');
    r.camera={x:hero.x+70,y:hero.y-20,zoom:2};r.draw(g,0);images[name+'-charge']=canvas.toDataURL();
    tick({block:true,aimX:1},1);ok(!!hero.swordDash,name+' release starts sword dash');tick({block:true},40);ok(!hero.swordDash&&Math.hypot(hero.x-x,hero.y-y)>5,name+' dash moves and completes');leaveTrainTest(g);
   }
   return {checks,images};
  })()`);
  for(const [name,url]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));delete result.images;
  result.errors=errors;result.failed=errors.length;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));w.destroy();app.exit(result.failed?1:0);
 }catch(e){console.error(e);w.destroy();app.exit(1);}
});
