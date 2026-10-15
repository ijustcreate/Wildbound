const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const child=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename],{cwd:root,env,encoding:'utf8',timeout:180000,windowsHide:true});
 if(child.stdout)process.stdout.write(child.stdout);if(child.stderr)process.stderr.write(child.stderr);if(child.error)console.error(child.error);process.exit(child.status??1);
}
const {app,BrowserWindow}=require('electron');
const out=path.join(root,'test-output','event-test-board-'+Date.now());fs.mkdirSync(out,{recursive:true});
app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'profile'));
const deadline=setTimeout(()=>app.exit(1),170000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1100,height:850,useContentSize:true,webPreferences:{backgroundThrottling:false}}),errors=[];
 let stage='boot';
 w.webContents.on('console-message',e=>{if(e.level==='error'&&/Error|Exception/.test(e.message))errors.push(e.message);});
 const run=source=>w.webContents.executeJavaScript('(async()=>{'+source+'})()');
 try{
  await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'),{query:{tools:'1'}});
  await run(`await window.wildboundBoot.ready;await window.showcase('game');document.querySelector('#pause-button').click();document.querySelector('#pause-dev').click();if(!document.querySelector('[data-debug="test-board"]'))throw Error('Actual pause menu does not expose test board');const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);document.querySelector('.game-debug-console').remove();`);
  stage='dev menu';
  const report=await run(`
   const [{Game,EVENTS},{Assets},{Renderer},{ITEMS},{createGameDebug},{spawnEventTestBoard}]=await Promise.all([import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/render.mjs'),import('./src/items.mjs'),import('./src/game-debug.mjs'),import('./src/event-test-board.mjs')]);
   const assert=(ok,message)=>{if(!ok)throw Error(message);checks.push(message);},checks=[];
   const g=new Game(()=>.45),p=g.addPlayer('keyboard','First explorer'),q=g.addPlayer('pad:0','Second explorer');g.start();
   Object.assign(p,{x:720,y:920,invincible:true});Object.assign(q,{x:940,y:920,invincible:true});
   const dialog=document.querySelector('#pause-dialog'),menu=createGameDebug({getGame:()=>g,events:EVENTS,items:ITEMS});menu.open(dialog,q);
   const panel=dialog.querySelector('.game-debug-console');panel.querySelector('[data-debug="test-board"]').click();
   assert(g.eventTestBoard.x+32===q.x&&g.eventTestBoard.y+16===q.y,'Dev button spawns at the controller opener');
   assert(panel.querySelector('option').textContent.startsWith('1:'),'Visible list starts at event 1');
   menu.open(dialog,p);panel.querySelector('[data-debug="test-board"]').click();assert(g.eventTestBoard.x+32===p.x,'Reopened dev menu switches board owner');
   panel.querySelector('[data-debug="remove-test-board"]').click();assert(!g.eventTestBoard,'Remove button works');
   panel.querySelector('[data-debug="test-board"]').click();assert(g.eventTestBoard.nextEvent===0,'Respawn resets event cursor');
   window.boardQA={g,p,q,panel,checks,assert};return {checks};
  `);
  stage='dev screenshot';w.setContentSize(1101,851);await new Promise(resolve=>setTimeout(resolve,400));
  fs.writeFileSync(path.join(out,'dev-menu.png'),(await w.webContents.capturePage()).toPNG());
  w.setContentSize(560,540);
  await new Promise(resolve=>setTimeout(resolve,300));
  await run(`const panel=window.boardQA.panel,b=panel.querySelector('[data-debug="test-board"]');b.focus();panel.scrollTop+=b.getBoundingClientRect().top-panel.getBoundingClientRect().top-100;if(panel.scrollWidth>panel.clientWidth+2)throw Error('Dev menu overflows narrow window');const p=panel.getBoundingClientRect(),r=b.getBoundingClientRect();if(r.top<p.top||r.bottom>p.bottom)throw Error('Test-board button is not visible after scrolling');`);
  stage='small screenshot';w.setContentSize(561,541);await new Promise(resolve=>setTimeout(resolve,400));
  fs.writeFileSync(path.join(out,'dev-menu-small.png'),(await w.webContents.capturePage()).toPNG());
  w.setContentSize(1100,850);
  stage='event renders';
  const field=await run(`
   document.querySelector('#pause-dialog').close();const {g,p,q,assert,checks}=window.boardQA;
   const [{EVENTS},{Assets},{Renderer}]=await Promise.all([import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/render.mjs')]);
   const assets=new Assets();await assets.load();g.spriteLibrary=assets.library;
   g.scenery=[];g.livingEcosystem.vines=[];
   const canvas=document.createElement('canvas');canvas.style='position:fixed;inset:0;width:1100px;height:850px;z-index:9999';document.body.append(canvas);
   const renderer=new Renderer(canvas,assets);g.bloom=3;g.explored=new Set(Array.from({length:2500},(_,i)=>i));
   const board=g.eventTestBoard;q.x=910;q.y=880;
   p.x=board.x+board.w/2;p.y=board.y+board.h/2+55;p.groundHeight=0;p.faceX=0;p.faceY=-1;
   renderer.camera={x:810,y:880,zoom:1};renderer.draw(g,0);const boardPicture=canvas.toDataURL();
   const turns=()=>JSON.stringify(g.players.map(p=>[p.progress,p.boardProgress,p.rolls]));const before=turns();
   for(let i=0;i<EVENTS.length;i++){
    p.attack=0;g.enemies=[];assert(g.attack(p)===true,'Hit '+(i+1));assert(g.eventTestBoard.nextEvent===i+1&&g.event.name===EVENTS[i].name,'Ordered event '+(i+1)+' '+EVENTS[i].name);
    g.reveal=null;g.eventTime=0;renderer.draw(g,0);assert(turns()===before&&!g.roll,'Stationary pawns at event '+(i+1));
   }
   p.attack=0;g.attack(p);assert(g.eventTestBoard.nextEvent===EVENTS.length,'Stops at end of list');
   renderer.draw(g,0);
   return {checks,events:EVENTS.length,pictures:{board:boardPicture,complete:canvas.toDataURL()}};
  `);
  for(const [name,url]of Object.entries(field.pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
  delete field.pictures;if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...field,errors},null,2));console.log(JSON.stringify({passed:field.checks.length,events:field.events,errors,out}));clearTimeout(deadline);app.exit(0);
 }catch(e){console.error(stage,e);clearTimeout(deadline);app.exit(1);}
});
