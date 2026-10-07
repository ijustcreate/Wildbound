const path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const child=require('node:child_process').spawnSync(path.join(root,'test-output/electron-41.10.7/electron.exe'),[__filename],{cwd:root,env,encoding:'utf8',timeout:105000});
 if(child.stdout)process.stdout.write(child.stdout);if(child.stderr)process.stderr.write(child.stderr);if(child.error)console.error(child.error);process.exit(child.status??1);
}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output','beach-wild-fauna-qa-'+Date.now()+'-'+process.pid);
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'profile'));
const deadline=setTimeout(()=>app.exit(1),95000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:900,useContentSize:true,webPreferences:{offscreen:true}}),errors=[];
 w.webContents.setAudioMuted(true);w.webContents.on('console-message',event=>{if(event.level==='error'&&/Error|Exception/.test(event.message))errors.push(event.message);});
 const run=source=>w.webContents.executeJavaScript('(async()=>{'+source+'})()');
 const png=(name,data)=>fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
 try{
  await w.loadURL('about:blank');w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Debugger.enable');
  await w.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.coastalQAContext=ctx,false)'});
  await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'),{query:{tools:'1'}});
  await run('await window.wildboundBoot.ready;const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);');w.webContents.debugger.detach();
  await run(`
   const ctx=window.coastalQAContext;if(!ctx)throw Error('No debug context');ctx.newLobby();const g=ctx.game,p=g.addPlayer('keyboard','Coastal explorer');ctx.playableLobby.sync();const s=ctx.playableLobby.state.members.get(p.id);Object.assign(s,{spawned:true,x:625,y:540});
   const image=ctx.playableLobby.beachArt;if(!image.complete)await image.decode();ctx.playableLobby.open(p,'environment');
   const b=[...ctx.playableLobby.nodes.get(p.id).querySelectorAll('button')].find(b=>b.getAttribute('aria-label')?.startsWith('Beach.'));if(!b||!b.getClientRects().length)throw Error('Beach is not a rendered map choice');b.scrollIntoView({block:'center'});
   if(!b.querySelector('canvas').getContext('2d').getImageData(0,0,40,40).data.some((v,i)=>i%4===3&&v))throw Error('Beach map thumbnail is empty');window.coastalQAMenuButton=b;
  `);
  await new Promise(resolve=>setTimeout(resolve,120));fs.writeFileSync(path.join(out,'beach-level-select.png'),(await w.webContents.capturePage()).toPNG());
  const report=await run(`
   const checks=[],pictures={},assert=(ok,message)=>{if(!ok)throw Error(message);checks.push(message);};
   window.coastalQAMenuButton.click();assert(document.getElementById('environment').value==='beach','Rendered Beach level-select button selects the new map');
   const [{Game,EVENTS},{Assets},{Animator},{Renderer},{HeroUI},art,props,fauna,data,{saveSession,restoreSession},{rules}]=await Promise.all([import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/animation.mjs'),import('./src/render.mjs'),import('./src/hero-ui.mjs'),import('./src/beach-art.mjs'),import('./src/beach-props.mjs'),import('./src/wild-fauna.mjs'),import('./src/wild-fauna-data.mjs'),import('./src/session.mjs'),import('./src/definitions.mjs')]);
   if(!art.beachBackdrop.complete)await art.beachBackdrop.decode();assert(art.beachBackdrop.naturalWidth>1000,'Generated sunny coastal background is loaded in the actual application');
   const assets=new Assets();await assets.load();const animator=new Animator(assets),g=new Game(()=>.5);g.seed=1234;g.environment='beach';const p=g.addPlayer('keyboard','Coastal explorer');g.start();g.openingBoard=false;g.bloom=3;p.invincible=true;g.spriteLibrary=assets.library;
   const canvas=document.createElement('canvas');canvas.style='position:fixed;inset:0;z-index:99999;width:1280px;height:900px';document.body.append(canvas);const r=new Renderer(canvas,assets);
   const scene=(name,x,y,zoom)=>{Object.assign(p,{x,y,hp:100});r.camera={x,y,zoom};r.draw(g,0);pictures[name]=canvas.toDataURL();};
   const vision=rules.visionRadius;rules.visionRadius=1800;scene('beach-art-overview-fog-disabled',800,800,.46);rules.visionRadius=vision;
   scene('beach-board-clearing',800,800,1.55);assert(g.scenery.some(a=>a.kind==='beach_arch')&&g.scenery.some(a=>a.beachCliff),'Playable beach contains a sea arch and coastal cliffs');
   scene('beach-pier-and-surf',480,400,1.65);scene('beach-arch-and-cypress',1300,510,1.65);scene('beach-tide-pools',300,1070,1.65);
   const coastal=g.scenery.filter(a=>a.coastal);assert(coastal.length<=112&&art.beachCacheSize(g)<=art.BEACH_GROUND_CACHE_LIMIT,'Scenery and ground caches remain bounded across camera views');
   // Native props must rasterize without a bitmap. This guard catches accidental
   // atlas fallback while inspecting real Canvas pixels, not mocked draw counts.
   const sheet=document.createElement('canvas');sheet.width=980;sheet.height=500;const c=sheet.getContext('2d');c.fillStyle='#273e39';c.fillRect(0,0,980,500);c.fillStyle='#f1d7a5';c.font='18px system-ui';c.fillText('BEACH / NATIVE LAYERED PIXEL PROPS',20,28);
   const probe=document.createElement('canvas');probe.width=probe.height=240;const pc=probe.getContext('2d');
   for(const [i,kind]of ['beach_arch','tree','palm','rock','beach_driftwood','beach_grass'].entries()){
    const source=coastal.find(a=>a.kind===kind),a={...source,x:100+(i%3)*320,rootY:225+Math.floor(i/3)*240,size:150,y:200};if(!source)throw Error('Missing prop '+kind);
    pc.clearRect(0,0,240,240);pc.save();pc.translate(120-a.x,210-a.rootY);pc.drawImage=()=>{throw Error('Generated world sprite used for '+kind);};props.drawNativeBeachProp(pc,a,1);pc.restore();
    assert(pc.getImageData(0,0,240,240).data.some((v,n)=>n%4===3&&v),'Native '+kind+' rasterizes with no bitmap dependency');props.drawNativeBeachProp(c,a,1);
   }pictures['beach-native-props']=sheet.toDataURL();
   scene('beach-surf-before',480,400,1.65);const first=canvas.toDataURL();g.time+=2;scene('beach-surf-later',480,400,1.65);assert(first!==canvas.toDataURL(),'Rendered coastal surf animates');
   Object.assign(p,{x:600,y:130});g.update(.05,{});assert(p.swimming,'Beach ocean uses actual swimming physics');
   const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert(restored.generatedEnvironment==='beach'&&restored.scenery.length===g.scenery.length&&restored.terrain.join()===g.terrain.join(),'Actual Beach session reload preserves map and scenery');
   canvas.remove();const host=document.createElement('div');host.style='position:fixed;inset:0;z-index:99999;background:#243039';document.body.append(host);const ui=new HeroUI(host);p.x=p.y=800;p.swimming=false;g.openInventory(p);ui.draw(g,r);await ui.inventoryBeachArt.decode();ui.draw(g,r);const panel=ui.panels.get(p.id),inventoryScene=panel.querySelector('.inventory-scene');assert(panel.dataset.environment==='beach'&&ui.inventoryBeachArt.src.endsWith('beach-background-v1.png')&&inventoryScene.getContext('2d').getImageData(0,0,inventoryScene.width,inventoryScene.height).data.some((v,i)=>i%4!==3&&v>100),'Actual Beach inventory draws its coastal backdrop on the scene canvas');window.coastalQAInventory=host;
   const wildlifeSheet=document.createElement('canvas');wildlifeSheet.width=1040;wildlifeSheet.height=40+data.WILD_FAUNA_KINDS.length*155;const wc=wildlifeSheet.getContext('2d');wc.fillStyle='#293941';wc.fillRect(0,0,wildlifeSheet.width,wildlifeSheet.height);wc.fillStyle='#e4d3b3';wc.font='19px system-ui';wc.fillText('NATIVE WILDLIFE / DEER, PIGS, SCORPION, ARCTIC FOX / 8 FACINGS',20,25);
   let poses=0;for(const [row,kind]of data.WILD_FAUNA_KINDS.entries())for(let d=0;d<8;d++){
    const a={id:row,kind,x:65+d*130,y:150+row*155,hp:20,faceX:Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4),moving:true,step:2,state:'hunt'};
    animator.draw(wc,a,1,60);pc.clearRect(0,0,240,240);animator.draw(pc,{...a,x:120,y:170},1,60);if(!pc.getImageData(0,0,240,240).data.some((v,n)=>n%4===3&&v))throw Error('Invisible '+kind+' facing '+d);poses++;
   }assert(poses===data.WILD_FAUNA_KINDS.length*8,poses+' articulated wildlife poses rasterize through the real Animator');pictures['wildlife-eight-facings']=wildlifeSheet.toDataURL();
   for(const [env,expected]of [['forest',7],['temple',7],['desert',4],['ice',3]]){const w=new Game(()=>.5);w.environment=env;w.seed=1234;const q=w.addPlayer('keyboard','Wildlife viewer');w.start();w.openingBoard=false;w.bloom=3;w.spriteLibrary=assets.library;fauna.seedWildFauna(w,true);assert(w.enemies.filter(a=>a.wildlife).length===expected,'Actual '+env+' world seeds its bounded wildlife');
    const e=w.enemies.find(a=>a.wildlife);Object.assign(q,{x:e.x-55,y:e.y+35,invincible:true});q.equipment={};const view=document.createElement('canvas');view.style='position:fixed;left:-9999px;top:0;width:1100px;height:780px';document.body.append(view);const rr=new Renderer(view,assets);rr.camera={x:e.x,y:e.y,zoom:1.4};rr.draw(w,0);assert(view.width>=1000&&rr.actorQueue.some(a=>a.id===e.id),'Actual '+env+' wildlife is depth-queued on a full-size rendered surface');pictures['wildlife-'+env]=view.toDataURL();view.remove();
    if(env==='forest'){w.update(.05,{});assert(e.state!=='flee','Live deer lets an unarmed player stand close');q.equipment.hand1='bow';w.update(.05,{});assert(e.state==='flee','Live deer flees a held weapon');}
    if(env==='desert'){Object.assign(q,{x:e.x+30,y:e.y,invincible:false,invuln:0});e.cooldown=0;w.update(.05,{});assert(e.state==='sting'&&q.hp===100,'Live scorpion warns before a close sting');e.frozen=1;const timer=e.timer;w.update(.05,{});assert(e.timer===timer,'Freeze pauses a pending wild scorpion sting');e.frozen=0;for(let n=0;n<14;n++)w.update(.05,{});assert(q.hp<100&&q.poison>0,'Live scorpion sting damages and poisons once after its warning');}
    const copy=restoreSession(JSON.parse(JSON.stringify(saveSession(w))));assert(fauna.seedWildFauna(copy,true)===0&&copy.enemies.length===w.enemies.length,'Actual '+env+' wildlife reload does not duplicate animals');
   }
   window.coastalQA={g,p,r,ui,checks};return {checks,pictures};
  `);
  for(const [name,data]of Object.entries(report.pictures))png(name,data);
  await new Promise(resolve=>setTimeout(resolve,120));fs.writeFileSync(path.join(out,'beach-inventory.png'),(await w.webContents.capturePage()).toPNG());
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:report.checks.length,failed:0,checks:report.checks},null,2));console.log(JSON.stringify({passed:report.checks.length,failed:0,out,checks:report.checks},null,2));clearTimeout(deadline);app.exit(0);
 }catch(error){console.error(error.stack);if(errors.length)console.error(errors.join('\n'));fs.writeFileSync(path.join(out,'failure.txt'),error.stack);clearTimeout(deadline);app.exit(1);}
});
