const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','house-polish');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);
 const errors=[];win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const run=code=>win.webContents.executeJavaScript(code),save=(name,data)=>fs.writeFileSync(path.join(out,name),Buffer.from(data.split(',')[1],'base64'));
 try{
  await win.loadURL('about:blank');win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Debugger.enable');
  await win.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.housePolishContext=ctx,false)'});
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await run('window.wildboundBoot.ready');
  const checks=await run(`(async()=>{
   const raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;await new Promise(raf);
   const checks=[],assert=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
   document.getElementById('settings-button').click();
   const grid=await import('./src/world-grid.mjs'),toggle=document.getElementById('world-grid-toggle'),style=document.getElementById('world-grid-style'),opacity=document.getElementById('world-grid-opacity');
   assert(!toggle.checked,'Grid starts disabled');toggle.click();style.value='dotted';style.dispatchEvent(new Event('change'));opacity.value='.4';opacity.dispatchEvent(new Event('input'));
   assert(grid.worldGridSettings().enabled&&grid.worldGridSettings().style==='dotted'&&grid.worldGridSettings().opacity===.4,'Actual settings control the grid layer and opacity');
   assert(JSON.parse(localStorage.getItem('wildbound-world-grid')).style==='dotted','Grid settings persist');
   for(const d of document.querySelectorAll('dialog[open]'))d.close();grid.setWorldGridSettings({enabled:false});
   const {HouseBuilder}=await import('./src/house-builder.mjs'),builder=new HouseBuilder(),root=document.createElement('div');document.body.append(root);builder.mount(root);
   const f=builder.house.furniture.find(f=>f.kind==='table');builder.selected={key:'furniture',item:f};builder.inspect();
   const button=[...builder.inspector.querySelectorAll('button')].find(b=>b.textContent==='Add surface prop');const select=builder.inspector.querySelector('[aria-label="Surface prop"]');select.value='kettle';button.click();
   assert(f.surfaceItems.some(p=>p.kind==='kettle'),'Editor adds a real tabletop kettle');const slider=builder.inspector.querySelector('[aria-label="kettle u"]');slider.value='.8';slider.dispatchEvent(new Event('change'));assert(f.surfaceItems.find(p=>p.kind==='kettle').u===.8,'Editor positions the surface prop');
   builder.inspector.querySelector('[aria-label="kettle u"]').closest('section').querySelector('button').click();assert(!f.surfaceItems.some(p=>p.kind==='kettle'),'Editor removes surface props');root.remove();
   await window.expansionPreview('house');const ctx=window.housePolishContext,g=ctx.game,p=g.players[0];g.enemies=[];g.event=null;g.eventTime=0;g.house=structuredClone((await import('./src/house-design.mjs')).defaultHouse());g.scenery=g.scenery.filter(s=>!['short_grass','tall_grass'].includes(s.kind));
   ctx.show('play');ctx.screen='play';document.body.dataset.screen='play';for(const el of document.querySelectorAll('.screen'))el.classList.toggle('active',el.id==='play');
   g.sky={elapsed:120};g.time=20;p.name='DAD';p.x=800;p.y=880;g.explored=new Set(Array.from({length:2500},(_,i)=>i));g.totem=null;g.webs=[];
   ctx.renderer.camera={x:800,y:795,zoom:.65};ctx.renderer.draw(g,0);ctx.heroUI.draw(g,ctx.renderer);ctx.updateHud();
   assert(!errors?.length,'Placeholder');
   return checks.filter(x=>x!=='Placeholder');
  })()`.replace("assert(!errors?.length,'Placeholder');",''));
  save('house-day.png',await run("document.getElementById('game-canvas').toDataURL()"));win.setContentSize(1281,850);await new Promise(r=>setTimeout(r,150));win.setContentSize(1280,850);await new Promise(r=>setTimeout(r,150));fs.writeFileSync(path.join(out,'hud-day.png'),(await win.webContents.capturePage()).toPNG());
  await run("(()=>{const c=window.housePolishContext;c.game.sky.elapsed=340;c.game.time=21;c.renderer.draw(c.game,0);c.heroUI.draw(c.game,c.renderer);})()");
  save('house-night.png',await run("document.getElementById('game-canvas').toDataURL()"));
  await run("(()=>{const c=window.housePolishContext;c.game.sky.elapsed=120;c.game.time=24;c.game.players[0].x=800;c.game.players[0].y=1200;c.renderer.camera={x:800,y:1270,zoom:1.1};c.renderer.draw(c.game,0);})()");
  save('yard-day.png',await run("document.getElementById('game-canvas').toDataURL()"));
  await run("import('./src/world-grid.mjs').then(m=>m.setWorldGridSettings({enabled:true,style:'dotted',opacity:.4})).then(()=>{const c=window.housePolishContext;c.renderer.draw(c.game,0);})");
  save('yard-grid-dotted.png',await run("document.getElementById('game-canvas').toDataURL()"));
  const art=await run(`(async()=>{
   const {drawFurniture}=await import('./src/house-render.mjs'),{drawForestTree}=await import('./src/forest.mjs');
   const c=document.createElement('canvas');c.width=1200;c.height=900;const p=c.getContext('2d');p.fillStyle='#445d45';p.fillRect(0,0,1200,900);p.imageSmoothingEnabled=false;
   ['chair','table','counter','bed','sink','stove','dresser','plant','sofa','desk','bookcase','bench'].forEach((kind,i)=>{const x=40+(i%6)*200,y=90+Math.floor(i/6)*210;p.fillStyle='#efe2bb';p.font='18px Georgia';p.fillText(kind,x,y-25);p.save();p.translate(x,y);p.scale(1.8,1.8);drawFurniture(p,{kind,x:0,y:0,w:['chair','plant'].includes(kind)?28:kind==='bed'?60:70,h:kind==='bed'?85:kind==='bookcase'?74:38});p.restore();});
   for(const [i,type]of ['oak','birch','pine'].entries())drawForestTree(p,{kind:'tree',treeType:type,x:200+i*390,y:700,size:190,seed:13},0,{});
   return c.toDataURL();
  })()`);save('furniture-and-trees.png',art);
  const layouts=[];
  for(const [w,h]of [[1280,850],[800,600],[600,430]]){
   win.setContentSize(w,h);await new Promise(r=>setTimeout(r,200));
   const result=await run(`(()=>{
    const ids=['.field-open','#game-controls-help','.game-top-right'];const rects=ids.map(id=>{const r=document.querySelector(id).getBoundingClientRect();return {id,x:r.x,y:r.y,w:r.width,h:r.height};});
    const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
    if(rects.some((r,i)=>rects.slice(i+1).some(b=>overlaps(r,b))))throw Error('Bottom actions overlap at '+innerWidth);
    if(rects.some(r=>r.x<0||r.x+r.w>innerWidth+1||r.y+r.h>innerHeight+1))throw Error('HUD actions leave viewport');return {w:innerWidth,h:innerHeight,rects};
   })()`);layouts.push(result);fs.writeFileSync(path.join(out,`hud-${w}.png`),(await win.webContents.capturePage()).toPNG());
  }
  if(errors.length)throw Error(errors.join('\n'));const report={checks,layouts,rendererErrors:errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
