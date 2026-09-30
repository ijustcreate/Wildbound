const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'board-xp-profile'));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true}});
 win.webContents.on('console-message',(_e,...args)=>console.log('renderer',...args));
 try{
  await win.loadFile(path.join(root,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  await win.webContents.executeJavaScript(`(async()=>{
   const {Game}=await import('./src/core.mjs'),{drawBoard}=await import('./src/board.mjs'),{HeroUI}=await import('./src/hero-ui.mjs');
   const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.hitTable(p);g.roll.elapsed=g.roll.landingAt+.7;g.resolveRoll();
   const canvas=document.createElement('canvas');canvas.width=1120;canvas.height=760;
   const c=canvas.getContext('2d');
   await new Promise(r=>setTimeout(r,400));
   window.boardReview={g,p,canvas,c,drawBoard,HeroUI};
  })()`);
  for(const [name,scale] of [['board-inlay',1.9],['board-orb',7.8]]){
   const data=await win.webContents.executeJavaScript(`(()=>{const {g,canvas,c,drawBoard}=boardReview;c.setTransform(2,0,0,2,0,0);c.fillStyle='#102c25';c.fillRect(0,0,560,380);c.translate(280,185);c.scale(${scale},${scale});drawBoard(c,g,4,{closeup:true});return canvas.toDataURL();})()`);
   fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  }
  await win.webContents.executeJavaScript(`(()=>{
   const {g,p,HeroUI}=boardReview;const root=document.createElement('div');root.style='position:fixed;inset:0;background:#21382c;z-index:99999';document.body.append(root);
   g.phase='lobby';p.xp=27;g.openInventory(p);const ui=new HeroUI(root);ui.draw(g,{});Object.assign(boardReview,{root,ui});
   const bar=root.querySelector('[aria-label="Experience to next level"]');if(!bar||bar.getAttribute('aria-valuenow')!=='27'||bar.getAttribute('aria-valuemax')!=='50')throw Error('XP bar values wrong');
   p.xp=35;ui.draw(g,{});if(root.querySelector('.inventory-xp-label').textContent!=='35 / 50 XP')throw Error('XP bar stale');
   const options=[...document.querySelector('#event-duration').options].map(o=>o.value);if(!['1','3','5','7','12','20'].every(v=>options.includes(v)))throw Error('Duration options missing');
  })()`);
  for(const [width,height] of [[1280,900],[390,844]]){
   win.setSize(width,height);await new Promise(r=>setTimeout(r,250));
   await win.webContents.executeJavaScript(`(()=>{const {g,ui,root}=boardReview;ui.draw(g,{});const bar=root.querySelector('.inventory-xp'),label=root.querySelector('.inventory-xp-label');if(bar.clientWidth<80||label.scrollWidth>label.clientWidth)throw Error('XP label overflows');})()`);
   fs.writeFileSync(path.join(out,'xp-inventory-'+width+'.png'),(await win.webContents.capturePage()).toPNG());
  }
  await win.webContents.executeJavaScript(`(async()=>{
   const {g,p,ui,root}=boardReview,{SLOTS,give}=await import('./src/items.mjs');
   p.device='pad:0';p.controllerFamily='xbox';p.equipment.hand1='sword';p.inventory=[];give(p.inventory,'azure_bead');give(p.inventory,'moon_prism');
   p.ui.panel='gear';p.ui.index=SLOTS.indexOf('hand1');ui.draw(g,{});
   const tip=root.querySelector('.item-tooltip');if(!tip||tip.hidden)throw Error('Controller tooltip missing');
   g.inventoryAction(p,'down');ui.draw(g,{});if(root.querySelector('.paper-doll .selected')?.dataset.slot!=='gloves')throw Error('Glove selection failed');
   p.ui.index=SLOTS.indexOf('hand1');g.inventoryAction(p,'sockets');ui.draw(g,{});
   g.inventoryAction(p,'down');ui.draw(g,{});if(p.ui.socket.index!==1)throw Error('Socket navigation failed');
   g.inventoryAction(p,'use');ui.draw(g,{});if(!root.querySelector('.socket-confirmation'))throw Error('Missing confirmation');
   g.inventoryAction(p,'close');ui.draw(g,{});if(!p.ui.socket||p.ui.socket.confirm)throw Error('B did not cancel safely');
   g.inventoryAction(p,'use');g.inventoryAction(p,'use');ui.draw(g,{});if(p.equipmentSockets.hand1[0]!=='moon_prism')throw Error('Socket insertion failed');
  })()`);
  for(const [width,height] of [[1280,900],[390,844],[844,390]]){
   win.setSize(width,height);await new Promise(r=>setTimeout(r,180));
   await win.webContents.executeJavaScript(`(()=>{const {g,ui,root}=boardReview;ui.draw(g,{});const panel=root.querySelector('.hero-panel'),footer=root.querySelector('.socket-actions');if(footer.getBoundingClientRect().bottom>panel.getBoundingClientRect().bottom+1)throw Error('Socket footer clipped');})()`);
   fs.writeFileSync(path.join(out,'socket-'+width+'.png'),(await win.webContents.capturePage()).toPNG());
  }
  const arrows=await win.webContents.executeJavaScript(`(async()=>{const {drawEmbeddedArrow,drawFlyingArrow}=await import('./src/embedded-arrow.mjs');const canvas=document.createElement('canvas');canvas.width=800;canvas.height=400;const c=canvas.getContext('2d');c.fillStyle='#937c55';c.fillRect(0,0,800,400);c.scale(3,3);for(let i=0;i<8;i++){const x=35+(i%4)*63,y=35+Math.floor(i/4)*63;drawEmbeddedArrow(c,{x,y,angle:i*Math.PI/4,embedded:true,embedDepth:7});}return canvas.toDataURL();})()`);
  fs.writeFileSync(path.join(out,'arrow-impact-directions.png'),Buffer.from(arrows.split(',')[1],'base64'));
  console.log('Board, arrows, XP header, glove navigation, controller tooltips, socket selection/confirmation/cancellation and responsive layout verified.');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
