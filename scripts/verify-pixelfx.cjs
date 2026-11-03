const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/pixelfx',process.env.PIXELFX_STAGE||'source');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-pixelfx-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadFile(path.join(process.env.WILDBOUND_APP_ROOT||root,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame;window.pfxOriginalRAF=raf;window.requestAnimationFrame=()=>0;await new Promise(raf);
   const {ParticleEditor}=await import('./src/particle-editor.mjs'),{effects,DEFAULT_EFFECTS,drawParticleEffect,beginParticleFrame,validEffect}=await import('./src/particles.mjs'),{PIXELFX_EFFECTS,PIXELFX_MODULES,pixelFxSurface,pixelFxCacheStats,clearPixelFxCache}=await import('./src/pixelfx-runtime.mjs');
   const checks=[],images={},check=(name,passed)=>{checks.push({name,passed:!!passed});if(!passed)throw Error(name);};
   const select=(root,label)=>root.querySelector('[aria-label="'+label+'"]'),input=(root,label,value)=>{const e=select(root,label);e.value=value;e.dispatchEvent(new Event('input'));return e;};
   const panel=document.createElement('dialog');panel.style.cssText='width:1150px;max-width:95vw;max-height:94vh;overflow:auto';document.body.append(panel);panel.showModal();const root=document.createElement('section');panel.append(root);const editor=new ParticleEditor();editor.mount(root);
   check('244 catalog entries available',Object.keys(PIXELFX_EFFECTS).length===244);check('portal opens first',editor.draft.pixelfx==='arcane/portal');check('portal defaults to storage binding',select(root,'Gameplay particle slot').value==='storage-portal');
   input(root,'PixelFX width','20');check('native width editable',editor.draft.pxOptions.width===20);input(root,'palette 1','#120423');check('palette editable',editor.draft.pxOptions.palette[0]==='#120423');
   input(root,'Rotation (degrees)','25');const mirror=select(root,'Mirror');mirror.click();check('transform editable',editor.draft.pxAngle===25&&editor.draft.pxFlip);
   input(root,'Preview time','.8');check('scrub pauses',!editor.playing&&editor.time===.8);
   root.querySelector('[data-action=save]').click();const saved=JSON.parse(localStorage.getItem('wildbound-particles-v1'));check('native parameters persisted',saved[editor.id].pxOptions.width===20);
   const slot=select(root,'Gameplay particle slot');slot.value='storage-portal';root.querySelector('[data-action=bind]').click();check('gameplay portal binding',effects['storage-portal'].pxOptions.width===20);
   root.querySelector('[data-action=restore-binding]').click();check('portal restored',effects['storage-portal'].pxScale===1.2&&!effects['storage-portal'].pxOptions.width);
   const file=new File([JSON.stringify({...editor.draft,name:'Imported portal test'})],'portal.json',{type:'application/json'});await root.querySelector('input[type=file]').onchange({target:{files:[file]}});check('native JSON import retains module and settings',editor.draft.name==='Imported portal test'&&editor.draft.pixelfx==='arcane/portal'&&editor.draft.pxOptions.width===20);root.querySelector('[data-action=reset]').click();editor.time=.9;editor.playing=false;root.querySelector('[data-action=restart]').click();check('restart at zero',editor.time===0);
   input(root,'Search effects','lightning');check('search filters',editor.galleryEffects().length>5&&editor.galleryEffects().every(([id,e])=>[id,e.name,e.description].join(' ').toLowerCase().includes('lightning')));
   input(root,'Search effects','');const cat=select(root,'Effect category');cat.value='arcane';cat.dispatchEvent(new Event('change'));check('category filters',editor.galleryEffects().length===12);
   root.querySelector('[data-action=sheet]').click();const preview=select(root,'Live particle preview'),rect=preview.getBoundingClientRect();preview.dispatchEvent(new MouseEvent('click',{clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2}));check('gallery selects real effect',!editor.sheet&&editor.draft.pixelfx.startsWith('arcane/'));
   for(const [id,e]of Object.entries(PIXELFX_EFFECTS)){const a=pixelFxSurface(e,e.life*.4,4);check('canvas renders '+id,!!a&&a.getContext('2d').getImageData(0,0,a.width,a.height).data.some(v=>v));}
   check('raster cache bounded',pixelFxCacheStats().surfaces<=32);
   const portal=DEFAULT_EFFECTS['storage-portal'];clearPixelFxCache();const pixels=t=>{const a=pixelFxSurface(portal,t,4);return new Uint8ClampedArray(a.getContext('2d').getImageData(0,0,a.width,a.height).data);};
   const first=pixels(.8),second=pixels(1.2),rewind=pixels(.8);check('portal animates',first.some((v,i)=>v!==second[i]));check('portal deterministic rewind',first.every((v,i)=>v===rewind[i]));
   const choose=select(root,'Particle effect');choose.value='pfx-arcane-portal';choose.dispatchEvent(new Event('change'));editor.time=.8;editor.playing=false;editor.category='all';editor.search='';editor.mount(root);
   window.pfxReview={editor,panel,root};
   const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs'),{HeroUI}=await import('./src/hero-ui.mjs');
   const assets=new Assets();await assets.load();const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=800;canvas.style.cssText='width:1280px;height:800px';document.body.append(canvas);const r=new Renderer(canvas,assets),g=new Game(()=>.5),p=g.addPlayer('keyboard','Portal review');g.start();g.openingBoard=false;g.time=.8;g.scenery=[];g.terrain.fill('grass');p.x=p.y=400;g.portal(p);const door=g.portals.find(d=>d.owner===p.id);r.camera={x:door.x,y:door.y,zoom:2.5};r.draw(g,0);images['world-portal']=canvas.toDataURL();p.x=door.x;p.y=door.y;g.enterRoom(p,door);check('storage entry still works',p.room===door.id);
   const room=document.createElement('canvas');room.width=640;room.height=480;room.style.cssText='width:640px;height:480px';p.roomX=240;p.roomY=170;r.camera.zoom=1.2;const ui=new HeroUI(document.createElement('div'));ui.room(room,g,p,door,r);images['storage-return']=room.toDataURL();g.leaveRoom(p);check('storage return still works',p.room===null);
   const {drawPortal}=await import('./src/portal-art.mjs');const close=document.createElement('canvas');close.width=600;close.height=300;const c=close.getContext('2d');c.fillStyle='#171320';c.fillRect(0,0,600,300);c.scale(2,2);for(const [i,t]of [null,1,.2].entries())drawPortal(c,{x:50+i*100,y:120,owner:1,closing:t},.8,'PRIVATE STORAGE');images['portal-collapse']=close.toDataURL();
   return {checks,images,cache:pixelFxCacheStats()};
  })().catch(e=>{throw Error(e.stack)})`);
  for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
  await w.webContents.executeJavaScript('window.pfxReview.editor.playing=false; window.pfxReview.editor.time=.8; window.requestAnimationFrame=window.pfxOriginalRAF; window.pfxReview.editor.mount(window.pfxReview.root);window.pfxReview.editor.renderPreview(performance.now());if(!window.pfxReview.panel.open)throw Error("Editor dialog closed");');
  await w.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');await new Promise(resolve=>setTimeout(resolve,350));fs.writeFileSync(path.join(out,'editor.png'),(await w.webContents.capturePage()).toPNG());
  w.setSize(700,820);await new Promise(resolve=>setTimeout(resolve,200));fs.writeFileSync(path.join(out,'editor-narrow.png'),(await w.webContents.capturePage()).toPNG());
  const narrow=await w.webContents.executeJavaScript('({width:window.innerWidth,overflow:window.pfxReview.root.scrollWidth>window.pfxReview.root.clientWidth+2})');result.checks.push({name:'narrow editor fits',passed:!narrow.overflow});
  const preview=await w.webContents.executeJavaScript('Array.from(window.pfxReview.root.querySelector("canvas").getContext("2d").getImageData(0,0,720,420).data).filter((v,i)=>i%4===0&&v>100).length');result.checks.push({name:'editor preview has bright effect pixels',passed:preview>50});result.errors=errors;result.failed=result.checks.filter(c=>!c.passed).length+errors.length;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({checks:result.checks.length,failed:result.failed,errors,out}));w.destroy();app.exit(result.failed?1:0);
 }catch(e){console.error(e);w.destroy();app.exit(1);}
});
