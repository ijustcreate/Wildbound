const path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');
// Only this isolated QA child is launched/exited. Existing games are untouched.
if(!process.versions.electron){
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const child=require('node:child_process').spawnSync(path.join(root,'test-output/electron-41.10.7/electron.exe'),[__filename],{cwd:root,env,encoding:'utf8',timeout:100000});
 if(child.stdout)process.stdout.write(child.stdout);if(child.stderr)process.stderr.write(child.stderr);if(child.error)console.error(child.error);
 process.exit(child.status??1);
}
const {app,BrowserWindow}=require('electron');
const out=path.join(root,'test-output','banshee-queen-qa-'+Date.now()+'-'+process.pid);fs.mkdirSync(out,{recursive:true});
app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'profile'));
const deadline=setTimeout(()=>app.exit(1),90000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:900,useContentSize:true,webPreferences:{offscreen:true}}),errors=[];
 w.webContents.on('console-message',event=>{if(event.level==='error'&&/Error|Exception/.test(event.message))errors.push(event.message);});
 const run=source=>w.webContents.executeJavaScript('(async()=>{'+source+'})()');
 try{
  await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'),{query:{tools:'1'}});
  await run('await window.wildboundBoot.ready;const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);');
  const report=await run(`
   const [{Game,EVENTS},{Assets},{Animator},{Renderer},{HeroUI},items,motion,steps,ai,{saveSession,restoreSession}]=await Promise.all([
    import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/animation.mjs'),import('./src/render.mjs'),import('./src/hero-ui.mjs'),import('./src/items.mjs'),import('./src/banshee-motion.mjs'),import('./src/banshee-steps.mjs'),import('./src/banshee-queen.mjs'),import('./src/session.mjs')]);
   const {ITEMS,BANSHEE_SET,stat}=items,assert=(condition,message)=>{if(!condition)throw Error(message);checks.push(message);},checks=[],pictures={};
   const assets=new Assets();await assets.load();const animator=new Animator(assets),g=new Game(()=>.5),p=g.addPlayer('keyboard','Banshee set tester');g.start();
   Object.assign(g,{phase:'play',openingBoard:false,bloom:3,event:null,reveal:null,forestLandscape:null,house:null});g.scenery=[];g.terrain.fill('grass');g.livingEcosystem.vines=[];g.enemies=[];
   g.spawnEvent(EVENTS.findIndex(e=>e.kind==='banshee_queen'));g.reveal=null;g.eventTime=0;
   const e=g.enemies.find(e=>e.kind==='banshee_queen');assert(g.enemies.length===6&&g.enemies.filter(a=>a.kind!=='banshee_queen').length===5,'Queen event contains exactly five skeletal escorts');
   const sheet=document.createElement('canvas');sheet.width=1040;sheet.height=1050;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#243039';c.fillRect(0,0,1040,1050);c.fillStyle='#e7d4df';c.font='18px system-ui';c.fillText('BANSHEE QUEEN / SHARED HUMANOID / CUSTOM PIXEL GEAR',20,25);
   const actions=['idle','walk','draw','ranged','hurt','death'],probe=document.createElement('canvas');probe.width=probe.height=220;const pc=probe.getContext('2d');let poses=0;
   for(let row=0;row<6;row++)for(let d=0;d<8;d++){
    const actor={...e,x:65+d*130,y:145+row*142,animationAction:actions[row],playerFrame:3,faceX:Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4)};
    animator.draw(c,actor,.6,92);pc.clearRect(0,0,220,220);animator.draw(pc,{...actor,x:110,y:145},.6,92);
    if(!pc.getImageData(0,0,220,220).data.some((v,i)=>i%4===3&&v))throw Error('Invisible Queen '+actions[row]+' facing '+d);
    c.fillStyle='#c4d7df';c.font='12px system-ui';c.fillText(actions[row]+' / '+d,actor.x-25,actor.y+20);poses++;
   }
   const {drawItem}=await import('./src/item-art.mjs');for(let n=0;n<5;n++){drawItem(c,BANSHEE_SET[n],95+n*195,950,72);c.fillStyle='#ccdce3';c.font='14px system-ui';c.fillText(ITEMS[BANSHEE_SET[n]].name,23+n*195,1008);}
   assert(poses===48&&motion.bansheeMotion.artGeneration===3,'48 actual Electron Queen poses use the humanoid generation');pictures['queen-poses']=sheet.toDataURL();
   const close=document.createElement('canvas');close.width=close.height=440;const cc=close.getContext('2d');cc.fillStyle='#243039';cc.fillRect(0,0,440,440);animator.draw(cc,{...e,x:220,y:385,faceX:0,faceY:1,animationAction:'idle',playerFrame:2},1,300);pictures['queen-closeup']=close.toDataURL();
   Object.assign(p,{x:660,y:650,hp:100,maxHp:100,faceX:1,faceY:0});Object.assign(e,{x:850,y:650,faceX:-1,faceY:0,cooldown:0});
   g.enemies.filter(a=>a!==e).forEach((a,n)=>Object.assign(a,{x:755+n%3*60,y:715+Math.floor(n/3)*50,faceX:-1,faceY:0}));
   const canvas=document.createElement('canvas');canvas.style='position:fixed;inset:0;width:1280px;height:900px;z-index:99999';document.body.append(canvas);const r=new Renderer(canvas,assets);r.camera={x:760,y:670,zoom:1.85};r.draw(g,0);
   assert(r.actorQueue.some(a=>a.kind==='banshee_queen'),'Real world renderer queues the Queen');pictures['queen-event']=canvas.toDataURL();
   e.cooldown=0;g.update(.05,{});assert(e.bansheeDrawLeft>0&&!g.arrows.length,'Live Queen AI begins a visible bow draw before firing');
   e.frozen=1;const drawn=e.bansheeDrawLeft;g.update(.05,{});assert(e.bansheeDrawLeft===drawn&&!g.arrows.length,'Freeze pauses the Queen draw without a release');
   e.frozen=0;for(let n=0;n<18;n++)g.update(.05,{});assert(g.arrows.some(a=>a.hostile),'Queen releases a hostile arrow after her draw');
   const wear=ids=>{p.equipment={};for(const id of ids)p.equipment[ITEMS[id].slot]=id;p.equipment.hand2='occupied';};wear(['banshee_bow','banshee_quiver']);
   g.arrows=[];p.inventory=[{type:'arrow',qty:5},...BANSHEE_SET.map(type=>({type,qty:1}))];assert(g.fireArrow(p,1),'New bow fires using real player arrow code');
   const a=g.arrows[0];Object.assign(a,{x:e.x,y:e.y,z:20,vx:0,vy:0,vz:0});g.random=()=>.1;g.tickAdventure(.01,{});
   assert(e.frozen===1.5&&a.bansheeFreezeRolled&&a.ammoType==='arrow','Two-piece set freezes an enemy without converting ordinary ammunition');
   const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert(restored.enemies.find(a=>a.kind==='banshee_queen').equipment.hand1==='banshee_bow'&&restored.arrows[0].bansheeFreezeRolled,'Queen equipment and once-only projectile proc survive reload');
   wear(BANSHEE_SET);g.time=10;r.draw(g,0);for(let n=0;n<9;n++){p.x+=10;g.time+=.05;r.draw(g,0);}
   const footprints=steps.sampleBansheeSteps(g);assert(footprints.length>0&&footprints.length<=48&&stat(p,'icySteps')===1,'Real world renderer leaves the bounded full-set trail on its floor');
   const trail=document.createElement('canvas');trail.width=360;trail.height=140;const tc=trail.getContext('2d');tc.imageSmoothingEnabled=false;tc.fillStyle='#293c43';tc.fillRect(0,0,360,140);tc.save();tc.scale(3,3);tc.translate(3-footprints[0].x,25-p.y);steps.drawBansheeSteps(tc,g);tc.restore();pictures['icy-footsteps']=trail.toDataURL();
   pc.clearRect(0,0,220,220);pc.save();pc.translate(40-p.x,110-p.y);steps.drawBansheeSteps(pc,g);pc.restore();assert(pc.getImageData(0,0,220,220).data.some((v,i)=>i%4===3&&v),'Icy footsteps rasterize on a real canvas');
   g.time+=3;pc.clearRect(0,0,220,220);steps.drawBansheeSteps(pc,g);assert(!pc.getImageData(0,0,220,220).data.some((v,i)=>i%4===3&&v),'Footprints fade completely without persistent particles');
   canvas.remove();const host=document.createElement('div');host.style='position:fixed;inset:0;z-index:99999;background:#243039';document.body.append(host);const ui=new HeroUI(host);
   const roomCanvas=document.createElement('canvas');roomCanvas.width=320;roomCanvas.height=240;Object.assign(p,{room:777,roomX:90,roomY:165});const door={id:777,owner:p.id,closing:null};
   ui.room(roomCanvas,g,p,door,r);p.roomX+=20;g.time+=.1;ui.room(roomCanvas,g,p,door,r);
   assert(steps.sampleBansheeSteps(g,{room:777}).length===2,'Actual storage-room floor renders icy footsteps');pictures['storage-footsteps']=roomCanvas.toDataURL();
   Object.assign(p,{room:'temple-upper',roomX:90,roomY:165});ui.room(roomCanvas,g,p,{id:p.room,temple:true},r);p.roomX+=20;g.time+=.1;ui.room(roomCanvas,g,p,{id:p.room,temple:true},r);
   assert(steps.sampleBansheeSteps(g,{room:p.room}).length===2,'Actual temple-room floor renders icy footsteps');pictures['temple-footsteps']=roomCanvas.toDataURL();
   p.room=null;g.openInventory(p);ui.draw(g,r);
   const panel=ui.panels.get(p.id),button=[...panel.querySelectorAll('button')].find(b=>b.dataset.mode==='gear'&&b.dataset.slot==='head');assert(!!button?.showItemTooltip,'Hood is rendered in the real head equipment slot');button.showItemTooltip();
   const tip=panel.querySelector('.item-tooltip');assert(tip.textContent.includes('Banshee · 5/5')&&tip.textContent.includes('2 pieces')&&tip.textContent.includes('20%')&&tip.textContent.includes('cosmetic'),'Live inventory tooltip shows the two-piece and full-set bonuses');
   window.bansheeQA={g,p,e,r,ui,host,checks};return {checks,pictures};
  `);
  for(const [name,png]of Object.entries(report.pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(png.split(',')[1],'base64'));
  await new Promise(resolve=>setTimeout(resolve,120));fs.writeFileSync(path.join(out,'set-inventory.png'),(await w.webContents.capturePage()).toPNG());
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:report.checks.length,failed:0,checks:report.checks},null,2));
  console.log(JSON.stringify({passed:report.checks.length,failed:0,out,checks:report.checks},null,2));clearTimeout(deadline);app.exit(0);
 }catch(error){console.error(error.stack);fs.writeFileSync(path.join(out,'failure.txt'),error.stack);clearTimeout(deadline);app.exit(1);}
});
