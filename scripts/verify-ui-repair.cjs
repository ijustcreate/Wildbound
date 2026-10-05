const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();
app.setPath('userData',fs.mkdtempSync(path.join(root,'test-output/ui-repair-profile-')));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{offscreen:true,backgroundThrottling:false}});
 try{
  await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'),{query:{tools:'1'}});await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  w.webContents.focus();
  console.log(await w.webContents.executeJavaScript(`(async()=>{
   await window.showcase('game');document.querySelector('#pause-button').click();const dialog=document.querySelector('#pause-dialog');
   const {focusDialogControl}=await import('./src/dialog-navigation.mjs');
   const buttons=[...dialog.querySelectorAll('button:not(:disabled)')].filter(b=>b.getClientRects().length);
   for(const b of buttons){focusDialogControl(dialog,b);const selected=[...dialog.querySelectorAll('.menu-focus')];if(selected.length!==1||selected[0]!==b)throw Error('Focus selection did not follow '+b.id+'; active='+document.activeElement.id+'; selected='+selected.map(e=>e.id));const css=getComputedStyle(b);if(parseFloat(css.outlineWidth)<2||!css.borderImageSource.includes('button-selected'))throw Error('Controller focus highlight missing on '+b.id+': '+css.outlineWidth+' '+css.borderImageSource);}
   const frame=()=>new Promise(r=>setTimeout(r,160));
   for(const id of ['Xbox Wireless Controller','Nintendo Switch Pro Controller']){
    const pad={index:0,id,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});await frame();
    const press=async index=>{pad.buttons[index]={pressed:true,value:1};await frame();pad.buttons[index]={pressed:false,value:0};await frame();};
    document.querySelector('#pause-fullscreen').focus();await press(15);if(document.activeElement.id!=='pause-pvp')throw Error('D-pad right skipped PvP');
    await press(13);if(document.activeElement.id!=='pause-mute')throw Error('D-pad down selected '+document.activeElement.id);
    await press(14);if(document.activeElement.id!=='pause-difficulty')throw Error('D-pad left skipped Difficulty');
   }
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[]});document.querySelector('#pause-difficulty').focus();document.activeElement.scrollIntoView({block:'center'});
   window.testDialog=dialog;return 'Every pause option has one persistent gold highlight; simulated Xbox and Switch D-pad navigation follows the grid';})()`));
  await new Promise(r=>setTimeout(r,200));fs.writeFileSync(path.join(root,'test-output/workbench-pause-focus.png'),(await w.webContents.capturePage()).toPNG());
  console.log(await w.webContents.executeJavaScript(`(async()=>{
   const {Game}=await import('./src/core.mjs'),{ITEMS,count}=await import('./src/items.mjs'),{createGameDebug}=await import('./src/game-debug.mjs');const g=new Game(()=>.5),p=g.addPlayer('pad:0','First'),q=g.addPlayer('pad:1','Second');g.start();g.scenery=[];g.terrain.fill('grass');p.inventory=[];q.inventory=[];
   const menu=createGameDebug({getGame:()=>g,events:[],items:ITEMS});menu.open(window.testDialog,q);const consoleEl=window.testDialog.querySelector('.game-debug-console');consoleEl.querySelector('[data-debug=item]').value='sword_of_a_thousand_truths';consoleEl.querySelector('[data-debug-spawn=inventory]').click();
   if(count(p,'sword_of_a_thousand_truths')!==0||count(q,'sword_of_a_thousand_truths')!==1)throw Error('Dev UI gives items to wrong player');
   q.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));consoleEl.querySelector('[data-debug-spawn=inventory]').click();if(!consoleEl.querySelector('[role=status]').textContent.includes('Backpack full'))throw Error('Full inventory success message');
   consoleEl.querySelector('[data-debug-spawn=ground]').click();if(g.loot.at(-1).type!=='sword_of_a_thousand_truths')throw Error('Ground spawn missing');
   menu.open(window.testDialog,p);consoleEl.querySelector('[data-debug=item]').value='potion';consoleEl.querySelector('[data-debug=amount]').value=3;consoleEl.querySelector('[data-debug-spawn=inventory]').click();if(count(p,'potion')!==3||count(q,'potion'))throw Error('Reused menu retains wrong owner');
   for(const b of consoleEl.querySelectorAll('.debug-item-actions button'))if(b.scrollWidth>b.clientWidth+2)throw Error('Dev action text clipped');return 'Dev console actual buttons: inventory owner, reopen owner, full backpack error and ground spawn passed';})()`));
  await new Promise(r=>setTimeout(r,200));fs.writeFileSync(path.join(root,'test-output/workbench-dev-spawn.png'),(await w.webContents.capturePage()).toPNG());
  console.log(await w.webContents.executeJavaScript('window.verifyDevOwnerRouting()'));
  console.log(await w.webContents.executeJavaScript(`(async()=>{
   window.testDialog.close();const {drawForestTree,drawPalmTree}=await import('./src/forest.mjs');const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=1000;canvas.style.cssText='position:fixed;inset:0;z-index:999999';document.body.append(canvas);window.artCanvas=canvas;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#33483e';c.fillRect(0,0,1440,1000);
   for(let row=0;row<5;row++)for(let col=0;col<5;col++){
    const type=['oak','birch','pine','snow_tree','palm'][row],p={x:col*280+90,y:row*190+147,size:84,kind:type==='palm'?'palm':type==='snow_tree'?'snow_tree':'tree',treeType:type==='snow_tree'?'pine':type,seed:87,falling:[0,.25,.65,1.1,0][col],fallen:col===4,fallDirection:1};
    c.fillStyle=type==='snow_tree'?'#bfcdd1':'#587755';c.fillRect(col*280,row*190+153,274,35);c.save();c.fillStyle='#132c2444';c.beginPath();c.ellipse(p.x,p.y+p.size*(type==='palm'?.19:.35)+3,28,8,0,0,Math.PI*2);c.fill();(type==='palm'?drawPalmTree:drawForestTree)(c,p,0,{generatedEnvironment:type==='snow_tree'?'ice':'forest'});c.restore();c.fillStyle='#f4e6be';c.font='13px system-ui';c.fillText(type+' · '+['standing','lean','fall','land','stump'][col],col*280+12,row*190+18);
   }return 'Oak, birch, pine, snowy pine and palm: 25 standing/falling/stump poses rendered';})()`));
  fs.writeFileSync(path.join(root,'test-output/workbench-tree-fall.png'),Buffer.from((await w.webContents.executeJavaScript('window.artCanvas.toDataURL()')).split(',')[1],'base64'));
  console.log(await w.webContents.executeJavaScript(`(async()=>{
   const {drawPlayer,playerMotion,directionVector}=await import('./src/player-motion.mjs');const canvas=window.artCanvas,c=canvas.getContext('2d');c.fillStyle='#182d28';c.fillRect(0,0,1440,1000);
   for(let row=0;row<5;row++)for(let col=0;col<6;col++){
    const action=['idle','swipe_one','swipe_two','swipe_big','sword_combo'][row],t=[0,.2,.4,.5,.68,1][col],d=row%2?6:0,[faceX,faceY]=directionVector(d),frame=t*(playerMotion.clips[action].length-1);
    c.save();c.translate(95+col*235,145+row*190);c.scale(2.4,2.4);drawPlayer(c,{hp:100,faceX,faceY,animationAction:action,playerFrame:frame,equipment:{hand1:'krampus_whip'}},0,playerMotion);c.restore();c.fillStyle='#eee4c7';c.font='13px system-ui';c.fillText(action+' · '+t,12+col*235,28+row*190);
   }return '30 full-character whip poses rendered, including both swing directions, heavy swing, combo and idle';})()`));
  fs.writeFileSync(path.join(root,'test-output/workbench-whip.png'),Buffer.from((await w.webContents.executeJavaScript('window.artCanvas.toDataURL()')).split(',')[1],'base64'));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
