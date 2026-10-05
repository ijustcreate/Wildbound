const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output/polish-profile'));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1200,height:950,webPreferences:{offscreen:true}});try{
 await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
 console.log(await w.webContents.executeJavaScript(`(async()=>{
 const {Game}=await import('./src/core.mjs'),{HeroUI}=await import('./src/hero-ui.mjs'),{Assets}=await import('./src/assets.mjs');const assets=new Assets();await assets.load();const g=new Game(()=>.5),p=g.addPlayer('pad:0');p.inventory=Array.from({length:24},(_,i)=>({type:['sword','potion','stick','starter_boomerang','moon_boomerang','ice_arrow'][i%6],qty:i%6===1?5:1}));p.ui={mode:'pack',index:0};
 p.ui.panel='pack';p.equipment.hand1='sword';p.equipment.head='hat';
 const root=document.createElement('div');root.id='polish-ui';root.style.cssText='position:fixed;inset:0;z-index:99999;background:#193128';document.body.append(root);const ui=new HeroUI(root);ui.draw(g,assets);window.polish={g,p,root,ui,assets};
 const panel=root.querySelector('.hero-panel');if(!panel)throw Error('No inventory');
 const icons=[...panel.querySelectorAll('.item-grid:not(.paper-doll) canvas')];if(icons.length!==24)throw Error('Bag slots lost');if(icons[0].getBoundingClientRect().width<35)throw Error('Icons too small');
 for(const b of panel.querySelectorAll('.paper-doll button')){if(getComputedStyle(b).borderImageSource!=='none')throw Error('Equipment still decorated as buttons');}
 const heights=[];for(const index of [0,7,23]){p.ui.index=index;ui.draw(g,assets);heights.push(root.querySelector('.hero-panel').getBoundingClientRect().height);}if(Math.max(...heights)-Math.min(...heights)>1)throw Error('Navigation changes layout');return 'Inventory 24 slots, icon size, equipment chrome and navigation stability passed';})()`));
 await new Promise(r=>setTimeout(r,700));fs.writeFileSync(path.join(root,'test-output/polish-inventory.png'),(await w.webContents.capturePage()).toPNG());
 console.log(await w.webContents.executeJavaScript(`(async()=>{
 document.querySelector('#polish-ui').remove();const {CARTOON_EFFECTS}=await import('./src/cartoon-fx-presets.mjs'),{loadParticleSprites,drawParticleEffect,beginParticleFrame,particleFrameStats}=await import('./src/particles.mjs');if(!await loadParticleSprites())throw Error('Particle sprites missing');
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=900;canvas.style.cssText='position:fixed;inset:0;width:1200px;height:900px;z-index:99999';document.body.append(canvas);const c=canvas.getContext('2d');
 const paint=()=>{c.fillStyle='#08241f';c.fillRect(0,0,1200,900);beginParticleFrame(c,{budget:768});let i=0;for(const [id,e] of Object.entries(CARTOON_EFFECTS)){const x=(i%6)*200+100,y=Math.floor(i/6)*300+130;c.save();c.translate(x,y);drawParticleEffect(c,id,0,0,e.life*.35,i);c.restore();c.fillStyle='#e8e9cc';c.font='14px system-ui';c.textAlign='center';c.fillText(e.name,x,y+130);i++;}};
 paint();const times=[];for(let n=0;n<120;n++){const start=performance.now();paint();times.push(performance.now()-start);}times.sort((a,b)=>a-b);const stats=particleFrameStats(c);if(stats.drawn>768)throw Error('Particle budget exceeded');window.fxCanvas=canvas;return JSON.stringify({effects:18,CPUmedian:times[60],CPUp95:times[114],stats});})()`));
 await new Promise(r=>setTimeout(r,700));fs.writeFileSync(path.join(root,'test-output/polish-particles.png'),(await w.webContents.capturePage()).toPNG());
 console.log(await w.webContents.executeJavaScript(`(async()=>{
 window.fxCanvas.remove();const {TvWildbound}=await import('./src/tv-wildbound.mjs'),{Animator}=await import('./src/animation.mjs'),{drawMagicBolt}=await import('./src/magic-bolt-render.mjs');const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=900;canvas.style.cssText='position:fixed;inset:0;width:1200px;height:900px;z-index:99999';document.body.append(canvas);const ctx=canvas.getContext('2d'),m=new TvWildbound([window.polish.p],19);m.intro=3;m.draw(ctx,1200,675,new Animator(window.polish.assets));ctx.fillStyle='#071e1e';ctx.fillRect(0,675,1200,225);const colors=['#64dfff','#ff942f','#bd70ff','#ff789b'];for(let i=0;i<4;i++)drawMagicBolt(ctx,{x:180+i*270,y:790,vx:900,vy:-80,color:colors[i],size:14,age:.2,life:1});window.sidePreview={m,canvas};return 'TV side-view and four cached spell projectile styles rendered';})()`));
 await new Promise(r=>setTimeout(r,700));fs.writeFileSync(path.join(root,'test-output/polish-tv-spells.png'),(await w.webContents.capturePage()).toPNG());
 console.log(await w.webContents.executeJavaScript(`(async()=>{
 const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs');const canvas=window.sidePreview.canvas,renderer=new Renderer(canvas,window.polish.assets);const results=[];
 for(const environment of ['forest','house','ice','desert','temple']){const g=new Game(()=>.5);g.environment=environment;g.addPlayer('keyboard');g.start();g.openingBoard=null;g.bloom=3;for(const zoom of [1.5,.8,.35]){renderer.camera.zoom=zoom;g.update(.016,{});renderer.draw(g,.016);results.push(environment+':'+renderer.lod);} }
 return 'Live simulation/render passed in 5 environments × 3 zoom tiers: '+results.join(', ');})()`));
 app.exit(0);
 }catch(e){console.error(e);app.exit(1);}});
