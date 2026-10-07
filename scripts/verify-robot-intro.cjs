const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','robot-intro');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();const timer=setTimeout(()=>app.exit(1),100000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1000,height:720,useContentSize:true,webPreferences:{offscreen:true}}),errors=[];
 w.webContents.on('console-message',(_e,l,m)=>{if(typeof l==='object'){m=l.message;l=l.level;}if(l===3||l==='error')errors.push(m);});
 const run=s=>w.webContents.executeJavaScript('(async()=>{'+s+'})()');
 try{
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await run('await window.wildboundBoot.ready;window.introRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(window.introRAF);');
  const checks=await run(`
   const [{Game},{HeroUI},{Assets},{ROOM_STATIONS},{Profiles},{saveSession,restoreSession}]=await Promise.all([import('./src/core.mjs'),import('./src/hero-ui.mjs'),import('./src/assets.mjs'),import('./src/shops.mjs'),import('./src/profiles.mjs'),import('./src/session.mjs')]);const assets=new Assets();await assets.load();
   const host=document.createElement('div');host.style='position:fixed;inset:0;z-index:2147483647;background:#192f29';document.body.append(host);const ui=new HeroUI(host),checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
   for(const [device,family,label] of [['keyboard','xbox','Enter'],['pad:0','xbox','A'],['pad:0','switch','B']]){
    const g=new Game(()=>.42),p=g.addPlayer(device);g.phase='play';p.controllerFamily=family;g.portals=[{id:40,owner:p.id,closing:null}];Object.assign(p,{room:40,roomX:ROOM_STATIONS.robot.x,roomY:ROOM_STATIONS.robot.y+20});
    g.update(.05,{[device]:{interact:true}});check(p.ui?.shop==='robot-intro'&&!p.robotRepair,'First interaction opens intro '+device+'/'+family);ui.draw(g,assets);const panel=ui.panels.get(p.id),text=panel.textContent;check(text.includes('buy your unwanted')&&text.includes('same price')&&text.includes('stay fixed'),'Dialogue explains sales/buyback/permanent repair');const button=panel.querySelector('[data-action=robotContinue]');check(button.textContent.startsWith(label)&&button.classList.contains('selected'),'Visible family-labelled continue '+family);
    const pr=panel.getBoundingClientRect(),br=button.getBoundingClientRect();check(br.bottom<=pr.bottom&&br.right<=pr.right,'Continue fits panel');g.update(.05,{});g.update(.05,{[device]:{use:true}});check(!p.ui,'Actual owner confirm dismisses intro');g.update(.05,{});for(let i=0;i<50;i++)g.update(.05,{[device]:{interact:true}});check(p.robotRepaired,'Actual hold repairs once');g.update(.05,{});g.update(.05,{[device]:{interact:true}});check(p.ui?.shop==='robot','Subsequent interaction trades directly');
    const profiles=new Profiles();p.profileId='native-fixed';profiles.data.heroes=[{id:p.profileId}];profiles.save=()=>{};profiles.capture(g);const assigned={};profiles.assign(assigned,profiles.data.heroes[0]);check(assigned.robotRepaired&&assigned.robotIntroduced,'Character profile preserves repair and introduction');const loaded=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));check(loaded.players[0].robotRepaired&&loaded.players[0].robotIntroduced,'Session preserves repair and introduction');g.start();check(p.robotRepaired,'Next level stays fixed');
    if(family==='switch')window.robotIntroQA={g,p,ui,assets};
   }
   const {g,p}=window.robotIntroQA;p.robotRepaired=false;p.robotIntroduced=false;p.room=40;g.portals=[{id:40,owner:p.id,closing:null}];g.openShop(p,'robot');ui.draw(g,assets);return checks;
  `);
  await new Promise(r=>setTimeout(r,150));fs.writeFileSync(path.join(out,'first-meeting.png'),(await w.webContents.capturePage()).toPNG());
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,base},null,2));console.log(JSON.stringify({checks,errors}));clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
