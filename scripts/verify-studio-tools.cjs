const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'studio-tools-')));
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.whenReady().then(async()=>{
  const win=new BrowserWindow({width:1400,height:960,show:false,webPreferences:{contextIsolation:true}});
  await win.loadFile(path.join(root,'index.html'));
  const base=pathToFileURL(root+path.sep).href;
  const report=await win.webContents.executeJavaScript(`(async()=>{
    const {Designer}=await import(${JSON.stringify(base)}+'src/designer.mjs');
    const {Assets}=await import(${JSON.stringify(base)}+'src/assets.mjs');
    const {ITEMS}=await import(${JSON.stringify(base)}+'src/items.mjs');
    const {EVENTS}=await import(${JSON.stringify(base)}+'src/core.mjs');
    const {loadProjectRigs}=await import(${JSON.stringify(base)}+'src/project-rigs.mjs');
    const assets=new Assets();await assets.load();await loadProjectRigs(EVENTS,ITEMS);
    const ui=new Designer(assets,EVENTS,ITEMS,()=>{});window.__studioQA=ui;ui.tab='Players';ui.open();
    const assert=(condition,message)=>{if(!condition)throw Error(message);};
    assert(![...ui.dialog.querySelectorAll('nav button')].some(b=>b.textContent.includes('Other creature')),'Duplicate tab remains');
    const s=ui.playerStudio,original=structuredClone(s.model);s.selected='elbowR';s.refresh();
    await s.command('scale');const before=s.pose().elbowR.slice();
    const input=s.$('[data-value="0"]');input.value='1.5';s.$('[data-apply]').click();
    assert(s.pose().elbowR.some((v,i)=>v!==before[i]),'Scale did not edit pose');
    await s.command('undo');assert(JSON.stringify(s.model)===JSON.stringify(original),'Undo did not restore rig');
    const color=s.$('[data-bone-color]');color.value='#e855cc';color.dispatchEvent(new Event('change'));
    assert(s.model.joints.elbowR.editor.color==='#e855cc','Color not saved');
    await s.command('undo');await s.command('move');s.selected='handR';s.refresh();s.animate(0);
    for(const tool of ['move','rotate','scale','shear']) {
      await s.command(tool);s.selected='elbowR';s.refresh();s.animate(0);
      const original=JSON.stringify(s.model),handle=s.boneTools.handles[0],canvas=s.$('.ps-canvas'),rect=canvas.getBoundingClientRect();
      const event=(type,x,y)=>canvas.dispatchEvent(new PointerEvent(type,{button:0,pointerId:1,clientX:rect.left+x/canvas.width*rect.width,clientY:rect.top+y/canvas.height*rect.height,bubbles:true}));
      // Controller calls use the canvas's logical coordinates just like native pointer events.
      if(!s.boneTools.start({x:handle.x,y:handle.y}))throw Error('Gizmo not pickable: '+tool);
      s.boneTools.drag({x:handle.x+18,y:handle.y+14});s.boneTools.gesture=null;
      assert(JSON.stringify(s.model)!==original,'Gizmo did not transform: '+tool);
      await s.command('undo');
    }
    await s.command('move');s.selected='handR';s.refresh();s.animate(0);
    s.selected='footR';s.$('[data-ik="add"]').click();s.frame=0;s.animate(0);
    const ikBefore=JSON.stringify(s.model),pose=s.pose(),{projectPoint}=await import(${JSON.stringify(base)}+'src/player-motion.mjs');
    const point=projectPoint(pose.footR,s.direction),canvas=s.$('.ps-canvas'),rect=canvas.getBoundingClientRect();
    const px=s.viewCenterX+s.panX+point.x*s.scale,py=315+s.panY+point.y*s.scale;
    const event=(x,y)=>({button:0,pointerId:1,clientX:rect.left+x/canvas.width*rect.width,clientY:rect.top+y/canvas.height*rect.height,preventDefault(){}});
    // Direct model-space drag exercises the same handler without native pointer capture.
    const capture=canvas.setPointerCapture;canvas.setPointerCapture=()=>{};
    s.startDrag(event(px,py));s.drag(event(px+22,py-25));s.dragging=null;canvas.setPointerCapture=capture;
    assert(JSON.stringify(s.model)!==ikBefore,'IK drag did not create keys');
    const solved=s.pose(),dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
    assert(Math.abs(dist(solved.kneeR,solved.footR)-dist(s.model.joints.kneeR.position,s.model.joints.footR.position))<.001,'IK changed shin length');
    await s.command('undo');assert(JSON.stringify(s.model)===ikBefore,'IK undo failed');
    await s.command('setup');assert(getComputedStyle(s.$('.ps-timeline')).display==='none','Setup shows animation timeline');
    await s.command('animate');s.$('[data-browser-tab="constraints"]').click();s.animate(0);
    return {tabs:ui.dialog.querySelectorAll('nav button').length,scale:true,undo:true,color:true,gizmos:4,ik:true};
  })()`);
  await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  fs.writeFileSync(path.join(out,'studio-rig-tools.png'),(await win.webContents.capturePage()).toPNG());
  const items=await win.webContents.executeJavaScript(`(()=>{const ui=window.__studioQA;ui.tab='Items';ui.item='dawn_cape';ui.render();ui.itemPreview.direction=4;ui.itemPreview.dirty=true;ui.itemPreview.animate(0);return {sprites:ui.dialog.querySelectorAll('.item-sprite-list canvas').length,icon:!!ui.dialog.querySelector('.item-icon')};})()`);
  if(!items.icon||!items.sprites)throw Error('Item artwork panels empty');
  await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  fs.writeFileSync(path.join(out,'studio-items.png'),(await win.webContents.capturePage()).toPNG());
  const catalog=await win.webContents.executeJavaScript(`(()=>{
    const ui=window.__studioQA;let count=0;
    for(const [id,def] of Object.entries(ui.items).filter(([,def])=>def.slot||def.relic)) {
      ui.item=id;ui.render();ui.itemPreview.direction=4;ui.itemPreview.dirty=true;ui.itemPreview.animate(0);
      if(!ui.dialog.querySelector('.item-icon'))throw Error('Missing icon: '+id);
      count++;
    }
    ui.tab='Players';ui.render();ui.playerStudio.animate(0);
    return count;
  })()`);
  win.setSize(1000,760);
  await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  const narrow=await win.webContents.executeJavaScript(`(()=>{const s=window.__studioQA.playerStudio;const canvas=s.$('.ps-canvas').getBoundingClientRect(),stage=s.$('.ps-stage').getBoundingClientRect(),body=window.__studioQA.dialog.querySelector('.studio-body');if(canvas.left<stage.left-1||canvas.right>stage.right+1||canvas.top<stage.top-1||canvas.bottom>stage.bottom+1)throw Error('Canvas clipped at smaller window');if(body.scrollWidth>body.clientWidth+2)throw Error('Studio has horizontal overflow: '+body.scrollWidth+' / '+body.clientWidth);return true;})()`);
  fs.writeFileSync(path.join(out,'studio-rig-small.png'),(await win.webContents.capturePage()).toPNG());
  for(const id of ['joint','art','details','equipment']) {
    await win.webContents.executeJavaScript(`(()=>{const s=window.__studioQA.playerStudio;s.$('.ps-inspector-tabs [data-section="${id}"]').click();const panels=[...s.root.querySelectorAll('.ps-inspector-panel')].filter(p=>getComputedStyle(p).display!=='none');if(panels.length!==1||panels[0].dataset.section!=='${id}')throw Error('Inspector sections overlap');const tabs=s.$('.ps-inspector-tabs').getBoundingClientRect(),body=s.$('.ps-inspector-body').getBoundingClientRect();if(body.top<tabs.bottom||body.height<100)throw Error('Inspector body collapsed');})()`);
    await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    fs.writeFileSync(path.join(out,'inspector-'+id+'.png'),(await win.webContents.capturePage()).toPNG());
  }
  const sheet=await win.webContents.executeJavaScript(`(()=>{
    const s=window.__studioQA.playerStudio,canvas=document.createElement('canvas');canvas.width=960;canvas.height=360;
    const c=canvas.getContext('2d');c.fillStyle='#343b3e';c.fillRect(0,0,960,360);c.imageSmoothingEnabled=false;
    s.clip='idle';s.frame=0;
    for(let d=0;d<8;d++){
      s.direction=d;const tile=document.createElement('canvas');tile.width=96;tile.height=96;const t=tile.getContext('2d');
      t.translate(48,64);s.definition.draw(t,s.actor(),0,s.model,s.pose());
      c.drawImage(tile,d*120-84,-25,288,288);
      c.fillStyle='#d6e3d8';c.font='16px sans-serif';c.fillText(['S','SW','W','NW','N','NE','E','SE'][d],d*120+50,290);
    }
    return canvas.toDataURL('image/png').split(',')[1];
  })()`);
  fs.writeFileSync(path.join(out,'character-eight-directions.png'),Buffer.from(sheet,'base64'));
  console.log(JSON.stringify({...report,...items,catalog,narrow}));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
