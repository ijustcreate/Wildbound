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
    return {tabs:ui.dialog.querySelectorAll('nav button').length,scale:true,undo:true,color:true,gizmos:4};
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
  console.log(JSON.stringify({...report,...items,catalog,narrow}));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
