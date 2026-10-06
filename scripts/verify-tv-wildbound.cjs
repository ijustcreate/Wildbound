const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');
const base=process.env.WILDBOUND_VERIFY_APP||(process.argv.includes('--packaged')?path.join(root,'dist',require('../package.json').version,'Wildbound-win32-x64/resources/app.asar'):root);
app.disableHardwareAcceleration();
app.setPath('userData',path.join(root,'test-output/tv-wildbound-profile'));
app.whenReady().then(async()=>{
  const window=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{offscreen:true}});
  const errors=[];window.webContents.on('console-message',(_,level,message)=>{if(level>=3)errors.push(message);});
  try{
    await window.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
    await window.webContents.executeJavaScript('window.wildboundBoot.ready');
    console.log(await window.webContents.executeJavaScript('window.verifyLobbyStorageAndTvControls()'));
    console.log('Lobby fixture collision/interaction:',await window.webContents.executeJavaScript('window.verifyLobbyCollision()'));
    const lobbyPng=await window.webContents.executeJavaScript('document.querySelector(".lobby-world canvas").toDataURL()');
    fs.mkdirSync(path.join(root,'test-output'),{recursive:true});
    fs.writeFileSync(path.join(root,'test-output/lobby-totem-1.0.66.png'),Buffer.from(lobbyPng.split(',')[1],'base64'));
    const flow=await window.webContents.executeJavaScript('window.verifyTvWildboundFlow()');
    if(flow.players!==2||flow.phase!=='lobby')throw Error('Integrated lobby transition failed');
    fs.mkdirSync(path.join(root,'test-output'),{recursive:true});
    fs.writeFileSync(path.join(root,'test-output/tv-wildbound-integration.png'),Buffer.from(flow.png.split(',')[1],'base64'));
    const result=await window.webContents.executeJavaScript(`(async()=>{
      const {TvWildbound,TV_BOARD_X}=await import('./src/tv-wildbound.mjs');
      const {Animator}=await import('./src/animation.mjs');
      const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=850;
      const c=canvas.getContext('2d'),animator=new Animator();
      const hero={id:'one',name:'Scout',appearance:{},equipment:{},inventory:[]},mode=new TvWildbound([hero],42);
      for(let i=0;i<18;i++)mode.step(.05,{});
      mode.draw(c,canvas.width,canvas.height,animator);
      const warning=canvas.toDataURL('image/png');
      for(let i=0;i<57;i++)mode.step(.05,{});
      const p=mode.players.get('one');p.x=TV_BOARD_X;p.face=1;
      mode.step(.016,{one:{attack:true}});
      mode.draw(c,canvas.width,canvas.height,animator);
      const intro=canvas.toDataURL('image/png');
      for(let i=0;i<90;i++)mode.step(.05,{});
      const layers=mode.landscapeLayers,edges={};
      for(const [name,camera]of [['left',0],['right',3840]]){
        mode.camera=camera;p.x=camera+430;mode.draw(c,canvas.width,canvas.height,animator);edges[name]=canvas.toDataURL();
        if(mode.landscapeLayers!==layers)throw Error('Landscape cache was rebuilt');
        for(const [x,y]of [[0,100],[1919,100],[0,650],[1919,650]]){const pixel=c.getImageData(x,y,1,1).data;if(pixel[0]===16&&pixel[1]===29&&pixel[2]===35)throw Error('Unpainted panoramic edge');}
      }
      p.x=1830;mode.camera=1450;mode.draw(c,canvas.width,canvas.height,animator);
      const png=canvas.toDataURL('image/png');
      const block=mode.blocks[10];p.x=block.x;p.y=437;p.vy=0;p.grounded=true;p.jumpHeld=false;mode.enemies=[];mode.camera=block.x-350;
      mode.step(.05,{one:{jump:true}});if(!block.used||mode.loot.length!==1||mode.blockParticles.length!==12)throw Error('Question block reward/particles failed');
      mode.draw(c,canvas.width,canvas.height,animator);const blocks=canvas.toDataURL();
      for(let i=0;i<25;i++)mode.step(.05,{});if(mode.blockParticles.length||!hero.inventory.some(i=>i?.type==='unknown_mushroom'))throw Error('Mushroom pickup or shard expiry failed');
      canvas.width=640;canvas.height=360;mode.draw(c,canvas.width,canvas.height,animator);
      const small=canvas.toDataURL('image/png');canvas.width=1920;canvas.height=850;mode.progress=48;p.x=4710;mode.finish();mode.draw(c,canvas.width,canvas.height,animator);
      return {warning,intro,png,blocks,...edges,small,victory:canvas.toDataURL(),progress:mode.progress,camera:mode.camera,cachedLayers:layers.length,rewardCount:mode.victoryRewards.length};
    })().catch(e=>({error:e.stack}))`);
    if(result.error)throw Error(result.error);
    for(const [key,file] of [['warning','tv-wildbound-warning.png'],['intro','tv-wildbound-board.png'],['png','tv-wildbound-panorama.png'],['small','tv-wildbound-small.png'],['blocks','tv-wildbound-blocks.png'],['left','tv-wildbound-left.png'],['right','tv-wildbound-right.png'],['victory','tv-wildbound-victory.png']]){
      fs.writeFileSync(path.join(root,'test-output',file),Buffer.from(result[key].split(',')[1],'base64'));delete result[key];
    }
    await window.webContents.executeJavaScript(`(async()=>{
      const {Game}=await import('./src/core.mjs'),{HeroUI}=await import('./src/hero-ui.mjs'),{TvWildbound}=await import('./src/tv-wildbound.mjs');
      const g=new Game(()=>.5),p=g.addPlayer('keyboard','Scout'),q=g.addPlayer('pad:0','Ember');p.inventory=[];q.inventory=[];
      const mode=new TvWildbound([p,q],42);mode.finish();Object.defineProperty(g,'tvWorld',{value:mode,configurable:true});
      const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:99999;background:#193128';document.body.append(host);
      const ui=new HeroUI(host);g.openInventory(p,'tv-victory');ui.draw(g);window.tvTreasureQa={g,p,q,ui,host};
    })()`);
    for(const height of [850,600,420]){
      window.setContentSize(1280,height);await new Promise(r=>setTimeout(r,350));
      const layout=await window.webContents.executeJavaScript(`(()=>{try{
        const {g,p,ui,host}=window.tvTreasureQa;ui.draw(g);host.querySelector('.item-tooltip')?.remove();const panel=ui.panels.get(p.id),r=panel.getBoundingClientRect();
        for(const node of panel.querySelectorAll('button,small.storage-help,.loot-notice')){const b=node.getBoundingClientRect();if(b.top<r.top-1||b.bottom>r.bottom+1||b.left<r.left-1||b.right>r.right+1)throw Error('Treasure UI escapes panel at '+innerHeight+': '+node.textContent);}
        const slots=[...panel.querySelectorAll('.storage-slots button')];if(slots.length!==24||slots.some(b=>b.getBoundingClientRect().height<18))throw Error('Treasure slots collapsed');
        return {treasureViewport:innerHeight,slots:slots.length,panel:[r.width,r.height]};
      }catch(e){return {error:e.stack};}})()`);if(layout.error)throw Error(layout.error);console.log(layout);
    }
    window.setContentSize(1280,850);await new Promise(r=>setTimeout(r,350));
    console.log(await window.webContents.executeJavaScript(`(()=>{const {g,p,q,ui,host}=window.tvTreasureQa;g.openInventory(q,'tv-victory');ui.draw(g);if(ui.panels.size!==2)throw Error('Lost co-op treasure panel');g.inventoryAction(q,'lootAll');ui.draw(g);if(g.storageFor(p).some(Boolean)||p.inventory.length||q.inventory.filter(Boolean).length!==7)throw Error('Shared treasure ownership failed');for(const panel of ui.panels.values())if(panel.querySelector('[data-action="tvReturn"]').disabled)throw Error('Co-op empty chest return did not update');return 'Treasure chest: 24 visible slots, small windows and two shared party panels passed';})()`));
    if(errors.length)throw Error('Renderer errors: '+errors.join(' | '));
    if(!result.progress||result.camera<1000||result.cachedLayers!==3)throw Error('Mode verification failed: '+JSON.stringify(result));
    console.log(JSON.stringify({...result,integratedPlayers:flow.players}));app.exit(0);
  }catch(error){console.error(error.stack||error);app.exit(1);}
});
