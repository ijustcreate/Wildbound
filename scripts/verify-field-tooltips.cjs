const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/field-tooltips');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,x:20,y:20,width:1127,height:797,useContentSize:true,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message)});
 try{
  await w.loadURL('about:blank');w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Debugger.enable');await w.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.qaContext=ctx,false)'});
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  await w.webContents.insertCSS('*{transition:none!important;animation:none!important}');
  w.show();w.focus();w.webContents.focus();
  await w.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame;window.qaRaf=raf;window.requestAnimationFrame=()=>0;await new Promise(raf);
   const ctx=qaContext,g=ctx.game,kit=ctx.fieldKit,checks=[],assert=(v,m)=>{if(!v)throw Error(m);checks.push(m)};
   g.players=[];const p=g.addPlayer('pad:0','EMBER FOX');g.phase='play';g.openingBoard=false;ctx.show('play');p.inventory=[{type:'stone',qty:6},{type:'bone_shard',qty:2}];
   kit.open(p);const heads=()=>[...kit.dialog.querySelectorAll('.field-card-select')],tips=()=>[...kit.dialog.querySelectorAll(':popover-open')];
   const positions=()=>heads().map(n=>n.getBoundingClientRect().top);
   const before=positions(),height=heads()[0].parentElement.offsetHeight;
   heads()[0].focus();assert(tips().length===1,'Focus shows one floating detail');assert(tips()[0].textContent.includes('Stone chunk · 6/3'),'Tooltip includes material counts');
   assert(JSON.stringify(before)===JSON.stringify(positions()),'Focus does not displace any grid row');assert(height===heads()[0].parentElement.offsetHeight,'Focused card stays compact');
   kit.moveFocus(1);assert(document.activeElement.classList.contains('field-craft-action'),'Controller focus reaches Craft');
   document.activeElement.click();await new Promise(r=>setTimeout(r,40));assert(p.inventory.some(x=>x.type==='azure_bead'),'Craft still creates native item');assert(p.inventory.find(x=>x.type==='stone').qty===3,'Craft consumes ingredients');
   heads()[1].focus();assert(tips().length===1&&tips()[0].id==='field-tooltip-recipe:moon_prism','Moving focus replaces tooltip');assert(tips()[0].querySelector('button').disabled,'Missing materials prevents crafting');
   kit.dialog.querySelector('[data-focus="tab:Skills"]').click();heads()[1].focus();assert(tips().length===1,'Skills show focus tooltips');assert(!kit.dialog.querySelector('.is-selected'),'Skills do not expand selected cards');
   kit.close();assert(tips().length===0,'Closing hides popover');kit.tab='Craft';kit.open(p);window.ftQA={ctx,g,kit,p,checks,assert,heads,tips,positions};
  })()`);
  // Reset retained tab scroll/focus before testing a real pointer hit.
  await w.webContents.executeJavaScript(`(()=>{ftQA.kit.dialog.querySelector('header button').focus();ftQA.kit.hideCardTooltip();ftQA.kit.body.scrollTop=0;})()`);
  // Real pointer hover, then pointer leave, without focusing a recipe.
  await w.webContents.executeJavaScript('new Promise(r=>qaRaf(()=>qaRaf(r)))');
  const point=await w.webContents.executeJavaScript(`(()=>{const r=ftQA.heads()[2].getBoundingClientRect();return{x:Math.round(r.x+30),y:Math.round(r.y+20)}})()`);
  w.focus();w.webContents.focus();w.webContents.sendInputEvent({type:'mouseMove',x:1,y:1});await new Promise(r=>setTimeout(r,60));w.webContents.sendInputEvent({type:'mouseMove',...point});await new Promise(r=>setTimeout(r,80));
  await w.webContents.executeJavaScript(`(()=>{const q=ftQA;q.assert(q.tips().length===1,'Pointer hover shows tooltip');q.assert(q.tips()[0].getBoundingClientRect().height>80,'Tooltip has visible content bounds');q.assert(q.heads()[2].parentElement.offsetHeight<130,'Hover leaves card compact');})()`);
  await w.webContents.executeJavaScript('new Promise(r=>qaRaf(()=>qaRaf(r)))');
  fs.writeFileSync(path.join(out,'craft-hover.png'),(await w.webContents.capturePage()).toPNG());
  w.webContents.sendInputEvent({type:'mouseMove',x:4,y:4});await new Promise(r=>setTimeout(r,50));
  await w.webContents.executeJavaScript(`ftQA.assert(ftQA.tips().length===0,'Pointer leave dismisses unfocused tooltip')`);
  w.setContentSize(520,550);await new Promise(r=>setTimeout(r,80));
  await w.webContents.executeJavaScript(`(()=>{const q=ftQA;q.heads()[0].focus();const r=q.tips()[0].getBoundingClientRect();q.assert(r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,'Tooltip fits compact viewport');})()`);
  fs.writeFileSync(path.join(out,'compact-focus.png'),(await w.webContents.capturePage()).toPNG());
  w.setContentSize(1127,850);await new Promise(r=>setTimeout(r,80));
  await w.webContents.executeJavaScript(`(()=>{
   const q=ftQA,{ctx,g,p,assert}=q;q.kit.close();p.device='keyboard';g.openInventory(p,'starter');
   const draw=()=>ctx.heroUI.draw(g,ctx.renderer);draw();
   const panel=ctx.heroUI.panels.get(p.id);window.chestQA={draw,panel,p};
   const slot=panel.querySelector('.storage-slots button[data-mode="chest"]:not(.empty-slot)');slot.focus();draw();
   assert(!panel.querySelector('.item-tooltip').hidden,'Starter chest focus tooltip survives render');
   assert(panel.querySelector('.item-tooltip').textContent.length>20,'Starter tooltip includes item information');
   panel.querySelector('[data-action="close"]').focus();draw();
  })()`);
  await w.webContents.executeJavaScript('new Promise(r=>qaRaf(()=>qaRaf(r)))');
  const chestPoint=await w.webContents.executeJavaScript(`(()=>{const r=chestQA.panel.querySelector('.storage-slots button[data-mode="pack"]:not(.empty-slot)').getBoundingClientRect();return{x:Math.round(r.x+20),y:Math.round(r.y+15)}})()`);
  w.webContents.sendInputEvent({type:'mouseMove',x:1,y:1});
  w.webContents.sendInputEvent({type:'mouseMove',...chestPoint});await new Promise(r=>setTimeout(r,50));
  await w.webContents.executeJavaScript(`(()=>{const q=ftQA,c=chestQA;for(let n=0;n<30;n++)c.draw();q.assert(!c.panel.querySelector('.item-tooltip').hidden,'Backpack hover tooltip persists across 30 renders');q.assert(c.panel.tooltipHover?.dataset.mode==='pack','Hover owns correct backpack slot');})()`);
  fs.writeFileSync(path.join(out,'starter-hover.png'),(await w.webContents.capturePage()).toPNG());
  w.webContents.sendInputEvent({type:'mouseMove',x:4,y:4});await new Promise(r=>setTimeout(r,30));
  await w.webContents.executeJavaScript(`(()=>{const q=ftQA,c=chestQA;c.draw();q.assert(c.panel.querySelector('.item-tooltip').hidden,'Chest pointer leave hides tooltip');c.p.device='pad:0';c.p.ui.index=1;c.p.ui.panel='chest';c.draw();q.assert(!c.panel.querySelector('.item-tooltip').hidden,'Controller selection shows chest tooltip');})()`);
  w.setContentSize(750,900);await new Promise(r=>setTimeout(r,80));
  await w.webContents.executeJavaScript(`(async()=>{
   const q=ftQA,{ctx,g,p,assert}=q;p.ui=null;ctx.heroUI.draw(g,ctx.renderer);g.phase='lobby';const l=ctx.playableLobby;l.reset();ctx.show('lobby');l.sync();Object.assign(l.state.members.get(p.id),{spawned:true,panel:null});l.open(p,'environment');
   const panel=l.nodes.get(p.id);panel.querySelector('.expedition-classic').click();const worlds=[...panel.querySelectorAll('.map-choices .map-choice')];assert(worlds.length===11,'Map table retains all ten worlds');
   assert(worlds.every(b=>b.querySelector('canvas').getBoundingClientRect().width>=25),'World artwork has fitted illustrated wells');
   for(const [i,b]of worlds.entries()){l.state.members.get(p.id).focus=[...panel.querySelectorAll('button')].indexOf(b);l.highlight(p);assert(panel.querySelector(':popover-open')?.textContent===b.dataset.mapDetail,'Controller description '+i);}
   const toggle=panel.querySelector('.map-mode-toggle');toggle.click();const next=l.nodes.get(p.id);assert(next.querySelector('.map-mode-toggle').getAttribute('aria-checked')==='true','Boundless switch retains native behavior');
   const rows=[...next.querySelectorAll('.map-choices button')].map(n=>n.getBoundingClientRect());for(let i=1;i<rows.length;i++)assert(rows[i].top>=rows[i-1].bottom,'World rows never overlap '+i);
   window.mapQA={l,p,panel:next};
   const {drawPortal}=await import('./src/portal-art.mjs'),{portalShaderStatus}=await import('./src/portal-shader.mjs'),{effects,validEffect}=await import('./src/particles.mjs');
   const canvas=document.createElement('canvas');canvas.width=480;canvas.height=360;const c=canvas.getContext('2d');c.fillStyle='#273d35';c.fillRect(0,0,480,360);c.save();c.translate(120,285);c.scale(3,3);drawPortal(c,{x:0,y:0,id:'storage-1',color:'#75cdb4'},1.4,'STORAGE · WALK IN');c.restore();
   c.save();c.translate(310,285);c.scale(3,3);new ctx.Animator().draw(c,{...p,kind:'player',x:0,y:0,faceX:0,faceY:1},1.4,86);c.restore();
   assert(validEffect(effects['portal-runes']),'Portal particles are a valid editable engine preset');assert(portalShaderStatus().ready,'Portal WebGL shader compiles in Electron');
   window.portalStudy=canvas.toDataURL();
  })()`);
  await w.webContents.executeJavaScript('new Promise(r=>qaRaf(()=>qaRaf(r)))');fs.writeFileSync(path.join(out,'map-table.png'),(await w.webContents.capturePage()).toPNG());
  const portal=await w.webContents.executeJavaScript('portalStudy');fs.writeFileSync(path.join(out,'portal.png'),Buffer.from(portal.split(',')[1],'base64'));
  await w.webContents.executeJavaScript(`(()=>{
   const q=ftQA,{ctx,g,p,assert}=q;mapQA.l.close(p);ctx.show('play');g.phase='play';p.ui=null;p.room=null;p.x=p.y=400;const d={id:9900,x:400,y:400,owner:p.id,color:p.color,closing:null};g.portals=[d];g.enterRoom(p,d);p.roomX=160;p.roomY=120;
   const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const c=canvas.getContext('2d');c.scale(2,2);const text=[],fill=c.fillText.bind(c);c.fillText=(label,...args)=>{text.push(label);fill(label,...args)};
   ctx.heroUI.paintRoom(c,g,p,d,ctx.renderer);assert(text.some(t=>t.includes('INTERACT')),'Nearby chest has native Interact prompt');window.storageStudy=canvas.toDataURL();
   g.openInventory(p,1);ctx.heroUI.draw(g,ctx.renderer);const panel=ctx.heroUI.panels.get(p.id);assert(panel.getBoundingClientRect().width<=525,'Private chest opens in a thinner window');assert(panel.querySelectorAll('.storage-slots button').length===48,'Both full grids remain accessible');
  })()`);
  const storage=await w.webContents.executeJavaScript('storageStudy');fs.writeFileSync(path.join(out,'storage-prompt.png'),Buffer.from(storage.split(',')[1],'base64'));
  const checks=await w.webContents.executeJavaScript('ftQA.checks');if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,rendererErrors:errors},null,2));console.log(JSON.stringify({checks:checks.length,rendererErrors:errors}));app.exit(0);
 }catch(e){console.error(e,errors);app.exit(1)}
});

