const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','merchant-center-'+Date.now());
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'profile'));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:800,webPreferences:{backgroundThrottling:false}}),errors=[];win.webContents.setAudioMuted(true);
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  await win.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);
   const {Game}=await import('./src/core.mjs'),{HeroUI}=await import('./src/hero-ui.mjs'),{Animator}=await import('./src/animation.mjs'),{merchantAction}=await import('./src/traveling-merchant.mjs');
   const g=new Game(()=>.42),p=g.addPlayer('keyboard','Ember'),q=g.addPlayer('pad:0','Scout');for(let n=2;n<6;n++)g.addPlayer('pad:'+(n-1),'Explorer '+(n+1));g.start();g.openingBoard=false;
   Object.assign(p,{coins:1204,x:800,y:900});Object.assign(q,{coins:80,x:800,y:900,controllerFamily:'switch'});
   g.merchant={name:'Marlow Moss',x:800,y:900,stock:[{item:{type:'critter_net',qty:1},price:24},{item:{type:'empty_jar',qty:1},price:4},{item:{type:'critter_cage',qty:1},price:8}],revision:0};
   p.ui={shop:'merchant',panel:'stock',index:0};q.ui=null;
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:99999;background:#183329';document.body.append(host);
   const ui=new HeroUI(host),renderer={animator:new Animator()};ui.draw(g,renderer);
   window.qa={g,p,q,host,ui,renderer,merchantAction,assert:(ok,m)=>{if(!ok)throw Error(m);}};
  })()`);
  const views=[];
  for(const [width,height,count]of [[1280,800,1],[760,500,1],[1000,700,2],[600,430,2],[1280,800,4],[1600,900,6]]){
   const multi=count>1;
   win.setContentSize(width,height);await new Promise(r=>setTimeout(r,120));
   const result=await win.webContents.executeJavaScript(`(()=>{
    const {g,p,q,ui,renderer,assert}=qa;for(let n=1;n<g.players.length;n++)g.players[n].ui=n<${count}?{shop:'merchant',panel:'stock',index:0}:null;ui.draw(g,renderer);
    for(const panel of ui.panels.values()){
     const r=panel.getBoundingClientRect();assert(r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1,'Panel outside viewport');
     const gold=panel.querySelector('.merchant-gold').getBoundingClientRect(),close=panel.querySelector('[data-action="close"]').getBoundingClientRect();assert(gold.right<=close.left||gold.top>=close.bottom,'Gold overlaps close button');
     assert(panel.scrollWidth<=panel.clientWidth+1,'Panel horizontal overflow');
     assert(panel.querySelectorAll('.merchant-row').length===3,'Stock rows');assert(!panel.querySelector('.inventory-xp'),'Unrelated XP');assert(!panel.querySelector('.item-tooltip'),'Floating tooltip');
     assert(panel.querySelector('.merchant-controls').getBoundingClientRect().bottom<=r.bottom-5,'Footer clipped');
     const body=panel.querySelector('.merchant-body');assert(body.clientHeight>90,'No room for merchandise');
     const action=panel.querySelector('.merchant-confirm').getBoundingClientRect();assert(action.bottom<r.bottom&&action.top>body.getBoundingClientRect().bottom-1,'Confirm action clipped');
     const inline=panel.querySelector('.merchant-inline-detail');if(getComputedStyle(inline).display!=='none'){assert(parseFloat(getComputedStyle(inline).fontSize)>=13,'Shrunken detail text');assert(panel.querySelector('.merchant-row.selected').clientHeight<=panel.querySelector('.merchant-list').clientHeight+1,'Selected description does not fit '+innerWidth+'x'+innerHeight+' / '+ui.panels.size+' owners: '+panel.querySelector('.merchant-row.selected').clientHeight+' > '+panel.querySelector('.merchant-list').clientHeight);}
     for(const e of panel.querySelectorAll('.merchant-row,.merchant-detail,.merchant-tabs'))assert(e.scrollWidth<=e.clientWidth+1,'Content horizontal overflow: '+e.className);
    }
    if(q.ui)assert(ui.panels.get(q.id).querySelector('.merchant-controls').textContent.includes('B: Buy'),'Switch accept glyph');
    const s=getComputedStyle(ui.panels.get(p.id).querySelector('.merchant-row.selected'));
    return {width:innerWidth,height:innerHeight,owners:ui.panels.size,selection:[s.borderImage,s.outline,s.boxShadow]};
   })()`);views.push(result);
   await new Promise(r=>setTimeout(r,150));fs.writeFileSync(path.join(out,'shop-'+width+(multi?'-party-'+count:'')+'.png'),(await win.webContents.capturePage()).toPNG());
   if(width===1280&&!multi){const rect=await win.webContents.executeJavaScript('(()=>{const r=qa.ui.panels.get(qa.p.id).getBoundingClientRect();return {x:Math.floor(r.x),y:Math.floor(r.y),width:Math.ceil(r.width),height:Math.ceil(r.height)};})()');fs.writeFileSync(path.join(out,'merchant-preview.png'),(await win.webContents.capturePage(rect)).toPNG());}
  }
  win.setContentSize(1280,800);
  const checks=await win.webContents.executeJavaScript(`(async()=>{
   const {g,p,q,ui,renderer,merchantAction,assert}=qa;const draw=()=>ui.draw(g,renderer);for(const other of g.players.slice(1))other.ui=null;draw();
   let panel=ui.panels.get(p.id),coins=p.coins;panel.querySelector('[data-action="merchant-item-1"]').click();draw();assert(p.coins===coins,'Selection spent gold');
   panel.querySelector('.merchant-confirm').click();draw();assert(p.coins===coins-4,'Buy confirm');assert(panel.querySelector('.merchant-owned').textContent.includes('1'),'Owned quantity stale');
   p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));merchantAction(g,p,'panel:pack');draw();
   for(let i=0;i<23;i++)merchantAction(g,p,'down');draw();const selected=panel.querySelector('.merchant-row.selected'),list=panel.querySelector('.merchant-list');assert(selected.getBoundingClientRect().bottom<=list.getBoundingClientRect().bottom+1,'Controller selection not scrolled');
   merchantAction(g,p,'use');merchantAction(g,p,'panel:buyback');draw();assert(panel.querySelectorAll('.merchant-row').length===1,'Buyback tab');merchantAction(g,p,'use');draw();assert(panel.querySelector('.merchant-empty'),'Empty buyback state');
   p.inventory=[];p.coins=0;merchantAction(g,p,'panel:stock');draw();assert(panel.querySelector('.merchant-confirm').disabled,'Unaffordable enabled');
   p.coins=1204;p.ui={shop:'merchant',panel:'stock',index:0};draw();
   const {tickBoardSequence}=await import('./src/board-sequence.mjs');Object.assign(p,{progress:47,boardProgress:47});g.locked=true;g.turnOrder=[p.id,q.id];g.turn=0;g.houseWorldsEnabled=true;const event=g.event;
   g.roll={playerId:p.id,dice:[4,4],total:8,elapsed:0,startProgress:47,targetProgress:48,landingAt:1.76};tickBoardSequence(g,2);assert(g.roll.centerLanding&&g.event===event&&!g.houseWorlds?.pending,'Center event or travel');
   const {drawBoardScene}=await import('./src/board-art.mjs'),{TRAIL,boardPoint}=await import('./src/board.mjs');
   const canvas=document.createElement('canvas');canvas.width=840;canvas.height=576;const c=canvas.getContext('2d');c.translate(420,288);c.scale(3,3);g.roll.elapsed=5;
   drawBoardScene(c,g,1,{},TRAIL,boardPoint);qa.boardImage=canvas.toDataURL();tickBoardSequence(g,21);assert(g.current===q,'Finished player blocks turn');
   p.ui=null;g.enemies=[];g.scenery=[];g.loot=[];g.terrain.fill('grass');Object.assign(p,{x:800,y:850});g.nearbyLoot=()=>({type:'sword'});g.nearbyArrow=()=>({id:999});g.collect=g.collectArrow=()=>{throw Error('Hold picked up loot');};
   for(let n=0;n<55&&g.phase==='play';n++)g.update(.05,{keyboard:{interact:true,loot:true}});assert(g.phase==='sealing','Hold failed outside own turn');
   return {selection:true,purchase:true,ownedCount:true,sparseAndLongLists:true,buyback:true,empty:true,unaffordable:true,centerNoEvent:true,skipTurn:true,finishPriority:true};
  })()`);
  const board=await win.webContents.executeJavaScript('qa.boardImage');fs.writeFileSync(path.join(out,'center.png'),Buffer.from(board.split(',')[1],'base64'));
  const report={packaged:base!==root,views,checks,errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({out,...report}));app.exit(0);
 }catch(e){console.error(e.stack,errors);app.exit(1);}
});
